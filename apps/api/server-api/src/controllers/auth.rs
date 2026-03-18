use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;

use crate::{
    dto::auth::{RegisterParams, LoginParams, RefreshParams},
    services::auth_service::AuthService,
    utils::{auth, error::error_response},
};

pub async fn register(
    State(ctx): State<AppContext>,
    Json(params): Json<RegisterParams>,
) -> Result<Response> {
    let secret = &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret;
    match AuthService::register(&ctx.db, secret, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn login(
    State(ctx): State<AppContext>,
    Json(params): Json<LoginParams>,
) -> Result<Response> {
    let secret = &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret;
    match AuthService::login(&ctx.db, secret, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn refresh(
    State(ctx): State<AppContext>,
    Json(params): Json<RefreshParams>,
) -> Result<Response> {
    let secret = &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret;
    let tokens_res = AuthService::rotate_refresh_token(&ctx.db, secret, &params.refresh_token).await;

    match tokens_res {
        Ok(tokens) => format::json(serde_json::json!({
            "token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
        })),
        Err(_) => error_response("AUTH_INVALID_REFRESH_TOKEN", axum::http::StatusCode::UNAUTHORIZED),
    }
}

pub async fn logout(
    _auth: JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<RefreshParams>,
) -> Result<Response> {
    AuthService::revoke_token(&ctx.db, &params.refresh_token).await?;
    format::empty()
}

pub async fn current_user(auth: JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user_id = auth::get_user_id(&auth)?;
    match AuthService::get_current_user(&ctx.db, user_id).await? {
        Ok(user) => format::json(user),
        Err((status, code)) => error_response(code, status),
    }
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
