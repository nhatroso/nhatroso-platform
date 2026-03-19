use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::NaiveDate;

#[derive(Clone, Debug, Deserialize)]
pub struct CreatePriceRuleParams {
    pub room_id: Option<Uuid>,
    pub building_id: Option<Uuid>,
    pub service_id: Uuid,
    pub unit_price: Decimal,
    pub effective_start: NaiveDate,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdatePriceRuleParams {
    pub unit_price: Option<Decimal>,
    pub effective_start: Option<NaiveDate>,
}

#[derive(Clone, Debug, Serialize)]
pub struct PriceRuleResponse {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub room_id: Option<Uuid>,
    pub building_id: Option<Uuid>,
    pub service_id: Uuid,
    pub unit_price: Decimal,
    pub effective_start: NaiveDate,
    pub effective_end: Option<NaiveDate>,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
}

impl From<crate::models::_entities::price_rules::Model> for PriceRuleResponse {
    fn from(model: crate::models::_entities::price_rules::Model) -> Self {
        Self {
            id: model.id,
            owner_id: model.owner_id,
            room_id: model.room_id,
            building_id: model.building_id,
            service_id: model.service_id,
            unit_price: model.unit_price,
            effective_start: model.effective_start,
            effective_end: model.effective_end,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}
