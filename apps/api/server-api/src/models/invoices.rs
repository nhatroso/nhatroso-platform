use sea_orm::entity::prelude::*;
pub use super::_entities::invoices::{ActiveModel, Model, Entity};
pub type Invoices = Entity;
use crate::{
    views::invoices::{
        CalculateInvoiceParams, CreateInvoiceParams, InvoiceCalculationResponse,
        InvoiceDetailParams, InvoiceResponse, VoidInvoiceParams,
    },
    models::{
        _entities::{
            invoice_details::{ActiveModel as DetailActiveModel, Entity as DetailEntity},
            invoice_status_histories::{
                ActiveModel as HistoryActiveModel, Column as HistoryColumn, Entity as HistoryEntity,
            },
            invoices::{ActiveModel as InvoiceActiveModel, Column as InvoiceColumn},
            meter_readings::Entity as MeterReadings,
            meters::Entity as Meters,
            price_rules::Entity as PriceRules,
            room_services::Entity as RoomServices,
            services::Entity as Services,
        },
    },
};
use loco_rs::model::{ModelResult, ModelError};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, EntityTrait, LoaderTrait, QueryFilter, QueryOrder, Set, TransactionTrait,
    QuerySelect, QueryTrait, Condition,
};

use uuid::Uuid;

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> std::result::Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        if !insert && self.updated_at.is_unchanged() {
            let mut this = self;
            this.updated_at = sea_orm::ActiveValue::Set(chrono::Utc::now().into());
            Ok(this)
        } else {
            Ok(self)
        }
    }
}

impl Model {
    pub async fn create(
        db: &DatabaseConnection,
        params: &CreateInvoiceParams,
        owner_id: Uuid,
    ) -> ModelResult<InvoiceResponse> {
        let txn = db.begin().await?;

        let landlord_id = if let Some(room_id) = params.room_id {
            // Fetch room to get building_id -> landlord_id
            let room_data = super::_entities::rooms::Entity::find()
                .filter(super::_entities::rooms::Column::Id.eq(room_id))
                .one(&txn)
                .await?
                .ok_or_else(|| ModelError::EntityNotFound)?;

            let building = super::_entities::buildings::Entity::find_by_id(room_data.building_id)
                .one(&txn)
                .await?
                .ok_or_else(|| ModelError::EntityNotFound)?;

            building.owner_id

        } else {
            owner_id // Default to the caller if no room is provided (manual adjustment)
        };

        let grace_days = if let Some(g) = params.grace_days {
            g
        } else {
            let auto_config = super::_entities::auto_invoice_configs::Entity::find()
                .filter(super::_entities::auto_invoice_configs::Column::LandlordId.eq(landlord_id))
                .one(&txn)
                .await?;

            auto_config.map(|c| c.grace_days).unwrap_or(0)
        };

        let due_date = chrono::Utc::now() + chrono::Duration::days(grace_days as i64);


        let new_invoice = InvoiceActiveModel {
            room_id: Set(params.room_id),
            landlord_id: Set(Some(landlord_id)),
            room_code: Set(params.room_code.clone()),
            tenant_name: Set(params.tenant_name.clone()),
            total_amount: Set(params.total_amount),
            status: Set(Some("UNPAID".to_string())),
            due_date: Set(Some(due_date.into())),
            ..Default::default()
        };


        let invoice = new_invoice.insert(&txn).await?;


        let mut saved_details = vec![];
        for detail in &params.details {
            let det = DetailActiveModel {
                invoice_id: Set(invoice.id),
                description: Set(detail.description.clone()),
                amount: Set(detail.amount),
                ..Default::default()
            };
            let saved_detail = det.insert(&txn).await?;
            saved_details.push(saved_detail);
        }

        let history = HistoryActiveModel {
            invoice_id: Set(invoice.id),
            from_status: Set(None),
            to_status: Set(Some("UNPAID".to_string())),
            timestamp: Set(Some(chrono::Utc::now().into())),
            actor_id: Set(Some(owner_id)),
            ..Default::default()
        };
        let history_model = history.insert(&txn).await?;

        txn.commit().await?;

        Ok(InvoiceResponse {
            invoice,
            details: saved_details,
            histories: vec![history_model],
        })
    }

