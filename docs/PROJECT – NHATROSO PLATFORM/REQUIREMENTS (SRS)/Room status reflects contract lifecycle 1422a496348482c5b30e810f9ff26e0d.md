# Room status reflects contract lifecycle

Acceptance Criteria: - When a contract is activated, room status becomes Occupied.
- When a contract ends, room status becomes Vacant (unless manually set to Maintenance).
- System prevents creating multiple active contracts for the same room.
Priority: Must
Related Epic: Owner – Room Management
Requirement ID: REQ-024
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Owner – Room Management

**Feature RM-05: Room status reflects contract lifecycle**

**User Story RM-05.1**

As the system, I want room status to update when a contract starts or ends, so that occupancy is accurate.

**Acceptance Criteria (RM-05.1)**

- Given a contract becomes Active, when activation completes, then the associated room status becomes **Occupied** within **2 seconds**.
- Given a contract is ended, when end completes, then the room status becomes **Vacant** unless it is manually set to **Maintenance**.

**User Story RM-05.2**

As the system, I want to prevent multiple active contracts for the same room, so that occupancy and billing are consistent.

**Acceptance Criteria (RM-05.2)**

- Given a room already has an active contract, when another contract is created/activated for that room, then the system rejects with **409 ROOM_ALREADY_HAS_ACTIVE_CONTRACT**.

---

### 2) Functional Requirements (FR)

#### FR-01 — Set room status to Occupied on contract activation

- **Requirement ID:** FR-01
- **Requirement Name:** Status Update on Activation
- **Description:** Update room status when a contract becomes active.
- **Actor:** System
- **Input:** Contract activation event (room id)
- **Processing:**
    1. Validate contract is Active.
    2. Load room.
    3. Set room status to Occupied.
    4. Persist status change and audit.
- **Output:** Updated room status
- **Exception Handling:**
    - Room not found → `404 ROOM_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-05.1.

#### FR-02 — Set room status to Vacant on contract end

- **Requirement ID:** FR-02
- **Requirement Name:** Status Update on End
- **Description:** Update room status when a contract ends.
- **Actor:** System
- **Input:** Contract end event (room id)
- **Processing:**
    1. Validate contract status is Ended.
    2. Load room.
    3. If room status is Maintenance → keep Maintenance.
    4. Else set status to Vacant.
    5. Persist and audit.
- **Output:** Updated room status
- **Exception Handling:**
    - Room not found → `404 ROOM_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Consistency:** Room status must match contract state for ≥ **99.9%** of updates (measured by nightly consistency check).

---

### 4) MVP scope

**Included in MVP**

- Status updates on contract start/end
- Block multiple active contracts per room

**Future phases (not MVP)**

- Status = Deposited based on deposit events
- Historical occupancy timeline

---

### 5) Supporting models (diagrams to include)

- **Sequence Diagram:** Contract activation → room status update
- **ERD (if DB exists):** Room, Contract, AuditLog