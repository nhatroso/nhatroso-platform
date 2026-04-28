use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use crate::models::_entities::{
    users, refresh_tokens, buildings, floors, rooms, services, price_rules,
    room_services, contracts, contract_tenants, meters, meter_readings,
    meter_requests, meter_request_configs,
    invoices, invoice_details, invoice_status_histories, auto_invoice_configs,
    payments,
};
use uuid::Uuid;
use chrono::{Utc, NaiveDate, Datelike};

pub struct SeedData;

fn now() -> chrono::DateTime<chrono::FixedOffset> {
    Utc::now().into()
}

fn hash(password: &str) -> Result<String> {
    loco_rs::hash::hash_password(password).map_err(|e| Error::Message(e.to_string()))
}

#[async_trait]
impl Task for SeedData {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_data".to_string(),
            detail: "Seeds demo data for development".to_string(),
        }
    }

    async fn run(&self, app_context: &AppContext, _vars: &task::Vars) -> Result<()> {
        let db = &app_context.db;

        println!("--- Clearing Database ---");
        invoice_status_histories::Entity::delete_many().exec(db).await?;
        invoice_details::Entity::delete_many().exec(db).await?;
        payments::Entity::delete_many().exec(db).await?;
        invoices::Entity::delete_many().exec(db).await?;
        meter_readings::Entity::delete_many().exec(db).await?;
        meter_requests::Entity::delete_many().exec(db).await?;
        meter_request_configs::Entity::delete_many().exec(db).await?;
        meters::Entity::delete_many().exec(db).await?;
        room_services::Entity::delete_many().exec(db).await?;
        price_rules::Entity::delete_many().exec(db).await?;
        services::Entity::delete_many().exec(db).await?;
        contract_tenants::Entity::delete_many().exec(db).await?;
        contracts::Entity::delete_many().exec(db).await?;
        auto_invoice_configs::Entity::delete_many().exec(db).await?;
        refresh_tokens::Entity::delete_many().exec(db).await?;
        rooms::Entity::delete_many().exec(db).await?;
        floors::Entity::delete_many().exec(db).await?;
        buildings::Entity::delete_many().exec(db).await?;
        users::Entity::delete_many().exec(db).await?;
        println!("[OK] Database cleared.");

        // 1. Create Landlord
        let landlord_id = Uuid::new_v4();
        users::ActiveModel {
            id: ActiveValue::Set(landlord_id),
            email: ActiveValue::Set(Some("landlord@nhatroso.com".to_string())),
            phone: ActiveValue::Set("0123123123".to_string()),
            name: ActiveValue::Set("Chu Nha Nhatroso".to_string()),
            password_hash: ActiveValue::Set(hash("password123")?),
            role: ActiveValue::Set("OWNER".to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            id_card: ActiveValue::Set(Some("001090012345".to_string())),
            id_card_date: ActiveValue::Set(Some(NaiveDate::from_ymd_opt(2020, 5, 10).unwrap())),
            address: ActiveValue::Set(Some("123 Phố Huế, Hai Bà Trưng, Hà Nội".to_string())),
            created_at: ActiveValue::Set(now()),
            updated_at: ActiveValue::Set(now()),
        }.insert(db).await?;
        println!("[OK] Landlord created: Chu Nha Nhatroso");

        // 2. Create Buildings (3)
        let mut building_ids = Vec::new();
        let bnames = ["Khu tro Thanh Xuan", "Nha tro Cầu Giấy", "Chung cư mini Mỹ Đình"];
        for (i, name) in bnames.iter().enumerate() {
            let bid = Uuid::new_v4();
            buildings::ActiveModel {
                id: ActiveValue::Set(bid),
                owner_id: ActiveValue::Set(landlord_id),
                name: ActiveValue::Set(name.to_string()),
                address: ActiveValue::Set(Some(format!("Số {}, Đường Láng, Hà Nội", (i+1)*10))),
                status: ActiveValue::Set("ACTIVE".to_string()),
                created_at: ActiveValue::Set(now()),
                updated_at: ActiveValue::Set(now()),
            }.insert(db).await?;
            building_ids.push(bid);
            println!("[OK] Building created: {}", name);
        }

        // 3. Create 30 Tenants
        let mut tenants = Vec::new();
        let special_tenants = [
            ("0377149693", "tredsolei@mailforspam.com", "Dev Tenant 1"),
            ("0949231167", "tredsolei2@mailforspam.com", "Dev Tenant 2"),
        ];

        for (phone, email, name) in special_tenants {
            let tid = Uuid::new_v4();
            users::ActiveModel {
                id: ActiveValue::Set(tid),
                email: ActiveValue::Set(Some(email.to_string())),
                phone: ActiveValue::Set(phone.to_string()),
                name: ActiveValue::Set(name.to_string()),
                password_hash: ActiveValue::Set(hash("password123")?),
                role: ActiveValue::Set("TENANT".to_string()),
                status: ActiveValue::Set("ACTIVE".to_string()),
                id_card: ActiveValue::Set(Some(format!("0340990123{:02}", tenants.len()))),
                id_card_date: ActiveValue::Set(Some(NaiveDate::from_ymd_opt(2021, 10, 15).unwrap())),
                address: ActiveValue::Set(Some("Số 55, Ngõ 12, Khuất Duy Tiến, Hà Nội".to_string())),
                created_at: ActiveValue::Set(now()),
                updated_at: ActiveValue::Set(now()),
            }.insert(db).await?;
            tenants.push((tid, name.to_string()));
        }

        for i in 3..=30 {
            let tid = Uuid::new_v4();
            let name = format!("Tenant {}", i);
            let phone = format!("0949231{:03}", i);
            let email = format!("tenant{}@example.com", i);
            users::ActiveModel {
                id: ActiveValue::Set(tid),
                email: ActiveValue::Set(Some(email)),
                phone: ActiveValue::Set(phone),
                name: ActiveValue::Set(name.clone()),
                password_hash: ActiveValue::Set(hash("password123")?),
                role: ActiveValue::Set("TENANT".to_string()),
                status: ActiveValue::Set("ACTIVE".to_string()),
                id_card: ActiveValue::Set(Some(format!("0340990124{:02}", i))),
                id_card_date: ActiveValue::Set(Some(NaiveDate::from_ymd_opt(2022, 6, 20).unwrap())),
                address: ActiveValue::Set(Some(format!("Phòng {}, Khu tập thể Kim Liên, Đống Đa, Hà Nội", i))),
                created_at: ActiveValue::Set(now()),
                updated_at: ActiveValue::Set(now()),
            }.insert(db).await?;
            tenants.push((tid, name.clone()));
        }
        println!("[OK] 30 tenants created with enriched profiles.");

        // 4. Create Floors & Rooms with Vacancies
        let mut tenant_idx = 2; // Pointer for regular tenants (indices 2+)
        let mut room_count = 0;
        let mut vacant_count = 0;

        for (b_idx, bid) in building_ids.iter().enumerate() {
            let num_floors = 3;
            for f in 1..=num_floors {
                let fid = Uuid::new_v4();
                floors::ActiveModel {
                    id: ActiveValue::Set(fid),
                    building_id: ActiveValue::Set(*bid),
                    identifier: ActiveValue::Set(f.to_string()),
                    status: ActiveValue::Set("ACTIVE".to_string()),
                }.insert(db).await?;

                // 10 rooms per floor = 30 rooms per building = 90 rooms total
                for r in 1..=10 {
                    let rid = Uuid::new_v4();
                    let rcode = format!("{}0{}", f, r);

                    // Logic to decide if room is occupied or vacant
                    // First 30 rooms (staggered across floors) are occupied by our 30 tenants
                    let is_occupied = tenant_idx < tenants.len() && (r + f + b_idx) % 2 == 0;

                    // Force the first rooms to be occupied until all tenants are placed
                    let _force_occupied = tenant_idx < tenants.len() && tenant_idx >= (tenants.len() - (tenants.len() - tenant_idx));

                    rooms::ActiveModel {
                        id: ActiveValue::Set(rid),
                        building_id: ActiveValue::Set(*bid),
                        floor_id: ActiveValue::Set(Some(fid)),
                        code: ActiveValue::Set(rcode.clone()),
                        status: ActiveValue::Set("VACANT".to_string()),
                        created_at: ActiveValue::Set(now()),
                        updated_at: ActiveValue::Set(now()),
                    }.insert(db).await?;

                    let mut current_tenant_idx: Option<usize> = None;

                    if b_idx == 2 {
                        // Building 3: Assign dev tenants first
                        if f == 1 && r == 1 { current_tenant_idx = Some(0); }
                        else if f == 1 && r == 2 { current_tenant_idx = Some(1); }
                        else {
                             // Regular tenants for the rest of Building 3
                             let idx = std::cmp::max(tenant_idx, 2);
                             if idx < tenants.len() && (is_occupied || r == 1) {
                                  current_tenant_idx = Some(idx);
                             }
                        }
                    } else {
                        // Buildings 1 and 2: Only regular tenants
                        let idx = std::cmp::max(tenant_idx, 2);
                        if idx < tenants.len() && (is_occupied || r == 1) {
                             current_tenant_idx = Some(idx);
                        }
                    }

                    if let Some(t_idx) = current_tenant_idx {
                        // Update status to OCCUPIED
                        rooms::ActiveModel {
                            id: ActiveValue::Set(rid),
                            status: ActiveValue::Set("OCCUPIED".to_string()),
                            ..Default::default()
                        }.update(db).await?;

                        let (tid, _tname) = &tenants[t_idx];

                        // Increment regular tenant pointer
                        if t_idx == tenant_idx && t_idx >= 2 {
                             tenant_idx += 1;
                        }

                        // Current Active Contract
                        let cid = Uuid::new_v4();
                        let s_date = NaiveDate::from_ymd_opt(2025, ((t_idx % 6) + 1) as u32, (t_idx % 28 + 1) as u32).unwrap();

                        // Set some contracts to expire soon (May/June 2026)
                        let e_date = if t_idx % 5 == 0 {
                            NaiveDate::from_ymd_opt(2026, ((t_idx % 2) + 5) as u32, (t_idx % 28 + 1) as u32).unwrap()
                        } else {
                            NaiveDate::from_ymd_opt(2027, s_date.month(), s_date.day()).unwrap()
                        };

                        contracts::ActiveModel {
                            id: ActiveValue::Set(cid),
                            user_id: ActiveValue::Set(landlord_id),
                            room_id: ActiveValue::Set(rid),
                            start_date: ActiveValue::Set(s_date),
                            end_date: ActiveValue::Set(e_date),
                            status: ActiveValue::Set("ACTIVE".to_string()),
                            monthly_rent: ActiveValue::Set(3000000 + (r as i32 * 100000)),
                            deposit_amount: ActiveValue::Set(3000000),
                            payment_day: ActiveValue::Set(5),
                            rental_period: ActiveValue::Set(12),
                            room_code: ActiveValue::Set(rcode.clone()),
                            room_address: ActiveValue::Set(format!("Building {} Floor {} Room {}", b_idx+1, f, rcode)),
                            created_at: ActiveValue::Set(now()),
                            updated_at: ActiveValue::Set(now()),
                        }.insert(db).await?;

                        contract_tenants::ActiveModel {
                            contract_id: ActiveValue::Set(cid),
                            tenant_id: ActiveValue::Set(*tid),
                        }.insert(db).await?;

                        // 5. Add Expired History for some tenants (Realism)
                        if t_idx % 5 == 0 {
                            let old_cid = Uuid::new_v4();
                            let old_s = NaiveDate::from_ymd_opt(2024, 1, 1).unwrap();
                            let old_e = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();
                            contracts::ActiveModel {
                                id: ActiveValue::Set(old_cid),
                                user_id: ActiveValue::Set(landlord_id),
                                room_id: ActiveValue::Set(rid),
                                start_date: ActiveValue::Set(old_s),
                                end_date: ActiveValue::Set(old_e),
                                status: ActiveValue::Set("EXPIRED".to_string()), // Expired
                                monthly_rent: ActiveValue::Set(2800000),
                                deposit_amount: ActiveValue::Set(2800000),
                                payment_day: ActiveValue::Set(5),
                                rental_period: ActiveValue::Set(12),
                                room_code: ActiveValue::Set(rcode.clone()),
                                room_address: ActiveValue::Set(format!("Building {} Floor {} Room {}", b_idx+1, f, rcode)),
                                created_at: ActiveValue::Set(now()),
                                updated_at: ActiveValue::Set(now()),
                            }.insert(db).await?;

                            contract_tenants::ActiveModel {
                                contract_id: ActiveValue::Set(old_cid),
                                tenant_id: ActiveValue::Set(*tid),
                            }.insert(db).await?;
                        }

                        // Increment handled above conditionally
                    } else {
                        vacant_count += 1;
                    }
                    room_count += 1;
                }
            }
        }

        println!("[OK] Seeded {} rooms ({} occupied, {} vacant).", room_count, tenant_idx, vacant_count);
        println!("[OK] Added historical contracts for {} tenants.", tenants.len() / 5);
        println!("Summary: Staggered dates, historical records, and vacancies added.");

        Ok(())
    }
}
