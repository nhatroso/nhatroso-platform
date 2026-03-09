#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;

mod m20260304_034518_users;
mod m20260304_034525_create_refresh_tokens;
mod m20260305_153000_add_name_to_users;
mod m20260305_154000_update_users_nullability;
mod m20260306_075955_buildings;
mod m20260306_080006_floors;
mod m20260306_080015_rooms;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260304_034518_users::Migration),
            Box::new(m20260304_034525_create_refresh_tokens::Migration),
            Box::new(m20260305_153000_add_name_to_users::Migration),
            Box::new(m20260305_154000_update_users_nullability::Migration),
            Box::new(m20260306_075955_buildings::Migration),
            Box::new(m20260306_080006_floors::Migration),
            Box::new(m20260306_080015_rooms::Migration),
            // inject-above (do not remove this comment)
        ]
    }
}