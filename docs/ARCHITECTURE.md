# สถาปัตยกรรม และแผนงาน — Code Review (Vite + React)

เอกสารนี้อธิบายว่าโปรเจกต์จัดโครงยังไง ทำไมถึงจัดแบบนี้ และแผนงานเป็นเฟสอะไรบ้าง
เป้าหมายคือ ทีมอ่านออก ปรับต่อได้ง่าย

---

## 1. หลักการสูงสุด

เป็นการ **เปลี่ยน stack (Angular 18 -> Vite + React)** ไม่ใช่เขียน logic ใหม่

- behavior / flow / การเรียก API / security = **เหมือนเดิม 100%**
- เปลี่ยนแค่ **เทคโนโลยี** (React) และ **หน้าตา (UX/UI ให้สวยขึ้น)**
- โค้ดต้องอ่านง่าย จัดการง่าย ปรับต่อได้ (ชื่อสื่อความหมาย, ไม่มี comment, ไม่มี emoji)

ต้นฉบับ Angular เก็บไว้ที่โฟลเดอร์ `angular-legacy/` ใช้เป็นแหล่งอ้างอิง เปิดเทียบทุกครั้งที่ย้ายแต่ละหน้า แล้วค่อย ๆ ลบทิ้งเมื่อย้ายเสร็จ

---

## 2. Tech stack

| ส่วน | ใช้ |
|---|---|
| Build | Vite 8 |
| Test | Vitest (`npm test`) — unit test ของ logic ล้วน ๆ ใน `*.test.ts` ข้าง ๆ ไฟล์ที่เทส |
| UI | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS v4 (design tokens ใน `src/styles/index.css`) |
| Routing | React Router v7 |
| HTTP | axios (instance เดียว + interceptor แนบ JWT + refresh อัตโนมัติ) |
| Server state | TanStack Query (จัดการ loading / error / cache ให้อัตโนมัติ) |
| Auth state | React Context (`AuthContext`) + token ใน memory |
| i18n | react-i18next (en / th) |
| Realtime | @stomp/stompjs + sockjs (WebSocket), EventSource (SSE) |
| ไอคอน | lucide-react |

---

## 3. โครงสร้างโฟลเดอร์ (แต่ละอันไว้ทำอะไร)

```
src/
  main.tsx              จุดเริ่ม: ใส่ธีม + i18n แล้ว render <App/>
  App.tsx               providers ครอบทั้งแอป (QueryClient + Router)
  router.tsx            แผนที่ route ทั้งหมด (public + protected) ตรงกับของเดิม 1:1
  styles/index.css      design tokens (สี teal, light/dark), ฟอนต์
  assets/               รูป/โลโก้ ที่ import เข้า bundle
  components/           UI ที่ใช้ซ้ำข้ามหลายหน้า (เช่น common/BrandMark, LanguageSwitcher)
  layouts/              RootLayout = โครงหน้าหลังล็อกอิน (sidebar + topbar + เนื้อหา)
  routes/               ตัวคุมการเข้าถึง: ProtectedRoute, RoleRoute, AuthBoundary
  pages/                หน้าแต่ละ route (1 หน้า = 1 ไฟล์) เรียกใช้ component ต่าง ๆ
  features/<domain>/    แยกตามโดเมน (auth, repository, scan, issue, ...)
    api/<domain>.api.ts     ฟังก์ชันเรียก API ของโดเมนนั้น (pure, ใครก็เรียกได้)
    hooks/use<Thing>.ts     React hook (TanStack Query) ห่อ api ให้ component ใช้ง่าย
    components/             component เฉพาะโดเมน
    types.ts                type เฉพาะโดเมน
  hooks/                hook ระดับแอปที่ไม่ได้เป็นของโดเมนไหนโดยเฉพาะ
    useAppRealtimeSync.ts   ประกอบ event realtime ข้ามโดเมนเข้าด้วยกัน
  lib/                  ของที่ไม่ใช่ UI:
    api-client.ts           axios instance + interceptor (หัวใจ security)
    auth/                   AuthContext + token store (in-memory)
    realtime/               STOMP client + provider + hook subscribe topic
    toast/                  ToastProvider + useToast (แทน SweetAlert2)
    i18n.ts, theme.ts       ตั้งค่าภาษา / ธีม
  types/                type กลางที่ใช้หลายโดเมน
```

---

## 4. `.gitkeep` คืออะไร

