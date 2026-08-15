'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'
import { Plus, Printer, Wallet } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

type PurchaseCreditItem = {
  id: string
  name: string
  qty: string
  amount: string
}

type PurchaseReceiveRow = {
  id: number
  company?: string | null
  code?: string | null
  orderfull?: string | null
  names?: string | null
  invoice_No?: string | null
  tax_no?: string | null
  receive_date?: string | null
  tax_date?: string | null
  persons?: string | null
  statuss?: string | null
  totalRC?: number | null
  totalRCAll?: number | null
  purchase_credit_date?: string | null
  purchase_credit_number?: number | null
  purchase_credit_orderNo?: string | null
  purchase_credit_orderfull?: string | null
  purchase_credit_status?: string | null
  purchase_credit_person?: string | null
  purchase_credit_remark?: string | null
  purchase_credit_reference_no?: string | null
  purchase_credit_reference_book_no?: string | null
  purchase_credit_reason?: string | null
  purchase_credit_item_name?: string | null
  purchase_credit_item_qty?: number | null
  purchase_credit_items_json?: Array<{ id?: string; name?: string; qty?: number; amount?: number }>
  purchase_credit_original_amount?: number | null
  purchase_credit_correct_amount?: number | null
  purchase_credit_difference_amount?: number | null
  purchase_credit_reduce_amount?: number | null
  purchase_credit_vat_rate?: number | null
  purchase_credit_vat_amount?: number | null
  purchase_credit_net_total?: number | null
}

type PurchaseCreditNoteProps = {
  openReceiveId?: number | null
  onOpenReceiveHandled?: () => void
  onUpdated?: () => void
}

type StoreProfile = {
  namestore?: string | null
  address?: string | null
  tel?: string | null
  taxnumber?: string | null
  branchName?: string | null
}

type SupplierProfile = {
  code?: string | null
  names?: string | null
  tel?: string | null
  idcode?: string | null
  address?: string | null
  email?: string | null
}

type ReportParty = {
  title: string
  name: string
  subtitle?: string
  taxId: string
  address: string
  tel: string
  loading?: boolean
}

type ReportInfo = {
  label: string
  value: string
}

