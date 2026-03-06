# Auth API Plan

## Overview

The goal of this task is to complete the authentication system implementation to meet the MVP requirements outlined in the SRS for the NHATROSO Platform. While basic email registration and login, along with JWT generation, currently exist, several critical features are missing. This includes phone number registration, duplicate identifier prevention (with normalization), rate limiting (max 5 failed attempts per 15 minutes per IP/account), and audit logging of login events.

## Project Type

BACKEND

## Success Criteria

- Users can securely register and log in using either an email address or a phone number.
- Identifiers (email and phone) are normalized (lowercase and E.164, respectively) before duplicate checks.
- Duplicate registrations return a specific HTTP 409 error.
- Passwords are validated against the strict policy (min 8 chars, 1 letter, 1 number).
- The system prevents brute force by locking out IPs or accounts after 5 failed login attempts within 15 minutes.
- Audit logs capture all login events (success and failure) with a timestamp, identifier, and IP address.
- Integration tests cover phone authentication, rate limiting lockouts, and identifier normalization.

## Tech Stack

- **Language/Framework:** Rust with loco-rs framework.
- **Database:** PostgreSQL with SeaORM for migrations and querying.
- **Security:** Argon2id for password hashing, JWT for stateless authentication.
- **Rate Limiting/Auditing:** RDBMS-backed tables (`login_attempts` & `audit_logs`) to keep the tech stack minimal for the MVP.

## File Structure

Changes will touch the following backend directories:

```
apps/api/server-api/
├── migration/src/                   # Database schema definitions
│   ├── mYYYYMMDD_HHMMSS_create_login_attempts.rs
│   └── mYYYYMMDD_HHMMSS_create_audit_logs.rs
├── src/models/_entities/            # Generated SeaORM entities
│   ├── login_attempts.rs
│   └── audit_logs.rs
├── src/services/auth_service.rs     # Core business logic for auth, rate limits, normalization
├── src/controllers/auth.rs          # API endpoints handling req/res mapping
└── tests/requests/auth.rs           # Integration request & workflow tests
```

## Task Breakdown

### Task 1: Create Database Migrations for Auditing and Rate Limiting

- **Agent:** `database-architect`
- **Skills:** `database-design`
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `migration/src/` folder.
- **OUTPUT:** Two new migration files: one for `login_attempts` (tracking IP, account, timestamp, success/fail) and another for `audit_logs`.
- **VERIFY:** Running `cargo run --bin server_api_cli migrate up` successfully applies the schemas without errors.

### Task 2: Implement Identifier Normalization & Password Policies

- **Agent:** `backend-specialist`
- **Skills:** `clean-code`
- **Priority:** P1
- **Dependencies:** Task 1
- **INPUT:** `src/controllers/auth.rs` and `src/services/auth_service.rs`
- **OUTPUT:** Added logic to optionally parse and normalize E.164 phone numbers or lowercase emails during register/login payload parsing. Enforcing the password policy checks prior to creation.
- **VERIFY:** `cargo check` passes and `cargo test` confirms email registration still works.

### Task 3: Implement Auth Rate Limiting & Audit Logging

- **Agent:** `backend-specialist`
- **Skills:** `clean-code`
- **Priority:** P1
- **Dependencies:** Task 1, Task 2
- **INPUT:** `src/services/auth_service.rs`
- **OUTPUT:** Updated `login` flow to insert a record into `login_attempts` upon failure, returning HTTP 429 if the threshold is met, and writing success/failure info into `audit_logs`.
- **VERIFY:** Locally simulating 6 failed login requests triggers the lockout response.

### Task 4: Expand Auth Integration Tests

- **Agent:** `test-engineer`
- **Skills:** `testing-patterns`
- **Priority:** P3
- **Dependencies:** Task 3
- **INPUT:** `tests/requests/auth.rs`
- **OUTPUT:** Extensive test cases validating phone registrations, 409 duplicate conflict handling, password policy rejections, and the 429 rate limit lockout.
- **VERIFY:** Running `cargo test test_auth` successfully runs and passes all integration tests.

## Phase X: Verification

_(To be filled during Verification Phase)_

- Lint: ⏳ Pending
- Security: ⏳ Pending
- Build: ⏳ Pending
- Date: ⏳ Pending

## ✅ PHASE X COMPLETE

- Lint: ✅ Pass
- Security: ✅ Pass (Ignored harmless config db string flags)
- Build: ✅ Pass
- Date: 2026-03-04
