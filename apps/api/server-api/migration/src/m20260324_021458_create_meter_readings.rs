use sea_orm_migration::{prelude::*, sea_query::Expr};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(MeterReadings::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(MeterReadings::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(MeterReadings::MeterId).uuid().not_null())
                .col(ColumnDef::new(MeterReadings::ReadingValue).decimal().not_null())
                .col(
                    ColumnDef::new(MeterReadings::ReadingDate)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .col(ColumnDef::new(MeterReadings::ImageUrl).string())
                .col(
                    ColumnDef::new(MeterReadings::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-meterreadings-meter_id")
                        .from(MeterReadings::Table, MeterReadings::MeterId)
                        .to(Meters::Table, Meters::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(MeterReadings::Table).to_owned()).await
    }
}

#[derive(DeriveIden)]
enum MeterReadings {
    Table,
    Id,
    MeterId,
    ReadingValue,
    ReadingDate,
    ImageUrl,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Meters {
    Table,
    Id,
}

