use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;

pub use super::_entities::contracts::{ActiveModel, Model, Entity};
pub type Contracts = Entity;

use crate::views::contracts::{CreateContractParams, ContractResponse};
use crate::models::_entities::contract_tenants::{ActiveModel as ContractTenantActiveModel, Entity as ContractTenants};
use crate::models::_entities::users::{ActiveModel as UserActiveModel, Entity as Users, Model as UserModel};
use crate::models::_entities::rooms::{ActiveModel as RoomActiveModel, Entity as Rooms};

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

// implement your read-oriented logic here
impl Model {
    pub async fn list_contracts(db: &DatabaseConnection) -> Result<Vec<ContractResponse>> {
        let contracts = Contracts::find().all(db).await?;
        let mut results = Vec::new();
        for contract in contracts {
            let owner = Users::find_by_id(contract.user_id).one(db).await?;

            let ct = ContractTenants::find()
                .filter(crate::models::_entities::contract_tenants::Column::ContractId.eq(contract.id))
                .one(db)
                .await?;

            let tenant = if let Some(ct) = ct {
                Users::find_by_id(ct.tenant_id).one(db).await?
            } else {
                None
            };

            results.push(Self::map_to_response(contract, owner, tenant));
        }
        Ok(results)
    }

    pub async fn get_contract_by_id(db: &DatabaseConnection, id: Uuid) -> Result<std::result::Result<ContractResponse, (StatusCode, &'static str)>> {
        let contract = Contracts::find_by_id(id).one(db).await?;
        let Some(contract) = contract else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        let owner = Users::find_by_id(contract.user_id).one(db).await?;

        let ct = ContractTenants::find()
            .filter(crate::models::_entities::contract_tenants::Column::ContractId.eq(contract.id))
            .one(db)
            .await?;

        let tenant = if let Some(ct) = ct {
            Users::find_by_id(ct.tenant_id).one(db).await?
        } else {
            None
        };

        Ok(Ok(Self::map_to_response(contract, owner, tenant)))
    }

