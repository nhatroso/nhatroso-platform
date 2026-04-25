use loco_rs::{auth::jwt::JWT, model::ModelError, model::ModelResult, prelude::*};
use sea_orm::{entity::prelude::*, ActiveValue, ActiveModelTrait};
use uuid::Uuid;
use axum::http::StatusCode;

pub use super::_entities::users::{ActiveModel, Model, Entity};
pub type Users = Entity;

use crate::views::auth::{RegisterParams, LoginParams, AuthResponse};
use crate::models::_entities::refresh_tokens::Model as RefreshTokensModel;

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

pub struct AuthTokenPairs {
    pub access_token: String,
    pub refresh_token: String,
}

impl Model {
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
        loco_rs::hash::verify_password(password, &self.password_hash)
    }

    pub async fn generate_tokens(
        &self,
        db: &DatabaseConnection,
        jwt_secret: &str,
    ) -> ModelResult<AuthTokenPairs> {
        // 1 day expiration in seconds
        let expiration_seconds = 24 * 60 * 60;

        let jwt = JWT::new(jwt_secret);

        let access_token = jwt
            .generate_token(
                expiration_seconds,
                self.id.to_string(),
                serde_json::Map::new(),
            )
            .map_err(|e| {
                loco_rs::model::ModelError::Any(anyhow::anyhow!("JWT generation failed: {}", e).into())
            })?;

        // Create DB refresh token
        let (_, refresh_token) = RefreshTokensModel::create(db, self.id).await?;

        Ok(AuthTokenPairs {
            access_token,
            refresh_token,
        })
    }

    pub async fn register(
        db: &DatabaseConnection,
        jwt_secret: &str,
        params: RegisterParams,
    ) -> Result<std::result::Result<AuthResponse, (StatusCode, &'static str)>> {
        if params.name.trim().is_empty() {
            return Ok(Err((StatusCode::BAD_REQUEST, "AUTH_NAME_EMPTY")));
        }
        if params.phone.trim().is_empty() {
            return Ok(Err((StatusCode::BAD_REQUEST, "AUTH_PHONE_EMPTY")));
        }
        if params.password.len() < 8 {
            return Ok(Err((StatusCode::BAD_REQUEST, "AUTH_PASSWORD_TOO_SHORT")));
        }

        // Hash password
        let password_hash = loco_rs::hash::hash_password(&params.password)
            .map_err(|e| Error::Message(e.to_string()))?;

        let user_id = Uuid::new_v4();
        let email = params.email.as_ref().and_then(|e| {
            let trimmed = e.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        });

        let item = ActiveModel {
            id: ActiveValue::Set(user_id),
            email: ActiveValue::Set(email),
            name: ActiveValue::Set(params.name),
            password_hash: ActiveValue::Set(password_hash),
            role: ActiveValue::Set("TENANT".to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            phone: ActiveValue::Set(params.phone),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
        };

        let db_res = match item.insert(db).await {
            Ok(res) => res,
            Err(e) => {
                let err_msg = e.to_string();
                if err_msg.contains("UNIQUE constraint failed") || err_msg.contains("duplicate key value") {
                    return Ok(Err((StatusCode::BAD_REQUEST, "AUTH_USER_EXISTS")));
                }
                return Err(Error::from(e));
            }
        };

        let tokens = db_res.generate_tokens(db, jwt_secret).await?;

        Ok(Ok(AuthResponse {
            token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id: db_res.id,
            name: db_res.name,
            phone: db_res.phone,
        }))
    }

    pub async fn login(
        db: &DatabaseConnection,
        jwt_secret: &str,
        params: LoginParams,
    ) -> Result<std::result::Result<AuthResponse, (StatusCode, &'static str)>> {
        let user = Entity::find()
            .filter(super::_entities::users::Column::Phone.eq(&params.phone))
            .one(db)
            .await?;

        let Some(user) = user else {
            return Ok(Err((StatusCode::UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS")));
        };

        if !user.verify_password(&params.password) {
            return Ok(Err((StatusCode::UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS")));
        }

        let tokens = user.generate_tokens(db, jwt_secret).await?;

        Ok(Ok(AuthResponse {
            token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id: user.id,
            name: user.name,
            phone: user.phone,
        }))
    }

    pub async fn rotate_refresh_token(
        db: &DatabaseConnection,
        jwt_secret: &str,
        jti_str: &str,
    ) -> ModelResult<AuthTokenPairs> {
        // Validate and consume old token, which helps prevent reuse
        let token = RefreshTokensModel::validate_and_revoke(db, jti_str).await?;

        // Generate new pair for the same user
        let user = Entity::find_by_id(token.user_id).one(db).await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        user.generate_tokens(db, jwt_secret).await
    }

    pub async fn get_current_user(db: &DatabaseConnection, user_id: Uuid) -> Result<std::result::Result<Self, (StatusCode, &'static str)>> {
        let user = Entity::find_by_id(user_id).one(db).await?;
        let Some(user) = user else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };
        Ok(Ok(user))
    }
    pub async fn reset_password(
        db: &DatabaseConnection,
        user_id: Uuid,
        new_password: &str,
    ) -> Result<std::result::Result<(), (StatusCode, &'static str)>> {
        if new_password.len() < 8 {
            return Ok(Err((StatusCode::BAD_REQUEST, "AUTH_PASSWORD_TOO_SHORT")));
        }

        let user = Entity::find_by_id(user_id).one(db).await?;
        let Some(user) = user else {
            return Ok(Err((StatusCode::NOT_FOUND, "AUTH_USER_NOT_FOUND")));
        };

        let password_hash = loco_rs::hash::hash_password(new_password)
            .map_err(|e| Error::Message(e.to_string()))?;

        let mut item: ActiveModel = user.into();
        item.password_hash = ActiveValue::Set(password_hash);
        item.updated_at = ActiveValue::Set(chrono::Utc::now().into());
        item.update(db).await?;

        Ok(Ok(()))
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
