#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]

use axum::{http::StatusCode, response::IntoResponse};
use loco_rs::controller::extractor::auth::JWT;
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, RelationTrait, JoinType, QuerySelect, FromQueryResult};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::models::{
    _entities::floors::Entity as Floors,
    _entities::rooms::{ActiveModel, Column, Entity as Rooms},
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
pub struct CreateRoomParams {
    pub code: String,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct UpdateRoomParams {
    pub code: Option<String>,
}

#[derive(Clone, Debug, Serialize, ToSchema, FromQueryResult)]
pub struct AvailableRoomResponse {
    pub id: Uuid,
    pub building_id: Uuid,
    pub floor_id: Option<Uuid>,
    pub code: String,
    pub status: String,
    pub building_name: String,
    pub floor_name: Option<String>,
}

#[utoipa::path(
    post,
    path = "/api/floors/{floor_id}/rooms",
    request_body = CreateRoomParams,
    security(("bearer_auth" = [])),
    responses((status = 201, description = "Room created successfully")),
    tag = "Property"
)]
pub async fn create(
    _auth: JWT,
    Path(floor_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateRoomParams>,
) -> Result<Response> {
    let floor = Floors::find_by_id(floor_id).one(&ctx.db).await?;

    let Some(floor) = floor else {
        return error_response("NOT_FOUND", StatusCode::NOT_FOUND);
    };

    let existing = Rooms::find()
        .filter(Column::BuildingId.eq(floor.building_id))
        .filter(Column::Code.eq(&params.code))
        .one(&ctx.db)
        .await?;

    if existing.is_some() {
        return error_response("ROOM_CODE_EXISTS", StatusCode::CONFLICT);
    }

    let item = ActiveModel {
        id: ActiveValue::Set(Uuid::new_v4()),
        building_id: ActiveValue::Set(floor.building_id),
        block_id: ActiveValue::Set(floor.block_id),
        floor_id: ActiveValue::Set(Some(floor_id)),
        code: ActiveValue::Set(params.code),
        status: ActiveValue::Set("VACANT".to_string()),
        created_at: ActiveValue::Set(chrono::Utc::now().into()),
        updated_at: ActiveValue::Set(chrono::Utc::now().into()),
    };

    let res = item.insert(&ctx.db).await?;
    format::json(res)
}

#[utoipa::path(
    get,
    path = "/api/floors/{floor_id}/rooms",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "List of rooms for floor")),
    tag = "Property"
)]
pub async fn list_by_floor(
    _auth: JWT,
    Path(floor_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let items = Rooms::find()
        .filter(Column::FloorId.eq(Some(floor_id)))
        .filter(Column::Status.ne("ARCHIVED"))
        .all(&ctx.db)
        .await?;

    format::json(items)
}

#[utoipa::path(
    patch,
    path = "/api/rooms/{id}",
    request_body = UpdateRoomParams,
    security(("bearer_auth" = [])),
    responses((status = 200, description = "Room updated successfully")),
    tag = "Property"
)]
pub async fn update(
    _auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateRoomParams>,
) -> Result<Response> {
    let item = Rooms::find_by_id(id).one(&ctx.db).await?;

    let Some(item) = item else {
        return error_response("NOT_FOUND", StatusCode::NOT_FOUND);
    };

    let mut active_model = item.clone().into_active_model();

    if let Some(code) = params.code {
        let existing = Rooms::find()
            .filter(Column::BuildingId.eq(item.building_id))
            .filter(Column::Code.eq(&code))
            .filter(Column::Id.ne(id))
            .one(&ctx.db)
            .await?;

        if existing.is_some() {
            return error_response("ROOM_CODE_EXISTS", StatusCode::CONFLICT);
        }

        active_model.code = ActiveValue::Set(code);
    }

    active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());

    let res = active_model.update(&ctx.db).await?;
    format::json(res)
}

#[utoipa::path(
    get,
    path = "/api/rooms/available",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "List of available (VACANT) rooms")),
    tag = "Property"
)]
pub async fn list_available(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user_id = Uuid::parse_str(&auth.claims.pid).map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let items = Rooms::find()
        .join(JoinType::InnerJoin, crate::models::_entities::rooms::Relation::Buildings.def())
        .join(JoinType::LeftJoin, crate::models::_entities::rooms::Relation::Floors.def())
        .filter(crate::models::_entities::buildings::Column::OwnerId.eq(user_id))
        .filter(Column::Status.eq("VACANT"))
        .select_only()
        .column(Column::Id)
        .column(Column::BuildingId)
        .column(Column::FloorId)
        .column(Column::Code)
        .column(Column::Status)
        .column_as(crate::models::_entities::buildings::Column::Name, "building_name")
        .column_as(crate::models::_entities::floors::Column::Identifier, "floor_name")
        .order_by_asc(Column::Code)
        .into_model::<AvailableRoomResponse>()
        .all(&ctx.db)
        .await?;

    format::json(items)
}

#[utoipa::path(
    get,
    path = "/api/rooms/{id}",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "Room information")),
    tag = "Property"
)]
pub async fn get_by_id(
    _auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let item = Rooms::find_by_id(id).one(&ctx.db).await?;
    let Some(item) = item else {
        return error_response("NOT_FOUND", StatusCode::NOT_FOUND);
    };
    format::json(item)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/floors/{floor_id}/rooms", post(create).get(list_by_floor))
        .add("/rooms/{id}", get(get_by_id).patch(update))
        .add("/rooms/available", get(list_available))
}
