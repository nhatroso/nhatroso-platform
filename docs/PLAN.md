# PLAN - Invoice Detail Page Refactor

## Objective

Convert the current slide-over `InvoiceDetailPanel` into a dedicated full page under `/dashboard/invoices/[id]`, replacing the side panel UI with a standard page layout.

## Goals & Requirements

- **Consistency**: Use the `PageHeader` component for the new page instead of the inline header from the panel.
- **Routing**: Update the main Invoices table so that clicking the "View Details" (Eye) action redirects the user to `/dashboard/invoices/[id]` instead of opening a local panel.
- **Data Fetching**: The new detail page will use the existing `getInvoice(id)` API service to fetch the single invoice data.
- **Actions**: Migrate `handlePay` and `handleVoid` logic to the new page.

## Detailed Steps

### 1. Simplify `useInvoices` Hook

- Remove `selectedInvoiceId` and `selectedInvoice` states.
- Remove `handleSelectInvoice` and `handleClosePanel`.
- (The routing to the detail page will be handled directly in the list view or via Next.js `useRouter`).

### 2. Update Main Invoices List Page (`src/app/[locale]/dashboard/invoices/page.tsx`)

- Remove the slide-over drawer UI at the bottom.
- Update the table action for viewing details:
  ```tsx
  <Link href={`/dashboard/invoices/${inv.id}`}>
    <button className="...">...</button>
  </Link>
  ```
  (or use `useRouter().push`)

### 3. Create the New Detail Page (`src/app/[locale]/dashboard/invoices/[id]/page.tsx`)

- Fetch the single invoice using `getInvoice(id)`.
- Replicate the breakdown and history views from `InvoiceDetailPanel`.
- Implement `handlePay` and `handleVoid` directly in the page using `voidInvoice` and `payInvoice` API services.
- Re-use the existing `PageHeader` component.

### 4. Remove `InvoiceDetailPanel.tsx`

- Delete `src/components/invoices/InvoiceDetailPanel.tsx` once the page is fully implemented and tested.

## Verification

- Test clicking an invoice to ensure routing to `/dashboard/invoices/[id]`.
- Trigger void and pay actions to verify they still work correctly.
- Ensure translations for strings exist in `Invoices` locale namespace.
