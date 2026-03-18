use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        // Drop FK and block_id column from rooms
        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE rooms
                DROP CONSTRAINT IF EXISTS "fk-rooms-block_id",
                DROP COLUMN IF EXISTS block_id;
        "#,
            )
            .await?;

        // Drop FK and block_id column from floors
        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE floors
                DROP CONSTRAINT IF EXISTS "fk-floors-block_id",
                DROP COLUMN IF EXISTS block_id;
        "#,
            )
            .await?;

        // Drop the blocks table
        m.get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS blocks CASCADE;")
            .await?;

        Ok(())
    }

    async fn down(&self, _m: &SchemaManager) -> Result<(), DbErr> {
        // No rollback — re-running previous migrations from scratch handles this
        Ok(())
    }
}
