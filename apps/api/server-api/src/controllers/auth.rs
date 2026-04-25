use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use axum::Json;

use crate::{
    views::auth::{RegisterParams, LoginParams, RefreshParams},
    models::{users::Model as User, _entities::refresh_tokens::Model as RefreshTokens},
    utils::{auth, error::error_response},
};

pub async fn register(
    State(ctx): State<AppContext>,
    Json(params): Json<RegisterParams>,
) -> Result<Response> {
    let secret = &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret;
    match User::register(&ctx.db, secret, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn login(
    State(ctx): State<AppContext>,
    Json(params): Json<LoginParams>,
) -> Result<Response> {
    let secret = &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret;
    match User::login(&ctx.db, secret, params).await? {
        Ok(res) => format::json(res),
        Err((status, code)) => error_response(code, status),
    }
}

pub async fn refresh(
    State(ctx): State<AppContext>,
    Json(params): Json<RefreshParams>,
) -> Result<Response> {
    let secret = &ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret;
    let tokens_res = User::rotate_refresh_token(&ctx.db, secret, &params.refresh_token).await;

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
    RefreshTokens::revoke(&ctx.db, &params.refresh_token).await?;
    format::empty()
}

pub async fn current_user(auth: JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user_id = auth::get_user_id(&auth)?;
    match User::get_current_user(&ctx.db, user_id).await? {
        Ok(user) => format::json(serde_json::json!({
            "status": "ok",
            "user": user
        })),
        Err((status, code)) => error_response(code, status),
    }
}

use crate::views::auth::{ForgotPasswordParams, ResetPasswordParams, VerifyOtpParams};
use crate::jobs::email_job::EmailJob;
use rand::Rng;

pub async fn forgot_password(
    State(ctx): State<AppContext>,
    Json(params): Json<ForgotPasswordParams>,
) -> Result<Response> {
    // 1. Verify user exists
    let _user = match User::find_by_email(&ctx.db, &params.email).await {
        Ok(u) => u,
        Err(_) => return format::empty(), // Return generic success to prevent email enumeration
    };

    // 2. Generate 6-digit OTP
    let mut rng = rand::rngs::OsRng;
    let otp: u32 = rng.gen_range(100000..999999);
    let otp_str = otp.to_string();

    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());

    // 3. Store OTP in Redis
    let client = redis::Client::open(redis_url.clone()).map_err(|e| Error::Message(e.to_string()))?;
    let mut con = client.get_multiplexed_async_connection().await.map_err(|e| Error::Message(e.to_string()))?;

    let redis_key = format!("reset_otp:{}", params.email);
    let _: () = redis::cmd("SETEX")
        .arg(&redis_key)
        .arg(900) // 15 mins TTL
        .arg(&otp_str)
        .query_async(&mut con)
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

    // 4. Send Email
    let email_job = EmailJob::new(
        params.email.clone(),
        "Mã khôi phục mật khẩu Nhatroso".to_string(),
        "forgot_password.html".to_string(),
        serde_json::json!({ "otp_code": otp_str }),
    );

    EmailJob::enqueue_email(&redis_url, email_job).await.map_err(|e| Error::Message(e.to_string()))?;

    format::empty()
}

pub async fn verify_otp(
    Json(params): Json<VerifyOtpParams>,
) -> Result<Response> {
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    let client = redis::Client::open(redis_url).map_err(|e| Error::Message(e.to_string()))?;
    let mut con = client.get_multiplexed_async_connection().await.map_err(|e| Error::Message(e.to_string()))?;

    let redis_key = format!("reset_otp:{}", params.email);
    let stored_otp: Option<String> = redis::cmd("GET")
        .arg(&redis_key)
        .query_async(&mut con)
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

    let Some(stored_otp) = stored_otp else {
        return error_response("AUTH_INVALID_OTP", axum::http::StatusCode::BAD_REQUEST);
    };

    if stored_otp != params.otp {
        return error_response("AUTH_INVALID_OTP", axum::http::StatusCode::BAD_REQUEST);
    }

    // Delete 6-digit OTP so it can NEVER be reused
    let _: () = redis::cmd("DEL").arg(&redis_key).query_async(&mut con).await.map_err(|e| Error::Message(e.to_string()))?;

    let reset_token = uuid::Uuid::new_v4().to_string();
    let token_key = format!("reset_token:{}", reset_token);

    let _: () = redis::cmd("SETEX")
        .arg(&token_key)
        .arg(300) // 5 mins TTL
        .arg(&params.email)
        .query_async(&mut con)
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

    format::json(serde_json::json!({
        "reset_token": reset_token
    }))
}

pub async fn reset_password(
    State(ctx): State<AppContext>,
    Json(params): Json<ResetPasswordParams>,
) -> Result<Response> {
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    let client = redis::Client::open(redis_url).map_err(|e| Error::Message(e.to_string()))?;
    let mut con = client.get_multiplexed_async_connection().await.map_err(|e| Error::Message(e.to_string()))?;

    let token_key = format!("reset_token:{}", params.reset_token);

    let email: Option<String> = redis::cmd("GET")
        .arg(&token_key)
        .query_async(&mut con)
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

    let Some(email) = email else {
        return error_response("AUTH_INVALID_REFRESH_TOKEN", axum::http::StatusCode::BAD_REQUEST);
    };

    let user = User::find_by_email(&ctx.db, &email)
        .await
        .map_err(|_| Error::NotFound)?;

    match User::reset_password(&ctx.db, user.id, &params.password).await? {
        Ok(_) => {
            // Success: Delete token key to prevent reuse
            let _: () = redis::cmd("DEL").arg(&token_key).query_async(&mut con).await.unwrap_or(());
            format::empty()
        }
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
        .add("/forgot-password", post(forgot_password))
        .add("/verify-otp", post(verify_otp))
        .add("/reset-password", post(reset_password))
}
