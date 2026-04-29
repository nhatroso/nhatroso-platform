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

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MeterType {
    Electric,
    Water,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum OcrValidationResult {
    Valid,
    MismatchedType, // e.g. Electric photo for Water meter
    InvalidImage,    // Not a meter at all
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

pub fn extract_meter_value(text: &str, meter_type: MeterType) -> Option<f64> {
    // Regex to match digits, strictly excluding newlines to avoid merging unrelated numeric blocks
    // Using a literal space and dot only.
    let re = Regex::new(r"([0-9][0-9 \.]*)").ok()?;

    let mut best_value: Option<f64> = None;
    let mut max_score: i32 = -1000; // Lowered baseline

    for cap in re.captures_iter(text) {
        let raw_match = &cap[1];
        // Clean: remove only horizontal whitespace
        let val_str = raw_match.chars().filter(|c| c.is_numeric()).collect::<String>();
        
        // Skip if too short
        if val_str.len() < 4 || val_str.len() > 10 {
            continue;
        }

        let full_match = cap.get(0).unwrap();
        let start = full_match.start();
        let end = full_match.end();

        // 1. Context windows
        let prefix_window = text[..start]
            .chars()
            .rev()
            .take(80)
            .collect::<String>()
            .chars()
            .rev()
            .collect::<String>()
            .to_lowercase();

        let suffix_window = text[end..]
            .chars()
            .take(40)
            .collect::<String>()
            .to_lowercase();

        let mut current_score: i32 = 0;

        // 2. Identify Meter Type
        let detected_type = if prefix_window.contains("điện") || prefix_window.contains("công tơ") || suffix_window.contains("kwh") {
            MeterType::Electric
        } else if prefix_window.contains("nước") || prefix_window.contains("đồng hồ") || suffix_window.contains("m3") || suffix_window.contains("m³") {
            MeterType::Water
        } else {
            meter_type
        };

        // 3. Score based on length and digits
        let digit_count = val_str.len();
        
        match detected_type {
            MeterType::Electric => {
                if digit_count == 6 { current_score += 100; }
                else if digit_count == 5 { current_score += 80; }
                else { current_score -= 50; }
            }
            MeterType::Water => {
                if (5..=8).contains(&digit_count) { current_score += 80; }
                else if digit_count == 4 { current_score += 40; }
                else { current_score -= 50; }
            }
            _ => {
                if (5..=7).contains(&digit_count) { current_score += 50; }
            }
        }

        // 4. Boost for keywords
        let boosts = [
            ("chỉ số", 50),
            ("số mới", 50),
            ("hiện tại", 40),
            ("công tơ", 30),
            ("kwh", 60),
            ("m3", 60),
        ];

        for (kw, boost) in boosts {
            if prefix_window.contains(kw) || suffix_window.contains(kw) {
                current_score += boost;
            }
        }

        // 5. Penalties
        let penalties = [
            ("sosx", 200),
            ("seri", 200),
            ("no.", 200),
            ("mã", 150),
            ("vong/kwh", 150),
            ("vòng/kwh", 150),
            ("50 hz", 150),
            ("220 v", 150),
            (" cấp ", 100),
        ];

        for (kw, penalty) in penalties {
            if prefix_window.contains(kw) || suffix_window.contains(kw) {
                current_score -= penalty;
            }
        }
        
        // Technical units penalty (Voltage, Current, Frequency)
        let tech_units = [" v", " a", " hz", " w"];
        for unit in tech_units {
             if suffix_window.trim_start().starts_with(unit) {
                 current_score -= 150;
             }
        }

        // 6. Value Processing Logic
        if let Ok(num) = val_str.parse::<f64>() {
            let mut processed_val = num;

            // Apply documentation-based logic for integers
            match (detected_type, digit_count) {
                (MeterType::Electric, 6) => {
                    processed_val = (num / 10.0).floor();
                }
                (MeterType::Water, 6) => {
                    processed_val = (num / 100.0).floor();
                }
                (MeterType::Water, 7) => {
                    processed_val = (num / 1000.0).floor();
                }
                (MeterType::Water, 8) => {
                    processed_val = (num / 1000.0).floor();
                }
                _ => {
                    if val_str.contains('.') {
                        processed_val = num.floor();
                    }
                }
            }

            tracing::debug!(
                val_str = %val_str,
                detected_type = ?detected_type,
                score = current_score,
                processed_val = processed_val,
                "OCR Match Candidate"
            );

            if current_score > max_score {
                max_score = current_score;
                best_value = Some(processed_val);
            }
        }
    }

    // Fallback: simple numeric extraction from cleaned string if score is too low
    if best_value.is_none() || max_score < 10 {
        let cleaned: String = text.chars().filter(|c| c.is_numeric() || *c == '.').collect();
        if cleaned.len() >= 4 {
             if let Ok(num) = cleaned.parse::<f64>() {
                 best_value = Some(num.floor());
             }
        }
    }

    best_value
}

pub fn validate_ocr_content(text: &str, expected_type: MeterType) -> OcrValidationResult {
    let text_lower = text.to_lowercase();
    
    // 1. Basic Meter Check - Look for common meter manufacturer or unit keywords
    let has_meter_keywords = [
        "công tơ", "đồng hồ", "chỉ số", "số mới", "kwh", "m3", "m³", "gelex", "emic", "kent", "itron", "vong/kwh", "vòng/kwh"
    ].iter().any(|kw| text_lower.contains(kw));

    // Also check for numeric patterns if keywords are missing
    let re_digits = Regex::new(r"\d{4,8}").unwrap();
    let has_digits = re_digits.is_match(&text_lower);

    if !has_meter_keywords && !has_digits {
        return OcrValidationResult::InvalidImage;
    }

    // 2. Mismatch Check
    match expected_type {
        MeterType::Electric => {
            // Strong water keywords
            let has_water = ["nước", "m3", "m³", "kent", "itron"].iter().any(|kw| text_lower.contains(kw));
            // Strong electric keywords
            let has_electric = ["điện", "kwh", "gelex", "emic", "220v", "50hz", "vòng/kwh", "sosx"].iter().any(|kw| text_lower.contains(kw));
            
            if has_water && !has_electric {
                return OcrValidationResult::MismatchedType;
            }
        }
        MeterType::Water => {
            // Strong electric keywords
            let has_electric = ["điện", "kwh", "gelex", "emic", "220v", "50hz", "vòng/kwh"].iter().any(|kw| text_lower.contains(kw));
            // Strong water keywords
            let has_water = ["nước", "m3", "m³", "kent", "itron"].iter().any(|kw| text_lower.contains(kw));
            
            if has_electric && !has_water {
                return OcrValidationResult::MismatchedType;
            }
        }
        _ => {}
    }

    OcrValidationResult::Valid
}
