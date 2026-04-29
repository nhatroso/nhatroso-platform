use loco_rs::prelude::*;
use loco_rs::bgworker::BackgroundWorker;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::time::{timeout, Duration};
use crate::services::email_service::{EmailError, EmailProvider, SESEmailService};
use crate::services::config::{AppConfig, EmailConfig};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EmailWorkerArgs {
    pub to: String,
    pub subject: String,
    pub template: String,
    pub data: serde_json::Value,
}

pub struct EmailWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<EmailWorkerArgs> for EmailWorker {
    fn build(ctx: &AppContext) -> Self {
        Self {
            ctx: ctx.clone(),
        }
    }

    async fn perform(&self, args: EmailWorkerArgs) -> Result<()> {
        let settings = self.ctx.config.settings.clone().ok_or_else(|| Error::BadRequest("Missing settings in config".to_string()))?;
        let app_config: AppConfig = serde_json::from_value(settings).map_err(|e| Error::BadRequest(format!("Invalid config: {}", e)))?;
        let email_config = Arc::new(app_config.email);
        
        let template_dir = std::env::var("TEMPLATE_DIR").unwrap_or_else(|_| "src/templates".to_string());
        let email_service = Arc::new(SESEmailService::new(&email_config, &template_dir).await
            .map_err(|e| Error::BadRequest(format!("Failed to initialize EmailService: {}", e)))?);

        process_email_with_retry(email_service, args, &email_config).await?;

        Ok(())
    }
}

async fn process_email_with_retry(
    service: Arc<dyn EmailProvider>,
    args: EmailWorkerArgs,
    config: &EmailConfig,
) -> Result<()> {
    let max_retries = config.retry.max_attempts;
    let mut attempt = 0;

    loop {
        attempt += 1;

        // Rate limiting / Throttling protection
        tokio::time::sleep(Duration::from_millis(config.rate_limit_ms)).await;

        // Timeout Protection
        let send_result = timeout(
            Duration::from_secs(config.timeout_seconds), 
            service.send_email_raw(args.to.clone(), args.subject.clone(), args.template.clone(), args.data.clone())
        ).await;

        match send_result {
            Ok(Ok(_)) => {
                tracing::info!(to=%args.to, subject=%args.subject, attempt=attempt, "Successfully sent email");
                return Ok(());
            }
            Ok(Err(EmailError::Permanent(err))) => {
                tracing::error!(to=%args.to, error=%err, "Permanent email failure. Will not retry.");
                return Err(Error::BadRequest(err));
            }
            Ok(Err(EmailError::Transient(err))) => {
                tracing::warn!(to=%args.to, error=%err, attempt=attempt, "Transient email error occurred.");
                if attempt >= max_retries {
                    return Err(Error::BadRequest(err));
                }
            }
            Err(_) => {
                tracing::warn!(to=%args.to, attempt=attempt, "Email Send operation timed out.");
                if attempt >= max_retries {
                    return Err(Error::BadRequest("Send operation timed out".to_string()));
                }
            }
        }

        // Exponential backoff
        let backoff_secs = config.retry.backoff_base.pow(attempt);
        tokio::time::sleep(Duration::from_secs(backoff_secs)).await;
    }
}
