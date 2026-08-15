import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

const SUPPORTED_DOC_TYPES = ["qt", "bl", "inv", "re", "tax", "debit", "credit"] as const
type SupportedDocType = typeof SUPPORTED_DOC_TYPES[number]
const ATTACHMENT_SLOT_PATTERN = /^[a-z0-9-]+$/

const DOC_UPLOAD_DIR = path.join(process.cwd(), "uploads", "doc")

const isSupportedDocType = (value: string): value is SupportedDocType => (
  SUPPORTED_DOC_TYPES.includes(value as SupportedDocType)
)

const parseDocId = (rawValue: string | null) => {
  const parsed = Number(rawValue || "0")
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
}

const parseAttachmentSlot = (rawValue: string | null | undefined) => {
  const normalized = String(rawValue || "").trim().toLowerCase()
  if (!normalized) return ""
  return ATTACHMENT_SLOT_PATTERN.test(normalized) ? normalized : null
}

const buildAttachmentFileName = (docType: SupportedDocType, docId: number, slot = "") => (
  slot ? `${docType}_${docId}_${slot}.pdf` : `${docType}_${docId}.pdf`
)

const buildAttachmentFilePath = (docType: SupportedDocType, docId: number, slot = "") => (
  path.join(DOC_UPLOAD_DIR, buildAttachmentFileName(docType, docId, slot))
)

const buildAttachmentUrl = (docType: SupportedDocType, docId: number, version: number, slot = "") => (
  `/api/uploads/doc/${buildAttachmentFileName(docType, docId, slot)}?v=${version}`
)

const getAttachmentMetadata = async (docType: SupportedDocType, docId: number, slot = "") => {
  const fileName = buildAttachmentFileName(docType, docId, slot)
  const filePath = buildAttachmentFilePath(docType, docId, slot)

  try {
    const stats = await fs.stat(filePath)
    const updatedAt = stats.mtimeMs

    return {
      exists: true,
      docType,
      docId,
      slot,
      fileName,
      fileSize: stats.size,
      updatedAt,
      url: buildAttachmentUrl(docType, docId, updatedAt, slot),
    }
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      throw error
    }

    return {
      exists: false,
      docType,
      docId,
      slot,
      fileName,
      fileSize: 0,
      updatedAt: null,
      url: null,
    }
  }
}

const getValidatedQueryParams = (request: NextRequest) => {
  const docType = String(request.nextUrl.searchParams.get("docType") || "").trim().toLowerCase()
  const docId = parseDocId(request.nextUrl.searchParams.get("docId"))
  const slot = parseAttachmentSlot(request.nextUrl.searchParams.get("slot"))

  if (!isSupportedDocType(docType)) {
    return { error: "Invalid document type", docType: null, docId: 0, slot: "" }
  }

  if (!docId) {
    return { error: "Invalid document id", docType: null, docId: 0, slot: "" }
  }

  if (slot === null) {
    return { error: "Invalid attachment slot", docType: null, docId: 0, slot: "" }
  }

  return { error: null, docType, docId, slot }
}

export async function GET(request: NextRequest) {
  try {
    const { error, docType, docId, slot } = getValidatedQueryParams(request)
    if (error || !docType || !docId) {
      return NextResponse.json({ error: error || "Invalid request" }, { status: 400 })
    }

    return NextResponse.json(await getAttachmentMetadata(docType, docId, slot))
  } catch (error) {
    console.error("GET /api/document-attachment error:", error)
    return NextResponse.json({ error: "Failed to load document attachment" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const docType = String(formData.get("docType") || "").trim().toLowerCase()
    const docId = parseDocId(String(formData.get("docId") || "0"))
    const slot = parseAttachmentSlot(String(formData.get("slot") || ""))
    const fileEntry = formData.get("file")

    if (!isSupportedDocType(docType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    if (!docId) {
      return NextResponse.json({ error: "Invalid document id" }, { status: 400 })
    }

    if (slot === null) {
      return NextResponse.json({ error: "Invalid attachment slot" }, { status: 400 })
    }

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const fileName = String(fileEntry.name || "").toLowerCase()
    const isPdf = fileEntry.type === "application/pdf" || fileName.endsWith(".pdf")

    if (!isPdf) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    await fs.mkdir(DOC_UPLOAD_DIR, { recursive: true })

    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer())
    await fs.writeFile(buildAttachmentFilePath(docType, docId, slot || ""), fileBuffer)

    return NextResponse.json(await getAttachmentMetadata(docType, docId, slot || ""))
  } catch (error) {
    console.error("POST /api/document-attachment error:", error)
    return NextResponse.json({ error: "Failed to save document attachment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, docType, docId, slot } = getValidatedQueryParams(request)
    if (error || !docType || !docId) {
      return NextResponse.json({ error: error || "Invalid request" }, { status: 400 })
    }

    try {
      await fs.unlink(buildAttachmentFilePath(docType, docId, slot))
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/document-attachment error:", error)
    return NextResponse.json({ error: "Failed to delete document attachment" }, { status: 500 })
  }
}