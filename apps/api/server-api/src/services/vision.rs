use reqwest::Client;
use serde_json::json;
use anyhow::{Result, Context};
use tracing::info;
use regex::Regex;

pub struct VisionService {
    client: Client,
    api_key: String,
}

impl VisionService {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
        }
    }

    pub async fn detect_text(&self, image_url: &str) -> Result<String> {
        let url = format!(
            "https://vision.googleapis.com/v1/images:annotate?key={}",
            self.api_key
        );

        let payload = json!({
            "requests": [{
                "image": {
                    "source": {
                        "imageUri": image_url
                    }
                },
                "features": [{
                    "type": "TEXT_DETECTION"
                }]
            }]
        });

        let response = self.client.post(&url).json(&payload).send().await?;
        let json_resp: serde_json::Value = response.json().await?;

        let text = json_resp["responses"][0]["fullTextAnnotation"]["text"]
            .as_str()
            .context("No text found in OCR result")?;

        info!(ocr_text = text, "OCR Extraction complete");
        Ok(text.to_string())
    }
}

pub fn extract_meter_value(text: &str) -> Option<f64> {
    // Regex for numeric sequences with possible decimals
    let re = Regex::new(r"(\d+(\.\d+)?)").ok()?;

    let mut best_value: Option<f64> = None;
    let mut max_len = 0;

    for cap in re.captures_iter(text) {
        let val_str = &cap[1];
        // Clean up common noise: leading zeros or very small numbers
        let clean_val = val_str.parse::<f64>().ok()?;

        // We prefer the longest numeric sequence as it's most likely the meter reading
        if val_str.len() > max_len {
            max_len = val_str.len();
            best_value = Some(clean_val);
        }
    }

    best_value
}
