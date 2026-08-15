#!/usr/bin/env node

/**
 * สร้าง .apk แบบ standalone — UI ทั้งระบบและฐานข้อมูลอยู่ในเครื่อง ไม่ต้องมี server
 *
 *   node scripts/build-android-standalone.js            -> APK debug
 *   node scripts/build-android-standalone.js --release  -> APK release (ต้องมี keystore)
 *   node scripts/build-android-standalone.js --bundle   -> AAB สำหรับ Play Console
 *
 * ต่างจาก build-android.js (โหมดจับคู่ server) ตรงที่ต้อง build Next.js เป็น static export
 * แล้วฝังทั้งชุดลงไปใน APK พร้อมกับ route handler ที่แปลงให้รันในเครื่อง
 *
 * ขั้นตอน
 * ────────────────────────────────────────────────────────────────────────
 *   1. แปลง prisma/schema.prisma -> DDL ของ SQLite
 *   2. สร้างตารางเส้นทางที่ import route handler ทั้ง 300 ตัวเข้ามาใน bundle
 *   3. next build (BUILD_TARGET=mobile) -> out/
 *      โหมดนี้ตั้ง pageExtensions ให้เหลือ tsx/jsx เพื่อซ่อน route.ts จาก App Router
 *      (ดูเหตุผลใน next.config.ts) จึงไม่ต้องย้ายหรือแตะไฟล์ต้นฉบับเลย
 *   4. cap sync + gradle ผ่าน build-android.js
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const registryFile = path.join(rootDir, 'src', 'lib', 'mobile', 'api', 'registry.generated.ts');
const outDir = path.join(rootDir, 'out');

const args = process.argv.slice(2);
const skipNextBuild = args.includes('--skip-next-build');
/** --web-only = หยุดหลัง static export ไม่ต้องแตะ Android เลย (ใช้ตอนไล่แก้ error ตอน build) */
const webOnly = args.includes('--web-only');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function run(command, commandArgs, options = {}) {
  // npx/cap เป็นไฟล์ .cmd บน Windows จึงต้องผ่าน shell
  // แต่ node.exe อยู่ใน "C:\Program Files\nodejs" ซึ่งมีช่องว่าง — ถ้าผ่าน shell จะถูกตัดคำ
  const needsShell =
    options.shell !== undefined
      ? options.shell
      : process.platform === 'win32' && command !== process.execPath;

  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || rootDir,
    stdio: 'inherit',
    shell: needsShell,
    env: { ...process.env, ...(options.env || {}) },
  });

  if (result.error) fail(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}

function main() {
  if (!fs.existsSync(apiDir)) {
    fail('ไม่พบ src/app/api');
  }

  console.log('\n▸ แปลง schema.prisma -> SQLite');
  run(process.execPath, [path.join(rootDir, 'scripts', 'gen-sqlite-schema.js')]);

  console.log('\n▸ สร้างตารางเส้นทาง API');
  run(process.execPath, [
    path.join(rootDir, 'scripts', 'gen-api-registry.js'),
    '--src',
    'src/app/api',
    '--alias',
    '@/app/api',
  ]);

  if (!skipNextBuild) {
    // ล้างผลลัพธ์เก่า ไม่งั้นหน้าที่ถูกลบไปแล้วจะยังค้างอยู่ใน APK
    fs.rmSync(outDir, { recursive: true, force: true });

    console.log('\n▸ next build (static export)');
    run('npx', ['next', 'build'], {
      env: {
        BUILD_TARGET: 'mobile',
        NEXT_PUBLIC_BUILD_TARGET: 'mobile',
        APP_VERSION: readVersion(),
      },
    });

    if (!fs.existsSync(path.join(outDir, 'index.html'))) {
      fail('next build ไม่ได้สร้าง out/index.html — ตรวจ log ด้านบน');
    }

    const pageCount = countHtml(outDir);
    console.log(`\n▸ static export สำเร็จ: ${pageCount} หน้า`);
  }

  if (webOnly) {
    console.log('\n✓ เสร็จเฉพาะส่วนเว็บ (--web-only) — ผลลัพธ์อยู่ที่ out/\n');
    return;
  }

  warnIfTunnelBinaryMissing();

  console.log('\n▸ ซิงก์เข้าโปรเจกต์ Android (โหมด standalone)');
  run('npx', ['cap', 'sync', 'android'], { env: { CAP_MODE: 'standalone' } });

  const passthrough = args.filter((a) => a !== '--skip-next-build' && a !== '--web-only');
  console.log('\n▸ build APK');
  run(process.execPath, [
    path.join(rootDir, 'scripts', 'build-android.js'),
    '--skip-sync',
    ...passthrough,
  ]);
}

/**
 * เตือนถ้ายังไม่ได้ดึงไบนารี cloudflared มาไว้ใน jniLibs
 *
 * ไม่ทำให้ build ล้มโดยตั้งใจ — APK ที่ไม่มีไบนารียังใช้งานได้ครบทุกอย่างยกเว้นการเปิดให้เข้า
 * จากภายนอก และหน้าตั้งค่าจะขึ้นข้อความบอกสาเหตุเอง (ดู src/lib/mobile/api/routes/tunnel.ts)
 * แต่ถ้าเงียบไปเลย คนที่ build จะรู้ตัวก็ต่อเมื่อลงเครื่องจริงแล้วกดปุ่มไม่ติด
 */
function warnIfTunnelBinaryMissing() {
  const jniLibs = path.join(rootDir, 'android', 'app', 'src', 'main', 'jniLibs');
  const abis = fs.existsSync(jniLibs)
    ? fs.readdirSync(jniLibs).filter((abi) =>
        fs.existsSync(path.join(jniLibs, abi, 'libcloudflared.so'))
      )
    : [];

  if (abis.length === 0) {
    console.log('\n⚠ ไม่พบไบนารี cloudflared — APK นี้จะเปิดให้เข้าจากภายนอกไม่ได้');
    console.log('  ถ้าต้องการฟีเจอร์นั้น ให้รัน: npm run fetch:cloudflared แล้ว build ใหม่');
    return;
  }

  console.log(`\n▸ ฝัง cloudflared สำหรับ: ${abis.join(', ')}`);
  if (!abis.includes('arm64-v8a')) {
    console.log('  ⚠ ไม่มี arm64-v8a — แท็บเล็ตจริงเกือบทั้งหมดใช้สถาปัตยกรรมนี้');
  }
}

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  return pkg.version;
}

function countHtml(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countHtml(path.join(dir, entry.name));
    else if (entry.name.endsWith('.html')) count += 1;
  }
  return count;
}

main();
