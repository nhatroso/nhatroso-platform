#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]

use axum::{extract::Query, http::StatusCode, response::IntoResponse};
use loco_rs::prelude::*;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QuerySelect, RelationTrait};
use serde::{Deserialize, Serialize};


use crate::models::{
    _entities::contracts::{Column as ContractsColumn, Entity as Contracts},
    _entities::users::{Column as UsersColumn, Entity as Users},
};

fn error_response(code: &str, status: StatusCode) -> Result<Response> {
    Ok((
        status,
        Json(serde_json::json!({
            "success": false,
            "error": {
                "code": code
            }
        })),
    )
        .into_response())
}

#[derive(Clone, Debug, Deserialize)]
pub struct LookupUserParams {
    pub phone: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct UserLookupResult {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub id_card: Option<String>,
    pub id_card_date: Option<chrono::NaiveDate>,
    pub address: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct LookupUserResponse {
    pub exists: bool,
    pub user: Option<UserLookupResult>,
    pub has_active_contract: bool,
}

pub async fn lookup(
    Query(params): Query<LookupUserParams>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let phone = params.phone.trim();
    if phone.is_empty() {
        return error_response("MISSING_PHONE", StatusCode::BAD_REQUEST);
    }

    let user = Users::find()
        .filter(UsersColumn::Phone.eq(phone))
        .one(&ctx.db)
        .await?;

    match user {
        Some(user) => {
            let active_contract: Option<crate::models::_entities::contracts::Model> = Contracts::find()
                .join(
                    sea_orm::JoinType::InnerJoin,
                    crate::models::_entities::contracts::Relation::ContractTenants.def(),
                )
                .filter(crate::models::_entities::contract_tenants::Column::TenantId.eq(user.id))
                .filter(ContractsColumn::Status.eq("ACTIVE"))
                .one(&ctx.db)
                .await?;

            let has_active_contract = active_contract.is_some();

            format::json(LookupUserResponse {
                exists: true,
                user: Some(UserLookupResult {
                    id: user.id.to_string(),
                    name: user.name.clone(),
                    phone: user.phone.clone(),
                    id_card: user.id_card.clone(),
                    id_card_date: user.id_card_date,
                    address: user.address.clone(),
                }),
                has_active_contract,
            })
        }
        None => {
            format::json(LookupUserResponse {
                exists: false,
                user: None,
                has_active_contract: false,
            })
        }
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1")
        .add("/landlord/users/lookup", get(lookup))
}
