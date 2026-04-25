
use aws_sdk_s3::presigning::PresigningConfig;
use aws_sdk_s3::Client;
use aws_config::meta::region::RegionProviderChain;
use std::time::Duration;
use anyhow::Result;

pub struct Storage {
    client: Client,
    bucket: String,
}

impl Storage {
    pub async fn new(bucket: String) -> Self {
        let region_provider = RegionProviderChain::default_provider().or_else(aws_config::Region::new(std::env::var("AWS_REGION").unwrap_or_else(|_| "ap-southeast-1".to_string())));

        let access_key = std::env::var("AWS_S3_ACCESS_KEY_ID").unwrap_or_default();
        let secret_key = std::env::var("AWS_S3_SECRET_ACCESS_KEY").unwrap_or_default();

        let credentials = aws_sdk_s3::config::Credentials::new(
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
        Self { client, bucket }
    }

    pub async fn get_presigned_upload_url(&self, key: &str, expires_in: Duration) -> Result<String> {
        let presigning_config = PresigningConfig::builder()
            .expires_in(expires_in)
            .build()?;

        let presigned_request = self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .presigned(presigning_config)
            .await?;

        Ok(presigned_request.uri().to_string())
    }
}
