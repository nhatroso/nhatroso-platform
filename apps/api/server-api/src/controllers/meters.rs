#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use axum::Json;
use uuid::Uuid;

use crate::{
    views::meters::{CreateMeterParams, RecordReadingParams},
    models::meters::Model as Meter,
    models::meter_readings::Model as MeterReading,
    utils::error::error_response,
};

pub async fn list_by_room(
    Path(room_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let meters = Meter::list_by_room(&ctx.db, room_id).await?;
    format::json(meters)
}

pub async fn create(
    State(ctx): State<AppContext>,
    Json(params): Json<CreateMeterParams>,
) -> Result<Response> {
    match Meter::create_meter(&ctx.db, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn record_reading(
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<RecordReadingParams>,
) -> Result<Response> {
    match MeterReading::record_reading(&ctx.db, id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list_readings(
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
        .add("/room/{room_id}", get(list_by_room))
        .add("/{id}/readings", post(record_reading))
        .add("/{id}/readings", get(list_readings))
}
