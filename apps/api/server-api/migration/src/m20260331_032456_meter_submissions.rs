use sea_orm_migration::{prelude::*, sea_query::Expr};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Alias::new("meter_submissions"))
                .if_not_exists()
                .col(ColumnDef::new(Alias::new("id")).uuid().not_null().primary_key().default(Expr::cust("uuid_generate_v4()")))
                .col(ColumnDef::new(Alias::new("meter_request_id")).uuid().not_null())
                .col(ColumnDef::new(Alias::new("electric_image_url")).string().not_null())
                .col(ColumnDef::new(Alias::new("water_image_url")).string().not_null())
                .col(ColumnDef::new(Alias::new("submitted_at")).timestamp_with_time_zone().not_null())
                .col(ColumnDef::new(Alias::new("created_at")).timestamp_with_time_zone().not_null().default(Expr::cust("CURRENT_TIMESTAMP")))
                .col(ColumnDef::new(Alias::new("updated_at")).timestamp_with_time_zone().not_null().default(Expr::cust("CURRENT_TIMESTAMP")))
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-meter_submissions-meter_request")
                        .from(Alias::new("meter_submissions"), Alias::new("meter_request_id"))
                        .to(Alias::new("meter_requests"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Alias::new("meter_submissions")).to_owned()).await
    }
}
