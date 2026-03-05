# Database Design (MVP)

Last updated: February 27, 2026
Status: Review
Type: SDD
Version: v1.0

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
> 

#### 4.1 Users & auth

**users**

- `id uuid pk`
- `email text unique null`
- `phone text unique null`
- `password_hash text not null`
- `role text not null` (`OWNER` | `TENANT`)
- `status text not null` (`ACTIVE` | `DISABLED`)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

**refresh_tokens**

- `id uuid pk`
- `user_id uuid not null fk users(id)`
- `jti text not null unique`
- `expires_at timestamptz not null`
- `revoked_at timestamptz null`
- `created_at timestamptz not null default now()`

**Constraints**

- `CHECK (email IS NOT NULL OR phone IS NOT NULL)`
- Normalize `email` to lowercase and `phone` to E.164 at application layer.

---

#### 4.2 Property

**buildings**

- `id uuid pk`
- `owner_id uuid not null fk users(id)`
- `name text not null`
- `address text null`
- `status text not null` (`ACTIVE` | `ARCHIVED`)
- timestamps

**floors**

- `id uuid pk`
- `building_id uuid not null fk buildings(id)`
- `identifier text not null`
- `status text not null` (`ACTIVE` | `ARCHIVED`)

**rooms**

- `id uuid pk`
- `building_id uuid not null fk buildings(id)`
- `floor_id uuid null fk floors(id)`
- `code text not null`
- `status text not null` (`VACANT` | `DEPOSITED` | `OCCUPIED` | `MAINTENANCE` | `ARCHIVED`)
- timestamps

**Constraints**

- `UNIQUE(building_id, code)`

---

#### 4.3 Services & effective-dated pricing

**services**

- `id uuid pk`
- `owner_id uuid not null fk users(id)`
- `name text not null`
- `unit text not null` (examples: `kWh`, `m3`, `month`)
- `status text not null` (`ACTIVE` | `ARCHIVED`)
- `created_at timestamptz not null default now()`

**price_rules**

- `id uuid pk`
- `owner_id uuid not null fk users(id)`
- `room_id uuid not null fk rooms(id)`
- `service_id uuid not null fk services(id)`
- `unit_price numeric not null`
- `effective_start date not null`
- `effective_end date null`
- `created_at timestamptz not null default now()`

**Constraints (critical)**

- For the same `(room_id, service_id)`, effective ranges must not overlap.
    - Best practice in Postgres: use a `daterange(effective_start, effective_end, '[]')` and a **GiST exclusion constraint**.

---

#### 4.4 Contracts (1 active contract per room)

**contracts**

- `id uuid pk`
- `owner_id uuid not null fk users(id)`
- `room_id uuid not null fk rooms(id)`
- `start_date date not null`
- `end_date date null`
- `billing_cycle text not null` (`MONTHLY`)
- `status text not null` (`ACTIVE` | `ENDED`)
- `created_at timestamptz not null default now()`

**contract_tenants**

- `contract_id uuid not null fk contracts(id)`
- `tenant_id uuid not null fk users(id)`
- `PRIMARY KEY (contract_id, tenant_id)`

**Constraints (critical)**

- Exactly 1 active contract per room:
    - Postgres: `UNIQUE(room_id) WHERE status = 'ACTIVE'` (partial unique index)

---

#### 4.5 Meters & readings (OCR evidence + human-in-the-loop)

**meters**

- `id uuid pk`
- `room_id uuid not null fk rooms(id)`
- `type text not null` (`ELECTRIC` | `WATER`)
- `serial_no text null`

**meter_readings**

- `id uuid pk`
- `meter_id uuid not null fk meters(id)`
- `period char(7) not null` (YYYY-MM)
- `photo_url text not null` (object storage key/reference)
- `ocr_raw_value text null`
- `ocr_value int null`
- `ocr_confidence numeric null`
- `final_value int null`
- `status text not null` (`DRAFT` | `RECOGNIZED` | `NEEDS_REVIEW` | `FINALIZED` | `FAILED`)
- `created_by uuid not null fk users(id)`
- `created_at timestamptz not null default now()`

**reading_overrides**

- `id uuid pk`
- `reading_id uuid not null fk meter_readings(id)`
- `reason text not null`
- `overridden_by uuid not null fk users(id)`
- `overridden_at timestamptz not null default now()`

**Recommended constraints**

- `UNIQUE(meter_id, period)` to prevent duplicate readings for the same period.
- Application rule: block finalize if current < previous finalized, unless override recorded.

---

#### 4.6 Invoices

**invoices**

- `id uuid pk`
- `owner_id uuid not null fk users(id)`
- `room_id uuid not null fk rooms(id)`
- `contract_id uuid not null fk contracts(id)`
- `period char(7) not null`
- `status text not null` (`UNPAID` | `PENDING_CONFIRMATION` | `PAID` | `VOIDED`)
- `total_amount numeric not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

**invoice_lines**

- `id uuid pk`
- `invoice_id uuid not null fk invoices(id)`
- `item_type text not null` (`RENT` | `ELECTRIC` | `WATER` | `SERVICE`)
- `service_id uuid null fk services(id)`
- `quantity numeric not null`
- `unit_price numeric not null`
- `amount numeric not null`
- `metadata jsonb null` (optional: reading ids, price_rule id, etc.)

**invoice_status_history**

- `id uuid pk`
- `invoice_id uuid not null fk invoices(id)`
- `from_status text null`
- `to_status text not null`
- `reason text null`
- `actor_user_id uuid null fk users(id)`
- `created_at timestamptz not null default now()`

**Constraints (critical)**

- Idempotent invoice generation:
    - `UNIQUE(contract_id, period)`

---

#### 4.7 Audit (append-only)

**audit_events**

- `id uuid pk`
- `owner_id uuid null fk users(id)`
- `actor_user_id uuid null fk users(id)`
- `action_type text not null`
- `target_type text not null`
- `target_id uuid null`
- `ip text null`
- `user_agent text null`
- `reason text null`
- `created_at timestamptz not null default now()`

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

### 7) Open items / decisions to confirm

- Whether to support **Blocks** (wings/areas) in MVP, or postpone.
- Whether to store `period` as `date` (first day of month) instead of `char(7)`.
- Whether to create a dedicated `files` table instead of storing `photo_url` directly.
- Whether invoice totals are stored as integer cents (recommended) or numeric.