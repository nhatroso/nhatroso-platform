# Manage buildings/blocks/floors/rooms

Acceptance Criteria: - Owner can create, edit, and archive buildings/blocks, floors, and rooms.
- Room has a unique identifier within its building/block.
- Room status can be set to: Vacant, Deposited, Occupied, Maintenance.
Priority: Must
Related Epic: Owner – Room Management
Requirement ID: REQ-005
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Owner – Room Management

**Feature RM-01: Manage Buildings (CRUD + archive)**

**User Story RM-01.1**

As an *Owner*, I want to create a building, so that I can organize rooms under a real-world property.

**Acceptance Criteria (RM-01.1)**

- Given I provide a building name, when I save, then the system creates the building and returns **HTTP 201** within **2 seconds**.
- Given I omit the building name, when I save, then the system rejects with **400 REQUIRED_FIELD_MISSING**.
- Given I create a building, when I list buildings, then the new building appears within **2 seconds**.

**User Story RM-01.2**

As an Owner, I want to edit building details, so that building information stays accurate.

**Acceptance Criteria (RM-01.2)**

- Given the building exists and I have Owner role, when I update building fields, then changes persist and are visible on next load.
- Given the building is archived, when I attempt to edit it, then the system rejects with **409 RESOURCE_ARCHIVED**.

**User Story RM-01.3**

As an Owner, I want to archive a building, so that I can deactivate it without deleting historical data.

**Acceptance Criteria (RM-01.3)**

- Given the building has no active rooms (Occupied/Deposited), when I archive, then the building status becomes **Archived**.
- Given the building has at least one room with status Occupied or Deposited, when I archive, then the system rejects with **409 BUILDING_HAS_ACTIVE_ROOMS**.

**Feature RM-02: Manage Blocks (optional) under a building**

**User Story RM-02.1**

As an Owner, I want to create blocks (wings/areas) under a building, so that I can group floors and rooms.

**Acceptance Criteria (RM-02.1)**

- Given I select a building and provide a block name, when I save, then the system creates the block under that building within **2 seconds**.
- Given the block name already exists within the same building, when I save, then the system rejects with **409 DUPLICATE_BLOCK_NAME**.

**Feature RM-03: Manage Floors under a building or block**

**User Story RM-03.1**

As an Owner, I want to create floors, so that I can organize rooms by floor level.

**Acceptance Criteria (RM-03.1)**

- Given I select a parent (building or block) and provide a floor identifier (number or label), when I save, then the system creates the floor within **2 seconds**.
- Given the floor identifier already exists under the same parent, when I save, then the system rejects with **409 DUPLICATE_FLOOR_IDENTIFIER**.

**Feature RM-04: Manage Rooms (CRUD + archive + status)**

**User Story RM-04.1**

As an Owner, I want to create a room under a floor, so that I can track occupancy and billing for that room.

**Acceptance Criteria (RM-04.1)**

- Given I select a building/block/floor and provide a room identifier, when I save, then the system creates the room within **2 seconds**.
- Given the room identifier already exists within the same building (or building+block, if blocks are enabled), when I save, then the system rejects with **409 DUPLICATE_ROOM_IDENTIFIER**.
- Given I omit the room identifier, when I save, then the system rejects with **400 REQUIRED_FIELD_MISSING**.

**User Story RM-04.2**

As an Owner, I want to update a room’s status, so that I can reflect its real-world occupancy state.

**Acceptance Criteria (RM-04.2)**

- Given a room exists, when I set status, then it must be one of: **Vacant, Deposited, Occupied, Maintenance**.
- Given I attempt to set a status outside the allowed list, when I save, then the system rejects with **400 INVALID_STATUS**.

**User Story RM-04.3**

As an Owner, I want to archive a room, so that it no longer appears in active lists but historical records remain.

**Acceptance Criteria (RM-04.3)**

- Given the room status is Vacant or Maintenance, when I archive, then the room is marked Archived and excluded from default “Active rooms” list.
- Given the room status is Occupied or Deposited, when I archive, then the system rejects with **409 ROOM_HAS_ACTIVE_TENANCY**.

---

### 2) Functional Requirements (FR)

#### FR-01 — Create building

- **Requirement ID:** FR-01
- **Requirement Name:** Create Building
- **Description:** Allow Owner to create a building entity.
- **Actor:** Owner
- **Input:** Building name, optional address, optional description
- **Processing:**
    1. Verify caller is authenticated.
    2. Verify caller has Owner role.
    3. Validate required fields (building name).
    4. Create building record with status **Active**.
    5. Return created building id and details.
- **Output:** Building created response
- **Exception Handling:**
    - Missing/invalid token → `401 UNAUTHORIZED`.
    - Not Owner → `403 FORBIDDEN`.
    - Missing building name → `400 REQUIRED_FIELD_MISSING`.
    - Database error → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-01.1.

#### FR-02 — Update building

- **Requirement ID:** FR-02
- **Requirement Name:** Update Building
- **Description:** Allow Owner to update building fields if not archived.
- **Actor:** Owner
- **Input:** Building id, fields to update
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Load building by id.
    3. If building is Archived → reject.
    4. Validate updated fields.
    5. Persist updates.
