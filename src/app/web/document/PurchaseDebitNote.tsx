'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'
import { Landmark, Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

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
  purchase_debit_date?: string | null
  purchase_debit_number?: number | null
  purchase_debit_orderNo?: string | null
  purchase_debit_orderfull?: string | null
  purchase_debit_status?: string | null
  purchase_debit_person?: string | null
  purchase_debit_remark?: string | null
  purchase_debit_reference_no?: string | null
  purchase_debit_reference_book_no?: string | null
  purchase_debit_reason?: string | null
  purchase_debit_original_amount?: number | null
  purchase_debit_correct_amount?: number | null
  purchase_debit_difference_amount?: number | null
  purchase_debit_vat_rate?: number | null
  purchase_debit_vat_amount?: number | null
  purchase_debit_grand_total?: number | null
}

type PurchaseDebitNoteProps = {
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

const PURCHASE_DEBIT_VAT_RATE = 7

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const formatCurrency = (value: number | null | undefined) => (
  roundCurrency(Number(value || 0)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
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

const getStatusStyles = (status?: string | null) => {
  if (status === 'อนุมัติ') return { background: '#D3F0E2', color: '#0C5238' }
  if (status === 'ยกเลิก') return { background: '#fee2e2', color: '#991b1b' }
  return { background: '#fef3c7', color: '#92400e' }
}

export default function PurchaseDebitNote({ openReceiveId, onOpenReceiveHandled, onUpdated }: PurchaseDebitNoteProps) {
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
  const [correctAmountInput, setCorrectAmountInput] = useState('')
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
      const leftDate = new Date(left.purchase_debit_date || left.receive_date || 0).getTime()
      const rightDate = new Date(right.purchase_debit_date || right.receive_date || 0).getTime()
      return rightDate - leftDate
    })
  ), [rows])

  const openEditor = (row: PurchaseReceiveRow) => {
    setEditingRow(row)
    setIssueDate(toInputDateValue(row.purchase_debit_date || row.receive_date || null))
    setReferenceNo(String(row.purchase_debit_reference_no || row.tax_no || row.invoice_No || ''))
    setReferenceBookNo(String(row.purchase_debit_reference_book_no || ''))
    setReason(String(row.purchase_debit_reason || ''))
    setRemark(String(row.purchase_debit_remark || ''))
    setPerson(String(row.purchase_debit_person || row.persons || ''))
    const defaultOriginalAmount = row.purchase_debit_original_amount ?? row.totalRC ?? row.totalRCAll ?? 0
    const defaultCorrectAmount = row.purchase_debit_correct_amount ?? defaultOriginalAmount
    setOriginalAmountInput(String(defaultOriginalAmount || ''))
    setCorrectAmountInput(String(defaultCorrectAmount || ''))
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
  const correctAmount = roundCurrency(Number(correctAmountInput || 0))
  const differenceAmount = roundCurrency(correctAmount > originalAmount ? correctAmount - originalAmount : 0)
  const vatAmount = roundCurrency(differenceAmount > 0 ? (differenceAmount * PURCHASE_DEBIT_VAT_RATE) / 100 : 0)
  const grandTotal = roundCurrency(differenceAmount + vatAmount)

  const canSave = referenceNo.trim() !== '' && reason.trim() !== '' && correctAmount > originalAmount

  const getNextNumber = (orderNo: string) => {
    const existing = rows
      .filter((row) => row.purchase_debit_orderNo === orderNo)
      .map((row) => Number(row.purchase_debit_number || 0))
      .filter((value) => value > 0)
    return existing.length > 0 ? Math.max(...existing) + 1 : 100
  }

  const resolvedOrderNo = editingRow?.purchase_debit_orderNo || getOrderNoFromInputDate(issueDate)
  const resolvedNumber = editingRow?.purchase_debit_number || (editingRow ? getNextNumber(resolvedOrderNo) : 100)
  const previewDocumentNumber = editingRow
    ? (editingRow.purchase_debit_orderfull || `PDN${resolvedOrderNo}${resolvedNumber}`)
    : '-'
  const previewStatus = editingRow?.purchase_debit_status || 'รออนุมัติ'
  const previewStatusStyles = getStatusStyles(previewStatus)

  const sellerCodeText = formatText(supplierProfile?.code || editingRow?.code, '')
  const sellerParty: ReportParty = {
    title: 'ผู้ขาย / ผู้ออกใบเพิ่มหนี้',
    name: formatText(supplierProfile?.names || editingRow?.names),
    subtitle: sellerCodeText ? `รหัสผู้ขาย: ${sellerCodeText}` : undefined,
    taxId: formatText(supplierProfile?.idcode),
    address: formatText(supplierProfile?.address),
    tel: formatText(supplierProfile?.tel),
    loading: supplierLoading,
  }

  const branchNameText = String(storeProfile?.branchName || '').trim()
  const buyerParty: ReportParty = {
    title: 'ผู้ซื้อ / กิจการ',
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
    { label: 'ผู้จัดทำรายการ', value: formatText(person) },
    { label: 'สถานะเอกสาร', value: previewStatus },
  ]

  const reactToPrintFn = useReactToPrint({
    contentRef: previewRef,
    documentTitle: previewDocumentNumber === '-' ? 'purchase-debit-note' : previewDocumentNumber,
    pageStyle: PURCHASE_DEBIT_REPORT_PRINT_PAGE_STYLE,
  })

  const saveNote = async (nextStatus?: string) => {
    if (!editingRow || !canSave || saving) return

    const orderNo = resolvedOrderNo
    const number = resolvedNumber
    const orderfull = previewDocumentNumber

    setSaving(true)
    try {
      await axios.put(`/api/receive/${editingRow.id}`, {
        purchase_debit_date: new Date(issueDate),
        purchase_debit_number: number,
        purchase_debit_orderNo: orderNo,
        purchase_debit_orderfull: orderfull,
        purchase_debit_status: nextStatus || editingRow.purchase_debit_status || 'รออนุมัติ',
        purchase_debit_person: person.trim(),
        purchase_debit_remark: remark,
        purchase_debit_reference_no: referenceNo.trim(),
        purchase_debit_reference_book_no: referenceBookNo.trim(),
        purchase_debit_reason: reason.trim(),
        purchase_debit_original_amount: originalAmount,
        purchase_debit_correct_amount: correctAmount,
        purchase_debit_difference_amount: differenceAmount,
        purchase_debit_vat_rate: PURCHASE_DEBIT_VAT_RATE,
        purchase_debit_vat_amount: vatAmount,
        purchase_debit_grand_total: grandTotal,
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
          <div style={{ fontFamily: 'kanit_B', fontSize: 18, color: '#1f2937' }}>ใบเพิ่มหนี้ซื้อ</div>
          <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#6b7280' }}>สร้างต่อจากใบรับสินค้าและกรอกข้อมูลตามรายการที่สรรพากรกำหนด</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white' }}>
        <table className="table table-hover" style={{ marginBottom: 0, borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <td style={thStyle}>วันที่รับสินค้า</td>
              <td style={thStyle}>เลขที่ใบรับสินค้า</td>
              <td style={thStyle}>ผู้ขาย</td>
              <td style={thStyle}>อ้างอิงใบกำกับภาษีเดิม</td>
              <td style={{ ...thStyle, textAlign: 'center' }}>เลขที่ใบเพิ่มหนี้ซื้อ</td>
              <td style={{ ...thStyle, textAlign: 'center' }}>ส่วนต่าง</td>
              <td style={{ ...thStyle, textAlign: 'center' }}>VAT 7%</td>
              <td style={{ ...thStyle, textAlign: 'center' }}>ยอดรวมเพิ่ม</td>
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
              const statusStyles = getStatusStyles(row.purchase_debit_status)
              const hasNote = !!row.purchase_debit_status
              return (
                <tr key={row.id}>
                  <td style={tdStyle}>{formatDate(row.receive_date)}</td>
                  <td style={tdStyle}>RC{row.orderfull || row.id}</td>
                  <td style={tdStyle}>{row.names || '-'}</td>
                  <td style={tdStyle}>{row.purchase_debit_reference_no || row.tax_no || row.invoice_No || '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{row.purchase_debit_orderfull || '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{formatCurrency(row.purchase_debit_difference_amount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{formatCurrency(row.purchase_debit_vat_amount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{formatCurrency(row.purchase_debit_grand_total)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontFamily: 'kanit_B', fontSize: 11, background: statusStyles.background, color: statusStyles.color }}>
                      {row.purchase_debit_status || 'ยังไม่สร้าง'}
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
                        border: `1px solid ${hasNote ? '#d97706' : '#0f766e'}`,
                        background: hasNote ? '#fff7ed' : '#EDF9F3',
                        color: hasNote ? '#b45309' : '#0C5238',
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
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #0f766e, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={18} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'kanit_B', fontSize: 16 }}>ใบเพิ่มหนี้ซื้อ</div>
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
                <div style={panelTitleStyle}>ข้อมูลมูลค่าและภาษีมูลค่าเพิ่ม</div>
                <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b', marginBottom: 12 }}>ระบบจะคำนวณผลต่างและ VAT 7% จากยอดที่แก้ไขให้อัตโนมัติ พร้อมนำไปแสดงใน report ด้านขวา</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={labelStyle}>มูลค่าที่แสดงไว้ในใบกำกับภาษีเดิม</div>
                    <div className="input-group">
                      <input className="form-control" value={originalAmountInput} onChange={(e) => setOriginalAmountInput(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" style={moneyInputStyle} />
                      <span className="input-group-text" style={moneySuffixStyle}>บาท</span>
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>มูลค่าที่ถูกต้อง</div>
                    <div className="input-group">
                      <input className="form-control" value={correctAmountInput} onChange={(e) => setCorrectAmountInput(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" style={moneyInputStyle} />
                      <span className="input-group-text" style={moneySuffixStyle}>บาท</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
                  <MetricCard label="ผลต่างของมูลค่าทั้งสอง" value={formatCurrency(differenceAmount)} background="#F3F8FC" color="#173F6B" />
                  <MetricCard label={`ภาษีมูลค่าเพิ่ม ${PURCHASE_DEBIT_VAT_RATE}%`} value={formatCurrency(vatAmount)} background="#F3F8FC" color="#173F6B" />
                  <MetricCard label="ยอดรวมที่ต้องชำระเพิ่ม" value={formatCurrency(grandTotal)} background="#fffbeb" color="#92400e" />
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={labelStyle}>สาเหตุที่เพิ่มหนี้</div>
                  <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="เช่น ผู้ขายออกใบกำกับภาษีขาดรายการหรือคิดมูลค่าต่ำกว่าจริง" style={textareaStyle} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={labelStyle}>หมายเหตุเพิ่มเติม</div>
                  <textarea className="form-control" value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="ข้อความเพิ่มเติมสำหรับใช้ในเอกสาร" style={textareaStyle} />
                </div>
                {!canSave && (
                  <div style={warningStyle}>
                    ต้องกรอกเลขที่ใบกำกับภาษีเดิม, สาเหตุ และให้มูลค่าที่ถูกต้องมากกว่ามูลค่าที่แสดงไว้เดิม เพื่อสร้างใบเพิ่มหนี้ซื้อได้
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'kanit_B', fontSize: 14, color: '#0f172a' }}>พรีวิวรายงานใบเพิ่มหนี้ซื้อ</div>
                  <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b' }}>ออกแบบให้พร้อมใช้งานเป็นเอกสารอ้างอิงภาษีและตรวจสอบข้อมูลได้ในจอเดียว</div>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 999, background: canSave ? '#D3F0E2' : '#fef3c7', color: canSave ? '#0C5238' : '#92400e', fontFamily: 'kanit_B', fontSize: 11 }}>
                  {canSave ? 'พร้อมจัดทำเอกสาร' : 'ข้อมูลยังไม่ครบ'}
                </div>
              </div>

              <PurchaseDebitNoteReport
                reportRef={previewRef}
                documentNumber={previewDocumentNumber}
                issueDateText={formatDate(issueDate)}
                status={previewStatus}
                statusStyles={previewStatusStyles}
                seller={sellerParty}
                buyer={buyerParty}
                referenceItems={referenceItems}
                reason={formatText(reason)}
                remark={formatText(remark)}
                person={formatText(person)}
                originalAmount={formatCurrency(originalAmount)}
                correctAmount={formatCurrency(correctAmount)}
                differenceAmount={formatCurrency(differenceAmount)}
                vatRate={PURCHASE_DEBIT_VAT_RATE}
                vatAmount={formatCurrency(vatAmount)}
                grandTotal={formatCurrency(grandTotal)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#6b7280' }}>
            {canSave ? `เลขที่เอกสารที่จะบันทึก: ${previewDocumentNumber}` : 'กรอกเลขที่ใบกำกับภาษีเดิม, สาเหตุ และมูลค่าที่ถูกต้องให้มากกว่ามูลค่าเดิมก่อนบันทึก'}
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

function PurchaseDebitNoteReport({
  reportRef,
  documentNumber,
  issueDateText,
  status,
  statusStyles,
  seller,
  buyer,
  referenceItems,
  reason,
  remark,
  person,
  originalAmount,
  correctAmount,
  differenceAmount,
  vatRate,
  vatAmount,
  grandTotal,
}: {
  reportRef: React.RefObject<HTMLDivElement | null>
  documentNumber: string
  issueDateText: string
  status: string
  statusStyles: { background: string; color: string }
  seller: ReportParty
  buyer: ReportParty
  referenceItems: ReportInfo[]
  reason: string
  remark: string
  person: string
  originalAmount: string
  correctAmount: string
  differenceAmount: string
  vatRate: number
  vatAmount: string
  grandTotal: string
}) {
  return (
    <div style={reportPreviewFrameStyle}>
      <div ref={reportRef} className="purchase-debit-report-sheet" style={reportSheetStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'kanit_B', fontSize: 24, color: '#0f172a', lineHeight: 1.1 }}>ใบเพิ่มหนี้ซื้อ</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#475569' }}>Purchase Debit Note</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '5px 10px', background: '#ecfeff', color: '#0f766e', fontFamily: 'kanit_B', fontSize: 10.5 }}>เอกสารอ้างอิงภาษีซื้อ</div>
            <div style={{ fontFamily: 'kanit_B', fontSize: 17, color: '#0f172a', marginTop: 10 }}>{documentNumber}</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#475569', marginTop: 4 }}>วันที่ออกเอกสาร {issueDateText}</div>
            <div style={{ display: 'inline-flex', marginTop: 8, borderRadius: 999, padding: '4px 10px', background: statusStyles.background, color: statusStyles.color, fontFamily: 'kanit_B', fontSize: 10.5 }}>{status}</div>
          </div>
        </div>

        <div style={reportBannerStyle}>
          เอกสารฉบับนี้ใช้แสดงการปรับเพิ่มมูลค่าหรือภาษีมูลค่าเพิ่มจากใบกำกับภาษีเดิม โดยต้องระบุเลขที่อ้างอิง เหตุผล และยอดภาษีที่เปลี่ยนแปลงให้ครบถ้วน
        </div>

        <div className="purchase-debit-report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 16 }}>
          <ReportPartyCard party={seller} />
          <ReportPartyCard party={buyer} />
        </div>

        <div style={reportSectionTitleStyle}>ข้อมูลเอกสารอ้างอิง</div>
        <div className="purchase-debit-report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, marginBottom: 12 }}>
          {referenceItems.map((item) => (
            <ReportInfoCard key={item.label} item={item} />
          ))}
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
                <td style={reportTableLabelCellStyle}>มูลค่าที่ถูกต้องหลังปรับปรุง</td>
                <td style={reportTableValueCellStyle}>{correctAmount} บาท</td>
              </tr>
              <tr>
                <td style={reportTableLabelCellStyle}>ส่วนต่างที่ต้องเพิ่ม</td>
                <td style={{ ...reportTableValueCellStyle, color: '#0f766e', fontFamily: 'kanit_B' }}>{differenceAmount} บาท</td>
              </tr>
              <tr>
                <td style={reportTableLabelCellStyle}>ภาษีมูลค่าเพิ่ม {vatRate}% จากส่วนต่าง</td>
                <td style={reportTableValueCellStyle}>{vatAmount} บาท</td>
              </tr>
              <tr>
                <td style={{ ...reportTableLabelCellStyle, background: '#F3F8FC', fontFamily: 'kanit_B', borderBottom: 'none' }}>ยอดรวมที่ต้องชำระเพิ่ม</td>
                <td style={{ ...reportTableValueCellStyle, background: '#F3F8FC', color: '#173F6B', fontFamily: 'kanit_B', fontSize: 16, borderBottom: 'none' }}>{grandTotal} บาท</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="purchase-debit-report-footer" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(260px, 0.9fr)', gap: 12, alignItems: 'start', marginBottom: 16 }}>
          <div style={reportNarrativeCardStyle}>
            <div style={reportCardTitleStyle}>เหตุผลและคำอธิบาย</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#1f2937', lineHeight: 1.8 }}>
              <div><span style={{ fontFamily: 'kanit_B' }}>สาเหตุที่เพิ่มหนี้:</span> {reason}</div>
              <div style={{ marginTop: 8 }}><span style={{ fontFamily: 'kanit_B' }}>หมายเหตุเพิ่มเติม:</span> {remark}</div>
              <div style={{ marginTop: 8 }}><span style={{ fontFamily: 'kanit_B' }}>ผู้จัดทำรายการ:</span> {person}</div>
            </div>
          </div>
          <div style={reportSummaryCardStyle}>
            <div style={reportCardTitleStyle}>สรุปยอดสำหรับบันทึกบัญชี</div>
            <div style={reportSummaryRowStyle}>
              <span>เพิ่มมูลค่าสินค้า/บริการ</span>
              <span>{differenceAmount}</span>
            </div>
            <div style={reportSummaryRowStyle}>
              <span>VAT {vatRate}%</span>
              <span>{vatAmount}</span>
            </div>
            <div style={{ ...reportSummaryRowStyle, marginTop: 8, paddingTop: 8, borderTop: '1px dashed #cbd5e1', fontFamily: 'kanit_B', color: '#0f172a' }}>
              <span>ยอดรวมเพิ่ม</span>
              <span>{grandTotal}</span>
            </div>
          </div>
        </div>

        <div className="purchase-debit-report-signatures" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <ReportSignatureCard title="ผู้ขาย / ผู้ออกใบเพิ่มหนี้" name={seller.name} note="ลงนามโดยผู้มีอำนาจของผู้ขาย" />
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
      <div style={{ height: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: 'kanit', fontSize: 12, color: '#334155', textAlign: 'center' }}>{name}</div>
      <div style={{ borderTop: '1px dashed #94a3b8', marginTop: 10, paddingTop: 8, textAlign: 'center', fontFamily: 'kanit', fontSize: 11, color: '#475569' }}>{note}</div>
      <div style={{ textAlign: 'center', fontFamily: 'kanit', fontSize: 10.5, color: '#94a3b8', marginTop: 8 }}>วันที่ ........../........../..............</div>
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

const PURCHASE_DEBIT_REPORT_PRINT_PAGE_STYLE = `
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

    .purchase-debit-report-sheet {
      width: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }

    .purchase-debit-report-grid,
    .purchase-debit-report-footer,
    .purchase-debit-report-signatures {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }
`

const reportPreviewFrameStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 20,
  background: 'linear-gradient(180deg, #dfe9f3 0%, #f8fafc 100%)',
  border: '1px solid #d9e2ec',
}

const reportSheetStyle: React.CSSProperties = {
  width: '100%',
  background: '#ffffff',
  borderRadius: 22,
  padding: '24px 24px 20px',
  border: '1px solid #dbe3ee',
  boxShadow: '0 24px 50px rgba(15, 23, 42, 0.12)',
}

const reportBannerStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: '12px 14px',
  background: 'linear-gradient(135deg, #ecfeff, #F3F8FC)',
  border: '1px solid #CCDFF1',
  fontFamily: 'kanit',
  fontSize: 11.5,
  color: '#0f172a',
  lineHeight: 1.7,
  marginBottom: 16,
}

const reportSectionTitleStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 13,
  color: '#0f172a',
  marginBottom: 10,
}

const reportPartyCardStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: '8px 10px',
  border: '1px solid #E5EEF8',
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
  borderRadius: 18,
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  marginBottom: 16,
}

const reportTableLabelCellStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 12,
  color: '#1f2937',
  padding: '11px 14px',
  borderBottom: '1px solid #e2e8f0',
}

const reportTableValueCellStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 12,
  color: '#0f172a',
  padding: '11px 14px',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'right',
}

const reportNarrativeCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: '14px 16px',
}

const reportSummaryCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #E5EEF8',
  background: '#F3F8FC',
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
  padding: '14px 16px',
  minHeight: 162,
}