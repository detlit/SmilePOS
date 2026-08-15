'use client'

import React, { useEffect, useState } from "react";
import axios from 'axios'
import { Check, ChevronDownIcon, Pencil, Trash2, ClipboardList, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Toaster, toast } from "sonner"
import { useMessageStore } from "./useMessageStore";
import { usePermission } from "@/utils/usePermission"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const getfixname = "fixname"
const apis = "customer"
const getsalehistory = "salehistory"
const getdrugg = "drugallergy"

// ซ่อนส่วน "ประวัติแพ้ยา" ในฟอร์มแก้ไขลูกค้า (เปลี่ยนเป็น true เพื่อแสดงกลับ)
const SHOW_DRUG_ALLERGY = false

const frameworks = [
  { value: "ชาย", label: "ชาย" },
  { value: "หญิง", label: "หญิง" },
  { value: "ไม่ระบุ", label: "ไม่ระบุ" },
]

function Updatecustomer() {

  const initialValues = {
    company: "", code: "", names: "", sex: "", idcode: "", age: "", birthday: "",
    address: "", branch: "", levelPrice: "", tel: "", pointStart: "", point: "",
    totalPoint: "", customer: "", numbertax: "", drugallergy: "", congenitalDisease: "", statuss: "", moreInfo: "",
  };

  const idcus = useMessageStore((state) => state.idcus)
  const { hasPermission } = usePermission()
  const canEditCustomerPoint = hasPermission("I2")
  const [all, setall1] = useState(initialValues)
  const [drugs, setdrugs] = useState([])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTimeout(() => { setall1({ ...all, [name]: value }); }, 30);
  };

  function SexInput() {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" name="sex" aria-expanded={open}
            style={{ fontFamily: "Kanit", fontSize: 13, width: 90, borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {all.sex ? all.sex : "เพศ"}
            <ChevronDownIcon className="opacity-70" style={{ marginLeft: 5 }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="เลือกเพศ" className="h-9" />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((framework) => (
                  <CommandItem key={framework.value} value={framework.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue)
                      setall1({ ...all, sex: currentValue === value ? "" : currentValue });
                      setOpen(false)
                    }}>
                    {framework.label}
                    <Check className={cn("ml-auto", value === framework.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)

  // Format date as dd/MM/yyyy in Gregorian (ค.ศ.) to avoid Thai Buddhist year (พ.ศ.) from toLocaleDateString
  const formatDate = (d: Date | undefined) => {
    if (!d) return ""
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const computedAge = React.useMemo(() => {
    if (!date) return "";
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
    return age >= 0 ? String(age) : "";
  }, [date]);
  const [posts, setPosts] = useState([])

  const DeletePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.delete(`/api/${apis}/${idcus}`)
      setcpage(String("0"))
    } catch (error) { console.error('Failed to delete the post', error) }
  }

  const [userInput, setUserInput] = useState('');
  const [open1, setOpen1] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items1, setIndicator1] = useState<{ value: string, label: string }[]>([]);
  const [drugg, setdrugg] = useState("")

  const AlertComplete = () => {
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะสินค้า</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
      duration: 3000,
    });
  };

  const setcpage = useMessageStore((state) => state.setcpage);
  const updateInput = (value: any) => { setUserInput(value); };

  const IndicatorPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${getfixname}?company=${companyS}`)
      const items = await res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
      setIndicator1([{ value: "ไม่มี", label: "ไม่มี" }, ...items])
    } catch (error) { console.error(error) }
  }

  const UpdateCus = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = all.code
    const names = all.names
    const sex = all.sex
    const idcode = all.idcode
    const age = Number(all.age)
    const birthday = all.birthday
    const address = all.address
    const branch = all.branch
    const levelPrice = all.levelPrice
    const tel = all.tel
    const numbertax = all.numbertax
    const pointStart = Number(all.pointStart)
    const point = Number(all.point)
    const totalPoint = Number(all.totalPoint)
    const customer = all.customer
    const congenitalDisease = all.congenitalDisease
    const statuss = all.statuss
    const moreInfo = all.moreInfo

    try {
      await axios.put(`/api/${apis}/${Number(idcus)}`,
        { code, names, sex, idcode, age, birthday, address, branch, levelPrice, tel, pointStart, point, totalPoint, customer, congenitalDisease, statuss, numbertax, moreInfo }
      )
      setcpage(String("0"))
      AlertComplete()
    } catch (error) { console.error(error) }
  }

  const PostDrug = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    const company = companyS
    const drugallergy = userInput
    const remark = drugg
    const id_cus = Number(idcus)
    try {
      await axios.post(`/api/${getdrugg}`, { company, drugallergy, remark, id_cus })
      AlertComplete()
      await fetchPost()
    } catch (error) { console.error(error) }
  }

  const DeleteDrug = async (id: Number) => {
    try {
      await axios.delete(`/api/${getdrugg}/${id}`)
      await fetchPost()
    } catch (error) { console.error('Failed to delete the post', error) }
  }

  const [sh, setsh] = useState([])

  const GetHistory = async (customerData?: any) => {
    let companyS = (localStorage.getItem("company_") || "")
    const customerCode = String(customerData?.code || all.code || "").trim()
    const customerId = Number(customerData?.id || idcus || 0)
    if (!customerId && !customerCode) {
      setsh([])
      return
    }

    const params = new URLSearchParams({ companyall: companyS })
    if (customerCode) params.set("code_costomer", customerCode)
    if (customerId) params.set("id_costomer", String(customerId))

    try {
      const res = await axios.get(`/api/${getsalehistory}?${params.toString()}`)
      setsh(res.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    const useMyHook = async () => {
      try {
        const customerData = await fetchPost()
        await GetHistory(customerData)
      } catch (e) { console.error(e); }
    }
    useMyHook()
  }, [idcus])

  const fetchPost = async () => {
    try {
      const res = await axios.get(`/api/${apis}/${Number(idcus)}`)
      const data = Object.fromEntries(
        Object.entries(res.data).map(([key, value]) => [key, value ?? ""])
      )
      setall1(data as any)
      setdrugs(res.data.drugallergys)
      if (res.data.birthday) {
        const parsed = new Date(res.data.birthday)
        if (!isNaN(parsed.getTime())) setDate(parsed)
      }
      return res.data
    } catch (error) { console.error(error) }
  }

  const inputStyle = {
    fontFamily: "Kanit", fontSize: '13px', borderRadius: '8px',
    border: '1px solid #e2e8f0', padding: '8px 12px', width: '200px'
  };

  const labelStyle = {
    fontFamily: 'Kanit', fontSize: '12px', color: '#64748b',
    width: '90px', textAlign: 'right' as const, paddingRight: '10px'
  };

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0', overflow: 'hidden'
    }}>
      <div className='row g-0'>
        {/* Left Column - Customer Form */}
        <div className='col-lg-5'>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white', padding: '14px 20px', fontFamily: 'Kanit_B', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Pencil size={18} /> แก้ไข-ลบ ข้อมูลลูกค้า
          </div>

          <div style={{ padding: '20px' }}>
            {[
              { label: 'รหัสลูกค้า', name: 'code', disabled: true },
              { label: 'ชื่อ-สกุล', name: 'names' }
            ].map((field, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={labelStyle}>{field.label} :</div>
                <input name={field.name} value={(all as any)[field.name]} onChange={handleInputChange}
                  disabled={field.disabled} style={{ ...inputStyle, backgroundColor: field.disabled ? '#f8fafc' : 'white' }} />
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={labelStyle}>วันเกิด :</div>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="date" name="birthday"
                    style={{ fontFamily: 'Kanit', fontSize: 13, width: 200, justifyContent: 'space-between', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {date ? formatDate(date) : all.birthday}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar mode="single" selected={date} captionLayout="dropdown"
                    onSelect={(date) => { setDate(date); setall1({ ...all, birthday: formatDate(date) }); setOpen(false) }} />
                </PopoverContent>
              </Popover>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={labelStyle}>เพศ :</div>
              <SexInput />
              <div style={{ ...labelStyle, width: '50px' }}>อายุ :</div>
              <input type="text" name="age" value={computedAge} readOnly
                style={{ ...inputStyle, width: '70px', backgroundColor: '#f8fafc' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={labelStyle}>การซื้อ :</div>
              <select name="customer" value={all.customer}
                onChange={(e) => setall1({ ...all, customer: e.target.value })}
                style={{ ...inputStyle, width: '120px', cursor: 'pointer' }}>
                <option value="">เลือก</option>
                <option value="ปลีก">ปลีก</option>
                <option value="ส่ง">ส่ง</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={labelStyle}>ระดับราคา :</div>
              <select name="levelPrice" value={all.levelPrice}
                onChange={(e) => setall1({ ...all, levelPrice: e.target.value })}
                style={{ ...inputStyle, width: '140px', cursor: 'pointer' }}>
                <option value="">เลือก</option>
                <option value="หน้าร้าน">หน้าร้าน</option>
                <option value="ขายส่ง">ขายส่ง</option>
                <option value="สมาชิก">สมาชิก</option>
                <option value="ราคา A">ราคา A</option>
                <option value="ราคา B">ราคา B</option>
                <option value="ราคา C">ราคา C</option>
                <option value="ราคา D">ราคา D</option>
                <option value="ราคา E">ราคา E</option>
                <option value="ราคา F">ราคา F</option>
                <option value="ราคา G">ราคา G</option>
                <option value="ราคา H">ราคา H</option>
              </select>
            </div>

            <div style={{ display: 'none' }}>
              <div style={labelStyle}>แต้มเริ่มต้น :</div>
              <input type="number" name="pointStart" value={all.pointStart} onChange={handleInputChange}
                style={{ ...inputStyle, width: '80px' }} />
              <div style={{ ...labelStyle, width: '70px' }}>แต้มสะสม :</div>
              <input type="number" name="point" value={all.point} onChange={handleInputChange}
                style={{ ...inputStyle, width: '80px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={labelStyle}>แต้มทั้งหมด :</div>
              <input type="number" name="totalPoint" value={all.totalPoint} onChange={handleInputChange}
                disabled={!canEditCustomerPoint}
                style={{ ...inputStyle, width: '80px', backgroundColor: canEditCustomerPoint ? 'white' : '#f1f5f9', cursor: canEditCustomerPoint ? 'text' : 'not-allowed' }} />
            </div>

            {[
              { label: 'เบอร์โทรศัพท์', name: 'tel', type: 'number' },
              { label: 'เลขบัตร', name: 'idcode', type: 'number' }
            ].map((field, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={labelStyle}>{field.label} :</div>
                <input type={field.type} name={field.name} value={(all as any)[field.name]}
                  onChange={handleInputChange} style={inputStyle} />
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={labelStyle}>ที่อยู่ :</div>
              <textarea name="address" value={all.address} onChange={handleInputChange}
                style={{ ...inputStyle, height: '50px', resize: 'none' }} />
            </div>

            {[
              { label: 'เลขภาษี', name: 'numbertax', type: 'number' }
              // ซ่อนช่อง "โรคประจำตัว" — เพิ่มบรรทัดนี้กลับเพื่อแสดง:
              // , { label: 'โรคประจำตัว', name: 'congenitalDisease' }
            ].map((field, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={labelStyle}>{field.label} :</div>
                <input type={field.type} name={field.name} value={(all as any)[field.name]}
                  onChange={handleInputChange} style={inputStyle} />
              </div>
            ))}

            {/* Drug Allergy Section */}
            {SHOW_DRUG_ALLERGY && (<>
            <div style={{
              fontFamily: 'Kanit_B', fontSize: '13px', color: '#ef4444', marginTop: '16px', marginBottom: '10px',
              paddingLeft: '12px', borderLeft: '3px solid #ef4444'
            }}>ประวัติแพ้สินค้า</div>

            {/* Drug Allergy Table */}
            <div style={{ marginLeft: '100px', maxHeight: '100px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ชื่อทางการ</th>
                    <th style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>อาการ</th>
                    <th style={{ padding: '8px', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map((s: any) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '11px', color: '#334155' }}>{s.drugallergy}</td>
                      <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '11px', color: '#334155' }}>{s.remark}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => DeleteDrug(s.id)} style={{
                          fontFamily: 'Kanit', fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                          border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer'
                        }}>ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', marginLeft: '100px' }}>
              <Popover open={open1} onOpenChange={setOpen1}>
                <PopoverTrigger asChild>
                  <button name="list" id="list" onClick={IndicatorPosts}
                    style={{ ...inputStyle, textAlign: 'left', color: userInput ? '#333' : '#94a3b8', background: 'white', cursor: 'pointer' }}>
                    {userInput === "" ? "กรุณาเลือกข้อมูลแพ้สินค้า" : userInput}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="right" align="start">
                  <Command>
                    <CommandInput placeholder="ค้นหา ข้อบ่งใช้" />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {items1.map((status) => (
                          <CommandItem key={status.value} value={status.value}
                            onSelect={async (value) => {
                              setSelectedStatus(items1.find((priority) => priority.value === value) || null)
                              updateInput(value)
                              setOpen(false)
                            }}>
                            {status.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginLeft: '100px', marginBottom: '10px' }}>
              <input placeholder="พิมพ์ลักษณะอาการแพ้" value={drugg} onChange={(e) => setdrugg(e.target.value)}
                style={{ ...inputStyle, width: '150px' }} />
              <button type="button" onClick={() => PostDrug()} style={{
                fontFamily: 'Kanit', fontSize: '12px', padding: '6px 14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><Plus size={14} /> เพิ่ม</button>
            </div>
            </>)}

            {/* Additional Info */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '16px', marginBottom: '10px' }}>
              <div style={{ ...labelStyle, paddingTop: '8px' }}>ข้อมูลเพิ่มเติม :</div>
              <textarea name="moreInfo" value={all.moreInfo} onChange={handleInputChange}
                placeholder="กรอกข้อมูลเพิ่มเติม"
                style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
            </div>

            {/* Footer Buttons */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button onClick={UpdateCus} type="button" style={{
                fontFamily: 'Kanit', fontSize: '13px', padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}><Pencil size={16} /> แก้ไข</button>
              <button onClick={DeletePost} type="button" style={{
                fontFamily: 'Kanit', fontSize: '13px', padding: '10px 24px', borderRadius: '8px',
                border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}><Trash2 size={16} /> ลบ</button>
            </div>
          </div>
        </div>

        {/* Right Column - Sales/Treatment History */}
        <div className="col-lg-7" style={{ borderLeft: '1px solid #e2e8f0' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white', padding: '14px 20px', fontFamily: 'Kanit_B', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <ClipboardList size={18} /> ประวัติการขาย / การรักษา
          </div>

          <div style={{ maxHeight: '550px', overflowY: 'auto', padding: '12px' }}>
            {sh.map((s: any) => (
              <div key={s.id} style={{
                marginBottom: '16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                overflow: 'hidden', backgroundColor: 'white'
              }}>
                <div style={{
                  backgroundColor: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#6366f1' }}>
                    {new Date(s.createDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>

                <div style={{ padding: '12px 16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    {s.sales.map((a: any) => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px',
                        backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '4px', border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                            backgroundColor: '#e0e7ff', color: '#4338ca', fontFamily: 'Kanit'
                          }}>{a.code_product}</span>
                          <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#334155' }}>{a.name_product}</span>
                        </div>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                          backgroundColor: '#E5EEF8', color: '#1E5088', fontFamily: 'Kanit_B'
                        }}>{a.qty}</span>
                      </div>
                    ))}
                  </div>

                  {s.historys.map((b: any) => (
                    <div key={b.id} style={{
                      padding: '12px', backgroundColor: '#F3F8FC', borderRadius: '8px',
                      borderLeft: '4px solid #6366f1'
                    }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: '11px', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>อาการ:</span> <span style={{ color: '#334155' }}>{b.followup}</span>
                      </div>
                      <div style={{ fontFamily: 'Kanit', fontSize: '11px', marginBottom: '6px', whiteSpace: 'pre-line' }}>
                        <span style={{ color: '#64748b' }}>การรักษา:</span><br />
                        {((b.solution ?? "").split("*").map((item: any) => item.trim()).join("\n"))}
                      </div>
                      <div style={{ fontFamily: 'Kanit', fontSize: '11px', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>ติดตามผล:</span> {new Date(b.duedate).toLocaleDateString('th-TH')}
                      </div>
                      <div style={{ fontFamily: 'Kanit', fontSize: '11px' }}>
                        <span style={{ color: '#64748b' }}>สถานะ:</span>
                        <span style={{
                          marginLeft: '8px', padding: '2px 10px', borderRadius: '10px', fontSize: '10px',
                          backgroundColor: b.statusH === 'Complete' ? '#D3F0E2' : '#fef3c7',
                          color: b.statusH === 'Complete' ? '#147F56' : '#92400e'
                        }}>{b.statusH}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {sh.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <ClipboardList size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <div style={{ fontFamily: 'Kanit' }}>ไม่มีประวัติการขาย / การรักษา</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default Updatecustomer
