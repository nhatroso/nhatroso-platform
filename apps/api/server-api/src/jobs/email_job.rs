use serde::{Deserialize, Serialize};
use loco_rs::prelude::*;
use crate::workers::email_worker::{EmailWorker, EmailWorkerArgs};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmailJob {
    pub to: String,
    pub subject: String,
    pub template: String,
    pub data: serde_json::Value,
}

impl EmailJob {
    pub fn new(to: String, subject: String, template: String, data: serde_json::Value) -> Self {
        Self {
            to,
            subject,
            template,
            data,
        }
    }

    /// Enqueue an email job using the new Loco Worker system
    pub async fn enqueue_email(ctx: &AppContext, job: EmailJob) -> Result<()> {
        let args = EmailWorkerArgs {
            to: job.to,
            subject: job.subject,
            template: job.template,
            data: job.data,
        };
        EmailWorker::perform_later(ctx, args).await?;
        Ok(())
    }
}
