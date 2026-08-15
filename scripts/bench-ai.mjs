#!/usr/bin/env node
/**
 * เฟส 0 ขั้นที่ 3-4 — วัดผลจริงว่าเครื่องนี้รันผู้ช่วย AI ไหวแค่ไหน
 *
 * เขียนเป็น .mjs ไม่ใช่ .ts โดยตั้งใจ: ต้องเอาไปรันบนเครื่อง POS ที่อาจไม่มี
 * ts-node/toolchain ครบ — ไฟล์นี้ใช้แค่ Node 18+ ล้วนๆ ไม่มี dependency
 *
 * รันบนเครื่อง POS เท่านั้น (รันบนเครื่อง dev ตัวเลขจะสวยเกินจริง ~10 เท่า)
 *
 *   node scripts/bench-ai.mjs
 *   node scripts/bench-ai.mjs --model qwen3:0.6b
 *   node scripts/bench-ai.mjs --quick              # ข้าม sweep ใช้คำถาม 10 ข้อ
 *   node scripts/bench-ai.mjs --only t0,t2,t3
 *   node scripts/bench-ai.mjs --host http://127.0.0.1:11434
 *
 * ผลลัพธ์: scratch/ai-bench-result.json + สรุปบนหน้าจอ
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SCRATCH = path.join(ROOT, 'scratch')
const QUESTIONS_PATH = path.join(SCRATCH, 'ai-bench-questions.json')
const RESULT_PATH = path.join(SCRATCH, 'ai-bench-result.json')
const BASELINE_PATH = path.join(SCRATCH, 'ai-machine-baseline.json')

// ---------------------------------------------------------------------------
// อาร์กิวเมนต์
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
const getArg = (name, dflt) => {
    const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
    if (!hit) return dflt
    if (hit.includes('=')) return hit.split('=').slice(1).join('=')
    const idx = argv.indexOf(hit)
    const next = argv[idx + 1]
    return next && !next.startsWith('--') ? next : true
}
const HOST = String(getArg('host', 'http://127.0.0.1:11434')).replace(/\/$/, '')
const MODEL = String(getArg('model', 'qwen2.5:1.5b-instruct-q4_K_M'))
const QUICK = Boolean(getArg('quick', false))
const ONLY = getArg('only', null)
const onlySet = ONLY ? new Set(String(ONLY).split(',').map((s) => s.trim().toLowerCase())) : null
const shouldRun = (id) => (onlySet ? onlySet.has(id) : true)

// ---------------------------------------------------------------------------
// เครื่องมือช่วย
// ---------------------------------------------------------------------------
const C = {
    reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m',
}
const head = (t) => {
    console.log('')
    console.log(C.gray + '='.repeat(72) + C.reset)
    console.log(`  ${C.cyan}${C.bold}${t}${C.reset}`)
    console.log(C.gray + '='.repeat(72) + C.reset)
}
const row = (label, value, color = '') =>
    console.log(`  ${C.gray}${String(label).padEnd(30)}${C.reset}${color}${value}${C.reset}`)
const ok = (b) => (b ? `${C.green}ผ่าน${C.reset}` : `${C.red}ไม่ผ่าน${C.reset}`)
const nsToMs = (ns) => (Number(ns || 0) / 1e6)
const round = (n, d = 1) => Math.round(Number(n) * 10 ** d) / 10 ** d
const pct = (a, b) => (b === 0 ? 0 : round((a * 100) / b))

function percentile(arr, p) {
    if (!arr.length) return 0
    const s = [...arr].sort((a, b) => a - b)
    const i = Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)
    return s[Math.max(0, i)]
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
}

/** อ่าน JSON โดยตัด BOM ทิ้ง — PowerShell เขียนไฟล์พร้อม BOM เสมอ */
function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
}

