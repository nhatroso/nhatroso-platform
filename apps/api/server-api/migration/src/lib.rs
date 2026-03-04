#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;

mod m20260304_034518_users;
mod m20260304_034525_create_refresh_tokens;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260304_034518_users::Migration),
            Box::new(m20260304_034525_create_refresh_tokens::Migration),
            // inject-above (do not remove this comment)
        ]
    }
}
