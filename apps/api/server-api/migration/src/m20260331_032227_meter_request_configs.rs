use sea_orm_migration::{prelude::*, sea_query::Expr};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Alias::new("meter_request_configs"))
                .if_not_exists()
                .col(ColumnDef::new(Alias::new("id")).uuid().not_null().primary_key().default(Expr::cust("uuid_generate_v4()")))
                .col(ColumnDef::new(Alias::new("landlord_id")).uuid().not_null())
                .col(ColumnDef::new(Alias::new("day_of_month")).integer().not_null())
                .col(ColumnDef::new(Alias::new("grace_days")).integer().not_null())
                .col(ColumnDef::new(Alias::new("auto_generate")).boolean().not_null())
                .col(ColumnDef::new(Alias::new("created_at")).timestamp_with_time_zone().not_null().default(Expr::cust("CURRENT_TIMESTAMP")))
                .col(ColumnDef::new(Alias::new("updated_at")).timestamp_with_time_zone().not_null().default(Expr::cust("CURRENT_TIMESTAMP")))
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-meter_request_configs-landlord")
                        .from(Alias::new("meter_request_configs"), Alias::new("landlord_id"))
                        .to(Alias::new("users"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Alias::new("meter_request_configs")).to_owned()).await
    }
}
