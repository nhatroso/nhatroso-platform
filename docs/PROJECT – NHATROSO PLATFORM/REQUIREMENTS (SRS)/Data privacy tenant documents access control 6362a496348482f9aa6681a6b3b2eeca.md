# Data privacy: tenant documents access control

Acceptance Criteria: - Only authorized Owner accounts can view tenant ID document images.
- Tenants can only access their own invoices and tickets.
- Access violations are logged and return 403 without leaking sensitive details.
Priority: Must
Related Epic: Security
Requirement ID: REQ-028
Status: Draft
Type: Non-functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Security

**Feature PRIV-01: Access control for tenant ID documents**

**User Story PRIV-01.1**

As an *Owner*, I want only authorized Owner accounts to view tenant ID document images, so that personal data is protected.

**Acceptance Criteria (PRIV-01.1)**

- Given I am authenticated as the Owner of the tenant/contract, when I request tenant document images, then access is granted (HTTP 200).
- Given I am an Owner but not associated with that tenant, when I request the documents, then access is denied (HTTP 403).

**User Story PRIV-01.2**

As a *Tenant*, I want to access only my own invoices and records, so that other tenants cannot see my data.

**Acceptance Criteria (PRIV-01.2)**

- Given I am authenticated as a Tenant, when I request invoices, then I only receive invoices linked to my contract(s).
- Given I attempt to access another tenant’s invoice id, when I request details, then the system returns **403 FORBIDDEN**.

**Feature PRIV-02: Safe error handling and logging**

**User Story PRIV-02.1**

As the system, I want access violations to return safe errors and be logged, so that data is not leaked and violations are detectable.

**Acceptance Criteria (PRIV-02.1)**

- Given an access violation occurs, when responding, then the system returns **403** with a generic message (no sensitive details).
- Given an access violation occurs, when logging, then the system records user id (if known), endpoint, ip, timestamp.

---

### 2) Functional Requirements (FR)

#### FR-01 — Authorize tenant document access

- **Requirement ID:** FR-01
- **Requirement Name:** Tenant Document Authorization
- **Description:** Restrict access to tenant ID document images.
- **Actor:** Owner
- **Input:** Tenant id, document id
- **Processing:**
    1. Authenticate requester.
    2. Verify requester role is Owner.
    3. Verify tenant is linked to an Owner-owned contract or building.
    4. If authorized, return signed URL to document.
- **Output:** Signed URL to document
- **Exception Handling:**
    - Unauthorized → `401 UNAUTHORIZED`.
    - Forbidden → `403 FORBIDDEN`.
    - Not found → `404 DOCUMENT_NOT_FOUND`.

#### FR-02 — Enforce tenant data isolation

- **Requirement ID:** FR-02
- **Requirement Name:** Tenant Isolation
- **Description:** Tenants can only access their own invoices and records.
- **Actor:** Tenant
- **Input:** Invoice id
- **Processing:**
    1. Authenticate tenant.
    2. Authorize invoice belongs to tenant’s contract.
    3. Return invoice details.
- **Output:** Tenant invoice details
- **Exception Handling:**
    - Forbidden → `403 FORBIDDEN`.
    - Not found → `404 INVOICE_NOT_FOUND`.

#### FR-03 — Log access violations

- **Requirement ID:** FR-03
- **Requirement Name:** Access Violation Logging
- **Description:** Log every 403 due to access violations.
- **Actor:** System
- **Input:** Access violation event
- **Processing:**
    1. Create audit event with endpoint, user id, ip, timestamp.
    2. Store for retention period.
- **Output:** Persisted audit event
- **Exception Handling:**
    - If audit store unavailable → fallback to application logs.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Security:** Document URLs must be signed and expire in ≤ **15 minutes**.
- **NFR-02 Auditability:** 100% of access violations (403) must be logged.
- **NFR-03 Privacy:** Responses for forbidden access must not reveal resource existence beyond generic `403`.

---

### 4) MVP scope

**Included in MVP**

- Owner-only access to tenant documents
- Tenant isolation for invoices
- Safe 403 errors and violation logging

**Future phases (not MVP)**

- Field-level redaction
- Data retention policies per document type

---

### 5) Supporting models (diagrams to include)

- **Sequence Diagram:** Request document → authorize → signed URL
- **ERD (if DB exists):** TenantDocument, Tenant, Contract, AuditLog