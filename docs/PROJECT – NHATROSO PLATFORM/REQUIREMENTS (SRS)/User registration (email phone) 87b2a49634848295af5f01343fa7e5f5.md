# User registration (email/phone)

Acceptance Criteria: - User can register with email or phone and a password.
- System validates required fields and password policy.
- System prevents duplicate email/phone accounts with clear error message.
Priority: Must
Related Epic: Account
Requirement ID: REQ-003
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** Account

**Feature R1: User registration with email + password**

**User Story R1.1**

As a *new user* (Owner or Tenant), I want to register using my email and a password, so that I can create an account and start using the system.

**Acceptance Criteria (R1.1)**

- Given I provide a valid email in format `local@domain` and a password meeting policy, when I submit registration, then the system creates the account with status **Active** and returns an authenticated session (access + refresh tokens) within **2 seconds**.
- Given the email already exists, when I submit registration, then the system rejects the request and returns `409 EMAIL_ALREADY_REGISTERED`.
- Given the email format is invalid, when I submit registration, then the system rejects the request and returns `400 INVALID_EMAIL_FORMAT`.
- Given the password violates policy, when I submit registration, then the system rejects the request and returns `400 PASSWORD_POLICY_VIOLATION`.

**Feature R2: User registration with phone + password**

**User Story R2.1**

As a *new user* (Owner or Tenant), I want to register using my phone number and a password, so that I can create an account without an email.

**Acceptance Criteria (R2.1)**

- Given I provide a valid phone number in **E.164** format (example: `+84901234567`) and a password meeting policy, when I submit registration, then the system creates the account with status **Active** and returns tokens within **2 seconds**.
- Given the phone number already exists, when I submit registration, then the system rejects the request and returns `409 PHONE_ALREADY_REGISTERED`.
- Given the phone number format is invalid, when I submit registration, then the system rejects the request and returns `400 INVALID_PHONE_FORMAT`.

**Feature R3: Duplicate prevention and normalization**

**User Story R3.1**

As the system, I want to normalize and compare identifiers consistently, so that duplicate accounts cannot be created due to casing or formatting.

**Acceptance Criteria (R3.1)**

- Given an email is submitted, when the system processes it, then it must be normalized to lowercase before uniqueness checks.
- Given a phone number is submitted, when the system processes it, then it must be normalized to E.164 before uniqueness checks.
- Given two submissions that normalize to the same value, when the second registration is attempted, then the system returns a duplicate error and does not create a new account.

---

### 2) Functional Requirements (FR)

#### FR-01 — Register with email + password

- **Requirement Name:** Email Registration
- **Description:** Create a new user account using an email address and password.
- **Actor:** User (Owner or Tenant)
- **Input:** Email, password, optional display name
- **Processing:**
    1. Validate required fields are present.
    2. Validate email format.
    3. Normalize email to lowercase.
    4. Validate password policy: length ≥ 8, includes at least 1 letter and 1 number.
    5. Check uniqueness: email does not exist.
    6. Hash password using **Argon2id**.
    7. Create user record with status **Active** and authentication method **Password**.
    8. Create session record and issue access token (TTL ≤ 15 minutes) and refresh token (TTL ≤ 30 days).
    9. Return tokens and user profile summary.
- **Output:** Account created confirmation, access token, refresh token
- **Exception Handling:**
    - Missing fields → `400 REQUIRED_FIELD_MISSING`.
    - Invalid email → `400 INVALID_EMAIL_FORMAT`.
    - Password policy violation → `400 PASSWORD_POLICY_VIOLATION`.
    - Email exists → `409 EMAIL_ALREADY_REGISTERED`.
    - Database/unknown error → `500 INTERNAL_ERROR` and no partial account created.
- **Acceptance Criteria:**
    - Must satisfy Acceptance Criteria R1.1.

#### FR-02 — Register with phone + password

- **Requirement Name:** Phone Registration
- **Description:** Create a new user account using phone number and password.
- **Actor:** User (Owner or Tenant)
- **Input:** Phone number (E.164), password, optional display name
- **Processing:**
    1. Validate required fields are present.
    2. Validate phone number format (E.164).
    3. Normalize phone number to E.164.
    4. Validate password policy.
    5. Check uniqueness: phone does not exist.
    6. Hash password using Argon2id.
    7. Create user record with status **Active**.
    8. Create session record and issue tokens.
    9. Return tokens and user profile summary.
- **Output:** Account created confirmation, access token, refresh token
- **Exception Handling:**
    - Missing fields → `400 REQUIRED_FIELD_MISSING`.
    - Invalid phone → `400 INVALID_PHONE_FORMAT`.
    - Password policy violation → `400 PASSWORD_POLICY_VIOLATION`.
    - Phone exists → `409 PHONE_ALREADY_REGISTERED`.
    - Other failure → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy Acceptance Criteria R2.1.

#### FR-03 — Identifier normalization and uniqueness rules

- **Requirement Name:** Duplicate Prevention
- **Description:** Ensure uniqueness of email and phone identifiers across accounts.
- **Actor:** System
- **Input:** Email or phone identifier
- **Processing:**
    1. If identifier is email, lowercase it.
    2. If identifier is phone, normalize to E.164.
    3. Perform uniqueness check on normalized identifier.
    4. If conflict found, reject registration with specific error.
- **Output:** Either “identifier available” or duplicate error
- **Exception Handling:**
    - Identifier type cannot be determined → `400 INVALID_IDENTIFIER`.
    - Data store unavailable → `503 SERVICE_UNAVAILABLE`.
- **Acceptance Criteria:**
    - Must satisfy Acceptance Criteria R3.1.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** 95th percentile response time ≤ **2.0s** for registration APIs under **50 concurrent users**.
- **NFR-02 Availability:** Registration endpoints uptime ≥ **99.5%** monthly.
- **NFR-03 Security (password storage):** Passwords must be hashed using **Argon2id** with parameters equivalent to at least **64 MiB memory**, **2 iterations**, **parallelism 1**.
- **NFR-04 Security (transport):** All registration traffic must use **TLS 1.2+**.
- **NFR-05 Reliability:** If user creation fails after identifier validation, the system must not create a partial user record (atomic transaction) in **100%** of failure cases.

---

### 4) MVP scope

**Included in MVP**

- Registration with email + password
- Registration with phone + password
- Duplicate prevention for email and phone
- Password policy validation

**Future phases (not MVP)**

- Email/phone verification via OTP
- Captcha / bot protection
- Invitation-based registration
- Account approval workflow

---

### 5) Supporting models (diagrams to include)

- **Use Case Diagram:** Register with Email, Register with Phone
- **Activity Diagram:** Registration flow with validation and duplicate check
- **Sequence Diagram:** Register → validate → create user → issue tokens
- **ERD (if DB exists):** User, Session/RefreshToken