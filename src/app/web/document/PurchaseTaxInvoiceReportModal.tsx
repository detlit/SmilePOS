'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'
import { AlertCircle, CreditCard, Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

type PurchaseTaxInvoiceReportModalProps = {
  openReceiveId?: number | null
  onClose: () => void
}

type PurchaseReceiveRow = {
  id: number
  company?: string | null
  codenames?: string | null
  orderfull?: string | null
  names?: string | null
  invoice_No?: string | null
  tax_no?: string | null
  receive_date?: string | null
  tax_date?: string | null
  pay_date?: string | null
  persons?: string | null
  statuss?: string | null
  totalRC?: number | null
  vatRC?: number | null
  discountRC?: number | null
  totalRCAll?: number | null
  countorder?: number | null
}

type StoreProfile = {
  ownerName?: string | null
  namestore?: string | null
  address?: string | null
  tel?: string | null
  taxnumber?: string | null
  branchName?: string | null
  branchCode?: string | null
}

type SupplierProfile = {
  code?: string | null
  names?: string | null
  tel?: string | null
  idcode?: string | null
  address?: string | null
  email?: string | null
}

type ReceiveItemRow = {
  id: number
  itemcode?: string | null
  itemName?: string | null
  unit?: string | null
  qty?: number | null
  newCost?: number | null
  totalcost?: number | null
  discountbaht?: number | null
  freebaht?: number | null
  lot?: string | null
  dateExp?: string | null
}

type PartyInfo = {
  title: string
  name: string
  subtitle?: string
  address: string
  taxId: string
  tel: string
}

type InfoItem = {
  label: string
  value: string
}

type PrintableItem = {
  id: number
  code: string
  name: string
  unit: string
  qty: string
  unitPrice: string
  discount: string
  amount: string
  note: string
}

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

const composeBranchText = (branchName?: string | null, branchCode?: string | null) => {
  const parts = [String(branchName || '').trim(), String(branchCode || '').trim()].filter(Boolean)
  if (parts.length === 0) return ''
  return `สาขา: ${parts.join(' / ')}`
}

const resolveSupplier = (suppliers: any[], row: PurchaseReceiveRow | null) => {
  if (!Array.isArray(suppliers) || suppliers.length === 0 || !row) return null

  const normalizedCode = String(row.codenames || '').trim().toLowerCase()
  const normalizedName = String(row.names || '').trim().toLowerCase()

  return suppliers.find((item: any) => normalizedCode && String(item?.code || '').trim().toLowerCase() === normalizedCode)
    || suppliers.find((item: any) => normalizedName && String(item?.names || '').trim().toLowerCase() === normalizedName)
    || suppliers[0]
}

const getPaymentStatus = (row: PurchaseReceiveRow | null) => {
  if (!row) return '-'
  if (row.pay_date) return 'ชำระแล้ว'
  return formatText(row.statuss, 'ยังไม่ชำระเงิน')
}

export default function PurchaseTaxInvoiceReportModal({ openReceiveId, onClose }: PurchaseTaxInvoiceReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [row, setRow] = useState<PurchaseReceiveRow | null>(null)
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null)
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null)
  const [items, setItems] = useState<ReceiveItemRow[]>([])
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openReceiveId) {
      setLoading(false)
      setLoadError('')
      setRow(null)
      setStoreProfile(null)
      setSupplierProfile(null)
      setItems([])
      return
    }

    let ignore = false

    const loadData = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const receiveRes = await axios.get(`/api/receive/${openReceiveId}`)
        if (ignore) return

        const nextRow = receiveRes.data as PurchaseReceiveRow | null
        if (!nextRow) throw new Error('Receive record not found')

        setRow(nextRow)

        const company = String(nextRow.company || localStorage.getItem('company_') || '')
        const supplierParams = new URLSearchParams()
        if (company) supplierParams.set('company', company)
        if (nextRow.codenames) supplierParams.set('code', String(nextRow.codenames))
        if (nextRow.names) supplierParams.set('names', String(nextRow.names))
        const receiptCode = String(nextRow.orderfull || nextRow.id || '')

        const [storeResult, supplierResult, itemsResult] = await Promise.allSettled([
          company ? axios.get(`/api/setting/store/store?company=${encodeURIComponent(company)}`) : Promise.resolve({ data: [] }),
          supplierParams.toString() ? axios.get(`/api/supplier?${supplierParams.toString()}`) : Promise.resolve({ data: [] }),
          company && receiptCode
            ? axios.get(`/api/dataitemlist?company=${encodeURIComponent(company)}&codenames=${encodeURIComponent(receiptCode)}&sort=asc`)
            : Promise.resolve({ data: [] }),
        ])

        if (ignore) return

        if (storeResult.status === 'fulfilled') {
          const store = Array.isArray(storeResult.value.data) ? storeResult.value.data[0] : null
          setStoreProfile(store ? {
            ownerName: store.ownerName,
            namestore: store.namestore,
            address: store.address,
            tel: store.tel,
            taxnumber: store.taxnumber,
            branchName: store.branchName,
            branchCode: store.branchCode,
          } : null)
        } else {
          setStoreProfile(null)
        }

        if (supplierResult.status === 'fulfilled') {
          const suppliers = Array.isArray(supplierResult.value.data) ? supplierResult.value.data : []
          const supplier = resolveSupplier(suppliers, nextRow)
          setSupplierProfile(supplier ? {
            code: supplier.code,
            names: supplier.names,
            tel: supplier.tel,
            idcode: supplier.idcode,
            address: supplier.address,
            email: supplier.email,
          } : null)
        } else {
          setSupplierProfile(null)
        }

        if (itemsResult.status === 'fulfilled') {
          setItems(Array.isArray(itemsResult.value.data) ? itemsResult.value.data : [])
        } else {
          setItems([])
        }
      } catch (error) {
        console.error(error)
        if (ignore) return
        setLoadError('ไม่สามารถโหลดรายงานใบกำกับภาษีซื้อได้')
        setRow(null)
        setStoreProfile(null)
        setSupplierProfile(null)
        setItems([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void loadData()

    return () => {
      ignore = true
    }
  }, [openReceiveId])

  const buyerLegalNameRaw = String(storeProfile?.ownerName || storeProfile?.namestore || '').trim()
  const buyerStoreNameRaw = String(storeProfile?.namestore || '').trim()
  const buyerAddressRaw = String(storeProfile?.address || '').trim()
  const buyerTaxIdRaw = String(storeProfile?.taxnumber || '').trim()
  const sellerNameRaw = String(supplierProfile?.names || row?.names || '').trim()
  const sellerAddressRaw = String(supplierProfile?.address || '').trim()
  const sellerTaxIdRaw = String(supplierProfile?.idcode || '').trim()
  const branchText = composeBranchText(storeProfile?.branchName, storeProfile?.branchCode)

  const sellerParty = useMemo<PartyInfo>(() => {
    const subtitleParts: string[] = []
    const sellerCode = String(supplierProfile?.code || row?.codenames || '').trim()
    if (sellerCode) subtitleParts.push(`รหัสผู้ขาย: ${sellerCode}`)

    return {
      title: 'ผู้ขาย / ผู้ออกใบกำกับภาษี',
      name: formatText(sellerNameRaw, 'โปรดบันทึกชื่อผู้ขาย'),
      subtitle: subtitleParts.join(' | ') || undefined,
      address: formatText(sellerAddressRaw, 'โปรดบันทึกที่อยู่ผู้ขาย'),
      taxId: formatText(sellerTaxIdRaw, 'โปรดบันทึกเลขผู้เสียภาษีผู้ขาย'),
      tel: formatText(supplierProfile?.tel, '-'),
    }
  }, [row?.codenames, sellerAddressRaw, sellerNameRaw, sellerTaxIdRaw, supplierProfile?.code, supplierProfile?.tel])

  const buyerParty = useMemo<PartyInfo>(() => {
    const subtitleParts: string[] = []
    if (buyerStoreNameRaw && buyerStoreNameRaw !== buyerLegalNameRaw) {
      subtitleParts.push(`สถานประกอบการ: ${buyerStoreNameRaw}`)
    }
    if (branchText) subtitleParts.push(branchText)

    return {
      title: 'ผู้ซื้อ / ผู้รับใบกำกับภาษี',
      name: formatText(buyerLegalNameRaw, 'โปรดบันทึกชื่อกิจการผู้ซื้อ'),
      subtitle: subtitleParts.join(' | ') || 'ข้อมูลผู้ซื้อจากการตั้งค่าร้าน',
      address: formatText(buyerAddressRaw, 'โปรดบันทึกที่อยู่ผู้ซื้อ'),
      taxId: formatText(buyerTaxIdRaw, 'โปรดบันทึกเลขผู้เสียภาษีผู้ซื้อ'),
      tel: formatText(storeProfile?.tel, '-'),
    }
  }, [branchText, buyerAddressRaw, buyerLegalNameRaw, buyerStoreNameRaw, buyerTaxIdRaw, storeProfile?.tel])

  const documentNumber = formatText(row?.tax_no || row?.invoice_No, 'ยังไม่ระบุเลขที่')
  const receiptNumber = row ? `RC${row.orderfull || row.id}` : '-'
  const paymentStatus = getPaymentStatus(row)
  const issueDateText = formatDate(row?.tax_date || row?.receive_date)

  const infoItems = useMemo<InfoItem[]>(() => ([
    { label: 'เลขที่ใบกำกับภาษี', value: documentNumber },
    { label: 'เลขที่ใบรับสินค้า', value: receiptNumber },
    { label: 'เลขที่เอกสารผู้ขาย', value: formatText(row?.invoice_No, '-') },
    { label: 'วันที่ใบกำกับภาษี', value: formatDate(row?.tax_date) },
    { label: 'วันที่รับสินค้า', value: formatDate(row?.receive_date) },
    { label: 'วันที่ชำระ', value: formatDate(row?.pay_date) },
    { label: 'ผู้รับผิดชอบ', value: formatText(row?.persons, '-') },
    { label: 'สถานะการชำระ', value: paymentStatus },
  ]), [documentNumber, paymentStatus, receiptNumber, row?.invoice_No, row?.pay_date, row?.persons, row?.receive_date, row?.tax_date])

  const printableItems = useMemo<PrintableItem[]>(() => (
    items.map((item) => {
      const grossAmount = roundCurrency(Number(item.totalcost || 0))
      const discountAmount = roundCurrency(Number(item.discountbaht || 0) + Number(item.freebaht || 0))
      const netAmount = roundCurrency(Math.max(grossAmount - discountAmount, 0))
      const lotText = String(item.lot || '').trim()
      const expText = item.dateExp ? `หมดอายุ ${formatDate(item.dateExp)}` : ''
      const note = [lotText ? `LOT ${lotText}` : '', expText].filter(Boolean).join(' | ')

      return {
        id: item.id,
        code: formatText(item.itemcode, '-'),
        name: formatText(item.itemName, '-'),
        unit: formatText(item.unit, '-'),
        qty: formatQuantity(item.qty),
        unitPrice: formatCurrency(item.newCost),
        discount: formatCurrency(discountAmount),
        amount: formatCurrency(netAmount),
        note,
      }
    })
  ), [items])

  const summaryValues = useMemo(() => ({
    subtotal: roundCurrency(Number(row?.totalRC || 0)),
    discount: roundCurrency(Number(row?.discountRC || 0)),
    vat: roundCurrency(Number(row?.vatRC || 0)),
    total: roundCurrency(Number(row?.totalRCAll || 0)),
    count: formatQuantity(row?.countorder || printableItems.length),
  }), [printableItems.length, row?.countorder, row?.discountRC, row?.totalRC, row?.totalRCAll, row?.vatRC])

  const legalIssues = useMemo(() => {
    const issues: string[] = []

    if (!String(row?.tax_no || row?.invoice_No || '').trim()) {
      issues.push('ยังไม่บันทึกเลขที่ใบกำกับภาษีหรือเลขที่เอกสารผู้ขาย')
    }
    if (!String(row?.tax_date || '').trim()) {
      issues.push('ยังไม่บันทึกวันที่ใบกำกับภาษี')
    }
    if (!sellerNameRaw) {
      issues.push('ยังไม่พบชื่อผู้ขาย')
    }
    if (!sellerAddressRaw) {
      issues.push('ยังไม่พบบันทึกที่อยู่ผู้ขาย')
    }
    if (!sellerTaxIdRaw) {
      issues.push('ยังไม่พบบันทึกเลขประจำตัวผู้เสียภาษีของผู้ขาย')
    }
    if (!buyerLegalNameRaw) {
      issues.push('ยังไม่บันทึกชื่อกิจการผู้ซื้อ')
    }
    if (!buyerAddressRaw) {
      issues.push('ยังไม่บันทึกที่อยู่ผู้ซื้อ')
    }
    if (!buyerTaxIdRaw) {
      issues.push('ยังไม่บันทึกเลขประจำตัวผู้เสียภาษีของผู้ซื้อ')
    }

    return issues
  }, [buyerAddressRaw, buyerLegalNameRaw, buyerTaxIdRaw, row?.invoice_No, row?.tax_date, row?.tax_no, sellerAddressRaw, sellerNameRaw, sellerTaxIdRaw])

  const printableDocumentTitle = row
    ? `purchase-tax-invoice-${String(row.tax_no || row.invoice_No || row.orderfull || row.id)}`
    : 'purchase-tax-invoice'

  const reactToPrintFn = useReactToPrint({
    contentRef: previewRef,
    documentTitle: printableDocumentTitle,
    pageStyle: PURCHASE_TAX_INVOICE_PRINT_PAGE_STYLE,
  })

  return (
    <Modal show={Boolean(openReceiveId)} onHide={onClose} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <div className="d-flex align-items-center" style={{ gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #b45309, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'kanit_B', fontSize: 16 }}>รายงานใบกำกับภาษีซื้อ</div>
              <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#6b7280' }}>Purchase Tax Invoice Report</div>
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: '#eef2f7' }}>
        {loading ? (
          <div style={loadingStateStyle}>กำลังเตรียมรายงานใบกำกับภาษีซื้อ...</div>
        ) : loadError ? (
          <div style={errorStateStyle}>{loadError}</div>
        ) : row ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <StatusChip label="เลขที่ภาษี" value={documentNumber} background="#fff7ed" color="#b45309" />
              <StatusChip label="ผู้ขาย" value={formatText(row.names, '-')} background="#F3F8FC" color="#1E5088" />
              <StatusChip label="ยอดสุทธิ" value={`${formatCurrency(summaryValues.total)} บาท`} background="#ecfeff" color="#0f766e" />
              <StatusChip label="ความพร้อม" value={legalIssues.length === 0 ? 'ข้อมูลกฎหมายครบ' : 'ต้องตรวจข้อมูล'} background={legalIssues.length === 0 ? '#D3F0E2' : '#fef3c7'} color={legalIssues.length === 0 ? '#0C5238' : '#92400e'} />
            </div>

            {legalIssues.length > 0 ? (
              <div style={warningStateStyle}>
                <div className="d-flex align-items-center" style={{ gap: 8, fontFamily: 'kanit_B', fontSize: 13 }}>
                  <AlertCircle size={16} />
                  พบข้อมูลที่ควรตรวจสอบก่อนพิมพ์ {legalIssues.length} จุด
                </div>
                <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                  {legalIssues.map((issue) => (
                    <div key={issue} style={{ fontFamily: 'kanit', fontSize: 12, lineHeight: 1.55 }}>
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={successStateStyle}>
                ชื่อ ที่อยู่ และเลขประจำตัวผู้เสียภาษีของผู้ซื้อและผู้ขายถูกจัดวางพร้อมใช้ในรายงานแล้ว
              </div>
            )}

            <PurchaseTaxInvoiceSheet
              previewRef={previewRef}
              documentNumber={documentNumber}
              receiptNumber={receiptNumber}
              issueDateText={issueDateText}
              sellerParty={sellerParty}
              buyerParty={buyerParty}
              infoItems={infoItems}
              items={printableItems}
              person={formatText(row.persons, '-')}
              summaryValues={summaryValues}
            />
          </div>
        ) : null}
      </Modal.Body>

      <Modal.Footer style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#6b7280' }}>
          {legalIssues.length === 0 ? 'พร้อมพิมพ์รายงานใบกำกับภาษีซื้อในรูปแบบ A4' : 'ควรตรวจสอบข้อมูลภาษีที่แจ้งเตือนก่อนพิมพ์เพื่อความครบถ้วน'}
        </div>
        <div className="d-flex align-items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={reactToPrintFn} className="btn btn-outline-dark" style={{ ...footerButtonStyle, minWidth: 104, display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={loading || !row}><Printer size={14} />พิมพ์</button>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={footerButtonStyle}>ปิด</button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

function PurchaseTaxInvoiceSheet({
  previewRef,
  documentNumber,
  receiptNumber,
  issueDateText,
  sellerParty,
  buyerParty,
  infoItems,
  items,
  person,
  summaryValues,
}: {
  previewRef: React.RefObject<HTMLDivElement | null>
  documentNumber: string
  receiptNumber: string
  issueDateText: string
  sellerParty: PartyInfo
  buyerParty: PartyInfo
  infoItems: InfoItem[]
  items: PrintableItem[]
  person: string
  summaryValues: { subtotal: number; discount: number; vat: number; total: number; count: string }
}) {
  return (
    <div style={reportPreviewFrameStyle}>
      <div ref={previewRef} className="purchase-tax-report-sheet" style={reportSheetStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'kanit_B', fontSize: 24, color: '#0f172a', lineHeight: 1.1 }}>ใบกำกับภาษีซื้อ</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#475569' }}>Purchase Tax Invoice</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '5px 10px', background: '#fff7ed', color: '#b45309', fontFamily: 'kanit_B', fontSize: 10.5 }}>รายงานภาษีซื้อ</div>
            <div style={{ fontFamily: 'kanit_B', fontSize: 17, color: '#0f172a', marginTop: 10 }}>{documentNumber}</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#475569', marginTop: 4 }}>วันที่ใบกำกับ {issueDateText}</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#64748b', marginTop: 2 }}>อ้างอิงใบรับสินค้า {receiptNumber}</div>
          </div>
        </div>

        <div style={reportBannerStyle}>
          เอกสารนี้จัดวางข้อมูลชื่อ ที่อยู่ และเลขประจำตัวผู้เสียภาษีของผู้ขายและผู้ซื้อไว้ครบในรูปแบบพร้อมพิมพ์ สำหรับใช้จัดเก็บและตรวจสอบภาษีซื้อภายในกิจการ
        </div>

        <div className="purchase-tax-report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 16 }}>
          <PartyCard party={sellerParty} />
          <PartyCard party={buyerParty} />
        </div>

        <div style={reportSectionTitleStyle}>ข้อมูลเอกสารอ้างอิง</div>
        <div className="purchase-tax-report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, marginBottom: 12 }}>
          {infoItems.map((item) => (
            <InfoCard key={item.label} item={item} />
          ))}
        </div>

        <div style={reportSectionTitleStyle}>รายการสินค้า / บริการ</div>
        <div style={reportTableWrapStyle}>
          <table className="purchase-tax-report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={reportTableHeadCenterStyle}>ลำดับ</th>
                <th style={reportTableHeadStyle}>รหัส</th>
                <th style={reportTableHeadStyle}>รายการ</th>
                <th style={reportTableHeadCenterStyle}>จำนวน</th>
                <th style={reportTableHeadCenterStyle}>หน่วย</th>
                <th style={reportTableHeadRightStyle}>ราคาต่อหน่วย</th>
                <th style={reportTableHeadRightStyle}>ส่วนลด</th>
                <th style={reportTableHeadRightStyle}>มูลค่าสุทธิ</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={reportTableEmptyCellStyle}>ยังไม่มีรายการสินค้าในใบรับสินค้านี้</td>
                </tr>
              ) : items.map((item, index) => (
                <tr key={item.id}>
                  <td style={reportTableBodyCenterStyle}>{index + 1}</td>
                  <td style={reportTableBodyStyle}>{item.code}</td>
                  <td style={reportTableBodyStyle}>
                    <div>{item.name}</div>
                    {item.note ? <div style={{ marginTop: 2, fontSize: 10.5, color: '#64748b' }}>{item.note}</div> : null}
                  </td>
                  <td style={reportTableBodyCenterStyle}>{item.qty}</td>
                  <td style={reportTableBodyCenterStyle}>{item.unit}</td>
                  <td style={reportTableBodyRightStyle}>{item.unitPrice}</td>
                  <td style={reportTableBodyRightStyle}>{item.discount}</td>
                  <td style={reportTableBodyRightStyle}>{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="purchase-tax-report-footer" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(260px, 0.92fr)', gap: 12, alignItems: 'start', marginBottom: 16 }}>
          <div style={reportNarrativeCardStyle}>
            <div style={reportCardTitleStyle}>หมายเหตุสำหรับจัดเก็บภาษีซื้อ</div>
            <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#1f2937', lineHeight: 1.8 }}>
              <div><span style={{ fontFamily: 'kanit_B' }}>เลขที่อ้างอิงรับสินค้า:</span> {receiptNumber}</div>
              <div style={{ marginTop: 8 }}><span style={{ fontFamily: 'kanit_B' }}>จำนวนรายการสินค้า:</span> {summaryValues.count} รายการ</div>
              <div style={{ marginTop: 8 }}><span style={{ fontFamily: 'kanit_B' }}>ผู้จัดทำรายงาน:</span> {person}</div>
              <div style={{ marginTop: 8 }}><span style={{ fontFamily: 'kanit_B' }}>การใช้งาน:</span> ใช้เป็นรายงานตรวจสอบความครบถ้วนของใบกำกับภาษีซื้อก่อนนำไปบันทึกหรือจัดเก็บประจำเดือน</div>
            </div>
          </div>

          <div style={reportSummaryCardStyle}>
            <div style={reportCardTitleStyle}>สรุปมูลค่าเอกสาร</div>
            <SummaryRow label="มูลค่าก่อนภาษี" value={formatCurrency(summaryValues.subtotal)} />
            <SummaryRow label="ส่วนลด" value={formatCurrency(summaryValues.discount)} />
            <SummaryRow label="ภาษีมูลค่าเพิ่ม 7%" value={formatCurrency(summaryValues.vat)} />
            <div style={{ ...reportSummaryRowStyle, marginTop: 8, paddingTop: 8, borderTop: '1px dashed #fdba74', fontFamily: 'kanit_B', color: '#7c2d12' }}>
              <span>ยอดรวมสุทธิ</span>
              <span>{formatCurrency(summaryValues.total)}</span>
            </div>
          </div>
        </div>

        <div className="purchase-tax-report-signatures" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <SignatureCard title="ผู้จัดทำรายงาน" name={person} note="ลงชื่อผู้จัดทำรายงานภาษีซื้อ" />
          <SignatureCard title="ผู้ตรวจสอบข้อมูล" name={buyerParty.name} note="ลงชื่อผู้ตรวจสอบความครบถ้วนของเอกสาร" />
        </div>
      </div>
    </div>
  )
}

function StatusChip({ label, value, background, color }: { label: string; value: string; background: string; color: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 12, background, border: '1px solid rgba(148,163,184,0.18)', minWidth: 170 }}>
      <div style={{ fontFamily: 'kanit', fontSize: 10.5, color }}>{label}</div>
      <div style={{ fontFamily: 'kanit_B', fontSize: 13, color, lineHeight: 1.35 }}>{value}</div>
    </div>
  )
}

function PartyCard({ party }: { party: PartyInfo }) {
  return (
    <div style={reportPartyCardStyle}>
      <div style={reportCardTitleStyle}>{party.title}</div>
      <div style={{ fontFamily: 'kanit_B', fontSize: 12, color: '#0f172a', marginTop: 4, lineHeight: 1.25 }}>{party.name}</div>
      {party.subtitle ? <div style={{ fontFamily: 'kanit', fontSize: 9.5, color: '#64748b', marginTop: 1, lineHeight: 1.25 }}>{party.subtitle}</div> : null}
      <div style={{ display: 'grid', gap: 3, marginTop: 6 }}>
        <MetaRow label="เลขประจำตัวผู้เสียภาษี" value={party.taxId} />
        <MetaRow label="ที่อยู่" value={party.address} />
        <MetaRow label="โทร" value={party.tel} />
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={reportMetaRowStyle}>
      <span style={reportMetaLabelStyle}>{label}</span>
      <span style={reportMetaValueStyle}>{value}</span>
    </div>
  )
}

function InfoCard({ item }: { item: InfoItem }) {
  return (
    <div style={reportInfoCardStyle}>
      <div style={{ fontFamily: 'kanit', fontSize: 10, color: '#64748b', lineHeight: 1.35 }}>{item.label}</div>
      <div style={{ fontFamily: 'kanit_B', fontSize: 11, color: '#0f172a', lineHeight: 1.35, textAlign: 'right' }}>{item.value}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={reportSummaryRowStyle}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function SignatureCard({ title, name, note }: { title: string; name: string; note: string }) {
  return (
    <div style={reportSignatureCardStyle}>
      <div style={reportCardTitleStyle}>{title}</div>
      <div style={{ height: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: 'kanit', fontSize: 12, color: '#334155', textAlign: 'center' }}>{name}</div>
      <div style={{ borderTop: '1px dashed #94a3b8', marginTop: 10, paddingTop: 8, textAlign: 'center', fontFamily: 'kanit', fontSize: 11, color: '#475569' }}>{note}</div>
      <div style={{ textAlign: 'center', fontFamily: 'kanit', fontSize: 10.5, color: '#94a3b8', marginTop: 8 }}>วันที่ ........../........../..............</div>
    </div>
  )
}

const loadingStateStyle: React.CSSProperties = {
  minHeight: 180,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'kanit_B',
  fontSize: 16,
  color: '#475569',
}

const errorStateStyle: React.CSSProperties = {
  minHeight: 180,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: '1px solid #fecaca',
  background: '#fff1f2',
  color: '#b91c1c',
  fontFamily: 'kanit_B',
  fontSize: 15,
}

const warningStateStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #fed7aa',
  background: '#fff7ed',
  color: '#9a3412',
  padding: '14px 16px',
}

const successStateStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #CCDFF1',
  background: '#F3F8FC',
  color: '#173F6B',
  padding: '12px 16px',
  fontFamily: 'kanit_B',
  fontSize: 12.5,
}

const footerButtonStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 12,
  minWidth: 86,
}

const reportPreviewFrameStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)',
  border: '1px solid #dbe3ee',
}

const reportSheetStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  padding: '18mm 16mm',
  borderRadius: 18,
  background: '#ffffff',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
  color: '#0f172a',
  fontFamily: 'kanit',
}

const reportBannerStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: '12px 14px',
  borderRadius: 14,
  background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
  border: '1px solid #fed7aa',
  color: '#9a3412',
  fontFamily: 'kanit',
  fontSize: 12,
  lineHeight: 1.65,
}

const reportSectionTitleStyle: React.CSSProperties = {
  marginBottom: 8,
  fontFamily: 'kanit_B',
  fontSize: 13,
  color: '#0f172a',
}

const reportCardTitleStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 11.5,
  color: '#0f172a',
}

const reportPartyCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: '12px 14px',
}

const reportMetaRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '118px minmax(0, 1fr)',
  gap: 8,
  alignItems: 'start',
}

const reportMetaLabelStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 10.5,
  color: '#64748b',
}

const reportMetaValueStyle: React.CSSProperties = {
  fontFamily: 'kanit_B',
  fontSize: 10.5,
  color: '#1f2937',
  textAlign: 'right',
  lineHeight: 1.45,
  wordBreak: 'break-word',
}

const reportInfoCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: '10px 12px',
}

const reportTableWrapStyle: React.CSSProperties = {
  borderRadius: 14,
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  marginBottom: 16,
}

const reportTableHeadStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#f8fafc',
  color: '#475569',
  fontFamily: 'kanit_B',
  fontSize: 10.5,
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'left',
}

const reportTableHeadCenterStyle: React.CSSProperties = {
  ...reportTableHeadStyle,
  textAlign: 'center',
}

const reportTableHeadRightStyle: React.CSSProperties = {
  ...reportTableHeadStyle,
  textAlign: 'right',
}

const reportTableBodyStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #eef2f7',
  fontFamily: 'kanit',
  fontSize: 11,
  color: '#1f2937',
  verticalAlign: 'top',
}

const reportTableBodyCenterStyle: React.CSSProperties = {
  ...reportTableBodyStyle,
  textAlign: 'center',
}

const reportTableBodyRightStyle: React.CSSProperties = {
  ...reportTableBodyStyle,
  textAlign: 'right',
}

const reportTableEmptyCellStyle: React.CSSProperties = {
  padding: '24px 12px',
  textAlign: 'center',
  color: '#94a3b8',
  fontFamily: 'kanit',
  fontSize: 12,
}

const reportNarrativeCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: '14px 16px',
}

const reportSummaryCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #fed7aa',
  background: '#fffbeb',
  padding: '14px 16px',
}

const reportSummaryRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  fontFamily: 'kanit',
  fontSize: 12,
  color: '#334155',
  marginTop: 8,
}

const reportSignatureCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: '14px 16px',
}

const PURCHASE_TAX_INVOICE_PRINT_PAGE_STYLE = `
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

    .purchase-tax-report-sheet {
      width: auto !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    .purchase-tax-report-grid,
    .purchase-tax-report-footer,
    .purchase-tax-report-signatures {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .purchase-tax-report-table thead {
      display: table-header-group;
    }

    .purchase-tax-report-table tr {
      page-break-inside: avoid;
    }
  }
`