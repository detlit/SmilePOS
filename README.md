This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## ⚠️ ก่อน commit ทุกครั้ง

repo นี้เป็นซอฟต์แวร์ร้านขายยา — **ห้าม commit ข้อมูลลูกค้าและข้อมูลลับ**
`.gitignore` กันไว้แล้ว (`pg-data/`, `data/`, `uploads/`, `.env`) อย่าแก้ส่วนนั้นออก
ค่า token/รหัสผ่านให้อ้างผ่าน environment variable เสมอ ห้าม hardcode ลงไฟล์ที่ขึ้น git

## สำรองงานอัตโนมัติ

โปรเจกต์ snapshot ขึ้น GitHub ให้เองทุก 30 นาที ที่ branch `autosave/<ชื่อเครื่อง>`
โดยไม่แตะ working tree หรือ staging area — ดู [docs/autosave.md](docs/autosave.md)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-autosave-task.ps1
```

## Electron Desktop Build

Use the dedicated Electron build flow when creating the desktop launcher:

```bash
npm run build:electron
```

The launcher supports Server and Client connection modes without changing the Podman/Docker Compose setup. See [docs/electron-build.md](docs/electron-build.md) for the full workflow.

## Android (.apk)

แท็บเล็ต Android ใช้เป็นเครื่องลูกในร้านได้ โดยต่อเข้าเครื่องเคาน์เตอร์ที่เปิดโหมด Server ผ่าน LAN
ตัวแอปเป็นเปลือก Capacitor ที่โหลดหน้าจอจาก server — แก้ UI ที่ server ที่เดียว
แท็บเล็ตทุกเครื่องได้ของใหม่ทันทีโดยไม่ต้องแจก APK ใหม่

```bash
npm run build:android            # APK debug
npm run build:android:release    # APK release (ต้องมี keystore)
```

ต้องมี JDK 21 + Android SDK ก่อน ดูขั้นตอนเต็มที่ [docs/android-build.md](docs/android-build.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
