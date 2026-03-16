use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        // Create Services table
        m.create_table(
            Table::create()
                .table(Services::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Services::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(Services::OwnerId).uuid().not_null())
                .col(ColumnDef::new(Services::Name).string().not_null())
                .col(ColumnDef::new(Services::Unit).string().not_null())
                .col(
                    ColumnDef::new(Services::Status)
                        .string()
                        .not_null()
                        .default("ACTIVE"),
                )
                .col(
                    ColumnDef::new(Services::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .col(
                    ColumnDef::new(Services::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-services-owner_id")
                        .from(Services::Table, Services::OwnerId)
                        .to(Users::Table, Users::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

        // CHECK: service status constraint
        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE services
            ADD CONSTRAINT services_status_check
            CHECK (status IN ('ACTIVE', 'ARCHIVED'));
        "#,
            )
            .await?;

        // Create PriceRules table
        m.create_table(
            Table::create()
                .table(PriceRules::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(PriceRules::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(PriceRules::OwnerId).uuid().not_null())
                .col(ColumnDef::new(PriceRules::RoomId).uuid().not_null())
                .col(ColumnDef::new(PriceRules::ServiceId).uuid().not_null())
                .col(
                    ColumnDef::new(PriceRules::UnitPrice)
                        .decimal()
                        .not_null(),
                )
                .col(ColumnDef::new(PriceRules::EffectiveStart).date().not_null())
                .col(ColumnDef::new(PriceRules::EffectiveEnd).date().null())
                .col(
                    ColumnDef::new(PriceRules::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .col(
                    ColumnDef::new(PriceRules::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::cust("CURRENT_TIMESTAMP")),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-pricerules-owner_id")
                        .from(PriceRules::Table, PriceRules::OwnerId)
                        .to(Users::Table, Users::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-pricerules-room_id")
                        .from(PriceRules::Table, PriceRules::RoomId)
                        .to(Rooms::Table, Rooms::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-pricerules-service_id")
                        .from(PriceRules::Table, PriceRules::ServiceId)
                        .to(Services::Table, Services::Id)
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(PriceRules::Table).to_owned()).await?;
        m.drop_table(Table::drop().table(Services::Table).to_owned()).await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Services {
    Table,
    Id,
    OwnerId,
    Name,
    Unit,
    Status,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum PriceRules {
    Table,
    Id,
    OwnerId,
    RoomId,
    ServiceId,
    UnitPrice,
    EffectiveStart,
    EffectiveEnd,
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
