# Meter Request Automation Plan

## Overview

Automate monthly meter reading requests (electricity & water) for tenants based on landlord-configured schedules. This feature handles generating requests, processing submissions, detecting late submissions, and ensuring idempotency.

## Project Type

**BACKEND** (Rust API, database migrations, scheduled jobs)

## Success Criteria

1. Landlords can configure `day_of_month`, `grace_days`, and `auto_generate` in `meter_request_configs`.
2. A daily scheduler job reliably generates `meter_requests` (or equivalent `reading_requests`) for configured landlords.
3. Overlaps/duplicate generation is prevented via idempotency/unique constraints.
4. A daily job automatically flags pending requests past their `grace_days` as `late`.
5. Tenants can upload meter images via a new API endpoint, fulfilling the `meter_submissions` record.

## Tech Stack

- **Database**: PostgreSQL (via SeaORM). Schema migrations for new tables (`meter_request_configs`, `meter_submissions`) and possible updates to existing `reading_requests` table.
- **Backend API**: Rust (Axum/Actix depending on framework) with SeaORM.
- **Scheduler**: Tokio/Cron or external job queue (like BullMQ if Redis is used, else Rust-native cron).

## File Structure

```text
apps/api/server-api/
├── src/models/_entities/
│   ├── meter_request_configs.rs
│   ├── meter_submissions.rs
│   └── reading_requests.rs (already exists, will be adapted or mapped to meter_requests)
├── src/controllers/
│   ├── meter_configs.rs
│   └── meter_submissions.rs
├── src/tasks/
│   ├── generate_meter_requests.rs
│   └── process_late_requests.rs
```

## Task Breakdown

### Task 1: Database Schema & Migrations

- **Agent**: `database-architect`
- **Skills**: `database-design`
- **Priority**: P0
- **INPUT**: Current `reading_requests` schema in Rust and SQL.
- **OUTPUT**: SeaORM migration files for `meter_request_configs` and `meter_submissions`. Unique constraints added. Entity models updated.
- **VERIFY**: Run schema validation `python .agent/skills/database-design/scripts/schema_validator.py .` or database up/down commands.

### Task 2: Scheduler Jobs Implementation

- **Agent**: `backend-specialist`
- **Skills**: `backend-patterns`
- **Priority**: P1
- **Dependencies**: Task 1
- **INPUT**: The logic for daily generation (00:05 server time) and late-status flagging.
- **OUTPUT**: Rust tasks in `src/tasks/` checking configs and appropriately generating/updating requests idiomatically via SeaORM.
- **VERIFY**: Run `cargo test` on new scheduler units or invoke test script.

### Task 3: REST API Endpoints

- **Agent**: `backend-specialist`
- **Skills**: `api-patterns`
- **Priority**: P1
- **Dependencies**: Task 1
- **INPUT**: Requirement for `POST /meter-requests/{id}/submit` API.
- **OUTPUT**: Controllers/handlers routing image uploads and saving them to `meter_submissions`, while updating request status to submitted.
- **VERIFY**: Unit/Integration tests with mock image upload verifying DB state returns 200 OK.

## ✅ Phase X: Verification Complete Checklist

- [ ] Lint & Type Check passes: `cargo clippy -- -D warnings`
- [ ] Security Scan: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] Tests execution: `cargo test`
- [ ] Rule Compliance check (Socratic gate, no standard templates)
