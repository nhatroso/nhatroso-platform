# Landlord Meter Management Feature - PLAN.md

## Overview

Implement a comprehensive "Meter Reading Management" dashboard for landlords to track energy and water submissions across all properties. This feature aims to provide a "SaaS-style" professional experience with real-time status tracking and bulk management capabilities.

## Architecture & Components

### Backend (Rust/Loco)

1. **Controller**: `meters.rs`
   - `GET /api/v1/meters/landlord-summary` -> Monthly breakdown (Pending/Overdue/Done).
2. **Model**: `meters.rs`
   - Helper methods for building-wide status queries.

### Frontend (Next.js/React)

1. **Dashboard Page**: `/dashboard/meters`
   - `StatsHeader`: KPI cards (Submission Rate, Pending, Overdue).
   - `BuildingProgress`: Visual progress bars/circles for each building.
   - `MetersMasterList`: Advanced table with status filtering, room search, and quick actions.
2. **Navigation**: Update Sidebar for Landlord role.

## UI/UX Requirements (SaaS Pro Max)

- **Status Badges**: Premium styling (Submitted = Green, Pending = Yellow, Overdue = Red).
- **Interactive Filtering**: Filter by Building, Floor, Service Type, and Month.
- **Empty States**: Clear guidance when no meters exist.
- **Micro-animations**: Smooth transitions for status changes.

## Verification

- [ ] Backend unit tests for summary logic.
- [ ] Frontend E2E tests for navigation and filtering.
- [ ] Accessibility audit (ARIA labels, keyboard navigation).
- [ ] Performance profiling (Lighthouse check).

---

Created by `orchestrator` following `/orchestrate` workflow.
