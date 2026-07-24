# Backend API Contract & Types — Code Review (สำหรับ Re-Stack เป็น React)

> **คู่กับ:** `2026-07-24-restack-angular-to-vite-react-design.md` (สถาปัตย์/security/routing/CI)
> **จุดประสงค์:** เอกสาร handoff ให้ AI/ทีม สร้าง React ที่ **เรียก API เหมือนเดิมทุก endpoint** — contract, payload, response type, realtime, และ mapping เป็น custom hooks ครบในไฟล์เดียว
> **ที่มา:** ถอดจากซอร์ส Angular เดิม `D:\pccth_code_review_web-dev-local\src\app\{services,interface}`

---

## 0. กติกาการอ่านเอกสารนี้

- **Base URL** = `VITE_API_BASE` → prod `/backend`, dev `http://localhost:8080` (path ในตารางต่อท้าย base)
- **Auth** = ทุก endpoint ที่ไม่ใช่ auth-flow จะได้ header `Authorization: Bearer <accessToken>` จาก **axios interceptor กลาง** (ไม่ต้องแนบเองรายจุด — ของเดิมแนบซ้ำใน service แต่ React ทำที่ instance เดียว)
- **withCredentials** ต้องเปิดเฉพาะ `login` / `refresh` / `logout` (ส่ง httpOnly refresh cookie)
- คอลัมน์ **Req** = body/params, **Res** = response type (นิยามใน §Types)

---

## 1. React mapping convention (โครงที่ต้องทำตาม)

แต่ละ Angular `*.service.ts` → แตกเป็น 2 ชั้นใน React (ห้ามยกทั้ง service มาตรง ๆ):

```
features/<domain>/
├─ api/<domain>.api.ts    ← ฟังก์ชันเรียก axios (คืน Promise) — pure, ไม่มี state
├─ hooks/use<Thing>.ts    ← custom hook ครอบด้วย TanStack Query (useQuery/useMutation)
├─ types.ts               ← types เฉพาะโดเมน (จาก §Types)
└─ components/            ← UI
```

| Angular เดิม | React ใหม่ |
|---|---|
| `@Injectable service` + `HttpClient` | `features/<x>/api/<x>.api.ts` (axios) |
| method ที่คืน `Observable` | `features/<x>/hooks/useXxx.ts` → `useQuery`/`useMutation` |
| `authOpts()` แนบ Bearer รายจุด | axios instance interceptor (ที่เดียว) |
| **shared-data services** (`*-data.service.ts` = `BehaviorSubject` state: notification-data, report-history-data, user-settings-data, technicaldebt-data, shared-data, history-data) | React Query cache หรือ Zustand/Context store — **ไม่ทำเป็น service** |
| pipes (`markdown`, `time-ago`, `severity-*`, `status-*`, `thb-currency`, `truncate`, `user-status`, `debt-time`) | util functions ใน `lib/` หรือ component เล็ก |
| utils (`chart.utils`, `format.utils`, `password-validator.utils`) | คง logic เดิม ย้ายไป `lib/` |

> **หลัก:** service→(api + custom hook), state store→React Query/Zustand, pipe→util. ไม่มี pattern Angular ตกค้าง (DI, RxJS operator chains) ใน React

---

## 2. Auth (features/auth) — ⚠️ security-critical (ดูรายละเอียด flow ใน design doc §7)

| Method | Path | Auth | Req | Res | Notes |
|---|---|---|---|---|---|
| POST | `/user/login` | ไม่แนบ token | `LoginRequest` | `LoginResponse` | **withCredentials** |
| POST | `/user/refresh` | ไม่แนบ token | `{}` | `RefreshResponse` | **withCredentials** |
| POST | `/user/logout` | ไม่แนบ token | `{}` | `text` | **withCredentials**, `responseType:'text'` |
| POST | `/user/register` | ไม่แนบ token | `RegisterRequest` | — | |
| POST | `/user/reset-password` | (แนบถ้ามี) | `{ token, newPassword }` | — | |
| GET | `/user/reset-password/validate` | — | query `token` | `{ status: string }` | |
| POST | `/user/forgot-password` | — | `{ email }` | — | (email.service) |

