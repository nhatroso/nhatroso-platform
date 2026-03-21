use sea_orm_migration::{prelude::*, sea_query::Expr};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(RoomServices::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(RoomServices::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(RoomServices::RoomId).uuid().not_null())
                .col(ColumnDef::new(RoomServices::ServiceId).uuid().not_null())
                .col(ColumnDef::new(RoomServices::PriceRuleId).uuid().not_null())
                .col(ColumnDef::new(RoomServices::IsActive).boolean().not_null().default(true))
                .col(
                    ColumnDef::new(RoomServices::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .col(
                    ColumnDef::new(RoomServices::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-roomservices-room_id")
                        .from(RoomServices::Table, RoomServices::RoomId)
                        .to(Rooms::Table, Rooms::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-roomservices-service_id")
                        .from(RoomServices::Table, RoomServices::ServiceId)
                        .to(Services::Table, Services::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-roomservices-pricerule_id")
                        .from(RoomServices::Table, RoomServices::PriceRuleId)
                        .to(PriceRules::Table, PriceRules::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

        // Add unique index on room_id and service_id prevent duplicates
        m.create_index(
            Index::create()
                .name("idx-roomservices-room-service")
                .table(RoomServices::Table)
                .col(RoomServices::RoomId)
                .col(RoomServices::ServiceId)
                .unique()
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(RoomServices::Table).to_owned()).await
    }
}

#[derive(DeriveIden)]
enum RoomServices {
    Table,
    Id,
    RoomId,
    ServiceId,
    PriceRuleId,
    IsActive,
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

#[derive(DeriveIden)]
enum PriceRules {
    Table,
    Id,
}
