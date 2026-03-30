# Mobile Implementation Plan - Nhatroso Platform (Tenant App)

## Goal

Build a user-friendly, premium mobile application for **tenants** of the Nhatroso Platform. The app will empower tenants to manage their living space, track expenses, and communicate meter readings efficiently.

## Phase 1: Planning & Setup [CURRENT]

- [ ] Define Tech Stack: Expo Router (v3+), NativeWind v4, Lucide React Native, TanStack Query, Expo Camera.
- [ ] Define Tenant Flow: Login -> My Room Dashboard -> Meter Reporting.
- [ ] Setup API client with Tenant context (shared types from `@nhatroso/shared`).

## Phase 2: Foundation & Auth

- [ ] Implement Tenant Login: Focus on mobile-first auth experience.
- [ ] Core Navigation: Simple Tab Bar (Dashboard, Room, Profile).
- [ ] Design System: Tenant-friendly theme (Clean, clear status indicators).

## Phase 3: Core Features

- [ ] **My Room Dashboard**: Summary of current stay, due dates, and last meter readings.
- [ ] **Room Details**: View contract info, room amenities, and pricing.
- [ ] **Meter Self-Reporting**:
  - [ ] Camera integration using `expo-camera`.
  - [ ] Photo upload with preview and confirmation.
  - [ ] History of reported readings.

## Phase 4: Polish & Verification

- [ ] Smooth transitions and localized feedback (Vietnamese/English).
- [ ] Performance audit for low-end devices.
- [ ] Verification with `test-engineer`.

## Verification Plan

### Manual Verification

- Test on iOS Simulator / Android Emulator.
- Verify API connectivity to the local Rust backend.
- Test "recorded" meter reading flow.

### Scripts

- `pnpm lint` in `apps/mobile`.
- `test_runner.py` for unit tests.