async function http(pathname, body, timeoutMs = 300000) {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), timeoutMs)
    try {
        const res = await fetch(`${HOST}${pathname}`, {
            method: body ? 'POST' : 'GET',
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
            signal: ac.signal,
        })
        const text = await res.text()
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`)
        return text ? JSON.parse(text) : {}
    } finally {
        clearTimeout(timer)
    }
}

/** อ่าน RAM ของ ollama + RAM ว่างของระบบ (Windows) */
function sampleRam() {
    return new Promise((resolve) => {
        if (process.platform !== 'win32') {
            resolve({ ollamaMB: null, freeMB: round(os.freemem() / 1024 / 1024, 0) })
            return
        }
        const ps =
            '$o=(Get-Process ollama* -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum;' +
            '$f=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory;' +
            'Write-Output "$([math]::Round($o/1MB)),$([math]::Round($f/1KB))"'
        exec(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { timeout: 15000 }, (err, stdout) => {
            if (err) return resolve({ ollamaMB: null, freeMB: null })
            const [o, f] = String(stdout).trim().split(',')
            resolve({ ollamaMB: Number(o) || 0, freeMB: Number(f) || null })
        })
    })
}

const ramPeak = { ollamaMB: 0, freeMinMB: Infinity }
async function trackRam(tag) {
    const s = await sampleRam()
    if (s.ollamaMB != null && s.ollamaMB > ramPeak.ollamaMB) ramPeak.ollamaMB = s.ollamaMB
    if (s.freeMB != null && s.freeMB < ramPeak.freeMinMB) ramPeak.freeMinMB = s.freeMB
    return { tag, ...s }
}

// ---------------------------------------------------------------------------
// prompt — ต้อง "คงที่ทุกครั้ง" ไม่งั้น KV cache ใช้ซ้ำไม่ได้
// เปลี่ยนแค่วันละครั้ง (วันที่วันนี้) ซึ่งยอมรับได้
// ---------------------------------------------------------------------------
const TOOLS = [
    'sales_summary', 'top_products', 'stock_balance', 'low_stock', 'expiring_lots',
    'dead_stock', 'purchase_by_vendor', 'employee_sales', 'product_lookup', 'unknown',
]

const TODAY = new Date().toISOString().slice(0, 10)

const SYSTEM_PROMPT = `คุณคือตัวแปลงคำถามเป็น JSON ของระบบ POS ร้านขายยา ตอบเป็น JSON เท่านั้น ห้ามอธิบาย
tool:
sales_summary=ยอดขายรวม/สรุปยอด
top_products=สินค้าขายดี/กำไรดี
stock_balance=ยอดคงเหลือ/มูลค่าสต็อก
low_stock=ใกล้หมด/ต้องสั่งซื้อ
expiring_lots=ใกล้หมดอายุ
dead_stock=สต็อกจม/ไม่ขยับ
purchase_by_vendor=ยอดซื้อจากซัพพลายเออร์
employee_sales=ยอดขายรายพนักงาน
product_lookup=ค้นหาสินค้า/บาร์โค้ด
unknown=ไม่เข้าพวก
field: tool, from(YYYY-MM-DD), to(YYYY-MM-DD), limit, sort(amount|qty|profit), keyword, days
วันนี้ ${TODAY} · ปี พ.ศ. ให้ลบ 543 เป็น ค.ศ. · ไม่ระบุช่วงเวลา = เดือนปัจจุบัน`

const SCHEMA = {
    type: 'object',
    properties: {
        tool: { type: 'string', enum: TOOLS },
        from: { type: 'string' },
        to: { type: 'string' },
        limit: { type: 'integer' },
        sort: { type: 'string', enum: ['amount', 'qty', 'profit'] },
        keyword: { type: 'string' },
        days: { type: 'integer' },
    },
    required: ['tool'],
}

async function askModel(question, opts = {}) {
    const t0 = Date.now()
    const res = await http('/api/generate', {
        model: opts.model || MODEL,
        system: SYSTEM_PROMPT,
        prompt: question,
        format: opts.plainJson ? 'json' : SCHEMA,
        stream: false,
        keep_alive: opts.keepAlive ?? '10m',
        options: {
            temperature: 0,
            num_predict: 80,
            num_ctx: opts.numCtx ?? 2048,
            ...(opts.numThread ? { num_thread: opts.numThread } : {}),
        },
    })
    const wallMs = Date.now() - t0

    let parsed = null
    let parseError = null
    try {
        parsed = JSON.parse(res.response)
    } catch (e) {
        parseError = String(e.message || e)
    }

    return {
        wallMs,
        raw: res.response,
        parsed,
        parseError,
        loadMs: nsToMs(res.load_duration),
        promptTokens: res.prompt_eval_count ?? 0,
        promptMs: nsToMs(res.prompt_eval_duration),
        genTokens: res.eval_count ?? 0,
        genMs: nsToMs(res.eval_duration),
        totalMs: nsToMs(res.total_duration),
        prefillTps: res.prompt_eval_duration ? round((res.prompt_eval_count * 1e9) / res.prompt_eval_duration, 1) : null,
        genTps: res.eval_duration ? round((res.eval_count * 1e9) / res.eval_duration, 1) : null,
    }
}

// ---------------------------------------------------------------------------
// ผลลัพธ์รวม
// ---------------------------------------------------------------------------
const result = {
    schemaVersion: 1,
    startedAt: new Date().toISOString(),
    host: HOST,
    model: MODEL,
    quick: QUICK,
    node: process.version,
    machine: null,
    tests: {},
    verdict: {},
}

if (fs.existsSync(BASELINE_PATH)) {
    try {
        const base = readJson(BASELINE_PATH)
        const a = base.after || base.before || {}
        result.machine = {
            cpuName: a.cpuName, cores: a.cores, threads: a.threads,
            ramTotalMB: a.ramTotalMB, simdAvx2: a.simdAvx2,
            ollamaCpuVariant: a.ollamaCpuVariant,
            clockLoadedMhz: base.clockLoadedAfterMhz ?? base.clockLoadedBeforeMhz,
            powerApplied: base.applied?.powerPlan ?? false,
        }
    } catch { /* ไม่มี baseline ก็ยังวัดต่อได้ */ }
}

// ===========================================================================
// T0 — ตรวจความพร้อม
// ===========================================================================
async function t0_health() {
    head('T0 · ตรวจความพร้อมของ Ollama')
    const out = { pass: false }

    try {
        const ver = await http('/api/version', null, 10000)
        out.version = ver.version
        row('Ollama version', ver.version)
        const [maj, min] = String(ver.version).split('.').map((n) => parseInt(n, 10) || 0)
        out.supportsSchema = maj > 0 || min >= 5
        if (!out.supportsSchema) {
            row('structured output', 'ไม่รองรับ JSON schema (ต้อง >= 0.5) จะถอยไปใช้ format:"json"', C.yellow)
        }
    } catch (e) {
        row('เชื่อมต่อ', `ล้มเหลว: ${e.message}`, C.red)
        out.error = String(e.message || e)
        return out
    }

    const tags = await http('/api/tags', null, 20000)
    out.models = (tags.models || []).map((m) => ({ name: m.name, sizeMB: round(m.size / 1024 / 1024, 0) }))
    row('โมเดลที่มีในเครื่อง', out.models.length ? out.models.map((m) => m.name).join(', ') : '(ไม่มีเลย)')

    out.modelPresent = out.models.some((m) => m.name === MODEL || m.name.startsWith(MODEL.split(':')[0]))
    if (!out.modelPresent) {
        row('โมเดลเป้าหมาย', `ไม่พบ ${MODEL} — สั่ง: ollama pull ${MODEL}`, C.red)
        return out
    }
    row('โมเดลเป้าหมาย', MODEL, C.green)

    const ram = await trackRam('t0')
    row('RAM ว่างตอนเริ่ม', `${ram.freeMB} MB`, ram.freeMB < 1800 ? C.yellow : C.green)
    out.freeRamStartMB = ram.freeMB
    out.pass = true
    return out
}

// ===========================================================================
// T1 — เวลาโหลดโมเดลจากดิสก์ (ผู้ใช้รอตอนถามครั้งแรกของวัน)
// ===========================================================================
async function t1_coldLoad() {
    head('T1 · เวลาโหลดโมเดลเข้า RAM (cold load)')
    const out = {}

    row('ปลดโมเดลออกก่อน...', '', C.gray)
    await askModel('ping', { keepAlive: 0, numCtx: 512 }).catch(() => { })
    await sleep(4000)

    const before = await trackRam('t1-before')
    const r = await askModel('ยอดขายวันนี้', { keepAlive: '10m' })
    const after = await trackRam('t1-after')

    out.loadMs = round(r.loadMs, 0)
    out.firstAnswerMs = round(r.wallMs, 0)
    out.ollamaRamBeforeMB = before.ollamaMB
    out.ollamaRamAfterMB = after.ollamaMB
    out.modelRamMB = after.ollamaMB != null && before.ollamaMB != null ? after.ollamaMB - before.ollamaMB : null

    row('เวลาโหลดโมเดล', `${out.loadMs} ms`, out.loadMs > 15000 ? C.yellow : C.green)
    row('คำถามแรกใช้เวลารวม', `${out.firstAnswerMs} ms`)
    row('RAM ที่โมเดลกิน', out.modelRamMB != null ? `~${out.modelRamMB} MB` : 'วัดไม่ได้')
    row('RAM ว่างหลังโหลด', `${after.freeMB} MB`, after.freeMB < 1200 ? C.red : C.green)
    return out
}

// ===========================================================================
// T2 — KV cache reuse  ***ข้อที่ชี้ขาดทั้งแผน***
// ถ้า cache ทำงาน prompt_eval_count ของคำถามที่ 2 ต้องลดฮวบ
// ===========================================================================
async function t2_kvCache() {
    head('T2 · KV cache reuse (ข้อชี้ขาด)')
    const out = {}

    const a = await askModel('ยอดขายเดือนนี้เท่าไหร่')
    await sleep(500)
    const b = await askModel('สินค้าขายดี 10 อันดับ')
    await sleep(500)
    const c = await askModel('ของใกล้หมดอายุมีอะไรบ้าง')

    out.firstPromptTokens = a.promptTokens
    out.secondPromptTokens = b.promptTokens
    out.thirdPromptTokens = c.promptTokens
    out.reductionPct = a.promptTokens ? pct(a.promptTokens - b.promptTokens, a.promptTokens) : 0
    out.prefillTps = a.prefillTps
    out.savedMsPerQuery = round(a.promptMs - b.promptMs, 0)
    out.pass = out.reductionPct >= 80

    row('prefill ครั้งที่ 1', `${a.promptTokens} tokens · ${round(a.promptMs, 0)} ms · ${a.prefillTps} tok/s`)
    row('prefill ครั้งที่ 2', `${b.promptTokens} tokens · ${round(b.promptMs, 0)} ms`)
    row('prefill ครั้งที่ 3', `${c.promptTokens} tokens · ${round(c.promptMs, 0)} ms`)
    row('ลดลง', `${out.reductionPct} %`, out.pass ? C.green : C.red)
    row('ประหยัดได้ต่อคำถาม', `${out.savedMsPerQuery} ms`)
    row('เกณฑ์ >= 80%', ok(out.pass))
    if (!out.pass) {
        console.log(`  ${C.yellow}>> cache ไม่ทำงาน: ทุกคำถามจะบวกเวลา prefill เต็มจำนวน`)
        console.log(`     ตรวจว่า OLLAMA_NUM_PARALLEL=1 และไม่มีโมเดลอื่นสลับเข้าออก${C.reset}`)
    }
    return out
}

// ===========================================================================
// T3 — ความแม่นยำ + เวลาตอบ จากคำถามจริง
// ===========================================================================
function loadQuestions() {
    if (!fs.existsSync(QUESTIONS_PATH)) {
        console.log(`${C.red}ไม่พบ ${QUESTIONS_PATH}${C.reset}`)
        process.exit(1)
    }
    const raw = readJson(QUESTIONS_PATH)
    const qs = raw.questions || []
    return QUICK ? qs.filter((_, i) => i % 3 === 0) : qs
}

async function t3_accuracy() {
    head('T3 · ความแม่นยำ + เวลาตอบ (คำถามจริง)')
    const questions = loadQuestions()
    const out = { total: questions.length, rows: [] }

    let jsonOk = 0, toolOk = 0, dateAutoTotal = 0, dateAutoOk = 0
    const latencies = []
    const genTpsList = []

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        let r
        try {
            r = await askModel(q.q)
        } catch (e) {
            out.rows.push({ q: q.q, error: String(e.message || e) })
            console.log(`  ${C.red}✗${C.reset} ${q.q}  ${C.red}(${e.message})${C.reset}`)
            continue
        }

        const parsedOk = !!r.parsed
        if (parsedOk) jsonOk++
        const gotTool = r.parsed?.tool ?? null
        const tOk = gotTool === q.tool
        if (tOk) toolOk++

        // ตรวจวันที่อัตโนมัติเฉพาะคำถามที่วันที่ตายตัว
        let dOk = null
        if (q.dateKind === 'absolute' && q.expect) {
            dateAutoTotal++
            dOk = (!q.expect.from || r.parsed?.from === q.expect.from) &&
                (!q.expect.to || r.parsed?.to === q.expect.to)
            if (dOk) dateAutoOk++
        }

        latencies.push(r.wallMs)
        if (r.genTps) genTpsList.push(r.genTps)

        out.rows.push({
            q: q.q, expectTool: q.tool, gotTool, toolOk: tOk,
            dateKind: q.dateKind, expect: q.expect || null, got: r.parsed,
            dateAutoOk: dOk, parsedOk, raw: parsedOk ? undefined : r.raw,
            wallMs: round(r.wallMs, 0), genTokens: r.genTokens, genTps: r.genTps,
            hard: !!q.hard,
        })

        const mark = tOk ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`
        const dateMark = dOk === null ? '' : dOk ? ` ${C.green}[วันที่ ✓]${C.reset}` : ` ${C.red}[วันที่ ✗]${C.reset}`
        console.log(`  ${mark} ${String(round(r.wallMs / 1000, 1)).padStart(5)}s  ${q.q}`)
        if (!tOk) console.log(`      ${C.gray}คาดว่า ${q.tool} · ได้ ${gotTool ?? '(parse ไม่ได้)'}${C.reset}`)
        else if (dateMark) console.log(`      ${C.gray}${JSON.stringify(r.parsed)}${dateMark}${C.reset}`)

        if (i % 5 === 0) await trackRam(`t3-${i}`)
    }

    out.jsonValidPct = pct(jsonOk, out.total)
    out.toolAccuracyPct = pct(toolOk, out.total)
    out.dateAutoPct = dateAutoTotal ? pct(dateAutoOk, dateAutoTotal) : null
    out.p50Ms = round(percentile(latencies, 50), 0)
    out.p95Ms = round(percentile(latencies, 95), 0)
    out.avgGenTps = genTpsList.length ? round(genTpsList.reduce((a, b) => a + b, 0) / genTpsList.length, 1) : null
    out.needsManualReview = out.rows.filter((r) => r.dateKind === 'relative' && r.toolOk).length

    console.log('')
    row('JSON parse ได้', `${out.jsonValidPct} %  (เกณฑ์ >= 95)`, out.jsonValidPct >= 95 ? C.green : C.red)
    row('เลือก tool ถูก', `${out.toolAccuracyPct} %  (เกณฑ์ >= 85)`, out.toolAccuracyPct >= 85 ? C.green : C.red)
    row('วันที่ตายตัวถูก', out.dateAutoPct === null ? 'ไม่มีข้อทดสอบ' : `${out.dateAutoPct} %`)
    row('เวลาตอบ p50', `${round(out.p50Ms / 1000, 1)} s`)
    row('เวลาตอบ p95', `${round(out.p95Ms / 1000, 1)} s  (เกณฑ์ <= 20)`, out.p95Ms <= 20000 ? C.green : C.red)
    row('ความเร็วสร้าง token', `${out.avgGenTps} tok/s  (เกณฑ์ >= 4)`, out.avgGenTps >= 4 ? C.green : C.red)
    row('ต้องดูวันที่ด้วยตาเอง', `${out.needsManualReview} ข้อ (ดูในไฟล์ผล)`, C.yellow)
    return out
}

