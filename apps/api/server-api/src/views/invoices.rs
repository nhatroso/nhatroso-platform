use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::_entities::{
    invoice_details::Model as DetailModel, invoice_status_histories::Model as HistoryModel,
    invoices::Model as InvoiceModel,
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct InvoiceDetailParams {
    pub description: String,
    pub amount: Decimal,
}

#[derive(Clone, Debug, Deserialize, Default)]
pub struct InvoiceListParams {
    pub status: Option<String>,
    pub page: Option<u64>,
    pub limit: Option<u64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateInvoiceParams {
    pub room_id: Option<Uuid>,
    pub room_code: Option<String>,
    pub tenant_name: Option<String>,
    pub details: Vec<InvoiceDetailParams>,
    pub total_amount: Option<Decimal>,
    pub grace_days: Option<i32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VoidInvoiceParams {
    pub reason: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CalculateInvoiceParams {
    pub room_id: Uuid,
    pub period_month: String, // YYYY-MM
}

#[derive(Serialize)]
pub struct InvoiceCalculationResponse {
    pub room_code: String,
    pub tenant_name: String,
    pub details: Vec<InvoiceDetailParams>,
    pub total_amount: Decimal,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SePayWebhookPayload {
    pub id: i64,
    pub gateway: String,
    #[serde(rename = "transactionDate")]
    pub transaction_date: String,
    #[serde(rename = "accountNumber")]
    pub account_number: String,
    pub content: String,
    #[serde(rename = "transferType")]
    pub transfer_type: String,
    #[serde(rename = "transferAmount")]
    pub transfer_amount: Decimal,
    pub accumulated: Decimal,
    pub code: Option<String>,
    #[serde(rename = "subAccount")]
    pub sub_account: Option<String>,
    pub reference_code: Option<String>,
    pub description: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AutomationWebhookPayload {
    pub event: String,
    pub invoice_id: String,
    pub amount: Decimal,
    pub status: String,
}

#[derive(Serialize)]
pub struct InvoiceResponse {
    #[serde(flatten)]
    pub invoice: InvoiceModel,
    pub details: Vec<DetailModel>,
    pub histories: Vec<HistoryModel>,
}

#[derive(Serialize)]
pub struct WsTicketResponse {
    pub token: String,
}
