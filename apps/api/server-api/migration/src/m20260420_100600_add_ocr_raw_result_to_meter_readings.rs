use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(MeterReadings::Table)
                .add_column(
                    ColumnDef::new(MeterReadings::OcrRawResult)
                        .text()
                        .null(),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(MeterReadings::Table)
                .drop_column(MeterReadings::OcrRawResult)
                .to_owned(),
        )
        .await
    }
}

#[derive(DeriveIden)]
enum MeterReadings {
    Table,
    OcrRawResult,
}