// ===========================================================================
// T4 — sweep num_ctx / num_thread หาค่าที่ดีที่สุด
// ===========================================================================
async function t4_sweep() {
    head('T4 · หาค่า num_ctx / num_thread ที่เหมาะที่สุด')
    const probes = loadQuestions().slice(0, 5).map((q) => q.q)
    const out = { numCtx: [], numThread: [] }

    const runSet = async (opts) => {
        const lat = [], tps = []
        for (const q of probes) {
            try {
                const r = await askModel(q, opts)
                lat.push(r.wallMs)
                if (r.genTps) tps.push(r.genTps)
            } catch { /* ข้ามข้อที่พัง */ }
            await sleep(300)
        }
        await trackRam('t4')
        return {
            p50Ms: round(percentile(lat, 50), 0),
            avgGenTps: tps.length ? round(tps.reduce((a, b) => a + b, 0) / tps.length, 1) : null,
            failed: probes.length - lat.length,
        }
    }

    console.log(`  ${C.gray}num_ctx (context เล็ก = กิน RAM น้อย)${C.reset}`)
    for (const ctx of [1024, 2048, 4096]) {
        const r = await runSet({ numCtx: ctx })
        out.numCtx.push({ numCtx: ctx, ...r })
        row(`  num_ctx=${ctx}`, `p50 ${round(r.p50Ms / 1000, 1)}s · ${r.avgGenTps} tok/s${r.failed ? ` · พัง ${r.failed}` : ''}`)
    }

    console.log('')
    console.log(`  ${C.gray}num_thread (มากไป = POS กระตุก)${C.reset}`)
    const maxThreads = os.cpus().length
    for (const th of [2, 3, 4].filter((t) => t <= maxThreads)) {
        const r = await runSet({ numThread: th })
        out.numThread.push({ numThread: th, ...r })
        row(`  num_thread=${th}`, `p50 ${round(r.p50Ms / 1000, 1)}s · ${r.avgGenTps} tok/s`)
    }

    const bestCtx = out.numCtx.filter((x) => !x.failed).sort((a, b) => a.numCtx - b.numCtx)[0]
    const bestTh = [...out.numThread].sort((a, b) => (b.avgGenTps || 0) - (a.avgGenTps || 0))[0]
    out.recommend = {
        numCtx: bestCtx?.numCtx ?? 2048,
        numThread: bestTh?.numThread ?? 3,
        note: 'num_thread ที่เร็วที่สุดอาจทำ POS กระตุก — ยืนยันกับ T6 ก่อนใช้จริง',
    }
    console.log('')
    row('แนะนำ', `num_ctx=${out.recommend.numCtx}, num_thread=${out.recommend.numThread}`, C.green)
    return out
}

