import type { NextConfig } from "next";
import path from "path";

/**
 * โปรเจกต์นี้ build ได้สองแบบจากซอร์สชุดเดียวกัน
 *
 *   BUILD_TARGET=web (ค่าเริ่มต้น) — Next.js server ตามปกติ ใช้กับ Docker และ Electron
 *                                    API ทำงานที่ server, ข้อมูลอยู่บน PostgreSQL
 *
 *   BUILD_TARGET=mobile           — static export ทั้งชุดเพื่อฝังลง .apk
 *                                    ไม่มี server: route handler เดิมถูก bundle เข้าไปในแอป
 *                                    แล้วเรียกผ่านเราเตอร์ในเครื่อง ส่วนข้อมูลอยู่บน SQLite
 *
 * ความต่างทั้งหมดรวมอยู่ในไฟล์นี้ไฟล์เดียว โค้ดใน src/ จึงไม่ต้องมี if แยกแพลตฟอร์มกระจัดกระจาย
 * ดู docs/android-standalone.md ประกอบ
 */
const isMobile = process.env.BUILD_TARGET === "mobile";

const resolveSrc = (relative: string) => path.resolve(__dirname, relative);

/**
 * โมดูลฝั่ง Node ที่ยกลงแท็บเล็ตไม่ได้ — ชี้ไปที่ stub ที่โยน error พร้อมข้อความอธิบาย
 * ไม่ตัด route ที่ import พวกนี้ทิ้ง เพราะหลาย route ใช้เฉพาะบางเส้นทางเท่านั้น
 */
const NATIVE_ONLY_MODULES = [
  "sharp",
  "formidable",
  "pdf-to-printer",
  "skia-canvas",
  "@prisma/client",
  "@prisma/adapter-pg",
  "prisma",
  "socket.io",
  "mongoose",
  "jsonwebtoken",
];

/** โมดูลมาตรฐานของ Node ที่ไม่มีในเบราว์เซอร์ — ให้ resolve เป็นโมดูลว่างแทนที่จะ build ไม่ผ่าน */
const NODE_BUILTIN_FALLBACKS = [
  "fs",
  "fs/promises",
  "path",
  "os",
  "crypto",
  "child_process",
  "net",
  "tls",
  "dns",
  "http",
  "https",
  "http2",
  "zlib",
  "stream",
  "worker_threads",
  "perf_hooks",
  "readline",
  "cluster",
];

