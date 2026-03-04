use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::controllers::auth::register,
        crate::controllers::auth::login,
        crate::controllers::auth::refresh,
        crate::controllers::auth::logout,
        crate::controllers::auth::current_user,
    ),
    components(
        schemas(
            crate::controllers::auth::RegisterParams,
            crate::controllers::auth::LoginParams,
            crate::controllers::auth::RefreshParams,
            crate::controllers::auth::AuthResponse,
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "Auth", description = "Authentication endpoints")
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
