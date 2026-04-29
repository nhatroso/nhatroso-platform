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
use loco_rs::app::AppContext;
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
        ctx: &AppContext,
        params: &CreateInvoiceParams,
        owner_id: Uuid,
    ) -> ModelResult<InvoiceResponse> {
        let db = &ctx.db;
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

        let res = InvoiceResponse {
            invoice: invoice.clone(),
            details: saved_details,
            histories: vec![history_model],
        };

        // Fire & Forget Notification via Worker
        let ctx_clone = ctx.clone();
        tokio::spawn(async move {
            if let Err(e) = Self::notify_invoice_generated(&ctx_clone, &invoice).await {
                tracing::error!(error=?e, "Failed to send invoice generation notification");
            }
        });

        Ok(res)
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
        let mut query = Entity::find_by_id(id);

        if user_id != Uuid::nil() {
            query = query.filter(
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
            );
        }

        let invoice_opt = query.one(db).await?;

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
        ctx: &AppContext,
        id: i32,
        owner_id: Uuid,
    ) -> Result<InvoiceResponse, String> {
        let db = &ctx.db;
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

        let res = Self::get_one(db, updated_invoice.id, owner_id).await.map_err(|e| e.to_string())?;

        let ctx_clone = ctx.clone();
        let inv_clone = updated_invoice.clone();
        tokio::spawn(async move {
            if let Err(e) = Self::notify_payment_success(&ctx_clone, &inv_clone).await {
                tracing::error!(error=?e, "Failed to send payment success notification");
            }
        });

        Ok(res)
    }

    pub async fn sepay_webhook(
        ctx: &AppContext,
        payload: &crate::views::invoices::SePayWebhookPayload,
    ) -> Result<InvoiceResponse, String> {
        let db = &ctx.db;
        let txn = db.begin().await.map_err(|e| e.to_string())?;

        // 1. Identify Invoice from content. Logic: Collect all numeric sequences and match against unpaid invoices.
        let mut candidates = Vec::new();
        if let Some(code) = &payload.code {
            if let Ok(id) = code.chars().filter(|c| c.is_ascii_digit()).collect::<String>().parse::<i32>() {
                candidates.push(id);
            }
        }
        candidates.extend(
            payload.content
                .split(|c: char| !c.is_ascii_digit())
                .filter_map(|s| s.parse::<i32>().ok())
        );

        let mut matched_invoice = None;
        for id in candidates {
            if let Ok(Some(inv)) = Entity::find_by_id(id).one(&txn).await {
                let status = inv.status.as_deref();
                if status == Some("UNPAID") || status == Some("PENDING_CONFIRMATION") {
                    matched_invoice = Some(inv);
                    break;
                }
            }
        }

        let invoice = matched_invoice.ok_or_else(|| {
            tracing::error!(content = %payload.content, "No matching UNPAID invoice found for SePay candidates");
            "INVOICE_NOT_FOUND".to_string()
        })?;

        // 2. Verify amount
        let total_amount = invoice.total_amount.unwrap_or_default();
        if payload.transfer_amount < total_amount {
             return Err("INSUFFICIENT_AMOUNT".into());
        }

        let from_status = invoice.status.clone();
        if from_status.as_deref() != Some("UNPAID") && from_status.as_deref() != Some("PENDING_CONFIRMATION") {
            // Already paid or voided
            return Self::get_one(db, invoice.id, Uuid::nil()).await.map_err(|e| e.to_string());
        }

        let mut active_invoice: InvoiceActiveModel = invoice.into();
        active_invoice.status = Set(Some("PAID".to_string()));
        let updated_invoice = active_invoice.update(&txn).await.map_err(|e| e.to_string())?;

        let history = HistoryActiveModel {
            invoice_id: Set(updated_invoice.id),
            from_status: Set(from_status),
            to_status: Set(Some("PAID".to_string())),
            reason: Set(Some(format!("SePay Webhook: {} (Ref: {:?})", payload.gateway, payload.reference_code))),
            timestamp: Set(Some(chrono::Utc::now().into())),
            ..Default::default()
        };
        history.insert(&txn).await.map_err(|e| e.to_string())?;

        txn.commit().await.map_err(|e| e.to_string())?;

        let res = Self::get_one(db, updated_invoice.id, Uuid::nil()).await.map_err(|e| e.to_string())?;

        let ctx_clone = ctx.clone();
        let inv_clone = updated_invoice.clone();
        tokio::spawn(async move {
            if let Err(e) = Self::notify_payment_success(&ctx_clone, &inv_clone).await {
                tracing::error!(error=?e, "Failed to send payment success notification (SePay)");
            }
        });

        Ok(res)
    }

    pub async fn automation_webhook(
        ctx: &AppContext,
        payload: &crate::views::invoices::AutomationWebhookPayload,
    ) -> Result<InvoiceResponse, String> {
        let db = &ctx.db;
        let txn = db.begin().await.map_err(|e| e.to_string())?;

        // 1. Identify Invoice from invoice_id string (e.g., "INV123" -> 123)
        let id_str = payload.invoice_id.to_uppercase();
        let id_numeric = id_str
            .trim_start_matches("INV")
            .parse::<i32>()
            .map_err(|_| format!("INVALID_INVOICE_ID_FORMAT: {}", payload.invoice_id))?;

        let invoice_opt = Entity::find_by_id(id_numeric).one(&txn).await.map_err(|e| e.to_string())?;
        let invoice = match invoice_opt {
            Some(inv) => inv,
            None => return Err("INVOICE_NOT_FOUND".into()),
        };

        // 2. Verify event/status
        if payload.event != "payment_success" && payload.status != "paid" {
            return Err("IGNORE_EVENT".into());
        }

        // 3. Idempotency check
        let from_status = invoice.status.clone();
        if from_status.as_deref() == Some("PAID") {
            return Self::get_one(db, invoice.id, Uuid::nil()).await.map_err(|e| e.to_string());
        }

        let mut active_invoice: InvoiceActiveModel = invoice.into();
        active_invoice.status = Set(Some("PAID".to_string()));
        let updated_invoice = active_invoice.update(&txn).await.map_err(|e| e.to_string())?;

        let history = HistoryActiveModel {
            invoice_id: Set(updated_invoice.id),
            from_status: Set(from_status),
            to_status: Set(Some("PAID".to_string())),
            reason: Set(Some(format!("Automation Webhook: payment_success (Amount: {})", payload.amount))),
            timestamp: Set(Some(chrono::Utc::now().into())),
            ..Default::default()
        };
        history.insert(&txn).await.map_err(|e| e.to_string())?;

        txn.commit().await.map_err(|e| e.to_string())?;

        let res = Self::get_one(db, updated_invoice.id, Uuid::nil()).await.map_err(|e| e.to_string())?;

        let ctx_clone = ctx.clone();
        let inv_clone = updated_invoice.clone();
        tokio::spawn(async move {
            if let Err(e) = Self::notify_payment_success(&ctx_clone, &inv_clone).await {
                tracing::error!(error=?e, "Failed to send payment success notification (Automation)");
            }
        });

        Ok(res)
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

            if let Some(meter) = meter_opt {
                // Metered service: usage * unit_price
                let reading_opt = MeterReadings::find()
                    .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(meter.id))
                    .filter(crate::models::_entities::meter_readings::Column::PeriodMonth.eq(&params.period_month))
                    .filter(
                        crate::models::_entities::meter_readings::Column::Status
                            .is_in(vec!["SUBMITTED", "COMPLETED"]),
                    )
                    .one(db)
                    .await?;

                if let Some(reading) = reading_opt {
                    let usage = reading.usage.unwrap_or(Decimal::new(0, 0));
                    let amount = usage * price_rule.unit_price;
                    if amount > Decimal::new(0, 0) {
                        details.push(InvoiceDetailParams {
                            description: format!("{} ({})", service.name, params.period_month),
                            amount,
                        });
                        total_amount += amount;
                    }
                } else {
                    tracing::info!(meter_id = %meter.id, period = %params.period_month, "Reading not ready for metered service, skipping from invoice");
                }
            } else {
                // Flat rate service
                let amount = price_rule.unit_price;
                if amount > Decimal::new(0, 0) {
                    details.push(InvoiceDetailParams {
                        description: format!("{} ({})", service.name, params.period_month),
                        amount,
                    });
                    total_amount += amount;
                }
            }
        }

        Ok(InvoiceCalculationResponse {
            room_code: room.code,
            tenant_name: tenant.name,
            details,
            total_amount,
        })
    }

    pub async fn notify_invoice_generated(ctx: &AppContext, invoice: &Model) -> ModelResult<()> {
        let db = &ctx.db;
        let tenant = self::get_tenant_for_invoice(db, invoice.id).await?;
        if let Some(email) = tenant.email {
            let job = crate::jobs::email_job::EmailJob::new(
                email,
                format!("Thông báo hóa đơn mới - {}", invoice.room_code.as_deref().unwrap_or("")),
                "invoice_generated.html".to_string(),
                serde_json::json!({
                    "tenant_name": invoice.tenant_name,
                    "room_code": invoice.room_code,
                    "total_amount": invoice.total_amount,
                    "due_date": invoice.due_date,
                    "invoice_url": format!("{}/invoices/{}", std::env::var("SERVER_HOST").unwrap_or_default(), invoice.id),
                }),
            );
            crate::jobs::email_job::EmailJob::enqueue_email(ctx, job).await.map_err(|e| ModelError::Any(e.into()))?;
        }
        Ok(())
    }

    pub async fn notify_payment_success(ctx: &AppContext, invoice: &Model) -> ModelResult<()> {
        let db = &ctx.db;
        let tenant = self::get_tenant_for_invoice(db, invoice.id).await?;
        if let Some(email) = tenant.email {
            let job = crate::jobs::email_job::EmailJob::new(
                email,
                format!("Thanh toán thành công - {}", invoice.room_code.as_deref().unwrap_or("")),
                "payment_success.html".to_string(),
                serde_json::json!({
                    "tenant_name": invoice.tenant_name,
                    "room_code": invoice.room_code,
                    "total_amount": invoice.total_amount,
                    "payment_date": chrono::Utc::now(),
                }),
            );
            crate::jobs::email_job::EmailJob::enqueue_email(ctx, job).await.map_err(|e| ModelError::Any(e.into()))?;
        }
        Ok(())
    }

    pub async fn remind_tenant(ctx: &AppContext, id: i32, owner_id: Uuid) -> ModelResult<()> {
        let db = &ctx.db;
        let invoice = Entity::find_by_id(id)
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        // Verify ownership and status
        if invoice.landlord_id != Some(owner_id) {
            return Err(ModelError::Any("UNAUTHORIZED".into()));
        }
        if invoice.status.as_deref() != Some("UNPAID") {
            return Err(ModelError::Any("INVALID_STATUS".into()));
        }

        let tenant = self::get_tenant_for_invoice(db, invoice.id).await?;

        let job = crate::jobs::sms_job::SmsJob::new(
            tenant.phone,
            format!("Nhatroso: Hoa don {} chua duoc thanh toan. Vui long kiem tra va hoan tat thanh toan som nhe. Cam on ban!",
                invoice.room_code.as_deref().unwrap_or("")
            ),
        );

        crate::jobs::sms_job::SmsJob::enqueue_sms(ctx, job).await.map_err(|e| ModelError::Any(e.into()))?;

        Ok(())
    }
    pub async fn process_automated_notifications(ctx: &AppContext) -> ModelResult<()> {
        let db = &ctx.db;
        let now = chrono::Utc::now();

        let unpaid_invoices = Entity::find()
            .filter(InvoiceColumn::Status.eq("UNPAID"))
            .all(db)
            .await?;

        for inv in unpaid_invoices {
            let due_date = match inv.due_date {
                Some(d) => d,
                None => continue,
            };

            let days_diff = (due_date.timestamp() - now.timestamp()) / 86400;

            let tenant = match self::get_tenant_for_invoice(db, inv.id).await {
                Ok(t) => t,
                Err(_) => continue, // Skip if no tenant found
            };

            if days_diff == 3 {
                // Nhắc trước hạn (3 ngày) - Email
                if let Some(email) = tenant.email {
                    let job = crate::jobs::email_job::EmailJob::new(
                        email,
                        format!("Nhắc thanh toán hóa đơn - {}", inv.room_code.as_deref().unwrap_or("")),
                        "invoice_reminder.html".to_string(),
                        serde_json::json!({
                            "tenant_name": inv.tenant_name,
                            "room_code": inv.room_code,
                            "total_amount": inv.total_amount,
                            "due_date": inv.due_date,
                        }),
                    );
                    let _ = crate::jobs::email_job::EmailJob::enqueue_email(ctx, job).await;
                }
            } else if days_diff == 1 {
                // Gần deadline (1 ngày) - SMS
                let job = crate::jobs::sms_job::SmsJob::new(
                    tenant.phone,
                    format!("Nhatroso: Hoa don {} sap den han thanh toan. Vui long thanh toan truoc ngay {}.",
                        inv.room_code.as_deref().unwrap_or(""),
                        due_date.format("%d/%m/%Y")
                    ),
                );
                let _ = crate::jobs::sms_job::SmsJob::enqueue_sms(ctx, job).await;
            } else if days_diff == -1 {
                // Quá hạn (1 ngày) - SMS
                let job = crate::jobs::sms_job::SmsJob::new(
                    tenant.phone,
                    format!("Nhatroso: Hoa don {} da qua han thanh toan. Vui long lien he chu nha de duoc ho tro.",
                        inv.room_code.as_deref().unwrap_or("")
                    ),
                );
                let _ = crate::jobs::sms_job::SmsJob::enqueue_sms(ctx, job).await;
            }
        }

        Ok(())
    }
}

async fn get_tenant_for_invoice(db: &DatabaseConnection, invoice_id: i32) -> ModelResult<crate::models::_entities::users::Model> {
    use crate::models::_entities::{invoices, contracts, contract_tenants, users};

    users::Entity::find()
        .join(sea_orm::JoinType::InnerJoin, users::Relation::ContractTenants.def())
        .join(sea_orm::JoinType::InnerJoin, contract_tenants::Relation::Contracts.def())
        .filter(
            contracts::Column::RoomId.in_subquery(
                invoices::Entity::find()
                    .filter(invoices::Column::Id.eq(invoice_id))
                    .select_only()
                    .column(invoices::Column::RoomId)
                    .into_query()
            )
        )
        .filter(contracts::Column::Status.eq("ACTIVE"))
        .one(db)
        .await?
        .ok_or_else(|| ModelError::EntityNotFound)
}
