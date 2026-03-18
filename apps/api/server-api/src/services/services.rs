use loco_rs::prelude::*;
use axum::http::StatusCode;
use uuid::Uuid;
use crate::dto::services::{CreateServiceParams, UpdateServiceParams, ServiceResponse};
use crate::repositories::services::ServiceRepository;

pub struct ServiceService;

impl ServiceService {
    pub async fn list(db: &DatabaseConnection) -> Result<Vec<ServiceResponse>> {
        let services = ServiceRepository::list(db).await?;
        Ok(services.into_iter().map(ServiceResponse::from).collect())
    }

    pub async fn create(db: &DatabaseConnection, owner_id: Uuid, params: CreateServiceParams) -> Result<std::result::Result<ServiceResponse, (StatusCode, &'static str)>> {
        if params.name.trim().is_empty() || params.unit.trim().is_empty() {
            return Ok(Err((StatusCode::BAD_REQUEST, "REQUIRED_FIELD_MISSING")));
        }

        let existing = ServiceRepository::find_by_owner_and_name(db, owner_id, params.name.trim()).await?;
        if existing.is_some() {
            return Ok(Err((StatusCode::CONFLICT, "DUPLICATE_SERVICE_NAME")));
        }

        let inserted = ServiceRepository::insert(db, owner_id, params).await?;
        Ok(Ok(ServiceResponse::from(inserted)))
    }

    pub async fn update(db: &DatabaseConnection, owner_id: Uuid, id: Uuid, params: UpdateServiceParams) -> Result<std::result::Result<ServiceResponse, (StatusCode, &'static str)>> {
        let model = ServiceRepository::find_by_id(db, id).await?;
        let Some(model) = model else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        if model.status == "ARCHIVED" {
            return Ok(Err((StatusCode::CONFLICT, "SERVICE_ARCHIVED")));
        }

        if let Some(name) = &params.name {
            let name_trim = name.trim();
            if !name_trim.is_empty() {
                let existing = ServiceRepository::find_by_owner_and_name(db, owner_id, name_trim).await?;
                if let Some(ext) = existing {
                    if ext.id != id {
                        return Ok(Err((StatusCode::CONFLICT, "DUPLICATE_SERVICE_NAME")));
                    }
                }
            }
        }

        let updated = ServiceRepository::update(db, model, params).await?;
        Ok(Ok(ServiceResponse::from(updated)))
    }

    pub async fn archive(db: &DatabaseConnection, id: Uuid) -> Result<std::result::Result<ServiceResponse, (StatusCode, &'static str)>> {
        let model = ServiceRepository::find_by_id(db, id).await?;
        let Some(model) = model else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        let updated = ServiceRepository::archive(db, model).await?;
        Ok(Ok(ServiceResponse::from(updated)))
    }
}
