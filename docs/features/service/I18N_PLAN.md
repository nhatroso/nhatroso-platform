# PLAN: Completing Service & Pricing Localization (I18N)

## Objective

Eliminate all hardcoded strings (Vietnamese and English) from the Service Management dashboard and the Room Pricing modal. Ensure a 100% localized experience for both `vi` and `en` locales.

## Analysis of Hardcoded Strings

### 1. `RoomPricingModal.tsx`

- **Validation Errors**: e.g., "Vui lòng chọn hoặc tạo giá cho dịch vụ này."
- **Success Messages**: e.g., "Cấu hình dịch vụ đã được lưu thành công!"
- **Section Headers**: e.g., "Thiết lập giá cho phòng", "Chọn bảng giá áp dụng"
- **Status Indicators**: e.g., "Chưa áp dụng!", "Đang chọn: {t.name}"
- **Buttons**: e.g., "Lưu cấu hình", "Hủy áp dụng dịch vụ"

### 2. `services/page.tsx`

- **Predefined Data**: `PREDEFINED_SERVICES` names are hardcoded.
- **Empty States**: e.g., "No price templates defined yet.", "Select a predefined service..."
- **Form Labels/Placeholders**: e.g., "Standard Price", "Template Name", "Initial Price"
- **Interactive Prompts**: e.g., "Add {name}", "Disable Service", "Edit Template"
- **Confirmations**: e.g., "Delete this template? ..."

## Proposed Changes

### 1. Update `packages/translations/src/locales/vi/services.json` & `en/services.json`

Add missing keys for:

- `PriceRuleLabel`, `SelectPriceRule`, `AddPredefinedService`, `ActiveServicesCount`
- `ErrorSelectPriceRule`, `SuccessSaveConfig`
- `ConfirmDeleteTemplate`, `ConfirmArchiveService`
- `QuickAddTitle`, `QuickAddDescription`, `EnableServiceAndSavePrice`
- `Predefined_Electricity`, `Predefined_Water`, etc.

### 2. Refactor `RoomPricingModal.tsx`

- Use `tServices()` for all hardcoded strings.
- Ensure pluralization/placeholders are handled (e.g., `Turn off to completely disable {name}`).

### 3. Refactor `services/page.tsx`

- Move `PREDEFINED_SERVICES` names to translation keys.
- Replace all JSX text and alert/confirm strings with `tServices()`.

## Orchestration Strategy (Phase 2)

Once approved, I will coordinate the following:

- **project-planner**: Finalize task breakdown in `task.md`.
- **frontend-specialist**: Update React components (`RoomPricingModal.tsx`, `services/page.tsx`).
- **documentation-writer**: Verify and sync `vi/services.json` and `en/services.json`.
- **test-engineer**: Run `lint_runner.py` to ensure no regressions.

## Approval Required

Please review and approve this plan. Once approved, I will initiate Phase 2.
