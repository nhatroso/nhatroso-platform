# Invoice Management - Execution Plan

## 1. Overview

The goal is to implement the **Invoice Management** feature (REQ-016), allowing Owners to manually generate, void, and track invoices with an audit trail of status changes.

### Core Entities

- **Invoice**: `id`, `room_code`, `tenant_name`, `breakdown` (JSON of services/utilities), `total_amount`, `status` (`UNPAID`, `PENDING_CONFIRMATION`, `PAID`, `VOIDED`), `created_at`, `updated_at`.
- **InvoiceStatusHistory**: `id`, `invoice_id`, `from_status` (nullable), `to_status`, `reason` (nullable for VOIDED), `timestamp`, `actor_id` (Owner), `created_at`.

---

## 2. Breakdown of Work (Orchestration Phase 2)

### A. Foundation & Data (`database-architect`, `security-auditor`)

1. **Migrations**:
   - Create `invoices` table.
   - Create `invoice_status_history` table.
2. **Models**: Generate Loco/SeaORM entities for `invoices` and `invoice_status_history`.
3. **Security**: Ensure only users with the `Owner` role can create, transition statuses, or void invoices.

### B. Core Implementation (`backend-specialist`, `frontend-specialist`)

1. **Backend API Endpoints** (in `server-api`):
   - `POST /api/invoices`: Create invoice manually (from Contract/MeterReading context).
   - `GET /api/invoices`: List all invoices.
   - `GET /api/invoices/:id`: Get invoice details + history.
   - `POST /api/invoices/:id/void`: Void invoice (requires reason).
   - `POST /api/invoices/:id/pay`: Mark invoice as paid (Owner manual trigger).
   - `POST /api/invoices/webhook`: Webhook endpoint for automatic payment reconciliation.
2. **Frontend UI** (in `web` or platform equivalent):
   - **Invoice List Page**: View all invoices, filtering by status.
   - **Invoice Detail Modal/Page**: View breakdown, total amount, room code, tenant name, and status history.
   - **Void Action**: Modal to prompt for mandatory void reason.

### C. Polish & Quality (`test-engineer`)

1. **Validation Tests**:
   - Cannot void without a reason.
   - Only allowed status transitions work.
   - Only Owners can manage invoices.
2. **Endpoint Tests**: Validating `GET`, `POST`, and state-changing actions using Loco's `rstest` setup.

---

## 3. Execution Protocol

Upon approval of this plan, the orchestrator will invoke the backend, frontend, database, and testing agents in parallel to complete the feature, followed by automated verification checks.
