import type { CapacitorConfig } from "@capacitor/cli";

/**
 * เปลือก Android ของ SmilePOS
 *
 * แอปตัวนี้ "ไม่ได้" ฝัง UI ของระบบไว้ใน APK — webDir ชี้ไปที่ mobile-shell/ ซึ่งมีแค่
 * หน้าจับคู่ server หน้าเดียว พอจับคู่แล้ว MainActivity จะอ่าน URL ที่บันทึกไว้แล้ว
 * ตั้งเป็น serverUrl ให้ WebView โหลด UI จริงจากเครื่องเคาน์เตอร์ผ่าน LAN
 *
 * ผลคือ: แก้หน้าจอที่ server ที่เดียว แท็บเล็ตทุกเครื่องได้ของใหม่ทันทีโดยไม่ต้อง build APK ใหม่
 */
/**
 * โหมด standalone (CAP_MODE=standalone) — UI ทั้งระบบและฐานข้อมูล SQLite อยู่ในเครื่อง
 * webDir จึงชี้ไปที่ผลลัพธ์ static export ของ Next แทนหน้าจับคู่
 * ดู docs/android-standalone.md
 */
const isStandalone = process.env.CAP_MODE === "standalone";

const config: CapacitorConfig = {
  appId: "com.smilepharmacy.pos",
  appName: "Smile POS",
  webDir: isStandalone ? "out" : "mobile-shell",

  // MainActivity อ่านค่านี้เพื่อข้ามขั้นตอนจับคู่ server ทั้งหมด
  // สำคัญกับเครื่องที่เคยลงเวอร์ชันจับคู่มาก่อน แล้วมาลงเวอร์ชัน standalone ทับ:
  // ค่า serverUrl เดิมยังค้างอยู่ใน SharedPreferences ถ้าไม่กันไว้แอปจะวิ่งไปหา server เก่า
  ...(isStandalone ? ({ standalone: true } as Record<string, unknown>) : {}),

  android: {
    // หน้า shell อยู่ที่ https://localhost แต่ต้องยิงไป http://192.168.x.x — ถือเป็น mixed content
    allowMixedContent: true,

    // ห้ามเปิด captureInput เด็ดขาด — พิมพ์ภาษาไทยไม่ได้
    //
    // captureInput ทำอย่างเดียวคือให้ CapacitorWebView.onCreateInputConnection() คืน
    // BaseInputConnection(this, false) แทน input connection จริงของ WebView
    // ตัวนั้นไม่ใช่ full editor จึงแปลงข้อความที่ IME ส่งมาเป็น KeyEvent ผ่าน
    // KeyCharacterMap.VIRTUAL_KEYBOARD ซึ่ง map ตัวอักษรไทย (U+0E00–U+0E7F) ไม่ได้
    // ผลคือตัวอักษรไทยตกไปอยู่ใน KeyEvent แบบ ACTION_MULTIPLE แล้ว Capacitor ไปลง
    // ด้วย document.activeElement.value += ... ตรง ๆ ซึ่งไม่ยิง input event
    // React จึงไม่เห็นค่า -> state ว่าง -> body ที่ POST/PUT ออกไปไม่มีข้อความไทย
    // (ภาษาอังกฤษรอดเพราะ map เป็น keycode ได้ตามปกติ)
    //
    // ไม่จำเป็นกับเครื่องยิงบาร์โค้ดด้วย: แบบ HID ส่ง key event ของฮาร์ดแวร์ซึ่ง WebView
    // รับได้อยู่แล้วโดยไม่ต้องเปิดค่านี้ ส่วนแท็บเล็ตในแอปนี้ใช้กล้องผ่าน ML Kit
    // (ดู src/lib/runtime/scanner.ts)

    // ไม่ตั้ง webContentsDebuggingEnabled ไว้ตรงนี้โดยตั้งใจ — Capacitor จะเปิดให้เองเฉพาะ
    // build ที่ debuggable ถ้าฮาร์ดโค้ดเป็น true จะทำให้ APK release ถูกเปิดดูผ่าน
    // chrome://inspect ได้ด้วย ซึ่งไม่ควรเกิดกับเครื่องที่ใช้งานจริงในร้าน
  },

  server: {
    androidScheme: "https",

    // server ในร้านเป็น HTTP ธรรมดาบน LAN — ต้องเปิด cleartext ให้ WebView
    // ขอบเขตจริงถูกจำกัดอีกชั้นด้วย network_security_config.xml (เฉพาะ private IP)
    cleartext: true,

    // ยอมให้ WebView navigate ออกไปยัง server ในวง LAN ได้โดยไม่เด้งไปเบราว์เซอร์ภายนอก
    // และเป็นเงื่อนไขที่ทำให้ Capacitor inject bridge เข้าไปในหน้า remote ด้วย
    allowNavigation: [
      "192.168.*.*",
      "10.*.*.*",
      "172.16.*.*",
      "172.17.*.*",
      "172.18.*.*",
      "172.19.*.*",
      "172.2*.*.*",
      "172.30.*.*",
      "172.31.*.*",
      "localhost",
      "127.0.0.1",
    ],
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#3e86c7",
    },
  },
};

export default config;
