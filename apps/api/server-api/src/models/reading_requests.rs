use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, ActiveValue};
use uuid::Uuid;
use axum::http::StatusCode;

pub use super::_entities::reading_requests::{ActiveModel, Model, Entity};
pub type ReadingRequests = Entity;

use crate::views::reading_requests::{CreateReadingRequestParams, ReadingRequestResponse};

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

impl Model {
    pub async fn find_by_building(db: &DatabaseConnection, building_id: Uuid) -> Result<Vec<ReadingRequestResponse>> {
        let requests = ReadingRequests::find()
            .filter(crate::models::_entities::reading_requests::Column::BuildingId.eq(building_id))
            .all(db)
            .await?;
        Ok(requests.into_iter().map(ReadingRequestResponse::from).collect())
    }

    pub async fn find_by_tenant(db: &DatabaseConnection, tenant_id: Uuid) -> Result<Vec<ReadingRequestResponse>> {
        use crate::models::_entities::{contracts, contract_tenants, rooms, buildings, reading_requests};
        use sea_orm::{RelationTrait, QuerySelect};

        let requests = ReadingRequests::find()
            .join(
                sea_orm::JoinType::InnerJoin,
                reading_requests::Relation::Buildings.def(),
            )
            .join(
                sea_orm::JoinType::InnerJoin,
                buildings::Relation::Rooms.def(),
            )
            .join(
                sea_orm::JoinType::InnerJoin,
                rooms::Relation::Contracts.def(),
            )
            .join(
                sea_orm::JoinType::InnerJoin,
                contracts::Relation::ContractTenants.def(),
            )
            .filter(contract_tenants::Column::TenantId.eq(tenant_id))
            .filter(contracts::Column::Status.eq("ACTIVE"))
            .filter(reading_requests::Column::Status.eq("OPEN"))
            .all(db)
            .await?;

        Ok(requests.into_iter().map(ReadingRequestResponse::from).collect())
    }

    pub async fn create_request(
        db: &DatabaseConnection,
        landlord_id: Uuid,
        params: CreateReadingRequestParams,
    ) -> Result<std::result::Result<ReadingRequestResponse, (StatusCode, &'static str)>> {
        // Check if request already exists for this building/month/year
        let existing = ReadingRequests::find()
            .filter(crate::models::_entities::reading_requests::Column::BuildingId.eq(params.building_id))
            .filter(crate::models::_entities::reading_requests::Column::Month.eq(params.month))
            .filter(crate::models::_entities::reading_requests::Column::Year.eq(params.year))
            .one(db)
            .await?;

        if existing.is_some() {
            return Ok(Err((StatusCode::CONFLICT, "READING_REQUEST_ALREADY_EXISTS")));
        }

        let request = ActiveModel {
            id: ActiveValue::Set(Uuid::new_v4()),
            building_id: ActiveValue::Set(params.building_id),
            landlord_id: ActiveValue::Set(landlord_id),
            month: ActiveValue::Set(params.month),
            year: ActiveValue::Set(params.year),
            status: ActiveValue::Set("OPEN".to_string()),
            created_at: ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: ActiveValue::Set(chrono::Utc::now().into()),
        };

        let inserted = request.insert(db).await?;
        Ok(Ok(ReadingRequestResponse::from(inserted)))
    }
}
