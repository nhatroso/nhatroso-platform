use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::{Json, http::StatusCode};
use uuid::Uuid;

use crate::{
    views::meters::{CreateMeterParams, RecordReadingParams},
    models::meters::Model as Meter,
    models::meter_readings::Model as MeterReading,
    utils::{auth, error::error_response},
};

pub async fn list_by_room(
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let meters = Meter::list_by_room(&ctx.db, room_id).await?;
    format::json(meters)
}

pub async fn create(
    _auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateMeterParams>,
) -> Result<Response> {
    match Meter::create_meter(&ctx.db, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn get_my_meters(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user_id = auth::get_user_id(&auth)?;
    let meters = Meter::find_by_tenant(&ctx.db, user_id).await?;
    format::json(meters)
}

pub async fn record_reading(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<RecordReadingParams>,
) -> Result<Response> {
    let user_id = auth::get_user_id(&auth)?;

    // Ownership check: Meter must belong to the tenant's current room
    if !Meter::validate_meter_access(&ctx.db, id, user_id).await? {
        return error_response("METER_ACCESS_DENIED", StatusCode::FORBIDDEN);
    }

    match MeterReading::record_reading(&ctx.db, id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list_readings(
    _auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let readings = MeterReading::list_by_meter(&ctx.db, id).await?;
    format::json(readings)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/meters")
        .add("/", post(create))
        .add("/my-meters", get(get_my_meters))
        .add("/room/{room_id}", get(list_by_room))
        .add("/{id}/readings", post(record_reading))
        .add("/{id}/readings", get(list_readings))
}
