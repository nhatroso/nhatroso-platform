use serde::{Deserialize, Serialize};
use loco_rs::prelude::*;
use crate::workers::meter_reading_worker::{MeterReadingWorker, MeterReadingWorkerArgs};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OcrJob {
    pub reading_id: uuid::Uuid,
}

impl OcrJob {
    pub fn new(reading_id: uuid::Uuid) -> Self {
        Self { reading_id }
    }

    /// Enqueue an OCR job using the Loco Worker system
    pub async fn enqueue_ocr(ctx: &AppContext, job: OcrJob) -> Result<()> {
        let args = MeterReadingWorkerArgs {
            reading_id: job.reading_id,
        };
        MeterReadingWorker::perform_later(ctx, args).await?;
        Ok(())
    }
}
