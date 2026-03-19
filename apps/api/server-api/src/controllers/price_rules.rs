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
    State(ctx): State<AppContext>,
    Json(params): Json<CreatePriceRuleParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match PriceRule::create_rule(&ctx.db, owner_id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list_by_room(
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let response = PriceRule::list_by_room(&ctx.db, room_id).await?;
    format::json(response)
}

pub async fn list_by_building(
    Path(building_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let response = PriceRule::list_by_building(&ctx.db, building_id).await?;
    format::json(response)
}

pub async fn list_owner_defaults(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    let response = PriceRule::list_by_owner_defaults(&ctx.db, owner_id).await?;
    format::json(response)
}

pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdatePriceRuleParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match PriceRule::update_rule(&ctx.db, owner_id, id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn remove(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match PriceRule::remove_rule(&ctx.db, owner_id, id).await? {
        Ok(deleted) => format::json(serde_json::json!({ "success": true, "deleted": deleted })),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/v1/price-rules")
        .add("/", post(create))
        .add("/defaults", get(list_owner_defaults))
        .add("/building/{building_id}", get(list_by_building))
        .add("/room/{room_id}", get(list_by_room))
        .add("/{id}", patch(update).delete(remove))
}
