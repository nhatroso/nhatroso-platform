use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(RefreshTokens::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(RefreshTokens::Id)
                        .uuid()
                        .not_null()
                        .primary_key()
                        .default(Expr::cust("uuid_generate_v4()")),
                )
                .col(ColumnDef::new(RefreshTokens::UserId).uuid().not_null())
                .col(ColumnDef::new(RefreshTokens::Jti).uuid().not_null())
                .col(
                    ColumnDef::new(RefreshTokens::ExpiresAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(RefreshTokens::RevokedAt)
                        .timestamp_with_time_zone()
                        .null(),
                )
                .col(
                    ColumnDef::new(RefreshTokens::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .to_owned(),
        )
        .await?;

        // FK with cascade delete
        m.create_foreign_key(
            ForeignKey::create()
                .name("fk_refresh_tokens_user_id")
                .from(RefreshTokens::Table, RefreshTokens::UserId)
                .to(Users::Table, Users::Id)
                .on_delete(ForeignKeyAction::Cascade)
                .to_owned(),
        )
        .await?;

        // Index for user lookup
        m.create_index(
            Index::create()
                .name("idx_refresh_tokens_user_id")
                .table(RefreshTokens::Table)
                .col(RefreshTokens::UserId)
                .to_owned(),
        )
        .await?;

        // Unique JTI
        m.create_index(
            Index::create()
                .name("idx_refresh_tokens_jti_unique")
                .table(RefreshTokens::Table)
                .col(RefreshTokens::Jti)
                .unique()
                .to_owned(),
        )
        .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(RefreshTokens::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum RefreshTokens {
    Table,
    Id,
    UserId,
    Jti,
    ExpiresAt,
    RevokedAt,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
