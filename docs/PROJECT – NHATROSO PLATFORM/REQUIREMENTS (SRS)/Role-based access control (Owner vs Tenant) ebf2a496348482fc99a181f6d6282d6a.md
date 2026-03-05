# Role-based access control (Owner vs Tenant)

Acceptance Criteria: - System supports at least 2 roles: Owner and Tenant.
- Tenant cannot access Owner-only screens and APIs.
- Unauthorized requests return 401/403 with safe error messages.
Priority: Must
Related Epic: Security
Requirement ID: REQ-004
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Security

**Feature RBAC-01: Role model (Owner, Tenant) and permissions**

**User Story RBAC-01.1**

As an *Owner*, I want to access Owner-only features, so that I can manage my buildings, rooms, contracts, bills, and reports.

**Acceptance Criteria (RBAC-01.1)**

- Given the user role is **Owner**, when accessing an Owner-only screen/API, then the system grants access (HTTP 200) if authenticated.
- Given the user role is **Owner**, when accessing Tenant-only actions (example: “Pay bill”), then the system may allow access only if the action is explicitly configured as shared (otherwise deny with 403).

**User Story RBAC-01.2**

As a *Tenant*, I want to access Tenant features only, so that I can view bills, pay via QR, and manage my own profile without seeing Owner management tools.

**Acceptance Criteria (RBAC-01.2)**

- Given the user role is **Tenant**, when accessing Owner-only screen/API, then the system denies access with **HTTP 403 FORBIDDEN**.
- Given the user role is **Tenant**, when accessing Tenant screens/APIs, then the system grants access (HTTP 200) if authenticated.

**Feature RBAC-02: API authorization enforcement**

**User Story RBAC-02.1**

As the system, I want to enforce authorization consistently on every protected API endpoint, so that access control cannot be bypassed.

**Acceptance Criteria (RBAC-02.1)**

- Given a request is missing or has an invalid access token, when calling a protected endpoint, then the system returns **HTTP 401 UNAUTHORIZED**.
- Given a request has a valid token but lacks required permission, when calling a protected endpoint, then the system returns **HTTP 403 FORBIDDEN**.
- Given an endpoint is marked as public, when called without a token, then the system returns the expected response and does not leak sensitive data.

**Feature RBAC-03: UI access control (navigation, screens)**

**User Story RBAC-03.1**

As a Tenant, I want the UI to hide Owner-only menus and pages, so that I do not get confused and cannot navigate to restricted areas.

**Acceptance Criteria (RBAC-03.1)**

- Given role is Tenant, when the app loads navigation, then Owner-only menu items are not displayed.
- Given role is Tenant, when manually opening an Owner-only URL route, then the UI shows an “Access denied” screen and does not render protected data.

**Feature RBAC-04: Audit logging for authorization failures**

**User Story RBAC-04.1**

As the system, I want to log authorization failures, so that suspicious access attempts can be investigated.

**Acceptance Criteria (RBAC-04.1)**

- Given an authorization failure (401/403), when it occurs, then the system records an audit event including timestamp, user id (if known), route, and IP.
- Given the same user/IP triggers repeated failures, when threshold is reached, then the system flags the pattern for review (logged as “suspicious”).

---

### 2) Functional Requirements (FR)

#### FR-01 — Define roles and permission mapping

- **Requirement ID:** FR-01
- **Requirement Name:** Role & Permission Model
- **Description:** The system must support role-based access control with at least two roles: Owner and Tenant.
- **Actor:** System
- **Input:** User role assignment (Owner or Tenant), endpoint permission requirements
- **Processing:**
    1. Maintain a canonical list of roles: `OWNER`, `TENANT`.
    2. Maintain a permission list (examples): `OWNER_MANAGE_PROPERTY`, `OWNER_MANAGE_ROOMS`, `OWNER_MANAGE_CONTRACTS`, `OWNER_MANAGE_BILLING`, `TENANT_VIEW_BILLS`, `TENANT_PAY_BILLS`, `USER_EDIT_PROFILE`.
    3. Map each role to a set of permissions.
    4. Store each user’s role in the user profile and embed it in access token claims.
