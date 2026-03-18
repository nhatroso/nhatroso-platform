use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter};
use uuid::Uuid;
use crate::models::_entities::contracts::{ActiveModel, Entity as Contracts, Model};
use crate::models::_entities::contract_tenants::{ActiveModel as ContractTenantActiveModel, Entity as ContractTenants};
use crate::models::_entities::users::{Entity as Users, Model as UserModel};

pub struct ContractRepository;

impl ContractRepository {
    pub async fn list(db: &DatabaseConnection) -> Result<Vec<Model>> {
        Contracts::find().all(db).await.map_err(Error::from)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Model>> {
        Contracts::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn find_owner(db: &DatabaseConnection, owner_id: Uuid) -> Result<Option<UserModel>> {
        Users::find_by_id(owner_id).one(db).await.map_err(Error::from)
    }

    pub async fn find_tenant_by_contract(db: &DatabaseConnection, contract_id: Uuid) -> Result<Option<UserModel>> {
        let ct = ContractTenants::find()
            .filter(crate::models::_entities::contract_tenants::Column::ContractId.eq(contract_id))
            .one(db)
            .await?;
        
        if let Some(ct) = ct {
            Users::find_by_id(ct.tenant_id).one(db).await.map_err(Error::from)
        } else {
            Ok(None)
        }
    }

    pub async fn insert(db: &DatabaseConnection, active_contract: ActiveModel) -> Result<Model> {
        active_contract.insert(db).await.map_err(Error::from)
    }

    pub async fn link_tenant(db: &DatabaseConnection, contract_id: Uuid, tenant_id: Uuid) -> Result<()> {
        let ct = ContractTenantActiveModel {
            contract_id: ActiveValue::Set(contract_id),
            tenant_id: ActiveValue::Set(tenant_id),
        };
        ct.insert(db).await?;
        Ok(())
    }
}
