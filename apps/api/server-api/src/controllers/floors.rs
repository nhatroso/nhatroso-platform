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
    _entities::blocks::Entity as Blocks,
    _entities::floors::{ActiveModel, Column, Entity as Floors},
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
pub struct CreateFloorParams {
    pub identifier: String,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct UpdateFloorParams {
    pub identifier: Option<String>,
}

#[utoipa::path(
    post,
    path = "/api/buildings/{building_id}/floors",
    request_body = CreateFloorParams,
    security(("bearer_auth" = [])),
    responses((status = 201, description = "Floor created successfully")),
    tag = "Property"
)]
pub async fn create(
    auth: JWT,
    Path(building_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateFloorParams>,
) -> Result<Response> {
    let _owner_id = Uuid::parse_str(&auth.claims.pid).map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    // 1. Find or create a default block for this building
    let default_block = Blocks::find()
        .filter(crate::models::_entities::blocks::Column::BuildingId.eq(building_id))
        .filter(crate::models::_entities::blocks::Column::Identifier.eq("Default"))
        .one(&ctx.db)
        .await?;

    let block_id = if let Some(block) = default_block {
        block.id
    } else {
        // Create it
        let new_block = crate::models::_entities::blocks::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(building_id),
            identifier: ActiveValue::Set("Default".to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
        };
        let res = new_block.insert(&ctx.db).await?;
        res.id
    };

    let item = ActiveModel {
        id: ActiveValue::Set(Uuid::new_v4()),
        building_id: ActiveValue::Set(building_id),
        block_id: ActiveValue::Set(block_id),
        identifier: ActiveValue::Set(params.identifier),
        status: ActiveValue::Set("ACTIVE".to_string()),
    };

    let res = item.insert(&ctx.db).await?;
    format::json(res)
}

#[utoipa::path(
    get,
    path = "/api/buildings/{building_id}/floors",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "List of floors for building")),
    tag = "Property"
)]
pub async fn list_by_building(
    _auth: JWT,
    Path(building_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let items = Floors::find()
        .filter(Column::BuildingId.eq(building_id))
        .filter(Column::Status.ne("ARCHIVED"))
        .all(&ctx.db)
        .await?;

    format::json(items)
}

#[utoipa::path(
    get,
    path = "/api/blocks/{block_id}/floors",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "List of floors for block")),
    tag = "Property"
)]
pub async fn list_by_block(
    _auth: JWT,
    Path(block_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let items = Floors::find()
        .filter(Column::BlockId.eq(block_id))
        .filter(Column::Status.ne("ARCHIVED"))
        .all(&ctx.db)
        .await?;

    format::json(items)
}

#[utoipa::path(
    patch,
    path = "/api/floors/{id}",
    request_body = UpdateFloorParams,
    security(("bearer_auth" = [])),
    responses((status = 200, description = "Floor updated successfully")),
    tag = "Property"
)]
pub async fn update(
    _auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateFloorParams>,
) -> Result<Response> {
    let item = Floors::find_by_id(id).one(&ctx.db).await?;

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
        .prefix("api/v1")
        .add("/buildings/{building_id}/floors", post(create).get(list_by_building))
        .add("/floors/{id}", patch(update))
}
