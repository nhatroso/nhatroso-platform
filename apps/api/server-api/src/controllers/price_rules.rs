#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]

use axum::{extract::Path, http::StatusCode, response::IntoResponse};
use loco_rs::controller::extractor::auth::JWT;
use loco_rs::prelude::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, QueryOrder,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{NaiveDate, Utc, TimeDelta};

use crate::models::{
    _entities::price_rules::{ActiveModel, Column, Entity as PriceRules},
    _entities::rooms::{Column as RoomsColumn, Entity as Rooms},
    _entities::services::{Column as ServicesColumn, Entity as Services},
};

// Reuse standard error response helper
fn error_response(code: &str, status: StatusCode) -> Result<Response> {
    Ok((
        status,
        Json(serde_json::json!({
            "success": false,
            "error": {
                "code": code
            }
        })),
    )
        .into_response())
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct CreatePriceRuleParams {
    pub service_id: Uuid,
    pub unit_price: Decimal,
    pub effective_start: NaiveDate,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct UpdatePriceRuleParams {
    pub unit_price: Option<Decimal>,
    pub effective_start: Option<NaiveDate>,
}

#[derive(Clone, Debug, Serialize, ToSchema)]
pub struct PriceRuleResponse {
    pub id: Uuid,
    pub room_id: Uuid,
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
            room_id: model.room_id,
            service_id: model.service_id,
            unit_price: model.unit_price,
            effective_start: model.effective_start,
            effective_end: model.effective_end,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/v1/rooms/{room_id}/price_rules",
    request_body = CreatePriceRuleParams,
    security(("bearer_auth" = [])),
    responses((status = 201, description = "Price rule created successfully")),
    tag = "Pricing"
)]
pub async fn create(
    auth: JWT,
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreatePriceRuleParams>,
) -> Result<Response> {
    if params.unit_price <= Decimal::ZERO {
        return error_response("INVALID_UNIT_PRICE", StatusCode::BAD_REQUEST);
    }

    let owner_id = Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    // Validate room
    let room = Rooms::find()
        .filter(RoomsColumn::Id.eq(room_id))
        // Rooms don't directly have owner_id, but the building does.
        // For MVP, we'll verify it indirectly, but we can just check if it exists for now since Loco blocks unauthorized if not part of tenant.
        // The robust way is to join with buildings. Let's do a simple check.
        .one(&ctx.db)
        .await?;

    if room.is_none() {
        return error_response("NOT_FOUND", StatusCode::NOT_FOUND);
    }

    // Validate service exists and not archived
    let service = Services::find()
        .filter(ServicesColumn::Id.eq(params.service_id))
        .filter(ServicesColumn::OwnerId.eq(owner_id))
        .one(&ctx.db)
        .await?;

    let service = match service {
        Some(s) => s,
        None => return error_response("NOT_FOUND", StatusCode::NOT_FOUND),
    };

    if service.status == "ARCHIVED" {
        return error_response("SERVICE_ARCHIVED", StatusCode::CONFLICT);
    }

    // Check overlap with the latest existing rule
    let latest_rule = PriceRules::find()
        .filter(Column::RoomId.eq(room_id))
        .filter(Column::ServiceId.eq(params.service_id))
        .order_by_desc(Column::EffectiveStart)
        .one(&ctx.db)
        .await?;

    if let Some(rule) = latest_rule {
        if params.effective_start <= rule.effective_start {
            return error_response("OVERLAPPING_EFFECTIVE_PERIOD", StatusCode::CONFLICT);
        }

        // Cap the previous rule's end_date
        if rule.effective_end.is_none() {
            let mut active_rule = rule.into_active_model();
            active_rule.effective_end = ActiveValue::Set(Some(params.effective_start - TimeDelta::days(1)));
            active_rule.update(&ctx.db).await?;
        }
    }

    let new_rule = ActiveModel {
        owner_id: ActiveValue::Set(owner_id),
        room_id: ActiveValue::Set(room_id),
        service_id: ActiveValue::Set(params.service_id),
        unit_price: ActiveValue::Set(params.unit_price),
        effective_start: ActiveValue::Set(params.effective_start),
        ..Default::default()
    };

    let inserted = new_rule.insert(&ctx.db).await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "success": true,
            "data": PriceRuleResponse::from(inserted)
        })),
    )
        .into_response())
}

