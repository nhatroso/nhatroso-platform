use sea_orm_migration::{prelude::*, sea_query::Expr};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Alias::new("meter_requests"))
                .if_not_exists()
                .col(ColumnDef::new(Alias::new("id")).uuid().not_null().primary_key().default(Expr::cust("uuid_generate_v4()")))
                .col(ColumnDef::new(Alias::new("room_id")).uuid().not_null())
                .col(ColumnDef::new(Alias::new("period_month")).string().not_null())
                .col(ColumnDef::new(Alias::new("due_date")).timestamp_with_time_zone().not_null())
                .col(ColumnDef::new(Alias::new("status")).string().not_null())
                .col(ColumnDef::new(Alias::new("created_at")).timestamp_with_time_zone().not_null().default(Expr::cust("CURRENT_TIMESTAMP")))
                .col(ColumnDef::new(Alias::new("updated_at")).timestamp_with_time_zone().not_null().default(Expr::cust("CURRENT_TIMESTAMP")))
                .foreign_key(
                    ForeignKey::create()
                        .name("fk-meter_requests-room")
                        .from(Alias::new("meter_requests"), Alias::new("room_id"))
                        .to(Alias::new("rooms"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::Cascade)
                        .on_update(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

        m.create_index(
            Index::create()
                .name("idx-meter_requests-room_period")
                .table(Alias::new("meter_requests"))
                .col(Alias::new("room_id"))
                .col(Alias::new("period_month"))
                .unique()
                .to_owned()
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Alias::new("meter_requests")).to_owned()).await
    }
}
