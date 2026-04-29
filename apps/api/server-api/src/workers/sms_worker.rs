use serde::{Deserialize, Serialize};
use loco_rs::prelude::*;
use crate::services::sms_service::{SmsProvider, SpeedSmsService};
use std::sync::Arc;
use crate::services::config::AppConfig;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SmsWorkerArgs {
    pub to: String,
    pub content: String,
}

pub struct SmsWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<SmsWorkerArgs> for SmsWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }

    async fn perform(&self, args: SmsWorkerArgs) -> Result<()> {
        let settings = self.ctx.config.settings.clone().ok_or_else(|| Error::Message("Missing settings in config".to_string()))?;
        let app_config: AppConfig = serde_json::from_value(settings).map_err(|e| Error::Message(format!("Invalid settings: {}", e)))?;
        let sms_config = Arc::new(app_config.sms);
        
        let sms_service = SpeedSmsService::new(&sms_config);

        tracing::info!(to = %args.to, "Sending background SMS...");

        match sms_service.send_sms(crate::jobs::sms_job::SmsJob::new(args.to.clone(), args.content.clone())).await {
            Ok(_) => {
                tracing::info!(to = %args.to, "Successfully sent background SMS");
                Ok(())
            }
            Err(e) => {
                tracing::error!(to = %args.to, error = ?e, "Failed to send background SMS");
                // Note: Loco's BackgroundQueue mode handles retries automatically
                // if we return an error here.
                Err(Error::Message(format!("SMS sending failed: {:?}", e)))
            }
        }
    }
}
