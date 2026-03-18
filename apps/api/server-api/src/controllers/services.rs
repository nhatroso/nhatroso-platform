use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;
use uuid::Uuid;

use crate::{
    dto::services::{CreateServiceParams, UpdateServiceParams},
    services::services::ServiceService,
    utils::{auth, error::error_response},
};

pub async fn create(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateServiceParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match ServiceService::create(&ctx.db, owner_id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    let response = ServiceService::list(&ctx.db).await?;
    format::json(response)
}

pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateServiceParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match ServiceService::update(&ctx.db, owner_id, id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn archive(
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    match ServiceService::archive(&ctx.db, id).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/services")
        .add("/", post(create))
        .add("/", get(list))
        .add("/{id}", patch(update))
        .add("/{id}/archive", post(archive))
}
