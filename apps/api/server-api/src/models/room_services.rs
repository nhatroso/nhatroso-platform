use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;

pub use super::_entities::room_services::{ActiveModel, Model, Entity};
pub type RoomService = Model;
pub type RoomServices = Entity;

use crate::views::room_services::{AssignServiceParams, UpdateAssignedServiceParams, RoomServiceResponse};
use crate::models::{
    rooms::Entity as Rooms,
    price_rules::Entity as PriceRules,
    services::Entity as Services,
};

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
    pub async fn list_by_room(db: &DatabaseConnection, _owner_id: Uuid, room_id: Uuid) -> Result<std::result::Result<Vec<RoomServiceResponse>, (StatusCode, &'static str)>> {
        let room = Rooms::find_by_id(room_id).one(db).await?;
        let Some(_room) = room else {
            return Ok(Err((StatusCode::NOT_FOUND, "ROOM_NOT_FOUND")));
        };

        let results = RoomServices::find()
            .filter(super::_entities::room_services::Column::RoomId.eq(room_id))
            .all(db)
            .await?;

        let mut responses = Vec::new();
        for rs in results {
            let service = Services::find_by_id(rs.service_id).one(db).await?;
            let Some(service) = service else { continue };

            let (unit_price, rule_name) = if let Some(pr_id) = rs.price_rule_id {
                if let Some(pr) = PriceRules::find_by_id(pr_id).one(db).await? {
                    (Some(pr.unit_price), Some(pr.name))
                } else {
                    (None, None)
                }
            } else {
                (None, None)
            };

            responses.push(RoomServiceResponse {
                id: rs.id,
                room_id: rs.room_id,
                service_id: rs.service_id,
                price_rule_id: rs.price_rule_id,
                is_active: rs.is_active,
                service_name: service.name,
                unit: service.unit,
                unit_price,
                rule_name,
            });
        }

        Ok(Ok(responses))
    }

    pub async fn assign(db: &DatabaseConnection, _owner_id: Uuid, room_id: Uuid, params: AssignServiceParams) -> Result<std::result::Result<RoomServiceResponse, (StatusCode, &'static str)>> {
        let room = Rooms::find_by_id(room_id).one(db).await?;
        let Some(_room) = room else {
            return Ok(Err((StatusCode::NOT_FOUND, "ROOM_NOT_FOUND")));
        };

        let (unit_price, rule_name) = if let Some(pr_id) = params.price_rule_id {
            let pr = PriceRules::find_by_id(pr_id).one(db).await?;
            let Some(pr) = pr else {
                return Ok(Err((StatusCode::NOT_FOUND, "PRICE_RULE_NOT_FOUND")));
            };

            if pr.service_id != params.service_id {
                return Ok(Err((StatusCode::BAD_REQUEST, "PRICE_RULE_SERVICE_MISMATCH")));
            }
            (Some(pr.unit_price), Some(pr.name))
        } else {
            (None, None)
        };

        let existing = RoomServices::find()
            .filter(super::_entities::room_services::Column::RoomId.eq(room_id))
            .filter(super::_entities::room_services::Column::ServiceId.eq(params.service_id))
            .one(db)
            .await?;

        let rs = if let Some(existing_rs) = existing {
            let mut active = existing_rs.into_active_model();
            active.price_rule_id = ActiveValue::Set(params.price_rule_id);
            active.is_active = ActiveValue::Set(true);
            active.updated_at = ActiveValue::Set(chrono::Utc::now().into());
            active.update(db).await?
        } else {
            let active = ActiveModel {
                id: ActiveValue::Set(Uuid::new_v4()),
                room_id: ActiveValue::Set(room_id),
                service_id: ActiveValue::Set(params.service_id),
                price_rule_id: ActiveValue::Set(params.price_rule_id),
                is_active: ActiveValue::Set(true),
                created_at: ActiveValue::Set(chrono::Utc::now().into()),
                updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            };
            active.insert(db).await?
        };

        let service = Services::find_by_id(rs.service_id).one(db).await?.unwrap();

        Ok(Ok(RoomServiceResponse {
            id: rs.id,
            room_id: rs.room_id,
            service_id: rs.service_id,
            price_rule_id: rs.price_rule_id,
            is_active: rs.is_active,
            service_name: service.name,
            unit: service.unit,
            unit_price,
            rule_name,
        }))
    }

    pub async fn update_assignment(db: &DatabaseConnection, _owner_id: Uuid, id: Uuid, params: UpdateAssignedServiceParams) -> Result<std::result::Result<RoomServiceResponse, (StatusCode, &'static str)>> {
        let rs = RoomServices::find_by_id(id).one(db).await?;
        let Some(rs) = rs else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };

        let mut active = rs.into_active_model();
        if let Some(price_rule_id) = params.price_rule_id {
            let pr = PriceRules::find_by_id(price_rule_id).one(db).await?;
            let Some(pr) = pr else {
                return Ok(Err((StatusCode::NOT_FOUND, "PRICE_RULE_NOT_FOUND")));
            };
            let current = RoomServices::find_by_id(id).one(db).await?.unwrap();
            if pr.service_id != current.service_id {
                return Ok(Err((StatusCode::BAD_REQUEST, "PRICE_RULE_SERVICE_MISMATCH")));
            }
            active.price_rule_id = ActiveValue::Set(Some(price_rule_id));
        }

        if let Some(is_active) = params.is_active {
            active.is_active = ActiveValue::Set(is_active);
        }
        active.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        let updated = active.update(db).await?;

        let service = Services::find_by_id(updated.service_id).one(db).await?.unwrap();

        let (unit_price, rule_name) = if let Some(pr_id) = updated.price_rule_id {
            if let Some(pr) = PriceRules::find_by_id(pr_id).one(db).await? {
                (Some(pr.unit_price), Some(pr.name))
            } else {
                (None, None)
            }
        } else {
            (None, None)
        };

        Ok(Ok(RoomServiceResponse {
            id: updated.id,
            room_id: updated.room_id,
            service_id: updated.service_id,
            price_rule_id: updated.price_rule_id,
            is_active: updated.is_active,
            service_name: service.name,
            unit: service.unit,
            unit_price,
            rule_name,
        }))
    }

    pub async fn remove_assignment(db: &DatabaseConnection, _owner_id: Uuid, id: Uuid) -> Result<std::result::Result<bool, (StatusCode, &'static str)>> {
        let rs = RoomServices::find_by_id(id).one(db).await?;
        let Some(rs) = rs else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };
        let res = rs.delete(db).await?;
        Ok(Ok(res.rows_affected > 0))
    }
}
