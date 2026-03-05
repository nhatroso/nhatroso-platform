use loco_rs::prelude::*;
use uuid::Uuid;

use crate::{
    dtos::property::{
        CreateBuildingParams, CreateFloorParams, CreateRoomParams, UpdateBuildingParams,
        UpdateRoomStatusParams,
    },
    services::property_service::PropertyService,
};

use loco_rs::controller::extractor::auth::JWT;

// TODO: Replace with OWNER role check middleware
async fn check_owner(_auth: &JWT) -> Result<()> {
    // For MVP we just use the PID directly. In future, fetch user and check role == "OWNER"
    Ok(())
}

#[utoipa::path(
    post,
    path = "/api/v1/buildings",
    request_body = CreateBuildingParams,
    responses(
        (status = 200, description = "Building created")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Property"
)]
pub async fn create_building(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateBuildingParams>,
) -> Result<Response> {
    check_owner(&auth).await?;
    let owner_id: Uuid = auth.claims.pid.parse().unwrap_or_default();

    let building = PropertyService::create_building(&ctx.db, owner_id, &params).await?;
    format::json(building)
}

#[utoipa::path(
    put,
    path = "/api/v1/buildings/{id}",
    request_body = UpdateBuildingParams,
    params(
        ("id" = Uuid, Path, description = "Building ID")
    ),
    responses(
        (status = 200, description = "Building updated")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Property"
)]
pub async fn update_building(
    Path(id): Path<Uuid>,
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateBuildingParams>,
) -> Result<Response> {
    check_owner(&auth).await?;
    let owner_id: Uuid = auth.claims.pid.parse().unwrap_or_default();

    let building = PropertyService::update_building(&ctx.db, id, owner_id, &params).await?;
    format::json(building)
}

#[utoipa::path(
    post,
    path = "/api/v1/buildings/{id}/archive",
    params(
        ("id" = Uuid, Path, description = "Building ID")
    ),
    responses(
        (status = 200, description = "Building archived")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Property"
)]
pub async fn archive_building(
    Path(id): Path<Uuid>,
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_owner(&auth).await?;
    let owner_id: Uuid = auth.claims.pid.parse().unwrap_or_default();

    let building = PropertyService::archive_building(&ctx.db, id, owner_id).await?;
    format::json(building)
}

#[utoipa::path(
    post,
    path = "/api/v1/floors",
    request_body = CreateFloorParams,
    responses(
        (status = 200, description = "Floor created")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Property"
)]
pub async fn create_floor(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateFloorParams>,
) -> Result<Response> {
    check_owner(&auth).await?;
    let owner_id: Uuid = auth.claims.pid.parse().unwrap_or_default();

    let floor = PropertyService::create_floor(&ctx.db, owner_id, &params).await?;
    format::json(floor)
}

#[utoipa::path(
    post,
    path = "/api/v1/rooms",
    request_body = CreateRoomParams,
    responses(
        (status = 200, description = "Room created")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Property"
)]
pub async fn create_room(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateRoomParams>,
) -> Result<Response> {
    check_owner(&auth).await?;
    let owner_id: Uuid = auth.claims.pid.parse().unwrap_or_default();

    let room = PropertyService::create_room(&ctx.db, owner_id, &params).await?;
    format::json(room)
}

#[utoipa::path(
    put,
    path = "/api/v1/rooms/{id}/status",
    request_body = UpdateRoomStatusParams,
    params(
        ("id" = Uuid, Path, description = "Room ID")
    ),
    responses(
        (status = 200, description = "Room status updated")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Property"
)]
pub async fn update_room_status(
    Path(id): Path<Uuid>,
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateRoomStatusParams>,
) -> Result<Response> {
    check_owner(&auth).await?;
    let owner_id: Uuid = auth.claims.pid.parse().unwrap_or_default();

    let room = PropertyService::update_room_status(&ctx.db, id, owner_id, &params).await?;
    format::json(room)
}

#[utoipa::path(
    post,
    path = "/api/v1/rooms/{id}/archive",
    params(
        ("id" = Uuid, Path, description = "Room ID")
    ),
    responses(
        (status = 200, description = "Room archived")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Property"
)]
pub async fn archive_room(
    Path(id): Path<Uuid>,
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_owner(&auth).await?;
    let owner_id: Uuid = auth.claims.pid.parse().unwrap_or_default();

    let room = PropertyService::archive_room(&ctx.db, id, owner_id).await?;
    format::json(room)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/buildings", post(create_building))
        .add("/buildings/{id}", put(update_building))
        .add("/buildings/{id}/archive", post(archive_building))
        .add("/floors", post(create_floor))
        .add("/rooms", post(create_room))
        .add("/rooms/{id}/status", put(update_room_status))
        .add("/rooms/{id}/archive", post(archive_room))
}
