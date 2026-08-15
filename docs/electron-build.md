# Electron Build

Electron packaging is separate from the Podman installer and Docker Compose files. The desktop app is a launcher that can run in two modes:

- **Server**: opens the local POS server. If a local server is already responding, Electron connects to it. If not, packaged Electron starts the bundled Next.js standalone server from `resources/standalone/server.js`.
- **Client**: connects to a Server machine by IP or URL. When only an IP is entered, the launcher uses port `4000` by default.

## Commands

```powershell
npm run electron-dev
npm run build:electron
npm run build:electron:dir
npm run build:electron:fast
npm run build:electron:msi
npm run build:electron:msi:full
```

- `electron-dev` runs Next.js on port `3000` and points Electron at `http://localhost:3000`.
- `build:electron` runs `npm run build`, verifies `.next/standalone/server.js`, then runs `electron-builder`.
- `build:electron:dir` creates an unpacked build for quick local testing.
- `build:electron:fast` skips the Next.js build and packages the existing `.next/standalone` output.
- `build:electron:msi` skips the Next.js build and creates a Windows `.msi` installer from the existing standalone output.
- `build:electron:msi:full` rebuilds Next.js first, then creates a Windows `.msi` installer.

The helper creates a temporary `.electron-build` staging project so `electron-builder` scans only the desktop launcher files instead of the full workspace. Portable and MSI outputs are written to `dist_electron` with timestamped file names, for example `dist_electron/SmilePharmacy-0.1.0-x64-20260530083229.exe` or `dist_electron/SmilePharmacy-0.1.0-x64-20260530085508.msi`. This avoids rebuild failures when Windows or antivirus software briefly locks the previous installer file.

## Runtime Settings

Optional environment variables:

```powershell
$env:ELECTRON_APP_URL="http://localhost:4000"
$env:ELECTRON_APP_PORT="4000"
$env:DATABASE_URL="postgresql://myuser:mypassword@localhost:5433/mydb?schema=public"
```

`ELECTRON_APP_URL` overrides the local Server URL. `ELECTRON_APP_PORT` changes the default port used by Server mode and IP-only Client entries. `DATABASE_URL` is used only when Electron starts the bundled standalone server itself.

If `npx prisma generate` fails with an EPERM rename error on Windows, stop the running Next/Electron dev process, then run the build again.