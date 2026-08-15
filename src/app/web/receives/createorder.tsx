'use client'

import React, { useEffect, useState } from "react";
import axios from 'axios'
import { ChevronDownIcon, Save, RotateCcw, FileText, Building2, Calendar as CalendarIcon } from "lucide-react"
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

interface CreateMainOrderProps {
  initialData?: {
    names?: string;
    invoice_No?: string;
    order_date?: Date;
    items?: any[];
  };
  onSuccess?: () => void;
}

function CreateMainOrder({ initialData, onSuccess }: CreateMainOrderProps) {
  const d = new Date();
  const initialValues = {
    company: "", code: "", codenames: "", names: initialData?.names || "", invoice_No: initialData?.invoice_No || "",
    order_date: initialData?.order_date ? "ok" : "", receive_date: "ok", tax_date: "", tax_no: "", pay_date: "", statuss: "",
  };

  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const maxRecStore = useMessageStore((state) => state.maxRec)
  const [maxRec, setMaxRec] = useState(maxRecStore)

  var dt = new Date();
  let year = dt.getFullYear();
  let month = (dt.getMonth()
    + 1).toString().padStart(2, "0");
  let day = dt.getDate().toString().padStart(2, "0");

  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(initialData?.order_date || undefined)
  const [open1, setOpen1] = React.useState(false)
  const [date1, setDate1] = React.useState<Date | undefined>(new Date())
  const [open2, setOpen2] = React.useState(false)
  const [date2, setDate2] = React.useState<Date | undefined>(undefined)
  const [open3, setOpen3] = React.useState(false)
  const [date3, setDate3] = React.useState<Date | undefined>(undefined)

  const [posts, setPosts] = useState([])
  const [supplier, setSupplier] = useState([])

  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apis}?company=${companyS}`)
      setPosts(res.data)

      // Calculate maxRec if it's not set or needs update
      let result = res.data.filter((a: any) => a.orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.code))
      let maxValue = Math.max.apply(null, result)
      setMaxRec(String(maxValue))
    } catch (error) { console.error(error) }
  }

  const [all, setall1] = useState(initialValues)
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setall1(prev => ({ ...prev, [name]: value }));
  };
  const [opens, setOpens] = React.useState(false)
  const [values, setValues] = React.useState("")

  const CreateCus = async () => {
    try { setall1(initialValues); setDate(undefined); setDate1(new Date()); setDate2(undefined); setDate3(undefined); } catch (error) { console.error(error) }
  }

  const AlertComplete = () => {
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
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

  const setcpage = useMessageStore((state) => state.setcpage);

  let maxRecN = Number(maxRec) == -Infinity || isNaN(Number(maxRec)) ? 100 : Number(maxRec) + 1

  const CleckSubmit = async (e: any) => {
    e.preventDefault();
    if (loading) return;

    if (!all.names || !date || !date1 || !all.invoice_No) {
      AlertWarning();
      return;
    }

    setLoading(true);

    let companyS = (localStorage.getItem("company_") || "")
    const company = companyS
    const person = localStorage.getItem("person_") || ""
    const code = String(maxRecN)
    const codenames_header = String(year) + String(month) + String(day) + String(maxRecN)
    const codevender = String(supplier.filter((s: any) => s.names === all.names).map((s: any) => s.code))
    const names = all.names
    const invoice_No = all.invoice_No
    const order_date = date
    const receive_date = date1
    const tax_date = date2
    const tax_no = all.tax_no
    const pay_date = date3
    const statuss = date3 ? "ยังไม่ชำระเงิน" : all.statuss
    const orderNo = String(year) + String(month) + String(day)
    const orderfull = String(year) + String(month) + String(day) + String(maxRecN)

    try {
      // 1. Save Receive main record
      await axios.post(`/api/${apis}`, { company, code, names, invoice_No, order_date, receive_date, tax_date, tax_no, pay_date, statuss, codenames: codevender, orderNo, orderfull, persons: person })

      // 2. Save items to RCitemlist if they exist
      if (initialData?.items && initialData.items.length > 0) {
        const itemsToSave = initialData.items.map((item: any) => ({
          company: company,
          person: person,
          codenames: codenames_header, // เลขที่ จาก create order (ไม่มี RC)
          itemcode: item.itemcode,
          itemName: item.itemName,
          unit: item.unit || "",
          qty: item.qty,
          newCost: item.cost,
          totalcost: (item.qty || 0) * (item.cost || 0),
          dateRC: receive_date,
          codevender: codevender,
          namevender: names,
          balance: item.qty, // Initial balance is same as qty
          statuss: "Pending", // Default status for items
        }))

        await axios.post('/api/receivelist', itemsToSave)
      }

      setcpage(String("0"))
      AlertComplete()
      if (onSuccess) {
        onSuccess()
      }
      await fetchPosts()
    } catch (error) { console.error(error) }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let companyS = (localStorage.getItem("company_") || "")
    const fetchPostsz = async () => {
      try {
        setIsFetching(true)
        const [supplierRes, postsRes] = await Promise.all([
          axios.get(`/api/supplier?company=${companyS}`),
          fetchPosts()
        ])
        setSupplier(supplierRes.data)
        setIsFetching(false)
      } catch (error) {
        console.error(error)
        setIsFetching(false)
      }
    }
    fetchPostsz()
  }, [])

  useEffect(() => {
    if (initialData) {
      setall1(prev => ({
        ...prev,
        names: initialData.names || prev.names,
        invoice_No: initialData.invoice_No || prev.invoice_No,
        order_date: initialData.order_date ? "ok" : prev.order_date
      }));
      if (initialData.order_date) {
        setDate(initialData.order_date);
      }
    }
  }, [initialData])

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

  return (
    <div className="w-full">
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', boxShadow: initialData ? 'none' : '0 4px 15px rgba(0,0,0,0.05)',
        border: initialData ? 'none' : '1px solid #e2e8f0', overflow: 'hidden'
      }}>
        {/* Header */}
        {!initialData && (
          <div style={{
            background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)',
            color: '#1E5088', padding: '16px 20px', fontFamily: 'Kanit_B', fontSize: '15px',
            display: 'flex', alignItems: 'center', gap: '10px',
            borderBottom: '1px solid #A6C8E7'
          }}>
            <FileText size={20} /> สร้างใบรับสินค้า
          </div>
        )}

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
          <div style={{ padding: initialData ? '0px' : '24px' }}>
            {/* เลขที่ */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>เลขที่ :</div>
              <input name="code" value={`RC${String(year) + String(month) + String(day) + String(maxRecN)}`}
                disabled={true} style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#2A6AAA', fontWeight: 600 }} />
            </div>

            {/* รหัสผู้ขาย */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>รหัสผู้ขาย :</div>
              <input name="codenames" value={supplier.filter((s: any) => s.names === all.names).map((s: any) => s.code)}
                disabled={true} style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#2A6AAA', fontWeight: 600 }} />
            </div>

            {/* ชื่อร้าน/บริษัท */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>ชื่อร้าน/บริษัท :</div>
              <Popover open={opens} onOpenChange={setOpens}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" name="names" aria-expanded={opens}
                    style={{ ...dateButtonStyle, color: all.names ? '#2A6AAA' : '#94a3b8' }}>
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
                        {supplier.map((s: any) => (
                          <CommandItem key={s.code} value={s.names}
                            onSelect={(currentValue) => { setValues(currentValue); setall1({ ...all, names: currentValue }); setOpens(false) }}>
                            {s.names}
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
                  <Button variant="outline" id="order_date" name="order_date" style={dateButtonStyle}>
                    <span>{date ? `เลือก ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}` : "เลือก วันสั่งสินค้า"}</span>
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
                  <Button variant="outline" id="receive_date" name="receive_date" style={dateButtonStyle}>
                    <span>{date1 ? `เลือก ${date1.getDate()}/${date1.getMonth() + 1}/${date1.getFullYear()}` : "เลือก วันรับสินค้า"}</span>
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
              <input name="invoice_No" value={all.invoice_No} onChange={handleInputChange}
                placeholder="กรอกเลขที่ใบสั่งซื้อ" style={inputStyle} />
            </div>

            {/* วันที่ใบกำกับภาษี */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>วันที่ใบกำกับภาษี :</div>
              <Popover open={open2} onOpenChange={setOpen2}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="tax_date" name="tax_date" style={dateButtonStyle}>
                    <span>{date2 ? `เลือก ${date2.getDate()}/${date2.getMonth() + 1}/${date2.getFullYear()}` : "เลือก วันออกใบกำกับภาษี"}</span>
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
              <input name="tax_no" value={all.tax_no} onChange={handleInputChange}
                placeholder="กรอกเลขที่ใบกำกับภาษี" style={inputStyle} />
            </div>

            {/* วันที่ต้องชำระ */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={labelStyle}>วันที่ต้องชำระ :</div>
              <Popover open={open3} onOpenChange={setOpen3}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="pay_date" name="pay_date" style={dateButtonStyle}>
                    <span>{date3 ? `เลือก ${date3.getDate()}/${date3.getMonth() + 1}/${date3.getFullYear()}` : "เลือก วันที่ชำระสินค้า"}</span>
                    <ChevronDownIcon style={{ width: 16, height: 16 }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar mode="single" selected={date3} captionLayout="dropdown"
                    onSelect={(date3) => { setDate3(date3); setall1({ ...all, pay_date: date3 ? "ok" : "" }); setOpen3(false) }} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', paddingTop: '20px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button onClick={CleckSubmit} type="button" style={{
                fontFamily: 'Kanit', fontSize: '14px', padding: '10px 28px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)',
                opacity: loading ? 0.7 : 1
              }} disabled={loading}>
                <Save size={16} /> {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button onClick={CreateCus} type="button" style={{
                fontFamily: 'Kanit', fontSize: '14px', padding: '10px 28px', borderRadius: '8px',
                border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }} disabled={loading}>
                <RotateCcw size={16} /> ลบ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default CreateMainOrder