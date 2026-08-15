/**
 * Re-link sale history for customers whose `code` was previously "NaN".
 *
 * Background: `scripts/fix-customer-nan-code.ts` reassigned real numeric
 * codes to customers that had code === "NaN" (e.g. Alfred Madl -> 1007,
 * Obie Broadbent -> 1008). Sale history lookups (`/api/salehistory`) match
 * primarily by `SaleMain.code_costomer`, falling back to `id_costomer` only
 * when `code_costomer` is null/empty. Old sales made while the customer's
 * code was "NaN" have `code_costomer = "NaN"` (or blank), which no longer
 * matches the new code, so their purchase history would stop showing up.
 *
 * This script finds SaleMain rows with code_costomer = "NaN" (or blank) whose
 * id_costomer points to a customer, and re-stamps code_costomer with that
 * customer's current code.
 *
 * Usage:
 *   npx tsx scripts/relink-salehistory-nan-code.ts           # dry-run
 *   npx tsx scripts/relink-salehistory-nan-code.ts --apply   # write changes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

async function main() {
    const staleSales = await prisma.saleMain.findMany({
        where: {
            OR: [
                { code_costomer: 'NaN' },
                { code_costomer: '' },
                { code_costomer: null },
            ],
            id_costomer: { not: null },
        },
        select: { id: true, id_costomer: true, code_costomer: true, companyall: true },
    })

    if (staleSales.length === 0) {
        console.log('No SaleMain rows need relinking. Nothing to do.')
        return
    }

    const customerIds = [...new Set(staleSales.map((s: { id_costomer: number | null }) => s.id_costomer as number))]
    const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, code: true, names: true },
    })
    const customerById = new Map(customers.map((c: { id: number; code: string | null; names: string | null }) => [c.id, c]))

    let toUpdate = 0
    for (const s of staleSales) {
        const cust = customerById.get(s.id_costomer as number)
        if (!cust || !cust.code || cust.code === 'NaN') continue // nothing valid to relink to
        if (s.code_costomer === cust.code) continue // already correct

        toUpdate++
        console.log(`  SaleMain id=${s.id} id_costomer=${s.id_costomer} (${cust.names}) code_costomer "${s.code_costomer}" -> "${cust.code}"`)
        if (APPLY) {
            await prisma.saleMain.update({
                where: { id: s.id },
                data: { code_costomer: cust.code },
            })
        }
    }

    console.log(`${toUpdate} SaleMain row(s) ${APPLY ? 'updated' : 'would be updated'}.`)
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
