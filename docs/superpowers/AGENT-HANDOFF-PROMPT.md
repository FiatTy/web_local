# Agent Handoff Prompt — Re-stack Angular Code Review to Vite + React

วิธีใช้: เปิด session กับ AI ตัวที่จะเขียนโค้ด แล้ววาง prompt ด้านล่างนี้เป็นคำสั่งแรก. AI ต้องเข้าถึง repo นี้ (`D:\pccth_code_review_web-dev`) และซอร์ส Angular เดิม (`D:\pccth_code_review_web-dev-local`) ได้. เริ่มจาก **เฟส 0** (ล้าง Angular + scaffold ตั้งแต่ศูนย์) แล้วทำทีละหน่วย. หลังทำเสร็จแต่ละหน่วย ให้พิมพ์ `continue` เพื่อให้มันทำหน่วยถัดไป.

---

## PROMPT (คัดลอกทั้งบล็อกนี้)

```
You are a senior frontend engineer. Your task is to re-stack an existing Angular 18
"Code Review" web app to Vite + React + TypeScript. Only the technology stack and the
visual UI design change. Behavior, API calls, and the security model must stay identical
to the original. This is a parity migration, not a rewrite of logic.

CONTEXT YOU MUST READ BEFORE WRITING ANY CODE
- docs/superpowers/specs/2026-07-24-restack-angular-to-vite-react-design.md
  (architecture, folder structure, routing, security model, CI, phase plan)
- docs/superpowers/specs/2026-07-24-backend-api-contract.md
  (every endpoint, request/response types, WebSocket topics, custom-hook mapping)
- Original Angular source at D:\pccth_code_review_web-dev-local\src\app
  (open the matching service/component/interface file for the unit you are working on,
  and reproduce its exact endpoints, payloads, params, and data mapping)

SKILLS (use your own judgment)
- Check which skills are available in your environment and use whichever are appropriate for
  the task at hand. Invoke a relevant skill before doing the work it covers. Do not limit
  yourself to a fixed list; pick skills as the work demands (React quality, planning, testing,
  verification, code review, design, and so on).
- vercel-react-best-practices is available and directly relevant: apply it when you write,
  review, or refactor React code. This project is a Vite SPA, so its Next.js/RSC "server-"
  rules mostly do not apply; the async, bundle, client, rerender, rendering, js, and advanced
  rules do apply.
- Only invoke skills that actually exist in your environment. Never fabricate skill output.

TARGET STACK
- Vite, React 18, TypeScript (strict)
- Tailwind CSS v4 via @tailwindcss/vite
- React Router v7 in library mode (createBrowserRouter, basename = import.meta.env.BASE_URL)
- axios for HTTP (single instance with interceptors)
- TanStack Query for server state
- react-i18next for i18n
- @stomp/stompjs + sockjs-client for WebSocket, native EventSource for SSE

ARCHITECTURE RULES (follow the docs, do not invent your own)
- Feature-based structure. Each Angular service becomes two layers:
  features/<domain>/api/<domain>.api.ts    pure axios functions returning Promises
  features/<domain>/hooks/use<Thing>.ts    TanStack Query hooks (useQuery / useMutation)
- Angular "*-data.service.ts" (BehaviorSubject stores) become React Query cache or a
  small Zustand store. Do not port them as classes.
- Angular pipes become pure functions in lib/. Angular utils keep their logic, moved to lib/.
- Do not carry over Angular idioms (dependency injection, RxJS operator chains, decorators).
- Path alias "@" points to src/.

SECURITY MODEL (must replicate exactly, this is non-negotiable)
- Access token lives in memory only. Never write it to localStorage or sessionStorage.
- Only the "login_user" object goes in localStorage, same key as the original.
- Refresh token is an httpOnly cookie. Send credentials (withCredentials) on
  /user/login, /user/refresh, /user/logout only.
- axios interceptor attaches Authorization: Bearer <token> to every request except
  /user/login, /user/register, /user/refresh, /user/logout.
- On 401 or 403 while logged in: run a single-flight refresh (one shared refresh promise
  for all concurrent requests), then retry. If refresh fails, log out and redirect.
- Route protection via a ProtectedRoute wrapper; role protection via a RoleRoute wrapper
  that decodes the JWT (role or roles or authority claim). Guard /usermanagement to ADMIN.

CODE STYLE (strict)
- Follow the SKILLS TO USE section for React quality guidance, while still obeying every
  rule below.
- No emoji anywhere: not in code, UI text, identifiers, or commit messages.
- No comments in the code. Make the code self-documenting through precise names and small
  focused functions. If something feels like it needs a comment, extract it into a
  well-named function or hook instead.
- Readable, idiomatic, conventional React that any engineer can follow. Prefer clarity over
  cleverness. Small components, one responsibility each.
- Descriptive names. No dead code, no unused imports, no console logging left behind.
- Handle loading and error states for every data fetch. Use accessible, semantic markup.
- Keep formatting consistent with the project ESLint and Prettier config.
- TypeScript strict: no "any" unless the original source explicitly uses it.

HOW TO WORK (incremental, one unit at a time, keep going until done)
- Work through the phases in the design doc, in order. Within a phase, complete exactly
  ONE unit per turn: one hook, one page, or one small feature. Never batch many at once.
- For each unit:
  1. Read the corresponding original Angular files for that unit.
  2. Implement the React equivalent following the architecture and style rules above.
  3. Run: npm run build  and make sure it passes (typecheck plus Vite build, green).
  4. Verify each API call matches the contract doc exactly (method, path, body, params,
     response type). Verify security behavior is preserved where relevant.
  5. Give a short report: what unit you finished, files changed, build result, and the
     next unit you will do. Then stop and wait.
- Continue to the next unit only when I reply "continue".
- Keep the build green at every checkpoint. If a unit is large, split it and still leave
  the build green.
- Do not invent endpoints, fields, or behavior. If the contract is ambiguous, open the
  referenced service file. If it is still unclear, ask me instead of guessing.
- Commit after each finished unit using Conventional Commits, no emoji, for example:
  feat(auth): add login page and useLogin hook

BUILD ORDER (from the design doc phase plan)
0. Project setup from scratch. The repo still contains the old Angular app. Do this phase
   as a few small units, keeping the build green after the scaffold:
   - Remove the Angular app: src/ (Angular sources), angular.json, tsconfig.app.json,
     tsconfig.spec.json, .angular/, the old assets/, the old package.json and
     package-lock.json. Keep .git/, .editorconfig, .gitattributes, and the docs/ folder.
   - Scaffold Vite + React + TypeScript. Install: tailwindcss and @tailwindcss/vite,
     react-router, axios, @tanstack/react-query, react-i18next and i18next,
     @stomp/stompjs, sockjs-client, jwt-decode.
   - vite.config.ts: base '/codereview/', plugins react() and tailwindcss(),
     resolve.alias '@' -> ./src.
   - Create the folder skeleton from the design doc section 4. Add src/styles/index.css
     containing: @import "tailwindcss";
   - package.json scripts: dev = "vite", build = "tsc -b && vite build",
     preview = "vite preview", lint = "eslint .".
   - Add .nvmrc (20), an ESLint flat config, a Prettier config, .gitignore for Vite,
     and .env.example with VITE_API_BASE.
   - Add .github/workflows/ci.yml: trigger on pull_request and push to main; job on
     Node 20 that runs npm ci then npm run build. It must pass.
   - Run npm run build on the fresh scaffold, confirm it is green, then report and wait.
1. Foundation: axios api-client with the interceptor, AuthContext with in-memory token,
   ProtectedRoute and RoleRoute, i18n setup, RootLayout with navbar and sidebar.
2. Auth pages: login, register, reset-password, forgot-password, verify-email,
   verify-success, verify-failed.
3. Domain pages one at a time, in this order: dashboard, repository, scan, issue, report,
   analytics (security and technical-debt), settings (sonarqube, notification,
   usermanagement).
4. Realtime: WebSocket notifications and per-issue comments, SSE scan status.
5. Stop before CD. Deployment is a later phase.

DEFINITION OF DONE FOR EACH UNIT
- npm run build passes.
- No emoji, no comments.
- API calls match the contract doc exactly.
- Follows the folder structure and the api plus custom-hook convention.
- The screen shows the same data and performs the same actions as the original, even
  though the visual design is new.

Start now with Phase 0: remove the old Angular app and scaffold the new Vite + React
project as described above. Read the relevant docs first, do the scaffold, run npm run build,
confirm it is green, report what you did and the next unit, then wait for "continue".
```

---

## หมายเหตุการใช้งาน
- เริ่มที่ **เฟส 0** — มันจะล้าง Angular + scaffold Vite/React + วาง CI ให้ build เขียวก่อน แล้วค่อยไปเฟส 1
- ทุกครั้งที่มันทำเสร็จ 1 หน่วย ให้ตอบ `continue` เพื่อไปหน่วยถัดไป
- ถ้ามันจะลบไฟล์ทั้ง repo ให้เช็คก่อนว่าเก็บ `.git/` กับ `docs/` ไว้
- ถ้ามันเริ่มทำหลายหน้าในรอบเดียว ให้เตือน: "one unit per turn, keep the build green"
- ถ้ามันเดา endpoint/field ให้สั่ง: "open the original service file, do not guess"
- ถ้ามันใส่ comment หรือ emoji ให้สั่ง: "remove all comments and emoji, self-documenting names only"
