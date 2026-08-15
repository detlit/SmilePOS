'use client'

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  Hash,
  Layers,
  ListTree,
  Printer,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react'
import { getLocalStorageItem } from '@/utils/localStorage'

type FilterMode = 'range' | 'month'
type DirectionFilter = 'all' | 'out' | 'in'
type ViewMode = 'order' | 'item'

type TransferItemRow = {
  key: string
  transferId: number
  transferNo: string
  direction: 'out' | 'in'
  status: string
  statusLabel: string
  transferMode: string
  transferModeLabel: string
  createdAt?: string | null
  completedAt?: string | null
  person: string
  remark: string
  fromBranchName: string
  toBranchName: string
  counterpartyName: string
  counterpartyEmail: string
  itemId: number
  itemcode: string
  itemName: string
  barcode: string
  unit: string
  lot: string
  dateExp?: string | null
  qty: number
  confirmedQty: number | null
  returnedQty: number
  cost: number
  totalCost: number
  itemStatus: string
}

type TransferOrder = {
  id: number
  transferNo: string
  direction: 'out' | 'in'
  status: string
  statusLabel: string
  transferMode: string
  transferModeLabel: string
  createdAt?: string | null
  completedAt?: string | null
  person: string
  remark: string
  fromBranchName: string
  toBranchName: string
  counterpartyName: string
  counterpartyEmail: string
  itemCount: number
  totalQty: number
  totalConfirmedQty: number
  hasConfirmation: boolean
  totalValue: number
  items: TransferItemRow[]
}

type TransferSummary = {
  totalOrders: number
  outOrders: number
  inOrders: number
  totalItems: number
  uniqueItems: number
  outQty: number
  inQty: number
  netQty: number
  outValue: number
  inValue: number
  receivedQty: number
  returnedQty: number
  pendingItems: number
  statusGroups: { status: string; label: string; count: number; qty: number }[]
  branchGroups: {
    branch: string
    outOrders: number
    inOrders: number
    outQty: number
    inQty: number
    outValue: number
    inValue: number
  }[]
}

const EMPTY_SUMMARY: TransferSummary = {
  totalOrders: 0,
  outOrders: 0,
  inOrders: 0,
  totalItems: 0,
  uniqueItems: 0,
  outQty: 0,
  inQty: 0,
  netQty: 0,
  outValue: 0,
  inValue: 0,
  receivedQty: 0,
  returnedQty: 0,
  pendingItems: 0,
  statusGroups: [],
  branchGroups: [],
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'completed', label: 'สำเร็จ' },
  { value: 'pending_receive', label: 'รอรับ' },
  { value: 'pending_remote', label: 'รอส่ง' },
  { value: 'failed', label: 'ไม่สำเร็จ' },
  { value: 'cancelled', label: 'ยกเลิก' },
]

const todayStr = () => new Date().toISOString().slice(0, 10)
const firstDayOfMonthStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
const currentMonthStr = () => new Date().toISOString().slice(0, 7)

const fmtNum = (value: unknown, fractionDigits = 0) => {
  const numberValue = Number(value || 0)
  return numberValue.toLocaleString('th-TH', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

const fmtMoney = (value: unknown) => fmtNum(value, 2)

const fmtDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const fmtDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      }[char] || char)
  )

const directionLabel = (direction: 'out' | 'in') => (direction === 'out' ? 'โอนออก' : 'รับโอน')

const statusTone = (status: string) => {
  if (status === 'completed') return { bg: '#D3F0E2', color: '#0F6845' }
  if (status === 'failed' || status === 'cancelled') return { bg: '#fee2e2', color: '#b91c1c' }
  return { bg: '#fef3c7', color: '#b45309' }
}

