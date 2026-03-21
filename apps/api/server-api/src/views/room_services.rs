use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;

#[derive(Clone, Debug, Deserialize)]
pub struct AssignServiceParams {
    pub service_id: Uuid,
    pub price_rule_id: Option<Uuid>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateAssignedServiceParams {
    pub price_rule_id: Option<Uuid>,
    pub is_active: Option<bool>,
}

#[derive(Clone, Debug, Serialize)]
pub struct RoomServiceResponse {
    pub id: Uuid,
    pub room_id: Uuid,
    pub service_id: Uuid,
    pub price_rule_id: Option<Uuid>,
    pub is_active: bool,
    pub service_name: String,
    pub unit: String,
    pub unit_price: Option<Decimal>,
    pub rule_name: Option<String>,
}
