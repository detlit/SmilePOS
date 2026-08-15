# Android แบบ Standalone (.apk ที่มีทั้ง UI และฐานข้อมูลในเครื่อง)

โหมดนี้ยก **ทั้งระบบ** ลงไปอยู่ในแท็บเล็ต ไม่ต้องมีเครื่องเคาน์เตอร์ ไม่ต้องมี Docker
ไม่ต้องมี Wi-Fi ติดตั้ง `.apk` แล้วเปิดใช้ได้เลย

```
แท็บเล็ต Android (ไม่ต้องต่อกับอะไรเลย)
┌────────────────────────────────────────────────────────┐
│ SmilePOS.apk                                           │
│                                                        │
│  หน้าจอทั้ง 58 หน้า (Next.js static export)             │
│        │ axios / fetch ไปที่ "/api/..." เหมือนเดิม      │
│        ▼                                               │
│  เราเตอร์ในเครื่อง (src/lib/mobile/api/router.ts)       │
│        │ เรียก route handler ตัวเดิมจาก src/app/api     │
│        ▼                                               │
│  prismaLite — รับคำสั่งหน้าตาเดียวกับ Prisma Client      │
│        ▼                                               │
│  SQLite (ไฟล์ในเครื่อง)                                 │
└────────────────────────────────────────────────────────┘
```

**หัวใจของการยกระบบลงมา:** ไม่ได้เขียน API ใหม่สักตัว
โค้ดใน `src/app/api` ทั้ง 299 ตัวถูกนำมา bundle ใส่ APK แล้วรันในเครื่องตามเดิม
สิ่งที่เปลี่ยนคือ "สิ่งที่อยู่ข้างใต้" ซึ่งสลับตอน build ผ่าน `next.config.ts`

| ของเดิม (server) | ของใหม่ (ในเครื่อง) |
|---|---|
| `@/lib/prisma` (Prisma + PostgreSQL) | `src/lib/mobile/db/prismaLite.ts` (SQLite) |
| `next/server` | `src/lib/mobile/api/next-server-shim.ts` |
| `next/cache` | `src/lib/mobile/api/next-cache-shim.ts` |
| `@/lib/jwt` (jsonwebtoken) | `src/lib/mobile/jwt.ts` (HS256 เขียนเอง) |
| Next.js server รับ HTTP | `src/lib/mobile/api/router.ts` + ตัวดัก axios/fetch |

---

## คำสั่ง

```powershell
npm run build:android:standalone            # APK debug
npm run build:android:standalone:release    # APK release (ต้องมี keystore)
npm run build:android:standalone:bundle     # AAB สำหรับ Play Console

npm run build:mobile-web                    # หยุดแค่ static export (ไล่แก้ error ตอน build)
npm run test:mobile                         # ทดสอบชั้นข้อมูลทั้งหมดโดยไม่ต้องมีเครื่อง Android
```

ผลลัพธ์ออกที่ `dist_android/SmilePOS-<version>-<debug|release>.apk`

ติดตั้ง: `adb install -r dist_android\SmilePOS-0.1.0-debug.apk`

### สิ่งที่ต้องมีก่อน build

| เครื่องมือ | เวอร์ชัน |
|---|---|
| JDK | 21 (ตั้ง `JAVA_HOME`) |
| Android SDK | Platform 36 + Build-Tools (ตั้ง `ANDROID_HOME` หรือใส่ใน `android/local.properties`) |

> โหมดนี้ **ยัง build ได้แม้ไม่มี Docker หรือ PostgreSQL** เพราะไม่ต้องต่อฐานข้อมูลตอน build

---

## โหมดจับคู่ server (ของเดิม) ยังอยู่

ทั้งสองโหมดใช้ซอร์สชุดเดียวกัน ต่างกันแค่คำสั่ง build

| | จับคู่ server | standalone |
|---|---|---|
| คำสั่ง | `npm run build:android` | `npm run build:android:standalone` |
| อยู่ใน APK | หน้าจับคู่อย่างเดียว | ทั้งระบบ + ฐานข้อมูล |
| ข้อมูลอยู่ที่ | PostgreSQL เครื่องเคาน์เตอร์ | SQLite ในแท็บเล็ต |
| ต้องมี Wi-Fi | ต้องมี | ไม่ต้อง |
| หลายเครื่องเห็นข้อมูลเดียวกัน | เห็น | **ไม่เห็น** — ต่างเครื่องต่างข้อมูล |
| แก้หน้าจอแล้ว | แท็บเล็ตได้ของใหม่ทันที | ต้อง build APK ใหม่ |

