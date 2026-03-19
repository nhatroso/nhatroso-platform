use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;

pub use super::_entities::services::{ActiveModel, Model, Entity};
pub type Services = Entity;

use crate::views::services::{CreateServiceParams, UpdateServiceParams, ServiceResponse};

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> std::result::Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        if !insert && self.updated_at.is_unchanged() {
            let mut this = self;
            this.updated_at = sea_orm::ActiveValue::Set(chrono::Utc::now().into());
            Ok(this)
        } else {
            Ok(self)
        }
    }
}

// implement your read-oriented logic here
impl Model {
    pub async fn list_services(db: &DatabaseConnection) -> Result<Vec<ServiceResponse>> {
        let services = Services::find().all(db).await?;
        Ok(services.into_iter().map(ServiceResponse::from).collect())
    }

    pub async fn find_by_owner_and_name(db: &DatabaseConnection, owner_id: Uuid, name: &str) -> Result<Option<Self>> {
        Services::find()
            .filter(super::_entities::services::Column::OwnerId.eq(owner_id))
            .filter(super::_entities::services::Column::Name.eq(name))
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Self>> {
        Services::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn create_service(db: &DatabaseConnection, owner_id: Uuid, params: CreateServiceParams) -> Result<std::result::Result<ServiceResponse, (StatusCode, &'static str)>> {
        if params.name.trim().is_empty() || params.unit.trim().is_empty() {
            return Ok(Err((StatusCode::BAD_REQUEST, "REQUIRED_FIELD_MISSING")));
        }

        let existing = Self::find_by_owner_and_name(db, owner_id, params.name.trim()).await?;
        if existing.is_some() {
            return Ok(Err((StatusCode::CONFLICT, "DUPLICATE_SERVICE_NAME")));
        }

        let service = ActiveModel {
            owner_id: ActiveValue::Set(owner_id),
            name: ActiveValue::Set(params.name.trim().to_string()),
            unit: ActiveValue::Set(params.unit.trim().to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            ..Default::default()
        };
        let inserted = service.insert(db).await?;
        Ok(Ok(ServiceResponse::from(inserted)))
    }

    pub async fn update_service(db: &DatabaseConnection, owner_id: Uuid, id: Uuid, params: UpdateServiceParams) -> Result<std::result::Result<ServiceResponse, (StatusCode, &'static str)>> {
        let model = Self::find_by_id(db, id).await?;
        let Some(model) = model else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        if model.status == "ARCHIVED" {
            return Ok(Err((StatusCode::CONFLICT, "SERVICE_ARCHIVED")));
        }

        if let Some(name) = &params.name {
            let name_trim = name.trim();
            if !name_trim.is_empty() {
                let existing = Self::find_by_owner_and_name(db, owner_id, name_trim).await?;
                if let Some(ext) = existing {
                    if ext.id != id {
                        return Ok(Err((StatusCode::CONFLICT, "DUPLICATE_SERVICE_NAME")));
                    }
                }
            }
        }

        let mut active_model = model.into_active_model();
        if let Some(name) = params.name {
            active_model.name = ActiveValue::Set(name.trim().to_string());
        }
        if let Some(unit) = params.unit {
            active_model.unit = ActiveValue::Set(unit.trim().to_string());
        }
        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        let updated = active_model.update(db).await?;
        Ok(Ok(ServiceResponse::from(updated)))
    }

    pub async fn archive_service(db: &DatabaseConnection, id: Uuid) -> Result<std::result::Result<ServiceResponse, (StatusCode, &'static str)>> {
        let model = Self::find_by_id(db, id).await?;
        let Some(model) = model else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        let mut active_model = model.into_active_model();
        active_model.status = ActiveValue::Set("ARCHIVED".to_string());
        active_model.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        let updated = active_model.update(db).await?;
        Ok(Ok(ServiceResponse::from(updated)))
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
