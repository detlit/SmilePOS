'use client'

import React, { useEffect, useState, useRef } from "react";
import axios from 'axios'
import * as XLSX from 'xlsx'
import { ChevronDownIcon, Pencil, Trash2, FileText, CheckCircle, CreditCard, AlertCircle, Upload, Download, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Toaster, toast } from "sonner"
import { useMessageStore } from "./useMessageStore";

const apis = "receive"

function UpdateMainRC() {

  const d = new Date();
  const initialValues = {
    company: "", code: "", codenames: "", names: "", invoice_No: "",
    order_date: "", receive_date: "", tax_date: "", tax_no: "", pay_date: "", statuss: "", orderfull: "", countorder: 0
  };

  const idcus = useMessageStore((state) => state.idcus)
  const [all, setall1] = useState(initialValues)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTimeout(() => { setall1({ ...all, [name]: value }); }, 30);
  };

  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [open1, setOpen1] = React.useState(false)
  const [date1, setDate1] = React.useState<Date | undefined>(undefined)
  const [open2, setOpen2] = React.useState(false)
  const [date2, setDate2] = React.useState<Date | undefined>(undefined)
  const [open3, setOpen3] = React.useState(false)
  const [date3, setDate3] = React.useState<Date | undefined>(undefined)
  const [paymentConfirmed, setPaymentConfirmed] = React.useState(false)
  const [receiveConfirmed, setReceiveConfirmed] = React.useState(false)

  const [posts, setPosts] = useState([])
  const [supplier, setSupplier] = useState([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const setcpage = useMessageStore((state) => state.setcpage);

  const DeletePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (Number(all.countorder || 0) > 0) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ลบใบรับสินค้าไม่ได้</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 16 }}>กรุณาลบรายการสินค้าในใบรับนี้ก่อน</div>,
        duration: 3000,
      });
      return;
    }
    if (!confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;
    setLoading(true);

    try {
      await axios.delete(`/api/${apis}/${idcus}`)
      setcpage("0")
    } catch (error: any) {
      console.error('Failed to delete the post', error)
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ลบใบรับสินค้าไม่ได้</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 16 }}>{error?.response?.data?.error || "เกิดข้อผิดพลาด"}</div>,
        duration: 3000,
      });
    }
    finally { setLoading(false); }
  }

  const [opens, setOpens] = React.useState(false)
  const [values, setValues] = React.useState("")

  const AlertComplete = () => {
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะสินค้า</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
      duration: 3000,
    });
  };

  const AlertWarning = () => {
    toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> กรอกข้อมูลไม่ครบ</div>,
      duration: 3000,
    });
  };

  const UpdateCus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!all.names || !all.order_date || !all.receive_date || !all.invoice_No) {
      AlertWarning();
      return;
    }

    setLoading(true);

    const codenames = String(supplier.filter((supplier: any) => supplier.names === all.names).map((supplier: any) => supplier.code))
    const names = all.names
    const invoice_No = all.invoice_No

    const order_date = date
    const receive_date = date1
    const tax_date = date2
    const tax_no = all.tax_no
    const pay_date = date3
    const confirmedBy = localStorage.getItem("person_") || ""
    const statuss = paymentConfirmed
      ? "ชำระเงินแล้ว"
      : (pay_date || all.statuss === "ยังไม่ชำระเงิน")
        ? "ยังไม่ชำระเงิน"
        : ""

    try {
      await axios.put(`/api/${apis}/${Number(idcus)}`, {
        names,
        invoice_No,
        order_date,
        receive_date,
        tax_date,
        tax_no,
        pay_date,
        statuss,
        codenames,
        receiveConfirmStatus: receiveConfirmed ? 'confirmed' : undefined,
        confirmedBy,
      })
      AlertComplete()
      setcpage("0")
    } catch (error) { console.error(error) }
    finally { setLoading(false); }
  }

  const CreateCus = async () => {
    try { await setall1(initialValues); } catch (error) { console.error(error) }
  }

  useEffect(() => {
    const useMyHook = async () => {
      try {
        setIsFetching(true)
        await fetchPost()
      } catch (e) { console.error(e); }
    }
    CreateCus
    useMyHook()
  }, [idcus])

  const fetchPost = async () => {
    try {
      const res = await axios.get(`/api/${apis}/${Number(idcus)}`)
      const data = res.data
      setall1(data)
      if (data.order_date) setDate(new Date(data.order_date))
      if (data.receive_date) setDate1(new Date(data.receive_date))
      if (data.tax_date) setDate2(new Date(data.tax_date))
      if (data.pay_date) setDate3(new Date(data.pay_date))
      setPaymentConfirmed(data.statuss === "ชำระเงินแล้ว")
      setReceiveConfirmed(data.confirmRecord?.status === 'confirmed' || data.statuss === 'confirmed')
      setIsFetching(false)
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    let companyS = (localStorage.getItem("company_") || "")
    const fetchPostsz = async () => {
      try {
        const res = await axios.get(`/api/supplier?company=${companyS}`)
        setSupplier(res.data)
      } catch (error) { console.error(error) }
    }
    fetchPostsz()
  }, [])

  const formatDate = (d: Date | undefined) => {
    if (!d || isNaN(d.getTime())) return "เลือกวันที่";
    return `เลือก ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  // ============ Export Excel ============
  const handleExportExcel = async () => {
    const companyS = localStorage.getItem('company_') || ''
    const codeS = localStorage.getItem('codeS') || ''
    try {
      const res = await axios.get(`/api/dataitemlist?company=${companyS}&codenames=${codeS}`)
      const items = res.data
      if (!items || items.length === 0) {
        toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Export Excel</div>, {
          description: <div style={{ fontFamily: 'Kanit', fontSize: 16 }}>ไม่พบรายการสินค้า</div>,
          duration: 3000,
        })
        return
      }
      const sortedItems = [...items].sort((a: any, b: any) => Number(a.id) - Number(b.id))
      const exportData = sortedItems.map((item: any, idx: number) => {
        const expDate = item.dateExp && !isNaN(new Date(item.dateExp).getTime())
          ? `${new Date(item.dateExp).getDate()}/${new Date(item.dateExp).getMonth() + 1}/${new Date(item.dateExp).getFullYear()}`
          : ''
        return {
          'ลำดับ': idx + 1,
          'รหัสสินค้า': item.itemcode || '',
          'รายการสินค้า': item.itemName || '',
          'จำนวน': Number(item.qty || 0),
          'หน่วย': item.unit || '',
          'ทุนใหม่': Number(item.newCost || 0),
          'ส่วนลด': Number(item.discountbaht || 0),
          'รวมทุน': Number(item.totalcost || 0),
          'หมดอายุ': expDate,
          'Lot': item.lot || '',
          'คงเหลือ': Number(item.balance || 0),
        }
      })
      const ws = XLSX.utils.json_to_sheet(exportData)
      ws['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 40 }, { wch: 8 }, { wch: 8 },
        { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
      ]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'รับสินค้า')
      XLSX.writeFile(wb, `ใบรับสินค้า_RC${all.orderfull || ''}.xlsx`)
    } catch (err) { console.error('Export error:', err) }
  }

  // ============ Download Template ============
  const handleDownloadTemplate = () => {
    const templateData = [{
      'รหัสสินค้า': 'DG001',
      'รายการสินค้า': 'ตัวอย่าง - พาราเซตามอล',
      'จำนวน': 100,
      'ทุนใหม่': 25.50,
      'ส่วนลด': 0,
      'หมดอายุ': '31/12/2026',
      'Lot': 'LOT001',
      'คงเหลือ': 100,
    }]
    const ws = XLSX.utils.json_to_sheet(templateData)
    ws['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 10 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, `Template_Import_รับสินค้า.xlsx`)
  }

  // ============ Import Excel ============
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      if (!jsonData || jsonData.length === 0) {
        toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Import Excel</div>, {
          description: <div style={{ fontFamily: 'Kanit', fontSize: 16 }}>ไม่พบข้อมูลในไฟล์ Excel</div>,
          duration: 3000,
        })
        setImporting(false)
        return
      }
      const headerMap: Record<string, string> = {
        'รหัสสินค้า': 'itemcode', 'รายการสินค้า': 'itemName', 'จำนวน': 'qty',
        'หน่วย': 'unit', 'ทุนใหม่': 'newCost', 'ส่วนลด': 'discountbaht',
        'รวมทุน': 'totalcost', 'หมดอายุ': 'dateExp', 'Lot': 'lot',
        'คงเหลือ': 'balance',
        'itemcode': 'itemcode', 'itemName': 'itemName', 'qty': 'qty',
        'unit': 'unit', 'newCost': 'newCost', 'discountbaht': 'discountbaht',
        'totalcost': 'totalcost', 'dateExp': 'dateExp', 'lot': 'lot',
        'balance': 'balance',
      }
      const companyS = localStorage.getItem('company_') || ''
      const codeS = localStorage.getItem('codeS') || ''
      const person = localStorage.getItem('person_') || ''
      const codenames_val = String(supplier.filter((s: any) => s.names === all.names).map((s: any) => s.code))
      const dateRC = all.receive_date ? new Date(String(all.receive_date)) : new Date()
      const parseDate = (val: any): Date | null => {
        if (!val) return null
        const str = String(val).trim()
        if (!isNaN(Number(str))) {
          const excelEpoch = new Date(1899, 11, 30)
          return new Date(excelEpoch.getTime() + Number(str) * 86400000)
        }
        const parts = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (parts) return new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]))
        const iso = new Date(str)
        if (!isNaN(iso.getTime())) return iso
        return null
      }
      const items: any[] = []
      const errors: string[] = []
      jsonData.forEach((row, idx) => {
        const mapped: Record<string, any> = {}
        for (const [key, value] of Object.entries(row)) {
          const fieldName = headerMap[key]
          if (fieldName) mapped[fieldName] = value
        }
        if (!mapped.itemcode && !mapped.itemName) return
        const itemcode = String(mapped.itemcode || '').trim()
        if (!itemcode) { errors.push(`แถวที่ ${idx + 2}: ไม่มีรหัสสินค้า`); return }
        const qty = Number(mapped.qty || 0)
        const newCost = Number(mapped.newCost || 0)
        if (qty <= 0) { errors.push(`แถวที่ ${idx + 2}: จำนวนต้อง > 0`); return }
        if (newCost <= 0) { errors.push(`แถวที่ ${idx + 2}: ทุนใหม่ต้อง > 0`); return }
        const discountbaht = Number(mapped.discountbaht || 0)
        const totalcost = mapped.totalcost ? Number(mapped.totalcost) : (qty * newCost - discountbaht)
        const mappedBalance = mapped.balance !== undefined && mapped.balance !== '' ? Number(mapped.balance) : qty
        const balance = Number.isFinite(mappedBalance) && mappedBalance >= 0 && mappedBalance <= qty ? mappedBalance : qty
        const expDate = parseDate(mapped.dateExp)
        const lot = String(mapped.lot || '').trim()
        items.push({
          company: companyS, codenames: codeS, itemcode,
          itemName: String(mapped.itemName || '').trim(),
          unit: String(mapped.unit || '').trim(),
          newCost, qty, totalcost, lot: lot || null, dateExp: expDate,
          freebaht: 0, discountbaht, sale: 0, balance,
          person, statuss: '', dateRC,
          codevender: codenames_val, namevender: String(all.names || ''),
        })
      })
      if (items.length === 0) {
        toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Import Excel</div>, {
          description: <div style={{ fontFamily: 'Kanit', fontSize: 13 }}>
            {errors.length > 0 ? errors.slice(0, 5).join(', ') : 'ไม่พบรายการที่สามารถ Import ได้'}
          </div>,
          duration: 5000,
        })
        setImporting(false)
        return
      }
      // Fetch existing items to check for duplicates (match by itemcode + lot)
      const existingRes = await axios.get(`/api/dataitemlist?company=${companyS}&codenames=${codeS}`)
      const existingItems: any[] = existingRes.data || []
      const existingMap = new Map<string, any>()
      existingItems.forEach((ex: any) => {
        const key = `${ex.itemcode || ''}|${ex.lot || ''}`
        existingMap.set(key, ex)
      })
      const toCreate: any[] = []
      const toUpdate: { id: number; data: any }[] = []
      items.forEach((item: any) => {
        const key = `${item.itemcode || ''}|${item.lot || ''}`
        const existing = existingMap.get(key)
        if (existing) {
          toUpdate.push({ id: existing.id, data: item })
        } else {
          toCreate.push(item)
        }
      })
      await Promise.all(toUpdate.map(({ id, data }) =>
        axios.put(`/api/dataitemlist/${id}`, data)
      ))
      if (toCreate.length > 0) {
        await axios.post('/api/receivelist', toCreate)
      }
      const msg = `Import สำเร็จ: สร้างใหม่ ${toCreate.length}, อัพเดท ${toUpdate.length}` + (errors.length > 0 ? ` (ข้าม ${errors.length} แถว)` : '')
      toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Import Excel</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 16 }}>{msg}</div>,
        duration: 4000,
      })
      setcpage('0')
    } catch (err: any) {
      console.error('Import Excel error:', err)
      toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Import ผิดพลาด</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 13 }}>{err?.message || 'เกิดข้อผิดพลาด'}</div>,
        duration: 5000,
      })
    } finally { setImporting(false) }
  }

  const inputStyle = {
    fontFamily: "Kanit", fontSize: '13px', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #e2e8f0', backgroundColor: 'white', width: '220px'
  };

  const labelStyle = {
    fontFamily: 'Kanit', fontSize: '12px', color: '#64748b',
    width: '110px', textAlign: 'right' as const, paddingRight: '12px'
  };

  const dateButtonStyle = {
    fontFamily: 'Kanit', fontSize: '13px', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #e2e8f0', backgroundColor: 'white', width: '220px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    cursor: 'pointer', color: '#6366f1', fontWeight: 500
  };

  const userLevel = typeof window !== 'undefined' ? String(localStorage.getItem('level_') || '') : ''
  const disableReceiveInfo = receiveConfirmed && userLevel === 'level1'
  const receiveItemCount = Number(all.countorder || 0)
  const deleteDisabled = loading || receiveItemCount > 0

  return (
    <div className="w-full">
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          color: '#92400e', padding: '16px 20px', fontFamily: 'Kanit_B', fontSize: '15px',
          display: 'flex', alignItems: 'center', gap: '10px',
          borderBottom: '1px solid #fcd34d'
        }}>
          <FileText size={20} /> แก้ไขใบรับสินค้า
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Export Excel */}
            <button onClick={handleExportExcel} style={{
              background: 'linear-gradient(145deg, #2A6AAA, #1E5088)', color: 'white', border: 'none',
              borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: 'Kanit', display: 'flex', alignItems: 'center', gap: '3px',
              boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)'
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <FileSpreadsheet size={12} /> Export
            </button>
            {/* Import Excel */}
            <button
              onClick={() => { if (!disableReceiveInfo) fileInputRef.current?.click() }}
              disabled={importing || disableReceiveInfo}
              style={{
                background: importing ? 'linear-gradient(145deg, #9ca3af, #6b7280)' : 'linear-gradient(145deg, #2A6AAA, #1E5088)',
                color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '10px',
                fontWeight: 500, cursor: importing || disableReceiveInfo ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'Kanit', display: 'flex', alignItems: 'center', gap: '3px',
                boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)', opacity: importing ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!importing && !disableReceiveInfo) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Upload size={12} /> {importing ? 'Import...' : 'Import'}
            </button>
            {/* Template */}
            <button onClick={handleDownloadTemplate} style={{
              background: 'linear-gradient(145deg, #f59e0b, #d97706)', color: 'white', border: 'none',
              borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: 'Kanit', display: 'flex', alignItems: 'center', gap: '3px',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Download size={12} /> Template
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportExcel} />
          </div>
        </div>

        {isFetching ? (
          <div style={{
            padding: '100px 24px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '16px'
          }}>
            <div className="animate-pulse" style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '3px solid #6366f1', borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{ fontFamily: 'Kanit', fontSize: '18px', color: '#6366f1', fontWeight: 500 }}>
              กำลังโหลด...
            </div>
            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            <div style={{ opacity: disableReceiveInfo ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
            {/* เลขที่ */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>เลขที่ :</div>
              <input name="code" value={`RC${all.orderfull}`} disabled={true}
                style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#2A6AAA', fontWeight: 600 }} />
            </div>

            {/* รหัสผู้ขาย */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>รหัสผู้ขาย :</div>
              <input name="codenames" value={supplier.filter((supplier: any) => supplier.names === all.names).map((supplier: any) => supplier.code)}
                disabled={true} style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#2A6AAA', fontWeight: 600 }} />
            </div>

            {/* ชื่อร้าน/บริษัท */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>ชื่อร้าน/บริษัท :</div>
              <Popover open={opens} onOpenChange={setOpens}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" name="names" aria-expanded={opens}
                    style={{ ...dateButtonStyle, color: all.names ? '#2A6AAA' : '#94a3b8' }}
                    disabled={disableReceiveInfo}>
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {all.names ? all.names : "เลือกบริษัท"}
                    </span>
                    <ChevronDownIcon style={{ width: 16, height: 16, opacity: 0.7 }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="เลือกบริษัท" className="h-9" />
                    <CommandList>
                      <CommandEmpty>No framework found.</CommandEmpty>
                      <CommandGroup>
                        {supplier.map((supplier: any) => (
                          <CommandItem key={supplier.code} value={supplier.names}
                            onSelect={(currentValue) => { setValues(currentValue); setall1({ ...all, names: currentValue }); setOpens(false) }}>
                            {supplier.names}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* วันสั่งสินค้า */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>วันสั่งสินค้า :</div>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="order_date" name="order_date" style={dateButtonStyle} disabled={disableReceiveInfo}>
                    <span>{formatDate(date)}</span>
                    <ChevronDownIcon style={{ width: 16, height: 16 }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar mode="single" selected={date} captionLayout="dropdown"
                    onSelect={(date) => { setDate(date); setall1({ ...all, order_date: date ? "ok" : "" }); setOpen(false) }} />
                </PopoverContent>
              </Popover>
            </div>

            {/* วันรับสินค้า */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>วันรับสินค้า :</div>
              <Popover open={open1} onOpenChange={setOpen1}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="receive_date" name="receive_date" style={dateButtonStyle} disabled={disableReceiveInfo}>
                    <span>{formatDate(date1)}</span>
                    <ChevronDownIcon style={{ width: 16, height: 16 }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar mode="single" selected={date1} captionLayout="dropdown"
                    onSelect={(date1) => { setDate1(date1); setall1({ ...all, receive_date: date1 ? "ok" : "" }); setOpen1(false) }} />
                </PopoverContent>
              </Popover>
            </div>

            {/* เลขที่ใบสั่งซื้อ */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>เลขที่ใบสั่งซื้อ :</div>
              <input name="invoice_No" value={all.invoice_No} onChange={handleInputChange} disabled={disableReceiveInfo}
                placeholder="กรอกเลขที่ใบสั่งซื้อ" style={inputStyle} />
            </div>

            {/* วันที่ใบกำกับภาษี */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>วันที่ใบกำกับภาษี :</div>
              <Popover open={open2} onOpenChange={setOpen2}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="tax_date" name="tax_date" style={dateButtonStyle} disabled={disableReceiveInfo}>
                    <span>{formatDate(date2)}</span>
                    <ChevronDownIcon style={{ width: 16, height: 16 }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar mode="single" selected={date2} captionLayout="dropdown"
                    onSelect={(date2) => { setDate2(date2); setall1({ ...all, tax_date: date2 ? "ok" : "" }); setOpen2(false) }} />
                </PopoverContent>
              </Popover>
            </div>

            {/* เลขที่ใบกำกับภาษี */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>เลขที่ใบกำกับภาษี :</div>
              <input name="tax_no" value={all.tax_no} onChange={handleInputChange} disabled={disableReceiveInfo}
                placeholder="กรอกเลขที่ใบกำกับภาษี" style={inputStyle} />
            </div>
            </div>

            {disableReceiveInfo && (
              <div style={{
                marginBottom: '14px', padding: '10px 14px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)',
                border: '1px solid #A6C8E7', color: '#1E5088',
                fontFamily: 'Kanit', fontSize: '12px'
              }}>
                รายการนี้ยืนยันรับสินค้าแล้ว ผู้ใช้ระดับ level1 ไม่สามารถแก้ไขข้อมูลส่วนหัวใบรับสินค้าได้
              </div>
            )}

            {/* สถานะชำระสินค้า */}
            <div style={{
              marginBottom: '14px', padding: '12px 16px', borderRadius: '10px',
              background: date3 && !isNaN(date3.getTime())
                ? 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)'
                : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: paymentConfirmed ? '1px solid #74CCA4' : '1px solid #fcd34d'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {paymentConfirmed ? (
                    <CheckCircle size={18} color="#2A6AAA" />
                  ) : (
                    <AlertCircle size={18} color="#d97706" />
                  )}
                  <span style={{
                    fontFamily: 'Kanit_B', fontSize: '13px',
                    color: paymentConfirmed ? '#147F56' : '#d97706'
                  }}>
                    {paymentConfirmed ? 'ชำระเงินแล้ว' : 'ยังไม่ชำระเงิน'}
                  </span>
                </div>
                {paymentConfirmed && date3 && !isNaN(date3.getTime()) && (
                  <span style={{
                    fontFamily: 'Kanit', fontSize: '12px', color: '#2A6AAA',
                    background: '#E5EEF8', padding: '2px 10px', borderRadius: '20px'
                  }}>
                    {date3.getDate()}/{date3.getMonth() + 1}/{date3.getFullYear()}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ ...labelStyle, width: 'auto', paddingRight: '8px', color: paymentConfirmed ? '#147F56' : '#92400e' }}>
                  วันที่ชำระจริง :
                </div>
                <Popover open={open3} onOpenChange={setOpen3}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" id="pay_date" name="pay_date" style={{
                      ...dateButtonStyle, flex: 1,
                      borderColor: paymentConfirmed ? '#74CCA4' : '#fcd34d',
                      color: date3 ? (paymentConfirmed ? '#147F56' : '#d97706') : '#9ca3af'
                    }}>
                      <span>{date3 ? formatDate(date3) : 'เลือก วันที่ชำระสินค้า'}</span>
                      <ChevronDownIcon style={{ width: 16, height: 16 }} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar mode="single" selected={date3} captionLayout="dropdown"
                      onSelect={(d) => { setDate3(d); setOpen3(false); }} />
                  </PopoverContent>
                </Popover>
                {!paymentConfirmed && (
                  <button onClick={async () => {
                    if (loading) return;
                    if (!date3) { toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>กรุณาเลือกวันที่ชำระก่อน</div>); return; }
                    if (!confirm('ยืนยันชำระเงินหรือไม่?')) return;
                    setLoading(true);
                    try {
                      await axios.put(`/api/${apis}/${Number(idcus)}`, { pay_date: date3, statuss: 'ชำระเงินแล้ว' });
                      setall1((prev: any) => ({ ...prev, pay_date: 'ok', statuss: 'ชำระเงินแล้ว' }));
                      setPaymentConfirmed(true);
                      toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>ชำระสินค้า</div>, {
                        description: <div style={{ fontFamily: 'Kanit', fontSize: 20 }}>ยืนยันชำระเงินเรียบร้อย</div>,
                        duration: 3000,
                      });
                      setcpage('0');
                    } catch (error) { console.error(error); }
                    finally { setLoading(false); }
                  }} type="button" style={{
                    fontFamily: 'Kanit', fontSize: '12px', padding: '6px 14px', borderRadius: '8px', border: 'none',
                    background: date3 ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' : '#d1d5db',
                    color: 'white', cursor: loading || !date3 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                    boxShadow: date3 ? '0 2px 4px rgba(42, 106, 170, 0.3)' : 'none',
                    opacity: loading ? 0.7 : 1
                  }} disabled={loading}>
                    <CreditCard size={14} /> ยืนยันชำระ
                  </button>
                )}
                {paymentConfirmed && (
                  <button onClick={async () => {
                    if (loading) return;
                    if (!confirm('ต้องการยกเลิกการชำระเงินหรือไม่?')) return;
                    setLoading(true);
                    try {
                      await axios.put(`/api/${apis}/${Number(idcus)}`, { pay_date: null, statuss: 'ยังไม่ชำระเงิน' });
                      setDate3(undefined);
                      setall1((prev: any) => ({ ...prev, pay_date: '', statuss: 'ยังไม่ชำระเงิน' }));
                      setPaymentConfirmed(false);
                      toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>ยกเลิกชำระ</div>, {
                        description: <div style={{ fontFamily: 'Kanit', fontSize: 20 }}>ยกเลิกการชำระเงินเรียบร้อย</div>,
                        duration: 3000,
                      });
                      setcpage('0');
                    } catch (error) { console.error(error); }
                    finally { setLoading(false); }
                  }} type="button" style={{
                    fontFamily: 'Kanit', fontSize: '12px', padding: '6px 14px', borderRadius: '8px',
                    border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#ef4444',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                    opacity: loading ? 0.7 : 1
                  }} disabled={loading}>
                    <Trash2 size={14} /> ยกเลิก
                  </button>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', paddingTop: '20px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button onClick={UpdateCus} type="button" data-logbook-context={`RC${all.orderfull || ''} ${all.names || ''}`.trim()} data-logbook-code={`RC${all.orderfull || ''}`} data-logbook-name={all.names || ''} style={{
                fontFamily: 'Kanit', fontSize: '14px', padding: '10px 28px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)',
                opacity: loading ? 0.7 : 1
              }} disabled={loading}>
                <Pencil size={16} /> {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button onClick={DeletePost} type="button" title={receiveItemCount > 0 ? "กรุณาลบรายการสินค้าในใบรับนี้ก่อน" : "ลบใบรับสินค้า"} data-logbook-context={`RC${all.orderfull || ''} ${all.names || ''}`.trim()} data-logbook-code={`RC${all.orderfull || ''}`} data-logbook-name={all.names || ''} style={{
                fontFamily: 'Kanit', fontSize: '14px', padding: '10px 28px', borderRadius: '8px',
                border: receiveItemCount > 0 ? '1px solid #cbd5e1' : '1px solid #fca5a5',
                backgroundColor: receiveItemCount > 0 ? '#f1f5f9' : '#fef2f2',
                color: receiveItemCount > 0 ? '#94a3b8' : '#ef4444', cursor: deleteDisabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: deleteDisabled ? 0.7 : 1
              }} disabled={deleteDisabled}>
                <Trash2 size={16} /> {loading ? "กำลังลบ..." : "ลบ"}
              </button>
              <button onClick={async (e) => {
                e.preventDefault();
                if (loading) return;
                if (receiveConfirmed) return;
                if (!confirm("ยืนยันการ Confirm Order ?")) return;
                setLoading(true);
                try {
                  await axios.put(`/api/${apis}/${Number(idcus)}`, {
                    receiveConfirmStatus: 'confirmed',
                    confirmedBy: localStorage.getItem('person_') || '',
                  });
                  setReceiveConfirmed(true);
                  toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Confirm Order</div>, {
                    description: <div style={{ fontFamily: 'Kanit', fontSize: 20 }}>ยืนยัน Order เรียบร้อย</div>,
                    duration: 3000,
                  });
                  setcpage("0");
                } catch (error) { console.error(error); }
                finally { setLoading(false); }
              }} type="button" style={{
                fontFamily: 'Kanit', fontSize: '14px', padding: '10px 28px', borderRadius: '8px', border: 'none',
                background: receiveConfirmed
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)',
                opacity: loading ? 0.7 : 1
              }} disabled={loading}>
                <CheckCircle size={16} /> {receiveConfirmed ? 'Confirmed' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default UpdateMainRC