use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Buildings::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Buildings::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(Buildings::OwnerId).uuid().not_null())
                .col(ColumnDef::new(Buildings::Name).string().not_null())
                .col(ColumnDef::new(Buildings::Address).string().null())
                .col(
                    ColumnDef::new(Buildings::Status)
                        .string()
                        .not_null()
                        .default("ACTIVE"),
                )
                .col(
                    ColumnDef::new(Buildings::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .col(
                    ColumnDef::new(Buildings::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-buildings-owner_id")
                        .from(Buildings::Table, Buildings::OwnerId)
                        .to(Users::Table, Users::Id)
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
            ALTER TABLE buildings
            ADD CONSTRAINT buildings_status_check
            CHECK (status IN ('ACTIVE', 'ARCHIVED'));
        "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Buildings::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Buildings {
    Table,
    Id,
    OwnerId,
    Name,
    Address,
    Status,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
