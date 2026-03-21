use server_api::app::App;
use loco_rs::testing::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serial_test::serial;
use uuid::Uuid;
use server_api::models::_entities::{buildings, floors, rooms};

use super::prepare_data;

#[tokio::test]
#[serial]
async fn can_list_available_rooms() {
    request::<App, _, _>(|request, ctx| async move {
        let user_data = prepare_data::init_user_login(&request, &ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user_data.token);

        // Create building
        let building = buildings::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            owner_id: ActiveValue::Set(user_data.user.id),
            name: ActiveValue::Set("Building 1".to_string()),
            address: ActiveValue::Set(Some("Address 1".to_string())),
            status: ActiveValue::Set("ACTIVE".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        }
        .insert(&ctx.db)
        .await
        .unwrap();

        // Create floor
        let floor = floors::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(building.id),
            identifier: ActiveValue::Set("Floor 1".to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
        }
        .insert(&ctx.db)
        .await
        .unwrap();

        // Create rooms: 1 VACANT, 1 OCCUPIED, 1 ARCHIVED
        let room1 = rooms::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(building.id),
            floor_id: ActiveValue::Set(Some(floor.id)),
            code: ActiveValue::Set("R101".to_string()),
            status: ActiveValue::Set("VACANT".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        }
        .insert(&ctx.db)
        .await
        .unwrap();

        rooms::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(building.id),
            floor_id: ActiveValue::Set(Some(floor.id)),
            code: ActiveValue::Set("R102".to_string()),
            status: ActiveValue::Set("OCCUPIED".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        }
        .insert(&ctx.db)
        .await
        .unwrap();

        // Another owner's building and room (should not be listed)
        let other_user_data = prepare_data::init_user_login(&request, &ctx).await;
        let other_building = buildings::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            owner_id: ActiveValue::Set(other_user_data.user.id),
            name: ActiveValue::Set("Other Building".to_string()),
            address: ActiveValue::Set(Some("Other Address".to_string())),
            status: ActiveValue::Set("ACTIVE".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        }
        .insert(&ctx.db)
        .await
        .unwrap();

        rooms::ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(other_building.id),
            floor_id: ActiveValue::Set(None),
            code: ActiveValue::Set("Other-R1".to_string()),
            status: ActiveValue::Set("VACANT".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        }
        .insert(&ctx.db)
        .await
        .unwrap();

        // Request available rooms
        let response = request
            .get("/api/v1/rooms/available")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(response.status_code(), 200);

        let rooms_list: Vec<serde_json::Value> = serde_json::from_str(&response.text()).unwrap();

        // Should only have 1 room (R101)
        assert_eq!(rooms_list.len(), 1);
        let room = &rooms_list[0];
        assert_eq!(room["room_code"], "R101");
        assert_eq!(room["building_name"], "Building 1");
        assert_eq!(room["room_address"], "Address 1");
        assert_eq!(room["floor_name"], "Floor 1");
        assert_eq!(room["id"], room1.id.to_string());
    })
    .await;
}