    pub async fn list(db: &DatabaseConnection, user_id: Uuid) -> ModelResult<Vec<InvoiceResponse>> {
        // Query as Landlord (owner) OR as Tenant (via contract)
        let invoices = Entity::find()
            .filter(
                Condition::any()
                    .add(InvoiceColumn::LandlordId.eq(user_id))
                    .add(
                        InvoiceColumn::RoomId.in_subquery(
                            super::_entities::contracts::Entity::find()
                                .join(sea_orm::JoinType::InnerJoin, super::_entities::contracts::Relation::ContractTenants.def())
                                .filter(super::_entities::contract_tenants::Column::TenantId.eq(user_id))
                                .select_only()
                                .column(super::_entities::contracts::Column::RoomId)
                                .into_query()
                        )
                    )

            )
            .order_by_desc(InvoiceColumn::CreatedAt)
            .all(db)
            .await?;


        let details_nested = invoices.load_many(DetailEntity, db).await?;
        let histories_nested = invoices.load_many(HistoryEntity, db).await?;

        let mut details_iter = details_nested.into_iter();
        let mut histories_iter = histories_nested.into_iter();

        let mut resp = Vec::with_capacity(invoices.len());
        for inv in invoices {
            resp.push(InvoiceResponse {
                invoice: inv,
                details: details_iter.next().unwrap_or_default(),
                histories: histories_iter.next().unwrap_or_default(),
            });
        }

        Ok(resp)
    }

    pub async fn get_one(db: &DatabaseConnection, id: i32, user_id: Uuid) -> ModelResult<InvoiceResponse> {
        let invoice_opt = Entity::find_by_id(id)
            .filter(
                Condition::any()
                    .add(InvoiceColumn::LandlordId.eq(user_id))
                    .add(
                        InvoiceColumn::RoomId.in_subquery(
                            super::_entities::contracts::Entity::find()
                                .join(sea_orm::JoinType::InnerJoin, super::_entities::contracts::Relation::ContractTenants.def())
                                .filter(super::_entities::contract_tenants::Column::TenantId.eq(user_id))
                                .select_only()
                                .column(super::_entities::contracts::Column::RoomId)
                                .into_query()
                        )
                    )

            )
            .one(db).await?;

        match invoice_opt {
            Some(inv) => {
                let details = inv.find_related(DetailEntity).all(db).await?;
                let histories = inv.find_related(HistoryEntity).order_by_desc(HistoryColumn::CreatedAt).all(db).await?;
                Ok(InvoiceResponse {
                    invoice: inv,
                    details,
                    histories,
                })
            }
            None => Err(ModelError::EntityNotFound),
        }
    }

    pub async fn void_invoice(
        db: &DatabaseConnection,
        id: i32,
        params: &VoidInvoiceParams,
        owner_id: Uuid,
    ) -> Result<InvoiceResponse, String> {
        let txn = db.begin().await.map_err(|e| e.to_string())?;

        let invoice_opt = Entity::find_by_id(id).one(&txn).await.map_err(|e| e.to_string())?;
        let invoice = match invoice_opt {
            Some(inv) => inv,
            None => return Err("INVOICE_NOT_FOUND".into()),
        };

        let from_status = invoice.status.clone();
        if from_status.as_deref() == Some("VOIDED") {
            return Err("INVALID_STATUS_TRANSITION".into());
        }

        let mut active_invoice: InvoiceActiveModel = invoice.into();
        active_invoice.status = Set(Some("VOIDED".to_string()));
        let updated_invoice = active_invoice.update(&txn).await.map_err(|e| e.to_string())?;

        let history = HistoryActiveModel {
            invoice_id: Set(updated_invoice.id),
            from_status: Set(from_status),
            to_status: Set(Some("VOIDED".to_string())),
            reason: Set(Some(params.reason.clone())),
            timestamp: Set(Some(chrono::Utc::now().into())),
            actor_id: Set(Some(owner_id)),
            ..Default::default()
        };
        history.insert(&txn).await.map_err(|e| e.to_string())?;

        txn.commit().await.map_err(|e| e.to_string())?;

        Self::get_one(db, updated_invoice.id, owner_id).await.map_err(|e| e.to_string())
    }

