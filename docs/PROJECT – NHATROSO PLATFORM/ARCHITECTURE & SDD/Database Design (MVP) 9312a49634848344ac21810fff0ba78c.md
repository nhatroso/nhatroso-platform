# Database Design (MVP)

Last updated: April 9, 2026
Status: In Progress
Type: SDD
Version: v2.0

<aside>
🗄️

This document defines the **MVP database design** for NHATROSO Platform, derived from the SRS “Must” requirements and aligned with the MVP architecture/SDD.

It focuses on **PostgreSQL** as the system of record, plus the minimal constraints needed for deterministic billing, strict tenant isolation, and an evidence-first OCR flow.

</aside>

### 1) Scope (MVP)

**In scope**

- Account: registration, login/logout, refresh tokens, RBAC (Owner vs Tenant)
- Property: buildings, floors, rooms
- Pricing: service catalog + effective-dated pricing per room
- Contracts: 1 active contract per room, 1+ tenants per contract
- OCR readings: meter photo evidence, OCR outputs, validation vs previous, manual correction/override
- Billing: monthly invoice generation, invoice status workflow, tenant invoice view
- Platform: append-only audit events

**Out of scope (explicitly for MVP)**

- IoT meter integration
- Payments (QR) processing (can be added later)
- Advanced deposits and pro-rating

---

### 2) Design principles and rules

- **PostgreSQL is the source of truth.**
- **Deterministic billing:** no overlapping pricing effective periods for the same `(room, service)`.
- **Evidence-first:** every meter reading stores the original photo reference.
- **Strict isolation:** tenant access is limited via `contract_tenants` ownership checks.
- **Idempotency:** invoice generation must be safe to retry; enforce uniqueness on `(contract_id, period)`.
- **Auditability:** critical actions create immutable audit events.

---

### 3) Logical data model (entities and relationships)

#### 3.1 Actors

- **Owner**: owns buildings/rooms/contracts/pricing/invoices
- **Tenant**: is linked to contracts and can view invoices related to those contracts

#### 3.2 High-level relationships

- Owner `1..*` Buildings → `1..*` Rooms
- Room `1..*` Meters → `1..*` MeterReadings
- Owner `1..*` Services
- Room `1..*` PriceRules per Service (effective-dated, no overlap)
- Room `0..1` Active Contract (enforced)
- Contract `1..*` Tenants via ContractTenants
- Contract `1..*` Invoices (one per period)
- Invoice `1..*` InvoiceLines
- Invoice `1..*` StatusHistory

---

### 4) Physical schema (PostgreSQL) — MVP

> Data types are suggestions; adapt to your ORM conventions.

#### 4.1 Users & auth

**users**

- `id` integer serial pk (auto-increment, not UUID)
- `name` text null
- `email` text unique null
- `phone` text unique null
- `password_hash` text not null
- `role` text not null (`OWNER` | `TENANT`)
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

**refresh_tokens**

- `id` integer serial pk
- `user_id` integer not null fk users(id)
- `jti` text not null unique
- `expires_at` timestamptz not null
- `revoked_at` timestamptz null
- `created_at` timestamptz not null default now()

---

#### 4.2 Property

**buildings**

- `id` integer serial pk
- `owner_id` integer not null fk users(id)
- `name` text not null
- `address` text null
- `status` text not null (`ACTIVE` | `ARCHIVED`)
- timestamps

**floors**

- `id` integer serial pk
- `building_id` integer not null fk buildings(id)
- `identifier` text not null
- `status` text not null (`ACTIVE` | `ARCHIVED`)

**rooms**

- `id` integer serial pk
- `building_id` integer not null fk buildings(id)
- `floor_id` integer null fk floors(id)
- `code` text not null
- `status` text not null (`VACANT` | `DEPOSITED` | `OCCUPIED` | `MAINTENANCE` | `ARCHIVED`)
- timestamps

**Constraints**

- `UNIQUE(building_id, code)`

> **Note:** A `blocks` table between buildings and floors was created but subsequently dropped (`m20260317_141521_remove_blocks.rs`).

---

#### 4.3 Services & effective-dated pricing

**services**

- `id` integer serial pk
- `owner_id` integer not null fk users(id)
- `name` text not null
- `unit` text not null (examples: `kWh`, `m3`, `month`, `VND/month`)
- `status` text not null (`ACTIVE` | `ARCHIVED`)
- `created_at` timestamptz not null default now()

**room_services** _(new table, not in original design)_

- `id` integer serial pk
- `room_id` integer not null fk rooms(id)
- `service_id` integer not null fk services(id)
- `price_rule_id` integer null fk price_rules(id)
- `status` text not null (`ACTIVE` | `ARCHIVED`)
- `created_at` timestamptz

**price_rules**

- `id` integer serial pk
- `owner_id` integer not null fk users(id)
- `room_id` integer not null fk rooms(id)
- `service_id` integer not null fk services(id)
- `unit_price` numeric not null
- `effective_start` date not null
- `effective_end` date null
- `is_active` boolean not null default true
- `created_at` timestamptz not null default now()

**Constraints (critical)**

- For the same `(room_id, service_id)`, effective date ranges must not overlap.

---

