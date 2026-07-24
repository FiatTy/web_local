# Re-Stack Design: Angular 18 → Vite + React (Code Review Frontend)

> **สถานะ:** Design / Spec (2026-07-24)
> **เจ้าของ:** ทีม Frontend Code Review
> **หลักการสูงสุด:** เปลี่ยนแค่ *เทคโนโลยี* ไม่เปลี่ยน *พฤติกรรม* — behavior เดิม, เรียก API เดิม, security เดิม, ผลลัพธ์ที่ผู้ใช้เห็นต้องเหมือนเดิม 100%

---

## 1. เป้าหมาย & ขอบเขต

พัฒนา Frontend ตัวใหม่ด้วย **Vite + React (New Design)** มาแทน Angular 18 ตัวเดิม โดย:

- ทำงานได้ **เหมือนเดิมทุกฟีเจอร์** (feature parity)
- เรียก **Backend API ชุดเดิม** (Spring Boot ที่ `/backend`) ด้วย contract เดิม
- ใช้ **โมเดล Security เดิม** (JWT access token in-memory + refresh token ผ่าน httpOnly cookie)
- Deploy คู่ขนานกับของเดิม — Angular ยังรันที่ Root `/`, React ตัวใหม่รันที่ `/codereview/`

**นอกขอบเขตของเอกสารนี้:** การ re-design หน้า UX/UI (ทีมออกแบบทำต่อ), การเขียน CD/Deploy pipeline (เฟสถัดไป)

**ต้นฉบับอ้างอิง:** โค้ด Angular เดิมอยู่ที่ `D:\pccth_code_review_web-dev-local` (repo หลักของ product อยู่ที่ GitLab บริษัท) — GitHub repo นี้คือการเปลี่ยน stack

---

## 2. สถาปัตยกรรม Deployment (Windows Server 2026 + Nginx)

```
gpt.pccth.com
│
├─ /              →  Angular เดิม (static folder เดิม)          ← ห้ามกระทบ
├─ /codereview/   →  React ตัวใหม่ (static folder แยกใหม่)      ← งานนี้
└─ /backend/      →  Spring Boot API เดิม (reverse proxy)       ← ใช้ตัวเดิม
```

- React build ต้องออก asset ทั้งหมดชี้ที่ `/codereview/...` เพื่อไม่ชนกับ Angular ที่ครอง Root
- API เรียกที่ path relative `/backend` → Nginx proxy ไป Spring Boot (โมเดลเดิม ไม่ต้องแตะ backend)
- ทุก static ของ React แยกโฟลเดอร์ออกมาต่างหาก ไม่ทับของ Angular

---

## 3. Target Stack

| ส่วน | เลือกใช้ | แทนของเดิม |
|---|---|---|
| Build tool | **Vite** | Angular CLI |
| Framework | **React 18 + TypeScript** | Angular 18 |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Angular Material + Bootstrap |
| Routing | **React Router v7** (library mode) | `@angular/router` |
| HTTP + Interceptor | **axios** (instance + interceptors) | `HttpClient` + `HttpInterceptorFn` |
| Server state | **TanStack Query** (แนะนำ) | RxJS Observables + services |
| Auth state | **React Context** (`AuthContext`) | `AuthService` + `TokenStorageService` (DI singleton) |
| i18n | **react-i18next** | `@ngx-translate/core` |
| WebSocket | `@stomp/stompjs` + `sockjs-client` | (ไลบรารีเดิม — ใช้ต่อได้เลย) |
| SSE | native `EventSource` | (เดิม — ใช้ต่อได้เลย) |
| Charts | **react-apexcharts** | `ng-apexcharts` |
| Export ไฟล์ | `xlsx`, `jspdf`, `docx`, `pptxgenjs` | (ไลบรารีเดิม framework-agnostic — ใช้ต่อได้) |
| Markdown + sanitize | `marked` + `dompurify` | (เดิม — ใช้ต่อได้) |
| Alert | `sweetalert2` | (เดิม — ใช้ต่อได้) |

> ไลบรารีที่เป็น framework-agnostic (export, chart engine, markdown, jwt-decode, stomp, sweetalert2) ใช้ตัวเดิมได้เลย ลดความเสี่ยง behavior เพี้ยน

---

## 4. โครงสร้างโฟลเดอร์ (repo ใหม่)

