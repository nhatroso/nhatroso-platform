use loco_rs::prelude::*;
use axum::http::StatusCode;
use uuid::Uuid;
use crate::models::_entities::floors::Model;
use crate::dto::floors::{CreateFloorParams, UpdateFloorParams};
use crate::repositories::floors::FloorRepository;
use crate::repositories::buildings::BuildingRepository;

pub struct FloorService;

impl FloorService {
    pub async fn list_by_building(db: &DatabaseConnection, owner_id: Uuid, building_id: Uuid) -> Result<std::result::Result<Vec<Model>, (StatusCode, &'static str)>> {
        // Verify building ownership
        let building = BuildingRepository::find_by_id(db, building_id, owner_id).await?;
        if building.is_none() {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        }

        let items = FloorRepository::list_by_building(db, building_id).await?;
        Ok(Ok(items))
    }

    pub async fn create(db: &DatabaseConnection, owner_id: Uuid, building_id: Uuid, params: CreateFloorParams) -> Result<std::result::Result<Model, (StatusCode, &'static str)>> {
        // Verify building ownership
        let building = BuildingRepository::find_by_id(db, building_id, owner_id).await?;
        if building.is_none() {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        }

        let res = FloorRepository::create(db, building_id, params).await?;
        Ok(Ok(res))
    }

    pub async fn update(db: &DatabaseConnection, owner_id: Uuid, id: Uuid, params: UpdateFloorParams) -> Result<std::result::Result<Model, (StatusCode, &'static str)>> {
        let item = FloorRepository::find_by_id(db, id).await?;
        let Some(item) = item else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        // Verify building ownership
        let building = BuildingRepository::find_by_id(db, item.building_id, owner_id).await?;
        if building.is_none() {
            return Ok(Err((StatusCode::FORBIDDEN, "FORBIDDEN")));
        }

        let res = FloorRepository::update(db, item, params).await?;
        Ok(Ok(res))
    }
}
