use sea_orm::entity::prelude::*;
pub use super::_entities::meter_request_configs::{ActiveModel, Model, Entity, Column};
pub type MeterRequestConfigs = Entity;

use crate::views::meter_request_configs::ConfigParams;
use sea_orm::Set;

// implement your read-oriented logic here
impl Model {
    pub async fn get_by_landlord(
        db: &DatabaseConnection,
        landlord_id: uuid::Uuid,
    ) -> std::result::Result<Option<Self>, DbErr> {
        Entity::find()
            .filter(Column::LandlordId.eq(landlord_id))
            .one(db)
            .await
    }

    pub async fn update_or_create(
        db: &DatabaseConnection,
        landlord_id: uuid::Uuid,
        params: ConfigParams,
    ) -> std::result::Result<Self, DbErr> {
        let config = Self::get_by_landlord(db, landlord_id).await?;

        if let Some(c) = config {
            let mut active: ActiveModel = c.into();
            active.day_of_month = Set(params.day_of_month);
            active.grace_days = Set(params.grace_days);
            active.auto_generate = Set(params.auto_generate);
            active.update(db).await
        } else {
            let new_config = ActiveModel {
                landlord_id: Set(landlord_id),
                day_of_month: Set(params.day_of_month),
                grace_days: Set(params.grace_days),
                auto_generate: Set(params.auto_generate),
                ..Default::default()
            };
            new_config.insert(db).await
        }
    }
}

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
impl Model {}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
