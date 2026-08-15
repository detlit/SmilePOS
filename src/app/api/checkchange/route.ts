import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const itemcode = searchParam.get('itemcode') || ""
    const company = searchParam.get('company')
    const sort = searchParam.get('sort') || 'asc'

    const prisma = await getPrisma();

    const get = await prisma.rCstockchange.findMany({
        where: {
            company,
            itemcode,
        },
        orderBy: {
            id: sort,
        } as any,
    })
    return Response.json(get)
}

export async function POST(req: Request) {
    const prisma = await getPrisma();
    try {
        const {
            company,
            codenames,
            itemcode,
            itemName,
            unit,
            newCost,
            qty,
            totalcost,
            lot,
            dateExp,
            freebaht,
            discountbaht,
            sale,
            balance,
            Barcode,
            type,
            person,
            statuss,
            dateRC,
            codevender,
            namevender
        } = await req.json()

        const newRecord = await prisma.rCstockchange.create({
            data: {
                company,
                codenames,
                itemcode,
                itemName,
                unit,
                newCost,
                qty,
                totalcost,
                lot,
                dateExp,
                freebaht,
                discountbaht,
                sale,
                balance,
                Barcode,
                type,
                person,
                statuss,
                dateRC,
                codevender,
                namevender
            },
        })
        return Response.json(newRecord)

    } catch (error) {
        return new Response(error as BodyInit, {
            status: 500,
        })
    }
}
