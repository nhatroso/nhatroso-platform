use sea_orm_migration::{prelude::*, sea_query::Expr};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(ReadingRequests::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(ReadingRequests::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(ReadingRequests::BuildingId).uuid().not_null())
                .col(ColumnDef::new(ReadingRequests::LandlordId).uuid().not_null())
                .col(ColumnDef::new(ReadingRequests::Month).integer().not_null())
                .col(ColumnDef::new(ReadingRequests::Year).integer().not_null())
                .col(
                    ColumnDef::new(ReadingRequests::Status)
                        .string()
                        .not_null()
                        .default("OPEN"),
                )
                .col(
                    ColumnDef::new(ReadingRequests::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .col(
                    ColumnDef::new(ReadingRequests::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-readingrequests-building_id")
                        .from(ReadingRequests::Table, ReadingRequests::BuildingId)
                        .to(Buildings::Table, Buildings::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-readingrequests-landlord_id")
                        .from(ReadingRequests::Table, ReadingRequests::LandlordId)
                        .to(Users::Table, Users::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(ReadingRequests::Table).to_owned()).await
    }
}

#[derive(DeriveIden)]
enum ReadingRequests {
    Table,
    Id,
    BuildingId,
    LandlordId,
    Month,
    Year,
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
enum Users {
    Table,
    Id,
}
