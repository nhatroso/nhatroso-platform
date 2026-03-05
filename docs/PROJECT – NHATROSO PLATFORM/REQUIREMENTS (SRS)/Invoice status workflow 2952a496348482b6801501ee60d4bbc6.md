# Invoice status workflow

Acceptance Criteria: - Invoice supports statuses at minimum: Unpaid, Pending confirmation, Paid, Voided.
- Owner can mark invoice as voided with a reason.
- Status changes are timestamped and traceable.
Priority: Must
Related Epic: Billing & Invoices
Requirement ID: REQ-016
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Billing & Invoices

**Feature INV-03: Invoice status workflow**

**User Story INV-03.1**

As an *Owner*, I want invoices to have clear statuses, so that I can track what is unpaid and what is paid.

**Acceptance Criteria (INV-03.1)**

- Given an invoice is newly created, when generated, then status is **Unpaid**.
- Given required readings/prices are missing, when invoice is generated, then status is **Pending confirmation**.
- Given a payment is confirmed, when reconciliation occurs, then status becomes **Paid**.
- Given Owner voids an invoice, when voided, then status becomes **Voided** and a void reason is required.

**User Story INV-03.2**

As an Owner, I want invoice status changes to be traceable, so that I can audit disputes.

**Acceptance Criteria (INV-03.2)**

- Given a status changes, when it is saved, then the system stores timestamp, actor, from_status, to_status, and reason (if applicable).

---

### 2) Functional Requirements (FR)

#### FR-01 — Define allowed invoice statuses and transitions

- **Requirement ID:** FR-01
- **Requirement Name:** Invoice State Machine
- **Description:** Implement invoice statuses and allowed transitions.
- **Actor:** System
- **Input:** Current invoice status, requested action
- **Processing:**
    1. Allowed statuses: `UNPAID`, `PENDING_CONFIRMATION`, `PAID`, `VOIDED`.
    2. Allowed transitions:
        - UNPAID → PAID
        - UNPAID → VOIDED
        - PENDING_CONFIRMATION → UNPAID (after fixes)
        - PENDING_CONFIRMATION → PAID
        - PENDING_CONFIRMATION → VOIDED
    3. Reject invalid transitions.
- **Output:** Updated invoice status
- **Exception Handling:**
    - Invalid transition → `409 INVALID_STATUS_TRANSITION`.

#### FR-02 — Void invoice with reason

- **Requirement ID:** FR-02
- **Requirement Name:** Void Invoice
- **Description:** Allow Owner to void an invoice with a mandatory reason.
- **Actor:** Owner
- **Input:** Invoice id, void reason
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate void reason length ≥ 10.
    3. Set invoice status to VOIDED.
    4. Record status history entry with reason.
- **Output:** Voided invoice
- **Exception Handling:**
    - Missing reason → `400 VOID_REASON_REQUIRED`.
    - Invoice not found → `404 INVOICE_NOT_FOUND`.
    - Other failures → `500 INTERNAL_ERROR`.

#### FR-03 — Record status history

- **Requirement ID:** FR-03
- **Requirement Name:** Invoice Status History
- **Description:** Record each status change for traceability.
- **Actor:** System
- **Input:** Invoice id, from status, to status, actor, timestamp, reason
- **Processing:**
    1. Append status history record.
    2. Prevent deletion of history entries.
- **Output:** Persisted history
- **Exception Handling:**
    - Storage failure → `500 INTERNAL_ERROR`.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Auditability:** 100% of status changes must be recorded in history.
- **NFR-02 Data integrity:** Invoice status history must be append-only at application level for **100%** of records.

---

### 4) MVP scope

**Included in MVP**

- Statuses: Unpaid, Pending confirmation, Paid, Voided
- Void with reason
- Status history

**Future phases (not MVP)**

- Partial payments
- Refund status
- Dispute workflow

---

### 5) Supporting models (diagrams to include)

- **State Diagram:** Invoice statuses and transitions
- **ERD (if DB exists):** Invoice, InvoiceStatusHistory