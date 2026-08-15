import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type TransferDirection = 'out' | 'in'

const STATUS_LABELS: Record<string, string> = {
  completed: 'สำเร็จ',
  pending_receive: 'รอรับ',
  pending_remote: 'รอส่ง',
  pending: 'รอดำเนินการ',
  failed: 'ไม่สำเร็จ',
  cancelled: 'ยกเลิก',
}

const MODE_LABELS: Record<string, string> = {
  connected: 'สาขาเชื่อมต่อ',
  remote: 'ข้ามสาขา (Remote)',
  manual: 'Manual',
}

const isValidDateParam = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
const isValidMonthParam = (value: string | null) => Boolean(value && /^\d{4}-\d{2}$/.test(value))

const toStartDate = (value: string) => new Date(`${value}T00:00:00.000`)
const toEndDate = (value: string) => new Date(`${value}T23:59:59.999`)

const getMonthRange = (month: string) => {
  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  return {
    start: new Date(year, monthIndex, 1, 0, 0, 0, 0),
    end: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
  }
}

const statusLabelOf = (status?: string | null) => STATUS_LABELS[String(status || '')] || String(status || 'ไม่ระบุ')
const modeLabelOf = (mode?: string | null) => MODE_LABELS[String(mode || '')] || String(mode || 'ไม่ระบุ')

