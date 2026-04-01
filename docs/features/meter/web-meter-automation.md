# Web Frontend Meter Automation Plan

## Overview

Implement the Landlord portal UI to manage meter reading request configurations and view generated requests from tenants.

## Project Type

**WEB** (Next.js React app)

## Success Criteria

1. Landlords can configure `day_of_month`, `grace_days`, and toggle `auto_generate` via a new Settings page or Modal.
2. Landlords can view a list of all `meter_requests` generated for their properties/rooms.
3. Landlords can view the submitted electricity and water usage images for "SUBMITTED" requests.

## Tech Stack

- **Framework**: Next.js (App Router likely). React components.
- **Styling**: TailwindCSS. Flowbite
- **Data Fetching**: Custom API services to Rust backend.

## File Structure

```text
apps/web/
├── src/app/(dashboard)/meter-settings/page.tsx
├── src/app/(dashboard)/meter-requests/page.tsx
├── src/components/meter-requests/MeterConfigForm.tsx
├── src/components/meter-requests/MeterRequestsTable.tsx
├── src/services/meterRequests.ts
```

## Task Breakdown

### Task 1: API Service Integration

- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`, `clean-code`
- **Priority**: P0
- **INPUT**: Rust Backend API endpoints for fetching configs and request lists.
- **OUTPUT**: `src/services/meterRequests.ts` with API bound functions.
- **VERIFY**: Run type-checking `npx tsc --noEmit` locally.

### Task 2: Meter Settings UI

- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 1
- **INPUT**: The settings requirements.
- **OUTPUT**: A `MeterConfigForm` component and page to read/update the existing landlord automation config.
- **VERIFY**: Visual verify form states (loading, error, success).

### Task 3: Meter Requests Dashboard

- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 1
- **INPUT**: Need to view the scheduled and completed readings.
- **OUTPUT**: A robust `MeterRequestsTable` that maps different status indicators and presents modal view for submitted utility images.
- **VERIFY**: UI renders correctly in Next.js.

## ✅ Phase X: Verification Complete Checklist

- [ ] Project Lint: `npm run lint`
- [ ] Type Check: `npx tsc --noEmit`
- [ ] UX Audit: `python .agent/skills/frontend-design/scripts/ux_audit.py .`
- [ ] Rule Compliance check (No standard templates, thoughtful UI)
