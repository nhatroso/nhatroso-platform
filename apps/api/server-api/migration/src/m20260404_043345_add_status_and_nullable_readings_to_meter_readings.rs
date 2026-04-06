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
                    ColumnDef::new(MeterReadings::Status)
                        .string()
                        .not_null()
                        .default("SUBMITTED"),
                )
                .modify_column(ColumnDef::new(MeterReadings::ReadingValue).decimal().null())
                .modify_column(ColumnDef::new(MeterReadings::Usage).decimal().null())
                .modify_column(
                    ColumnDef::new(MeterReadings::ReadingDate)
                        .timestamp_with_time_zone()
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
                .drop_column(MeterReadings::Status)
                .modify_column(
                    ColumnDef::new(MeterReadings::ReadingValue)
                        .decimal()
                        .not_null(),
                )
                .modify_column(ColumnDef::new(MeterReadings::Usage).decimal().not_null())
                .modify_column(
                    ColumnDef::new(MeterReadings::ReadingDate)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .to_owned(),
        )
        .await
    }
}

#[derive(DeriveIden)]
enum MeterReadings {
    Table,
    Status,
    ReadingValue,
    Usage,
    ReadingDate,
}

