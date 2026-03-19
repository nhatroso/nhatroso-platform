use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(ContractTenants::Table)
                .if_not_exists()
                .col(ColumnDef::new(ContractTenants::ContractId).uuid().not_null())
                .col(ColumnDef::new(ContractTenants::TenantId).uuid().not_null())
                .primary_key(
                    Index::create()
                        .name("pk-contract_tenants")
                        .col(ContractTenants::ContractId)
                        .col(ContractTenants::TenantId),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-contract_tenants-contract_id")
                        .from(ContractTenants::Table, ContractTenants::ContractId)
                        .to(Contracts::Table, Contracts::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-contract_tenants-tenant_id")
                        .from(ContractTenants::Table, ContractTenants::TenantId)
                        .to(Users::Table, Users::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(ContractTenants::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ContractTenants {
    Table,
    ContractId,
    TenantId,
}

#[derive(DeriveIden)]
enum Contracts {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}

