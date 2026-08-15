
'use client'

import React, { useEffect, useState, useContext, createContext } from 'react'
import axios from 'axios'
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
import { ChevronDown, Package, Save, Trash2, Tag, Image as ImageIcon, DollarSign, X, AlertCircle, Plus } from "lucide-react"
import Modal1 from 'react-bootstrap/Modal';
import Button1 from 'react-bootstrap/Button';
import { useMessageStore } from "../../useMessageStore";
import { Toaster, toast } from "sonner"

const apis = "datalist"
const Fixnameapis = "fixname"
const Groupapis = "group"
const Typeapis = "type"
const Areaapis = "area"
const Getagoryapis = "getagory"
const Unitapis = "unit"
const apidatalist = "datalist"

const apiindicatorlist = "label/indicatorlist"
const apitimeL = "label/timeL"
const apiuseL = "label/useL"
const apitimeuseL = "label/timeuseL"
const apikeepL = "label/keepL"
const apiRemarkL = "label/remarkL"
const apilabeldata = "label/labeldata"

const IDSaveLabelContext = createContext<any>(undefined)

// Mobile Styles
const mobileStyles = `
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
  }
  
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-SemiBold.ttf') format('truetype');
    font-weight: 600;
    font-style: normal;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .mobile-product-create {
    font-family: 'Kanit', sans-serif;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    min-height: 100vh;
    padding-bottom: 20px;
  }

  .section-card {
    background: white;
    border-radius: 16px;
    margin: 12px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;
  }

  .section-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .section-icon.primary {
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    color: white;
  }

  .section-icon.blue {
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    color: white;
  }

  .section-icon.purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
  }

  .section-icon.orange {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 6px;
    font-weight: 500;
  }

  .form-input {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    background: #fafafa;
    transition: all 0.2s ease;
    outline: none;
  }

  .form-input:focus {
    border-color: #3E86C7;
    background: white;
    box-shadow: 0 0 0 4px rgba(62, 134, 199, 0.1);
  }

  .form-input:disabled {
    background: #f3f4f6;
    color: #6b7280;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .select-btn {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    background: white;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .select-btn:active {
    background: #f9fafb;
  }

  .select-btn .placeholder {
    color: #9ca3af;
  }

  .select-btn .value {
    color: #3E86C7;
    font-weight: 500;
  }

  .image-upload-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .image-preview {
    width: 140px;
    height: 140px;
    border-radius: 16px;
    border: 3px dashed #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    overflow: hidden;
  }

  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-preview-placeholder {
    text-align: center;
    color: #9ca3af;
  }

  .upload-btn {
    padding: 10px 20px;
    border-radius: 10px;
    border: 2px solid #e5e7eb;
    background: white;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }

  .price-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .price-item {
    background: white;
    border-radius: 12px;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
  }

  .price-label {
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 6px;
    font-weight: 500;
  }

  .price-input-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #f9fafb;
    border-radius: 8px;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
  }

  .price-input-wrapper input {
    flex: 1;
    width: 100%;
    min-width: 0;
    padding: 0;
    border: none;
    font-size: 15px;
    font-family: 'Kanit', sans-serif;
    background: transparent;
    text-align: right;
    outline: none;
    color: #1f2937;
  }

  .price-currency {
    font-size: 12px;
    color: #9ca3af;
    flex-shrink: 0;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .btn {
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Kanit', sans-serif;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn-primary {
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(62, 134, 199, 0.3);
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 2px solid #e5e7eb;
  }

  .label-section {
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    border: 2px solid #e9d5ff;
  }

  .label-dropdown {
    margin-bottom: 10px;
  }

  .label-btn {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid #e9d5ff;
    border-radius: 10px;
    font-size: 13px;
    font-family: 'Kanit', sans-serif;
    background: white;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }

  .label-btn .placeholder {
    color: #a855f7;
  }

  .label-btn .value {
    color: #7c3aed;
    font-weight: 500;
  }

  .label-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 12px;
    margin-top: 12px;
  }

  .label-status.warning {
    background: #fef3c7;
    color: #d97706;
    border: 1px solid #fcd34d;
  }

  .helper-btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
  }
`;

