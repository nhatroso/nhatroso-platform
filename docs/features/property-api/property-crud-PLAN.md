# Property API: Buildings, Blocks, Floors, Rooms

## Overview

This plan outlines the implementation of the Property API (CRUD for buildings, blocks, floors, and rooms, including archiving rules) for the NHATROSO Platform MVP. The core requirement is to allow an `Owner` to manage their properties while enforcing structural hierarchy and business rules (e.g., uniqueness constraints, preventing archiving of occupied rooms).

## Project Type

**BACKEND**

## Success Criteria

- `Owner` can create, update, and archive buildings, floors, and rooms.
- Room code/identifiers are unique within their parent building.
- Room status correctly transitions between: `VACANT`, `DEPOSITED`, `OCCUPIED`, `MAINTENANCE`, `ARCHIVED`.
- Archiving is blocked if a building has active rooms or if a room is actively occupied/deposited.
- All endpoints correctly enforce the `OWNER` role.
- 95th percentile response times are ≤ 2.0s.

## Tech Stack

- **Language**: Rust
- **Framework**: `axum` or `actix-web` (based on existing `server-api` setup)
- **Database ORM**: `SeaORM` (PostgreSQL)
- **Authentication/Authorization**: JWT with RBAC

## File Structure

Changes will primarily occur within the `apps/api/server-api` directory:

- `src/entities/`: SeaORM models for `building`, `floor`, `room`.
- `src/dtos/property.rs`: Request and response models.
- `src/services/property_service.rs`: Core business logic and validation.
- `src/controllers/property_controller.rs`: HTTP route handlers.
- `tests/property_api_test.rs`: Integration tests.

## Task Breakdown

### Task 1: Database Entities & Migrations

- **Agent**: `database-architect`
- **Skills**: `database-design`, `rust-pro`
- **INPUT**: MVP SDD schema for `buildings`, `floors`, `rooms`.
- **OUTPUT**: SeaORM entity files and migration scripts inside `migration/`.
- **VERIFY**: Run `sea-orm-cli migrate up` successfully and ensure tables exist with correct constraints.

### Task 2: DTOs & Validation

- **Agent**: `backend-specialist`
- **Skills**: `rust-pro`, `api-patterns`
- **INPUT**: API specification for Property CRUD (e.g., `POST /buildings`, `POST /rooms/:id/archive`).
- **OUTPUT**: `Deserialize` structs with validation rules (e.g., string lengths, valid enum states).
- **VERIFY**: Unit tests confirming valid payloads parse correctly and invalid payloads return 400 errors.

### Task 3: Core Service Logic

- **Agent**: `backend-specialist`
- **Skills**: `rust-pro`, `clean-code`
- **INPUT**: DTOs and business rules (e.g., archive blocking).
- **OUTPUT**: `PropertyService` with methods implementing the CRUD business rules.
- **VERIFY**: Unit tests for the service layer isolating database interactions.

### Task 4: API Controllers and RBAC

- **Agent**: `backend-specialist`
- **Skills**: `rust-pro`, `api-patterns`
- **INPUT**: `PropertyService` and existing auth middleware.
- **OUTPUT**: Route handlers mapped to `/api/v1` for buildings, floors, and rooms, protected by `OWNER` role guards.
- **VERIFY**: Integration tests verifying that requests without an `OWNER` token return `401`/`403`.

### Task 5: Integration Testing

- **Agent**: `test-engineer`
- **Skills**: `testing-patterns`
- **INPUT**: Fully implemented Property API.
- **OUTPUT**: Comprehensive test suite covering the happy path (create building -> floor -> room -> archive building).
- **VERIFY**: `cargo test` passes and covers edge cases (e.g., duplicate room codes).

## Phase X: Verification

- [x] **Linting**: `cargo clippy -- -D warnings`
- [x] **Formatting**: `cargo fmt -- --check`
- [x] **Security**: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [x] **Tests**: `cargo test`
- [x] **Build**: `cargo build --release`

## ✅ PHASE X COMPLETE

- Lint: ✅ Pass
- Security: ✅ Pass (Ignored harmless config db string flags)
- Build: ✅ Pass
- Date: 2026-03-05

---

## Addendum: Floor & Room Unique Constraints

**Epic Request**: CRUD floors and rooms + unique room code per building.

### [x] Task 6: Implement Service Validations for Floor/Room Uniqueness

- **Agent**: `backend-specialist`
- **INPUT**: `src/services/property_service.rs`
- **ACTION**:
  - Update `create_floor` to ensure the building exists and belongs to the owner.
  - Check DB if `(building_id, identifier)` exists before creating the Floor, returning a `409 DUPLICATE_FLOOR_IDENTIFIER` custom error if true.
  - Update `create_room` to ensure the building exists and belongs to the owner.
  - Check DB if `(building_id, code)` exists before creating the Room, returning a `409 DUPLICATE_ROOM_IDENTIFIER` custom error if true.
  - Ensure `archive_room` and `update_room_status` properly cross-check the owner permission.
- **OUTPUT**: Hardened `PropertyService` returning explicit application errors.

### [x] Task 7: Update Integration Tests for Uniqueness Constraints

- **Agent**: `test-engineer`
- **INPUT**: `tests/requests/property.rs`
- **ACTION**:
  - Add tests attempting to create a floor with an existing `identifier` in the same building (expecting failure).
  - Add tests attempting to create a room with an existing `code` in the same building (expecting failure).
- **OUTPUT**: Passing integration tests demonstrating uniqueness constraints.
