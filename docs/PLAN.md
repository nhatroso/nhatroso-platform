## 🎼 Orchestration Plan: Lập Hợp Đồng Thuê Trọ (Rental Contract Feature)

### Phase 1: Planning (Agent: project-planner)

This document outlines the detailed plan to implement the "Lập Hợp Đồng" (Contract Creation) feature based on the `docs/hop-dong-thue-tro.html` template.

#### 1. Analysis of Requirements & Missing Data
Based on the provided HTML template, a legal rental contract in Vietnam requires extensive details for both Party A (Lessor/Landlord) and Party B (Lessee/Tenant). Current `contracts` schema only stores basic relation `room_id`, `status`, `start_date`, `end_date`, `payment_cycle`, and `deposit_amount`. 

For legal safety and history tracking, the contract must **snapshot** the personal details at the moment of signing.

**Fields to add to `contracts` table (via a new DB migration):**
- **Party A (Landlord) Snapshot:**
  - `landlord_name` (String)
  - `landlord_id_card` (String) - CMND/CCCD
  - `landlord_id_date` (Date) - Ngày cấp
  - `landlord_address` (Text) - Địa chỉ thường trú
  - `landlord_phone` (String)
- **Party B (Tenant) Snapshot:**
  - `tenant_name` (String)
  - `tenant_id_card` (String)
  - `tenant_id_date` (Date)
  - `tenant_address` (Text)
  - `tenant_phone` (String)

#### 2. Backend (SeaORM + Axum) Implementation
- **Migration:** Formulate a new migration `m2026xxxx_add_party_details_to_contracts.rs` to add the new 10 columns to `contracts` table.
- **Entities & Schemas:** Update `contracts::Model` in Rust.
- **Shared Types:** Update `packages/shared/src/schemas/contracts.ts` to include these fields in `CreateContractInput` and `UpdateContractInput`.
- **Controllers:** Adjust `apps/api/server-api/src/controllers/contracts.rs` to persist these fields. If a user doesn't provide them, fallback to their current Profile/User data (if available).

#### 3. Frontend (React + Next.js/Vite) Implementation
- Update the **Create Contract Form** (`apps/web`): 
  - Section 1: Thông tin Bên Cho Thuê (Auto-filled from Landlord's profile, but editable).
  - Section 2: Thông tin Bên Thuê (Inputs for tenant identity details).
  - Section 3: Điều khoản hợp đồng (Room, dates, deposit, payment cycle).
- **Contract Preview/Print:**
  - Create a new route/component (e.g., `/contracts/:id/print`) that renders exactly like `docs/hop-dong-thue-tro.html`.
  - Populate the HTML template with the actual `contract` data from the DB.

#### 4. System Verification & Security
- Unit Tests / Integration tests to verify contract creation with the new fields.
- Ensure correct RBAC: Only building owners can create/view contracts. Tenants can view their own contracts.
- Final scripts verification as required by TIER 1 rules (`security_scan.py`, `lint_runner.py`).

### Proposed Orchestration Phase 2 (Parallel Execution)
If approved, I will coordinate the following agents to execute:
1. `database-architect`: Create migration and update Rust models.
2. `backend-specialist`: Update shared schemas, Axum API, and tests.
3. `frontend-specialist`: Build the form and the print template in the web app.

---
**Requesting User Approval to proceed.**
