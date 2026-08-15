/**
 * หน้าจับคู่ Server ของ Smile POS (Android shell)
 *
 * หน้านี้ฝังอยู่ใน APK และเป็นหน้าแรกที่เปิดตอนยังไม่ได้จับคู่ พอจับคู่สำเร็จจะบันทึก URL
 * ลง Capacitor Preferences (ไปโผล่ที่ SharedPreferences "CapacitorStorage") แล้วพา WebView
 * ไปที่ UI จริงบนเครื่อง Server ครั้งต่อไป MainActivity จะอ่านค่าเดิมแล้วเข้า UI ให้เลย
 *
 * เรียก server ผ่าน CapacitorHttp (native HTTP) แทน fetch เพราะหน้านี้อยู่ที่ origin
 * https://localhost การยิงไป http://192.168.x.x จะติดทั้ง CORS และ mixed content
 */

/** ต้องตรงกับ SERVER_URL_KEY ใน MainActivity.kt */
const STORAGE_KEY = "smilepos.serverUrl";
const RECENT_KEY = "smilepos.recentServers";

/**
 * พอร์ตที่เติมให้อัตโนมัติเมื่อผู้ใช้กรอกแค่เลข IP
 *
 * 4500 = พอร์ตที่ docker-compose.yml เผยแพร่ออกมา (map 4500:3000) ซึ่งเป็นวิธี
 * ติดตั้งหลักของร้าน ถ้าร้านไหนเปิดผ่าน Electron โหมด Server แทน (LAN Bridge = 4001)
 * ให้กรอกพอร์ตต่อท้ายเอง เช่น 192.168.1.100:4001
 */
const DEFAULT_PORT = 4500;

/** หน้าแรกของ UI มือถือบน server */
const ENTRY_PATH = "/web/mobile/index";

const HEALTH_PATH = "/api/health";
const HEALTH_TIMEOUT_MS = 8000;

const els = {
  input: document.getElementById("serverInput"),
  status: document.getElementById("status"),
  hint: document.getElementById("hint"),
  btnConnect: document.getElementById("btnConnect"),
  btnTest: document.getElementById("btnTest"),
  btnScan: document.getElementById("btnScan"),
  recentBox: document.getElementById("recentBox"),
  recentList: document.getElementById("recentList"),
};

const controls = [els.input, els.btnConnect, els.btnTest, els.btnScan];

function plugin(name) {
  return window.Capacitor && window.Capacitor.Plugins
    ? window.Capacitor.Plugins[name]
    : undefined;
}

