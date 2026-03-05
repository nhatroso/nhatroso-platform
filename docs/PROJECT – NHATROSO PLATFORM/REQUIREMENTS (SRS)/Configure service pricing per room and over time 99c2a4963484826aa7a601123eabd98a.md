# Configure service pricing per room and over time

Acceptance Criteria: - Owner can set unit prices for electricity, water, and other services (wifi, cleaning, etc.).
- System stores pricing history with effective dates.
- Monthly billing uses the price effective for the billing period.
Priority: Must
Related Epic: Owner – Pricing
Requirement ID: REQ-006
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Owner – Pricing

**Feature PR-01: Define service catalog (electricity, water, wifi, cleaning, etc.)**

**User Story PR-01.1**

As an *Owner*, I want to create and manage a list of chargeable services, so that I can apply consistent pricing across rooms.

**Acceptance Criteria (PR-01.1)**

- Given I provide a service name and a billing unit, when I save, then the system creates the service within **2 seconds**.
- Given the service name already exists for the same Owner, when I save, then the system rejects with **409 DUPLICATE_SERVICE_NAME**.
- Given I archive a service, when creating future prices, then the service cannot be selected and returns **409 SERVICE_ARCHIVED**.

**Feature PR-02: Configure price per room with effective date (pricing history)**

**User Story PR-02.1**

As an Owner, I want to set the unit price of a service for a specific room with an effective start date, so that monthly billing uses the correct price.

**Acceptance Criteria (PR-02.1)**

- Given I select Room + Service and input unit price and effective start date, when I save, then a new price rule is created within **2 seconds**.
- Given I create a price rule, when I view pricing history for Room + Service, then the rule appears ordered by effective date.
- Given the unit price is negative or zero, when I save, then the system rejects with **400 INVALID_UNIT_PRICE**.
- Given effective start date is missing, when I save, then the system rejects with **400 REQUIRED_FIELD_MISSING**.

**User Story PR-02.2**

As an Owner, I want to prevent overlapping effective periods for the same Room + Service, so that billing is deterministic.

**Acceptance Criteria (PR-02.2)**

- Given an existing price rule for Room + Service, when I create another rule with an effective start date that would overlap the existing rule’s period, then the system rejects with **409 OVERLAPPING_EFFECTIVE_PERIOD**.
- Given I create a new rule with a later effective start date, when saved, then the previous rule’s effective end date is automatically set to 1 day before the new rule’s start date.

**Feature PR-03: Optional room defaults and overrides**

**User Story PR-03.1**

As an Owner, I want to define a default price for a service at the building level, so that I do not need to configure every room manually.

**Acceptance Criteria (PR-03.1)**

- Given I set a Building + Service default price, when a room has no room-specific price for a billing period, then billing uses the building default.
- Given both building default and room-specific price exist for the same period, when billing runs, then the room-specific price takes precedence.

**Feature PR-04: Billing price selection for a billing period**

**User Story PR-04.1**

As the system, I want to select the correct unit price for each service usage in a billing period, so that invoices are correct.

**Acceptance Criteria (PR-04.1)**

- Given a billing period (example: 2026-02-01 to 2026-02-29), when generating an invoice line item for a service, then the system selects the price rule whose effective date range covers the usage date(s).
- Given the billing period spans a price change, when generating invoice line items, then the system either:
    - splits the line into two sub-lines by date range, or
    - applies a weighted calculation by consumption dates,
    
    and the chosen method is consistent across all invoices.
    

---

### 2) Functional Requirements (FR)

#### FR-01 — Manage service catalog

- **Requirement ID:** FR-01
- **Requirement Name:** Service Catalog CRUD
- **Description:** Allow Owner to create, edit, and archive chargeable services.
- **Actor:** Owner
- **Input:** Service name, unit (kWh, m³, month, time), optional description
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate service name is provided.
    3. Enforce uniqueness of service name per Owner.
    4. Create or update service record.
    5. If archiving, mark service as Archived and exclude from selectable lists.
- **Output:** Service created/updated/archived response
- **Exception Handling:**
    - Missing/invalid token → `401 UNAUTHORIZED`.
    - Not Owner → `403 FORBIDDEN`.
    - Duplicate name → `409 DUPLICATE_SERVICE_NAME`.
    - Other failure → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy PR-01.1.

#### FR-02 — Create room service price with effective start date

