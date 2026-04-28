use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SmsJob {
    pub job_id: String,
    pub to: String,
    pub content: String,
}

impl SmsJob {
    pub fn new(to: String, content: String) -> Self {
        Self {
            job_id: Uuid::new_v4().to_string(),
            to,
            content,
        }
    }

    /// Enqueue an SMS job into the Redis list (`sms_queue`)
    pub async fn enqueue_sms(redis_url: &str, job: SmsJob) -> Result<(), anyhow::Error> {
        let client = redis::Client::open(redis_url)?;
        let mut con = client.get_multiplexed_async_connection().await?;

        let json_job = serde_json::to_string(&job)?;
        redis::cmd("LPUSH")
            .arg("sms_queue")
            .arg(json_job)
            .query_async::<()>(&mut con)
            .await?;

        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FailedSmsJob {
    pub job: SmsJob,
    pub error: String,
    pub attempts: u32,
    pub failed_at: DateTime<Utc>,
}
