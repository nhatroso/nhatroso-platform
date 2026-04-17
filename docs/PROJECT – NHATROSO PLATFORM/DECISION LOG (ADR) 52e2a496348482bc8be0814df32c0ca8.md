# DECISION LOG (ADR)

<aside>
🧠

Use ADRs to capture architecture and technology decisions. One decision per entry.

</aside>

Last updated: April 9, 2026

---

### ADR-001: Backend Language & Framework

- **Context**
  - Need a performant, type-safe backend for the property management API. Team has opportunity to learn a modern systems language as part of university thesis project.
- **Decision**
  - Use **Rust** with **Loco.rs** (v0.16) as the web framework, **Axum** (v0.8) for HTTP routing, and **SeaORM** (v1.1) for async database access.
- **Alternatives**
  - NestJS (Node.js): more familiar ecosystem, faster onboarding.
  - Python (FastAPI): rapid prototyping.
- **Consequences**
  - Longer initial setup and steeper learning curve than NestJS.
  - Excellent runtime performance, memory safety, and compile-time guarantees.
  - Loco provides Rails-like conventions (MVC, migrations, tasks, background workers) in Rust.
- **Date:** March 2026
- **Owner:** Bao Dinh

---

### ADR-002: Database & ORM Strategy

- **Context**
  - Need a relational database for deterministic billing, FK constraints, and migration-driven schema management.
