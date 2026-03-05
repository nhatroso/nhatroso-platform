# Security: password hashing and JWT auth

Acceptance Criteria: - Passwords are never stored in plain text; strong hashing is used.
- API authentication uses JWT (or equivalent) with expiration.
- System supports refresh or re-login flow when token expires.
Priority: Must
Related Epic: Security
Requirement ID: REQ-027
Status: Draft
Type: Non-functional

### 1) Scope

This requirement defines the security baseline for authentication and API access.

---

### 2) Functional Requirements (FR)

#### FR-01 — Password hashing

- **Requirement ID:** FR-01
- **Requirement Name:** Password Hashing
- **Description:** Passwords must never be stored in plain text.
- **Actor:** System
- **Input:** Plain text password
- **Processing:**
    1. Hash passwords using **Argon2id** before storing.
    2. Store salt and parameters.
    3. Verify using constant-time comparison.
- **Output:** Stored password hash
- **Exception Handling:**
    - Hashing failure → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - No endpoint or database record stores plain text passwords.

#### FR-02 — JWT authentication with expiration

- **Requirement ID:** FR-02
- **Requirement Name:** JWT Auth
- **Description:** Protected APIs require JWT access token authentication.
- **Actor:** System
- **Input:** HTTP request with Authorization header
- **Processing:**
    1. Validate JWT signature and expiry for every request.
    2. Reject missing/invalid/expired tokens.
    3. Extract user id and role claims.
- **Output:** Authenticated request context
- **Exception Handling:**
    - Missing/invalid token → `401 UNAUTHORIZED`.

#### FR-03 — Refresh or re-login flow

- **Requirement ID:** FR-03
- **Requirement Name:** Session Continuity
- **Description:** When access token expires, the client must refresh using a refresh token or require re-login.
- **Actor:** System
- **Input:** Refresh token
- **Processing:**
    1. Validate refresh token (not expired, not revoked).
    2. Issue new access token.
    3. Rotate refresh token (optional in MVP; if not rotating, keep revocation list).
- **Output:** New access token (and optionally refresh token)
- **Exception Handling:**
    - Invalid refresh token → `401 UNAUTHORIZED` and require login.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Crypto:** TLS **1.2+** for all API calls.
- **NFR-02 Token expiry:** Access token TTL ≤ **15 minutes**. Refresh token TTL ≤ **30 days**.
- **NFR-03 Password hashing parameters:** Argon2id with ≥ **64 MiB** memory, ≥ **2** iterations, parallelism **1**.
- **NFR-04 Rate limiting:** Max **5** failed login attempts per **15 minutes** per account identifier and per IP.

---

### 4) MVP scope

**Included in MVP**

- Argon2id password hashing
- JWT access tokens with expiration
- Refresh token or re-login flow
- Rate limiting for login

**Future phases (not MVP)**

- MFA
- Device management / logout all sessions
- Risk-based authentication

---

### 5) Supporting models (diagrams to include)

- **Sequence Diagram:** Login → issue tokens → refresh
- **Threat Model (optional):** auth attack vectors and mitigations