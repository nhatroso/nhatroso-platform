use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "invoice_status_histories",
            &[
            
            ("id", ColType::PkAuto),
            
            ("from_status", ColType::StringNull),
            ("to_status", ColType::StringNull),
            ("reason", ColType::StringNull),
            ("timestamp", ColType::TimestampWithTimeZoneNull),
            ("actor_id", ColType::UuidNull),
            ],
            &[
            ("invoice", ""),
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "invoice_status_histories").await
    }
}
