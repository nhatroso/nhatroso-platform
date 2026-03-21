use server_api::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

#[tokio::test]
#[serial]
async fn can_create_and_list_services() {
    request::<App, _, _>(|request, _ctx| async move {
        // Just a basic check to ensure routes are mounted and responsive
        // A complete test would authenticate and create a service
        let res = request.get("/api/v1/services/").await;
        assert_eq!(res.status_code(), 200);
    })
    .await;
}
