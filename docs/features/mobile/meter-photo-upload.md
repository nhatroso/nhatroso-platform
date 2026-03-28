# Implementation Plan - Meter Photo Upload

This plan outlines the implementation of a feature allowing tenants to submit meter readings with photo evidence (camera or gallery) on the mobile app after a landlord request.

## Proposed Changes

### Backend (Rust - `apps/api/server-api`)

- **Action**: Implement a simple file upload endpoint.
- **Endpoint**: `POST /init-upload`: Handle multipart/form-data.
- **Location**: Store locally in `static/uploads` (for development).
- **Model**: `meter_readings` already has `image_url` (nullable), just need to ensure the submission API accepts it.

### Mobile (Expo - `apps/mobile`)

- **Dependencies**:
  - `expo-image-picker`: To capture or select photos.
  - `expo-file-system`: For potential local file handling.
- **UI/UX**:
  - Update `meter-submission.tsx` to handle photo capture.
  - Show a small image preview.
- **API (api/meter.ts)**:
  - Add `uploadImage` method.
  - Update `submitReading` to accept `image_url`.

## Verification Plan

### Automated Tests

- Backend walkthrough with `cargo check`.
- (Manual) Verify the upload service returns a valid URL.

### Manual Verification

1. Login as Tenant on Mobile.
2. Select "Report Meter Reading".
3. Click "Add Photo Evidence".
4. Capture or pick an image.
5. Verify preview displays.
6. Submit and verify reading is saved with the URL.
