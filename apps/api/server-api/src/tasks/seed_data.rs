use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, ColumnTrait, QueryFilter};

use crate::models::_entities::{
    users, buildings, floors, rooms, services, price_rules,
    room_services, contracts, contract_tenants, meters, meter_readings,
    reading_requests,
};

pub struct SeedData;

// ─── Helper ────────────────────────────────────────────────────────────────────
fn now() -> chrono::DateTime<chrono::FixedOffset> {
    chrono::Utc::now().into()
}

fn hash(password: &str) -> std::result::Result<String, Error> {
    loco_rs::hash::hash_password(password).map_err(|e| Error::Message(e.to_string()))
}

#[async_trait]
impl Task for SeedData {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_data".to_string(),
            detail: "Seeds comprehensive demo data for the entire platform".to_string(),
        }
    }

    async fn run(&self, app_context: &AppContext, _vars: &task::Vars) -> Result<()> {
        let db = &app_context.db;

        // ════════════════════════════════════════════════════════════════════════════
        // 1. USERS
        // ════════════════════════════════════════════════════════════════════════════
        let owner_phone = "0901234567";
        let owner_id = find_or_create_user(db, users::ActiveModel {
            id: ActiveValue::Set(uuid::Uuid::new_v4()),
            email: ActiveValue::Set(Some("owner@nhatroso.vn".to_string())),
            phone: ActiveValue::Set(owner_phone.to_string()),
            name: ActiveValue::Set("Nguyen Van Chu".to_string()),
            password_hash: ActiveValue::Set(hash("password123")?),
            role: ActiveValue::Set("OWNER".to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            id_card: ActiveValue::Set(Some("001099012345".to_string())),
            id_card_date: ActiveValue::Set(Some(chrono::NaiveDate::from_ymd_opt(2020, 6, 15).unwrap())),
            address: ActiveValue::Set(Some("123 Nguyen Trai, Quan 1, TP.HCM".to_string())),
            created_at: ActiveValue::Set(now()),
            updated_at: ActiveValue::Set(now()),
        }).await?;
        println!("[OK] Owner 1: Nguyen Van Chu ({})", owner_phone);

        // ── Owner 2 ──
        let owner2_phone = "0967891234";
        let _owner2_id = find_or_create_user(db, users::ActiveModel {
            id: ActiveValue::Set(uuid::Uuid::new_v4()),
            email: ActiveValue::Set(Some("owner2@nhatroso.vn".to_string())),
            phone: ActiveValue::Set(owner2_phone.to_string()),
            name: ActiveValue::Set("Nguyen Thi Mai".to_string()),
            password_hash: ActiveValue::Set(hash("password123")?),
            role: ActiveValue::Set("OWNER".to_string()),
            status: ActiveValue::Set("ACTIVE".to_string()),
            id_card: ActiveValue::Set(Some("001099098765".to_string())),
            id_card_date: ActiveValue::Set(Some(chrono::NaiveDate::from_ymd_opt(2019, 11, 5).unwrap())),
            address: ActiveValue::Set(Some("55 Vo Van Tan, Quan 3, TP.HCM".to_string())),
            created_at: ActiveValue::Set(now()),
            updated_at: ActiveValue::Set(now()),
        }).await?;
        println!("[OK] Owner 2: Nguyen Thi Mai ({})", owner2_phone);

        // ── Tenants ──
        struct TenantInfo { phone: &'static str, email: &'static str, name: &'static str, id_card: &'static str, address: &'static str }
        let tenants_info = [
            TenantInfo { phone: "0912345678", email: "tenant1@example.com", name: "Tran Thi Thue",    id_card: "079099087654", address: "789 Dinh Tien Hoang, Binh Thanh, TP.HCM" },
            TenantInfo { phone: "0923456789", email: "tenant2@example.com", name: "Le Van Minh",      id_card: "079099076543", address: "45 Pham Van Dong, Thu Duc, TP.HCM" },
            TenantInfo { phone: "0934567890", email: "tenant3@example.com", name: "Pham Thi Hoa",     id_card: "079099065432", address: "12 Ly Thai To, Quan 10, TP.HCM" },
            TenantInfo { phone: "0945678901", email: "tenant4@example.com", name: "Hoang Van Tuan",   id_card: "079099054321", address: "88 Hai Ba Trung, Quan 1, TP.HCM" },
            TenantInfo { phone: "0956789012", email: "tenant5@example.com", name: "Vo Thi Lan",       id_card: "079099043210", address: "33 Nguyen Hue, Quan 1, TP.HCM" },
            TenantInfo { phone: "0967890123", email: "tenant6@example.com", name: "Bui Quoc Hung",    id_card: "079099032109", address: "150 Le Dai Hanh, Quan 11, TP.HCM" },
            TenantInfo { phone: "0978901234", email: "tenant7@example.com", name: "Dang Thi Kim Ngan",id_card: "079099021098", address: "27 Nguyen Dinh Chieu, Quan 3, TP.HCM" },
            TenantInfo { phone: "0989012345", email: "tenant8@example.com", name: "Ngo Van Thanh",    id_card: "079099010987", address: "66 Ba Thang Hai, Quan 10, TP.HCM" },
            TenantInfo { phone: "0990123456", email: "tenant9@example.com", name: "Do Thi Ngoc Anh",  id_card: "079099009876", address: "99 Cach Mang Thang Tam, Quan 3, TP.HCM" },
            TenantInfo { phone: "0901012345", email: "tenant10@example.com",name: "Truong Van Dat",   id_card: "079099008765", address: "202 Nguyen Van Cu, Quan 5, TP.HCM" },
            TenantInfo { phone: "0912012345", email: "tenant11@example.com",name: "Ly Thi Phuong",    id_card: "079099007654", address: "15 Le Van Sy, Phu Nhuan, TP.HCM" },
        ];

        let mut tenant_ids = Vec::new();
        for t in &tenants_info {
            let tid = find_or_create_user(db, users::ActiveModel {
                id: ActiveValue::Set(uuid::Uuid::new_v4()),
                email: ActiveValue::Set(Some(t.email.to_string())),
                phone: ActiveValue::Set(t.phone.to_string()),
                name: ActiveValue::Set(t.name.to_string()),
                password_hash: ActiveValue::Set(hash("password123")?),
                role: ActiveValue::Set("TENANT".to_string()),
                status: ActiveValue::Set("ACTIVE".to_string()),
                id_card: ActiveValue::Set(Some(t.id_card.to_string())),
                id_card_date: ActiveValue::Set(Some(chrono::NaiveDate::from_ymd_opt(2021, 3, 20).unwrap())),
                address: ActiveValue::Set(Some(t.address.to_string())),
                created_at: ActiveValue::Set(now()),
                updated_at: ActiveValue::Set(now()),
            }).await?;
            println!("[OK] Tenant: {} ({})", t.name, t.phone);
            tenant_ids.push(tid);
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 2. BUILDINGS
        // ════════════════════════════════════════════════════════════════════════════
        struct BuildingInfo { name: &'static str, address: &'static str }
        let buildings_info = [
            BuildingInfo { name: "Nha Tro Binh An",   address: "456 Le Loi, Quan 3, TP.HCM" },
            BuildingInfo { name: "Nha Tro Phu Quy",   address: "78 Tran Hung Dao, Quan 5, TP.HCM" },
        ];

        let mut building_ids = Vec::new();
        for b in &buildings_info {
            let bid = find_or_create_building(db, owner_id, b.name, b.address).await?;
            println!("[OK] Building: {}", b.name);
            building_ids.push(bid);
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 3. FLOORS
        // ════════════════════════════════════════════════════════════════════════════
        // Building 1: 2 floors, Building 2: 1 floor
        let floor_layout = [
            (building_ids[0], vec!["1", "2"]),
            (building_ids[1], vec!["1"]),
        ];

        let mut floor_ids: Vec<Vec<uuid::Uuid>> = Vec::new();
        for (bid, identifiers) in &floor_layout {
            let mut fids = Vec::new();
            for ident in identifiers {
                let fid = find_or_create_floor(db, *bid, ident).await?;
                println!("[OK] Floor: Tang {} (building {})", ident, bid);
                fids.push(fid);
            }
            floor_ids.push(fids);
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 4. ROOMS
        // ════════════════════════════════════════════════════════════════════════════
        // Building 1, Floor 1: A101, A102, A103
        // Building 1, Floor 2: A201, A202
        // Building 2, Floor 1: B101, B102, B103
        struct RoomInfo { code: &'static str, status: &'static str }
        let room_layout: Vec<(uuid::Uuid, uuid::Uuid, Vec<RoomInfo>)> = vec![
            (building_ids[0], floor_ids[0][0], vec![
                RoomInfo { code: "A101", status: "OCCUPIED" },
                RoomInfo { code: "A102", status: "OCCUPIED" },
                RoomInfo { code: "A103", status: "VACANT" },
            ]),
            (building_ids[0], floor_ids[0][1], vec![
                RoomInfo { code: "A201", status: "OCCUPIED" },
                RoomInfo { code: "A202", status: "VACANT" },
            ]),
            (building_ids[1], floor_ids[1][0], vec![
                RoomInfo { code: "B101", status: "OCCUPIED" },
                RoomInfo { code: "B102", status: "OCCUPIED" },
                RoomInfo { code: "B103", status: "VACANT" },
            ]),
        ];

        let mut all_room_ids: Vec<(uuid::Uuid, String, uuid::Uuid)> = Vec::new(); // (room_id, code, building_id)
        for (bid, fid, room_infos) in &room_layout {
            for r in room_infos {
                let rid = find_or_create_room(db, *bid, *fid, r.code, r.status).await?;
                println!("[OK] Room: {} ({})", r.code, r.status);
                all_room_ids.push((rid, r.code.to_string(), *bid));
            }
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 5. SERVICES
        // ════════════════════════════════════════════════════════════════════════════
        struct ServiceInfo { name: &'static str, unit: &'static str }
        let services_info = [
            ServiceInfo { name: "electricity", unit: "kWh" },
            ServiceInfo { name: "water",       unit: "m3" },
            ServiceInfo { name: "internet",    unit: "month" },
            ServiceInfo { name: "trash",       unit: "month" },
        ];

        let mut service_ids = Vec::new();
        for s in &services_info {
            let sid = find_or_create_service(db, owner_id, s.name, s.unit).await?;
            println!("[OK] Service: {}", s.name);
            service_ids.push(sid);
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 6. PRICE RULES
        // ════════════════════════════════════════════════════════════════════════════
        struct PriceRuleInfo { name: &'static str, service_idx: usize, unit_price: rust_decimal::Decimal }
        let price_rules_info = [
            PriceRuleInfo { name: "Gia dien",    service_idx: 0, unit_price: rust_decimal::Decimal::from(3500) },
            PriceRuleInfo { name: "Gia nuoc",    service_idx: 1, unit_price: rust_decimal::Decimal::from(15000) },
            PriceRuleInfo { name: "Phi internet", service_idx: 2, unit_price: rust_decimal::Decimal::from(100000) },
            PriceRuleInfo { name: "Phi rac",     service_idx: 3, unit_price: rust_decimal::Decimal::from(30000) },
        ];

        let mut price_rule_ids = Vec::new();
        for pr in &price_rules_info {
            let prid = find_or_create_price_rule(db, owner_id, service_ids[pr.service_idx], pr.name, pr.unit_price).await?;
            println!("[OK] Price Rule: {} = {}", pr.name, pr.unit_price);
            price_rule_ids.push(prid);
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 7. ROOM SERVICES (assign all 4 services to occupied rooms)
        // ════════════════════════════════════════════════════════════════════════════
        let occupied_rooms: Vec<&(uuid::Uuid, String, uuid::Uuid)> = all_room_ids.iter()
            .filter(|(_, code, _)| ["A101", "A102", "A201", "B101", "B102"].contains(&code.as_str()))
            .collect();

        for (rid, code, _bid) in &occupied_rooms {
            for (i, sid) in service_ids.iter().enumerate() {
                find_or_create_room_service(db, *rid, *sid, Some(price_rule_ids[i])).await?;
            }
            println!("[OK] Room Services assigned to: {}", code);
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 8. CONTRACTS (for occupied rooms)
        // ════════════════════════════════════════════════════════════════════════════
        let contract_assignments = [
            // (room_code, tenant_index)
            ("A101", 0),
            ("A102", 1),
            ("A201", 2),
            ("B101", 3),
            ("B102", 4),
        ];

        let mut contract_ids = Vec::new();
        for (room_code, tenant_idx) in &contract_assignments {
            let (rid, code, bid) = all_room_ids.iter().find(|(_, c, _)| c == room_code).unwrap();

            let building = buildings::Entity::find_by_id(*bid).one(db).await?.unwrap();
            let address = format!("{} - {}", code, building.address.unwrap_or_default());

            let cid = find_or_create_contract(
                db, owner_id, *rid, code, &address,
            ).await?;

            // Link tenant to contract
            find_or_create_contract_tenant(db, cid, tenant_ids[*tenant_idx]).await?;
            println!("[OK] Contract: {} -> {}", room_code, tenants_info[*tenant_idx].name);
            contract_ids.push(cid);
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 9. METERS (electricity + water for occupied rooms)
        // ════════════════════════════════════════════════════════════════════════════
        let electricity_service_id = service_ids[0];
        let water_service_id = service_ids[1];

        let mut meter_ids: Vec<(uuid::Uuid, String)> = Vec::new(); // (meter_id, room_code)
        for (rid, code, _) in &occupied_rooms {
            // Electricity meter
            let em_id = find_or_create_meter(db, *rid, electricity_service_id,
                &format!("ELEC-{}", code), rust_decimal::Decimal::from(0)).await?;
            meter_ids.push((em_id, format!("{}-ELEC", code)));

            // Water meter
            let wm_id = find_or_create_meter(db, *rid, water_service_id,
                &format!("WATER-{}", code), rust_decimal::Decimal::from(0)).await?;
            meter_ids.push((wm_id, format!("{}-WATER", code)));

            println!("[OK] Meters created for: {}", code);
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 10. METER READINGS (sample readings for previous months)
        // ════════════════════════════════════════════════════════════════════════════
        let current_year = chrono::Utc::now().year();
        let current_month = chrono::Utc::now().month();

        // Create readings for the last 3 months
        for (meter_id, label) in &meter_ids {
            let is_electric = label.contains("ELEC");
            let mut cumulative = 0i64;

            for months_ago in (1..=3).rev() {
                let reading_month = if current_month as i32 - months_ago > 0 {
                    (current_month as i32 - months_ago) as u32
                } else {
                    (12 + current_month as i32 - months_ago) as u32
                };
                let reading_year = if current_month as i32 - months_ago > 0 {
                    current_year
                } else {
                    current_year - 1
                };

                let increment = if is_electric {
                    rand_range(50, 150)
                } else {
                    rand_range(5, 20)
                };
                cumulative += increment;

                let reading_date = chrono::NaiveDate::from_ymd_opt(reading_year, reading_month, 15).unwrap();
                let reading_dt = reading_date.and_hms_opt(10, 0, 0).unwrap();
                let reading_dt_tz: chrono::DateTime<chrono::FixedOffset> = chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(reading_dt, chrono::Utc).into();

                create_meter_reading_if_needed(db, *meter_id, cumulative, reading_dt_tz).await?;
            }
            println!("[OK] Readings created for: {}", label);
        }

        // Also create current month reading for SOME meters (to simulate partial submission)
        // A101 and B101 have submitted this month, others pending
        for (meter_id, label) in &meter_ids {
            if label.starts_with("A101") || label.starts_with("B101") {
                let is_electric = label.contains("ELEC");
                let last_val = if is_electric { 450 } else { 50 };
                let reading_date = chrono::NaiveDate::from_ymd_opt(current_year, current_month, 10).unwrap();
                let reading_dt = reading_date.and_hms_opt(10, 0, 0).unwrap();
                let reading_dt_tz: chrono::DateTime<chrono::FixedOffset> = chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(reading_dt, chrono::Utc).into();

                create_meter_reading_if_needed(db, *meter_id, last_val, reading_dt_tz).await?;
                println!("[OK] Current month reading for: {}", label);
            }
        }

        // ════════════════════════════════════════════════════════════════════════════
        // 11. READING REQUESTS
        // ════════════════════════════════════════════════════════════════════════════
        for bid in &building_ids {
            find_or_create_reading_request(
                db, *bid, owner_id, current_month as i32, current_year,
            ).await?;
        }
        println!("[OK] Reading requests created for current month");

        // ════════════════════════════════════════════════════════════════════════════
        // SUMMARY
        // ════════════════════════════════════════════════════════════════════════════
        println!("\n════════════════════════════════════════════════════════════════");
        println!("  SEED DATA COMPLETED SUCCESSFULLY");
        println!("════════════════════════════════════════════════════════════════");
        println!("  Accounts:");
        println!("    Owner 1:  phone=0901234567  password=password123  (Nguyen Van Chu)");
        println!("    Owner 2:  phone=0967891234  password=password123  (Nguyen Thi Mai)");
        for t in &tenants_info {
            println!("    Tenant:   phone={}  password=password123  ({})", t.phone, t.name);
        }
        println!(" ");
        println!("  Buildings:");
        for b in &buildings_info {
            println!("    - {} ({})", b.name, b.address);
        }
        println!(" ");
        println!("  Rooms: A101(occ), A102(occ), A103(vac), A201(occ), A202(vac), B101(occ), B102(occ), B103(vac)");
        println!("  Services: Dien, Nuoc, Internet, Rac");
        println!("  Meters: ELEC + WATER per occupied room");
        println!("  Readings: 3 months history + partial current month");
        println!("════════════════════════════════════════════════════════════════");

        Ok(())
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

use chrono::Datelike;

fn rand_range(min: i64, max: i64) -> i64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    std::time::SystemTime::now().hash(&mut hasher);
    let hash = hasher.finish();
    min + (hash as i64).abs() % (max - min + 1)
}

async fn find_or_create_user(db: &DatabaseConnection, model: users::ActiveModel) -> Result<uuid::Uuid> {
    let phone = model.phone.clone().unwrap();
    if let Some(existing) = users::Entity::find()
        .filter(users::Column::Phone.eq(&phone))
        .one(db).await? {
        return Ok(existing.id);
    }
    let result = model.insert(db).await?;
    Ok(result.id)
}

async fn find_or_create_building(
    db: &DatabaseConnection, owner_id: uuid::Uuid, name: &str, address: &str,
) -> Result<uuid::Uuid> {
    if let Some(existing) = buildings::Entity::find()
        .filter(buildings::Column::OwnerId.eq(owner_id))
        .filter(buildings::Column::Name.eq(name))
        .one(db).await? {
        return Ok(existing.id);
    }
    let result = buildings::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        owner_id: ActiveValue::Set(owner_id),
        name: ActiveValue::Set(name.to_string()),
        address: ActiveValue::Set(Some(address.to_string())),
        status: ActiveValue::Set("ACTIVE".to_string()),
        created_at: ActiveValue::Set(now()),
        updated_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(result.id)
}

async fn find_or_create_floor(
    db: &DatabaseConnection, building_id: uuid::Uuid, identifier: &str,
) -> Result<uuid::Uuid> {
    if let Some(existing) = floors::Entity::find()
        .filter(floors::Column::BuildingId.eq(building_id))
        .filter(floors::Column::Identifier.eq(identifier))
        .one(db).await? {
        return Ok(existing.id);
    }
    let result = floors::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        building_id: ActiveValue::Set(building_id),
        identifier: ActiveValue::Set(identifier.to_string()),
        status: ActiveValue::Set("ACTIVE".to_string()),
    }.insert(db).await?;
    Ok(result.id)
}

async fn find_or_create_room(
    db: &DatabaseConnection, building_id: uuid::Uuid, floor_id: uuid::Uuid, code: &str, status: &str,
) -> Result<uuid::Uuid> {
    if let Some(existing) = rooms::Entity::find()
        .filter(rooms::Column::BuildingId.eq(building_id))
        .filter(rooms::Column::Code.eq(code))
        .one(db).await? {
        return Ok(existing.id);
    }
    let result = rooms::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        building_id: ActiveValue::Set(building_id),
        floor_id: ActiveValue::Set(Some(floor_id)),
        code: ActiveValue::Set(code.to_string()),
        status: ActiveValue::Set(status.to_string()),
        created_at: ActiveValue::Set(now()),
        updated_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(result.id)
}

async fn find_or_create_service(
    db: &DatabaseConnection, owner_id: uuid::Uuid, name: &str, unit: &str,
) -> Result<uuid::Uuid> {
    if let Some(existing) = services::Entity::find()
        .filter(services::Column::OwnerId.eq(owner_id))
        .filter(services::Column::Name.eq(name))
        .one(db).await? {
        return Ok(existing.id);
    }
    let result = services::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        owner_id: ActiveValue::Set(owner_id),
        name: ActiveValue::Set(name.to_string()),
        unit: ActiveValue::Set(unit.to_string()),
        status: ActiveValue::Set("ACTIVE".to_string()),
        created_at: ActiveValue::Set(now()),
        updated_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(result.id)
}

async fn find_or_create_price_rule(
    db: &DatabaseConnection, owner_id: uuid::Uuid, service_id: uuid::Uuid,
    name: &str, unit_price: rust_decimal::Decimal,
) -> Result<uuid::Uuid> {
    if let Some(existing) = price_rules::Entity::find()
        .filter(price_rules::Column::OwnerId.eq(owner_id))
        .filter(price_rules::Column::ServiceId.eq(service_id))
        .filter(price_rules::Column::Name.eq(name))
        .one(db).await? {
        return Ok(existing.id);
    }
    let result = price_rules::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        owner_id: ActiveValue::Set(owner_id),
        service_id: ActiveValue::Set(service_id),
        name: ActiveValue::Set(name.to_string()),
        unit_price: ActiveValue::Set(unit_price),
        created_at: ActiveValue::Set(now()),
        updated_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(result.id)
}

async fn find_or_create_room_service(
    db: &DatabaseConnection, room_id: uuid::Uuid, service_id: uuid::Uuid,
    price_rule_id: Option<uuid::Uuid>,
) -> Result<uuid::Uuid> {
    if let Some(existing) = room_services::Entity::find()
        .filter(room_services::Column::RoomId.eq(room_id))
        .filter(room_services::Column::ServiceId.eq(service_id))
        .one(db).await? {
        return Ok(existing.id);
    }
    let result = room_services::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        room_id: ActiveValue::Set(room_id),
        service_id: ActiveValue::Set(service_id),
        price_rule_id: ActiveValue::Set(price_rule_id),
        is_active: ActiveValue::Set(true),
        created_at: ActiveValue::Set(now()),
        updated_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(result.id)
}

async fn find_or_create_contract(
    db: &DatabaseConnection, owner_id: uuid::Uuid, room_id: uuid::Uuid,
    room_code: &str, room_address: &str,
) -> Result<uuid::Uuid> {
    if let Some(existing) = contracts::Entity::find()
        .filter(contracts::Column::RoomId.eq(room_id))
        .filter(contracts::Column::Status.eq("ACTIVE"))
        .one(db).await? {
        return Ok(existing.id);
    }
    let start = chrono::NaiveDate::from_ymd_opt(2026, 1, 1).unwrap();
    let end = chrono::NaiveDate::from_ymd_opt(2027, 1, 1).unwrap();

    let result = contracts::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        user_id: ActiveValue::Set(owner_id),
        room_id: ActiveValue::Set(room_id),
        start_date: ActiveValue::Set(start),
        end_date: ActiveValue::Set(end),
        monthly_rent: ActiveValue::Set(3_500_000),
        deposit_amount: ActiveValue::Set(3_500_000),
        payment_day: ActiveValue::Set(5),
        status: ActiveValue::Set("ACTIVE".to_string()),
        rental_period: ActiveValue::Set(12),
        room_code: ActiveValue::Set(room_code.to_string()),
        room_address: ActiveValue::Set(room_address.to_string()),
        created_at: ActiveValue::Set(now()),
        updated_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(result.id)
}

async fn find_or_create_contract_tenant(
    db: &DatabaseConnection, contract_id: uuid::Uuid, tenant_id: uuid::Uuid,
) -> Result<()> {
    if contract_tenants::Entity::find()
        .filter(contract_tenants::Column::ContractId.eq(contract_id))
        .filter(contract_tenants::Column::TenantId.eq(tenant_id))
        .one(db).await?.is_some() {
        return Ok(());
    }
    contract_tenants::ActiveModel {
        contract_id: ActiveValue::Set(contract_id),
        tenant_id: ActiveValue::Set(tenant_id),
    }.insert(db).await?;
    Ok(())
}

async fn find_or_create_meter(
    db: &DatabaseConnection, room_id: uuid::Uuid, service_id: uuid::Uuid,
    serial: &str, initial: rust_decimal::Decimal,
) -> Result<uuid::Uuid> {
    if let Some(existing) = meters::Entity::find()
        .filter(meters::Column::RoomId.eq(room_id))
        .filter(meters::Column::ServiceId.eq(service_id))
        .one(db).await? {
        return Ok(existing.id);
    }
    let result = meters::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        room_id: ActiveValue::Set(room_id),
        service_id: ActiveValue::Set(service_id),
        serial_number: ActiveValue::Set(Some(serial.to_string())),
        initial_reading: ActiveValue::Set(initial),
        status: ActiveValue::Set("ACTIVE".to_string()),
        created_at: ActiveValue::Set(now()),
        updated_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(result.id)
}

async fn create_meter_reading_if_needed(
    db: &DatabaseConnection, meter_id: uuid::Uuid,
    value: i64, reading_date: chrono::DateTime<chrono::FixedOffset>,
) -> Result<()> {
    // Check if a reading already exists for this meter at this date
    let exists = meter_readings::Entity::find()
        .filter(meter_readings::Column::MeterId.eq(meter_id))
        .filter(meter_readings::Column::ReadingDate.eq(reading_date))
        .one(db).await?.is_some();

    if exists { return Ok(()); }

    meter_readings::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        meter_id: ActiveValue::Set(meter_id),
        reading_value: ActiveValue::Set(rust_decimal::Decimal::from(value)),
        reading_date: ActiveValue::Set(reading_date),
        image_url: ActiveValue::Set(None),
        created_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(())
}

async fn find_or_create_reading_request(
    db: &DatabaseConnection, building_id: uuid::Uuid, landlord_id: uuid::Uuid,
    month: i32, year: i32,
) -> Result<()> {
    let exists = reading_requests::Entity::find()
        .filter(reading_requests::Column::BuildingId.eq(building_id))
        .filter(reading_requests::Column::Month.eq(month))
        .filter(reading_requests::Column::Year.eq(year))
        .one(db).await?.is_some();

    if exists { return Ok(()); }

    reading_requests::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        building_id: ActiveValue::Set(building_id),
        landlord_id: ActiveValue::Set(landlord_id),
        month: ActiveValue::Set(month),
        year: ActiveValue::Set(year),
        status: ActiveValue::Set("OPEN".to_string()),
        created_at: ActiveValue::Set(now()),
        updated_at: ActiveValue::Set(now()),
    }.insert(db).await?;
    Ok(())
}
