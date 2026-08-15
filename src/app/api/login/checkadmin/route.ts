import { NextResponse } from "next/server";

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("ECONNREFUSED")
  );
}

export async function GET() {
  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { email: "admin@admin.com" } });
    const employee = await prisma.settingEmployee.findUnique({ where: { username: "admin@admin.com" } });
    return NextResponse.json({ exists: !!(user || employee) });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      console.warn("checkadmin database unavailable:", getErrorMessage(error));
      return NextResponse.json({ exists: false, databaseAvailable: false }, { status: 503 });
    }

    console.error("checkadmin error:", error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
