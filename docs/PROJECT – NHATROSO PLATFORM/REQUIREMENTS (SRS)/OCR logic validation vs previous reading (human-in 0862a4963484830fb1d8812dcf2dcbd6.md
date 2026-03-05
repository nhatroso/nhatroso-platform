# OCR logic validation vs previous reading (human-in-the-loop)

Acceptance Criteria: - System compares current reading to previous reading for the same room and meter type.
- If current < previous, system blocks auto-confirm and prompts for re-capture or manual entry.
- Owner can override with a reason and the system logs the override.
Priority: Must
Related Epic: OCR
Requirement ID: REQ-013
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** OCR

**Feature OCR-03: Validate reading vs previous (human-in-the-loop)**

**User Story OCR-03.1**

As the system, I want to validate the current reading against the previous reading, so that obvious errors are caught before billing.

**Acceptance Criteria (OCR-03.1)**

- Given a previous reading exists for the same room and meter type, when current reading is saved, then the system compares values.
- Given current < previous, when validation runs, then the system blocks auto-finalization and sets status to **Needs Review** with reason **READING_DECREASED**.
- Given no previous reading exists, when validation runs, then the system allows the reading to proceed (no decrease check).

**User Story OCR-03.2**

As an Owner, I want to override a failed validation with a reason, so that exceptional cases can still be billed.

**Acceptance Criteria (OCR-03.2)**

- Given validation failed, when I override, then I must enter a reason (min **10 characters**) and the system records who overrode and when.
- Given I do not provide a reason, when I override, then the system rejects with **400 OVERRIDE_REASON_REQUIRED**.

---

### 2) Functional Requirements (FR)

#### FR-01 — Fetch previous reading

- **Requirement ID:** FR-01
- **Requirement Name:** Previous Reading Lookup
- **Description:** Retrieve the most recent finalized reading for the same room and meter type.
- **Actor:** System
- **Input:** Room id, meter type
- **Processing:**
    1. Query latest reading where status = Finalized.
    2. Return reading value and timestamp.
- **Output:** Previous reading (or none)
- **Exception Handling:**
    - Data store error → `500 INTERNAL_ERROR`.

#### FR-02 — Validate non-decreasing readings

- **Requirement ID:** FR-02
- **Requirement Name:** Reading Decrease Check
- **Description:** Prevent current reading from being finalized automatically if it decreases vs previous.
- **Actor:** System
- **Input:** Current reading value, previous reading value (optional)
- **Processing:**
    1. If previous reading missing → pass.
    2. If current < previous → fail with reason READING_DECREASED.
    3. If current ≥ previous → pass.
- **Output:** Validation pass/fail
- **Exception Handling:**
    - Non-numeric value → handled upstream (OCR-02).
- **Acceptance Criteria:**
    - Must satisfy OCR-03.1.

#### FR-03 — Override validation

- **Requirement ID:** FR-03
- **Requirement Name:** Owner Override
- **Description:** Allow Owner to override a validation failure with a reason and audit record.
- **Actor:** Owner
- **Input:** Reading id, override reason
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Verify reading status is Needs Review.
    3. Validate override reason length ≥ 10.
    4. Mark validation as overridden and store reason, actor id, timestamp.
    5. Allow reading to be finalized.
- **Output:** Override confirmation
- **Exception Handling:**
    - Not found → `404 READING_NOT_FOUND`.
    - Wrong state → `409 INVALID_READING_STATE`.
    - Missing reason → `400 OVERRIDE_REASON_REQUIRED`.
    - Other failures → `500 INTERNAL_ERROR`.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** Validation check p95 ≤ **50 ms** per reading at **100 RPS**.
- **NFR-02 Auditability:** 100% of overrides must generate an audit record.

---

### 4) MVP scope

**Included in MVP**

- Decrease check against previous reading
- Block auto-finalization on decrease
- Owner override with reason and audit log

**Future phases (not MVP)**

- Threshold-based anomaly detection (e.g., > 200% increase)
- Machine learning anomaly detection

---

### 5) Supporting models (diagrams to include)

- **Activity Diagram:** Validate reading → pass/fail → override path
- **ERD (if DB exists):** MeterReading, ReadingValidation, AuditLog