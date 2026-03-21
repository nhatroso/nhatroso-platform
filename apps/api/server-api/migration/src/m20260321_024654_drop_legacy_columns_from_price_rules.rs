use sea_orm_migration::{prelude::*, sea_query::Expr};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_foreign_key(
            sea_query::ForeignKey::drop()
                .name("fk-pricerules-room_id")
                .table(PriceRules::Table)
                .to_owned(),
        )
        .await?;

        m.drop_foreign_key(
            sea_query::ForeignKey::drop()
                .name("fk-pricerules-building_id")
                .table(PriceRules::Table)
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(PriceRules::Table)
                .drop_column(PriceRules::RoomId)
                .drop_column(PriceRules::BuildingId)
                .drop_column(PriceRules::EffectiveStart)
                .drop_column(PriceRules::EffectiveEnd)
                .drop_column(PriceRules::IsActive)
                .add_column(
                    ColumnDef::new(PriceRules::Name)
                        .string()
                        .not_null()
                        .default("Standard Price"),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(PriceRules::Table)
                .add_column(ColumnDef::new(PriceRules::RoomId).uuid().null())
                .add_column(ColumnDef::new(PriceRules::BuildingId).uuid().null())
                .add_column(ColumnDef::new(PriceRules::EffectiveStart).date().not_null().default(Expr::cust("CURRENT_DATE")))
                .add_column(ColumnDef::new(PriceRules::EffectiveEnd).date())
                .add_column(ColumnDef::new(PriceRules::IsActive).boolean().not_null().default(true))
                .drop_column(PriceRules::Name)
                .to_owned(),
        )
        .await?;

        m.create_foreign_key(
            sea_query::ForeignKey::create()
                .name("fk-pricerules-room_id")
                .from(PriceRules::Table, PriceRules::RoomId)
                .to(Rooms::Table, Rooms::Id)
                .on_delete(ForeignKeyAction::Cascade)
                .on_update(ForeignKeyAction::Cascade)
                .to_owned(),
        )
        .await?;

        m.create_foreign_key(
            sea_query::ForeignKey::create()
                .name("fk-pricerules-building_id")
                .from(PriceRules::Table, PriceRules::BuildingId)
                .to(Buildings::Table, Buildings::Id)
                .on_delete(ForeignKeyAction::Cascade)
                .on_update(ForeignKeyAction::Cascade)
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
    EffectiveStart,
    EffectiveEnd,
    IsActive,
    Name,
}

#[derive(DeriveIden)]
enum Rooms {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Buildings {
    Table,
    Id,
}
