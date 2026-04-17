# Mobile Invoice Integration Plan

## Objective

Enable tenants to view and pay their invoices directly from the mobile app. This requires backend schema improvements for security and a new mobile invoice feature.

## Domains & Agents

- **Backend/Database**: `backend-specialist`, `database-architect`
- **Mobile UI**: `mobile-developer`
- **Security**: `security-auditor`
- **Testing**: `test-engineer`

## Phase 1: Planning (Current)

- [x] Analyze current mobile and backend state.
- [/] Create `docs/PLAN.md` and get user approval.

## Phase 2: Implementation (Implementation)

### 1. Database & Backend Foundation

- [ ] **Migration**: Add `room_id` (Uuid, non-nullable) and `landlord_id` (Uuid, non-nullable) to the `invoices` table.
- [ ] **Model Update**: Update `InvoiceModel::create` to populate these fields.
- [ ] **API Security**: Update `InvoiceModel::list` and `InvoiceModel::get_one` to filter results based on the current user's role:
  - Landlords: see all invoices for their rooms.
  - Tenants: see only invoices belonging to their rooms.

### 2. Mobile Service Implementation

- [ ] **API Client**: Create `apps/mobile/src/api/invoice.ts` with `getMyInvoices` and `getInvoiceDetail`.
- [ ] **Hook**: Create `apps/mobile/src/hooks/useInvoices.ts` for fetching and managing invoice state.

### 3. Mobile UI Integration

- [ ] **Dashboard Update**: Replace static "Rent Balance" and "Due Date" on the dashboard with real-time data from the latest unpaid invoice.
- [ ] **Invoice Screen**: Create a new screen or modal to show the full list of invoices (paid and unpaid).
- [ ] **Payment Workflow**: Integrate a "Pay Now" action that triggers the backend payment process.

## Verification Plan

1. **Security Scan**: Run `security_scan.py` to ensure tenants cannot see other tenants' invoices.
2. **Linting**: Run `pnpm check` and `cargo clippy`.
3. **Manual Test**: Verify on mobile dashboard that the "Rent Balance" reflects the server's data.
