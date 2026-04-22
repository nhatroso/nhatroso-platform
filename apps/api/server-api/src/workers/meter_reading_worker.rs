use loco_rs::prelude::*;
use loco_rs::bgworker::BackgroundWorker;

use sea_orm::{QueryOrder, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::models::{
    _entities::meter_readings,
    meters::Model as MeterModel,
};
use crate::services::vision::{VisionService, extract_meter_value};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MeterReadingWorkerArgs {
    pub reading_id: Uuid,
}

pub struct MeterReadingWorker {
    pub ctx: AppContext,
}

// impl MeterReadingWorker {
//     pub fn stub_job(args: MeterReadingWorkerArgs) -> Job {
//         Job::new("meter_reading_worker", args)
//     }
// }

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

        if reading.status == "SUBMITTED" {
            tracing::info!("Reading {} already processed, skipping", args.reading_id);
            return Ok(());
        }

        // 2. Update status = "PROCESSING"
        let mut active_reading: meter_readings::ActiveModel = reading.clone().into();
        active_reading.status = ActiveValue::Set("PROCESSING".to_string());
        let active_reading = active_reading.update(db).await?;

        // 3. Call Google Vision API
        let vision_service = VisionService::new(std::env::var("GOOGLE_VISION_API_KEY").unwrap_or_default());

        let image_url = active_reading.image_url.clone().unwrap_or_default();
        if image_url.is_empty() {
             let mut active: meter_readings::ActiveModel = active_reading.into();
             active.status = ActiveValue::Set("FAILED".to_string());
             active.update(db).await?;
             return Err(Error::BadRequest("No image URL provided".to_string()));
        }

        match vision_service.detect_text(&image_url).await {
            Ok(ocr_text) => {
                // 4. Extract numeric meter reading
                if let Some(val) = extract_meter_value(&ocr_text) {
                    // 5. Fetch previous meter reading for the same user/meter
                    let last_submitted = meter_readings::Entity::find()
                        .filter(meter_readings::Column::MeterId.eq(active_reading.meter_id))
                        .filter(meter_readings::Column::Status.eq("SUBMITTED"))
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

                    // 6. Update record
                    let mut active: meter_readings::ActiveModel = active_reading.into();
                    active.reading_value = ActiveValue::Set(Some(rust_decimal::Decimal::from_f64_retain(val).unwrap_or_default()));
                    active.usage = ActiveValue::Set(Some(rust_decimal::Decimal::from_f64_retain(consumption).unwrap_or_default()));
                    active.status = ActiveValue::Set("SUBMITTED".to_string());
                    active.ocr_raw_result = ActiveValue::Set(Some(ocr_text));
                    active.update(db).await?;

                    tracing::info!(
                        reading_id = ?args.reading_id,
                        extracted_value = val,
                        consumption = consumption,
                        "Meter reading worker completed successfully"
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
