#!/usr/bin/env node

/**
 * สร้างไฟล์ .apk ของ Smile POS
 *
 *   node scripts/build-android.js              -> APK debug (เซ็นด้วย debug key ติดตั้งทดสอบได้ทันที)
 *   node scripts/build-android.js --release    -> APK release (ต้องมี keystore)
 *   node scripts/build-android.js --bundle     -> AAB สำหรับอัปขึ้น Play Console
 *
 * ต่างจาก build-electron.js ตรงที่ "ไม่ต้อง build Next.js" เลย เพราะ UI ไม่ได้ฝังใน APK
 * ตัวแอปโหลดหน้าจอจากเครื่อง server ในร้านผ่าน LAN สิ่งที่อยู่ใน APK มีแค่หน้าจับคู่
 * server กับโค้ด native — จึงต้อง build ใหม่เฉพาะตอนแก้ mobile-shell/ หรือปลั๊กอิน native
 *
 * การเซ็น release อ่านค่าจาก environment variable เท่านั้น ห้าม commit keystore หรือรหัสผ่าน:
 *   ANDROID_KEYSTORE_PATH      พาธไฟล์ .jks / .keystore
 *   ANDROID_KEYSTORE_PASSWORD  รหัสผ่านของ keystore
 *   ANDROID_KEY_ALIAS          ชื่อ alias ของคีย์
 *   ANDROID_KEY_PASSWORD       รหัสผ่านของคีย์ (ถ้าไม่ตั้ง จะใช้ค่าเดียวกับ keystore)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const outDir = path.join(rootDir, 'dist_android');

const args = process.argv.slice(2);
const isRelease = args.includes('--release');
const isBundle = args.includes('--bundle');
const skipSync = args.includes('--skip-sync');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || rootDir,
    stdio: 'inherit',
    // npx/cap เป็นไฟล์ .cmd บน Windows ต้องผ่าน shell — แต่ตอนเรียก gradlew ด้วยพาธเต็ม
    // ต้องปิด shell ไม่งั้น argument ที่มีช่องว่างจะถูกตัด
    shell: options.shell !== undefined ? options.shell : process.platform === 'win32',
    env: { ...process.env, ...(options.env || {}) },
  });

  if (result.error) fail(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}

/* --------------------------------------------------------------- ตรวจเครื่องมือ */

function checkPrerequisites() {
  if (!fs.existsSync(androidDir)) {
    fail('ไม่พบโฟลเดอร์ android/ — รัน `npx cap add android` ก่อน');
  }

  const javaHome = process.env.JAVA_HOME;
  const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const localProperties = path.join(androidDir, 'local.properties');
  const hasSdkPath = sdkRoot || fs.existsSync(localProperties);

  const problems = [];

  if (!javaHome) {
    problems.push(
      'ไม่พบ JAVA_HOME — ติดตั้ง JDK 21 (แนะนำ Temurin) แล้วตั้ง JAVA_HOME ให้ชี้ไปที่โฟลเดอร์ JDK',
    );
  }

  if (!hasSdkPath) {
    problems.push(
      'ไม่พบ Android SDK — ติดตั้ง Android Studio หรือ commandline-tools แล้วตั้ง ANDROID_HOME\n' +
        `    หรือสร้างไฟล์ ${localProperties} ที่มีบรรทัด sdk.dir=C\\:\\\\path\\\\to\\\\Android\\\\Sdk`,
    );
  }

  if (problems.length) {
    fail(`ยังขาดเครื่องมือสำหรับ build Android:\n  - ${problems.join('\n  - ')}`);
  }
}

/* ------------------------------------------------------------------ เวอร์ชัน */

/**
 * ตั้ง versionName จาก package.json และเดิน versionCode ขึ้นทีละ 1
 * Play Store บังคับว่า versionCode ของ build ใหม่ต้องมากกว่าเดิมเสมอ
 */
function syncVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const gradleFile = path.join(androidDir, 'app', 'build.gradle');
  const gradle = fs.readFileSync(gradleFile, 'utf8');

  const currentCode = Number((gradle.match(/versionCode\s+(\d+)/) || [])[1] || 1);
  const nextCode = isRelease ? currentCode + 1 : currentCode;

  const updated = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
    .replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`);

  if (updated !== gradle) {
    fs.writeFileSync(gradleFile, updated, 'utf8');
  }

  console.log(`\n▸ เวอร์ชัน: ${pkg.version} (versionCode ${nextCode})`);
  return { versionName: pkg.version, versionCode: nextCode };
}

/* ------------------------------------------------------------------- การเซ็น */

function buildSigningEnv() {
  if (!isRelease) return {};

  const keystorePath = process.env.ANDROID_KEYSTORE_PATH;
  const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
  const keyAlias = process.env.ANDROID_KEY_ALIAS;

  if (!keystorePath || !keystorePassword || !keyAlias) {
    fail(
      'build release ต้องตั้ง environment variable ให้ครบก่อน:\n' +
        '  - ANDROID_KEYSTORE_PATH\n' +
        '  - ANDROID_KEYSTORE_PASSWORD\n' +
        '  - ANDROID_KEY_ALIAS\n' +
        '  - ANDROID_KEY_PASSWORD (ถ้าไม่ตั้ง จะใช้ค่าเดียวกับ ANDROID_KEYSTORE_PASSWORD)\n\n' +
        'สร้าง keystore ใหม่ได้ด้วย:\n' +
        '  keytool -genkey -v -keystore smilepos-release.jks -keyalg RSA \\\n' +
        '          -keysize 2048 -validity 10000 -alias smilepos\n\n' +
        'เก็บไฟล์นี้ให้ดีและสำรองไว้ — ถ้าหายจะอัปเดตแอปที่ติดตั้งไปแล้วไม่ได้อีกเลย',
    );
  }

  if (!fs.existsSync(keystorePath)) {
    fail(`ไม่พบไฟล์ keystore ที่ ${keystorePath}`);
  }

  return {
    SMILEPOS_KEYSTORE_PATH: path.resolve(keystorePath),
    SMILEPOS_KEYSTORE_PASSWORD: keystorePassword,
    SMILEPOS_KEY_ALIAS: keyAlias,
    SMILEPOS_KEY_PASSWORD: process.env.ANDROID_KEY_PASSWORD || keystorePassword,
  };
}

/* --------------------------------------------------------------------- build */

function collectArtifacts(versionName) {
  fs.mkdirSync(outDir, { recursive: true });

  const buildType = isRelease ? 'release' : 'debug';
  const sourceDir = isBundle
    ? path.join(androidDir, 'app', 'build', 'outputs', 'bundle', buildType)
    : path.join(androidDir, 'app', 'build', 'outputs', 'apk', buildType);

  if (!fs.existsSync(sourceDir)) {
    fail(`ไม่พบผลลัพธ์ที่ ${sourceDir}`);
  }

  const extension = isBundle ? '.aab' : '.apk';
  const artifacts = fs.readdirSync(sourceDir).filter((name) => name.endsWith(extension));

  if (!artifacts.length) {
    fail(`ไม่พบไฟล์ ${extension} ใน ${sourceDir}`);
  }

  const copied = artifacts.map((name) => {
    const target = path.join(outDir, `SmilePOS-${versionName}-${buildType}${extension}`);
    fs.copyFileSync(path.join(sourceDir, name), target);
    return target;
  });

  return copied;
}

function main() {
  checkPrerequisites();

  if (!skipSync) {
    console.log('\n▸ ซิงก์ไฟล์ shell และปลั๊กอินเข้าโปรเจกต์ Android');
    run('npx', ['cap', 'sync', 'android']);
  }

  const { versionName } = syncVersion();
  const signingEnv = buildSigningEnv();

  const task = isBundle
    ? isRelease
      ? 'bundleRelease'
      : 'bundleDebug'
    : isRelease
      ? 'assembleRelease'
      : 'assembleDebug';

  console.log(`\n▸ gradle ${task}`);

  if (process.platform === 'win32') {
    // เรียกผ่าน cmd /c ด้วยพาธเต็มและปิด shell — ปล่อยให้ spawn จัดการ argument เอง
    // ถ้าใช้ shell:true แล้วส่ง 'gradlew.bat' เฉย ๆ Windows จะไปหาใน PATH ไม่ใช่ใน cwd
    run('cmd.exe', ['/c', path.join(androidDir, 'gradlew.bat'), task], {
      cwd: androidDir,
      env: signingEnv,
      shell: false,
    });
  } else {
    run(path.join(androidDir, 'gradlew'), [task], {
      cwd: androidDir,
      env: signingEnv,
      shell: false,
    });
  }

  const artifacts = collectArtifacts(versionName);

  console.log('\n✓ เสร็จแล้ว');
  artifacts.forEach((file) => console.log(`  ${path.relative(rootDir, file)}`));

  if (!isRelease) {
    console.log('\n  ติดตั้งลงเครื่องที่เสียบ USB อยู่:  adb install -r <ไฟล์ด้านบน>');
  }

  console.log('');
}

main();