// ===========================================================================
// T5 — embedding classifier (Tier 1) ผ่าน onnxruntime-node
// ความเสี่ยงใหญ่: เป็น native module ต้อง build ผ่านบน Electron ด้วย
// ===========================================================================
async function t5_embedding() {
    head('T5 · onnxruntime-node + MiniLM (Tier 1)')
    const out = { moduleLoaded: false, modelFound: false }

    let ort
    try {
        ort = await import('onnxruntime-node')
        out.moduleLoaded = true
        out.ortVersion = ort.default?.env?.versions?.common ?? 'unknown'
        row('โหลดโมดูลได้', `ใช่ (v${out.ortVersion})`, C.green)
    } catch (e) {
        out.error = String(e.message || e)
        row('โหลดโมดูลได้', 'ไม่ได้', C.red)
        console.log(`  ${C.gray}${out.error.slice(0, 200)}${C.reset}`)
        console.log(`  ${C.yellow}>> ติดตั้งก่อน: npm i -D onnxruntime-node   แล้วรันซ้ำ`)
        console.log(`     ถ้าติดตั้งไม่ผ่าน = Tier 1 ต้องย้ายไปใช้ Ollama embedding แทน (ช้ากว่า ~3 เท่า)${C.reset}`)
        return out
    }

    const modelPath = path.join(SCRATCH, 'models', 'minilm.onnx')
    if (!fs.existsSync(modelPath)) {
        row('ไฟล์โมเดล', 'ไม่พบ', C.yellow)
        console.log(`  ${C.gray}วางไฟล์ .onnx (MiniLM multilingual int8) ไว้ที่:`)
        console.log(`    ${modelPath}`)
        console.log(`  แล้วรัน: node scripts/bench-ai.mjs --only t5${C.reset}`)
        console.log(`  ${C.green}>> แต่ข้อที่สำคัญที่สุดผ่านแล้ว: โมดูล native โหลดได้บนเครื่องนี้${C.reset}`)
        return out
    }

    out.modelFound = true
    const InferenceSession = ort.default?.InferenceSession ?? ort.InferenceSession
    const Tensor = ort.default?.Tensor ?? ort.Tensor

    const tLoad = Date.now()
    const session = await InferenceSession.create(modelPath, {
        intraOpNumThreads: 2,
        executionMode: 'sequential',
        graphOptimizationLevel: 'all',
    })
    out.sessionLoadMs = Date.now() - tLoad
    row('เวลาโหลด session', `${out.sessionLoadMs} ms`)
    row('input ที่โมเดลต้องการ', session.inputNames.join(', '), C.gray)

    // ยิง dummy tensor ความยาว 32 tokens วัดความเร็วล้วนๆ ของ forward pass
    const SEQ = 32
    const ids = BigInt64Array.from({ length: SEQ }, (_, i) => BigInt(i === 0 ? 101 : i === SEQ - 1 ? 102 : 2000 + i))
    const mask = BigInt64Array.from({ length: SEQ }, () => 1n)
    const feeds = {}
    for (const name of session.inputNames) {
        if (/mask/i.test(name)) feeds[name] = new Tensor('int64', mask, [1, SEQ])
        else if (/token_type|segment/i.test(name)) feeds[name] = new Tensor('int64', new BigInt64Array(SEQ), [1, SEQ])
        else feeds[name] = new Tensor('int64', ids, [1, SEQ])
    }

    await session.run(feeds) // warm-up
    const times = []
    for (let i = 0; i < 15; i++) {
        const t = Date.now()
        await session.run(feeds)
        times.push(Date.now() - t)
    }
    out.embedP50Ms = round(percentile(times, 50), 0)
    out.embedP95Ms = round(percentile(times, 95), 0)
    out.pass = out.embedP50Ms <= 300

    row('embed 1 ประโยค p50', `${out.embedP50Ms} ms  (เกณฑ์ <= 300)`, out.pass ? C.green : C.red)
    row('embed 1 ประโยค p95', `${out.embedP95Ms} ms`)
    console.log(`  ${C.gray}หมายเหตุ: ยังไม่ได้ทดสอบความแม่นยำ intent — ทำในเฟส 3 หลังมีชุดตัวอย่าง 200 ประโยค${C.reset}`)
    return out
}

