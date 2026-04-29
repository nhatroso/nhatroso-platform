#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, EntityTrait, Set};
use crate::models::{_entities::meter_requests, meter_requests::Model as MeterRequestModel};
use crate::views::meter_requests::{MeterRequestView, SubmitMeterParams, GenerateManualParams};

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

#[derive(Debug, serde::Deserialize)]
pub struct FilterParams {
    pub period_month: Option<String>,
}

#[debug_handler]
pub async fn get_all(
    auth: loco_rs::controller::extractor::auth::JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<FilterParams>,
) -> Result<Response> {
    let landlord_id = crate::utils::auth::get_user_id(&auth)?;
    let db = &ctx.db;

    use sea_orm::QueryFilter;
    use sea_orm::ColumnTrait;
    use crate::models::_entities::{buildings, rooms, meter_requests};

    let buildings = buildings::Entity::find().filter(buildings::Column::OwnerId.eq(landlord_id)).all(db).await?;
    let building_ids: Vec<uuid::Uuid> = buildings.into_iter().map(|b| b.id).collect();

    let rooms = rooms::Entity::find().filter(rooms::Column::BuildingId.is_in(building_ids)).all(db).await?;
    let room_ids: Vec<uuid::Uuid> = rooms.into_iter().map(|r| r.id).collect();

    let mut query = meter_requests::Entity::find()
        .filter(meter_requests::Column::RoomId.is_in(room_ids));

    if let Some(period) = params.period_month {
        if !period.is_empty() {
            query = query.filter(meter_requests::Column::PeriodMonth.eq(period));
        }
    }

    let requests_with_rooms = query
        .find_also_related(rooms::Entity)
        .all(db)
        .await?;

    let views: Vec<MeterRequestView> = requests_with_rooms
        .into_iter()
        .map(|(req, room)| {
            let room_code = room.map(|r| r.code).unwrap_or_default();
            MeterRequestView {
                id: req.id,
                room_id: req.room_id,
                room_code,
                period_month: req.period_month,
                due_date: req.due_date,
                status: req.status,
                created_at: req.created_at,
                updated_at: req.updated_at,
            }
        })
        .collect();

    format::json(views)
}

#[debug_handler]
pub async fn my_requests(
    auth: loco_rs::controller::extractor::auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let tenant_id = crate::utils::auth::get_user_id(&auth)?;
    let db = &ctx.db;

    use sea_orm::{QueryFilter, ColumnTrait};
    use crate::models::_entities::{contract_tenants, contracts, rooms, meter_requests};

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

    let requests_with_rooms = meter_requests::Entity::find()
        .filter(meter_requests::Column::RoomId.is_in(room_ids))
        .filter(meter_requests::Column::Status.is_in(["PENDING", "LATE"]))
        .find_also_related(rooms::Entity)
        .all(db)
        .await?;

    let views: Vec<MeterRequestView> = requests_with_rooms
        .into_iter()
        .map(|(req, room)| {
            let room_code = room.map(|r| r.code).unwrap_or_default();
            MeterRequestView {
                id: req.id,
                room_id: req.room_id,
                room_code,
                period_month: req.period_month,
                due_date: req.due_date,
                status: req.status,
                created_at: req.created_at,
                updated_at: req.updated_at,
            }
        })
        .collect();

    format::json(views)
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
    use crate::models::_entities::buildings;
    let building = buildings::Entity::find_by_id(params.building_id).one(db).await?;
    let building = match building {
        Some(b) if b.owner_id == landlord_id => b,
        _ => return Err(Error::NotFound),
    };

    let generated_count = MeterRequestModel::generate_manual_requests(
        &ctx,
        building.id,
        &params.period_month,
        params.due_date,
    )
    .await?;

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
