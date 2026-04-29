use loco_rs::prelude::*;
use loco_rs::bgworker::BackgroundWorker;

use sea_orm::{QueryOrder, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::models::{
    _entities::meter_readings,
    meters::Model as MeterModel,
};
use crate::services::config::AppConfig;
use crate::services::ocr_service::{VisionService, extract_meter_value};
use crate::utils::image_processor::preprocess_for_ocr;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MeterReadingWorkerArgs {
    pub reading_id: Uuid,
}

pub struct MeterReadingWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<MeterReadingWorkerArgs> for MeterReadingWorker {
    fn build(ctx: &AppContext) -> Self {
        Self {
            ctx: ctx.clone(),
        }
    }

    async fn perform(&self, args: MeterReadingWorkerArgs) -> Result<()> {
        let db = &self.ctx.db;
        tracing::info!(reading_id = ?args.reading_id, "MeterReadingWorker: Starting performance task");

        // 1. Load image record from DB
        let reading = meter_readings::Entity::find_by_id(args.reading_id)
            .one(db)
            .await?
            .ok_or_else(|| Error::NotFound)?;

        if reading.status == "SUBMITTED" || reading.status == "COMPLETED" {
            tracing::info!("Reading {} already processed, skipping", args.reading_id);
            return Ok(());
        }

        // 2. Update status = "PROCESSING"
        let mut active_reading: meter_readings::ActiveModel = reading.clone().into();
        active_reading.status = ActiveValue::Set("PROCESSING".to_string());
        let active_reading = active_reading.update(db).await?;
        tracing::debug!(reading_id = ?args.reading_id, "Status updated to PROCESSING");

        // 3. Initialize services
        let settings = self.ctx.config.settings.clone().ok_or_else(|| Error::BadRequest("Missing settings in config".to_string()))?;
        let app_config: AppConfig = serde_json::from_value(settings).map_err(|e| Error::BadRequest(format!("Invalid config: {}", e)))?;

        let vision_service = VisionService::new(&app_config.vision).await
            .map_err(|e| Error::BadRequest(format!("Failed to initialize VisionService: {}", e)))?;

        let image_url = active_reading.image_url.clone().unwrap_or_default();
        if image_url.is_empty() {
             tracing::warn!(reading_id = ?args.reading_id, "No image URL provided");
             let mut active: meter_readings::ActiveModel = active_reading.into();
             active.status = ActiveValue::Set("FAILED".to_string());
             active.update(db).await?;
             return Err(Error::BadRequest("No image URL provided".to_string()));
         }

        // 4. Download image from S3 using Storage utility
        let bucket = std::env::var("S3_BUCKET").map_err(|_| Error::BadRequest("Missing S3_BUCKET".to_string()))?;
        let storage = crate::utils::storage::Storage::new(bucket).await;
        
        tracing::debug!(image_url = %image_url, "Downloading image from S3...");
        let image_bytes = match storage.download(&image_url).await {
            Ok(bytes) => {
                tracing::info!("Downloaded image from S3. Key: {}, Size: {} bytes", image_url, bytes.len());
                bytes
            },
            Err(e) => {
                tracing::error!(error = ?e, "Failed to download image from S3");
                let mut active: meter_readings::ActiveModel = active_reading.into();
                active.status = ActiveValue::Set("FAILED".to_string());
                active.update(db).await?;
                return Err(Error::BadRequest(format!("Failed to download image from S3: {}", e)));
            }
        };

        // 5. Preprocess image with OpenCV
        tracing::debug!("Preprocessing image for OCR...");
        let processed_bytes = match preprocess_for_ocr(&image_bytes) {
            Ok(b) => {
                tracing::debug!("Image preprocessing successful");
                b
            },
            Err(e) => {
                tracing::warn!(error = ?e, "OpenCV preprocessing failed, falling back to original image");
                image_bytes
            }
        };

        // 6. Call Google Vision API with processed bytes
        tracing::info!("Calling Google Vision API...");
        match vision_service.detect_text_from_bytes(processed_bytes).await {
            Ok(ocr_text) => {
                tracing::info!(ocr_text = %ocr_text, "OCR text detected successfully");
                // 7. Fetch meter and service info to determine type
                let meter = MeterModel::find_by_id(db, active_reading.meter_id).await?
                    .ok_or_else(|| Error::NotFound)?;
                
                let service = crate::models::services::Model::find_by_id(db, meter.service_id).await?
                    .ok_or_else(|| Error::NotFound)?;

                let service_name = service.name.to_lowercase();
                let meter_type = if service_name.contains("điện") || service_name.contains("electricity") {
                    crate::services::ocr_service::MeterType::Electric
                } else if service_name.contains("nước") || service_name.contains("water") {
                    crate::services::ocr_service::MeterType::Water
                } else {
                    crate::services::ocr_service::MeterType::Unknown
                };
                tracing::debug!(meter_type = ?meter_type, "Determined meter type");

                // --- Validation Stage ---
                use crate::services::ocr_service::{validate_ocr_content, OcrValidationResult};
                let validation = validate_ocr_content(&ocr_text, meter_type);
                
                if validation != OcrValidationResult::Valid {
                    let mut active: meter_readings::ActiveModel = active_reading.into();
                    active.ocr_raw_result = ActiveValue::Set(Some(format!(
                        "VALIDATION_FAILED: {:?}\nRAW: {}",
                        validation, ocr_text
                    )));
                    
                    match validation {
                        OcrValidationResult::MismatchedType => {
                             active.status = ActiveValue::Set("FAILED".to_string());
                             tracing::warn!(validation = ?validation, "OCR Validation: Mismatched meter type detected");
                        }
                        OcrValidationResult::InvalidImage => {
                             active.status = ActiveValue::Set("FAILED".to_string());
                             tracing::warn!(validation = ?validation, "OCR Validation: Image does not appear to be a meter");
                        }
                        _ => {}
                    }
                    active.update(db).await?;
                    return Ok(());
                }
                // --- End Validation ---

                // 8. Extract numeric meter reading with type context
                if let Some(val) = extract_meter_value(&ocr_text, meter_type) {
                    // 9. Fetch previous meter reading for the same user/meter
                    let last_submitted = meter_readings::Entity::find()
                        .filter(meter_readings::Column::MeterId.eq(active_reading.meter_id))
                        .filter(meter_readings::Column::Status.is_in(vec!["SUBMITTED".to_string(), "COMPLETED".to_string()]))
                        .order_by_desc(meter_readings::Column::ReadingDate)
                        .one(db)
                        .await?;

                    let prev_value = if let Some(ls) = last_submitted {
                        ls.reading_value.and_then(|v: rust_decimal::Decimal| v.to_string().parse::<f64>().ok()).unwrap_or(0.0)
                    } else {
                        // Fallback to meter initial reading
                        meter.initial_reading.to_string().parse::<f64>().unwrap_or(0.0)
                    };

                    let consumption = (val - prev_value).max(0.0);

                    // 9. Validation Context: Flag suspicious readings for manual review
                    // - If reading decreased (val < prev_value)
                    // - If consumption is unusually high (> 500)
                    let status = if val < prev_value || consumption > 500.0 {
                        "MANUAL_REVIEW"
                    } else {
                        "COMPLETED"
                    };

                    // 10. Update record
                    let mut active: meter_readings::ActiveModel = active_reading.clone().into();
                    active.reading_value = ActiveValue::Set(Some(rust_decimal::Decimal::from_f64_retain(val).unwrap_or_default()));
                    active.usage = ActiveValue::Set(Some(rust_decimal::Decimal::from_f64_retain(consumption).unwrap_or_default()));
                    active.status = ActiveValue::Set(status.to_string());
                    active.ocr_raw_result = ActiveValue::Set(Some(ocr_text));
                    active.update(db).await?;

                    tracing::info!(
                        reading_id = ?args.reading_id,
                        extracted_value = val,
                        consumption = consumption,
                        status = status,
                        "Meter reading worker processed result"
                    );

                    // 11. Check and update meter request status
                    if let Some(period) = active_reading.period_month.as_ref() {
                        if let Err(e) = crate::models::meter_requests::Model::check_and_update_status(db, meter.room_id, period).await {
                            tracing::error!(error = ?e, "Failed to update meter request status after OCR");
                        }
                    }
                } else {
                    let mut active: meter_readings::ActiveModel = active_reading.into();
                    active.status = ActiveValue::Set("FAILED".to_string());
                    active.ocr_raw_result = ActiveValue::Set(Some(ocr_text));
                    active.update(db).await?;
                    tracing::error!("Failed to extract meter value from OCR text");
                }
            }
            Err(e) => {
                let mut active: meter_readings::ActiveModel = active_reading.into();
                active.status = ActiveValue::Set("FAILED".to_string());
                active.update(db).await?;
                tracing::error!(error = ?e, "OCR detection failed");
            }
        }

        Ok(())
    }
}