const matchText = (value: unknown, keyword: string) =>
  String(value ?? '').toLowerCase().includes(keyword)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyParam = String(searchParams.get('company') || '').trim()
    const userId = Number(companyParam)

    if (!companyParam || !Number.isFinite(userId)) {
      return NextResponse.json({ success: false, error: 'company is required' }, { status: 400 })
    }

    const directionParam = String(searchParams.get('direction') || 'all').trim()
    const direction = directionParam === 'out' || directionParam === 'in' ? directionParam : 'all'
    const statusParam = String(searchParams.get('status') || '').trim()
    const transferNo = String(searchParams.get('transferNo') || '').trim()
    const search = String(searchParams.get('search') || '').trim()
    const month = searchParams.get('month')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limitParam = Number(searchParams.get('limit') || 5000)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 10000) : 5000

    // ทิศทาง: โอนออก = สาขานี้เป็นผู้ส่ง, รับโอน = สาขานี้เป็นผู้รับ (ตัดใบที่ส่งหาตัวเอง)
    const directionWhere =
      direction === 'out'
        ? { fromUserId: userId }
        : direction === 'in'
          ? { toUserId: userId, fromUserId: { not: userId } }
          : { OR: [{ fromUserId: userId }, { toUserId: userId }] }

    const andParts: any[] = [directionWhere]

    if (month && isValidMonthParam(month)) {
      const range = getMonthRange(month)
      andParts.push({ createdAt: { gte: range.start, lte: range.end } })
    } else {
      const createdAt: any = {}
      if (isValidDateParam(startDate)) createdAt.gte = toStartDate(startDate as string)
      if (isValidDateParam(endDate)) createdAt.lte = toEndDate(endDate as string)
      if (Object.keys(createdAt).length > 0) andParts.push({ createdAt })
    }

    if (statusParam) andParts.push({ status: statusParam })

    if (transferNo) {
      andParts.push({ transferNo: { contains: transferNo, mode: 'insensitive' } })
    }

    if (search) {
      andParts.push({
        OR: [
          { transferNo: { contains: search, mode: 'insensitive' } },
          { person: { contains: search, mode: 'insensitive' } },
          { fromBranchNameSnapshot: { contains: search, mode: 'insensitive' } },
          { toBranchNameSnapshot: { contains: search, mode: 'insensitive' } },
          {
            items: {
              some: {
                OR: [
                  { itemcode: { contains: search, mode: 'insensitive' } },
                  { itemName: { contains: search, mode: 'insensitive' } },
                  { lot: { contains: search, mode: 'insensitive' } },
                  { barcode: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      })
    }

    const transfers = await prisma.stockTransfer.findMany({
      where: { AND: andParts },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // ชื่อสาขาคู่ค้า: ใช้ snapshot ก่อน ถ้าไม่มีค่อย lookup User (remote จะได้ fromUserId = 0)
    const counterpartyIds = [
      ...new Set(transfers.flatMap((t) => [t.fromUserId, t.toUserId]).filter((id) => id > 0)),
    ]
    const users = counterpartyIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: counterpartyIds } },
          select: { id: true, company: true, name: true, email: true },
        })
      : []
    const userMap = new Map(users.map((u) => [u.id, u]))

    const keyword = search.toLowerCase()
    const orders: any[] = []
    const rows: any[] = []

    const itemCodes = new Set<string>()
    const branchMap = new Map<string, any>()
    const statusMap = new Map<string, { status: string; label: string; count: number; qty: number }>()

    let outOrders = 0
    let inOrders = 0
    let outQty = 0
    let inQty = 0
    let outValue = 0
    let inValue = 0
    let receivedQty = 0
    let returnedQty = 0
    let pendingItems = 0

    for (const transfer of transfers) {
      const rowDirection: TransferDirection = transfer.fromUserId === userId ? 'out' : 'in'
      const fromBranchName =
        transfer.fromBranchNameSnapshot ||
        userMap.get(transfer.fromUserId)?.company ||
        transfer.remark?.match(/from (.+)$/)?.[1] ||
        (transfer.fromUserId === 0 ? 'Remote' : '-')
      const toBranchName =
        transfer.toBranchNameSnapshot ||
        userMap.get(transfer.toUserId)?.company ||
        (transfer.toUserId === 0 ? 'Manual' : '-')
      const counterpartyName = rowDirection === 'out' ? toBranchName : fromBranchName
      const counterpartyEmail =
        rowDirection === 'out'
          ? transfer.toBranchEmailSnapshot || userMap.get(transfer.toUserId)?.email || ''
          : transfer.fromBranchEmailSnapshot || userMap.get(transfer.fromUserId)?.email || ''

      // ค้นหาด้วยคำค้น: ถ้ามี item ตรงคำค้น ให้แสดงเฉพาะ item เหล่านั้น
      // ถ้าใบโอนถูกจับคู่จากเลข order / ผู้ทำรายการ / ชื่อสาขา ให้แสดงทุก item
      let visibleItems = transfer.items
      if (keyword) {
        const matchedItems = transfer.items.filter(
          (item: any) =>
            matchText(item.itemcode, keyword) ||
            matchText(item.itemName, keyword) ||
            matchText(item.lot, keyword) ||
            matchText(item.barcode, keyword)
        )
        if (matchedItems.length > 0) visibleItems = matchedItems
      }

      let orderQty = 0
      let orderConfirmedQty = 0
      let orderValue = 0
      let orderHasConfirmation = false
      const orderItems: any[] = []

      for (const item of visibleItems as any[]) {
        const qty = Number(item.qty || 0)
        const cost = Number(item.cost || 0)
        const confirmed = item.confirmedQty === null || item.confirmedQty === undefined ? null : Number(item.confirmedQty)
        const itemReturned = confirmed === null ? 0 : Math.max(0, qty - confirmed)
        const value = qty * cost

        orderQty += qty
        orderConfirmedQty += confirmed ?? 0
        orderValue += value
        if (confirmed !== null) orderHasConfirmation = true
        if (item.itemcode) itemCodes.add(String(item.itemcode))
        // ใบที่ปิดแล้ว (completed) ไม่นับค้าง — ฝั่งผู้ส่งจะไม่มี confirmedQty ของ local transfer เสมอ
        if (item.itemStatus !== 'confirmed' && transfer.status !== 'completed') pendingItems += 1

        const rowData = {
          key: `${transfer.id}-${item.id}`,
          transferId: transfer.id,
          transferNo: transfer.transferNo || '',
          direction: rowDirection,
          status: transfer.status,
          statusLabel: statusLabelOf(transfer.status),
          transferMode: transfer.transferMode,
          transferModeLabel: modeLabelOf(transfer.transferMode),
          createdAt: transfer.createdAt,
          completedAt: transfer.completedAt,
          person: transfer.person || '',
          remark: transfer.remark || '',
          fromBranchName,
          toBranchName,
          counterpartyName,
          counterpartyEmail,
          itemId: item.id,
          itemcode: item.itemcode || '',
          itemName: item.itemName || '',
          barcode: item.barcode || '',
          unit: item.unit || '',
          lot: item.lot || '',
          dateExp: item.dateExp,
          qty,
          confirmedQty: confirmed,
          returnedQty: itemReturned,
          cost,
          totalCost: value,
          itemStatus: item.itemStatus || 'pending',
        }

        rows.push(rowData)
        orderItems.push(rowData)

        if (rowDirection === 'out') {
          outQty += qty
          outValue += value
        } else {
          inQty += qty
          inValue += value
          receivedQty += confirmed ?? 0
        }
        returnedQty += itemReturned
      }

      if (orderItems.length === 0) continue

      if (rowDirection === 'out') outOrders += 1
      else inOrders += 1

      orders.push({
        id: transfer.id,
        transferNo: transfer.transferNo || '',
        direction: rowDirection,
        status: transfer.status,
        statusLabel: statusLabelOf(transfer.status),
        transferMode: transfer.transferMode,
        transferModeLabel: modeLabelOf(transfer.transferMode),
        createdAt: transfer.createdAt,
        completedAt: transfer.completedAt,
        person: transfer.person || '',
        remark: transfer.remark || '',
        fromBranchName,
        toBranchName,
        counterpartyName,
        counterpartyEmail,
        itemCount: orderItems.length,
        totalQty: orderQty,
        totalConfirmedQty: orderConfirmedQty,
        hasConfirmation: orderHasConfirmation,
        totalValue: orderValue,
        items: orderItems,
      })

      const statusKey = String(transfer.status || 'ไม่ระบุ')
      const statusGroup = statusMap.get(statusKey) || {
        status: statusKey,
        label: statusLabelOf(statusKey),
        count: 0,
        qty: 0,
      }
      statusGroup.count += 1
      statusGroup.qty += orderQty
      statusMap.set(statusKey, statusGroup)

      const branchKey = counterpartyName || '-'
      const branchGroup = branchMap.get(branchKey) || {
        branch: branchKey,
        outOrders: 0,
        inOrders: 0,
        outQty: 0,
        inQty: 0,
        outValue: 0,
        inValue: 0,
      }
      if (rowDirection === 'out') {
        branchGroup.outOrders += 1
        branchGroup.outQty += orderQty
        branchGroup.outValue += orderValue
      } else {
        branchGroup.inOrders += 1
        branchGroup.inQty += orderQty
        branchGroup.inValue += orderValue
      }
      branchMap.set(branchKey, branchGroup)
    }

    return NextResponse.json({
      success: true,
      orders,
      rows,
      summary: {
        totalOrders: orders.length,
        outOrders,
        inOrders,
        totalItems: rows.length,
        uniqueItems: itemCodes.size,
        outQty,
        inQty,
        netQty: inQty - outQty,
        outValue,
        inValue,
        receivedQty,
        returnedQty,
        pendingItems,
        statusGroups: Array.from(statusMap.values()).sort((a, b) => b.count - a.count),
        branchGroups: Array.from(branchMap.values()).sort(
          (a, b) => b.outOrders + b.inOrders - (a.outOrders + a.inOrders)
        ),
      },
    })
  } catch (error: any) {
    console.error('[StockTransferReport] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load stock transfer report' },
      { status: 500 }
    )
  }
}
