#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use crate::{
    models::auto_invoice_configs::Model as AutoInvoiceConfig,
    views::auto_invoice_configs::ConfigParams,
    utils::auth,
};

#[debug_handler]
pub async fn get_config(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let db = &ctx.db;

    let config = AutoInvoiceConfig::get_by_landlord(db, landlord_id).await?;

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

    let config = AutoInvoiceConfig::update_or_create(db, landlord_id, params).await?;
    format::json(config)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/landlord/auto-invoice-configs", get(get_config).post(update_config))
}
