use loco_rs::prelude::*;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QueryOrder, RelationTrait, JoinType, QuerySelect, ActiveModelTrait, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;

pub use super::_entities::rooms::{ActiveModel, Model, Entity};
pub type Rooms = Entity;

use crate::models::_entities::{
    buildings::Entity as Buildings,
    floors::Entity as Floors,
    contracts::Entity as Contracts,
    room_services::Entity as RoomServices,
    price_rules::Entity as PriceRules,
    services::Entity as Services,
};
use crate::views::rooms::{
    CreateRoomParams, UpdateRoomParams, AvailableRoomResponse,
    TenantRoomResponse, TenantRoomServiceResponse
};

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
    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<(Self, crate::models::_entities::buildings::Model)>> {
        Ok(Rooms::find()
            .filter(super::_entities::rooms::Column::Id.eq(id))
            .find_also_related(Buildings)
            .one(db)
            .await?
            .map(|(r, b)| (r, b.unwrap())))
    }

    pub async fn get_by_id(
        db: &DatabaseConnection,
        owner_id: Uuid,
        id: Uuid,
    ) -> Result<std::result::Result<Self, (StatusCode, &'static str)>> {
        let item_with_building = Self::find_by_id(db, id).await?;

        let (item, building) = match item_with_building {
            Some((r, b)) => (r, b),
            _ => return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND"))),
        };

        if building.owner_id != owner_id {
            return Ok(Err((StatusCode::FORBIDDEN, "UNAUTHORIZED")));
        }

        Ok(Ok(item))
    }

    pub async fn find_by_floor(db: &DatabaseConnection, floor_id: Uuid) -> Result<Vec<Self>> {
        Ok(Rooms::find()
            .filter(super::_entities::rooms::Column::FloorId.eq(Some(floor_id)))
            .filter(super::_entities::rooms::Column::Status.ne("ARCHIVED"))
            .all(db)
            .await?)
    }

    pub async fn list_by_owner(db: &DatabaseConnection, owner_id: Uuid) -> Result<Vec<Self>> {
        Ok(Rooms::find()
            .join(JoinType::InnerJoin, super::_entities::rooms::Relation::Buildings.def())
            .filter(crate::models::_entities::buildings::Column::OwnerId.eq(owner_id))
            .filter(super::_entities::rooms::Column::Status.ne("ARCHIVED"))
            .order_by_asc(super::_entities::rooms::Column::Code)
            .all(db)
            .await?)
    }

    pub async fn list_by_floor(
        db: &DatabaseConnection,
        owner_id: Uuid,
        floor_id: Uuid,
    ) -> Result<std::result::Result<Vec<Self>, (StatusCode, &'static str)>> {
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

        Ok(Ok(Self::find_by_floor(db, floor_id).await?))
    }

    pub async fn find_by_code_in_building(db: &DatabaseConnection, building_id: Uuid, code: &str) -> Result<Option<Self>> {
        Ok(Rooms::find()
            .filter(super::_entities::rooms::Column::BuildingId.eq(building_id))
            .filter(super::_entities::rooms::Column::Code.eq(code))
            .one(db)
            .await?)
    }

    pub async fn create(
        db: &DatabaseConnection,
        owner_id: Uuid,
        floor_id: Uuid,
        params: CreateRoomParams,
    ) -> Result<std::result::Result<Self, (StatusCode, &'static str)>> {
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

        let existing = Self::find_by_code_in_building(db, floor.building_id, &params.code).await?;
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

        Ok(Ok(item.insert(db).await?))
    }

    pub async fn update_room(
        db: &DatabaseConnection,
        owner_id: Uuid,
        id: Uuid,
        params: UpdateRoomParams,
    ) -> Result<std::result::Result<Self, (StatusCode, &'static str)>> {
        let item_with_building = Self::find_by_id(db, id).await?;

        let (item, building) = match item_with_building {
            Some((r, b)) => (r, b),
            _ => return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND"))),
        };

        if building.owner_id != owner_id {
            return Ok(Err((StatusCode::FORBIDDEN, "UNAUTHORIZED")));
        }

        let mut active_model = item.clone().into_active_model();

        if let Some(code) = params.code {
            let existing = Self::find_by_code_in_building(db, item.building_id, &code).await?;

            if let Some(existing_room) = existing {
                if existing_room.id != id {
                     return Ok(Err((StatusCode::CONFLICT, "ROOM_CODE_EXISTS")));
                }
            }

            active_model.code = ActiveValue::Set(code);
        }

        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());

        Ok(Ok(active_model.update(db).await?))
    }

    pub async fn get_my_room(
        db: &DatabaseConnection,
        tenant_id: Uuid,
    ) -> Result<std::result::Result<TenantRoomResponse, (StatusCode, &'static str)>> {
        let contract = Contracts::find()
            .join(
                JoinType::InnerJoin,
                crate::models::_entities::contracts::Relation::ContractTenants.def(),
            )
            .filter(crate::models::_entities::contract_tenants::Column::TenantId.eq(tenant_id))
            .filter(crate::models::_entities::contracts::Column::Status.eq("ACTIVE"))
            .one(db)
            .await?;

        let Some(contract) = contract else {
            return Ok(Err((StatusCode::NOT_FOUND, "NO_ACTIVE_CONTRACT")));
        };

        let room_with_building = Self::find_by_id(db, contract.room_id).await?;
        let (room, building) = match room_with_building {
            Some((r, b)) => (r, b),
            _ => return Ok(Err((StatusCode::NOT_FOUND, "ROOM_NOT_FOUND"))),
        };

        let floor = if let Some(floor_id) = room.floor_id {
            Floors::find_by_id(floor_id).one(db).await?
        } else {
            None
        };

        let services = RoomServices::find()
            .filter(crate::models::_entities::room_services::Column::RoomId.eq(contract.room_id))
            .filter(crate::models::_entities::room_services::Column::IsActive.eq(true))
            .find_also_related(Services)
            .all(db)
            .await?;

        let mut service_responses = Vec::new();
        for (rs, s) in services {
            if let Some(s) = s {
                let unit_price = if let Some(price_rule_id) = rs.price_rule_id {
                    PriceRules::find_by_id(price_rule_id).one(db).await?
                        .map(|p| p.unit_price)
                        .unwrap_or_default()
                } else {
                    Default::default()
                };

                service_responses.push(TenantRoomServiceResponse {
                    name: s.name,
                    unit: s.unit,
                    unit_price,
                });
            }
        }

        Ok(Ok(TenantRoomResponse {
            id: room.id,
            building_name: building.name.clone(),
            room_address: building.address.unwrap_or_default(),
            code: room.code.clone(),
            floor_name: floor.map(|f| f.identifier),
            monthly_rent: contract.monthly_rent.into(),
            services: service_responses,
        }))
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {
    pub async fn list_available(db: &DatabaseConnection, owner_id: Uuid) -> Result<Vec<AvailableRoomResponse>> {
        Ok(Rooms::find()
            .select_only()
            .column(super::_entities::rooms::Column::Id)
            .column(super::_entities::rooms::Column::BuildingId)
            .column_as(crate::models::_entities::buildings::Column::Name, "building_name")
            .column_as(crate::models::_entities::buildings::Column::Address, "room_address")
            .column_as(super::_entities::rooms::Column::Code, "code")
            .column(super::_entities::rooms::Column::Status)
            .column_as(crate::models::_entities::floors::Column::Identifier, "floor_name")
            .join(JoinType::InnerJoin, super::_entities::rooms::Relation::Buildings.def())
            .join(JoinType::LeftJoin, super::_entities::rooms::Relation::Floors.def())
            .filter(super::_entities::rooms::Column::Status.eq("VACANT"))
            .filter(crate::models::_entities::buildings::Column::OwnerId.eq(owner_id))
            .order_by_asc(super::_entities::rooms::Column::Code)
            .into_model::<AvailableRoomResponse>()
            .all(db)
            .await?)
    }
}
