use loco_rs::app::AppContext;
use crate::models::{
    _entities::meter_request_configs,
    meter_requests::Model as MeterRequestModel,
};
use loco_rs::prelude::*;
use chrono::Datelike;
use sea_orm::{QueryFilter, ColumnTrait};

pub struct AutoGenerateMeterRequests;

#[async_trait]
impl Task for AutoGenerateMeterRequests {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "auto_generate_meter_requests".to_string(),
            detail: "Automatically generates meter requests on pre-configured days".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &loco_rs::task::Vars) -> Result<()> {
        let now = chrono::Utc::now();
        let today = now.day() as i32;
        let period = now.format("%Y-%m").to_string();

        let is_last_day_of_month = {
            let next_day = now.naive_utc() + chrono::Duration::days(1);
            next_day.month() != now.month()
        };

        // Query configs where auto_generate is true and day_of_month matches
        let condition = if is_last_day_of_month {
            meter_request_configs::Column::DayOfMonth.gte(today)
        } else {
            meter_request_configs::Column::DayOfMonth.eq(today)
        };

        let configs = meter_request_configs::Entity::find()
            .filter(meter_request_configs::Column::AutoGenerate.eq(true))
            .filter(condition)
            .all(&ctx.db)
            .await?;

        for config in configs {
            // Calculate due_date from grace_days
            let due_date = now + chrono::Duration::days(config.grace_days as i64);

            let buildings = crate::models::_entities::buildings::Entity::find()
                .filter(crate::models::_entities::buildings::Column::OwnerId.eq(config.landlord_id))
                .filter(crate::models::_entities::buildings::Column::Status.eq("ACTIVE"))
                .all(&ctx.db)
                .await?;

            for building in buildings {
                tracing::info!("Auto-generating meter requests for building {}", building.id);

                match MeterRequestModel::generate_manual_requests(
                    ctx,
                    building.id,
                    &period,
                    due_date.into()
                ).await {
                    Ok(generated_count) => {
                        tracing::info!("Successfully generated {} meter requests for building {}", generated_count, building.id);
                    }
                    Err(e) => {
                        tracing::error!("Failed to generate meter requests for building {}: {:?}", building.id, e);
                    }
                }
            }
        }

        Ok(())
    }
}
