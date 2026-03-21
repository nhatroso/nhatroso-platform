use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(RoomServices::Table)
                .modify_column(ColumnDef::new(RoomServices::PriceRuleId).uuid().null())
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(RoomServices::Table)
                .modify_column(ColumnDef::new(RoomServices::PriceRuleId).uuid().not_null())
                .to_owned(),
        )
        .await
    }
}

#[derive(DeriveIden)]
enum RoomServices {
    Table,
    PriceRuleId,
}

