# PLAN: Redesigning Services and Pricing Architecture

## Objective

Simplify and decouple the Service and Pricing system. Remove date-based history (`effective_start` / `effective_end`), and change `price_rules` into reusable "Price Templates" that can be applied to any room.

## Analysis of User Request

- **Removal of History**: "Giá dịch vụ không cần ngày có hiệu lực, hay ngày kết thúc." -> The system no longer tracks historical pricing by dates. `effective_start` and `effective_end` will be completely removed.
- **Price Rules as Templates**: "Dịch vụ sẽ được tạo và người chủ có thể tạo ra các price_rule" -> A business owner creates a `Service` (e.g., Electricity) and then defines one or more `price_rules` for it (e.g., "Tier 1: 3500/kWh", "Tier 2: 4000/kWh").
- **Applying to Rooms**: "sau đó tại phần thêm dịch vụ và giá cho phòng, chỉ cần chọn dịch vụ và chọn price_rule đang có để áp dụng" -> Instead of duplicating prices or creating room-specific custom rules directly, rooms simply subscribe to an existing `price_rule`.

## Proposed Architecture Schema Changes

### 1. Modify `price_rules` Table

- **Drop columns**: `effective_start`, `effective_end`, `room_id`, `building_id`, `is_active`.
- **Add columns**: `name` (string, e.g., "Standard Price", optional but recommended for UI).
- **Core concept**: A `price_rule` now purely acts as a "Price Template" that belongs to a `service_id`.

### 2. New Table: `room_services`

Since rooms now _subscribe_ to a `price_rule`, we need a mapping table.

- **id**: UUID
- **room_id**: UUID (Foreign Key to `rooms`)
- **service_id**: UUID (Foreign Key to `services`)
- **price_rule_id**: UUID (Foreign Key to `price_rules`)
- **is_active**: Boolean (Defaults to true. Replaces the old toggle logic).

_Note: Alternatively, we can let `room_services` map `room_id` directly to `price_rule_id`, but adding `service_id` makes queries easier to prevent overlapping the same service._

## Execution Plan (Phase 2 - Parallel Implementation)

### Group 1: Database & Backend (database-architect, backend-specialist)

1. **Migration**:
   - Create migration to drop `effective_start`/`end`, `room_id`, `building_id` from `price_rules`.
   - Add `name` to `price_rules`.
   - Create the new `room_services` table.
2. **Models & Entities**: Re-generate SeaORM entities for `price_rules` and `room_services`.
3. **Backend API**:
   - `GET /services/:id/price-rules` -> List price templates for a service.
   - `POST /services/:id/price-rules` -> Create a new price template.
   - `POST /rooms/:id/services` -> Link a room to a specific `price_rule_id`.
   - `PUT /rooms/:id/services/:id` -> Change linked price rule or toggle `is_active` off.

### Group 2: Frontend (frontend-specialist)

1. **Services Page (`/dashboard/services`)**:
   - Update the UI so that clicking a Service allows the owner to manage its "Price Types/Rules" (e.g., Add "Standard Price - 3500", "VIP Price - 4000").
2. **Room Pricing Modal (`RoomPricingModal.tsx`)**:
   - Redesign completely: When a user selects a service tab, they select from a predefined dropdown list of `price_rules` for that service, rather than typing a custom unit price and effective date.
   - Retain the "Disable Service" toggle, which updates the `is_active` flag in `room_services`.

### Group 3: Testing & Validation (test-engineer, devops-engineer)

1. Run local tests.
2. Run database migration tests.
3. Validate API interactions and linting protocols.

## Approval Check

We are now entering the **PAUSE** checkpoint in the orchestration protocol. Please review this plan. If approved, we will spin up the backend, frontend, and database agents in parallel to execute it.
