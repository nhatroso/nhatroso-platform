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
use crate::{controllers, tasks, workers, models};

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

    fn routes(_ctx: &AppContext) -> AppRoutes {
        AppRoutes::with_default_routes()
            .add_route(controllers::auth::routes())
            .add_route(controllers::users::routes())
            .add_route(controllers::buildings::routes())
            .add_route(controllers::floors::routes())
            .add_route(controllers::rooms::routes())
            .add_route(controllers::services::routes())
            .add_route(controllers::room_services::routes())
            .add_route(controllers::meters::routes())
            .add_route(controllers::meter_request_configs::routes())
            .add_route(controllers::meter_requests::routes())
            .add_route(controllers::invoices::routes())
            .add_route(controllers::auto_invoice_configs::routes())
            .add_route(controllers::price_rules::routes())
            .add_route(controllers::contracts::routes())
            .add_route(controllers::payments::routes())
            .add_route(controllers::uploads::routes())
    }

    async fn after_routes(router: axum::Router, ctx: &AppContext) -> Result<axum::Router> {
        // 1. Pre-flight System Checks
        Self::run_system_checks(ctx);

        // 2. Background Schedulers
        Self::start_schedulers(ctx);

        // 3. Health Check & Static Assets
        let router = router
            .route("/api/health", axum::routing::get(|| async { 
                axum::Json(serde_json::json!({ 
                    "status": "ok", 
                    "service": "nhatroso-platform-api",
                    "version": Self::app_version()
                })) 
            }))
            .nest_service("/static", tower_http::services::ServeDir::new("static"));

        Ok(router)
    }

    async fn connect_workers(ctx: &AppContext, queue: &Queue) -> Result<()> {
        queue.register(workers::meter_reading_worker::MeterReadingWorker::build(ctx)).await?;
        queue.register(workers::email_worker::EmailWorker::build(ctx)).await?;
        queue.register(workers::sms_worker::SmsWorker::build(ctx)).await?;
        Ok(())
    }

    fn register_tasks(tasks: &mut Tasks) {
        tasks.register(tasks::seed_data::SeedData);
        tasks.register(tasks::auto_generate_meter_requests::AutoGenerateMeterRequests);
        tasks.register(tasks::auto_generate_invoices::AutoGenerateInvoices);
    }

    async fn truncate(_ctx: &AppContext) -> Result<()> {
        Ok(())
    }

    async fn seed(_ctx: &AppContext, _base: &Path) -> Result<()> {
        Ok(())
    }

    async fn initializers(_ctx: &AppContext) -> Result<Vec<Box<dyn Initializer>>> {
        Ok(vec![])
    }
}

/// Helper methods for clean lifecycle management
impl App {
    /// Validates application-specific requirements
    fn run_system_checks(ctx: &AppContext) {
        tracing::info!("Starting Nhatroso Platform Pre-flight Checks...");

        // 1. Google Vision Key
        if let Some(settings) = &ctx.config.settings {
            if let Ok(app_config) = serde_json::from_value::<crate::services::config::AppConfig>(settings.clone()) {
                if Path::new(&app_config.vision.key_path).exists() {
                    tracing::info!("Google Vision: Service key verified.");
                } else {
                    tracing::warn!("Google Vision: Key file missing at {}. OCR will not work.", app_config.vision.key_path);
                }
            }
        }

        // 2. S3 Bucket
        if let Ok(bucket) = std::env::var("S3_BUCKET") {
            tracing::info!("S3 Storage: Bucket '{}' verified.", bucket);
        } else {
            tracing::error!("S3 Storage: S3_BUCKET is missing.");
        }

        tracing::info!("System pre-flight checks completed.");
    }

    /// Spawns background maintainance threads
    fn start_schedulers(ctx: &AppContext) {
        let ctx = ctx.clone();

        // Payment Expiration (1m)
        let ctx_payment = ctx.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
            loop {
                interval.tick().await;
                if let Err(e) = models::payments::Model::update_expired(&ctx_payment.db).await {
                    tracing::error!(error = ?e, "[Scheduler] Payment expiration job failed");
                }
            }
        });

        // Daily Notification (24h)
        let ctx_notify = ctx.clone();
        tokio::spawn(async move {
            tracing::info!("Automated Notification Scheduler initialized.");
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600 * 24));
            loop {
                interval.tick().await;
                if let Err(e) = models::invoices::Model::process_automated_notifications(&ctx_notify).await {
                    tracing::error!(error = ?e, "[Scheduler] Daily notifications job failed");
                }
            }
        });
    }
}