// ===========================================================================
// T6 — AI ทำงานแล้ว POS กระตุกไหม
// ===========================================================================
async function t6_posImpact() {
    head('T6 · ผลกระทบต่อ POS ขณะ AI ทำงาน')
    const out = {}

    const probeUrl = String(getArg('pos-url', 'http://localhost:3000/api/health'))
    const measure = async (label, n = 12) => {
        const lat = []
        for (let i = 0; i < n; i++) {
            const t = Date.now()
            try {
                const ac = new AbortController()
                const timer = setTimeout(() => ac.abort(), 10000)
                await fetch(probeUrl, { signal: ac.signal })
                clearTimeout(timer)
                lat.push(Date.now() - t)
            } catch { lat.push(-1) }
            await sleep(200)
        }
        const good = lat.filter((x) => x > 0)
        return { label, p50Ms: round(percentile(good, 50), 0), p95Ms: round(percentile(good, 95), 0), failed: lat.length - good.length }
    }

    const idle = await measure('idle')
    if (idle.failed === idle.p50Ms && idle.p50Ms === 0) {
        row('แอป POS', `เรียก ${probeUrl} ไม่ได้ — ข้ามการทดสอบนี้`, C.yellow)
        out.skipped = true
        out.reason = `เข้าถึง ${probeUrl} ไม่ได้ (เปิดแอปก่อน หรือส่ง --pos-url)`
        return out
    }
    row('ตอนไม่มี AI · p50', `${idle.p50Ms} ms`)

    // ยิงคำถามหนักค้างไว้ แล้ววัด POS ระหว่างนั้น
    const busy = askModel('ปีนี้ขายอะไรได้กำไรดีที่สุด 20 ตัว แยกตามเดือนด้วย').catch(() => null)
    await sleep(600)
    const underLoad = await measure('under-load')
    await busy

    out.idle = idle
    out.underLoad = underLoad
    out.deltaP50Ms = underLoad.p50Ms - idle.p50Ms
    out.pass = out.deltaP50Ms <= 200

    row('ตอน AI ทำงาน · p50', `${underLoad.p50Ms} ms`)
    row('ช้าลง', `${out.deltaP50Ms} ms  (เกณฑ์ <= 200)`, out.pass ? C.green : C.red)
    if (!out.pass) {
        console.log(`  ${C.yellow}>> ลด num_thread หรือตั้ง priority ของ ollama เป็น Below Normal:`)
        console.log(`     Get-Process ollama | ForEach-Object { $_.PriorityClass = 'BelowNormal' }${C.reset}`)
    }
    return out
}

