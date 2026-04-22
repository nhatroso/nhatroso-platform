use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub email: EmailConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct EmailConfig {
    pub provider: String,
    pub from: String,
    pub timeout_seconds: u64,
    pub rate_limit_ms: u64,
    pub retry: EmailRetryConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct EmailRetryConfig {
    pub max_attempts: u32,
    pub backoff_base: u64,
}
