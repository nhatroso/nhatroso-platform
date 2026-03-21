use sea_orm_migration::{prelude::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(PriceRules::Table)
                .add_column(
                    ColumnDef::new(PriceRules::IsActive)
                        .boolean()
                        .not_null()
                        .default(true),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(PriceRules::Table)
                .drop_column(PriceRules::IsActive)
                .to_owned(),
        )
        .await
    }
}

#[derive(DeriveIden)]
enum PriceRules {
    Table,
    IsActive,
}
