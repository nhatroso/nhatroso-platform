use sea_orm::{entity::prelude::*, Set};
pub use super::_entities::auto_invoice_configs::{ActiveModel, Model, Entity, Column};

use crate::views::auto_invoice_configs::ConfigParams;

pub type AutoInvoiceConfigs = Entity;

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
             active.updated_at = Set(chrono::Utc::now().into());
             active.update(db).await
        } else {
             let new_config = ActiveModel {
                 id: Set(uuid::Uuid::new_v4()),
                 landlord_id: Set(landlord_id),
                 day_of_month: Set(params.day_of_month),
                 grace_days: Set(params.grace_days),
                 auto_generate: Set(params.auto_generate),
                 created_at: Set(chrono::Utc::now().into()),
                 updated_at: Set(chrono::Utc::now().into()),
             };
             new_config.insert(db).await
        }
    }
}
