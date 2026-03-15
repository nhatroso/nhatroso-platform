# Rental Contracts Plan

## Overview
Implement the MVP scope for creating and managing rental contracts as defined in REQ-008. This includes linking rooms to tenants, defining standard monthly payment cycles, managing contract lifecycles (Active/Ended), and enforcing conflict limits (maximum one active contract per room). Room status should dynamically update to Occupied or Vacant depending on contract status.

## Project Type
WEB, BACKEND

## Success Criteria
- [ ] Owner can create a contract specifying room, tenant(s), start date, and Monthly payment cycle.
- [ ] Backend creates contract within 2 seconds.
- [ ] Backend rejects creation with 409 if an active contract already exists for the room.
- [ ] Backend rejects with 400 if required fields are missing.
- [ ] Owner can end a contract, bringing its status to "Ended" and room status to "Vacant".
- [ ] All APIs average response times ≤ 2.0s under concurrent load.

## Tech Stack
- **Backend**: Rust (server-api), PostgreSQL, SeaORM (Database)
- **Frontend**: Next.js (Web application), Flowbite + Tailwind CSS v4
- **Shared**: Zod schemas & TypeScript definitions across monorepo

## File Structure
- `apps/api/server-api/src/controllers/contracts.rs` (New/Updated API routes)
- `apps/api/server-api/src/services/contracts.rs` (Business logic)
- `packages/shared/src/contracts/` (Contract models and Zod schemas)
- `apps/web/src/services/api/contracts.ts` (Frontend fetch methods)
- `apps/web/src/components/contracts/` (Frontend UI components)

## Task Breakdown

- [ ] **Task 1: Database Migration & Entities**
  - **Agent**: `database-architect` (Skill: `database-design`)
  - **Description**: Add Contract entity and relation tables (ContractTenant).
  - **INPUT→OUTPUT→VERIFY**: Input: SRS definitions → Output: SeaORM entities + migration → Verify: Run migration successfully without dropping tables.

- [ ] **Task 2: Shared Schemas**
  - **Agent**: `backend-specialist`
  - **Description**: Define TypeScript schema contracts in `@nhatroso/shared`.
  - **INPUT→OUTPUT→VERIFY**: Input: API requirements → Output: TypeScript interfaces / Zod schemas → Verify: `pnpm typecheck` in shared package passes.

- [ ] **Task 3: Backend API Endpoints**
  - **Agent**: `backend-specialist` (Skill: `api-patterns`)
  - **Description**: Implement POST `/contracts` and PUT `/contracts/{id}/end`. Enforce business rules (409 conflict, 400 bad request) and auto-updating of room status.
  - **INPUT→OUTPUT→VERIFY**: Input: DB entities → Output: Controller/Service routes → Verify: API successfully compiled (`cargo check`).

- [ ] **Task 4: Backend Security & Testing**
  - **Agent**: `test-engineer`, `security-auditor` (Skill: `testing-patterns`)
  - **Description**: Write unit tests for contract constraints, overlapping contract prevention, and auth validation.
  - **INPUT→OUTPUT→VERIFY**: Input: Implemented API routes → Output: Integration/Unit tests → Verify: `cargo test` passes.

- [ ] **Task 5: Frontend API Integration & UI**
  - **Agent**: `frontend-specialist` (Skill: `frontend-design`)
  - **Description**: Build UI for Contract creation/ending flows, mapping to standard Flowbite guidelines. Ensure multi-tenant selection handles cleanly.
  - **INPUT→OUTPUT→VERIFY**: Input: Flowbite config & API methods → Output: React components → Verify: Renders without error, `pnpm typecheck` passes.

- [ ] **Task 6: Frontend Testing & UX Audit**
  - **Agent**: `test-engineer`
  - **Description**: Complete translations (`en`/`vi`) and run fundamental testing.
  - **INPUT→OUTPUT→VERIFY**: Input: UI views → Output: Passing accessibility & language checks → Verify: Script audits pass.

## Phase X: Verification
- [x] Core Check: `python .agent/scripts/checklist.py .`
- [x] Security: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [x] Build & Lint: `pnpm check`
