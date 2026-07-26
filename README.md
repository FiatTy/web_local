# PCCTH Automate Code Review — Frontend

Web client for the Automate Code Review platform. Connect a Git repository, run a SonarQube
scan, then read the issues, security posture and technical debt it produced.

Built with Vite + React + TypeScript. The Angular 18 original is kept under `angular-legacy/`
as the reference while the migration finishes.

---

## Requirements

| Tool    | Version                                                        |
| ------- | -------------------------------------------------------------- |
| Node    | 20.19+ or 22.12+ (Vite 8 requirement)                          |
| npm     | 10+                                                            |
| Backend | `pccth_code_review_service` running on `http://localhost:8080` |

## Quick start

```bash
npm install
cp .env.example .env      # then point VITE_API_BASE at your backend
npm run dev               # http://localhost:5173/codereview/
```

The backend allows CORS from `http://localhost:5173` only, so keep that port when running
against a local service.

## Scripts

| Command              | What it does                                             |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | Dev server with HMR                                      |
| `npm run build`      | Type-check (`tsc -b`) then production build into `dist/` |
| `npm run preview`    | Serve the production build locally                       |
| `npm run lint`       | ESLint over the whole repo                               |
| `npm test`           | Vitest unit tests, single run                            |
| `npm run test:watch` | Vitest in watch mode                                     |

## Environment

| Variable        | Purpose                                      |
| --------------- | -------------------------------------------- |
| `VITE_API_BASE` | Backend origin, e.g. `http://localhost:8080` |

The app is served under the `/codereview/` base path (`vite.config.ts`), matching the nginx
deployment.

## Project structure

```
src/
  main.tsx              entry: theme + i18n, renders <App/>
  App.tsx               QueryClient + Toast + Router providers
  router.tsx            every route, each page lazy loaded
  pages/                one file per route
  features/<domain>/    api/ hooks/ components/ lib/ types.ts per domain
  components/           UI shared across features
  layouts/              RootLayout: sidebar + topbar
  routes/               guards: AuthBoundary, ProtectedRoute, RoleRoute, RealtimeBoundary
  hooks/                app-level hooks that span several domains
  lib/                  api-client, auth, realtime, toast, i18n, theme
  types/                types shared by more than one feature
  locales/              en.json, th.json
  styles/               design tokens and keyframes
```

Where a piece of code lives follows one rule: keep it inside the feature that owns it, and
promote it to the shared layer only once a second feature genuinely needs it.

## Architecture notes

`docs/ARCHITECTURE.md` carries the detail: the realtime topic map, the parity gaps against the
Angular original, and the backend contracts that are easy to get wrong (report history is
written by the backend, email verification is a redirect rather than a JSON call).

## Security model

- Access token lives in memory only, never in `localStorage` or `sessionStorage`
- Refresh token is an HttpOnly + Secure + SameSite=Strict cookie the client cannot read
- Axios attaches the bearer token and refreshes once on 401/403
- Routes are guarded by session and by role

## Conventions

- TypeScript strict, no `any`
- Every user-facing string goes through i18n in both `en` and `th`
- Every fetch renders a loading state and an error state
- Prettier and ESLint must both pass before a commit