```
pccth_code_review_web-dev/
├─ .github/workflows/ci.yml     # CI: npm ci → npm run build (Node 20)
├─ docs/superpowers/specs/      # เอกสารออกแบบ (ไฟล์นี้)
├─ public/                      # static เสิร์ฟตรง ๆ
├─ src/
│  ├─ main.tsx                  # entry → <RouterProvider>
│  ├─ App.tsx                   # root providers (AuthProvider, QueryClient, i18n)
│  ├─ router.tsx                # createBrowserRouter({ basename: BASE_URL })
│  ├─ vite-env.d.ts
│  ├─ assets/
│  ├─ styles/index.css          # @import "tailwindcss";
│  ├─ components/               # UI ใช้ซ้ำทั้งแอป (ui/, common/)
│  ├─ layouts/                  # RootLayout (navbar + sidebar + <Outlet/>)
│  ├─ routes/                   # ProtectedRoute, RoleRoute wrappers
│  ├─ pages/                    # หน้า route-level (map 1:1 กับ Angular components)
│  ├─ features/                 # แยกตามโดเมน (auth, repository, scan, issue, report, ...)
│  │  └─ <feature>/{components,hooks,api,types.ts}
│  ├─ hooks/                    # custom hooks ใช้ร่วม
│  ├─ lib/
│  │  ├─ api-client.ts          # axios instance + interceptor (หัวใจ security)
│  │  ├─ auth/                  # AuthContext, token store (in-memory)
│  │  └─ utils.ts
│  └─ types/                    # types กลาง (map จาก interface/ เดิม)
├─ index.html
├─ vite.config.ts               # base:'/codereview/' + react() + tailwindcss() + alias @
├─ tsconfig.json / tsconfig.app.json / tsconfig.node.json
├─ eslint.config.js / .prettierrc / .nvmrc / .env.example
└─ README.md
```

**กฎแบ่งโฟลเดอร์ (ให้ทีมจำง่าย):**
- ใช้เฉพาะฟีเจอร์เดียว → `features/<feature>/`
- ใช้ข้ามฟีเจอร์ → `components/`
- ผูกกับ URL → `pages/`
- ไม่ใช่ UI (api client, utils, auth core) → `lib/`

---

## 5. Config หลัก

### 5.1 `vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  base: '/codereview/',                                   // ← subpath deploy
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

### 5.2 `router.tsx` — ผูก basename กับ base ให้ไม่หลุดกัน
```ts
const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,   // Vite ยิงค่า '/codereview/' มาอัตโนมัติ
})
```

### 5.3 Environment (แทน `environments/environment*.ts`)
Vite ใช้ `.env` + prefix `VITE_`:

| ค่า | dev | prod | เดิม |
|---|---|---|---|
| `VITE_API_BASE` | `http://localhost:8080` | `/backend` | `environment.apiUrl` |

```ts
// lib/api-client.ts
const API_BASE = import.meta.env.VITE_API_BASE ?? '/backend'
```
> โมเดลเดิม prod ใช้ path relative `/backend` (Nginx proxy), dev ยิงตรง `http://localhost:8080` — ต้องรักษาไว้เหมือนเดิม

---

## 6. Route Map (ต้อง map ให้ครบ 1:1)

### 6.1 Public routes (ไม่ต้อง login)
| Path | Component เดิม | หน้า React |
|---|---|---|
| `/` | LandingpageComponent | LandingPage |
| `/login` | LoginComponent | LoginPage |
| `/register` | RegisterComponent | RegisterPage |
| `/reset-password` | ResetPasswordComponent | ResetPasswordPage |
| `/forgot-password` | ForgotPasswordComponent | ForgotPasswordPage |
| `/verify-email` | VerifyEmailComponent | VerifyEmailPage |
| `/verify-success` | VerifySuccessComponent | VerifySuccessPage |
| `/verify-failed` | VerifyFailedComponent | VerifyFailedPage |

### 6.2 Protected routes (ใต้ `LayoutComponent` + `authGuard`)
ใน React = `<RootLayout>` ครอบด้วย `<ProtectedRoute>`

