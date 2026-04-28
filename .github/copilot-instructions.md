# reporting-ui — Copilot Instructions

## What This Project Is
React frontend for a test automation reporting system. Displays projects, test cases, and execution history sourced from a FastAPI backend (`reporting-server`).

## Stack
- **React 18 + Vite 5** — `npm run dev` (port 5173 dev), built to `dist/` (prod)
- **TanStack Query v5** — all data fetching via `useQuery`; `staleTime: 30s`, `retry: 1`
- **React Router v6** — `BrowserRouter`, nested routes under `Layout`
- **Tailwind CSS v3** — utility-first; configured in `tailwind.config.js` + `postcss.config.js`
- **Axios** — HTTP client in `src/api/client.js`; `baseURL` from `VITE_API_BASE_URL` or empty (nginx proxy)

## Container / Deployment
- **Podman** (`podman-compose`) — not Docker Desktop
- Rebuild command: `podman compose down && podman compose up --build -d`
- Production: multi-stage `Dockerfile` — `node:20-alpine` build → `nginx:1.25-alpine` serve
- nginx proxies `/api/*` → `http://reporting-server-reporting-server-1:8000`
- UI served on `http://localhost:3000`
- Backend network: `reporting-server_default` (external)

## Routes
| Path | Page |
|------|------|
| `/projects` | ProjectsPage — list + create projects |
| `/projects/:projectId/dashboard` | DashboardPage — stats + recent failures |
| `/projects/:projectId/test-reports` | TestCasesPage — test list with filters |
| `/projects/:projectId/test-reports/:caseId` | ExecutionsPage — run history |
| `/projects/:projectId/history` | TestHistoryPage — exists but not in sidebar |

## Key Source Files
| File | Purpose |
|------|---------|
| `src/api/client.js` | `projectsApi`, `testCasesApi`, `executionsApi` — all API calls |
| `src/components/Layout.jsx` | App shell: sidebar, project dropdown, nav |
| `src/components/LogModal.jsx` | Shared log popup — resizable, 3 themes, toolbars |
| `src/components/ImageModal.jsx` | Fullscreen screenshot lightbox (keyboard nav) |
| `src/utils/dateUtils.js` | `formatDateTime`, `relativeTime`, `toDate` — appends `Z` for UTC |

## Backend API Shape (important field names)
- Test case: `tc.name` (not `test_name`)
- Latest execution nested: `tc.latest_execution.status`, `.reported_at`, `.log`, `.error_message`, `.screenshots[]`
- Timestamps come **without** timezone suffix — `dateUtils` appends `Z` to treat as UTC

## Conventions
- No inline modal logic in pages — use `src/components/LogModal.jsx`
- Shared date formatting always goes through `src/utils/dateUtils.js`
- Status pill styling lives in `StatusBadge.jsx`
- `package-lock.json` must be committed — Dockerfile uses `npm ci`
