use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize)]
pub struct CreateServiceParams {
    pub name: String,
    pub unit: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateServiceParams {
    pub name: Option<String>,
    pub unit: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct ServiceResponse {
    pub id: Uuid,
    pub name: String,
    pub unit: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
}

impl From<crate::models::_entities::services::Model> for ServiceResponse {
    fn from(model: crate::models::_entities::services::Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            unit: model.unit,
            status: model.status,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}
