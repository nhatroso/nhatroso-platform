use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, _m: &SchemaManager) -> Result<(), DbErr> {
        // This migration was previously applied and handled the invoice_generation_date column.
        // It is now kept as a no-op because the feature has been moved to a global config.
        Ok(())
    }

    async fn down(&self, _m: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
