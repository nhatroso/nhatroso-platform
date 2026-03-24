use sea_orm_migration::{prelude::*, sea_query::Expr};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Meters::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Meters::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(Meters::RoomId).uuid().not_null())
                .col(ColumnDef::new(Meters::ServiceId).uuid().not_null())
                .col(ColumnDef::new(Meters::SerialNumber).string())
                .col(
                    ColumnDef::new(Meters::InitialReading)
                        .decimal()
                        .not_null()
                        .default(0),
                )
                .col(
                    ColumnDef::new(Meters::Status)
                        .string()
                        .not_null()
                        .default("ACTIVE"),
                )
                .col(
                    ColumnDef::new(Meters::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .col(
                    ColumnDef::new(Meters::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-meters-room_id")
                        .from(Meters::Table, Meters::RoomId)
                        .to(Rooms::Table, Rooms::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-meters-service_id")
                        .from(Meters::Table, Meters::ServiceId)
                        .to(Services::Table, Services::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

        // Add unique index on room_id and service_id (e.g. one electric meter per room)
        m.create_index(
            Index::create()
                .name("idx-meters-room-service")
                .table(Meters::Table)
                .col(Meters::RoomId)
                .col(Meters::ServiceId)
                .unique()
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Meters::Table).to_owned()).await
    }
}

#[derive(DeriveIden)]
enum Meters {
    Table,
    Id,
    RoomId,
    ServiceId,
    SerialNumber,
    InitialReading,
    Status,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Rooms {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Services {
    Table,
    Id,
}
