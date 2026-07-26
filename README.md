# PCCTH Automate Code Review — Frontend

## Requirements

| ตัว     | เวอร์ชัน                                                       |
| ------- | -------------------------------------------------------------- |
| Node    | 20.19+ หรือ 22.12+                                             |
| npm     | 10+                                                            |
| Backend | `pccth_code_review_service` รันอยู่ที่ `http://localhost:8080` |

## Quick start

```bash
npm install
cp .env.example .env      # แก้ VITE_API_BASE ให้ชี้ไป backend
npm run dev               # เปิด http://localhost:5173/codereview/
```

backend เปิด CORS ให้แค่ port `5173` เท่านั้น ตอน dev อย่าเปลี่ยน port

## Scripts

| คำสั่ง            | ทำอะไร                                |
| ----------------- | ------------------------------------- |
| `npm run dev`     | รัน dev server แก้โค้ดแล้วเห็นผลทันที |
| `npm run build`   | เช็ค type แล้ว build ลง `dist/`       |
| `npm run preview` | เปิดดูของที่ build แล้ว               |
| `npm run lint`    | ตรวจโค้ดด้วย ESLint                   |
| `npm test`        | รัน unit test                         |

## Structure

```
src/
  main.tsx          จุดเริ่มของแอป โหลดธีมกับภาษาแล้วสั่ง render
  App.tsx           ครอบ provider ทั้งหมด (query, toast, router)
  router.tsx        รวม route ทุกหน้าไว้ที่เดียว

  assets/           รูปภาพ โลโก้ ที่ import เข้าโค้ด
  locales/          ไฟล์แปลภาษา en.json / th.json
  styles/           สีธีม ตัวแปร CSS และ animation

  pages/            หน้าเว็บ 1 route = 1 ไฟล์
  layouts/          โครงหน้าหลัง login (sidebar + topbar)
  routes/           ตัวกันทาง เช็ค login / เช็ค role ก่อนเข้าหน้า

  features/         แยกตามงาน 1 โฟลเดอร์ = 1 เรื่อง
    <ชื่องาน>/
      api/          ฟังก์ชันยิง backend
      hooks/        ห่อ api ให้หน้าเว็บเรียกง่าย จัดการ loading/error ให้
      components/   UI ที่ใช้เฉพาะงานนี้
      lib/          การคำนวณของงานนี้ ไม่เกี่ยวกับ UI
      types.ts      หน้าตาข้อมูลของงานนี้

  components/       UI ที่ใช้ข้ามงาน
    common/         ปุ่ม ฟอร์ม modal ทั่วไป
    charts/         กราฟ

  hooks/            hook ที่ใช้หลายงานพร้อมกัน ไม่ใช่ของงานไหนงานเดียว
  lib/              ของกลางที่ไม่ใช่ UI (ยิง API, auth, realtime, ธีม, ภาษา)
  types/            type ที่ใช้ข้ามงาน
```

## ข้อกำหนดของแต่ละส่วน

**features/** — ของใครของมัน
งานหนึ่งเรื่องเก็บไว้ที่เดียวจบ อยากรู้เรื่อง scan เปิดโฟลเดอร์ `scan/` อ่านที่เดียวครบ
ห้าม feature เรียกหากันเอง ถ้า 2 feature ต้องใช้ข้อมูลร่วมกัน ให้ `pages/` เป็นคนดึงมาต่อกัน

**api/ กับ hooks/** — แยกกันคนละชั้น
`api/` ยิง backend อย่างเดียว ไม่รู้จัก React
`hooks/` ห่อ `api/` อีกที จัดการ loading / error / cache ให้หน้าเว็บ
หน้าเว็บเรียก `hooks/` เท่านั้น ไม่เรียก `api/` ตรง

**components/ กับ hooks/ ข้างนอก** — ย้ายขึ้นมาเมื่อมีคนใช้จริง 2 เจ้า
เริ่มจากเก็บไว้ใน feature ก่อนเสมอ พอ feature ที่สองต้องใช้จริงค่อยย้ายขึ้นมา
อย่าย้ายขึ้นมาเพราะ "คิดว่าน่าจะได้ใช้อีก"

**lib/** — ห้ามเรียก features/
`lib/` เป็นชั้นล่างสุด ถ้ามันเรียก `features/` จะกลายเป็นวนกลับ (circular)
`types/` มีไว้เพราะเหตุนี้ เอา type ที่ `lib/` ต้องใช้มาไว้ตรงกลาง

**pages/** — เป็นคนประกอบ ไม่ใช่คนคิด
หน้าเว็บมีหน้าที่จัดวางกับเรียก hook เท่านั้น
ถ้าเริ่มมีสูตรคำนวณยาว ๆ ให้ย้ายไป `features/<ชื่องาน>/lib/`

**กฎรวมทุกไฟล์**

- TypeScript strict ห้ามใช้ `any`
- ข้อความที่ผู้ใช้เห็นต้องผ่าน i18n ครบทั้ง `en` และ `th`
- ทุกที่ที่ยิง API ต้องมีทั้งตอนโหลดและตอน error


