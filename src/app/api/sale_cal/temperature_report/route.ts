import { NextRequest } from 'next/server'

async function getPrisma() {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error("Prisma is not available during build.");
    return prisma;
}

export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams
    const company = searchParam.get('company') || ''
    const startDate = searchParam.get('startDate') || ''
    const endDate = searchParam.get('endDate') || ''

    if (!company) {
        return Response.json({ error: 'company is required' }, { status: 400 })
    }

    try {
        const start = new Date(startDate + "T00:00:00.000+07:00")
        const end = new Date(endDate + "T23:59:59.999+07:00")

        const prisma = await getPrisma()

        const [records, settings, points] = await Promise.all([
            prisma.temperatureRecord.findMany({
                where: {
                    company,
                    recordDate: { gte: start, lte: end },
                },
                orderBy: { recordDate: 'asc' },
                select: {
                    id: true,
                    recordPoint: true,
                    temperature: true,
                    humidity: true,
                    recordDate: true,
                    recordTime: true,
                    locationType: true,
                    person: true,
                },
            }),
            prisma.temperatureSetting.findFirst({
                where: { company },
            }),
            prisma.temperaturePoint.findMany({
                where: { company },
                select: {
                    id: true,
                    pointNumber: true,
                    pointName: true,
                    locationType: true,
                    isActive: true,
                },
            }),
        ])

        // Build point map by pointNumber
        const pointMap = new Map<number, any>()
        points.forEach(p => pointMap.set(p.pointNumber ?? 0, p))

        // Helper: check if temperature is out of range
        function isOutOfRange(temp: number, locationType: string | null | undefined, setting: any): boolean {
            if (!setting) return false
            if (locationType === 'fridge') {
                return temp < Number(setting.fridgeTempMin ?? 2) || temp > Number(setting.fridgeTempMax ?? 8)
            }
            return temp < Number(setting.roomTempMin ?? 0) || temp > Number(setting.roomTempMax ?? 30)
        }

        function getTempRange(locationType: string | null | undefined, setting: any) {
            if (!setting) return { min: 0, max: 30 }
            if (locationType === 'fridge') return { min: Number(setting.fridgeTempMin ?? 2), max: Number(setting.fridgeTempMax ?? 8) }
            return { min: Number(setting.roomTempMin ?? 0), max: Number(setting.roomTempMax ?? 30) }
        }

        // Group by point
        const pointSummary = new Map<number, {
            name: string; count: number; avgTemp: number; minTemp: number; maxTemp: number;
            avgHumidity: number; outOfRange: number; settingMin: number; settingMax: number;
            locationType: string;
            daily: Map<string, { temps: number[]; humidities: number[]; outOfRange: number }>;
        }>()

        records.forEach((r: any) => {
            const pid = r.recordPoint ?? 0
            const point = pointMap.get(pid)
            const lt = r.locationType || point?.locationType || 'room'
            const range = getTempRange(lt, settings)
            const existing = pointSummary.get(pid) || {
                name: point?.pointName || `จุดที่ ${pid}`,
                count: 0, avgTemp: 0, minTemp: 999, maxTemp: -999,
                avgHumidity: 0, outOfRange: 0,
                settingMin: range.min, settingMax: range.max,
                locationType: lt,
                daily: new Map(),
            }

            const temp = Number(r.temperature || 0)
            const humidity = Number(r.humidity || 0)
            const oor = isOutOfRange(temp, lt, settings)

            existing.count++
            existing.avgTemp += temp
            existing.avgHumidity += humidity
            if (temp < existing.minTemp) existing.minTemp = temp
            if (temp > existing.maxTemp) existing.maxTemp = temp
            if (oor) existing.outOfRange++

            // Daily grouping
            const dateKey = r.recordDate
                ? new Date(new Date(r.recordDate).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
                : 'unknown'
            const day = existing.daily.get(dateKey) || { temps: [], humidities: [], outOfRange: 0 }
            day.temps.push(temp)
            day.humidities.push(humidity)
            if (oor) day.outOfRange++
            existing.daily.set(dateKey, day)

            pointSummary.set(pid, existing)
        })

        // Build point list
        const pointList = Array.from(pointSummary.entries()).map(([id, s]) => ({
            id,
            name: s.name,
            count: s.count,
            avgTemp: s.count > 0 ? Math.round((s.avgTemp / s.count) * 10) / 10 : 0,
            minTemp: s.minTemp === 999 ? 0 : Math.round(s.minTemp * 10) / 10,
            maxTemp: s.maxTemp === -999 ? 0 : Math.round(s.maxTemp * 10) / 10,
            avgHumidity: s.count > 0 ? Math.round((s.avgHumidity / s.count) * 10) / 10 : 0,
            outOfRange: s.outOfRange,
            outOfRangePercent: s.count > 0 ? Math.round((s.outOfRange / s.count) * 1000) / 10 : 0,
            settingMin: s.settingMin,
            settingMax: s.settingMax,
            daily: Array.from(s.daily.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([date, d]) => ({
                    date,
                    avgTemp: d.temps.length > 0 ? Math.round((d.temps.reduce((a, b) => a + b, 0) / d.temps.length) * 10) / 10 : 0,
                    minTemp: d.temps.length > 0 ? Math.round(Math.min(...d.temps) * 10) / 10 : 0,
                    maxTemp: d.temps.length > 0 ? Math.round(Math.max(...d.temps) * 10) / 10 : 0,
                    avgHumidity: d.humidities.length > 0 ? Math.round((d.humidities.reduce((a, b) => a + b, 0) / d.humidities.length) * 10) / 10 : 0,
                    outOfRange: d.outOfRange,
                    readings: d.temps.length,
                })),
        }))

        // Summary
        const totalReadings = records.length
        let totalOutOfRange = 0
        records.forEach((r: any) => {
            const lt = r.locationType || 'room'
            if (isOutOfRange(Number(r.temperature || 0), lt, settings)) totalOutOfRange++
        })
        const complianceRate = totalReadings > 0 ? Math.round(((totalReadings - totalOutOfRange) / totalReadings) * 1000) / 10 : 100

        return Response.json({
            summary: {
                totalReadings,
                totalOutOfRange,
                complianceRate,
                totalPoints: points.length,
                recordingDays: new Set(records.map((r: any) => r.recordDate
                    ? new Date(new Date(r.recordDate).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
                    : ''
                )).size,
            },
            points: pointList,
            settings,
            recentOutOfRange: records
                .filter((r: any) => isOutOfRange(Number(r.temperature || 0), r.locationType || 'room', settings))
                .slice(-20)
                .reverse()
                .map((r: any) => ({
                    ...r,
                    pointName: pointMap.get(r.recordPoint ?? 0)?.pointName || `จุดที่ ${r.recordPoint}`,
                })),
        })
    } catch (error) {
        console.error('Error in temperature_report:', error)
        return Response.json({ error: 'Failed to fetch temperature report' }, { status: 500 })
    }
}
