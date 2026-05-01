use sea_orm::entity::prelude::*;
use loco_rs::app::AppContext;
pub use super::_entities::meter_requests::{ActiveModel, Model, Entity, Column};
pub type MeterRequests = Entity;

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> std::result::Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        if !insert && self.updated_at.is_unchanged() {
            let mut this = self;
            this.updated_at = sea_orm::ActiveValue::Set(chrono::Utc::now().into());
            Ok(this)
        } else {
            Ok(self)
        }
    }
}

// implement your read-oriented logic here
impl Model {
    pub async fn generate_manual_requests(
        ctx: &AppContext,
        building_id: uuid::Uuid,
        period_month: &str,
        due_date: chrono::DateTime<chrono::FixedOffset>,
    ) -> std::result::Result<usize, DbErr> {
        let db = &ctx.db;
        use crate::models::_entities::rooms;

        // Get all occupied rooms in building
        let occupied_rooms = rooms::Entity::find()
            .filter(rooms::Column::BuildingId.eq(building_id))
            .filter(rooms::Column::Status.eq("OCCUPIED"))
            .all(db)
            .await?;

        let mut generated_count = 0;

        for room in occupied_rooms {
            use crate::models::_entities::{meter_readings, meters};
            let active_meters = meters::Entity::find()
                .filter(meters::Column::RoomId.eq(room.id))
                .filter(meters::Column::Status.eq("ACTIVE"))
                .all(db)
                .await?;

            if active_meters.is_empty() {
                continue;
            }

            let exists = Entity::find()
                .filter(Column::RoomId.eq(room.id))
                .filter(Column::PeriodMonth.eq(period_month))
                .one(db)
                .await?
                .is_some();

            if !exists {
                let request_id = uuid::Uuid::new_v4();
                ActiveModel {
                    id: sea_orm::ActiveValue::Set(request_id),
                    room_id: sea_orm::ActiveValue::Set(room.id),
                    period_month: sea_orm::ActiveValue::Set(period_month.to_string()),
                    due_date: sea_orm::ActiveValue::Set(due_date),
                    status: sea_orm::ActiveValue::Set("OPEN".to_string()),
                    created_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
                    updated_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
                }
                .insert(db)
                .await?;

                // Create PENDING meter_readings for all ACTIVE meters in this room
                for meter in active_meters {
                    meter_readings::ActiveModel {
                        id: sea_orm::ActiveValue::Set(uuid::Uuid::new_v4()),
                        meter_id: sea_orm::ActiveValue::Set(meter.id),
                        period_month: sea_orm::ActiveValue::Set(Some(period_month.to_string())),
                        status: sea_orm::ActiveValue::Set("PENDING".to_string()),
                        created_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
                        ..Default::default()
                    }
                    .insert(db)
                    .await?;
                }

                generated_count += 1;

                // Fire & Forget Notification via Worker
                let ctx_clone = ctx.clone();
                tokio::spawn(async move {
                    if let Err(e) = Model::notify_meter_request(&ctx_clone, request_id).await {
                        tracing::error!(error=?e, request_id=%request_id, "Failed to send meter request notification");
                    }
                });
            }
        }

        Ok(generated_count)
    }

    pub async fn notify_meter_request(ctx: &AppContext, request_id: uuid::Uuid) -> Result<(), anyhow::Error> {
        let db = &ctx.db;
        let request = Entity::find_by_id(request_id)
            .one(db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Meter request not found"))?;

        let room = super::_entities::rooms::Entity::find_by_id(request.room_id)
            .one(db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Room not found"))?;

        let tenant = self::get_tenant_for_room(db, request.room_id).await
            .map_err(|e| anyhow::anyhow!("Failed to find tenant: {:?}", e))?;

        if let Some(email) = tenant.email {
            let job = crate::jobs::email_job::EmailJob::new(
                email,
                format!("Yêu cầu nộp chỉ số điện nước - {} - {}", room.code, request.period_month),
                "meter_request.html".to_string(),
                serde_json::json!({
                    "tenant_name": tenant.name,
                    "room_code": room.code,
                    "period_month": request.period_month,
                    "due_date": request.due_date,
                    "request_url": format!("{}/meter-requests/{}", std::env::var("SERVER_HOST").unwrap_or_default(), request.id),
                }),
            );
            crate::jobs::email_job::EmailJob::enqueue_email(ctx, job).await?;
        }
        Ok(())
    }

    pub async fn check_and_update_status(
        db: &DatabaseConnection,
        room_id: uuid::Uuid,
        period_month: &str,
    ) -> std::result::Result<(), DbErr> {
        use crate::models::_entities::{meters, meter_readings};
        use sea_orm::{QueryFilter, ColumnTrait};

        // Find OPEN, PARTIAL or OVERDUE requests for this room and period
        let requests = Entity::find()
            .filter(Column::RoomId.eq(room_id))
            .filter(Column::PeriodMonth.eq(period_month))
            .filter(Column::Status.is_in(vec!["OPEN", "PARTIAL", "PENDING", "LATE"])) // Include legacy states for migration
            .all(db)
            .await?;

        if requests.is_empty() {
            return Ok(());
        }

        // Get all ACTIVE meters in this room
        let room_meters = meters::Entity::find()
            .filter(meters::Column::RoomId.eq(room_id))
            .filter(meters::Column::Status.eq("ACTIVE"))
            .all(db)
            .await?;

        let mut submitted_count = 0;
        for rm in &room_meters {
            let has_reading = meter_readings::Entity::find()
                .filter(meter_readings::Column::MeterId.eq(rm.id))
                .filter(meter_readings::Column::PeriodMonth.eq(period_month))
                .filter(
                    meter_readings::Column::Status
                        .is_in(vec!["SUBMITTED", "COMPLETED", "MANUAL_REVIEW"]),
                )
                .one(db)
                .await?;

            if has_reading.is_some() {
                submitted_count += 1;
            }
        }

        let new_status = if submitted_count == 0 {
            "OPEN".to_string()
        } else if submitted_count < room_meters.len() {
            "PARTIAL".to_string()
        } else {
            "COMPLETED".to_string()
        };

        for req in requests {
            // Check if actually overdue based on server time
            let is_overdue = req.due_date.timestamp() < chrono::Utc::now().timestamp();
            
            let status_to_set = if is_overdue && new_status != "COMPLETED" {
                "OVERDUE".to_string()
            } else {
                new_status.clone()
            };

            let mut req_active: ActiveModel = req.into();
            req_active.status = sea_orm::ActiveValue::Set(status_to_set);
            req_active.updated_at = sea_orm::ActiveValue::Set(chrono::Utc::now().into());
            req_active.update(db).await?;
        }

        Ok(())
    }
}

async fn get_tenant_for_room(db: &DatabaseConnection, room_id: uuid::Uuid) -> Result<crate::models::_entities::users::Model, DbErr> {
    use crate::models::_entities::{contracts, contract_tenants, users};
    use sea_orm::QuerySelect;

    users::Entity::find()
        .join(sea_orm::JoinType::InnerJoin, users::Relation::ContractTenants.def())
        .join(sea_orm::JoinType::InnerJoin, contract_tenants::Relation::Contracts.def())
        .filter(contracts::Column::RoomId.eq(room_id))
        .filter(contracts::Column::Status.eq("ACTIVE"))
        .one(db)
        .await?
        .ok_or_else(|| DbErr::Custom("Tenant not found".to_string()))
}


// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