หลัง login สำเร็จ (ลำดับสำคัญ — กัน race): `setAccessToken` → `setLoginUser` → connect WebSocket(userId) → load notifications + user settings + report history

**Custom hooks:** `useLogin()`, `useLogout()`, `useRegister()`, `useRefresh()` (mutation); `useResetPassword()`, `useValidateResetToken(token)`, `useForgotPassword()`

---

## 3. User & User Management (features/user, features/settings/usermanagement)

| Method | Path | Req | Res | Notes |
|---|---|---|---|---|
| PUT | `/user/change-password` | `{ currentPassword, newPassword }` | `text` | จาก `ChangePasswordData` |
| POST | `/api/email-verification/send` | `{ userId }` | `void` | |
| POST | `/api/email-verification/confirm` | `{ token }` | `void` | |
| GET | `/user/search-user/:id` | — | `User` | |
| POST | `/auth/verify/resend` | `{ email }` | `User` | |
| GET | `/user/all-user` | — | `UserInfo[]` | หน้า usermanagement (ADMIN) |
| POST | `/user/new-user` | `UserInfo` | `UserInfo[]` | |
| DELETE | `/user/delete-user/:id` | — | `UserInfo[]` | |
| PUT | `/user/update-user/:id` | `UserInfo` | `UserInfo[]` | |
| POST | `/api/email/send` | payload (email) | — | ส่งอีเมลทั่วไป (email.service) |

**Hooks:** `useChangePassword()`, `useUser(id)`, `useUsers()`, `useAddUser()`, `useDeleteUser()`, `useEditUser()`, `useSendVerifyEmail()`, `useConfirmVerifyEmail()`, `useResendVerify()`

---

## 4. Repository (features/repository)

| Method | Path | Req | Res | Notes |
|---|---|---|---|---|
| GET | `/repository/all-repository` | — | project[] → map เป็น `Repository[]` | scan อยู่ใน `project.scanData` (map + หา latest + คำนวณ status) |
| GET | `/repository/search-repositories/:projectId` | — | `Repository` | |
| GET | `/api/:projectId` | — | project → `Repository` | getFullRepository |
| POST | `/repository/new-repository` | `Partial<Repository>` | `Repository` | |
| PUT | `/repository/update-repository/:projectId` | `Partial<Repository>` | `Repository` | |
| DELETE | `/repository/delete-repository/:projectId` | — | `void` | |
| POST | `/:projectId/scan` | `ScanTriggerRequest` (ดู §Types) | any | trigger scan; จำ projectId ที่เพิ่งสั่งใน `sessionStorage['_my_scan_projects']` |
| GET | `/api/scans/:scanId` | — | scan | |

> **หมายเหตุ mapping:** `getAllRepo` ทำ normalize metric key ทั้ง camelCase และ snake_case (`code_smells`↔`codeSmells`, `duplicated_lines_density`↔`duplicatedLinesDensity` ฯลฯ) — React ต้องคง logic map นี้ ไม่งั้นตัวเลขหน้า repo เพี้ยน

**Hooks:** `useRepositories()`, `useRepository(projectId)`, `useFullRepository(projectId)`, `useAddRepo()`, `useUpdateRepo()`, `useDeleteRepo()`, `useTriggerScan()`

---

## 5. Scan (features/scan)

| Method | Path | Req | Res | Notes |
|---|---|---|---|---|
| POST | `/scans/:projectId` | `ScanRequest {username?,password?}` | `Scan` | startScan |
| GET | `/scans/getProject/:userId` | query `userId` | `Scan[]` | getAllScan (+map status/qualityGate) |
| GET | `/scans/:scanId` | — | `Scan` | getByScanId (+normalize metrics) |
| GET | `/scans/:id/log` | — | `ScanLogModel {scanId, line[]}` | logviewer |
| POST | `/scans/:id/cancel` | `null` | `Scan` | |
| GET | `/api/scans` | — | `ScanResponseDTO[]` | getScansHistory |
| GET | `/api/scans/:scanId` | — | `ScanResponseDTO` | getScanById |

