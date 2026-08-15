import { NextRequest, NextResponse } from "next/server"
import { existsSync } from "fs"
import { promises as fs } from "fs"
import path from "path"

export const runtime = "nodejs"

const SIGNATURE_DIR = path.join(process.cwd(), "public", "uploads", "signatures")

function cleanFilePart(value: string) {
  return String(value || "default").replace(/[^a-zA-Z0-9._-]/g, "_")
}

function getSignatureFile(employeeId: string, company: string) {
  const safeEmployeeId = cleanFilePart(employeeId)
  const safeCompany = cleanFilePart(company)
  const fileName = `employee_${safeCompany}_${safeEmployeeId}.png`
  return {
    fileName,
    publicUrl: `/uploads/signatures/${fileName}`,
    absolutePath: path.join(SIGNATURE_DIR, fileName),
  }
}

export async function GET(request: NextRequest) {
  const employeeId = request.nextUrl.searchParams.get("employeeId") || ""
  const company = request.nextUrl.searchParams.get("company") || "default"

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 })
  }

  const signatureFile = getSignatureFile(employeeId, company)
  const signatureUrl = existsSync(signatureFile.absolutePath) ? signatureFile.publicUrl : null
  return NextResponse.json({ signatureUrl })
}

export async function POST(request: NextRequest) {
  try {
    const { employeeId, company = "default", signatureData } = await request.json()

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 })
    }

    if (typeof signatureData !== "string" || !signatureData.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "signatureData must be a PNG data URL" }, { status: 400 })
    }

    const signatureFile = getSignatureFile(String(employeeId), String(company))
    const base64 = signatureData.replace(/^data:image\/png;base64,/, "")
    const buffer = Buffer.from(base64, "base64")

    await fs.mkdir(SIGNATURE_DIR, { recursive: true })
    await fs.writeFile(signatureFile.absolutePath, buffer)

    return NextResponse.json({ signatureUrl: signatureFile.publicUrl })
  } catch (error: any) {
    console.error("POST /api/setting/employee-signature error:", error)
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get("employeeId") || ""
    const company = request.nextUrl.searchParams.get("company") || "default"

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 })
    }

    const signatureFile = getSignatureFile(employeeId, company)
    if (existsSync(signatureFile.absolutePath)) {
      await fs.unlink(signatureFile.absolutePath)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("DELETE /api/setting/employee-signature error:", error)
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 })
  }
}