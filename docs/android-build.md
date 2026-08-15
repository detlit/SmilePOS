# Android Build (.apk) — โหมดจับคู่ server

> **มีสองโหมดให้เลือก** เอกสารนี้เป็นโหมดจับคู่ server (แท็บเล็ตเป็น client)
> ถ้าต้องการ APK ที่มีทั้งหน้าจอและฐานข้อมูลอยู่ในเครื่อง ใช้งานได้โดยไม่ต้องมี server เลย
> ดู [android-standalone.md](./android-standalone.md)
>
> | | จับคู่ server (เอกสารนี้) | standalone |
> |---|---|---|
> | ข้อมูลอยู่ที่ | PostgreSQL เครื่องเคาน์เตอร์ | SQLite ในแท็บเล็ต |
> | ต้องมี Wi-Fi | ต้องมี | ไม่ต้อง |
> | หลายเครื่องเห็นข้อมูลเดียวกัน | เห็น | ไม่เห็น (ต่างเครื่องต่างข้อมูล) |
> | แก้หน้าจอแล้ว | แท็บเล็ตได้ของใหม่ทันที | ต้อง build APK ใหม่ |

แอป Android ในโหมดนี้เป็น **เปลือก native (Capacitor)** ไม่ได้ฝัง UI ทั้งระบบไว้ในเครื่อง

แท็บเล็ตทำงานเป็น **client** ที่คุยกับเครื่องเคาน์เตอร์ในร้านผ่าน LAN — เครื่องเดียวกับที่รัน
Electron ในโหมด Server อยู่แล้ว

```
แท็บเล็ต Android                          เครื่องเคาน์เตอร์ Windows
┌────────────────────────┐                ┌──────────────────────────────┐
│ SmilePOS.apk           │                │ Electron (โหมด Server)        │
│  ├ หน้าจับคู่ (ใน APK)  │                │  Docker :4500 / Bridge :4001 │
│  ├ ปลั๊กอิน native      │◄──── LAN ─────►│    └► Next.js :4000          │
│  └ WebView ────────────┼───────────────►│  Print agent ─► เครื่องพิมพ์   │
└────────────────────────┘                │  PostgreSQL :5433            │
                                          └──────────────────────────────┘
```

**ผลที่ได้:** แก้หน้าจอที่ server ที่เดียว แท็บเล็ตทุกเครื่องได้ของใหม่ทันทีโดยไม่ต้องแจก APK ใหม่
จะ build APK ใหม่ก็ต่อเมื่อแก้ `mobile-shell/` หรือเพิ่มความสามารถ native เท่านั้น

---

## สิ่งที่ต้องติดตั้งก่อน (ครั้งเดียว)

| เครื่องมือ | เวอร์ชัน | หมายเหตุ |
|---|---|---|
| JDK | 21 (Temurin) | ตั้ง `JAVA_HOME` ให้ชี้ไปที่โฟลเดอร์ JDK |
| Android SDK | Platform 36 + Build-Tools | ติดตั้งผ่าน Android Studio หรือ commandline-tools |
| `ANDROID_HOME` | — | ปกติคือ `%LOCALAPPDATA%\Android\Sdk` |

ตรวจว่าพร้อมแล้วด้วย:

```powershell
java -version
adb version
```

ถ้าไม่อยากตั้ง `ANDROID_HOME` สร้างไฟล์ `android/local.properties` แทนได้:

```properties
sdk.dir=C\:\\Users\\User\\AppData\\Local\\Android\\Sdk
```

---

## คำสั่ง

```powershell
npm run android:sync             # ซิงก์ mobile-shell/ + ปลั๊กอิน เข้าโปรเจกต์ android/
npm run android:open             # เปิดใน Android Studio
npm run android:dev              # live reload ระหว่างพัฒนา
npm run build:android            # APK debug
npm run build:android:release    # APK release (ต้องมี keystore)
npm run build:android:bundle     # AAB สำหรับ Play Console
```

ผลลัพธ์ออกที่ `dist_android/SmilePOS-<version>-<debug|release>.apk`

ติดตั้งลงเครื่องที่เสียบ USB:

```powershell
adb install -r dist_android\SmilePOS-0.1.0-debug.apk
```

