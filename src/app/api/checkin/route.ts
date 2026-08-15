import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

// GET - Fetch checkin records with filters
export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const idcompany = searchParam.get('idcompany') || ''
    const personId = searchParam.get('personId')
    const month = searchParam.get('month')
    const year = searchParam.get('year')
    const sort = searchParam.get('sort') || 'desc'

    const prisma = await getPrisma();

    // Build date filter for month/year (explicit Thai timezone +07:00, same as sale API)
    let dateFilter = {}
    if (month && year) {
        const m = month.padStart(2, '0')
        const lastDay = new Date(Number(year), Number(month), 0).getDate()
        const startDate = new Date(`${year}-${m}-01T00:00:00.000+07:00`)
        const endDate = new Date(`${year}-${m}-${String(lastDay).padStart(2, '0')}T23:59:59.999+07:00`)
        dateFilter = {
            checkin: {
                gte: startDate,
                lte: endDate
            }
        }
    }

    const get = await prisma.checkin.findMany({
        where: {
            ...(idcompany ? { idcompany: { equals: idcompany, mode: 'insensitive' as const } } : {}),
            ...(personId ? { personId: Number(personId) } : {}),
            ...dateFilter
        },
        orderBy: {
            checkin: sort as 'asc' | 'desc'
        }
    })
    return Response.json(get)
}

// POST - Create new checkin record
export async function POST(req: Request) {
    const prisma = await getPrisma();
    try {
        const {
            idcompany,
            company,
            personId,
            person,
            status,
            checkin,
            checkout,
            checkinLat,
            checkinLng,
            checkoutLat,
            checkoutLng,
            gpsRadius,
            targetLat,
            targetLng,
            approve,
            approveDate,
            approvePerson,
            remark
        } = await req.json()

        // Prevent duplicate check-in for the same person on the same day + same shift (Thai timezone +07:00)
        // พนักงานสามารถลงเวลาได้หลายครั้งใน 1 วัน ตราบใดที่กะ (remark) ไม่ซ้ำกัน
        if (checkin && personId) {
            const checkinDate = new Date(checkin)
            const thaiDateStr = checkinDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
            const startUTC = new Date(thaiDateStr + 'T00:00:00.000+07:00')
            const endUTC = new Date(thaiDateStr + 'T23:59:59.999+07:00')

            const existing = await prisma.checkin.findFirst({
                where: {
                    personId: Number(personId),
                    idcompany: { equals: idcompany, mode: 'insensitive' },
                    checkin: { gte: startUTC, lte: endUTC },
                    // ถ้าระบุกะมา ให้บล็อกเฉพาะกะเดียวกัน (กะต่างกันลงเวลาซ้ำในวันเดียวได้)
                    ...(remark ? { remark } : {})
                }
            })

            if (existing) {
                return Response.json(
                    { error: 'Already checked in for this shift today', existing },
                    { status: 409 }
                )
            }
        }

        const newCheckin = await prisma.checkin.create({
            data: {
                idcompany,
                company,
                personId,
                person,
                status,
                checkin: checkin ? new Date(checkin) : null,
                checkout: checkout ? new Date(checkout) : null,
                checkinLat,
                checkinLng,
                checkoutLat,
                checkoutLng,
                gpsRadius,
                targetLat,
                targetLng,
                approve,
                approveDate: approveDate ? new Date(approveDate) : null,
                approvePerson,
                remark
            }
        })
        return Response.json(newCheckin)

    } catch (error) {
        return new Response(JSON.stringify(error), {
            status: 500,
        })
    }
}