git **ไม่เก็บโฟลเดอร์ว่าง**. `.gitkeep` คือไฟล์เปล่า ๆ ที่ใส่ไว้เพื่อให้โฟลเดอร์ว่าง "ติด" ไปกับ git ตอนวางโครง

- ไม่มีผลกับการทำงานของแอปเลย เป็นแค่หมุดกันโฟลเดอร์ไว้
- พอโฟลเดอร์นั้นมีไฟล์จริงแล้ว เรา **ลบ `.gitkeep` ทิ้ง**
- ตอนนี้ไม่เหลือแล้ว โฟลเดอร์สุดท้ายที่ยังว่างคือ `src/hooks/` ซึ่งมีไฟล์จริงตั้งแต่ Phase 4

**กติกาว่าอะไรควรอยู่ `src/hooks/` (ชั้นนอก) หรือ `features/<domain>/hooks/` (ชั้นใน):**
ถ้ามีแค่โดเมนเดียวใช้ ให้อยู่ในโดเมนนั้น (เช่น `useRepositories`, `useIssues`)
ย้ายขึ้นมาชั้นนอกเมื่อมันไม่ได้เป็นของโดเมนไหนจริง ๆ หรือมี 2 โดเมนขึ้นไปใช้ร่วมกัน
เช่น `useAppRealtimeSync` ที่แตะ repository + scan + issue + user + notification พร้อมกัน
(หลักเดียวกับ bulletproof-react)

---

## 5. Hook คืออะไร ใช้ตรงไหน

**Hook** = ฟังก์ชันของ React ที่ชื่อขึ้นต้นด้วย `use...` เอาไว้ดึง state / logic มาใช้ใน component (เช่น `useState`, `useEffect`)

เราสร้าง **custom hook ต่อโดเมน** เพื่อให้หน้าเว็บเรียก API ได้ง่าย ๆ โดยไม่ต้องจัดการ loading / error / cache เอง (TanStack Query จัดให้)

- ที่ทำแล้ว: `useAuth()` — อ่านสถานะล็อกอิน, สั่ง login / logout
- ที่กำลังจะทำ (Phase 2 เป็นต้นไป): `useLogin()`, `useRegister()`, `useRepositories()`, `useScans()`, `useIssues()` ... แต่ละอันห่อ api ของโดเมนนั้น
- ที่ยังไม่เห็น hook เยอะ เพราะเพิ่งเสร็จ "ฐาน" (Phase 1) — hook ต่อโดเมนจะเริ่มเยอะตั้งแต่ Phase 2

ตัวอย่างการใช้ในหน้า (Phase 2):
```
const { mutate: login, isPending, error } = useLogin();
// ปุ่มกด -> login({ email, password })  โดยหน้าไม่ต้องรู้เรื่อง axios เลย
```

---

## 6. API แยกตามหมวด (Best Practice)

จุดที่ถามพอดี — เราแยก API เป็น **2 ชั้นต่อโดเมน**:

1. **ชั้น api** `features/<domain>/api/<domain>.api.ts`
   - ฟังก์ชันเรียก backend ตรง ๆ คืน `Promise`
   - ไม่มี logic ของ UI, ไม่ผูกกับ React
   - **ใครก็เรียกได้**: component, hook, หรือ service อื่น import ไปใช้ได้เลย
2. **ชั้น hook** `features/<domain>/hooks/use<Thing>.ts`
   - ห่อ api ด้วย TanStack Query (`useQuery` / `useMutation`)
   - จัดการ loading / error / cache / refetch ให้ component

ทุกโดเมนยิงผ่าน axios instance ตัวเดียว `lib/api-client.ts` ที่แนบ JWT ให้อัตโนมัติ และ refresh token ให้เองเมื่อเจอ 401/403

### ตัวอย่าง Auth (ทำแล้ว)
```
features/auth/api/auth.api.ts   -> login(), register(), refresh(), logout(), resetPassword(), validateResetToken()
lib/auth/AuthContext            -> ใช้ auth.api ทำ flow login/logout + เก็บ token in-memory
Phase 2: features/auth/hooks/useLogin.ts -> useMutation ห่อ login() ให้หน้า Login เรียก
```

### ตัวอย่าง Scan (จะทำ Phase 3)
```
features/scan/api/scan.api.ts    -> startScan(projectId), getScan(scanId), getScanLog(id), cancelScan(id)
features/scan/hooks/useScans.ts  -> useQuery/useMutation ห่อฟังก์ชันข้างบน
features/scan/hooks/useScanSse.ts-> subscribe SSE สถานะ scan แบบ realtime
```

