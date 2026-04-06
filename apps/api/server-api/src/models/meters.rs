use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, ColumnTrait, ActiveValue, RelationTrait};
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
        use crate::models::_entities::{services, meter_readings};
        use sea_orm::QueryOrder;
        let meters = Meters::find()
            .find_also_related(services::Entity)
            .filter(crate::models::_entities::meters::Column::RoomId.eq(room_id))
            .all(db)
            .await?;

        let mut results = Vec::new();
        for (m, s) in meters {
            let mut response = MeterResponse::from_model(m.clone(), s);
            let latest = meter_readings::Entity::find()
                .filter(meter_readings::Column::MeterId.eq(m.id))
                .filter(meter_readings::Column::Status.eq("SUBMITTED"))
                .order_by_desc(meter_readings::Column::ReadingDate)
                .one(db)
                .await?;
            if let Some(r) = latest {
                response.latest_reading = r.reading_value;
                response.latest_reading_date = r.reading_date.map(|d| d.into());
                response.latest_reading_period = r.period_month.clone();
            }
            results.push(response);
        }

        Ok(results)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Self>> {
        Meters::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn find_by_tenant(db: &DatabaseConnection, tenant_id: Uuid) -> Result<Vec<MeterResponse>> {
        use crate::models::_entities::{contracts, contract_tenants, rooms, meters, services, meter_readings};
        use sea_orm::{RelationTrait, QuerySelect, QueryOrder};

        let meters = Meters::find()
            .find_also_related(services::Entity)
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

        let mut results = Vec::new();
        for (m, s) in meters {
            let mut response = MeterResponse::from_model(m.clone(), s);
            let latest = meter_readings::Entity::find()
                .filter(meter_readings::Column::MeterId.eq(m.id))
                .filter(meter_readings::Column::Status.eq("SUBMITTED"))
                .order_by_desc(meter_readings::Column::ReadingDate)
                .one(db)
                .await?;
            if let Some(r) = latest {
                response.latest_reading = r.reading_value;
                response.latest_reading_date = r.reading_date.map(|d| d.into());
                response.latest_reading_period = r.period_month.clone();
            }
            results.push(response);
        }

        Ok(results)
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
        // Check for duplicate ACTIVE meter for room + service
        let existing = Meters::find()
            .filter(crate::models::_entities::meters::Column::RoomId.eq(params.room_id))
            .filter(crate::models::_entities::meters::Column::ServiceId.eq(params.service_id))
            .filter(crate::models::_entities::meters::Column::Status.eq("ACTIVE".to_string()))
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

    pub async fn get_landlord_summary(
        db: &DatabaseConnection,
        landlord_id: Uuid,
        period_month: Option<String>,
    ) -> Result<crate::views::meters::LandlordMeterSummary> {
        use crate::models::_entities::{buildings, rooms, meters, meter_readings};
        use sea_orm::{QuerySelect, PaginatorTrait};

        let total_meters = Meters::find()
            .join(sea_orm::JoinType::InnerJoin, meters::Relation::Rooms.def())
            .join(sea_orm::JoinType::InnerJoin, rooms::Relation::Buildings.def())
            .filter(buildings::Column::OwnerId.eq(landlord_id))
            .count(db)
            .await?;

        let period =
            period_month.unwrap_or_else(|| chrono::Utc::now().format("%Y-%m").to_string());

        let submitted_count = Meters::find()
            .join(sea_orm::JoinType::InnerJoin, meters::Relation::Rooms.def())
            .join(sea_orm::JoinType::InnerJoin, rooms::Relation::Buildings.def())
            .join(
                sea_orm::JoinType::InnerJoin,
                meters::Relation::MeterReadings.def(),
            )
            .filter(buildings::Column::OwnerId.eq(landlord_id))
            .filter(meter_readings::Column::PeriodMonth.eq(period))
            .count(db)
            .await?;

        let pending_readings = total_meters.saturating_sub(submitted_count);

        Ok(crate::views::meters::LandlordMeterSummary {
            total_meters,
            pending_readings,
            overdue_readings: 0, // TODO: Define overdue logic based on reading requests
            submission_rate: if total_meters > 0 {
                (submitted_count as f32 / total_meters as f32) * 100.0
            } else {
                0.0
            },
        })
    }

    pub async fn list_landlord_meters(
        db: &DatabaseConnection,
        landlord_id: Uuid,
        building_id: Option<Uuid>,
        period_month: Option<String>,
    ) -> Result<Vec<crate::views::meters::LandlordMeterDetail>> {
        use crate::models::_entities::{buildings, meter_readings, meters, rooms, services};
        use sea_orm::{QueryOrder, QuerySelect};

        let mut query = Meters::find()
            .find_also_related(services::Entity)
            .join(sea_orm::JoinType::InnerJoin, meters::Relation::Rooms.def())
            .join(sea_orm::JoinType::InnerJoin, rooms::Relation::Buildings.def())
            .filter(buildings::Column::OwnerId.eq(landlord_id));

        if let Some(bid) = building_id {
            query = query.filter(buildings::Column::Id.eq(bid));
        }

        let results: Vec<(meters::Model, Option<services::Model>)> = query.all(db).await?;

        let mut detailed_results = Vec::new();
        let target_period =
            period_month.unwrap_or_else(|| chrono::Utc::now().format("%Y-%m").to_string());

        for (m, s) in results {
            let maybe_room = rooms::Entity::find_by_id(m.room_id).one(db).await?;
            let r = maybe_room.unwrap(); // Should exist due to foreign key
                                         // Re-fetch building since sea-orm join/select might be tricky
            let b = buildings::Entity::find_by_id(r.building_id)
                .one(db)
                .await?
                .unwrap();

            let mut detail = crate::views::meters::LandlordMeterDetail {
                id: m.id,
                room_id: r.id,
                room_code: r.code,
                building_id: b.id,
                building_name: b.name,
                service_name: s.as_ref().map(|x| x.name.clone()).unwrap_or_default(),
                service_unit: s.as_ref().map(|x| x.unit.clone()).unwrap_or_default(),
                serial_number: m.serial_number,
                status: "PENDING".to_string(),
                last_reading: None,
                last_reading_date: None,
            };

            // Check if there is a reading for the target period
            let reading_in_period = meter_readings::Entity::find()
                .filter(meter_readings::Column::MeterId.eq(m.id))
                .filter(meter_readings::Column::PeriodMonth.eq(target_period.clone()))
                .one(db)
                .await?;

            if let Some(reading) = reading_in_period {
                detail.last_reading = reading.reading_value;
                detail.last_reading_date = reading.reading_date.map(|d| d.into());
                detail.status = "SUBMITTED".to_string();
            } else {
                // If no reading in target period, show the latest available reading for context
                let latest = meter_readings::Entity::find()
                    .filter(meter_readings::Column::MeterId.eq(m.id))
                    .filter(meter_readings::Column::Status.eq("SUBMITTED"))
                    .order_by_desc(meter_readings::Column::ReadingDate)
                    .one(db)
                    .await?;

                if let Some(reading) = latest {
                    detail.last_reading = reading.reading_value;
                    detail.last_reading_date = reading.reading_date.map(|d| d.into());
                }
                detail.status = "PENDING".to_string();
            }

            detailed_results.push(detail);
        }

        Ok(detailed_results)
    }

    pub async fn update_status(db: &DatabaseConnection, id: Uuid, status: &str) -> Result<()> {
        let meter = Meters::find_by_id(id).one(db).await?;
        if let Some(m) = meter {
            let mut active_model: ActiveModel = m.into();
            active_model.status = ActiveValue::Set(status.to_string());
            active_model.update(db).await?;
        }
        Ok(())
    }
}