- **Decision**
  - Use **SQLite** in development and **PostgreSQL** in production. Manage schema via **SeaORM migrations** (using Loco's `sea-orm-migration`).
- **Alternatives**
  - PostgreSQL only: simpler but heavier for local dev.
  - MongoDB: poor fit for relational billing data.
- **Consequences**
  - Development is lightweight (single SQLite file). Production uses PostgreSQL for concurrency and constraints.
  - Migration files are versioned in `apps/api/server-api/migration/src/`.
- **Date:** March 2026
- **Owner:** Bao Dinh

---

### ADR-003: Authentication Strategy

- **Context**
  - Need stateless auth with role separation (Owner vs Tenant) and token revocation support.
- **Decision**
  - Use **JWT** access tokens (short TTL) + **refresh tokens** stored in `refresh_tokens` table with `jti` for revocation. Role (`OWNER`/`TENANT`) is embedded in the JWT claim.
- **Alternatives**
  - Session-based auth: requires sticky sessions or shared session store.
  - OAuth2: over-engineering for MVP scope.
- **Consequences**
  - Stateless access token verification. Refresh token revocation possible via `jti` lookup.
  - Owner endpoints check resource ownership via `owner_id`. Tenant endpoints are not yet exposed in web UI (mobile only).
- **Date:** March 2026
- **Owner:** Bao Dinh

---

### ADR-004: ID Type — Integer vs UUID

- **Context**
  - SDD originally specified UUIDs for all entities. SeaORM with SQLite defaults to auto-increment integers.
- **Decision**
  - Use **i32 serial (auto-increment)** integer IDs for all entities, not UUIDs.
- **Alternatives**
  - UUID v4: globally unique, better for distributed systems.
- **Consequences**
  - Simpler queries and joins. IDs are sequential and predictable.
  - Not suitable for multi-tenant distributed deployment without sharding — acceptable for MVP scope.
- **Date:** March 2026
- **Owner:** Bao Dinh

---

### ADR-005: OCR Feature Scope

- **Context**
  - Original BRD and SDD specified an OCR pipeline: photo → FastAPI OCR service → confidence score → human correction.
- **Decision**
  - **OCR service is descoped for MVP.** Meter readings use manual entry (`reading_value` field). Photos are uploaded for evidence only.
- **Alternatives**
  - Implement Python FastAPI OCR sidecar service.
  - Use third-party OCR API (Google Vision, AWS Textract).
- **Consequences**
  - Simpler architecture (no async queue, no sidecar). Owner manually enters reading values after viewing photo.
  - Meter reading status simplified to `PENDING | ACCEPTED | REJECTED` instead of `DRAFT | RECOGNIZED | NEEDS_REVIEW | FINALIZED | FAILED`.
  - OCR remains a future post-MVP enhancement.
- **Date:** March 2026
- **Owner:** Bao Dinh

---

### ADR-006: Room Services & Pricing Model

- **Context**
  - Original design had services linked to rooms only via `price_rules`. Need a way to manage which services are active for a room independently of pricing.
- **Decision**
  - Introduce a **`room_services`** junction table linking rooms to services. `price_rules` tracks effective-dated unit pricing per `(room, service)`. `room_services.price_rule_id` optionally references the currently active rule.
- **Alternatives**
  - Keep services linked only via `price_rules` (original design).
- **Consequences**
  - Cleaner separation: a room can "have" a service even before pricing is set, and pricing can change over time.
  - Added `is_active` flag to `price_rules` to track the currently applicable rule.
- **Date:** March 2026
- **Owner:** Bao Dinh

---

### ADR-007: Meter Request Workflow

- **Context**
  - Tenant mobile app needs a structured way to submit meter readings for owner approval.
- **Decision**
  - Introduce **`meter_request_configs`** (per-building submission deadline configuration) and **`meter_requests`** (a monthly request cycle per building). Tenant submissions are tracked as `meter_readings` attached to the request.
- **Alternatives**
  - Simple upload-only with no structured approval workflow.
- **Consequences**
  - Owner can review and approve/reject tenant submissions per building per period.
  - Supports configurable deadlines via `deadline_day` and `period_offset`.
- **Date:** March–April 2026
- **Owner:** Bao Dinh

---

### ADR-008: Invoice Line Items Simplification

- **Context**
  - Original SDD designed `invoice_lines` with `item_type` enum (`RENT|ELECTRIC|WATER|SERVICE`), `quantity`, and `unit_price`. This required complex line-item computation during invoice generation.
- **Decision**
  - Use a simpler **`invoice_details`** table: only `label (text)` + `amount (numeric)`. Pre-computation is done via the `POST /invoices/calculate` endpoint before the owner confirms creation.
- **Alternatives**
  - Keep structured `invoice_lines` with `item_type` and `quantity`.
- **Consequences**
  - Simpler schema and generation logic. Less structured data for downstream analytics.
  - The `calculate` endpoint allows owners to preview and adjust before committing.
- **Date:** April 2026
- **Owner:** Bao Dinh

---

### ADR-009: Frontend Framework

- **Context**
  - Owner web dashboard needs a full-featured, SEO-capable, i18n-ready framework.
- **Decision**
  - Use **Next.js 16** (App Router) with **React 19**, **TailwindCSS v4**, **next-intl** for i18n, **flowbite** for UI components, and **react-hook-form + zod** for form validation.
- **Alternatives**
  - Vite + React SPA: no SSR, harder i18n.
  - Remix: smaller ecosystem.
- **Consequences**
  - App Router with `[locale]` param for bilingual (vi/en) support.
  - Full type-safety from API to form with Zod schemas.
- **Date:** March 2026
- **Owner:** Bao Dinh

---

### ADR-010: Tenant Mobile App

- **Context**
  - Tenants need a lightweight mobile app for meter submission and invoice viewing.
- **Decision**
  - Use **Expo 55** (React Native 0.83), **NativeWind v4** for styling, **TanStack Query v5** for data fetching, **i18next + react-i18next** for localization, and **expo-secure-store** for token storage.
- **Alternatives**
  - Native iOS/Android: higher cost, no code sharing.
  - Flutter: different language from web stack.
- **Consequences**
  - Shared TypeScript codebase with web via `packages/shared` and `packages/translations`.
  - Works on both iOS and Android via Expo Go / EAS Build.
- **Date:** March 2026
- **Owner:** Bao Dinh
