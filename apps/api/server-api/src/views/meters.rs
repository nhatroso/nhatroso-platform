use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, Utc};
use crate::models::_entities::{meters, meter_readings, services};

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
    pub period_month: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OcrReadingParams {
    pub image_url: String,
    pub period_month: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MeterResponse {
    pub id: Uuid,
    pub room_id: Uuid,
    pub service_id: Uuid,
    pub service_name: Option<String>,
    pub service_unit: Option<String>,
    pub serial_number: Option<String>,
    pub initial_reading: Decimal,
    pub latest_reading: Option<Decimal>,
    pub latest_reading_date: Option<DateTime<Utc>>,
    pub latest_reading_period: Option<String>,
    pub latest_reading_status: Option<String>,
    pub latest_reading_error: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MeterReadingResponse {
    pub id: Uuid,
    pub meter_id: Uuid,
    pub reading_value: Option<Decimal>,
    pub reading_date: Option<DateTime<Utc>>,
    pub image_url: Option<String>,
    pub usage: Option<Decimal>,
    pub tenant_id: Option<Uuid>,
    pub period_month: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

impl MeterResponse {
    pub fn from_model(m: meters::Model, s: Option<services::Model>) -> Self {
        Self {
            id: m.id,
            room_id: m.room_id,
            service_id: m.service_id,
            service_name: s.as_ref().map(|x| x.name.clone()),
            service_unit: s.as_ref().map(|x| x.unit.clone()),
            serial_number: m.serial_number,
            initial_reading: m.initial_reading,
            latest_reading: None,
            latest_reading_date: None,
            latest_reading_period: None,
            latest_reading_status: None,
            latest_reading_error: None,
            status: m.status,
            created_at: m.created_at.into(),
            updated_at: m.updated_at.into(),
        }
    }
}

impl From<meters::Model> for MeterResponse {
    fn from(m: meters::Model) -> Self {
        Self {
            id: m.id,
            room_id: m.room_id,
            service_id: m.service_id,
            service_name: None,
            service_unit: None,
            serial_number: m.serial_number,
            initial_reading: m.initial_reading,
            latest_reading: None,
            latest_reading_date: None,
            latest_reading_period: None,
            latest_reading_status: None,
            latest_reading_error: None,
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
            reading_date: m.reading_date.map(|d| d.into()),
            image_url: m.image_url,
            usage: m.usage,
            tenant_id: m.tenant_id,
            period_month: m.period_month,
            status: m.status,
            created_at: m.created_at.into(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LandlordMeterSummary {
    pub total_meters: u64,
    pub pending_readings: u64,
    pub overdue_readings: u64,
    pub submission_rate: f32, // Percentage
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LandlordMeterDetail {
    pub id: Uuid,
    pub room_id: Uuid,
    pub room_code: String,
    pub building_id: Uuid,
    pub building_name: String,
    pub service_name: String,
    pub service_unit: String,
    pub serial_number: Option<String>,
    pub status: String, // SUBMITTED, PENDING, OVERDUE
    pub last_reading: Option<Decimal>,
    pub last_reading_date: Option<DateTime<Utc>>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LandlordListParams {
    pub building_id: Option<Uuid>,
    pub period_month: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UpdateMeterStatusParams {
    pub status: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LandlordMeterReadingDetail {
    pub id: Uuid,
    pub meter_id: Uuid,
    pub room_code: String,
    pub building_name: String,
    pub service_name: String,
    pub service_unit: String,
    pub reading_value: Option<Decimal>,
    pub usage: Option<Decimal>,
    pub reading_date: Option<DateTime<Utc>>,
    pub period_month: Option<String>,
    pub image_url: Option<String>,
    pub status: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LandlordReadingsParams {
    pub building_id: Option<Uuid>,
    pub period_month: Option<String>,
}
