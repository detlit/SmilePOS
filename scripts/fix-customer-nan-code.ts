/**
 * Fix customers whose `code` was saved as the literal string "NaN".
 *
 * Root cause: the "add customer" flow computed the next customer code as
 * Math.max() over all existing codes. When any existing code was non-numeric
 * (e.g. an imported code like "TI-2956"), Math.max returned NaN, which then
 * got saved as the new customer's code (see updateitemreceive fix in page.tsx
 * / createcustomer.tsx for the root-cause fix).
 *
 * This script finds customers with code === "NaN" and reassigns them the next
 * free numeric code (max numeric code for that company + 1).
 *
 * Usage:
 *   npx tsx scripts/fix-customer-nan-code.ts           # dry-run
 *   npx tsx scripts/fix-customer-nan-code.ts --apply   # write changes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

async function main() {
    const broken = await prisma.customer.findMany({
        where: { code: 'NaN' },
    })

    if (broken.length === 0) {
        console.log('No customers with code "NaN" found. Nothing to do.')
        return
    }

    console.log(`Found ${broken.length} customer(s) with code "NaN":`)
    for (const c of broken) {
        console.log(`  id=${c.id} company=${c.company} names=${c.names}`)
    }

    // Group by company so each company gets its own next-code sequence
    const byCompany = new Map<string, typeof broken>()
    for (const c of broken) {
        const key = c.company || ''
        if (!byCompany.has(key)) byCompany.set(key, [])
        byCompany.get(key)!.push(c)
    }

    for (const [company, custs] of byCompany) {
        const all = await prisma.customer.findMany({
            where: { company },
            select: { code: true },
        })
        const numericCodes = all
            .map((c: { code: string | null }) => Number(c.code))
            .filter((n: number) => Number.isFinite(n))
        let nextCode = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 1000

        for (const c of custs) {
            console.log(`  -> id=${c.id} (${c.names}) new code = ${nextCode}`)
            if (APPLY) {
                await prisma.customer.update({
                    where: { id: c.id },
                    data: { code: String(nextCode) },
                })
            }
            nextCode++
        }
    }

    console.log(APPLY ? 'Applied changes.' : 'Dry-run only, pass --apply to write changes.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
