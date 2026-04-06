use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        // Drop the existing full unique index
        m.get_connection().execute(
            Statement::from_string(
                m.get_database_backend(),
                "DROP INDEX IF EXISTS \"idx-meters-room-service\""
            )
        )
        .await?;

        // Create a new partial unique index for ACTIVE meters only
        m.get_connection().execute(
            Statement::from_string(
                m.get_database_backend(),
                "CREATE UNIQUE INDEX \"idx-meters-room-service-active\" ON meters (room_id, service_id) WHERE status = 'ACTIVE'"
            )
        )
        .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.get_connection().execute(
            Statement::from_string(
                m.get_database_backend(),
                "DROP INDEX IF EXISTS \"idx-meters-room-service-active\""
            )
        )
        .await?;

        m.get_connection().execute(
            Statement::from_string(
                m.get_database_backend(),
                "CREATE UNIQUE INDEX \"idx-meters-room-service\" ON meters (room_id, service_id)"
            )
        )
        .await?;

        Ok(())
    }
}
