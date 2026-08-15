# เปิดให้เข้าถึงระบบขายจากภายนอก โดยที่ "แท็บเล็ตเป็นต้นทาง"

โหมด standalone ยกทั้งระบบลงไปอยู่ในแท็บเล็ต ([android-standalone.md](android-standalone.md))
เอกสารนี้ว่าด้วยส่วนที่ทำให้แท็บเล็ตเครื่องนั้น **แชร์ลิงก์ให้คนนอกร้านเข้าถึงได้** โดยไม่ต้องมีเครื่องคอมพิวเตอร์เลย

```
เบราว์เซอร์ที่ไหนก็ได้
        │ https
        ▼
   Cloudflare Edge
        │
   cloudflared            ← ไบนารีที่ฝังมากับ APK รันเป็นโปรเซสลูก
        │ http://127.0.0.1:8787
        ▼
   LocalHttpServer        ← HTTP server เขียนด้วย Java อยู่ในแอป
        │            │
   ไฟล์ static      /api/**
   (assets/public)       │
                    WebViewApiBridge
                         │ evaluateJavascript
                         ▼
                 window.__smileposServeApi
                         │
                    dispatch()  ← เราเตอร์ตัวเดียวกับที่หน้าจอในแท็บเล็ตใช้
                         ▼
                  prismaLite → SQLite
```

**หัวใจของการออกแบบ:** ไม่ได้เขียน API ขึ้นมาใหม่แม้แต่ตัวเดียว คำขอจากคนนอกวิ่งเข้า
`dispatch()` ตัวเดียวกับที่หน้าจอในแท็บเล็ตเรียก ข้อมูลที่คนนอกเห็นจึงตรงกับที่พนักงานเห็นเสมอ
โดยไม่มีทางหลุดออกจากกันได้

---

## เริ่มใช้งาน

### ตอน build

```powershell
npm run fetch:cloudflared            # arm64-v8a + x86_64 (เครื่องจริง + emulator)
npm run build:android:standalone
```

`fetch:cloudflared` ดาวน์โหลดไบนารีจาก GitHub release ของ Cloudflare มาวางไว้ที่
`android/app/src/main/jniLibs/<abi>/libcloudflared.so` (ไฟล์อยู่ใน `.gitignore` — ~35 MB ต่อ ABI)

| คำสั่ง | ผลลัพธ์ |
|---|---|
| `node scripts/fetch-cloudflared.js` | arm64-v8a + x86_64 · APK โตขึ้น ~60 MB |
| `node scripts/fetch-cloudflared.js --abi=arm64-v8a` | เฉพาะเครื่องจริง · APK โตขึ้น ~20 MB (**ใช้ตัวนี้ตอนปล่อยจริง**) |
| `node scripts/fetch-cloudflared.js --version=2026.7.3` | ล็อกเวอร์ชันแทน latest |

ถ้าไม่รัน APK ยัง build ได้ตามปกติ แค่หน้าตั้งค่าจะขึ้นข้อความว่ายังไม่ได้ฝังส่วนขยายมา

### ตอนใช้งานบนแท็บเล็ต

หน้า **ตั้งค่า → แบ็คอัพข้อมูล → CLOUDFLARE TUNNEL** มีให้เลือกสองแบบ

| | ลิงก์ชั่วคราว | โดเมนของร้าน |
|---|---|---|
| ต้องมีบัญชี Cloudflare | ไม่ต้อง | ต้องมี |
| ที่อยู่ | สุ่มใหม่ทุกครั้งที่เปิด (`*.trycloudflare.com`) | คงที่ |
| เหมาะกับ | ให้ดูงานชั่วคราว, ทดสอบ | ใช้ประจำ |
| ข้อจำกัดของ Cloudflare | ไม่รับประกัน uptime | ระดับ production |

**โหมดโดเมนของร้าน** ต้องตั้ง Public hostname ใน Zero Trust Dashboard ให้ชี้ไปที่
service `http://127.0.0.1:8787`

