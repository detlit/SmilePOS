'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BarChart3, CheckCircle2, Layers3, Plus, RefreshCw, Save, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'

type ProductRow = {
  id: number
  code?: string
  ProductName?: string
  Barcode?: string
  Unit?: string
  price?: number
  wholesaleprice?: number
  online?: number
  PriceA?: number
  PriceB?: number
  CostActual?: number
  fixname?: string
  group?: string
  Category?: string
  Show?: string
}

type UnitConversionRow = {
  id: number
  company?: string
  productCode?: string
  saleUnit?: string
  subQty?: number
  subUnit?: string
  priceRetail?: number
  Barcode?: string
}

type DrugSetItem = {
  id?: number
  productId?: number
  code?: string
  name?: string
  fixname?: string
  drugGroup?: string
  barcode?: string
  unit?: string
  qty?: number
  salePrice?: number
  cost?: number
  sortOrder?: number
  // หน่วยแปลงที่เลือกให้รายการนี้ (null/0 = หน่วยฐานของสินค้า)
  unitConversionId?: number | null
  saleUnit?: string
  subQty?: number
  // ราคาขายเฉพาะชุดนี้ (null = ใช้ราคาปกติตอนขาย)
  priceOverride?: number | null
  product?: ProductRow | null
}

type DrugSet = {
  id: number
  company?: string
  name: string
  description?: string
  status?: string
  items?: DrugSetItem[]
}

const panelStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  background: '#fff',
  borderRadius: 8,
  overflow: 'hidden',
}

const formatMoney = (value: unknown) => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatPercent = (value: unknown) => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
// จำนวนในชุดเป็นทศนิยมได้ จึงตัดศูนย์ท้ายทิ้งเพื่อให้อ่านง่าย (1, 1.5, 0.25)
const formatQty = (value: unknown) => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
const toNumber = (value: unknown) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}
const cleanSubQty = (value: unknown) => {
  const subQty = Number(value)
  return Number.isFinite(subQty) && subQty > 0 ? subQty : 1
}
const BASE_UNIT_CHOICE = 0
// ข้อความในช่องเลือกหน่วยต้องสั้น เพราะ <select> โชว์ข้อความของตัวเลือกที่เลือกอยู่ ถ้ายาวจะถูกตัดจนอ่านไม่ออก
const unitConversionOptionLabel = (unitConversion: UnitConversionRow) =>
  `${unitConversion.saleUnit || 'หน่วยแปลง'} ×${formatQty(cleanSubQty(unitConversion.subQty))}`

const isProductHidden = (product: ProductRow) => String(product.Show || '').toLowerCase() === 'true'

const getProductName = (product: ProductRow | DrugSetItem) => String((product as ProductRow).ProductName ?? (product as DrugSetItem).name ?? '')
const getProductCode = (product: ProductRow | DrugSetItem) => String((product as ProductRow).code ?? (product as DrugSetItem).code ?? '')
const getProductBarcode = (product: ProductRow | DrugSetItem) => String((product as ProductRow).Barcode ?? (product as DrugSetItem).barcode ?? '')
const getProductUnit = (product: ProductRow | DrugSetItem) => String((product as ProductRow).Unit ?? (product as DrugSetItem).unit ?? '')
const getProductFixname = (product: ProductRow | DrugSetItem) => String((product as ProductRow).fixname ?? (product as DrugSetItem).fixname ?? '')
const getProductGroup = (product: ProductRow | DrugSetItem) => String((product as ProductRow).group ?? (product as DrugSetItem).drugGroup ?? '')
const getProductPrice = (product: ProductRow | DrugSetItem) => toNumber((product as ProductRow).price ?? (product as DrugSetItem).salePrice)
const getProductCost = (product: ProductRow | DrugSetItem) => toNumber((product as ProductRow).CostActual ?? (product as DrugSetItem).cost)
const getProfit = (product: ProductRow | DrugSetItem) => getProductPrice(product) - getProductCost(product)
const getProfitPercent = (product: ProductRow | DrugSetItem) => {
  const cost = getProductCost(product)
  if (cost <= 0) return 0
  return (getProfit(product) / cost) * 100
}

