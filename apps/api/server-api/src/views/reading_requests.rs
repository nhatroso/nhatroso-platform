use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::models::_entities::reading_requests;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateReadingRequestParams {
    pub building_id: Uuid,
    pub month: i32,
    pub year: i32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ReadingRequestResponse {
    pub id: Uuid,
    pub building_id: Uuid,
    pub landlord_id: Uuid,
    pub month: i32,
    pub year: i32,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
}

impl From<reading_requests::Model> for ReadingRequestResponse {
    fn from(model: reading_requests::Model) -> Self {
        Self {
            id: model.id,
            building_id: model.building_id,
            landlord_id: model.landlord_id,
            month: model.month,
            year: model.year,
            status: model.status,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}
