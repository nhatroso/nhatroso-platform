use async_trait::async_trait;
use loco_rs::{
    app::{AppContext, Hooks, Initializer},
    bgworker::{BackgroundWorker, Queue},
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
use crate::{controllers, tasks, workers};

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
        if dotenvy::dotenv().is_ok() {
            tracing::info!("Environment configured successfully");
        } else {
            tracing::warn!("No .env file found or failed to load");
        }

        tracing::info!("Starting server...");

        let db_url = std::env::var("DATABASE_URL").unwrap_or_default();
        if !db_url.is_empty() {
            tracing::info!("Database connection mapped");
        } else {
            tracing::error!("Missing DATABASE_URL");
        }

        let redis_url = std::env::var("REDIS_URL").unwrap_or_default();
        if !redis_url.is_empty() {
            tracing::info!("Redis connection mapped");
        } else {
            tracing::warn!("Missing REDIS_URL configuration");
        }

        let ses_key = std::env::var("AWS_SES_ACCESS_KEY_ID").unwrap_or_default();
        if !ses_key.is_empty() {
            tracing::info!("AWS SES Credential found");
        } else {
            tracing::warn!("Missing AWS SES Credential");
        }

        let s3_key = std::env::var("AWS_S3_ACCESS_KEY_ID").unwrap_or_default();
        if !s3_key.is_empty() {
            tracing::info!("AWS S3 Credential found");
        } else {
            tracing::warn!("Missing AWS S3 Credential");
        }

        match create_app::<Self, Migrator>(mode, environment, config).await {
            Ok(boot_result) => {
                tracing::info!("Core services started successfully.");
                Ok(boot_result)
            }
            Err(e) => {
                tracing::error!("Failed to start server. Please check DB or Redis status.");
                tracing::error!("Error details: {:?}", e);
                Err(e)
            }
        }
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

        let _ = dotenvy::dotenv().ok();

        // 1. Spawn Payment Expiration background task with Recoverability
        let ctx_clone = ctx.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
            loop {
                interval.tick().await;
                let ctx_inner = ctx_clone.clone();
                // Isolate into sub-task to protect main ticker from internal panics
                tokio::spawn(async move {
                    if let Err(e) = crate::models::payments::Model::update_expired(&ctx_inner.db).await {
                        tracing::error!(error = ?e, "[Worker] Payment expiration job failed");
                    }
                });
            }
        });

        // 2. Spawn Email Worker with Redis conditioning and backoff retries
        let has_redis = ctx.config.queue.is_some() || std::env::var("REDIS_URL").is_ok();
        if has_redis {
            let ctx_email = ctx.clone();
            tokio::spawn(async move {
                tracing::info!("Starting Email Worker (SES)...");
                let mut retries = 0;
                loop {
                    match workers::email_worker::start_worker(&ctx_email).await {
                        Ok(_) => break, // Graceful exit
                        Err(e) => {
                            retries += 1;
                            tracing::error!("Email worker crashed: {:?}. Retrying {}/∞ in 5s...", e, retries);
                            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                        }
                    }
                }
            });
        } else {
            tracing::warn!("Skipping Email Worker Deployment: REDIS Queue is not configured.");
        }

        // 3. Inject explicit application Health Check endpoint
        let router = router
            .route("/api/health", axum::routing::get(|| async { axum::Json(serde_json::json!({ "status": "ok", "service": "nhatroso-platform-api" })) }))
            .nest_service("/static", tower_http::services::ServeDir::new("static"));

        Ok(router)
    }

    async fn connect_workers(ctx: &AppContext, queue: &Queue) -> Result<()> {
        queue.register(
            workers::meter_reading_worker::MeterReadingWorker::build(ctx),
        ).await?;
        Ok(())
    }

    fn register_tasks(tasks: &mut Tasks) {
        tasks.register(tasks::seed_data::SeedData);
        tasks.register(tasks::auto_generate_invoices::AutoGenerateInvoices);
        tasks.register(tasks::auto_generate_meter_requests::AutoGenerateMeterRequests);
    }

    async fn truncate(_ctx: &AppContext) -> Result<()> {
        Ok(())
    }

    async fn seed(_ctx: &AppContext, _base: &Path) -> Result<()> {
        Ok(())
    }
}
