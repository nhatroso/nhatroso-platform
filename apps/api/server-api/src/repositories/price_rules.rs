use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder};
use uuid::Uuid;
use crate::models::_entities::price_rules::{ActiveModel, Column, Entity as PriceRules, Model};
use crate::dto::price_rules::{CreatePriceRuleParams, UpdatePriceRuleParams};
use chrono::NaiveDate;

pub struct PriceRuleRepository;

impl PriceRuleRepository {
    pub async fn list_by_room(db: &DatabaseConnection, room_id: Uuid) -> Result<Vec<Model>> {
        PriceRules::find()
            .filter(Column::RoomId.eq(room_id))
            .order_by_desc(Column::EffectiveStart)
            .all(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_latest_by_room_and_service(db: &DatabaseConnection, room_id: Uuid, service_id: Uuid) -> Result<Option<Model>> {
        PriceRules::find()
            .filter(Column::RoomId.eq(room_id))
            .filter(Column::ServiceId.eq(service_id))
            .order_by_desc(Column::EffectiveStart)
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_previous_by_start_date(db: &DatabaseConnection, room_id: Uuid, service_id: Uuid, start_date: NaiveDate) -> Result<Option<Model>> {
        PriceRules::find()
            .filter(Column::RoomId.eq(room_id))
            .filter(Column::ServiceId.eq(service_id))
            .filter(Column::EffectiveStart.lt(start_date))
            .order_by_desc(Column::EffectiveStart)
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Model>> {
        PriceRules::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn insert(db: &DatabaseConnection, owner_id: Uuid, room_id: Uuid, params: CreatePriceRuleParams) -> Result<Model> {
        let new_rule = ActiveModel {
            owner_id: ActiveValue::Set(owner_id),
            room_id: ActiveValue::Set(room_id),
            service_id: ActiveValue::Set(params.service_id),
            unit_price: ActiveValue::Set(params.unit_price),
            effective_start: ActiveValue::Set(params.effective_start),
            ..Default::default()
        };
        new_rule.insert(db).await.map_err(Error::from)
    }

    pub async fn update(db: &DatabaseConnection, model: Model, params: UpdatePriceRuleParams) -> Result<Model> {
        let mut active = model.into_active_model();
        if let Some(price) = params.unit_price {
            active.unit_price = ActiveValue::Set(price);
        }
        if let Some(start) = params.effective_start {
            active.effective_start = ActiveValue::Set(start);
        }
        active.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        active.update(db).await.map_err(Error::from)
    }

    pub async fn update_effective_end(db: &DatabaseConnection, model: Model, end_date: Option<NaiveDate>) -> Result<Model> {
        let mut active = model.into_active_model();
        active.effective_end = ActiveValue::Set(end_date);
        active.update(db).await.map_err(Error::from)
    }

    pub async fn delete(db: &DatabaseConnection, model: Model) -> Result<sea_orm::DeleteResult> {
        model.delete(db).await.map_err(Error::from)
    }
}
