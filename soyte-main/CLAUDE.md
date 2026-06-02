# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Healthcare management portal for **Sở Y Tế Hà Nội** (Hanoi Department of Health). React + Vite SPA, Vietnamese-language UI. Combines a public site (news, hospital lookup, health consultation) with a permissioned admin system (facilities, surveys, feedback, role/permission management, PDF/Word reports).

## Commands

```bash
npm run dev                  # Dev server on port 3002 (host 0.0.0.0, mode=dev)
npm run build:dev            # Build with .env.dev
npm run build:golive         # Build with .env.golive (production)
npm run preview              # Preview last dev build
npm run preview:golive       # Preview last golive build
npm run type-check           # tsc --noEmit (no TS errors emitted to disk)
npm run inspect:feedbacks    # Node script: scripts/inspect_feedback_apis.mjs
```

No lint or test framework is configured. `type-check` is the only static gate.

## Repository Layout (NOT a `src/` project)

> Source files live at the **repository root**, not under `src/`. Any guidance that assumes `src/<x>` is wrong — paths are `./components`, `./pages`, `./utils`, etc.

- [App.tsx](App.tsx) — all React Router v6 routes (public + nested `/admin/*`)
- [index.tsx](index.tsx) — entry, wraps `BrowserRouter` → `AuthProvider` → `App` and configures PrimeReact `pt` (passthrough) defaults globally
- [index.html](index.html) — loads Tailwind via `cdn.tailwindcss.com` with **inline theme config** (custom `primary` / `secondary` palettes, animations); also loads Leaflet CSS and an ESM `importmap` for react/recharts/leaflet
- [api.ts](api.ts) — fetch wrapper + domain methods (users, roles, permissions, reports…)
- [AuthContext.tsx](AuthContext.tsx) — auth provider, login/logout, permission enrichment
- [adminMenu.ts](adminMenu.ts) — single source of truth for the admin sidebar **and** route authorization (see Permission System)
- [constants.tsx](constants.tsx) — large file (~225 KB) of static seed data, lookups, mock content
- [types.ts](types.ts) — top-level shared types (`User`, `Role`, `Permission`, `WorkSchedule`, `SmtpConfig`)
- `components/`, `pages/`, `services/`, `hooks/`, `utils/`, `types/` — all at root
- `components/prime/index.js` — **re-exports** every PrimeReact component the app uses; import from `@/components/prime` rather than `primereact/*` directly
- `pages/report/` — three report pages: `Report_DCBC` (phản ánh y tế), `Report_KSHL` (giám sát chất lượng), `Report_TCT01` (kết quả thực hiện)
- `utils/pdfExport*.ts` + `utils/wordExport*.ts` — per-report PDF (jsPDF + autotable) and Word (docx) generators; `pdfFonts.ts` embeds Vietnamese-capable Times font (regenerate via `scripts/genTimesFonts.mjs`)
- `scripts/` — Node ES-module scripts (`.mjs` and `.ts`) for inspection/import; not part of the build

## Path Alias

`@/*` resolves to `./*` (the **project root**), not `./src/*`. Configured in both [vite.config.ts](vite.config.ts) and [tsconfig.json](tsconfig.json). E.g. `import { Button } from "@/components/prime"` resolves to `./components/prime/index.js`.

## Architecture

### Auth & Permission System

Two layers, both flowing through [AuthContext.tsx](AuthContext.tsx):

1. **Token storage** — JWT in `localStorage.auth_token`. `api.ts` injects `Authorization: Bearer <token>` on every request. A 401 response clears the token and dispatches `auth-change` (effectively forcing a re-login on next request).
2. **Permission enrichment** — after login, `enrichUserWithRolePermissions` derives a flat `permissions: string[]` array, in priority order:
   1. `user.assignedRoles[].permissions[].name` from the `/auth/login` response (preferred)
   2. `user.permission_list` (flat array fallback)
   3. `GET /roles/{role_id}` API call (last resort)

   The login page at [pages/Login.tsx](pages/Login.tsx) calls `login(token, data.user)` and passes the user object so `/auth/me` is **not** re-fetched on the login path.

3. **Permission checking** — [utils/permissionUtils.ts](utils/permissionUtils.ts) exposes `hasPermission(perms, key)` which handles three permission shapes (string array, `{name|key|permission|code}` array, nested object with dot-paths like `"reflect.children.form"`).

