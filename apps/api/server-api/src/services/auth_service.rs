use loco_rs::{auth::jwt::JWT, model::ModelResult, prelude::*};
use sea_orm::{DatabaseConnection, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;

use crate::models::_entities::refresh_tokens::Model as RefreshTokensModel;
use crate::models::_entities::users::{ActiveModel as UserActiveModel, Model as UserModel};
use crate::dto::auth::{RegisterParams, LoginParams, AuthResponse};
use crate::repositories::users::UserRepository;

pub struct AuthTokenPairs {
    pub access_token: String,
    pub refresh_token: String,
}

pub struct AuthService;

impl AuthService {
    pub async fn generate_tokens(
        db: &DatabaseConnection,
        jwt_secret: &str,
        user_id: Uuid,
    ) -> ModelResult<AuthTokenPairs> {
        // 1 day expiration in seconds
        let expiration_seconds = 24 * 60 * 60;

        let jwt = JWT::new(jwt_secret);

        let access_token = jwt
            .generate_token(
                expiration_seconds,
                user_id.to_string(),
                serde_json::Map::new(),
            )
            .map_err(|e| {
                loco_rs::model::ModelError::Any(anyhow::anyhow!("JWT generation failed: {}", e).into())
            })?;

        // Create DB refresh token
        let (_, refresh_token) = RefreshTokensModel::create(db, user_id).await?;

        Ok(AuthTokenPairs {
            access_token,
            refresh_token,
        })
    }

    pub async fn rotate_refresh_token(
        db: &DatabaseConnection,
        jwt_secret: &str,
        jti_str: &str,
    ) -> ModelResult<AuthTokenPairs> {
        // Validate and consume old token, which helps prevent reuse
        let token = RefreshTokensModel::validate_and_revoke(db, jti_str).await?;

        // Generate new pair for the same user
        Self::generate_tokens(db, jwt_secret, token.user_id).await
    }

    pub async fn revoke_token(db: &DatabaseConnection, jti_str: &str) -> ModelResult<()> {
        RefreshTokensModel::revoke(db, jti_str).await
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

        let item = UserActiveModel {
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

        let db_res = match UserRepository::insert(db, item).await {
            Ok(res) => res,
            Err(e) => {
                let err_msg = e.to_string();
                if err_msg.contains("UNIQUE constraint failed") || err_msg.contains("duplicate key value") {
                    return Ok(Err((StatusCode::BAD_REQUEST, "AUTH_USER_EXISTS")));
                }
                return Err(Error::from(e));
            }
        };

        let tokens = Self::generate_tokens(db, jwt_secret, db_res.id).await?;

        Ok(Ok(AuthResponse {
            token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id: db_res.id,
        }))
    }

    pub async fn login(
        db: &DatabaseConnection,
        jwt_secret: &str,
        params: LoginParams,
    ) -> Result<std::result::Result<AuthResponse, (StatusCode, &'static str)>> {
        let user = UserRepository::find_by_phone(db, &params.phone).await?;
        let Some(user) = user else {
            return Ok(Err((StatusCode::UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS")));
        };

        if !user.verify_password(&params.password) {
            return Ok(Err((StatusCode::UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS")));
        }

        let tokens = Self::generate_tokens(db, jwt_secret, user.id).await?;

        Ok(Ok(AuthResponse {
            token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id: user.id,
        }))
    }

    pub async fn get_current_user(db: &DatabaseConnection, user_id: Uuid) -> Result<std::result::Result<UserModel, (StatusCode, &'static str)>> {
        let user = UserRepository::find_by_id(db, user_id).await?;
        let Some(user) = user else {
            return Ok(Err((StatusCode::NOT_FOUND, "NOT_FOUND")));
        };
        Ok(Ok(user))
    }
}
