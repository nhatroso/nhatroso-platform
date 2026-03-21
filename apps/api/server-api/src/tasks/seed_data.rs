use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, ColumnTrait, QueryFilter};

use crate::models::_entities::{users, buildings, floors, rooms};

pub struct SeedData;

#[async_trait]
impl Task for SeedData {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_data".to_string(),
            detail: "Seeds demo data: 1 owner, 1 building, 1 floor, 3 rooms, and 1 tenant".to_string(),
        }
    }

    async fn run(&self, app_context: &AppContext, _vars: &task::Vars) -> Result<()> {
        let db = &app_context.db;

        // ── 1. Owner user ──────────────────────────────────────────────────────────
        let owner_phone = "0901234567";

        let owner_id = if let Some(existing) = users::Entity::find()
            .filter(users::Column::Phone.eq(owner_phone))
            .one(db)
            .await?
        {
            println!("[SKIP] Owner already exists ({})", existing.phone);
            existing.id
        } else {
            let owner_id = uuid::Uuid::new_v4();
            let password_hash = loco_rs::hash::hash_password("password123")
                .map_err(|e| Error::Message(e.to_string()))?;

            users::ActiveModel {
                id: ActiveValue::Set(owner_id),
                email: ActiveValue::Set(Some("owner@nhatroso.vn".to_string())),
                phone: ActiveValue::Set(owner_phone.to_string()),
                name: ActiveValue::Set("Nguyen Van Chu".to_string()),
                password_hash: ActiveValue::Set(password_hash),
                role: ActiveValue::Set("OWNER".to_string()),
                status: ActiveValue::Set("ACTIVE".to_string()),
                id_card: ActiveValue::Set(Some("001099012345".to_string())),
                id_card_date: ActiveValue::Set(Some(
                    chrono::NaiveDate::from_ymd_opt(2020, 6, 15).unwrap(),
                )),
                address: ActiveValue::Set(Some("123 Nguyen Trai, Quan 1, TP.HCM".to_string())),
                created_at: ActiveValue::Set(chrono::Utc::now().into()),
                updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            }
            .insert(db)
            .await?;

            println!("[OK] Owner created: Nguyen Van Chu ({})", owner_phone);
            owner_id
        };

        // ── 2. Building ────────────────────────────────────────────────────────────
        let building_id = if let Some(existing) = buildings::Entity::find()
            .filter(buildings::Column::OwnerId.eq(owner_id))
            .one(db)
            .await?
        {
            println!("[SKIP] Building already exists");
            existing.id
        } else {
            let building_id = uuid::Uuid::new_v4();
            buildings::ActiveModel {
                id: ActiveValue::Set(building_id),
                owner_id: ActiveValue::Set(owner_id),
                name: ActiveValue::Set("Nha Tro Binh An".to_string()),
                address: ActiveValue::Set(Some("456 Le Loi, Quan 3, TP.HCM".to_string())),
                status: ActiveValue::Set("ACTIVE".to_string()),
                created_at: ActiveValue::Set(chrono::Utc::now().into()),
                updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            }
            .insert(db)
            .await?;

            println!("[OK] Building created: Nha Tro Binh An");
            building_id
        };

        // ── 3. Floor ───────────────────────────────────────────────────────────────
        let floor_id = if let Some(existing) = floors::Entity::find()
            .filter(floors::Column::BuildingId.eq(building_id))
            .one(db)
            .await?
        {
            println!("[SKIP] Floor already exists");
            existing.id
        } else {
            let floor_id = uuid::Uuid::new_v4();
            floors::ActiveModel {
                id: ActiveValue::Set(floor_id),
                building_id: ActiveValue::Set(building_id),
                identifier: ActiveValue::Set("1".to_string()),
                status: ActiveValue::Set("ACTIVE".to_string()),
            }
            .insert(db)
            .await?;

            println!("[OK] Floor created: Tang 1");
            floor_id
        };

        // ── 4. Three rooms ─────────────────────────────────────────────────────────
        let room_codes = ["A101", "A102", "A103"];
        for code in room_codes {
            let exists = rooms::Entity::find()
                .filter(rooms::Column::Code.eq(code))
                .filter(rooms::Column::BuildingId.eq(building_id))
                .one(db)
                .await?
                .is_some();

            if exists {
                println!("[SKIP] Room {} already exists", code);
                continue;
            }

            rooms::ActiveModel {
                id: ActiveValue::Set(uuid::Uuid::new_v4()),
                building_id: ActiveValue::Set(building_id),
                floor_id: ActiveValue::Set(Some(floor_id)),
                code: ActiveValue::Set(code.to_string()),
                status: ActiveValue::Set("VACANT".to_string()),
                created_at: ActiveValue::Set(chrono::Utc::now().into()),
                updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            }
            .insert(db)
            .await?;

            println!("[OK] Room created: {}", code);
        }

        // ── 5. Tenant user ─────────────────────────────────────────────────────────
        let tenant_phone = "0912345678";

        if users::Entity::find()
            .filter(users::Column::Phone.eq(tenant_phone))
            .one(db)
            .await?
            .is_some()
        {
            println!("[SKIP] Tenant already exists ({})", tenant_phone);
        } else {
            let password_hash = loco_rs::hash::hash_password("password123")
                .map_err(|e| Error::Message(e.to_string()))?;

            users::ActiveModel {
                id: ActiveValue::Set(uuid::Uuid::new_v4()),
                email: ActiveValue::Set(Some("tenant@example.com".to_string())),
                phone: ActiveValue::Set(tenant_phone.to_string()),
                name: ActiveValue::Set("Tran Thi Thue".to_string()),
                password_hash: ActiveValue::Set(password_hash),
                role: ActiveValue::Set("TENANT".to_string()),
                status: ActiveValue::Set("ACTIVE".to_string()),
                id_card: ActiveValue::Set(Some("079099087654".to_string())),
                id_card_date: ActiveValue::Set(Some(
                    chrono::NaiveDate::from_ymd_opt(2021, 3, 20).unwrap(),
                )),
                address: ActiveValue::Set(Some("789 Dinh Tien Hoang, Binh Thanh, TP.HCM".to_string())),
                created_at: ActiveValue::Set(chrono::Utc::now().into()),
                updated_at: ActiveValue::Set(chrono::Utc::now().into()),
            }
            .insert(db)
            .await?;

            println!("[OK] Tenant created: Tran Thi Thue ({})", tenant_phone);
        }

        println!("\nSeed data completed successfully!");
        println!("  Owner login:  phone=0901234567  password=password123");
        println!("  Tenant login: phone=0912345678  password=password123");
        println!("  Building: Nha Tro Binh An  |  Tang: 1");
        println!("  Rooms: A101, A102, A103 (VACANT, Tang 1)");

        Ok(())
    }
}
