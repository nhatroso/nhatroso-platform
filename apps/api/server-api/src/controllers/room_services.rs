use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::{Json, extract::Path};
use uuid::Uuid;

use crate::{
    views::room_services::{AssignServiceParams, UpdateAssignedServiceParams},
    models::room_services::Model as RoomService,
    utils::{auth, error::error_response},
};

pub async fn assign(
    auth: JWT,
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<AssignServiceParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match RoomService::assign(&ctx.db, owner_id, room_id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list_by_room(
    auth: JWT,
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match RoomService::list_by_room(&ctx.db, owner_id, room_id).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn update(
    auth: JWT,
    Path((_room_id, service_id)): Path<(Uuid, Uuid)>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateAssignedServiceParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match RoomService::update_assignment(&ctx.db, owner_id, service_id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn remove(
    auth: JWT,
    Path((_room_id, service_id)): Path<(Uuid, Uuid)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    match RoomService::remove_assignment(&ctx.db, owner_id, service_id).await? {
        Ok(deleted) => format::json(serde_json::json!({ "success": true, "deleted": deleted })),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/landlord/rooms/{room_id}/services", get(list_by_room).post(assign))
        .add("/landlord/rooms/{room_id}/services/{id}", patch(update).delete(remove))
}