const nextConfig: NextConfig = {
  output: isMobile ? "export" : "standalone",

  /**
   * โหมด mobile ใช้ distDir = "out"
   *
   * ตอนจบ next build ขั้นตอน export จะ "เขียนทับ" distDir ด้วยไฟล์เว็บนิ่งทั้งหมด
   * (ไม่เหลือ server/ cache/ ของขั้นตอน build) ตั้งเป็น out ไปเลยจึงได้ผลลัพธ์
   * ตรงตำแหน่งที่ Capacitor คาดหวัง โดยไม่ต้องคัดลอกอีกรอบ และไม่ไปทับ .next
   * ของ dev server ที่อาจรันอยู่
   */
  distDir: isMobile ? "out" : ".next",

  // static export ต้องออกเป็นโฟลเดอร์ที่มี index.html เพื่อให้ WebView หาไฟล์เจอตาม path
  trailingSlash: isMobile ? true : undefined,

  /**
   * กัน route handler ออกจาก static export
   *
   * output: "export" ยอมรับเฉพาะ route ที่ render เป็นไฟล์นิ่งได้ แต่ handler ในโปรเจกต์นี้
   * อ่านค่าจาก request แทบทุกตัว ถ้าปล่อยไว้ build จะไม่ผ่าน
   *
   * ใช้จังหวะที่ handler ทุกตัวเป็น route.ts (300/300) ส่วนหน้าจอเป็น .tsx/.jsx ล้วน —
   * ตัด "ts" ออกจาก pageExtensions จึงเท่ากับซ่อน route ทั้งหมดจาก App Router
   * โดยไม่ต้องย้ายไฟล์ (การย้ายไฟล์เคยพังเพราะ next dev ที่รันค้างจับ handle ไว้)
   *
   * ไฟล์เหล่านั้นยังถูก bundle เข้า APK ตามปกติ เพราะตารางเส้นทางเป็นคน import เอง
   */
  pageExtensions: isMobile ? ["tsx", "jsx"] : undefined,

  env: {
    APP_VERSION: process.env.APP_VERSION || "dev",
    NEXT_PUBLIC_BUILD_TARGET: isMobile ? "mobile" : "web",
  },

  experimental: {
    optimizeRouterScrolling: true,
    ...(isMobile ? {} : { serverActions: { bodySizeLimit: "1mb" } }),
  },

  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    // โหมด mobile ข้าม type check เพราะ route handler ถูกดึงเข้ามาอยู่ฝั่ง client
    // และชนิดของ Prisma/NextRequest ถูกสลับเป็นตัวแทนตอน build ซึ่ง tsc มองไม่เห็น
    // ความถูกต้องของ handler ตรวจครบแล้วตอน build โหมด web (npm run build) ซึ่ง type check เต็ม
    ignoreBuildErrors: isMobile,
  },

  // rewrites ใช้กับ output: export ไม่ได้ (ไม่มี server มาทำ rewrite ให้)
  ...(isMobile
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/uploads/:path*",
              destination: "/api/uploads/:path*",
            },
          ];
        },
      }),

  // รับ instance ของ webpack จาก Next แทนการ import โดยตรง — webpack ไม่ได้เป็น dependency
  // ของโปรเจกต์ (Next รวมไว้ข้างในเอง) การ import ตรง ๆ จะทำให้ build โหมด web ไม่ผ่าน type check
  webpack(config, { webpack }) {
    if (!isMobile) return config;

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),

      // NextRequest/NextResponse -> ตัวที่สร้างบน Request/Response มาตรฐาน
      "next/server$": resolveSrc("src/lib/mobile/api/next-server-shim.ts"),

      // revalidatePath ฯลฯ เป็นของ server เท่านั้น — Next ปฏิเสธตั้งแต่ตอน build
      "next/cache$": resolveSrc("src/lib/mobile/api/next-cache-shim.ts"),

      ...Object.fromEntries(
        NATIVE_ONLY_MODULES.map((name) => [
          `${name}$`,
          resolveSrc("src/lib/mobile/api/unsupported-native.ts"),
        ])
      ),
    };

    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      ...Object.fromEntries(NODE_BUILTIN_FALLBACKS.map((name) => [name, false])),
    };

    /**
     * import แบบ "node:fs" ไม่เข้าเส้นทาง resolve.fallback เพราะ webpack มองว่าเป็น URI scheme
     * ไม่ใช่ชื่อโมดูล จึงต้องตัดคำนำหน้าออกก่อน แล้วปล่อยให้ fallback ด้านบนจัดการต่อ
     */
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

    // lib/jwt ถูก import ทั้งแบบ @/lib/jwt และแบบ path สัมพัทธ์ ("../../../../lib/jwt")
    // alias จับได้เฉพาะแบบแรก จึงต้องใช้ regex จับที่ตัว request แทน
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /(^|[\\/])lib[\\/]jwt$/,
        resolveSrc("src/lib/mobile/jwt.ts")
      )
    );

    /**
     * Prisma Client -> ตัวที่คุยกับ SQLite ในเครื่อง
     *
     * ใช้ plugin ไม่ใช่ resolve.alias เพราะ Next ลงทะเบียนตัว resolve ของ tsconfig paths
     * ("@/*" -> src/*) ไว้ และมันชนะ alias — ผลคือ route ทั้ง 299 ตัวยังชี้ไป Prisma ตัวจริง
     * ทั้งที่ build ผ่าน (เห็นได้จาก warning "PrismaClient is not exported" เท่านั้น)
     *
     * ต้องจับสองแบบ: "@/lib/prisma" (route ส่วนใหญ่) และ "./prisma"
     * (barcodeResolve, stockBalance, selfHeal ที่อยู่ใน src/lib ด้วยกัน)
     */
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^(@\/lib\/prisma|\.\.?\/prisma)$/,
        (resource: { context: string; request: string }) => {
          const isAlias = resource.request === "@/lib/prisma";
          const isSibling =
            path.resolve(resource.context, resource.request) === resolveSrc("src/lib/prisma");

          if (isAlias || isSibling) {
            resource.request = resolveSrc("src/lib/mobile/db/prismaLite.ts");
          }
        }
      )
    );

    /**
     * ตารางเส้นทาง API ที่ generate ตอน build
     *
     * ใช้ NormalModuleReplacementPlugin ไม่ใช่ resolve.alias เพราะ Next ลงทะเบียน
     * ตัว resolve ของ tsconfig paths ("@mobile-api-registry" -> registry.stub.ts) ไว้
     * และมันชนะ alias — ผลคือ build ผ่านแต่ได้ตารางเปล่า ไม่มี handler ตัวไหนเข้า bundle เลย
     * plugin ตัวนี้แก้ที่ตัว request ก่อนเข้าขั้นตอน resolve จึงชนะแน่นอน
     */
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@mobile-api-registry$/,
        resolveSrc("src/lib/mobile/api/registry.generated.ts")
      )
    );

    /**
     * /api/system/tunnel -> เวอร์ชันที่คุม cloudflared ในแท็บเล็ต
     *
     * handler ตัวจริงสั่ง PowerShell ไปคุม container ของ Podman บนเครื่องคอมพิวเตอร์
     * ซึ่งบนแท็บเล็ตไม่มีทางทำได้ ถ้าปล่อยไว้จะได้ 500 ทุกครั้งที่กดปุ่มในหน้าตั้งค่า
     * ตัวแทนคุยกับปลั๊กอิน SmilePosTunnel แทน โดยคืนฟิลด์ชุดเดียวกันเป๊ะ
     *
     * ทำที่ชั้น build ไม่ใช่แตกสาขาใน route เพราะ handler ฝั่ง server ต้องไม่แบก
     * โค้ดของ Capacitor ติดไปด้วย (และตารางเส้นทางเป็นคน import ตัว route เข้ามาเอง)
     */
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@\/app\/api\/system\/tunnel\/route$/,
        resolveSrc("src/lib/mobile/api/routes/tunnel.ts")
      )
    );

    return config;
  },
};

export default nextConfig;
