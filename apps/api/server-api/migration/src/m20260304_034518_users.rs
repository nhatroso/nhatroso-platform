use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        // Enable uuid extension (safe if exists)
        m.get_connection()
            .execute_unprepared(r#"CREATE EXTENSION IF NOT EXISTS "uuid-ossp";"#)
            .await?;

        m.create_table(
            Table::create()
                .table(Users::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Users::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(Users::Email).string().null())
                .col(ColumnDef::new(Users::Phone).string().null())
                .col(ColumnDef::new(Users::PasswordHash).string().not_null())
                .col(ColumnDef::new(Users::Role).string().not_null())
                .col(
                    ColumnDef::new(Users::Status)
                        .string()
                        .not_null()
                        .default("ACTIVE"),
                )
                .col(
                    ColumnDef::new(Users::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .col(
                    ColumnDef::new(Users::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .to_owned(),
        )
        .await?;

        // Unique partial index email
        m.get_connection()
            .execute_unprepared(
                r#"
            CREATE UNIQUE INDEX idx_users_email_unique
            ON users(email)
            WHERE email IS NOT NULL;
        "#,
            )
            .await?;

        // Unique partial index phone
        m.get_connection()
            .execute_unprepared(
                r#"
            CREATE UNIQUE INDEX idx_users_phone_unique
            ON users(phone)
            WHERE phone IS NOT NULL;
        "#,
            )
            .await?;

        // CHECK: must have email or phone
        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE users
            ADD CONSTRAINT users_email_or_phone_check
            CHECK (email IS NOT NULL OR phone IS NOT NULL);
        "#,
            )
            .await?;

        // CHECK: role constraint
        m.get_connection()
            .execute_unprepared(
                r#"
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role IN ('OWNER', 'TENANT'));
        "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    Email,
    Phone,
    PasswordHash,
    Role,
    Status,
    CreatedAt,
    UpdatedAt,
}
