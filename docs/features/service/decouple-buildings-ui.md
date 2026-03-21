# Decouple Buildings, Floors, and Rooms UI

This document outlines the plan to separate the Building, Floor, and Room management interfaces into distinct pages and nest them within the sidebar, according to the `frontend-specialist` design principles.

## 1. Backend Updates (Data Fetching)

Currently, the backend only supports fetching floors/rooms by a specific parent ID. To list all floors/rooms by default, we need owner-scoped queries.

- **`apps/api/server-api/src/models/floors.rs` & `rooms.rs`**: Add `list_all_by_owner` methods.
- **`apps/api/server-api/src/controllers/floors.rs` & `rooms.rs`**: Add `GET /api/v1/floors` and `GET /api/v1/rooms` routes.

## 2. Frontend API Updates

- **`apps/web/src/services/api/buildings.ts`**: Add `getAllFloors()`.
- **`apps/web/src/services/api/rooms.ts`**: Add `getAllRooms()`.

## 3. Sidebar UI Updates

- **`apps/web/src/components/layout/Sidebar.tsx`**:
  - Change the "Buildings" menu item to a parent group named "Properties" (hoặc "Bất động sản" via i18n).
  - Add nested items: "Tòa nhà" (`/dashboard/buildings`), "Tầng" (`/dashboard/floors`), and "Phòng" (`/dashboard/rooms`).
  - Implement basic Dropdown/Accordion state for the standard Sidebar behavior.

## 4. UI Pages

- **`apps/web/src/app/[locale]/dashboard/floors/page.tsx`** [NEW]
  - Displays a Table/List of all floors across all buildings.
  - Includes a dropdown at the top to filter by "Building".
- **`apps/web/src/app/[locale]/dashboard/rooms/page.tsx`** [NEW]
  - Displays a Table/List of all rooms.
  - Includes cascading filters at the top: "Building" -> "Floor".
- **`apps/web/src/components/buildings/BuildingDetailPanel.tsx`** [MODIFY]
  - Remove the internal 'spaces' tab (which rendered `SpaceManager`).
  - Add explicit call-to-action buttons: "Quản lý Tầng" and "Quản lý Phòng" pointing to their respective new pages with `?buildingId=[id]`.

## 5. Verification Plan

- **Backend Tests**: Run `cargo test` in backend to ensure new endpoints compile and work.
- **Frontend Build**: Run `pnpm run typecheck` to verify no broken imports from the extracted components.
- **Manual UI Check**: Visit the browser proxy to ensure sidebar toggles correctly, pages render the flat list of all items,, and url params (`?buildingId=X`) auto-select the dropdowns.
