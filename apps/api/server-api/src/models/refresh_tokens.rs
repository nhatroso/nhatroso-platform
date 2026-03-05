use super::_entities::refresh_tokens::{ActiveModel, Entity};
use chrono::{Duration, Utc};
use loco_rs::model::{ModelError, ModelResult};
use sea_orm::{entity::prelude::*, ActiveValue};
use uuid::Uuid;

impl ActiveModelBehavior for ActiveModel {}

impl super::_entities::refresh_tokens::Model {
    pub async fn create(db: &DatabaseConnection, user_id: Uuid) -> ModelResult<(Self, String)> {
        let jti = Uuid::new_v4();

        let refresh_token = ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            user_id: ActiveValue::Set(user_id),
            jti: ActiveValue::Set(jti),
            expires_at: ActiveValue::Set((Utc::now() + Duration::days(7)).into()),
            created_at: ActiveValue::Set(Utc::now().into()),
            revoked_at: ActiveValue::NotSet,
        };

        let res = refresh_token.insert(db).await?;
        Ok((res, jti.to_string()))
    }

    pub async fn validate_and_revoke(db: &DatabaseConnection, jti_str: &str) -> ModelResult<Self> {
        let jti = Uuid::parse_str(jti_str)
            .map_err(|_| ModelError::Any(anyhow::anyhow!("Invalid token format").into()))?;

        let token = Entity::find()
            .filter(super::_entities::refresh_tokens::Column::Jti.eq(jti))
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        if token.revoked_at.is_some() {
            return Err(ModelError::Any(anyhow::anyhow!("Token is revoked").into()));
        }

        let now: DateTimeWithTimeZone = Utc::now().into();
        if token.expires_at < now {
            return Err(ModelError::Any(anyhow::anyhow!("Token is expired").into()));
        }

        // Revoke token immediately to prevent reuse (rotation)
        let mut active_token: ActiveModel = token.clone().into();
        active_token.revoked_at = ActiveValue::Set(Some(Utc::now().into()));
        active_token.update(db).await?;

        Ok(token)
    }

    pub async fn revoke(db: &DatabaseConnection, jti_str: &str) -> ModelResult<()> {
        let jti = Uuid::parse_str(jti_str)
            .map_err(|_| ModelError::Any(anyhow::anyhow!("Invalid token format").into()))?;

        let token = Entity::find()
            .filter(super::_entities::refresh_tokens::Column::Jti.eq(jti))
            .one(db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        let mut active_token: ActiveModel = token.into();
        active_token.revoked_at = ActiveValue::Set(Some(Utc::now().into()));
        active_token.update(db).await?;
        Ok(())
    }
}
