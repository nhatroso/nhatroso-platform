use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::{Json, http::StatusCode, extract::Query};
use uuid::Uuid;

use crate::{
    views::meters::{RecordReadingParams, LandlordReadingsParams, OcrReadingParams},
    models::meters::Model as Meter,
    models::meter_readings::Model as MeterReading,
    utils::{auth, error::error_response, storage::Storage},
};
use std::time::Duration;

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

pub async fn get_upload_url(
    _auth: JWT,
    State(_ctx): State<AppContext>,
) -> Result<Response> {
    let bucket = std::env::var("S3_BUCKET").map_err(|_| Error::BadRequest("Missing S3_BUCKET".to_string()))?;
    let storage = Storage::new(bucket).await;

    let key = format!("meters/{}.jpg", Uuid::new_v4());
    let url = storage.get_presigned_upload_url(&key, Duration::from_secs(3600)).await
        .map_err(|e| Error::BadRequest(format!("Failed to generate S3 URL: {}", e)))?;

    format::json(serde_json::json!({
        "url": url,
        "key": key
    }))
}

pub async fn submit_ocr(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<OcrReadingParams>,
) -> Result<Response> {
    let user_id = auth::get_user_id(&auth)?;

    // Ownership check
    if !Meter::validate_meter_access(&ctx.db, id, user_id).await? {
        return error_response("METER_ACCESS_DENIED", StatusCode::FORBIDDEN);
    }

    let res = MeterReading::submit_ocr_reading(&ctx, id, user_id, params).await?;
    format::json(res)
}

pub async fn list_readings(
    _auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let readings = MeterReading::list_by_meter(&ctx.db, id).await?;
    format::json(readings)
}

pub async fn list_landlord_readings(
    auth: JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<LandlordReadingsParams>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let readings = MeterReading::list_landlord_readings(&ctx.db, landlord_id, params.building_id, params.period_month).await?;
    format::json(readings)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/attachments/upload-url", get(get_upload_url))
        .add("/meters/{id}/readings", post(record_reading).get(list_readings))
        .add("/meters/{id}/ocr", post(submit_ocr))
        .add("/landlord/meter-readings", get(list_landlord_readings))
}