### โดเมนที่จะมี (map จาก service เดิม)
auth, user, repository, scan, issue, assign, comment, dashboard, notification, report, reporthistory, usersetting, sonarqube, security, technicaldebt, email

รายละเอียด endpoint ทุกตัว (method / path / payload / response) อยู่ใน
`docs/superpowers/specs/2026-07-24-backend-api-contract.md` และดู backend จริงได้ที่
`http://localhost:8080/v3/api-docs`

---

## 7. ทำไม "เหมือนเดิม แต่สวยกว่า" ถึงเป็นไปได้

เพราะเราแยกชั้นชัดเจน:

- **logic / flow / API / security** อยู่ในชั้น `api/` + `hooks/` + `lib/` -> ก๊อปพฤติกรรมจากของเดิมเป๊ะ
- **หน้าตา (UX/UI)** อยู่ในชั้น `pages/` + `components/` -> ออกแบบใหม่ด้วย design system ให้สวยขึ้น

เปลี่ยนหน้าตาได้โดยไม่แตะ logic => ฟีเจอร์ครบเท่าเดิม แต่หน้าตาสวยขึ้นและจัดการง่ายขึ้น

---

## 8. เฟส (Phase) ทั้งหมด

| Phase | คือ | สถานะ |
|---|---|---|
| 0 | Scaffold — วางโครง Vite+React+TS+Tailwind ให้ build ผ่าน | DONE |
| 1 | Foundation — api-client + interceptor, AuthContext, guard, i18n, layout/router, design system | DONE |
| 2 | หน้า Auth — login, register, reset-password, forgot-password, verify-email/success/failed | DONE |
| 3 | หน้าโดเมนทีละหมวด — dashboard -> repository -> scan -> issue -> report -> analytics -> settings (พร้อม api/hook ต่อโดเมน + UX/UI สวย) | DONE |
| 4 | Realtime — WebSocket แจ้งเตือน + comment ต่อ issue | DONE |
| CD | Deploy (self-hosted runner + nginx `/codereview/`) | ยังไม่ทำ |

ทุกเฟส: `npm run build` ต้องเขียว, commit + push ต่อ unit, ตอนทำ UI ใช้ design skills (frontend-design, emil-design-eng) + ตรวจด้วย Playwright

### หน้าที่ทำครบใน Phase 3 (21 route ไม่มี placeholder เหลือ)

| หมวด | หน้า | feature layer |
|---|---|---|
| Overview | `/dashboard` | ประกอบจาก repository + scan + issue hooks |
| Code | `/repositories`, `/addrepository`, `/settingrepo/:id`, `/detailrepo/:id` | `features/repository` |
| Code | `/scanhistory`, `/scanresult/:id`, `/logviewer/:id` | `features/scan` |
| Code | `/issue`, `/issuedetail/:id`, `/assignment` | `features/issue` |
| Analytics | `/analysis`, `/security-dashboard`, `/technical-debt` | `features/security` + `features/analytics/lib/technical-debt.ts` |
| Reports | `/generatereport`, `/reporthistory` | `features/report` |
| Settings | `/sonarqubeconfig`, `/notificationsetting`, `/usermanagement` (ADMIN) | `features/setting`, `features/user` |

ของกลางที่เพิ่มระหว่าง Phase 3: `lib/toast` (ToastProvider + useToast แทน SweetAlert2),
`components/common/{FormField, Switch, GateStatus, PageHeader}`, `components/charts/{DonutChart, BarList}`

### Phase 4 — Realtime (ทำครบแล้ว)

ชั้น infrastructure อยู่ที่ `src/lib/realtime/` (ไม่ import feature ใด ๆ):

| ไฟล์ | หน้าที่ |
|---|---|
| `stomp-client.ts` | STOMP over SockJS ตัวเดียวทั้งแอป: แนบ `Authorization` ตอน `beforeConnect`, reconnect 5 วิ, เก็บ handler ต่อ topic แล้ว re-subscribe ให้เองตอน connect ใหม่ |
| `topics.ts` | ชื่อ topic ทั้ง 7 ตัว (ตรงกับ backend เป๊ะ) |
| `types.ts` | event payload + map `PENDING -> SCANNING` |
| `RealtimeProvider.tsx` | เปิด/ปิด connection ตามสถานะ login, ให้ `isConnected` |
| `useRealtimeTopic.ts` | hook subscribe topic ไหนก็ได้ (คืน cleanup ให้อัตโนมัติ) |