`MainActivity.java` ดูธง `standalone` ใน `capacitor.config.json` เพื่อตัดสินใจ
เครื่องที่เคยจับคู่ server ไว้แล้วมาลง APK แบบ standalone ทับ จะไม่วิ่งกลับไปหา server เก่า

---

## ⚠️ ข้อจำกัดที่ต้องรู้ก่อนเอาไปใช้จริง

**ข้อมูลของแต่ละเครื่องแยกกันสมบูรณ์** ไม่มีการซิงก์
ถ้าร้านมีแท็บเล็ตสองเครื่อง จะกลายเป็นสองร้านที่ไม่รู้จักกัน — สต๊อกไม่ตรง เลขที่บิลชนกัน

โหมดนี้จึงเหมาะกับ **ร้านที่ใช้เครื่องเดียว** ถ้าต้องใช้หลายเครื่องพร้อมกัน
ให้ใช้โหมดจับคู่ server แทน หรือทำระบบซิงก์เพิ่ม (ยังไม่มีในตอนนี้)

**สำรองข้อมูล** ไฟล์ SQLite อยู่ใน private storage ของแอป — ถอนการติดตั้ง = ข้อมูลหายทั้งหมด

---

## เปิดให้เข้าถึงจากนอกร้าน

แท็บเล็ตแชร์ลิงก์ให้เข้าระบบขายจากที่ไหนก็ได้ผ่าน Cloudflare Tunnel ที่รันอยู่ในเครื่องเอง
ต้องรัน `npm run fetch:cloudflared` ก่อน build หนึ่งครั้ง — รายละเอียดทั้งหมดอยู่ที่
[android-tunnel.md](android-tunnel.md)

---

## ฟังก์ชันที่ใช้ไม่ได้ในโหมดนี้

ระบบจะตอบกลับด้วยข้อความภาษาไทยที่บอกสาเหตุ ไม่ได้เงียบหายไป

| กลุ่ม | สาเหตุ | อาการที่ผู้ใช้เห็น |
|---|---|---|
| อัปโหลด/จัดการไฟล์ (รูปสินค้า, เอกสารแนบ, สำรองข้อมูล) | ต้องใช้ระบบไฟล์ของ Node | HTTP 500 พร้อมข้อความอธิบาย |
| นำเข้า CSV | อ่านไฟล์เทมเพลตจากดิสก์ | เหมือนกัน |
| สั่งพิมพ์ผ่านไดรเวอร์ Windows | ต้องมีเครื่องคอมพิวเตอร์ | เหมือนกัน |
| บัตรประชาชน (smartcard) | ต้องมีเครื่องอ่านต่อกับ Windows | เหมือนกัน |
| OneDrive / อัปเดตระบบ | สั่ง PowerShell บน Windows | เหมือนกัน |
| โอนสินค้าข้ามสาขา | ต้องคุยกับสาขาอื่นผ่านเน็ต | ต่อไม่ได้ |
| วิดีโอคอล | ต้องมี signaling server | หน้าไม่ถูกฝังลง APK |
| `/api/setting/uploadImage` | ใช้ `next/cache` ของฝั่ง server | HTTP 501 |
| `/api/fix-sequence` | ใช้ sequence ของ PostgreSQL | โยน `UnsupportedSqlError` |

---

## โครงไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `src/lib/mobile/db/schema.generated.ts` | DDL + metadata ของ 85 model (สร้างจาก schema.prisma) |
| `src/lib/mobile/db/sqlite.ts` | เปิด/ปิดฐานข้อมูล คุยกับปลั๊กอิน Capacitor |
| `src/lib/mobile/db/migrate.ts` | สร้างตาราง + เติมคอลัมน์ใหม่ตอนอัปเดตแอป |
| `src/lib/mobile/db/prismaLite.ts` | รับคำสั่งแบบ Prisma แล้วแปลงเป็น SQL |
| `src/lib/mobile/db/queryBuilder.ts` | แปลง where/orderBy + แปลงชนิดข้อมูลไป-กลับ |
| `src/lib/mobile/db/pgDialect.ts` | แปล SQL ดิบจากภาษา PostgreSQL เป็น SQLite |
| `src/lib/mobile/api/router.ts` | จับคู่ path แล้วเรียก route handler |
| `src/lib/mobile/api/interceptor.ts` | ดัก axios/fetch ที่ยิงไป `/api/**` |
| `src/lib/mobile/bootstrap.ts` | ลำดับการเริ่มระบบตอนเปิดแอป |
| `src/components/StandaloneBootstrap.tsx` | กั้นหน้าจอไว้จนฐานข้อมูลพร้อม |
| `scripts/gen-sqlite-schema.js` | สร้าง schema.generated.ts จาก schema.prisma |
| `scripts/gen-api-registry.js` | สร้างตารางเส้นทาง API |
| `scripts/build-android-standalone.js` | สคริปต์ build ทั้งชุด |

