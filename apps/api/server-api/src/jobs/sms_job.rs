use serde::{Deserialize, Serialize};
use loco_rs::prelude::*;
use crate::workers::sms_worker::{SmsWorker, SmsWorkerArgs};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SmsJob {
    pub to: String,
    pub content: String,
}

impl SmsJob {
    pub fn new(to: String, content: String) -> Self {
        Self {
            to,
            content,
        }
    }

    /// Enqueue an SMS job using the new Loco Worker system
    pub async fn enqueue_sms(ctx: &AppContext, job: SmsJob) -> Result<()> {
        let args = SmsWorkerArgs {
            to: job.to,
            content: job.content,
        };
        SmsWorker::perform_later(ctx, args).await?;
        Ok(())
    }
}