> ⚠️ ต้องเป็นตัวเลข `127.0.0.1` เท่านั้น **ห้ามใช้คำว่า `localhost`** — cloudflared บน Android
> แปลงชื่อโดเมนไม่ได้ (เหตุผลอยู่หัวข้อถัดไป) จะได้ 502 ทั้งที่ตั้งค่าถูกทุกอย่าง

---

## ปัญหา DNS ของ cloudflared บน Android และวิธีที่แก้ไว้

นี่คือจุดที่ยากที่สุดของฟีเจอร์นี้ และเป็นสาเหตุที่โค้ดหน้าตาแปลกกว่าที่ควรจะเป็น

cloudflared เป็นโปรแกรมภาษา Go แบบ static ตัวแปลชื่อโดเมนของ Go อ่านรายชื่อ DNS server
จาก `/etc/resolv.conf` — ไฟล์นี้ **ไม่มีอยู่บน Android** (ระบบใช้ตัวแปลของ bionic ผ่าน netd แทน)
เมื่ออ่านไม่ได้ Go จะถอยไปใช้ค่าเริ่มต้นคือ `127.0.0.1:53` กับ `[::1]:53` ซึ่งไม่มีใครฟังอยู่

```
failed to request quick Tunnel: Post "https://api.trycloudflare.com/tunnel":
  dial tcp: lookup api.trycloudflare.com on [::1]:53: read: connection refused
```

ทางแก้ที่ตรงที่สุดคือ build cloudflared ใหม่ด้วย Android NDK ให้เรียกตัวแปลของระบบผ่าน cgo
แต่นั่นบังคับให้ทุกเครื่องที่ build APK ต้องมี Go + NDK ซึ่งแพงเกินไปสำหรับสิ่งที่ควรเป็นแค่ `npm run`

**ทางที่เลือกแทน: ตัดการแปลงชื่อโดเมนออกจาก cloudflared ให้หมด** ฝั่ง Java แปลงชื่อผ่าน
`InetAddress` ซึ่งใช้ตัวแปลของ Android ได้ตามปกติ แล้วป้อนผลลัพธ์ให้ cloudflared เป็นตัวเลขล้วน

| ปลายทางที่ cloudflared ต้องติดต่อ | วิธีที่ใช้ |
|---|---|
| origin (ระบบขายในเครื่อง) | เป็น `127.0.0.1` อยู่แล้ว ไม่ต้องแปลง |
| edge ของ Cloudflare | Java แปลง `region1/region2.v2.argotunnel.com` แล้วส่ง IP ผ่านธง `--edge` |
| API ของ quick tunnel | ชี้ `--quick-service` มาที่ `CloudflareApiRelay` บน loopback แล้วให้ Java ยิง HTTPS ต่อให้ |

จุดที่เสียเวลาไปตอนทำ และเขียนไว้กันคนหลังพลาดซ้ำ:

- `--edge` รับ **ที่อยู่เดียวต่อหนึ่งธง** ส่งเป็นรายการคั่นจุลภาคจะได้ `too many colons in address`
- ช่วง cloudflared → `CloudflareApiRelay` เป็น **http ธรรมดา** บน loopback โดยตั้งใจ
  จะได้ไม่ต้องสร้างใบรับรองปลอมให้ Go เชื่อ ส่วนช่วง relay → Cloudflare ยังเป็น HTTPS เต็มรูปแบบ
- ตัวจับ URL จาก log ต้องล็อกไว้เฉพาะ `*.trycloudflare.com` / `*.cfargotunnel.com`
  เพราะบรรทัดแรกที่ cloudflared พิมพ์คือเงื่อนไขการใช้งานซึ่งมี `https://www.cloudflare.com/website-terms/`
  อยู่ข้างใน ถ้าจับกว้างไปจะได้ที่อยู่ผิดมาโชว์ให้ผู้ใช้กด

---

## เรื่องที่ระบบปฏิบัติการบังคับไว้

