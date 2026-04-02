use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, ColumnTrait, ActiveValue, QueryOrder};
use uuid::Uuid;
use axum::http::StatusCode;
use crate::views::meters::{RecordReadingParams, MeterReadingResponse};

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

    pub async fn record_reading(db: &DatabaseConnection, meter_id: Uuid, user_id: Uuid, params: RecordReadingParams) -> Result<std::result::Result<MeterReadingResponse, (StatusCode, &'static str)>> {
        // Validate that reading date is not in the future
        if let Some(date) = params.reading_date {
            if date > chrono::Utc::now() {
                return Ok(Err((StatusCode::BAD_REQUEST, "FUTURE_DATE_NOT_ALLOWED")));
            }
        }

        // 1. Fetch the latest reading for continuity and constraints
        let last_reading = MeterReadings::find()
            .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(meter_id))
            .order_by_desc(crate::models::_entities::meter_readings::Column::ReadingDate)
            .one(db)
            .await?;

        let prev_value = last_reading.map(|r| r.reading_value).unwrap_or_else(|| rust_decimal::Decimal::from(0));

        if params.reading_value < prev_value {
            return Ok(Err((StatusCode::BAD_REQUEST, "READING_DECREASED")));
        }

        let usage_delta = params.reading_value - prev_value;

        let reading = ActiveModel {
            meter_id: ActiveValue::Set(meter_id),
            reading_value: ActiveValue::Set(params.reading_value),
            reading_date: ActiveValue::Set(params.reading_date.unwrap_or_else(chrono::Utc::now).into()),
            image_url: ActiveValue::Set(params.image_url),
            tenant_id: ActiveValue::Set(Some(user_id)),
            usage: ActiveValue::Set(usage_delta),
            period_month: ActiveValue::Set(params.period_month),
            ..Default::default()
        };

        let inserted = reading.insert(db).await?;

        // --- Auto-completion logic for meter_requests ---
        // 1. Get the meter to find the room_id
        if let Some(meter) = crate::models::_entities::meters::Entity::find_by_id(meter_id).one(db).await? {
            let room_id = meter.room_id;

            // 2. Find PENDING or LATE requests for this room
            let pending_requests = crate::models::_entities::meter_requests::Entity::find()
                .filter(crate::models::_entities::meter_requests::Column::RoomId.eq(room_id))
                .filter(crate::models::_entities::meter_requests::Column::Status.is_in(vec!["PENDING", "LATE"]))
                .all(db)
                .await?;

            for req in pending_requests {
                // Determine the start date of the period (e.g., "2026-03" -> 2026-03-01)
                if let Ok(period_start) = chrono::NaiveDate::parse_from_str(&format!("{}-01", req.period_month), "%Y-%m-%d") {
                    let period_start_dt: chrono::DateTime<chrono::FixedOffset> = chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(
                        period_start.and_hms_opt(0, 0, 0).unwrap(),
                        chrono::Utc
                    ).into();

                    // Check if ALL meters in this room have at least one reading since the period started
                    let room_meters = crate::models::_entities::meters::Entity::find()
                        .filter(crate::models::_entities::meters::Column::RoomId.eq(room_id))
                        .filter(crate::models::_entities::meters::Column::Status.eq("ACTIVE"))
                        .all(db)
                        .await?;

                    let mut all_submitted = true;
                    for rm in room_meters {
                        let has_reading = crate::models::_entities::meter_readings::Entity::find()
                            .filter(crate::models::_entities::meter_readings::Column::MeterId.eq(rm.id))
                            .filter(crate::models::_entities::meter_readings::Column::ReadingDate.gte(period_start_dt))
                            .one(db)
                            .await?;

                        if has_reading.is_none() {
                            all_submitted = false;
                            break;
                        }
                    }

                    if all_submitted {
                        let mut req_active: crate::models::_entities::meter_requests::ActiveModel = req.into();
                        req_active.status = ActiveValue::Set("SUBMITTED".to_string());
                        req_active.updated_at = ActiveValue::Set(chrono::Utc::now().into());
                        req_active.update(db).await?;
                    }
                }
            }
        }
        // --- End of auto-completion logic ---

        Ok(Ok(MeterReadingResponse::from(inserted)))
    }
}
