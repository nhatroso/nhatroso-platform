use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter};
use uuid::Uuid;
use crate::models::_entities::buildings::{ActiveModel, Column, Entity as Buildings, Model};
use crate::dto::buildings::{CreateBuildingParams, UpdateBuildingParams};

pub struct BuildingRepository;

impl BuildingRepository {
    pub async fn find_by_owner(db: &DatabaseConnection, owner_id: Uuid) -> Result<Vec<Model>> {
        Buildings::find()
            .filter(Column::OwnerId.eq(owner_id))
            .filter(Column::Status.ne("ARCHIVED"))
            .all(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid, owner_id: Uuid) -> Result<Option<Model>> {
        Buildings::find()
            .filter(Column::Id.eq(id))
            .filter(Column::OwnerId.eq(owner_id))
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn create(db: &DatabaseConnection, owner_id: Uuid, params: CreateBuildingParams) -> Result<Model> {
        let item = ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            owner_id: ActiveValue::Set(owner_id),
            name: ActiveValue::Set(params.name),
            address: ActiveValue::Set(params.address.unwrap_or_default()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        };
        item.insert(db).await.map_err(Error::from)
    }

    pub async fn update(db: &DatabaseConnection, model: Model, params: UpdateBuildingParams) -> Result<Model> {
        let mut active_model: ActiveModel = model.into();
        if let Some(name) = params.name {
            if !name.trim().is_empty() {
                 active_model.name = ActiveValue::Set(name);
            }
        }
        if let Some(address) = params.address {
            active_model.address = ActiveValue::Set(address);
        }
        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        active_model.update(db).await.map_err(Error::from)
    }

    pub async fn archive(db: &DatabaseConnection, model: Model) -> Result<Model> {
        let mut active_model: ActiveModel = model.into();
        active_model.status = ActiveValue::Set("ARCHIVED".to_string());
        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        active_model.update(db).await.map_err(Error::from)
    }
}
