use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;
use uuid::Uuid;

use crate::{
    views::contracts::CreateContractParams,
    models::contracts::Model as Contract,
    utils::{auth, error::error_response},
};

pub async fn create(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateContractParams>,
) -> Result<Response> {
    let landlord_id = auth::get_user_id(&auth)?;
    let res = Contract::create_contract(&ctx.db, landlord_id, params).await?;
    format::json(res)
}

pub async fn get_by_id(
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    match Contract::get_contract_by_id(&ctx.db, id).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn list(
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let results = Contract::list_contracts(&ctx.db).await?;
    format::json(results)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/contracts")
        .add("/", post(create))
        .add("/", get(list))
        .add("/{id}", get(get_by_id))
}
