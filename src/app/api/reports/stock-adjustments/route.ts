import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STOCK_ADJUST_REASON_OPTIONS } from '@/lib/stockAdjustReasons'

type StockAdjustRow = {
  id: number
  createDate: Date | null
  itemcode: string | null
  itemName: string | null
  lot: string | null
  dateExp: Date | null
  quantity_change: number | null
  balance_after: number | null
  company: string | null
  person: string | null
  adjustReasonMain: string | null
  receiverCompanyName: string | null
}

const isValidDateParam = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
const isValidMonthParam = (value: string | null) => Boolean(value && /^\d{4}-\d{2}$/.test(value))

const toStartDate = (value: string) => new Date(`${value}T00:00:00.000`)
const toEndDate = (value: string) => new Date(`${value}T23:59:59.999`)

const getMonthRange = (month: string) => {
  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const company = String(searchParams.get('company') || '').trim()
    const reason = String(searchParams.get('reason') || '').trim()
    const search = String(searchParams.get('search') || '').trim()
    const month = searchParams.get('month')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limitParam = Number(searchParams.get('limit') || 5000)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 10000) : 5000

    if (!company) {
      return NextResponse.json({ success: false, error: 'company is required' }, { status: 400 })
    }

    if (reason && !STOCK_ADJUST_REASON_OPTIONS.some((option) => option === reason)) {
      return NextResponse.json({ success: false, error: 'invalid adjustment reason' }, { status: 400 })
    }

    const whereParts: string[] = [
      '"company" = $1',
      'UPPER(COALESCE("transaction_type", \'\')) = \'ADJUST\''
    ]
    const values: unknown[] = [company]

    const addValue = (value: unknown) => {
      values.push(value)
      return `$${values.length}`
    }

    if (month && isValidMonthParam(month)) {
      const range = getMonthRange(month)
      whereParts.push(`"createDate" >= ${addValue(range.start)}`)
      whereParts.push(`"createDate" <= ${addValue(range.end)}`)
    } else {
      if (isValidDateParam(startDate)) whereParts.push(`"createDate" >= ${addValue(toStartDate(startDate as string))}`)
      if (isValidDateParam(endDate)) whereParts.push(`"createDate" <= ${addValue(toEndDate(endDate as string))}`)
    }

    if (reason) {
      whereParts.push(`COALESCE("adjustReasonMain", '') = ${addValue(reason)}`)
    }

    if (search) {
      const searchParam = addValue(`%${search}%`)
      whereParts.push(`(
        COALESCE("itemcode", '') ILIKE ${searchParam}
        OR COALESCE("itemName", '') ILIKE ${searchParam}
        OR COALESCE("lot", '') ILIKE ${searchParam}
        OR COALESCE("person", '') ILIKE ${searchParam}
        OR COALESCE("receiverCompanyName", '') ILIKE ${searchParam}
      )`)
    }

    const limitSql = addValue(limit)
    const query = `
      SELECT
        "id",
        "createDate",
        "itemcode",
        "itemName",
        "lot",
        "dateExp",
        "quantity_change",
        "balance_after",
        "company",
        "person",
        COALESCE(NULLIF("adjustReasonMain", ''), 'ไม่ระบุ') AS "adjustReasonMain",
        "receiverCompanyName"
      FROM "StockTransaction"
      WHERE ${whereParts.join(' AND ')}
      ORDER BY "createDate" DESC NULLS LAST, "id" DESC
      LIMIT ${limitSql}
    `

    const rows = await prisma.$queryRawUnsafe<StockAdjustRow[]>(query, ...values)
    const reasonMap = new Map<string, { reason: string; count: number; increase: number; decrease: number; net: number }>()
    const itemCodes = new Set<string>()

    let totalIncrease = 0
    let totalDecrease = 0
    let netAdjust = 0

    for (const row of rows) {
      const quantity = Number(row.quantity_change || 0)
      const mainReason = row.adjustReasonMain || 'ไม่ระบุ'
      if (row.itemcode) itemCodes.add(row.itemcode)
      if (quantity > 0) totalIncrease += quantity
      if (quantity < 0) totalDecrease += Math.abs(quantity)
      netAdjust += quantity

      const group = reasonMap.get(mainReason) || { reason: mainReason, count: 0, increase: 0, decrease: 0, net: 0 }
      group.count += 1
      if (quantity > 0) group.increase += quantity
      if (quantity < 0) group.decrease += Math.abs(quantity)
      group.net += quantity
      reasonMap.set(mainReason, group)
    }

    return NextResponse.json({
      success: true,
      rows,
      summary: {
        totalRows: rows.length,
        totalIncrease,
        totalDecrease,
        netAdjust,
        uniqueItems: itemCodes.size,
        reasonGroups: Array.from(reasonMap.values()).sort((a, b) => b.count - a.count)
      }
    })
  } catch (error: any) {
    console.error('[StockAdjustReport] Error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load stock adjustment report' }, { status: 500 })
  }
}