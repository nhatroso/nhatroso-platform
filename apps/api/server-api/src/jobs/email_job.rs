use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmailJob {
    pub job_id: String,
    pub to: String,
    pub subject: String,
    pub template: String,
    pub data: serde_json::Value,
}

impl EmailJob {
    pub fn new(to: String, subject: String, template: String, data: serde_json::Value) -> Self {
        Self {
            job_id: Uuid::new_v4().to_string(),
            to,
            subject,
            template,
            data,
        }
    }

    /// Enqueue an email job into the Redis list (`email_queue`)
    pub async fn enqueue_email(redis_url: &str, job: EmailJob) -> Result<(), anyhow::Error> {
        let client = redis::Client::open(redis_url)?;
        let mut con = client.get_multiplexed_async_connection().await?;

        let json_job = serde_json::to_string(&job)?;
        redis::cmd("LPUSH")
            .arg("email_queue")
            .arg(json_job)
            .query_async::<()>(&mut con)
            .await?;

        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FailedEmailJob {
    pub job: EmailJob,
    pub error: String,
    pub attempts: u32,
    pub failed_at: DateTime<Utc>,
}
