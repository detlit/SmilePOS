import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string || 'file' // 'image' or 'file'

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ไฟล์ขนาดเกิน 10MB' }, { status: 400 })
    }

    const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: type === 'image'
          ? 'รองรับเฉพาะไฟล์ JPG, PNG, GIF, WEBP'
          : 'ประเภทไฟล์ไม่รองรับ',
      }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Generate unique filename
    const ext = path.extname(file.name) || ''
    const safeName = crypto.randomUUID() + ext
    const subDir = type === 'image' ? 'chat-images' : 'chat-files'
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir)
    await fs.mkdir(uploadsDir, { recursive: true })
    await fs.writeFile(path.join(uploadsDir, safeName), buffer)

    const mediaUrl = `/uploads/${subDir}/${safeName}`

    return NextResponse.json({
      success: true,
      mediaUrl,
      fileName: file.name,
      fileSize: file.size,
      messageType: type === 'image' ? 'image' : 'file',
    })
  } catch (error: any) {
    console.error('Chat upload error:', error)
    return NextResponse.json({ error: 'อัปโหลดไฟล์ไม่สำเร็จ' }, { status: 500 })
  }
}
