use axum::extract::Path;
use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;
use uuid::Uuid;

use crate::{
    views::price_rules::{CreatePriceRuleParams, UpdatePriceRuleParams},
    models::price_rules::Model as PriceRule,
    utils::{auth, error::error_response},
};

pub async fn create(
    auth: JWT,
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreatePriceRuleParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match PriceRule::create_rule(&ctx.db, owner_id, room_id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list(
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let response = PriceRule::list_by_room(&ctx.db, room_id).await?;
    format::json(response)
}

pub async fn update(
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdatePriceRuleParams>,
) -> Result<Response> {
    // Assuming room_id is not strictly needed for update if ID is unique, 
    // but the original controller used room_id from path which might be a bit redundant 
    // if the ID is global. Let's keep it simple.
    match PriceRule::update_rule(&ctx.db, Uuid::nil(), id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn remove(
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    match PriceRule::remove_rule(&ctx.db, id).await? {
        Ok(deleted) => format::json(serde_json::json!({ "success": true, "deleted": deleted })),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .add("/api/v1/rooms/{room_id}/price_rules", post(create).get(list))
        .add("/api/v1/price_rules/{id}", patch(update).delete(remove))
}
