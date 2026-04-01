#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use serde::{Deserialize, Serialize};
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, ColumnTrait, Set};

use crate::{
    models::_entities::meter_request_configs,
    utils::auth,
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConfigParams {
    pub day_of_month: i32,
    pub grace_days: i32,
    pub auto_generate: bool,
}

#[debug_handler]
pub async fn get_config(
    auth: JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let db = &ctx.db;

    let config = meter_request_configs::Entity::find()
        .filter(meter_request_configs::Column::LandlordId.eq(landlord_id))
        .one(db)
        .await?;

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

    let config = meter_request_configs::Entity::find()
        .filter(meter_request_configs::Column::LandlordId.eq(landlord_id))
        .one(db)
        .await?;

    if let Some(c) = config {
        let mut active: meter_request_configs::ActiveModel = c.into();
        active.day_of_month = Set(params.day_of_month);
        active.grace_days = Set(params.grace_days);
        active.auto_generate = Set(params.auto_generate);
        let updated = active.update(db).await?;
        format::json(updated)
    } else {
        let new_config = meter_request_configs::ActiveModel {
            landlord_id: Set(landlord_id),
            day_of_month: Set(params.day_of_month),
            grace_days: Set(params.grace_days),
            auto_generate: Set(params.auto_generate),
            ..Default::default()
        };
        let inserted = new_config.insert(db).await?;
        format::json(inserted)
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/meter-request-configs")
        .add("/", get(get_config))
        .add("/", post(update_config))
}