// ราคา/ทุน/หน่วย ของสินค้าเมื่อคิดตามหน่วยแปลงที่เลือก (ไม่เลือก = หน่วยฐาน)
// หน่วยแปลงที่ยังไม่ได้ตั้งราคาขาย ให้ประมาณจากราคาหน่วยฐาน x subQty แทนการโชว์ 0 (ซึ่งทำให้กำไรติดลบเท่าทุน)
const applyUnitConversion = (product: ProductRow, unitConversion: UnitConversionRow | null): ProductRow => {
  if (!unitConversion) return product
  const subQty = cleanSubQty(unitConversion.subQty)
  const unitPrice = toNumber(unitConversion.priceRetail)
  return {
    ...product,
    Unit: String(unitConversion.saleUnit || product.Unit || ''),
    Barcode: String(unitConversion.Barcode || product.Barcode || ''),
    price: unitPrice > 0 ? unitPrice : getProductPrice(product) * subQty,
    CostActual: getProductCost(product) * subQty,
  }
}

function makeDraftItem(product: ProductRow, sortOrder: number, qty = 1, unitConversion: UnitConversionRow | null = null): DrugSetItem {
  const converted = applyUnitConversion(product, unitConversion)
  return {
    productId: Number(product.id),
    code: String(product.code || ''),
    name: String(product.ProductName || ''),
    fixname: String(product.fixname || ''),
    drugGroup: String(product.group || ''),
    barcode: String(converted.Barcode || ''),
    unit: String(converted.Unit || ''),
    unitConversionId: unitConversion ? Number(unitConversion.id) : null,
    saleUnit: unitConversion ? String(unitConversion.saleUnit || '') : '',
    subQty: unitConversion ? cleanSubQty(unitConversion.subQty) : 1,
    qty,
    priceOverride: null,
    salePrice: getProductPrice(converted),
    cost: getProductCost(converted),
    sortOrder,
    product,
  }
}

type DrugSetPageProps = {
  isModal?: boolean
  onClose?: () => void
}