> status map เดิม: `SUCCESS/ACTIVE→Active`, `FAILED/ERROR→Error`, `PENDING/SCANNING→Scanning`; qualityGate: `OK→Passed` อื่น `→Failed` — React คงไว้

**Hooks:** `useStartScan()`, `useScans()`, `useScan(scanId)`, `useScanLog(id)`, `useCancelScan()`, `useScanHistory()`

### 5.1 SSE (realtime scan status ต่อ repo)
| ช่องทาง | Path | Req | Notes |
|---|---|---|---|
| `EventSource` | `/api/sse/subscribe?repoId=` | query `repoId` | native `EventSource`; hook `useScanSse(repoId)` |

---

## 6. Issue + Assignment + Comment (features/issue)

### 6.1 Issue
| Method | Path | Req | Res |
|---|---|---|---|
| GET | `/api/issues` | — | `IssuesResponseDTO[]` |
| GET | `/api/issues/:id` | — | `IssuesResponseDTO` |
| POST | `/api/issues/update` | `IssuesRequestDTO {id,status?,assignedTo?}` | `IssuesResponseDTO` |
| GET | `/api/issue-details/:id` | — | `IssuesDetailResponseDTO` |
| POST | `/api/recommend-fix-ai` | `{ projectId, issueId }` | `{ issueId, message }` |

### 6.2 Assignment
| Method | Path | Req | Res |
|---|---|---|---|
| PUT | `/issues/assign/:issueId` | `{ assignTo, dueDate }` | — |
| GET | `/assign/:userId` | — | `AssignHistory[]` |
| PUT | `/assign/update/:userId/:issueId` | `UpdateStatusRequest {status, annotation?}` | `AssignHistory[]` |

### 6.3 Comment
| Method | Path | Req | Res | Notes |
|---|---|---|---|---|
| GET | `/:issueId/comments` | — | `IssueCommentModel[]` | header `Content-Type: application/json` |
| POST | `/:issueId/comments` | `{ comment }` + query `userId` | `IssueCommentModel` | |
| POST | `/api/comments` | `commentRequestDTO` | `commentResponseDTO` | updateComments |

**Hooks:** `useIssues()`, `useIssue(id)`, `useIssueDetails(id)`, `useUpdateIssue()`, `useRecommendFixAi()`, `useAssignHistory(userId)`, `useAssignIssue()`, `useUpdateAssignStatus()`, `useIssueComments(issueId)`, `useAddComment()`

---

## 7. Dashboard (features/dashboard)

| Method | Path | Req | Res |
|---|---|---|---|
| GET | `/dashboard/:userId` | — | `Dashboard[]` (ดู `DashboardData`) |
| GET | `/dashboard/:userId/history` | — | history[] |
| GET | `/dashboard/:userId/trends` | — | trends[] |

**Hooks:** `useDashboard(userId)`, `useDashboardHistory(userId)`, `useDashboardTrends(userId)`

---

## 8. Notification (features/notification)

| Method | Path | Req | Res |
|---|---|---|---|
| GET | `/notifications/:userId` | — | `Notification[]` |
| PATCH | `/notifications/:id/read` | `{}` | `void` |
| PATCH | `/notifications/:userId/read-all` | `{}` | `void` |
| POST | `/notifications` | `NotificationRequest` | `Notification` |

> ฝั่ง client มี logic กันแจ้งเตือนซ้ำ (`notifiedIssueIds`, `notifiedQualityGateScanIds`) + auto-generate noti จาก issues/quality-gate ที่ fail — React ย้าย logic นี้ไป hook/store (ไม่ใช่ backend)

**Hooks:** `useNotifications(userId)`, `useMarkAsRead()`, `useMarkAllAsRead()`, `useCreateNotification()`

---

## 9. Report / Export / History (features/report)

