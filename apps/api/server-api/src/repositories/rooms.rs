use loco_rs::prelude::*;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QueryOrder, RelationTrait, JoinType, QuerySelect, ActiveModelTrait};
use uuid::Uuid;

use crate::models::_entities::{
    rooms::{ActiveModel, Column, Entity as Rooms, Model},
    buildings::Entity as Buildings,
};

use crate::dto::rooms::AvailableRoomResponse;

pub struct RoomRepository;

impl RoomRepository {
    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<(Model, crate::models::_entities::buildings::Model)>> {
        Ok(Rooms::find()
            .filter(Column::Id.eq(id))
            .find_also_related(Buildings)
            .one(db)
            .await?
            .map(|(r, b)| (r, b.unwrap())))
    }

    pub async fn find_by_floor(db: &DatabaseConnection, floor_id: Uuid) -> Result<Vec<Model>> {
        Ok(Rooms::find()
            .filter(Column::FloorId.eq(Some(floor_id)))
            .filter(Column::Status.ne("ARCHIVED"))
            .all(db)
            .await?)
    }

    pub async fn find_by_code_in_building(db: &DatabaseConnection, building_id: Uuid, code: &str) -> Result<Option<Model>> {
        Ok(Rooms::find()
            .filter(Column::BuildingId.eq(building_id))
            .filter(Column::Code.eq(code))
            .one(db)
            .await?)
    }

    pub async fn list_available(db: &DatabaseConnection, owner_id: Uuid) -> Result<Vec<AvailableRoomResponse>> {
        Ok(Rooms::find()
            .join(JoinType::InnerJoin, crate::models::_entities::rooms::Relation::Buildings.def())
            .join(JoinType::LeftJoin, crate::models::_entities::rooms::Relation::Floors.def())
            .filter(Column::Status.eq("VACANT"))
            .filter(crate::models::_entities::buildings::Column::OwnerId.eq(owner_id))
            .select_only()
            .column(Column::Id)
            .column(Column::Code)
            .column(Column::Status)
            
            .column(Column::BuildingId)
            .column_as(crate::models::_entities::buildings::Column::Name, "building_name")
            .column_as(crate::models::_entities::buildings::Column::Address, "address")
            .column_as(crate::models::_entities::floors::Column::Identifier, "floor_name")
            .order_by_asc(Column::Code)
            .into_model::<AvailableRoomResponse>()
            .all(db)
            .await?)
    }

    pub async fn insert(db: &DatabaseConnection, item: ActiveModel) -> Result<Model> {
        Ok(item.insert(db).await?)
    }

    pub async fn update(db: &DatabaseConnection, item: ActiveModel) -> Result<Model> {
        Ok(item.update(db).await?)
    }
}
