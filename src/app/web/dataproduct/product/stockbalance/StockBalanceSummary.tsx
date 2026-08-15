'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import { useMessageStore } from "../../useMessageStore"
import { usePermission } from '@/utils/usePermission'
import * as XLSX from 'xlsx'
import { STOCK_ADJUST_REASON_OPTIONS } from '@/lib/stockAdjustReasons'
import { isLotRequired, allocateFromLots, sortLotsForConsumption, NO_LOT_LABEL } from '@/lib/lotPolicy'
import LotRepairModal from '@/components/LotRepairModal'
import LotRepairAllModal from '@/components/LotRepairAllModal'

function StockBalanceSummary() {
  const itemcodes = useMessageStore((state) => state.itemcodes)
  const ids = useMessageStore((state) => state.ids)
  const { hasPermission } = usePermission()
  const canViewCost = hasPermission("C4")

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'lots' | 'transactions' | 'transfers'>('lots')
  const [txFilter, setTxFilter] = useState<string>('ALL')

  // Stock Adjust Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false)

  // Lot Repair Modal (ซ่อมยอด lot ให้ตรงยอดคำนวณ + ผูกบิลขายไม่มี lot ย้อนหลัง)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [showRepairAllModal, setShowRepairAllModal] = useState(false)
  const [adjustLotId, setAdjustLotId] = useState<string>('')
  const [adjustQty, setAdjustQty] = useState<string>('')
  const [adjustReasonMain, setAdjustReasonMain] = useState<string>('')
  const [adjustReason, setAdjustReason] = useState<string>('')
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('increase')
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)
  const [adjustError, setAdjustError] = useState<string>('')
  const [adjustSuccess, setAdjustSuccess] = useState<string>('')

  // Lot Edit State
  const [editLotId, setEditLotId] = useState<number | null>(null)
  const [editLot, setEditLot] = useState('')
  const [editDateExp, setEditDateExp] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [editNewCost, setEditNewCost] = useState('')
  const [editDateRC, setEditDateRC] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const startEditLot = (lot: any) => {
    setEditLotId(lot.id)
    setEditLot(lot.lot || '')
    setEditDateExp(lot.dateExp ? toThaiDateString(lot.dateExp) : '')
    setEditBalance(String(lotStoredBalance(lot)))
    setEditNewCost(lot.newCost != null ? String(lot.newCost) : '')
    setEditDateRC(lot.dateRC || lot.createDate ? toThaiDateString(lot.dateRC || lot.createDate) : '')
  }

  const cancelEditLot = () => {
    setEditLotId(null)
    setEditLot('')
    setEditDateExp('')
    setEditBalance('')
    setEditNewCost('')
    setEditDateRC('')
  }

  const saveEditLot = async () => {
    if (editLotId === null) return
    setEditSaving(true)
    try {
      const person = localStorage.getItem('person_') || ''
      await axios.put('/api/lot-edit', {
        lotId: editLotId,
        lot: editLot,
        dateExp: editDateExp || null,
        balance: editBalance !== '' ? parseFloat(editBalance) : undefined,
        newCost: editNewCost !== '' ? parseFloat(editNewCost) : undefined,
        dateRC: editDateRC || null,
        person
      })
      cancelEditLot()
      fetchData()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'แก้ไขไม่สำเร็จ')
    } finally {
      setEditSaving(false)
    }
  }

  const fetchData = async () => {
    if (!itemcodes) return
    setLoading(true)
    try {
      const company = localStorage.getItem('company_') || ''
      const idParam = ids ? `&id=${encodeURIComponent(ids)}` : ''
      const res = await axios.get(`/api/stock-balance-summary?itemcode=${itemcodes}&company=${company}${idParam}`)
      setData(res.data)
    } catch (err) {
      console.error('Failed to fetch stock balance summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [itemcodes, ids])

  const fmtNum = (n: any, dec = 0) => {
    if (n == null || isNaN(n)) return '-'
    return Number(n).toLocaleString('th-TH', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  }

  // ยอดคงเหลือที่ "บันทึกจริง" ของ lot (RCitemlist.balance) — ใช้ให้ตรงกันทั้งตาราง Lot สินค้า
  // และโมดัลปรับยอด (rawBalance มาจาก API; ถ้าไม่มีค่อย fallback เป็นยอดคำนวณ)
  const lotStoredBalance = (lot: any) => (lot?.rawBalance != null ? lot.rawBalance : (lot?.balance ?? 0))

  // นโยบาย lot ของสินค้าที่กำลังดู — false = ปรับยอดโดยไม่ต้องเลือก lot
  const productRequireLot = isLotRequired(data)

  const adjustDisabled = adjustSubmitting || !adjustQty || !adjustReasonMain || (productRequireLot && !adjustLotId)

  // เลขเอกสารที่มาของ lot: RCitemlist.codenames = เลข order รับสินค้า หรือ "TRF:<เลขใบโอน>"
  // ช่วยแยก lot เลขซ้ำกันว่ามาจากใบรับ/ใบโอนคนละใบ
  const lotDocLabel = (lot: any): { icon: string; text: string; isTransfer: boolean } | null => {
    const code = String(lot?.codenames || '').trim()
    if (code.startsWith('TRF:')) return { icon: '🔄', text: code.slice(4), isTransfer: true }
    if (code) return { icon: '📄', text: code, isTransfer: false }
    if ((lot?.statuss || '') === 'โอนสินค้า') return { icon: '🔄', text: 'รับโอนระหว่างสาขา', isTransfer: true }
    return null
  }

  const fmtDate = (d: any) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const fmtDateTime = (d: any) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const openAdjustModal = () => {
    setAdjustLotId('')
    setAdjustQty('')
    setAdjustReasonMain('')
    setAdjustReason('')
    setAdjustType('increase')
    setAdjustError('')
    setAdjustSuccess('')
    setShowAdjustModal(true)
  }

  /**
   * สินค้าไม่ใช้ lot — ผู้ใช้กรอกแค่จำนวน ระบบเลือก lot ปลายทางให้เอง
   *   เพิ่มยอด : ลงที่ lot ที่จะถูกตัดก่อน (ใกล้หมดอายุก่อน) — ถ้าทุก lot ว่างใช้ lot แรกสุด
   *   ลดยอด   : ปันส่วนลงหลาย lot ตามลำดับ FEFO → FIFO เหมือนตอนขาย
   */
  const resolveAutoAdjustTargets = (qty: number): { targets: { lot: any; qty: number }[]; error: string } => {
    const lots = (data?.lots || []).map((lot: any) => ({ ...lot, balance: lotStoredBalance(lot) }))
    if (lots.length === 0) {
      return { targets: [], error: 'ยังไม่มีรายการรับเข้าของสินค้านี้ จึงปรับยอดไม่ได้ (ต้องรับสินค้าเข้าก่อน 1 ครั้ง)' }
    }
    if (adjustType === 'increase') {
      const sorted = sortLotsForConsumption(lots)
      const target = sorted.find((lot: any) => (lot.balance || 0) > 0) || sorted[0]
      return { targets: [{ lot: target, qty }], error: '' }
    }
    const { allocations, shortage } = allocateFromLots(lots, qty)
    if (shortage > 0) {
      return { targets: [], error: `ยอดคงเหลือไม่เพียงพอ (ขาดอีก ${fmtNum(shortage, 2)})` }
    }
    return { targets: allocations, error: '' }
  }

  const handleAdjustSubmit = async () => {
    if (!adjustQty || !adjustReasonMain || (productRequireLot && !adjustLotId)) {
      setAdjustError(productRequireLot
        ? 'กรุณาเลือก Lot ระบุจำนวน และเลือกเหตุผลหลัก'
        : 'กรุณาระบุจำนวน และเลือกเหตุผลหลัก')
      return
    }
    const qty = parseFloat(adjustQty)
    if (isNaN(qty) || qty <= 0) {
      setAdjustError('จำนวนต้องเป็นตัวเลขที่มากกว่า 0')
      return
    }

    let targets: { lot: any; qty: number }[] = []

    if (productRequireLot) {
      const selectedLot = (data?.lots || []).find((l: any) => String(l.id) === adjustLotId)
      if (!selectedLot) {
        setAdjustError('ไม่พบ Lot ที่เลือก')
        return
      }
      if (adjustType === 'decrease' && qty > lotStoredBalance(selectedLot)) {
        setAdjustError(`ยอดคงเหลือไม่เพียงพอ (มี ${lotStoredBalance(selectedLot)})`)
        return
      }
      targets = [{ lot: selectedLot, qty }]
    } else {
      const auto = resolveAutoAdjustTargets(qty)
      if (auto.error) {
        setAdjustError(auto.error)
        return
      }
      targets = auto.targets
    }

    setAdjustSubmitting(true)
    setAdjustError('')
    setAdjustSuccess('')
    try {
      const company = localStorage.getItem('company_') || ''
      const person = localStorage.getItem('person_') || ''
      // ปรับยอดทีละ lot — สินค้าที่ใช้ lot จะมีเป้าหมายเดียวเสมอ
      for (const target of targets) {
        await axios.post('/api/stock-adjust', {
          lotId: String(target.lot.id),
          itemcode: itemcodes,
          itemName: data?.product?.ProductName || '',
          lot: target.lot.lot || '',
          dateExp: target.lot.dateExp || null,
          adjustQty: adjustType === 'decrease' ? -target.qty : target.qty,
          adjustReasonMain,
          reason: adjustReason,
          company,
          person
        })
      }
      setAdjustSuccess(`ปรับยอดสำเร็จ: ${adjustType === 'increase' ? '+' : '-'}${qty}`)
      setTimeout(() => {
        setShowAdjustModal(false)
        fetchData()
      }, 1200)
    } catch (err: any) {
      setAdjustError(err.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setAdjustSubmitting(false)
    }
  }

  const txTypeLabel = (type: string) => {
    const map: Record<string, { label: string; icon: string; color: string; bg: string }> = {
      'SALE': { label: 'ขาย', icon: '🛒', color: '#dc2626', bg: '#fee2e2' },
      'IN': { label: 'รับเข้า', icon: '📥', color: '#147F56', bg: '#D3F0E2' },
      'TRANSFER_OUT': { label: 'โอนออก', icon: '📤', color: '#ea580c', bg: '#fff7ed' },
      'TRANSFER_IN': { label: 'รับโอน', icon: '📦', color: '#2A6AAA', bg: '#F3F8FC' },
      'ADJUST': { label: 'ปรับยอด', icon: '🔧', color: '#7c3aed', bg: '#f5f3ff' },
    }
    return map[(type || '').toUpperCase()] || { label: type || '-', icon: '❓', color: '#64748b', bg: '#f1f5f9' }
  }

  // Export Excel
  const handleExportExcel = () => {
    if (!data) return

    const lotRows = (data.lots || []).map((lot: any, i: number) => ({
      'ลำดับ': i + 1,
      'Lot': lot.lot || '-',
      'เลขที่เอกสาร': (() => { const d = lotDocLabel(lot); return d ? `${d.isTransfer ? 'ใบโอน ' : 'Order '}${d.text}` : '-' })(),
      'วันหมดอายุ': fmtDate(lot.dateExp),
      'จำนวนรับ': lot.received ?? ((lot.qty || 0) + (lot.freebaht || 0)),
      'คงเหลือ': lot.balance || 0,
      ...(canViewCost ? {
        'ต้นทุน/หน่วย': lot.newCost || 0,
        'มูลค่ารวม': lot.totalcost || 0,
      } : {}),
      'ผู้จำหน่าย': lot.namevender || '-',
      'ผู้ผลิต': lot.maker || '-',
      'วันที่รับ': fmtDate(lot.dateRC || lot.createDate),
      'ผู้ทำรายการ': lot.person || '-',
    }))

    const txRows = (data.transactions || []).map((tx: any, i: number) => {
      const info = txTypeLabel(tx.transaction_type)
      return {
        'ลำดับ': i + 1,
        'วันที่': fmtDateTime(tx.createDate),
        'ประเภท': info.label,
        'จำนวน': tx.quantity_change || 0,
        'คงเหลือหลัง': tx.balance_after ?? '-',
        'Lot': tx.lot || '-',
        'ผู้ทำรายการ': tx.person || '-',
        'เภสัชกร': tx.personsale || '-',
        'สาขาปลายทาง': tx.receiverCompanyName || '-',
      }
    })

    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryRows = [
      ['สรุปยอดคงเหลือ - ' + (data.product?.ProductName || itemcodes)],
      ['รหัสสินค้า', data.product?.code || itemcodes],
      ['Barcode', data.product?.Barcode || '-'],
      ['หน่วย', data.product?.Unit || '-'],
      [],
      ['ยอดรับทั้งหมด', data.totalReceived || 0],
      ['ยอดขาย', data.totalSale || 0],
      ['ยอดโอนออก', data.totalTransferOut || 0],
      ['ยอดรับโอนเข้า', data.totalTransferIn || 0],
      ['ยอดปรับ', data.totalAdjust || 0],
      ['ยอดคงเหลือ (จาก Lot)', data.totalBalance ?? 0],
      ['ยอดคงเหลือ (คำนวณ)', data.calculatedBalance ?? 0],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุป')

    const wsLots = XLSX.utils.json_to_sheet(lotRows)
    XLSX.utils.book_append_sheet(wb, wsLots, 'Lot สินค้า')

    const wsTx = XLSX.utils.json_to_sheet(txRows)
    XLSX.utils.book_append_sheet(wb, wsTx, 'ประวัติ Transaction')

    const fileName = `stock_balance_${itemcodes}_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // Print A4 Report
  const handlePrint = () => {
    if (!data) return
    const product = data.product || {}
    const now = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const printLotCostHeaders = canViewCost ? `
                <th style="text-align:right;padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;width:50px;">ต้นทุน</th>
                <th style="text-align:right;padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;width:55px;">มูลค่า</th>` : ''
    const productPriceLine = canViewCost
      ? `ต้นทุน: <strong>฿${fmtNum(product.CostActual, 2)}</strong> · ราคาขาย: <strong>฿${fmtNum(product.price, 2)}</strong>`
      : `ราคาขาย: <strong>฿${fmtNum(product.price, 2)}</strong>`

    const lotTableRows = (data.lots || []).map((lot: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'};">
        <td style="text-align:center;padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:10px;">${i + 1}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:10px;font-weight:500;">${lot.lot || '-'}</td>
        <td style="text-align:center;padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:10px;">${fmtDate(lot.dateExp)}</td>
        <td style="text-align:center;padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:600;">${fmtNum(lot.received ?? ((lot.qty || 0) + (lot.freebaht || 0)))}</td>
        <td style="text-align:center;padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:700;color:${(lot.balance || 0) > 0 ? '#147F56' : '#dc2626'};">${fmtNum(lot.balance)}</td>
        ${canViewCost ? `<td style="text-align:right;padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:10px;">${fmtNum(lot.newCost, 2)}</td>
        <td style="text-align:right;padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:10px;">${fmtNum(lot.totalcost, 2)}</td>` : ''}
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:9px;">${lot.namevender || '-'}</td>
        <td style="text-align:center;padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:9px;">${fmtDate(lot.dateRC || lot.createDate)}</td>
      </tr>
    `).join('')

    const txTableRows = (data.transactions || []).slice(0, 60).map((tx: any, i: number) => {
      const info = txTypeLabel(tx.transaction_type)
      return `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'};">
          <td style="text-align:center;padding:3px 4px;border-bottom:1px solid #e5e7eb;font-size:9px;">${i + 1}</td>
          <td style="text-align:center;padding:3px 4px;border-bottom:1px solid #e5e7eb;font-size:9px;">${fmtDateTime(tx.createDate)}</td>
          <td style="text-align:center;padding:3px 4px;border-bottom:1px solid #e5e7eb;"><span style="font-size:9px;font-weight:600;color:${info.color};background:${info.bg};padding:1px 6px;border-radius:8px;">${info.icon} ${info.label}</span></td>
          <td style="text-align:center;padding:3px 4px;border-bottom:1px solid #e5e7eb;font-size:10px;font-weight:600;color:${(tx.quantity_change || 0) < 0 ? '#dc2626' : '#147F56'};">${tx.quantity_change || 0}</td>
          <td style="text-align:center;padding:3px 4px;border-bottom:1px solid #e5e7eb;font-size:10px;">${tx.balance_after ?? '-'}</td>
          <td style="padding:3px 4px;border-bottom:1px solid #e5e7eb;font-size:9px;">${tx.lot || '-'}</td>
          <td style="padding:3px 4px;border-bottom:1px solid #e5e7eb;font-size:9px;">${tx.person || '-'}</td>
          <td style="padding:3px 4px;border-bottom:1px solid #e5e7eb;font-size:9px;">${tx.receiverCompanyName || '-'}</td>
        </tr>
      `
    }).join('')

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>สรุปยอดคงเหลือ ${product.ProductName || itemcodes}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Kanit',sans-serif;}
        .page{width:210mm;min-height:297mm;padding:12mm 15mm 20mm 15mm;position:relative;background:#fff;page-break-after:always;}
        .page:last-child{page-break-after:auto;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none!important;}.page{padding:8mm 12mm 15mm 12mm;}}
        @media screen{body{background:#e2e8f0;display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px 0;}.page{box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;}}
      </style>
    </head><body>
      <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
        <button onclick="window.print()" style="padding:10px 24px;background:#2A6AAA;color:#fff;border:none;border-radius:8px;font-family:Kanit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(42, 106, 170,0.3);">🖨️ พิมพ์</button>
        <button onclick="window.close()" style="padding:10px 18px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-family:Kanit;font-size:14px;cursor:pointer;">✕ ปิด</button>
      </div>

      <div class="page">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:3px solid #2A6AAA;">
          <div>
            <h1 style="margin:0;font-size:18px;color:#173F6B;font-weight:800;">📊 รายงานสรุปยอดคงเหลือ</h1>
            <div style="font-size:10px;color:#64748b;margin-top:2px;">Stock Balance Summary Report</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#94a3b8;">วันที่พิมพ์: ${now}</div>
          </div>
        </div>

        <!-- Product Info -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
          <div style="border:1px solid #CCDFF1;border-radius:8px;padding:8px 12px;background:#F3F8FC;">
            <div style="font-size:9px;color:#173F6B;text-transform:uppercase;letter-spacing:1px;">ข้อมูลสินค้า</div>
            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:2px;">${product.ProductName || '-'}</div>
            <div style="font-size:10px;color:#64748b;margin-top:1px;">รหัส: ${product.code || itemcodes} · Barcode: ${product.Barcode || '-'} · หน่วย: ${product.Unit || '-'}</div>
          </div>
          <div style="border:1px solid #CCDFF1;border-radius:8px;padding:8px 12px;background:#F3F8FC;">
            <div style="font-size:9px;color:#173F6B;text-transform:uppercase;letter-spacing:1px;">ราคา & ผู้ผลิต</div>
            <div style="font-size:12px;color:#0f172a;margin-top:2px;">${productPriceLine}</div>
            <div style="font-size:10px;color:#64748b;margin-top:1px;">ผู้ผลิต: ${product.maker || '-'}</div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:14px;">
          <div style="text-align:center;padding:6px 4px;border-radius:8px;background:#E5EEF8;border:1px solid #CCDFF1;">
            <div style="font-size:8px;color:#173F6B;text-transform:uppercase;">ยอดรับ</div>
            <div style="font-size:16px;font-weight:700;color:#2A6AAA;">${fmtNum(data.totalReceived)}</div>
          </div>
          <div style="text-align:center;padding:6px 4px;border-radius:8px;background:#fee2e2;border:1px solid #fecaca;">
            <div style="font-size:8px;color:#991b1b;text-transform:uppercase;">ยอดขาย</div>
            <div style="font-size:16px;font-weight:700;color:#dc2626;">${fmtNum(data.totalSale)}</div>
          </div>
          <div style="text-align:center;padding:6px 4px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;">
            <div style="font-size:8px;color:#9a3412;text-transform:uppercase;">โอนออก</div>
            <div style="font-size:16px;font-weight:700;color:#ea580c;">${fmtNum(data.totalTransferOut)}</div>
          </div>
          <div style="text-align:center;padding:6px 4px;border-radius:8px;background:#F3F8FC;border:1px solid #CCDFF1;">
            <div style="font-size:8px;color:#173F6B;text-transform:uppercase;">รับโอน</div>
            <div style="font-size:16px;font-weight:700;color:#2A6AAA;">${fmtNum(data.totalTransferIn)}</div>
          </div>
          <div style="text-align:center;padding:6px 4px;border-radius:8px;background:#f5f3ff;border:1px solid #ddd6fe;">
            <div style="font-size:8px;color:#5b21b6;text-transform:uppercase;">ปรับยอด</div>
            <div style="font-size:16px;font-weight:700;color:#7c3aed;">${fmtNum(data.totalAdjust)}</div>
          </div>
          <div style="text-align:center;padding:6px 4px;border-radius:8px;background:#173F6B;border:1px solid #173F6B;">
            <div style="font-size:8px;color:#CCDFF1;text-transform:uppercase;">คงเหลือ</div>
            <div style="font-size:16px;font-weight:800;color:#fff;">${fmtNum(data.calculatedBalance)}</div>
          </div>
        </div>

        <!-- Lots Table -->
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;font-weight:700;color:#173F6B;margin-bottom:4px;">📦 รายการ Lot สินค้า (${(data.lots || []).length} Lot)</div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#E5EEF8;">
                <th style="text-align:center;padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;width:24px;">#</th>
                <th style="padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">Lot</th>
                <th style="text-align:center;padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">หมดอายุ</th>
                <th style="text-align:center;padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;width:45px;">จำนวนรับ</th>
                <th style="text-align:center;padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;width:45px;">คงเหลือ</th>
                ${printLotCostHeaders}
                <th style="padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">ผู้จำหน่าย</th>
                <th style="text-align:center;padding:5px 4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">วันที่รับ</th>
              </tr>
            </thead>
            <tbody>${lotTableRows}</tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="position:absolute;bottom:12px;left:15mm;right:15mm;text-align:center;font-size:8px;color:#cbd5e1;border-top:1px solid #f1f5f9;padding-top:4px;">
          SmileStore POS · สรุปยอดคงเหลือ ${product.code || itemcodes} · หน้า 1
        </div>
      </div>

      ${(data.transactions || []).length > 0 ? `
      <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:3px solid #2A6AAA;">
          <div>
            <h1 style="margin:0;font-size:18px;color:#173F6B;font-weight:800;">📊 ประวัติ Transaction</h1>
            <div style="font-size:10px;color:#64748b;">${product.ProductName || '-'} (${product.code || itemcodes})</div>
          </div>
          <div style="text-align:right;font-size:10px;color:#94a3b8;">หน้า 2</div>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#E5EEF8;">
              <th style="text-align:center;padding:4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;width:22px;">#</th>
              <th style="text-align:center;padding:4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">วันที่</th>
              <th style="text-align:center;padding:4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">ประเภท</th>
              <th style="text-align:center;padding:4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;width:42px;">จำนวน</th>
              <th style="text-align:center;padding:4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;width:42px;">คงเหลือ</th>
              <th style="padding:4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">Lot</th>
              <th style="padding:4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">ผู้ทำรายการ</th>
              <th style="padding:4px;font-size:8px;color:#173F6B;font-weight:700;border-bottom:2px solid #CCDFF1;">สาขาปลายทาง</th>
            </tr>
          </thead>
          <tbody>${txTableRows}</tbody>
        </table>

        <div style="position:absolute;bottom:12px;left:15mm;right:15mm;text-align:center;font-size:8px;color:#cbd5e1;border-top:1px solid #f1f5f9;padding-top:4px;">
          SmileStore POS · ประวัติ Transaction ${product.code || itemcodes} · หน้า 2
        </div>
      </div>
      ` : ''}
    </body></html>`)
    printWindow.document.close()
  }

  if (!itemcodes) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Kanit', color: '#94a3b8' }}>
        กรุณาเลือกสินค้าจากรายการด้านซ้าย
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Kanit', color: '#64748b' }}>
        🔄 กำลังโหลดข้อมูล...
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Kanit', color: '#94a3b8' }}>
        ไม่พบข้อมูล
      </div>
    )
  }

  const product = data.product || {}
  const filteredTx = txFilter === 'ALL'
    ? (data.transactions || [])
    : (data.transactions || []).filter((tx: any) => (tx.transaction_type || '').toUpperCase() === txFilter)
  const lotGridColumns = canViewCost
    ? '0.3fr 0.8fr 0.7fr 0.6fr 0.6fr 0.7fr 0.7fr 1fr 0.7fr 0.5fr'
    : '0.3fr 0.8fr 0.7fr 0.6fr 0.6fr 1fr 0.7fr 0.5fr'

  return (
    <div style={{ padding: '16px 20px', fontFamily: 'Kanit' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e2e8f0'
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 สรุปยอดคงเหลือ
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            <strong style={{ color: '#1e293b' }}>{product.ProductName || '-'}</strong>
            <span style={{ marginLeft: 8, fontSize: 11, color: '#94a3b8' }}>
              รหัส: {product.code || itemcodes} · BC: {product.Barcode || '-'} · หน่วย: {product.Unit || '-'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowRepairAllModal(true)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff',
            cursor: 'pointer', fontFamily: 'Kanit', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
            boxShadow: '0 2px 6px rgba(217,119,6,0.3)'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
          >🛠️ ซ่อมแซม Lot ทุกสินค้า</button>
          <button onClick={() => setShowRepairModal(true)} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #fde68a',
            background: '#fffbeb', color: '#d97706', cursor: 'pointer',
            fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, position: 'relative',
            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.color = '#d97706' }}
          >🛠️ ซ่อมแซม Lot
            {data.rawTotalBalance !== data.calculatedBalance && (
              <span style={{
                position: 'absolute', top: -4, right: -4, width: 10, height: 10,
                borderRadius: '50%', background: '#dc2626', border: '2px solid #fff'
              }} />
            )}
          </button>
          <button onClick={openAdjustModal} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd6fe',
            background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer',
            fontFamily: 'Kanit', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed' }}
          >🔧 ปรับยอด</button>
          {!productRequireLot && (
            <span
              title="สินค้านี้ตั้งค่าไม่ติดตาม Lot — ปรับยอด/โอน/ขาย ไม่ต้องเลือก Lot"
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid #fcd34d',
                background: '#fffbeb', color: '#b45309',
                fontFamily: 'Kanit', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >🏷️ {NO_LOT_LABEL}</span>
          )}
          <button onClick={handleExportExcel} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #CCDFF1',
            background: '#F3F8FC', color: '#173F6B', cursor: 'pointer',
            fontFamily: 'Kanit', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2A6AAA'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F8FC'; e.currentTarget.style.color = '#173F6B' }}
          >📥 Export Excel</button>
          <button onClick={handlePrint} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #CCDFF1',
            background: '#F3F8FC', color: '#173F6B', cursor: 'pointer',
            fontFamily: 'Kanit', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2A6AAA'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F8FC'; e.currentTarget.style.color = '#173F6B' }}
          >🖨️ Print A4</button>
          <button onClick={fetchData} style={{
            padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', cursor: 'pointer',
            fontFamily: 'Kanit', fontSize: 12, transition: 'all 0.15s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc' }}
          >🔄</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 18
      }}>
        {[
          { label: 'ยอดรับทั้งหมด', value: data.totalReceived, icon: '📥', color: '#2A6AAA', bg: '#F3F8FC', border: '#CCDFF1' },
          { label: 'ยอดขาย', value: data.totalSale, icon: '🛒', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          { label: 'ยอดโอนออก', value: data.totalTransferOut, icon: '📤', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
          { label: 'ยอดรับโอนเข้า', value: data.totalTransferIn, icon: '📦', color: '#2A6AAA', bg: '#F3F8FC', border: '#CCDFF1' },
          { label: 'ยอดปรับ', value: data.totalAdjust, icon: '🔧', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          { label: 'ยอดคงเหลือ', value: data.calculatedBalance, icon: '📊', color: '#fff', bg: '#173F6B', border: '#173F6B' },
        ].map((card, i) => (
          <div key={i} style={{
            textAlign: 'center', padding: '10px 8px', borderRadius: 12,
            background: card.bg, border: `1px solid ${card.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'transform 0.15s'
          }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{card.icon}</div>
            <div style={{ fontSize: 9, color: i === 5 ? '#CCDFF1' : card.color, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color, marginTop: 2 }}>{fmtNum(card.value)}</div>
          </div>
        ))}
      </div>

      {/* Balance comparison note */}
      {data.rawTotalBalance !== data.calculatedBalance && (
        <div style={{
          padding: '8px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a',
          marginBottom: 14, fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6
        }}>
          ⚠️ ยอดคงเหลือ Lot ({fmtNum(data.rawTotalBalance)}) ≠ ยอดคำนวณ ({fmtNum(data.calculatedBalance)}) — อาจมีรายการที่ยังไม่ sync
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 0, borderBottom: '2px solid #e2e8f0'
      }}>
        {([
          { key: 'lots', label: `📦 Lot สินค้า (${(data.lots || []).length})`, },
          { key: 'transactions', label: `📋 ประวัติ Transaction (${(data.transactions || []).length})`, },
          { key: 'transfers', label: `🔄 รายการโอน (${(data.transferItems || []).length})`, },
        ] as { key: 'lots' | 'transactions' | 'transfers'; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px', fontFamily: 'Kanit', fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 400,
              border: 'none', borderBottom: activeTab === tab.key ? '3px solid #2A6AAA' : '3px solid transparent',
              background: activeTab === tab.key ? '#F3F8FC' : 'transparent',
              color: activeTab === tab.key ? '#173F6B' : '#64748b',
              cursor: 'pointer', transition: 'all 0.15s', marginBottom: -2
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: 14 }}>
        {/* === Lots Tab === */}
        {activeTab === 'lots' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: lotGridColumns,
              gap: 4, padding: '8px 12px', background: '#F3F8FC', borderRadius: '8px 8px 0 0',
              fontSize: 10, fontWeight: 700, color: '#173F6B'
            }}>
              <div>#</div>
              <div>Lot</div>
              <div>หมดอายุ</div>
              <div style={{ textAlign: 'center' }}>รับ</div>
              <div style={{ textAlign: 'center' }}>คงเหลือ</div>
              {canViewCost && <div style={{ textAlign: 'right' }}>ต้นทุน</div>}
              {canViewCost && <div style={{ textAlign: 'right' }}>มูลค่า</div>}
              <div>ผู้จำหน่าย</div>
              <div>วันที่รับ</div>
              <div style={{ textAlign: 'center' }}>จัดการ</div>
            </div>
            {(data.lots || []).length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>ไม่มีข้อมูล Lot</div>
            ) : (data.lots || []).map((lot: any, idx: number) => {
              const isEditing = editLotId === lot.id
              // แสดง/แก้ไข "ยอดคงเหลือที่บันทึกจริง" ของ lot (rawBalance = RCitemlist.balance)
              // ซึ่งเป็นค่าเดียวกับที่ปุ่มบันทึกเขียนลงฐานข้อมูล จึงทำให้แก้แล้วค่าคงอยู่
              // (การ์ดสรุป/แจ้งเตือน "≠ ยอดคำนวณ" ยังใช้สูตรคำนวณตามเดิม)
              const displayBalance = lotStoredBalance(lot)
              const inputStyle: React.CSSProperties = {
                fontFamily: 'Kanit', fontSize: 11, padding: '3px 6px', borderRadius: 6,
                border: '1.5px solid #2A6AAA', outline: 'none', width: '100%', background: '#F3F8FC',
                boxSizing: 'border-box' as const
              }
              return (
              <div key={lot.id} style={{
                display: 'grid',
                gridTemplateColumns: lotGridColumns,
                gap: 4, padding: '7px 12px', fontSize: 11, alignItems: 'center',
                borderBottom: '1px solid #f1f5f9',
                background: isEditing ? '#fffbeb' : (displayBalance || 0) <= 0 ? '#fafafa' : idx % 2 === 0 ? '#fff' : '#f8fafc',
                transition: 'background 0.2s'
              }}>
                <div style={{ color: '#94a3b8', fontSize: 10 }}>{idx + 1}</div>
                {isEditing ? (
                  <input value={editLot} onChange={e => setEditLot(e.target.value)} style={inputStyle} placeholder="Lot" />
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{lot.lot || '-'}</div>
                    {(() => {
                      const doc = lotDocLabel(lot)
                      return doc ? (
                        <div style={{ fontSize: 9, color: doc.isTransfer ? '#2A6AAA' : '#94a3b8', marginTop: 1 }}
                          title={doc.isTransfer ? 'เลขใบโอนรับเข้า' : 'เลข order รับสินค้า'}>
                          {doc.icon} {doc.text}
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
                {isEditing ? (
                  <input type="date" value={editDateExp} onChange={e => setEditDateExp(e.target.value)} style={{ ...inputStyle, fontSize: 10 }} />
                ) : (
                  <div style={{ color: '#64748b', fontSize: 10 }}>{fmtDate(lot.dateExp)}</div>
                )}
                <div style={{ textAlign: 'center', fontWeight: 600 }}>{fmtNum(lot.received ?? ((lot.qty || 0) + (lot.freebaht || 0)))}</div>
                {isEditing ? (
                  <input type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} placeholder="0" />
                ) : (
                  <div style={{
                    textAlign: 'center', fontWeight: 700,
                    color: (displayBalance || 0) > 0 ? '#147F56' : (displayBalance || 0) < 0 ? '#dc2626' : '#94a3b8'
                  }}>{fmtNum(displayBalance)}</div>
                )}
                {canViewCost && (isEditing ? (
                  <input type="number" step="0.01" min="0" value={editNewCost} onChange={e => setEditNewCost(e.target.value)} style={{ ...inputStyle, textAlign: 'right', fontSize: 10 }} placeholder="0.00" />
                ) : (
                  <div style={{ textAlign: 'right', color: '#64748b', fontSize: 10 }}>{fmtNum(lot.newCost, 2)}</div>
                ))}
                {canViewCost && <div style={{ textAlign: 'right', color: '#0f172a', fontSize: 10 }}>฿{fmtNum(isEditing ? (parseFloat(editNewCost || '0') || 0) * (parseFloat(editBalance || '0') || 0) : lot.totalcost, 2)}</div>}
                <div style={{ color: '#475569', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.namevender || '-'}</div>
                {isEditing ? (
                  <input type="date" value={editDateRC} onChange={e => setEditDateRC(e.target.value)} style={{ ...inputStyle, fontSize: 10 }} />
                ) : (
                  <div style={{ color: '#64748b', fontSize: 10 }}>{fmtDate(lot.dateRC || lot.createDate)}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                  {isEditing ? (<>
                    <button onClick={saveEditLot} disabled={editSaving} style={{
                      padding: '2px 8px', borderRadius: 6, border: 'none', fontSize: 10, fontFamily: 'Kanit', fontWeight: 600,
                      background: 'linear-gradient(135deg,#2A6AAA,#1E5088)', color: '#fff', cursor: 'pointer',
                      opacity: editSaving ? 0.6 : 1, transition: 'opacity 0.2s'
                    }}>{editSaving ? '...' : '✓ บันทึก'}</button>
                    <button onClick={cancelEditLot} disabled={editSaving} style={{
                      padding: '2px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 10, fontFamily: 'Kanit',
                      background: '#fff', color: '#64748b', cursor: 'pointer'
                    }}>✕</button>
                  </>) : (
                    <button onClick={() => startEditLot(lot)} style={{
                      padding: '2px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 10, fontFamily: 'Kanit',
                      fontWeight: 500, background: '#fff', color: '#3E86C7', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.15s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F3F8FC'; e.currentTarget.style.borderColor = '#3E86C7' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                    >✏️ แก้ไข</button>
                  )}
                </div>
              </div>
              )
            })}
            {/* Lot Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: lotGridColumns,
              gap: 4, padding: '8px 12px', background: '#173F6B', borderRadius: '0 0 8px 8px',
              fontSize: 11, fontWeight: 700, color: '#fff'
            }}>
              <div></div>
              <div>รวม</div>
              <div></div>
              <div style={{ textAlign: 'center' }}>{fmtNum(data.totalReceived)}</div>
              <div style={{ textAlign: 'center' }}>{fmtNum(data.rawTotalBalance)}</div>
              {canViewCost && <div></div>}
              {canViewCost && <div style={{ textAlign: 'right' }}>฿{fmtNum((data.lots || []).reduce((s: number, l: any) => s + (l.totalcost || 0), 0), 2)}</div>}
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        )}

        {/* === Transactions Tab === */}
        {activeTab === 'transactions' && (
          <div>
            {/* Filter */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'ทั้งหมด' },
                { key: 'SALE', label: '🛒 ขาย' },
                { key: 'IN', label: '📥 รับเข้า' },
                { key: 'TRANSFER_OUT', label: '📤 โอนออก' },
                { key: 'TRANSFER_IN', label: '📦 รับโอน' },
                { key: 'ADJUST', label: '🔧 ปรับยอด' },
              ].map(f => (
                <button key={f.key} onClick={() => setTxFilter(f.key)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'Kanit', fontWeight: txFilter === f.key ? 600 : 400,
                  border: txFilter === f.key ? '1px solid #2A6AAA' : '1px solid #e2e8f0',
                  background: txFilter === f.key ? '#E5EEF8' : '#fff',
                  color: txFilter === f.key ? '#173F6B' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>{f.label}</button>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '0.3fr 1fr 0.7fr 0.5fr 0.8fr 0.8fr 0.8fr',
              gap: 4, padding: '8px 12px', background: '#F3F8FC', borderRadius: '8px 8px 0 0',
              fontSize: 10, fontWeight: 700, color: '#173F6B'
            }}>
              <div>#</div>
              <div>วันที่</div>
              <div style={{ textAlign: 'center' }}>ประเภท</div>
              <div style={{ textAlign: 'center' }}>จำนวน</div>
              <div>Lot</div>
              <div>ผู้ทำรายการ</div>
              <div>สาขาปลายทาง</div>
            </div>
            {filteredTx.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>ไม่พบรายการ</div>
            ) : filteredTx.map((tx: any, idx: number) => {
              const info = txTypeLabel(tx.transaction_type)
              return (
                <div key={tx.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '0.3fr 1fr 0.7fr 0.5fr 0.8fr 0.8fr 0.8fr',
                  gap: 4, padding: '6px 12px', fontSize: 11, alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9',
                  background: idx % 2 === 0 ? '#fff' : '#f8fafc'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: 10 }}>{idx + 1}</div>
                  <div style={{ color: '#475569', fontSize: 10 }}>{fmtDateTime(tx.createDate)}</div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 600, color: info.color, background: info.bg,
                      padding: '2px 8px', borderRadius: 10
                    }}>{info.icon} {info.label}</span>
                  </div>
                  <div style={{
                    textAlign: 'center', fontWeight: 700, fontSize: 12,
                    color: (tx.quantity_change || 0) < 0 ? '#dc2626' : '#147F56'
                  }}>{tx.quantity_change || 0}</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>{tx.lot || '-'}</div>
                  <div style={{ color: '#475569', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.personsale || tx.person || '-'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.receiverCompanyName || '-'}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* === Transfers Tab === */}
        {activeTab === 'transfers' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '0.3fr 0.8fr 0.6fr 0.5fr 0.5fr 0.5fr 0.6fr 0.8fr 0.7fr',
              gap: 4, padding: '8px 12px', background: '#F3F8FC', borderRadius: '8px 8px 0 0',
              fontSize: 10, fontWeight: 700, color: '#173F6B'
            }}>
              <div>#</div>
              <div>เลขโอน</div>
              <div>Lot</div>
              <div style={{ textAlign: 'center' }}>โอน</div>
              <div style={{ textAlign: 'center' }}>รับจริง</div>
              <div style={{ textAlign: 'center' }}>สถานะ</div>
              <div>วันที่</div>
              <div>ผู้โอน</div>
              <div>หมายเหตุ</div>
            </div>
            {(data.transferItems || []).length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>ไม่มีรายการโอน</div>
            ) : (data.transferItems || []).map((ti: any, idx: number) => {
              const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                'confirmed': { label: '✅ รับแล้ว', color: '#2A6AAA', bg: '#E5EEF8' },
                'pending': { label: '⏳ รอรับ', color: '#d97706', bg: '#fef3c7' },
                'returned': { label: '🔄 คืน', color: '#dc2626', bg: '#fee2e2' },
              }
              const st = statusMap[ti.itemStatus] || { label: ti.itemStatus, color: '#64748b', bg: '#f1f5f9' }
              return (
                <div key={ti.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '0.3fr 0.8fr 0.6fr 0.5fr 0.5fr 0.5fr 0.6fr 0.8fr 0.7fr',
                  gap: 4, padding: '6px 12px', fontSize: 11, alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9',
                  background: ti.itemStatus === 'confirmed' ? '#EDF9F3' : idx % 2 === 0 ? '#fff' : '#f8fafc'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: 10 }}>{idx + 1}</div>
                  <div style={{ fontWeight: 600, color: '#1E5088', fontSize: 10 }}>{ti.transferNo || '-'}</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>{ti.lot || '-'}</div>
                  <div style={{ textAlign: 'center', fontWeight: 600 }}>{fmtNum(ti.qty)}</div>
                  <div style={{ textAlign: 'center', fontWeight: 600, color: ti.confirmedQty != null ? '#2A6AAA' : '#94a3b8' }}>
                    {ti.confirmedQty != null ? fmtNum(ti.confirmedQty) : '-'}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 600, color: st.color, background: st.bg,
                      padding: '1px 6px', borderRadius: 8
                    }}>{st.label}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 9 }}>{fmtDate(ti.transferDate)}</div>
                  <div style={{ color: '#475569', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ti.person || '-'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ti.remark || '-'}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* === Lot Repair Modal === */}
      <LotRepairModal
        show={showRepairModal}
        onClose={() => setShowRepairModal(false)}
        company={typeof window !== 'undefined' ? (localStorage.getItem('company_') || '') : ''}
        itemcode={itemcodes || ''}
        productId={ids || null}
        productName={product.ProductName || ''}
        onComplete={fetchData}
      />

      {/* === Lot Repair All Modal === */}
      <LotRepairAllModal
        show={showRepairAllModal}
        onClose={() => setShowRepairAllModal(false)}
        company={typeof window !== 'undefined' ? (localStorage.getItem('company_') || '') : ''}
        onComplete={fetchData}
      />

      {/* === Stock Adjust Modal === */}
      {showAdjustModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.2s ease'
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowAdjustModal(false) }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: 480, maxWidth: '95vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
            animation: 'slideUp 0.25s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px 16px', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🔧 ปรับยอดสินค้า
                </div>
                <div style={{ fontSize: 11, color: '#ddd6fe', marginTop: 2 }}>
                  {data?.product?.ProductName || '-'} ({itemcodes})
                </div>
              </div>
              <button onClick={() => setShowAdjustModal(false)} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px' }}>
              {/* Adjust Type Toggle */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>ประเภทการปรับ</label>
                <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <button onClick={() => setAdjustType('increase')} style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                    background: adjustType === 'increase' ? '#147F56' : '#f9fafb',
                    color: adjustType === 'increase' ? '#fff' : '#6b7280'
                  }}>
                    📈 เพิ่มยอด
                  </button>
                  <button onClick={() => setAdjustType('decrease')} style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                    background: adjustType === 'decrease' ? '#dc2626' : '#f9fafb',
                    color: adjustType === 'decrease' ? '#fff' : '#6b7280'
                  }}>
                    📉 ลดยอด
                  </button>
                </div>
              </div>

              {/* Lot Selection — สินค้าที่ตั้งค่า "ไม่มี Lot" ไม่ต้องเลือก ระบบปันส่วนให้เอง */}
              {productRequireLot ? (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>เลือก Lot</label>
                  <select
                    value={adjustLotId}
                    onChange={(e) => setAdjustLotId(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db',
                      fontFamily: 'Kanit', fontSize: 13, color: '#1f2937', background: '#fff',
                      outline: 'none', transition: 'border-color 0.15s', appearance: 'auto' as any
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  >
                    <option value="">-- เลือก Lot --</option>
                    {(data?.lots || []).map((lot: any) => (
                      <option key={lot.id} value={String(lot.id)}>
                        Lot: {lot.lot || '-'} | หมดอายุ: {fmtDate(lot.dateExp)} | คงเหลือ: {fmtNum(lotStoredBalance(lot))}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{
                  marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                  background: '#fffbeb', border: '1px solid #fcd34d', color: '#b45309',
                  fontFamily: 'Kanit', fontSize: 12
                }}>
                  🏷️ {NO_LOT_LABEL} — สินค้านี้ตั้งค่าไม่ติดตาม Lot
                  <div style={{ fontSize: 11, color: '#92400e', marginTop: 3 }}>
                    {adjustType === 'increase'
                      ? 'ระบุแค่จำนวน ระบบจะเพิ่มยอดเข้าล็อตที่จะถูกตัดก่อนให้อัตโนมัติ'
                      : 'ระบุแค่จำนวน ระบบจะหักจากล็อตที่ใกล้หมดอายุก่อนให้อัตโนมัติ'}
                    {' · คงเหลือรวม '}{fmtNum(data?.calculatedBalance)}
                  </div>
                </div>
              )}

              {/* Selected Lot Info */}
              {productRequireLot && adjustLotId && (() => {
                const lot = (data?.lots || []).find((l: any) => String(l.id) === adjustLotId)
                if (!lot) return null
                return (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, background: '#f8fafc',
                    border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', gap: 16
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Lot</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{lot.lot || '-'}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>หมดอายุ</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fmtDate(lot.dateExp)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>คงเหลือ</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: (lotStoredBalance(lot) || 0) > 0 ? '#147F56' : '#dc2626' }}>{fmtNum(lotStoredBalance(lot))}</div>
                    </div>
                    {canViewCost && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>ต้นทุน</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>฿{fmtNum(lot.newCost, 2)}</div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Quantity */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>
                  จำนวนที่ต้องการ{adjustType === 'increase' ? 'เพิ่ม' : 'ลด'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="ระบุจำนวน"
                    style={{
                      width: '100%', padding: '10px 12px 10px 40px', borderRadius: 10,
                      border: `1px solid ${adjustType === 'increase' ? '#A9E1C6' : '#fecaca'}`,
                      fontFamily: 'Kanit', fontSize: 15, fontWeight: 600,
                      color: adjustType === 'increase' ? '#147F56' : '#dc2626',
                      background: adjustType === 'increase' ? '#EDF9F3' : '#fef2f2',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 16, color: adjustType === 'increase' ? '#147F56' : '#dc2626'
                  }}>
                    {adjustType === 'increase' ? '+' : '-'}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>เหตุผลในการปรับ</label>
                <select
                  value={adjustReasonMain}
                  onChange={(e) => setAdjustReasonMain(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db',
                    fontFamily: 'Kanit', fontSize: 13, color: '#1f2937', background: '#fff',
                    outline: 'none', transition: 'border-color 0.15s', appearance: 'auto' as any,
                    marginBottom: 8
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  <option value="">-- เลือกเหตุผลหลัก --</option>
                  {STOCK_ADJUST_REASON_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม เช่น เลขที่เอกสาร หมายเหตุ หรือผู้ตรวจสอบ"
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db',
                    fontFamily: 'Kanit', fontSize: 12, color: '#1f2937', resize: 'vertical',
                    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Preview — สินค้าใช้ lot ดูยอดของ lot ที่เลือก, สินค้าไม่ใช้ lot ดูยอดรวมของสินค้า */}
              {(productRequireLot ? adjustLotId : true) && adjustQty && parseFloat(adjustQty) > 0 && (() => {
                const lot = productRequireLot
                  ? (data?.lots || []).find((l: any) => String(l.id) === adjustLotId)
                  : null
                if (productRequireLot && !lot) return null
                const currentBal = productRequireLot ? lotStoredBalance(lot) : Number(data?.calculatedBalance || 0)
                const change = adjustType === 'decrease' ? -parseFloat(adjustQty) : parseFloat(adjustQty)
                const newBal = currentBal + change
                return (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1px solid #e2e8f0', marginBottom: 16
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                      {productRequireLot ? 'ตัวอย่างผลลัพธ์' : 'ตัวอย่างผลลัพธ์ (ยอดรวมของสินค้า)'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>ก่อนปรับ</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#475569' }}>{fmtNum(currentBal)}</div>
                      </div>
                      <div style={{
                        fontSize: 20, fontWeight: 700,
                        color: adjustType === 'increase' ? '#147F56' : '#dc2626'
                      }}>→</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>หลังปรับ</div>
                        <div style={{
                          fontSize: 20, fontWeight: 700,
                          color: newBal >= 0 ? '#147F56' : '#dc2626'
                        }}>{fmtNum(newBal)}</div>
                      </div>
                      <div style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: adjustType === 'increase' ? '#D3F0E2' : '#fee2e2',
                        color: adjustType === 'increase' ? '#147F56' : '#dc2626'
                      }}>
                        {adjustType === 'increase' ? '+' : ''}{change}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Error / Success */}
              {adjustError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, background: '#fef2f2',
                  border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  ❌ {adjustError}
                </div>
              )}
              {adjustSuccess && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, background: '#F3F8FC',
                  border: '1px solid #CCDFF1', color: '#2A6AAA', fontSize: 12, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  ✅ {adjustSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'flex-end', gap: 8
            }}>
              <button onClick={() => setShowAdjustModal(false)} style={{
                padding: '10px 20px', borderRadius: 10, border: '1px solid #d1d5db',
                background: '#fff', color: '#374151', cursor: 'pointer',
                fontFamily: 'Kanit', fontSize: 13, fontWeight: 500, transition: 'all 0.15s'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >ยกเลิก</button>
              <button
                onClick={handleAdjustSubmit}
                disabled={adjustDisabled}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: adjustDisabled ? '#d1d5db' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: adjustDisabled ? '#9ca3af' : '#fff',
                  cursor: adjustDisabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'Kanit', fontSize: 13, fontWeight: 600,
                  transition: 'all 0.15s', boxShadow: adjustDisabled ? 'none' : '0 4px 12px rgba(124,58,237,0.3)'
                }}
              >
                {adjustSubmitting ? '⏳ กำลังบันทึก...' : '✅ ยืนยันปรับยอด'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}

export default StockBalanceSummary
