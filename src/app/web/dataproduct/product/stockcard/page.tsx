
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import styles from "../../../componant/mystyle.module.css";
import { Table } from 'react-bootstrap';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
//import { useAppContext } from '../../page';
import { useMessageStore } from "../../useMessageStore";
const widthsh = 70;
const widths1 = 90;
const widthsh1 = 100;





function StockCardproduct() {



  const apis = "datalist"
  const apiitemRC = "receivelist"
  const apisaleitem = "sale_cal/sale_list_item"
  const apibalance = "sale_cal/sale_balance"
  const Fixnameapis = "fixname"
  const Groupapis = "group"
  const Typeapis = "type"
  const Areaapis = "area"
  const Getagoryapis = "getagory"
  const Unitapis = "unit"

  // const {ids} =useAppContext(); 
  //  const {itemcodes} =useAppContext(); 
  const ids = useMessageStore((state) => state.ids)
  const itemcodes = useMessageStore((state) => state.itemcodes)



  const initialValues = {
    code: "",
    company: "",
    ProductName: "",
    fixname: "",
    group: "",
    type: "",
    subtype: "",
    Category: "",
    DrugRegistor: "",
    Area: "",
    CostActual: "",
    Unit: "",
    price: "",
    wholesaleprice: "",
    online: "",
    PriceA: "",
    PriceB: "",
    Barcode: "",
    Max: "",
    Min: "",
    ROPs: "",
    AlarmExp: "",
    Show: "",
    Child: "",
    CI: "",
    Remark: "",
    maker: "",
    qty_unit: ""
  };

  const [all, setall1] = useState(initialValues)
  const [itemRC, setGet_ItemRC] = useState([])
  const [itemSale, setGet_ItemSale] = useState([])
  const [itembalance, setbalance] = useState([])
  const [calculatedBalance, setCalculatedBalance] = useState<number | null>(null)
  const [companyPlace, setCompanyPlace] = useState('')
  const [selectedLot, setSelectedLot] = useState<string | null>(null)
  const [selectedExp, setSelectedExp] = useState<string | null>(null)
  const [selectedReceive, setSelectedReceive] = useState<any | null>(null)
  const [hoverReceiveId, setHoverReceiveId] = useState<any | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showMakerModal, setShowMakerModal] = useState(false)
  const [savingMaker, setSavingMaker] = useState(false)
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [supplierList, setSupplierList] = useState<any[]>([])
  const [savingCreate, setSavingCreate] = useState(false)
  const [editingRow, setEditingRow] = useState<any | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [makerForm, setMakerForm] = useState({ maker: '', qty_unit: '' })
  const [createForm, setCreateForm] = useState({
    createDate: '',
    quantity_change: '1',
    balance_after: '0',
    caregiverName: ''
  })
  const [editForm, setEditForm] = useState({
    createDate: '',
    quantity_change: '',
    balance_after: '',
    person: '',
    caregiverName: '',
    personsale: '',
    pharmacy: ''
  })
  const [employeeList, setEmployeeList] = useState<any[]>([])
  const [pharmacyOpen, setPharmacyOpen] = useState(false)

  const toDateTimeLocal = (value: any) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
  }

  // Convert datetime-local string (local time, no TZ) to UTC ISO string for API
  const localDateTimeToUTC = (localStr: string) => {
    if (!localStr) return localStr
    // datetime-local is 'YYYY-MM-DDTHH:mm' — interpret as local time
    const date = new Date(localStr)
    if (Number.isNaN(date.getTime())) return localStr
    return date.toISOString()
  }

  const toDisplayDate = (value: any) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const toDateKey = (value: any) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  }

  const toReportDateTime = (value: any) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const toDDMMYY = (value: any) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }

  const handleOpenReportModal = () => {
    if (itemSale.length === 0) {
      alert('ไม่พบข้อมูลประวัติการตัด Stock สำหรับทำรายงาน')
      return
    }
    setShowReportModal(true)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const fetchSupplierList = async () => {
    const companyS = String(localStorage.getItem('company_') || '')
    try {
      const res = await axios.get(`/api/supplier?company=${companyS}&names=&fields=list`)
      const rows = Array.isArray(res.data) ? res.data : []
      const uniqueByName = Array.from(new Map(rows
        .filter((r: any) => String(r?.names || '').trim())
        .map((r: any) => [String(r.names).trim(), r])
      ).values())
      setSupplierList(uniqueByName)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchPharmacistList = async () => {
    const companyS = String(localStorage.getItem('company_') || '')
    const id_company = Number(localStorage.getItem('id_company') || '0')
    try {
      const res = await axios.get(`/api/setting/employee?id_company=${id_company}`)
      const rows = Array.isArray(res.data) ? res.data : []
      // Filter employees where position contains "เภสัชกร"
      const pharmacists = rows.filter((r: any) => {
        const position = String(r?.position || '').trim()
        return position.includes('เภสัชกร')
      })
      setEmployeeList(pharmacists)
    } catch (error) {
      console.error(error)
    }
  }

  const handleOpenMakerModal = async () => {
    setMakerForm({
      maker: String((all as any).maker || ''),
      qty_unit: String((all as any).qty_unit || '')
    })
    if (supplierList.length === 0) {
      await fetchSupplierList()
    }
    setShowMakerModal(true)
  }

  const handleSaveMakerModal = async () => {
    if (!ids) return
    setSavingMaker(true)
    try {
      await axios.put(`/api/datalist/${Number(ids)}`, {
        maker: makerForm.maker,
        qty_unit: makerForm.qty_unit
      })

      setall1((prev: any) => ({
        ...prev,
        maker: makerForm.maker,
        qty_unit: makerForm.qty_unit
      }))
      setShowMakerModal(false)
    } catch (error) {
      console.error(error)
      alert('ไม่สามารถบันทึกข้อมูลผู้ผลิต/ขนาดบรรจุได้')
    } finally {
      setSavingMaker(false)
    }
  }

  // Function to update RCitemlist balance with fresh data
  const updateRCitemlistBalanceWithData = async (freshItemSale: any[]) => {
    if (!selectedReceive?.id) return

    // Wait 2 seconds before updating
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      // ปันส่วนยอดขายแบบ FIFO ตามลำดับ id ที่รับ (สูตรเดียวกับกล่องสรุป รับ/ขาย/เหลือ)
      const { sold: totalSold, remaining } = computeFifoForReceive(selectedReceive, freshItemSale)
      const receiveQty = Number(selectedReceive?.qty || 0) + (Number(selectedReceive?.freebaht) || 0)

      // Update RCitemlist balance
      await axios.put(`/api/receivelist/${selectedReceive.id}`, {
        balance: remaining
      })

      console.log(`✅ Updated RCitemlist ${selectedReceive.id} balance to ${remaining} (รับ: ${receiveQty}, ขาย: ${totalSold})`)
    } catch (error) {
      console.error('❌ Error updating RCitemlist balance:', error)
    }
  }

  const handleOpenCreateModal = () => {
    if (!selectedReceive) {
      alert('กรุณาเลือก Lot จากตารางข้อมูลรับสินค้าก่อน')
      return
    }

    const currentBalance = Number(itembalance.map((r: any) => r.balance)[0] || 0)

    setCreateForm({
      createDate: toDateTimeLocal(new Date()),
      quantity_change: '1',
      balance_after: String(currentBalance),
      caregiverName: ''
    })
    setShowCreateModal(true)
  }

  const handleSaveCreate = async () => {
    if (!selectedReceive) return

    const companyS = String(localStorage.getItem('company_') || '')
    const personLogin = String(localStorage.getItem('person_') || '')

    if (!companyS) {
      alert('ไม่พบข้อมูลสาขา')
      return
    }

    setSavingCreate(true)
    try {
      // Convert positive input to negative for saving (sale transaction)
      const quantityValue = Number(createForm.quantity_change || 0)
      const quantityToSave = quantityValue > 0 ? -quantityValue : quantityValue

      await axios.post('/api/stocktransaction', {
        company: companyS,
        inventory_lot_id: Number(selectedReceive.id),
        itemcode: String(itemcodes || ''),
        itemName: String(all.ProductName || ''),
        lot: String(selectedReceive.lot || ''),
        dateExp: selectedReceive.dateExp,
        createDate: localDateTimeToUTC(createForm.createDate),
        quantity_change: quantityToSave,
        balance_after: Number(createForm.balance_after || 0),
        person: personLogin,
        caregiverName: createForm.caregiverName
      })

      const freshData = await fetchGet_ItemSale()
      setShowCreateModal(false)

      // Update RCitemlist balance using fresh data (รับ - ขาย)
      await updateRCitemlistBalanceWithData(freshData)
    } catch (error) {
      console.error(error)
      alert('ไม่สามารถเพิ่มข้อมูลได้')
    } finally {
      setSavingCreate(false)
    }
  }

  const handleOpenEditModal = async (row: any) => {
    setEditingRow(row)
    // Convert negative quantity to positive for display (user enters positive, we save as negative)
    const displayQuantity = row.quantity_change ? String(Math.abs(Number(row.quantity_change))) : '0'
    setEditForm({
      createDate: toDateTimeLocal(row.createDate),
      quantity_change: displayQuantity,
      balance_after: String(row.balance_after ?? row.lotDetails?.balance ?? 0),
      person: String(row.person || ''),
      caregiverName: String(row.caregiverName || ''),
      personsale: String(row.personsale || ''),
      pharmacy: String(row.pharmacy || '')
    })
    // Fetch pharmacist list for dropdown
    if (employeeList.length === 0) {
      await fetchPharmacistList()
    }
  }

  const handleSaveEdit = async () => {
    if (!editingRow?.id) return

    setSavingEdit(true)
    try {
      // Convert positive input to negative for saving (sale transaction)
      const quantityValue = Number(editForm.quantity_change || 0)
      const quantityToSave = quantityValue > 0 ? -quantityValue : quantityValue

      await axios.put('/api/stocktransaction', {
        id: editingRow.id,
        createDate: localDateTimeToUTC(editForm.createDate),
        quantity_change: quantityToSave,
        balance_after: Number(editForm.balance_after || 0),
        person: editForm.person,
        caregiverName: editForm.caregiverName,
        personsale: editForm.caregiverName,
        pharmacy: editForm.pharmacy
      })

      const freshData = await fetchGet_ItemSale()
      setEditingRow(null)

      // Update RCitemlist balance using fresh data (รับ - ขาย)
      await updateRCitemlistBalanceWithData(freshData)
    } catch (error) {
      console.error(error)
      alert('ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteRow = async (row: any) => {
    if (!row?.id) return
    const ok = window.confirm('ยืนยันลบข้อมูลทั้งแถวนี้?')
    if (!ok) return

    try {
      await axios.delete(`/api/stocktransaction?id=${row.id}`)
      await fetchGet_ItemSale()
    } catch (error) {
      console.error(error)
      alert('ไม่สามารถลบข้อมูลได้')
    }
  }
  //const   itemCode=String(all.filter((s:any)=>s.id===ids).map((s:any)=>s.itemcode))

  console.log(itemRC)

  useEffect(() => {

    setCompanyPlace(String(localStorage.getItem('cp_') || ''))

    const useMyHook = async () => {
      try {
        await fetchPost()
        await fetchGet_ItemRC()
        await fetchGet_ItemSale()
        await fetchGet_Balance()
      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [ids])


  const fetchPost = async () => {
    try {
      const res = await axios.get(`/api/${apis}/${Number(ids)}`)

      setall1(res.data)

    } catch (error) {
      console.error(error)
    }

  }

  const fetchGet_ItemRC = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiitemRC}?company=${companyS}&itemcode=${itemcodes}`)

      setGet_ItemRC(res.data)

    } catch (error) {
      console.error(error)
    }

  }

  const fetchGet_ItemSale = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      // ต้องดึงประวัติให้ครบทั้งสินค้า เพราะการปันส่วน FIFO รายใบรับนับสะสมจากรายการเก่าสุด
      // (limit=200 เดิมจะตัดรายการเก่าทิ้ง แล้วยอดปันส่วนของใบรับแรก ๆ จะเพี้ยน)
      const res = await axios.get(`/api/stocktransaction?company=${companyS}&itemcode=${itemcodes}&limit=2000`)

      if (res.data.success) {
        setGet_ItemSale(res.data.data)
        return res.data.data  // Return fresh data for immediate use
      }
      return []

    } catch (error) {
      console.error(error)
      return []
    }

  }

  const fetchGet_Balance = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const idQuery = ids ? `&id=${ids}` : ''
      const res = await axios.get(`/api/${apibalance}?company=${companyS}&code_product=${itemcodes}${idQuery}`)
      setbalance(res.data)

      // ดึงยอดคงเหลือที่คำนวณจาก stock-balance-summary (สูตรเดียวกับหน้าสรุปยอดคงเหลือ)
      const resSummary = await axios.get(`/api/stock-balance-summary?itemcode=${itemcodes}&company=${companyS}${idQuery}`)
      if (resSummary.data?.calculatedBalance !== undefined) {
        setCalculatedBalance(resSummary.data.calculatedBalance)
      }
    } catch (error) {
      console.error(error)
    }

  }


  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTimeout(() => {
      setall1({
        ...all,
        [name]: value,
      });
    }, 40);



  };

  // เช็คว่า transaction การขาย/ปรับลด ตรงกับกลุ่ม Lot+วันหมดอายุ ที่ระบุหรือไม่
  // (lot ของฝั่งขายถ้าว่างให้ถือว่าตรง แล้วเทียบด้วย exp อย่างเดียว)
  const saleMatchesLotExp = (p: any, lot: any, exp: any) => {
    const type = (p.transaction_type || '').toUpperCase()
    const isSaleType = type === 'SALE' || (type === 'ADJUST' && Number(p.quantity_change || 0) < 0)
    if (!isSaleType) return false
    const pLot = String(p.lot ?? p.lotDetails?.lot ?? '')
    const pExp = p.lotDetails?.dateExp ?? p.dateExp
    const lotOk = pLot === '' || pLot === String(lot ?? '')
    const expOk = !exp || toDateKey(pExp) === toDateKey(exp)
    return lotOk && expOk
  }

  // หน้าต่าง FIFO ของใบรับ 1 ใบ ภายในกลุ่ม "Lot + วันหมดอายุ" เดียวกัน
  // before   = ความจุรวมของใบรับที่มาก่อน (เรียงตาม id ที่รับ)
  // capacity = จำนวนที่รับ + ของแถม (freebaht) — ของแถมเป็นสต็อกขายได้
  const getReceiveWindow = (receive: any) => {
    const group = (itemRC as any[])
      .filter((r: any) => String(r.lot ?? '') === String(receive?.lot ?? '') && toDateKey(r.dateExp) === toDateKey(receive?.dateExp))
      .sort((a: any, b: any) => Number(a.id) - Number(b.id))
    let before = 0
    for (const r of group) {
      if (Number(r.id) === Number(receive?.id)) break
      before += Number(r.qty || 0) + (Number(r.freebaht) || 0)
    }
    const capacity = Number(receive?.qty || 0) + (Number(receive?.freebaht) || 0)
    return { before, capacity }
  }

  // ปันส่วนยอดขายของกลุ่ม "Lot + วันหมดอายุ" เดียวกัน ให้ใบรับแต่ละใบแบบ FIFO เรียงตาม id ที่รับ
  // (กันกรณีรับ Lot ซ้ำกันหลายใบ แล้วยอดขายถูกนับซ้ำ — ลิงก์ inventory_lot_id ใช้ไม่ได้เพราะ id ถูก renumber)
  const computeFifoForReceive = (receive: any, allSales: any[]) => {
    if (!receive) return { sold: 0, remaining: 0, groupSold: 0 }
    const groupSold = allSales.reduce((sum: number, p: any) =>
      saleMatchesLotExp(p, receive.lot, receive.dateExp) ? sum + Math.abs(Number(p.quantity_change || 0)) : sum, 0)
    const { before, capacity } = getReceiveWindow(receive)
    const sold = Math.min(Math.max(groupSold - before, 0), capacity)
    return { sold, remaining: capacity - sold, groupSold }
  }

  // เกณฑ์เดียวกับ saleMatchesLotExp แต่ยอมให้ selectedLot/selectedExp เป็น null ได้ (= ไม่กรองด้านนั้น)
  // ต้องเทียบทั้ง Lot และวันหมดอายุ ไม่งั้น Lot คนละตัวที่ exp วันเดียวกันจะปนกันหมด
  const matchesSelectedLotExp = (p: any) => {
    const pLot = String(p.lot ?? p.lotDetails?.lot ?? '')
    const pExp = p.lotDetails?.dateExp ?? p.dateExp
    // lot ของฝั่งขายถ้าว่างให้ถือว่าตรง (ตรงกับสูตรกล่อง รับ/ขาย/เหลือ)
    const lotOk = !selectedLot || pLot === '' || pLot === String(selectedLot)
    const expOk = !selectedExp || toDateKey(pExp) === toDateKey(selectedExp)
    return lotOk && expOk
  }

  const byCreateDateAsc = (a: any, b: any) => {
    const ta = a?.createDate ? new Date(a.createDate).getTime() : 0
    const tb = b?.createDate ? new Date(b.createDate).getTime() : 0
    return ta - tb
  }

  // แถวตัด stock ของ "กลุ่ม Lot + วันหมดอายุ" ที่เลือก (ยังไม่ปันส่วนรายใบรับ)
  const groupItemSale = itemSale.filter((p: any) => {
    const type = (p.transaction_type || '').toUpperCase()
    const isShowType = type === 'SALE' || (type === 'ADJUST' && Number(p.quantity_change || 0) < 0)
    if (!isShowType) return false
    if (!selectedLot && !selectedExp) return true
    return matchesSelectedLotExp(p)
  })

  // ปันส่วน "รายแถว" ให้ใบรับที่เลือก ตามจำนวนที่รับจริง — FIFO เรียงตามวันที่ตัด
  // แถวที่คร่อมขอบใบรับจะถูกตัดเหลือเฉพาะส่วนที่เป็นของใบรับนี้ (เก็บไว้ที่ __allocatedQty
  //  ส่วน quantity_change ยังเป็นค่าจริงเสมอ เพราะ modal แก้ไข/ลบ ต้องใช้ค่าจริง)
  const allocateRowsToReceive = (rows: any[], receive: any) => {
    const { before, capacity } = getReceiveWindow(receive)
    const windowEnd = before + capacity
    let cum = 0
    const out: any[] = []
    for (const p of [...rows].sort(byCreateDateAsc)) {
      const qty = Math.abs(Number(p.quantity_change || 0))
      const rowStart = cum
      const rowEnd = cum + qty
      cum = rowEnd
      if (rowEnd <= before || rowStart >= windowEnd) continue
      const allocated = Math.min(rowEnd, windowEnd) - Math.max(rowStart, before)
      out.push(allocated === qty ? p : { ...p, __allocatedQty: allocated })
    }
    return out
  }

  const filteredItemSale = selectedReceive
    ? allocateRowsToReceive(groupItemSale, selectedReceive)
    : groupItemSale

  // จำนวนที่แสดง = ส่วนที่ปันให้ใบรับนี้ (ถ้าไม่ได้ถูกตัดแบ่ง ก็คือจำนวนจริง)
  const rowDisplayQty = (p: any) => p.__allocatedQty !== undefined
    ? Number(p.__allocatedQty)
    : Math.abs(Number(p.quantity_change || 0))

  const reportReceive = selectedReceive
    || itemRC.find((r: any) => {
      if (!selectedLot && !selectedExp) return true
      const lotMatched = !selectedLot || r.lot === selectedLot
      const expMatched = !selectedExp || toDateKey(r.dateExp) === toDateKey(selectedExp)
      return lotMatched && expMatched
    })
    || itemRC[0]
    || null

  const reportStoreName = companyPlace
  const reportProductName = String(all.ProductName || '-')
  const reportDrugName = String(all.fixname || '-')
  const reportMaker = String(all.maker || '-')
  const reportQty_Unit = String(all.qty_unit || '-')
  const reportVendorName = String(reportReceive?.namevender || '-')
  const reportQtyUnit = `${reportReceive?.qty ?? '-'} ${reportReceive?.unit ?? ''}`.trim()
  const reportReceiveDate = toDDMMYY(reportReceive?.dateRC)

  const reportRows = [...filteredItemSale].sort(byCreateDateAsc)

  const REPORT_ROWS_PER_PAGE = 18
  const reportPages = reportRows.length > 0
    ? Array.from({ length: Math.ceil(reportRows.length / REPORT_ROWS_PER_PAGE) }, (_, pageIndex) =>
      reportRows.slice(pageIndex * REPORT_ROWS_PER_PAGE, (pageIndex + 1) * REPORT_ROWS_PER_PAGE)
    )
    : [[]]

  const normalizeReportCode = (value: any) => String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/\./g, '')

  const isKhoyor11 = [all.type, all.subtype].some((code: any) => normalizeReportCode(code) === 'ขย11')
  const reportFormCode = isKhoyor11 ? 'ข.ย.11' : 'ข.ย.10'
  const reportTitle = isKhoyor11
    ? 'บัญชีการขายยาอันตราย เฉพาะรายการยาที่เลขาธิการคณะกรรมการอาการและยากำหนด'
    : 'บัญชีการขายควบคุมพิเศษ'







  return (
    <form className='form'>
      <div className={styles.productFormContainer}>
        {/* Product Info Card */}
        <div className={styles.productInfoCard} style={{ marginBottom: 10 }}>
          <div className={styles.productInfoCardHeader}>
            <span>📦</span> ข้อมูลสินค้า
          </div>
          <div className={styles.productInfoCardBody}>
            {/* Row 1: Code & Barcode */}
            <div className={styles.productFormRow}>
              <label className={styles.productFormLabel}>รหัสสินค้า :</label>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 11, color: '#333', minWidth: 80 }}>{all.code}</div>
              <label className={styles.productFormLabelSm}>Barcode :</label>
              <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#666' }}>{all.Barcode}</div>
            </div>

            {/* Row 2: Product Name */}
            <div className={styles.productFormRow}>
              <label className={styles.productFormLabel}>ชื่อสินค้า :</label>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{all.ProductName}</div>
            </div>

            {/* Row 3: Generic Name, Drug Group, Report Type, Balance */}
            <div className={styles.productFormRow}>
              <label className={styles.productFormLabel}>ชื่อสามัญ :</label>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 120 }}>{all.fixname}</div>
              <label className={styles.productFormLabelSm}>กลุ่มสินค้า :</label>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 120 }}>{all.group}</div>
              <label className={styles.productFormLabelSm}>รายงาน ขย :</label>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 60 }}>{all.type}{all.subtype == null ? "" : " / "}{all.subtype}</div>
              <label className={styles.productFormLabelSm} style={{ fontWeight: 'bold', color: '#2A6AAA' }}>คงเหลือ :</label>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#2A6AAA' }}>{calculatedBalance !== null ? calculatedBalance : itembalance.map((r: any) => r.balance)} {all.Unit}</div>
            </div>

            {/* Row 4: Category, Area, Unit, Price */}
            <div className={styles.productFormRow}>
              <label className={styles.productFormLabel}>หมวด :</label>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 100 }}>{all.Category}</div>
              <label className={styles.productFormLabelSm}>พื้นที่เก็บ :</label>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 60 }}>{all.Area}</div>
              <label className={styles.productFormLabelSm}>หน่วย :</label>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 40 }}>{all.Unit}</div>
              <label className={styles.productFormLabelSm}>ราคา :</label>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666' }}>{all.price} บาท</div>
            </div>
          </div>
        </div>

        {/* Data Tables Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Receive Stock Card (Back to Left) */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingCardHeader}>
              <span>📥</span> ข้อมูลรับสินค้า
            </div>
            <div className={styles.pricingCardBody} style={{ padding: 0, maxHeight: '55vh', overflowY: 'auto' }}>
              <Table className="table" size="sm">
                <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                  <tr>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "12%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>ใบรับสินค้า</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "12%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>วันรับสินค้า</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "8%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>รับ</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>หน่วย</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>ทุนใหม่</td>

                    <td className={styles.bodydetailTable_Re1} style={{ width: "12%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>หมดอายุ</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "15%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>Lot</td>
                  </tr>
                </thead>
                <tbody className="table-group-divider">
                  {itemRC.map((p: any) => {
                    // แถวที่คลิก = อ้างด้วย id ใบรับ (ไม่ใช่ lot+exp) เพราะ Lot เดียวกันรับได้หลายใบ
                    const isSelected = selectedReceive != null && Number(selectedReceive.id) === Number(p.id)
                    const inSameLotGroup = !isSelected && selectedReceive != null
                      && String(p.lot ?? '') === String(selectedReceive.lot ?? '')
                      && toDateKey(p.dateExp) === toDateKey(selectedReceive.dateExp)
                    const isHovered = hoverReceiveId != null && Number(hoverReceiveId) === Number(p.id)
                    const rowBg = isSelected ? '#CCDFF1' : (inSameLotGroup ? '#F3F8FC' : (isHovered ? '#f1f5f9' : '#fff'))
                    // ต้องใส่พื้นหลังที่ระดับ <td> เพราะ bootstrap 5.3 set background-color ให้ทุกเซลล์
                    // (.table > * > * > * { background-color: var(--bs-table-bg) }) พื้นหลังของ <tr> เลยถูกทับจนมองไม่เห็น
                    const cellBg = { background: rowBg, transition: 'background 0.15s' }
                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelectedLot(isSelected ? null : p.lot);
                          setSelectedExp(isSelected ? null : p.dateExp);
                          setSelectedReceive(isSelected ? null : p);
                        }}
                        onMouseEnter={() => setHoverReceiveId(p.id)}
                        onMouseLeave={() => setHoverReceiveId((prev: any) => (Number(prev) === Number(p.id) ? null : prev))}
                        style={{ cursor: 'pointer' }}
                        title={isSelected ? 'คลิกอีกครั้งเพื่อยกเลิกการเลือก' : 'คลิกเพื่อดูประวัติการตัด Stock ของใบรับนี้'}
                      >
                        <td className={styles.bodydetailTable_Re1} style={{ ...cellBg, textAlign: "center", fontSize: 9, lineHeight: '1.15', borderLeft: isSelected ? '3px solid #2A6AAA' : '3px solid transparent' }}>
                          <div style={{ fontWeight: isSelected ? 700 : 400 }}>RC{p.codenames}</div>
                          <div style={{ fontSize: 8, color: '#2A6AAA' }}>{p.namevender || '-'}</div>
                        </td>
                        <td className={styles.bodydetailTable_Re1} style={{ ...cellBg, textAlign: "center", fontSize: 9 }}>{new Date(p.dateRC).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ ...cellBg, textAlign: "center", fontWeight: "bold", fontSize: 10, color: isSelected ? '#1E5088' : '#2A6AAA' }}>{p.qty}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ ...cellBg, textAlign: "center", fontSize: 9 }}>{p.unit}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ ...cellBg, textAlign: "center", fontSize: 9 }}>{p.newCost}</td>

                        <td className={styles.bodydetailTable_Re1} style={{ ...cellBg, textAlign: "center", fontSize: 9 }}>{new Date(p.dateExp).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ ...cellBg, textAlign: "center", fontSize: 9, fontWeight: (isSelected || inSameLotGroup) ? 'bold' : 'normal', color: isSelected ? '#1E5088' : undefined }}>{p.lot}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Transaction History Card (Back to Right) */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingCardHeader} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              {/* First Row: Title and main action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ marginRight: 8 }}>📋</span> ประวัติการตัด Stock

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  style={{ marginLeft: 'auto', fontSize: 9, background: 'white', color: '#0f766e', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                  title="เพิ่มข้อมูล"
                >
                  ➕ เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={handleOpenReportModal}
                  style={{ fontSize: 9, background: 'white', color: '#0f766e', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                  title="รายงาน A4"
                >
                  🧾 Report
                </button>
                {(selectedLot || selectedExp) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLot(null);
                      setSelectedExp(null);
                      setSelectedReceive(null);
                    }}
                    style={{ fontSize: 9, background: 'white', color: '#1565c0', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                  >
                    ทั้งหมด
                  </button>
                )}
              </div>

              {/* Second Row: Lot, Maker, Qty controls */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                {selectedLot && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>Lot: {selectedLot}</span>}

                <span style={{ marginLeft: 4, fontSize: 10, background: '#fff', color: '#b91c1c', border: '1px solid #ef4444', borderRadius: 4, padding: '1px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String((all as any).maker || '-')}>
                  {(all as any).maker || '-'}
                </span>
                <span style={{ fontSize: 10, background: '#fff', color: '#1E5088', border: '1px solid #3E86C7', borderRadius: 4, padding: '1px 8px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String((all as any).qty_unit || '-')}>
                  {(all as any).qty_unit || '-'}
                </span>
                <button
                  type="button"
                  onClick={handleOpenMakerModal}
                  style={{ fontSize: 10, background: '#ffffffff', color: '#fff', border: 'none', borderRadius: 4, padding: '1px 8px', cursor: 'pointer' }}
                  title="แก้ไขผู้ผลิต/ขนาดบรรจุ"
                >
                  ➕
                </button>

                {/* Summary Boxes: รับ, ขาย, เหลือ - Only show when lot is selected */}
                {selectedReceive && (() => {
                  // จำนวนรับ = qty + ของแถม (freebaht)
                  const receiveQty = Number(selectedReceive?.qty || 0) + (Number(selectedReceive?.freebaht) || 0)

                  // ปันส่วนยอดขายแบบ FIFO ตามลำดับ id ที่รับ (กันยอดขายนับซ้ำเมื่อรับ Lot ซ้ำกัน)
                  const fifo = computeFifoForReceive(selectedReceive, itemSale)
                  const totalSold = fifo.sold
                  const remaining = fifo.remaining

                  return (
                    <>
                      {/* รับ (Receive) - Red box */}
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: 10,
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #ef4444',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontWeight: 600
                      }}>
                        รับ: {receiveQty}
                      </span>

                      {/* ขาย (Sale) - Blue box */}
                      <span style={{
                        fontSize: 10,
                        background: '#F3F8FC',
                        color: '#2A6AAA',
                        border: '1px solid #3E86C7',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontWeight: 600
                      }}>
                        ขาย: {totalSold.toFixed(2)}
                      </span>

                      {/* เหลือ (Balance) - Brown/Orange box */}
                      <span style={{
                        fontSize: 10,
                        background: '#fff7ed',
                        color: '#c2410c',
                        border: '1px solid #f97316',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontWeight: 600
                      }}>
                        เหลือ: {remaining.toFixed(2)}
                      </span>
                    </>
                  )
                })()}
              </div>
            </div>

            <div className={styles.pricingCardBody} style={{ padding: 0, maxHeight: '52vh', overflowY: 'auto' }}>
              <Table className="table" size="sm" style={{ marginBottom: 0 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                  <tr>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>#</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>วันที่/เวลา</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>ประเภท</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Lot</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>หมดอายุ</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>จำนวน</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0', display: 'none' }}>คงเหลือ</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>เภสัชกร</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>ผู้ซื้อ</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody className="table-group-divider">
                  {[...filteredItemSale]
                    .sort(byCreateDateAsc)
                    .map((p: any, index: number) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: "center", fontSize: 11, color: '#94a3b8', padding: '2px 4px', verticalAlign: 'middle' }}>{index + 1}</td>
                        <td style={{ textAlign: "center", fontSize: 10, color: '#64748b', padding: '2px 4px', verticalAlign: 'middle', lineHeight: '1.2' }}>
                          {new Date(p.createDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ textAlign: "center", padding: '2px 4px', verticalAlign: 'middle' }}>
                          <span style={{
                            fontFamily: 'Kanit', fontSize: '10px', padding: '0px 8px', borderRadius: '6px',
                            backgroundColor: p.transaction_type?.toUpperCase() === 'SALE' ? '#fef2f2' : (p.transaction_type?.toUpperCase() === 'IN' ? '#EDF9F3' : '#f1f5f9'),
                            color: p.transaction_type?.toUpperCase() === 'SALE' ? '#dc2626' : (p.transaction_type?.toUpperCase() === 'IN' ? '#147F56' : '#64748b'),
                            display: 'inline-block', lineHeight: '18px'
                          }}>
                            {p.transaction_type === 'SALE' ? 'ขาย' : (p.transaction_type === 'IN' ? 'รับ' : p.transaction_type)}
                          </span>
                        </td>
                        <td style={{
                          textAlign: "center",
                          fontSize: 12,
                          color: (p.lot === selectedLot || p.lotDetails?.lot === selectedLot) ? '#dc2626' : '#64748b',
                          fontWeight: (p.lot === selectedLot || p.lotDetails?.lot === selectedLot) ? 'bold' : 'normal',
                          padding: '2px 4px', verticalAlign: 'middle'
                        }}>
                          {p.lot || p.lotDetails?.lot || '-'}
                        </td>
                        <td style={{
                          textAlign: "center",
                          fontSize: 11,
                          color: (selectedExp && p.lotDetails?.dateExp && toThaiDateString(p.lotDetails.dateExp) === toThaiDateString(selectedExp)) ? '#dc2626' : '#64748b',
                          fontWeight: (selectedExp && p.lotDetails?.dateExp && toThaiDateString(p.lotDetails.dateExp) === toThaiDateString(selectedExp)) ? 'bold' : 'normal',
                          padding: '2px 4px', verticalAlign: 'middle'
                        }}>
                          {p.lotDetails?.dateExp ? new Date(p.lotDetails.dateExp).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                        </td>
                        <td
                          style={{ textAlign: "center", fontSize: 13, fontFamily: 'Kanit_B', color: p.quantity_change < 0 ? '#ef4444' : '#1F9D6B', padding: '2px 4px', verticalAlign: 'middle' }}
                          title={p.__allocatedQty !== undefined ? `ตัดจริง ${Math.abs(Number(p.quantity_change || 0)).toFixed(2)} — ส่วนที่เป็นของใบรับนี้ ${rowDisplayQty(p).toFixed(2)}` : undefined}
                        >
                          {rowDisplayQty(p).toFixed(2)}
                          {p.__allocatedQty !== undefined && <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 2 }}>*</span>}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 12, color: '#3E86C7', fontWeight: 500, padding: '2px 4px', verticalAlign: 'middle', display: 'none' }}>
                          {p.lotDetails?.balance?.toFixed(2) || (p.balance_after != null ? p.balance_after.toFixed(2) : '-')}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 10, color: '#94a3b8', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '2px 4px', verticalAlign: 'middle' }} title={p.pharmacy}>
                          {p.pharmacy || '-'}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 10, color: '#2A6AAA', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '2px 4px', verticalAlign: 'middle' }} title={p.caregiverName || '-'}>
                          {p.caregiverName || '-'}
                        </td>
                        <td style={{ textAlign: "center", padding: '2px 4px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          {selectedReceive ? (
                            <>
                              <button
                                type="button"
                                title="แก้ไข"
                                onClick={() => handleOpenEditModal(p)}
                                style={{ border: 'none', background: 'transparent', color: '#2A6AAA', fontSize: 13, cursor: 'pointer', marginRight: 6 }}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                title="ลบทั้งแถว"
                                onClick={() => handleDeleteRow(p)}
                                style={{ border: 'none', background: 'transparent', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 10 }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>

        {showMakerModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001
          }}>
            <div style={{ background: '#fff', borderRadius: 10, width: 560, maxWidth: '94vw', padding: 16 }}>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 16, marginBottom: 12 }}>แก้ไขผู้ผลิต / ขนาดบรรจุ</div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>ผู้ผลิต</label>
                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="form-control form-control-sm"
                      style={{ textAlign: 'left', fontSize: 12, fontFamily: 'Kanit', height: 31 }}
                    >
                      {makerForm.maker || 'เลือกผู้ผลิต'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent style={{ width: 320, padding: 0, zIndex: 10002, pointerEvents: 'auto' }} align="start">
                    <Command>
                      <CommandInput placeholder="พิมพ์ค้นหาผู้ผลิต..." />
                      <CommandList>
                        <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                        <CommandGroup>
                          {supplierList.map((s: any) => (
                            <CommandItem
                              key={s.id}
                              value={String(s.names || '')}
                              onSelect={() => {
                                setMakerForm({ ...makerForm, maker: String(s.names || '') })
                                setSupplierOpen(false)
                              }}
                            >
                              {String(s.names || '-')}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>ขนาดบรรจุ</label>
                <input
                  type="text"
                  value={makerForm.qty_unit}
                  onChange={(e) => setMakerForm({ ...makerForm, qty_unit: e.target.value })}
                  className="form-control form-control-sm"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={savingMaker}
                  onClick={() => setShowMakerModal(false)}
                >
                  ปิด
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  disabled={savingMaker}
                  onClick={handleSaveMakerModal}
                >
                  {savingMaker ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editingRow && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{ background: 'white', borderRadius: 10, width: 520, maxWidth: '92vw', padding: 16 }}>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 16, marginBottom: 12 }}>แก้ไขข้อมูลรายการ</div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>วันที่/เวลา</label>
                <input type="datetime-local" lang="en-GB" value={editForm.createDate} onChange={(e) => setEditForm({ ...editForm, createDate: e.target.value })} className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>จำนวน</label>
                <input type="number" step="0.01" value={editForm.quantity_change} onChange={(e) => setEditForm({ ...editForm, quantity_change: e.target.value })} className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit', display: 'none' }}>คงเหลือ</label>
                <input type="number" step="0.01" value={editForm.balance_after} onChange={(e) => setEditForm({ ...editForm, balance_after: e.target.value })} className="form-control form-control-sm" style={{ display: 'none' }} />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>ผู้ทำ</label>
                <input type="text" value={editForm.person} onChange={(e) => setEditForm({ ...editForm, person: e.target.value })} className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>ผู้รักษา</label>
                <input type="text" value={editForm.caregiverName} onChange={(e) => setEditForm({ ...editForm, caregiverName: e.target.value })} className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>เภสัชกร</label>
                <Popover open={pharmacyOpen} onOpenChange={setPharmacyOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="form-control form-control-sm"
                      style={{ textAlign: 'left', fontSize: 12, fontFamily: 'Kanit', height: 31 }}
                    >
                      {editForm.pharmacy || 'เลือกเภสัชกร'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent style={{ width: 320, padding: 0, zIndex: 10002, pointerEvents: 'auto' }} align="start">
                    <Command>
                      <CommandInput placeholder="พิมพ์ค้นหาเภสัชกร..." />
                      <CommandList>
                        <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                        <CommandGroup>
                          {employeeList.map((emp: any) => (
                            <CommandItem
                              key={emp.id}
                              value={String(emp.name || '')}
                              onSelect={() => {
                                setEditForm({ ...editForm, pharmacy: String(emp.name || '') })
                                setPharmacyOpen(false)
                              }}
                            >
                              {String(emp.name || '-')} ({String(emp.position || '-')})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={savingEdit}
                  onClick={() => setEditingRow(null)}
                >
                  ปิด
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={savingEdit}
                  onClick={handleSaveEdit}
                >
                  {savingEdit ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && selectedReceive && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{ background: 'white', borderRadius: 10, width: 540, maxWidth: '94vw', padding: 16 }}>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 16, marginBottom: 12 }}>เพิ่มข้อมูลประวัติการตัด Stock</div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>ใบรับสินค้า</label>
                <input type="text" value={`RC${selectedReceive.codenames || ''}`} readOnly className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>ประเภท</label>
                <input type="text" value="ขาย" readOnly className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>Lot</label>
                <input type="text" value={String(selectedReceive.lot || '')} readOnly className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>หมดอายุ</label>
                <input type="text" value={toDisplayDate(selectedReceive.dateExp)} readOnly className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>วันที่/เวลา</label>
                <input type="datetime-local" lang="en-GB" value={createForm.createDate} onChange={(e) => setCreateForm({ ...createForm, createDate: e.target.value })} className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>จำนวน</label>
                <input type="number" step="0.01" value={createForm.quantity_change} onChange={(e) => setCreateForm({ ...createForm, quantity_change: e.target.value })} className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit', display: 'none' }}>คงเหลือ</label>
                <input type="number" step="0.01" value={createForm.balance_after} onChange={(e) => setCreateForm({ ...createForm, balance_after: e.target.value })} className="form-control form-control-sm" style={{ display: 'none' }} />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>ผู้ทำ</label>
                <input type="text" value={String(localStorage.getItem('person_') || '')} readOnly className="form-control form-control-sm" />

                <label style={{ fontSize: 12, fontFamily: 'Kanit' }}>ผู้รักษา</label>
                <input type="text" value={createForm.caregiverName} onChange={(e) => setCreateForm({ ...createForm, caregiverName: e.target.value })} className="form-control form-control-sm" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={savingCreate}
                  onClick={() => setShowCreateModal(false)}
                >
                  ปิด
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  disabled={savingCreate}
                  onClick={handleSaveCreate}
                >
                  {savingCreate ? 'กำลังบันทึก...' : 'เพิ่มข้อมูล'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showReportModal && (
          <div
            className="special-sale-report-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10000,
              overflowY: 'auto',
              padding: '24px 16px'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false) }}
          >
            {/* Toolbar */}
            <div className="no-print" style={{
              width: '100%', maxWidth: 1122, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12, padding: '0 4px'
            }}>
              <span style={{ color: '#fff', fontFamily: 'Kanit', fontSize: 14, opacity: 0.85 }}>
                📄 {reportTitle} &nbsp;—&nbsp; {all.ProductName || '-'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowReportModal(false)}
                  style={{ padding: '6px 18px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontFamily: 'Kanit', fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}>
                  ✕ ปิด
                </button>
                <button type="button" onClick={handlePrintReport}
                  style={{ padding: '6px 22px', borderRadius: 6, border: 'none', background: '#2A6AAA', color: '#fff', fontFamily: 'Kanit', fontSize: 13, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px rgba(42, 106, 170,0.4)', transition: 'all .15s' }}>
                  🖨️ Print
                </button>
              </div>
            </div>

            {/* A4 Landscape Pages */}
            <div
              className="special-sale-report-print"
              style={{
                width: 1122,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 16
              }}
            >
              {reportPages.map((pageRows: any[], pageIndex: number) => (
                <div
                  key={`report-page-${pageIndex}`}
                  className="special-sale-report-page"
                  style={{
                    minHeight: 793,
                    background: '#fff',
                    borderRadius: 4,
                    padding: '28px 40px 24px 40px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    fontFamily: "'TH Sarabun New', Sarabun, 'Tahoma', sans-serif",
                    color: '#1a1a1a',
                    position: 'relative',
                    lineHeight: 1.35,
                    breakAfter: pageIndex === reportPages.length - 1 ? 'auto' : 'page',
                    pageBreakAfter: pageIndex === reportPages.length - 1 ? 'auto' : 'always'
                  }}
                >
                  <table className="special-sale-report-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th colSpan={6} style={{ padding: 0 }}>
                          <div style={{ padding: '10px 12px 8px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 16, color: '#555' }}>แบบ {reportFormCode}</div>

                            <div style={{ textAlign: 'center', marginTop: -2 }}>
                              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{reportTitle}</div>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 0, marginTop: 4 }}>
                              <span style={{
                                display: 'inline-block', minWidth: 360, fontSize: 18, fontWeight: 600,
                                borderBottom: '1.5px dotted #888', padding: '2px 16px 1px', color: '#c0392b'
                              }}>
                                {reportStoreName || '\u00A0'}
                              </span>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 14, color: '#777', marginBottom: 10 }}>(ชื่อสถานที่ขายยา)</div>

                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6, fontSize: 16 }}>
                              <span style={{ whiteSpace: 'nowrap', marginRight: 6 }}>ชื่อยา</span>
                              <span style={{
                                flex: 1, borderBottom: '1.5px dotted #999', padding: '0 8px 1px',
                                fontSize: 16, fontWeight: 600, color: '#1565c0', minHeight: 22
                              }}>
                                {reportProductName + " " + reportDrugName}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginBottom: 6, fontSize: 15 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', flex: 2.2 }}>
                                <span style={{ whiteSpace: 'nowrap', marginRight: 6 }}>ชื่อผู้ผลิต / ผู้นำเข้า</span>
                                <span style={{ flex: 1, borderBottom: '1.5px dotted #999', padding: '0 6px 1px', fontWeight: 500, color: '#173F6B' }}>
                                  {reportMaker}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', flex: 1.5 }}>
                                <span style={{ whiteSpace: 'nowrap', marginRight: 6 }}>เลขที่หรืออักษรของครั้งที่ผลิต</span>
                                <span style={{ flex: 1, borderBottom: '1.5px dotted #999', padding: '0 6px 1px', textAlign: 'center' }}>
                                  {String(reportReceive?.lot || '-')}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', flex: 0.8 }}>
                                <span style={{ whiteSpace: 'nowrap', marginRight: 6 }}>ขนาดบรรจุ</span>
                                <span style={{ flex: 1, borderBottom: '1.5px dotted #999', padding: '0 6px 1px', textAlign: 'center' }}>
                                  {String(reportQty_Unit || '-')}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginBottom: 2, fontSize: 15 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', flex: 2.2 }}>
                                <span style={{ whiteSpace: 'nowrap', marginRight: 6 }}>ได้มาจาก</span>
                                <span style={{ flex: 1, borderBottom: '1.5px dotted #999', padding: '0 6px 1px', fontWeight: 500, color: '#173F6B' }}>
                                  {reportVendorName}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                                <span style={{ whiteSpace: 'nowrap', marginRight: 6 }}>จำนวนรับ</span>
                                <span style={{ flex: 1, borderBottom: '1.5px dotted #999', padding: '0 6px 1px', textAlign: 'center', fontWeight: 600, color: '#6a1b9a' }}>
                                  {reportQtyUnit || '-'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                                <span style={{ whiteSpace: 'nowrap', marginRight: 6 }}>วันที่รับ</span>
                                <span style={{ flex: 1, borderBottom: '1.5px dotted #999', padding: '0 6px 1px', textAlign: 'center', fontWeight: 600, color: '#6a1b9a' }}>
                                  {reportReceiveDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        </th>
                      </tr>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ border: '1px solid #334155', width: '5.5%', textAlign: 'center', padding: '5px 2px', fontWeight: 700, fontSize: 14 }}>ลำดับที่</th>
                        <th style={{ border: '1px solid #334155', width: '13%', textAlign: 'center', padding: '5px 2px', fontWeight: 700, fontSize: 14 }}>วัน เดือน ปี<br />ที่ขาย</th>
                        <th style={{ border: '1px solid #334155', width: '14%', textAlign: 'center', padding: '5px 2px', fontWeight: 700, fontSize: 14 }}>จำนวน / ปริมาณ<br />ที่ขาย</th>
                        <th style={{ border: '1px solid #334155', width: '30%', textAlign: 'center', padding: '5px 2px', fontWeight: 700, fontSize: 14 }}>ชื่อ สกุล ผู้ซื้อ</th>
                        <th style={{ border: '1px solid #334155', width: '24%', textAlign: 'center', padding: '5px 2px', fontWeight: 700, fontSize: 14 }}>ลายมือชื่อ<br />ผู้มีหน้าที่ปฏิบัติการ</th>
                        <th style={{ border: '1px solid #334155', width: '13.5%', textAlign: 'center', padding: '5px 2px', fontWeight: 700, fontSize: 14 }}>หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row: any, rowIndex: number) => {
                        const reportIndex = pageIndex * REPORT_ROWS_PER_PAGE + rowIndex
                        return (
                          <tr key={`report-row-${row.id || reportIndex}`}>
                            <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '3px 4px', fontSize: 14 }}>{reportIndex + 1}</td>
                            <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '3px 4px', fontSize: 14 }}>{toReportDateTime(row.createDate)}</td>
                            <td style={{ border: '1px solid #64748b', textAlign: 'center', padding: '3px 4px', fontSize: 14, fontWeight: 600 }}>{rowDisplayQty(row).toFixed(2)}</td>
                            <td style={{ border: '1px solid #64748b', textAlign: 'left', padding: '3px 8px', fontSize: 14 }}>{String(row.caregiverName || row.personsale || '-')}</td>
                            <td style={{ border: '1px solid #64748b', textAlign: 'left', padding: '3px 8px', fontSize: 14 }}>{String(row.pharmacy || '-')}</td>
                            <td style={{ border: '1px solid #64748b', textAlign: 'left', padding: '3px 8px', fontSize: 14 }} />
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        <style jsx global>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 8mm 10mm;
            }

            html, body {
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: hidden !important;
            }

            .special-sale-report-overlay,
            .special-sale-report-overlay * {
              visibility: visible !important;
            }

            .special-sale-report-overlay {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: auto !important;
              bottom: auto !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              background: transparent !important;
              display: block !important;
              padding: 0 !important;
              overflow: visible !important;
              z-index: 99999 !important;
            }

            .special-sale-report-print {
              position: relative !important;
              width: 100% !important;
              display: block !important;
              gap: 0 !important;
              background: transparent !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .special-sale-report-page {
              position: relative !important;
              width: 100% !important;
              min-height: auto !important;
              max-width: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              font-size: 13pt !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
              page-break-after: always !important;
              break-after: page !important;
            }

            .special-sale-report-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            .special-sale-report-print table {
              width: 100% !important;
              font-size: 12pt !important;
              page-break-inside: auto !important;
            }

            .special-sale-report-print table thead {
              display: table-header-group !important;
            }

            .special-sale-report-print table tbody tr {
              page-break-inside: avoid !important;
            }

            .special-sale-report-print table th,
            .special-sale-report-print table td {
              border-color: #000 !important;
            }

            .no-print,
            .special-sale-report-overlay > div:first-child {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </form>
  )
}

export default StockCardproduct
