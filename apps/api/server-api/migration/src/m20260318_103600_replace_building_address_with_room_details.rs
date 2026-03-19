use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Contracts::Table)
                .add_column(ColumnDef::new(Contracts::RoomCode).string().not_null().default(""))
                .add_column(ColumnDef::new(Contracts::RoomAddress).string().not_null().default(""))
                .drop_column(Contracts::BuildingAddress)
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Contracts::Table)
                .drop_column(Contracts::RoomCode)
                .drop_column(Contracts::RoomAddress)
                .add_column(ColumnDef::new(Contracts::BuildingAddress).string().not_null().default(""))
                .to_owned(),
        )
        .await
    }
}

#[derive(DeriveIden)]
enum Contracts {
    Table,
    RoomCode,
    RoomAddress,
    BuildingAddress,
}
