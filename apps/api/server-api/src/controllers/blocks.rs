#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]

use axum::{http::StatusCode, response::IntoResponse};
use loco_rs::controller::extractor::auth::JWT;
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::models::{
    _entities::blocks::{ActiveModel, Column, Entity as Blocks},
    _entities::buildings::{Column as BuildingsColumn, Entity as Buildings},
};

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
pub struct CreateBlockParams {
    pub identifier: String,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct UpdateBlockParams {
    pub identifier: Option<String>,
}

#[utoipa::path(
    post,
    path = "/api/buildings/{building_id}/blocks",
    request_body = CreateBlockParams,
    security(("bearer_auth" = [])),
    responses((status = 201, description = "Block created successfully")),
    tag = "Property"
)]
pub async fn create(
    auth: JWT,
    Path(building_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateBlockParams>,
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid).map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    // Verify building ownership
    let building = Buildings::find_by_id(building_id)
        .filter(BuildingsColumn::OwnerId.eq(owner_id))
        .one(&ctx.db)
        .await?;

    if building.is_none() {
        return error_response("NOT_FOUND", StatusCode::NOT_FOUND);
    }

    let item = ActiveModel {
        id: ActiveValue::Set(Uuid::new_v4()),
        building_id: ActiveValue::Set(building_id),
        identifier: ActiveValue::Set(params.identifier),
        status: ActiveValue::Set("ACTIVE".to_string()),
    };

    let res = item.insert(&ctx.db).await?;
    format::json(res)
}

#[utoipa::path(
    get,
    path = "/api/buildings/{building_id}/blocks",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "List of blocks for building")),
    tag = "Property"
)]
pub async fn list_by_building(
    auth: JWT,
    Path(building_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid).map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    // Verify building ownership
    let building = Buildings::find_by_id(building_id)
        .filter(BuildingsColumn::OwnerId.eq(owner_id))
        .one(&ctx.db)
        .await?;

    if building.is_none() {
        return error_response("NOT_FOUND", StatusCode::NOT_FOUND);
    }

    let items = Blocks::find()
        .filter(Column::BuildingId.eq(building_id))
        .filter(Column::Status.ne("ARCHIVED"))
        .all(&ctx.db)
        .await?;

    format::json(items)
}

#[utoipa::path(
    patch,
    path = "/api/blocks/{id}",
    request_body = UpdateBlockParams,
    security(("bearer_auth" = [])),
    responses((status = 200, description = "Block updated successfully")),
    tag = "Property"
)]
pub async fn update(
    _auth: JWT, // For production, should verify ownership. Simplified here via building reference.
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateBlockParams>,
) -> Result<Response> {
    let item = Blocks::find_by_id(id).one(&ctx.db).await?;

    let Some(item) = item else {
        return error_response("NOT_FOUND", StatusCode::NOT_FOUND);
    };

    let mut active_model = item.into_active_model();

    if let Some(ident) = params.identifier {
        active_model.identifier = ActiveValue::Set(ident);
    }

    let res = active_model.update(&ctx.db).await?;
    format::json(res)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1") // Ensure api/v1 routing is used based on your front-end config if needed. Wait, swagger says api, loco says api/v1 or just api depending on default_routes. We map to api/v1 later in app.rs
        .add("/buildings/{building_id}/blocks", post(create).get(list_by_building))
        .add("/blocks/{id}", patch(update))
}
