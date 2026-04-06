#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use crate::{
    models::meter_request_configs::Model as MeterRequestConfig,
    views::meter_request_configs::ConfigParams,
    utils::auth,
};

#[debug_handler]
pub async fn get_config(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let db = &ctx.db;

    let config = MeterRequestConfig::get_by_landlord(db, landlord_id).await?;

    match config {
        Some(c) => format::json(c),
        None => format::empty(),
    }
}

#[debug_handler]
pub async fn update_config(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<ConfigParams>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let db = &ctx.db;

    let config = MeterRequestConfig::update_or_create(db, landlord_id, params).await?;
    format::json(config)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/meter-request-configs")
        .add("/", get(get_config))
        .add("/", post(update_config))
}
