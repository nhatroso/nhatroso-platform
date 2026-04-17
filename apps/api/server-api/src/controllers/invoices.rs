use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::{extract::Path, Json};

use crate::{
    models::invoices::Model as InvoiceModel,
    views::invoices::{CalculateInvoiceParams, CreateInvoiceParams, VoidInvoiceParams},
    utils::{auth, error::error_response},
};

pub async fn create(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateInvoiceParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match InvoiceModel::create(&ctx.db, &params, owner_id).await {
        Ok(invoice) => format::json(invoice),
        Err(e) => {
            tracing::error!(error = %e, "Failed to create invoice");
            error_response("INTERNAL_SERVER_ERROR", axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn list(auth: JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match InvoiceModel::list(&ctx.db, owner_id).await {
        Ok(invoices) => format::json(invoices),
        Err(e) => {
            tracing::error!(error = %e, "Failed to list invoices");
            error_response("INTERNAL_SERVER_ERROR", axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_one(
    auth: JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match InvoiceModel::get_one(&ctx.db, id, owner_id).await {
        Ok(invoice) => format::json(invoice),
        Err(loco_rs::model::ModelError::EntityNotFound) => {
            error_response("INVOICE_NOT_FOUND", axum::http::StatusCode::NOT_FOUND)
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to get invoice");
            error_response("INTERNAL_SERVER_ERROR", axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn void_invoice(
    auth: JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(params): Json<VoidInvoiceParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    if params.reason.trim().len() < 10 {
        return error_response("VOID_REASON_REQUIRED", axum::http::StatusCode::BAD_REQUEST);
    }

    match InvoiceModel::void_invoice(&ctx.db, id, &params, owner_id).await {
        Ok(invoice) => format::json(invoice),
        Err(msg) => {
            if msg == "INVOICE_NOT_FOUND" {
                error_response("INVOICE_NOT_FOUND", axum::http::StatusCode::NOT_FOUND)
            } else if msg == "INVALID_STATUS_TRANSITION" {
                error_response("INVALID_STATUS_TRANSITION", axum::http::StatusCode::CONFLICT)
            } else {
                tracing::error!(error = msg, "Failed to void invoice");
                error_response("INTERNAL_SERVER_ERROR", axum::http::StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
    }
}

pub async fn pay_invoice(
    auth: JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match InvoiceModel::pay_invoice(&ctx.db, id, owner_id).await {
        Ok(invoice) => format::json(invoice),
        Err(msg) => {
            if msg == "INVOICE_NOT_FOUND" {
                error_response("INVOICE_NOT_FOUND", axum::http::StatusCode::NOT_FOUND)
            } else if msg == "INVALID_STATUS_TRANSITION" {
                error_response("INVALID_STATUS_TRANSITION", axum::http::StatusCode::CONFLICT)
            } else {
                tracing::error!(error = msg, "Failed to pay invoice");
                error_response("INTERNAL_SERVER_ERROR", axum::http::StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
    }
}

pub async fn calculate(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CalculateInvoiceParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match InvoiceModel::calculate_amounts(&ctx.db, &params, owner_id).await {
        Ok(res) => format::json(res),
        Err(e) => {
            tracing::error!(error = %e, "Failed to calculate invoice amounts");
            if matches!(e, loco_rs::model::ModelError::EntityNotFound) {
                error_response("ENTITY_NOT_FOUND", axum::http::StatusCode::NOT_FOUND)
            } else {
                error_response("INTERNAL_SERVER_ERROR", axum::http::StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/invoices")
        .add("/", post(create))
        .add("/", get(list))
        .add("/calculate", post(calculate))
        .add("/{id}", get(get_one))
        .add("/{id}/void", post(void_invoice))
        .add("/{id}/pay", post(pay_invoice))
}
