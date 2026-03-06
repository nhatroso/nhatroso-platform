use super::_entities::users::Entity;
use loco_rs::{hash, model::ModelError, model::ModelResult};
use sea_orm::entity::prelude::*;

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
