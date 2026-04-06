use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Alias::new("meter_readings"))
                .add_column(
                    ColumnDef::new(Alias::new("tenant_id"))
                        .uuid()
                        .null(),
                )
                .add_column(
                    ColumnDef::new(Alias::new("usage"))
                        .decimal()
                        .not_null()
                        .default(0),
                )
                .to_owned(),
        )
        .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Alias::new("meter_readings"))
                .drop_column(Alias::new("tenant_id"))
                .drop_column(Alias::new("usage"))
                .to_owned(),
        )
        .await?;

        Ok(())
    }
}

