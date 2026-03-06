# 🌐 i18n Integration Plan (Production-Ready)

This document outlines the architecture and implementation steps for integrating multi-language support (i18n) across the NHATROSO platform, based on a client-side translation model driven by backend error codes.

## 1️⃣ Scope (Phạm vi áp dụng)

- **Backend (Rust/Loco)**: KHÔNG thực hiện i18n. Backend chỉ đảm nhiệm logic và trả về các mã lỗi (`error.code`) được chuẩn hóa. Không xử lý header `Accept-Language`.
- **Frontend (Web + Mobile)**: Toàn bộ việc dịch thuật, formatting (ngày, số) hiển thị ở phía Client. Nhận `error.code` từ API và tự map với nội dung ngôn ngữ đang chọn.

Ví dụ API Response chuẩn hóa:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Fallback human readable message (optional, English)"
  }
}
```

## 2️⃣ Supported Locales (Ngôn ngữ)

- **Mặc định (Default)**: `vi` (Tiếng Việt)
- **Hỗ trợ (Supported)**: `vi`, `en` (Tiếng Anh)
- _Lưu ý_: Chưa hỗ trợ hệ ngôn ngữ RTL (Right-to-Left) trong phase này.

## 3️⃣ Tech Stack (Công nghệ)

- **Web (Next.js 16 - App Router - RSC)**: Sử dụng `next-intl` (tối ưu mạnh mẽ cho App Router và Server Components, giúp SEO tốt và load nhanh).
- **Mobile (React Native/Expo)**: Sử dụng `i18next` kết hợp với `react-i18next`.
- **Backend (Rust/Loco)**: Chuẩn hóa Error Enum, serialize thành JSON trả về `code` dạng string (Pattern: `{DOMAIN}_{ERROR_NAME}`).

## 4️⃣ Architecture & Packages (Kiến trúc)

Tạo một Shared Package chuyên dụng cho việc quản lý ngôn ngữ để Web và Mobile dùng chung file JSON, đảm bảo đồng nhất nội dung 100%.

```
packages/translations/
├── package.json
├── src/
│   ├── index.ts
│   ├── locales/
│   │   ├── vi/
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   └── errors.json
│   │   └── en/
│   │       ├── common.json
│   │       ├── auth.json
│   │       └── errors.json
```

---

## 5️⃣ Implementation Phases (Các bước thực hiện)

### Phase 1: Chuẩn hóa Backend Error Codes

1. Tạo module quản lý mã lỗi chuẩn trong backend (`apps/api/server-api/src/errors.rs` hoặc update file hiện tại).
2. Refactor các Error Enum (như Auth) sang dạng chuẩn (ví dụ: `AppError::AuthInvalidCredentials` -> serialize thành `AUTH_INVALID_CREDENTIALS`).
3. Cập nhật các controller để wrap JSON response lỗi theo định dạng `{"success": false, "error": {"code": "..."}}`.

### Phase 2: Khởi tạo Package `@nhatroso/translations`

1. Khởi tạo `packages/translations`.
2. Tạo cấu trúc thư mục từ điển (JSON) cho `vi` và `en`.
3. Định nghĩa các key chuẩn như `errors.AUTH_INVALID_CREDENTIALS`.
4. Export config và type (nếu chia sẻ được interface translation).

### Phase 3: Tích hợp Web (Next.js) với `next-intl`

1. Cài đặt dependency `next-intl` vào `apps/web`.
2. Setup middleware để handle routing language (`/vi/dashboard`, `/en/dashboard`) hoặc qua cookie (tuỳ chiến lược SEO, default URL).
3. Connect thư viện `@nhatroso/translations` vào Provider của Web.
4. Cập nhật UI (Login, Register) và Error Handler để thay vì dùng message raw hiển thị translation `t('errors.' + errorCode)`.

### Phase 4: Tích hợp Mobile (Tương lai)

1. Cài đặt `i18next` và `react-i18next`.
2. Boot i18n instance với từ điển từ `@nhatroso/translations`.
3. Tích hợp `react-native-localize` để detect cờ ngôn ngữ thiết bị.

---

## 6️⃣ Rules & Best Practices

- **No Hardcoded Strings**: Tuyệt đối không hardcode text tiếng Việt hay tiếng Anh trong các Next.js/React component. Gọi hàm `t('namespace.key')`.
- **Code Chuẩn**: Code lỗi phải theo định dạng `{DOMAIN}_{ERROR_NAME}`. Ví dụ: `AUTH_MISSING_TOKEN`, `USER_NOT_FOUND`, `PROPERTY_INVALID_PRICE`.
