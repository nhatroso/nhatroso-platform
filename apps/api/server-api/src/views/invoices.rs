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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateInvoiceParams {
    pub room_code: Option<String>,
    pub tenant_name: Option<String>,
    pub details: Vec<InvoiceDetailParams>,
    pub total_amount: Option<Decimal>,
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

#[derive(Serialize)]
pub struct InvoiceResponse {
    #[serde(flatten)]
    pub invoice: InvoiceModel,
    pub details: Vec<DetailModel>,
    pub histories: Vec<HistoryModel>,
}
