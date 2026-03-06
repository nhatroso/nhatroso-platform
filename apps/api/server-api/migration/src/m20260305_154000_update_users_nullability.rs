use sea_orm_migration::prelude::*;

#[derive(DeriveIden)]
enum Users {
    Table,
    Phone,
}

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Remove the old check constraint
        manager
            .get_connection()
            .execute_unprepared("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_or_phone_check;")
            .await?;

        // 2. Fill NULL phone numbers with a placeholder to avoid migration failure
        manager
            .get_connection()
            .execute_unprepared("UPDATE users SET phone = '+0000000000' WHERE phone IS NULL;")
            .await?;

        // 3. Make phone NOT NULL
        // Note: We assume existing data has phone set or we handle it.
        // In a fresh dev env, this is fine. For production, we'd need a data migration.
        manager
            .alter_table(
                Table::alter()
                    .table(Users::Table)
                    .modify_column(ColumnDef::new(Users::Phone).string().not_null())
                    .to_owned(),
            )
            .await?;

        // 3. Email is already nullable in the original migration, but we ensure it stays that way
        // and is decoupled from the phone constraint.

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Reverse changes: Make phone nullable again and restore the check constraint
        manager
            .alter_table(
                Table::alter()
                    .table(Users::Table)
                    .modify_column(ColumnDef::new(Users::Phone).string().null())
                    .to_owned(),
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "ALTER TABLE users ADD CONSTRAINT users_email_or_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL);",
            )
            .await?;

        Ok(())
    }
}
