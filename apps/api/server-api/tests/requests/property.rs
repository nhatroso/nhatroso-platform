use loco_rs::testing::prelude::*;
use serial_test::serial;
use server_api::app::App;
use std::sync::Once;

use crate::requests::prepare_data;

static INIT: Once = Once::new();

pub fn init_logger() {
    INIT.call_once(|| {
        let _ = tracing_subscriber::fmt()
            .with_env_filter("server_api=debug,loco_rs=debug")
            .try_init();
    });
}

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("property_request");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_property_workflow() {
    init_logger();
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        // Login for the tests
        let user_data = prepare_data::init_user_login(&request, &ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user_data.token);

        // 1. Create Building
        let create_building_payload = serde_json::json!({
            "name": "Sunshine Apartments",
            "address": "123 Solar Street"
        });

        let res = request
            .post("/api/v1/buildings")
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&create_building_payload)
            .await;

        assert_eq!(res.status_code(), 200, "Create building should succeed");
        let building_res: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        let building_id = building_res["id"].as_str().unwrap().to_string();
        assert_eq!(building_res["name"], "Sunshine Apartments");

        // 2. Create Floor
        let create_floor_payload = serde_json::json!({
            "building_id": building_id,
            "identifier": "FL-01"
        });

        let res = request
            .post("/api/v1/floors")
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&create_floor_payload)
            .await;

        assert_eq!(res.status_code(), 200, "Create floor should succeed");
        let floor_res: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        let floor_id = floor_res["id"].as_str().unwrap().to_string();

        // 3. Create Room
        let create_room_payload = serde_json::json!({
            "building_id": building_id,
            "floor_id": floor_id,
            "code": "101"
        });

        let res = request
            .post("/api/v1/rooms")
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&create_room_payload)
            .await;

        assert_eq!(res.status_code(), 200, "Create room should succeed");
        let room_res: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        let room_id = room_res["id"].as_str().unwrap().to_string();
        assert_eq!(room_res["status"], "VACANT");

        // 4. Update Room Status to OCCUPIED
        let update_status_payload = serde_json::json!({
            "status": "OCCUPIED"
        });

        let res = request
            .put(&format!("/api/v1/rooms/{}/status", room_id))
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&update_status_payload)
            .await;

        assert_eq!(res.status_code(), 200, "Update room status should succeed");

        // 5. Try to archive building (should fail because room is occupied)
        let res = request
            .post(&format!("/api/v1/buildings/{}/archive", building_id))
            .add_header(auth_key.clone(), auth_value.clone())
            .await;

        assert_ne!(
            res.status_code(),
            200,
            "Archive building with active room should fail"
        );

        // 6. Change Room to VACANT
        let revert_status_payload = serde_json::json!({
            "status": "VACANT"
        });

        let res = request
            .put(&format!("/api/v1/rooms/{}/status", room_id))
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&revert_status_payload)
            .await;

        assert_eq!(res.status_code(), 200, "Revert room status should succeed");

        // 7. Archive building successfully
        let res = request
            .post(&format!("/api/v1/buildings/{}/archive", building_id))
            .add_header(auth_key.clone(), auth_value.clone())
            .await;

        assert_eq!(
            res.status_code(),
            200,
            "Archive building should succeed when empty"
        );
        let archived_building: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(archived_building["status"], "ARCHIVED");
    })
    .await;
}
