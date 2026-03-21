use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;

#[derive(Clone, Debug, Deserialize)]
pub struct CreatePriceRuleParams {
    pub service_id: Uuid,
    pub unit_price: Decimal,
    pub name: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdatePriceRuleParams {
    pub unit_price: Option<Decimal>,
    pub name: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct PriceRuleResponse {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub service_id: Uuid,
    pub unit_price: Decimal,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
}

impl From<crate::models::_entities::price_rules::Model> for PriceRuleResponse {
    fn from(model: crate::models::_entities::price_rules::Model) -> Self {
        Self {
            id: model.id,
            owner_id: model.owner_id,
            service_id: model.service_id,
            unit_price: model.unit_price,
            name: model.name,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}
