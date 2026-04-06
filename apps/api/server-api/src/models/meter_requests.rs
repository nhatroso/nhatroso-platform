use sea_orm::entity::prelude::*;
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
        db: &DatabaseConnection,
        building_id: uuid::Uuid,
        period_month: &str,
        due_date: chrono::DateTime<chrono::FixedOffset>,
    ) -> std::result::Result<usize, DbErr> {
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
                    status: sea_orm::ActiveValue::Set("PENDING".to_string()),
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
            }
        }

        Ok(generated_count)
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
