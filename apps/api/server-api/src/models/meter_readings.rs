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

    pub async fn record_reading(db: &DatabaseConnection, meter_id: Uuid, params: RecordReadingParams) -> Result<std::result::Result<MeterReadingResponse, (StatusCode, &'static str)>> {
        // Validate that reading date is not in the future
        if let Some(date) = params.reading_date {
            if date > chrono::Utc::now() {
                return Ok(Err((StatusCode::BAD_REQUEST, "FUTURE_DATE_NOT_ALLOWED")));
            }
        }

        let reading = ActiveModel {
            meter_id: ActiveValue::Set(meter_id),
            reading_value: ActiveValue::Set(params.reading_value),
            reading_date: ActiveValue::Set(params.reading_date.unwrap_or_else(chrono::Utc::now).into()),
            image_url: ActiveValue::Set(params.image_url),
            ..Default::default()
        };

        let inserted = reading.insert(db).await?;
        Ok(Ok(MeterReadingResponse::from(inserted)))
    }
}
