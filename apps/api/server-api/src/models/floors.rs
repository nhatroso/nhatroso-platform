use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;

pub use super::_entities::floors::{ActiveModel, Model, Entity};
pub type Floors = Entity;

use crate::views::floors::{CreateFloorParams, UpdateFloorParams};
use crate::models::buildings::Model as Building;

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, _insert: bool) -> std::result::Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        Ok(self)
    }
}

// implement your read-oriented logic here
impl Model {
    pub async fn find_by_building(db: &DatabaseConnection, building_id: Uuid) -> Result<Vec<Self>> {
        Floors::find()
            .filter(super::_entities::floors::Column::BuildingId.eq(building_id))
            .filter(super::_entities::floors::Column::Status.ne("ARCHIVED"))
            .all(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Self>> {
        Floors::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn list_by_building(db: &DatabaseConnection, owner_id: Uuid, building_id: Uuid) -> Result<std::result::Result<Vec<Self>, (StatusCode, &'static str)>> {
        // Verify building ownership
        let building = Building::find_by_id(db, building_id, owner_id).await?;
        if building.is_none() {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        }

        let items = Self::find_by_building(db, building_id).await?;
        Ok(Ok(items))
    }

    pub async fn create_floor(db: &DatabaseConnection, owner_id: Uuid, building_id: Uuid, params: CreateFloorParams) -> Result<std::result::Result<Self, (StatusCode, &'static str)>> {
        // Verify building ownership
        let building = Building::find_by_id(db, building_id, owner_id).await?;
        if building.is_none() {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        }

        let item = ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(building_id),
            identifier: ActiveValue::Set(params.identifier),
            status: ActiveValue::Set("ACTIVE".to_string()),
        };
        Ok(Ok(item.insert(db).await?))
    }

    pub async fn update_floor(db: &DatabaseConnection, owner_id: Uuid, id: Uuid, params: UpdateFloorParams) -> Result<std::result::Result<Self, (StatusCode, &'static str)>> {
        let item = Self::find_by_id(db, id).await?;
        let Some(item) = item else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        // Verify building ownership
        let building = Building::find_by_id(db, item.building_id, owner_id).await?;
        if building.is_none() {
            return Ok(Err((StatusCode::FORBIDDEN, "FORBIDDEN")));
        }

        let mut active_model = item.into_active_model();
        if let Some(ident) = params.identifier {
            active_model.identifier = ActiveValue::Set(ident);
        }
        Ok(Ok(active_model.update(db).await?))
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