    pub async fn create_contract(db: &DatabaseConnection, landlord_id: Uuid, params: CreateContractParams) -> Result<Self> {
        // 1. Update landlord profile
        let landlord = Users::find_by_id(landlord_id).one(db).await?;
        if let Some(l) = landlord {
            let mut active_landlord: UserActiveModel = l.into();
            active_landlord.name = ActiveValue::Set(params.owner_name.clone());
            active_landlord.id_card = ActiveValue::Set(Some(params.owner_id_card.clone()));
            active_landlord.id_card_date = ActiveValue::Set(Some(params.owner_id_card_date));
            active_landlord.address = ActiveValue::Set(Some(params.owner_address.clone()));
            active_landlord.phone = ActiveValue::Set(params.owner_phone.clone());
            active_landlord.updated_at = ActiveValue::Set(chrono::Utc::now().into());
            active_landlord.update(db).await?;
        }

        // 2. Find or create tenant
        let tenant = Users::find()
            .filter(crate::models::_entities::users::Column::Phone.eq(&params.tenant_phone))
            .one(db)
            .await?;

        let tenant_id = match tenant {
            Some(t) => {
                let mut active_tenant: UserActiveModel = t.into();
                active_tenant.name = ActiveValue::Set(params.tenant_name.clone());
                active_tenant.id_card = ActiveValue::Set(Some(params.tenant_id_card.clone()));
                active_tenant.id_card_date = ActiveValue::Set(Some(params.tenant_id_card_date));
                active_tenant.address = ActiveValue::Set(Some(params.tenant_address.clone()));
                active_tenant.updated_at = ActiveValue::Set(chrono::Utc::now().into());
                let updated = active_tenant.update(db).await?;
                updated.id
            }
            None => {
                let new_user = UserActiveModel {
                    id: ActiveValue::Set(Uuid::new_v4()),
                    phone: ActiveValue::Set(params.tenant_phone.clone()),
                    name: ActiveValue::Set(params.tenant_name.clone()),
                    password_hash: ActiveValue::Set("$argon2id$v=19$m=19456,t=2,p=1$B2yQ1lI8R+4$lM7gP5s2B8W/t1Q/B5T9pP3v2Z8R+4$lM7gP5s2B8W".to_string()),
                    role: ActiveValue::Set("TENANT".to_string()),
                    status: ActiveValue::Set("ACTIVE".to_string()),
                    id_card: ActiveValue::Set(Some(params.tenant_id_card.clone())),
                    id_card_date: ActiveValue::Set(Some(params.tenant_id_card_date)),
                    address: ActiveValue::Set(Some(params.tenant_address.clone())),
                    created_at: ActiveValue::Set(chrono::Utc::now().into()),
                    updated_at: ActiveValue::Set(chrono::Utc::now().into()),
                    ..Default::default()
                };
                let inserted = new_user.insert(db).await?;
                inserted.id
            }
        };

        // update room status
        let room = Rooms::find_by_id(params.room_id).one(db).await?;
        if let Some(r) = room {
            let mut active_room: RoomActiveModel = r.into();
            active_room.status = ActiveValue::Set("OCCUPIED".to_string());
            active_room.update(db).await?;
        }

        // 3. Create contract
        let contract_id = Uuid::new_v4();
        let active_contract = ActiveModel {
            id: ActiveValue::Set(contract_id),
            user_id: ActiveValue::Set(landlord_id),
            room_id: ActiveValue::Set(params.room_id),
            start_date: ActiveValue::Set(params.start_date),
            end_date: ActiveValue::Set(params.end_date),
            monthly_rent: ActiveValue::Set(params.monthly_rent),
            deposit_amount: ActiveValue::Set(params.deposit_amount),
            payment_day: ActiveValue::Set(params.payment_day),
            status: ActiveValue::Set("ACTIVE".to_string()),
            rental_period: ActiveValue::Set(params.rental_period),
            room_code: ActiveValue::Set(params.room_code),
            room_address: ActiveValue::Set(params.room_address),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        };

        let res = active_contract.insert(db).await?;

        // 4. Link tenant
        let ct = ContractTenantActiveModel {
            contract_id: ActiveValue::Set(contract_id),
            tenant_id: ActiveValue::Set(tenant_id),
        };
        ct.insert(db).await?;

        Ok(res)
    }

    fn map_to_response(
        contract: Model,
        owner: Option<UserModel>,
        tenant: Option<UserModel>,
    ) -> ContractResponse {
        ContractResponse {
            id: contract.id,
            user_id: contract.user_id,
            room_id: contract.room_id,
            start_date: contract.start_date,
            end_date: contract.end_date,
            monthly_rent: contract.monthly_rent,
            deposit_amount: contract.deposit_amount,
            payment_day: contract.payment_day,
            rental_period: contract.rental_period,
            status: contract.status,
            created_at: contract.created_at,
            updated_at: contract.updated_at,
            owner_name: owner.as_ref().map(|o| o.name.clone()),
            owner_id_card: owner.as_ref().and_then(|o| o.id_card.clone()),
            owner_id_card_date: owner.as_ref().and_then(|o| o.id_card_date),
            owner_address: owner.as_ref().and_then(|o| o.address.clone()),
            owner_phone: owner.as_ref().map(|o| o.phone.clone()),
            tenant_name: tenant.as_ref().map(|t| t.name.clone()),
            tenant_id_card: tenant.as_ref().and_then(|t| t.id_card.clone()),
            tenant_id_card_date: tenant.as_ref().and_then(|t| t.id_card_date),
            tenant_address: tenant.as_ref().and_then(|t| t.address.clone()),
            tenant_phone: tenant.as_ref().map(|t| t.phone.clone()),
            room_code: contract.room_code,
            room_address: contract.room_address,
        }
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
