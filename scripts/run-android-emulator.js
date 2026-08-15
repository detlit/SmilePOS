#!/usr/bin/env node

/**
 * รัน Smile POS บนโปรแกรมจำลอง Android (AVD) ของ Android SDK
 *
 *   node scripts/run-android-emulator.js                    -> เปิดอีมูเลเตอร์ + ติดตั้ง APK ล่าสุด + เปิดแอป
 *   node scripts/run-android-emulator.js --build            -> build APK ใหม่ก่อน (โหมดจับคู่ server)
 *   node scripts/run-android-emulator.js --build-standalone -> build APK ใหม่ก่อน (โหมด standalone)
 *   node scripts/run-android-emulator.js --server=10.0.2.2:4500
 *                                                          -> จับคู่ server ให้เลย ไม่ต้องกรอกที่หน้าจอ
 *   node scripts/run-android-emulator.js --reset            -> ล้างค่าที่จับคู่ไว้ กลับไปหน้ากรอก IP
 *   node scripts/run-android-emulator.js --cold             -> บูตใหม่ทั้งเครื่อง ไม่โหลด snapshot
 *
 * ทำไมต้องมีสคริปต์นี้แทนการเรียก emulator.exe ตรง ๆ
 * ------------------------------------------------------------------
 *   1. ต้อง spawn อีมูเลเตอร์แบบ detached ไม่งั้นพอ npm/สคริปต์แม่จบ อีมูเลเตอร์จะถูกปิดตามไปด้วย
 *   2. `adb wait-for-device` บอกแค่ว่า adb ต่อติด — ยังติดตั้ง APK ไม่ได้จนกว่า package manager
 *      จะพร้อม (adb จะตอบ "device is still booting") จึงต้องรอ dev.bootcomplete + `pm path` อีกชั้น
 *   3. อีมูเลเตอร์มองไม่เห็น 127.0.0.1 ของเครื่อง Windows — ต้องใช้ 10.0.2.2 แทน (ดูหมายเหตุ HOST_ALIAS)
 *
 * @see docs/android-emulator.md
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const outDir = path.join(rootDir, 'dist_android');

const AVD_NAME = 'SmilePOS_Tablet';
const SYSTEM_IMAGE = 'system-images;android-36;google_apis;x86_64';
const DEVICE_PROFILE = 'medium_tablet';

const APP_ID = 'com.smilepharmacy.pos';
const MAIN_ACTIVITY = `${APP_ID}/.MainActivity`;

/** ต้องตรงกับ SERVER_URL_KEY + PREFS_NAME ใน MainActivity.java */
const SERVER_URL_KEY = 'smilepos.serverUrl';
const PREFS_FILE = 'CapacitorStorage.xml';

/**
 * ที่อยู่ของเครื่อง host เมื่อมองจากในอีมูเลเตอร์
 *
 * อีมูเลเตอร์รันอยู่หลัง NAT ของ QEMU: 127.0.0.1 ในนั้นคือตัวอีมูเลเตอร์เอง ไม่ใช่เครื่อง Windows
 * QEMU จึงจอง 10.0.2.2 ไว้ให้เป็น alias ของ host — ตรงกับ allowNavigation "10.*.*.*"
 * ใน capacitor.config.ts อยู่แล้ว จึงใช้ได้โดยไม่ต้องแก้ config
 */
const HOST_ALIAS = '10.0.2.2';

/** พอร์ตเดียวกับ DEFAULT_PORT ใน mobile-shell/connect.js (docker-compose map 4500:3000) */
const DEFAULT_PORT = 4500;

const args = process.argv.slice(2);
const wantBuild = args.includes('--build');
const wantBuildStandalone = args.includes('--build-standalone');
const wantReset = args.includes('--reset');
const wantCold = args.includes('--cold');
const serverArg = (args.find((arg) => arg.startsWith('--server=')) || '').split('=')[1];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function step(message) {
  console.log(`\n▸ ${message}`);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || rootDir,
    stdio: options.stdio || 'inherit',
    encoding: 'utf8',
    shell: options.shell !== undefined ? options.shell : false,
    env: { ...process.env, ...(options.env || {}) },
  });

  if (result.error) fail(result.error.message);

  if (result.status !== 0 && !options.allowFailure) {
    fail(`คำสั่งล้มเหลว: ${command} ${commandArgs.join(' ')}`);
  }

  return result;
}

