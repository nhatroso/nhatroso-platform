use loco_rs::prelude::*;
use uuid::Uuid;
use sea_orm::ActiveValue;
use crate::repositories::rooms::RoomRepository;
use crate::dto::rooms::{CreateRoomParams, UpdateRoomParams, AvailableRoomResponse};
use crate::models::_entities::rooms::{ActiveModel, Model};
use crate::models::_entities::floors::Entity as Floors;
use crate::models::_entities::buildings::Entity as Buildings;
use sea_orm::EntityTrait;
use axum::http::StatusCode;

pub struct RoomService;

impl RoomService {
    pub async fn create(
        db: &DatabaseConnection,
        owner_id: Uuid,
        floor_id: Uuid,
        params: CreateRoomParams,
    ) -> Result<std::result::Result<Model, (StatusCode, &'static str)>> {
        let floor_with_building = Floors::find()
            .filter(crate::models::_entities::floors::Column::Id.eq(floor_id))
            .find_also_related(Buildings)
            .one(db)
            .await?;

        let (floor, building) = match floor_with_building {
            Some((f, Some(b))) => (f, b),
            _ => return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND"))),
        };

        if building.owner_id != owner_id {
            return Ok(Err((StatusCode::FORBIDDEN, "UNAUTHORIZED")));
        }

        let existing = RoomRepository::find_by_code_in_building(db, floor.building_id, &params.code).await?;
        if existing.is_some() {
            return Ok(Err((StatusCode::CONFLICT, "ROOM_CODE_EXISTS")));
        }

        let item = ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(floor.building_id),
            floor_id: ActiveValue::Set(Some(floor_id)),
            code: ActiveValue::Set(params.code),
            status: ActiveValue::Set("VACANT".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        };

        Ok(Ok(RoomRepository::insert(db, item).await?))
    }

    pub async fn list_by_floor(
        db: &DatabaseConnection,
        owner_id: Uuid,
        floor_id: Uuid,
    ) -> Result<std::result::Result<Vec<Model>, (StatusCode, &'static str)>> {
        let floor_with_building = Floors::find()
            .filter(crate::models::_entities::floors::Column::Id.eq(floor_id))
            .find_also_related(Buildings)
            .one(db)
            .await?;

        let (_, building) = match floor_with_building {
            Some((f, Some(b))) => (f, b),
            _ => return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND"))),
        };

        if building.owner_id != owner_id {
            return Ok(Err((StatusCode::FORBIDDEN, "UNAUTHORIZED")));
        }

        Ok(Ok(RoomRepository::find_by_floor(db, floor_id).await?))
    }

    pub async fn update(
        db: &DatabaseConnection,
        owner_id: Uuid,
        id: Uuid,
        params: UpdateRoomParams,
    ) -> Result<std::result::Result<Model, (StatusCode, &'static str)>> {
        let item_with_building = RoomRepository::find_by_id(db, id).await?;

        let (item, building) = match item_with_building {
            Some((r, b)) => (r, b),
            _ => return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND"))),
        };

        if building.owner_id != owner_id {
            return Ok(Err((StatusCode::FORBIDDEN, "UNAUTHORIZED")));
        }

        let mut active_model = item.clone().into_active_model();

        if let Some(code) = params.code {
            let existing = RoomRepository::find_by_code_in_building(db, item.building_id, &code).await?;

            if let Some(existing_room) = existing {
                if existing_room.id != id {
                     return Ok(Err((StatusCode::CONFLICT, "ROOM_CODE_EXISTS")));
                }
            }

            active_model.code = ActiveValue::Set(code);
        }

        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());

        Ok(Ok(RoomRepository::update(db, active_model).await?))
    }

    pub async fn list_available(db: &DatabaseConnection, owner_id: Uuid) -> Result<Vec<AvailableRoomResponse>> {
        RoomRepository::list_available(db, owner_id).await
    }

    pub async fn get_by_id(
        db: &DatabaseConnection,
        owner_id: Uuid,
        id: Uuid,
    ) -> Result<std::result::Result<Model, (StatusCode, &'static str)>> {
        let item_with_building = RoomRepository::find_by_id(db, id).await?;

        let (item, building) = match item_with_building {
            Some((r, b)) => (r, b),
            _ => return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND"))),
        };

        if building.owner_id != owner_id {
            return Ok(Err((StatusCode::FORBIDDEN, "UNAUTHORIZED")));
        }

        Ok(Ok(item))
    }
}