const PURCHASE_CREDIT_VAT_RATE = 7

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const formatCurrency = (value: number | null | undefined) => (
  roundCurrency(Number(value || 0)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
)

const formatQuantity = (value: number | string | null | undefined) => (
  roundCurrency(Number(value || 0)).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
)

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatText = (value: string | number | null | undefined, fallback = '-') => {
  const text = String(value ?? '').trim()
  return text === '' ? fallback : text
}

const toInputDateValue = (value?: string | Date | null) => {
  if (!value) return new Date().toISOString().slice(0, 10)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createItem = (overrides: Partial<PurchaseCreditItem> = {}): PurchaseCreditItem => ({
  id: overrides.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: overrides.name || '',
  qty: overrides.qty || '1',
  amount: overrides.amount || '',
})

const normalizeItems = (row?: PurchaseReceiveRow | null) => {
  const rawItems = Array.isArray(row?.purchase_credit_items_json) ? row?.purchase_credit_items_json : []
  if (rawItems.length > 0) {
    return rawItems.map((item, index) => createItem({
      id: String(item?.id || `${Date.now()}-${index}`),
      name: String(item?.name || ''),
      qty: String(item?.qty ?? '1'),
      amount: String(item?.amount ?? ''),
    }))
  }
  if (row?.purchase_credit_item_name || row?.purchase_credit_item_qty || row?.purchase_credit_difference_amount) {
    return [createItem({
      name: String(row?.purchase_credit_item_name || ''),
      qty: String(row?.purchase_credit_item_qty ?? '1'),
      amount: String(row?.purchase_credit_difference_amount ?? row?.purchase_credit_reduce_amount ?? ''),
    })]
  }
  return [createItem()]
}

const getStatusStyles = (status?: string | null) => {
  if (status === 'อนุมัติ') return { background: '#D3F0E2', color: '#0C5238' }
  if (status === 'ยกเลิก') return { background: '#fee2e2', color: '#991b1b' }
  return { background: '#fef3c7', color: '#92400e' }
}

const getTodayOrderNo = () => {
  const date = new Date()
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
}

const getOrderNoFromInputDate = (value?: string | Date | null) => {
  if (!value) return getTodayOrderNo()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return getTodayOrderNo()
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
}

const composeStoreDisplayName = (store?: StoreProfile | null) => {
  const name = formatText(store?.namestore)
  const branchName = String(store?.branchName || '').trim()
  return branchName ? `${name} (${branchName})` : name
}

export default function PurchaseCreditNote({ openReceiveId, onOpenReceiveHandled, onUpdated }: PurchaseCreditNoteProps) {
  const [rows, setRows] = useState<PurchaseReceiveRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingRow, setEditingRow] = useState<PurchaseReceiveRow | null>(null)
  const [issueDate, setIssueDate] = useState(toInputDateValue(null))
  const [referenceNo, setReferenceNo] = useState('')
  const [referenceBookNo, setReferenceBookNo] = useState('')
  const [reason, setReason] = useState('')
  const [remark, setRemark] = useState('')
  const [person, setPerson] = useState('')
  const [originalAmountInput, setOriginalAmountInput] = useState('')
  const [items, setItems] = useState<PurchaseCreditItem[]>([createItem()])
  const [saving, setSaving] = useState(false)
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null)
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null)
  const [supplierLoading, setSupplierLoading] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const fetchRows = async () => {
    const company = localStorage.getItem('company_') || ''
    if (!company) return
    setLoading(true)
    try {
      const res = await axios.get(`/api/receive?company=${company}&sort=desc`)
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStoreProfile = async () => {
    const company = localStorage.getItem('company_') || ''
    if (!company) return

    try {
      const res = await axios.get(`/api/setting/store/store?company=${company}`)
      const store = Array.isArray(res.data) ? res.data[0] : null
      setStoreProfile(store ? {
        namestore: store.namestore,
        address: store.address,
        tel: store.tel,
        taxnumber: store.taxnumber,
        branchName: store.branchName,
      } : null)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchSupplierProfile = async (row: PurchaseReceiveRow) => {
    const company = row.company || localStorage.getItem('company_') || ''
    const params = new URLSearchParams()

    if (company) params.set('company', company)
    if (row.code) params.set('code', String(row.code))
    if (row.names) params.set('names', String(row.names))

    setSupplierLoading(true)
    try {
      const res = await axios.get(`/api/supplier?${params.toString()}`)
      const suppliers = Array.isArray(res.data) ? res.data : []
      const normalizedCode = String(row.code || '').trim().toLowerCase()
      const normalizedName = String(row.names || '').trim().toLowerCase()
      const supplier = suppliers.find((item: any) => normalizedCode && String(item?.code || '').trim().toLowerCase() === normalizedCode)
        || suppliers.find((item: any) => normalizedName && String(item?.names || '').trim().toLowerCase() === normalizedName)
        || suppliers[0]

      setSupplierProfile(supplier ? {
        code: supplier.code,
        names: supplier.names,
        tel: supplier.tel,
        idcode: supplier.idcode,
        address: supplier.address,
        email: supplier.email,
      } : null)
    } catch (error) {
      console.error(error)
      setSupplierProfile(null)
    } finally {
      setSupplierLoading(false)
    }
  }

  useEffect(() => {
    void fetchRows()
    void fetchStoreProfile()
  }, [])

  const sortedRows = useMemo(() => (
    [...rows].sort((left, right) => {
      const leftDate = new Date(left.purchase_credit_date || left.receive_date || 0).getTime()
      const rightDate = new Date(right.purchase_credit_date || right.receive_date || 0).getTime()
      return rightDate - leftDate
    })
  ), [rows])

  const openEditor = (row: PurchaseReceiveRow) => {
    setEditingRow(row)
    setIssueDate(toInputDateValue(row.purchase_credit_date || row.receive_date || null))
    setReferenceNo(String(row.purchase_credit_reference_no || row.tax_no || row.invoice_No || ''))
    setReferenceBookNo(String(row.purchase_credit_reference_book_no || ''))
    setReason(String(row.purchase_credit_reason || ''))
    setRemark(String(row.purchase_credit_remark || ''))
    setPerson(String(row.purchase_credit_person || row.persons || ''))
    const defaultOriginalAmount = row.purchase_credit_original_amount ?? row.totalRC ?? row.totalRCAll ?? 0
    setOriginalAmountInput(String(defaultOriginalAmount || ''))
    setItems(normalizeItems(row))
    setSupplierProfile({
      code: row.code || '',
      names: row.names || '',
      tel: '',
      idcode: '',
      address: '',
      email: '',
    })
    void fetchSupplierProfile(row)
    setShowEditor(true)
  }

  useEffect(() => {
    if (!openReceiveId) return
    const loadRow = async () => {
      try {
        const res = await axios.get(`/api/receive/${openReceiveId}`)
        if (res.data) openEditor(res.data)
      } catch (error) {
        console.error(error)
      } finally {
        onOpenReceiveHandled?.()
      }
    }
    loadRow()
  }, [openReceiveId, onOpenReceiveHandled])

  const originalAmount = roundCurrency(Number(originalAmountInput || 0))
  const filledItems = items.filter((item) => item.name.trim() !== '' || item.qty.trim() !== '' || item.amount.trim() !== '')
  const hasIncompleteItem = filledItems.some((item) => item.name.trim() === '' || Number(item.qty || 0) <= 0 || Number(item.amount || 0) <= 0)
  const validItems = filledItems.filter((item) => item.name.trim() !== '' && Number(item.qty || 0) > 0 && Number(item.amount || 0) > 0)
  const differenceAmount = roundCurrency(validItems.reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const correctAmount = roundCurrency(Math.max(originalAmount - differenceAmount, 0))
  const vatAmount = roundCurrency(differenceAmount > 0 ? (differenceAmount * PURCHASE_CREDIT_VAT_RATE) / 100 : 0)
  const netTotal = roundCurrency(differenceAmount + vatAmount)

  const canSave = referenceNo.trim() !== '' && reason.trim() !== '' && originalAmount > 0 && validItems.length > 0 && !hasIncompleteItem && differenceAmount > 0 && differenceAmount <= originalAmount

  const getNextNumber = (orderNo: string) => {
    const existing = rows
      .filter((row) => row.purchase_credit_orderNo === orderNo)
      .map((row) => Number(row.purchase_credit_number || 0))
      .filter((value) => value > 0)
    return existing.length > 0 ? Math.max(...existing) + 1 : 100
  }

  const updateItem = (itemId: string, field: keyof PurchaseCreditItem, value: string) => {
    setItems((prev) => prev.map((item) => item.id === itemId ? {
      ...item,
      [field]: field === 'qty' || field === 'amount' ? value.replace(/[^0-9.]/g, '') : value,
    } : item))
  }

  const addItem = () => setItems((prev) => [...prev, createItem()])

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.length === 1 ? [createItem()] : prev.filter((item) => item.id !== itemId))
  }

  const resolvedOrderNo = editingRow?.purchase_credit_orderNo || getOrderNoFromInputDate(issueDate)
  const resolvedNumber = editingRow?.purchase_credit_number || (editingRow ? getNextNumber(resolvedOrderNo) : 100)
  const previewDocumentNumber = editingRow
    ? (editingRow.purchase_credit_orderfull || `PCN${resolvedOrderNo}${resolvedNumber}`)
    : '-'
  const previewStatus = editingRow?.purchase_credit_status || 'รออนุมัติ'
  const previewStatusStyles = getStatusStyles(previewStatus)
  const reportItems = (validItems.length > 0 ? validItems : filledItems).map((item) => ({
    id: item.id,
    name: formatText(item.name),
    qty: formatQuantity(item.qty),
    amount: formatCurrency(Number(item.amount || 0)),
  }))

  const sellerCodeText = formatText(supplierProfile?.code || editingRow?.code, '')
  const sellerParty: ReportParty = {
    title: 'ผู้ขาย / ผู้ออกใบลดหนี้',
    name: formatText(supplierProfile?.names || editingRow?.names),
    subtitle: sellerCodeText ? `รหัสผู้ขาย: ${sellerCodeText}` : undefined,
    taxId: formatText(supplierProfile?.idcode),
    address: formatText(supplierProfile?.address),
    tel: formatText(supplierProfile?.tel),
    loading: supplierLoading,
  }

  const branchNameText = String(storeProfile?.branchName || '').trim()
  const buyerParty: ReportParty = {
    title: 'ผู้ซื้อ / ผู้รับใบลดหนี้',
    name: composeStoreDisplayName(storeProfile),
    subtitle: branchNameText ? `สาขา: ${branchNameText}` : 'ข้อมูลกิจการจากการตั้งค่าร้าน',
    taxId: formatText(storeProfile?.taxnumber),
    address: formatText(storeProfile?.address),
    tel: formatText(storeProfile?.tel),
  }

  const referenceItems: ReportInfo[] = [
    { label: 'เลขที่ใบกำกับภาษีเดิม', value: formatText(referenceNo || editingRow?.tax_no || editingRow?.invoice_No) },
    { label: 'เล่มที่', value: formatText(referenceBookNo, 'ไม่ระบุ') },
    { label: 'เลขที่ใบรับสินค้าอ้างอิง', value: editingRow ? `RC${editingRow.orderfull || editingRow.id}` : '-' },
    { label: 'วันที่รับสินค้า', value: formatDate(editingRow?.receive_date) },
    { label: 'เลขที่เอกสารผู้ขาย', value: formatText(editingRow?.invoice_No) },
    { label: 'วันที่ใบกำกับภาษีเดิม', value: formatDate(editingRow?.tax_date) },
    { label: 'จำนวนรายการลดหนี้', value: `${reportItems.length} รายการ` },
    { label: 'สถานะเอกสาร', value: previewStatus },
  ]

  const reactToPrintFn = useReactToPrint({
    contentRef: previewRef,
    documentTitle: previewDocumentNumber === '-' ? 'purchase-credit-note' : previewDocumentNumber,
    pageStyle: PURCHASE_CREDIT_REPORT_PRINT_PAGE_STYLE,
  })

  const saveNote = async (nextStatus?: string) => {
    if (!editingRow || !canSave || saving) return

    const orderNo = resolvedOrderNo
    const number = resolvedNumber
    const orderfull = previewDocumentNumber
    const persistedItems = validItems.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      qty: Number(item.qty || 0),
      amount: roundCurrency(Number(item.amount || 0)),
    }))

    setSaving(true)
    try {
      await axios.put(`/api/receive/${editingRow.id}`, {
        purchase_credit_date: new Date(issueDate),
        purchase_credit_number: number,
        purchase_credit_orderNo: orderNo,
        purchase_credit_orderfull: orderfull,
        purchase_credit_status: nextStatus || editingRow.purchase_credit_status || 'รออนุมัติ',
        purchase_credit_person: person.trim(),
        purchase_credit_remark: remark,
        purchase_credit_reference_no: referenceNo.trim(),
        purchase_credit_reference_book_no: referenceBookNo.trim(),
        purchase_credit_reason: reason.trim(),
        purchase_credit_item_name: persistedItems[0]?.name || '',
        purchase_credit_item_qty: Number(persistedItems[0]?.qty || 0),
        purchase_credit_items_json: persistedItems,
        purchase_credit_original_amount: originalAmount,
        purchase_credit_correct_amount: correctAmount,
        purchase_credit_difference_amount: differenceAmount,
        purchase_credit_reduce_amount: differenceAmount,
        purchase_credit_vat_rate: PURCHASE_CREDIT_VAT_RATE,
        purchase_credit_vat_amount: vatAmount,
        purchase_credit_net_total: netTotal,
      })
      setShowEditor(false)
      await fetchRows()
      onUpdated?.()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 mt-2" style={{ gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'kanit_B', fontSize: 18, color: '#1f2937' }}>ใบลดหนี้ซื้อ</div>
          <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#6b7280' }}>สร้างต่อจากใบรับสินค้าและกรอกรายการที่ต้องลดหนี้ด้วยตนเอง</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white' }}>
        <table className="table table-hover" style={{ marginBottom: 0, borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <td style={thStyle}>วันที่รับสินค้า</td>
              <td style={thStyle}>เลขที่ใบรับสินค้า</td>
              <td style={thStyle}>ผู้ขาย</td>
              <td style={thStyle}>เลขที่ใบลดหนี้ซื้อ</td>
              <td style={thStyle}>รายการลดหนี้</td>
              <td style={{ ...thStyle, textAlign: 'center' }}>ผลต่าง</td>
              <td style={{ ...thStyle, textAlign: 'center' }}>VAT 7%</td>
              <td style={{ ...thStyle, textAlign: 'center' }}>ยอดรวมสุทธิ</td>
              <td style={{ ...thStyle, textAlign: 'center' }}>สถานะ</td>
              <td style={{ ...thStyle, width: 120, textAlign: 'center' }}></td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={emptyStyle}>กำลังโหลด...</td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={10} style={emptyStyle}>ยังไม่มีข้อมูลใบรับสินค้า</td>
              </tr>
            ) : sortedRows.map((row) => {
              const statusStyles = getStatusStyles(row.purchase_credit_status)
              const hasNote = !!row.purchase_credit_status
              const firstItem = Array.isArray(row.purchase_credit_items_json) && row.purchase_credit_items_json.length > 0
                ? row.purchase_credit_items_json[0]?.name
                : row.purchase_credit_item_name
              const itemCount = Array.isArray(row.purchase_credit_items_json) ? row.purchase_credit_items_json.length : (row.purchase_credit_item_name ? 1 : 0)
              return (
                <tr key={row.id}>
                  <td style={tdStyle}>{formatDate(row.receive_date)}</td>
                  <td style={tdStyle}>RC{row.orderfull || row.id}</td>
                  <td style={tdStyle}>{row.names || '-'}</td>
                  <td style={tdStyle}>{row.purchase_credit_orderfull || '-'}</td>
                  <td style={tdStyle}>
                    <div>{firstItem || '-'}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{itemCount > 1 ? `${itemCount} รายการ` : `จำนวน ${formatQuantity(row.purchase_credit_item_qty || 0)}`}</div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{formatCurrency(row.purchase_credit_difference_amount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{formatCurrency(row.purchase_credit_vat_amount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{formatCurrency(row.purchase_credit_net_total)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontFamily: 'kanit_B', fontSize: 11, background: statusStyles.background, color: statusStyles.color }}>
                      {row.purchase_credit_status || 'ยังไม่สร้าง'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => openEditor(row)}
                      style={{
                        height: 30,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: `1px solid ${hasNote ? '#d97706' : '#ea580c'}`,
                        background: hasNote ? '#fff7ed' : '#fff7ed',
                        color: hasNote ? '#b45309' : '#c2410c',
                        fontFamily: 'kanit_B',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {hasNote ? 'แก้ไข' : 'สร้าง'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal show={showEditor} onHide={() => setShowEditor(false)} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center" style={{ gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #ea580c, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={18} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'kanit_B', fontSize: 16 }}>ใบลดหนี้ซื้อ</div>
                <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#6b7280' }}>{previewDocumentNumber !== '-' ? previewDocumentNumber : 'สร้างจากใบรับสินค้า'}</div>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#eef2f7' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={panelStyle}>
                <div style={panelTitleStyle}>ข้อมูลอ้างอิงตามเอกสารภาษี</div>
                <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b', marginBottom: 12 }}>ระบุเลขที่อ้างอิงของใบกำกับภาษีเดิมและผู้จัดทำรายการก่อนบันทึกหรือพิมพ์เอกสาร</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12 }}>
                  <div>
                    <div style={labelStyle}>เลขที่ใบกำกับภาษีเดิม</div>
                    <input className="form-control" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="เช่น TAX2026041201" style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>หมายเลขลำดับของเล่ม (ถ้ามี)</div>
                    <input className="form-control" value={referenceBookNo} onChange={(e) => setReferenceBookNo(e.target.value)} placeholder="เช่น เล่ม 1" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, marginTop: 12 }}>
                  <div>
                    <div style={labelStyle}>วันที่ออกเอกสาร</div>
                    <input type="date" className="form-control" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>ผู้จัดทำรายการ</div>
                    <input className="form-control" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="ชื่อผู้จัดทำเอกสาร" style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={panelStyle}>
                <div style={panelTitleStyle}>รายละเอียดใบลดหนี้ซื้อ</div>
                <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b', marginBottom: 12 }}>กรอกรายการที่ต้องลดหนี้ให้ครบ เพื่อให้ report แสดงรายการคืนสินค้าและยอดภาษีที่ลดลงอย่างถูกต้อง</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={labelStyle}>มูลค่าที่แสดงไว้ในใบกำกับภาษีเดิม</div>
                    <div className="input-group">
                      <input className="form-control" value={originalAmountInput} onChange={(e) => setOriginalAmountInput(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" style={moneyInputStyle} />
                      <span className="input-group-text" style={moneySuffixStyle}>บาท</span>
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>มูลค่าหลังปรับปรุง</div>
                    <div className="input-group">
                      <input className="form-control" value={formatCurrency(correctAmount)} disabled={true} style={{ ...moneyInputStyle, backgroundColor: '#f8fafc' }} />
                      <span className="input-group-text" style={moneySuffixStyle}>บาท</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8 }}>
                    <div style={labelStyle}>รายการที่ขอลดหนี้</div>
                    <button type="button" onClick={addItem} style={addButtonStyle}>
                      <Plus size={14} /> เพิ่มรายการ
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {items.map((item, index) => (
                      <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fafbfc' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 120px 180px 52px', gap: 10, alignItems: 'end' }}>
                          <div>
                            <div style={subLabelStyle}>รายการที่ {index + 1}</div>
                            <input className="form-control" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} placeholder="ชื่อสินค้า/บริการที่ขอลดหนี้" style={inputStyle} />
                          </div>
                          <div>
                            <div style={subLabelStyle}>จำนวน</div>
                            <input className="form-control" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} placeholder="1" style={inputStyle} />
                          </div>
                          <div>
                            <div style={subLabelStyle}>ยอดที่ลดลง</div>
                            <div className="input-group">
                              <input className="form-control" value={item.amount} onChange={(e) => updateItem(item.id, 'amount', e.target.value)} placeholder="0.00" style={moneyInputStyle} />
                              <span className="input-group-text" style={moneySuffixStyle}>บาท</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeItem(item.id)} style={removeButtonStyle}>-</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
                  <MetricCard label="มูลค่าที่ลดลง" value={formatCurrency(differenceAmount)} background="#fff7ed" color="#c2410c" />
                  <MetricCard label={`ภาษีมูลค่าเพิ่ม ${PURCHASE_CREDIT_VAT_RATE}%`} value={formatCurrency(vatAmount)} background="#F3F8FC" color="#173F6B" />
                  <MetricCard label="ยอดรวมสุทธิใบลดหนี้" value={formatCurrency(netTotal)} background="#fff7ed" color="#9a3412" />
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={labelStyle}>สาเหตุที่ลดหนี้</div>
                  <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="เช่น ส่งคืนสินค้า / ราคาผิด / รับสินค้าไม่ครบ" style={textareaStyle} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={labelStyle}>หมายเหตุเพิ่มเติม</div>
                  <textarea className="form-control" value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="ข้อความเพิ่มเติมสำหรับใช้ในเอกสาร" style={textareaStyle} />
                </div>
                {!canSave && (
                  <div style={warningStyle}>
                    ต้องกรอกเลขที่ใบกำกับภาษีเดิม, มูลค่าที่แสดงไว้เดิม, สาเหตุ และอย่างน้อย 1 รายการลดหนี้ให้ครบทั้งชื่อรายการ จำนวน และยอดที่ลดลง โดยผลต่างต้องไม่เกินมูลค่าเดิม
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'kanit_B', fontSize: 14, color: '#0f172a' }}>พรีวิวรายงานใบลดหนี้ซื้อ</div>
                  <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b' }}>แสดงรายการลดหนี้, ยอดภาษีที่ลดลง และข้อมูลอ้างอิงภาษีซื้อในมุมมองพร้อมพิมพ์</div>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 999, background: canSave ? '#D3F0E2' : '#fef3c7', color: canSave ? '#0C5238' : '#92400e', fontFamily: 'kanit_B', fontSize: 11 }}>
                  {canSave ? 'พร้อมจัดทำเอกสาร' : 'ข้อมูลยังไม่ครบ'}
                </div>
              </div>

              <PurchaseCreditNoteReport
                reportRef={previewRef}
                documentNumber={previewDocumentNumber}
                issueDateText={formatDate(issueDate)}
                status={previewStatus}
                statusStyles={previewStatusStyles}
                seller={sellerParty}
                buyer={buyerParty}
                referenceItems={referenceItems}
                reportItems={reportItems}
                reason={formatText(reason)}
                remark={formatText(remark)}
                person={formatText(person)}
                originalAmount={formatCurrency(originalAmount)}
                correctAmount={formatCurrency(correctAmount)}
                differenceAmount={formatCurrency(differenceAmount)}
                vatRate={PURCHASE_CREDIT_VAT_RATE}
                vatAmount={formatCurrency(vatAmount)}
                netTotal={formatCurrency(netTotal)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#6b7280' }}>
            {canSave ? `เลขที่เอกสารที่จะบันทึก: ${previewDocumentNumber}` : 'กรอกเลขที่ใบกำกับภาษีเดิม, รายการลดหนี้ และยอดเงินให้ครบก่อนบันทึก'}
          </div>
          <div className="d-flex align-items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={reactToPrintFn} className="btn btn-outline-dark" style={{ ...footerButtonStyle, minWidth: 104, display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={!canSave || saving}><Printer size={14} />พิมพ์</button>
            <button type="button" onClick={() => setShowEditor(false)} className="btn btn-secondary" style={footerButtonStyle}>ปิด</button>
            <button type="button" onClick={() => saveNote('ยกเลิก')} className="btn btn-outline-danger" style={footerButtonStyle} disabled={!canSave || saving}>ยกเลิก</button>
            <button type="button" onClick={() => saveNote('อนุมัติ')} className="btn btn-outline-success" style={footerButtonStyle} disabled={!canSave || saving}>อนุมัติ</button>
            <button type="button" onClick={() => saveNote()} className="btn btn-primary" style={footerButtonStyle} disabled={!canSave || saving}>บันทึก</button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  )
}

function MetricCard({ label, value, background, color }: { label: string; value: string; background: string; color: string }) {
  return (
    <div style={{ borderRadius: 12, padding: '12px 14px', background, border: '1px solid rgba(148,163,184,0.2)' }}>
      <div style={{ fontFamily: 'kanit', fontSize: 11, color }}>{label}</div>
      <div style={{ fontFamily: 'kanit_B', fontSize: 22, color, lineHeight: 1.2 }}>{value}</div>
    </div>
  )
}

function PurchaseCreditNoteReport({
  reportRef,
  documentNumber,
  issueDateText,
  status,
  statusStyles,
  seller,
  buyer,
  referenceItems,
  reportItems,
  reason,
  remark,
  person,
  originalAmount,
  correctAmount,
  differenceAmount,
  vatRate,
  vatAmount,
  netTotal,
}: {
  reportRef: React.RefObject<HTMLDivElement | null>
  documentNumber: string
  issueDateText: string
  status: string
  statusStyles: { background: string; color: string }
  seller: ReportParty
  buyer: ReportParty
  referenceItems: ReportInfo[]
  reportItems: Array<{ id: string; name: string; qty: string; amount: string }>
  reason: string
  remark: string
  person: string
  originalAmount: string
  correctAmount: string
  differenceAmount: string
  vatRate: number
  vatAmount: string
  netTotal: string
}) {
  return (
    <div style={reportPreviewFrameStyle}>
      <div ref={reportRef} className="purchase-credit-report-sheet" style={reportSheetStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'kanit_B', fontSize: 24, color: '#0f172a', lineHeight: 1.1 }}>ใบลดหนี้ซื้อ</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#475569' }}>Purchase Credit Note</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '5px 10px', background: '#fff7ed', color: '#c2410c', fontFamily: 'kanit_B', fontSize: 10.5 }}>เอกสารลดภาษีซื้อ</div>
            <div style={{ fontFamily: 'kanit_B', fontSize: 17, color: '#0f172a', marginTop: 10 }}>{documentNumber}</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#475569', marginTop: 4 }}>วันที่ออกเอกสาร {issueDateText}</div>
            <div style={{ display: 'inline-flex', marginTop: 8, borderRadius: 999, padding: '4px 10px', background: statusStyles.background, color: statusStyles.color, fontFamily: 'kanit_B', fontSize: 10.5 }}>{status}</div>
          </div>
        </div>

        <div style={reportBannerStyle}>
          เอกสารนี้ใช้ปรับลดมูลค่าและภาษีของใบกำกับภาษีซื้อเดิม โดยอ้างอิงเลขที่เดิม เหตุผล และรายการที่ลดหนี้
        </div>

        <div className="purchase-credit-report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 16 }}>
          <ReportPartyCard party={seller} />
          <ReportPartyCard party={buyer} />
        </div>

        <div style={reportSectionTitleStyle}>ข้อมูลเอกสารอ้างอิง</div>
        <div className="purchase-credit-report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, marginBottom: 12 }}>
          {referenceItems.map((item) => (
            <ReportInfoCard key={item.label} item={item} />
          ))}
        </div>

        <div style={reportSectionTitleStyle}>รายการที่ขอลดหนี้</div>
        <div style={reportTableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={reportTableHeadCellCenterStyle}>ลำดับ</th>
                <th style={reportTableHeadCellStyle}>รายการ</th>
                <th style={reportTableHeadCellCenterStyle}>จำนวน</th>
                <th style={reportTableHeadCellRightStyle}>ยอดที่ลดลง</th>
              </tr>
            </thead>
            <tbody>
              {reportItems.length === 0 ? (
                <tr>
                  <td colSpan={4} style={reportTableEmptyCellStyle}>ยังไม่มีรายการลดหนี้</td>
                </tr>
              ) : reportItems.map((item, index) => (
                <tr key={item.id}>
                  <td style={reportTableBodyCenterCellStyle}>{index + 1}</td>
                  <td style={reportTableBodyCellStyle}>{item.name}</td>
                  <td style={reportTableBodyCenterCellStyle}>{item.qty}</td>
                  <td style={reportTableBodyRightCellStyle}>{item.amount} บาท</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={reportSectionTitleStyle}>สรุปมูลค่าและภาษี</div>
        <div style={reportTableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={reportTableLabelCellStyle}>มูลค่าตามใบกำกับภาษีเดิม</td>
                <td style={reportTableValueCellStyle}>{originalAmount} บาท</td>
              </tr>
              <tr>
                <td style={reportTableLabelCellStyle}>มูลค่าหลังปรับปรุง</td>
                <td style={reportTableValueCellStyle}>{correctAmount} บาท</td>
              </tr>
              <tr>
                <td style={reportTableLabelCellStyle}>มูลค่าที่ลดลง</td>
                <td style={{ ...reportTableValueCellStyle, color: '#c2410c', fontFamily: 'kanit_B' }}>{differenceAmount} บาท</td>
              </tr>
              <tr>
                <td style={reportTableLabelCellStyle}>ภาษีมูลค่าเพิ่ม {vatRate}% ที่ลดลง</td>
                <td style={reportTableValueCellStyle}>{vatAmount} บาท</td>
              </tr>
              <tr>
                <td style={{ ...reportTableLabelCellStyle, background: '#fff7ed', fontFamily: 'kanit_B', borderBottom: 'none' }}>ยอดรวมสุทธิใบลดหนี้</td>
                <td style={{ ...reportTableValueCellStyle, background: '#fff7ed', color: '#9a3412', fontFamily: 'kanit_B', fontSize: 16, borderBottom: 'none' }}>{netTotal} บาท</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="purchase-credit-report-footer" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(260px, 0.85fr)', gap: 12, alignItems: 'start', marginBottom: 16 }}>
          <div style={reportNarrativeCardStyle}>
            <div style={reportCardTitleStyle}>เหตุผลและคำอธิบาย</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#1f2937', lineHeight: 1.8 }}>
              <div><span style={{ fontFamily: 'kanit_B' }}>สาเหตุที่ลดหนี้:</span> {reason}</div>
              <div style={{ marginTop: 8 }}><span style={{ fontFamily: 'kanit_B' }}>หมายเหตุเพิ่มเติม:</span> {remark}</div>
              <div style={{ marginTop: 8 }}><span style={{ fontFamily: 'kanit_B' }}>ผู้จัดทำรายการ:</span> {person}</div>
            </div>
          </div>
          <div style={reportSummaryCardStyle}>
            <div style={reportCardTitleStyle}>สรุปยอดสำหรับบันทึกบัญชี</div>
            <div style={reportSummaryRowStyle}>
              <span>มูลค่าที่ลดลง</span>
              <span>{differenceAmount}</span>
            </div>
            <div style={reportSummaryRowStyle}>
              <span>VAT {vatRate}%</span>
              <span>{vatAmount}</span>
            </div>
            <div style={{ ...reportSummaryRowStyle, marginTop: 8, paddingTop: 8, borderTop: '1px dashed #fdba74', fontFamily: 'kanit_B', color: '#7c2d12' }}>
              <span>ยอดสุทธิลดหนี้</span>
              <span>{netTotal}</span>
            </div>
          </div>
        </div>

        <div className="purchase-credit-report-signatures" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <ReportSignatureCard title="ผู้ขาย / ผู้ออกใบลดหนี้" name={seller.name} note="ลงนามโดยผู้มีอำนาจของผู้ขาย" />
          <ReportSignatureCard title="ผู้ซื้อ / ผู้รับเอกสาร" name={buyer.name} note="ลงนามรับทราบโดยกิจการผู้ซื้อ" />
        </div>
      </div>
    </div>
  )
}

function ReportPartyCard({ party }: { party: ReportParty }) {
  return (
    <div style={reportPartyCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={reportCardTitleStyle}>{party.title}</div>
        {party.loading && (
          <div style={{ borderRadius: 999, background: '#F3F8FC', color: '#1E5088', padding: '2px 6px', fontFamily: 'kanit_B', fontSize: 8.5, lineHeight: 1.2 }}>
            กำลังค้นหาข้อมูลผู้ขาย
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'kanit_B', fontSize: 12, color: '#0f172a', marginTop: 4, lineHeight: 1.2 }}>{party.name}</div>
      {party.subtitle ? <div style={{ fontFamily: 'kanit', fontSize: 9.5, color: '#64748b', marginTop: 1, lineHeight: 1.2 }}>{party.subtitle}</div> : null}
      <div style={{ display: 'grid', gap: 3, marginTop: 6 }}>
        <div style={reportMetaRowStyle}><span style={reportMetaLabelStyle}>เลขประจำตัวผู้เสียภาษี</span><span style={reportMetaValueStyle}>{party.taxId}</span></div>
        <div style={reportMetaRowStyle}><span style={reportMetaLabelStyle}>ที่อยู่</span><span style={reportMetaValueStyle}>{party.address}</span></div>
        <div style={reportMetaRowStyle}><span style={reportMetaLabelStyle}>โทร</span><span style={reportMetaValueStyle}>{party.tel}</span></div>
      </div>
    </div>
  )
}

function ReportInfoCard({ item }: { item: ReportInfo }) {
  return (
    <div style={reportInfoCardStyle}>
      <div style={{ fontFamily: 'kanit', fontSize: 10, color: '#64748b', lineHeight: 1.35 }}>{item.label}</div>
      <div style={{ fontFamily: 'kanit_B', fontSize: 11, color: '#0f172a', lineHeight: 1.35, textAlign: 'right' }}>{item.value}</div>
    </div>
  )
}

function ReportSignatureCard({ title, name, note }: { title: string; name: string; note: string }) {
  return (
    <div style={reportSignatureCardStyle}>
      <div style={reportCardTitleStyle}>{title}</div>
      <div style={{ height: 34, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: 'kanit', fontSize: 10.5, color: '#334155', textAlign: 'center', lineHeight: 1.2 }}>{name}</div>
      <div style={{ borderTop: '1px dashed #94a3b8', marginTop: 6, paddingTop: 5, textAlign: 'center', fontFamily: 'kanit', fontSize: 9.75, color: '#475569', lineHeight: 1.2 }}>{note}</div>
      <div style={{ textAlign: 'center', fontFamily: 'kanit', fontSize: 9.25, color: '#94a3b8', marginTop: 5, lineHeight: 1.2 }}>วันที่ ........../........../..............</div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 11,
  backgroundColor: '#f8fafc',
  color: '#64748b',
  borderBottom: '2px solid #e2e8f0',
  padding: '10px 12px',
}

const tdStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 13,
  height: 30,
  verticalAlign: 'middle',
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 12px',
  color: '#94a3b8',
  fontFamily: 'kanit',
}

const panelStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  padding: 18,
}

const panelTitleStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 14,
  color: '#1f2937',
  marginBottom: 12,
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 12,
  color: '#374151',
  marginBottom: 6,
}

const subLabelStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 11,
  color: '#6b7280',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 13,
  borderRadius: 10,
  height: 42,
}

const moneyInputStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 13,
  borderRadius: '10px 0 0 10px',
  height: 42,
}

const moneySuffixStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 12,
  borderRadius: '0 10px 10px 0',
}

const textareaStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 13,
  borderRadius: 10,
  resize: 'vertical',
}

const warningStyle: React.CSSProperties = {
  marginTop: 14,
  border: '1px solid #fed7aa',
  backgroundColor: '#fff7ed',
  color: '#9a3412',
  borderRadius: 12,
  padding: '12px 14px',
  fontFamily: 'kanit',
  fontSize: 12,
  lineHeight: 1.6,
}

const footerButtonStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 12,
  minWidth: 86,
}

const PURCHASE_CREDIT_REPORT_PRINT_PAGE_STYLE = `
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  @media print {
    html, body {
      background: #ffffff !important;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .purchase-credit-report-sheet {
      width: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }

    .purchase-credit-report-grid,
    .purchase-credit-report-footer,
    .purchase-credit-report-signatures {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }
`

const reportPreviewFrameStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 20,
  background: 'linear-gradient(180deg, #efe2d5 0%, #f8fafc 100%)',
  border: '1px solid #ead3c0',
}

const reportSheetStyle: React.CSSProperties = {
  width: '100%',
  background: '#ffffff',
  borderRadius: 22,
  padding: '24px 24px 20px',
  border: '1px solid #eadfd5',
  boxShadow: '0 24px 50px rgba(15, 23, 42, 0.12)',
}

const reportBannerStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: '5px 10px',
  background: 'linear-gradient(135deg, #fff7ed, #fffaf0)',
  border: '1px solid #fed7aa',
  fontFamily: 'kanit',
  fontSize: 9.25,
  color: '#0f172a',
  lineHeight: 1.2,
  marginBottom: 10,
}

const reportSectionTitleStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 11,
  color: '#0f172a',
  marginBottom: 5,
}

const reportPartyCardStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: '8px 10px',
  border: '1px solid #fed7aa',
  background: '#ffffff',
  boxShadow: '0 4px 12px rgba(148, 163, 184, 0.06)',
}

const reportCardTitleStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 10.5,
  color: '#334155',
  lineHeight: 1.2,
}

const reportMetaRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '86px minmax(0, 1fr)',
  gap: 6,
  alignItems: 'start',
}

const reportMetaLabelStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 9.25,
  color: '#64748b',
  lineHeight: 1.2,
}

const reportMetaValueStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 9.75,
  color: '#0f172a',
  lineHeight: 1.25,
}

const reportInfoCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: '6px 10px',
  minHeight: 26,
  display: 'grid',
  gridTemplateColumns: '92px minmax(0, 1fr)',
  gap: 8,
  alignItems: 'center',
}

const reportTableWrapStyle: React.CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  marginBottom: 8,
}

const reportTableHeadCellStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 9.25,
  color: '#475569',
  background: '#fff7ed',
  padding: '5px 8px',
  textAlign: 'left',
  borderBottom: '1px solid #fed7aa',
  lineHeight: 1.2,
}

const reportTableHeadCellCenterStyle: React.CSSProperties = {
  ...reportTableHeadCellStyle,
  textAlign: 'center',
}

const reportTableHeadCellRightStyle: React.CSSProperties = {
  ...reportTableHeadCellStyle,
  textAlign: 'right',
}

const reportTableBodyCellStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 9.75,
  color: '#0f172a',
  padding: '5px 8px',
  borderBottom: '1px solid #e2e8f0',
  lineHeight: 1.2,
}

