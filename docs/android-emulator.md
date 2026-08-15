# รันบนโปรแกรมจำลอง Android (Emulator)

> ใช้ทดสอบแอปแท็บเล็ตบนเครื่องพัฒนาโดยไม่ต้องมีแท็บเล็ตจริง
> สำหรับการ build APK ดู [android-build.md](./android-build.md) (โหมดจับคู่ server)
> และ [android-standalone.md](./android-standalone.md) (โหมดข้อมูลในเครื่อง)

---

## คำสั่ง

```powershell
npm run android:emulator              # เปิดเครื่องจำลอง + ติดตั้ง APK ล่าสุดใน dist_android/ + เปิดแอป
npm run android:emulator:build        # build APK ใหม่ก่อน (โหมดจับคู่ server)
npm run android:emulator:standalone   # build APK ใหม่ก่อน (โหมด standalone)
npm run android:emulator:pair         # build โหมดจับคู่ + ชี้ไปที่ server บนเครื่องนี้ให้เลย
npm run android:emulator:reset        # ล้างค่าที่จับคู่ไว้ กลับไปหน้ากรอก IP
```

ธงเพิ่มเติมส่งผ่าน `node scripts/run-android-emulator.js` ได้ตรง ๆ:

| ธง | ผล |
|---|---|
| `--server=192.168.1.100:4500` | เขียนค่าจับคู่ให้เลย ไม่ต้องกรอกที่หน้าจอ (เฉพาะ APK debug) |
| `--server=host` | ย่อของ `10.0.2.2` — server ที่รันบนเครื่อง Windows เครื่องนี้ |
| `--reset` | ล้างค่าที่จับคู่ไว้ |
| `--cold` | บูตใหม่ทั้งเครื่อง ไม่โหลด snapshot (ใช้ตอนเครื่องจำลองมีอาการแปลก) |

ปิดเครื่องจำลอง: `adb emu kill`

---

## สิ่งที่ต้องติดตั้งก่อน (ครั้งเดียว)

นอกจาก JDK + Android SDK ตาม [android-build.md](./android-build.md) ต้องมีเพิ่มอีกสองแพ็กเกจ:

```powershell
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
& "$sdk\cmdline-tools\latest\bin\sdkmanager.bat" "emulator" "system-images;android-36;google_apis;x86_64"
```

ประมาณ 1.3 GB — ใช้ `google_apis` (ไม่ใช่ `google_apis_playstore`) เพราะมี Google Play services
ให้ ML Kit ใช้สแกนบาร์โค้ด แต่ยัง `adb root` ได้

ตัวเครื่องจำลอง (AVD) ชื่อ `SmilePOS_Tablet` สคริปต์สร้างให้เองอัตโนมัติถ้ายังไม่มี:

| ค่า | ตั้งเป็น | เหตุผล |
|---|---|---|
| โปรไฟล์ | `medium_tablet` (2560×1600) | ใกล้เคียงแท็บเล็ตที่ใช้หน้าร้าน |
| RAM / heap | 4096 MB / 512 MB | ค่า default 1.9 GB / 192 MB ไม่พอกับ WebView ที่โหลด Next.js ทั้งระบบ + SQLite |
| การหมุนจอ | landscape | เครื่องขายหน้าร้านใช้แนวนอน |
| `hw.keyboard` | yes | ให้พิมพ์จากคีย์บอร์ดคอมได้ (ค่า default ปิดไว้) |
| กล้องหน้า/หลัง | emulated | ใช้ทดสอบสแกนบาร์โค้ด |
| GPU | host | เร็วกว่า software rendering มาก |

แก้ค่าเหล่านี้ได้ที่ `tuneAvdConfig()` ใน [scripts/run-android-emulator.js](../scripts/run-android-emulator.js)
หรือแก้ตรง ๆ ที่ `%USERPROFILE%\.android\avd\SmilePOS_Tablet.avd\config.ini`

---

## เรื่องเครือข่าย — ทำไมต้องใช้ 10.0.2.2

```
เครื่องจำลอง Android                    เครื่อง Windows (host)
┌──────────────────────┐               ┌──────────────────────────────┐
│ eth0  10.0.2.15      │               │ Docker :4500 ─► Next.js      │
│ wlan0 10.0.2.16      │──► 10.0.2.2 ─►│ Electron โหมด Server :4001   │
│                      │    (host)     │ 127.0.0.1 / 192.168.1.x      │
└──────────────────────┘               └──────────────────────────────┘
```

