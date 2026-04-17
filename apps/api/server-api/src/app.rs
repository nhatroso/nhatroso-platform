use async_trait::async_trait;
use loco_rs::{
    app::{AppContext, Hooks, Initializer},
    bgworker::{Queue},
    boot::{create_app, BootResult, StartMode},
    config::Config,
    controller::AppRoutes,
    environment::Environment,
    task::Tasks,
    Result,
};
use migration::Migrator;
use std::path::Path;

#[allow(unused_imports)]
use crate::{controllers, tasks};

pub struct App;

#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        env!("CARGO_CRATE_NAME")
    }

    fn app_version() -> String {
        format!(
            "{} ({})",
            env!("CARGO_PKG_VERSION"),
            option_env!("BUILD_SHA")
                .or(option_env!("GITHUB_SHA"))
                .unwrap_or("dev")
        )
    }

    async fn boot(
        mode: StartMode,
        environment: &Environment,
        config: Config,
    ) -> Result<BootResult> {
        create_app::<Self, Migrator>(mode, environment, config).await
    }

    async fn initializers(_ctx: &AppContext) -> Result<Vec<Box<dyn Initializer>>> {
        Ok(vec![])
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        AppRoutes::empty()
            .add_route(controllers::auto_invoice_configs::routes())
            .add_route(controllers::meter_request_configs::routes())
            .add_route(controllers::meter_requests::routes())
            .add_route(controllers::meters::routes())
            .add_route(controllers::room_services::routes())
            .add_route(controllers::auth::routes())
            .add_route(controllers::buildings::routes())
            .add_route(controllers::floors::routes())
            .add_route(controllers::rooms::routes())
            .add_route(controllers::services::routes())
            .add_route(controllers::price_rules::routes())
            .add_route(controllers::contracts::routes())
            .add_route(controllers::users::routes())
            .add_route(controllers::uploads::routes())
            .add_route(controllers::invoices::routes())
            .add_route(controllers::payments::routes())
    }

    async fn after_routes(router: axum::Router, ctx: &AppContext) -> Result<axum::Router> {
        let ctx = ctx.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
            loop {
                interval.tick().await;
                if let Err(e) = crate::models::payments::Model::update_expired(&ctx.db).await {
                    tracing::error!(error = ?e, "[Worker] Payment expiration job failed");
                }
            }
        });

        Ok(router.nest_service("/static", tower_http::services::ServeDir::new("static")))
    }

    async fn connect_workers(_ctx: &AppContext, _queue: &Queue) -> Result<()> {
        Ok(())
    }

    fn register_tasks(tasks: &mut Tasks) {
        tasks.register(tasks::seed_data::SeedData);
        tasks.register(tasks::auto_generate_invoices::AutoGenerateInvoices);
    }

    async fn truncate(_ctx: &AppContext) -> Result<()> {
        Ok(())
    }

    async fn seed(_ctx: &AppContext, _base: &Path) -> Result<()> {
        Ok(())
    }
}
