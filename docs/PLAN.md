# Contract Phone Lookup Feature Plan

## Overview

This plan outlines the implementation of a new flow for creating rental contracts. When entering a tenant's phone number, the system will automatically look up the user. If the user doesn't exist, an account will be automatically provisioned for them. If the user does exist, their information is autofilled, and a warning is shown if they already have an active contract.

## Project Type

WEB/BACKEND

## Tech Stack

- **Backend:** Loco (Rust), SeaORM, PostgreSQL
- **Frontend:** Next.js (React), TailwindCSS, React Hook Form, Zod

## Success Criteria

- [ ] Users can enter a phone number and see autofilled info if the tenant exists.
- [ ] A warning appears if the tenant already has an active contract.
- [ ] Submitting the contract automatically creates a new tenant user account with a default password (`abc@123`) if they didn't exist previously.
- [ ] The new contract is properly linked to the tenant account via the `contract_tenants` table.

## File Structure

- `apps/api/server-api/src/controllers/users.rs` (New or Modified)
- `apps/api/server-api/src/controllers/contracts.rs` (Modified)
- `apps/web/src/app/[locale]/dashboard/contracts/create/page.tsx` (Modified)
- `packages/shared/src/schemas/users.ts` (Modified)

## Task Breakdown

### Task 1: Create User Lookup API

- **Agent:** `backend-specialist`
- **Description:** Implement `GET /api/v1/users/lookup?phone=...` endpoint.
- **INPUT:** Phone number via query param.
- **OUTPUT:** JSON `{ "exists": boolean, "user": Object, "has_active_contract": boolean }`.
- **VERIFY:** Call API with a known phone number and verify the output structure.

### Task 2: Update Create Contract Endpoint

- **Agent:** `backend-specialist`
- **Description:** Update `POST /api/v1/contracts` to handle auto-provisioning. Check if the tenant phone exists; if not, create a new `User` with role "TENANT" and password hash of `abc@123`. After creating the contract, create a linked record in `contract_tenants`.
- **INPUT:** `CreateContractParams` JSON payload.
- **OUTPUT:** Created contract JSON.
- **VERIFY:** Submit a contract with a new phone number and check the `users` and `contract_tenants` tables in DB to ensure the tenant was created and linked.

### Task 3: Frontend Phone Lookup Integration

- **Agent:** `frontend-specialist`
- **Description:** Update `apps/web/src/app/[locale]/dashboard/contracts/create/page.tsx`. Add `onBlur` or a debounce effect on the phone number input to call the lookup API. Autofill the form if user exists, show warning block if active contract exists. Khóa (disable/readonly) các trường thông tin người dùng được autofill để không cho phép thay đổi thông tin User khi tạo hợp đồng.
- **INPUT:** Lookup API response.
- **OUTPUT:** UI changes (Autofill + Readonly User Fields + Warning message).
- **VERIFY:** Type an existing phone number and see the form fields populate and become read-only.

## Phase X: Verification

- [ ] Lint: `npm run lint` and `cargo clippy -- -D warnings`
- [ ] Security: run `security_scan.py`
- [ ] Build: `npm run build` and `cargo build`