| Path | Component เดิม | หมายเหตุ |
|---|---|---|
| `/dashboard` | DashboardComponent | |
| `/repositories` | RepositoriesComponent | |
| `/addrepository` | AddrepositoryComponent | |
| `/settingrepo/:projectId` | AddrepositoryComponent | reuse component + param |
| `/detailrepo/:projectId` | DetailrepositoryComponent | |
| `/scanhistory` | ScanhistoryComponent | |
| `/scanresult/:scanId` | ScanresultComponent | |
| `/logviewer/:scanId` | LogviewerComponent | |
| `/issue` | IssueComponent | |
| `/issuedetail/:issuesId` | IssuedetailComponent | |
| `/assignment` | AssignmentComponent | |
| `/analysis` | AnalysisComponent | |
| `/security-dashboard` | SecuritydashboardComponent | |
| `/technical-debt` | TechnicaldebtComponent | |
| `/generatereport` | GeneratereportComponent | |
| `/reporthistory` | ReporthistoryComponent | |
| `/sonarqubeconfig` | SonarqubeconfigComponent | |
| `/notificationsetting` | NotificationsettingComponent | |
| `/usermanagement` | UsermanagementComponent | **ADMIN เท่านั้น** (`roleGuard(['ADMIN'])`) → `<RoleRoute allowed={['ADMIN']}>` |

### 6.3 Wildcard
`**` → redirect ไป `/` (React Router: `{ path: '*', element: <Navigate to="/" replace /> }`)

---

## 7. Auth & Security Model — ⚠️ ต้องทำให้ตรงเป๊ะ (ห้ามเพี้ยน)

นี่คือส่วนที่ "Security เหมือนเดิม" — เป็นดีไซน์แบบ **XSS-resilient** ต้องคง pattern เดิมไว้ทุกข้อ

### 7.1 โมเดล Token (สำคัญที่สุด)
| Token | เก็บที่ไหน | ทำไม |
|---|---|---|
| **Access token** | **ในหน่วยความจำเท่านั้น** (ตัวแปรใน singleton, ไม่ใช่ localStorage/sessionStorage) | กัน XSS ขโมย token; หายเมื่อ refresh หน้า (ตั้งใจ) |
| **Refresh token** | **httpOnly cookie** (ฝั่ง server ตั้งให้) | JS อ่านไม่ได้ → ปลอดภัย; ส่งกลับด้วย `withCredentials: true` |
| **User profile** | `localStorage['login_user']` | แชร์ข้ามแท็บ (ข้อมูลไม่ sensitive: id, username, email, phone, role, status) |

> **React ต้องทำเหมือนกัน:** เก็บ access token ใน React state/ref (in-memory) ห้ามเขียนลง localStorage เด็ดขาด — เก็บแค่ `login_user` เหมือนเดิม

### 7.2 Auth flow (endpoints ที่ auth interceptor "ไม่" แนบ token)
| การกระทำ | Method + Endpoint | Options | Response สำคัญ |
|---|---|---|---|
| Login | `POST /user/login` | `withCredentials: true` | `{ accessToken, id, username, email, phone, role, status }` |
| Refresh | `POST /user/refresh` | body `{}`, `withCredentials: true` | `{ accessToken }` |
| Logout | `POST /user/logout` | body `{}`, `withCredentials: true`, `responseType: text` | — |
| Register | `POST /user/register` | — | — |
| Reset password | `POST /user/reset-password` | body `{ token, newPassword }` | — |
| Validate reset token | `GET /user/reset-password/validate?token=` | — | `{ status }` |

หลัง login สำเร็จ (ต้องทำตามลำดับเดิม):
1. `setAccessToken(res.accessToken)`
2. `setLoginUser({...})` ก่อน load data (กัน race condition — คอมเมนต์ในโค้ดเดิมย้ำไว้)
3. ต่อ WebSocket ด้วย `userId` (จาก response หรือ decode `sub`/`userId` จาก token)
4. โหลด: notifications, user settings (notification + sonarqube), report history

### 7.3 HTTP Interceptor (พฤติกรรมต้องเหมือนเดิมทุกข้อ)
อ้างอิง `services/authservice/auth.interceptor.ts`:

1. **แนบ header** `Authorization: Bearer <accessToken>` ทุก request **ยกเว้น** URL ที่มี `/user/login`, `/user/register`, `/user/refresh`, `/user/logout`
2. เจอ error **401 หรือ 403** ขณะยัง `isLoggedIn`:
   - ถ้ายังไม่ refresh → ตั้ง flag `isRefreshing`, เรียก `POST /user/refresh` → ได้ token ใหม่ → **retry request เดิม**
   - ถ้ากำลัง refresh อยู่ → request อื่น ๆ **รอ** ผ่านคิว (เดิมใช้ `BehaviorSubject`; React ใช้ Promise เดียวที่ share กัน) แล้วค่อย retry ด้วย token ใหม่
   - ถ้า refresh ล้มเหลว → **logout + redirect** ไป `/`
