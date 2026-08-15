
'use client'

import React, { useEffect, useState, useContext } from 'react'
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
import { ChevronDown, Package, Save, Trash2, Edit3, Tag, Image as ImageIcon, DollarSign, Settings, X, Check, AlertCircle } from "lucide-react"

import LoadingOverlay from '../../../../componant/LoadingOverlay';
import { Toaster, toast } from "sonner"
import { useMessageStore } from "../../useMessageStore";

const apis = "datalist"
const Fixnameapis = "fixname"
const Groupapis = "group"
const Typeapis = "type"
const Areaapis = "area"
const Getagoryapis = "getagory"
const Unitapis = "unit"

const apiindicatorlist = "label/indicatorlist"
const apitimes = "label/times"
const apitimeL = "label/timeL"
const apiuseL = "label/useL"
const apitimeuseL = "label/timeuseL"
const apikeepL = "label/keepL"
const apiRemarkL = "label/remarkL"
const apilabeldata = "label/labeldata"

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

  .mobile-product-update {
    font-family: 'Kanit', sans-serif;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    min-height: 100vh;
    padding-bottom: 20px;
  }

  /* Section Cards */
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

  /* Form Groups */
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

  .form-input-small {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 13px;
    font-family: 'Kanit', sans-serif;
    background: #fafafa;
    transition: all 0.2s ease;
    outline: none;
    text-align: right;
  }

  .form-input-small:focus {
    border-color: #3E86C7;
    background: white;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .input-with-unit {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-unit {
    font-size: 12px;
    color: #9ca3af;
    white-space: nowrap;
  }

  /* Select Button */
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

  /* Image Upload */
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

  .upload-btn:active {
    background: #f9fafb;
  }

  /* Price Grid - Mobile 2 Column */
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .price-input-wrapper input::placeholder {
    color: #d1d5db;
  }

  .price-currency {
    font-size: 12px;
    color: #9ca3af;
    flex-shrink: 0;
  }

  /* Action Buttons */
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

  .btn-warning {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  .btn-danger {
    background: #fee2e2;
    color: #dc2626;
    border: 2px solid #fecaca;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 2px solid #e5e7eb;
  }

  /* Label Section */
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

  .label-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .label-actions .btn {
    flex: 1;
    padding: 12px;
    font-size: 13px;
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

  .label-status.success {
    background: #E5EEF8;
    color: #2A6AAA;
    border: 1px solid #A6C8E7;
  }

  /* Popover Styles */
  .popover-trigger-full {
    width: 100%;
  }

  /* Loading Animation */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .loading-pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }
`;

function ProductPagedataP() {
  const initialValues = {
    id: "", code: "", company: "", ProductName: "", fixname: "", group: "",
    type: "", subtype: "", Category: "", DrugRegistor: "", Area: "",
    CostActual: "", Unit: "", price: "", wholesaleprice: "", online: "",
    PriceA: "", PriceB: "", PriceC: "", PriceD: "", PriceE: "", PriceF: "", PriceG: "", PriceH: "",
    Barcode: "", Max: "", Min: "", ROPs: "",
    AlarmExp: "", Show: "", Child: "", CI: "", Remark: "", pic: ""
  };

  const ids = useMessageStore((state) => state.ids)
  const itemcodes = useMessageStore((state) => state.itemcodes)

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, [Number(ids)]);

  const [all, setall1] = useState(initialValues)

  // SetLabel Component
  const SetLabel = () => {
    const initialValues1 = {
      id: "", company: "", code: "", indicatorlistS: "", timeS: "",
      useS: "", timeuseS: "", keepS: "", remarkS: "",
    };

    const [alllabel, setlabel] = useState(initialValues1)

    useEffect(() => {
      const useMyHook = async () => {
        try { LabelData() } catch (e) { console.error(e); }
      }
      useMyHook()
    }, [Number(ids || "")])

    const LabelData = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${apilabeldata}?company=${companyS}&code=${String(itemcodes ?? "")}`)
        res.data[0] !== undefined ? setlabel(res.data[0]) : setlabel(initialValues1)
      } catch (error) { console.error(error) }
    }

    const AlertLabelComplete = () => {
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะฉลากสินค้า</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึกฉลากสินค้าเรียบร้อย</div>,
        duration: 3000,
      });
    };

    const PostLabel = async () => {
      let company = (localStorage.getItem("company_") || "")
      const code = all.code
      const indicatorlistS = alllabel.indicatorlistS
      const timeS = alllabel.timeS
      const useS = alllabel.useS
      const timeuseS = alllabel.timeuseS
      const keepS = alllabel.keepS
      const remarkS = alllabel.remarkS
      try {
        await axios.post(`/api/${apilabeldata}`, { company, code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS })
        await AlertLabelComplete()
        await LabelData()
      } catch (error) { console.error(error) }
    }

    const AlertLabelCompleteEdit = () => {
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะฉลากสินค้า</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> แก้ไข ฉลากสินค้าเรียบร้อย</div>,
        duration: 3000,
      });
    };

    const EditLabel = async () => {
      let company = (localStorage.getItem("company_") || "")
      const code = alllabel.code
      const indicatorlistS = alllabel.indicatorlistS
      const timeS = alllabel.timeS
      const useS = alllabel.useS
      const timeuseS = alllabel.timeuseS
      const keepS = alllabel.keepS
      const remarkS = alllabel.remarkS
      try {
        await axios.put(`/api/${apilabeldata}/${Number(alllabel.id)}`, { company, code: all.code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS })
        await AlertLabelCompleteEdit()
        await LabelData()
      } catch (error) { console.error(error) }
    }

    const DeleteLabel = async () => {
      try {
        await axios.delete(`/api/${apilabeldata}/${Number(alllabel.id)}`)
        await LabelData()
      } catch (error) { console.error('Failed to delete the post', error) }
    }

    // API States for dropdowns
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
          {all.ProductName}
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

        {/* Label Status */}
        {alllabel.code === "" ? (
          <div className="label-status warning">
            <AlertCircle size={14} />
            <span>ไม่พบข้อมูล ฉลากสินค้า</span>
          </div>
        ) : (
          <div className="label-status success">
            <Check size={14} />
            <span>มีข้อมูลฉลากสินค้าแล้ว</span>
          </div>
        )}

        {/* Label Actions */}
        <div className="label-actions">
          {alllabel.code === "" ? (
            <button onClick={PostLabel} className="btn btn-primary">
              <Save size={16} /> บันทึกฉลากสินค้า
            </button>
          ) : (
            <button onClick={EditLabel} className="btn btn-warning">
              <Edit3 size={16} /> แก้ไขฉลากสินค้า
            </button>
          )}
          <button onClick={DeleteLabel} className="btn btn-secondary">
            <Trash2 size={16} /> ลบ
          </button>
        </div>
      </div>
    )
  }

  // Main Component Logic
  useEffect(() => {
    const useMyHook = async () => {
      try { fetchPost() } catch (e) { console.error(e); }
    }
    useMyHook()
  }, [Number(ids ?? "")])

  useEffect(() => {
    const useMyHook = async () => {
      try {
        localStorage.setItem("pd", "")
        localStorage.setItem("bar", "")
      } catch (e) { console.error(e); }
    }
    useMyHook()
  }, [])

  const fetchPost = async () => {
    try {
      const res = await axios.get(`/api/${apis}/${Number(ids || "")}`)
      res.data !== undefined ? setall1(res.data) : ""
      localStorage.setItem("pd", res.data.ProductName)
      localStorage.setItem("bar", res.data.Barcode)
    } catch (error) { console.error(error) }
  }

  const setcpage = useMessageStore((state) => state.setcpage);

  const DeletePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.delete(`/api/${apis}/${Number(ids || "")}`)
      setcpage("0")
    } catch (error) { console.error('Failed to delete the post', error) }
  }

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

  useEffect(() => {
    setPreview(null)
  }, [Number(ids || "")])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const UploadImg = async () => {
    const res = await fetch("/api/setting/store/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: preview, company: companyS, hard: String(all.code) }),
    });
    const data = await res.json();
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTimeout(() => { setall1({ ...all, [name]: value }); }, 40);
  };

  const AlertUpdateComplete = () => {
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะสินค้า</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> แก้ไข ข้อมูลสินค้าเรียบร้อย</div>,
      duration: 3000,
    });
  };

  const UpdateFixname = async (e: React.FormEvent) => {
    e.preventDefault();
    const pic = String("/uploads/" + all.code + "_" + companyS + ".jpg")
    try {
      await axios.put(`/api/${apis}/${Number(ids || "")}`, {
        ProductName: all.ProductName, fixname: all.fixname, group: all.group, type: all.type,
        subtype: all.subtype, Category: all.Category, DrugRegistor: all.DrugRegistor,
        Area: all.Area, CostActual: Number(all.CostActual), Unit: all.Unit,
        price: Number(all.price), wholesaleprice: Number(all.wholesaleprice),
        online: Number(all.online), PriceA: Number(all.PriceA), PriceB: Number(all.PriceB),
        PriceC: Number(all.PriceC), PriceD: Number(all.PriceD), PriceE: Number(all.PriceE),
        PriceF: Number(all.PriceF), PriceG: Number(all.PriceG), PriceH: Number(all.PriceH),
        Barcode: all.Barcode, Max: Number(all.Max), Min: Number(all.Min),
        ROP: Number(all.ROPs), AlarmExp: all.AlarmExp, Show: all.Show,
        Child: all.Child, CI: all.CI, Remark: all.Remark, pic
      })
      await AlertUpdateComplete()
      UploadImg()
    } catch (error) { console.error(error) }
  }

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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      <LoadingOverlay show={loading} />
      <div className="mobile-product-update">
        {/* Basic Info Section */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-icon primary"><Package size={18} /></div>
            <span className="section-title">ข้อมูลพื้นฐาน</span>
          </div>

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
              {all.pic == null || preview !== null ? (
                preview ? (
                  <img src={preview} alt="preview" />
                ) : (
                  <div className="image-preview-placeholder">
                    <ImageIcon size={32} color="#d1d5db" />
                    <div style={{ fontSize: 12, marginTop: 8 }}>ไม่มีรูป</div>
                  </div>
                )
              ) : (
                <img src={String(all.pic)} alt="product" />
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
            <button onClick={UpdateFixname} className="btn btn-warning">
              <Edit3 size={18} /> แก้ไข
            </button>
            <button onClick={DeletePost} className="btn btn-danger">
              <Trash2 size={18} /> ลบสินค้า
            </button>
          </div>
        </div>

        {/* Label Section */}
        <SetLabel />
      </div>
    </>
  )
}

export default ProductPagedataP
