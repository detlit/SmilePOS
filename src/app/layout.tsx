// Deliberately NOT "use client": Next.js ignores `metadata` exported from a
// client component, which is why the browser tab showed the URL instead of the
// product name. Every interactive child below carries its own "use client".
import localFont from "next/font/local";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from "sonner";
import DesktopOnlyServices from "@/components/DesktopOnlyServices";
import LogbookAutoTracker from "@/components/LogbookAutoTracker";
import NativeAppShell from "@/components/NativeAppShell";
import StandaloneBootstrap from "@/components/StandaloneBootstrap";
//import { enableFullscreen } from "@/lib/fullscreen";


const geistSans = localFont({
  src: [
    { path: "../../public/fonts/Kanit-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Kanit-SemiBold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../../public/fonts/THSarabun.ttf",
  variable: "--font-geist-mono",
  display: "swap",
});

export { metadata, viewport } from "./metadata";


export default function RootLayout({

  children,

}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StandaloneBootstrap>{children}</StandaloneBootstrap>
        <Toaster position="top-center" richColors />
        <NativeAppShell />
        <DesktopOnlyServices />
        <LogbookAutoTracker />
      </body>
    </html>
  );
}
