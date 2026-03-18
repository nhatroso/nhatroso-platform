use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Users::Table)
                .add_column(ColumnDef::new(Users::IdCard).string().null())
                .add_column(ColumnDef::new(Users::IdCardDate).date().null())
                .add_column(ColumnDef::new(Users::Address).string().null())
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(Contracts::Table)
                .drop_column(Contracts::TenantName)
                .drop_column(Contracts::TenantCmnd)
                .drop_column(Contracts::TenantCmndDate)
                .drop_column(Contracts::TenantAddress)
                .drop_column(Contracts::TenantPhone)
                .to_owned(),
        )
        .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Users::Table)
                .drop_column(Users::IdCard)
                .drop_column(Users::IdCardDate)
                .drop_column(Users::Address)
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(Contracts::Table)
                .add_column(ColumnDef::new(Contracts::TenantName).string().not_null().default(""))
                .add_column(ColumnDef::new(Contracts::TenantCmnd).string().not_null().default(""))
                .add_column(ColumnDef::new(Contracts::TenantCmndDate).date().not_null().default("2024-01-01"))
                .add_column(ColumnDef::new(Contracts::TenantAddress).string().not_null().default(""))
                .add_column(ColumnDef::new(Contracts::TenantPhone).string().not_null().default(""))
                .to_owned(),
        )
        .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    IdCard,
    IdCardDate,
    Address,
}

#[derive(DeriveIden)]
enum Contracts {
    Table,
    TenantName,
    TenantCmnd,
    TenantCmndDate,
    TenantAddress,
    TenantPhone,
}

