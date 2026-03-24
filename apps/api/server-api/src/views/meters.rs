use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, Utc};
use crate::models::_entities::{meters, meter_readings};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateMeterParams {
    pub room_id: Uuid,
    pub service_id: Uuid,
    pub serial_number: Option<String>,
    pub initial_reading: Option<Decimal>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RecordReadingParams {
    pub reading_value: Decimal,
    pub reading_date: Option<DateTime<Utc>>,
    pub image_url: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MeterResponse {
    pub id: Uuid,
    pub room_id: Uuid,
    pub service_id: Uuid,
    pub serial_number: Option<String>,
    pub initial_reading: Decimal,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MeterReadingResponse {
    pub id: Uuid,
    pub meter_id: Uuid,
    pub reading_value: Decimal,
    pub reading_date: DateTime<Utc>,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<meters::Model> for MeterResponse {
    fn from(m: meters::Model) -> Self {
        Self {
            id: m.id,
            room_id: m.room_id,
            service_id: m.service_id,
            serial_number: m.serial_number,
            initial_reading: m.initial_reading,
            status: m.status,
            created_at: m.created_at.into(),
            updated_at: m.updated_at.into(),
        }
    }
}

impl From<meter_readings::Model> for MeterReadingResponse {
    fn from(m: meter_readings::Model) -> Self {
        Self {
            id: m.id,
            meter_id: m.meter_id,
            reading_value: m.reading_value,
            reading_date: m.reading_date.into(),
            image_url: m.image_url,
            created_at: m.created_at.into(),
        }
    }
}
