use loco_rs::schema::table_auto_tz;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(Payments::Table)
                    .col(ColumnDef::new(Payments::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Payments::InvoiceId).integer().not_null())
                    .col(ColumnDef::new(Payments::TransactionId).string().not_null().unique_key())
                    .col(ColumnDef::new(Payments::Token).string().not_null().unique_key())
                    .col(ColumnDef::new(Payments::Status).string().not_null())
                    .col(ColumnDef::new(Payments::Amount).decimal_len(15, 2).not_null())
                    .col(ColumnDef::new(Payments::ExpiredAt).timestamp_with_time_zone().not_null())
                    .col(ColumnDef::new(Payments::PaidAt).timestamp_with_time_zone())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-payments-invoices")
                            .from(Payments::Table, Payments::InvoiceId)
                            .to(Invoices::Table, Invoices::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx-payments-token")
                    .table(Payments::Table)
                    .col(Payments::Token)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Payments::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Payments {
    Table,
    Id,
    InvoiceId,
    TransactionId,
    Token,
    Status,
    Amount,
    ExpiredAt,
    PaidAt,
}

#[derive(DeriveIden)]
enum Invoices {
    Table,
    Id,
}