function isNative() {
  return Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

/* ---------------------------------------------------------------- storage */

async function storageGet(key) {
  const prefs = plugin("Preferences");

  if (prefs) {
    const result = await prefs.get({ key });
    return result && result.value ? result.value : null;
  }

  return window.localStorage.getItem(key);
}

async function storageSet(key, value) {
  const prefs = plugin("Preferences");

  if (prefs) {
    await prefs.set({ key, value });
    return;
  }

  window.localStorage.setItem(key, value);
}

/* ------------------------------------------------------------------- url */

/**
 * แปลงสิ่งที่ผู้ใช้พิมพ์ให้เป็น origin ที่ใช้ได้จริง
 * ล้อตรรกะ normalizeServerInput() ใน electron/main.js ให้พฤติกรรมสองแพลตฟอร์มตรงกัน
 * - "192.168.1.100"            -> http://192.168.1.100:4500
 * - "192.168.1.100:4000"       -> http://192.168.1.100:4000
 * - "https://pos.example.com"  -> https://pos.example.com
 */
function normalizeServerInput(raw) {
  const text = String(raw || "").trim();

  if (!text) {
    throw new Error("กรุณากรอกที่อยู่ Server");
  }

  const hasProtocol = /^https?:\/\//i.test(text);
  const url = new URL(hasProtocol ? text : `http://${text}`);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("รองรับเฉพาะ http หรือ https");
  }

  // เติมพอร์ตให้เฉพาะตอนผู้ใช้ไม่ได้ระบุเอง — โดเมน https ปล่อยใช้ 443 ตามปกติ
  const portTyped = /:\d+(?:[/?#]|$)/.test(text);
  if (!url.port && !portTyped && url.protocol === "http:") {
    url.port = String(DEFAULT_PORT);
  }

  return url.origin;
}

/* ------------------------------------------------------------------ http */

/** ยิง GET ผ่าน native HTTP เพื่อข้าม CORS/mixed content — fallback เป็น fetch ตอนรันในเบราว์เซอร์ */
async function httpGet(url, timeoutMs) {
  const http = plugin("CapacitorHttp");

  if (http) {
    const response = await http.request({
      url,
      method: "GET",
      connectTimeout: timeoutMs,
      readTimeout: timeoutMs,
      headers: { Accept: "application/json" },
    });

    return { status: response.status, data: response.data };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    return { status: response.status, data: await response.json().catch(() => null) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ตรวจว่าปลายทางเป็น SmilePOS server จริง ไม่ใช่แค่มีอะไรสักอย่างตอบที่พอร์ตนั้น
 * /api/health ตอบ { ok: true, service: "smilepharmacy", ... }
 */
async function probeServer(origin) {
  const result = await httpGet(`${origin}${HEALTH_PATH}`, HEALTH_TIMEOUT_MS);

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Server ตอบกลับ HTTP ${result.status}`);
  }

  const body = typeof result.data === "string" ? safeJson(result.data) : result.data;

  if (!body || body.ok !== true) {
    throw new Error("ปลายทางตอบกลับแล้ว แต่ไม่ใช่ Server ของ Smile POS");
  }

  return body;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function describeError(error) {
  const message = String((error && error.message) || error || "เชื่อมต่อไม่สำเร็จ");

  if (/timeout|timed out|abort/i.test(message)) {
    return `เชื่อมต่อหมดเวลา — ตรวจว่าแท็บเล็ตกับเครื่อง Server อยู่ Wi-Fi วงเดียวกัน และเปิดโปรแกรมที่เครื่อง Server แล้ว`;
  }

  if (/ECONNREFUSED|refused|failed to connect|Connection refused/i.test(message)) {
    return `เครื่อง Server ปฏิเสธการเชื่อมต่อ — ตรวจว่าเปิดโปรแกรมในโหมด Server แล้ว และ Firewall เปิดพอร์ต ${DEFAULT_PORT}`;
  }

  return message;
}

/* ----------------------------------------------------------------- ui */

function setStatus(message, type) {
  els.status.className = "status" + (type ? " " + type : "");
  els.status.textContent = "";

  if (type === "loading") {
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    els.status.appendChild(spinner);
  }

  const text = document.createElement("span");
  text.textContent = message;
  els.status.appendChild(text);
}

function setBusy(busy) {
  controls.forEach((control) => {
    if (control) control.disabled = busy;
  });
}

/* -------------------------------------------------------------- recents */

async function getRecents() {
  const raw = await storageGet(RECENT_KEY);
  const parsed = raw ? safeJson(raw) : null;
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}

async function rememberServer(origin) {
  const recents = await getRecents();
  const next = [origin, ...recents.filter((item) => item !== origin)].slice(0, 5);
  await storageSet(RECENT_KEY, JSON.stringify(next));
}

async function renderRecents() {
  const recents = await getRecents();

  els.recentList.textContent = "";
  els.recentBox.hidden = recents.length === 0;

  recents.forEach((origin) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-item";

    const label = document.createElement("span");
    label.textContent = origin;
    button.appendChild(label);

    const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevron.setAttribute("viewBox", "0 0 24 24");
    chevron.setAttribute("fill", "none");
    chevron.setAttribute("stroke", "currentColor");
    chevron.setAttribute("stroke-width", "2");
    chevron.setAttribute("stroke-linecap", "round");
    chevron.setAttribute("stroke-linejoin", "round");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M9 18l6-6-6-6");
    chevron.appendChild(path);
    button.appendChild(chevron);

    button.addEventListener("click", () => {
      els.input.value = origin;
      connect();
    });

    els.recentList.appendChild(button);
  });
}

/* ------------------------------------------------------------- actions */

async function connect() {
  let origin;

  try {
    origin = normalizeServerInput(els.input.value);
  } catch (error) {
    setStatus(error.message, "error");
    els.input.focus();
    return;
  }

  setBusy(true);
  setStatus(`กำลังเชื่อมต่อ ${origin} ...`, "loading");

  try {
    await probeServer(origin);
    await rememberServer(origin);

    setStatus("เชื่อมต่อสำเร็จ กำลังเปิดระบบ...", "success");
    await enterApp(origin);
  } catch (error) {
    setStatus(describeError(error), "error");
    setBusy(false);
  }
}

/**
 * เข้าสู่ UI จริงบนเครื่อง server
 *
 * สำคัญ: ห้ามใช้ window.location.href พาไปเอง
 * Capacitor inject สะพาน JS (window.Capacitor) ให้ "origin เดียว" คือ origin ที่ตั้งไว้
 * ตอนสร้าง Bridge เท่านั้น ถ้า redirect เอง หน้าปลายทางจะไม่มีสะพาน แปลว่า
 * สแกนเนอร์ native, print relay, ปุ่ม Back, แบนเนอร์ออฟไลน์ จะไม่ทำงานทั้งหมด
 *
 * จึงต้องให้ฝั่ง native บันทึกค่าแล้วเปิดแอปใหม่ MainActivity จะตั้ง server.url
 * ให้ถูกตั้งแต่ต้น แล้วสะพานจะติดไปกับหน้า UI จริงด้วย
 */
async function enterApp(origin) {
  const shell = plugin("SmilePosShell");

  if (shell) {
    await shell.pairAndRestart({ url: origin });
    return;
  }

  // รันในเบราว์เซอร์ธรรมดา (ตอน dev) — ไม่มีสะพาน native ให้เสียอยู่แล้ว
  await storageSet(STORAGE_KEY, origin);
  window.location.href = `${origin}${ENTRY_PATH}`;
}

async function test() {
  let origin;

  try {
    origin = normalizeServerInput(els.input.value);
  } catch (error) {
    setStatus(error.message, "error");
    els.input.focus();
    return;
  }

  setBusy(true);
  setStatus(`กำลังตรวจสอบ ${origin} ...`, "loading");

  try {
    const body = await probeServer(origin);
    const version = body.version ? ` · v${body.version}` : "";
    setStatus(`Server พร้อมใช้งาน: ${origin}${version}`, "success");
  } catch (error) {
    setStatus(describeError(error), "error");
  } finally {
    setBusy(false);
  }
}

/** สแกน QR ที่เครื่องเคาน์เตอร์แสดง — เนื้อหาเป็น URL หรือเลข IP ตรง ๆ ก็ได้ */
async function scan() {
  const scanner = plugin("BarcodeScanner");

  if (!scanner) {
    setStatus("สแกน QR ใช้ได้เฉพาะในแอปบนมือถือ", "error");
    return;
  }

  setBusy(true);
  setStatus("กำลังเปิดกล้อง...", "loading");

  try {
    const permission = await scanner.requestPermissions();

    if (permission.camera !== "granted" && permission.camera !== "limited") {
      setStatus("ไม่ได้รับอนุญาตให้ใช้กล้อง — เปิดสิทธิ์กล้องในการตั้งค่าแอปก่อน", "error");
      return;
    }

    const result = await scanner.scan();
    const value = result && result.barcodes && result.barcodes.length ? result.barcodes[0].rawValue : "";

    if (!value) {
      setStatus("ไม่พบ QR — ลองใหม่อีกครั้ง", "error");
      return;
    }

    els.input.value = value;
    setBusy(false);
    await connect();
    return;
  } catch (error) {
    setStatus(describeError(error), "error");
  } finally {
    setBusy(false);
  }
}

/* ---------------------------------------------------------------- boot */

/**
 * ลองเข้าใช้งานอัตโนมัติถ้าเคยจับคู่ไว้แล้ว
 *
 * ในแอปจริง หน้านี้จะถูกเปิดก็ต่อเมื่อ MainActivity ตรวจแล้วว่า "ยังไม่จับคู่"
 * หรือ "จับคู่แล้วแต่ต่อ server ไม่ได้" — จึงลองใหม่ให้อีกรอบเผื่อ Wi-Fi เพิ่งกลับมา
 */
async function autoReconnect(saved) {
  setStatus(`กำลังเชื่อมต่อ ${saved} ...`, "loading");
  setBusy(true);

  try {
    await probeServer(saved);
    setStatus("เชื่อมต่อสำเร็จ กำลังเปิดระบบ...", "success");
    await enterApp(saved);
    return true;
  } catch (error) {
    setStatus(describeError(error), "error");
    setBusy(false);
    return false;
  }
}

async function boot() {
  els.btnConnect.addEventListener("click", connect);
  els.btnTest.addEventListener("click", test);
  els.btnScan.addEventListener("click", scan);

  els.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") connect();
  });

  if (!isNative()) {
    els.btnScan.hidden = true;
  }

  const splash = plugin("SplashScreen");
  if (splash) splash.hide().catch(() => undefined);

  let saved = null;

  try {
    saved = await storageGet(STORAGE_KEY);
    if (saved) els.input.value = saved;
    await renderRecents();
  } catch {
    // ไม่มีค่าเดิมก็เริ่มจากหน้าเปล่าได้ตามปกติ
  }

  // #setup = บังคับให้อยู่หน้าจับคู่ ใช้ตอนย้ายเครื่อง server หรือแก้ IP ที่กรอกผิด
  const forceSetup = window.location.hash === "#setup";

  if (saved && !forceSetup) {
    await autoReconnect(saved);
    return;
  }

  if (saved) {
    setStatus(`Server ที่บันทึกไว้: ${saved}`, null);
  }
}

document.addEventListener("DOMContentLoaded", boot);