    pub async fn pay_invoice(
        db: &DatabaseConnection,
        id: i32,
        owner_id: Uuid,
    ) -> Result<InvoiceResponse, String> {
        let txn = db.begin().await.map_err(|e| e.to_string())?;

        let invoice_opt = Entity::find_by_id(id).one(&txn).await.map_err(|e| e.to_string())?;
        let invoice = match invoice_opt {
            Some(inv) => inv,
            None => return Err("INVOICE_NOT_FOUND".into()),
        };

        let from_status = invoice.status.clone();
        if from_status.as_deref() != Some("UNPAID") && from_status.as_deref() != Some("PENDING_CONFIRMATION") {
            return Err("INVALID_STATUS_TRANSITION".into());
        }

        let mut active_invoice: InvoiceActiveModel = invoice.into();
        active_invoice.status = Set(Some("PAID".to_string()));
        let updated_invoice = active_invoice.update(&txn).await.map_err(|e| e.to_string())?;

        let history = HistoryActiveModel {
            invoice_id: Set(updated_invoice.id),
            from_status: Set(from_status),
            to_status: Set(Some("PAID".to_string())),
            timestamp: Set(Some(chrono::Utc::now().into())),
            actor_id: Set(Some(owner_id)),
            ..Default::default()
        };
        history.insert(&txn).await.map_err(|e| e.to_string())?;

        txn.commit().await.map_err(|e| e.to_string())?;

        Self::get_one(db, updated_invoice.id, owner_id).await.map_err(|e| e.to_string())
    }

    pub async fn webhook(
        db: &DatabaseConnection,
        id: i32,
    ) -> Result<InvoiceResponse, String> {
        let txn = db.begin().await.map_err(|e| e.to_string())?;

        let invoice_opt = Entity::find_by_id(id).one(&txn).await.map_err(|e| e.to_string())?;
        let invoice = match invoice_opt {
            Some(inv) => inv,
            None => return Err("INVOICE_NOT_FOUND".into()),
        };

        let from_status = invoice.status.clone();
        if from_status.as_deref() != Some("UNPAID") && from_status.as_deref() != Some("PENDING_CONFIRMATION") {
            return Err("INVALID_STATUS_TRANSITION".into());
        }

        let mut active_invoice: InvoiceActiveModel = invoice.into();
        active_invoice.status = Set(Some("PAID".to_string()));
        let updated_invoice = active_invoice.update(&txn).await.map_err(|e| e.to_string())?;

        let history = HistoryActiveModel {
            invoice_id: Set(updated_invoice.id),
            from_status: Set(from_status),
            to_status: Set(Some("PAID".to_string())),
            reason: Set(Some("Webhook automated payment".to_string())),
            timestamp: Set(Some(chrono::Utc::now().into())),
            ..Default::default()
        };
        history.insert(&txn).await.map_err(|e| e.to_string())?;

        txn.commit().await.map_err(|e| e.to_string())?;

        Self::get_one(db, updated_invoice.id, Uuid::nil()).await.map_err(|e| e.to_string())
    }

