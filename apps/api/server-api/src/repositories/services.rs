use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter};
use uuid::Uuid;
use crate::models::_entities::services::{ActiveModel, Column, Entity as Services, Model};
use crate::dto::services::{CreateServiceParams, UpdateServiceParams};

pub struct ServiceRepository;

impl ServiceRepository {
    pub async fn list(db: &DatabaseConnection) -> Result<Vec<Model>> {
        Services::find().all(db).await.map_err(Error::from)
    }

    pub async fn find_by_owner_and_name(db: &DatabaseConnection, owner_id: Uuid, name: &str) -> Result<Option<Model>> {
        Services::find()
            .filter(Column::OwnerId.eq(owner_id))
            .filter(Column::Name.eq(name))
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Model>> {
        Services::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn insert(db: &DatabaseConnection, owner_id: Uuid, params: CreateServiceParams) -> Result<Model> {
        let service = ActiveModel {
            owner_id: ActiveValue::Set(owner_id),
            name: ActiveValue::Set(params.name.trim().to_string()),
            unit: ActiveValue::Set(params.unit.trim().to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            ..Default::default()
        };
        service.insert(db).await.map_err(Error::from)
    }

    pub async fn update(db: &DatabaseConnection, model: Model, params: UpdateServiceParams) -> Result<Model> {
        let mut active_model = model.into_active_model();
        if let Some(name) = params.name {
            active_model.name = ActiveValue::Set(name.trim().to_string());
        }
        if let Some(unit) = params.unit {
            active_model.unit = ActiveValue::Set(unit.trim().to_string());
        }
        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        active_model.update(db).await.map_err(Error::from)
    }

    pub async fn archive(db: &DatabaseConnection, model: Model) -> Result<Model> {
        let mut active_model = model.into_active_model();
        active_model.status = ActiveValue::Set("ARCHIVED".to_string());
        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        active_model.update(db).await.map_err(Error::from)
    }
}