3. request ไป `/user/logout` ที่ fail → clear token + redirect `/` (ไม่ retry)
4. มี guard กัน **refresh ซ้ำ** (`isRefreshing`) และ **logout ซ้ำ** (`isLoggingOut`)
5. logout redirect จะ **ไม่** navigate ถ้าอยู่หน้า public (login/register/reset/forgot/verify-*)

> React (axios): implement response interceptor เดียวกัน — 401/403 → refresh (single-flight Promise) → retry; ใช้ `withCredentials: true` ที่ instance level

### 7.4 Route Guards
| Guard เดิม | ทำอะไร | React equivalent |
|---|---|---|
| `authGuard` | ถ้า `isLoggedIn` → ผ่าน; ถ้าไม่ → ลอง `refresh()` (กู้ session จาก httpOnly cookie หลัง reload) สำเร็จ→ผ่าน, ล้มเหลว→ไป `/login` | `<ProtectedRoute>`: เรียก refresh ตอน mount ถ้าไม่มี token in-memory |
| `roleGuard(['ADMIN'])` | `jwtDecode(token)` อ่าน `role`/`roles`/`authority` เทียบกับ allowedRoles; ไม่ผ่าน→ `/dashboard`; ไม่มี token→ `/login` | `<RoleRoute allowed={['ADMIN']}>` |

> **จุดสำคัญ:** เพราะ access token อยู่ใน memory เมื่อ refresh หน้า token หาย — `authGuard` เรียก `refresh()` เพื่อขอ access token ใหม่จาก httpOnly cookie อัตโนมัติ ทำให้ผู้ใช้ไม่หลุด login. React ต้องมี logic กู้ session แบบเดียวกัน (เรียก refresh ตอน app โหลด / เข้า protected route)

---

## 8. API Surface (endpoint inventory ตาม service เดิม)

> 📎 **Contract เต็ม (method/path/request/response type + TS types + WS payload + hook mapping) อยู่ในเอกสารคู่:** [`2026-07-24-backend-api-contract.md`](./2026-07-24-backend-api-contract.md) — ใช้ไฟล์นั้นเป็นแหล่งอ้างอิงหลักตอน port แต่ละหน้า

Base = `VITE_API_BASE` (`/backend` prod, `http://localhost:8080` dev). พารามิเตอร์/payload เต็มดูในไฟล์ service ต้นฉบับ

| โดเมน / service เดิม | Endpoints |
|---|---|
| **Auth** (`authservice/auth.service.ts`) | `POST /user/login`, `POST /user/refresh`, `POST /user/logout`, `POST /user/register`, `POST /user/reset-password`, `GET /user/reset-password/validate?token=` |
| **User** (`userservice/user.service.ts`) | `GET /user/search-user/:id`, `PUT /user/...` (update profile), `POST /user/...` (change password), `GET/POST/DELETE/PUT /user/...` (user management list/add/remove/update), `POST /auth/verify/resend` |
| **Email** (`emailservice`) | `POST /user/forgot-password`, `POST /api/email/send` |
| **Repository** (`reposervice`) | `GET /repository/all-repository`, `POST /repository/new-repository`, `PUT /repository/update-repository/:projectId`, `DELETE /repository/delete-repository/:projectId`, `GET /repository/search-repositories/:projectId`, `GET /api/:projectId`, `POST /:projectId/scan`, `GET /api/scans/:scanId` |
| **Scan** (`scanservice/scan.service.ts`) | `POST /scans/:projectId`, `GET /scans/getProject/:userId`, `GET /scans/:scanId`, `GET /scans/:id/log`, `POST /scans/:id/cancel` (+ scan response list endpoints) |
| **Scan SSE** (`scanservice/sse.service.ts`) | `EventSource GET /api/sse/subscribe?repoId=` (realtime scan status) |
| **Issue** (`issueservice`) | list, get-by-id, create, detail-by-id, comment/action (`GET/POST` ใต้ apiUrl) |
| **Assign** (`assignservice`) | `PUT /issues/assign/:issueId`, `GET /assign/:userId`, `PUT /assign/...` |
| **Comment** (`commentservice`) | `GET` comments list, `POST` create comment, `POST` (comment action) |
| **Dashboard** (`dashboardservice`) | `GET /dashboard/:userId`, `GET /dashboard/:userId/history`, `GET /dashboard/:userId/trends`, `GET` scans |
| **Notification** (`notiservice`) | `GET /notifications/:userId`, `PATCH /notifications/:id/read`, `PATCH /notifications/:userId/read-all`, `POST /notifications` |
| **Report** (`reportservice`) | `POST /api/reports/generate` |
| **Report History** (`reporthistoryservice`) | `GET /report-history/:userId`, `GET /report-history/search/:userId`, `POST /report-history/create/:userId` |
| **Export Report** (`exportreportservice`) | `POST /export/generate` (blob/ไฟล์) |
| **User Settings** (`usersettingservice`) | `GET /settings/notification/:userId`, `PUT /settings/notification`, `GET /settings/sonarqube/:userId`, `PUT /settings/sonarqube` |
| **SonarQube** (`sonarqubeservice`) | `POST` test connection |
| **Security** (`securityservice`) | `GET` security metrics, `GET` security issues |
| **Technical Debt** (`technicaldebtservice`) | metrics endpoints (ดูในไฟล์) |

