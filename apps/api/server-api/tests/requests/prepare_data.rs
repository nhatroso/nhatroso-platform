use axum::http::{HeaderName, HeaderValue};
use loco_rs::{app::AppContext, TestServer};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use server_api::{controllers::auth::AuthResponse, models::_entities::users};

const USER_EMAIL: &str = "test@loco.com";
const USER_PASSWORD: &str = "12341234";

pub struct LoggedInUser {
    pub user: users::Model,
    pub token: String,
    pub refresh_token: String,
}

pub async fn init_user_login(request: &TestServer, ctx: &AppContext) -> LoggedInUser {
    let register_payload = serde_json::json!({
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    });

    // Creating a new user
    request
        .post("/api/auth/register")
        .json(&register_payload)
        .await;

    let response = request
        .post("/api/auth/login")
        .json(&serde_json::json!({
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        }))
        .await;

    let login_response: AuthResponse = serde_json::from_str(&response.text()).unwrap();

    LoggedInUser {
        user: users::Entity::find()
            .filter(users::Column::Email.eq(USER_EMAIL))
            .one(&ctx.db)
            .await
            .unwrap()
            .unwrap(),
        token: login_response.token,
        refresh_token: login_response.refresh_token,
    }
}

pub fn auth_header(token: &str) -> (HeaderName, HeaderValue) {
    let auth_header_value = HeaderValue::from_str(&format!("Bearer {}", &token)).unwrap();

    (HeaderName::from_static("authorization"), auth_header_value)
}
