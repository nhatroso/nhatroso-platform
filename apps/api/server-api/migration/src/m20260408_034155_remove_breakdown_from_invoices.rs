
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[derive(DeriveIden)]
enum Invoices {
    Table,
    Breakdown,
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Invoices::Table)
                .drop_column(Invoices::Breakdown)
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Invoices::Table)
                .add_column(ColumnDef::new(Invoices::Breakdown).json_binary())
                .to_owned(),
        )
        .await
    }
}