**ไบนารีต้องอยู่ใน `jniLibs` ชื่อ `libcloudflared.so`**
ตั้งแต่ Android 10 SELinux ห้ามแอป `execve()` ไฟล์ในโฟลเดอร์ข้อมูลของตัวเอง (กฎ W^X)
ดาวน์โหลดมาวางใน `filesDir` แล้วสั่งรันจะถูกปฏิเสธเสมอ ทางเดียวที่เหลือคือให้ตัวติดตั้งแตกไฟล์
ไปไว้ที่ `nativeLibraryDir` ซึ่งมีสิทธิ์ execute — และตัวติดตั้งจะแตกเฉพาะไฟล์ที่ขึ้นต้น `lib`
ลงท้าย `.so` ทั้งที่ของเราเป็น executable ไม่ใช่ shared library

ต้องคู่กับ `android:extractNativeLibs="true"` และ `useLegacyPackaging = true` ใน `build.gradle`
ค่าเริ่มต้นของ AGP รุ่นใหม่คือ map ตรงจาก APK ซึ่งจะไม่มีไฟล์จริงบนดิสก์ให้รัน

**Foreground service ประเภท `specialUse` ไม่ใช่ `dataSync`**
ตั้งแต่ Android 15 ประเภท `dataSync` ถูกจำกัดไว้ที่ 6 ชั่วโมงต่อวัน ซึ่งสั้นกว่าเวลาเปิดร้าน
พอครบเวลาระบบจะฆ่า service แล้วลิงก์ตายกลางวันโดยไม่มีสัญญาณเตือน

**สิทธิ์แจ้งเตือน (Android 13+)** ถ้าไม่ได้รับ service ยังทำงานแต่แถบสถานะจะถูกซ่อน
กลายเป็นว่าเครื่องเปิดให้เข้าจากภายนอกอยู่โดยผู้ใช้ไม่เห็นร่องรอยและไม่มีปุ่มหยุด — แย่กว่าไม่มีฟีเจอร์
แอปจึงขอสิทธิ์นี้ก่อนเปิด tunnel ทุกครั้ง

**โปรเซสกำพร้า** ลูกที่ `ProcessBuilder` สร้างไม่ตายตามพ่อ ถ้าระบบเก็บโปรเซสแอปไปตอนหน่วยความจำเต็ม
cloudflared ตัวเดิมจะยังต่อกับ edge อยู่แต่ยิงเข้าพอร์ตที่ไม่มีใครฟังแล้ว พอเปิดแอปใหม่จะได้
connector สองตัวต่อ tunnel เดียว Cloudflare กระจายทราฟฟิกให้ทั้งคู่ ครึ่งหนึ่งของคำขอจึงตกไปที่ตัวผี
— อาการคือ "เข้าได้บ้างไม่ได้บ้าง" `TunnelController` จึงจำ pid ไว้แล้วเก็บกวาดตอนเปิดแอปครั้งถัดไป
โดยตรวจ `/proc/<pid>/cmdline` ก่อนฆ่าเสมอเพราะหมายเลขโปรเซสถูกใช้ซ้ำได้

---

## bundle ชุดเดียว ใช้ได้ทั้งสองฝั่ง

หน้าเว็บที่คนนอกเปิดคือไฟล์ static ชุดเดียวกับที่อยู่ในแท็บเล็ต แต่ต้องทำงานคนละแบบ:

- **ในแท็บเล็ต** ตัวดัก fetch/axios จับ `/api/**` ไว้แล้วเรียก handler ในหน่วยความจำ
- **ในเบราว์เซอร์ปลายทาง** ต้องปล่อยให้ fetch วิ่งออกเน็ตจริง (กลับเข้ามาที่ `LocalHttpServer`)
  เพราะเครื่องนั้นไม่มี SQLite และไม่ควรมี

`LocalHttpServer` จึงแทรก `window.__SMILEPOS_REMOTE__ = true` ลงใน `<head>` ของทุกหน้า HTML
ที่มันเสิร์ฟ แล้ว `src/lib/mobile/bootstrap.ts` อ่านธงนี้เพื่อข้ามทั้งการติดตั้งตัวดักและการเปิดฐานข้อมูล

