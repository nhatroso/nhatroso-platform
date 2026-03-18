use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::NaiveDate;

#[derive(Clone, Debug, Deserialize)]
pub struct CreateContractParams {
    pub room_id: Uuid,
    pub owner_name: String,
    pub owner_id_card: String,
    pub owner_id_card_date: NaiveDate,
    pub owner_address: String,
    pub owner_phone: String,
    pub tenant_name: String,
    pub tenant_id_card: String,
    pub tenant_id_card_date: NaiveDate,
    pub tenant_address: String,
    pub tenant_phone: String,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub monthly_rent: i32,
    pub deposit_amount: i32,
    pub payment_day: i32,
    pub rental_period: i32,
    pub room_code: String,
    pub room_address: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct ContractResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub room_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub monthly_rent: i32,
    pub deposit_amount: i32,
    pub payment_day: i32,
    pub rental_period: i32,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
    pub owner_name: Option<String>,
    pub owner_id_card: Option<String>,
    pub owner_id_card_date: Option<NaiveDate>,
    pub owner_address: Option<String>,
    pub owner_phone: Option<String>,
    pub tenant_name: Option<String>,
    pub tenant_id_card: Option<String>,
    pub tenant_id_card_date: Option<NaiveDate>,
    pub tenant_address: Option<String>,
    pub tenant_phone: Option<String>,
    pub room_code: String,
    pub room_address: String,
}