การประกอบข้ามโดเมนอยู่ที่ `src/hooks/useAppRealtimeSync.ts` (ชั้น app ไม่ใช่ชั้น feature)
เพราะมันแตะหลายโดเมนพร้อมกัน: scan-status, projects, issues, verify-status
-> invalidate query cache ที่เกี่ยวข้อง + ขึ้น toast ตาม `NotificationSettings`
ต่อผ่าน route `RealtimeBoundary` (ProtectedRoute -> RealtimeBoundary -> RootLayout)

| Topic | ทำอะไรต่อ |
|---|---|
| `/topic/scan-status` | invalidate repository + scan-history + issues, toast เฉพาะ scan ที่เรากดเอง (`sessionStorage: _my_scan_projects` เหมือนของเดิม) แล้วสร้าง noti Scans / Quality Gate / Issues ต่อ |
| `/topic/notifications/{userId}` + `/global` | ยัดเข้า query cache (กันซ้ำด้วย id) + toast แบบ buffer 2 วิ ตามชนิด |
| `/topic/projects` | invalidate repositories + toast added/updated/deleted |
| `/topic/issues` | invalidate issue list + issue detail + issue analysis (AI fix) |
| `/topic/user/{userId}/verify-status` | ดึง user ใหม่ + อัปเดต login user + toast |
| `/topic/issue/{issueId}/comments` | `features/issue/hooks/useIssueCommentStream.ts` — คอมเมนต์ใหม่เด้งเข้าหน้า issue detail โดยไม่ต้อง refetch |

UI ใหม่: `features/notification` (api + hooks + `NotificationBell`) — กระดิ่งบน topbar
มี badge จำนวนที่ยังไม่อ่าน, tab All/Unread/Scans/Issues/System, mark all read,
คลิกแล้วเด้งไปหน้าที่เกี่ยวข้อง (issue / scan result / detail repo / report history)

---

## 8.1 Parity gap ที่ปิดไปแล้ว

| หน้า | ของที่เพิ่ม | หมายเหตุ |
|---|---|---|
| Topbar | `features/user/components/ProfileMenu` — เปลี่ยนรหัสผ่าน, ส่งอีเมลยืนยันซ้ำ, ยืนยันก่อน logout | ของเดิมอยู่ใน dropdown หน้า dashboard |
| Dashboard | กราฟ Quality Trends (coverage 30 วัน) | คำนวณจาก `/api/scans` ฝั่ง client |
| Scan History | เปรียบเทียบ 2-3 scan พร้อม delta ต่อ metric | เลือกด้วย checkbox |
| Issue | เลือกหลายรายการแล้ว assign ทีเดียว | ยิง `POST /api/issues/update` ทีละตัวแบบขนาน |
| Issue Detail | ตอบกลับคอมเมนต์ (ส่ง `parentCommentId`) | |
| Technical Debt | กราฟหนี้รายเดือน + action plan ที่ copy/download ได้ | |
| Security Dashboard | กราฟ vulnerabilities / hotspots จาก scan ล่าสุด | |

กราฟทั้งหมดใช้ `components/charts/LineChart` (SVG ล้วน ไม่มี dependency)
และ `features/scan/lib/scan-trends.ts` เป็นตัวปั้นข้อมูล

> backend จริงไม่มี endpoint `/dashboard/:userId/trends|history` (ดู `/v3/api-docs` — มี 55 endpoint)
> เทรนด์ทุกตัวจึงคำนวณจาก scan history ฝั่ง client

---

## 8.2 สิ่งที่ยังไม่ได้ทำ (known gaps)

### ก. พักไว้ตามที่ตกลง
- export รายงานฝั่ง client เป็น Excel / Word / PowerPoint (ของเดิมใช้ exceljs + docx + pptxgenjs)
  ตอนนี้รองรับ PDF ที่ backend เรนเดอร์ให้อย่างเดียว

### ข. backend ไม่รองรับ
- **assign พร้อม due date** — ของเดิมยิง `PUT /issues/assign/:issueId` และ `GET|PUT /assign/...`
  แต่ backend ปัจจุบันไม่มี endpoint กลุ่มนี้เลย (ยืนยันจาก `/v3/api-docs`)
  การมอบหมายทั้งหมดจึงผ่าน `POST /api/issues/update` ซึ่งรับแค่ `id`, `status`, `assignedTo`
