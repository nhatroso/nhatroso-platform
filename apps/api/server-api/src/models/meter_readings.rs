use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, ColumnTrait, ActiveValue, QueryOrder};
use uuid::Uuid;
use axum::http::StatusCode;
use crate::views::meters::{RecordReadingParams, MeterReadingResponse};
use rust_decimal::Decimal;

pub use super::_entities::meter_readings::{ActiveModel, Model, Entity};
pub type MeterReadings = Entity;

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {}

impl Model {
    pub async fn list_by_meter(db: &DatabaseConnection, meter_id: Uuid) -> Result<Vec<MeterReadingResponse>> {
        let readings: Vec<super::_entities::meter_readings::Model> = MeterReadings::find()
            .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(meter_id))
            .order_by_desc(crate::models::_entities::meter_readings::Column::ReadingDate)
            .all(db)
            .await?;
        Ok(readings.into_iter().map(MeterReadingResponse::from).collect())
    }

    pub async fn record_reading(
        db: &DatabaseConnection,
        meter_id: Uuid,
        user_id: Uuid,
        params: RecordReadingParams,
    ) -> Result<std::result::Result<MeterReadingResponse, (StatusCode, &'static str)>> {
        // Validate that reading date is not in the future
        if let Some(date) = params.reading_date {
            if date > chrono::Utc::now() {
                return Ok(Err((StatusCode::BAD_REQUEST, "FUTURE_DATE_NOT_ALLOWED")));
            }
        }

        // 1. Fetch the meter to get its initial_reading if needed
        let meter = crate::models::_entities::meters::Entity::find_by_id(meter_id)
            .one(db)
            .await?
            .ok_or_else(|| Error::NotFound)?;

        // 2. Fetch the latest SUBMITTED reading for continuity and constraints
        let last_submitted = MeterReadings::find()
            .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(meter_id))
            .filter(crate::models::_entities::meter_readings::Column::Status.eq("SUBMITTED"))
            .order_by_desc(crate::models::_entities::meter_readings::Column::ReadingDate)
            .one(db)
            .await?;

        let prev_value = last_submitted
            .and_then(|r| r.reading_value)
            .unwrap_or(meter.initial_reading);

        if params.reading_value < prev_value {
            return Ok(Err((StatusCode::BAD_REQUEST, "READING_DECREASED")));
        }

        let usage_delta = params.reading_value - prev_value;
        let reading_date = params.reading_date.unwrap_or_else(chrono::Utc::now);

        // 3. Look for a PENDING record for this meter and period
        let pending_record = if let Some(period) = &params.period_month {
            MeterReadings::find()
                .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(meter_id))
                .filter(crate::models::_entities::meter_readings::Column::PeriodMonth.eq(period))
                .filter(crate::models::_entities::meter_readings::Column::Status.eq("PENDING"))
                .one(db)
                .await?
        } else {
            None
        };

        let result_model = if let Some(pending) = pending_record {
            // Update existing PENDING record
            let mut active: ActiveModel = pending.into();
            active.reading_value = ActiveValue::Set(Some(params.reading_value));
            active.reading_date = ActiveValue::Set(Some(reading_date.into()));
            active.image_url = ActiveValue::Set(params.image_url);
            active.tenant_id = ActiveValue::Set(Some(user_id));
            active.usage = ActiveValue::Set(Some(usage_delta));
            active.status = ActiveValue::Set("SUBMITTED".to_string());
            active.update(db).await?
        } else {
            // Create new SUBMITTED record
            let active = ActiveModel {
                id: ActiveValue::Set(Uuid::new_v4()),
                meter_id: ActiveValue::Set(meter_id),
                reading_value: ActiveValue::Set(Some(params.reading_value)),
                reading_date: ActiveValue::Set(Some(reading_date.into())),
                image_url: ActiveValue::Set(params.image_url),
                tenant_id: ActiveValue::Set(Some(user_id)),
                usage: ActiveValue::Set(Some(usage_delta)),
                period_month: ActiveValue::Set(params.period_month),
                status: ActiveValue::Set("SUBMITTED".to_string()),
                created_at: ActiveValue::Set(chrono::Utc::now().into()),
                ..Default::default()
            };
            active.insert(db).await?
        };

        // --- Auto-completion logic for meter_requests ---
        let room_id = meter.room_id;

        // Find PENDING or LATE requests for this room
        let pending_requests = crate::models::_entities::meter_requests::Entity::find()
            .filter(crate::models::_entities::meter_requests::Column::RoomId.eq(room_id))
            .filter(
                crate::models::_entities::meter_requests::Column::Status
                    .is_in(vec!["PENDING", "LATE"]),
            )
            .all(db)
            .await?;

        for req in pending_requests {
            // Check if ALL meters in this room have a SUBMITTED reading for this period
            let room_meters = crate::models::_entities::meters::Entity::find()
                .filter(crate::models::_entities::meters::Column::RoomId.eq(room_id))
                .filter(crate::models::_entities::meters::Column::Status.eq("ACTIVE"))
                .all(db)
                .await?;

            let mut all_submitted = true;
            for rm in room_meters {
                let has_reading = crate::models::_entities::meter_readings::Entity::find()
                    .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(rm.id))
                    .filter(crate::models::_entities::meter_readings::Column::PeriodMonth.eq(&req.period_month))
                    .filter(crate::models::_entities::meter_readings::Column::Status.eq("SUBMITTED"))
                    .one(db)
                    .await?;

                if has_reading.is_none() {
                    all_submitted = false;
                    break;
                }
            }

            if all_submitted {
                let mut req_active: crate::models::_entities::meter_requests::ActiveModel =
                    req.into();
                req_active.status = ActiveValue::Set("SUBMITTED".to_string());
                req_active.updated_at = ActiveValue::Set(chrono::Utc::now().into());
                req_active.update(db).await?;
            }
        }
        // --- End of auto-completion logic ---

        Ok(Ok(MeterReadingResponse::from(result_model)))
    }

    pub async fn list_landlord_readings(
        db: &DatabaseConnection,
        landlord_id: Uuid,
        building_id: Option<Uuid>,
        period_month: Option<String>,
    ) -> Result<Vec<crate::views::meters::LandlordMeterReadingDetail>> {
        use crate::models::_entities::{buildings, meter_readings, meters, rooms, services};
        use sea_orm::{FromQueryResult, QuerySelect, RelationTrait};

        #[derive(FromQueryResult)]
        struct ReadingQueryResult {
            id: Uuid,
            meter_id: Uuid,
            room_code: String,
            building_name: String,
            service_name: String,
            service_unit: String,
            reading_value: Option<Decimal>,
            usage: Option<Decimal>,
            reading_date: Option<DateTimeWithTimeZone>,
            period_month: Option<String>,
            image_url: Option<String>,
            status: String,
        }

        let mut query = MeterReadings::find()
            .join(
                sea_orm::JoinType::InnerJoin,
                meter_readings::Relation::Meters.def(),
            )
            .join(sea_orm::JoinType::InnerJoin, meters::Relation::Rooms.def())
            .join(sea_orm::JoinType::InnerJoin, rooms::Relation::Buildings.def())
            .join(
                sea_orm::JoinType::InnerJoin,
                meters::Relation::Services.def(),
            )
            .filter(buildings::Column::OwnerId.eq(landlord_id));

        if let Some(bid) = building_id {
            query = query.filter(buildings::Column::Id.eq(bid));
        }

        if let Some(period) = period_month {
            query = query.filter(meter_readings::Column::PeriodMonth.eq(period));
        }

        let results = query
            .select_only()
            .column_as(meter_readings::Column::Id, "id")
            .column_as(meter_readings::Column::MeterId, "meter_id")
            .column_as(rooms::Column::Code, "room_code")
            .column_as(buildings::Column::Name, "building_name")
            .column_as(services::Column::Name, "service_name")
            .column_as(services::Column::Unit, "service_unit")
            .column(meter_readings::Column::ReadingValue)
            .column(meter_readings::Column::Usage)
            .column(meter_readings::Column::ReadingDate)
            .column(meter_readings::Column::PeriodMonth)
            .column(meter_readings::Column::ImageUrl)
            .column(meter_readings::Column::Status)
            .order_by_desc(meter_readings::Column::CreatedAt) // Order by creation time
            .into_model::<ReadingQueryResult>()
            .all(db)
            .await?;

        Ok(results
            .into_iter()
            .map(|r| crate::views::meters::LandlordMeterReadingDetail {
                id: r.id,
                meter_id: r.meter_id,
                room_code: r.room_code,
                building_name: r.building_name,
                service_name: r.service_name,
                service_unit: r.service_unit,
                reading_value: r.reading_value,
                usage: r.usage,
                reading_date: r.reading_date.map(|d| d.into()),
                period_month: r.period_month,
                image_url: r.image_url,
                status: r.status,
            })
            .collect())
    }

    pub async fn submit_ocr_reading(
        ctx: &AppContext,
        meter_id: Uuid,
        user_id: Uuid,
        params: crate::views::meters::OcrReadingParams,
    ) -> Result<MeterReadingResponse> {
        let db = &ctx.db;

        // 1. Check for existing PENDING or SUBMITTED record for this meter and period
        let pending_record = if let Some(period) = &params.period_month {
            MeterReadings::find()
                .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(meter_id))
                .filter(crate::models::_entities::meter_readings::Column::PeriodMonth.eq(period))
                .filter(
                    crate::models::_entities::meter_readings::Column::Status
                        .is_in(vec!["PENDING", "SUBMITTED"]),
                )
                .one(db)
                .await?
        } else {
            None
        };

        let model = if let Some(pending) = pending_record {
            // Update existing record with new image and reset status to PENDING for re-processing
            let mut active: ActiveModel = pending.into();
            active.image_url = ActiveValue::Set(Some(params.image_url));
            active.tenant_id = ActiveValue::Set(Some(user_id));
            active.status = ActiveValue::Set("PENDING".to_string());
            active.update(db).await?
        } else {
            // Create a new PENDING record
            let active = ActiveModel {
                id: ActiveValue::Set(Uuid::new_v4()),
                meter_id: ActiveValue::Set(meter_id),
                image_url: ActiveValue::Set(Some(params.image_url)),
                tenant_id: ActiveValue::Set(Some(user_id)),
                period_month: ActiveValue::Set(params.period_month),
                status: ActiveValue::Set("PENDING".to_string()),
                created_at: ActiveValue::Set(chrono::Utc::now().into()),
                ..Default::default()
            };
            active.insert(db).await?
        };
        let reading_id = model.id;

        // 2. Enqueue the worker
        let args = crate::workers::meter_reading_worker::MeterReadingWorkerArgs {
            reading_id,
        };
        crate::workers::meter_reading_worker::MeterReadingWorker::perform_later(ctx, args).await?;

        Ok(MeterReadingResponse::from(model))
    }
}
