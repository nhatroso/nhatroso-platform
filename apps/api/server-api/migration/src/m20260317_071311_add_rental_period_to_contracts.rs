use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Contracts::Table)
                .add_column(integer(Contracts::RentalPeriod))
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Contracts::Table)
                .drop_column(Alias::new("rental_period"))
                .to_owned(),
        )
        .await
    }
}

#[derive(DeriveIden)]
enum Contracts {
    Table,
    RentalPeriod,
}
