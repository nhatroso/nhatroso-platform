use async_trait::async_trait;
use aws_config::meta::region::RegionProviderChain;
use aws_sdk_sesv2::{Client, types::{Destination, EmailContent, Body, Content, Message}};
use aws_sdk_sesv2::error::SdkError;
use std::env;
use tera::Tera;
use std::sync::Arc;
use crate::jobs::email_job::EmailJob;
use crate::services::config::EmailConfig;
use std::fmt;

#[derive(Debug)]
pub enum EmailError {
    Transient(String),
    Permanent(String),
}

impl fmt::Display for EmailError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Transient(err) => write!(f, "Transient: {}", err),
            Self::Permanent(err) => write!(f, "Permanent: {}", err),
        }
    }
}
impl std::error::Error for EmailError {}

#[async_trait]
pub trait EmailProvider: Send + Sync {
    async fn send_email(&self, job: EmailJob) -> Result<(), EmailError>;
    async fn send_email_raw(&self, to: String, subject: String, template: String, data: serde_json::Value) -> Result<(), EmailError>;
}

pub struct SESEmailService {
    client: Client,
    from_email: String,
    tera: Arc<Tera>,
}

impl SESEmailService {
    pub async fn new(email_config: &EmailConfig, template_dir: &str) -> Result<Self, anyhow::Error> {
        let region_provider = RegionProviderChain::default_provider().or_else(aws_config::Region::new(env::var("AWS_REGION").unwrap_or_else(|_| "ap-southeast-1".to_string())));

        let access_key = std::env::var("AWS_SES_ACCESS_KEY_ID").unwrap_or_default();
        let secret_key = std::env::var("AWS_SES_SECRET_ACCESS_KEY").unwrap_or_default();

        let credentials = aws_sdk_sesv2::config::Credentials::new(
            access_key,
            secret_key,
            None,
            None,
            "Environment",
        );

        let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .region(region_provider)
            .credentials_provider(credentials)
            .load()
            .await;

        let client = Client::new(&config);

        let from_email = email_config.from.clone();

        let glob = format!("{}/**/*", template_dir);
        let mut tera = Tera::new(&glob)?;

        // Register custom filters
        tera.register_filter("format_number", |value: &tera::Value, _args: &std::collections::HashMap<String, tera::Value>| -> tera::Result<tera::Value> {
            let num_str = match value {
                tera::Value::Number(n) => n.to_string(),
                tera::Value::String(s) => s.clone(),
                _ => return Ok(value.clone()),
            };

            // Parse to check if it's a valid number
            let Ok(n) = num_str.parse::<f64>() else {
                return Ok(value.clone());
            };

            // Format with dots as thousands separators (Vietnamese style)
            let s = format!("{:.0}", n); // Round to integer for currency
            let mut result = String::new();
            let chars: Vec<char> = s.chars().rev().collect();
            for (i, c) in chars.iter().enumerate() {
                if i > 0 && i % 3 == 0 {
                    result.push('.');
                }
                result.push(*c);
            }
            Ok(tera::Value::String(result.chars().rev().collect()))
        });

        Ok(Self {
            client,
            from_email,
            tera: Arc::new(tera),
        })
    }
}

#[async_trait]
impl EmailProvider for SESEmailService {
    async fn send_email(&self, job: EmailJob) -> Result<(), EmailError> {
        self.send_email_raw(job.to, job.subject, job.template, job.data).await
    }

    async fn send_email_raw(&self, to: String, subject: String, template: String, data: serde_json::Value) -> Result<(), EmailError> {
        let mut context = tera::Context::new();
        if let serde_json::Value::Object(map) = data {
            for (k, v) in map {
                context.insert(k, &v);
            }
        }

        let html_body = self.tera.render(&template, &context)
            .map_err(|e| EmailError::Permanent(format!("Template error: {}", e)))?;

        let text_body = format!("Please view this email in an HTML compatible client. Subject: {}", subject);

        let content = EmailContent::builder()
            .simple(
                Message::builder()
                    .subject(Content::builder().data(&subject).charset("UTF-8").build().map_err(|e| EmailError::Permanent(e.to_string()))?)
                    .body(
                        Body::builder()
                            .html(Content::builder().data(html_body).charset("UTF-8").build().map_err(|e| EmailError::Permanent(e.to_string()))?)
                            .text(Content::builder().data(text_body).charset("UTF-8").build().map_err(|e| EmailError::Permanent(e.to_string()))?)
                            .build()
                    )
                    .build()
            )
            .build();

        let destination = Destination::builder()
            .to_addresses(&to)
            .build();

        let result = self.client
            .send_email()
            .from_email_address(&self.from_email)
            .destination(destination)
            .content(content)
            .send()
            .await;

        match result {
            Ok(_) => Ok(()),
            Err(SdkError::ServiceError(err)) => {
                let status = err.raw().status().as_u16();
                // 429 TooManyRequests or 5xx are transient
                if status == 429 || status >= 500 {
                    Err(EmailError::Transient(err.into_err().to_string()))
                } else {
                    Err(EmailError::Permanent(err.into_err().to_string()))
                }
            }
            Err(SdkError::TimeoutError(err)) => Err(EmailError::Transient(format!("{:?}", err))),
            Err(SdkError::DispatchFailure(err)) => Err(EmailError::Transient(format!("{:?}", err))),
            Err(err) => Err(EmailError::Permanent(err.to_string())), // Other unexpected construction errors as permanent
        }
    }
}