- **ยกเลิก scan** — ของเดิมมี `cancelScan` แต่ backend ไม่มี `/scans/:id/cancel`

### ค. ไม่พอร์ตโดยตั้งใจ
- **SSE** (`/api/sse/subscribe?repoId=`) — ของเดิม `SseService` ถูก import ไว้แต่ **ไม่เคยถูกเรียกใช้จริง**
  (grep แล้วไม่มี call site) สถานะ scan realtime ใช้ WebSocket `/topic/scan-status` แทนทั้งหมด

### ง. ฝากไว้ให้ฝั่ง backend
- `GET /api/email-verification/confirm` redirect ไป `https://gpt.pccth.com/...` แบบ hardcode
  ทำให้ตอน dev บนเครื่อง คลิกลิงก์ยืนยันแล้วเด้งไป production ควรทำให้ config ตาม environment

---

## 8.1.1 กติกาสำคัญที่เจอตอนต่อ backend จริง

**`POST /api/reports/generate` บันทึก report history ให้เองอยู่แล้ว**
ฝั่ง frontend **ห้าม** เรียก `POST /report-history/create/{userId}` ซ้ำ ไม่งั้นได้ 2 แถวต่อการกด 1 ครั้ง
(ของเดิม Angular เรียกเอง เพราะตอนนั้น backend ยังไม่ทำให้ — ตรวจแล้วว่าตอนนี้ทำให้แล้ว)
ส่วน **notification ของ report** backend ไม่ได้สร้างให้ frontend ต้องสร้างเองผ่าน
`generateReportNotification` และเช็ค `NotificationSettings.reportsEnabled` ก่อน

**`GET /api/email-verification/confirm` เป็น 302 redirect ไม่ใช่ JSON API**
เรียกด้วย axios ไม่ได้ (โดน CORS ตอน follow redirect) หน้า `/verify-email` จึงใช้
`window.location.assign()` ส่ง browser ไปให้ backend จัดการแล้ว redirect กลับมาที่
`/verify-success` หรือ `/verify-failed` เอง

---

## 8.3 ผลทดสอบกับ backend จริง (localhost:8080)

ทดสอบด้วย Playwright ผ่าน UI จริงทั้งหมด ไม่ mock

**Security 7/8 ผ่าน**
- access token ไม่โผล่ใน localStorage / sessionStorage (มีแค่ `theme`, `app_lang`, `login_user`)
- `refresh_token` เป็น HttpOnly + Secure + SameSite=Strict อ่านจาก `document.cookie` ไม่ได้
- เข้า `/dashboard` โดยไม่ล็อกอิน -> เด้งไป `/login`
- user role `USER` เข้า `/usermanagement` ไม่ได้ -> เด้งกลับ dashboard
- เรียก API โดยไม่มี token -> 403
- logout แล้ว `login_user` ถูกล้าง
- ข้อที่ไม่ผ่านคือ `GET /ws/info` ไม่มี Authorization header ซึ่ง **ถูกต้องตาม protocol**
  (SockJS handshake ยังไม่ใช่ STOMP frame; auth อยู่ใน CONNECT frame) ไม่ใช่ช่องโหว่

**Flow จริง**
- login -> เปลี่ยน Git access token ในหน้า SonarQube Config -> `PUT /settings/sonarqube` 200 และค่าคงอยู่หลัง reload
- สั่ง scan `JDK25Test` (https://github.com/FiatTy/JDK25Test.git) -> `POST /{projectId}/scan` 202
- WebSocket ดันสถานะเป็น Analyzing ทันที, การ์ดและตัวนับ SCANNING ขยับเอง
- scan จบเป็น SUCCESS / quality gate OK
- คอมเมนต์ + ตอบกลับ (`parentCommentId`) ทำงานจริง แสดงผลแบบ thread

---

## 9. กติกาโค้ด

- ไม่มี emoji, ไม่มี comment (ใช้ชื่อฟังก์ชัน/ตัวแปรสื่อความหมายแทน)
- TypeScript strict (ไม่ใช้ `any` เว้นแต่ของเดิมใช้)
- ทุกการ fetch ต้องมี loading + error state
- i18n ทุกข้อความ (en / th), ใช้ design tokens ธีม teal, รองรับ light/dark
- security ตาม spec: access token อยู่ใน memory เท่านั้น, refresh ผ่าน httpOnly cookie, ห้ามเก็บ token ลง localStorage