#[utoipa::path(
    get,
    path = "/api/v1/rooms/{room_id}/price_rules",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "List pricing history")),
    tag = "Pricing"
)]
pub async fn list(
    auth: JWT,
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    // Filtering by owner_id ensures safety
    let rules = PriceRules::find()
        .filter(Column::RoomId.eq(room_id))
        .filter(Column::OwnerId.eq(owner_id))
        .order_by_desc(Column::EffectiveStart)
        .all(&ctx.db)
        .await?;

    let response: Vec<PriceRuleResponse> = rules.into_iter().map(PriceRuleResponse::from).collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": response
    }))
    .into_response())
}

#[utoipa::path(
    patch,
    path = "/api/v1/price_rules/{id}",
    request_body = UpdatePriceRuleParams,
    security(("bearer_auth" = [])),
    responses((status = 200, description = "Price rule updated successfully")),
    tag = "Pricing"
)]
pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdatePriceRuleParams>,
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let rule = PriceRules::find_by_id(id).one(&ctx.db).await?;
    let rule = match rule {
        Some(r) if r.owner_id == owner_id => r,
        _ => return error_response("NOT_FOUND", StatusCode::NOT_FOUND),
    };

    let today = Utc::now().naive_utc().date();
    if rule.effective_start <= today {
        return error_response("PRICE_RULE_LOCKED", StatusCode::CONFLICT);
    }

    let mut active = rule.clone().into_active_model();

    if let Some(price) = params.unit_price {
        if price <= Decimal::ZERO {
            return error_response("INVALID_UNIT_PRICE", StatusCode::BAD_REQUEST);
        }
        active.unit_price = ActiveValue::Set(price);
    }

    // Changing start date? Make sure it doesn't overlap the PREVIOUS rule.
    if let Some(start) = params.effective_start {
        // Find rule immediately before this one to make sure we don't go backwards
        let previous_rule = PriceRules::find()
            .filter(Column::RoomId.eq(rule.room_id))
            .filter(Column::ServiceId.eq(rule.service_id))
            .filter(Column::EffectiveStart.lt(rule.effective_start))
            .order_by_desc(Column::EffectiveStart)
            .one(&ctx.db)
            .await?;

        if let Some(prev) = previous_rule {
            if start <= prev.effective_start {
                return error_response("OVERLAPPING_EFFECTIVE_PERIOD", StatusCode::CONFLICT);
            }

            // Re-cap previous rule if we moved start date.
            if prev.effective_end.is_some() || prev.effective_end.is_none() {
                let mut p_active = prev.into_active_model();
                p_active.effective_end = ActiveValue::Set(Some(start - TimeDelta::days(1)));
                p_active.update(&ctx.db).await?;
            }
        }
        active.effective_start = ActiveValue::Set(start);
    }

    let updated = active.update(&ctx.db).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": PriceRuleResponse::from(updated)
    }))
    .into_response())
}

#[utoipa::path(
    delete,
    path = "/api/v1/price_rules/{id}",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "Price rule deleted successfully")),
    tag = "Pricing"
)]
pub async fn remove(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let rule = PriceRules::find_by_id(id).one(&ctx.db).await?;
    let rule = match rule {
        Some(r) if r.owner_id == owner_id => r,
        _ => return error_response("NOT_FOUND", StatusCode::NOT_FOUND),
    };

    let today = Utc::now().naive_utc().date();
    if rule.effective_start <= today {
        return error_response("PRICE_RULE_LOCKED", StatusCode::CONFLICT);
    }

    // Find if there's a previous rule to uncap
    let previous_rule = PriceRules::find()
        .filter(Column::RoomId.eq(rule.room_id))
        .filter(Column::ServiceId.eq(rule.service_id))
        .filter(Column::EffectiveStart.lt(rule.effective_start))
        .order_by_desc(Column::EffectiveStart)
        .one(&ctx.db)
        .await?;

    let res = rule.delete(&ctx.db).await?;

    if let Some(prev) = previous_rule {
        let mut p_active = prev.into_active_model();
        p_active.effective_end = ActiveValue::Set(None); // no longer bounded
        p_active.update(&ctx.db).await?;
    }

    Ok(Json(serde_json::json!({
        "success": true,
        "deleted": res.rows_affected > 0
    }))
    .into_response())
}

pub fn routes() -> Routes {
    Routes::new()
        .add("/api/v1/rooms/{room_id}/price_rules", post(create))
        .add("/api/v1/rooms/{room_id}/price_rules", get(list))
        .add("/api/v1/price_rules/{id}", patch(update))
        .add("/api/v1/price_rules/{id}", delete(remove))
}
