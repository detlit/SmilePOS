#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const stageDir = path.join(rootDir, '.electron-build');
const electronBuilderCli = path.join(rootDir, 'node_modules', 'electron-builder', 'cli.js');
const rawArgs = process.argv.slice(2);
const skipNextBuild = rawArgs.includes('--skip-next-build');
const msiBuild = rawArgs.includes('--msi');
const builderArgsBase = rawArgs.filter((arg) => arg !== '--skip-next-build' && arg !== '--msi');
const hasWindowsTargetArg = builderArgsBase.some((arg) => arg === '--win' || arg === '--windows' || arg === '-w');
const builderArgs = msiBuild && !hasWindowsTargetArg ? [...builderArgsBase, '--win', 'msi'] : builderArgsBase;
const isDirBuild = builderArgs.includes('--dir');

function cleanupStage() {
  if (process.env.ELECTRON_KEEP_STAGE !== '1') {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
}

process.on('exit', cleanupStage);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runShell(commandLine) {
  const result = spawnSync(commandLine, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function requirePath(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing ${relativePath}`);
    console.error('Run npm run build before packaging Electron, or omit --skip-next-build.');
    process.exit(1);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getElectronVersion() {
  const electronPackagePath = path.join(rootDir, 'node_modules', 'electron', 'package.json');
  return readJson(electronPackagePath).version;
}

function prepareStage() {
  const rootPackage = readJson(path.join(rootDir, 'package.json'));
  const rootBuild = rootPackage.build || {};
  const buildStamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

  fs.rmSync(stageDir, { recursive: true, force: true });
  fs.mkdirSync(stageDir, { recursive: true });
  fs.cpSync(path.join(rootDir, 'electron'), path.join(stageDir, 'electron'), { recursive: true });

  const stagePackage = {
    name: `${rootPackage.name || 'smilepharmacy'}-electron`,
    version: rootPackage.version || '0.0.0',
    description: rootPackage.description || 'Smile Pharmacy POS desktop launcher',
    author: rootPackage.author || 'Smile Pharmacy',
    private: true,
    main: 'electron/main.js',
    build: {
      appId: rootBuild.appId || 'com.smilepharmacy.app',
      productName: rootBuild.productName || 'SmilePharmacy',
      electronVersion: getElectronVersion(),
      npmRebuild: false,
      asar: true,
      extraMetadata: {
        main: 'electron/main.js',
        dependencies: {},
      },
      win: {
        ...(rootBuild.win || {}),
        icon: path.join(rootDir, 'public', 'app-icon.png'),
      },
      compression: rootBuild.compression || 'store',
      artifactName: isDirBuild
        ? rootBuild.artifactName || '${productName}-${version}-${arch}.${ext}'
        : `${rootBuild.productName || 'SmilePharmacy'}-${rootPackage.version || '0.0.0'}-x64-${buildStamp}.\${ext}`,
      directories: {
        output: path.join(rootDir, 'dist_electron'),
        buildResources: path.join(rootDir, 'public'),
      },
      files: [
        {
          from: 'electron',
          to: 'electron',
          filter: ['**/*'],
        },
        'package.json',
      ],
      extraResources: [
        {
          from: path.join(rootDir, '.next', 'standalone'),
          to: 'standalone',
          filter: ['**/*'],
        },
        {
          from: path.join(rootDir, 'public'),
          to: 'standalone/public',
          filter: ['**/*'],
        },
        {
          from: path.join(rootDir, '.next', 'static'),
          to: 'standalone/.next/static',
          filter: ['**/*'],
        },
        {
          from: path.join(rootDir, 'smartcard-agent'),
          to: 'smartcard-agent',
          filter: ['**/*', '!node_modules/**'],
        },
      ],
    },
  };

  fs.writeFileSync(path.join(stageDir, 'package.json'), JSON.stringify(stagePackage, null, 2), 'utf8');
}

if (!skipNextBuild) {
  console.log('Building Next.js standalone bundle...');
  runShell('npm run build');
}

requirePath(path.join('.next', 'standalone', 'server.js'));
requirePath(path.join('.next', 'static'));
requirePath('public');
requirePath(path.join('node_modules', 'electron-builder', 'cli.js'));
requirePath(path.join('node_modules', 'electron', 'package.json'));

console.log('Preparing Electron staging project...');
prepareStage();

console.log('Packaging Electron application...');
run(process.execPath, [electronBuilderCli, '--projectDir', stageDir, ...builderArgs]);