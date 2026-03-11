# Service Pricing Orchestration Plan

**Slug:** service-pricing

## Overview

Implement the ability for an Owner to configure service pricing per room and over time (REQ-006). This encompasses creating a service catalog (electricity, water, etc.) and assigning effective-dated prices to specific rooms, ensuring no date overlaps and preserving historical pricing for deterministic billing.

## Project Type

**FULL STACK** (Database + Backend API + Frontend Web)

## Success Criteria

- Owner can successfully manage the service catalog (CRUD + Archive).
- Owner can create effective-dated room price rules without overlapping bounds.
- The user interface reflects these updates logically via `frontend-specialist`.
- All Phase X verification scripts pass successfully.

## Tech Stack

- **Database:** PostgreSQL with SeaORM (`services` and `price_rules`).
- **Backend Analytics:** Rust, Axum, Loco framework.
- **Frontend UI:** Next.js (React), Tailwind CSS.
- **Shared Package:** Zod and TypeScript for API typings.

## File Structure

- `apps/api/server-api/migration/src/*_services_and_prices.rs`
- `apps/api/server-api/src/models/services.rs`
- `apps/api/server-api/src/models/price_rules.rs`
- `apps/api/server-api/src/controllers/services.rs`
- `apps/api/server-api/src/controllers/price_rules.rs`
- `packages/shared/src/types/services.ts`, `price_rules.ts`
- `packages/shared/src/schemas/services.ts`, `price_rules.ts`
- `apps/web/src/app/[locale]/dashboard/services/page.tsx`
- `apps/web/src/components/buildings/RoomPricingTab.tsx`

## Task Breakdown

### Phase 1: Planning

- [x] **Task 1: Generate Plan**
  - **Agent:** `project-planner`
  - **Skill:** `plan-writing`
  - **Input:** Orchestrator context & SRS document
  - **Output:** `docs/features/service-pricing/SERVICE-PRICING-PLAN.md`
  - **Verify:** User approves plan.

_(Pending User Approval to enter Phase 2)_

### Phase 2: Implementation (Parallel)

#### Foundation Group

- [x] **Task 2: Database Storage**
  - **Agent:** `database-architect`
  - **Skill:** `database-design`
  - **Input:** SRS Section 4.3 Schema for `services` and `price_rules`.
  - **Output:** Loco SeaORM migrated tables and entities.
  - **Verify:** `cargo run start` succeeds migration.

#### Core Group

- [x] **Task 3: Backend APIs**
  - **Agent:** `backend-specialist`
  - **Skill:** `rust-pro` / `api-patterns`
  - **Input:** Generated SeaORM Entities, SRS requirements.
  - **Output:** REST APIs to manage `services` and `price_rules` (handling end-date overlap bounding in Rust application logic).
  - **Verify:** Swagger integration and endpoints work properly via `cargo check`.

- [x] **Task 4: Shared TypeScript Package**
  - **Agent:** `frontend-specialist`
  - **Skill:** `clean-code`
  - **Input:** Rust backend specifications.
  - **Output:** Updates to `@nhatroso/shared` (`types` and `schemas`).
  - **Verify:** `pnpm build` in the `packages/shared` directory.

- [x] **Task 5: Web UI implementation**
  - **Agent:** `frontend-specialist`
  - **Skill:** `frontend-design`
  - **Input:** New endpoints and SRS requirements.
  - **Output:** Dashboard pages for setting service pricing per room.
  - **Verify:** Next.js compiles without typecheck errors (`pnpm --filter web typecheck`).

#### Polish Group

- [x] **Task 6: Verification & QA**
  - **Agent:** `test-engineer`
  - **Skill:** `testing-patterns`
  - **Input:** Final implemented codebase.
  - **Output:** Passing security and lint checks.
  - **Verify:** Scripts output success.

## Phase X: Verification

- [ ] Lint & Type Check (`pnpm --filter web typecheck` & `cargo check`)
- [ ] Security Scan (`security_scan.py`)
- [ ] UX Audit (`ux_audit.py`)
- [ ] Design rule compliance (No purple/violet, 8-pt grid used)