> เอกสารนี้จับ "พื้นผิว" ครบทุก service — ตอน port แต่ละหน้า ทีมเปิดไฟล์ service เดิมคู่กันเพื่อ copy payload/params/headers ให้ตรง

---

## 9. Realtime

| ช่องทาง | เดิม | รายละเอียด | React |
|---|---|---|---|
| **WebSocket (STOMP)** | `websocket/websocket.service.ts` + `notiservice` | `new SockJS(`${apiUrl}/ws`)` → STOMP client; ต่อหลัง login ด้วย `userId`; ใช้แจ้งเตือน (notifications) | `@stomp/stompjs` + `sockjs-client` (ไลบรารีเดิม) ห่อใน hook `useNotificationSocket()` |
| **SSE** | `scanservice/sse.service.ts` | `EventSource(`${apiUrl}/api/sse/subscribe?repoId=`)` realtime สถานะ scan | native `EventSource` ใน `useScanSse(repoId)` |

---

## 10. ตารางแปลง Angular → React (คู่มือทีม)

| Angular (เดิม) | React (ใหม่) |
|---|---|
| `@Injectable` service | โมดูลใน `features/<x>/api/` + hook (TanStack Query) |
| `HttpClient` | `axios` instance (`lib/api-client.ts`) |
| `HttpInterceptorFn` | axios request/response interceptor |
| `AuthService` + `TokenStorageService` (DI singleton) | `AuthContext` + in-memory token store |
| `CanActivateFn` (authGuard/roleGuard) | `<ProtectedRoute>` / `<RoleRoute>` wrapper |
| Observable / RxJS | TanStack Query (server state) + React state/hooks |
| `*ngFor` / `*ngIf` | `.map()` / `{cond && ...}` |
| Angular Pipe (`markdown`, `time-ago`, `severity-*`, `thb-currency`, `truncate`, ...) | util function ใน `lib/` หรือ component เล็ก (เช่น markdown → `marked` + `dompurify`) |
| `@ngx-translate` + `assets/i18n/*.json` | `react-i18next` + `public/locales/*.json` |
| `ng-apexcharts` | `react-apexcharts` |
| `interface/*.ts` (DTO) | `types/` + `features/<x>/types.ts` (คง type เดิมได้เลย) |

---

## 11. CI / CD

### 11.1 CI (ทำวันนี้) — `.github/workflows/ci.yml`
เป้าหมาย: **build เขียว** ตั้งแต่ commit แรก
```
trigger: pull_request → main, push → main
job build (ubuntu, Node 20):
  1. checkout
  2. setup-node 20 + cache npm
  3. npm ci
  4. npm run build          # tsc -b && vite build
```
scaffold ที่วางจะ build ผ่าน 100% → CI เขียวทันที ทีมต่อของบนฐานที่เขียวอยู่

### 11.2 Branch Protection (ตั้งที่ GitHub)
- ✅ Require a pull request before merging (ห้าม push ตรงเข้า `main`)
- ✅ Require status checks to pass → เลือก job `build`
- (ตั้งผ่าน `gh` CLI หรือ Settings → Branches)

