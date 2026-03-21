use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;
use uuid::Uuid;

use crate::{
    views::floors::{CreateFloorParams, UpdateFloorParams},
    models::floors::Model as Floor,
    utils::{auth, error::error_response},
};

pub async fn create(
    auth: JWT,
    Path(building_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateFloorParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match Floor::create_floor(&ctx.db, owner_id, building_id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list_owner_floors(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    let items = Floor::list_by_owner(&ctx.db, owner_id).await?;
    format::json(items)
}

pub async fn list_by_building(
    auth: JWT,
    Path(building_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match Floor::list_by_building(&ctx.db, owner_id, building_id).await? {
        Ok(items) => format::json(items),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateFloorParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match Floor::update_floor(&ctx.db, owner_id, id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/buildings/{building_id}/floors", post(create).get(list_by_building))
        .add("/floors", get(list_owner_floors))
        .add("/floors/{id}", patch(update))
}
