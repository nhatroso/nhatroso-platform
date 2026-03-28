use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;
use uuid::Uuid;

use crate::{
    views::reading_requests::CreateReadingRequestParams,
    models::reading_requests::Model as ReadingRequest,
    utils::{auth, error::error_response},
};

pub async fn list_by_building(
    Path(building_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let requests = ReadingRequest::find_by_building(&ctx.db, building_id).await?;
    format::json(requests)
}

pub async fn get_my_requests(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let tenant_id = auth::get_user_id(&auth)?;
    let requests = ReadingRequest::find_by_tenant(&ctx.db, tenant_id).await?;
    format::json(requests)
}

pub async fn create(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateReadingRequestParams>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;

    match ReadingRequest::create_request(&ctx.db, landlord_id, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/reading-requests")
        .add("/", post(create))
        .add("/my-requests", get(get_my_requests))
        .add("/building/{building_id}", get(list_by_building))
}
