use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Floors::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Floors::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(Floors::BuildingId).uuid().not_null())
                .col(ColumnDef::new(Floors::BlockId).uuid().not_null())
                .col(ColumnDef::new(Floors::Identifier).string().not_null())
                .col(
                    ColumnDef::new(Floors::Status)
                        .string()
                        .not_null()
                        .default("ACTIVE"),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-floors-building_id")
                        .from(Floors::Table, Floors::BuildingId)
                        .to(Buildings::Table, Buildings::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-floors-block_id")
                        .from(Floors::Table, Floors::BlockId)
                        .to(Blocks::Table, Blocks::Id)
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
            ALTER TABLE floors
            ADD CONSTRAINT floors_status_check
            CHECK (status IN ('ACTIVE', 'ARCHIVED'));
        "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Floors::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Floors {
    Table,
    Id,
    BuildingId,
    BlockId,
    Identifier,
    Status,
}

#[derive(DeriveIden)]
enum Buildings {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Blocks {
    Table,
    Id,
}
