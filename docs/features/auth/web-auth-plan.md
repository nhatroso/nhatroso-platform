# 🎼 Web Auth Frontend Plan

This plan outlines the implementation of the authentication feature for the NHATROSO web application, aligning with the phone-primary refactor in the backend.

## 🤖 Orchestration Context

- **Agents Invoked**: `project-planner`, `frontend-specialist`, `security-auditor`, `test-engineer`
- **Goal**: Full Auth flow (Register, Login, Dashboard, Logout) using Next.js 16, Tailwind 4, and `@nhatroso/shared`.
- **Backend Decisions**: Server-driven auth, HttpOnly cookies via Route Handlers, Phone-primary, Name mandatory.

## Proposed Changes

### [web] (Next.js Application)

#### [MODIFY] [package.json](file:///Users/kasperdinh/Dev/nhatroso-platform/apps/web/package.json)

- Add `@nhatroso/shared` (workspace version) to dependencies.
- Add `lucide-react`, `clsx`, `tailwind-merge` for UI components.

#### [NEW] [route.ts](file:///Users/kasperdinh/Dev/nhatroso-platform/apps/web/src/app/api/auth/route.ts)

- Proxy `/api/auth/register` and `/api/auth/login` to the Rust server.
- Set `HttpOnly` token cookie on success.

#### [NEW] [components](file:///Users/kasperdinh/Dev/nhatroso-platform/apps/web/src/components/ui)

- Base components (Button, Input, Card) following `shadcn/ui` aesthetics and Tailwind 4.

#### [NEW] [register/page.tsx](<file:///Users/kasperdinh/Dev/nhatroso-platform/apps/web/src/app/(auth)/register/page.tsx>)

- Implementation of the registration form with validation for `phone` and `name`.

#### [NEW] [login/page.tsx](<file:///Users/kasperdinh/Dev/nhatroso-platform/apps/web/src/app/(auth)/login/page.tsx>)

- Login form using `phone` as primary identifier.

#### [NEW] [middleware.ts](file:///Users/kasperdinh/Dev/nhatroso-platform/apps/web/src/middleware.ts)

- Middleware to protect `/dashboard` routes by checking the `token` cookie.

---

## Verification Plan

### Automated Tests

- `pnpm --filter web typecheck`
- Playwright E2E for login/register flows.

### Manual Verification

- Check cookie "token" persistence.
- Redirect after login/logout.
