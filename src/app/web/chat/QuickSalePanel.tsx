'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import {
  X, Search, ScanLine, Plus, Minus, Trash2, Receipt, Tag,
  QrCode, Send, Loader2, ChevronDown, ChevronUp, Package, CheckSquare, Square,
  CreditCard, Banknote, ArrowRightLeft, ShoppingBag, Percent, CheckCircle,
} from 'lucide-react'
import PromptPayQRCode from '../componant/PromptPayQRCode'

// =====================================================
// Types
// =====================================================
interface Product {
  id: number
  code: string
  ProductName: string
  Barcode?: string
  Unit?: string
  price?: number
  PriceA?: number
  PriceB?: number
  PriceC?: number
  PriceD?: number
  PriceE?: number
  PriceF?: number
  PriceG?: number
  PriceH?: number
  pic?: string
}

interface CartItem {
  code: string
  name: string
  price: number
  qty: number
  unit: string
  barcode?: string
}

interface LabelData {
  indicatorlistS?: string
  timeS?: string
  useS?: string
  timeuseS?: string
  keepS?: string
  remarkS?: string
}

interface StoreInfo {
  namestore?: string
  address?: string
  tel?: string
  taxnumber?: string
}

interface Props {
  conversationId: number
  agentName: string
  contactName: string
  origin: string
  onSent?: () => void
  onClose: () => void
}

// =====================================================
// Utils
// =====================================================
const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#6366F1',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 10,
}

const CARD_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
}

const BTN_PRIMARY: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
  color: '#FFF',
  border: 'none',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  fontFamily: 'Kanit',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'all 0.15s',
}

const BTN_GHOST: React.CSSProperties = {
  background: '#F8FAFC',
  color: '#475569',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 11,
  fontFamily: 'Kanit',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}

