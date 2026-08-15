'use client'

import React, { useEffect, useState } from "react";
import axios from 'axios'
import { Check, ChevronDownIcon, Save, RotateCcw, UserPlus, Plus, CreditCard, ScanLine, Loader2, RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Toaster, toast } from "sonner"
import { useMessageStore } from "./useMessageStore";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { pingSmartcardAgent, readSmartcardThroughProxy } from "@/utils/smartcard"
import { usePermission } from "@/utils/usePermission"

const apis = "customer"
const getfixname = "fixname"

// ซ่อนส่วน "ข้อมูลสุขภาพ" (โรคประจำตัว + ประวัติแพ้ยา) ในฟอร์มสร้างลูกค้า (เปลี่ยนเป็น true เพื่อแสดงกลับ)
const SHOW_HEALTH_SECTION = false

const frameworks = [
    { value: "ชาย", label: "ชาย" },
    { value: "หญิง", label: "หญิง" },
    { value: "ไม่ระบุ", label: "ไม่ระบุ" },
]

function Createcustomer() {

    const initialValues = {
        company: "", code: "", names: "", sex: "", idcode: "", age: "", birthday: "",
        address: "", branch: "", levelPrice: "หน้าร้าน", tel: "", pointStart: "", point: "",
        totalPoint: "", customer: "ปลีก", drugallergy: "", congenitalDisease: "", numbertax: "", statuss: "", moreInfo: "",
    };

    const maxS = useMessageStore((state) => state.maxS)
    const maxSNum = Number(maxS)
    let maxSP = Number.isFinite(maxSNum) ? maxSNum + 1 : 1000
    const { hasPermission } = usePermission()
    const canEditCustomerPoint = hasPermission("I2")

    const [all, setall1] = useState(initialValues)

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

    // ======== Smart Card Reader (Thai ID) ========
    const [scReading, setScReading] = useState(false)
    const [scError, setScError] = useState("")
    const [scStatus, setScStatus] = useState<"idle" | "ok" | "fail">("idle")
    const [scPhoto, setScPhoto] = useState<string>("")

    const getScConfig = () => {
        if (typeof window === "undefined") return { url: "http://127.0.0.1:8182", path: "/read", timeout: 15000 }
        return {
            url: localStorage.getItem("smartcard_url") || "http://127.0.0.1:8182",
            path: localStorage.getItem("smartcard_path") || "/read",
            timeout: Number(localStorage.getItem("smartcard_timeout") || 15000),
        }
    }

    const parseThaiDateCC = (raw?: string): string => {
        if (!raw) return ""
        const only = raw.replace(/[^0-9]/g, "")
        if (only.length === 8) {
            const y = parseInt(only.slice(0, 4), 10)
            const m = only.slice(4, 6)
            const d = only.slice(6, 8)
            const year = y > 2400 ? y - 543 : y
            return `${d}/${m}/${year}`
        }
        return raw
    }

    const testScConnection = async () => {
        setScStatus("idle")
        const cfg = getScConfig()
        try {
            // ใช้ proxy ฝั่งเซิร์ฟเวอร์เพื่อเลี่ยง CORS / PNA ของบราวเซอร์
            const found = await pingSmartcardAgent(cfg.url, 3000)
            if (found) setScStatus("ok")
            else setScStatus("fail")
        } catch { setScStatus("fail") }
    }

    const readSmartCard = async () => {
        setScReading(true); setScError(""); setScPhoto("")
        const cfg = getScConfig()
        try {
            // อ่านผ่าน proxy ของ Next เพื่อเลี่ยง "Failed to fetch" จาก CORS / PNA
            const json: any = await readSmartcardThroughProxy(cfg.url, cfg.path, cfg.timeout)
            const fullName = json.fullNameTH
                || [json.titleTH, json.firstNameTH, json.lastNameTH].filter(Boolean).join(" ").trim()
            const birth = parseThaiDateCC(json.birthDate)
            const gender = json.gender === "1" || /ชาย|male/i.test(json.gender || "") ? "ชาย"
                : json.gender === "2" || /หญิง|female/i.test(json.gender || "") ? "หญิง" : ""
            // Compute age from birth
            let ageStr = ""
            if (birth) {
                const [d, m, y] = birth.split("/").map((p: string) => parseInt(p, 10))
                if (d && m && y) {
                    const dob = new Date(y, m - 1, d)
                    if (!isNaN(dob.getTime())) {
                        const today = new Date()
                        let age = today.getFullYear() - dob.getFullYear()
                        const mm = today.getMonth() - dob.getMonth()
                        if (mm < 0 || (mm === 0 && today.getDate() < dob.getDate())) age--
                        if (age >= 0) ageStr = String(age)
                    }
                }
            }
            setall1((prev: any) => ({
                ...prev,
                names: fullName || prev.names,
                idcode: json.cid || prev.idcode,
                birthday: birth || prev.birthday,
                age: ageStr || prev.age,
                sex: gender || prev.sex,
                address: json.address || prev.address,
            }))
            if (birth) setDate(new Date(birth.split("/").reverse().join("-")))
            if (json.photo) setScPhoto(json.photo)
            toast.success(
                <div style={{ fontFamily: "Kanit", fontSize: 15 }}>อ่านบัตรประชาชน</div>,
                { description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>อ่านข้อมูลจากบัตรสำเร็จ</div>, duration: 2500 }
            )
        } catch (e: any) {
            const msg = e?.name === "AbortError" ? "หมดเวลาเชื่อมต่อเครื่องอ่านบัตร"
                : e?.message || "ไม่สามารถเชื่อมต่อเครื่องอ่านบัตรได้"
            setScError(msg)
        } finally { setScReading(false) }
    }

    const fetchPosts = async () => {
        try {
            const res = await axios.get(`/api/${apis}`)
            setPosts(res.data)
        } catch (error) { console.error(error) }
    }

    const CreateCus = async () => {
        try { await setall1(initialValues); } catch (error) { console.error(error) }
    }

    interface Task { id: number, value: string, remark: string }

    const [userInput, setUserInput] = useState('');
    const [list, setList] = useState<Task[]>([]);
    const [editIndex, setEditIndex] = useState(null);
    const [drugg, setdrugg] = useState("")

    const AlertComplete = () => {
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะสินค้า</div>, {
            description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
            duration: 3000,
        });
    };

    const setcpage = useMessageStore((state) => state.setcpage);

    const CleckSubmit = async (e: any) => {
        e.preventDefault();
        let companyS = (localStorage.getItem("company_") || "")
        const company = companyS
        const code = String(maxSP)
        const names = all.names
        const sex = all.sex
        const idcode = all.idcode
        const age = Number(all.age)
        const birthday = all.birthday
        const address = all.address
        const branch = all.branch
        const levelPrice = all.levelPrice || "หน้าร้าน"
        const tel = all.tel
        const numbertax = all.numbertax
        const pointStart = Number(all.pointStart)
        const point = Number(all.point)
        const totalPoint = Number(all.totalPoint)
        const customer = all.customer
        const congenitalDisease = all.congenitalDisease
        const statuss = all.statuss
        const moreInfo = all.moreInfo
        const drugallergys = list.map(posts => ({
            company: companyS,
            drugallergy: posts.value,
            remark: posts.remark,
        }))
        try {
            await axios.post(`/api/${apis}`,
                { company, code, names, sex, idcode, age, birthday, address, branch, levelPrice, tel, pointStart, point, totalPoint, customer, drugallergys, congenitalDisease, statuss, numbertax, moreInfo }
            )
            setcpage(String("0"))
            AlertComplete()
            await fetchPosts()
        } catch (error) { console.error(error) }
    }

    const [open1, setOpen1] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
    const [items1, setIndicator1] = useState<{ value: string, label: string }[]>([]);

    const updateInput = (value: any) => { setUserInput(value); };

    const IndicatorPosts = async () => {
        let companyS = (localStorage.getItem("company_") || "")
        try {
            const res = await axios.get(`/api/${getfixname}?company=${companyS}`)
            const items = await res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
            setIndicator1([{ value: "ไม่มี", label: "ไม่มี" }, ...items])
        } catch (error) { console.error(error) }
    }

    const handleAction = () => {
        if (userInput.trim() === '') return;
        if (editIndex !== null) {
            const updatedList = list.map((item, index) =>
                index === editIndex ? { ...item, value: userInput, remark: drugg } : item
            );
            setList(updatedList);
            setEditIndex(null);
        } else {
            const newItem = { id: Math.random(), value: userInput, remark: drugg };
            setList([...list, newItem]);
        }
        setUserInput('');
    };

    const deleteItem = (id: any) => {
        const updatedList = list.filter((item) => item.id !== id);
        setList(updatedList);
    };

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
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                color: 'white', padding: '16px 20px', fontFamily: 'Kanit_B', fontSize: '15px',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                <UserPlus size={20} /> เพิ่ม ข้อมูลลูกค้า
            </div>

            {/* Smart Card Reader panel */}
            <div style={{ padding: '16px 24px 0 24px' }}>
                <style>{`
                    .__cc_spin { animation: __ccSpin 0.9s linear infinite; }
                    @keyframes __ccSpin { to { transform: rotate(360deg); } }
                `}</style>
                <div style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12,
                    padding: 14, display: "flex", gap: 14, alignItems: "center",
                }}>
                    <div style={{
                        width: 58, height: 58, borderRadius: 12,
                        background: "linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 14px rgba(42, 106, 170,0.25)", color: "white", flexShrink: 0,
                    }}>
                        {scReading ? <Loader2 size={26} className="__cc_spin" /> : <CreditCard size={26} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#0f172a" }}>
                            สมัครสมาชิกด้วยบัตรประชาชน
                        </div>
                        <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            เสียบบัตรประชาชนในเครื่องอ่าน แล้วกดปุ่ม &quot;อ่านบัตร&quot; ระบบจะเติมข้อมูลให้อัตโนมัติ
                        </div>
                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <button type="button" onClick={readSmartCard} disabled={scReading}
                                style={{
                                    fontFamily: "Kanit", fontSize: 12,
                                    padding: "7px 16px", borderRadius: 8, border: "none",
                                    background: "linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)", color: "white",
                                    cursor: scReading ? "not-allowed" : "pointer", opacity: scReading ? 0.7 : 1,
                                    display: "flex", alignItems: "center", gap: 6,
                                    boxShadow: "0 2px 8px rgba(42, 106, 170,0.3)"
                                }}>
                                {scReading ? <Loader2 size={13} className="__cc_spin" /> : <ScanLine size={13} />}
                                {scReading ? "กำลังอ่านบัตร..." : "อ่านบัตร"}
                            </button>
                            <button type="button" onClick={testScConnection}
                                style={{
                                    fontFamily: "Kanit", fontSize: 11,
                                    padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                                    background: "white", color: "#334155", cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 6,
                                }}>
                                <RefreshCw size={11} /> ทดสอบเชื่อมต่อ
                            </button>
                            {scStatus !== "idle" && (
                                <span style={{
                                    fontFamily: "Kanit", fontSize: 11,
                                    padding: "3px 10px", borderRadius: 999,
                                    background: scStatus === "ok" ? "#D3F0E2" : "#fee2e2",
                                    color: scStatus === "ok" ? "#0F6845" : "#b91c1c",
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                    {scStatus === "ok" ? <Wifi size={11} /> : <WifiOff size={11} />}
                                    {scStatus === "ok" ? "เชื่อมต่อสำเร็จ" : "เชื่อมต่อไม่สำเร็จ"}
                                </span>
                            )}
                            <span style={{ fontFamily: "Kanit", fontSize: 10, color: "#94a3b8" }}>
                                ตั้งค่าเครื่องอ่านได้ที่ เมนูตั้งค่า {'>'} ตั้งค่าเครื่องอ่านบัตรประชาชน
                            </span>
                        </div>
                    </div>
                    {scPhoto && (
                        <div style={{
                            width: 70, height: 86, borderRadius: 10, overflow: "hidden",
                            border: "2px solid #e2e8f0", background: "#f1f5f9",
                        }}>
                            <img src={`data:image/jpeg;base64,${scPhoto}`} alt="photo"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    )}
                </div>

                {scError && (
                    <div style={{
                        marginTop: 10, padding: "10px 14px", borderRadius: 10,
                        background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
                        fontFamily: "Kanit", fontSize: 12,
                        display: "flex", gap: 8, alignItems: "flex-start",
                    }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <div style={{ fontFamily: "Kanit_B" }}>ไม่สามารถอ่านบัตรได้</div>
                            <div>{scError}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: '24px' }}>
                <div className='row g-4'>
                    {/* Left Column */}
                    <div className='col-md-6'>
                        {[
                            { label: 'รหัสลูกค้า', name: 'code', value: maxSP, disabled: true },
                            { label: 'ชื่อ-สกุล', name: 'names' }
                        ].map((field, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={labelStyle}>{field.label} :</div>
                                <input name={field.name} value={field.value || (all as any)[field.name]}
                                    onChange={handleInputChange} disabled={field.disabled}
                                    style={{ ...inputStyle, backgroundColor: field.disabled ? '#f8fafc' : 'white' }} />
                            </div>
                        ))}

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={labelStyle}>วันเกิด :</div>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" id="date" name="birthday"
                                        style={{ fontFamily: 'Kanit', fontSize: 13, width: 200, justifyContent: 'space-between', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        {date ? formatDate(date) : "เลือกวันที่"}
                                        <ChevronDownIcon />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar mode="single" selected={date} captionLayout="dropdown"
                                        onSelect={(date) => { setDate(date); setall1({ ...all, birthday: formatDate(date) }); setOpen(false) }} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={labelStyle}>เพศ :</div>
                            <SexInput />
                            <div style={{ ...labelStyle, width: '60px' }}>อายุ :</div>
                            <input name="age" value={computedAge} readOnly
                                style={{ ...inputStyle, width: '80px', backgroundColor: '#f8fafc' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={labelStyle}>การซื้อ :</div>
                            <select name="customer" value={all.customer}
                                onChange={(e) => setall1({ ...all, customer: e.target.value })}
                                style={{ ...inputStyle, width: '120px', cursor: 'pointer' }}>
                                <option value="">เลือก</option>
                                <option value="ปลีก">ปลีก</option>
                                <option value="ส่ง">ส่ง</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
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
                            <input name="pointStart" value={all.pointStart} onChange={handleInputChange}
                                style={{ ...inputStyle, width: '80px' }} />
                            <div style={{ ...labelStyle, width: '70px' }}>แต้มสะสม :</div>
                            <input name="point" value={all.point} onChange={handleInputChange}
                                style={{ ...inputStyle, width: '80px' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={labelStyle}>แต้มทั้งหมด :</div>
                            <input name="totalPoint" value={all.totalPoint} onChange={handleInputChange}
                                disabled={!canEditCustomerPoint}
                                style={{ ...inputStyle, width: '80px', backgroundColor: canEditCustomerPoint ? 'white' : '#f1f5f9', cursor: canEditCustomerPoint ? 'text' : 'not-allowed' }} />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className='col-md-6'>
                        {[
                            { label: 'เบอร์โทรศัพท์', name: 'tel' },
                            { label: 'เลขบัตร', name: 'idcode' },
                            { label: 'เลขภาษี', name: 'numbertax' }
                        ].map((field, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={labelStyle}>{field.label} :</div>
                                <input name={field.name} value={(all as any)[field.name]}
                                    onChange={handleInputChange} style={inputStyle} />
                            </div>
                        ))}

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={labelStyle}>ที่อยู่ :</div>
                            <textarea name="address" value={all.address} onChange={handleInputChange}
                                style={{ ...inputStyle, height: '50px', resize: 'none' }} />
                        </div>

                        {/* Health Section */}
                        {SHOW_HEALTH_SECTION && (<>
                        <div style={{
                            fontFamily: 'Kanit_B', fontSize: '13px', color: '#3E86C7', marginTop: '16px', marginBottom: '12px',
                            paddingLeft: '12px', borderLeft: '3px solid #3E86C7'
                        }}>ข้อมูลสุขภาพ</div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={labelStyle}>โรคประจำตัว :</div>
                            <input name="congenitalDisease" value={all.congenitalDisease}
                                onChange={handleInputChange} style={inputStyle} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={labelStyle}>ประวัติแพ้สินค้า :</div>
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
                            <input placeholder="พิมพ์ลักษณะอาการแพ้" value={drugg}
                                onChange={(e) => setdrugg(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
                            <button type="button" onClick={handleAction} style={{
                                fontFamily: 'Kanit', fontSize: '12px', padding: '6px 14px', borderRadius: '8px',
                                border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}><Plus size={14} /> {editIndex !== null ? 'Update' : 'เพิ่ม'}</button>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', marginLeft: '100px', padding: '10px', border: '1px solid #e2e8f0' }}>
                            {list.length > 0 ? (
                                list.map((item) => (
                                    <div key={item.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        fontFamily: 'Kanit', fontSize: '11px', padding: '6px 0', borderBottom: '1px solid #e2e8f0'
                                    }}>
                                        <span style={{ color: '#334155' }}>{item.value} : {item.remark}</span>
                                        <button type="button" onClick={() => deleteItem(item.id)} style={{
                                            fontFamily: 'Kanit', fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                                            border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer'
                                        }}>ลบ</button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#94a3b8' }}>ไม่มีข้อมูลแพ้สินค้า</div>
                            )}
                        </div>
                        </>)}

                        {/* Additional Info */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '16px' }}>
                            <div style={{ ...labelStyle, paddingTop: '8px' }}>ข้อมูลเพิ่มเติม :</div>
                            <textarea name="moreInfo" value={all.moreInfo} onChange={handleInputChange}
                                placeholder="กรอกข้อมูลเพิ่มเติม"
                                style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Buttons */}
            <div style={{
                display: 'flex', justifyContent: 'center', gap: '12px', padding: '20px',
                borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc'
            }}>
                <button onClick={CleckSubmit} type="button" style={{
                    fontFamily: 'Kanit', fontSize: '14px', padding: '10px 28px', borderRadius: '8px', border: 'none',
                    background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(62, 134, 199, 0.3)'
                }}><Save size={16} /> บันทึก</button>
                <button onClick={CreateCus} type="button" style={{
                    fontFamily: 'Kanit', fontSize: '14px', padding: '10px 28px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                }}><RotateCcw size={16} /> ล้าง</button>
            </div>
        </div>
    )
}
export default Createcustomer
