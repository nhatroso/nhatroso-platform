pub use super::_entities::payments::{ActiveModel, Entity, Model, Column};
use loco_rs::prelude::*;
use sea_orm::entity::prelude::*;
use rand::RngCore;
use serde::{Deserialize, Serialize};

pub type Payments = Entity;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, strum::Display, strum::EnumString)]
pub enum PaymentStatus {
    #[strum(serialize = "pending")]
    Pending,
    #[strum(serialize = "completed")]
    Completed,
    #[strum(serialize = "failed")]
    Failed,
    #[strum(serialize = "expired")]
    Expired,
}

impl Model {
    pub fn generate_token() -> String {
        let mut bytes = [0u8; 32];
        rand::rngs::OsRng.fill_bytes(&mut bytes);
        hex::encode(bytes)
    }

    pub async fn find_by_token(db: &DatabaseConnection, token: &str) -> ModelResult<Option<Self>> {
        let payment = Entity::find().filter(Column::Token.eq(token)).one(db).await?;
        Ok(payment)
    }

    pub async fn find_by_transaction_id(
        db: &DatabaseConnection,
        transaction_id: &str,
    ) -> ModelResult<Option<Self>> {
        let payment = Entity::find()
            .filter(Column::TransactionId.eq(transaction_id))
            .one(db)
            .await?;
        Ok(payment)
    }

    pub async fn update_expired(db: &DatabaseConnection) -> ModelResult<u64> {
        let now: chrono::DateTime<chrono::FixedOffset> = chrono::Utc::now().into();
        let res = Entity::update_many()
            .col_expr(Column::Status, Expr::value("expired"))
            .filter(Column::Status.eq("pending"))
            .filter(Column::ExpiredAt.lt(now))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    pub async fn create(
        db: &DatabaseConnection,
        invoice_id: i32,
        amount: Decimal,
        expired_in_minutes: i64,
    ) -> ModelResult<Self> {
        let token = Self::generate_token();
        let mut bytes = [0u8; 4];
        rand::rngs::OsRng.fill_bytes(&mut bytes);
        let transaction_id = format!("NHATROSO{}", hex::encode(bytes).to_uppercase());
        let now = chrono::Utc::now();
        let expired_at = now + chrono::Duration::minutes(expired_in_minutes);

        ActiveModel {
            id: ActiveValue::set(uuid::Uuid::new_v4()),
            invoice_id: ActiveValue::set(invoice_id),
            transaction_id: ActiveValue::set(transaction_id),
            token: ActiveValue::set(token),
            status: ActiveValue::set(PaymentStatus::Pending.to_string()),
            amount: ActiveValue::set(amount),
            expired_at: ActiveValue::set(expired_at.into()),
            ..Default::default()
        }
        .insert(db)
        .await
        .map_err(Into::into)
    }
}
