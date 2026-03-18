use loco_rs::prelude::*;
use axum::http::StatusCode;
use uuid::Uuid;
use crate::models::_entities::buildings::Model;
use crate::dto::buildings::{CreateBuildingParams, UpdateBuildingParams};
use crate::repositories::buildings::BuildingRepository;
use crate::models::_entities::rooms::{Column as RoomsColumn, Entity as Rooms};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};

pub struct BuildingService;

impl BuildingService {
    pub async fn list(db: &DatabaseConnection, owner_id: Uuid) -> Result<Vec<Model>> {
        BuildingRepository::find_by_owner(db, owner_id).await
    }

    pub async fn create(db: &DatabaseConnection, owner_id: Uuid, params: CreateBuildingParams) -> Result<Model> {
        BuildingRepository::create(db, owner_id, params).await
    }

    pub async fn update(db: &DatabaseConnection, owner_id: Uuid, id: Uuid, params: UpdateBuildingParams) -> Result<std::result::Result<Model, (StatusCode, &'static str)>> {
        let building = BuildingRepository::find_by_id(db, id, owner_id).await?;
        let Some(building) = building else {
            return Ok(Err((StatusCode::NOT_FOUND, "BUILDING_NOT_FOUND")));
        };

        if building.status == "ARCHIVED" {
            return Ok(Err((StatusCode::CONFLICT, "RESOURCE_ARCHIVED")));
        }

        let updated = BuildingRepository::update(db, building, params).await?;
        Ok(Ok(updated))
    }

    pub async fn archive(db: &DatabaseConnection, owner_id: Uuid, id: Uuid) -> Result<std::result::Result<Model, (StatusCode, &'static str)>> {
        let building = BuildingRepository::find_by_id(db, id, owner_id).await?;
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

        let archived = BuildingRepository::archive(db, building).await?;
        Ok(Ok(archived))
    }
}