- **Output:** Updated building details
- **Exception Handling:**
    - Not found → `404 BUILDING_NOT_FOUND`.
    - Archived → `409 RESOURCE_ARCHIVED`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-01.2.

#### FR-03 — Archive building

- **Requirement ID:** FR-03
- **Requirement Name:** Archive Building
- **Description:** Allow Owner to archive a building with no active rooms.
- **Actor:** Owner
- **Input:** Building id
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Load building and its rooms.
    3. If any room is Occupied or Deposited → reject.
    4. Set building status to Archived.
    5. Exclude archived building from default active list.
- **Output:** Archive confirmation
- **Exception Handling:**
    - Active rooms exist → `409 BUILDING_HAS_ACTIVE_ROOMS`.
    - Not found → `404 BUILDING_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-01.3.

#### FR-04 — Create block under building (optional)

- **Requirement ID:** FR-04
- **Requirement Name:** Create Block
- **Description:** Allow Owner to create a block under a building.
- **Actor:** Owner
- **Input:** Building id, block name
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate building exists and Active.
    3. Validate block name required.
    4. Enforce uniqueness of block name within building.
    5. Create block record.
- **Output:** Block created response
- **Exception Handling:**
    - Duplicate name → `409 DUPLICATE_BLOCK_NAME`.
    - Not found → `404 BUILDING_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-02.1.

#### FR-05 — Create floor under building/block

- **Requirement ID:** FR-05
- **Requirement Name:** Create Floor
- **Description:** Allow Owner to create floors under a building or block.
- **Actor:** Owner
- **Input:** Parent id (building or block), floor identifier
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate parent exists and Active.
    3. Validate floor identifier required.
    4. Enforce uniqueness of floor identifier within parent.
    5. Create floor record.
- **Output:** Floor created response
- **Exception Handling:**
    - Duplicate identifier → `409 DUPLICATE_FLOOR_IDENTIFIER`.
    - Parent not found → `404 PARENT_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-03.1.

#### FR-06 — Create room under floor

- **Requirement ID:** FR-06
- **Requirement Name:** Create Room
- **Description:** Allow Owner to create a room and enforce uniqueness of room identifier.
- **Actor:** Owner
- **Input:** Floor id, room identifier, optional room attributes
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate floor exists.
    3. Validate room identifier required.
    4. Enforce uniqueness of room identifier within building (or building+block if enabled).
    5. Create room with initial status **Vacant**.
- **Output:** Room created response
- **Exception Handling:**
    - Duplicate identifier → `409 DUPLICATE_ROOM_IDENTIFIER`.
    - Not found → `404 FLOOR_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-04.1.

#### FR-07 — Update room status

- **Requirement ID:** FR-07
- **Requirement Name:** Update Room Status
- **Description:** Allow Owner to update room status using a controlled status list.
- **Actor:** Owner
- **Input:** Room id, new status
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Load room.
    3. Validate status in allowed set.
    4. Persist status change.
- **Output:** Updated room details
- **Exception Handling:**
    - Invalid status → `400 INVALID_STATUS`.
    - Not found → `404 ROOM_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-04.2.

#### FR-08 — Archive room

- **Requirement ID:** FR-08
- **Requirement Name:** Archive Room
- **Description:** Allow Owner to archive a room only when it is not actively occupied.
- **Actor:** Owner
- **Input:** Room id
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Load room and tenancy/contract state.
    3. If room status is Occupied or Deposited → reject.
    4. Mark room as Archived.
    5. Exclude archived room from default active list.
- **Output:** Archive confirmation
- **Exception Handling:**
    - Active tenancy exists → `409 ROOM_HAS_ACTIVE_TENANCY`.
    - Not found → `404 ROOM_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy RM-04.3.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** 95th percentile response time ≤ **2.0s** for create/update room management APIs under **50 concurrent users**.
- **NFR-02 Availability:** Property management endpoints uptime ≥ **99.5%** monthly.
- **NFR-03 Security:** All endpoints in this epic must require authenticated Owner role; Tenant access must return **403** for 100% of Owner-only endpoints.
- **NFR-04 Data integrity:** Uniqueness constraints for block name, floor identifier, and room identifier must be enforced at the database level for **100%** of writes.
- **NFR-05 Auditability:** Create/update/archive actions must be logged with actor user id and timestamp for at least **180 days**.

---

### 4) MVP scope

**Included in MVP**

- Building CRUD + archive
- Floor CRUD (create + list + update + archive)
- Room CRUD + status + archive
- Uniqueness constraints for room identifier

**Future phases (not MVP)**

- Blocks (if not required for first release)
- Bulk import/export rooms
- Advanced room attributes (pricing templates, amenities)
- Floor plan uploads

---

### 5) Supporting models (diagrams to include)

- **Use Case Diagram:** Owner manages buildings/floors/rooms
- **Activity Diagram:** Create room with uniqueness validation
- **Sequence Diagram:** Owner → API → validation → DB write → audit log
- **ERD (if DB exists):** Building, Block (optional), Floor, Room, Tenancy/Contract