ไม่มีแท็บเล็ตจริงให้ทดสอบ ใช้โปรแกรมจำลองแทนได้ — ดู [android-emulator.md](./android-emulator.md)

```powershell
npm run android:emulator         # เปิดเครื่องจำลอง + ติดตั้ง + เปิดแอปให้ในคำสั่งเดียว
```

---

## การเซ็นแอป (release)

สร้าง keystore ครั้งเดียวแล้วเก็บให้ดี:

```powershell
keytool -genkey -v -keystore smilepos-release.jks -keyalg RSA `
        -keysize 2048 -validity 10000 -alias smilepos
```

> ⚠️ **สำรอง keystore ไว้หลายที่** ถ้าไฟล์นี้หาย จะอัปเดตแอปที่ติดตั้งไปแล้วไม่ได้อีกเลย
> ต้องถอนการติดตั้งแล้วลงใหม่ทุกเครื่อง

ตั้งค่าก่อน build — **อ่านจาก environment variable เท่านั้น ห้าม commit ลง git**:

```powershell
$env:ANDROID_KEYSTORE_PATH="D:\keys\smilepos-release.jks"
$env:ANDROID_KEYSTORE_PASSWORD="..."
$env:ANDROID_KEY_ALIAS="smilepos"
$env:ANDROID_KEY_PASSWORD="..."

npm run build:android:release
```

`android/.gitignore` และ `.gitignore` ที่ root กัน `*.jks`, `*.keystore`, `keystore.properties` ไว้แล้ว

---

## การจับคู่กับ Server ในร้าน

1. หาเลข IP ของเครื่องเคาน์เตอร์ในวง LAN (`ipconfig` ดูค่า IPv4 ของการ์ด Wi-Fi/LAN)
2. ที่แท็บเล็ต เปิดแอป กรอกเลข IP แล้วกด **เชื่อมต่อ**
3. แอปจะตรวจ `/api/health` ก่อน แล้วเข้าหน้า `/web/mobile/index`

### พอร์ตที่ต้องใช้ — ขึ้นกับว่าติดตั้งแบบไหน

| วิธีติดตั้ง | พอร์ต | กรอกที่แท็บเล็ต |
|---|---|---|
| Docker Compose (หลัก) | **4500** | `192.168.1.100` — เติมให้อัตโนมัติ |
| Electron โหมด Server | 4001 | `192.168.1.100:4001` — ต้องใส่เอง |

ค่าเริ่มต้นคือ **4500** ตาม `docker-compose.yml` ที่ map `4500:3000`
แก้ค่าเริ่มต้นได้ที่ `DEFAULT_PORT` ใน [mobile-shell/connect.js](../mobile-shell/connect.js)

> ⚠️ ถ้าเครื่องรัน SmilePOS หลาย stack พร้อมกัน ให้ตรวจด้วย `docker ps` ว่าพอร์ตไหน
> เป็นของ container ตัวที่ต้องการ — กรอกผิดพอร์ตจะไปเจอ stack เก่าที่ยังไม่มี `/api/health`

ค่าที่จับคู่ถูกเก็บไว้ ครั้งต่อไปเปิดแอปจะเข้าระบบให้อัตโนมัติ

**เปลี่ยน server ทีหลัง:** เรียก `resetServerPairing()` จาก `@/lib/runtime/native`
หรือเปิดหน้า shell ตรง ๆ ที่ `https://localhost/index.html#setup`

### ต่อไม่ได้ ตรวจตามนี้

| อาการ | สาเหตุที่พบบ่อย |
|---|---|
| เชื่อมต่อหมดเวลา | แท็บเล็ตอยู่คนละ Wi-Fi หรือใช้ Guest Wi-Fi ที่กันเครื่องคุยกัน |
| ปฏิเสธการเชื่อมต่อ | server ยังไม่ได้เปิด หรือ Firewall ปิดพอร์ตอยู่ |
| ตอบ 404 ที่ `/api/health` | กรอกถูกพอร์ตของ stack อื่นที่เป็นเวอร์ชันเก่า — ตรวจด้วย `docker ps` |
| ตอบกลับแต่ไม่ใช่ Smile POS | กรอก IP ผิดเครื่อง |

---

## การพิมพ์

