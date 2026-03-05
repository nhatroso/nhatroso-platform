use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::controllers::auth::register,
        crate::controllers::auth::login,
        crate::controllers::auth::refresh,
        crate::controllers::auth::logout,
        crate::controllers::auth::current_user,
        crate::controllers::property::create_building,
        crate::controllers::property::update_building,
        crate::controllers::property::archive_building,
        crate::controllers::property::create_floor,
        crate::controllers::property::create_room,
        crate::controllers::property::update_room_status,
        crate::controllers::property::archive_room,
    ),
    components(
        schemas(
            crate::controllers::auth::RegisterParams,
            crate::controllers::auth::LoginParams,
            crate::controllers::auth::RefreshParams,
            crate::controllers::auth::AuthResponse,
            crate::dtos::property::CreateBuildingParams,
            crate::dtos::property::UpdateBuildingParams,
            crate::dtos::property::CreateFloorParams,
            crate::dtos::property::CreateRoomParams,
            crate::dtos::property::UpdateRoomStatusParams,
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "Auth", description = "Authentication endpoints"),
        (name = "Property", description = "Property Management endpoints")
    )
)]
pub struct ApiDoc;

struct SecurityAddon;

impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi.components.get_or_insert_with(Default::default);
        components.add_security_scheme(
            "bearer_auth",
            utoipa::openapi::security::SecurityScheme::Http(
                utoipa::openapi::security::HttpBuilder::new()
                    .scheme(utoipa::openapi::security::HttpAuthScheme::Bearer)
                    .bearer_format("JWT")
                    .build(),
            ),
        );
    }
}
