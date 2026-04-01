use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::{Json, http::StatusCode, extract::Query};
use serde::Deserialize;
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

    match MeterReading::record_reading(&ctx.db, id, user_id, params).await? {
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

#[derive(Debug, Deserialize)]
pub struct LandlordListParams {
    pub building_id: Option<Uuid>,
}

pub async fn get_landlord_summary(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let summary = Meter::get_landlord_summary(&ctx.db, landlord_id).await?;
    format::json(summary)
}

pub async fn list_landlord_meters(
    auth: JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<LandlordListParams>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let meters = Meter::list_landlord_meters(&ctx.db, landlord_id, params.building_id).await?;
    format::json(meters)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/meters")
        .add("/", post(create))
        .add("/my-meters", get(get_my_meters))
        .add("/landlord/summary", get(get_landlord_summary))
        .add("/landlord/list", get(list_landlord_meters))
        .add("/room/{room_id}", get(list_by_room))
        .add("/{id}/readings", post(record_reading))
        .add("/{id}/readings", get(list_readings))
}
