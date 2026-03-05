use loco_rs::model::{ModelError, ModelResult};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    Set,
};
use uuid::Uuid;

use crate::{
    dtos::property::{
        CreateBuildingParams, CreateFloorParams, CreateRoomParams, UpdateBuildingParams,
        UpdateRoomStatusParams,
    },
    models::_entities::{
        buildings::{
            ActiveModel as BuildingActiveModel, Column as BuildingColumn, Entity as BuildingEntity,
        },
        floors::ActiveModel as FloorActiveModel,
        rooms::{ActiveModel as RoomActiveModel, Column as RoomColumn, Entity as RoomEntity},
    },
};

pub struct PropertyService;

impl PropertyService {
    // === Buildings ===

    pub async fn create_building(
        db: &DatabaseConnection,
        owner_id: Uuid,
        params: &CreateBuildingParams,
    ) -> ModelResult<crate::models::buildings::Model> {
        let building = BuildingActiveModel {
            owner_id: Set(owner_id),
            name: Set(params.name.clone()),
            address: Set(params.address.clone()),
            ..Default::default()
        };
        Ok(building.insert(db).await?)
    }

    pub async fn update_building(
        db: &DatabaseConnection,
        building_id: Uuid,
        owner_id: Uuid,
        params: &UpdateBuildingParams,
    ) -> ModelResult<crate::models::buildings::Model> {
        let building = BuildingEntity::find_by_id(building_id)
            .filter(BuildingColumn::OwnerId.eq(owner_id))
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        if building.status == "ARCHIVED" {
            return Err(ModelError::Any(anyhow::anyhow!("RESOURCE_ARCHIVED").into()));
        }

        let mut active_building: BuildingActiveModel = building.into();
        if let Some(name) = &params.name {
            active_building.name = Set(name.clone());
        }
        if let Some(address) = &params.address {
            active_building.address = Set(Some(address.clone()));
        }

        Ok(active_building.update(db).await?)
    }

    pub async fn archive_building(
        db: &DatabaseConnection,
        building_id: Uuid,
        owner_id: Uuid,
    ) -> ModelResult<crate::models::buildings::Model> {
        let building = BuildingEntity::find_by_id(building_id)
            .filter(BuildingColumn::OwnerId.eq(owner_id))
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        let active_rooms = RoomEntity::find()
            .filter(RoomColumn::BuildingId.eq(building_id))
            .filter(RoomColumn::Status.is_in(["OCCUPIED", "DEPOSITED"]))
            .count(db)
            .await?;

        if active_rooms > 0 {
            return Err(ModelError::Any(
                anyhow::anyhow!("BUILDING_HAS_ACTIVE_ROOMS").into(),
            ));
        }

        let mut active_building: BuildingActiveModel = building.into();
        active_building.status = Set("ARCHIVED".to_string());
        Ok(active_building.update(db).await?)
    }

    // === Floors ===

    pub async fn create_floor(
        db: &DatabaseConnection,
        owner_id: Uuid,
        params: &CreateFloorParams,
    ) -> ModelResult<crate::models::floors::Model> {
        // Validate building exists and belongs to owner
        BuildingEntity::find_by_id(params.building_id)
            .filter(BuildingColumn::OwnerId.eq(owner_id))
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        // Check uniqueness
        let existing_floor = crate::models::_entities::floors::Entity::find()
            .filter(crate::models::_entities::floors::Column::BuildingId.eq(params.building_id))
            .filter(
                crate::models::_entities::floors::Column::Identifier.eq(params.identifier.clone()),
            )
            .one(db)
            .await?;

        if existing_floor.is_some() {
            return Err(ModelError::Any(
                anyhow::anyhow!("DUPLICATE_FLOOR_IDENTIFIER").into(),
            ));
        }

        let floor = FloorActiveModel {
            building_id: Set(params.building_id),
            identifier: Set(params.identifier.clone()),
            ..Default::default()
        };
        Ok(floor.insert(db).await?)
    }

    // === Rooms ===

    pub async fn create_room(
        db: &DatabaseConnection,
        owner_id: Uuid,
        params: &CreateRoomParams,
    ) -> ModelResult<crate::models::rooms::Model> {
        // Validate building exists and belongs to owner
        BuildingEntity::find_by_id(params.building_id)
            .filter(BuildingColumn::OwnerId.eq(owner_id))
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        // Check uniqueness
        let existing_room = RoomEntity::find()
            .filter(RoomColumn::BuildingId.eq(params.building_id))
            .filter(RoomColumn::Code.eq(params.code.clone()))
            .one(db)
            .await?;

        if existing_room.is_some() {
            return Err(ModelError::Any(
                anyhow::anyhow!("DUPLICATE_ROOM_IDENTIFIER").into(),
            ));
        }

        let room = RoomActiveModel {
            building_id: Set(params.building_id),
            floor_id: Set(params.floor_id),
            code: Set(params.code.clone()),
            ..Default::default()
        };
        Ok(room.insert(db).await?)
    }

    pub async fn update_room_status(
        db: &DatabaseConnection,
        room_id: Uuid,
        owner_id: Uuid,
        params: &UpdateRoomStatusParams,
    ) -> ModelResult<crate::models::rooms::Model> {
        let room = RoomEntity::find_by_id(room_id)
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        // Enforce owner_id thru building join
        BuildingEntity::find_by_id(room.building_id)
            .filter(BuildingColumn::OwnerId.eq(owner_id))
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        let mut active_room: RoomActiveModel = room.into();
        active_room.status = Set(params.status.clone());
        Ok(active_room.update(db).await?)
    }

    pub async fn archive_room(
        db: &DatabaseConnection,
        room_id: Uuid,
        owner_id: Uuid,
    ) -> ModelResult<crate::models::rooms::Model> {
        let room = RoomEntity::find_by_id(room_id)
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        // Enforce owner_id thru building join
        BuildingEntity::find_by_id(room.building_id)
            .filter(BuildingColumn::OwnerId.eq(owner_id))
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        if matches!(room.status.as_str(), "OCCUPIED" | "DEPOSITED") {
            return Err(ModelError::Any(
                anyhow::anyhow!("ROOM_HAS_ACTIVE_TENANCY").into(),
            ));
        }

        let mut active_room: RoomActiveModel = room.into();
        active_room.status = Set("ARCHIVED".to_string());
        Ok(active_room.update(db).await?)
    }
}
