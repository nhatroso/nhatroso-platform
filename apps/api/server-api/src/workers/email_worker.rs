use crate::jobs::email_job::{EmailJob, FailedEmailJob};
use crate::services::email_service::{EmailError, EmailProvider, SESEmailService};
use std::env;
use std::sync::Arc;
use tokio::time::{sleep, timeout, Duration};
use chrono::Utc;
use tracing::{info, warn, error};
use loco_rs::app::AppContext;
use crate::services::config::{AppConfig, EmailConfig};

pub async fn start_worker(ctx: &AppContext) -> Result<(), anyhow::Error> {
    let settings = ctx.config.settings.clone().unwrap();
    let app_config: AppConfig = serde_json::from_value(settings)?;
    let email_config = Arc::new(app_config.email);

    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    let template_dir = env::var("TEMPLATE_DIR").unwrap_or_else(|_| "src/templates".to_string());

    let client = redis::Client::open(redis_url)?;
    let mut con = client.get_multiplexed_async_connection().await?;

    let email_service = Arc::new(SESEmailService::new(&email_config, &template_dir).await?);

    info!("Starting Email Worker loop...");

    loop {
        // Reliable Queue: RPOPLPUSH out of `email_queue` into `processing_queue`
        let result: redis::RedisResult<Option<String>> = redis::cmd("RPOPLPUSH")
            .arg("email_queue")
            .arg("processing_queue")
            .query_async(&mut con)
            .await;

        match result {
            Ok(Some(json_str)) => {
                match serde_json::from_str::<EmailJob>(&json_str) {
                    Ok(job) => {
                        process_job_with_retry(email_service.clone(), job, &json_str, &mut con, &email_config).await;
                    }
                    Err(e) => {
                        error!(error=?e, payload=%json_str, "Permanent failure: Invalid JSON email job");
                        // Clean up processing queue on permanent failure
                        let _: redis::RedisResult<()> = redis::cmd("LREM")
                            .arg("processing_queue")
                            .arg(1)
                            .arg(&json_str)
                            .query_async(&mut con)
                            .await;
                    }
                }
            }
            Ok(None) => {
                // Empty queue, sleep before polling again to prevent high CPU usage
                sleep(Duration::from_secs(1)).await;
                continue;
            }
            Err(e) => {
                error!(error=?e, "Redis RPOPLPUSH error");
                sleep(Duration::from_secs(5)).await;
            }
        }
    }
}

async fn process_job_with_retry(
    service: Arc<dyn EmailProvider>,
    job: EmailJob,
    raw_json: &str,
    con: &mut redis::aio::MultiplexedConnection,
    config: &EmailConfig,
) {
    let max_retries = config.retry.max_attempts;
    let mut attempt = 0;

    // 1. Check idempotency: Have we successfully sent this job already?
    let idempotency_key = format!("email_sent:{}", job.job_id);
    let is_sent: Option<String> = redis::cmd("GET")
        .arg(&idempotency_key)
        .query_async(con)
        .await
        .unwrap_or(None);

    if is_sent.is_some() {
        info!(job_id=%job.job_id, "Email job already processed. Skipping.");
        cleanup_processing_queue(con, raw_json).await;
        return;
    }

    #[allow(unused_assignments)]
    let mut last_error_msg: Option<String> = None;

    loop {
        attempt += 1;

        // 5. Rate limiting / Throttling protection loop delay
        sleep(Duration::from_millis(config.rate_limit_ms)).await;

        // 4. Timeout Protection (10 seconds)
        let send_result = timeout(Duration::from_secs(config.timeout_seconds), service.send_email(job.clone())).await;

        match send_result {
            Ok(Ok(_)) => {
                info!(job_id=%job.job_id, to=%job.to, subject=%job.subject, attempt=attempt, "Successfully sent email");

                // Idempotency: Set flag with TTL (1 hour)
                let _: redis::RedisResult<()> = redis::cmd("SETEX")
                    .arg(&idempotency_key)
                    .arg(3600)
                    .arg("1")
                    .query_async(con)
                    .await;

                // Reliable Queue: Remove from processing_queue
                cleanup_processing_queue(con, raw_json).await;
                return;
            }
            Ok(Err(EmailError::Permanent(err))) => {
                error!(job_id=%job.job_id, error=%err, "Permanent failure. Will not retry.");
                last_error_msg = Some(err);
                break;
            }
            Ok(Err(EmailError::Transient(err))) => {
                warn!(job_id=%job.job_id, error=%err, attempt=attempt, "Transient error occurred.");
                last_error_msg = Some(err);
            }
            Err(_) => {
                warn!(job_id=%job.job_id, attempt=attempt, "SES Send Email operation timed out.");
                last_error_msg = Some("Send operation timed out".to_string());
            }
        }

        if attempt >= max_retries {
            break;
        }

        // Exponential backoff
        let backoff_secs = config.retry.backoff_base.pow(attempt);
        sleep(Duration::from_secs(backoff_secs)).await;
    }

    // Dead letter processing on max retries or permanent error
    error!(job_id=%job.job_id, attempts=attempt, error=?last_error_msg, "Moving email job to DLQ.");

    let dlq_job = FailedEmailJob {
        job: job.clone(),
        error: last_error_msg.unwrap_or_else(|| "Unknown".to_string()),
        attempts: attempt,
        failed_at: Utc::now(),
    };

    if let Ok(dlq_json) = serde_json::to_string(&dlq_job) {
        let _: redis::RedisResult<()> = redis::cmd("LPUSH")
            .arg("email_queue_failed")
            .arg(dlq_json)
            .query_async(con)
            .await;
    }

    // Reliable Queue: Always remove from processing queue after dealing with it (DLQ handled it)
    cleanup_processing_queue(con, raw_json).await;
}

async fn cleanup_processing_queue(con: &mut redis::aio::MultiplexedConnection, raw_json: &str) {
    let _: redis::RedisResult<()> = redis::cmd("LREM")
        .arg("processing_queue")
        .arg(1)
        .arg(raw_json)
        .query_async(con)
        .await;
}
