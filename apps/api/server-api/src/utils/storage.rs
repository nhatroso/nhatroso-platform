
use aws_sdk_s3::presigning::PresigningConfig;
use aws_sdk_s3::Client;
use std::time::Duration;
use anyhow::Result;

pub struct Storage {
    client: Client,
    bucket: String,
}

impl Storage {
    pub async fn new(bucket: String) -> Self {
        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
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