---

## แก้ schema แล้วต้องทำอะไร

1. แก้ `prisma/schema.prisma` ตามปกติ (ฝั่ง server ใช้ไฟล์เดิมนี้)
2. `npm run gen:sqlite-schema` — สคริปต์ build เรียกให้อัตโนมัติอยู่แล้ว
3. **เพิ่มตาราง/เพิ่มคอลัมน์** ระบบเติมให้เองตอนเปิดแอปครั้งถัดไป ไม่ต้องทำอะไรเพิ่ม
4. **เปลี่ยนชนิด / เปลี่ยนชื่อ / ลบคอลัมน์** ทำอัตโนมัติไม่ได้ ต้องเขียนคำสั่งลงใน
   `MANUAL_MIGRATIONS` ใน `migrate.ts` แล้วเพิ่มเลข `SCHEMA_VERSION`

---

## การทดสอบ

`npm run test:mobile` รันได้บนเครื่องพัฒนาโดยไม่ต้องมีแท็บเล็ต โดยใช้ `node:sqlite` แทนปลั๊กอิน

| ชุด | ทดสอบอะไร |
|---|---|
| `test:mobile-db` | prismaLite ให้ผลตรงกับ Prisma — where/orderBy/include/increment/aggregate/groupBy/transaction |
| `test:mobile-jwt` | token ที่ออกจากแท็บเล็ตกับที่ออกจาก server อ่านข้ามกันได้ |
| `test:mobile-sql` | ตัวแปลภาษา SQL — รวมการนับยอดขายรายวันตามเวลาไทย |
| `test:mobile-api` | ยิง `/api/...` เข้า route handler ตัวจริงตั้งแต่ต้นจนจบ |

จุดที่ต้องระวังเป็นพิเศษและมีเทสต์คุมไว้แล้ว:

- **การเรียง NULL** PostgreSQL เรียง NULL ไว้ท้ายเมื่อ ASC ส่วน SQLite เรียงไว้หน้า
  `queryBuilder.ts` ใส่คีย์ `IS NULL` นำหน้าทุกครั้งเพื่อให้ลำดับตรงกัน
- **เขตเวลา** รายงานยอดขายกรุ๊ปตามวันแบบเวลาไทย ไม่ใช่ UTC
  (ขายตอน 01:30 ของวันที่ 16 ต้องนับเป็นวันที่ 16 ไม่ใช่ 15)
- **`contains` ที่สนตัวพิมพ์ใหญ่-เล็ก** Prisma บน PostgreSQL สนตัวพิมพ์ถ้าไม่ระบุ `mode`
  แต่ `LIKE` ของ SQLite ไม่สน จึงต้องใช้ `instr()` แทนเพื่อให้ผลตรงกัน

---

## หมายเหตุทางเทคนิค

**ทำไม `pageExtensions` ถึงเหลือแค่ `tsx`/`jsx`**
`output: "export"` รับเฉพาะ route ที่ render เป็นไฟล์นิ่งได้ แต่ handler เกือบทุกตัวอ่านค่าจาก request
บังเอิญว่า handler ทั้ง 300 ตัวเป็น `route.ts` ส่วนหน้าจอเป็น `.tsx`/`.jsx` ล้วน
การตัด `ts` ออกจึงซ่อน route ทั้งหมดจาก App Router ได้พอดี โดยไม่ต้องย้ายไฟล์
(วิธีย้ายไฟล์เคยลองแล้วพัง เพราะ `next dev` ที่รันค้างจับ handle โฟลเดอร์ไว้)

**ทำไมใช้ `NormalModuleReplacementPlugin` ไม่ใช่ `resolve.alias`**
Next ลงทะเบียนตัว resolve ของ tsconfig `paths` (`@/*` → `src/*`) ไว้ และมัน **ชนะ** `resolve.alias`
ตอนแรกที่ใช้ alias ระบบ build ผ่านเรียบร้อยแต่ route ทั้งหมดยังชี้ไป Prisma ตัวจริง
สังเกตได้จาก warning `PrismaClient is not exported` เท่านั้น ซึ่งพลาดได้ง่ายมาก

**`distDir` ของโหมด mobile ตั้งเป็น `out`**
ขั้นตอน export ของ Next เขียนทับ `distDir` ด้วยไฟล์เว็บนิ่งทั้งหมด ตั้งเป็น `out` ไปเลย
จึงได้ผลลัพธ์ตรงตำแหน่งที่ Capacitor คาดหวัง และไม่ไปทับ `.next` ของ dev server ที่อาจรันอยู่
