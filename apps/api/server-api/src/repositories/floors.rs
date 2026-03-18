use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter};
use uuid::Uuid;
use crate::models::_entities::floors::{ActiveModel, Column, Entity as Floors, Model};
use crate::dto::floors::{CreateFloorParams, UpdateFloorParams};

pub struct FloorRepository;

impl FloorRepository {
    pub async fn list_by_building(db: &DatabaseConnection, building_id: Uuid) -> Result<Vec<Model>> {
        Floors::find()
            .filter(Column::BuildingId.eq(building_id))
            .filter(Column::Status.ne("ARCHIVED"))
            .all(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Model>> {
        Floors::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn create(db: &DatabaseConnection, building_id: Uuid, params: CreateFloorParams) -> Result<Model> {
        let item = ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(building_id),
            identifier: ActiveValue::Set(params.identifier),
            status: ActiveValue::Set("ACTIVE".to_string()),
        };
        item.insert(db).await.map_err(Error::from)
    }

    pub async fn update(db: &DatabaseConnection, model: Model, params: UpdateFloorParams) -> Result<Model> {
        let mut active_model = model.into_active_model();
        if let Some(ident) = params.identifier {
            active_model.identifier = ActiveValue::Set(ident);
        }
        active_model.update(db).await.map_err(Error::from)
    }
}
