# Create and manage rental contracts

Acceptance Criteria: - Owner can create a contract linking a room and one or more tenants.
- Contract includes start date, end date (optional), and payment cycle.
- Contract can be ended and the room status updates accordingly.
Priority: Must
Related Epic: Owner – Contracts
Requirement ID: REQ-008
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Owner – Contracts

**Feature CT-01: Create contract (room + tenant(s) + terms)**

**User Story CT-01.1**

As an *Owner*, I want to create a rental contract for a room and assign one or more tenants, so that billing and occupancy can be managed.

**Acceptance Criteria (CT-01.1)**

- Given I select a room and at least one tenant and provide a start date, when I save, then the system creates the contract within **2 seconds**.
- Given the room already has an active contract, when I attempt to create another active contract, then the system rejects with **409 ROOM_ALREADY_HAS_ACTIVE_CONTRACT**.
- Given I omit required fields (room, tenant, start date), when I save, then the system rejects with **400 REQUIRED_FIELD_MISSING**.

**Feature CT-02: Contract lifecycle (activate/end) and payment cycle**

**User Story CT-02.1**

As an Owner, I want to set the payment cycle for a contract, so that invoices are generated on the correct schedule.

**Acceptance Criteria (CT-02.1)**

- Given I choose a payment cycle, when I save, then it must be one of: **Monthly**.
- Given an unsupported cycle is provided, when I save, then the system rejects with **400 INVALID_PAYMENT_CYCLE**.

**User Story CT-02.2**

As an Owner, I want to end a contract, so that the room becomes available for new tenants.

**Acceptance Criteria (CT-02.2)**

- Given a contract is active, when I end it with an end date, then the contract status becomes **Ended** and the room status updates to **Vacant** within **2 seconds**.
- Given the end date is before the start date, when I end the contract, then the system rejects with **400 INVALID_DATE_RANGE**.

**Feature CT-03: Prevent conflicting tenancy**

**User Story CT-03.1**

As the system, I want to prevent overlapping active contracts per room, so that billing and occupancy are unambiguous.

**Acceptance Criteria (CT-03.1)**

- Given a room has an active contract, when another contract is created or activated for the same room, then the system must reject with **409 ROOM_ALREADY_HAS_ACTIVE_CONTRACT**.

---

### 2) Functional Requirements (FR)

#### FR-01 — Create rental contract

- **Requirement ID:** FR-01
- **Requirement Name:** Create Contract
- **Description:** Allow Owner to create a rental contract linking one room and one or more tenants.
- **Actor:** Owner
- **Input:** Room id, tenant id list (≥ 1), start date, optional end date, payment cycle
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate room exists and belongs to Owner.
    3. Validate tenant list is not empty.
    4. Validate date range: start date required; if end date provided, end ≥ start.
    5. Validate payment cycle is supported (MVP: Monthly).
    6. Check there is no active contract for the room.
    7. Create contract record with status **Active**.
    8. Link tenant(s) to the contract.
    9. Update room status to **Occupied**.
- **Output:** Contract created response (contract id, status, dates)
- **Exception Handling:**
    - Not authenticated → `401 UNAUTHORIZED`.
    - Not Owner → `403 FORBIDDEN`.
    - Invalid dates → `400 INVALID_DATE_RANGE`.
    - Active contract exists → `409 ROOM_ALREADY_HAS_ACTIVE_CONTRACT`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy CT-01.1 and CT-03.1.

#### FR-02 — End contract

- **Requirement ID:** FR-02
- **Requirement Name:** End Contract
- **Description:** Allow Owner to end an active contract and release the room.
- **Actor:** Owner
- **Input:** Contract id, end date
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Load contract by id.
    3. Verify contract status is Active.
    4. Validate end date ≥ start date.
    5. Set contract status to **Ended** and persist end date.
    6. Update associated room status to **Vacant**.
- **Output:** Contract ended confirmation
- **Exception Handling:**
    - Contract not found → `404 CONTRACT_NOT_FOUND`.
    - Not active → `409 CONTRACT_NOT_ACTIVE`.
    - Invalid date → `400 INVALID_DATE_RANGE`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy CT-02.2.

#### FR-03 — Retrieve contract list/details

- **Requirement ID:** FR-03
- **Requirement Name:** View Contracts
- **Description:** Allow Owner to list and view contract details per building/room.
- **Actor:** Owner
- **Input:** Optional filters: building id, room id, status
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Query contracts matching filters.
    3. Return contract details including room and tenant references.
- **Output:** Contract list/details
- **Exception Handling:**
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - List must include status, room, tenant count, start/end date.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** 95th percentile response time ≤ **2.0s** for create/end contract APIs under **50 concurrent users**.
- **NFR-02 Data integrity:** System must prevent multiple active contracts per room in **100%** of writes (DB-level constraint or transaction).
- **NFR-03 Auditability:** Contract create/end events must be logged with actor id and timestamp for **180 days**.

---

### 4) MVP scope

**Included in MVP**

- Create contract (room + tenant(s) + start date + monthly payment cycle)
- End contract
- Prevent multiple active contracts per room
- Room status updates on contract lifecycle

**Future phases (not MVP)**

- Deposits and deposit refund flows
- Contract amendments/versioning
- Pro-rating and mid-month contract starts
- Multi-room contracts

---

### 5) Supporting models (diagrams to include)

- **Use Case Diagram:** Owner creates/ends contract
- **Activity Diagram:** Create contract with conflict check
- **Sequence Diagram:** Create contract → update room status → audit
- **ERD (if DB exists):** Room, Tenant, Contract, ContractTenant