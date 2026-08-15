import { NextRequest, NextResponse } from 'next/server'
import { Translator } from 'google-translate-api-x'

type TranslateRequest = {
  text?: string
  texts?: string[]
  targets: string[]
}

type TranslateResult = {
  target: string
  translatedText: string
  mirror: string
}

type BatchTranslateResult = {
  index: number
  translatedText: string
}

// Lingva mirror list (ฟรี)
const LINGVA_MIRRORS = [
  'https://lingva.lunar.icu',
  'https://translate.plausibility.cloud',
  'https://lingva.garuber.link',
  'https://lingva.thedaviddelta.com',
]

// Track which mirror worked last to try it first next time
let lastWorkingMirrorIdx = 0

const GOOGLE_TARGETS: Record<string, string> = {
  zh: 'zh-CN',
  'zh-CN': 'zh-CN',
  lo: 'lo',
  my: 'my',
  km: 'km',
  en: 'en',
  ko: 'ko',
  ja: 'ja',
}

function toGoogleTarget(target: string) {
  return GOOGLE_TARGETS[target] || target
}

function toLingvaTarget(target: string) {
  return target === 'zh-CN' ? 'zh' : target
}

async function translateWithGoogle(
  text: string,
  target: string,
): Promise<{ translatedText: string; mirror: string }> {
  const translator = new Translator({ from: 'th', to: toGoogleTarget(target), forceBatch: false, tld: 'com' })
  const data = await translator.translate(text)
  const translatedText = String((data as any)?.text || '').trim()

  if (!translatedText) throw new Error('No translation returned')
  return { translatedText, mirror: 'google-translate-api-x' }
}

async function translateText(
  text: string,
  target: string,
): Promise<{ translatedText: string; mirror: string }> {
  try {
    return await translateWithGoogle(text, target)
  } catch (err) {
    console.warn(`Google translate failed for ${target}: ${err}`)
  }

  return translateWithLingvaMirror(text, target)
}

// เรียก Lingva mirror อัตโนมัติ — เริ่มจาก mirror ที่สำเร็จล่าสุด
async function translateWithLingvaMirror(
  text: string,
  target: string,
  source = 'th'
): Promise<{ translatedText: string; mirror: string }> {
  const order = [
    ...LINGVA_MIRRORS.slice(lastWorkingMirrorIdx),
    ...LINGVA_MIRRORS.slice(0, lastWorkingMirrorIdx),
  ]
  for (let i = 0; i < order.length; i++) {
    const mirror = order[i]
    try {
      const url = `${mirror.replace(/\/$/, '')}/api/v1/${source}/${toLingvaTarget(target)}/${encodeURIComponent(text)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const resp = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!resp.ok) throw new Error(`Lingva error ${resp.status}`)
      const data = await resp.json()
      if (data.translation) {
        lastWorkingMirrorIdx = LINGVA_MIRRORS.indexOf(mirror)
        return { translatedText: data.translation as string, mirror }
      }
      throw new Error('No translation returned')
    } catch (err) {
      console.warn(`Mirror ${mirror} failed: ${err}`)
    }
  }
  return { translatedText: text, mirror: 'fallback' }
}

// แปลเป็นชุดเล็กๆ ป้องกัน rate-limit
async function translateBatch(
  texts: string[],
  target: string,
  batchSize = 3,
  delayMs = 300,
): Promise<string[]> {
  const results: string[] = new Array(texts.length)
  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize)
    const chunkResults = await Promise.all(
      chunk.map(async (text) => {
        try {
          const { translatedText } = await translateText(text, target)
          return translatedText
        } catch { return text }
      })
    )
    chunkResults.forEach((r, j) => { results[i + j] = r })
    // delay ระหว่าง batch เพื่อไม่ให้ถูก rate-limit
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  return results
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TranslateRequest

    // รองรับทั้ง batch (texts[]) และ single (text)
    if (body.texts && Array.isArray(body.texts) && body.targets?.length === 1) {
      // Batch translation: หลายข้อความ ภาษาเดียว + deduplicate
      const target = body.targets[0]
      // Deduplicate: แปลข้อความซ้ำแค่ครั้งเดียว
      const uniqueMap = new Map<string, number[]>() // text -> [indices]
      body.texts.forEach((text, index) => {
        const existing = uniqueMap.get(text)
        if (existing) { existing.push(index) } else { uniqueMap.set(text, [index]) }
      })
      const uniqueEntries = Array.from(uniqueMap.entries())
      // แปลเป็นชุดเล็กๆ ป้องกัน rate-limit จาก Lingva
      const uniqueTextsArr = uniqueEntries.map(([text]) => text)
      const uniqueResults = await translateBatch(uniqueTextsArr, target, 3, 300)
      // กระจายผลลัพธ์กลับทุก index ที่ข้อความเดียวกัน
      const batchResults: BatchTranslateResult[] = []
      uniqueEntries.forEach(([, indices], i) => {
        indices.forEach(idx => {
          batchResults.push({ index: idx, translatedText: uniqueResults[i] })
        })
      })
      return NextResponse.json({ from: 'th', target, batchResults })
    }

    // Single translation: ข้อความเดียว หลายภาษา
    if (!body?.text || !Array.isArray(body.targets)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const text = body.text as string
    const results = await Promise.all(
      body.targets.map(async (target): Promise<TranslateResult> => {
        try {
          const { translatedText, mirror } = await translateText(text, target)
          return { target, translatedText, mirror }
        } catch (err: any) {
          return { target, translatedText: text, mirror: '' }
        }
      })
    )

    return NextResponse.json({ from: 'th', results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
