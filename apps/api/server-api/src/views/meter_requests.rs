use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SubmitMeterParams {
    pub electric_image_url: String,
    pub water_image_url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GenerateManualParams {
    pub building_id: uuid::Uuid,
    pub period_month: String, // format "YYYY-MM"
    pub due_date: chrono::DateTime<chrono::FixedOffset>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MeterRequestView {
    pub id: uuid::Uuid,
    pub room_id: uuid::Uuid,
    pub room_code: String,
    pub period_month: String,
    pub due_date: chrono::DateTime<chrono::FixedOffset>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
}