const reportTableBodyCenterCellStyle: React.CSSProperties = {
  ...reportTableBodyCellStyle,
  textAlign: 'center',
}

const reportTableBodyRightCellStyle: React.CSSProperties = {
  ...reportTableBodyCellStyle,
  textAlign: 'right',
}

const reportTableEmptyCellStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 9.75,
  color: '#94a3b8',
  padding: '10px 8px',
  textAlign: 'center',
}

const reportTableLabelCellStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 10,
  color: '#1f2937',
  padding: '6px 10px',
  borderBottom: '1px solid #e2e8f0',
  lineHeight: 1.2,
}

const reportTableValueCellStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 10,
  color: '#0f172a',
  padding: '6px 10px',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'right',
  lineHeight: 1.2,
}

const reportNarrativeCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: '14px 16px',
}

const reportSummaryCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #fed7aa',
  background: '#fff7ed',
  padding: '14px 16px',
}

const reportSummaryRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  fontFamily: 'kanit',
  fontSize: 12,
  color: '#334155',
  lineHeight: 1.7,
}

const reportSignatureCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: '10px 12px',
  minHeight: 98,
}

const addButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 32,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid #3E86C7',
  background: '#F3F8FC',
  color: '#1E5088',
  fontFamily: 'kanit_B',
  fontSize: 12,
  cursor: 'pointer',
}

const removeButtonStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#dc2626',
  fontFamily: 'kanit_B',
  fontSize: 16,
  cursor: 'pointer',
}