use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use uuid::Uuid;

use crate::{
    views::rooms::{CreateRoomParams, UpdateRoomParams},
    models::rooms::{Model as Room, Entity as Rooms},
    utils::{auth, error::error_response},
};

pub async fn create(
    auth: JWT,
    Path(floor_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateRoomParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match Room::create(&ctx.db, owner_id, floor_id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list_owner_rooms(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    let items = Room::list_by_owner(&ctx.db, owner_id).await?;
    format::json(items)
}

pub async fn list_by_floor(
    auth: JWT,
    Path(floor_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match Room::list_by_floor(&ctx.db, owner_id, floor_id).await? {
        Ok(items) => format::json(items),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateRoomParams>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match Room::update_room(&ctx.db, owner_id, id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list_available(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;
    let items = Rooms::list_available(&ctx.db, owner_id).await?;
    format::json(items)
}

pub async fn get_by_id(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = auth::get_user_id(&auth)?;

    match Room::get_by_id(&ctx.db, owner_id, id).await? {
        Ok(item) => format::json(item),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn get_my_room(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user_id = auth::get_user_id(&auth)?;

    match Room::get_my_room(&ctx.db, user_id).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/landlord/floors/{floor_id}/rooms", post(create).get(list_by_floor))
        .add("/landlord/rooms", get(list_owner_rooms))
        .add("/landlord/rooms/available", get(list_available))
        .add("/landlord/rooms/{id}", get(get_by_id).patch(update))
        .add("/me/room", get(get_my_room))
}
