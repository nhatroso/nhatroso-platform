use crate::jobs::sms_job::{SmsJob, FailedSmsJob};
use crate::services::sms_service::{SmsError, SmsProvider, SpeedSmsService};
use std::sync::Arc;
use tokio::time::{sleep, timeout, Duration};
use chrono::Utc;
use tracing::{info, warn, error};
use loco_rs::app::AppContext;
use crate::services::config::{AppConfig, SmsConfig};

pub async fn start_worker(ctx: &AppContext) -> Result<(), anyhow::Error> {
    let settings = ctx.config.settings.clone().unwrap();
    let app_config: AppConfig = serde_json::from_value(settings)?;
    let sms_config = Arc::new(app_config.sms);

    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());

    let client = redis::Client::open(redis_url)?;
    let mut con = client.get_multiplexed_async_connection().await?;

    let sms_service = Arc::new(SpeedSmsService::new(&sms_config));

    info!("Starting SMS Worker loop...");

    loop {
        // Reliable Queue: RPOPLPUSH out of `sms_queue` into `sms_processing_queue`
        let result: redis::RedisResult<Option<String>> = redis::cmd("RPOPLPUSH")
            .arg("sms_queue")
            .arg("sms_processing_queue")
            .query_async(&mut con)
            .await;

        match result {
            Ok(Some(json_str)) => {
                match serde_json::from_str::<SmsJob>(&json_str) {
                    Ok(job) => {
                        process_job_with_retry(sms_service.clone(), job, &json_str, &mut con, &sms_config).await;
                    }
                    Err(e) => {
                        error!(error=?e, payload=%json_str, "Permanent failure: Invalid JSON SMS job");
                        cleanup_processing_queue(&mut con, &json_str).await;
                    }
                }
            }
            Ok(None) => {
                sleep(Duration::from_secs(1)).await;
                continue;
            }
            Err(e) => {
                error!(error=?e, "Redis RPOPLPUSH error (SMS)");
                sleep(Duration::from_secs(5)).await;
            }
        }
    }
}

async fn process_job_with_retry(
    service: Arc<dyn SmsProvider>,
    job: SmsJob,
    raw_json: &str,
    con: &mut redis::aio::MultiplexedConnection,
    config: &SmsConfig,
) {
    let max_retries = config.retry.max_attempts;
    let mut attempt = 0;

    let idempotency_key = format!("sms_sent:{}", job.job_id);
    let is_sent: Option<String> = redis::cmd("GET")
        .arg(&idempotency_key)
        .query_async(con)
        .await
        .unwrap_or(None);

    if is_sent.is_some() {
        info!(job_id=%job.job_id, "SMS job already processed. Skipping.");
        cleanup_processing_queue(con, raw_json).await;
        return;
    }

    #[allow(unused_assignments)]
    let mut last_error_msg: Option<String> = None;

    loop {
        attempt += 1;
        sleep(Duration::from_millis(config.rate_limit_ms)).await;

        let send_result = timeout(Duration::from_secs(config.timeout_seconds), service.send_sms(job.clone())).await;

        match send_result {
            Ok(Ok(_)) => {
                info!(job_id=%job.job_id, to=%job.to, attempt=attempt, "Successfully sent SMS");

                let _: redis::RedisResult<()> = redis::cmd("SETEX")
                    .arg(&idempotency_key)
                    .arg(3600)
                    .arg("1")
                    .query_async(con)
                    .await;

                cleanup_processing_queue(con, raw_json).await;
                return;
            }
            Ok(Err(SmsError::Permanent(err))) => {
                error!(job_id=%job.job_id, error=%err, "Permanent SMS failure.");
                last_error_msg = Some(err);
                break;
            }
            Ok(Err(SmsError::Transient(err))) => {
                warn!(job_id=%job.job_id, error=%err, attempt=attempt, "Transient SMS error.");
                last_error_msg = Some(err);
            }
            Err(_) => {
                warn!(job_id=%job.job_id, attempt=attempt, "SMS send operation timed out.");
                last_error_msg = Some("Send operation timed out".to_string());
            }
        }

        if attempt >= max_retries {
            break;
        }

        let backoff_secs = config.retry.backoff_base.pow(attempt);
        sleep(Duration::from_secs(backoff_secs)).await;
    }

    error!(job_id=%job.job_id, attempts=attempt, error=?last_error_msg, "Moving SMS job to DLQ.");

    let dlq_job = FailedSmsJob {
        job,
        error: last_error_msg.unwrap_or_else(|| "Unknown".to_string()),
        attempts: attempt,
        failed_at: Utc::now(),
    };

    if let Ok(dlq_json) = serde_json::to_string(&dlq_job) {
        let _: redis::RedisResult<()> = redis::cmd("LPUSH")
            .arg("sms_queue_failed")
            .arg(dlq_json)
            .query_async(con)
            .await;
    }

    cleanup_processing_queue(con, raw_json).await;
}

async fn cleanup_processing_queue(con: &mut redis::aio::MultiplexedConnection, raw_json: &str) {
    let _: redis::RedisResult<()> = redis::cmd("LREM")
        .arg("sms_processing_queue")
        .arg(1)
        .arg(raw_json)
        .query_async(con)
        .await;
}