    pub async fn calculate_amounts(
        db: &DatabaseConnection,
        params: &CalculateInvoiceParams,
        owner_id: Uuid,
    ) -> ModelResult<InvoiceCalculationResponse> {
        use crate::models::_entities::{buildings, rooms, contracts, users, contract_tenants};
        use sea_orm::{RelationTrait, QuerySelect, JoinType};

        tracing::info!(room_id = %params.room_id, period = %params.period_month, owner_id = %owner_id, "Calculating invoice amounts");

        // 1. Fetch Room and verify ownership via building
        let room = rooms::Entity::find()
             .filter(rooms::Column::Id.eq(params.room_id))
             .join(JoinType::InnerJoin, rooms::Relation::Buildings.def())
             .filter(buildings::Column::OwnerId.eq(owner_id))
             .one(db)
             .await?
             .ok_or_else(|| {
                 tracing::warn!(room_id = %params.room_id, owner_id = %owner_id, "Room not found or unauthorized during calculation");
                 ModelError::EntityNotFound
             })?;

        // 2. Fetch Active Contract for Room
        let contract = contracts::Entity::find()
            .filter(contracts::Column::RoomId.eq(params.room_id))
            .filter(contracts::Column::Status.eq("ACTIVE"))
            .one(db)
            .await?
            .ok_or_else(|| {
                tracing::warn!(room_id = %params.room_id, "No active contract found for room");
                ModelError::EntityNotFound
            })?;

        // 3. Find Tenant Name (from linked ContractTenant -> User)
        let tenant = users::Entity::find()
            .join(JoinType::InnerJoin, users::Relation::ContractTenants.def())
            .filter(contract_tenants::Column::ContractId.eq(contract.id))
            .one(db)
            .await?
            .ok_or_else(|| {
                tracing::warn!(contract_id = %contract.id, "No tenant found for contract");
                ModelError::EntityNotFound
            })?;

        let mut details = vec![];
        let mut total_amount = Decimal::new(0, 0);

        // -- Line item: Monthly Rent --
        let rent_amount: Decimal = contract.monthly_rent.into();
        details.push(InvoiceDetailParams {
            description: format!("Tiền phòng - {}", room.code),
            amount: rent_amount,
        });
        total_amount += rent_amount;

        // 4. Fetch Active Room Services
        let room_services = RoomServices::find()
            .filter(crate::models::_entities::room_services::Column::RoomId.eq(params.room_id))
            .filter(crate::models::_entities::room_services::Column::IsActive.eq(true))
            .all(db)
            .await?;

        for rs in room_services {
            let service = Services::find_by_id(rs.service_id)
                .one(db)
                .await?
                .ok_or_else(|| ModelError::EntityNotFound)?;

            let price_rule = if let Some(pr_id) = rs.price_rule_id {
                PriceRules::find_by_id(pr_id)
                    .one(db)
                    .await?
                    .ok_or_else(|| ModelError::EntityNotFound)?
            } else {
                continue; // Should not happen for active services
            };

            // 5. Check for Meter linked to this room and service
            let meter_opt = Meters::find()
                .filter(crate::models::_entities::meters::Column::RoomId.eq(params.room_id))
                .filter(crate::models::_entities::meters::Column::ServiceId.eq(service.id))
                .filter(crate::models::_entities::meters::Column::Status.eq("ACTIVE"))
                .one(db)
                .await?;

            let amount = if let Some(meter) = meter_opt {
                // Metered service: usage * unit_price
                let reading_opt = MeterReadings::find()
                    .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(meter.id))
                    .filter(crate::models::_entities::meter_readings::Column::PeriodMonth.eq(&params.period_month))
                    .filter(crate::models::_entities::meter_readings::Column::Status.eq("SUBMITTED"))
                    .one(db)
                    .await?;

                let usage = reading_opt.and_then(|r| r.usage).unwrap_or(Decimal::new(0, 0));
                usage * price_rule.unit_price
            } else {
                // Flat rate service
                price_rule.unit_price
            };

            if amount > Decimal::new(0, 0) {
                details.push(InvoiceDetailParams {
                    description: service.name,
                    amount,
                });
                total_amount += amount;
            }
        }

        Ok(InvoiceCalculationResponse {
            room_code: room.code,
            tenant_name: tenant.name,
            details,
            total_amount,
        })
    }
}
