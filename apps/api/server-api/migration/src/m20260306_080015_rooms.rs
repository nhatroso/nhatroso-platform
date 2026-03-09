use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Rooms::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Rooms::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(Rooms::BuildingId).uuid().not_null())
                .col(ColumnDef::new(Rooms::FloorId).uuid().null())
                .col(ColumnDef::new(Rooms::Code).string().not_null())
                .col(
                    ColumnDef::new(Rooms::Status)
                        .string()
                        .not_null()
                        .default("VACANT"),
                )
                .col(
                    ColumnDef::new(Rooms::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .col(
                    ColumnDef::new(Rooms::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-rooms-building_id")
                        .from(Rooms::Table, Rooms::BuildingId)
                        .to(Buildings::Table, Buildings::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-rooms-floor_id")
                        .from(Rooms::Table, Rooms::FloorId)
                        .to(Floors::Table, Floors::Id)
                        .on_delete(ForeignKeyAction::SetNull)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

        // Unique compound index (building_id, code)
        m.get_connection()
            .execute_unprepared(
                r#"
            CREATE UNIQUE INDEX idx_rooms_building_code_unique
            ON rooms(building_id, code);
        "#,
            )
            .await?;

        // CHECK: status constraint
        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE rooms
            ADD CONSTRAINT rooms_status_check
            CHECK (status IN ('VACANT', 'DEPOSITED', 'OCCUPIED', 'MAINTENANCE', 'ARCHIVED'));
        "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Rooms::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Rooms {
    Table,
    Id,
    BuildingId,
    FloorId,
    Code,
    Status,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Buildings {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Floors {
    Table,
    Id,
}