- **Requirement ID:** FR-02
- **Requirement Name:** Room Service Pricing (Effective Dating)
- **Description:** Allow Owner to set unit price for a service in a specific room with effective dates and preserved history.
- **Actor:** Owner
- **Input:** Room id, service id, unit price, effective start date
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate room exists and is owned by the Owner.
    3. Validate service exists and not archived.
    4. Validate unit price > 0.
    5. Validate effective start date provided.
    6. Look up the latest existing price rule for the same Room + Service.
    7. If a rule exists and new start date is <= existing start date → reject.
    8. Create new price rule record.
    9. If prior rule exists with no end date, set its end date to (new start date - 1 day).
- **Output:** Price rule created and pricing history updated
- **Exception Handling:**
    - Room/service not found → `404 NOT_FOUND`.
    - Service archived → `409 SERVICE_ARCHIVED`.
    - Invalid unit price → `400 INVALID_UNIT_PRICE`.
    - Overlap/conflict → `409 OVERLAPPING_EFFECTIVE_PERIOD`.
    - Other failure → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy PR-02.1 and PR-02.2.

#### FR-03 — Update or cancel a future price rule

- **Requirement ID:** FR-03
- **Requirement Name:** Future Price Rule Update
- **Description:** Allow Owner to edit or delete a price rule only if it has not become effective yet.
- **Actor:** Owner
- **Input:** Price rule id, updated fields or delete request
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Load price rule.
    3. If effective start date <= today → reject modifications.
    4. If update, re-validate constraints (no overlaps, unit price > 0).
    5. Persist update or delete.
- **Output:** Updated price rule or deletion confirmation
- **Exception Handling:**
    - Rule not found → `404 PRICE_RULE_NOT_FOUND`.
    - Rule already effective → `409 PRICE_RULE_LOCKED`.
    - Other failure → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Editing past-effective rules is not permitted in MVP.

#### FR-04 — Retrieve pricing history

- **Requirement ID:** FR-04
- **Requirement Name:** Pricing History Query
- **Description:** Allow Owner to view pricing history for Room + Service (and optionally building defaults).
- **Actor:** Owner
- **Input:** Room id, service id, optional date range
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Query all price rules ordered by effective start date descending.
    3. Return rules with start/end dates and unit price.
- **Output:** Pricing history list
- **Exception Handling:**
    - Not found → `404 NOT_FOUND`.
    - Other failure → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - History must match what is used for billing.

#### FR-05 — Billing price selection for a billing period

- **Requirement ID:** FR-05
- **Requirement Name:** Price Selection for Billing
- **Description:** Billing must select the correct price effective during the billing period.
- **Actor:** System
- **Input:** Billing period start/end, usage/meter readings, room id, service id
- **Processing:**
    1. Determine usage date range for each service line item.
    2. Fetch applicable price rules intersecting with the usage date range.
    3. If exactly one price rule covers the entire range → use it.
    4. If multiple rules cover sub-ranges → split the invoice line items by sub-range.
    5. Calculate amount per sub-line: `consumption * unit_price`.
    6. Sum sub-lines to total for the service.
- **Output:** Invoice line items with unit price, date range, and amount
- **Exception Handling:**
    - No applicable price rule and no default exists → `409 MISSING_PRICE_CONFIGURATION`.
    - Data inconsistency (overlap) → `500 PRICING_CONFIGURATION_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy PR-04.1.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** 95th percentile response time ≤ **2.0s** for creating/updating a price rule under **50 concurrent users**.
- **NFR-02 Data integrity:** The system must prevent overlapping effective periods for the same Room + Service in **100%** of writes.
- **NFR-03 Auditability:** All create/update/delete operations for price rules must be logged with actor user id and timestamp for at least **180 days**.
- **NFR-04 Availability:** Pricing endpoints uptime ≥ **99.5%** monthly.

---

### 4) MVP scope

**Included in MVP**

- Service catalog (create/edit/archive)
- Room + Service pricing with effective start date
- Pricing history view
- Billing selects price by effective date, splitting invoice lines if price changes within the period
- Prevent overlaps and enforce deterministic billing

**Future phases (not MVP)**

- Building-level defaults (and per-room override) if MVP timeline is tight
- Support retroactive price corrections with audit trail and re-invoicing
- Bulk import/export pricing rules
- Promotions/discount rules

---

### 5) Supporting models (diagrams to include)

- **Use Case Diagram:** Owner manages service prices; System generates invoice with effective pricing
- **Activity Diagram:** Create price rule with overlap validation
- **Sequence Diagram:** Billing → fetch price rules → split lines → calculate totals
- **ERD (if DB exists):** Service, Room, PriceRule (effective dating), InvoiceLineItem