#### 4.4 Contracts (1 active contract per room)

**contracts**

- `id` integer serial pk
- `owner_id` integer not null fk users(id)
- `room_id` integer not null fk rooms(id)
- `start_date` date not null
- `end_date` date null
- `billing_cycle` text not null (`MONTHLY`)
- `rental_period` integer null (months)
- `room_code` text null (snapshot)
- `room_address` text null (snapshot)
- `status` text not null (`ACTIVE` | `ENDED`)
- `created_at` timestamptz not null default now()

**contract_tenants**

- `contract_id` integer not null fk contracts(id)
- `tenant_id` integer not null fk users(id)
- `PRIMARY KEY (contract_id, tenant_id)`

**Constraints (critical)**

- Exactly 1 active contract per room: partial unique index on `room_id WHERE status = 'ACTIVE'`.

---

#### 4.5 Meters & readings (OCR evidence + human-in-the-loop)

**meters**

- `id` integer serial pk
- `room_id` integer not null fk rooms(id)
- `type` text not null (`ELECTRIC` | `WATER`)
- `serial_no` text null

**meter_readings**

- `id` integer serial pk
- `meter_id` integer not null fk meters(id)
- `period` char(7) not null (YYYY-MM)
- `photo_url` text null (uploaded image path)
- `reading_value` numeric null (manual entry)
- `usage` numeric null (computed from previous)
- `status` text not null (`PENDING` | `ACCEPTED` | `REJECTED`)
- `created_at` timestamptz not null default now()

**meter_request_configs** _(new table)_

- `id` integer serial pk
- `building_id` integer not null fk buildings(id)
- `deadline_day` integer not null (day of month for submission deadline)
- `period_offset` integer not null (months offset for period calculation)
- `created_at`, `updated_at` timestamptz

**meter_requests** _(new table)_

- `id` integer serial pk
- `building_id` integer not null fk buildings(id)
- `period` char(7) not null (YYYY-MM)
- `status` text not null (`PENDING` | `COMPLETED` | `CANCELLED`)
- `created_at`, `updated_at` timestamptz

> **Note:** No OCR pipeline implemented. No `reading_overrides` table. Meter readings use manual `reading_value` input, not OCR output (`ocr_value`, `ocr_confidence`).

**Recommended constraints**

- `UNIQUE(meter_id, period)` — prevent duplicate readings for the same period.

---

#### 4.6 Invoices

**invoices**

- `id` integer serial pk
- `owner_id` integer not null fk users(id)
- `room_id` integer not null fk rooms(id)
- `contract_id` integer not null fk contracts(id)
- `period` char(7) not null
- `status` text not null (`UNPAID` | `PAID` | `VOIDED`)
- `total_amount` numeric not null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

**invoice_details** _(replaces invoice_lines)_

- `id` integer serial pk
- `invoice_id` integer not null fk invoices(id)
- `label` text not null (line item description)
- `amount` numeric not null

**invoice_status_histories**

- `id` integer serial pk
- `invoice_id` integer not null fk invoices(id)
- `from_status` text null
- `to_status` text not null
- `reason` text null
- `created_at` timestamptz not null default now()

**Constraints (critical)**

- `UNIQUE(contract_id, period)` — idempotent invoice generation.

> **Note:** Original design used `invoice_lines` with `item_type` enum, `quantity`, `unit_price` breakdown. Actual implementation uses simpler `invoice_details` with just `label` + `amount`. Status `PENDING_CONFIRMATION` dropped; active statuses are `UNPAID | PAID | VOIDED`.

---

#### 4.7 Audit

> **Note:** The original design included an `audit_events` (append-only) table. This table is **not present** in the current migration files. Audit logging may be added in a future iteration.

---

### 5) Authorization mapping (how tenant isolation is enforced)

#### Tenant invoice list

Tenant can only query invoices where:

- `tenant_id` is in `contract_tenants`, and
- `contract_tenants.contract_id = invoices.contract_id`

Tenant cannot access Owner endpoints (enforced by RBAC guards).

---

### 6) Critical indexes (MVP)

- `users(email)`, `users(phone)` unique
- `buildings(owner_id)`
- `rooms(building_id)`, `rooms(status)`
- `contract_tenants(tenant_id)`
- `contracts(room_id)` + partial unique index for active
- `meter_readings(meter_id, period)` unique
- `invoices(contract_id, period)` unique
- `audit_events(owner_id, created_at)`

---

### 7) Open items / decisions

- ✅ Resolved: `period` stored as `char(7)` (YYYY-MM format).
- ✅ Resolved: Blocks feature dropped (migration `m20260317_141521_remove_blocks.rs`).
- ✅ Resolved: `invoice_lines` replaced by simpler `invoice_details` (label + amount).
- ⬜ OCR pipeline: not implemented. Meter readings are manually entered. Future decision: integrate OCR service or keep manual-only.
- ⬜ Audit events table: planned but not yet migrated.
- ⬜ Payment webhook: endpoint exists (`POST /invoices/:id/webhook`) but payment provider integration (VietQR, Casso, Sepay) not yet implemented.
- ⬜ Tenant invoice view: currently owner-only; tenant mobile access via meter request workflow.
