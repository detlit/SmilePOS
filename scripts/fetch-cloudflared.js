#!/usr/bin/env node

/**
 * ดาวน์โหลดไบนารี cloudflared มาวางใน jniLibs เพื่อฝังลง .apk
 *
 *   node scripts/fetch-cloudflared.js                 # arm64-v8a + x86_64 (แท็บเล็ตจริง + emulator)
 *   node scripts/fetch-cloudflared.js --abi=arm64-v8a # เฉพาะเครื่องจริง (APK เล็กลงครึ่งหนึ่ง)
 *   node scripts/fetch-cloudflared.js --abi=all       # ครบทุกสถาปัตยกรรม
 *   node scripts/fetch-cloudflared.js --version=2025.8.1
 *
 * ทำไมต้องดาวน์โหลดตอน build ไม่ commit ลง git
 * ────────────────────────────────────────────────────────────────────────
 * ไฟล์ละ ~40 MB ถ้าเก็บลง repo ทุก ABI ทุกครั้งที่อัปเดตเวอร์ชัน ประวัติ git จะบวมถาวร
 * (ลบทีหลังก็ไม่คืนพื้นที่) สคริปต์นี้จึงทำหน้าที่เดียวกับการ restore dependency
 *
 * ทำไมชื่อไฟล์ปลายทางต้องเป็น libcloudflared.so
 * ────────────────────────────────────────────────────────────────────────
 * ตั้งแต่ Android 10 ระบบห้ามรันไฟล์ที่อยู่ในโฟลเดอร์ข้อมูลของแอป (W^X) ทางเดียวที่เหลือ
 * คือให้ตัวติดตั้งแตกไฟล์ไปไว้ที่ nativeLibraryDir ซึ่งมีสิทธิ์ execute — และตัวติดตั้ง
 * จะแตกเฉพาะไฟล์ที่ขึ้นต้น "lib" ลงท้าย ".so" เท่านั้น ทั้งที่ของเราเป็น executable ของ Go
 * ดู android/app/src/main/java/com/smilepharmacy/pos/tunnel/CloudflaredProcess.java
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const jniLibsDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'jniLibs');

/** ABI ของ Android -> ชื่อไฟล์ใน release ของ cloudflared */
const ABI_TO_ASSET = {
  'arm64-v8a': 'cloudflared-linux-arm64',
  'armeabi-v7a': 'cloudflared-linux-arm',
  'x86_64': 'cloudflared-linux-amd64',
  'x86': 'cloudflared-linux-386',
};

/** ค่าเริ่มต้น: เครื่องจริงเกือบทั้งหมดเป็น arm64 ส่วน x86_64 มีไว้ให้ emulator ตอนพัฒนา */
const DEFAULT_ABIS = ['arm64-v8a', 'x86_64'];

const args = process.argv.slice(2);
const abiArg = readArg('--abi');
const version = readArg('--version') || 'latest';

function readArg(name) {
  const hit = args.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function resolveAbis() {
  if (!abiArg) return DEFAULT_ABIS;
  if (abiArg === 'all') return Object.keys(ABI_TO_ASSET);

  const requested = abiArg.split(',').map((a) => a.trim()).filter(Boolean);
  for (const abi of requested) {
    if (!ABI_TO_ASSET[abi]) {
      fail(`ไม่รู้จัก ABI "${abi}" — เลือกได้: ${Object.keys(ABI_TO_ASSET).join(', ')} หรือ all`);
    }
  }
  return requested;
}

function downloadUrl(asset) {
  return version === 'latest'
    ? `https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}`
    : `https://github.com/cloudflare/cloudflared/releases/download/${version}/${asset}`;
}

/** ตาม redirect เอง — GitHub ส่งต่อไป objects.githubusercontent.com เสมอ */
function download(url, destination, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'smilepos-build' } }, (response) => {
        const { statusCode, headers } = response;

        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          response.resume();
          if (redirectsLeft === 0) return reject(new Error('redirect วนไม่จบ'));
          return resolve(download(headers.location, destination, redirectsLeft - 1));
        }

        if (statusCode !== 200) {
          response.resume();
          return reject(new Error(`HTTP ${statusCode} จาก ${url}`));
        }

        const total = Number(headers['content-length'] || 0);
        let received = 0;
        let lastPrinted = 0;

        const file = fs.createWriteStream(destination);
        response.on('data', (chunk) => {
          received += chunk.length;
          const percent = total ? Math.floor((received / total) * 100) : 0;
          if (percent >= lastPrinted + 10) {
            lastPrinted = percent;
            process.stdout.write(`  ${percent}%\r`);
          }
        });

        response.pipe(file);
        file.on('finish', () => file.close(() => resolve(received)));
        file.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  const abis = resolveAbis();
  console.log(`\n▸ ดาวน์โหลด cloudflared (${version}) สำหรับ: ${abis.join(', ')}`);

  for (const abi of abis) {
    const asset = ABI_TO_ASSET[abi];
    const targetDir = path.join(jniLibsDir, abi);
    const target = path.join(targetDir, 'libcloudflared.so');

    fs.mkdirSync(targetDir, { recursive: true });

    const temp = `${target}.download`;
    console.log(`\n  ${abi} <- ${asset}`);

    try {
      const bytes = await download(downloadUrl(asset), temp);

      // ไฟล์ ELF จริงต้องขึ้นต้นด้วย 0x7F 'E' 'L' 'F' — ถ้า GitHub ตอบหน้า HTML มาแทน
      // (เวอร์ชันผิด/เน็ตมี captive portal) จะจับได้ตรงนี้แทนที่จะไปพังตอนรันบนแท็บเล็ต
      const magic = Buffer.alloc(4);
      const handle = fs.openSync(temp, 'r');
      fs.readSync(handle, magic, 0, 4, 0);
      fs.closeSync(handle);

      if (magic[0] !== 0x7f || magic.toString('latin1', 1, 4) !== 'ELF') {
        fs.unlinkSync(temp);
        fail(`ไฟล์ที่ได้ไม่ใช่ ELF — ตรวจว่าเวอร์ชัน "${version}" มีอยู่จริง`);
      }

      fs.renameSync(temp, target);
      console.log(`  ✓ ${(bytes / 1024 / 1024).toFixed(1)} MB -> ${path.relative(rootDir, target)}`);
    } catch (err) {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
      fail(`ดาวน์โหลด ${asset} ไม่สำเร็จ: ${err.message}`);
    }
  }

  console.log('\n✓ เสร็จแล้ว — build APK ใหม่เพื่อฝังลงไป: npm run build:android:standalone\n');
}

main();
