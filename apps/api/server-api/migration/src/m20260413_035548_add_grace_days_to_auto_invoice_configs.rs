use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Alias::new("auto_invoice_configs"))
                .add_column(
                    ColumnDef::new(Alias::new("grace_days"))
                        .integer()
                        .not_null()
                        .default(0),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Alias::new("auto_invoice_configs"))
                .drop_column(Alias::new("grace_days"))
                .to_owned(),
        )
        .await
    }
}

