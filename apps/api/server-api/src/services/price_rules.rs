use loco_rs::prelude::*;
use axum::http::StatusCode;
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::{Utc, TimeDelta};
use crate::dto::price_rules::{CreatePriceRuleParams, UpdatePriceRuleParams, PriceRuleResponse};
use crate::repositories::price_rules::PriceRuleRepository;
use crate::repositories::rooms::RoomRepository;
use crate::repositories::services::ServiceRepository;

pub struct PriceRuleService;

impl PriceRuleService {
    pub async fn list_by_room(db: &DatabaseConnection, room_id: Uuid) -> Result<Vec<PriceRuleResponse>> {
        let rules = PriceRuleRepository::list_by_room(db, room_id).await?;
        Ok(rules.into_iter().map(PriceRuleResponse::from).collect())
    }

    pub async fn create(db: &DatabaseConnection, owner_id: Uuid, room_id: Uuid, params: CreatePriceRuleParams) -> Result<std::result::Result<PriceRuleResponse, (StatusCode, &'static str)>> {
        if params.unit_price <= Decimal::ZERO {
            return Ok(Err((StatusCode::BAD_REQUEST, "INVALID_UNIT_PRICE")));
        }

        let room = RoomRepository::find_by_id(db, room_id).await?;
        if room.is_none() {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        }

        let service = ServiceRepository::find_by_id(db, params.service_id).await?;
        let Some(service) = service else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        if service.status == "ARCHIVED" {
            return Ok(Err((StatusCode::CONFLICT, "SERVICE_ARCHIVED")));
        }

        let latest_rule = PriceRuleRepository::find_latest_by_room_and_service(db, room_id, params.service_id).await?;
        if let Some(rule) = latest_rule {
            if params.effective_start <= rule.effective_start {
                return Ok(Err((StatusCode::CONFLICT, "OVERLAPPING_EFFECTIVE_PERIOD")));
            }

            if rule.effective_end.is_none() {
                PriceRuleRepository::update_effective_end(db, rule, Some(params.effective_start - TimeDelta::days(1))).await?;
            }
        }

        let inserted = PriceRuleRepository::insert(db, owner_id, room_id, params).await?;
        Ok(Ok(PriceRuleResponse::from(inserted)))
    }

    pub async fn update(db: &DatabaseConnection, _room_id: Uuid, id: Uuid, params: UpdatePriceRuleParams) -> Result<std::result::Result<PriceRuleResponse, (StatusCode, &'static str)>> {
        let rule = PriceRuleRepository::find_by_id(db, id).await?;
        let Some(rule) = rule else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        let today = Utc::now().naive_utc().date();
        if rule.effective_start <= today {
            return Ok(Err((StatusCode::CONFLICT, "PRICE_RULE_LOCKED")));
        }

        if let Some(price) = params.unit_price {
            if price <= Decimal::ZERO {
                return Ok(Err((StatusCode::BAD_REQUEST, "INVALID_UNIT_PRICE")));
            }
        }

        if let Some(start) = params.effective_start {
            let previous_rule = PriceRuleRepository::find_previous_by_start_date(db, rule.room_id, rule.service_id, rule.effective_start).await?;
            if let Some(prev) = previous_rule {
                if start <= prev.effective_start {
                    return Ok(Err((StatusCode::CONFLICT, "OVERLAPPING_EFFECTIVE_PERIOD")));
                }
                PriceRuleRepository::update_effective_end(db, prev, Some(start - TimeDelta::days(1))).await?;
            }
        }

        let updated = PriceRuleRepository::update(db, rule, params).await?;
        Ok(Ok(PriceRuleResponse::from(updated)))
    }

    pub async fn remove(db: &DatabaseConnection, id: Uuid) -> Result<std::result::Result<bool, (StatusCode, &'static str)>> {
        let rule = PriceRuleRepository::find_by_id(db, id).await?;
        let Some(rule) = rule else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        let today = Utc::now().naive_utc().date();
        if rule.effective_start <= today {
            return Ok(Err((StatusCode::CONFLICT, "PRICE_RULE_LOCKED")));
        }

        let previous_rule = PriceRuleRepository::find_previous_by_start_date(db, rule.room_id, rule.service_id, rule.effective_start).await?;
        let res = PriceRuleRepository::delete(db, rule).await?;

        if let Some(prev) = previous_rule {
            PriceRuleRepository::update_effective_end(db, prev, None).await?;
        }

        Ok(Ok(res.rows_affected > 0))
    }
}