/** เรียกคำสั่งแล้วเอาผลลัพธ์กลับมาเป็นข้อความ (ไม่พ่นออกหน้าจอ) */
function capture(command, commandArgs, options = {}) {
  const result = run(command, commandArgs, { ...options, stdio: 'pipe', allowFailure: true });
  return {
    ok: result.status === 0,
    out: `${result.stdout || ''}${result.stderr || ''}`.trim(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ SDK */

/** หา Android SDK จาก env ก่อน แล้วค่อยถอยไปอ่าน android/local.properties ตามที่เอกสาร build บอกไว้ */
function resolveSdkRoot() {
  const fromEnv = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const localProperties = path.join(androidDir, 'local.properties');

  if (fs.existsSync(localProperties)) {
    const match = fs.readFileSync(localProperties, 'utf8').match(/^\s*sdk\.dir\s*=\s*(.+)$/m);

    if (match) {
      // local.properties escape ทั้ง ":" และ "\" ตามรูปแบบของ Java properties
      const sdkDir = match[1].trim().replace(/\\:/g, ':').replace(/\\\\/g, '\\');
      if (fs.existsSync(sdkDir)) return sdkDir;
    }
  }

  const fallback = path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
  if (fs.existsSync(fallback)) return fallback;

  fail(
    'ไม่พบ Android SDK — ตั้ง ANDROID_HOME หรือใส่ sdk.dir ใน android/local.properties\n' +
      '    ดู docs/android-build.md หัวข้อ "สิ่งที่ต้องติดตั้งก่อน"',
  );
}

const sdkRoot = resolveSdkRoot();
const exe = process.platform === 'win32' ? '.exe' : '';
const bat = process.platform === 'win32' ? '.bat' : '';

const adbPath = path.join(sdkRoot, 'platform-tools', `adb${exe}`);
const emulatorPath = path.join(sdkRoot, 'emulator', `emulator${exe}`);
const avdManagerPath = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', `avdmanager${bat}`);
const sdkManagerPath = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', `sdkmanager${bat}`);

function adb(commandArgs, options = {}) {
  return capture(adbPath, commandArgs, options);
}

function checkPrerequisites() {
  if (!fs.existsSync(adbPath)) {
    fail(`ไม่พบ adb ที่ ${adbPath} — ติดตั้ง platform-tools ก่อน`);
  }

  if (!fs.existsSync(emulatorPath)) {
    fail(
      `ไม่พบโปรแกรมจำลองที่ ${emulatorPath}\n` +
        `    ติดตั้งด้วย:  "${sdkManagerPath}" "emulator" "${SYSTEM_IMAGE}"`,
    );
  }

  const imageDir = path.join(sdkRoot, 'system-images', 'android-36', 'google_apis', 'x86_64');

  if (!fs.existsSync(imageDir)) {
    fail(
      `ไม่พบ system image ที่ ${imageDir}\n` + `    ติดตั้งด้วย:  "${sdkManagerPath}" "${SYSTEM_IMAGE}"`,
    );
  }
}

/* ------------------------------------------------------------------ AVD */

function avdExists() {
  const home = process.env.ANDROID_AVD_HOME || path.join(os.homedir(), '.android', 'avd');
  return fs.existsSync(path.join(home, `${AVD_NAME}.avd`));
}

/**
 * ปรับสเปกเครื่องให้เหมาะกับ SmilePOS
 *
 * ค่า default ของ avdmanager คือ RAM 1.9 GB / heap 192 MB ซึ่งน้อยไปสำหรับ WebView ที่โหลด
 * Next.js ทั้งระบบ + SQLite และคีย์บอร์ดของ host ถูกปิดไว้ (พิมพ์จากคีย์บอร์ดคอมไม่ได้)
 */
function tuneAvdConfig() {
  const home = process.env.ANDROID_AVD_HOME || path.join(os.homedir(), '.android', 'avd');
  const configPath = path.join(home, `${AVD_NAME}.avd`, 'config.ini');

  if (!fs.existsSync(configPath)) return;

  const tweaks = {
    'hw.ramSize': '4096',
    'vm.heapSize': '512M',
    'hw.gpu.enabled': 'yes',
    'hw.gpu.mode': 'host',
    // เครื่องขายหน้าร้านถือเป็นแนวนอน และต้องพิมพ์ไทยจากคีย์บอร์ดคอมได้ตอนทดสอบ
    'hw.initialOrientation': 'landscape',
    'hw.keyboard': 'yes',
    // กล้องหน้า/หลังจำเป็นกับการทดสอบสแกนบาร์โค้ดผ่าน ML Kit
    'hw.camera.back': 'emulated',
    'hw.camera.front': 'emulated',
  };

  const lines = fs.readFileSync(configPath, 'utf8').split(/\r?\n/);
  const seen = new Set();

  const updated = lines.map((line) => {
    const key = (line.split('=')[0] || '').trim();

    if (Object.prototype.hasOwnProperty.call(tweaks, key)) {
      seen.add(key);
      return `${key}=${tweaks[key]}`;
    }

    return line;
  });

  Object.entries(tweaks).forEach(([key, value]) => {
    if (!seen.has(key)) updated.push(`${key}=${value}`);
  });

  fs.writeFileSync(configPath, updated.join('\n'), 'utf8');
}

function ensureAvd() {
  if (avdExists()) return;

  step(`สร้างเครื่องจำลอง "${AVD_NAME}" (ครั้งแรกเท่านั้น)`);

  if (!fs.existsSync(avdManagerPath)) {
    fail(`ไม่พบ avdmanager ที่ ${avdManagerPath} — ติดตั้ง cmdline-tools ก่อน`);
  }

  const result = spawnSync(
    avdManagerPath,
    ['create', 'avd', '-n', AVD_NAME, '-k', SYSTEM_IMAGE, '-d', DEVICE_PROFILE, '--force'],
    { cwd: rootDir, input: 'no\n', encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] },
  );

  if (result.error) fail(result.error.message);
  if (!avdExists()) fail('สร้าง AVD ไม่สำเร็จ');

  tuneAvdConfig();
}

/* ------------------------------------------------------------- emulator */

function findRunningEmulator() {
  const { out } = adb(['devices']);
  const match = out.split(/\r?\n/).find((line) => /^emulator-\d+\s+device\b/.test(line.trim()));
  return match ? match.trim().split(/\s+/)[0] : null;
}

function startEmulator() {
  const running = findRunningEmulator();

  if (running) {
    step(`ใช้เครื่องจำลองที่เปิดอยู่แล้ว: ${running}`);
    return;
  }

  step(`เปิดเครื่องจำลอง ${AVD_NAME}`);

  const emulatorArgs = ['-avd', AVD_NAME, '-netdelay', 'none', '-netspeed', 'full', '-no-boot-anim'];
  if (wantCold) emulatorArgs.push('-no-snapshot-load');

  // detached + unref: ปล่อยให้อีมูเลเตอร์อยู่ต่อหลังสคริปต์นี้จบ
  // ถ้าเป็น child ปกติ พอ npm run จบ Windows จะเก็บ process ลูกไปด้วย เครื่องจำลองจะดับกลางคัน
  const child = spawn(emulatorPath, emulatorArgs, {
    cwd: path.dirname(emulatorPath),
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
}

/**
 * รอจนติดตั้ง APK ได้จริง
 *
 * sys.boot_completed ขึ้น 1 ก่อนที่ package manager จะพร้อมรับงาน ถ้ายิง adb install ตอนนั้น
 * จะได้ "Error: device is still booting" จึงต้องรอ dev.bootcomplete และให้ `pm path android` ตอบด้วย
 */
async function waitForBoot() {
  step('รอเครื่องจำลองบูต (ครั้งแรกอาจถึง 2 นาที)');

  const deadline = Date.now() + 5 * 60 * 1000;
  adb(['wait-for-device']);

  while (Date.now() < deadline) {
    const booted = adb(['shell', 'getprop', 'sys.boot_completed']).out === '1';
    const ready = adb(['shell', 'getprop', 'dev.bootcomplete']).out === '1';
    const pmReady = adb(['shell', 'pm', 'path', 'android']).ok;

    if (booted && ready && pmReady) {
      await sleep(3000);
      console.log('  พร้อมแล้ว');
      return;
    }

    await sleep(3000);
  }

  fail('รอเครื่องจำลองบูตนานเกินไป — ลองรันใหม่ด้วย --cold');
}

/* ------------------------------------------------------------------ APK */

function findApk() {
  if (!fs.existsSync(outDir)) return null;

  const candidates = fs
    .readdirSync(outDir)
    .filter((name) => name.endsWith('.apk'))
    .map((name) => ({ name, stat: fs.statSync(path.join(outDir, name)) }))
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

  return candidates.length ? path.join(outDir, candidates[0].name) : null;
}

function buildApk() {
  const script = wantBuildStandalone ? 'build-android-standalone.js' : 'build-android.js';
  step(`build APK ใหม่ (${wantBuildStandalone ? 'standalone' : 'จับคู่ server'})`);
  run(process.execPath, [path.join(rootDir, 'scripts', script)]);
}

function installApk() {
  if (wantBuild || wantBuildStandalone) buildApk();

  const apk = findApk();

  if (!apk) {
    fail(
      'ไม่พบไฟล์ .apk ใน dist_android/\n' +
        '    สร้างก่อนด้วย:  npm run build:android           (โหมดจับคู่ server)\n' +
        '                    npm run build:android:standalone (โหมด standalone)\n' +
        '    หรือรันคำสั่งนี้พร้อมธง --build / --build-standalone',
    );
  }

  step(`ติดตั้ง ${path.relative(rootDir, apk)}`);
  run(adbPath, ['install', '-r', apk]);
  return apk;
}

/**
 * APK ที่ติดตั้งเป็นโหมด standalone หรือไม่
 *
 * อ่านจาก capacitor.config.json ใน assets ที่ `cap sync` เขียนไว้ครั้งล่าสุด — ไฟล์เดียวกับที่
 * MainActivity.isStandaloneBuild() อ่านตอนรันจริง จึงไม่ต้องแกะ zip ของ APK เอง
 */
function isStandaloneBuild() {
  const assetConfig = path.join(androidDir, 'app', 'src', 'main', 'assets', 'capacitor.config.json');

  if (!fs.existsSync(assetConfig)) return false;

  try {
    return JSON.parse(fs.readFileSync(assetConfig, 'utf8')).standalone === true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------- จับคู่ server */

function normalizeServer(raw) {
  const text = String(raw).trim();
  const hasProtocol = /^https?:\/\//i.test(text);
  const url = new URL(hasProtocol ? text : `http://${text}`);
  const portTyped = /:\d+(?:[/?#]|$)/.test(text);

  if (!url.port && !portTyped && url.protocol === 'http:') {
    url.port = String(DEFAULT_PORT);
  }

  return url.origin;
}

/**
 * เขียนค่าที่จับคู่ลง SharedPreferences ตรง ๆ แทนการกรอกที่หน้าจอ
 *
 * ใช้ได้เฉพาะ APK debug เพราะอาศัย `run-as` ซึ่งต้องการ android:debuggable=true
 * เขียนผ่าน /data/local/tmp ก่อนแล้วให้ app user คัดลอกเข้าไป — adb push เข้า /data/data ตรง ๆ ไม่ได้
 */
function writePairing(origin) {
  const xml = origin
    ? `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n` +
      `<map>\n    <string name="${SERVER_URL_KEY}">${origin}</string>\n</map>\n`
    : `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map />\n`;

  const localFile = path.join(os.tmpdir(), PREFS_FILE);
  fs.writeFileSync(localFile, xml, 'utf8');

  // ต้องหยุดแอปก่อน ไม่งั้น SharedPreferences ที่ค้างในหน่วยความจำจะเขียนทับตอน process ตาย
  adb(['shell', 'am', 'force-stop', APP_ID]);

  const remoteTmp = `/data/local/tmp/${PREFS_FILE}`;
  const pushed = adb(['push', localFile, remoteTmp]);

  if (!pushed.ok) fail(`ส่งไฟล์เข้าเครื่องจำลองไม่สำเร็จ: ${pushed.out}`);

  const prefsDir = `/data/data/${APP_ID}/shared_prefs`;
  const copied = adb([
    'shell',
    'run-as',
    APP_ID,
    'sh',
    '-c',
    `mkdir -p ${prefsDir} && cp ${remoteTmp} ${prefsDir}/${PREFS_FILE}`,
  ]);

  adb(['shell', 'rm', '-f', remoteTmp]);

  if (!copied.ok) {
    fail(
      `ตั้งค่าจับคู่อัตโนมัติไม่สำเร็จ: ${copied.out}\n` +
        '    ใช้ได้เฉพาะ APK debug — ถ้าเป็น release ให้กรอกที่หน้าจอแอปแทน',
    );
  }
}

/** ตรวจว่า server ที่จะจับคู่ตอบ /api/health จริงก่อน ไม่งั้นแอปจะเด้งกลับหน้ากรอก IP */
async function probeFromHost(origin) {
  // เช็คจากฝั่ง Windows ด้วย localhost ที่ตรงกับพอร์ตเดียวกัน — 10.0.2.2 ยิงจากเครื่องนี้ไม่ได้
  const url = new URL(origin);
  const hostSide = `http://127.0.0.1:${url.port || 80}/api/health`;

  try {
    const response = await fetch(hostSide, { signal: AbortSignal.timeout(5000) });
    const body = await response.json();
    return body && body.ok === true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------- main */

async function main() {
  checkPrerequisites();
  ensureAvd();
  startEmulator();
  await waitForBoot();

  installApk();
  const standalone = isStandaloneBuild();

  if (wantReset) {
    step('ล้างค่าที่จับคู่ไว้');
    writePairing(null);
  } else if (serverArg) {
    const origin = normalizeServer(serverArg === 'host' ? HOST_ALIAS : serverArg);

    if (standalone) {
      console.log(
        `\n  ! APK ที่ติดตั้งเป็นโหมด standalone — MainActivity จะข้ามค่าที่จับคู่ทั้งหมด\n` +
          `    ถ้าต้องการโหมดจับคู่ server ให้รันใหม่ด้วย --build`,
      );
    } else {
      step(`จับคู่กับ ${origin}`);

      if (!(await probeFromHost(origin))) {
        console.log(
          `  ! ยิง /api/health จากเครื่อง Windows ไม่ผ่าน — ตรวจว่า server เปิดอยู่ (docker ps)\n` +
            `    ตั้งค่าให้แล้ว แต่แอปอาจเด้งกลับหน้ากรอก IP`,
        );
      }

      writePairing(origin);
    }
  }

  step('เปิดแอป');
  run(adbPath, ['shell', 'am', 'start', '-n', MAIN_ACTIVITY]);

  console.log(`\n✓ เสร็จแล้ว — โหมด${standalone ? ' standalone (SQLite ในเครื่อง)' : 'จับคู่ server'}`);
  console.log('\n  ดู log:        adb logcat -s Capacitor:V Capacitor/Console:V');
  console.log('  ถอนการติดตั้ง: adb uninstall ' + APP_ID);
  console.log(`  ปิดเครื่อง:     adb emu kill\n`);
}

main().catch((error) => fail(error.message));
