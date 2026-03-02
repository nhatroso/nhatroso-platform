-- =========================================================
-- EXTENSIONS
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================================================
-- 4.1 USERS & AUTH
-- =========================================================

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE,
    phone text UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL CHECK (role IN ('OWNER', 'TENANT')),
    status text NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE refresh_tokens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 4.2 PROPERTY
-- =========================================================

CREATE TABLE buildings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text NULL,
    status text NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_buildings_owner_id ON buildings(owner_id);

CREATE TABLE floors (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    identifier text NOT NULL,
    status text NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE TABLE rooms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_id uuid NULL REFERENCES floors(id) ON DELETE SET NULL,
    code text NOT NULL,
    status text NOT NULL CHECK (
        status IN ('VACANT', 'DEPOSITED', 'OCCUPIED', 'MAINTENANCE', 'ARCHIVED')
    ),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(building_id, code)
);

CREATE INDEX idx_rooms_building_id ON rooms(building_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- =========================================================
-- 4.3 SERVICES & EFFECTIVE-DATED PRICING
-- =========================================================

CREATE TABLE services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    unit text NOT NULL,
    status text NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE price_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    unit_price numeric NOT NULL,
    effective_start date NOT NULL,
    effective_end date NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Exclusion constraint to prevent overlapping effective ranges
ALTER TABLE price_rules
ADD CONSTRAINT price_rules_no_overlap
EXCLUDE USING gist (
    room_id WITH =,
    service_id WITH =,
    daterange(effective_start, effective_end, '[]') WITH &&
);

-- =========================================================
-- 4.4 CONTRACTS
-- =========================================================

CREATE TABLE contracts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NULL,
    billing_cycle text NOT NULL CHECK (billing_cycle = 'MONTHLY'),
    status text NOT NULL CHECK (status IN ('ACTIVE', 'ENDED')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_room_id ON contracts(room_id);

-- Partial unique index: exactly 1 ACTIVE contract per room
CREATE UNIQUE INDEX ux_contracts_one_active_per_room
ON contracts(room_id)
WHERE status = 'ACTIVE';

CREATE TABLE contract_tenants (
    contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (contract_id, tenant_id)
);

CREATE INDEX idx_contract_tenants_tenant_id
ON contract_tenants(tenant_id);

-- =========================================================
-- 4.5 METERS & READINGS
-- =========================================================

CREATE TABLE meters (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('ELECTRIC', 'WATER')),
    serial_no text NULL
);

CREATE TABLE meter_readings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
    period char(7) NOT NULL,
    photo_url text NOT NULL,
    ocr_raw_value text NULL,
    ocr_value int NULL,
    ocr_confidence numeric NULL,
    final_value int NULL,
    status text NOT NULL CHECK (
        status IN ('DRAFT', 'RECOGNIZED', 'NEEDS_REVIEW', 'FINALIZED', 'FAILED')
    ),
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(meter_id, period)
);

CREATE TABLE reading_overrides (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_id uuid NOT NULL REFERENCES meter_readings(id) ON DELETE CASCADE,
    reason text NOT NULL,
    overridden_by uuid NOT NULL REFERENCES users(id),
    overridden_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 4.6 INVOICES
-- =========================================================

CREATE TABLE invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    period char(7) NOT NULL,
    status text NOT NULL CHECK (
        status IN ('UNPAID', 'PENDING_CONFIRMATION', 'PAID', 'VOIDED')
    ),
    total_amount numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(contract_id, period)
);

CREATE TABLE invoice_lines (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_type text NOT NULL CHECK (
        item_type IN ('RENT', 'ELECTRIC', 'WATER', 'SERVICE')
    ),
    service_id uuid NULL REFERENCES services(id) ON DELETE SET NULL,
    quantity numeric NOT NULL,
    unit_price numeric NOT NULL,
    amount numeric NOT NULL,
    metadata jsonb NULL
);

CREATE TABLE invoice_status_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    from_status text NULL,
    to_status text NOT NULL,
    reason text NULL,
    actor_user_id uuid NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_invoices_contract_period
ON invoices(contract_id, period);

-- =========================================================
-- 4.7 AUDIT (APPEND-ONLY)
-- =========================================================

CREATE TABLE audit_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    actor_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    action_type text NOT NULL,
    target_type text NOT NULL,
    target_id uuid NULL,
    ip text NULL,
    user_agent text NULL,
    reason text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_owner_created_at
ON audit_events(owner_id, created_at);
