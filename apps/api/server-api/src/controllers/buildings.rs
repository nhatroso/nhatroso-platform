#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]

use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use serde::Deserialize;
use utoipa::ToSchema;
use axum::{http::StatusCode, response::IntoResponse};
use uuid::Uuid;

use crate::models::{
    _entities::buildings::{ActiveModel, Column, Entity as Buildings},
    _entities::rooms::{Column as RoomsColumn, Entity as Rooms},
};
use loco_rs::controller::extractor::auth::JWT;

// Reuse standard error response helper
fn error_response(code: &str, status: StatusCode) -> Result<Response> {
    Ok((
        status,
        Json(serde_json::json!({
            "success": false,
            "error": {
                "code": code
            }
        }))
    ).into_response())
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct CreateBuildingParams {
    pub name: String,
    pub address: Option<String>,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct UpdateBuildingParams {
    pub name: Option<String>,
    pub address: Option<String>,
}

#[utoipa::path(
    post,
    path = "/api/buildings",
    request_body = CreateBuildingParams,
    security(("bearer_auth" = [])),
    responses((status = 201, description = "Building created successfully")),
    tag = "Property"
)]
pub async fn create(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateBuildingParams>,
) -> Result<Response> {
    if params.name.trim().is_empty() {
        return error_response("REQUIRED_FIELD_MISSING", StatusCode::BAD_REQUEST);
    }

    let owner_id = Uuid::parse_str(&auth.claims.pid).map_err(|_| Error::Message("Invalid UUID".to_string()))?;
    let item = ActiveModel {
        id: ActiveValue::Set(Uuid::new_v4()),
        owner_id: ActiveValue::Set(owner_id),
        name: ActiveValue::Set(params.name),
        address: ActiveValue::Set(params.address),
        status: ActiveValue::Set("ACTIVE".to_string()),
        created_at: ActiveValue::Set(chrono::Utc::now().into()),
        updated_at: ActiveValue::Set(chrono::Utc::now().into()),
    };

    let res = item.insert(&ctx.db).await?;
    format::json(res)
}

#[utoipa::path(
    get,
    path = "/api/buildings",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "List of buildings")),
    tag = "Property"
)]
pub async fn list(auth: JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid).map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let items = Buildings::find()
        .filter(Column::OwnerId.eq(owner_id))
        .filter(Column::Status.ne("ARCHIVED")) // Optionally filter, defaults to all active/non-archived typically, or can return all
        .all(&ctx.db)
        .await?;

    format::json(items)
}

#[utoipa::path(
    patch,
    path = "/api/buildings/{id}",
    request_body = UpdateBuildingParams,
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Building updated successfully"),
        (status = 404, description = "Building not found"),
        (status = 409, description = "Building is archived")
    ),
    tag = "Property"
)]
pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateBuildingParams>,
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid).map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let building = Buildings::find()
        .filter(Column::Id.eq(id))
        .filter(Column::OwnerId.eq(owner_id))
        .one(&ctx.db)
        .await?;

    let building = match building {
        Some(b) => b,
        None => return error_response("BUILDING_NOT_FOUND", StatusCode::NOT_FOUND),
    };

    if building.status == "ARCHIVED" {
        return error_response("RESOURCE_ARCHIVED", StatusCode::CONFLICT);
    }

    let mut active_model: ActiveModel = building.into();
    if let Some(name) = params.name {
        if !name.trim().is_empty() {
             active_model.name = ActiveValue::Set(name);
        }
    }
    if let Some(address) = params.address {
        active_model.address = ActiveValue::Set(Some(address));
    }

    let res = active_model.update(&ctx.db).await?;
    format::json(res)
}

#[utoipa::path(
    post,
    path = "/api/buildings/{id}/archive",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Building archived successfully"),
        (status = 404, description = "Building not found"),
        (status = 409, description = "Building has active rooms")
    ),
    tag = "Property"
)]
pub async fn archive(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid).map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let building = Buildings::find()
        .filter(Column::Id.eq(id))
        .filter(Column::OwnerId.eq(owner_id))
        .one(&ctx.db)
        .await?;

    let building = match building {
        Some(b) => b,
        None => return error_response("BUILDING_NOT_FOUND", StatusCode::NOT_FOUND),
    };

    // Check if any room is OCCUPIED or DEPOSITED
    let active_rooms = Rooms::find()
        .filter(RoomsColumn::BuildingId.eq(id))
        .filter(RoomsColumn::Status.is_in(["OCCUPIED", "DEPOSITED"]))
        .all(&ctx.db)
        .await?;

    if !active_rooms.is_empty() {
        return error_response("BUILDING_HAS_ACTIVE_ROOMS", StatusCode::CONFLICT);
    }

    let mut active_model: ActiveModel = building.into();
    active_model.status = ActiveValue::Set("ARCHIVED".to_string());

    let res = active_model.update(&ctx.db).await?;
    format::json(res)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/buildings")
        .add("/", post(create))
        .add("/", get(list))
        .add("/{id}", patch(update))
        .add("/{id}/archive", post(archive))
}
