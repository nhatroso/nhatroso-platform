use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;
use rust_decimal::Decimal;

pub use super::_entities::price_rules::{ActiveModel, Model, Entity};
pub type PriceRule = Model;
pub type PriceRules = Entity;

use crate::views::price_rules::{CreatePriceRuleParams, UpdatePriceRuleParams, PriceRuleResponse};
use crate::models::services::Model as Service;

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

impl Model {
    pub async fn list_by_service(db: &DatabaseConnection, service_id: Uuid) -> Result<Vec<PriceRuleResponse>> {
        let rules = PriceRules::find()
            .filter(super::_entities::price_rules::Column::ServiceId.eq(service_id))
            .order_by_desc(super::_entities::price_rules::Column::CreatedAt)
            .all(db)
            .await?;
        Ok(rules.into_iter().map(PriceRuleResponse::from).collect())
    }

    pub async fn create_rule(db: &DatabaseConnection, owner_id: Uuid, params: CreatePriceRuleParams) -> Result<std::result::Result<PriceRuleResponse, (StatusCode, &'static str)>> {
        if params.unit_price < Decimal::ZERO {
            return Ok(Err((StatusCode::BAD_REQUEST, "INVALID_UNIT_PRICE")));
        }

        let service = Service::find_by_id(db, params.service_id).await?;
        let Some(service) = service else {
            return Ok(Err((StatusCode::NOT_FOUND, "SERVICE_NOT_FOUND")));
        };

        if service.status == "ARCHIVED" {
            return Ok(Err((StatusCode::CONFLICT, "SERVICE_ARCHIVED")));
        }

        let new_rule = ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            owner_id: ActiveValue::Set(owner_id),
            service_id: ActiveValue::Set(params.service_id),
            unit_price: ActiveValue::Set(params.unit_price),
            name: ActiveValue::Set(params.name.unwrap_or_else(|| "Standard Price".to_string())),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        };
        let inserted = new_rule.insert(db).await?;
        Ok(Ok(PriceRuleResponse::from(inserted)))
    }

    pub async fn update_rule(db: &DatabaseConnection, owner_id: Uuid, id: Uuid, params: UpdatePriceRuleParams) -> Result<std::result::Result<PriceRuleResponse, (StatusCode, &'static str)>> {
        let rule = PriceRules::find_by_id(id).one(db).await?;
        let Some(rule) = rule else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        if rule.owner_id != owner_id {
             return Ok(Err((StatusCode::FORBIDDEN, "FORBIDDEN")));
        }

        if let Some(price) = params.unit_price {
            if price < Decimal::ZERO {
                return Ok(Err((StatusCode::BAD_REQUEST, "INVALID_UNIT_PRICE")));
            }
        }

        let mut active = rule.into_active_model();
        if let Some(price) = params.unit_price {
            active.unit_price = ActiveValue::Set(price);
        }
        if let Some(name) = params.name {
            active.name = ActiveValue::Set(name);
        }
        active.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        let updated = active.update(db).await?;
        Ok(Ok(PriceRuleResponse::from(updated)))
    }

    pub async fn remove_rule(db: &DatabaseConnection, owner_id: Uuid, id: Uuid) -> Result<std::result::Result<bool, (StatusCode, &'static str)>> {
        let rule = PriceRules::find_by_id(id).one(db).await?;
        let Some(rule) = rule else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        if rule.owner_id != owner_id {
             return Ok(Err((StatusCode::FORBIDDEN, "FORBIDDEN")));
        }

        let res = rule.delete(db).await?;
        Ok(Ok(res.rows_affected > 0))
    }
}
