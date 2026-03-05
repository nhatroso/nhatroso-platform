use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Debug, Deserialize, Serialize, Validate, ToSchema)]
pub struct CreateBuildingParams {
    #[validate(length(min = 1, message = "Building name cannot be empty"))]
    pub name: String,
    pub address: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, Validate, ToSchema)]
pub struct UpdateBuildingParams {
    #[validate(length(min = 1, message = "Building name cannot be empty"))]
    pub name: Option<String>,
    pub address: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, Validate, ToSchema)]
pub struct CreateFloorParams {
    pub building_id: Uuid,
    #[validate(length(min = 1, message = "Floor identifier cannot be empty"))]
    pub identifier: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, Validate, ToSchema)]
pub struct CreateRoomParams {
    pub building_id: Uuid,
    pub floor_id: Option<Uuid>,
    #[validate(length(min = 1, message = "Room identifier/code cannot be empty"))]
    pub code: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, Validate, ToSchema)]
pub struct UpdateRoomStatusParams {
    #[validate(custom(function = "validate_room_status"))]
    pub status: String,
}

fn validate_room_status(status: &str) -> Result<(), validator::ValidationError> {
    let valid_statuses = ["VACANT", "DEPOSITED", "OCCUPIED", "MAINTENANCE", "ARCHIVED"];
    if valid_statuses.contains(&status) {
        Ok(())
    } else {
        Err(
            validator::ValidationError::new("invalid_room_status").with_message(
                "Status must be VACANT, DEPOSITED, OCCUPIED, MAINTENANCE, or ARCHIVED".into(),
            ),
        )
    }
}