- **Output:** Permission set resolvable from the authenticated user identity
- **Exception Handling:**
    - If user role is missing/unknown → treat as unauthorized and deny protected operations with `403 FORBIDDEN`.
- **Acceptance Criteria:**
    - Owner and Tenant role must be available and testable via token claims.

#### FR-02 — Enforce authorization on protected APIs

- **Requirement ID:** FR-02
- **Requirement Name:** API Authorization Guard
- **Description:** Every protected API endpoint must validate authentication and enforce role/permission requirements.
- **Actor:** User (Owner or Tenant)
- **Input:** HTTP request, access token, endpoint permission requirement
- **Processing:**
    1. Identify whether the endpoint is public or protected.
    2. If protected, validate access token signature and expiry.
    3. Extract user id and role/permissions from token.
    4. Compare required permission(s) with user permissions.
    5. Allow request if permitted; otherwise reject.
- **Output:** HTTP 200 for allowed requests
- **Exception Handling:**
    - Missing/invalid/expired token → `401 UNAUTHORIZED`.
    - Valid token but insufficient permissions → `403 FORBIDDEN`.
    - Internal error during auth check → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - 100% of protected endpoints must return 401/403 correctly in automated tests.

#### FR-03 — Enforce UI access control

- **Requirement ID:** FR-03
- **Requirement Name:** UI RBAC
- **Description:** The client must hide and block navigation to screens not permitted by the user’s role.
- **Actor:** User (Owner or Tenant)
- **Input:** Role from authenticated session
- **Processing:**
    1. Load user role after login.
    2. Render navigation based on role.
    3. Guard route access (client-side) and show Access Denied screen when blocked.
    4. Do not request Owner-only data APIs when role is Tenant.
- **Output:** Role-appropriate UI and navigation
- **Exception Handling:**
    - If role cannot be loaded → show error and require re-authentication.
- **Acceptance Criteria:**
    - Tenant must not see Owner menus.
    - Tenant direct route access must be blocked.

#### FR-04 — Audit log for authorization decisions

- **Requirement ID:** FR-04
- **Requirement Name:** Authorization Audit Logging
- **Description:** Record authorization failures to support investigation and security monitoring.
- **Actor:** System
- **Input:** Auth failure events (401/403), request metadata
- **Processing:**
    1. On every 401/403, create an audit record.
    2. Include: timestamp, endpoint, method, ip, user id (if available), reason code.
    3. Store events for a defined retention period.
    4. If failures exceed threshold (e.g., 20 failures / 10 minutes per IP), flag as suspicious.
- **Output:** Persisted audit events
- **Exception Handling:**
    - If audit store is unavailable → continue responding 401/403 but log to fallback sink (application logs).
- **Acceptance Criteria:**
    - Audit events must be queryable by time range and endpoint.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Security:** All protected endpoints must require a valid JWT access token with signature verification on every request (no cache-only acceptance).
- **NFR-02 Performance:** Authorization checks must add ≤ **20 ms** p95 latency per request under **100 RPS**.
- **NFR-03 Availability:** RBAC enforcement components must support ≥ **99.5%** monthly uptime.
- **NFR-04 Reliability:** Audit logging must successfully persist ≥ **99%** of 401/403 events under normal operation.
- **NFR-05 Maintainability:** RBAC permission mapping must be configurable in one place and covered by automated tests with ≥ **80%** line coverage for the auth module.

---

### 4) MVP scope

**Included in MVP**

- Roles: Owner, Tenant
- API authorization (401/403) for protected endpoints
- UI menu hiding and route guards
- Audit logging for 401/403

**Future phases (not MVP)**

- Fine-grained resource-level permissions (e.g., per building or per room)
- Delegated access (sub-accounts for Owners)
- Admin/superuser role
- Attribute-based access control (ABAC)

---

### 5) Supporting models (diagrams to include)

- **Use Case Diagram:** Owner vs Tenant access to key modules
- **Activity Diagram:** Request → auth → authorize → allow/deny → audit
- **Sequence Diagram:** Client → API → Auth Guard → Permission check → Audit log
- **ERD (if DB exists):** User, Role/Permission (if separate tables), AuditLog