// ===========================================================================
// สรุป + ตัดสิน Go / No-Go
// ===========================================================================
function verdict() {
    head('สรุปผล — ตัดสิน Go / No-Go')

    const t2 = result.tests.t2 || {}
    const t3 = result.tests.t3 || {}
    const t5 = result.tests.t5 || {}
    const t6 = result.tests.t6 || {}

    const checks = [
        { key: 'kvCache', label: 'KV cache reuse >= 80%', got: `${t2.reductionPct ?? '-'} %`, pass: t2.pass === true, fallback: 'ตัด Tier 2 ทิ้ง เหลือ Tier 0+1' },
        { key: 'genSpeed', label: 'ความเร็วสร้าง >= 4 tok/s', got: `${t3.avgGenTps ?? '-'} tok/s`, pass: (t3.avgGenTps ?? 0) >= 4, fallback: 'ลดไป qwen3:0.6b' },
        { key: 'latency', label: 'p95 <= 20 วินาที', got: `${round((t3.p95Ms ?? 0) / 1000, 1)} s`, pass: (t3.p95Ms ?? 1e9) <= 20000, fallback: 'ลดโมเดล หรือตัด Tier 2' },
        { key: 'jsonValid', label: 'JSON parse ได้ >= 95%', got: `${t3.jsonValidPct ?? '-'} %`, pass: (t3.jsonValidPct ?? 0) >= 95, fallback: 'ตัด Tier 2 — Tier 1 คุมได้แน่นอนกว่า' },
        { key: 'toolAcc', label: 'เลือก tool ถูก >= 85%', got: `${t3.toolAccuracyPct ?? '-'} %`, pass: (t3.toolAccuracyPct ?? 0) >= 85, fallback: 'ขยายกฎ Tier 0 ให้ครอบคลุมกว่าเดิม' },
        { key: 'onnx', label: 'onnxruntime-node โหลดได้', got: t5.moduleLoaded ? 'ได้' : 'ไม่ได้', pass: t5.moduleLoaded === true, fallback: 'ย้าย embedding ไปฝั่ง Ollama' },
        { key: 'ram', label: 'RAM ว่างต่ำสุด >= 800 MB', got: `${ramPeak.freeMinMB === Infinity ? '-' : ramPeak.freeMinMB} MB`, pass: ramPeak.freeMinMB >= 800, fallback: 'ใช้โมเดลเล็กลง / keep_alive สั้นลง' },
        { key: 'posImpact', label: 'POS ช้าลง <= 200 ms', got: t6.skipped ? 'ข้าม' : `${t6.deltaP50Ms ?? '-'} ms`, pass: t6.skipped ? null : t6.pass === true, fallback: 'ลด num_thread + priority ต่ำลง' },
    ]

    console.log('')
    for (const c of checks) {
        const mark = c.pass === null ? `${C.yellow}—   ${C.reset}` : c.pass ? `${C.green}ผ่าน${C.reset}` : `${C.red}ตก ${C.reset}`
        console.log(`  ${mark}  ${String(c.label).padEnd(30)} ${C.gray}${c.got}${C.reset}`)
        if (c.pass === false) console.log(`         ${C.yellow}-> ${c.fallback}${C.reset}`)
    }

    const core = checks.filter((c) => ['kvCache', 'genSpeed', 'latency', 'jsonValid', 'toolAcc'].includes(c.key))
    const corePassed = core.filter((c) => c.pass).length
    let scenario, plan
    if (corePassed === core.length) {
        scenario = 'GREEN'
        plan = 'เดินเฟส 1-6 ครบ (Tier 0 + 1 + 2) ~13 วัน'
    } else if (corePassed >= 2 && t5.moduleLoaded) {
        scenario = 'YELLOW'
        plan = 'ทำ Tier 0 + Tier 1 เท่านั้น ~8 วัน (ได้ ~85% ของคุณค่า และเร็วกว่าเพราะไม่มี LLM)'
    } else {
        scenario = 'RED'
        plan = 'ทำ Tier 0 อย่างเดียว ~4 วัน (ปุ่มลัด + กฎภาษาไทย + template ตอบใน 1 วินาที)'
    }

    console.log('')
    const col = scenario === 'GREEN' ? C.green : scenario === 'YELLOW' ? C.yellow : C.red
    row('ผลรวม', `${col}${scenario}${C.reset}  (ผ่านเกณฑ์หลัก ${corePassed}/${core.length})`)
    row('แผนที่ควรเดิน', plan, col)

    result.verdict = { scenario, plan, corePassed, coreTotal: core.length, checks }
    result.ramPeak = { ollamaMB: ramPeak.ollamaMB, freeMinMB: ramPeak.freeMinMB === Infinity ? null : ramPeak.freeMinMB }
}

