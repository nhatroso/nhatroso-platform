use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
#[allow(dead_code)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Alias::new("invoices"))
                .add_column(ColumnDef::new(Alias::new("due_date")).timestamp_with_time_zone().null())
                .to_owned(),
        )
        .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Alias::new("invoices"))
                .drop_column(Alias::new("due_date"))
                .to_owned(),
        )
        .await?;
        Ok(())
    }
}
