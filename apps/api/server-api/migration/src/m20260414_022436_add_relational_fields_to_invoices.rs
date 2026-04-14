use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
#[allow(dead_code)]
pub struct Migration;


#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Alias::new("invoices"))
                .add_column(ColumnDef::new(Alias::new("room_id")).uuid().null())
                .add_column(ColumnDef::new(Alias::new("landlord_id")).uuid().null())
                .to_owned(),
        )
        .await?;

        // Add foreign keys
        m.create_foreign_key(
            ForeignKey::create()
                .name("fk-invoices-room_id")
                .from(Alias::new("invoices"), Alias::new("room_id"))
                .to(Alias::new("rooms"), Alias::new("id"))
                .on_delete(ForeignKeyAction::Cascade)
                .on_update(ForeignKeyAction::Cascade)
                .to_owned(),
        )
        .await?;

        m.create_foreign_key(
            ForeignKey::create()
                .name("fk-invoices-landlord_id")
                .from(Alias::new("invoices"), Alias::new("landlord_id"))
                .to(Alias::new("users"), Alias::new("id"))
                .on_delete(ForeignKeyAction::Cascade)
                .on_update(ForeignKeyAction::Cascade)
                .to_owned(),
        )
        .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(Alias::new("invoices"))
                .drop_column(Alias::new("room_id"))
                .drop_column(Alias::new("landlord_id"))
                .to_owned(),
        )
        .await?;
        Ok(())
    }
}
