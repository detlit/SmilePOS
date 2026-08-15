'use client'

import React, { useEffect, useState, useMemo, useRef, useDeferredValue } from 'react'
import axios from 'axios'
import {
  Package, Search, Download, Printer, Box, TrendingDown, ShoppingCart,
  ChevronDown, ChevronUp, ChevronRight, AlertTriangle, BarChart3, DollarSign,
  Layers, ArrowUpDown, X, Wrench
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'
import LotRepairAllModal from '@/components/LotRepairAllModal'

interface LotInfo {
  id: number
  lot: string
  /** จำนวนที่รับเข้าของล็อตนี้ (qty + ของแถม) */
  received: number
  balance: number
  cost: number
  dateExp: string | null
  dateRC: string | null
  vendor: string
}

interface ProductItem {
  id: number
  code: string
  name: string
  group: string
  category: string
  unit: string
  balance: number
  costActual: number
  stockValueCost: number
  stockValueSale: number
  price: number
  min: number
  max: number
  rop: number
  status: string
  lotCount: number
  nearestExpiry: string | null
  hasNearExpiry: boolean
  lots: LotInfo[]
}

interface SummaryData {
  totalSKU: number
  totalStockValueCost: number
  totalStockValueSale: number
  outOfStockCount: number
  belowMinCount: number
  belowROPCount: number
  nearExpiryCount: number
  totalWithStock: number
}

interface ApiResponse {
  summary: SummaryData
  top10Value: { name: string; value: number }[]
  groupStats: { name: string; count: number; value: number }[]
  categoryStats: { name: string; count: number; value: number }[]
  products: ProductItem[]
  filters: { groups: string[]; categories: string[] }
}

const statusConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
  normal: { label: 'ปกติ', bg: '#E5EEF8', color: '#2A6AAA', border: '#A6C8E7' },
  low: { label: 'ต่ำกว่า Min', bg: '#fef9c3', color: '#a16207', border: '#fde047' },
  rop: { label: 'ต่ำกว่า ROP', bg: '#ffedd5', color: '#c2410c', border: '#fdba74' },
  out: { label: 'หมดสต็อก', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
}

const fmtN = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtN2 = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function StockInventoryTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filterGroup, setFilterGroup] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  // แก้ไขต้นทุน/หน่วย ของล็อตแบบ inline
  const [editCostLotId, setEditCostLotId] = useState<number | null>(null)
  const [editCostValue, setEditCostValue] = useState('')
  const [savingCost, setSavingCost] = useState(false)
  // แก้ไขราคาขายของสินค้าแบบ inline
  const [editPriceId, setEditPriceId] = useState<number | null>(null)
  const [editPriceValue, setEditPriceValue] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'group'>('table')
  const [storeName, setStoreName] = useState('')
  // ซ่อมแซม Lot ทุกสินค้า (โมดัลเดียวกับหน้าสรุปยอดคงเหลือ)
  const [showRepairAllModal, setShowRepairAllModal] = useState(false)
  // รายงานนี้ดึงสินค้าทั้งหมดทีเดียว จึงรอโหลดใหม่ครั้งเดียวตอนปิดโมดัล ไม่ยิงซ้ำทุกรายการที่ซ่อม
  const [repairedSomething, setRepairedSomething] = useState(false)
  // ✅ จำกัดจำนวนแถวที่ render บนหน้าจอเพื่อไม่ให้ DOM หนักเกินไป
  const PAGE_SIZE = 100
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const c = getLocalStorageItem('company_')
        const res = await axios.get(`/api/setting/store/store?company=${c}`)
        if (res.data?.[0]) setStoreName(res.data[0].namestore || '')
      } catch { }
    }
    fetchStore()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const company = getLocalStorageItem('company_')
    try {
      const res = await axios.get(`/api/sale_cal/stock_inventory?company=${company}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    let list = data.products
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
    }
    if (filterGroup) list = list.filter(p => p.group === filterGroup)
    if (filterCategory) list = list.filter(p => p.category === filterCategory)
    if (filterStatus && filterStatus !== 'all') list = list.filter(p => p.status === filterStatus)

    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'balance': cmp = a.balance - b.balance; break
        case 'value': cmp = a.stockValueCost - b.stockValueCost; break
        case 'profit': cmp = (a.price - a.costActual) - (b.price - b.costActual); break
        case 'profitPct': {
          const pa = a.price > 0 ? (a.price - a.costActual) / a.price : -Infinity
          const pb = b.price > 0 ? (b.price - b.costActual) / b.price : -Infinity
          cmp = pa - pb; break
        }
        case 'group': cmp = (a.group || '').localeCompare(b.group || '', 'th'); break
        case 'status': {
          const p: Record<string, number> = { out: 0, rop: 1, low: 2, normal: 3 }
          cmp = (p[a.status] ?? 9) - (p[b.status] ?? 9); break
        }
        default: cmp = (a.name || '').localeCompare(b.name || '', 'th'); break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return list
  }, [data, deferredSearch, filterGroup, filterCategory, filterStatus, sortBy, sortDir])

  // ✅ Reset หน้าเมื่อตัวกรองเปลี่ยน
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [deferredSearch, filterGroup, filterCategory, filterStatus, sortBy, sortDir])

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  )

  // Filtered summary (recalculated)
  const filteredSummary = useMemo(() => {
    const totalStockValueCost = filteredProducts.reduce((s, p) => s + p.stockValueCost, 0)
    const totalStockValueSale = filteredProducts.reduce((s, p) => s + p.stockValueSale, 0)
    return {
      count: filteredProducts.length,
      totalStockValueCost: Math.round(totalStockValueCost),
      totalStockValueSale: Math.round(totalStockValueSale),
    }
  }, [filteredProducts])

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(field); setSortDir('asc') }
  }

  const startEditCost = (lot: LotInfo) => {
    setEditCostLotId(lot.id)
    setEditCostValue(String(lot.cost ?? ''))
  }

  const cancelEditCost = () => {
    setEditCostLotId(null)
    setEditCostValue('')
  }

  const saveEditCost = async () => {
    if (editCostLotId == null) return
    const cost = parseFloat(editCostValue)
    if (isNaN(cost) || cost < 0) { alert('กรุณากรอกราคาทุนเป็นตัวเลขที่ไม่ติดลบ'); return }
    setSavingCost(true)
    try {
      const person = getLocalStorageItem('person_') || ''
      await axios.put('/api/lot-edit', { lotId: editCostLotId, newCost: cost, person })
      cancelEditCost()
      await fetchData()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'แก้ไขราคาทุนไม่สำเร็จ')
    } finally {
      setSavingCost(false)
    }
  }

  const startEditPrice = (p: ProductItem) => {
    setEditPriceId(p.id)
    setEditPriceValue(String(p.price ?? ''))
  }

  const cancelEditPrice = () => {
    setEditPriceId(null)
    setEditPriceValue('')
  }

  const saveEditPrice = async () => {
    if (editPriceId == null) return
    const price = parseFloat(editPriceValue)
    if (isNaN(price) || price < 0) { alert('กรุณากรอกราคาขายเป็นตัวเลขที่ไม่ติดลบ'); return }
    setSavingPrice(true)
    try {
      const person = getLocalStorageItem('person_') || ''
      await axios.put('/api/datalist/update-price', { id: editPriceId, price, person })
      cancelEditPrice()
      await fetchData()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'แก้ไขราคาขายไม่สำเร็จ')
    } finally {
      setSavingPrice(false)
    }
  }

  const SortIcon = ({ field }: { field: string }) => (
    sortBy === field ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} style={{ opacity: 0.4 }} />
  )

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'รายงานสินค้าคงคลัง' })

  const handleExport = () => {
    if (!filteredProducts.length) return
    const rows = filteredProducts.map(p => ({
      'รหัสสินค้า': p.code,
      'ชื่อสินค้า': p.name,
      'กลุ่ม': p.group,
      'หมวด': p.category,
      'หน่วย': p.unit,
      'คงเหลือ': p.balance,
      'ต้นทุน': p.costActual,
      'มูลค่าสต็อก(ทุน)': p.stockValueCost,
      'ราคาขาย': p.price,
      'กำไร': Number((p.price - p.costActual).toFixed(2)),
      '%กำไร': p.price > 0 ? Number((((p.price - p.costActual) / p.price) * 100).toFixed(1)) : 0,
      'มูลค่าสต็อก(ขาย)': p.stockValueSale,
      'Min': p.min,
      'Max': p.max,
      'ROP': p.rop,
      'สถานะ': statusConfig[p.status]?.label || p.status,
      'Lots': p.lotCount,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'สินค้าคงคลัง')
    XLSX.writeFile(wb, `stock_inventory_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const summary = data?.summary

  return (
    <div style={{ padding: '0px' }}>
      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <SummaryCard icon={Package} label="SKU ทั้งหมด" value={fmtN(summary.totalSKU)} color="#6366f1" subValue={`มีสต็อก ${fmtN(summary.totalWithStock)} รายการ`} />
          <SummaryCard icon={DollarSign} label="มูลค่าสต็อก (ทุน)" value={`฿${fmtN(summary.totalStockValueCost)}`} color="#2A6AAA" subValue={`ราคาขาย ฿${fmtN(summary.totalStockValueSale)}`} />
          <SummaryCard icon={AlertTriangle} label="หมดสต็อก" value={fmtN(summary.outOfStockCount)} color="#dc2626" subValue="รายการ" />
          <SummaryCard icon={TrendingDown} label="ต่ำกว่า Min" value={fmtN(summary.belowMinCount)} color="#d97706" subValue="รายการ" />
          <SummaryCard icon={ShoppingCart} label="ต่ำกว่า ROP" value={fmtN(summary.belowROPCount)} color="#ea580c" subValue="ควรสั่งซื้อ" />
          <SummaryCard icon={Box} label="ใกล้หมดอายุ (≤90 วัน)" value={fmtN(summary.nearExpiryCount)} color="#7c3aed" subValue="รายการ" />
        </div>
      )}

      {/* Top 10 + Group Breakdown */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {/* Top 10 Value */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={14} color="#6366f1" /> Top 10 มูลค่าสต็อกสูงสุด
            </div>
            <div style={{ maxHeight: '95px', overflowY: 'auto' }}>
            {data.top10Value.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontFamily: 'Kanit_B', fontSize: '11px', color: '#94a3b8', width: '20px', textAlign: 'right' }}>{i + 1}.</span>
                <div style={{ flex: 1, height: '13px', borderRadius: '4px', overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                  <div style={{
                    height: '100%',
                    width: `${data.top10Value[0]?.value ? (item.value / data.top10Value[0].value * 100) : 0}%`,
                    background: `linear-gradient(90deg, ${i < 3 ? '#6366f1' : '#a5b4fc'}, ${i < 3 ? '#818cf8' : '#c7d2fe'})`,
                    borderRadius: '4px',
                    transition: 'width 0.5s',
                  }} />
                  <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'Kanit', fontSize: '10px', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
                    {item.name}
                  </span>
                  <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'Kanit_B', fontSize: '10px', color: '#334155' }}>
                    ฿{fmtN(item.value)}
                  </span>
                </div>
              </div>
            ))}
            </div>
            {data.top10Value.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px', padding: '20px' }}>ไม่มีข้อมูล</div>}
          </div>

          {/* Category Breakdown */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#2A6AAA" /> สัดส่วนมูลค่าตามหมวดสินค้า
            </div>
            <div style={{ maxHeight: '95px', overflowY: 'auto' }}>
              {data.categoryStats.map((g, i) => {
                const totalValue = data.categoryStats.reduce((s, x) => s + x.value, 0)
                const pct = totalValue > 0 ? (g.value / totalValue * 100) : 0
                const colors = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777', '#B45309', '#65A30D']
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', padding: '4px 8px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                    </div>
                    <span style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', flexShrink: 0 }}>{g.count} รายการ</span>
                    <span style={{ fontFamily: 'Kanit_B', fontSize: '11px', color: colors[i % colors.length], flexShrink: 0 }}>฿{fmtN(g.value)}</span>
                    <span style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#94a3b8', flexShrink: 0, width: '40px', textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
            {data.categoryStats.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px', padding: '20px' }}>ไม่มีข้อมูล</div>}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
        background: 'white', borderRadius: '12px', padding: '12px 16px',
        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '150px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ / รหัสสินค้า..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 8px 8px 32px', borderRadius: '8px', border: '1px solid #e2e8f0',
              fontFamily: 'Kanit', fontSize: '12px', outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={14} color="#94a3b8" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: '12px', background: 'white', minWidth: '120px' }}
        >
          <option value="">หมวดทั้งหมด</option>
          {data?.filters?.categories?.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: '12px', background: 'white', minWidth: '100px' }}
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="normal">ปกติ</option>
          <option value="low">ต่ำกว่า Min</option>
          <option value="rop">ต่ำกว่า ROP</option>
          <option value="out">หมดสต็อก</option>
        </select>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>
            {fmtN(filteredSummary.count)} รายการ · ฿{fmtN(filteredSummary.totalStockValueCost)}
          </span>
          <button onClick={handleExport} style={{
            background: 'white', border: '1px solid #CCDFF1', borderRadius: '8px', padding: '6px 12px',
            fontFamily: 'Kanit', fontSize: '12px', color: '#2A6AAA', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}><Download size={14} /> Excel</button>
          <button onClick={() => handlePrint()} style={{
            background: 'white', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '6px 12px',
            fontFamily: 'Kanit', fontSize: '12px', color: '#7c3aed', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}><Printer size={14} /> พิมพ์</button>
          <button
            onClick={() => setShowRepairAllModal(true)}
            title="ตรวจสอบ transaction ทุกสินค้า แล้วปรับยอด Lot ให้ตรงยอดคำนวณ"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none', borderRadius: '8px', padding: '6px 14px',
              fontFamily: 'Kanit', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              boxShadow: '0 2px 6px rgba(217,119,6,0.3)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(217,119,6,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(217,119,6,0.3)' }}
          ><Wrench size={14} /> ซ่อมแซม Lot ทุกสินค้า</button>
        </div>
      </div>

      {/* Data Table */}
      <div style={{
        background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Kanit', color: '#94a3b8' }}>
            <div className="spinner-border spinner-border-sm me-2" /> กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '50vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc' }}>
                <tr>
                  <th style={thStyle} />
                  <th style={{ ...thStyle, cursor: 'pointer', minWidth: '60px' }} onClick={() => handleSort('code')}>
                    รหัส <SortIcon field="code" />
                  </th>
                  <th style={{ ...thStyle, cursor: 'pointer', minWidth: '180px', textAlign: 'left' }} onClick={() => handleSort('name')}>
                    ชื่อสินค้า <SortIcon field="name" />
                  </th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('group')}>
                    กลุ่ม <SortIcon field="group" />
                  </th>
                  <th style={thStyle}>หน่วย</th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('balance')}>
                    คงเหลือ <SortIcon field="balance" />
                  </th>
                  <th style={thStyle}>ต้นทุน</th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('value')}>
                    มูลค่า(ทุน) <SortIcon field="value" />
                  </th>
                  <th style={thStyle}>ราคาขาย</th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('profit')}>
                    กำไร <SortIcon field="profit" />
                  </th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('profitPct')}>
                    %กำไร <SortIcon field="profitPct" />
                  </th>
                  <th style={thStyle}>Min</th>
                  <th style={thStyle}>Max</th>
                  <th style={thStyle}>ROP</th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('status')}>
                    สถานะ <SortIcon field="status" />
                  </th>
                  <th style={thStyle}>Lots</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan={16} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <Package size={40} style={{ opacity: 0.3, marginBottom: '8px' }} /><br />ไม่พบข้อมูลสินค้า
                  </td></tr>
                ) : (
                  visibleProducts.map((p) => (
                    <React.Fragment key={p.id}>
                      <tr
                        onClick={() => setExpandedRow(expandedRow === p.id ? null : p.id)}
                        style={{
                          cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                          background: expandedRow === p.id ? '#F3F8FC' : 'white',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (expandedRow !== p.id) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { if (expandedRow !== p.id) e.currentTarget.style.background = 'white' }}
                      >
                        <td style={{ ...tdStyle, width: '24px', textAlign: 'center' }}>
                          <ChevronRight size={12} style={{ color: '#94a3b8', transition: 'transform 0.2s', transform: expandedRow === p.id ? 'rotate(90deg)' : 'none' }} />
                        </td>
                        <td style={{ ...tdStyle, color: '#6366f1', fontWeight: 600, fontSize: '11px' }}>{p.code}</td>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.name}>
                          {p.name}
                          {p.hasNearExpiry && <AlertTriangle size={10} style={{ color: '#f59e0b', marginLeft: '4px', verticalAlign: 'middle' }} />}
                        </td>
                        <td style={{ ...tdStyle, fontSize: '10px', color: '#64748b' }}>{p.group}</td>
                        <td style={{ ...tdStyle, fontSize: '11px' }}>{p.unit}</td>
                        <td style={{ ...tdStyle, fontFamily: 'Kanit_B', fontSize: '14px', color: p.balance <= 0 ? '#dc2626' : p.balance <= (p.rop || p.min) ? '#ea580c' : '#334155' }}>
                          {fmtN2(p.balance)}
                        </td>
                        <td style={{ ...tdStyle, fontSize: '11px' }}>{fmtN2(p.costActual)}</td>
                        <td style={{ ...tdStyle, fontFamily: 'Kanit_B', color: '#2A6AAA', fontSize: '11px' }}>{fmtN(p.stockValueCost)}</td>
                        <td style={{ ...tdStyle, fontSize: '11px' }} onClick={e => e.stopPropagation()}>
                          {editPriceId === p.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={editPriceValue}
                                autoFocus
                                onChange={e => setEditPriceValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEditPrice(); if (e.key === 'Escape') cancelEditPrice() }}
                                style={{ width: '70px', padding: '2px 6px', borderRadius: '6px', border: '1.5px solid #6366f1', fontFamily: 'Kanit', fontSize: '11px', textAlign: 'right', outline: 'none' }}
                              />
                              <button onClick={saveEditPrice} disabled={savingPrice} title="บันทึก"
                                style={{ border: 'none', background: '#6366f1', color: '#fff', borderRadius: '5px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', opacity: savingPrice ? 0.6 : 1 }}>
                                {savingPrice ? '...' : '✓'}
                              </button>
                              <button onClick={cancelEditPrice} disabled={savingPrice} title="ยกเลิก"
                                style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: '5px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => startEditPrice(p)}
                              title="คลิกเพื่อแก้ไขราคาขาย"
                              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '1px 6px', borderRadius: '5px', transition: 'background 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              {fmtN2(p.price)}
                              <span style={{ fontSize: '9px', color: '#6366f1' }}>✏️</span>
                            </span>
                          )}
                        </td>
                        {(() => {
                          const profit = p.price - p.costActual
                          const profitPct = p.price > 0 ? (profit / p.price) * 100 : 0
                          const profitColor = profit > 0 ? '#147F56' : profit < 0 ? '#dc2626' : '#64748b'
                          return (
                            <>
                              <td style={{ ...tdStyle, fontSize: '11px', fontFamily: 'Kanit_B', color: profitColor }}>{fmtN2(profit)}</td>
                              <td style={{ ...tdStyle, fontSize: '11px', color: profitColor }}>{p.price > 0 ? `${profitPct.toFixed(1)}%` : '-'}</td>
                            </>
                          )
                        })()}
                        <td style={{ ...tdStyle, fontSize: '11px', color: '#64748b' }}>{p.min || '-'}</td>
                        <td style={{ ...tdStyle, fontSize: '11px', color: '#64748b' }}>{p.max || '-'}</td>
                        <td style={{ ...tdStyle, fontSize: '11px', color: '#64748b' }}>{p.rop || '-'}</td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                            background: statusConfig[p.status]?.bg || '#f1f5f9',
                            color: statusConfig[p.status]?.color || '#64748b',
                            border: `1px solid ${statusConfig[p.status]?.border || '#e2e8f0'}`,
                          }}>
                            {statusConfig[p.status]?.label || p.status}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '11px', color: '#6366f1' }}>{p.lotCount}</td>
                      </tr>

                      {/* Expanded Lot Detail */}
                      {expandedRow === p.id && p.lots.length > 0 && (
                        <tr>
                          <td colSpan={16} style={{ padding: 0 }}>
                            <div style={{ background: '#F3F8FC', padding: '8px 16px 8px 40px', borderBottom: '2px solid #CCDFF1' }}>
                              <div style={{ fontFamily: 'Kanit_B', fontSize: '11px', color: '#1E5088', marginBottom: '6px' }}>
                                รายละเอียด Lot — {p.name}
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead>
                                  <tr style={{ background: '#E5EEF8' }}>
                                    <th style={lotThStyle}>Lot No.</th>
                                    <th style={lotThStyle}>วันหมดอายุ</th>
                                    <th style={lotThStyle}>รับ</th>
                                    <th style={lotThStyle}>คงเหลือ</th>
                                    <th style={lotThStyle}>ต้นทุน/หน่วย</th>
                                    <th style={lotThStyle}>มูลค่า</th>
                                    <th style={lotThStyle}>ผู้ขาย</th>
                                    <th style={lotThStyle}>วันที่รับเข้า</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.lots.map((lot, li) => {
                                    const isExpiringSoon = lot.dateExp && new Date(lot.dateExp) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                                    const isExpired = lot.dateExp && new Date(lot.dateExp) < new Date()
                                    return (
                                      <tr key={li} style={{ borderBottom: '1px solid #E5EEF8' }}>
                                        <td style={lotTdStyle}>{lot.lot || '-'}</td>
                                        <td style={{ ...lotTdStyle, color: isExpired ? '#dc2626' : isExpiringSoon ? '#ea580c' : '#334155', fontWeight: isExpiringSoon ? 600 : 400 }}>
                                          {lot.dateExp ? new Date(lot.dateExp).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                          {isExpired && <span style={{ marginLeft: '4px', fontSize: '9px', background: '#fee2e2', color: '#dc2626', padding: '1px 4px', borderRadius: '4px' }}>หมดอายุ</span>}
                                          {!isExpired && isExpiringSoon && <span style={{ marginLeft: '4px', fontSize: '9px', background: '#ffedd5', color: '#ea580c', padding: '1px 4px', borderRadius: '4px' }}>ใกล้หมด</span>}
                                        </td>
                                        <td style={{ ...lotTdStyle, color: '#2A6AAA', fontWeight: 600 }}>{fmtN2(lot.received || 0)}</td>
                                        <td style={{ ...lotTdStyle, fontWeight: 600 }}>{fmtN2(lot.balance)}</td>
                                        <td style={lotTdStyle}>
                                          {editCostLotId === lot.id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                              <input
                                                type="number"
                                                step="0.01"
                                                value={editCostValue}
                                                autoFocus
                                                onChange={e => setEditCostValue(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') saveEditCost(); if (e.key === 'Escape') cancelEditCost() }}
                                                style={{ width: '70px', padding: '2px 6px', borderRadius: '6px', border: '1.5px solid #3E86C7', fontFamily: 'Kanit', fontSize: '11px', textAlign: 'right', outline: 'none' }}
                                              />
                                              <button onClick={saveEditCost} disabled={savingCost} title="บันทึก"
                                                style={{ border: 'none', background: '#3E86C7', color: '#fff', borderRadius: '5px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', opacity: savingCost ? 0.6 : 1 }}>
                                                {savingCost ? '...' : '✓'}
                                              </button>
                                              <button onClick={cancelEditCost} disabled={savingCost} title="ยกเลิก"
                                                style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: '5px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>
                                                ✕
                                              </button>
                                            </div>
                                          ) : (
                                            <span
                                              onClick={() => startEditCost(lot)}
                                              title="คลิกเพื่อแก้ไขราคาทุน"
                                              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '1px 6px', borderRadius: '5px', transition: 'background 0.15s' }}
                                              onMouseEnter={e => { e.currentTarget.style.background = '#E5EEF8' }}
                                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                            >
                                              {fmtN2(lot.cost)}
                                              <span style={{ fontSize: '9px', color: '#3E86C7' }}>✏️</span>
                                            </span>
                                          )}
                                        </td>
                                        <td style={{ ...lotTdStyle, color: '#2A6AAA', fontWeight: 600 }}>{fmtN(Math.round(lot.balance * lot.cost))}</td>
                                        <td style={{ ...lotTdStyle, fontSize: '10px', color: '#64748b' }}>{lot.vendor || '-'}</td>
                                        <td style={lotTdStyle}>{lot.dateRC ? new Date(lot.dateRC).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedRow === p.id && p.lots.length === 0 && (
                        <tr>
                          <td colSpan={16} style={{ padding: 0 }}>
                            <div style={{ background: '#F3F8FC', padding: '12px 16px 12px 40px', borderBottom: '2px solid #CCDFF1', textAlign: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                              ไม่มีข้อมูล Lot
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
            {/* ✅ Pagination footer */}
            {filteredProducts.length > visibleCount && (
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                padding: '12px', borderTop: '1px solid #f1f5f9', background: '#fafbfc',
              }}>
                <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b' }}>
                  แสดง {fmtN(visibleCount)} / {fmtN(filteredProducts.length)} รายการ
                </span>
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white',
                    border: 'none', borderRadius: '8px', padding: '6px 16px',
                    fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(99,102,241,0.25)',
                  }}>
                  โหลดเพิ่มอีก {fmtN(Math.min(PAGE_SIZE, filteredProducts.length - visibleCount))} รายการ
                </button>
                <button
                  onClick={() => setVisibleCount(filteredProducts.length)}
                  style={{
                    background: 'white', color: '#6366f1',
                    border: '1px solid #c7d2fe', borderRadius: '8px', padding: '6px 14px',
                    fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer',
                  }}>
                  แสดงทั้งหมด
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Print Layout (hidden) */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} style={{ padding: '20px', fontFamily: 'Kanit, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{storeName || 'รายงานสินค้าคงคลัง'}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>รายงานสินค้าคงคลัง</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            {summary && (
              <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px' }}>
                SKU ทั้งหมด: {fmtN(summary.totalSKU)} | มูลค่ารวม: ฿{fmtN(summary.totalStockValueCost)} | หมดสต็อก: {fmtN(summary.outOfStockCount)}
              </div>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={printThStyle}>รหัส</th>
                <th style={{ ...printThStyle, textAlign: 'left' }}>ชื่อสินค้า</th>
                <th style={printThStyle}>กลุ่ม</th>
                <th style={printThStyle}>หน่วย</th>
                <th style={printThStyle}>คงเหลือ</th>
                <th style={printThStyle}>ต้นทุน</th>
                <th style={printThStyle}>มูลค่า(ทุน)</th>
                <th style={printThStyle}>ราคาขาย</th>
                <th style={printThStyle}>Min</th>
                <th style={printThStyle}>Max</th>
                <th style={printThStyle}>ROP</th>
                <th style={printThStyle}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={printTdStyle}>{p.code}</td>
                  <td style={{ ...printTdStyle, textAlign: 'left' }}>{p.name}</td>
                  <td style={printTdStyle}>{p.group}</td>
                  <td style={printTdStyle}>{p.unit}</td>
                  <td style={{ ...printTdStyle, fontWeight: 600 }}>{fmtN2(p.balance)}</td>
                  <td style={printTdStyle}>{fmtN2(p.costActual)}</td>
                  <td style={{ ...printTdStyle, fontWeight: 600 }}>{fmtN(p.stockValueCost)}</td>
                  <td style={printTdStyle}>{fmtN2(p.price)}</td>
                  <td style={printTdStyle}>{p.min || '-'}</td>
                  <td style={printTdStyle}>{p.max || '-'}</td>
                  <td style={printTdStyle}>{p.rop || '-'}</td>
                  <td style={printTdStyle}>{statusConfig[p.status]?.label || p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '12px', fontSize: '11px', textAlign: 'right', color: '#64748b' }}>
            แสดง {fmtN(filteredProducts.length)} รายการ · มูลค่ารวม ฿{fmtN(filteredSummary.totalStockValueCost)}
          </div>
        </div>
      </div>

      {/* Modal ซ่อมแซม Lot ทุกสินค้า */}
      <LotRepairAllModal
        show={showRepairAllModal}
        onClose={() => {
          setShowRepairAllModal(false)
          if (repairedSomething) { setRepairedSomething(false); fetchData() }
        }}
        company={getLocalStorageItem('company_')}
        onComplete={() => setRepairedSomething(true)}
      />
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color, subValue }: { icon: any; label: string; value: string; color: string; subValue?: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: '10px', padding: '6px 10px',
      border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <div style={{ background: `${color}15`, borderRadius: '8px', padding: '6px', display: 'flex', flexShrink: 0 }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.1 }}>
        <span style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <span style={{ fontFamily: 'Kanit_B', fontSize: '16px', color: '#1e293b' }}>{value}</span>
        {subValue && <span style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subValue}</span>}
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 6px',
  fontWeight: 600,
  fontSize: '11px',
  color: '#64748b',
  textAlign: 'center',
  borderBottom: '2px solid #e2e8f0',
  whiteSpace: 'nowrap',
  userSelect: 'none',
}

const tdStyle: React.CSSProperties = {
  padding: '6px',
  textAlign: 'center',
  color: '#334155',
  fontSize: '12px',
}

const lotThStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontWeight: 600,
  fontSize: '10px',
  color: '#1E5088',
  textAlign: 'center',
  borderBottom: '1px solid #CCDFF1',
}

const lotTdStyle: React.CSSProperties = {
  padding: '4px 8px',
  textAlign: 'center',
  color: '#334155',
  fontSize: '11px',
}

const printThStyle: React.CSSProperties = {
  padding: '4px 3px',
  fontWeight: 600,
  fontSize: '9px',
  color: '#334155',
  textAlign: 'center',
  borderBottom: '2px solid #94a3b8',
}

const printTdStyle: React.CSSProperties = {
  padding: '3px',
  textAlign: 'center',
  fontSize: '9px',
  color: '#334155',
}
