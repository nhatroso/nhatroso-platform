#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]

use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue};
use serde::{Deserialize, Serialize};

use crate::{
    models::_entities::users::ActiveModel, models::_entities::users::Model as UsersModel,
    services::auth_service,
};

use utoipa::ToSchema;
use axum::{http::StatusCode, response::IntoResponse};

fn error_response(code: &str, status: StatusCode) -> Result<Response> {
    Ok((
        status,
        Json(serde_json::json!({
            "success": false,
            "error": {
                "code": code
            }
        }))
    ).into_response())
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct RegisterParams {
    pub email: Option<String>,
    pub phone: String,
    pub name: String,
    pub password: String,
}

#[derive(Clone, Debug, Deserialize, ToSchema)]
pub struct LoginParams {
    pub phone: String,
    pub password: String,
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
    if params.name.trim().is_empty() {
        return error_response("AUTH_NAME_EMPTY", StatusCode::BAD_REQUEST);
    }
    if params.phone.trim().is_empty() {
        return error_response("AUTH_PHONE_EMPTY", StatusCode::BAD_REQUEST);
    }
    if params.password.len() < 8 {
        return error_response("AUTH_PASSWORD_TOO_SHORT", StatusCode::BAD_REQUEST);
    }

    // Hash password
    let password_hash =
        loco_rs::hash::hash_password(&params.password).map_err(|e| Error::Message(e.to_string()))?;

    let user_id = uuid::Uuid::new_v4();
    let item = ActiveModel {
        id: ActiveValue::Set(user_id),
        email: ActiveValue::Set(params.email),
        name: ActiveValue::Set(params.name),
        password_hash: ActiveValue::Set(password_hash),
        role: ActiveValue::Set("TENANT".to_string()),
        status: ActiveValue::Set("ACTIVE".to_string()),
        phone: ActiveValue::Set(params.phone),
        created_at: ActiveValue::Set(chrono::Utc::now().into()),
        updated_at: ActiveValue::Set(chrono::Utc::now().into()),
    };

    let db_res = match item.insert(&ctx.db).await {
        Ok(res) => res,
        Err(e) => {
            let err_msg = e.to_string();
            if err_msg.contains("UNIQUE constraint failed") || err_msg.contains("duplicate key value") {
                return error_response("AUTH_USER_EXISTS", StatusCode::BAD_REQUEST);
            }
            return Err(Error::from(e));
        }
    };

    let tokens = auth_service::generate_tokens(
        &ctx.db,
        &ctx.config
            .auth
            .as_ref()
            .unwrap()
            .jwt
            .as_ref()
            .unwrap()
            .secret,
        db_res.id,
    )
    .await?;

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
    let user_res = UsersModel::find_by_phone(&ctx.db, &params.phone).await;
    let user = match user_res {
        Ok(u) => u,
        Err(_) => return error_response("AUTH_INVALID_CREDENTIALS", StatusCode::UNAUTHORIZED),
    };

    let valid = user.verify_password(&params.password);
    if !valid {
        return error_response("AUTH_INVALID_CREDENTIALS", StatusCode::UNAUTHORIZED);
    }


    let tokens = auth_service::generate_tokens(
        &ctx.db,
        &ctx.config
            .auth
            .as_ref()
            .unwrap()
            .jwt
            .as_ref()
            .unwrap()
            .secret,
        user.id,
    )
    .await?;

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
    let tokens_res = auth_service::rotate_refresh_token(
        &ctx.db,
        &ctx.config
            .auth
            .as_ref()
            .unwrap()
            .jwt
            .as_ref()
            .unwrap()
            .secret,
        &params.refresh_token,
    )
    .await;

    let tokens = match tokens_res {
        Ok(t) => t,
        Err(_) => return error_response("AUTH_INVALID_REFRESH_TOKEN", StatusCode::UNAUTHORIZED)
    };

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
pub async fn current_user(auth: JWT, State(_ctx): State<AppContext>) -> Result<Response> {
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
