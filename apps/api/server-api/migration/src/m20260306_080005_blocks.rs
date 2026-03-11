use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Blocks::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Blocks::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(Blocks::BuildingId).uuid().not_null())
                .col(ColumnDef::new(Blocks::Identifier).string().not_null())
                .col(
                    ColumnDef::new(Blocks::Status)
                        .string()
                        .not_null()
                        .default("ACTIVE"),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-blocks-building_id")
                        .from(Blocks::Table, Blocks::BuildingId)
                        .to(Buildings::Table, Buildings::Id)
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
            ALTER TABLE blocks
            ADD CONSTRAINT blocks_status_check
            CHECK (status IN ('ACTIVE', 'ARCHIVED'));
        "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Blocks::Table).to_owned()).await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Blocks {
    Table,
    Id,
    BuildingId,
    Identifier,
    Status,
}

#[derive(DeriveIden)]
enum Buildings {
    Table,
    Id,
}
