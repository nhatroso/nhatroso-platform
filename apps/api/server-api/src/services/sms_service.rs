use async_trait::async_trait;
use crate::jobs::sms_job::SmsJob;
use crate::services::config::SmsConfig;
use reqwest::Client;
use std::fmt;

#[derive(Debug)]
pub enum SmsError {
    Transient(String),
    Permanent(String),
}

impl fmt::Display for SmsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Transient(err) => write!(f, "Transient: {}", err),
            Self::Permanent(err) => write!(f, "Permanent: {}", err),
        }
    }
}
impl std::error::Error for SmsError {}

#[async_trait]
pub trait SmsProvider: Send + Sync {
    async fn send_sms(&self, job: SmsJob) -> Result<(), SmsError>;
}

pub struct SpeedSmsService {
    client: Client,
    access_token: String,
}

impl SpeedSmsService {
    pub fn new(config: &SmsConfig) -> Self {
        Self {
            client: Client::new(),
            access_token: config.access_token.clone().unwrap_or_default(),
        }
    }
}

#[async_trait]
impl SmsProvider for SpeedSmsService {
    async fn send_sms(&self, job: SmsJob) -> Result<(), SmsError> {
        let payload = serde_json::json!({
            "to": [job.to],
            "content": job.content,
            "sms_type": 2, // Hardcoded to Customer Care (CSKH)
        });

        let response = self.client
            .post("https://api.speedsms.vn/index.php/sms/send")
            .basic_auth(&self.access_token, Some("x"))
            .json(&payload)
            .send()
            .await
            .map_err(|e| SmsError::Transient(e.to_string()))?;

        let status = response.status();
        let body = response.json::<serde_json::Value>().await
            .map_err(|e| SmsError::Transient(e.to_string()))?;

        if status.is_success() {
            if body["status"] == "success" {
                Ok(())
            } else {
                let code = body["code"].as_str().unwrap_or("unknown");
                let message = body["message"].as_str().unwrap_or("No message");

                // SpeedSMS specific error codes from documentation
                match code {
                    "300" => Err(SmsError::Permanent(format!("Insufficient balance: {}", message))),
                    "101" | "105" | "110" | "113" => Err(SmsError::Permanent(format!("Invalid request ({}): {}", code, message))),
                    "007" | "008" | "009" => Err(SmsError::Permanent(format!("Account/IP restricted ({}): {}", code, message))),
                    "500" => Err(SmsError::Transient(format!("SpeedSMS Internal Error: {}", message))),
                    _ => Err(SmsError::Transient(format!("SpeedSMS Error {}: {}", code, message))),
                }
            }
        } else if status.is_server_error() {
            Err(SmsError::Transient(format!("Server error: {}", status)))
        } else {
            Err(SmsError::Permanent(format!("HTTP error: {}", status)))
        }
    }
}
