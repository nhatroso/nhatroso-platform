use server_api::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;
use super::prepare_data;
use server_api::models::_entities::{contracts, users};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use uuid::Uuid;

#[tokio::test]
#[serial]
async fn can_create_contract_and_update_tenant_identity() {
    request::<App, _, _>(|request, ctx| async move {
        // 1. Setup Landlord and login
        let landlord = prepare_data::init_user_login(&request, &ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&landlord.token);

        // 2. Setup Building
        let building_res = request
            .post("/api/v1/buildings")
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&serde_json::json!({
                "name": "Building 1",
                "address": "123 Main St"
            }))
            .await;
        assert_eq!(building_res.status_code(), 200);
        let building_json: serde_json::Value = serde_json::from_str(&building_res.text()).unwrap();
        let building_id = building_json.get("id").unwrap().as_str().unwrap();

        // 3. Setup Floor
        let floor_res = request
            .post(&format!("/api/v1/buildings/{}/floors", building_id))
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&serde_json::json!({
                "identifier": "Floor 1"
            }))
            .await;
        assert_eq!(floor_res.status_code(), 200);
        let floor_json: serde_json::Value = serde_json::from_str(&floor_res.text()).unwrap();
        let floor_id = floor_json.get("id").unwrap().as_str().unwrap();

        // 4. Setup Room
        let room_res = request
            .post(&format!("/api/v1/floors/{}/rooms", floor_id))
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&serde_json::json!({
                "code": "101"
            }))
            .await;
        assert_eq!(room_res.status_code(), 200);
        let room_json: serde_json::Value = serde_json::from_str(&room_res.text()).unwrap();
        let room_id = room_json.get("id").unwrap().as_str().unwrap();

        // 5. Prepare payload with owner and tenant info
        let landlord_phone = "0900000000";
        let tenant_phone = "0987654321";
        let payload = serde_json::json!({
            "room_id": room_id,
            "owner_name": "Nguyen Van A (Landlord)",
            "owner_id_card": "987654321",
            "owner_id_card_date": "1980-01-01",
            "owner_address": "Landlord Addr",
            "owner_phone": landlord_phone,
            "tenant_name": "Nguyen Van B",
            "tenant_id_card": "123456789",
            "tenant_id_card_date": "2020-01-01",
            "tenant_address": "Hanoi, Vietnam",
            "tenant_phone": tenant_phone,
            "start_date": "2024-03-17",
            "end_date": "2025-03-17",
            "monthly_rent": 5000000,
            "deposit_amount": 10000000,
            "payment_day": 5,
            "rental_period": 12,
            "room_code": "101",
            "room_address": "123 Main St"
        });

        // 6. Call create contract endpoint
        let res = request
            .post("/api/v1/contracts")
            .add_header(auth_key, auth_value)
            .json(&payload)
            .await;

        assert_eq!(res.status_code(), 200, "Contract creation failed: {}", res.text());

        // 7. Verify database: Contract exists and has rental_period
        let room_uuid = Uuid::parse_str(room_id).unwrap();
        let contract: contracts::Model = contracts::Entity::find()
            .filter(contracts::Column::RoomId.eq(room_uuid))
            .one(&ctx.db)
            .await
            .unwrap()
            .expect("contract not found");
        
        assert_eq!(contract.user_id, landlord.user.id);
        assert_eq!(contract.monthly_rent, 5000000);
        assert_eq!(contract.rental_period, 12);

        // 8. Verify database: Landlord user profile updated
        let updated_landlord: users::Model = users::Entity::find_by_id(landlord.user.id)
            .one(&ctx.db)
            .await
            .unwrap()
            .expect("landlord not found");
        
        assert_eq!(updated_landlord.name, "Nguyen Van A (Landlord)");
        assert_eq!(updated_landlord.id_card, Some("987654321".to_string()));
        assert_eq!(updated_landlord.id_card_date, Some(chrono::NaiveDate::from_ymd_opt(1980, 1, 1).unwrap()));
        assert_eq!(updated_landlord.address, Some("Landlord Addr".to_string()));
        assert_eq!(updated_landlord.phone, landlord_phone);

        // 9. Verify database: Tenant user exists and has identity fields
        let tenant_user: users::Model = users::Entity::find()
            .filter(users::Column::Phone.eq(tenant_phone))
            .one(&ctx.db)
            .await
            .unwrap()
            .expect("tenant user not found");
        
        assert_eq!(tenant_user.name, "Nguyen Van B");
        assert_eq!(tenant_user.id_card, Some("123456789".to_string()));
        assert_eq!(tenant_user.id_card_date, Some(chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap()));
        assert_eq!(tenant_user.address, Some("Hanoi, Vietnam".to_string()));
    })
    .await;
}
