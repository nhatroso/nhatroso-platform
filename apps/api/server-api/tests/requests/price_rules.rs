use server_api::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

#[tokio::test]
#[serial]
async fn can_list_price_rules_by_building() {
    request::<App, _, _>(|request, _ctx| async move {
        // Just a basic check to ensure the routes are connected
        let uuid = uuid::Uuid::new_v4();
        let string_uuid = uuid.to_string();
        let res = request.get(format!("/api/v1/price-rules/building/{}", string_uuid).as_str()).await;
        // Since it's public/or auth-protected, we just check it doesn't 404
        // If it requires auth, it might return 401. If it doesn't, it might return 200 with empty array.
        assert!(res.status_code() == 200 || res.status_code() == 401);
    })
    .await;
}
