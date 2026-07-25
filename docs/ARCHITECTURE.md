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
  hooks/                hook ที่ใช้ร่วมข้ามโดเมน
  lib/                  ของที่ไม่ใช่ UI:
    api-client.ts           axios instance + interceptor (หัวใจ security)
    auth/                   AuthContext + token store (in-memory)
    i18n.ts, theme.ts       ตั้งค่าภาษา / ธีม
    utils.ts                ฟังก์ชันช่วยทั่วไป (แทน Angular pipe)
  types/                type กลางที่ใช้หลายโดเมน
```

---

## 4. `.gitkeep` คืออะไร

git **ไม่เก็บโฟลเดอร์ว่าง**. `.gitkeep` คือไฟล์เปล่า ๆ ที่ใส่ไว้เพื่อให้โฟลเดอร์ว่าง "ติด" ไปกับ git ตอนวางโครง

- ไม่มีผลกับการทำงานของแอปเลย เป็นแค่หมุดกันโฟลเดอร์ไว้
- พอโฟลเดอร์นั้นมีไฟล์จริงแล้ว เรา **ลบ `.gitkeep` ทิ้ง**
- ตอนนี้เหลืออยู่ไม่กี่ที่ (โฟลเดอร์ที่ยังว่าง เช่น `src/hooks/`) จะหายไปเองเมื่อมีไฟล์จริง

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
| 4 | Realtime — WebSocket แจ้งเตือน + comment ต่อ issue, SSE สถานะ scan | ถัดไป |
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

ยังไม่ได้ทำ (ค้างจาก Phase 3): export รายงานเป็น Excel / Word / PowerPoint ฝั่ง client
(ของเดิมใช้ exceljs + docx + pptxgenjs) — ตอนนี้รองรับ PDF ที่ backend เรนเดอร์ให้อย่างเดียว

---

## 9. กติกาโค้ด

- ไม่มี emoji, ไม่มี comment (ใช้ชื่อฟังก์ชัน/ตัวแปรสื่อความหมายแทน)
- TypeScript strict (ไม่ใช้ `any` เว้นแต่ของเดิมใช้)
- ทุกการ fetch ต้องมี loading + error state
- i18n ทุกข้อความ (en / th), ใช้ design tokens ธีม teal, รองรับ light/dark
- security ตาม spec: access token อยู่ใน memory เท่านั้น, refresh ผ่าน httpOnly cookie, ห้ามเก็บ token ลง localStorage
