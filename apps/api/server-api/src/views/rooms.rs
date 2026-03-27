use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sea_orm::{FromQueryResult, prelude::Decimal};

#[derive(Clone, Debug, Deserialize)]
pub struct CreateRoomParams {
    pub code: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateRoomParams {
    pub code: Option<String>,
}

#[derive(Clone, Debug, Serialize, FromQueryResult)]
pub struct AvailableRoomResponse {
    pub id: Uuid,
    pub building_id: Uuid,
    pub building_name: String,
    pub room_address: String,
    pub code: String,
    pub status: String,
    pub floor_name: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct TenantRoomResponse {
    pub id: Uuid,
    pub building_name: String,
    pub room_address: String,
    pub code: String,
    pub floor_name: Option<String>,
    pub monthly_rent: Decimal,
    pub services: Vec<TenantRoomServiceResponse>,
}

#[derive(Clone, Debug, Serialize)]
pub struct TenantRoomServiceResponse {
    pub name: String,
    pub unit: String,
    pub unit_price: Decimal,
}