---

## โครงไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `tunnel/LocalHttpServer.java` | HTTP/1.1 server เสิร์ฟไฟล์ static + ส่งต่อ `/api/**` |
| `tunnel/WebViewApiBridge.java` | ยกคำขอข้ามภาษาเข้า WebView แล้วรอคำตอบ |
| `tunnel/CloudflaredProcess.java` | เปิด/เฝ้า/เปิดใหม่ cloudflared + แปลงที่อยู่ edge |
| `tunnel/CloudflareApiRelay.java` | ตัวกลางคุย `api.trycloudflare.com` แทน (แก้ปัญหา DNS) |
| `tunnel/TunnelController.java` | ถือสถานะจริงและค่าที่บันทึกไว้ ที่เดียวในระบบ |
| `tunnel/TunnelService.java` | foreground service + แถบแจ้งเตือน + ล็อกไม่ให้เครื่องหลับ |
| `tunnel/TunnelPlugin.java` | หน้าต่างที่ JS เรียกใช้ |
| `tunnel/LogBuffer.java` | บันทึกวงแหวนให้หน้าตั้งค่าอ่าน (แทน logcat ที่แท็บเล็ตเปิดดูไม่ได้) |
| `src/lib/mobile/native/tunnel.ts` | สะพานฝั่ง JS ไปยังปลั๊กอิน |
| `src/lib/mobile/api/remote-serve.ts` | รับคำขอจาก native แล้วส่งเข้า `dispatch()` |
| `src/lib/mobile/api/routes/tunnel.ts` | `/api/system/tunnel` เวอร์ชันแท็บเล็ต (สลับตอน build ใน `next.config.ts`) |
| `scripts/fetch-cloudflared.js` | ดาวน์โหลดไบนารีเข้า jniLibs |

---

## ความปลอดภัย

- HTTP server ผูกกับ `127.0.0.1` เท่านั้นโดยค่าเริ่มต้น เครื่องอื่นในวง LAN ยิงตรงไม่ได้
  ทางเข้าเดียวคือผ่าน Cloudflare (เปิดให้ LAN ได้ด้วยตัวเลือก `exposeLan`)
- **ลิงก์ที่ได้เปิดระบบขายสู่อินเทอร์เน็ต ใครมีลิงก์ก็เห็นหน้าเข้าสู่ระบบ** ด่านกั้นเดียวคือรหัสผ่านผู้ใช้
  ร้านที่ต้องการมากกว่านั้นควรเปิด Cloudflare Access ครอบ hostname ไว้อีกชั้น (ทำได้เฉพาะโหมดโดเมนของร้าน)
- token ของ tunnel เก็บใน SharedPreferences ซึ่งเป็นพื้นที่ส่วนตัวของแอป
  และถูกปิดบังใน log ทุกจุดที่พิมพ์บรรทัดคำสั่งออกมา

## ข้อจำกัดที่ยังอยู่

- คำขอจากภายนอกทุกคำขอต้องผ่าน WebView ซึ่งเป็นเธรดเดียวกับหน้าจอของแอป
  คนนอกโหลดรายงานหนัก ๆ จะทำให้หน้าจอในแท็บเล็ตหน่วงตามไปด้วย
- แอปต้องเปิดค้างไว้ (ย่อลงได้) — ปิดแอปทิ้ง = ลิงก์ตาย
- ฟีเจอร์ที่ใช้ไม่ได้ในโหมด standalone อยู่แล้ว (อัปโหลดไฟล์, พิมพ์ผ่าน Windows, อ่านบัตรประชาชน)
  ก็ยังใช้ไม่ได้เมื่อเข้าผ่านลิงก์ — ดู [android-standalone.md](android-standalone.md)
- body ของคำขอจำกัดที่ 8 MB และ handler ที่ใช้เวลาเกิน 60 วินาทีจะถูกตัด