### 11.3 CD (เฟสถัดไป — ยังไม่ทำ)
CI build ออกเป็น `dist/` — ตอนทำ deploy ค่อยเพิ่ม step เอา `dist/` ไปวางในโฟลเดอร์ static ที่ Nginx เสิร์ฟที่ `/codereview/`
- **แนวทางแนะนำ:** self-hosted GitHub Actions runner บน Windows Server (build/รับ artifact แล้ว copy ลงโฟลเดอร์ nginx ในเครื่อง — ไม่ต้องเปิด inbound port)
- โครงวันนี้รองรับอยู่แล้ว ไม่ต้องรื้อ

---

## 12. แผนการทำ (เฟส)

1. **เฟส 0 (วันนี้):** ล้าง Angular ออกจาก repo → scaffold Vite+React+TS+Tailwind v4+Router v7 → วาง CI build เขียว → ตั้ง Branch Protection → commit + push
2. **เฟส 1:** วาง `lib/api-client.ts` (axios + interceptor) + `AuthContext` + `ProtectedRoute`/`RoleRoute` + i18n + layout (ฐาน security/routing ที่ทุกหน้าใช้)
3. **เฟส 2:** port หน้า auth (login/register/reset/forgot/verify)
4. **เฟส 3+:** port หน้าใน layout ทีละโดเมน (dashboard → repository → scan → issue → report → analytics → settings) พร้อม re-design UI
5. **เฟส realtime:** WebSocket notifications + SSE scan status
6. **เฟส CD:** self-hosted runner + auto-deploy

---

## 13. Definition of Done — Parity Checklist

- [ ] ทุก route ใน §6 เข้าถึงได้ที่ `/codereview/<path>` และ redirect/guard ทำงานเหมือนเดิม
- [ ] Access token อยู่ใน memory เท่านั้น (ตรวจ: localStorage ไม่มี token — มีแค่ `login_user`)
- [ ] Refresh token ทำงานผ่าน httpOnly cookie (`withCredentials`) — reload หน้าแล้วไม่หลุด login
- [ ] Interceptor แนบ Bearer ถูกต้อง + ข้าม auth endpoints + refresh-retry (single-flight) + logout redirect ตาม §7.3
- [ ] `roleGuard(['ADMIN'])` กันหน้า `/usermanagement` ได้จริง
- [ ] ทุก API ใน §8 เรียกด้วย method/URL/payload เดิม (contract ไม่เปลี่ยน)
- [ ] WebSocket notifications + SSE scan status ทำงาน
- [ ] i18n สลับภาษาได้เหมือนเดิม
- [ ] Export (excel/pdf/word/ppt) + chart ทำงานเหมือนเดิม
- [ ] CI build เขียวบน PR ก่อน merge

---

## 14. ความเสี่ยง / จุดต้องระวัง

1. **Access token in-memory:** ถ้าเผลอเก็บลง localStorage = ลด security ลงจากเดิม → **ผิด spec** ห้ามทำ
2. **`withCredentials`:** ต้องเปิดที่ axios instance ไม่งั้น refresh cookie ไม่ถูกส่ง → login หลุดหลัง reload
3. **Single-flight refresh:** ถ้าหลาย request เจอ 401 พร้อมกันแล้วต่างคนต่าง refresh → race/หลุด session; ต้อง share Promise เดียว (เหมือน `BehaviorSubject` เดิม)
4. **CORS/cookie ตอน dev:** dev ยิงข้าม origin ไป `localhost:8080` — cookie httpOnly + `withCredentials` ต้องตั้ง backend CORS ให้ allow credentials (โมเดลเดิมทำได้อยู่แล้ว ตรวจให้ตรง)
5. **`base`/`basename` หลุดกัน:** ผูกผ่าน `import.meta.env.BASE_URL` ที่เดียว
6. **payload/params รายละเอียด:** เอกสารจับ endpoint surface — ตอน port ต้องเปิด service เดิมเทียบ field ให้ครบ

---

## 15. เปิดประเด็น (ยังไม่สรุป)

- ต้องการ TanStack Query หรือใช้ fetch/axios ตรง ๆ ต่อ service? (แนะนำ TanStack Query — ใกล้เคียง caching ของ RxJS services เดิม)
- โครงสร้าง i18n keys คงชุดเดิมจาก `assets/i18n` หรือจัดใหม่?
- shadcn/ui: จะเอาเข้ามาเป็น component base ไหม (เพิ่มทีหลังได้)
```
