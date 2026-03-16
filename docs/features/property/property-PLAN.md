# Property Management: CRUD Buildings & Archive Rules

## 1. Overview

This plan details the implementation of the core "Property" module, specifically focusing on creating, reading, updating, and archiving buildings, floors, and rooms. Crucially, it enforces the business rule that a building _cannot_ be archived if it contains any active rooms (`OCCUPIED` or `DEPOSITED`).

## 2. Project Type

**WEB** and **BACKEND**

## 3. Success Criteria

- [ ] Database schema for `buildings`, `floors`, and `rooms` is created and matches the MVP specifications.
- [ ] Backend APIs for `buildings` (CRUD + Archive) are implemented with strict Owner-only access (RBAC).
- [ ] Backend correctly rejects archiving a building if any associated room is `OCCUPIED` or `DEPOSITED` (409 Conflict).
- [ ] Frontend dashboard allows Owners to view, create, edit, and archive buildings.
- [ ] Typechecks, linters, and security scripts pass with 0 errors.

## 4. Tech Stack

- **Database**: PostgreSQL (Migrations and Entities via Loco/SeaORM)
- **Backend API**: Rust / Loco.rs
- **Frontend**: Next.js 16 (App Router), `shadcn/ui`, Tailwind, `next-intl` (for translations)
- **Validation**: Zod (Frontend/Shared)

## 5. File Structure (Target)

```
apps/api/server-api/
  ├── migration/src/m..._buildings_floors_rooms.rs
  ├── src/models/buildings.rs
  ├── src/models/floors.rs
  ├── src/models/rooms.rs
  ├── src/controllers/buildings.rs
apps/web/src/
  ├── app/[locale]/dashboard/buildings/
  │    ├── page.tsx
  │    └── components/
```

---

## 6. Task Breakdown

### Phase 1: Database Foundation

**Task 1.1: Create Migrations for Property Entities**

- **Agent**: `database-architect`
- **Skill**: `database-design`
- **Priority**: P0
- **INPUT**: MVP Database Design document for `buildings`, `floors`, and `rooms`.
- **OUTPUT**: `migration/src/m..._create_property_tables.rs` defining the 3 tables with appropriate Foreign Keys, enums/text statuses, and timestamps.
- **VERIFY**: `cargo loco db migrate` runs successfully.

**Task 1.2: Generate SeaORM Entities**

- **Agent**: `database-architect`
- **Skill**: `database-design`
- **Priority**: P0
- **INPUT**: The newly migrated database.
- **OUTPUT**: Rust entity files in `src/models/_entities/` and `src/models/` for `buildings`, `floors`, and `rooms`.
- **VERIFY**: `cargo check` passes without errors.

### Phase 2: Backend Implementation

**Task 2.1: Buildings API Controller (CRUD)**

- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Dependencies**: Task 1.2
- **INPUT**: `buildings` entity, SRS requirements for building CRUD.
- **OUTPUT**: `src/controllers/buildings.rs` implementing `POST /api/v1/buildings`, `GET /api/v1/buildings`, and `PATCH /api/v1/buildings/:id`.
- **VERIFY**: API endpoints return 200/201 on success and correctly validate Owner JWT tokens.

**Task 2.2: Implement Building Archive Rule**

- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Dependencies**: Task 2.1
- **INPUT**: Controller file + Archive constraint condition ("Cannot archive if any room is OCCUPIED or DEPOSITED").
- **OUTPUT**: `POST /api/v1/buildings/:id/archive` endpoint that checks `rooms` table for the building ID. If active rooms exist, returns `409 Conflict`. Otherwise, sets building status to `ARCHIVED`.
- **VERIFY**: Automated/manual tests verify 409 error on active rooms and 200 OK on empty/vacant buildings.

### Phase 3: Frontend Implementation

**Task 3.1: Building Management UI**

- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 2.1, 2.2
- **INPUT**: Buildings API endpoints.
- **OUTPUT**: Next.js page at `/dashboard/buildings` using `shadcn/ui` Cards/Tables to list buildings. Includes a modal/form to create and edit buildings.
- **VERIFY**: UI renders correctly, fetches data from the API, and submits building forms.

**Task 3.2: Building Archive Action & i18n**

- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 3.1
- **INPUT**: Archive API endpoint, `@nhatroso/translations`.
- **OUTPUT**: An "Archive" button on the building list. Handles the 409 Conflict error gracefully by displaying an translated error message from `next-intl` (e.g., "Cannot archive building with active rooms").
- **VERIFY**: Clicking archive triggers the API and shows appropriate success/error UI prompts based on backend response.

### Phase 4: Polish & Verification

**Task 4.1: End-to-End Verification**

- **Agent**: `test-engineer`
- **Skill**: `testing-patterns`
- **Priority**: P3
- **Dependencies**: Task 3.2
- **INPUT**: Full system implementation.
- **OUTPUT**: Passed tests, typechecks, and format linters. Fix any edge-cases related to DB relationships.
- **VERIFY**: Run `pnpm check` and check `cargo clippy`.

---

## 7. Phase X: Verification

- [ ] Run `pnpm check` (Linting & Typechecking)
- [ ] Run backend tests / `cargo test`
- [ ] Security Scan (Vulnerability checks)
- [ ] UI tested for accessibility and appropriate error states.