const baht = (n: number) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// =====================================================
// Main Component
// =====================================================
export default function QuickSalePanel({
  conversationId, agentName, contactName, origin, onSent, onClose,
}: Props) {
  const company = typeof window !== 'undefined' ? (localStorage.getItem('company_') || '') : ''

  // ---- Search / Products ----
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // ---- Cart ----
  const [cart, setCart] = useState<CartItem[]>([])

  // ---- Bill discount & payment ----
  const [billDiscount, setBillDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'baht' | 'percent'>('baht')
  const [payMethod, setPayMethod] = useState<'cash' | 'payment' | 'split'>('payment')
  const [cashAmount, setCashAmount] = useState(0)
  const [transferAmount, setTransferAmount] = useState(0)

  // ---- Checkout ----
  const [paying, setPaying] = useState(false)
  const [paidSuccess, setPaidSuccess] = useState(false)

  // ---- Store info for receipt ----
  const [store, setStore] = useState<StoreInfo>({})

  // ---- Payment (Online Transfer / PromptPay) ----
  const [promptPayId, setPromptPayId] = useState('')

  // ---- Labels ----
  const [labelMap, setLabelMap] = useState<Record<string, LabelData>>({})
  const [selectedLabels, setSelectedLabels] = useState<Record<string, boolean>>({})

  // ---- Sending state ----
  const [sendingReceipt, setSendingReceipt] = useState(false)
  const [sendingQR, setSendingQR] = useState(false)
  const [sendingLabels, setSendingLabels] = useState(false)

  // ---- Collapsible sections ----
  const [openSection, setOpenSection] = useState<'sell' | 'label' | 'qr' | null>('sell')

  // ---- QR canvas ref (for capturing image) ----
  const qrWrapRef = useRef<HTMLDivElement>(null)

  // =====================================================
  // Per-conversation cart persistence
  // =====================================================
  interface ConversationSaleData {
    cart: CartItem[]
    billDiscount: number
    discountType: 'baht' | 'percent'
    payMethod: 'cash' | 'payment' | 'split'
    cashAmount: number
    transferAmount: number
    paidSuccess: boolean
    labelMap: Record<string, LabelData>
    selectedLabels: Record<string, boolean>
  }
  const saleDataMap = useRef<Record<number, ConversationSaleData>>({})
  const prevConvId = useRef<number>(conversationId)

  useEffect(() => {
    // Save previous conversation's data
    if (prevConvId.current !== conversationId) {
      saleDataMap.current[prevConvId.current] = {
        cart, billDiscount, discountType, payMethod,
        cashAmount, transferAmount, paidSuccess, labelMap, selectedLabels,
      }
    }

    // Restore data for new conversation (or reset)
    const saved = saleDataMap.current[conversationId]
    if (saved) {
      setCart(saved.cart)
      setBillDiscount(saved.billDiscount)
      setDiscountType(saved.discountType)
      setPayMethod(saved.payMethod)
      setCashAmount(saved.cashAmount)
      setTransferAmount(saved.transferAmount)
      setPaidSuccess(saved.paidSuccess)
      setLabelMap(saved.labelMap)
      setSelectedLabels(saved.selectedLabels)
    } else {
      setCart([])
      setBillDiscount(0)
      setDiscountType('baht')
      setPayMethod('payment')
      setCashAmount(0)
      setTransferAmount(0)
      setPaidSuccess(false)
      setLabelMap({})
      setSelectedLabels({})
    }

    setSearchQuery('')
    setProducts([])
    prevConvId.current = conversationId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // =====================================================
  // Load initial: store info + payment (PromptPay number)
  // =====================================================
  useEffect(() => {
    if (!company) return
    axios.get(`/api/setting/store/store?company=${company}`)
      .then(res => setStore(res.data?.[0] || {}))
      .catch(() => {})
    axios.get(`/api/setting/payment?company=${company}`)
      .then(res => {
        const row = res.data?.[0]
        if (row) setPromptPayId(row.promtpayno || row.bookbankno || '')
      })
      .catch(() => {})
  }, [company])

  // =====================================================
  // Product search (debounced)
  // =====================================================
  useEffect(() => {
    if (!company) return
    if (!searchQuery.trim()) { setProducts([]); return }
    const handle = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await axios.get(`/api/datalist`, {
          params: { company, q: searchQuery.trim(), fields: 'sale', take: 20 },
        })
        setProducts(res.data || [])
      } catch (e) {
        console.error('search product error', e)
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(handle)
  }, [searchQuery, company])

  // =====================================================
  // Barcode scan handler (Enter key)
  // =====================================================
  const handleBarcodeScan = useCallback(async (code: string) => {
    const val = code.trim()
    if (!val || !company) return
    try {
      const res = await axios.get('/api/datalist', {
        params: { company, Barcode: val, fields: 'sale', take: 1 },
      })
      const prod: Product | undefined = res.data?.[0]
      if (prod) {
        addToCart(prod)
        setSearchQuery('')
      } else {
        alert(`ไม่พบสินค้าจาก Barcode: ${val}`)
      }
    } catch (e) {
      console.error(e)
    }
  }, [company])

  // =====================================================
  // Cart operations
  // =====================================================
  const addToCart = (p: Product) => {
    setCart(prev => {
      const exists = prev.find(it => it.code === p.code)
      if (exists) {
        return prev.map(it => it.code === p.code ? { ...it, qty: it.qty + 1 } : it)
      }
      return [...prev, {
        code: p.code,
        name: p.ProductName || p.code,
        price: Number(p.price || 0),
        qty: 1,
        unit: p.Unit || '',
        barcode: p.Barcode || '',
      }]
    })
  }

  const updateQty = (code: string, delta: number) => {
    setCart(prev => prev
      .map(it => it.code === code ? { ...it, qty: Math.max(1, it.qty + delta) } : it)
    )
  }

  const removeItem = (code: string) => {
    setCart(prev => prev.filter(it => it.code !== code))
    setSelectedLabels(prev => { const n = { ...prev }; delete n[code]; return n })
    setLabelMap(prev => { const n = { ...prev }; delete n[code]; return n })
  }

  const clearCart = () => {
    if (cart.length && !confirm('ล้างรายการทั้งหมด?')) return
    setCart([])
    setSelectedLabels({})
    setLabelMap({})
    setBillDiscount(0)
    setDiscountType('baht')
    setPayMethod('payment')
    setCashAmount(0)
    setTransferAmount(0)
    setPaidSuccess(false)
    // Also clear saved data for this conversation
    delete saleDataMap.current[conversationId]
  }

  const subtotal = useMemo(
    () => cart.reduce((a, it) => a + it.price * it.qty, 0),
    [cart]
  )

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') return Math.round(subtotal * Math.min(billDiscount, 100) / 100 * 100) / 100
    return Math.min(billDiscount, subtotal)
  }, [subtotal, billDiscount, discountType])

  const totalAmount = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount])

  // =====================================================
  // Fetch labels for items in cart
  // =====================================================
  useEffect(() => {
    if (!company || openSection !== 'label') return
    cart.forEach(item => {
      if (labelMap[item.code] !== undefined) return
      axios.get('/api/label/labeldata', { params: { company, code: item.code } })
        .then(res => {
          const data = res.data?.[0] || {}
          setLabelMap(prev => ({ ...prev, [item.code]: data }))
        })
        .catch(() => {
          setLabelMap(prev => ({ ...prev, [item.code]: {} }))
        })
    })
  }, [cart, company, openSection, labelMap])

  const toggleLabelSelect = (code: string) => {
    setSelectedLabels(prev => ({ ...prev, [code]: !prev[code] }))
  }
  const selectAllLabels = () => {
    const all: Record<string, boolean> = {}
    cart.forEach(it => { all[it.code] = true })
    setSelectedLabels(all)
  }
  const clearLabelSelection = () => setSelectedLabels({})

  // =====================================================
  // Compose receipt text
  // =====================================================
  const buildReceiptText = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    const payLabel = payMethod === 'cash' ? 'เงินสด' : payMethod === 'payment' ? 'โอน' : 'เงินสด+โอน'

    const lines: string[] = []
    lines.push(`🧾 ใบเสร็จรับเงิน`)
    if (store.namestore) lines.push(`🏪 ${store.namestore}`)
    if (store.address) lines.push(store.address)
    if (store.tel) lines.push(`โทร ${store.tel}`)
    if (store.taxnumber) lines.push(`เลขผู้เสียภาษี ${store.taxnumber}`)
    lines.push(`————————————————`)
    lines.push(`วันที่ ${dateStr}  ${timeStr}`)
    lines.push(`ลูกค้า: ${contactName || 'ลูกค้าทั่วไป'}`)
    lines.push(`พนักงาน: ${agentName}`)
    lines.push(`————————————————`)
    cart.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.name}`)
      lines.push(`   ${it.qty} ${it.unit || ''} × ${baht(it.price)} = ${baht(it.price * it.qty)} บ.`)
    })
    lines.push(`————————————————`)
    lines.push(`รวม ${cart.length} รายการ`)
    lines.push(`รวมเงิน: ${baht(subtotal)} บาท`)
    if (discountAmount > 0) lines.push(`ส่วนลด: -${baht(discountAmount)} บาท`)
    lines.push(`💰 ยอดสุทธิ: ${baht(totalAmount)} บาท`)
    lines.push(`ช่องทางชำระ: ${payLabel}`)
    if ((payMethod === 'payment' || payMethod === 'split') && promptPayId)
      lines.push(`PromptPay: ${promptPayId}`)
    if (payMethod === 'split') {
      lines.push(`เงินสด: ${baht(cashAmount)} / โอน: ${baht(transferAmount)}`)
    }
    lines.push(``)
    lines.push(`ขอบคุณที่ใช้บริการครับ 🙏`)
    return lines.join('\n')
  }

  // =====================================================
  // Send chat message helper
  // =====================================================
  const sendChatMessage = async (content: string, messageType = 'text', mediaUrl?: string) => {
    await axios.post('/api/chat/messages', {
      conversationId,
      agentName,
      content,
      messageType,
      mediaUrl,
      origin,
    })
  }

  // =====================================================
  // Send receipt via chat
  // =====================================================
  const handleSendReceipt = async () => {
    if (cart.length === 0) { alert('กรุณาเพิ่มสินค้าก่อน'); return }
    setSendingReceipt(true)
    try {
      await sendChatMessage(buildReceiptText(), 'text')
      onSent?.()
      alert('ส่งใบเสร็จทาง Chat เรียบร้อย ✅')
    } catch (e: any) {
      alert('ส่งไม่สำเร็จ: ' + (e?.response?.data?.error || e?.message))
    } finally {
      setSendingReceipt(false)
    }
  }

  // =====================================================
  // Checkout: create sale (same as main sales page)
  // =====================================================
  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (payMethod === 'split') {
      if (cashAmount + transferAmount < totalAmount) {
        alert('ยอดเงินสด + โอน ไม่เพียงพอ'); return
      }
    }

    if (!confirm(`ยืนยันชำระสินค้า ${baht(totalAmount)} บาท?`)) return
    setPaying(true)

    try {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const orderNo = `${pad(now.getDate())}${pad(now.getMonth() + 1)}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      const payLabel = payMethod === 'cash' ? 'เงินสด' : payMethod === 'payment' ? 'โอน' : 'เงินสด+โอน'
      const transferDetail = (payMethod === 'payment' || payMethod === 'split') ? 'promptpay' : ''

      const sales = cart.map(it => ({
        company,
        id_product: 0,
        code_product: it.code,
        name_product: it.name,
        cetagory: '',
        fixname: '',
        unit: it.unit,
        cost: 0,
        qty: it.qty,
        subunit: it.unit,
        subqty: it.qty,
        price: it.price,
        gifts: 0,
        discount: 0,
        total: it.price * it.qty,
        barcode: it.barcode || '',
        id_receive1: 0, lot_receive1: '', qty_lot1: 0,
        id_receive2: 0, lot_receive2: '', qty_lot2: 0,
        id_receive3: 0, lot_receive3: '', qty_lot3: 0,
        person: agentName,
        statuss: '',
        type: '',
        name_customer: contactName || '',
        id_card: '',
        phone: '',
        pharmacy: typeof window !== 'undefined' ? (localStorage.getItem('ps') || '') : '',
      }))

      const historys = [{
        code_costomer: '',
        company,
        id_costomer: 0,
        name_customer: contactName || '',
        duedate: new Date(),
        followup: '',
        solution: '',
        id_history: 0,
        count: 0,
        statusH: '',
        person: agentName,
        remark: 'ขายทาง Chat',
      }]

      // 1) Create sale
      await axios.post('/api/sale', {
        companyall: company,
        id_costomer: 0,
        code_costomer: '',
        group_price: '',
        pay: payLabel,
        bill: cart.length,
        totalall: subtotal,
        discount: discountAmount,
        sumtotal: totalAmount,
        addreward: 0,
        usereward: 0,
        personall: agentName,
        statussall: '',
        orderNo,
        transferDetail,
        cashAmount: payMethod === 'split' ? cashAmount : null,
        transferAmount: payMethod === 'split' ? transferAmount : null,
        discountReason: discountAmount > 0 ? `ลดท้ายบิล Chat ${discountType === 'percent' ? `${billDiscount}%` : `${billDiscount}฿`}` : '',
        sales,
        historys,
        vatEnabled: 'false',
        taxInvoiceNo: '',
        vatAmount: 0,
        beforeVat: 0,
      })

      // 2) Cut stock
      for (const it of cart) {
        try {
          await axios.post('/api/cutstock', {
            itemcode: it.code,
            quantity: it.qty,
            company,
            person: agentName,
            transaction_type: 'SALE',
          })
        } catch (e) {
          console.error(`Cutstock failed ${it.code}:`, e)
        }
      }

      // 3) Send receipt via chat
      await sendChatMessage(buildReceiptText(), 'text')

      onSent?.()
      setPaidSuccess(true)
      toast.success(
        <div style={{ fontFamily: 'Kanit', fontSize: 14 }}>ชำระเงินสำเร็จ 🎉</div>,
        { description: <div style={{ fontFamily: 'Kanit' }}>บันทึกการขาย + ส่งใบเสร็จทาง Chat เรียบร้อย</div>, duration: 4000 }
      )
    } catch (e: any) {
      console.error('Checkout error:', e)
      alert('ชำระไม่สำเร็จ: ' + (e?.response?.data?.error || e?.message))
    } finally {
      setPaying(false)
    }
  }

  // =====================================================
  // Send QR Payment via chat
  // =====================================================
  const canvasToFile = async (canvas: HTMLCanvasElement, name: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('toBlob failed'))
        resolve(new File([blob], name, { type: 'image/png' }))
      }, 'image/png')
    })
  }

  const handleSendQR = async () => {
    if (!promptPayId) { alert('กรุณาตั้งค่าเลข PromptPay ในหน้า Settings ก่อน'); return }
    if (totalAmount <= 0) { alert('ยอดต้องมากกว่า 0'); return }
    const canvas = qrWrapRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) { alert('ไม่พบ QR'); return }
    setSendingQR(true)
    try {
      const file = await canvasToFile(canvas, `promptpay-${Date.now()}.png`)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'image')
      const up = await axios.post('/api/chat/upload', fd)
      const mediaUrl = up.data.mediaUrl

      // Send image first
      await sendChatMessage('QR Payment PromptPay', 'image', mediaUrl)

      // Then summary text
      const summary = [
        `💳 QR ชำระเงิน (PromptPay)`,
        `ลูกค้า: ${contactName || 'ลูกค้าทั่วไป'}`,
        `ยอดชำระ: ${baht(totalAmount)} บาท`,
        `PromptPay: ${promptPayId}`,
        ``,
        `ส่วนสรุปรายการ:`,
        ...cart.map(it => `• ${it.name} × ${it.qty} = ${baht(it.price * it.qty)}`),
        `————————————————`,
        `รวม: ${baht(totalAmount)} บาท`,
        `กรุณาสแกน QR เพื่อชำระเงินครับ 🙏`,
      ].join('\n')
      await sendChatMessage(summary, 'text')
      onSent?.()
      alert('ส่ง QR Payment เรียบร้อย ✅')
    } catch (e: any) {
      alert('ส่งไม่สำเร็จ: ' + (e?.response?.data?.error || e?.message))
    } finally {
      setSendingQR(false)
    }
  }

  // =====================================================
  // Send labels via chat
  // =====================================================
  const buildLabelText = (it: CartItem, data: LabelData) => {
    const parts: string[] = []
    parts.push(`🏷️ ฉลากสินค้า: ${it.name}`)
    if (it.qty) parts.push(`จำนวน: ${it.qty} ${it.unit || ''}`)
    if (data?.indicatorlistS) parts.push(`สรรพคุณ/ข้อบ่งใช้: ${data.indicatorlistS}`)
    if (data?.useS) parts.push(`วิธีใช้: ${data.useS}`)
    if (data?.timeS) parts.push(`เวลา: ${data.timeS}`)
    if (data?.timeuseS) parts.push(`ช่วงการใช้: ${data.timeuseS}`)
    if (data?.keepS) parts.push(`การเก็บรักษา: ${data.keepS}`)
    if (data?.remarkS) parts.push(`หมายเหตุ: ${data.remarkS}`)
    parts.push(`👉 กรุณาใช้สินค้าตามคำแนะนำเภสัชกร`)
    return parts.join('\n')
  }

  const handleSendLabels = async (mode: 'selected' | 'all') => {
    if (cart.length === 0) { alert('ไม่มีสินค้าในรายการ'); return }
    const items = mode === 'all'
      ? cart
      : cart.filter(it => selectedLabels[it.code])
    if (items.length === 0) { alert('ยังไม่ได้เลือกฉลาก'); return }

    setSendingLabels(true)
    try {
      // Fetch any labels not yet in map
      for (const it of items) {
        if (labelMap[it.code] === undefined) {
          try {
            const res = await axios.get('/api/label/labeldata', { params: { company, code: it.code } })
            const data = res.data?.[0] || {}
            setLabelMap(prev => ({ ...prev, [it.code]: data }))
            labelMap[it.code] = data
          } catch {
            labelMap[it.code] = {}
          }
        }
      }

      // Send header
      await sendChatMessage(
        `🏷️ ฉลากสินค้า (${items.length} รายการ)\nสำหรับคุณ ${contactName || 'ลูกค้า'}`,
        'text'
      )

      // Send each label
      for (const it of items) {
        const data = labelMap[it.code] || {}
        await sendChatMessage(buildLabelText(it, data), 'text')
      }

      onSent?.()
      alert(`ส่งฉลาก ${items.length} รายการ เรียบร้อย ✅`)
    } catch (e: any) {
      alert('ส่งไม่สำเร็จ: ' + (e?.response?.data?.error || e?.message))
    } finally {
      setSendingLabels(false)
    }
  }

  // =====================================================
  // Render helpers
  // =====================================================
  const SectionHeader = ({
    id, icon, title, count,
  }: { id: 'sell' | 'label' | 'qr'; icon: React.ReactNode; title: string; count?: number }) => {
    const open = openSection === id
    return (
      <div
        onClick={() => setOpenSection(open ? null : id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', cursor: 'pointer',
          background: open ? 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' : '#FFF',
          border: '1px solid',
          borderColor: open ? '#C7D2FE' : '#E2E8F0',
          borderRadius: 10, marginBottom: open ? 8 : 10,
          transition: 'all 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: open ? '#6366F1' : '#F1F5F9',
            color: open ? '#FFF' : '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{title}</div>
            {typeof count === 'number' && (
              <div style={{ fontSize: 10, color: '#64748B' }}>{count} รายการ</div>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={16} color="#6366F1" /> : <ChevronDown size={16} color="#94A3B8" />}
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div style={{
      width: 380, minWidth: 360, maxWidth: 420,
      borderLeft: '1px solid #E2E8F0', background: '#F8FAFC',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Kanit',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #E2E8F0', background: '#FFF',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Receipt size={17} color="#FFF" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>ขาย & ส่งทาง Chat</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>
              {contactName || 'ลูกค้า'} · {payMethod === 'cash' ? 'เงินสด' : payMethod === 'payment' ? 'โอน Online' : 'เงินสด+โอน'}
            </div>
          </div>
        </div>
        <X size={18} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={onClose} />
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>

        {/* ============== SECTION 1: SELL PRODUCTS ============== */}
        <SectionHeader id="sell" icon={<Package size={15} />} title="ขายสินค้า" count={cart.length} />
        {openSection === 'sell' && (
          <div style={CARD_STYLE}>
            {/* Search + Scan input */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <ScanLine size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 11 }} />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="สแกน Barcode หรือ ค้นหาสินค้า..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleBarcodeScan(searchQuery)
                  }
                }}
                style={{
                  width: '100%', height: 36, padding: '0 12px 0 32px',
                  border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12,
                  fontFamily: 'Kanit', outline: 'none',
                  background: '#F8FAFC',
                }}
              />
              {searching && (
                <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 10, top: 11, color: '#6366F1' }} />
              )}
            </div>

            {/* Product results */}
            {products.length > 0 && (
              <div style={{
                maxHeight: 200, overflow: 'auto', marginBottom: 10,
                border: '1px solid #F1F5F9', borderRadius: 8, background: '#FFF',
              }}>
                {products.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { addToCart(p); setSearchQuery(''); setProducts([]) }}
                    style={{
                      padding: '8px 10px', borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer', fontSize: 12,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontWeight: 600, color: '#1E293B',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{p.ProductName}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>
                        {p.code} {p.Barcode ? `· ${p.Barcode}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1' }}>
                      {baht(Number(p.price || 0))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart */}
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 12,
                background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1',
              }}>
                ยังไม่มีสินค้า — สแกน Barcode หรือค้นหาเพื่อเพิ่ม
              </div>
            ) : paidSuccess ? (
              /* === ชำระสำเร็จ === */
              <div style={{
                textAlign: 'center', padding: 24, background: 'linear-gradient(135deg, #F3F8FC, #E5EEF8)',
                borderRadius: 10, border: '1px solid #CCDFF1',
              }}>
                <CheckCircle size={40} color="#3E86C7" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0C5238', marginBottom: 4 }}>ชำระเงินสำเร็จ!</div>
                <div style={{ fontSize: 12, color: '#1E5088', marginBottom: 12 }}>บันทึกการขาย + ส่งใบเสร็จแล้ว</div>
                <button onClick={() => { setCart([]); setBillDiscount(0); setPaidSuccess(false); setSelectedLabels({}); setLabelMap({}) }}
                  style={{ ...BTN_PRIMARY, background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)' }}>
                  <ShoppingBag size={13} /> เริ่มขายรายการใหม่
                </button>
              </div>
            ) : (
              <>
                {/* Cart items */}
                <div style={{ maxHeight: 180, overflow: 'auto', marginBottom: 8 }}>
                  {cart.map(it => (
                    <div key={it.code} style={{
                      padding: '8px 0', borderBottom: '1px solid #F1F5F9',
                      display: 'flex', gap: 8, alignItems: 'center',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 600, color: '#1E293B',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{it.name}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>
                          {baht(it.price)} × {it.qty} {it.unit} = <b style={{ color: '#6366F1' }}>{baht(it.price * it.qty)}</b>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: '#F1F5F9', borderRadius: 6, padding: 2,
                      }}>
                        <Minus size={12} color="#64748B" style={{ cursor: 'pointer', padding: 2 }}
                          onClick={() => updateQty(it.code, -1)} />
                        <span style={{ fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                          {it.qty}
                        </span>
                        <Plus size={12} color="#64748B" style={{ cursor: 'pointer', padding: 2 }}
                          onClick={() => updateQty(it.code, 1)} />
                      </div>
                      <Trash2 size={13} color="#EF4444" style={{ cursor: 'pointer' }}
                        onClick={() => removeItem(it.code)} />
                    </div>
                  ))}
                </div>

                {/* ======= BILL DISCOUNT ======= */}
                <div style={{
                  padding: 10, background: '#FFF7ED', borderRadius: 8,
                  border: '1px solid #FED7AA', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9A3412', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Percent size={12} /> ลดท้ายบิล
                    </span>
                    <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #FDBA74' }}>
                      <button onClick={() => setDiscountType('baht')}
                        style={{
                          padding: '3px 10px', fontSize: 10, fontFamily: 'Kanit', border: 'none', cursor: 'pointer',
                          background: discountType === 'baht' ? '#F97316' : '#FFF',
                          color: discountType === 'baht' ? '#FFF' : '#9A3412',
                          fontWeight: discountType === 'baht' ? 700 : 400,
                        }}>
                        ฿ บาท
                      </button>
                      <button onClick={() => setDiscountType('percent')}
                        style={{
                          padding: '3px 10px', fontSize: 10, fontFamily: 'Kanit', border: 'none', cursor: 'pointer',
                          background: discountType === 'percent' ? '#F97316' : '#FFF',
                          color: discountType === 'percent' ? '#FFF' : '#9A3412',
                          fontWeight: discountType === 'percent' ? 700 : 400,
                        }}>
                        %
                      </button>
                    </div>
                  </div>
                  <input
                    type="number" min="0" step="1"
                    value={billDiscount || ''}
                    onChange={e => setBillDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder={discountType === 'baht' ? 'จำนวนเงิน (บาท)' : 'เปอร์เซ็นต์ (%)'}
                    style={{
                      width: '100%', height: 32, padding: '0 10px',
                      border: '1px solid #FDBA74', borderRadius: 6, fontSize: 12,
                      fontFamily: 'Kanit', outline: 'none', background: '#FFF',
                    }}
                  />
                  {discountAmount > 0 && (
                    <div style={{ fontSize: 10, color: '#EA580C', fontWeight: 600, marginTop: 4, textAlign: 'right' }}>
                      ส่วนลด: -{baht(discountAmount)} บาท
                    </div>
                  )}
                </div>

                {/* ======= PAYMENT METHOD ======= */}
                <div style={{
                  padding: 10, background: '#F3F8FC', borderRadius: 8,
                  border: '1px solid #CCDFF1', marginBottom: 8,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1E5088', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CreditCard size={12} /> ช่องทางชำระเงิน
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {([
                      { key: 'cash' as const, label: 'เงินสด', icon: <Banknote size={13} />, color: '#2A6AAA', bg: '#F3F8FC', border: '#CCDFF1' },
                      { key: 'payment' as const, label: 'โอน', icon: <QrCode size={13} />, color: '#2A6AAA', bg: '#F3F8FC', border: '#CCDFF1' },
                      { key: 'split' as const, label: 'แยกจ่าย', icon: <ArrowRightLeft size={13} />, color: '#9333EA', bg: '#FAF5FF', border: '#E9D5FF' },
                    ]).map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setPayMethod(opt.key)}
                        style={{
                          flex: 1, padding: '8px 4px', border: '2px solid',
                          borderColor: payMethod === opt.key ? opt.color : opt.border,
                          background: payMethod === opt.key ? opt.bg : '#FFF',
                          borderRadius: 8, cursor: 'pointer', fontFamily: 'Kanit',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                          transition: 'all 0.12s',
                          boxShadow: payMethod === opt.key ? `0 2px 8px ${opt.color}25` : 'none',
                        }}
                      >
                        <span style={{ color: payMethod === opt.key ? opt.color : '#94A3B8' }}>{opt.icon}</span>
                        <span style={{
                          fontSize: 10, fontWeight: payMethod === opt.key ? 700 : 400,
                          color: payMethod === opt.key ? opt.color : '#64748B',
                        }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Split payment inputs */}
                  {payMethod === 'split' && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, color: '#64748B' }}>เงินสด</label>
                        <input type="number" min="0"
                          value={cashAmount || ''}
                          onChange={e => { const v = Math.max(0, Number(e.target.value)); setCashAmount(v); setTransferAmount(Math.max(0, totalAmount - v)) }}
                          style={{
                            width: '100%', height: 28, padding: '0 8px',
                            border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 11,
                            fontFamily: 'Kanit', outline: 'none',
                          }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, color: '#64748B' }}>โอน</label>
                        <input type="number" min="0"
                          value={transferAmount || ''}
                          onChange={e => { const v = Math.max(0, Number(e.target.value)); setTransferAmount(v); setCashAmount(Math.max(0, totalAmount - v)) }}
                          style={{
                            width: '100%', height: 28, padding: '0 8px',
                            border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 11,
                            fontFamily: 'Kanit', outline: 'none',
                          }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* ======= SUMMARY ======= */}
                <div style={{
                  padding: 10, background: '#F8FAFC', borderRadius: 8,
                  border: '1px solid #E2E8F0', marginBottom: 8, fontSize: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: 3 }}>
                    <span>รวมเงิน ({cart.length} รายการ)</span>
                    <span>{baht(subtotal)} ฿</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EA580C', marginBottom: 3 }}>
                      <span>ส่วนลด</span>
                      <span>-{baht(discountAmount)} ฿</span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginTop: 6,
                    paddingTop: 6, borderTop: '1px dashed #CBD5E1',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>ยอดสุทธิ</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1E5088' }}>฿{baht(totalAmount)}</span>
                  </div>
                </div>

                {/* ======= ACTION BUTTONS ======= */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <button onClick={clearCart} style={{ ...BTN_GHOST, flex: 1 }}>
                    <Trash2 size={12} /> ล้าง
                  </button>
                  <button
                    onClick={handleSendReceipt}
                    disabled={sendingReceipt || cart.length === 0}
                    style={{
                      ...BTN_GHOST, flex: 1,
                      color: '#6366F1', borderColor: '#C7D2FE',
                      opacity: sendingReceipt ? 0.6 : 1,
                    }}
                  >
                    {sendingReceipt ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    ส่งใบเสร็จ
                  </button>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={paying || cart.length === 0}
                  style={{
                    width: '100%', padding: '10px 12px', border: 'none', borderRadius: 10,
                    background: paying ? '#94A3B8' : 'linear-gradient(135deg, #3E86C7, #2A6AAA)',
                    color: '#FFF', fontSize: 14, fontFamily: 'Kanit', fontWeight: 700,
                    cursor: paying ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: paying ? 'none' : '0 4px 14px rgba(42, 106, 170,0.35)',
                    transition: 'all 0.15s',
                  }}
                >
                  {paying
                    ? <><Loader2 size={16} className="animate-spin" /> กำลังชำระ...</>
                    : <><ShoppingBag size={16} /> ชำระสินค้า · ฿{baht(totalAmount)}</>
                  }
                </button>
              </>
            )}
          </div>
        )}

        {/* ============== SECTION 2: LABELS ============== */}
        <SectionHeader id="label" icon={<Tag size={15} />} title="ส่งฉลากสินค้า" count={cart.length} />
        {openSection === 'label' && (
          <div style={CARD_STYLE}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 18, color: '#94A3B8', fontSize: 12,
                background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1',
              }}>
                เพิ่มสินค้าก่อนเพื่อดึงฉลากสินค้า
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>เลือกรายการที่จะส่ง</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={selectAllLabels} style={BTN_GHOST}>
                      <CheckSquare size={11} /> เลือกทั้งหมด
                    </button>
                    <button onClick={clearLabelSelection} style={BTN_GHOST}>
                      <Square size={11} /> ล้าง
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: 300, overflow: 'auto', marginBottom: 10 }}>
                  {cart.map(it => {
                    const data = labelMap[it.code]
                    const checked = !!selectedLabels[it.code]
                    const hasLabel = data && Object.values(data).some(v => v)
                    return (
                      <div
                        key={it.code}
                        onClick={() => toggleLabelSelect(it.code)}
                        style={{
                          padding: 10, marginBottom: 6, cursor: 'pointer',
                          border: '1px solid', borderColor: checked ? '#6366F1' : '#E2E8F0',
                          background: checked ? '#EEF2FF' : '#FFF',
                          borderRadius: 8,
                          transition: 'all 0.12s',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          {checked
                            ? <CheckSquare size={14} color="#6366F1" style={{ marginTop: 2, flexShrink: 0 }} />
                            : <Square size={14} color="#CBD5E1" style={{ marginTop: 2, flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>
                              {it.name}
                            </div>
                            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>
                              {it.qty} {it.unit}
                            </div>
                            {data === undefined ? (
                              <div style={{ fontSize: 10, color: '#CBD5E1' }}>กำลังโหลดฉลาก...</div>
                            ) : hasLabel ? (
                              <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.5 }}>
                                {data.indicatorlistS && <div>• {data.indicatorlistS}</div>}
                                {data.useS && <div>• วิธีใช้: {data.useS}</div>}
                                {data.timeS && <div>• เวลา: {data.timeS}</div>}
                                {data.keepS && <div>• เก็บ: {data.keepS}</div>}
                              </div>
                            ) : (
                              <div style={{ fontSize: 10, color: '#F59E0B' }}>ยังไม่มีฉลาก</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleSendLabels('selected')}
                    disabled={sendingLabels}
                    style={{ ...BTN_PRIMARY, flex: 1, opacity: sendingLabels ? 0.6 : 1 }}
                  >
                    {sendingLabels ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    ส่งที่เลือก
                  </button>
                  <button
                    onClick={() => handleSendLabels('all')}
                    disabled={sendingLabels}
                    style={{
                      ...BTN_PRIMARY, flex: 1,
                      background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)',
                      opacity: sendingLabels ? 0.6 : 1,
                    }}
                  >
                    <Send size={13} /> ส่งทั้งหมด
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============== SECTION 3: QR PAYMENT ============== */}
        <SectionHeader id="qr" icon={<QrCode size={15} />} title="QR Payment (โอน Online)" />
        {openSection === 'qr' && (
          <div style={CARD_STYLE}>
            {!promptPayId ? (
              <div style={{
                padding: 14, background: '#FEF3C7', borderRadius: 8,
                border: '1px solid #FCD34D', fontSize: 12, color: '#92400E',
              }}>
                ⚠️ ยังไม่ได้ตั้งค่าเลข PromptPay<br />
                <span style={{ fontSize: 11 }}>
                  ไปที่ <b>ตั้งค่า → ช่องทางการชำระเงิน</b> เพื่อเพิ่มเลข PromptPay
                </span>
              </div>
            ) : totalAmount <= 0 ? (
              <div style={{
                padding: 14, background: '#F8FAFC', borderRadius: 8,
                border: '1px dashed #CBD5E1', fontSize: 12, color: '#94A3B8',
                textAlign: 'center',
              }}>
                เพิ่มสินค้าก่อน เพื่อสร้าง QR ตามยอด
              </div>
            ) : (
              <>
                <div ref={qrWrapRef} style={{
                  padding: 14, background: 'linear-gradient(135deg, #FFF, #F8FAFC)',
                  borderRadius: 10, border: '1px solid #E2E8F0',
                  textAlign: 'center', marginBottom: 10,
                }}>
                  <PromptPayQRCode promptPayId={promptPayId} amount={totalAmount} size={180} />
                </div>

                <div style={{
                  padding: 10, background: '#F8FAFC', borderRadius: 8,
                  border: '1px solid #E2E8F0', fontSize: 11, color: '#475569',
                  marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>ลูกค้า</span><b>{contactName || 'ลูกค้าทั่วไป'}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>รายการ</span><b>{cart.length} รายการ</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ยอดรวม</span>
                    <b style={{ color: '#1E5088' }}>฿{baht(totalAmount)}</b>
                  </div>
                </div>

                <button
                  onClick={handleSendQR}
                  disabled={sendingQR}
                  style={{
                    ...BTN_PRIMARY, width: '100%',
                    background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)',
                    opacity: sendingQR ? 0.6 : 1,
                  }}
                >
                  {sendingQR ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  ส่ง QR + สรุปยอดทาง Chat
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
