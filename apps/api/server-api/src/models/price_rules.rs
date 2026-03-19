use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;
use rust_decimal::Decimal;
use chrono::{Utc, TimeDelta, NaiveDate};

pub use super::_entities::price_rules::{ActiveModel, Model, Entity};
pub type PriceRule = Model;
pub type PriceRules = Entity;

use crate::views::price_rules::{CreatePriceRuleParams, UpdatePriceRuleParams, PriceRuleResponse};
use crate::models::rooms::Model as Room;
use crate::models::buildings::Model as Building;
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
    pub async fn list_by_room(db: &DatabaseConnection, room_id: Uuid) -> Result<Vec<PriceRuleResponse>> {
        let rules = PriceRules::find()
            .filter(super::_entities::price_rules::Column::RoomId.eq(room_id))
            .order_by_desc(super::_entities::price_rules::Column::EffectiveStart)
            .all(db)
            .await?;
        Ok(rules.into_iter().map(PriceRuleResponse::from).collect())
    }

    pub async fn list_by_building(db: &DatabaseConnection, building_id: Uuid) -> Result<Vec<PriceRuleResponse>> {
        let rules = PriceRules::find()
            .filter(super::_entities::price_rules::Column::BuildingId.eq(building_id))
            .filter(super::_entities::price_rules::Column::RoomId.is_null())
            .order_by_desc(super::_entities::price_rules::Column::EffectiveStart)
            .all(db)
            .await?;
        Ok(rules.into_iter().map(PriceRuleResponse::from).collect())
    }

    pub async fn list_by_owner_defaults(db: &DatabaseConnection, owner_id: Uuid) -> Result<Vec<PriceRuleResponse>> {
        let rules = PriceRules::find()
            .filter(super::_entities::price_rules::Column::OwnerId.eq(owner_id))
            .filter(super::_entities::price_rules::Column::BuildingId.is_null())
            .filter(super::_entities::price_rules::Column::RoomId.is_null())
            .order_by_desc(super::_entities::price_rules::Column::EffectiveStart)
            .all(db)
            .await?;
        Ok(rules.into_iter().map(PriceRuleResponse::from).collect())
    }

    pub async fn find_latest(db: &DatabaseConnection, owner_id: Uuid, building_id: Option<Uuid>, room_id: Option<Uuid>, service_id: Uuid) -> Result<Option<Self>> {
        let mut query = PriceRules::find()
            .filter(super::_entities::price_rules::Column::OwnerId.eq(owner_id))
            .filter(super::_entities::price_rules::Column::ServiceId.eq(service_id));

        if let Some(rid) = room_id {
            query = query.filter(super::_entities::price_rules::Column::RoomId.eq(rid));
        } else {
            query = query.filter(super::_entities::price_rules::Column::RoomId.is_null());
        }

        if let Some(bid) = building_id {
            query = query.filter(super::_entities::price_rules::Column::BuildingId.eq(bid));
        } else {
            query = query.filter(super::_entities::price_rules::Column::BuildingId.is_null());
        }

        query.order_by_desc(super::_entities::price_rules::Column::EffectiveStart)
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_previous(db: &DatabaseConnection, owner_id: Uuid, building_id: Option<Uuid>, room_id: Option<Uuid>, service_id: Uuid, start_date: NaiveDate) -> Result<Option<Self>> {
        let mut query = PriceRules::find()
            .filter(super::_entities::price_rules::Column::OwnerId.eq(owner_id))
            .filter(super::_entities::price_rules::Column::ServiceId.eq(service_id))
            .filter(super::_entities::price_rules::Column::EffectiveStart.lt(start_date));

        if let Some(rid) = room_id {
            query = query.filter(super::_entities::price_rules::Column::RoomId.eq(rid));
        } else {
            query = query.filter(super::_entities::price_rules::Column::RoomId.is_null());
        }

        if let Some(bid) = building_id {
            query = query.filter(super::_entities::price_rules::Column::BuildingId.eq(bid));
        } else {
            query = query.filter(super::_entities::price_rules::Column::BuildingId.is_null());
        }

        query.order_by_desc(super::_entities::price_rules::Column::EffectiveStart)
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn create_rule(db: &DatabaseConnection, owner_id: Uuid, params: CreatePriceRuleParams) -> Result<std::result::Result<PriceRuleResponse, (StatusCode, &'static str)>> {
        if params.unit_price <= Decimal::ZERO {
            return Ok(Err((StatusCode::BAD_REQUEST, "INVALID_UNIT_PRICE")));
        }

        // Validate Room if provided
        if let Some(rid) = params.room_id {
            let room = Room::get_by_id(db, owner_id, rid).await?;
            if room.is_err() {
                return Ok(Err((StatusCode::NOT_FOUND, "ROOM_NOT_FOUND")));
            }
        }

        // Validate Building if provided
        if let Some(bid) = params.building_id {
             let building = Building::find_by_id(db, bid, owner_id).await?;
             if building.is_none() {
                 return Ok(Err((StatusCode::NOT_FOUND, "BUILDING_NOT_FOUND")));
             }
        }

        let service = Service::find_by_id(db, params.service_id).await?;
        let Some(service) = service else {
            return Ok(Err((StatusCode::NOT_FOUND, "SERVICE_NOT_FOUND")));
        };

        if service.status == "ARCHIVED" {
            return Ok(Err((StatusCode::CONFLICT, "SERVICE_ARCHIVED")));
        }

        let latest_rule = Self::find_latest(db, owner_id, params.building_id, params.room_id, params.service_id).await?;
        if let Some(rule) = latest_rule {
            if params.effective_start <= rule.effective_start {
                return Ok(Err((StatusCode::CONFLICT, "OVERLAPPING_EFFECTIVE_PERIOD")));
            }

            if rule.effective_end.is_none() {
                rule.update_effective_end(db, Some(params.effective_start - TimeDelta::days(1))).await?;
            }
        }

        let new_rule = ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            owner_id: ActiveValue::Set(owner_id),
            room_id: ActiveValue::Set(params.room_id),
            building_id: ActiveValue::Set(params.building_id),
            service_id: ActiveValue::Set(params.service_id),
            unit_price: ActiveValue::Set(params.unit_price),
            effective_start: ActiveValue::Set(params.effective_start),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
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
            let previous_rule = Self::find_previous(db, owner_id, rule.building_id, rule.room_id, rule.service_id, rule.effective_start).await?;
            if let Some(prev) = previous_rule {
                if start <= prev.effective_start {
                    return Ok(Err((StatusCode::CONFLICT, "OVERLAPPING_EFFECTIVE_PERIOD")));
                }
                prev.update_effective_end(db, Some(start - TimeDelta::days(1))).await?;
            }
        }

        let mut active = rule.into_active_model();
        if let Some(price) = params.unit_price {
            active.unit_price = ActiveValue::Set(price);
        }
        if let Some(start) = params.effective_start {
            active.effective_start = ActiveValue::Set(start);
        }
        active.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        let updated = active.update(db).await?;
        Ok(Ok(PriceRuleResponse::from(updated)))
    }

    pub async fn update_effective_end(&self, db: &DatabaseConnection, end_date: Option<NaiveDate>) -> Result<Self> {
        let mut active = self.clone().into_active_model();
        active.effective_end = ActiveValue::Set(end_date);
        active.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        active.update(db).await.map_err(Error::from)
    }

    pub async fn remove_rule(db: &DatabaseConnection, owner_id: Uuid, id: Uuid) -> Result<std::result::Result<bool, (StatusCode, &'static str)>> {
        let rule = PriceRules::find_by_id(id).one(db).await?;
        let Some(rule) = rule else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        if rule.owner_id != owner_id {
             return Ok(Err((StatusCode::FORBIDDEN, "FORBIDDEN")));
        }

        let today = Utc::now().naive_utc().date();
        if rule.effective_start <= today {
            return Ok(Err((StatusCode::CONFLICT, "PRICE_RULE_LOCKED")));
        }

        let previous_rule = Self::find_previous(db, owner_id, rule.building_id, rule.room_id, rule.service_id, rule.effective_start).await?;
        let res = rule.delete(db).await?;

        if let Some(prev) = previous_rule {
            prev.update_effective_end(db, None).await?;
        }

        Ok(Ok(res.rows_affected > 0))
    }
}