แท็บเล็ตไม่มีเครื่องพิมพ์ต่ออยู่ จึงส่งงานให้เครื่องเคาน์เตอร์พิมพ์แทน:

```
แท็บเล็ต ──POST /api/print/jobs──► คิวในหน่วยความจำของ Next server
                                        │ SSE /api/print/stream
                                        ▼
                              Electron print agent (เครื่องเคาน์เตอร์)
                                        │ enqueuePrintSilent() ตัวเดิม
                                        ▼
                                   เครื่องพิมพ์ USB
                                        │
   แท็บเล็ตได้ผลจริง ◄──POST /api/print/result──┘
```

ใบเสร็จจึงหน้าตาเหมือนกับที่สั่งพิมพ์จากเครื่องเคาน์เตอร์ทุกประการ เพราะใช้โค้ดพิมพ์ตัวเดียวกัน

Print agent เริ่มทำงานเองเมื่อ Electron เข้าโหมด Server และต่อใหม่อัตโนมัติทุก 5 วินาทีถ้าหลุด
ถ้า server รันใน Docker (ไม่มี Electron) `/api/print/jobs` จะตอบ `503` พร้อมข้อความบอกสาเหตุ

**ยังไม่รองรับ:** พิมพ์ผ่าน Bluetooth ESC/POS โดยตรงจากแท็บเล็ต — ต้องทำเทมเพลตใบเสร็จ
แบบข้อความแยกอีกชุด (แปลง HTML ที่มีอยู่เป็น ESC/POS อัตโนมัติไม่ได้) ดู
`printViaBluetooth()` ใน [src/lib/runtime/print.ts](../src/lib/runtime/print.ts)

---

## โครงไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `capacitor.config.ts` | appId, allowNavigation ของวง LAN, cleartext |
| `mobile-shell/` | หน้าจับคู่ server ที่ฝังใน APK (ไม่ใช่ UI ของระบบ) |
| `android/` | โปรเจกต์ Android (commit เข้า repo) |
| `android/app/src/main/res/xml/network_security_config.xml` | อนุญาต HTTP ในวง LAN |
| `src/lib/runtime/platform.ts` | ตรวจว่ารันอยู่บนแพลตฟอร์มไหน |
| `src/lib/runtime/native.ts` | เรียกปลั๊กอิน Capacitor แบบ lazy |
| `src/lib/runtime/print.ts` | พิมพ์แบบข้ามแพลตฟอร์ม |
| `src/lib/runtime/scanner.ts` | สแกนบาร์โค้ดแบบข้ามแพลตฟอร์ม |
| `src/components/NativeAppShell.tsx` | ปุ่ม Back, safe area, แบนเนอร์ออฟไลน์ |
| `src/lib/printQueue.ts` | คิวงานพิมพ์ฝั่ง server |
| `scripts/build-android.js` | สคริปต์ build/เซ็น |

---

## ข้อควรรู้

- **ไม่รองรับโหมดออฟไลน์** ข้อมูลทั้งหมดอยู่บน PostgreSQL ที่เครื่องเคาน์เตอร์
  ขาด Wi-Fi = ขายไม่ได้ (ตั้งใจออกแบบแบบนี้ เพื่อไม่ให้สต๊อกกับเลขที่บิลชนกัน)
- **การแจกจ่าย** ตั้งใจให้ side-load / MDM ภายในร้าน ไม่ใช่ Play Store
  (Google ไม่รับแอปที่เป็น WebView ห่อเว็บเปล่า ๆ) ถ้าต้องขึ้น Play Store จริง
  ต้องเปลี่ยนไปฝัง UI ใน APK แบบ static export ซึ่งเป็นงานอีกชุดหนึ่ง
- **ความปลอดภัย** ใช้ HTTP ธรรมดาในวง LAN ปิดของร้าน ถ้าจะใช้ข้ามเครือข่ายสาธารณะ
  ต้องทำ HTTPS ก่อน แล้วแก้ `network_security_config.xml`
- **หน้าที่ยังไม่ได้ปรับ:** `product`, `checkin` (face-api), `gift`, `voice` (Vosk)
  โดยเฉพาะสองตัวหลังกินทรัพยากรหนักบน WebView ต้องประเมินแยก
