#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, EntityTrait, Set};
use serde::{Deserialize, Serialize};
use crate::models::_entities::meter_requests;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SubmitMeterParams {
    pub electric_image_url: String,
    pub water_image_url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GenerateManualParams {
    pub building_id: uuid::Uuid,
    pub period_month: String, // format "YYYY-MM"
    pub due_date: chrono::DateTime<chrono::FixedOffset>,
}

#[debug_handler]
pub async fn submit(
    Path(id): Path<uuid::Uuid>,
    State(ctx): State<AppContext>,
    Json(_params): Json<SubmitMeterParams>,
) -> Result<Response> {
    let db = &ctx.db;

    let req = meter_requests::Entity::find_by_id(id).one(db).await?;
    let req = match req {
        Some(r) => r,
        None => return Err(Error::NotFound),
    };

    // meter_submissions has been deprecated. Images are stored on meter_readings.
    // For manual web requests, we just advance the status.

    let mut req_active: meter_requests::ActiveModel = req.into();
    req_active.status = Set("SUBMITTED".to_string());
    req_active.update(db).await?;

    format::json(())
}

#[debug_handler]
pub async fn get_all(
    auth: loco_rs::controller::extractor::auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let landlord_id = crate::utils::auth::get_user_id(&auth)?;
    let db = &ctx.db;

    use sea_orm::QueryFilter;
    use sea_orm::ColumnTrait;
    use crate::models::_entities::{buildings, rooms};

    let buildings = buildings::Entity::find().filter(buildings::Column::OwnerId.eq(landlord_id)).all(db).await?;
    let building_ids: Vec<uuid::Uuid> = buildings.into_iter().map(|b| b.id).collect();

    let rooms = rooms::Entity::find().filter(rooms::Column::BuildingId.is_in(building_ids)).all(db).await?;
    let room_ids: Vec<uuid::Uuid> = rooms.into_iter().map(|r| r.id).collect();

    let requests = meter_requests::Entity::find()
        .filter(meter_requests::Column::RoomId.is_in(room_ids))
        .all(db)
        .await?;

    format::json(requests)
}

#[debug_handler]
pub async fn my_requests(
    auth: loco_rs::controller::extractor::auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let tenant_id = crate::utils::auth::get_user_id(&auth)?;
    let db = &ctx.db;

    use sea_orm::{QueryFilter, ColumnTrait};
    use crate::models::_entities::{contract_tenants, contracts};

    // Find active contract for this tenant
    let active_contracts = contract_tenants::Entity::find()
        .filter(contract_tenants::Column::TenantId.eq(tenant_id))
        .find_also_related(contracts::Entity)
        .all(db)
        .await?;

    let mut room_ids = Vec::new();
    for (_ct, contract) in active_contracts {
        if let Some(c) = contract {
            if c.status == "ACTIVE" {
                room_ids.push(c.room_id);
            }
        }
    }

    let requests = meter_requests::Entity::find()
        .filter(meter_requests::Column::RoomId.is_in(room_ids))
        .filter(meter_requests::Column::Status.is_in(["PENDING", "LATE"]))
        .all(db)
        .await?;

    format::json(requests)
}

#[debug_handler]
pub async fn generate_manual(
    auth: loco_rs::controller::extractor::auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<GenerateManualParams>,
) -> Result<Response> {
    let landlord_id = crate::utils::auth::get_user_id(&auth)?;
    let db = &ctx.db;

    // Verify building belongs to landlord
    use crate::models::_entities::{buildings, rooms};
    use sea_orm::{QueryFilter, ColumnTrait};

    let building = buildings::Entity::find_by_id(params.building_id).one(db).await?;
    let building = match building {
        Some(b) if b.owner_id == landlord_id => b,
        _ => return Err(Error::NotFound),
    };

    // Get all occupied rooms in building
    let occupied_rooms = rooms::Entity::find()
        .filter(rooms::Column::BuildingId.eq(building.id))
        .filter(rooms::Column::Status.eq("OCCUPIED"))
        .all(db)
        .await?;

    let mut generated_count = 0;

    for room in occupied_rooms {
        let exists = meter_requests::Entity::find()
            .filter(meter_requests::Column::RoomId.eq(room.id))
            .filter(meter_requests::Column::PeriodMonth.eq(&params.period_month))
            .one(db)
            .await?
            .is_some();

        if !exists {
            meter_requests::ActiveModel {
                id: sea_orm::ActiveValue::Set(uuid::Uuid::new_v4()),
                room_id: sea_orm::ActiveValue::Set(room.id),
                period_month: sea_orm::ActiveValue::Set(params.period_month.clone()),
                due_date: sea_orm::ActiveValue::Set(params.due_date),
                status: sea_orm::ActiveValue::Set("PENDING".to_string()),
                created_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
                updated_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
            }
            .insert(db)
            .await?;
            generated_count += 1;
        }
    }

    format::json(serde_json::json!({
        "generated_count": generated_count
    }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/meter-requests")
        .add("/", get(get_all))
        .add("/my-requests", get(my_requests))
        .add("/generate-manual", post(generate_manual))
        .add("/{id}/submit", post(submit))
}
