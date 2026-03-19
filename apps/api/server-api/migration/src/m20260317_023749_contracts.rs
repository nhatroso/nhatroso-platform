use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Contracts::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Contracts::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(Contracts::UserId).uuid().not_null())
                .col(ColumnDef::new(Contracts::RoomId).uuid().not_null())
                .col(ColumnDef::new(Contracts::TenantName).string().not_null())
                .col(ColumnDef::new(Contracts::TenantCmnd).string().not_null())
                .col(ColumnDef::new(Contracts::TenantCmndDate).date().not_null())
                .col(ColumnDef::new(Contracts::TenantAddress).string().not_null())
                .col(ColumnDef::new(Contracts::TenantPhone).string().not_null())
                .col(ColumnDef::new(Contracts::StartDate).date().not_null())
                .col(ColumnDef::new(Contracts::EndDate).date().not_null())
                .col(ColumnDef::new(Contracts::MonthlyRent).integer().not_null())
                .col(ColumnDef::new(Contracts::DepositAmount).integer().not_null())
                .col(ColumnDef::new(Contracts::PaymentDay).integer().not_null())
                .col(
                    ColumnDef::new(Contracts::Status)
                        .string()
                        .not_null()
                        .default("ACTIVE"),
                )
                .col(
                    ColumnDef::new(Contracts::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .col(
                    ColumnDef::new(Contracts::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-contracts-user_id")
                        .from(Contracts::Table, Contracts::UserId)
                        .to(Users::Table, Users::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-contracts-room_id")
                        .from(Contracts::Table, Contracts::RoomId)
                        .to(Rooms::Table, Rooms::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

        // CHECK: status constraint
        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE contracts
            ADD CONSTRAINT contracts_status_check
            CHECK (status IN ('ACTIVE', 'TERMINATED', 'EXPIRED'));
        "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Contracts::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Contracts {
    Table,
    Id,
    UserId,
    RoomId,
    TenantName,
    TenantCmnd,
    TenantCmndDate,
    TenantAddress,
    TenantPhone,
    StartDate,
    EndDate,
    MonthlyRent,
    DepositAmount,
    PaymentDay,
    Status,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Rooms {
    Table,
    Id,
}
