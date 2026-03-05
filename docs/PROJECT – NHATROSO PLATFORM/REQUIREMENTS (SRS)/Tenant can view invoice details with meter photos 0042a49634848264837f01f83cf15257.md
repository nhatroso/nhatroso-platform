# Tenant can view invoice details with meter photos

Acceptance Criteria: - Tenant can view a list of invoices by month with amounts and status.
- Tenant can open an invoice to see line items (rent, electric, water, services).
- Tenant can view the meter photo evidence attached to the invoice/readings.
Priority: Must
Related Epic: Tenant – Billing
Requirement ID: REQ-017
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Tenant – Billing

**Feature TEN-01: List invoices by month**

**User Story TEN-01.1**

As a *Tenant*, I want to see my invoices by month with status and amount, so that I know what I need to pay.

**Acceptance Criteria (TEN-01.1)**

- Given I am authenticated as Tenant, when I open invoices list, then I see invoices sorted by newest first within **2 seconds**.
- Given I try to access another tenant’s invoices, when I request them, then the system returns **403 FORBIDDEN**.

**Feature TEN-02: View invoice details including line items and meter photos**

**User Story TEN-02.1**

As a Tenant, I want to open an invoice and see line items (rent, electric, water, services) and meter photos, so that charges are transparent.

**Acceptance Criteria (TEN-02.1)**

- Given I open an invoice, when details load, then I can see all line items, unit prices, quantities/consumption, and totals within **2 seconds**.
- Given the invoice has meter reading evidence, when viewing details, then the meter photo is visible.

---

### 2) Functional Requirements (FR)

#### FR-01 — List tenant invoices

- **Requirement ID:** FR-01
- **Requirement Name:** Tenant Invoice List
- **Description:** Return a list of invoices that belong to the authenticated tenant.
- **Actor:** Tenant
- **Input:** Optional filters: billing period range, status
- **Processing:**
    1. Authenticate tenant.
    2. Resolve tenant’s active contract(s).
    3. Query invoices for those contracts.
    4. Return list with period, amount, status.
- **Output:** Invoice list
- **Exception Handling:**
    - Unauthorized → `401 UNAUTHORIZED`.
    - No active contract → return empty list (200) or `404 NO_CONTRACT` (choose one behavior and keep consistent).

#### FR-02 — Get invoice details

- **Requirement ID:** FR-02
- **Requirement Name:** Tenant Invoice Details
- **Description:** Return invoice details and line items for the tenant.
- **Actor:** Tenant
- **Input:** Invoice id
- **Processing:**
    1. Authenticate tenant.
    2. Authorize: invoice must belong to tenant’s contract.
    3. Fetch invoice, line items, and meter reading references.
    4. Provide signed URLs for meter photos.
- **Output:** Invoice details with line items and evidence links
- **Exception Handling:**
    - Forbidden access → `403 FORBIDDEN`.
    - Not found → `404 INVOICE_NOT_FOUND`.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** Invoice list/detail endpoints p95 ≤ **2.0s** under **50 concurrent users**.
- **NFR-02 Security:** Tenants must be unable to access other tenants’ invoices in **100%** of authorization tests.

---

### 4) MVP scope

**Included in MVP**

- Tenant invoice list
- Tenant invoice details with line items
- Meter photo evidence view

**Future phases (not MVP)**

- Invoice dispute/ticket creation
- Download PDF invoice

---

### 5) Supporting models (diagrams to include)

- **Use Case Diagram:** Tenant views invoice
- **Sequence Diagram:** Tenant → API → authz → fetch invoice → signed photo URL
- **ERD (if DB exists):** Tenant, Contract, Invoice, InvoiceLineItem, MeterReading