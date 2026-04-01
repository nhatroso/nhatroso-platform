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
mod m20260319_033311_modify_price_rules_schema;
mod m20260320_034905_add_is_active_to_price_rules;
mod m20260321_024654_drop_legacy_columns_from_price_rules;
mod m20260321_024704_create_room_services_table;
mod m20260321_031739_allow_null_price_rule_in_room_services;
mod m20260324_021448_meters;
mod m20260324_021458_create_meter_readings;
mod m20260327_105200_create_reading_requests;
mod m20260331_032227_meter_request_configs;
mod m20260331_032406_meter_requests;
mod m20260331_032456_meter_submissions;
mod m20260401_031812_add_usage_to_meter_readings;
mod m20260401_035027_add_period_to_meter_readings;
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
            Box::new(m20260319_033311_modify_price_rules_schema::Migration),
            Box::new(m20260320_034905_add_is_active_to_price_rules::Migration),
            Box::new(m20260321_024654_drop_legacy_columns_from_price_rules::Migration),
            Box::new(m20260321_024704_create_room_services_table::Migration),
            Box::new(m20260321_031739_allow_null_price_rule_in_room_services::Migration),
            Box::new(m20260324_021448_meters::Migration),
            Box::new(m20260324_021458_create_meter_readings::Migration),
            Box::new(m20260327_105200_create_reading_requests::Migration),
            Box::new(m20260331_032227_meter_request_configs::Migration),
            Box::new(m20260331_032406_meter_requests::Migration),
            Box::new(m20260331_032456_meter_submissions::Migration),
            Box::new(m20260401_031812_add_usage_to_meter_readings::Migration),
            Box::new(m20260401_035027_add_period_to_meter_readings::Migration),
        ]
    }
}
