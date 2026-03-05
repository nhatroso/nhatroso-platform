use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        // Buildings table
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
                        .name("fk_buildings_owner_id")
                        .from(Buildings::Table, Buildings::OwnerId)
                        .to(Users::Table, Users::Id)
                        .on_delete(ForeignKeyAction::Restrict),
                )
                .to_owned(),
        )
        .await?;

        // Floors table
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
                .col(ColumnDef::new(Floors::Identifier).string().not_null())
                .col(
                    ColumnDef::new(Floors::Status)
                        .string()
                        .not_null()
                        .default("ACTIVE"),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk_floors_building_id")
                        .from(Floors::Table, Floors::BuildingId)
                        .to(Buildings::Table, Buildings::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

        // Rooms table
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
                        .name("fk_rooms_building_id")
                        .from(Rooms::Table, Rooms::BuildingId)
                        .to(Buildings::Table, Buildings::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk_rooms_floor_id")
                        .from(Rooms::Table, Rooms::FloorId)
                        .to(Floors::Table, Floors::Id)
                        .on_delete(ForeignKeyAction::SetNull),
                )
                .to_owned(),
        )
        .await?;

        // Constraints and indexes
        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE buildings
            ADD CONSTRAINT buildings_status_check
            CHECK (status IN ('ACTIVE', 'ARCHIVED'));
        "#,
            )
            .await?;

        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE floors
            ADD CONSTRAINT floors_status_check
            CHECK (status IN ('ACTIVE', 'ARCHIVED'));
        "#,
            )
            .await?;

        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE rooms
            ADD CONSTRAINT rooms_status_check
            CHECK (status IN ('VACANT', 'DEPOSITED', 'OCCUPIED', 'MAINTENANCE', 'ARCHIVED'));
        "#,
            )
            .await?;

        m.get_connection()
            .execute_unprepared(
                r#"
            CREATE UNIQUE INDEX idx_rooms_building_code_unique
            ON rooms(building_id, code);
        "#,
            )
            .await?;

        m.get_connection()
            .execute_unprepared(
                r#"
            CREATE UNIQUE INDEX idx_floors_building_identifier_unique
            ON floors(building_id, identifier);
        "#,
            )
            .await?;

        // Additional indexes based on architecture document
        m.get_connection()
            .execute_unprepared(
                r#"
            CREATE INDEX idx_buildings_owner_id
            ON buildings(owner_id);
        "#,
            )
            .await?;

        m.get_connection()
            .execute_unprepared(
                r#"
            CREATE INDEX idx_rooms_building_id
            ON rooms(building_id);
        "#,
            )
            .await?;

        m.get_connection()
            .execute_unprepared(
                r#"
            CREATE INDEX idx_rooms_status
            ON rooms(status);
        "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Rooms::Table).to_owned())
            .await?;
        m.drop_table(Table::drop().table(Floors::Table).to_owned())
            .await?;
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
enum Floors {
    Table,
    Id,
    BuildingId,
    Identifier,
    Status,
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
enum Users {
    Table,
    Id,
}
