import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

// GET - Fetch all stock count records (filter by company, date)
export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const idcompany = searchParam.get('idcompany') || ''
    const date = searchParam.get('date') || ''
    const status = searchParam.get('status') || ''

    const prisma = await getPrisma();

    try {
        const whereClause: any = {}

        if (idcompany) {
            whereClause.idcompany = idcompany
        }

        if (status) {
            whereClause.status = status
        }

        if (date) {
            const startDate = new Date(date)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(date)
            endDate.setHours(23, 59, 59, 999)
            whereClause.date = {
                gte: startDate,
                lte: endDate
            }
        }

        const records = await prisma.checkstock.findMany({
            where: whereClause,
            orderBy: {
                date: 'desc'
            }
        })

        return Response.json(records)
    } catch (error) {
        console.error('Error fetching checkstock:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch records' }), {
            status: 500,
        })
    }
}

// POST - Create new stock count record
export async function POST(req: Request) {
    const prisma = await getPrisma();

    try {
        const { idcompany, id_product, month, name_product, balance, actual, diff, person, status } = await req.json()

        const newRecord = await prisma.checkstock.create({
            data: {
                date: new Date(),
                idcompany,
                id_product,
                month,
                name_product,
                balance: parseFloat(balance) || 0,
                actual: parseFloat(actual) || 0,
                diff: parseFloat(diff) || 0,
                person,
                status: status || 'pending'
            },
        })

        return Response.json(newRecord)
    } catch (error) {
        console.error('Error creating checkstock:', error)
        return new Response(JSON.stringify({ error: 'Failed to create record' }), {
            status: 500,
        })
    }
}
