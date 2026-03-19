#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;

mod m20260304_034518_users;
mod m20260304_034525_create_refresh_tokens;
mod m20260305_153000_add_name_to_users;
mod m20260305_154000_update_users_nullability;
mod m20260306_075955_buildings;
mod m20260306_080005_blocks;
mod m20260306_080006_floors;
mod m20260306_080015_rooms;
mod m20260311_030533_add_services_and_price_rules;

mod m20260317_023749_contracts;
mod m20260317_064357_create_contract_tenants;
mod m20260317_064844_move_identity_to_users;
mod m20260317_071311_add_rental_period_to_contracts;
mod m20260317_141521_remove_blocks;
mod m20260318_103000_add_building_address_to_contracts;
mod m20260318_103600_replace_building_address_with_room_details;
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
            Box::new(m20260306_080005_blocks::Migration),
            Box::new(m20260306_080006_floors::Migration),
            Box::new(m20260306_080015_rooms::Migration),
            Box::new(m20260311_030533_add_services_and_price_rules::Migration),
            Box::new(m20260317_023749_contracts::Migration),
            Box::new(m20260317_064357_create_contract_tenants::Migration),
            Box::new(m20260317_064844_move_identity_to_users::Migration),
            Box::new(m20260317_071311_add_rental_period_to_contracts::Migration),
            Box::new(m20260317_141521_remove_blocks::Migration),
            Box::new(m20260318_103000_add_building_address_to_contracts::Migration),
            Box::new(m20260318_103600_replace_building_address_with_room_details::Migration),
        ]
    }
}
