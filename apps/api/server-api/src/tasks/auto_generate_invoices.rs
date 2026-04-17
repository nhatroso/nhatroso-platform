use loco_rs::app::AppContext;
use crate::models::{
    _entities::auto_invoice_configs,
    invoices::Model as InvoiceModel,
};
use loco_rs::prelude::*;
use chrono::Datelike;
use sea_orm::{QueryFilter, ColumnTrait};

pub struct AutoGenerateInvoices;

#[async_trait]
impl Task for AutoGenerateInvoices {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "auto_generate_invoices".to_string(),
            detail: "Automatically generates invoices on pre-configured days".to_string(),
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
            auto_invoice_configs::Column::DayOfMonth.gte(today)
        } else {
            auto_invoice_configs::Column::DayOfMonth.eq(today)
        };

        let configs = auto_invoice_configs::Entity::find()
            .filter(auto_invoice_configs::Column::AutoGenerate.eq(true))
            .filter(condition)
            .all(&ctx.db)
            .await?;

        for config in configs {
            let buildings = crate::models::_entities::buildings::Entity::find()
                .filter(crate::models::_entities::buildings::Column::OwnerId.eq(config.landlord_id))
                .filter(crate::models::_entities::buildings::Column::Status.eq("ACTIVE"))
                .all(&ctx.db)
                .await?;

            for building in buildings {
                let rooms = building
                    .find_related(crate::models::_entities::rooms::Entity)
                    .filter(crate::models::_entities::rooms::Column::Status.eq("ACTIVE"))
                    .all(&ctx.db)
                    .await?;

                for room in rooms {
                    let contracts = room
                        .find_related(crate::models::_entities::contracts::Entity)
                        .filter(crate::models::_entities::contracts::Column::Status.eq("ACTIVE"))
                        .all(&ctx.db)
                        .await?;

                    if contracts.is_empty() {
                        continue;
                    }

                    tracing::info!("Auto-generating invoice for room {}", room.id);

                    let calc_params = crate::views::invoices::CalculateInvoiceParams {
                        room_id: room.id,
                        period_month: period.clone(),
                    };

                    match InvoiceModel::calculate_amounts(&ctx.db, &calc_params, config.landlord_id).await {
                        Ok(calc_res) => {
                            let create_params = crate::views::invoices::CreateInvoiceParams {
                                room_id: Some(room.id),
                                room_code: Some(calc_res.room_code),
                                tenant_name: Some(calc_res.tenant_name),
                                details: calc_res.details,
                                total_amount: Some(calc_res.total_amount),
                                grace_days: None,
                            };


                            if let Err(e) = InvoiceModel::create(&ctx.db, &create_params, config.landlord_id).await {
                                tracing::error!("Failed to save invoice for room {}: {}", room.id, e);
                            }
                        }
                        Err(e) => {
                            tracing::error!("Failed to calculate invoice amounts for room {}: {:?}", room.id, e);
                        }
                    }
                }
            }
        }

        Ok(())
    }
}
