use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::{Json, extract::Query};
use uuid::Uuid;

use crate::{
    views::meters::{CreateMeterParams, LandlordListParams, UpdateMeterStatusParams},
    models::meters::Model as Meter,
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

pub async fn get_landlord_summary(
    auth: JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<LandlordListParams>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let summary = Meter::get_landlord_summary(&ctx.db, landlord_id, params.period_month).await?;
    format::json(summary)
}

pub async fn list_landlord_meters(
    auth: JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<LandlordListParams>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let meters = Meter::list_landlord_meters(&ctx.db, landlord_id, params.building_id, params.period_month).await?;
    format::json(meters)
}

pub async fn update_status(
    _auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateMeterStatusParams>,
) -> Result<Response> {
    Meter::update_status(&ctx.db, id, &params.status).await?;
    format::empty()
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/meters", post(create))
        .add("/me/meters", get(get_my_meters))
        .add("/landlord/meters/summary", get(get_landlord_summary))
        .add("/landlord/meters", get(list_landlord_meters))
        .add("/rooms/{room_id}/meters", get(list_by_room))
        .add("/meters/{id}/status", patch(update_status))
}

