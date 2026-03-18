use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sea_orm::FromQueryResult;

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
    pub room_code: String,
    pub status: String,
    pub floor_name: Option<String>,
}