export default function StockTransferReportTab() {
  const company = useMemo(() => getLocalStorageItem('company_') || '', [])
  const [storeName, setStoreName] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('month')
  const [startDate, setStartDate] = useState(firstDayOfMonthStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [month, setMonth] = useState(currentMonthStr())
  const [direction, setDirection] = useState<DirectionFilter>('all')
  const [status, setStatus] = useState('')
  const [transferNo, setTransferNo] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('order')

  const [orders, setOrders] = useState<TransferOrder[]>([])
  const [rows, setRows] = useState<TransferItemRow[]>([])
  const [summary, setSummary] = useState<TransferSummary>(EMPTY_SUMMARY)
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const rangeText = useMemo(() => {
    if (filterMode === 'month') {
      const [year, monthValue] = month.split('-')
      if (!year || !monthValue) return 'เดือนที่เลือก'
      const date = new Date(Number(year), Number(monthValue) - 1, 1)
      return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
    }
    return `${fmtDate(startDate)} - ${fmtDate(endDate)}`
  }, [filterMode, month, startDate, endDate])

  const directionText = direction === 'all' ? 'โอนออก + รับโอน' : directionLabel(direction)
  const statusText = STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label || 'ทุกสถานะ'

  useEffect(() => {
    const loadStore = async () => {
      if (!company) return
      try {
        const res = await axios.get(`/api/setting/store/store?company=${encodeURIComponent(company)}`)
        if (res.data?.[0]) setStoreName(res.data[0].namestore || '')
      } catch (err) {
        console.error(err)
      }
    }
    loadStore()
  }, [company])

  const fetchReport = async () => {
    if (!company) {
      setError('ไม่พบรหัสสาขา')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const params = new URLSearchParams({ company, direction, limit: '10000' })
      if (filterMode === 'month') {
        params.set('month', month)
      } else {
        params.set('startDate', startDate)
        params.set('endDate', endDate)
      }
      if (status) params.set('status', status)
      if (transferNo.trim()) params.set('transferNo', transferNo.trim())
      if (search.trim()) params.set('search', search.trim())

      const res = await axios.get(`/api/reports/stock-transfers?${params.toString()}`)
      const orderData: TransferOrder[] = Array.isArray(res.data?.orders) ? res.data.orders : []
      setOrders(orderData)
      setRows(Array.isArray(res.data?.rows) ? res.data.rows : [])
      setSummary(res.data?.summary || EMPTY_SUMMARY)
      // ค้นหาเจาะจง (เลข order / คำค้น) กางรายละเอียดให้อัตโนมัติ
      const shouldExpand = Boolean(transferNo.trim() || search.trim()) && orderData.length <= 20
      setExpandedOrders(shouldExpand ? Object.fromEntries(orderData.map((order) => [order.id, true])) : {})
    } catch (err: any) {
      console.error(err)
      setOrders([])
      setRows([])
      setSummary(EMPTY_SUMMARY)
      setExpandedOrders({})
      setError(err?.response?.data?.error || 'โหลดรายงานการโอน-รับโอนสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company])

  const toggleOrder = (orderId: number) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const setAllExpanded = (value: boolean) => {
    setExpandedOrders(value ? Object.fromEntries(orders.map((order) => [order.id, true])) : {})
  }

  const exportExcel = () => {
    if (orders.length === 0) return

    const summaryRows = [
      ['รายงานการโอน-รับโอนสินค้า'],
      [storeName || company],
      [`ช่วงรายงาน: ${rangeText}`],
      [`ทิศทาง: ${directionText}`],
      [`สถานะ: ${statusText}`],
      [`เลข Order: ${transferNo.trim() || 'ทั้งหมด'}`],
      [`คำค้น: ${search.trim() || '-'}`],
      [],
      ['ใบโอนทั้งหมด', summary.totalOrders],
      ['ใบโอนออก', summary.outOrders],
      ['ใบรับโอน', summary.inOrders],
      ['รายการสินค้า', summary.totalItems],
      ['สินค้าไม่ซ้ำ', summary.uniqueItems],
      ['จำนวนโอนออก (หน่วย)', summary.outQty],
      ['จำนวนรับโอน (หน่วย)', summary.inQty],
      ['จำนวนที่ยืนยันรับ (หน่วย)', summary.receivedQty],
      ['จำนวนคืนต้นทาง (หน่วย)', summary.returnedQty],
      ['มูลค่าโอนออก', summary.outValue],
      ['มูลค่ารับโอน', summary.inValue],
      ['รายการที่ยังไม่ยืนยัน', summary.pendingItems],
      [],
      ['สรุปตามสถานะ', 'ใบโอน', 'จำนวน'],
      ...summary.statusGroups.map((group) => [group.label, group.count, group.qty]),
      [],
      ['สรุปตามสาขาคู่ค้า', 'ใบโอนออก', 'จำนวนโอนออก', 'มูลค่าโอนออก', 'ใบรับโอน', 'จำนวนรับโอน', 'มูลค่ารับโอน'],
      ...summary.branchGroups.map((group) => [
        group.branch,
        group.outOrders,
        group.outQty,
        group.outValue,
        group.inOrders,
        group.inQty,
        group.inValue,
      ]),
    ]

    const orderSheetRows = orders.map((order, index) => ({
      ลำดับ: index + 1,
      'เลข Order': order.transferNo || '',
      ทิศทาง: directionLabel(order.direction),
      วันที่ทำรายการ: fmtDateTime(order.createdAt),
      วันที่สำเร็จ: fmtDateTime(order.completedAt),
      สาขาต้นทาง: order.fromBranchName,
      สาขาปลายทาง: order.toBranchName,
      รูปแบบ: order.transferModeLabel,
      สถานะ: order.statusLabel,
      'จำนวนรายการ': order.itemCount,
      'จำนวนรวม': order.totalQty,
      'จำนวนยืนยันรับ': order.hasConfirmation ? order.totalConfirmedQty : '',
      'มูลค่ารวม': order.totalValue,
      ผู้ทำรายการ: order.person,
      หมายเหตุ: order.remark,
    }))

    const itemSheetRows = rows.map((row, index) => ({
      ลำดับ: index + 1,
      'เลข Order': row.transferNo || '',
      ทิศทาง: directionLabel(row.direction),
      วันที่: fmtDateTime(row.createdAt),
      รหัสสินค้า: row.itemcode,
      รายการสินค้า: row.itemName,
      Barcode: row.barcode,
      Lot: row.lot,
      วันหมดอายุ: fmtDate(row.dateExp),
      หน่วย: row.unit,
      'จำนวนโอน': row.qty,
      'จำนวนยืนยันรับ': row.confirmedQty ?? '',
      'จำนวนคืน': row.returnedQty,
      'ต้นทุน/หน่วย': row.cost,
      'มูลค่ารวม': row.totalCost,
      สาขาคู่ค้า: row.counterpartyName,
      สถานะรายการ: row.itemStatus === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน',
      สถานะใบโอน: row.statusLabel,
      ผู้ทำรายการ: row.person,
    }))

    const wb = XLSX.utils.book_new()

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปรายงาน')

    const wsOrders = XLSX.utils.json_to_sheet(orderSheetRows)
    wsOrders['!cols'] = [
      { wch: 7 }, { wch: 18 }, { wch: 10 }, { wch: 19 }, { wch: 19 }, { wch: 24 }, { wch: 24 },
      { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 30 },
    ]
    XLSX.utils.book_append_sheet(wb, wsOrders, 'ใบโอน')

    const wsItems = XLSX.utils.json_to_sheet(itemSheetRows)
    wsItems['!cols'] = [
      { wch: 7 }, { wch: 18 }, { wch: 10 }, { wch: 19 }, { wch: 16 }, { wch: 36 }, { wch: 18 }, { wch: 16 },
      { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 13 }, { wch: 14 }, { wch: 24 },
      { wch: 14 }, { wch: 14 }, { wch: 18 },
    ]
    XLSX.utils.book_append_sheet(wb, wsItems, 'รายการสินค้า')

    const suffix = filterMode === 'month' ? month : `${startDate}_${endDate}`
    XLSX.writeFile(wb, `รายงานการโอน-รับโอนสินค้า_${suffix}.xlsx`)
  }

  const printReport = () => {
    if (orders.length === 0) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const statusRows = summary.statusGroups
      .map(
        (group) => `
      <tr>
        <td>${escapeHtml(group.label)}</td>
        <td class="center">${fmtNum(group.count)}</td>
        <td class="num">${fmtNum(group.qty)}</td>
      </tr>
    `
      )
      .join('')

    const branchRows = summary.branchGroups
      .map(
        (group) => `
      <tr>
        <td>${escapeHtml(group.branch)}</td>
        <td class="center">${fmtNum(group.outOrders)}</td>
        <td class="num negative">${fmtNum(group.outQty)}</td>
        <td class="num">${fmtMoney(group.outValue)}</td>
        <td class="center">${fmtNum(group.inOrders)}</td>
        <td class="num positive">${fmtNum(group.inQty)}</td>
        <td class="num">${fmtMoney(group.inValue)}</td>
      </tr>
    `
      )
      .join('')

    const orderBlocks = orders
      .map((order, index) => {
        const itemRows = order.items
          .map(
            (item, itemIndex) => `
          <tr>
            <td class="center">${itemIndex + 1}</td>
            <td>${escapeHtml(item.itemcode)}</td>
            <td>${escapeHtml(item.itemName)}</td>
            <td>${escapeHtml(item.lot)}</td>
            <td class="center">${escapeHtml(fmtDate(item.dateExp))}</td>
            <td class="center">${escapeHtml(item.unit)}</td>
            <td class="num">${fmtNum(item.qty)}</td>
            <td class="num">${item.confirmedQty === null ? '-' : fmtNum(item.confirmedQty)}</td>
            <td class="num">${item.returnedQty > 0 ? fmtNum(item.returnedQty) : '-'}</td>
            <td class="num">${fmtMoney(item.cost)}</td>
            <td class="num">${fmtMoney(item.totalCost)}</td>
          </tr>
        `
          )
          .join('')

        return `
        <div class="order-block">
          <div class="order-head">
            <div class="order-title">
              <span class="badge ${order.direction === 'out' ? 'badge-out' : 'badge-in'}">${escapeHtml(directionLabel(order.direction))}</span>
              <span class="order-no">${escapeHtml(order.transferNo || `#${order.id}`)}</span>
              <span class="order-sub">${escapeHtml(order.direction === 'out' ? `→ ${order.toBranchName}` : `← ${order.fromBranchName}`)}</span>
            </div>
            <div class="order-meta">
              ลำดับที่ ${index + 1} · ${escapeHtml(fmtDateTime(order.createdAt))} · ${escapeHtml(order.transferModeLabel)} · สถานะ: ${escapeHtml(order.statusLabel)} · ผู้ทำรายการ: ${escapeHtml(order.person || '-')}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>รหัสสินค้า</th><th>รายการสินค้า</th><th>Lot</th><th>วันหมดอายุ</th><th>หน่วย</th>
                <th>จำนวนโอน</th><th>ยืนยันรับ</th><th>คืน</th><th>ต้นทุน/หน่วย</th><th>มูลค่ารวม</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="6" class="right">รวม ${fmtNum(order.itemCount)} รายการ</td>
                <td class="num">${fmtNum(order.totalQty)}</td>
                <td class="num">${order.hasConfirmation ? fmtNum(order.totalConfirmedQty) : '-'}</td>
                <td class="num">-</td>
                <td class="num">-</td>
                <td class="num">${fmtMoney(order.totalValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
      })
      .join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานการโอน-รับโอนสินค้า</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box} body{font-family:'Kanit',sans-serif;margin:0;color:#0f172a;background:#fff;font-size:11px}
        .page{padding:12mm 10mm}
        .header{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #1E5088;padding-bottom:10px;margin-bottom:10px}
        .title{font-size:20px;font-weight:800;color:#1E5088}
        .meta{font-size:10px;color:#475569;line-height:1.7;text-align:right}
        .summary{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:10px 0}
        .metric{border:1px solid #E5EEF8;border-radius:8px;padding:8px;background:#f8fafc}
        .metric .k{font-size:9px;color:#64748b}.metric .v{font-size:15px;font-weight:800;color:#0f172a}
        .positive{color:#1E5088}.negative{color:#dc2626}
        table{width:100%;border-collapse:collapse;margin-top:6px}
        th{background:#E5EEF8;color:#0f172a;font-size:9px;font-weight:700;padding:5px;border:1px solid #CCDFF1;text-align:left}
        td{font-size:9px;padding:4px 5px;border:1px solid #e2e8f0;vertical-align:top}
        tbody tr:nth-child(even) td{background:#f8fafc}
        tfoot td{background:#eef2ff;font-weight:700}
        .center{text-align:center}.right{text-align:right}.num{text-align:right;font-weight:700;white-space:nowrap}
        .section-title{font-size:12px;font-weight:800;color:#1E5088;margin-top:12px;padding-bottom:3px;border-bottom:1px solid #E5EEF8}
        .order-block{margin-top:10px;page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:6px;padding:7px}
        .order-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
        .order-title{display:flex;align-items:center;gap:7px}
        .order-no{font-size:12px;font-weight:800;color:#0f172a}
        .order-sub{font-size:10px;color:#475569}
        .order-meta{font-size:9px;color:#64748b}
        .badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px}
        .badge-out{background:#fee2e2;color:#b91c1c}.badge-in{background:#E5EEF8;color:#1E5088}
        @media print{@page{size:A4 landscape;margin:8mm}.page{padding:0}thead{display:table-header-group}tr{page-break-inside:avoid}}
      </style></head><body><div class="page">
        <div class="header">
          <div><div class="title">รายงานการโอน-รับโอนสินค้า</div><div>${escapeHtml(storeName || company)}</div></div>
          <div class="meta">
            ช่วงรายงาน: ${escapeHtml(rangeText)}<br/>
            ทิศทาง: ${escapeHtml(directionText)} · สถานะ: ${escapeHtml(statusText)}<br/>
            เลข Order: ${escapeHtml(transferNo.trim() || 'ทั้งหมด')} · คำค้น: ${escapeHtml(search.trim() || '-')}<br/>
            พิมพ์เมื่อ: ${escapeHtml(fmtDateTime(new Date().toISOString()))}
          </div>
        </div>
        <div class="summary">
          <div class="metric"><div class="k">ใบโอนทั้งหมด</div><div class="v">${fmtNum(summary.totalOrders)}</div></div>
          <div class="metric"><div class="k">ใบโอนออก</div><div class="v negative">${fmtNum(summary.outOrders)}</div></div>
          <div class="metric"><div class="k">ใบรับโอน</div><div class="v positive">${fmtNum(summary.inOrders)}</div></div>
          <div class="metric"><div class="k">สินค้าไม่ซ้ำ</div><div class="v">${fmtNum(summary.uniqueItems)}</div></div>
          <div class="metric"><div class="k">มูลค่าโอนออก</div><div class="v negative">${fmtMoney(summary.outValue)}</div></div>
          <div class="metric"><div class="k">มูลค่ารับโอน</div><div class="v positive">${fmtMoney(summary.inValue)}</div></div>
        </div>
        <div class="section-title">สรุปตามสถานะ</div>
        <table><thead><tr><th>สถานะ</th><th>ใบโอน</th><th>จำนวน</th></tr></thead><tbody>${statusRows}</tbody></table>
        <div class="section-title">สรุปตามสาขาคู่ค้า</div>
        <table><thead><tr><th>สาขา</th><th>ใบโอนออก</th><th>จำนวนโอนออก</th><th>มูลค่าโอนออก</th><th>ใบรับโอน</th><th>จำนวนรับโอน</th><th>มูลค่ารับโอน</th></tr></thead><tbody>${branchRows}</tbody></table>
        <div class="section-title">รายละเอียดตามใบโอน</div>
        ${orderBlocks}
      </div><script>window.onload=()=>{window.print()}</script></body></html>`)
    printWindow.document.close()
  }

  const statCards = [
    { label: 'ใบโอนทั้งหมด', value: fmtNum(summary.totalOrders), sub: 'ใบ', icon: ArrowLeftRight, color: '#1E5088', bg: '#F3F8FC' },
    { label: 'ใบโอนออก', value: fmtNum(summary.outOrders), sub: `${fmtNum(summary.outQty)} หน่วย`, icon: ArrowUpRight, color: '#dc2626', bg: '#fef2f2' },
    { label: 'ใบรับโอน', value: fmtNum(summary.inOrders), sub: `${fmtNum(summary.inQty)} หน่วย`, icon: ArrowDownLeft, color: '#2A6AAA', bg: '#F3F8FC' },
    { label: 'สินค้าไม่ซ้ำ', value: fmtNum(summary.uniqueItems), sub: `${fmtNum(summary.totalItems)} รายการ`, icon: Boxes, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'มูลค่าโอนออก', value: fmtMoney(summary.outValue), sub: 'บาท', icon: Wallet, color: '#b45309', bg: '#fffbeb' },
    { label: 'มูลค่ารับโอน', value: fmtMoney(summary.inValue), sub: 'บาท', icon: Layers, color: '#0d9488', bg: '#f0fdfa' },
  ]

  return (
    <div style={{ fontFamily: 'Kanit', color: '#0f172a' }}>
      <div
        style={{
          background: 'linear-gradient(135deg,#F3F8FC 0%,#f0fdfa 100%)',
          border: '1px solid #CCDFF1',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1E5088', color: '#fff', display: 'grid', placeItems: 'center' }}>
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 16, color: '#1E5088' }}>รายงานการโอน-รับโอนสินค้า</div>
            <div style={{ fontSize: 12, color: '#475569' }}>ค้นได้ตามเลข Order · สินค้า · ช่วงวันที่ — พร้อม Export Excel และพิมพ์รายงาน</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={exportExcel} disabled={orders.length === 0} style={actionButtonStyle(orders.length === 0, '#2A6AAA')}>
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button onClick={printReport} disabled={orders.length === 0} style={actionButtonStyle(orders.length === 0, '#1E5088')}>
            <Printer size={14} /> พิมพ์รายงาน
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 10, alignItems: 'end' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>โหมดค้นหา</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setFilterMode('month')} style={modeButtonStyle(filterMode === 'month')}>
                <CalendarIcon size={13} /> เดือน
              </button>
              <button onClick={() => setFilterMode('range')} style={modeButtonStyle(filterMode === 'range')}>
                <Filter size={13} /> ช่วงวัน
              </button>
            </div>
          </div>

          {filterMode === 'month' ? (
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>เดือน</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
            </div>
          ) : (
            <>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>วันที่เริ่ม</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>วันที่สิ้นสุด</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>ทิศทาง</label>
            <select value={direction} onChange={(e) => setDirection(e.target.value as DirectionFilter)} style={inputStyle}>
              <option value="all">ทั้งหมด</option>
              <option value="out">โอนออก</option>
              <option value="in">รับโอน</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>สถานะ</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: filterMode === 'month' ? 'span 2' : 'span 4' }}>
            <label style={labelStyle}>เลข Order</label>
            <input
              value={transferNo}
              onChange={(e) => setTransferNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReport()}
              placeholder="เช่น TRF-20260802001"
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: filterMode === 'month' ? 'span 2' : 'span 6' }}>
            <label style={labelStyle}>ค้นหาสินค้า / สาขา / ผู้ทำรายการ</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReport()}
              placeholder="รหัสสินค้า ชื่อสินค้า Lot Barcode ชื่อสาขา ผู้ทำรายการ"
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: filterMode === 'month' ? 'span 2' : 'span 2' }}>
            <button
              onClick={fetchReport}
              disabled={loading}
              style={{
                width: '100%',
                minHeight: 36,
                border: 'none',
                borderRadius: 8,
                background: loading ? '#94a3b8' : 'linear-gradient(90deg,#1E5088,#0d9488)',
                color: '#fff',
                fontFamily: 'Kanit_B',
                fontSize: 13,
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} แสดงรายงาน
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, marginBottom: 12 }} className="statGrid">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 10, padding: 12, minHeight: 86 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'Kanit_B' }}>{card.label}</span>
                <Icon size={18} color={card.color} />
              </div>
              <div style={{ fontSize: 20, fontFamily: 'Kanit_B', color: card.color, lineHeight: 1.15 }}>{card.value}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{card.sub}</div>
            </div>
          )
        })}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 10, borderRadius: 10, marginBottom: 12, fontSize: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 12 }} className="contentGrid">
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div
            style={{
              padding: '10px 14px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#0f172a' }}>
              {viewMode === 'order'
                ? `ใบโอน · ${fmtNum(orders.length)} ใบ · ${rangeText}`
                : `รายการสินค้า · ${fmtNum(rows.length)} รายการ · ${rangeText}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {viewMode === 'order' && orders.length > 0 && (
                <>
                  <button onClick={() => setAllExpanded(true)} style={miniButtonStyle}>
                    กางทั้งหมด
                  </button>
                  <button onClick={() => setAllExpanded(false)} style={miniButtonStyle}>
                    ยุบทั้งหมด
                  </button>
                </>
              )}
              <button onClick={() => setViewMode('order')} style={viewButtonStyle(viewMode === 'order')}>
                <ListTree size={13} /> ตาม Order
              </button>
              <button onClick={() => setViewMode('item')} style={viewButtonStyle(viewMode === 'item')}>
                <Hash size={13} /> ตามสินค้า
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '58vh' }}>
            {viewMode === 'order' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                  <tr>
                    <th style={{ ...thStyle, width: 34 }}></th>
                    <th style={thStyle}>เลข Order</th>
                    <th style={thStyle}>ทิศทาง</th>
                    <th style={thStyle}>วันที่</th>
                    <th style={thStyle}>สาขาคู่ค้า</th>
                    <th style={thStyle}>รูปแบบ</th>
                    <th style={thStyle}>สถานะ</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>รายการ</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>จำนวน</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>ยืนยันรับ</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>มูลค่า</th>
                    <th style={thStyle}>ผู้ทำรายการ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={emptyCellStyle}>
                        {searched ? 'ไม่พบข้อมูลการโอน-รับโอนตามเงื่อนไขที่เลือก' : 'เลือกเงื่อนไขแล้วกดแสดงรายงาน'}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, index) => {
                      const expanded = Boolean(expandedOrders[order.id])
                      const tone = statusTone(order.status)
                      const isOut = order.direction === 'out'
                      return (
                        <React.Fragment key={order.id}>
                          <tr
                            onClick={() => toggleOrder(order.id)}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: expanded ? '#F3F8FC' : index % 2 === 0 ? '#fff' : '#f8fafc',
                              cursor: 'pointer',
                            }}
                          >
                            <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>
                              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </td>
                            <td style={{ ...tdStyle, fontFamily: 'Kanit_B', color: '#1E5088', whiteSpace: 'nowrap' }}>
                              {order.transferNo || `#${order.id}`}
                            </td>
                            <td style={tdStyle}>
                              <span style={directionPillStyle(isOut)}>
                                {isOut ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                                {directionLabel(order.direction)}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDateTime(order.createdAt)}</td>
                            <td style={{ ...tdStyle, minWidth: 170 }}>
                              <div style={{ fontFamily: 'Kanit_B' }}>{order.counterpartyName || '-'}</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>
                                {isOut ? `จาก ${order.fromBranchName}` : `ถึง ${order.toBranchName}`}
                              </div>
                            </td>
                            <td style={{ ...tdStyle, fontSize: 11, color: '#64748b' }}>{order.transferModeLabel}</td>
                            <td style={tdStyle}>
                              <span style={{ ...badgeStyle, background: tone.bg, color: tone.color }}>{order.statusLabel}</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(order.itemCount)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: isOut ? '#dc2626' : '#147F56' }}>
                              {isOut ? '-' : '+'}
                              {fmtNum(order.totalQty)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              {order.hasConfirmation ? fmtNum(order.totalConfirmedQty) : '-'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtMoney(order.totalValue)}</td>
                            <td style={{ ...tdStyle, fontSize: 11 }}>{order.person || '-'}</td>
                          </tr>
                          {expanded && (
                            <tr>
                              <td colSpan={12} style={{ padding: '0 10px 10px 34px', background: '#f8fafc' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                  <thead>
                                    <tr>
                                      <th style={subThStyle}>#</th>
                                      <th style={subThStyle}>รหัสสินค้า</th>
                                      <th style={subThStyle}>รายการสินค้า</th>
                                      <th style={subThStyle}>Lot</th>
                                      <th style={subThStyle}>วันหมดอายุ</th>
                                      <th style={subThStyle}>หน่วย</th>
                                      <th style={{ ...subThStyle, textAlign: 'right' }}>จำนวนโอน</th>
                                      <th style={{ ...subThStyle, textAlign: 'right' }}>ยืนยันรับ</th>
                                      <th style={{ ...subThStyle, textAlign: 'right' }}>คืน</th>
                                      <th style={{ ...subThStyle, textAlign: 'right' }}>ต้นทุน/หน่วย</th>
                                      <th style={{ ...subThStyle, textAlign: 'right' }}>มูลค่ารวม</th>
                                      <th style={subThStyle}>สถานะรายการ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, itemIndex) => (
                                      <tr key={item.key} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ ...subTdStyle, textAlign: 'center', color: '#94a3b8' }}>{itemIndex + 1}</td>
                                        <td style={{ ...subTdStyle, color: '#1E5088' }}>{item.itemcode || '-'}</td>
                                        <td style={{ ...subTdStyle, minWidth: 200 }}>{item.itemName || '-'}</td>
                                        <td style={subTdStyle}>{item.lot || '-'}</td>
                                        <td style={{ ...subTdStyle, whiteSpace: 'nowrap' }}>{fmtDate(item.dateExp)}</td>
                                        <td style={subTdStyle}>{item.unit || '-'}</td>
                                        <td style={{ ...subTdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtNum(item.qty)}</td>
                                        <td style={{ ...subTdStyle, textAlign: 'right' }}>
                                          {item.confirmedQty === null ? '-' : fmtNum(item.confirmedQty)}
                                        </td>
                                        <td style={{ ...subTdStyle, textAlign: 'right', color: item.returnedQty > 0 ? '#dc2626' : '#94a3b8' }}>
                                          {item.returnedQty > 0 ? fmtNum(item.returnedQty) : '-'}
                                        </td>
                                        <td style={{ ...subTdStyle, textAlign: 'right' }}>{fmtMoney(item.cost)}</td>
                                        <td style={{ ...subTdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtMoney(item.totalCost)}</td>
                                        <td style={subTdStyle}>
                                          <span
                                            style={{
                                              ...badgeStyle,
                                              background: item.itemStatus === 'confirmed' ? '#D3F0E2' : '#fef3c7',
                                              color: item.itemStatus === 'confirmed' ? '#0F6845' : '#b45309',
                                            }}
                                          >
                                            {item.itemStatus === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {order.remark && (
                                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>หมายเหตุ: {order.remark}</div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>เลข Order</th>
                    <th style={thStyle}>ทิศทาง</th>
                    <th style={thStyle}>วันที่</th>
                    <th style={thStyle}>รหัสสินค้า</th>
                    <th style={thStyle}>รายการสินค้า</th>
                    <th style={thStyle}>Lot</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>จำนวนโอน</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>ยืนยันรับ</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>มูลค่า</th>
                    <th style={thStyle}>สาขาคู่ค้า</th>
                    <th style={thStyle}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={emptyCellStyle}>
                        {searched ? 'ไม่พบข้อมูลการโอน-รับโอนตามเงื่อนไขที่เลือก' : 'เลือกเงื่อนไขแล้วกดแสดงรายงาน'}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => {
                      const isOut = row.direction === 'out'
                      const tone = statusTone(row.status)
                      return (
                        <tr key={row.key} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                          <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{index + 1}</td>
                          <td style={{ ...tdStyle, fontFamily: 'Kanit_B', color: '#1E5088', whiteSpace: 'nowrap' }}>{row.transferNo || `#${row.transferId}`}</td>
                          <td style={tdStyle}>
                            <span style={directionPillStyle(isOut)}>
                              {isOut ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                              {directionLabel(row.direction)}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDateTime(row.createdAt)}</td>
                          <td style={{ ...tdStyle, color: '#1E5088' }}>{row.itemcode || '-'}</td>
                          <td style={{ ...tdStyle, minWidth: 210 }}>{row.itemName || '-'}</td>
                          <td style={tdStyle}>{row.lot || '-'}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B', color: isOut ? '#dc2626' : '#147F56' }}>
                            {isOut ? '-' : '+'}
                            {fmtNum(row.qty)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{row.confirmedQty === null ? '-' : fmtNum(row.confirmedQty)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Kanit_B' }}>{fmtMoney(row.totalCost)}</td>
                          <td style={{ ...tdStyle, minWidth: 150 }}>{row.counterpartyName || '-'}</td>
                          <td style={tdStyle}>
                            <span style={{ ...badgeStyle, background: tone.bg, color: tone.color }}>{row.statusLabel}</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, alignSelf: 'start' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', background: '#F3F8FC', borderBottom: '1px solid #CCDFF1', fontFamily: 'Kanit_B', color: '#1E5088', fontSize: 13 }}>
              สรุปตามสถานะ
            </div>
            <div style={{ padding: 10, display: 'grid', gap: 8 }}>
              {summary.statusGroups.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 18 }}>ไม่มีข้อมูลสรุป</div>
              ) : (
                summary.statusGroups.map((group) => {
                  const tone = statusTone(group.status)
                  return (
                    <div
                      key={group.status}
                      style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                    >
                      <span style={{ ...badgeStyle, background: tone.bg, color: tone.color }}>{group.label}</span>
                      <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
                        <div style={{ fontFamily: 'Kanit_B', color: '#0f172a' }}>{fmtNum(group.count)} ใบ</div>
                        <div>{fmtNum(group.qty)} หน่วย</div>
                      </div>
                    </div>
                  )
                })
              )}
              {summary.pendingItems > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', borderRadius: 8, padding: 9, fontSize: 11 }}>
                  มีรายการสินค้ารอยืนยันรับ {fmtNum(summary.pendingItems)} รายการ
                </div>
              )}
              {summary.returnedQty > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: 9, fontSize: 11 }}>
                  คืนกลับต้นทางรวม {fmtNum(summary.returnedQty)} หน่วย
                </div>
              )}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', background: '#f0fdfa', borderBottom: '1px solid #99f6e4', fontFamily: 'Kanit_B', color: '#0d9488', fontSize: 13 }}>
              สรุปตามสาขาคู่ค้า
            </div>
            <div style={{ padding: 10, display: 'grid', gap: 8, maxHeight: '32vh', overflowY: 'auto' }}>
              {summary.branchGroups.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 18 }}>ไม่มีข้อมูลสรุป</div>
              ) : (
                summary.branchGroups.map((group) => (
                  <div key={group.branch} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 9 }}>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#0f172a', marginBottom: 6 }}>{group.branch}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10 }}>
                      <div style={{ background: '#fef2f2', borderRadius: 6, padding: '5px 7px' }}>
                        <div style={{ color: '#b91c1c', fontFamily: 'Kanit_B' }}>โอนออก {fmtNum(group.outOrders)} ใบ</div>
                        <div style={{ color: '#64748b' }}>
                          {fmtNum(group.outQty)} หน่วย · {fmtMoney(group.outValue)} บ.
                        </div>
                      </div>
                      <div style={{ background: '#F3F8FC', borderRadius: 6, padding: '5px 7px' }}>
                        <div style={{ color: '#1E5088', fontFamily: 'Kanit_B' }}>รับโอน {fmtNum(group.inOrders)} ใบ</div>
                        <div style={{ color: '#64748b' }}>
                          {fmtNum(group.inQty)} หน่วย · {fmtMoney(group.inValue)} บ.
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 1400px) {
          .statGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 1100px) {
          .statGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .contentGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#475569', marginBottom: 5, fontFamily: 'Kanit_B' }
const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 36,
  padding: '8px 10px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontFamily: 'Kanit',
  fontSize: 12,
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
}
const modeButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  minHeight: 36,
  borderRadius: 8,
  border: active ? '1px solid #1E5088' : '1px solid #cbd5e1',
  background: active ? '#F3F8FC' : '#fff',
  color: active ? '#1E5088' : '#64748b',
  fontFamily: 'Kanit_B',
  fontSize: 12,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
})
const viewButtonStyle = (active: boolean): React.CSSProperties => ({
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 8,
  border: active ? '1px solid #1E5088' : '1px solid #cbd5e1',
  background: active ? '#F3F8FC' : '#fff',
  color: active ? '#1E5088' : '#64748b',
  fontFamily: 'Kanit_B',
  fontSize: 11,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
})
const miniButtonStyle: React.CSSProperties = {
  minHeight: 30,
  padding: '0 9px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#64748b',
  fontFamily: 'Kanit',
  fontSize: 11,
  cursor: 'pointer',
}
const actionButtonStyle = (disabled: boolean, color: string): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 8,
  border: 'none',
  background: disabled ? '#cbd5e1' : color,
  color: '#fff',
  fontFamily: 'Kanit_B',
  fontSize: 12,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
})
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '9px 8px',
  color: '#475569',
  fontFamily: 'Kanit_B',
  fontSize: 11,
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = { padding: '8px', color: '#0f172a', verticalAlign: 'middle' }
const subThStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '7px 8px',
  color: '#64748b',
  fontFamily: 'Kanit_B',
  fontSize: 10,
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap',
}
const subTdStyle: React.CSSProperties = { padding: '6px 8px', color: '#0f172a', verticalAlign: 'middle' }
const emptyCellStyle: React.CSSProperties = { textAlign: 'center', padding: 34, color: '#94a3b8', fontSize: 13 }
const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 999,
  fontFamily: 'Kanit_B',
  fontSize: 10,
  whiteSpace: 'nowrap',
}
const directionPillStyle = (isOut: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  padding: '3px 8px',
  borderRadius: 999,
  background: isOut ? '#fef2f2' : '#EDF9F3',
  color: isOut ? '#b91c1c' : '#0F6845',
  fontFamily: 'Kanit_B',
  fontSize: 10,
  whiteSpace: 'nowrap',
})
