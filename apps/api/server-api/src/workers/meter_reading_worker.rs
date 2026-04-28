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

        // 3. Initialize services
        let settings = self.ctx.config.settings.clone().ok_or_else(|| Error::BadRequest("Missing settings in config".to_string()))?;
        let app_config: AppConfig = serde_json::from_value(settings).map_err(|e| Error::BadRequest(format!("Invalid config: {}", e)))?;

        let vision_service = VisionService::new(&app_config.vision).await
            .map_err(|e| Error::BadRequest(format!("Failed to initialize VisionService: {}", e)))?;

        let image_url = active_reading.image_url.clone().unwrap_or_default();
        if image_url.is_empty() {
             let mut active: meter_readings::ActiveModel = active_reading.into();
             active.status = ActiveValue::Set("FAILED".to_string());
             active.update(db).await?;
             return Err(Error::BadRequest("No image URL provided".to_string()));
         }

        // 4. Download image from S3 using Storage utility
        let bucket = std::env::var("S3_BUCKET").map_err(|_| Error::BadRequest("Missing S3_BUCKET".to_string()))?;
        let storage = crate::utils::storage::Storage::new(bucket).await;
        
        let image_bytes = match storage.download(&image_url).await {
            Ok(bytes) => {
                tracing::info!("Downloaded image from S3. Key: {}, Size: {} bytes", image_url, bytes.len());
                bytes
            },
            Err(e) => {
                let mut active: meter_readings::ActiveModel = active_reading.into();
                active.status = ActiveValue::Set("FAILED".to_string());
                active.update(db).await?;
                return Err(Error::BadRequest(format!("Failed to download image from S3: {}", e)));
            }
        };

        // 5. Preprocess image with OpenCV
        let processed_bytes = match preprocess_for_ocr(&image_bytes) {
            Ok(b) => b,
            Err(e) => {
                tracing::warn!(error = ?e, "OpenCV preprocessing failed, falling back to original image");
                image_bytes
            }
        };

        // 6. Call Google Vision API with processed bytes
        match vision_service.detect_text_from_bytes(processed_bytes).await {
            Ok(ocr_text) => {
                // 7. Extract numeric meter reading
                if let Some(val) = extract_meter_value(&ocr_text) {
                    // 8. Fetch previous meter reading for the same user/meter
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
                        let meter = MeterModel::find_by_id(&self.ctx.db, active_reading.meter_id).await?.ok_or_else(|| Error::NotFound)?;
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
                    let mut active: meter_readings::ActiveModel = active_reading.into();
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
