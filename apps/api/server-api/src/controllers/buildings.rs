use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;
use uuid::Uuid;

use crate::{
    dto::buildings::{CreateBuildingParams, UpdateBuildingParams},
    services::buildings::BuildingService,
    utils::{auth, error::error_response},
};

pub async fn create(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateBuildingParams>,
) -> Result<Response> {
    if params.name.trim().is_empty() {
        return error_response("REQUIRED_FIELD_MISSING", axum::http::StatusCode::BAD_REQUEST);
    }

    let owner_id = auth::get_user_id(&auth)?;
    let res = BuildingService::create(&ctx.db, owner_id, params).await?;
    format::json(res)
}

pub async fn list(auth: JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    let items = BuildingService::list(&ctx.db, owner_id).await?;
    format::json(items)
}

pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateBuildingParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    
    match BuildingService::update(&ctx.db, owner_id, id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn archive(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    
    match BuildingService::archive(&ctx.db, owner_id, id).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/buildings")
        .add("/", post(create))
        .add("/", get(list))
        .add("/{id}", patch(update))
        .add("/{id}/archive", post(archive))
}
