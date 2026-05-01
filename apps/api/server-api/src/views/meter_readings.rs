use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, Utc};
use crate::models::_entities::meter_readings;

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

#[derive(Clone, Debug, Deserialize, Default)]
pub struct TenantReadingsParams {
    pub r#type: Option<String>, // 'ELECTRIC' or 'WATER'
    pub from: Option<String>, // YYYY-MM-DD
    pub to: Option<String>, // YYYY-MM-DD
    pub page: Option<u64>,
    pub limit: Option<u64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TenantMeterReadingDetail {
    pub id: Uuid,
    pub meter_id: Uuid,
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
