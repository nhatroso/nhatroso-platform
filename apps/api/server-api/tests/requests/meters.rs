use server_api::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;
use uuid::Uuid;
use server_api::models::_entities::{buildings, rooms, services, meters, contracts, contract_tenants};
use sea_orm::{ActiveModelTrait, ActiveValue};
use rust_decimal::Decimal;

use super::prepare_data;

#[tokio::test]
#[serial]
async fn can_submit_ocr_reading() {
    request::<App, _, _>(|request, ctx| async move {
        let user_data = prepare_data::init_user_login(&request, &ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user_data.token);

        let building = buildings::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            owner_id: ActiveValue::Set(user_data.user.id),
            name: ActiveValue::Set("B1".to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
        }.insert(&ctx.db).await.unwrap();

        let room = rooms::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(building.id),
            code: ActiveValue::Set("R1".to_string()),
            status: ActiveValue::Set("OCCUPIED".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
        }.insert(&ctx.db).await.unwrap();

        let service = services::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            owner_id: ActiveValue::Set(user_data.user.id),
            name: ActiveValue::Set("Electricity".to_string()),
            unit: ActiveValue::Set("kWh".to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
        }.insert(&ctx.db).await.unwrap();

        let meter = meters::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            room_id: ActiveValue::Set(room.id),
            service_id: ActiveValue::Set(service.id),
            initial_reading: ActiveValue::Set(Decimal::new(0, 0)),
            status: ActiveValue::Set("ACTIVE".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
        }.insert(&ctx.db).await.unwrap();

        let contract = contracts::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            room_id: ActiveValue::Set(room.id),
            user_id: ActiveValue::Set(user_data.user.id),
            start_date: ActiveValue::Set(chrono::Utc::now().date_naive()),
            end_date: ActiveValue::Set(chrono::Utc::now().date_naive() + chrono::Duration::days(365)),
            status: ActiveValue::Set("ACTIVE".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
        }.insert(&ctx.db).await.unwrap();

        let _contract_tenant = contract_tenants::ActiveModel {
            contract_id: ActiveValue::Set(contract.id),
            tenant_id: ActiveValue::Set(user_data.user.id),
            ..Default::default()
        }.insert(&ctx.db).await.unwrap();

        let payload = serde_json::json!({
            "image_url": "https://fake-s3-url.com/image.jpg",
            "period_month": "04-2026"
        });

        let res = request
            .post(&format!("/api/v1/meters/{}/ocr", meter.id))
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&payload)
            .await;

        let text = res.text();
        assert_eq!(res.status_code(), 200, "Expected 200 OK for OCR submission, but got: {}", text);

        let res_json: serde_json::Value = serde_json::from_str(&text).unwrap();
        assert_eq!(res_json["status"], "PENDING");
        assert_eq!(res_json["meter_id"], meter.id.to_string());
        assert_eq!(res_json["image_url"], "https://fake-s3-url.com/image.jpg");
    })
    .await;
}
