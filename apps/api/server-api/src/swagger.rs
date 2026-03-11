use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::controllers::auth::register,
        crate::controllers::auth::login,
        crate::controllers::auth::refresh,
        crate::controllers::auth::logout,
        crate::controllers::auth::current_user,
        crate::controllers::buildings::create,
        crate::controllers::buildings::list,
        crate::controllers::buildings::update,
        crate::controllers::buildings::archive,
        crate::controllers::blocks::create,
        crate::controllers::blocks::list_by_building,
        crate::controllers::blocks::update,
        crate::controllers::floors::create,
        crate::controllers::floors::list_by_block,
        crate::controllers::floors::update,
        crate::controllers::rooms::create,
        crate::controllers::rooms::list_by_floor,
        crate::controllers::rooms::update,
    ),
    components(
        schemas(
            crate::controllers::auth::RegisterParams,
            crate::controllers::auth::LoginParams,
            crate::controllers::auth::RefreshParams,
            crate::controllers::auth::AuthResponse,
            crate::controllers::buildings::CreateBuildingParams,
            crate::controllers::buildings::UpdateBuildingParams,
            crate::controllers::blocks::CreateBlockParams,
            crate::controllers::blocks::UpdateBlockParams,
            crate::controllers::floors::CreateFloorParams,
            crate::controllers::floors::UpdateFloorParams,
            crate::controllers::rooms::CreateRoomParams,
            crate::controllers::rooms::UpdateRoomParams,
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "Auth", description = "Authentication endpoints"),
        (name = "Property", description = "Property and building management endpoints")
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