export default function DrugSetPage({ isModal = false, onClose }: DrugSetPageProps) {
  const [company, setCompany] = useState('')
  const [products, setProducts] = useState<ProductRow[]>([])
  const [unitConversions, setUnitConversions] = useState<UnitConversionRow[]>([])
  // หน่วยที่เลือกไว้ในตารางรายการสินค้า: key = product.id, value = UnitConversion.id (0 = หน่วยฐาน)
  const [unitChoice, setUnitChoice] = useState<Record<number, number>>({})
  const [drugSets, setDrugSets] = useState<DrugSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [items, setItems] = useState<DrugSetItem[]>([])
  const [search, setSearch] = useState('')
  const [compareItems, setCompareItems] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const deferredSearch = React.useDeferredValue(search)

  const loadData = useCallback(async () => {
    const companyCode = localStorage.getItem('company_') || ''
    setCompany(companyCode)
    setLoading(true)
    try {
      const [productRes, setRes, unitRes] = await Promise.all([
        axios.get(`/api/datalist?company=${companyCode}&fields=drug-set`),
        axios.get(`/api/drug-set?company=${companyCode}`),
        axios.get(`/api/unitconversion?company=${companyCode}`),
      ])
      setProducts(Array.isArray(productRes.data) ? productRes.data : [])
      setDrugSets(Array.isArray(setRes.data) ? setRes.data : [])
      setUnitConversions(Array.isArray(unitRes.data) ? unitRes.data : [])
    } catch (error) {
      console.error(error)
      setNotice('โหลดข้อมูลจัดชุดสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredProducts = useMemo(() => {
    const query = deferredSearch.toLowerCase().trim()
    const visibleProducts = products.filter((product) => !isProductHidden(product))
    if (!query) return visibleProducts.slice(0, 80)
    return visibleProducts.filter((product) => {
      const fields = [
        product.ProductName,
        product.fixname,
        product.group,
        product.Category,
        product.code,
        product.Barcode,
      ].map((value) => String(value || '').toLowerCase())
      return fields.some((value) => value.includes(query))
    }).slice(0, 80)
  }, [deferredSearch, products])

  // หน่วยแปลงจัดกลุ่มตามรหัสสินค้า เพื่อทำ dropdown เลือกหน่วยในตารางรายการสินค้า
  const unitConversionByCode = useMemo(() => {
    const map = new Map<string, UnitConversionRow[]>()
    unitConversions.forEach((unitConversion) => {
      const code = String(unitConversion.productCode || '')
      if (!code) return
      const rows = map.get(code)
      if (rows) rows.push(unitConversion)
      else map.set(code, [unitConversion])
    })
    return map
  }, [unitConversions])

  const unitConversionById = useMemo(() => {
    const map = new Map<number, UnitConversionRow>()
    unitConversions.forEach((unitConversion) => map.set(Number(unitConversion.id), unitConversion))
    return map
  }, [unitConversions])

  const getSelectedUnitConversion = (product: ProductRow) => {
    const choice = Number(unitChoice[Number(product.id)] || BASE_UNIT_CHOICE)
    if (!choice) return null
    return unitConversionById.get(choice) || null
  }

  const summary = useMemo(() => {
    return items.reduce<{ qty: number; sale: number; cost: number }>((acc, item) => {
      const qty = toNumber(item.qty || 1)
      const price = getProductPrice(item)
      const cost = getProductCost(item)
      acc.qty += qty
      acc.sale += price * qty
      acc.cost += cost * qty
      return acc
    }, { qty: 0, sale: 0, cost: 0 })
  }, [items])
  const summaryProfit = summary.sale - summary.cost
  const summaryProfitPercent = summary.cost > 0 ? (summaryProfit / summary.cost) * 100 : 0

  const resetForm = () => {
    setSelectedSetId(null)
    setName('')
    setDescription('')
    setStatus('active')
    setItems([])
    setCompareItems([])
    setNotice('')
  }

  const editSet = (drugSet: DrugSet) => {
    setSelectedSetId(drugSet.id)
    setName(drugSet.name || '')
    setDescription(drugSet.description || '')
    setStatus(drugSet.status || 'active')
    setItems((drugSet.items || []).map((item, index) => ({ ...item, sortOrder: index })))
    setNotice('')
  }

  // สินค้าเดียวกันคนละหน่วยแปลง = คนละรายการในชุด (ราคา/ทุนต่อหน่วยไม่เท่ากัน)
  const addProductToSet = (product: ProductRow, unitConversion: UnitConversionRow | null = null) => {
    const unitConversionId = unitConversion ? Number(unitConversion.id) : null
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => Number(item.productId) === Number(product.id)
        && Number(item.unitConversionId || 0) === Number(unitConversionId || 0))
      if (existingIndex >= 0) {
        return prev.map((item, index) => index === existingIndex ? { ...item, qty: toNumber(item.qty || 1) + 1 } : item)
      }
      return [...prev, makeDraftItem(product, prev.length, 1, unitConversion)]
    })
  }

  const toggleCompare = (product: ProductRow) => {
    setCompareItems((prev) => {
      if (prev.some((item) => Number(item.id) === Number(product.id))) return prev.filter((item) => Number(item.id) !== Number(product.id))
      return [...prev, product]
    })
  }

  // แก้ไขทีละแถวด้วย index เพราะสินค้าเดียวกันมีได้หลายแถว (คนละหน่วย)
  const removeItemAt = (targetIndex: number) => {
    setItems((prev) => prev.filter((_, index) => index !== targetIndex).map((item, index) => ({ ...item, sortOrder: index })))
  }

  const updateQtyAt = (targetIndex: number, value: string) => {
    const qty = Number(value)
    setItems((prev) => prev.map((item, index) => index === targetIndex ? { ...item, qty: Number.isFinite(qty) && qty > 0 ? qty : 1 } : item))
  }

  // ราคาขายที่กำหนดเองในชุด — ค่าว่างคือกลับไปใช้ราคาปกติของสินค้า/หน่วยแปลง
  const updatePriceAt = (targetIndex: number, value: string) => {
    const trimmed = String(value ?? '').trim()
    setItems((prev) => prev.map((item, index) => {
      if (index !== targetIndex) return item
      if (trimmed === '') {
        const product = item.product || null
        const unitConversion = item.unitConversionId ? unitConversionById.get(Number(item.unitConversionId)) || null : null
        const basePrice = product ? getProductPrice(applyUnitConversion(product, unitConversion)) : toNumber(item.salePrice)
        return { ...item, priceOverride: null, salePrice: basePrice }
      }
      const price = Number(trimmed)
      if (!Number.isFinite(price) || price < 0) return item
      return { ...item, priceOverride: price, salePrice: price }
    }))
  }

  // เปลี่ยนหน่วยแปลงของรายการที่อยู่ในชุดแล้ว — ราคา/ทุนคิดใหม่ตามหน่วยใหม่ทั้งคู่
  // ราคาที่ผู้ใช้ตั้งเองไว้ต้องถูกล้างทิ้งด้วย เพราะเป็นราคาของ "หน่วยเดิม" ถ้าเก็บไว้จะกลายเป็น
  // ราคาต่อกล่องแต่ทุนต่อแพ็ค กำไรจะเพี้ยนทันที (ตั้งราคาเองใหม่ได้หลังเปลี่ยนหน่วย)
  const updateUnitConversionAt = (targetIndex: number, unitConversionIdValue: string) => {
    const unitConversionId = Number(unitConversionIdValue || BASE_UNIT_CHOICE)
    setItems((prev) => prev.map((item, index) => {
      if (index !== targetIndex) return item
      if (Number(item.unitConversionId || BASE_UNIT_CHOICE) === unitConversionId) return item
      const unitConversion = unitConversionId ? unitConversionById.get(unitConversionId) || null : null
      const product = item.product || null
      const converted = product ? applyUnitConversion(product, unitConversion) : null
      const subQty = unitConversion ? cleanSubQty(unitConversion.subQty) : 1
      return {
        ...item,
        unitConversionId: unitConversion ? Number(unitConversion.id) : null,
        saleUnit: unitConversion ? String(unitConversion.saleUnit || '') : '',
        subQty,
        unit: unitConversion ? String(unitConversion.saleUnit || '') : String(product?.Unit || item.unit || ''),
        barcode: converted ? String(converted.Barcode || '') : item.barcode,
        priceOverride: null,
        // ไม่มีข้อมูลสินค้าให้คิดใหม่ (สินค้าถูกลบ) → ถอดตัวคูณของหน่วยเดิมออกก่อนคูณด้วยหน่วยใหม่
        salePrice: converted ? getProductPrice(converted) : toNumber(item.salePrice) / cleanSubQty(item.subQty) * subQty,
        cost: converted ? getProductCost(converted) : toNumber(item.cost) / cleanSubQty(item.subQty) * subQty,
      }
    }))
  }

  const saveSet = async () => {
    if (!name.trim()) {
      setNotice('กรุณาตั้งชื่อชุดสินค้า')
      return
    }
    setSaving(true)
    try {
      const payload = {
        company,
        name: name.trim(),
        description: description.trim(),
        status,
        items: items.map((item, index) => ({ ...item, sortOrder: index, qty: toNumber(item.qty || 1) || 1 })),
      }
      const res = selectedSetId
        ? await axios.put(`/api/drug-set/${selectedSetId}`, payload)
        : await axios.post('/api/drug-set', payload)
      await loadData()
      editSet(res.data)
      setNotice('บันทึกชุดสินค้าเรียบร้อย')
    } catch (error: any) {
      console.error(error)
      setNotice(error?.response?.data?.error || 'บันทึกชุดสินค้าไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const deleteSet = async () => {
    if (!selectedSetId) return
    const ok = window.confirm('ต้องการลบชุดสินค้านี้หรือไม่')
    if (!ok) return
    setSaving(true)
    try {
      await axios.delete(`/api/drug-set/${selectedSetId}`)
      await loadData()
      resetForm()
      setNotice('ลบชุดสินค้าเรียบร้อย')
    } catch (error) {
      console.error(error)
      setNotice('ลบชุดสินค้าไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const productMetricCells = (product: ProductRow | DrugSetItem) => (
    <>
      <td style={{ textAlign: 'right', color: '#0f172a', fontFamily: 'Kanit_B' }}>{formatMoney(getProductPrice(product))}</td>
      <td style={{ textAlign: 'right', color: '#475569' }}>{formatMoney(getProductCost(product))}</td>
      <td style={{ textAlign: 'right', color: getProfit(product) >= 0 ? '#0F6845' : '#b91c1c', fontFamily: 'Kanit_B' }}>{formatMoney(getProfit(product))}</td>
      <td style={{ textAlign: 'right', color: getProfit(product) >= 0 ? '#0F6845' : '#b91c1c' }}>{formatPercent(getProfitPercent(product))}%</td>
    </>
  )

  return (
    <div style={{ height: isModal ? '84vh' : '78vh', padding: 12, background: '#f8fafc', fontFamily: 'Kanit', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ecfeff', border: '1px solid #a5f3fc', color: '#0891b2', display: 'grid', placeItems: 'center' }}>
            <Layers3 size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 16, color: '#0f172a' }}>จัดชุดสินค้า</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>สร้างกลุ่มสินค้าสำหรับขายและเปรียบเทียบราคาก่อนเพิ่มเข้าชุด</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {notice && <div style={{ fontSize: 12, color: notice.includes('สำเร็จ') || notice.includes('เรียบร้อย') ? '#0F6845' : '#b91c1c', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px' }}>{notice}</div>}
          <button type="button" onClick={loadData} style={toolbarButton('#f8fafc', '#334155', '#cbd5e1')} disabled={loading || saving}><RefreshCw size={14} />รีเฟรช</button>
          <button type="button" onClick={resetForm} style={toolbarButton('#fff', '#0f172a', '#cbd5e1')} disabled={saving}><Plus size={14} />ชุดใหม่</button>
          <button type="button" onClick={saveSet} style={toolbarButton('#2A6AAA', '#fff', '#2A6AAA')} disabled={saving}><Save size={14} />{saving ? 'กำลังบันทึก' : 'บันทึก'}</button>
          <button type="button" onClick={deleteSet} style={toolbarButton('#fef2f2', '#dc2626', '#fecaca')} disabled={!selectedSetId || saving}><Trash2 size={14} />ลบ</button>
          {onClose && <button type="button" onClick={onClose} style={toolbarButton('#fff', '#475569', '#cbd5e1')}><X size={14} />ปิด</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 10, height: 'calc(100% - 46px)' }}>
        <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#0f172a' }}>ชุดสินค้าที่บันทึก</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{drugSets.length} ชุด</span>
          </div>
          <div style={{ overflowY: 'auto', minHeight: 0 }}>
            {loading ? <div style={emptyStateStyle}>กำลังโหลด...</div> : drugSets.length === 0 ? <div style={emptyStateStyle}>ยังไม่มีชุดสินค้า</div> : drugSets.map((drugSet) => (
              <button
                type="button"
                key={drugSet.id}
                onClick={() => editSet(drugSet)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1px solid #f1f5f9',
                  background: selectedSetId === drugSet.id ? '#F3F8FC' : '#fff',
                  padding: '10px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Kanit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{drugSet.name}</span>
                  <span style={{ fontSize: 10, color: drugSet.status === 'active' ? '#0F6845' : '#64748b', border: `1px solid ${drugSet.status === 'active' ? '#A9E1C6' : '#e2e8f0'}`, background: drugSet.status === 'active' ? '#EDF9F3' : '#f8fafc', borderRadius: 999, padding: '1px 7px', whiteSpace: 'nowrap' }}>{drugSet.status === 'active' ? 'เปิด' : 'ปิด'}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>{drugSet.items?.length || 0} รายการ</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(390px, 0.9fr) minmax(520px, 1.1fr)', gap: 10, minHeight: 0 }}>
          <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#64748b' }} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหาชื่อทางการ, กลุ่มสินค้า, รหัส, ชื่อ, Barcode"
                  style={{ width: '100%', height: 34, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px 0 32px', fontFamily: 'Kanit', fontSize: 12, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
              {/* ล็อกความกว้างคอลัมน์ (table-layout: fixed) ให้ทุกคอลัมน์อยู่ในพาเนลโดยไม่มีแถบเลื่อนแนวนอน */}
              <table style={tableFixedStyle}>
                <colgroup>
                  <col />
                  <col style={{ width: 76 }} />
                  <col style={{ width: 54 }} />
                  <col style={{ width: 50 }} />
                  <col style={{ width: 48 }} />
                  <col style={{ width: 42 }} />
                  <col style={{ width: 72 }} />
                </colgroup>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc' }}>
                  <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={thLeft}>สินค้า</th>
                    <th style={thLeft}>หน่วย</th>
                    <th style={thRight}>ขาย</th>
                    <th style={thRight}>ทุน</th>
                    <th style={thRight}>กำไร</th>
                    <th style={thRight}>%</th>
                    <th style={thRight}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const compared = compareItems.some((item) => Number(item.id) === Number(product.id))
                    const productUnitConversions = unitConversionByCode.get(String(product.code || '')) || []
                    const selectedUnitConversion = getSelectedUnitConversion(product)
                    const convertedProduct = applyUnitConversion(product, selectedUnitConversion)
                    return (
                      <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9', background: compared ? '#F3F8FC' : '#fff' }}>
                        <td style={tdLeft}>
                          <div style={ellipsisTextStyle} title={product.ProductName}>{product.ProductName}</div>
                          <div style={metaTextStyle} title={[product.code, product.fixname, product.group].filter(Boolean).join(' • ')}>
                            <span>{product.code || '-'}</span>
                            <span>{product.fixname || '-'}</span>
                            <span>{product.group || '-'}</span>
                          </div>
                        </td>
                        <td style={tdLeft}>
                          {productUnitConversions.length === 0 ? (
                            <span style={{ color: '#64748b' }}>{product.Unit || '-'}</span>
                          ) : (
                            <select
                              value={String(selectedUnitConversion ? selectedUnitConversion.id : BASE_UNIT_CHOICE)}
                              onChange={(event) => setUnitChoice((prev) => ({ ...prev, [Number(product.id)]: Number(event.target.value) }))}
                              style={unitSelectStyle}
                              title={`เลือกหน่วยก่อนเพิ่มเข้าชุด (หน่วยฐาน: ${product.Unit || '-'})`}
                            >
                              <option value={BASE_UNIT_CHOICE}>{product.Unit || 'หน่วยฐาน'}</option>
                              {productUnitConversions.map((unitConversion) => (
                                <option key={unitConversion.id} value={unitConversion.id}>
                                  {unitConversionOptionLabel(unitConversion)}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        {productMetricCells(convertedProduct)}
                        <td style={{ ...tdRight, whiteSpace: 'nowrap', padding: '8px 4px' }}>
                          <button type="button" onClick={() => toggleCompare(product)} style={miniButton(compared ? '#2A6AAA' : '#f8fafc', compared ? '#fff' : '#334155', '#cbd5e1')} title="เปรียบเทียบ"><BarChart3 size={12} /></button>
                          <button type="button" onClick={() => addProductToSet(product, selectedUnitConversion)} style={miniButton('#2A6AAA', '#fff', '#2A6AAA')} title="เพิ่มเข้าชุด"><Plus size={12} /></button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredProducts.length === 0 && <tr><td colSpan={7} style={{ ...tdLeft, textAlign: 'center', color: '#94a3b8', padding: 28 }}>ไม่พบสินค้า</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={{ flex: '0 0 auto', borderTop: '1px solid #e2e8f0', background: '#f8fafc', maxHeight: 180, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', fontSize: 12, color: '#0f172a', fontFamily: 'Kanit_B' }}>
                <span>เปรียบเทียบก่อนเพิ่ม</span>
                {compareItems.length > 0 && <button type="button" onClick={() => setCompareItems([])} style={miniButton('#fff', '#64748b', '#cbd5e1')}><X size={12} /></button>}
              </div>
              {compareItems.length === 0 ? <div style={{ padding: '0 10px 10px', fontSize: 11, color: '#94a3b8' }}>เลือกปุ่มกราฟในรายการสินค้าเพื่อเปรียบเทียบ</div> : (
                <table style={tableFixedStyle}>
                  <colgroup>
                    <col />
                    <col style={{ width: 54 }} />
                    <col style={{ width: 50 }} />
                    <col style={{ width: 48 }} />
                    <col style={{ width: 42 }} />
                    <col style={{ width: 44 }} />
                  </colgroup>
                  <tbody>
                    {compareItems.map((product) => (
                      <tr key={product.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={tdLeft}><div style={ellipsisTextStyle} title={product.ProductName}>{product.ProductName}</div></td>
                        {productMetricCells(product)}
                        <td style={tdRight}><button type="button" onClick={() => addProductToSet(product, getSelectedUnitConversion(product))} style={miniButton('#2A6AAA', '#fff', '#2A6AAA')}><Plus size={12} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10 }}>
                <div>
                  <label style={labelStyle}>ชื่อชุดสินค้า</label>
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น ชุดแก้หวัดเด็ก" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>สถานะ</label>
                  <button type="button" onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')} style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: status === 'active' ? '#0F6845' : '#64748b', background: status === 'active' ? '#EDF9F3' : '#f8fafc', cursor: 'pointer' }}>
                    {status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}{status === 'active' ? 'เปิดขาย' : 'ปิดใช้งาน'}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={labelStyle}>หมายเหตุ</label>
                <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="รายละเอียดภายในร้าน" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <SummaryBox label="จำนวน" value={formatQty(summary.qty)} suffix="ชิ้น" />
              <SummaryBox label="ราคาขาย" value={formatMoney(summary.sale)} suffix="บาท" />
              <SummaryBox label="ต้นทุน" value={formatMoney(summary.cost)} suffix="บาท" />
              <SummaryBox label="กำไร" value={`${formatMoney(summaryProfit)} (${formatPercent(summaryProfitPercent)}%)`} suffix="" positive={summaryProfit >= 0} />
            </div>

            <div style={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
              <table style={tableFixedStyle}>
                <colgroup>
                  <col />
                  <col style={{ width: 78 }} />
                  <col style={{ width: 66 }} />
                  <col style={{ width: 78 }} />
                  <col style={{ width: 52 }} />
                  <col style={{ width: 50 }} />
                  <col style={{ width: 44 }} />
                  <col style={{ width: 44 }} />
                </colgroup>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc' }}>
                  <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={thLeft}>สินค้าในชุด</th>
                    <th style={thLeft}>หน่วย</th>
                    <th style={thRight}>จำนวน</th>
                    <th style={thRight}>ขาย</th>
                    <th style={thRight}>ทุน</th>
                    <th style={thRight}>กำไร</th>
                    <th style={thRight}>%</th>
                    <th style={thRight}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, itemIndex) => {
                    const itemUnitConversions = unitConversionByCode.get(String(getProductCode(item) || '')) || []
                    const baseUnitLabel = String(item.product?.Unit || item.unit || 'หน่วยฐาน')
                    return (
                    <tr key={`${item.productId || item.id}-${item.unitConversionId || 0}-${itemIndex}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdLeft}>
                        <div style={ellipsisTextStyle} title={getProductName(item)}>{getProductName(item)}</div>
                        <div style={metaTextStyle} title={[getProductCode(item), getProductFixname(item), getProductGroup(item), getProductBarcode(item)].filter(Boolean).join(' • ')}>
                          <span>{getProductCode(item) || '-'}</span>
                          <span>{getProductFixname(item) || '-'}</span>
                          <span>{getProductGroup(item) || '-'}</span>
                          <span>{getProductBarcode(item) || '-'}</span>
                        </div>
                      </td>
                      <td style={tdLeft}>
                        {itemUnitConversions.length === 0 ? (
                          <span style={{ color: '#64748b' }}>{item.unit || '-'}</span>
                        ) : (
                          <select
                            value={String(item.unitConversionId || BASE_UNIT_CHOICE)}
                            onChange={(event) => updateUnitConversionAt(itemIndex, event.target.value)}
                            style={unitSelectStyle}
                            title={`หน่วยที่ใช้ขายในชุด (หน่วยฐาน: ${baseUnitLabel})`}
                          >
                            <option value={BASE_UNIT_CHOICE}>{baseUnitLabel}</option>
                            {itemUnitConversions.map((unitConversion) => (
                              <option key={unitConversion.id} value={unitConversion.id}>
                                {unitConversionOptionLabel(unitConversion)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={tdRight}>
                        <DecimalInput
                          value={item.qty ?? 1}
                          onCommit={(nextValue) => updateQtyAt(itemIndex, nextValue)}
                          style={{ width: '100%', height: 26, border: '1px solid #cbd5e1', borderRadius: 7, textAlign: 'center', fontFamily: 'Kanit_B', fontSize: 12 }}
                        />
                      </td>
                      <td style={tdRight}>
                        <DecimalInput
                          value={getProductPrice(item)}
                          onCommit={(nextValue) => updatePriceAt(itemIndex, nextValue)}
                          allowEmpty
                          title={item.priceOverride === null || item.priceOverride === undefined ? 'ราคาปกติของสินค้า — แก้ไขเพื่อใช้ราคาเฉพาะชุดนี้' : 'ราคาเฉพาะชุดนี้ (ลบให้ว่างเพื่อกลับไปใช้ราคาปกติ)'}
                          style={{
                            width: '100%',
                            height: 26,
                            border: `1px solid ${item.priceOverride === null || item.priceOverride === undefined ? '#cbd5e1' : '#f59e0b'}`,
                            background: item.priceOverride === null || item.priceOverride === undefined ? '#fff' : '#fffbeb',
                            borderRadius: 7,
                            textAlign: 'right',
                            padding: '0 6px',
                            fontFamily: 'Kanit_B',
                            fontSize: 12,
                            color: '#0f172a',
                          }}
                        />
                      </td>
                      <td style={{ textAlign: 'right', color: '#475569', padding: '8px 10px' }}>{formatMoney(getProductCost(item))}</td>
                      <td style={{ textAlign: 'right', padding: '8px 10px', color: getProfit(item) >= 0 ? '#0F6845' : '#b91c1c', fontFamily: 'Kanit_B' }}>{formatMoney(getProfit(item))}</td>
                      <td style={{ textAlign: 'right', padding: '8px 10px', color: getProfit(item) >= 0 ? '#0F6845' : '#b91c1c' }}>{formatPercent(getProfitPercent(item))}%</td>
                      <td style={tdRight}><button type="button" onClick={() => removeItemAt(itemIndex)} style={miniButton('#fef2f2', '#dc2626', '#fecaca')}><Trash2 size={12} /></button></td>
                    </tr>
                    )
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                        <CheckCircle2 size={22} style={{ marginBottom: 8 }} />
                        <div>ยังไม่มีสินค้าในชุด</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ช่องกรอกตัวเลขทศนิยม — เก็บข้อความที่พิมพ์ไว้ในตัวเอง เพื่อให้พิมพ์ "0.", "1.5" ได้โดยไม่ถูกปัดค่ากลับระหว่างพิมพ์
function DecimalInput({ value, onCommit, allowEmpty = false, style, title }: {
  value: number
  onCommit: (nextValue: string) => void
  allowEmpty?: boolean
  style?: React.CSSProperties
  title?: string
}) {
  const [text, setText] = useState(() => String(value ?? ''))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(value ?? ''))
  }, [value, focused])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return
    setText(raw)
    if (raw === '') {
      if (allowEmpty) onCommit('')
      return
    }
    if (Number.isFinite(Number(raw))) onCommit(raw)
  }

  return (
    <input
      value={text}
      title={title}
      inputMode="decimal"
      onFocus={(event) => { setFocused(true); event.target.select() }}
      onBlur={() => setFocused(false)}
      onChange={handleChange}
      style={style}
    />
  )
}

function SummaryBox({ label, value, suffix, positive = true }: { label: string, value: string, suffix: string, positive?: boolean }) {
  return (
    <div style={{ padding: '10px 12px', borderRight: '1px solid #e2e8f0', minWidth: 0 }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: positive ? '#0f172a' : '#b91c1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value} {suffix}</div>
    </div>
  )
}

const toolbarButton = (background: string, color: string, border: string): React.CSSProperties => ({
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: `1px solid ${border}`,
  borderRadius: 8,
  background,
  color,
  fontFamily: 'Kanit_B',
  fontSize: 12,
  padding: '0 11px',
  cursor: 'pointer',
})

const miniButton = (background: string, color: string, border: string): React.CSSProperties => ({
  width: 26,
  height: 26,
  display: 'inline-grid',
  placeItems: 'center',
  border: `1px solid ${border}`,
  borderRadius: 7,
  background,
  color,
  marginLeft: 4,
  cursor: 'pointer',
})

// ทุกตารางใช้ความกว้างคอลัมน์ตายตัว (คู่กับ <colgroup>) เพื่อไม่ให้ล้นออกนอกพาเนลจนมีแถบเลื่อนแนวนอน
const tableFixedStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }
const thLeft: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', fontFamily: 'Kanit_B', fontWeight: 600 }
const thRight: React.CSSProperties = { textAlign: 'right', padding: '8px 6px', fontFamily: 'Kanit_B', fontWeight: 600 }
const tdLeft: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', verticalAlign: 'middle', overflow: 'hidden' }
const tdRight: React.CSSProperties = { textAlign: 'right', padding: '8px 6px', verticalAlign: 'middle', overflow: 'hidden' }
// ชื่อสินค้า/บรรทัดรหัส ตัดด้วย ... แทนการดันตารางให้กว้าง (ดูข้อความเต็มได้จาก title)
const ellipsisTextStyle: React.CSSProperties = { fontFamily: 'Kanit_B', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const metaTextStyle: React.CSSProperties = { color: '#64748b', display: 'flex', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#475569', marginBottom: 4 }
const unitSelectStyle: React.CSSProperties = { width: '100%', height: 26, border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff', fontFamily: 'Kanit', fontSize: 11, color: '#0f172a', padding: '0 2px', outline: 'none' }
const inputStyle: React.CSSProperties = { width: '100%', height: 34, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px', fontFamily: 'Kanit', fontSize: 12, outline: 'none', background: '#fff' }
const emptyStateStyle: React.CSSProperties = { padding: 20, textAlign: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12 }