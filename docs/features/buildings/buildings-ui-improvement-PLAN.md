# Buildings UI Improvement Plan

## Goal Description
The user requested an improvement to the `/dashboard/buildings` UI, specifically finding the current layout "rườm rà và rối" (cluttered and confusing). The primary tasks are to clean up the main page layout, refine the Building list and detail views, and completely redesign the `SpaceManager` to avoid the cumbersome 3-column hierarchical selection. The design will strictly adhere to Flowbite + Tailwind v4.

## Proposed Changes

### 1. Overall Page Layout (`apps/web/src/app/[locale]/dashboard/buildings/page.tsx`)
- Simplify the layout structure. Use clean, rounded cards with subtle drop shadows instead of harsh borders.
- Keep the Master-Detail split but ensure the Detail Panel feels deeply integrated rather than forced into the space.

### 2. Building Detail Panel & Stream (`BuildingDetailPanel.tsx` & `BuildingStream.tsx`)
#### [MODIFY] `apps/web/src/components/buildings/BuildingStream.tsx`
- Make the building list look cleaner. Add active states using Flowbite's primary blue theme.
- Ensure the header "Buildings" is prominent and the "Create New" button is clear.

#### [MODIFY] `apps/web/src/components/buildings/BuildingDetailPanel.tsx`
- Improve the Tab UI to use Tailwind/Flowbite default tab styles (cleaner underlines).
- Refine the form inputs for creating/editing a building.

### 3. SpaceManager Redesign (`SpaceManager.tsx` and sub-components)
#### [MODIFY] `apps/web/src/components/buildings/SpaceManager.tsx`
- **Completely remove the 3-column layout.**
- Introduce an **Accordion-based hierarchical list**. 
- The root will display a list of `Blocks`.
- Clicking a `Block` expands to show its `Floors`.
- Clicking a `Floor` expands to show its `Rooms` in a wrap-around grid.
- Forms to add new Blocks/Floors/Rooms will be integrated cleanly at each accordion level or via small "Add" buttons that pop up inline inputs.

#### [MODIFY] `apps/web/src/components/buildings/BlockList.tsx`
- Instead of just a list, each block will render as a collapsible accordion item or an expandable block.

#### [MODIFY] `apps/web/src/components/buildings/FloorList.tsx`
- Rendered inside an expanded Block.

#### [MODIFY] `apps/web/src/components/buildings/RoomList.tsx`
- Renders as a crisp grid of room chips/cards inside an expanded Floor.

## Verification Plan

### Automated/Lint Checks
- Run `pnpm check` to verify TypeScript builds successfully after the heavy refactoring of `SpaceManager`.
- Run `pnpm lint` in `apps/web`.

### Manual Verification
1. Access `http://localhost:3000/dashboard/buildings`.
2. Notice the cleaner layout of the building list.
3. Select a building, navigate to "Manage Spaces".
4. Verify that SpaceManager is now a single-column, easy-to-scroll Accordion or Tree rather than 3 side-by-side locked columns.
5. Test creating a new Block, Floor, and Room within this new UI to ensure data fetching refetch functions correctly.
