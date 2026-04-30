use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::{extract::Path, extract::Query, Json, extract::State};
use serde::{Deserialize, Serialize};

use crate::{
    models::{
        payments::{Model as PaymentModel, PaymentStatus},
        invoices::Model as InvoiceModel,
    },
    utils::{
        auth,
        error::error_response,
        payment_hub::{PAYMENT_HUB, PaymentEvent}
    },
};
use axum::extract::ws::{WebSocketUpgrade, WebSocket, Message};
use std::collections::HashMap;
use sea_orm::{ActiveModelTrait, ActiveValue};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreatePaymentParams {
    pub invoice_id: i32,
    pub amount: Decimal,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PaymentResponse {
    pub transaction_id: String,
    pub token: String,
    pub payment_url: String,
}

pub async fn create_payment(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreatePaymentParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    // 1. Verify invoice access
    let _invoice = match InvoiceModel::get_one(&ctx.db, params.invoice_id, owner_id).await {
        Ok(i) => i,
        Err(_) => return error_response("UNAUTHORIZED", axum::http::StatusCode::UNAUTHORIZED),
    };

    // 2. Create pending payment record
    let payment = PaymentModel::create(&ctx.db, params.invoice_id, params.amount, 15).await?;

    format::json(PaymentResponse {
        payment_url: format!("https://mock-gateway.com/pay/{}", payment.transaction_id),
        transaction_id: payment.transaction_id,
        token: payment.token,
    })
}

pub async fn get_payment_status(
    auth: JWT,
    Path(token): Path<String>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let _owner_id = auth::get_user_id(&auth)?;

    let payment = match PaymentModel::find_by_token(&ctx.db, &token).await? {
        Some(p) => p,
        None => return error_response("NOT_FOUND", axum::http::StatusCode::NOT_FOUND),
    };

    format::json(serde_json::json!({ "status": payment.status }))
}

pub async fn subscribe_payment(
    ws: WebSocketUpgrade,
    Query(params): Query<HashMap<String, String>>,
    State(ctx): State<AppContext>,
) -> impl axum::response::IntoResponse {
    let token = match params.get("token") {
        Some(t) => t,
        None => return error_response("MISSING_TOKEN", axum::http::StatusCode::BAD_REQUEST),
    };

    let payment_opt: Option<PaymentModel> = match PaymentModel::find_by_token(&ctx.db, token).await {
        Ok(p) => p,
        Err(e) => {
            tracing::error!(error = ?e, "Database error during token validation");
            return error_response("INTERNAL_ERROR", axum::http::StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Validate token
    match payment_opt {
        Some(payment) if payment.status == PaymentStatus::Pending.to_string() => {
            // Check expiry
            let now: chrono::DateTime<chrono::FixedOffset> = chrono::Utc::now().into();
            if payment.expired_at < now {
                 return error_response("TOKEN_EXPIRED", axum::http::StatusCode::UNAUTHORIZED);
            }

            let invoice_id = payment.invoice_id;
            Ok(ws.on_upgrade(move |socket| handle_socket(socket, invoice_id)))
        }
        _ => error_response("INVALID_TOKEN", axum::http::StatusCode::UNAUTHORIZED),
    }
}

async fn handle_socket(mut socket: WebSocket, invoice_id: i32) {
    let mut rx = PAYMENT_HUB.subscribe();
    let timeout_duration = tokio::time::Duration::from_secs(600); // 10 minutes limit

    let _ = tokio::time::timeout(timeout_duration, async move {
        while let Ok(event) = rx.recv().await {
            match event {
                PaymentEvent::Success { invoice_id: ev_id } if ev_id == invoice_id => {
                    let msg = serde_json::json!({ "status": "SUCCESS", "invoice_id": ev_id }).to_string();
                    if socket.send(Message::from(msg)).await.is_err() {
                        break;
                    }
                }
                _ => {}
            }
        }
    }).await;
}

use regex::Regex;

pub async fn sepay_webhook(
    State(ctx): State<AppContext>,
    Json(payload): Json<crate::views::invoices::SePayWebhookPayload>,
) -> Result<Response> {
    // 1. Extract transaction_id using Regex (Looking for NHATROSO-?XXXXXXXX)
    let re = Regex::new(r"(?i)NHATROSO-?([A-Z0-9]{8})").unwrap();

    let transaction_id = payload.code.as_deref()
        .and_then(|c| re.find(c))
        .map(|m| m.as_str().replace("-", "").to_uppercase())
        .or_else(|| {
             re.find(&payload.content)
               .map(|m| m.as_str().replace("-", "").to_uppercase())
        });

    let tid = match transaction_id {
        Some(id) => id,
        None => {
            tracing::warn!(
                content = %payload.content,
                code = ?payload.code,
                "Could not find PAY-ID in webhook payload"
            );
            return error_response("PAYMENT_NOT_FOUND", axum::http::StatusCode::NOT_FOUND);
        }
    };

    tracing::info!(transaction_id = %tid, "Extracted transaction ID from webhook");

    let payment_opt = PaymentModel::find_by_transaction_id(&ctx.db, &tid).await?;

    let payment = match payment_opt {
        Some(p) => p,
        None => {
            return error_response("PAYMENT_NOT_FOUND", axum::http::StatusCode::NOT_FOUND);
        }
    };

    if payment.status != PaymentStatus::Pending.to_string() {
        return format::json(serde_json::json!({ "message": "Already processed" }));
    }

    // Update status
    let mut active_payment: crate::models::_entities::payments::ActiveModel = payment.clone().into();
    active_payment.status = ActiveValue::set(PaymentStatus::Completed.to_string());
    active_payment.paid_at = ActiveValue::set(Some(chrono::Utc::now().into()));
    let updated = active_payment.update(&ctx.db).await?;

    // Update invoice status too (Manual update since we don't have owner_id)
    let invoice_active = crate::models::_entities::invoices::ActiveModel {
        id: ActiveValue::set(updated.invoice_id),
        status: ActiveValue::set(Some("PAID".to_string())),
        ..Default::default()
    };
    let invoice = invoice_active.update(&ctx.db).await?;

    // Broadcast UI update
    PAYMENT_HUB.broadcast(PaymentEvent::Success { invoice_id: updated.invoice_id });

    // Send Email Notification
    let ctx_clone = ctx.clone();
    tokio::spawn(async move {
        if let Err(e) = InvoiceModel::notify_payment_success(&ctx_clone, &invoice).await {
            tracing::error!(error=?e, "Failed to send payment success notification (Payment Webhook)");
        }
    });

    format::json(serde_json::json!({ "success": true }))
}

pub async fn automation_webhook(
    _ctx: State<AppContext>,
    Json(_payload): Json<crate::views::invoices::AutomationWebhookPayload>,
) -> Result<Response> {
    // Logic for internal automation matching
    format::json(serde_json::json!({ "success": true }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/me/payments", post(create_payment))
        .add("/me/payments/status/{token}", get(get_payment_status))
        .add("/payments/webhook", post(sepay_webhook))
        .add("/payments/automation", post(automation_webhook))
        .add("/payments/ws", get(subscribe_payment))
}
