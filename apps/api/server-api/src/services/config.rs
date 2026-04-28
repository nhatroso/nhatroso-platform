use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub email: EmailConfig,
    pub sms: SmsConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct EmailConfig {
    pub provider: String,
    pub from: String,
    pub timeout_seconds: u64,
    pub rate_limit_ms: u64,
    pub retry: RetryConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SmsConfig {
    pub provider: String,
    pub access_token: Option<String>, // SpeedSMS token
    pub timeout_seconds: u64,
    pub rate_limit_ms: u64,
    pub retry: RetryConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RetryConfig {
    pub max_attempts: u32,
    pub backoff_base: u64,
}
