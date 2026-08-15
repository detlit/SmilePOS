/**
 * Convert customer.birthday from Buddhist Era (พ.ศ.) to Common Era (ค.ศ.)
 *
 * Background:
 *   Previously the UI used `date.toLocaleDateString()` which on Thai locale
 *   serializes dates with a Buddhist year (e.g. "5/11/2524" instead of
 *   "5/11/1981"). This script normalizes any year component > 2400 by
 *   subtracting 543, and re-saves the value in the same "dd/MM/yyyy" format.
 *
 * Usage:
 *   npx tsx scripts/fix-customer-birthday-be-to-ce.ts           # dry-run
 *   npx tsx scripts/fix-customer-birthday-be-to-ce.ts --apply   # write changes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

// Split on '/', '-', or '.'
const SEP_RE = /[\/\-.]/

function convert(raw: string): string | null {
    if (!raw) return null
    const s = raw.trim()
    if (!s) return null

    // Skip ISO-like values ("yyyy-mm-dd" or ISO timestamps) — those are not BE.
    // For ISO, the year is first and is CE already.
    // But watch: "yyyy-mm-dd" with a BE year (e.g. 2524-11-05) is still possible.
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const y = parseInt(s.slice(0, 4), 10)
        if (y > 2400) {
            const ce = y - 543
            return String(ce).padStart(4, '0') + s.slice(4)
        }
        return null // already CE, nothing to do
    }

    const parts = s.split(SEP_RE).map(p => p.trim()).filter(Boolean)
    if (parts.length !== 3) return null

    // Find the 4-digit part that represents the year. Usually the last part.
    // Heuristic: pick the part with 4 digits; fallback to the largest number.
    let yearIdx = parts.findIndex(p => /^\d{4}$/.test(p))
    if (yearIdx === -1) {
        // Year in 2-digit form cannot reliably be BE; skip.
        return null
    }
    const year = parseInt(parts[yearIdx], 10)
    if (!(year > 2400)) return null // already CE

    parts[yearIdx] = String(year - 543)

    // Re-emit with original separator if detectable; default to '/'.
    const sepMatch = s.match(SEP_RE)
    const sep = sepMatch ? sepMatch[0] : '/'

    // Normalize day/month to 2 digits when originals were 2 digits;
    // otherwise keep as-is to avoid surprising changes.
    return parts.join(sep)
}

async function main() {
    const rows = await prisma.customer.findMany({
        where: { NOT: { birthday: null } },
        select: { id: true, code: true, names: true, birthday: true },
    })

    let toUpdate: { id: number; code: string | null; names: string | null; old: string; next: string }[] = []
    let skipped = 0

    for (const r of rows) {
        const raw = (r.birthday ?? '').trim()
        if (!raw) { skipped++; continue }
        const next = convert(raw)
        if (next === null || next === raw) { skipped++; continue }
        toUpdate.push({ id: r.id, code: r.code ?? null, names: r.names ?? null, old: raw, next })
    }

    console.log(`Scanned: ${rows.length}`)
    console.log(`Needs conversion: ${toUpdate.length}`)
    console.log(`Skipped (already CE / blank / unparseable): ${skipped}`)
    console.log('')
    console.log('Sample (up to 20):')
    toUpdate.slice(0, 20).forEach(u => {
        console.log(`  #${u.id} [${u.code ?? ''}] ${u.names ?? ''}: "${u.old}" -> "${u.next}"`)
    })

    if (!APPLY) {
        console.log('')
        console.log('DRY RUN — no changes written. Re-run with --apply to persist.')
        return
    }

    console.log('')
    console.log('Applying updates...')
    let ok = 0
    let fail = 0
    for (const u of toUpdate) {
        try {
            await prisma.customer.update({
                where: { id: u.id },
                data: { birthday: u.next },
            })
            ok++
        } catch (e) {
            fail++
            console.error(`Failed #${u.id}:`, e)
        }
    }
    console.log(`Done. Updated: ${ok}, Failed: ${fail}`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