| Method | Path | Req | Res | Notes |
|---|---|---|---|---|
| POST | `/api/reports/generate` | `ReportGenerateRequest` | `ReportGenerateResponse` | base64 ไฟล์ |
| POST | `/export/generate` | `ExportReportRequest` | `Blob` | `responseType:'blob'`, `Content-Type: application/json` |
| GET | `/report-history/:userId` | — | `ReportHistory[]` | |
| GET | `/report-history/search/:userId` | query `keyword` | `ReportHistory[]` | |
| POST | `/report-history/create/:userId` | `ReportHistoryRequest` | `ReportHistory` | |

> การ gen ไฟล์จริง (excel/pdf/word/ppt) ทำฝั่ง client ด้วย `xlsx`/`jspdf`/`docx`/`pptxgenjs` (services `report-generator/*`) — ใช้ไลบรารีเดิมได้เลย

**Hooks:** `useGenerateReport()`, `useExportReport()`, `useReportHistory(userId)`, `useSearchReportHistory()`, `useCreateReportHistory()`

---

## 10. Settings: Notification + SonarQube (features/settings)

| Method | Path | Req | Res |
|---|---|---|---|
| GET | `/settings/notification/:userId` | — | `NotificationSettings` |
| PUT | `/settings/notification` | `NotificationSettings` payload | `NotificationSettings` |
| GET | `/settings/sonarqube/:userId` | — | `SonarQubeConfig` (ตัวใน user_settings) |
| PUT | `/settings/sonarqube` | `SonarQubeConfig` payload | `SonarQubeConfig` |
| POST | (sonarqube test-connection — ดู `sonarqube.service.ts`) | `SonarQubeTestConnectRequest {sonarHostUrl, sonarToken}` | `SonarQubeTestConnectResponse {connected}` |

**Hooks:** `useNotificationSettings(userId)`, `useUpdateNotificationSettings()`, `useSonarConfig(userId)`, `useUpdateSonarConfig()`, `useTestSonarConnection()`

---

## 11. Analytics: Security + Technical Debt (features/analytics)

| Method | Path | Req | Res | Notes |
|---|---|---|---|---|
| GET | `/api/security/metrics` หรือ `/api/security/metrics/:projectId` | — | `SecurityMetricsResponse` → map เป็น `SecurityMetrics` client-side | |
| GET | `/api/get-issue-by-security` | — | `SecurityIssueDTO[]` | |

- **Technical Debt: ❌ ไม่มี backend endpoint** — คำนวณฝั่ง client จาก scan metrics (`technicaldebt.service.ts`: รวม `technicalDebtMinutes`, แปลงเป็น days/hours/minutes ที่ 480 นาที/วัน, จัด Top 5 debt items ตาม `debtRatio`) → React ทำใน hook/util
- **Security aggregate** (`toMetrics`, `prettify`, OWASP label) ก็ map ฝั่ง client — คงไว้

**Hooks:** `useSecurityMetrics(projectId?)`, `useSecurityIssues()`, `useTechnicalDebt()` (derived จาก scan history)

---

## 12. Realtime: WebSocket (STOMP over SockJS)

- **Endpoint:** `new SockJS(`${API_BASE}/ws`)` → STOMP `Client`, `reconnectDelay: 5000`
- **CONNECT header:** `Authorization: Bearer <accessToken>` (ตั้งใน `beforeConnect`; ถ้าไม่มี token → deactivate)
- **ต่อหลัง login** ด้วย `userId`; reconnect/เปลี่ยน user → resubscribe private topics
- **ไลบรารี:** `@stomp/stompjs` + `sockjs-client` (เดิม) — ห่อใน `useNotificationSocket()` / provider เดียว

