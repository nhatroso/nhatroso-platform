use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter};
use crate::models::_entities::users::{ActiveModel, Column, Entity as Users, Model};

pub struct UserRepository;

impl UserRepository {
    pub async fn find_by_id(db: &DatabaseConnection, id: Uuid) -> Result<Option<Model>> {
        Users::find_by_id(id).one(db).await.map_err(Error::from)
    }

    pub async fn find_by_phone(db: &DatabaseConnection, phone: &str) -> Result<Option<Model>> {
        Users::find()
            .filter(Column::Phone.eq(phone))
            .one(db)
            .await
            .map_err(Error::from)
    }

    pub async fn insert(db: &DatabaseConnection, active_user: ActiveModel) -> Result<Model> {
        active_user.insert(db).await.map_err(Error::from)
    }

    pub async fn update(db: &DatabaseConnection, _model: Model, active_user: ActiveModel) -> Result<Model> {
        // This is a bit tricky with Loco's active model, but generally:
        active_user.update(db).await.map_err(Error::from)
    }
}
