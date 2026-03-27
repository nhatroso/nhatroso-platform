use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, ColumnTrait, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;
use crate::views::meters::{CreateMeterParams, MeterResponse};

pub use super::_entities::meters::{ActiveModel, Model, Entity};
pub type Meters = Entity;

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

impl Model {
    pub async fn list_by_room(db: &DatabaseConnection, room_id: Uuid) -> Result<Vec<MeterResponse>> {
        let meters = Meters::find()
            .filter(crate::models::_entities::meters::Column::RoomId.eq(room_id))
            .all(db)
            .await?;
        Ok(meters.into_iter().map(MeterResponse::from).collect())
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Self>> {
        Meters::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn find_by_tenant(db: &DatabaseConnection, tenant_id: Uuid) -> Result<Vec<MeterResponse>> {
        use crate::models::_entities::{contracts, contract_tenants, rooms, meters};
        use sea_orm::{RelationTrait, QuerySelect};

        let meters = Meters::find()
            .join(
                sea_orm::JoinType::InnerJoin,
                meters::Relation::Rooms.def(),
            )
            .join(
                sea_orm::JoinType::InnerJoin,
                rooms::Relation::Contracts.def(),
            )
            .join(
                sea_orm::JoinType::InnerJoin,
                contracts::Relation::ContractTenants.def(),
            )
            .filter(contract_tenants::Column::TenantId.eq(tenant_id))
            .filter(contracts::Column::Status.eq("ACTIVE"))
            .all(db)
            .await?;

        Ok(meters.into_iter().map(MeterResponse::from).collect())
    }

    pub async fn validate_meter_access(db: &DatabaseConnection, meter_id: Uuid, tenant_id: Uuid) -> Result<bool> {
        use crate::models::_entities::{contracts, contract_tenants, rooms, meters};
        use sea_orm::{RelationTrait, QuerySelect, PaginatorTrait};

        let count = Meters::find()
            .filter(meters::Column::Id.eq(meter_id))
            .join(
                sea_orm::JoinType::InnerJoin,
                meters::Relation::Rooms.def(),
            )
            .join(
                sea_orm::JoinType::InnerJoin,
                rooms::Relation::Contracts.def(),
            )
            .join(
                sea_orm::JoinType::InnerJoin,
                contracts::Relation::ContractTenants.def(),
            )
            .filter(contract_tenants::Column::TenantId.eq(tenant_id))
            .filter(contracts::Column::Status.eq("ACTIVE"))
            .count(db)
            .await?;

        Ok(count > 0)
    }

    pub async fn create_meter(db: &DatabaseConnection, params: CreateMeterParams) -> Result<std::result::Result<MeterResponse, (StatusCode, &'static str)>> {
        // Check for duplicate meter for room + service
        let existing = Meters::find()
            .filter(crate::models::_entities::meters::Column::RoomId.eq(params.room_id))
            .filter(crate::models::_entities::meters::Column::ServiceId.eq(params.service_id))
            .one(db)
            .await?;

        if existing.is_some() {
            return Ok(Err((StatusCode::CONFLICT, "METER_ALREADY_EXISTS")));
        }

        let meter = ActiveModel {
            room_id: ActiveValue::Set(params.room_id),
            service_id: ActiveValue::Set(params.service_id),
            serial_number: ActiveValue::Set(params.serial_number),
            initial_reading: ActiveValue::Set(params.initial_reading.unwrap_or_default()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            ..Default::default()
        };

        let inserted = meter.insert(db).await?;
        Ok(Ok(MeterResponse::from(inserted)))
    }
}