// SetLabel Component
const SetLabel = () => {
  const initialValues1 = {
    id: "", company: "", code: "", indicatorlistS: "", timeS: "",
    useS: "", timeuseS: "", keepS: "", remarkS: "",
  };

  const { maxcodes, saves, codeS } = useSaveContext();
  const [alllabel, setlabel] = useState(initialValues1)

  useEffect(() => {
    const useMyHook = async () => {
      try { LabelData() } catch (e) { console.error(e); }
    }
    useMyHook()
  }, [Number(codeS)])

  useEffect(() => {
    const useMyHook = async () => {
      try { saves === "1" ? await PostLabel() : "" } catch (e) { console.error(e); }
    }
    useMyHook()
  }, [Number(saves || "")])

  const LabelData = async () => {
    try {
      const res = await axios.get(`/api/${apilabeldata}?company=1000&code=${String(localStorage.getItem("code") || "")}`)
      res.data[0] !== undefined ? setlabel(res.data[0]) : setlabel(initialValues1)
    } catch (error) { console.error(error) }
  }

  const PostLabel = async () => {
    let company = (localStorage.getItem("company_") || "")
    const code = String(maxcodes || "")
    try {
      await axios.post(`/api/${apilabeldata}`, {
        company, code,
        indicatorlistS: alllabel.indicatorlistS.toString(),
        timeS: String(alllabel.timeS),
        useS: String(alllabel.useS),
        timeuseS: String(alllabel.timeuseS),
        keepS: String(alllabel.keepS),
        remarkS: String(alllabel.remarkS)
      })
    } catch (error) { console.error(error) }
  }

  // Dropdown states
  const [open, setOpen] = useState(false)
  const [items, setIndicator] = useState<{ value: string, label: string }[]>([]);
  const [open1, setOpen1] = useState(false)
  const [items1, settimeL] = useState<{ value: string, label: string }[]>([]);
  const [open2, setOpen2] = useState(false)
  const [items2, setuseL] = useState<{ value: string, label: string }[]>([]);
  const [open3, setOpen3] = useState(false)
  const [items3, settimeuseL] = useState<{ value: string, label: string }[]>([]);
  const [open4, setOpen4] = useState(false)
  const [items4, setkeepL] = useState<{ value: string, label: string }[]>([]);
  const [open5, setOpen5] = useState(false)
  const [items5, setRemarkL] = useState<{ value: string, label: string }[]>([]);

  const IndicatorPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiindicatorlist}?company=${companyS}`)
      setIndicator(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  const timePosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apitimeL}?company=${companyS}`)
      settimeL(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  const usePosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiuseL}?company=${companyS}`)
      setuseL(res.data.map((item: { id: string; fullname: string }) => ({ value: item.id, label: item.fullname })))
    } catch (error) { console.error(error) }
  }

  const TimeusePosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apitimeuseL}?company=${companyS}`)
      settimeuseL(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  const KeepPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apikeepL}?company=${companyS}`)
      setkeepL(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  const RemarkPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiRemarkL}?company=${companyS}`)
      setRemarkL(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  return (
    <div className="section-card label-section">
      <div className="section-header">
        <div className="section-icon purple"><Tag size={18} /></div>
        <span className="section-title">ข้อมูลฉลากสินค้า</span>
      </div>

      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        กรุณาเลือกข้อมูลฉลากสินค้า
      </div>

      {/* Indicator Dropdown */}
      <div className="label-dropdown">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button onClick={IndicatorPosts} className="label-btn">
              <span className={alllabel.indicatorlistS ? "value" : "placeholder"}>
                {alllabel.indicatorlistS || "เลือก ข้อบ่งใช้"}
              </span>
              <ChevronDown size={16} color="#a855f7" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="bottom" align="start">
            <Command>
              <CommandInput placeholder="ค้นหา ข้อบ่งใช้" />
              <CommandList>
                <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                <CommandGroup>
                  {items.map((status) => (
                    <CommandItem key={status.value} value={status.value}
                      onSelect={() => { setlabel({ ...alllabel, indicatorlistS: status.label }); setOpen(false) }}>
                      {status.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Use + TimeUse Row */}
      <div className="form-row">
        <div className="label-dropdown">
          <Popover open={open2} onOpenChange={setOpen2}>
            <PopoverTrigger asChild>
              <button onClick={usePosts} className="label-btn">
                <span className={alllabel.useS ? "value" : "placeholder"}>
                  {alllabel.useS || "วิธีใช้สินค้า"}
                </span>
                <ChevronDown size={16} color="#a855f7" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom">
              <Command>
                <CommandInput placeholder="ค้นหา วิธีใช้สินค้า" />
                <CommandList>
                  <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                  <CommandGroup>
                    {items2.map((s) => (
                      <CommandItem key={s.value} value={s.value}
                        onSelect={() => { setlabel({ ...alllabel, useS: s.label }); setOpen2(false) }}>
                        {s.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="label-dropdown">
          <Popover open={open3} onOpenChange={setOpen3}>
            <PopoverTrigger asChild>
              <button onClick={TimeusePosts} className="label-btn">
                <span className={alllabel.timeuseS ? "value" : "placeholder"}>
                  {alllabel.timeuseS || "ช่วงเวลา"}
                </span>
                <ChevronDown size={16} color="#a855f7" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom">
              <Command>
                <CommandInput placeholder="ค้นหา ช่วงเวลา" />
                <CommandList>
                  <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                  <CommandGroup>
                    {items3.map((s) => (
                      <CommandItem key={s.value} value={s.value}
                        onSelect={() => { setlabel({ ...alllabel, timeuseS: s.label }); setOpen3(false) }}>
                        {s.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Time + Keep Row */}
      <div className="form-row" style={{ marginTop: 10 }}>
        <div className="label-dropdown">
          <Popover open={open1} onOpenChange={setOpen1}>
            <PopoverTrigger asChild>
              <button onClick={timePosts} className="label-btn">
                <span className={alllabel.timeS ? "value" : "placeholder"}>
                  {alllabel.timeS || "เวลา"}
                </span>
                <ChevronDown size={16} color="#a855f7" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom">
              <Command>
                <CommandInput placeholder="ค้นหา เวลา" />
                <CommandList>
                  <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                  <CommandGroup>
                    {items1.map((s) => (
                      <CommandItem key={s.value} value={s.value}
                        onSelect={() => { setlabel({ ...alllabel, timeS: s.label }); setOpen1(false) }}>
                        {s.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="label-dropdown">
          <Popover open={open4} onOpenChange={setOpen4}>
            <PopoverTrigger asChild>
              <button onClick={KeepPosts} className="label-btn">
                <span className={alllabel.keepS ? "value" : "placeholder"}>
                  {alllabel.keepS || "พื้นที่เก็บ"}
                </span>
                <ChevronDown size={16} color="#a855f7" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom">
              <Command>
                <CommandInput placeholder="ค้นหา พื้นที่เก็บ" />
                <CommandList>
                  <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                  <CommandGroup>
                    {items4.map((s) => (
                      <CommandItem key={s.value} value={s.value}
                        onSelect={() => { setlabel({ ...alllabel, keepS: s.label }); setOpen4(false) }}>
                        {s.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Remark Dropdown */}
      <div className="label-dropdown" style={{ marginTop: 10 }}>
        <Popover open={open5} onOpenChange={setOpen5}>
          <PopoverTrigger asChild>
            <button onClick={RemarkPosts} className="label-btn">
              <span className={alllabel.remarkS ? "value" : "placeholder"}>
                {alllabel.remarkS || "เลือก หมายเหตุ"}
              </span>
              <ChevronDown size={16} color="#a855f7" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="bottom">
            <Command>
              <CommandInput placeholder="ค้นหา หมายเหตุ" />
              <CommandList>
                <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                <CommandGroup>
                  {items5.map((s) => (
                    <CommandItem key={s.value} value={s.value}
                      onSelect={() => { setlabel({ ...alllabel, remarkS: s.label }); setOpen5(false) }}>
                      {s.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="label-status warning">
        <AlertCircle size={14} />
        <span>ฉลากสินค้าจะบันทึกพร้อมกับสินค้า</span>
      </div>
    </div>
  )
}

// Main Component
function CreateProductPagedataP() {
  const maxSup = useMessageStore((state) => state.maxSup)
  let maxPro = Number(maxSup) == -Infinity ? 10000 : Number(maxSup) + 1

  const initialValues = {
    code: String(maxPro), company: "", ProductName: "", fixname: "", group: "",
    type: "", subtype: "", Category: "", DrugRegistor: "", Area: "",
    CostActual: "", Unit: "", price: "", wholesaleprice: "", online: "",
    PriceA: "", PriceB: "", PriceC: "", PriceD: "", PriceE: "", PriceF: "", PriceG: "", PriceH: "",
    Barcode: "", Max: "", Min: "", ROPs: "",
    AlarmExp: "", Show: "", Child: "", CI: "", Remark: ""
  };

  const [all, setall1] = useState(initialValues)
  const clearData = () => { setall1(initialValues) }

  // Dropdown States
  const [open, setOpen] = useState(false)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);
  const [open1, setOpen1] = useState(false)
  const [items1, setFixname1] = useState<{ value: string, label: string }[]>([]);
  const [open2, setOpen2] = useState(false)
  const [items2, setFixname2] = useState<{ value: string, label: string }[]>([]);
  const [open3, setOpen3] = useState(false)
  const [items3, setFixname3] = useState<{ value: string, label: string }[]>([]);
  const [open4, setOpen4] = useState(false)
  const [items4, setFixname4] = useState<{ value: string, label: string }[]>([]);
  const [open5, setOpen5] = useState(false)
  const [items5, setFixname5] = useState<{ value: string, label: string }[]>([]);
  const [open6, setOpen6] = useState(false)
  const [items6, setFixname6] = useState<{ value: string, label: string }[]>([]);

  const FixnamePosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Fixnameapis}?company=${company}`)
      setFixname(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  const GroupPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Groupapis}?company=${company}`)
      setFixname1(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  const TypePosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Typeapis}?company=${company}`)
      setFixname2(res.data.map((item: { id: string; shortlist: string }) => ({ value: item.id, label: item.shortlist })))
    } catch (error) { console.error(error) }
  }

  const TypeCPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Typeapis}?company=${company}`)
      setFixname3(res.data.map((item: { id: string; shortlist: string }) => ({ value: item.id, label: item.shortlist })))
    } catch (error) { console.error(error) }
  }

  const AreaPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Areaapis}?company=${company}`)
      setFixname4(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  const GetagoryPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Getagoryapis}?company=${company}`)
      setFixname5(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  const UnitPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Unitapis}?company=${company}`)
      setFixname6(res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list })))
    } catch (error) { console.error(error) }
  }

  // Image Upload
  const [preview, setPreview] = useState<string | null>(null);
  let companyS = (localStorage.getItem("company_") || "")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => { setPreview(reader.result as string); };
    reader.readAsDataURL(file);
  }

  const UploadImg = async () => {
    const res = await fetch("/api/setting/store/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: preview, company: companyS, hard: String(maxPro) }),
    });
    await res.json();
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTimeout(() => { setall1({ ...all, [name]: value }); }, 40);
  };

  const AlertComplete = () => {
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะสินค้า</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึกสินค้าเรียบร้อย</div>,
      duration: 3000,
    });
  };

  const setcpage = useMessageStore((state) => state.setcpage);

  const CreateData = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    const company = (localStorage.getItem("company_") || "")
    const code = String(maxPro)
    const ProductName = localStorage.getItem("pd") || ""
    const pic = String("/uploads/" + String(maxPro) + "_" + companyS + ".jpg")
    try {
      await axios.post(`/api/${apis}`, {
        company, code, ProductName, fixname: all.fixname, group: all.group,
        type: all.type, subtype: all.subtype, Category: all.Category,
        DrugRegistor: all.DrugRegistor, Area: all.Area, CostActual: Number(all.CostActual),
        Unit: all.Unit, price: Number(all.price), wholesaleprice: Number(all.wholesaleprice),
        online: Number(all.online), PriceA: Number(all.PriceA), PriceB: Number(all.PriceB),
        PriceC: Number(all.PriceC), PriceD: Number(all.PriceD), PriceE: Number(all.PriceE),
        PriceF: Number(all.PriceF), PriceG: Number(all.PriceG), PriceH: Number(all.PriceH),
        Barcode: localStorage.getItem("bar") || "", Max: Number(all.Max), Min: Number(all.Min),
        ROP: Number(all.ROPs), AlarmExp: all.AlarmExp, Show: "false",
        Child: all.Child, CI: all.CI, Remark: all.Remark, pic
      })
      UploadImg()
      setcpage(String("0"))
      await AlertComplete()
    } catch (error) { console.error(error) }
  }

  const [codelabel, setidss] = useState({ saves: "", maxcodes: "", codeS: "" })
  useEffect(() => {
    setidss({ ...codelabel, maxcodes: String(maxPro), saves: "0", codeS: "" })
    localStorage.setItem("bar", "")
    localStorage.setItem("code", "")
    localStorage.setItem("pd", "")
  }, [])

  // Barcode Component
  const BarcodeS = () => {
    const [barcode, setbarcode] = useState(all.Barcode)
    useEffect(() => { setbarcode(localStorage.getItem("bar") || "") }, [barcode])
    const BarcodeInput = async (e: any) => {
      setbarcode(e.target.value)
      localStorage.setItem("bar", e.target.value)
    }
    return (
      <div className="form-group">
        <label className="form-label">Barcode</label>
        <input type="text" name="Barcode" value={barcode ?? ""} onChange={BarcodeInput}
          className="form-input" placeholder="รหัส Barcode" />
      </div>
    )
  }

  // Product Name Component
  const ProductNameS = () => {
    const [Pd, setPd] = useState(all.ProductName)
    useEffect(() => { setPd(localStorage.getItem("pd") || "") }, [Pd])
    const ProductNameInput = async (e: any) => {
      setPd(e.target.value)
      localStorage.setItem("pd", e.target.value)
    }
    return (
      <div className="form-group">
        <label className="form-label">ชื่อสินค้า</label>
        <input type="text" name="ProductName" value={Pd ?? ""} onChange={ProductNameInput}
          className="form-input" placeholder="ชื่อสินค้า" />
      </div>
    )
  }

  // Search Product Helper
  const [dataProduct, setdataProduct] = useState([])
  const fetchDataDrug = async () => {
    try {
      const res = await axios.get(`/api/${apidatalist}?company=1000`)
      setdataProduct(res.data)
    } catch (error) { console.error(error) }
  }
  useEffect(() => { fetchDataDrug() }, [])

  function Search_Product() {
    const [show1, setShow1] = useState(false);
    const handleClose = () => setShow1(false);
    const handleShow = () => setShow1(true);
    const [data, setData] = useState(dataProduct);
    const [search, setsearch] = useState("")

    const handleChange = (value: any) => {
      setsearch(value);
      const lower = value.toLowerCase().trim();
      if (lower === "") { setData(dataProduct); }
      else {
        const filteredData = dataProduct.filter((user: any) => {
          const name = user.ProductName?.toLowerCase() || "";
          const fix = user.fixname?.toLowerCase() || "";
          const bar = user.Barcode?.toLowerCase() || "";
          return name.includes(lower) || fix.includes(lower) || bar.includes(lower);
        });
        setData(filteredData);
      }
    };

    return (
      <>
        <button type="button" onClick={handleShow} className="helper-btn">
          <Plus size={16} /> ตัวช่วย ลงข้อมูลสินค้า
        </button>

        <Modal1 show={show1} onHide={handleClose}>
          <Modal1.Header closeButton>
            <Modal1.Title style={{ fontFamily: "Kanit", fontSize: 15 }}>
              ตัวช่วย ลงข้อมูลสินค้า
            </Modal1.Title>
          </Modal1.Header>
          <Modal1.Body>
            <div style={{ fontFamily: "Kanit", fontSize: 12, color: "red", marginBottom: 10 }}>
              รบกวนกรอกข้อมูล หมวดสินค้า, ชื่อทางการ, หน่วยสินค้า, พื้นที่เก็บ ก่อนค่ะ
            </div>
            <input value={search} onChange={(e) => handleChange(e.target.value)}
              className="form-control form-control-sm mb-2" placeholder="ค้นหาชื่อ, Barcode สินค้า"
              style={{ fontFamily: "Kanit", fontSize: 12 }} />
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <table className="table table-sm table-hover">
                <thead style={{ position: "sticky", top: 0 }}>
                  <tr>
                    <th style={{ fontFamily: "Kanit", fontSize: 11 }}>ชื่อสินค้า</th>
                    <th style={{ fontFamily: "Kanit", fontSize: 11 }}>Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((post: any) => (
                    <tr key={post.id} onClick={() => {
                      setall1({
                        ...all, ProductName: post.ProductName, fixname: post.fixname,
                        group: post.group, type: post.type, subtype: post.subtype,
                        Category: post.Category, Unit: post.Unit, Barcode: post.Barcode
                      });
                      setShow1(false);
                      setidss({ ...codelabel, codeS: post.code });
                      localStorage.setItem("bar", post.Barcode);
                      localStorage.setItem("pd", post.ProductName);
                      localStorage.setItem("code", post.code);
                    }}>
                      <td style={{ fontFamily: "Kanit", fontSize: 12 }}>
                        {post.ProductName ?? ""} : {post.Unit ?? ""}
                      </td>
                      <td style={{ fontFamily: "Kanit", fontSize: 11 }}>{post.Barcode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal1.Body>
        </Modal1>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      <div className="mobile-product-create">
        {/* Basic Info Section */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-icon primary"><Package size={18} /></div>
            <span className="section-title">ข้อมูลพื้นฐาน</span>
          </div>

          <Search_Product />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">รหัสสินค้า</label>
              <input type="text" name="code" value={all.code ?? ""} disabled className="form-input" />
            </div>
            <BarcodeS />
          </div>

          <ProductNameS />

          {/* Fixname Dropdown */}
          <div className="form-group">
            <label className="form-label">ชื่อสามัญ</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button onClick={FixnamePosts} className="select-btn">
                  <span className={all.fixname ? "value" : "placeholder"}>
                    {all.fixname || "เลือกชื่อสามัญ"}
                  </span>
                  <ChevronDown size={18} color="#9ca3af" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="bottom">
                <Command>
                  <CommandInput placeholder="ค้นหา ชื่อสามัญ" />
                  <CommandList>
                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                    <CommandGroup>
                      {items.map((s) => (
                        <CommandItem key={s.value} value={s.value}
                          onSelect={() => { setall1({ ...all, fixname: s.label }); setOpen(false) }}>
                          {s.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Group Dropdown */}
          <div className="form-group">
            <label className="form-label">กลุ่มสินค้า</label>
            <Popover open={open1} onOpenChange={setOpen1}>
              <PopoverTrigger asChild>
                <button onClick={GroupPosts} className="select-btn">
                  <span className={all.group ? "value" : "placeholder"}>
                    {all.group || "เลือกกลุ่มสินค้า"}
                  </span>
                  <ChevronDown size={18} color="#9ca3af" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="bottom">
                <Command>
                  <CommandInput placeholder="ค้นหา กลุ่มสินค้า" />
                  <CommandList>
                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                    <CommandGroup>
                      {items1.map((s) => (
                        <CommandItem key={s.value} value={s.value}
                          onSelect={() => { setall1({ ...all, group: s.label }); setOpen1(false) }}>
                          {s.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Type + DrugRegistor Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">รายงาน ขย</label>
              <Popover open={open2} onOpenChange={setOpen2}>
                <PopoverTrigger asChild>
                  <button onClick={TypePosts} className="select-btn">
                    <span className={all.type ? "value" : "placeholder"}>
                      {all.type || "เลือก"}
                    </span>
                    <ChevronDown size={18} color="#9ca3af" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="bottom">
                  <Command>
                    <CommandInput placeholder="ค้นหา" />
                    <CommandList>
                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                      <CommandGroup>
                        {items2.map((s) => (
                          <CommandItem key={s.value} value={s.value}
                            onSelect={() => { setall1({ ...all, type: s.label }); setOpen2(false) }}>
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="form-group">
              <label className="form-label">ทะเบียนสินค้า</label>
              <input type="text" name="DrugRegistor" value={all.DrugRegistor ?? ""}
                onChange={handleInputChange} className="form-input" placeholder="ทะเบียนสินค้า" />
            </div>
          </div>

          {/* Subtype + Area Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ข.ย. (10-13)</label>
              <Popover open={open3} onOpenChange={setOpen3}>
                <PopoverTrigger asChild>
                  <button onClick={TypeCPosts} className="select-btn">
                    <span className={all.subtype ? "value" : "placeholder"}>
                      {all.subtype || "เลือก"}
                    </span>
                    <ChevronDown size={18} color="#9ca3af" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="bottom">
                  <Command>
                    <CommandInput placeholder="ค้นหา" />
                    <CommandList>
                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                      <CommandGroup>
                        {items3.map((s) => (
                          <CommandItem key={s.value} value={s.value}
                            onSelect={() => { setall1({ ...all, subtype: s.label }); setOpen3(false) }}>
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="form-group">
              <label className="form-label">พื้นที่เก็บ</label>
              <Popover open={open4} onOpenChange={setOpen4}>
                <PopoverTrigger asChild>
                  <button onClick={AreaPosts} className="select-btn">
                    <span className={all.Area ? "value" : "placeholder"}>
                      {all.Area || "เลือก"}
                    </span>
                    <ChevronDown size={18} color="#9ca3af" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="bottom">
                  <Command>
                    <CommandInput placeholder="ค้นหา พื้นที่เก็บ" />
                    <CommandList>
                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                      <CommandGroup>
                        {items4.map((s) => (
                          <CommandItem key={s.value} value={s.value}
                            onSelect={() => { setall1({ ...all, Area: s.label }); setOpen4(false) }}>
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Category + Unit Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">หมวด</label>
              <Popover open={open5} onOpenChange={setOpen5}>
                <PopoverTrigger asChild>
                  <button onClick={GetagoryPosts} className="select-btn">
                    <span className={all.Category ? "value" : "placeholder"}>
                      {all.Category || "เลือก"}
                    </span>
                    <ChevronDown size={18} color="#9ca3af" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="bottom">
                  <Command>
                    <CommandInput placeholder="ค้นหา หมวด" />
                    <CommandList>
                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                      <CommandGroup>
                        {items5.map((s) => (
                          <CommandItem key={s.value} value={s.value}
                            onSelect={() => { setall1({ ...all, Category: s.label }); setOpen5(false) }}>
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="form-group">
              <label className="form-label">หน่วยขาย</label>
              <Popover open={open6} onOpenChange={setOpen6}>
                <PopoverTrigger asChild>
                  <button onClick={UnitPosts} className="select-btn">
                    <span className={all.Unit ? "value" : "placeholder"}>
                      {all.Unit || "เลือก"}
                    </span>
                    <ChevronDown size={18} color="#9ca3af" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="bottom">
                  <Command>
                    <CommandInput placeholder="ค้นหา หน่วยขาย" />
                    <CommandList>
                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                      <CommandGroup>
                        {items6.map((s) => (
                          <CommandItem key={s.value} value={s.value}
                            onSelect={() => { setall1({ ...all, Unit: s.label }); setOpen6(false) }}>
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-icon blue"><ImageIcon size={18} /></div>
            <span className="section-title">รูปสินค้า</span>
          </div>
          <div className="image-upload-container">
            <div className="image-preview">
              {preview ? (
                <img src={preview} alt="preview" />
              ) : (
                <div className="image-preview-placeholder">
                  <ImageIcon size={32} color="#d1d5db" />
                  <div style={{ fontSize: 12, marginTop: 8 }}>ไม่มีรูป</div>
                </div>
              )}
            </div>
            <label className="upload-btn">
              <ImageIcon size={16} />
              เลือกรูป
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Price Section */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-icon orange"><DollarSign size={18} /></div>
            <span className="section-title">ราคา & สต๊อก</span>
          </div>

          <div className="price-grid">
            <div className="price-item">
              <div className="price-label">💰 ต้นทุน</div>
              <div className="price-input-wrapper">
                <input type="text" name="CostActual" value={all.CostActual ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">🔄 จุดสั่งซื้อ</div>
              <div className="price-input-wrapper">
                <input type="text" name="ROPs" value={all.ROPs ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">ชิ้น</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">🏪 หน้าร้าน</div>
              <div className="price-input-wrapper">
                <input type="text" name="price" value={all.price ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">📦 Max</div>
              <div className="price-input-wrapper">
                <input type="text" name="Max" value={all.Max ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">ชิ้น</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">📦 ราคาส่ง</div>
              <div className="price-input-wrapper">
                <input type="text" name="wholesaleprice" value={all.wholesaleprice ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">📦 Min</div>
              <div className="price-input-wrapper">
                <input type="text" name="Min" value={all.Min ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">ชิ้น</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">ราคาสมาชิก</div>
              <div className="price-input-wrapper">
                <input type="text" name="online" value={all.online ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">🅰️ ราคา A</div>
              <div className="price-input-wrapper">
                <input type="text" name="PriceA" value={all.PriceA ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">🅱️ ราคา B</div>
              <div className="price-input-wrapper">
                <input type="text" name="PriceB" value={all.PriceB ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">ราคา C</div>
              <div className="price-input-wrapper">
                <input type="text" name="PriceC" value={all.PriceC ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">ราคา D</div>
              <div className="price-input-wrapper">
                <input type="text" name="PriceD" value={all.PriceD ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">ราคา E</div>
              <div className="price-input-wrapper">
                <input type="text" name="PriceE" value={all.PriceE ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">ราคา F</div>
              <div className="price-input-wrapper">
                <input type="text" name="PriceF" value={all.PriceF ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">ราคา G</div>
              <div className="price-input-wrapper">
                <input type="text" name="PriceG" value={all.PriceG ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">ราคา H</div>
              <div className="price-input-wrapper">
                <input type="text" name="PriceH" value={all.PriceH ?? ""}
                  onChange={handleInputChange} placeholder="0" />
                <span className="price-currency">฿</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button onClick={() => { CreateData(); setidss({ ...codelabel, saves: "1" }) }} className="btn btn-primary">
              <Save size={18} /> บันทึก
            </button>
            <button onClick={() => clearData()} className="btn btn-secondary">
              <X size={18} /> ล้างข้อมูล
            </button>
          </div>
        </div>

        {/* Label Section */}
        <IDSaveLabelContext.Provider value={codelabel}>
          <SetLabel />
        </IDSaveLabelContext.Provider>
      </div>
    </>
  )
}

export default CreateProductPagedataP

export function useSaveContext() {
  return useContext(IDSaveLabelContext)
}
