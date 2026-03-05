# System keeps an audit trail for critical actions

Acceptance Criteria: - System records who did what and when for: login events, reading overrides, invoice edits/status changes, and contract changes.
- Audit records are tamper-evident (append-only behavior at application level).
- Admin/Owner can export audit logs for a date range.
Priority: Must
Related Epic: Platform
Requirement ID: REQ-026
Status: Draft
Type: Non-functional

### 1) Scope and objectives

This requirement defines an audit trail for critical actions to support troubleshooting, dispute resolution, and security monitoring.

---

### 2) Functional Requirements (FR)

#### FR-01 — Record audit events for critical actions

- **Requirement ID:** FR-01
- **Requirement Name:** Audit Event Recording
- **Description:** The system must record who did what and when for critical actions.
- **Actor:** System
- **Input:** Action event + metadata
- **Processing:**
    1. For each critical action, create an audit event.
    2. Critical actions (MVP minimum):
        - Login success/failure
        - Meter reading override
        - Manual correction of meter reading
        - Invoice create, update, void, status change
        - Contract create, end
    3. Persist event with fields: timestamp, actor_user_id (nullable for unknown), action_type, target_type, target_id, ip, user_agent, before_snapshot (optional), after_snapshot (optional), reason (optional).
- **Output:** Persisted audit event
- **Exception Handling:**
    - If audit store is unavailable, write to fallback application log and return normal response (do not block user action).
- **Acceptance Criteria:**
    - 100% of the above critical actions generate an audit event.

#### FR-02 — Tamper-evident / append-only behavior

- **Requirement ID:** FR-02
- **Requirement Name:** Append-only Audit Log
- **Description:** Audit events must not be editable or deletable through the application.
- **Actor:** System
- **Input:** Audit event store operations
- **Processing:**
    1. Do not expose update/delete APIs for audit events.
    2. Enforce append-only behavior in service layer.
- **Output:** Immutable audit history
- **Exception Handling:**
    - If an update/delete is attempted internally, reject and log security warning.

#### FR-03 — Export audit logs

- **Requirement ID:** FR-03
- **Requirement Name:** Audit Export
- **Description:** Owner can export audit events for a date range.
- **Actor:** Owner
- **Input:** Start date, end date, optional filters (action_type, target_type)
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate date range (max range in MVP: 90 days).
    3. Query audit events for Owner scope.
    4. Generate export file (CSV) and provide download link.
- **Output:** Export file link
- **Exception Handling:**
    - Invalid date range → `400 INVALID_DATE_RANGE`.
    - Too large → `413 EXPORT_TOO_LARGE`.
    - Other failures → `500 INTERNAL_ERROR`.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Retention:** Retain audit events for at least **180 days**.
- **NFR-02 Reliability:** Successfully persist ≥ **99%** of audit events under normal operation.
- **NFR-03 Performance:** Writing an audit event must add ≤ **30 ms** p95 latency per request at **100 RPS**.

---

### 4) MVP scope

**Included in MVP**

- Audit events for defined critical actions
- Append-only behavior (application level)
- Export CSV for a date range

**Future phases (not MVP)**

- Cryptographic tamper evidence (hash chain)
- Streaming audit events to SIEM

---

### 5) Supporting models (diagrams to include)

- **Sequence Diagram:** Action → audit event write
- **ERD (if DB exists):** AuditLog