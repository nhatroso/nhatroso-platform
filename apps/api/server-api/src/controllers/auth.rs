#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]

use loco_rs::prelude::*;
use sea_orm::{ActiveValue, ActiveModelTrait};
use serde::{Deserialize, Serialize};

use crate::{
    models::_entities::users::Model as UsersModel,
    models::_entities::users::ActiveModel,
    services::auth_service,
};

use utoipa::ToSchema;

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct RegisterParams {
    pub email: String,
    pub password: Option<String>,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct LoginParams {
    pub email: String,
    pub password: Option<String>,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct RefreshParams {
    pub refresh_token: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct AuthResponse {
    pub token: String,
    pub refresh_token: String,
    pub id: uuid::Uuid,
}

#[utoipa::path(
    post,
    path = "/api/auth/register",
    request_body = RegisterParams,
    responses(
        (status = 200, description = "User registered successfully", body = AuthResponse)
    ),
    tag = "Auth"
)]
pub async fn register(
    State(ctx): State<AppContext>,
    Json(params): Json<RegisterParams>,
) -> Result<Response> {
    let password = params.password.unwrap_or_default();

    // Hash password
    let password_hash = loco_rs::hash::hash_password(&password).map_err(|e| Error::Message(e.to_string()))?;

    let user_id = uuid::Uuid::new_v4();
    let item = ActiveModel {
        id: ActiveValue::Set(user_id),
        email: ActiveValue::Set(Some(params.email.clone())),
        password_hash: ActiveValue::Set(password_hash),
        role: ActiveValue::Set("TENANT".to_string()),
        status: ActiveValue::Set("ACTIVE".to_string()),
        phone: ActiveValue::NotSet,
        created_at: ActiveValue::Set(chrono::Utc::now().into()),
        updated_at: ActiveValue::Set(chrono::Utc::now().into()),
    };

    let db_res = item.insert(&ctx.db).await?;

    let tokens = auth_service::generate_tokens(&ctx.db, &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret, db_res.id).await?;

    format::json(AuthResponse {
        token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id: db_res.id,
    })
}

#[utoipa::path(
    post,
    path = "/api/auth/login",
    request_body = LoginParams,
    responses(
        (status = 200, description = "Login successful", body = AuthResponse),
        (status = 401, description = "Unauthorized")
    ),
    tag = "Auth"
)]
pub async fn login(
    State(ctx): State<AppContext>,
    Json(params): Json<LoginParams>,
) -> Result<Response> {
    let user: UsersModel = UsersModel::find_by_email(&ctx.db, &params.email).await?;

    let valid = user.verify_password(&params.password.unwrap_or_default());
    if !valid {
        return Err(Error::Unauthorized("Invalid credentials".to_string()));
    }

    let tokens = auth_service::generate_tokens(&ctx.db, &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret, user.id).await?;

    format::json(AuthResponse {
        token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id: user.id,
    })
}

#[utoipa::path(
    post,
    path = "/api/auth/refresh",
    request_body = RefreshParams,
    responses(
        (status = 200, description = "Token refreshed successfully"),
        (status = 401, description = "Unauthorized")
    ),
    tag = "Auth"
)]
pub async fn refresh(
    State(ctx): State<AppContext>,
    Json(params): Json<RefreshParams>,
) -> Result<Response> {
    let tokens = auth_service::rotate_refresh_token(
        &ctx.db,
        &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret,
        &params.refresh_token
    ).await.map_err(|e| Error::Unauthorized(e.to_string()))?;

    format::json(serde_json::json!({
        "token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
    }))
}

// User-protected endpoint
use loco_rs::controller::extractor::auth::JWT;

#[utoipa::path(
    post,
    path = "/api/auth/logout",
    request_body = RefreshParams,
    responses(
        (status = 200, description = "Logged out successfully")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Auth"
)]
pub async fn logout(
    _auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<RefreshParams>,
) -> Result<Response> {
    auth_service::revoke_token(&ctx.db, &params.refresh_token).await?;
    format::empty()
}

#[utoipa::path(
    get,
    path = "/api/auth/me",
    responses(
        (status = 200, description = "Current user info")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Auth"
)]
pub async fn current_user(
    auth: JWT,
    State(_ctx): State<AppContext>,
) -> Result<Response> {
    format::json(serde_json::json!({
        "status": "ok",
        "user_id": auth.claims.pid
    }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/auth")
        .add("/register", post(register))
        .add("/login", post(login))
        .add("/refresh", post(refresh))
        .add("/logout", post(logout))
        .add("/me", get(current_user))
}
