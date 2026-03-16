#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]

use axum::{http::StatusCode, response::IntoResponse};
use loco_rs::controller::extractor::auth::JWT;
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::models::{
    _entities::services::{ActiveModel, Column, Entity as Services},
};

// Reuse standard error response helper
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

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct CreateServiceParams {
    pub name: String,
    pub unit: String,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct UpdateServiceParams {
    pub name: Option<String>,
    pub unit: Option<String>,
}

#[derive(Clone, Debug, Serialize, ToSchema)]
pub struct ServiceResponse {
    pub id: Uuid,
    pub name: String,
    pub unit: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
}

impl From<crate::models::_entities::services::Model> for ServiceResponse {
    fn from(model: crate::models::_entities::services::Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            unit: model.unit,
            status: model.status,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/v1/services",
    request_body = CreateServiceParams,
    security(("bearer_auth" = [])),
    responses((status = 201, description = "Service created successfully")),
    tag = "Services"
)]
pub async fn create(
    auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateServiceParams>,
) -> Result<Response> {
    if params.name.trim().is_empty() || params.unit.trim().is_empty() {
        return error_response("REQUIRED_FIELD_MISSING", StatusCode::BAD_REQUEST);
    }

    let owner_id = Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    // Check duplicate name for this owner
    let existing = Services::find()
        .filter(Column::OwnerId.eq(owner_id))
        .filter(Column::Name.eq(params.name.trim().to_string()))
        .one(&ctx.db)
        .await?;

    if existing.is_some() {
        return error_response("DUPLICATE_SERVICE_NAME", StatusCode::CONFLICT);
    }

    let service = ActiveModel {
        owner_id: ActiveValue::Set(owner_id),
        name: ActiveValue::Set(params.name.trim().to_string()),
        unit: ActiveValue::Set(params.unit.trim().to_string()),
        status: ActiveValue::Set("ACTIVE".to_string()),
        ..Default::default()
    };

    let inserted = service.insert(&ctx.db).await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "success": true,
            "data": ServiceResponse::from(inserted)
        })),
    )
        .into_response())
}

#[utoipa::path(
    get,
    path = "/api/v1/services",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "List of services")),
    tag = "Services"
)]
pub async fn list(auth: JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let services = Services::find()
        .filter(Column::OwnerId.eq(owner_id))
        .all(&ctx.db)
        .await?;

    let response: Vec<ServiceResponse> = services.into_iter().map(ServiceResponse::from).collect();

    Ok(Json(serde_json::json!({
        "success": true,
        "data": response
    }))
    .into_response())
}

#[utoipa::path(
    patch,
    path = "/api/v1/services/{id}",
    request_body = UpdateServiceParams,
    security(("bearer_auth" = [])),
    responses((status = 200, description = "Service updated successfully")),
    tag = "Services"
)]
pub async fn update(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateServiceParams>,
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let model = Services::find_by_id(id).one(&ctx.db).await?;
    let model = match model {
        Some(m) if m.owner_id == owner_id => m,
        _ => return error_response("NOT_FOUND", StatusCode::NOT_FOUND),
    };

    if model.status == "ARCHIVED" {
        return error_response("SERVICE_ARCHIVED", StatusCode::CONFLICT);
    }

    let mut active_model = model.into_active_model();

    // if changing name, verify uniqueness
    if let Some(name) = &params.name {
        let name_trim = name.trim().to_string();
        if !name_trim.is_empty() {
            let existing = Services::find()
                .filter(Column::OwnerId.eq(owner_id))
                .filter(Column::Name.eq(&name_trim))
                .filter(Column::Id.ne(id))
                .one(&ctx.db)
                .await?;

            if existing.is_some() {
                return error_response("DUPLICATE_SERVICE_NAME", StatusCode::CONFLICT);
            }
            active_model.name = ActiveValue::Set(name_trim);
        }
    }

    if let Some(unit) = &params.unit {
        let unit_trim = unit.trim().to_string();
        if !unit_trim.is_empty() {
            active_model.unit = ActiveValue::Set(unit_trim);
        }
    }

    let updated = active_model.update(&ctx.db).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": ServiceResponse::from(updated)
    }))
    .into_response())
}

#[utoipa::path(
    post,
    path = "/api/v1/services/{id}/archive",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "Service archived successfully")),
    tag = "Services"
)]
pub async fn archive(
    auth: JWT,
    Path(id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let owner_id = Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::Message("Invalid UUID".to_string()))?;

    let model = Services::find_by_id(id).one(&ctx.db).await?;
    let model = match model {
        Some(m) if m.owner_id == owner_id => m,
        _ => return error_response("NOT_FOUND", StatusCode::NOT_FOUND),
    };

    let mut active_model = model.into_active_model();
    active_model.status = ActiveValue::Set("ARCHIVED".to_string());

    let updated = active_model.update(&ctx.db).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": ServiceResponse::from(updated)
    }))
    .into_response())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/services")
        .add("/", post(create))
        .add("/", get(list))
        .add("/{id}", patch(update))
        .add("/{id}/archive", post(archive))
}
