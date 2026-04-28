use google_cloud_vision_v1::client::ImageAnnotator;
use google_cloud_vision_v1::model::{AnnotateImageRequest, Feature, feature::Type, Image};
use google_cloud_auth::credentials::service_account::Builder as CredsBuilder;
use anyhow::{Result, Context};
use tracing::info;
use regex::Regex;
use tokio::fs;
use crate::services::config::VisionConfig;

pub struct VisionService {
    client: ImageAnnotator,
}

impl VisionService {
    pub async fn new(config: &VisionConfig) -> Result<Self> {
        let key_json = fs::read_to_string(&config.key_path)
            .await
            .context(format!("Failed to read Google key file at {}", config.key_path))?;

        let key_data: serde_json::Value = serde_json::from_str(&key_json)
            .context("Failed to parse Google key JSON")?;

        let credentials = CredsBuilder::new(key_data)
            .build()
            .context("Failed to build Google credentials")?;

        let client = ImageAnnotator::builder()
            .with_credentials(credentials)
            .build()
            .await
            .context("Failed to create Vision client")?;

        Ok(Self { client })
    }

    pub async fn detect_text_from_bytes(&self, image_content: Vec<u8>) -> Result<String> {
        let request = AnnotateImageRequest::new()
            .set_image(Image::new().set_content(image_content))
            .set_features(vec![
                Feature::new().set_type(Type::DocumentTextDetection)
            ]);

        let response = self.client.batch_annotate_images()
            .set_requests(vec![request])
            .send()
            .await
            .map_err(|e| anyhow::anyhow!("Vision API error: {:?}", e))?;

        let first_resp = response.responses.first()
            .context("Empty response from Vision API")?;

        if let Some(error) = &first_resp.error {
            return Err(anyhow::anyhow!("Vision API error: {}", error.message));
        }

        let text = first_resp.full_text_annotation.as_ref()
            .map(|a| a.text.clone())
            .context("No text found in OCR result")?;

        info!(ocr_text = text, "Document OCR Extraction complete");
        Ok(text)
    }
}

pub fn extract_meter_value(text: &str) -> Option<f64> {
    let re = Regex::new(r"(\d+(\.\d+)?)").ok()?;

    let mut best_value: Option<f64> = None;
    let mut max_score: i32 = -100;

    for cap in re.captures_iter(text) {
        let val_str = &cap[1];
        let full_match = cap.get(0).unwrap();
        let start = full_match.start();
        let end = full_match.end();

        // 1. Initial score based on length (prefer 5-7 digits for meter readings)
        let mut current_score: i32 = val_str.len() as i32;
        if val_str.len() >= 5 && val_str.len() <= 7 {
            current_score += 5;
        }

        if let Ok(mut clean_val) = val_str.parse::<f64>() {
            // Special handling for common Vietnamese meter types:
            // If we have 6 digits, the last one is usually a decimal (red box).
            clean_val = (clean_val / 10.0).floor();

            // 2. Check prefix context (boost for keywords like "công tơ điện")
            let prefix_window = text[..start]
                .chars()
                .rev()
                .take(60)
                .collect::<String>()
                .chars()
                .rev()
                .collect::<String>()
                .to_lowercase();

            if prefix_window.contains("công tơ") || prefix_window.contains("chỉ số") || prefix_window.contains("1 pha") {
                current_score += 25; // Increased boost
            }

            // 3. Penalty for serial number keywords
            if prefix_window.contains("sosx") || prefix_window.contains("số máy") || prefix_window.contains("seri") || prefix_window.contains("no") {
                current_score -= 30;
            }

            // 4. Check suffix and prefix for units (strong signal for meter readings)
            let context_window = text[end..]
                .chars()
                .take(15)
                .collect::<String>()
                .to_lowercase();

            if context_window.contains("kwh") || context_window.contains("m3") || context_window.contains("m³")
                || prefix_window.contains("kwh") || prefix_window.contains("m3") {
                current_score += 30; // High boost for unit proximity
            }

            if current_score > max_score {
                max_score = current_score;
                best_value = Some(clean_val);
            }
        }
    }

    // Fallback: if no clear winner, try original logic on cleaned text
    if best_value.is_none() || max_score < 5 {
        let cleaned: String = text.chars().filter(|c| !c.is_whitespace()).collect();
        for cap in re.captures_iter(&cleaned) {
            let val_str = &cap[1];
            if val_str.len() >= 4 {
                if let Ok(clean_val) = val_str.parse::<f64>() {
                    let score = val_str.len() as i32;
                    if score > max_score {
                        max_score = score;
                        best_value = Some(clean_val);
                    }
                }
            }
        }
    }

    best_value
}
