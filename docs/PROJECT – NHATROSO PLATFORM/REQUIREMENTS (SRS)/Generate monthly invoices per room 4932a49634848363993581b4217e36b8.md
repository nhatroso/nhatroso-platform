# Generate monthly invoices per room

Acceptance Criteria: - Owner can generate invoices for a selected billing period for all active contracts.
- Invoice includes rent, electricity, water, and configured services.
- Invoice total is calculated from consumption (new-old readings) and unit prices for that period.
Priority: Must
Related Epic: Billing & Invoices
Requirement ID: REQ-015
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Billing & Invoices

**Feature INV-01: Generate monthly invoices for active contracts**

**User Story INV-01.1**

As an *Owner*, I want to generate invoices for a billing period for all active contracts, so that tenants can pay and I can track receivables.

**Acceptance Criteria (INV-01.1)**

- Given a billing period (YYYY-MM), when I generate invoices, then the system creates invoices for all rooms with active contracts within **30 seconds** for up to **200 rooms**.
- Given invoices already exist for the same period and contract, when I generate again, then the system rejects with **409 INVOICE_ALREADY_EXISTS**.

**Feature INV-02: Calculate invoice line items (rent + metered + services)**

**User Story INV-02.1**

As the system, I want to compute invoice totals from readings and effective pricing, so that amounts are correct.

**Acceptance Criteria (INV-02.1)**

- Given previous and current readings are finalized, when an invoice is generated, then consumption = current - previous and amount = consumption * unit price effective for the period.
- Given a required price configuration is missing, when generating, then the system fails the invoice with **409 MISSING_PRICE_CONFIGURATION**.

---

### 2) Functional Requirements (FR)

#### FR-01 — Generate invoices for a billing period

- **Requirement ID:** FR-01
- **Requirement Name:** Invoice Generation
- **Description:** Create invoices for all active contracts for a given billing period.
- **Actor:** Owner
- **Input:** Billing period (YYYY-MM)
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate billing period format.
    3. Load all active contracts for Owner.
    4. For each contract, check if an invoice already exists for period.
    5. If not exists, create invoice with status **Unpaid**.
    6. Generate line items: rent + metered services + fixed services.
    7. Persist invoice total.
- **Output:** Invoice generation summary (count created, failures)
- **Exception Handling:**
    - Duplicate invoice → `409 INVOICE_ALREADY_EXISTS`.
    - Invalid period → `400 INVALID_BILLING_PERIOD`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy INV-01.1.

#### FR-02 — Compute metered line items

- **Requirement ID:** FR-02
- **Requirement Name:** Metered Billing Calculation
- **Description:** Compute electricity/water charges from consumption and effective unit price.
- **Actor:** System
- **Input:** Room id, meter type, billing period
- **Processing:**
    1. Fetch previous finalized reading before period start.
    2. Fetch current finalized reading within period.
    3. Compute consumption = current - previous.
    4. Fetch effective unit price for the billing period.
    5. Compute amount = consumption * unit price.
- **Output:** Metered invoice line item(s)
- **Exception Handling:**
    - Missing readings → mark invoice as **Pending confirmation** and record reason `MISSING_READING`.
    - Negative consumption → mark **Pending confirmation** and record reason `INVALID_READING_SEQUENCE`.
    - Missing price → `409 MISSING_PRICE_CONFIGURATION`.
- **Acceptance Criteria:**
    - Must satisfy INV-02.1.

#### FR-03 — Compute fixed service line items

- **Requirement ID:** FR-03
- **Requirement Name:** Fixed Service Charges
- **Description:** Add fixed monthly services (wifi, cleaning) using effective pricing.
- **Actor:** System
- **Input:** Room id, configured services, billing period
- **Processing:**
    1. For each configured service, fetch effective unit price.
    2. Multiply by quantity (MVP: quantity = 1).
    3. Add to invoice.
- **Output:** Fixed service line items
- **Exception Handling:**
    - Missing price → `409 MISSING_PRICE_CONFIGURATION`.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** Generate invoices for **200 rooms** in ≤ **30 seconds** on p95.
- **NFR-02 Reliability:** Invoice generation must be idempotent for the same period (no duplicates) in **100%** of cases.
- **NFR-03 Auditability:** Invoice generation events must be logged with period, count, and actor id for **180 days**.

---

### 4) MVP scope

**Included in MVP**

- Generate invoices for a billing period
- Rent + electricity + water + configured fixed services
- Use effective pricing rules for the period

**Future phases (not MVP)**

- Pro-rating partial months
- Discounts, penalties, late fees
- Re-generation with revision history

---

### 5) Supporting models (diagrams to include)

- **Activity Diagram:** Generate invoices batch
- **Sequence Diagram:** Generate invoice → compute lines → persist
- **ERD (if DB exists):** Invoice, InvoiceLineItem, MeterReading, PriceRule, Contract