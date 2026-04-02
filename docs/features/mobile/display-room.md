# Plan: Display Current Room Information for Tenants

## Overview

This task aims to implement a dynamic room information screen for tenants in the mobile application. Currently, the `room.tsx` file displays static data. We will fetch "live" data from the backend by creating a dedicated tenant endpoint and integrating it into the mobile frontend.

## 👥 Agents Involved

| Agent                | Role                                                       |
| -------------------- | ---------------------------------------------------------- |
| `project-planner`    | Strategic planning and task breakdown                      |
| `backend-specialist` | API implementation in Rust (Loco framework)                |
| `mobile-developer`   | UI implementation and data fetching in React Native (Expo) |
| `test-engineer`      | Verification and validation                                |

## 🛠️ Phase 1: Planning

1. **Discovery**:
   - [x] Identified that tenants are linked to rooms via `Contracts` and `ContractTenants`.
   - [x] Confirmed the existence of Room and Contract models in the Rust backend.
2. **Architecture**:
   - **Backend**: Add a new controller method `get_my_room` in `controllers/rooms.rs` (or a new `tenant/rooms` controller) that:
     - Uses the current user's ID from the JWT.
     - Joins `contracts` and `contract_tenants` to find the active room ID.
     - Returns room details (code, building address, floor, area, and service prices).
   - **Mobile**:
     - Update `apps/mobile/src/services/api` to include a method for fetching the tenant's room.
     - Use `react-query` or similar (check existing patterns) to fetch and display the data in `apps/mobile/app/(tabs)/room.tsx`.

## 🏗️ Phase 2: Implementation (After Approval)

### Step 1: Backend Implementation (`backend-specialist`)

- Create a new route `GET /api/v1/tenant/room`.
- Implement logic to find the active contract for the current tenant.
- Return the room and building information.
- Include service price information (electricity, water) which might be in `price_rules` or `services`.

### Step 2: Mobile Frontend Implementation (`mobile-developer`)

- Update the API client to support the new endpoint.
- Enhance `RoomScreen` in `room.tsx` to handle loading, error, and data states.
- Map the API response to the UI components (Bed, MapPin, Hash, Ruler icons).

### Step 3: Verification (`test-engineer`)

- Run `python .agent/scripts/checklist.py .`
- Manually verify the data display if possible (using mock data in dev if backend is not fully ready).

## 🚦 Verification Criteria

- [ ] Tenant can see their room code, address, and floor correctly.
- [ ] Monthly expenses (rent, electricity, water prices) are pulled from the backend.
- [ ] Loading state is handled gracefully.
- [ ] Error state (e.g., no active contract) is handled with a clear message.