4. **Route guard** — [components/AdminRoute.tsx](components/AdminRoute.tsx) wraps every `/admin/*` route. Logic: not-logged-in → `/login`; non-admin → `/`; admin with empty perms → `/`; bare `/admin` → `getLandingPath(user)`; specific path → `isPathAllowed(path, user)` else redirect to landing.

5. **Menu filtering** — [components/AdminLayout.tsx](components/AdminLayout.tsx) filters `adminMenu` by the same `hasPermission` checks so users only see what they're allowed to open.

`adminMenu` is the **whitelist** that drives both the sidebar and `isPathAllowed`. Adding a new admin page means adding an entry there; otherwise it will be reachable via direct URL but not via the menu, and `isPathAllowed` will treat unmapped `/admin/*` paths permissively only because the user is admin.

### Role assignment

`PUT /roles/assign-user` accepts `{ user_id, role_ids: number[] }` and atomically replaces the user's roles. Client code in [components/UserModal.tsx](components/UserModal.tsx) sends the full target list; do not loop per-role.

### API client conventions

- Single shared `api` object in [api.ts](api.ts) — methods like `api.get/post/put/delete` plus domain helpers (`api.getUsers`, `api.assignRoleToUser`, `api.getGsatReport`, …). Add new endpoints as methods here rather than calling `fetch` from components.
- `BASE_URL` comes from `import.meta.env.VITE_API_URL`.
- `handleResponse` shows a global PrimeReact Toast on every response that has a `message` field (success toast for non-GET, error toast always). Toast ref is hung off `window.$toast` in [App.tsx](App.tsx) — that's intentional, not a workaround.

### Layout split

[components/Layout.tsx](components/Layout.tsx) hides the public `Header`/`Footer` for `/admin/*`, all auth pages, `/hanoi-system`, and `/emergency`. Public QR view (`/admin/templates/qr/*` is a separate path: `/templates/qr/:id`) renders without admin chrome.

### Reports & exports

Three independent report flows under `pages/report/`. Each has its own PDF and Word generators in `utils/` (`pdfExport*.ts`, `wordExport*.ts`). They share `utils/reportDataUtils.ts` for shaping data and `utils/pdfFonts.ts` for Vietnamese diacritics in jsPDF.

## Environment

Two build modes selected by Vite `--mode` flag, each loading the matching dotenv file:

| File | When |
|---|---|
| `.env.dev` | `npm run dev`, `npm run build:dev` |
| `.env.golive` | `npm run build:golive`, `npm run preview:golive` |

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL (used by `api.ts`) |
| `VITE_PUBLIC_URL` | Public site URL |
| `GEMINI_API_KEY` | Exposed via `define` to `process.env.API_KEY` and `process.env.GEMINI_API_KEY` for AI features |

## Deployment

[Dockerfile](Dockerfile) is a 2-stage build: `node:20-alpine` runs `npm ci` and `npm run build:dev` or `build:golive` (selected by `BUILD_MODE` arg, default `golive`), then copies `/app/dist` into `nginx:1.27-alpine`. [nginx.conf](nginx.conf) serves the SPA with `try_files $uri $uri/ /index.html` so client-side routes resolve. [docker-compose.yml](docker-compose.yml) maps host `${PORT:-8080}` to container `80`.

## Conventions worth knowing

- **PrimeReact imports go through `@/components/prime`**, not `primereact/*` directly. The barrel file is the canonical list of allowed components.
- **Tailwind is CDN-mode** (`cdn.tailwindcss.com` in [index.html](index.html)) with the theme configured inline. There is no `tailwind.config.js`/PostCSS pipeline. Custom colors (`primary-*`, `secondary-*`) and the keyframes `shake`, `bounce-slow`, `pulse-slow` are defined there.
- **All UI strings are Vietnamese.** When adding labels, errors, or toasts, match the surrounding tone.
- **Cross-origin images**: `<img>` tags across the app use `crossOrigin="anonymous"` so html2canvas / jsPDF can rasterize them without CORS taint. Preserve this attribute when adding new `<img>` elements that load from external CDNs.
- **TypeScript is permissive**: `allowJs: true`, `noEmit: true`, no `strict`. Type-checking catches obvious errors but won't enforce strict null checks. Don't rely on the compiler to catch mismatched permission shapes — write defensively as `permissionUtils.ts` does.