ในเครื่องจำลอง `127.0.0.1` คือ **ตัวเครื่องจำลองเอง** ไม่ใช่เครื่อง Windows
QEMU จอง `10.0.2.2` ไว้เป็นชื่อแทนของ host — กรอกค่านี้ที่หน้าจับคู่แทนเลข IP จริง

| จะต่อไปที่ | กรอก |
|---|---|
| Docker บนเครื่องนี้ (หลัก) | `10.0.2.2` — เติมพอร์ต 4500 ให้อัตโนมัติ |
| Electron โหมด Server บนเครื่องนี้ | `10.0.2.2:4001` |
| เครื่องเคาน์เตอร์เครื่องอื่นในวง LAN | `192.168.x.x` ตามปกติ |

`10.*.*.*` อยู่ใน `server.allowNavigation` ของ [capacitor.config.ts](../capacitor.config.ts) อยู่แล้ว
และ `network_security_config.xml` เปิด cleartext ไว้ทั้งหมด จึงไม่ต้องแก้อะไรเพิ่ม

### ต่อไม่ได้ ตรวจตามนี้

| อาการ | สาเหตุ |
|---|---|
| `Connection refused` ที่ 10.0.2.2 | server บนเครื่อง Windows ไม่ได้เปิด — ตรวจด้วย `docker ps` |
| ต่อ `192.168.x.x` ของเครื่องตัวเองไม่ได้ | Windows Firewall กันขาเข้าอยู่ — ใช้ `10.0.2.2` แทนจะไม่โดนกฎนี้ |
| เชื่อมต่อหมดเวลา | ยิงผิดพอร์ต — Docker ใช้ 4500, Electron ใช้ 4001 |

---

## จับคู่ server แบบไม่ต้องกรอกที่หน้าจอ

```powershell
node scripts/run-android-emulator.js --build --server=host
```

สคริปต์เขียนค่าลง SharedPreferences `CapacitorStorage` คีย์ `smilepos.serverUrl` โดยตรง
(คีย์เดียวกับที่ [MainActivity.java](../android/app/src/main/java/com/smilepharmacy/pos/MainActivity.java) อ่านตอนเปิดแอป)
ผ่าน `adb run-as` ซึ่ง **ใช้ได้เฉพาะ APK debug** เท่านั้น — APK release ต้องกรอกที่หน้าจอตามปกติ

> โหมด standalone จะข้ามค่าที่จับคู่ทั้งหมด (`MainActivity.isStandaloneBuild()` ตรวจก่อนเป็นอันดับแรก)
> ถ้าติดตั้ง APK standalone อยู่แล้วสั่ง `--server=...` สคริปต์จะเตือนแล้วข้ามให้

---

## ข้อควรรู้

- **ห้ามเปิดเครื่องจำลองแบบเป็น process ลูก** ของ npm/สคริปต์อื่น พอสคริปต์แม่จบ Windows จะเก็บ
  process ลูกไปด้วยแล้วเครื่องจำลองจะดับกลางคัน — สคริปต์นี้ spawn แบบ `detached` + `unref()` ไว้แล้ว
- **`adb wait-for-device` ยังไม่พอ** ต้องรอ `dev.bootcomplete` และให้ `pm path android` ตอบด้วย
  ไม่งั้น `adb install` จะได้ `Error: device is still booting`
- **เครื่องจำลองกินแรมจริง ~4 GB** ถ้าเปิดพร้อม Docker Desktop บนเครื่องแรมน้อย Docker อาจถูกปิดไป
  ทำให้ server ที่พอร์ต 4500 หายกลางทาง — ตรวจด้วย `docker ps` ก่อนโทษแอป
- **snapshot** ครั้งแรกบูตประมาณ 90 วินาที ครั้งต่อไปโหลดจาก snapshot เร็วกว่ามาก
  ถ้าเครื่องมีอาการค้างหรือแอปเปิดไม่ขึ้น ใช้ `--cold` เพื่อบูตใหม่ทั้งเครื่อง
- **ดู log ของ WebView:** `adb logcat -s Capacitor:V Capacitor/Console:V`
  หรือเปิด `chrome://inspect` ในเบราว์เซอร์ Chrome บนเครื่อง Windows (ใช้ได้เฉพาะ build debug)
