# Buildings Frontend Implementation Plan

## Overview

This plan details the frontend implementation for the Buildings API (Property Management). The goal is to create a robust, uniquely designed UI that interacts with the Rust backend for creating, listing, updating, and archiving buildings.

## Design Commitment: Brutalist/Sharp Minimalist

Following the `frontend-specialist` principles, we will avoid "Standard SaaS" clichés (like rounded Bento boxes or standard split layouts).

- **Style:** Minimalist with Sharp Geometry.
- **Palette:** High-Contrast Monochrome (Zincs) with **Signal Orange** accents for primary actions. Absolutely NO PURPLE.
- **Layout Uniqueness:** Instead of a basic table, we will use a "Continuous Stream" of sharp-edged property cards. Selecting a building opens an "Extreme Asymmetry (70/30)" split where the details/edit form takes over the screen aggressively.
- **Typography:** Strong, hierarchical sans-serif with aggressive font weights for data points.

## Proposed Changes

### 1. API Integration Service

- **[NEW]** `apps/web/src/services/api/buildings.ts`: Export strongly-typed functions wrapping `fetch` for:
  - `getBuildings()`
  - `createBuilding(data)`
  - `updateBuilding(id, data)`
  - `archiveBuilding(id)`

### 2. Frontend Components

- **[NEW]** `apps/web/src/app/[locale]/dashboard/buildings/page.tsx`:
  - Fetch buildings on load.
  - Render the "Continuous Stream" of building cards.
  - Implement a sleek, sharp-edged modal or side-panel for creating/editing properties.
- **[NEW]** `apps/web/src/app/[locale]/dashboard/buildings/components/BuildingCard.tsx`:
  - Custom visual component for an individual building.
  - Contains "Edit" and "Archive" actions.
- **[NEW]** `apps/web/src/app/[locale]/dashboard/buildings/components/BuildingForm.tsx`:
  - Uses `react-hook-form` and `zod` for validation.
  - Handles name and optional address fields.

### 3. Translation Keys

- **[MODIFY]** `packages/translations/src/locales/en.json` (and `vi.json` if exists):
  - Add keys for building creation, edit, and archive error messages (especially the `409 Conflict` rule: "Cannot archive building with active rooms").

## Verification Plan

### Automated Tests

- Since testing might require a full E2E setup, we will focus on typechecking and linting.
- Run `pnpm check` (which includes `tsc --noEmit` and `eslint`) in `apps/web`.

### Manual Verification

1. Open the browser at `http://localhost:3000/dashboard/buildings`.
2. Add a new building using the Create form.
3. Edit the newly created building's name or address.
4. Archive the building and verify it disappears or visually changes to an "Archived" state.
5. (Optional Mock) Try archiving a building with occupied rooms to verify the 409 error UI displays correctly from the translations.
