# Login & account creation

Acceptance Criteria: - User can create an account with email/phone.
- User can log in and log out.
- Errors are shown for invalid credentials.
Priority: Must
Related Epic: Account
Requirement ID: REQ-001
Status: Ready
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Account

Note: Registration is specified in REQ-003 “User registration (email/phone)”. This page focuses on authentication (login/logout).

**Feature A2: Authentication (login/logout, session management)**

**User Story A2.1**

As a *registered user* (Owner or Tenant), I want to log in with email or phone and password, so that I can use the system.

**Acceptance Criteria (A2.1)**

- Given correct credentials, when I log in, then the system issues an access token and refresh token, and redirects to the home dashboard within 2 seconds.
- Given incorrect credentials, when I log in, then the system rejects the request and shows **INVALID_CREDENTIALS** without revealing whether the account exists.
- Given the account is disabled, when I log in, then the system rejects the request and shows **ACCOUNT_DISABLED**.
- Given 5 failed login attempts within 15 minutes for the same account or identifier, when the next attempt happens, then the system blocks login for 15 minutes and shows **TOO_MANY_ATTEMPTS**.

**User Story A2.2**

As a *logged-in user*, I want to log out, so that my session is ended on the current device.

**Acceptance Criteria (A2.2)**

- Given I am logged in, when I click logout, then the system invalidates the refresh token for the current session and returns to the login screen within 2 seconds.
- Given I have logged out, when I use the previously issued access token after it expires, then the system does not refresh the session and requires login.

**Feature A3: Password policy and account recovery (future phase)**

**User Story A3.1 (Future)**

As a user, I want to reset my password if I forget it, so that I can regain access.

**Acceptance Criteria (A3.1)**

- Given I request password reset, when I provide a valid email/phone, then the system sends a reset link/OTP within 60 seconds.
- Given a reset token/OTP is expired, when I attempt to reset, then the system rejects with **RESET_TOKEN_EXPIRED**.

---

### 2) Functional Requirements (FR)

#### FR-01 — Login with email or phone + password

- **Requirement Name:** Password Login
- **Description:** Authenticate a user using email/phone and password and create a session.
- **Actor:** User (Owner or Tenant)
- **Input:** Identifier (email or phone), password
- **Processing:**
    1. Determine identifier type (email or phone) by validation.
    2. Normalize identifier (email lowercase, phone E.164).
    3. Look up user record.
    4. If user not found, execute a constant-time password hash verification against a dummy hash.
    5. Verify password hash with Argon2id.
    6. Check account status is **Active**.
    7. Check rate limit: max 5 failed attempts per 15 minutes per account and per IP.
    8. If allowed, issue access token (TTL 15 minutes) and refresh token (TTL 30 days).
    9. Persist refresh token identifier (jti) and session metadata (device, created time, last used).
- **Output:** Access token, refresh token, user profile summary
- **Exception Handling:**
    - Invalid credentials → `401 INVALID_CREDENTIALS`.
    - Account disabled → `403 ACCOUNT_DISABLED`.
    - Too many attempts → `429 TOO_MANY_ATTEMPTS` with lockout duration.
    - Token issuance failure → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy Acceptance Criteria A2.1.

#### FR-04 — Logout (current device)

- **Requirement Name:** Logout
- **Description:** End the user session on the current device.
- **Actor:** Logged-in user
- **Input:** Current refresh token (or session id)
- **Processing:**
    1. Validate that the refresh token belongs to an active session.
    2. Mark the refresh token jti as revoked.
    3. Remove client-side tokens.
- **Output:** Logout success response
- **Exception Handling:**
    - If refresh token missing/invalid → return `401 UNAUTHORIZED`.
    - If token already revoked → return `200 OK` (idempotent logout).
- **Acceptance Criteria:**
    - Must satisfy Acceptance Criteria A2.2.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** 95th percentile response time ≤ **2.0s** for registration and login APIs under **50 concurrent users**.
- **NFR-02 Availability:** Authentication endpoints uptime ≥ **99.5%** monthly.
- **NFR-03 Security (password storage):** Passwords must be hashed using **Argon2id** with parameters equivalent to at least **64 MiB memory**, **2 iterations**, **parallelism 1**.
- **NFR-04 Security (transport):** All auth traffic must use **TLS 1.2+**.
- **NFR-05 Security (token):** Access tokens must expire in **≤ 15 minutes**. Refresh tokens must expire in **≤ 30 days** and be revocable.
- **NFR-06 Rate limiting:** Enforce lockout after **5 failed attempts / 15 minutes** per account identifier and per IP.
- **NFR-07 Auditability:** Store login events (success/failure) with timestamp, identifier hash, and IP for at least **90 days**.
- **NFR-08 Maintainability:** Authentication service must have automated tests covering ≥ **80%** of lines for auth module.

---

### 4) MVP scope

**Included in MVP**

- Email registration + password
- Phone registration + password
- Login with email/phone + password
- Logout (current device)
- Rate limiting and basic lockout

**Future phases (not MVP)**

- Forgot password and password reset
- Email/phone verification via OTP
- Multi-factor authentication (MFA)
- Social login (Google/Apple)
- Session management across devices (log out all devices)

---

### 5) Supporting models (diagrams to include)

- **Use Case Diagram:** Register, Login, Logout
- **Activity Diagram:** Login flow with rate limit and lockout
- **Sequence Diagram:** Login → token issuance → session persistence
- **ERD (if DB exists):** User, Session/RefreshToken, LoginAttempt/AuditLog