// ===========================================================================
// main
// ===========================================================================
async function main() {
    const [major] = process.versions.node.split('.').map(Number)
    if (major < 18) {
        console.log(`${C.red}ต้องใช้ Node 18 ขึ้นไป (ตอนนี้ ${process.version})${C.reset}`)
        process.exit(1)
    }

    console.log('')
    console.log(`${C.bold}bench-ai · เฟส 0 ของฟีเจอร์ผู้ช่วย AI${C.reset}`)
    console.log(`${C.gray}host=${HOST}  model=${MODEL}${QUICK ? '  (quick)' : ''}${C.reset}`)
    if (result.machine) {
        console.log(`${C.gray}เครื่อง: ${result.machine.cpuName} · ${result.machine.cores}C/${result.machine.threads}T · ` +
            `RAM ${result.machine.ramTotalMB}MB · AVX2=${result.machine.simdAvx2} · ollama=${result.machine.ollamaCpuVariant ?? '?'}${C.reset}`)
    } else {
        console.log(`${C.yellow}ยังไม่มี scratch/ai-machine-baseline.json — รัน scripts/setup-ai-machine.ps1 ก่อนจะได้บริบทครบกว่านี้${C.reset}`)
    }

    if (shouldRun('t0')) {
        result.tests.t0 = await t0_health()
        if (!result.tests.t0.pass) {
            console.log(`\n${C.red}หยุดที่ T0 — แก้ปัญหาข้างบนก่อนแล้วรันใหม่${C.reset}\n`)
            fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2), 'utf8')
            process.exit(1)
        }
    }

    if (shouldRun('t1')) result.tests.t1 = await t1_coldLoad()
    if (shouldRun('t2')) result.tests.t2 = await t2_kvCache()
    if (shouldRun('t3')) result.tests.t3 = await t3_accuracy()
    if (shouldRun('t4') && !QUICK) result.tests.t4 = await t4_sweep()
    if (shouldRun('t5')) result.tests.t5 = await t5_embedding()
    if (shouldRun('t6')) result.tests.t6 = await t6_posImpact()

    result.finishedAt = new Date().toISOString()
    if (!onlySet) verdict()

    fs.mkdirSync(SCRATCH, { recursive: true })
    fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2), 'utf8')
    console.log('')
    row('บันทึกผลไว้ที่', RESULT_PATH, C.green)
    console.log(`  ${C.gray}เอาตัวเลขไปกรอกใน scratch/ai-bench-report.md แล้วส่งกลับมาให้ผมอ่าน${C.reset}`)
    console.log('')
}

main().catch((e) => {
    console.error(`\n${C.red}พัง: ${e.stack || e}${C.reset}\n`)
    try {
        result.crashError = String(e.stack || e)
        fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2), 'utf8')
    } catch { }
    process.exit(1)
})
