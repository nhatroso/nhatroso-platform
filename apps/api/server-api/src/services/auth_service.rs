use loco_rs::{auth::jwt::JWT, model::ModelResult};
use sea_orm::DatabaseConnection;
use uuid::Uuid;

use crate::models::_entities::refresh_tokens::Model as RefreshTokensModel;

pub struct AuthTokenPairs {
    pub access_token: String,
    pub refresh_token: String,
}

pub async fn generate_tokens(
    db: &DatabaseConnection,
    jwt_secret: &str,
    user_id: Uuid,
) -> ModelResult<AuthTokenPairs> {
    // 15m expiration in seconds
    let expiration_seconds = 15 * 60;

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
    generate_tokens(db, jwt_secret, token.user_id).await
}

pub async fn revoke_token(db: &DatabaseConnection, jti_str: &str) -> ModelResult<()> {
    RefreshTokensModel::revoke(db, jti_str).await
}
