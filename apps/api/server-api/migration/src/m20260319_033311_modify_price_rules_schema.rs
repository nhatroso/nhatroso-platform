use sea_orm_migration::{prelude::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(PriceRules::Table)
                .modify_column(ColumnDef::new(PriceRules::RoomId).uuid().null())
                .add_column(ColumnDef::new(PriceRules::BuildingId).uuid().null())
                .to_owned(),
        )
        .await?;

        m.create_foreign_key(
            ForeignKey::create()
                .name("fk-pricerules-building_id")
                .from(PriceRules::Table, PriceRules::BuildingId)
                .to(Buildings::Table, Buildings::Id)
                .on_delete(ForeignKeyAction::Cascade)
                .on_update(ForeignKeyAction::Cascade)
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(PriceRules::Table)
                .modify_column(ColumnDef::new(PriceRules::RoomId).uuid().not_null())
                .drop_column(PriceRules::BuildingId)
                .to_owned(),
        )
        .await
    }
}

#[derive(DeriveIden)]
enum PriceRules {
    Table,
    RoomId,
    BuildingId,
}

#[derive(DeriveIden)]
enum Buildings {
    Table,
    Id,
}

