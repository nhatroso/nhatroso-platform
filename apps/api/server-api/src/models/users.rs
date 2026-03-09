use super::_entities::users::{ActiveModel, Entity};
use loco_rs::{hash, model::ModelError, model::ModelResult};
use sea_orm::entity::prelude::*;

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

impl super::_entities::users::Model {
    pub async fn find_by_email(db: &DatabaseConnection, email: &str) -> ModelResult<Self> {
        let user = Entity::find()
            .filter(super::_entities::users::Column::Email.eq(Some(email)))
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    pub async fn find_by_phone(db: &DatabaseConnection, phone: &str) -> ModelResult<Self> {
        let user = Entity::find()
            .filter(super::_entities::users::Column::Phone.eq(phone))
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    pub fn verify_password(&self, password: &str) -> bool {
        hash::verify_password(password, &self.password_hash)
    }
}
