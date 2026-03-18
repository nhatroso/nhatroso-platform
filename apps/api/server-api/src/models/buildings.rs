use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;

pub use super::_entities::buildings::{ActiveModel, Model, Entity};
pub type Buildings = Entity;

use crate::views::buildings::{CreateBuildingParams, UpdateBuildingParams};
use crate::models::_entities::rooms::{Column as RoomsColumn, Entity as Rooms};

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
    pub async fn find_by_owner(db: &DatabaseConnection, owner_id: Uuid) -> Result<Vec<Self>> {
        Buildings::find()
            .filter(super::_entities::buildings::Column::OwnerId.eq(owner_id))
            .filter(super::_entities::buildings::Column::Status.ne("ARCHIVED"))
            .all(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid, owner_id: Uuid) -> Result<Option<Self>> {
        Buildings::find()
            .filter(super::_entities::buildings::Column::Id.eq(id))
            .filter(super::_entities::buildings::Column::OwnerId.eq(owner_id))
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn create(db: &DatabaseConnection, owner_id: Uuid, params: CreateBuildingParams) -> Result<Self> {
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

    pub async fn update_building(db: &DatabaseConnection, owner_id: Uuid, id: Uuid, params: UpdateBuildingParams) -> Result<std::result::Result<Self, (StatusCode, &'static str)>> {
        let building = Self::find_by_id(db, id, owner_id).await?;
        let Some(building) = building else {
            return Ok(Err((StatusCode::NOT_FOUND, "BUILDING_NOT_FOUND")));
        };

        if building.status == "ARCHIVED" {
            return Ok(Err((StatusCode::CONFLICT, "RESOURCE_ARCHIVED")));
        }

        let mut active_model: ActiveModel = building.into();
        if let Some(name) = params.name {
            if !name.trim().is_empty() {
                 active_model.name = ActiveValue::Set(name);
            }
        }
        if let Some(address) = params.address {
            active_model.address = ActiveValue::Set(address);
        }
        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        Ok(Ok(active_model.update(db).await.map_err(Error::from)?))
    }

    pub async fn archive_building(db: &DatabaseConnection, owner_id: Uuid, id: Uuid) -> Result<std::result::Result<Self, (StatusCode, &'static str)>> {
        let building = Self::find_by_id(db, id, owner_id).await?;
        let Some(building) = building else {
            return Ok(Err((StatusCode::NOT_FOUND, "BUILDING_NOT_FOUND")));
        };

        let active_rooms = Rooms::find()
            .filter(RoomsColumn::BuildingId.eq(id))
            .filter(RoomsColumn::Status.is_in(["OCCUPIED", "DEPOSITED"]))
            .all(db)
            .await?;

        if !active_rooms.is_empty() {
            return Ok(Err((StatusCode::CONFLICT, "BUILDING_HAS_ACTIVE_ROOMS")));
        }

        let mut active_model: ActiveModel = building.into();
        active_model.status = ActiveValue::Set("ARCHIVED".to_string());
        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        Ok(Ok(active_model.update(db).await.map_err(Error::from)?))
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
