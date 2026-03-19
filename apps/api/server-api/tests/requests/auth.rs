use loco_rs::testing::prelude::*;
use sea_orm::ColumnTrait;
use sea_orm::EntityTrait;
use sea_orm::QueryFilter;
use serial_test::serial;
use server_api::{app::App, models::_entities::users};

use super::prepare_data;

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("auth_request");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn can_register() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        let email = "test@loco.com";
        let payload = serde_json::json!({
            "email": email,
            "phone": "1234567890",
            "name": "Test User",
            "password": "my_secure_password"
        });

        let response = request.post("/api/auth/register").json(&payload).await;
        assert_eq!(
            response.status_code(),
            200,
            "Register request should succeed, got error: {}",
            response.text()
        );

        let saved_user = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(&ctx.db)
            .await
            .unwrap();

        assert!(saved_user.is_some(), "User should be saved in the database");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_register_with_empty_email() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        let phone1 = "1122334455";
        let payload1 = serde_json::json!({
            "email": "",
            "phone": phone1,
            "name": "User 1",
            "password": "my_secure_password"
        });

        let response1 = request.post("/api/auth/register").json(&payload1).await;
        assert_eq!(response1.status_code(), 200);

        // Try to register another user with empty email
        let phone2 = "5544332211";
        let payload2 = serde_json::json!({
            "email": "",
            "phone": phone2,
            "name": "User 2",
            "password": "my_secure_password"
        });

        let response2 = request.post("/api/auth/register").json(&payload2).await;
        assert_eq!(
            response2.status_code(),
            200,
            "Registration should succeed for second user with empty email, but got: {}",
            response2.text()
        );

        let saved_user2 = users::Entity::find()
            .filter(users::Column::Phone.eq(phone2))
            .one(&ctx.db)
            .await
            .unwrap()
            .unwrap();

        assert!(saved_user2.email.is_none(), "Email should be saved as NULL");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_login() {
    configure_insta!();

    request::<App, _, _>(|request, _ctx| async move {
        let email = "test2@loco.com";
        let password = "12341234";
        let register_payload = serde_json::json!({
            "email": email,
            "phone": "0987654321",
            "name": "Test User 2",
            "password": password
        });

        let register_response = request
            .post("/api/auth/register")
            .json(&register_payload)
            .await;

        assert_eq!(
            register_response.status_code(),
            200,
            "Register request should succeed"
        );

        let login_response = request
            .post("/api/auth/login")
            .json(&serde_json::json!({
                "phone": "0987654321",
                "password": password
            }))
            .await;

        assert_eq!(
            login_response.status_code(),
            200,
            "Login request should succeed"
        );

        // Assert token is present
        let json: serde_json::Value = serde_json::from_str(&login_response.text()).unwrap();
        assert!(json.get("token").is_some());
        assert!(json.get("refresh_token").is_some());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_get_current_user() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        let user_data = prepare_data::init_user_login(&request, &ctx).await;

        let (auth_key, auth_value) = prepare_data::auth_header(&user_data.token);

        let response = request
            .get("/api/auth/me")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(response.status_code(), 200, "Me request should succeed");

        let json: serde_json::Value = serde_json::from_str(&response.text()).unwrap();
        assert_eq!(json.get("status").unwrap().as_str().unwrap(), "ok");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_refresh_token() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        let user_data = prepare_data::init_user_login(&request, &ctx).await;

        let payload = serde_json::json!({
            "refresh_token": user_data.refresh_token,
        });

        let response = request.post("/api/auth/refresh").json(&payload).await;

        assert_eq!(
            response.status_code(),
            200,
            "Refresh request should succeed"
        );

        let json: serde_json::Value = serde_json::from_str(&response.text()).unwrap();
        assert!(json.get("token").is_some());
        assert!(json.get("refresh_token").is_some());

        // Should not be able to reuse the old refresh token
        let reused_response = request.post("/api/auth/refresh").json(&payload).await;

        assert_eq!(
            reused_response.status_code(),
            401,
            "Reusing refresh token should fail with unauthorized"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_logout() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        let user_data = prepare_data::init_user_login(&request, &ctx).await;

        let (auth_key, auth_value) = prepare_data::auth_header(&user_data.token);

        let payload = serde_json::json!({
            "refresh_token": user_data.refresh_token,
        });

        let response = request
            .post("/api/auth/logout")
            .add_header(auth_key, auth_value)
            .json(&payload)
            .await;

        assert_eq!(response.status_code(), 200, "Logout request should succeed");

        // Refresh token should now be invalid
        let refresh_response = request.post("/api/auth/refresh").json(&payload).await;

        assert_eq!(
            refresh_response.status_code(),
            401,
            "Refresh with revoked token should fail"
        );
    })
    .await;
}