| # | Topic | ขอบเขต | Payload | ใช้ทำอะไร |
|---|---|---|---|---|
| 1 | `/topic/scan-status` | public | `{ projectId, scanId?|id?, status: PENDING\|SUCCESS\|FAILED }` | อัปเดตสถานะ scan (map `PENDING→SCANNING`) |
| 2 | `/topic/notifications/{userId}` | private | `NotificationEvent` | แจ้งเตือนส่วนตัว |
| 3 | `/topic/notifications/global` | public | `GlobalNotificationEvent` | broadcast (dedupe by `id`) |
| 4 | `/topic/projects` | public | `ProjectChangeEvent {action, projectId, projectName}` | repo add/edit/delete |
| 5 | `/topic/user/{userId}/verify-status` | private | `UserVerifyStatusEvent {userId, status}` | สถานะยืนยันอีเมล |
| 6 | `/topic/issues` | public | `IssueChangeEvent {action:'UPDATED', issueId}` | issue เปลี่ยน (assign/status) |
| 7 | `/topic/issue/{issueId}/comments` | on-demand | comment object | คอมเมนต์แบบ realtime ต่อ issue |

---

## 13. Types (พอร์ตจาก `interface/` + type ใน service — ใช้ตรง ๆ ใน React ได้)

```ts
// ---------- Auth / User ----------
export interface UserInfo { id: string; username: string; password: string; email: string; phone?: string; role: 'USER' | 'ADMIN'; status: string; }
export interface LoginUser { id: string; username: string; email: string; phone?: string; role: string; status: string; }
export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { accessToken: string; id: string; username: string; email: string; phone: string; role: string; status: string; }
export interface RefreshResponse { accessToken: string; }
export interface RegisterRequest { username: string; email: string; phone: string; password: string; }
export interface User { id: string; username: string; email: string; phoneNumber: string; status: string; }
export interface ChangePasswordData { oldPassword: string; newPassword: string; confirmPassword: string; } // body ส่งจริง = { currentPassword, newPassword }

// ---------- Repository ----------
export interface Repository {
  id?: string; projectId?: string; user?: string; name: string; repositoryUrl: string;
  projectType?: 'ANGULAR' | 'SPRING_BOOT'; projectTypeLabel?: string; branch?: string; sonarProjectKey?: string;
  costPerDay?: number; createdAt?: Date; updatedAt?: Date; scans?: ScanResponseDTO[]; scanId?: string;
  status?: 'Active' | 'Scanning' | 'Error'; lastScan?: Date; scanningProgress?: number; qualityGate?: string;
  metrics?: { bugs?: number; vulnerabilities?: number; codeSmells?: number; coverage?: number; duplications?: number;
    debtRatio?: number; analysisLogs?: { message: string; timestamp: number }[]; securityRating?: string;
    securityHotspots?: number; reliabilityRating?: string; technicalDebtMinutes?: number; maintainabilityRating?: string;
    duplicatedLinesDensity?: number; };
  issues?: Issue[];
}
// body สั่งสแกน POST /:projectId/scan
export interface ScanTriggerRequest {
  branch: string; sonarToken: string; serverUrl: string | null; gitToken: string | null;
  angularSettings: { runNpm: boolean; coverage: boolean; tsFiles: boolean; exclusions: string };
  springSettings: { runTests: boolean; jacoco: boolean; buildTool: string; jdkVersion: number };
  qualityGateSettings: { failOnError: boolean; coverageThreshold: number; maxBugs: number; maxVulnerabilities: number;
    maxCodeSmells: number; qgMaxDuplications: number; qgMaxSecurityHotspots: number };
}

// ---------- Scan ----------
export type ScanStatus = 'Active' | 'Scanning' | 'Error' | 'Cancelled';
export interface ScanRequest { username?: string; password?: string; }
export interface ScanLogModel { scanId: string; line: string[]; }
export interface ScanResponseDTO {
  id: string; project: any; status: 'PENDING' | 'SUCCESS' | 'FAILED'; startedAt: string; completedAt?: string;
  qualityGate?: string | null;
  metrics: { analysisLogs: { message: string; timestamp: number }[]; bugs: number; codeSmells: number; coverage: number;
    debtRatio: number; duplicatedLinesDensity: number; maintainabilityRating?: string; reliabilityRating?: string;
    securityHotspots: number; securityRating?: string; technicalDebtMinutes: number; vulnerabilities: number; } | null;
  logFilePath?: string | null; issueData: [];
}

// ---------- Issue / Comment ----------
export interface IssuesResponseDTO {
  id: string; scanId: string; projectId?: string; projectData?: { id: string; name: string };
  issueKey: string; type: string; severity: string; ruleKey: string; component: string; line: number; message: string;
  assignedTo?: { id: string; username: string; email: string; role: string; phone: string; createAt: string };
  status: string; createdAt: string; commentData: commentResponseDTO[];
}
export interface IssuesRequestDTO { id: string; status?: string | null; assignedTo?: string | null; }
export interface IssuesDetailResponseDTO { description: string; vulnerableCode: string; recommendedFix: string; recommendedFixByAi?: string | null; status?: string | null; }
export interface commentRequestDTO { issueId?: string; userId?: string; comment?: string; parentCommentId?: string; }
export interface commentResponseDTO { id: string; issue: string; user: UserInfo; comment: string; createdAt: string; parentCommentId?: string; }
export interface IssueCommentModel { commentId?: string; issueId: string; userId: string; username?: string; comment: string; createdAt: string; }

// ---------- Assign ----------
export interface AssignHistory { userId: string; assignedTo: string; assignedToName: string; issueId: string; severity: string; message: string; status: string; dueDate: string | null; annotation: string; own: boolean; }
export interface UpdateStatusRequest { status: string; annotation?: string | null; }

// ---------- Dashboard ----------
export interface DashboardData {
  id: string; name: string; qualityGate: { status: 'OK' | 'ERROR'; conditions: Condition[] };
  metrics: { bugs: number; vulnerabilities: number; codeSmells: number; coverage: number; duplications?: number; technicalDebt?: string };
  issues: Issue[]; securityHotspots: SecurityHotspot[]; history: ScanHistory[]; coverageHistory: number[]; maintainabilityGate: string; days: number[];
}
export interface Condition { metric: string; status: 'OK' | 'ERROR'; actual: number; threshold: number; }
export interface Issue { id: number; type: string; severity: 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR'; message: string; project: string; }
export interface SecurityHotspot { id: number; status: 'REVIEWED' | 'TO_REVIEW'; description: string; project: string; }
export interface ScanHistory { scanId: string; projectId: string; project: string; typeproject: 'Angular' | 'SpringBoot'; status: 'Passed' | 'Failed' | ''; grade: string | null; time: string; maintainabilityGate: string | null; }

// ---------- Notification ----------
export interface Notification { id: string; userId: string; type: string; title: string; message: string; isRead: boolean; createdAt: Date; relatedProjectId?: string; relatedScanId?: string; relatedIssueId?: string; relatedCommentId?: string; }
export interface NotificationRequest { userId: string; type: string; title: string; message: string; relatedProjectId?: string; relatedScanId?: string; relatedIssueId?: string; relatedCommentId?: string; isBroadcast?: boolean; }

// ---------- Report ----------
export interface ReportGenerateSections { qualityGate: boolean; issueBreakdown: boolean; securityAnalysis: boolean; technicalDebt: boolean; recommendations: boolean; }
export interface ReportGenerateRequest { projectId: string; dateFrom: string; dateTo: string; format: 'pdf'; sections: ReportGenerateSections; userId?: string; generatedBy?: string; }
export interface ReportGenerateResponse { fileName: string; mimeType: string; base64: string; fileSizeBytes: number; generatedAt: string; }
export interface ExportReportRequest { projectId: string; dateFrom: string; dateTo: string; outputFormat: string; includeSections: string[]; }
export interface ReportHistory { id: string; userId: string; projectId: string; projectName: string; dateFrom: string; dateTo: string; format: string; generatedBy: string; generatedAt: Date; includeQualityGate: boolean; includeIssueBreakdown: boolean; includeSecurityAnalysis: boolean; includeTechnicalDebt: boolean; includeRecommendations: boolean; snapshotData: any; fileSizeBytes: number; }
export interface ReportHistoryRequest { projectId: string; projectName: string; dateFrom: string; dateTo: string; format: string; generatedBy?: string; includeQualityGate?: boolean; includeIssueBreakdown?: boolean; includeSecurityAnalysis?: boolean; includeTechnicalDebt?: boolean; includeRecommendations?: boolean; snapshotData?: any; fileSizeBytes?: number; }

// ---------- Settings / SonarQube ----------
export interface NotificationSettings { id: string; userId: string; scansEnabled: boolean; issuesEnabled: boolean; systemEnabled: boolean; reportsEnabled: boolean; createdAt: Date; updatedAt: Date; }
export interface SonarQubeConfig { id: string; userId: string; serverUrl: string; authToken?: string; organization: string; gitAccessToken?: string; angularRunNpm: boolean; angularCoverage: boolean; angularTsFiles: boolean; angularExclusions: string; springRunTests: boolean; springJacoco: boolean; springBuildTool: string; springJdkVersion: number; qgFailOnError: boolean; qgCoverageThreshold: number; qgMaxBugs: number; qgMaxVulnerabilities: number; qgMaxCodeSmells: number; qgMaxDuplications: number; qgMaxSecurityHotspots: number; createdAt: Date; updatedAt: Date; }
export interface SonarQubeTestConnectRequest { sonarHostUrl: string; sonarToken: string; }
export interface SonarQubeTestConnectResponse { connected: boolean; }

// ---------- Security ----------
export interface SecurityIssueDTO { id: string; scanId: string; issueKey: string; type: string; severity: string; ruleKey: string; component: string; line: number; message: string; assignedTo: string | null; status: string; createdAt: string; commentData: { id: string; issue: string; user: string; comment: string; createdAt: string }[]; }
export interface SecurityCountItemDTO { name: string; count: number; status: string | null; }
export interface SecurityMetricsResponse { score: number; riskLevel: string; vulnerabilities: SecurityCountItemDTO[]; hotIssues: SecurityCountItemDTO[]; owaspCoverage: SecurityCountItemDTO[]; }
export interface SecurityMetrics { score: number; riskLevel: string; hotIssues: { name: string; count: number }[]; vulnerabilities: { severity: string; count: number; color: string }[]; owaspCoverage: { name: string; status: 'pass' | 'warning' | 'fail'; count: number }[]; }

// ---------- WebSocket events ----------
export type UiScanStatus = 'SCANNING' | 'SUCCESS' | 'FAILED';
export interface ScanEvent { projectId: string; scanId: string; status: UiScanStatus; }
export interface NotificationEvent { id: string; userId: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; relatedProjectId?: string; relatedScanId?: string; relatedIssueId?: string; relatedCommentId?: string; }
export type GlobalNotificationEvent = NotificationEvent;
export interface ProjectChangeEvent { action: 'ADDED' | 'UPDATED' | 'DELETED'; projectId: string; projectName: string; }
export interface IssueChangeEvent { action: 'UPDATED'; issueId: string; }
export interface UserVerifyStatusEvent { userId: string; status: 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED'; }
```

---

## 14. หมายเหตุ handoff (ให้ AI/ทีมอ่านก่อนลงมือ)

1. เอกสารนี้ = **contract หลัก** ใช้คู่กับ design doc (สถาปัตย์/security) — อ่านทั้งสองก่อนเริ่ม
2. path/method/type ในนี้ **ถอดตรงจากซอร์สจริง** — ให้ยึดตามนี้; ถ้าจุดไหนกำกวมให้เปิดไฟล์ service เดิมที่อ้างชื่อไว้
3. ห้ามยก Angular service มาตรง ๆ — ทำเป็น `api/ + custom hook (TanStack Query)` ตาม §1
4. state ที่เดิมเป็น `*-data.service` (BehaviorSubject) → React Query cache / Zustand ไม่ใช่ service
5. logic map/normalize (scan status, metric key camel↔snake, security prettify, technical-debt calc) **ต้องคงไว้** — ไม่งั้นเลขหน้า UI เพี้ยนแม้ API ถูก
6. UI re-design ได้อิสระ แต่ **data ที่แต่ละหน้าแสดง + action ที่ยิง ต้องเท่าเดิม**
