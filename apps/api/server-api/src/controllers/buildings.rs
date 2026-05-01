use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;
use uuid::Uuid;

use crate::{
    views::buildings::{CreateBuildingParams, UpdateBuildingParams},
    models::buildings::Model as Building,
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
    let res = Building::create(&ctx.db, owner_id, params).await?;
    format::json(res)
}

pub async fn list(auth: JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    let items = Building::find_by_owner(&ctx.db, owner_id).await?;
    format::json(items)
}

pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateBuildingParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    
    match Building::update_building(&ctx.db, owner_id, id, params).await? {
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
    
    match Building::archive_building(&ctx.db, owner_id, id).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/landlord/buildings", post(create).get(list))
        .add("/landlord/buildings/{id}", patch(update))
        .add("/landlord/buildings/{id}/archive", post(archive))
}
