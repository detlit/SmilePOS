
'use client'

import React, { useCallback, useEffect, useState, useContext, useRef } from 'react'
import axios from 'axios'
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
import Image from "next/image";
import deletes from "../../../../icon/house.svg"
import { normalizeRequireLot, LOT_BADGE_ON, LOT_BADGE_OFF } from "@/lib/lotPolicy"



const widthsh = 70;
const widths1 = 90;
const widthsh1 = 100;
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

const formatCostDisplay = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-"
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return "-"
  return numberValue.toLocaleString("th-TH", { maximumFractionDigits: 2 })
}

// เมื่อสินค้ามีความเคลื่อนไหวสต็อก (รับ/ขาย/โอนออก/รับโอน/ปรับยอด) แล้ว
// จะล็อกไม่ให้แก้ Barcode, หน่วยขายย่อย และลบสินค้า เพื่อไม่ให้ประวัติเสียหาย
const STOCK_LOCK_MESSAGE = "มีการ รับ ขาย โอน และการปรับยอดไปแล้ว ไม่สามารถแก้ Barcode หน่วยย่อย และลบสินค้าได้"

// ราคาระดับ A–H — ชื่อฟิลด์ตรงกับคอลัมน์ใน Datalist และใช้ handleInputChange ตัวเดียวกับช่องอื่น
const TIER_PRICE_FIELDS: { key: string; label: string }[] = [
  { key: "PriceA", label: "A" },
  { key: "PriceB", label: "B" },
  { key: "PriceC", label: "C" },
  { key: "PriceD", label: "D" },
  { key: "PriceE", label: "E" },
  { key: "PriceF", label: "F" },
  { key: "PriceG", label: "G" },
  { key: "PriceH", label: "H" },
]

// ไอคอนแม่กุญแจเล็ก — ใช้บอกช่องที่ล็อกเพราะมีความเคลื่อนไหวสต็อกแล้ว
const LockGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

type ProductNameDraftInputProps = {
  value: string
  onDraftChange: (value: string) => void
  onCommit: (value: string) => void
}

const ProductNameDraftInput = React.memo(function ProductNameDraftInput({ value, onDraftChange, onCommit }: ProductNameDraftInputProps) {
  const [draft, setDraft] = useState(value || "")

  useEffect(() => {
    setDraft(value || "")
    onDraftChange(value || "")
  }, [value, onDraftChange])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setDraft(nextValue)
    onDraftChange(nextValue)
  }

  const handleBlur = () => {
    onCommit(draft)
  }

  return (
    <div className={`${styles.pfField} ${styles.pfSpan6}`}>
      <label className={styles.pfLabel} htmlFor="ProductName">ชื่อสินค้า</label>
      <input
        type="text"
        name="ProductName"
        id="ProductName"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${styles.pfInput} ${styles.pfInputName}`}
        placeholder="ชื่อสินค้าที่แสดงบนใบเสร็จและหน้าขาย"
      />
    </div>
  )
})

import LoadingOverlay from '../../../componant/LoadingOverlay';

import { Toaster, toast } from "sonner"
import { useMessageStore } from "../../useMessageStore";
import { usePermission } from '@/utils/usePermission'
import UnitConversionTable from './UnitConversionTable'
import ProductBarcodeTable from './ProductBarcodeTable'
import { fetchCostPriceMode, getCachedCostPriceMode, costPriceModeLabel, type CostPriceMode } from '@/lib/costPriceMode'

// ข้อมูลยา
function ProductPagedata() {

  const initialValues = {
    id: "",
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
    PriceC: "",
    PriceD: "",
    PriceE: "",
    PriceF: "",
    PriceG: "",
    PriceH: "",
    Barcode: "",
    Max: "",
    Min: "",
    ROPs: "",
    AlarmExp: "",
    Show: "",
    Child: "",
    CI: "",
    Remark: "",
    pic: "",
    maker: "",
    qty_unit: "",
    concentration: "",
    dosePerKg: "",
    doseFrequency: "",
    maxDosePerDay: "",
    memberDiscountEligible: true,
    requireLot: true
  };

  //let {ids} =useAppContext();  
  // let {itemcodes} =useAppContext(); 

  const ids = useMessageStore((state) => state.ids)
  const itemcodes = useMessageStore((state) => state.itemcodes)

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, [Number(ids)]);


  const [all, setall1] = useState(initialValues)
  const [latestCost, setLatestCost] = useState<number | null>(null)
  const [averageCost, setAverageCost] = useState<number | null>(null)
  const [costPriceMode, setCostPriceMode] = useState<CostPriceMode>(getCachedCostPriceMode())
  // ล็อกฟิลด์เมื่อสินค้ามีความเคลื่อนไหวสต็อกแล้ว (รับ/ขาย/โอน/ปรับยอด)
  const [stockLocked, setStockLocked] = useState(false)
  const productNameDraftRef = useRef("")
  // null = ยังไม่ได้กดเอง ให้ใช้ค่าเริ่มต้น (กางถ้าสินค้าตัวนี้มีราคาระดับอยู่แล้ว)
  const [tierPricesOpenOverride, setTierPricesOpenOverride] = useState<boolean | null>(null)
  const { hasPermission } = usePermission()
  const canViewCost = hasPermission("C4")

  const handleProductNameDraftChange = useCallback((value: string) => {
    productNameDraftRef.current = value
  }, [])

  const commitProductNameDraft = useCallback((value: string) => {
    productNameDraftRef.current = value
    setall1((previous) => previous.ProductName === value ? previous : { ...previous, ProductName: value })
  }, [])

  // Refs to persist usage label group UI state across product switches
  const usageSearchRef = useRef('')
  const usageOpenRef = useRef(false)

  // ตั้งค่่าฉลากยา
  const SetLabel = () => {


    //  const {ids} =useAppContext();  



    const initialValues = {
      id: "",
      code: "",
      company: "",
      ProductName: "",

    };

    const initialValues1 = {
      id: "",
      company: "",
      code: "",
      indicatorlistS: "",
      timeS: "",
      useS: "",
      timeuseS: "",
      keepS: "",
      remarkS: "",
    };




    const [alllabel, setlabel] = useState(initialValues1)

    // Import Labeldata from Excel
    const labelFileInputRef = useRef<HTMLInputElement>(null)
    const [isImportingLabeldata, setIsImportingLabeldata] = useState(false)

    const handleImportLabeldataFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const company = localStorage.getItem('company_') || ''
      if (!company) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
          duration: 3000,
        })
        return
      }

      setIsImportingLabeldata(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('company', company)

        const res = await axios.post('/api/labeldata/import-csv-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (res.data.success) {
          toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
            description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
            duration: 3000,
          })
          await LabelData()
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
          duration: 3000,
        })
      } finally {
        setIsImportingLabeldata(false)
        if (labelFileInputRef.current) labelFileInputRef.current.value = ''
      }
    }

    useEffect(() => {
      const useMyHook = async () => {
        try {

          LabelData()


        } catch (e) {
          console.error(e);
        }
      }
      useMyHook()
    }, [Number(ids || "")])




    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F11') {
          e.preventDefault()
          if (alllabel.code === "") {
            PostLabel()
          } else {
            EditLabel()
          }
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    })

    //Get Label Data
    const LabelData = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${apilabeldata}?company=${companyS}&code=${String(itemcodes ?? "")}`)
        res.data[0] !== undefined ? setlabel(res.data[0]) : setlabel(initialValues1)

      } catch (error) {
        console.error(error)
      }

    }

    const AlertLabelComplete = () => {

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะฉลากสินค้า</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึกฉลากสินค้าเรียบร้อย</div>,
        duration: 3000, // ปิดเองใน 3 วิ
      });
    };
    // Post LabelData
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
        await axios.post(`/api/${apilabeldata}`,
          {
            company, code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS
          }
        )
        await AlertLabelComplete()
        await LabelData()
      }
      catch (error) {
        console.error(error)
      }
    }

    const AlertLabelCompleteEdit = () => {

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะฉลากสินค้า</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> แก้ไข ฉลากสินค้าเรียบร้อย</div>,
        duration: 3000, // ปิดเองใน 3 วิ
      });
    };
    // Post LabelData
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
        await axios.put(`/api/${apilabeldata}/${Number(alllabel.id)}`,
          {
            company, code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS
          }
        )
        await AlertLabelCompleteEdit()
        await LabelData()
      }
      catch (error) {
        console.error(error)
      }
    }

    // Delete/id Label
    const DeleteLabel = async () => {
      try {
        await axios.delete(`/api/${apilabeldata}/${Number(alllabel.id)}`)
        await LabelData()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }

    const handleInputChange = (e: any) => {
      const { name, value } = e.target;
      setall1({
        ...all,
        [name]: value,
      });
    };

    const handleInputlabel = (e: any) => {
      const { name, value } = e.target;
      setlabel({
        ...alllabel,
        [name]: value,
      });
    };

    // GenericLabel - ดึงข้อมูลฉลากยาตาม Generic Name
    const [genericLabels, setGenericLabels] = useState<any[]>([])
    const [selectedGenericLabel, setSelectedGenericLabel] = useState('')

    const fetchGenericLabels = async (fixnameVal: string) => {
      if (!fixnameVal) { setGenericLabels([]); return }
      const companyS = localStorage.getItem('company_') || ''
      try {
        const res = await axios.get(`/api/generic-label?company=${companyS}&fixname=${encodeURIComponent(fixnameVal)}&sort=asc`)
        setGenericLabels(res.data || [])
      } catch (e) { console.error(e) }
    }

    const handleSelectGenericLabel = (label: any) => {
      setSelectedGenericLabel(label.shortname || '')
      setlabel({
        ...alllabel,
        indicatorlistS: label.indicatorlistS || '',
        timeS: label.timeS || '',
        useS: label.useS || '',
        timeuseS: label.timeuseS || '',
        keepS: label.keepS || '',
        remarkS: label.remarkS || '',
      })
    }

    const handleResetLabel = () => {
      setlabel({ ...alllabel, indicatorlistS: '', timeS: '', useS: '', timeuseS: '', keepS: '', remarkS: '' })
      setSelectedGenericLabel('')
    }

    // UsageLabelGroup - กลุ่มฉลากยาตามวิธีการใช้
    const [usageLabelGroups, setUsageLabelGroups] = useState<any[]>([])
    const [filteredUsageGroups, setFilteredUsageGroups] = useState<any[]>([])
    const [usageGroupSearch, setUsageGroupSearch] = useState(() => usageSearchRef.current)
    const [showUsageGroups, setShowUsageGroups] = useState(() => usageOpenRef.current)
    const [hoveredUsageGroupId, setHoveredUsageGroupId] = useState<number | null>(null)

    // Sync back to refs so state persists across product switches
    useEffect(() => { usageSearchRef.current = usageGroupSearch }, [usageGroupSearch])
    useEffect(() => { usageOpenRef.current = showUsageGroups }, [showUsageGroups])

    const fetchUsageLabelGroups = async () => {
      const companyS = localStorage.getItem('company_') || ''
      try {
        const res = await axios.get(`/api/usage-label-group?company=${companyS}&sort=asc`)
        setUsageLabelGroups(res.data || [])
        setFilteredUsageGroups(res.data || [])
      } catch (e) { console.error(e) }
    }

    useEffect(() => {
      fetchUsageLabelGroups()
    }, [])

    useEffect(() => {
      if (!usageGroupSearch.trim()) {
        setFilteredUsageGroups(usageLabelGroups)
      } else {
        const q = usageGroupSearch.toLowerCase()
        setFilteredUsageGroups(usageLabelGroups.filter((g: any) =>
          (g.groupName || '').toLowerCase().includes(q) ||
          (g.shortName || '').toLowerCase().includes(q)
        ))
      }
    }, [usageGroupSearch, usageLabelGroups])

    const handleSelectUsageGroup = (group: any) => {
      setlabel({
        ...alllabel,
        useS: group.useS || '',
        timeS: group.timeS || '',
        timeuseS: group.timeuseS || '',
        keepS: group.keepS || '',
        remarkS: group.remarkS || '',
      })
    }

    // เมื่อ fixname เปลี่ยน ให้ดึง GenericLabel
    useEffect(() => {
      if (all.fixname) {
        fetchGenericLabels(all.fixname)
        setSelectedGenericLabel('')
      } else {
        setGenericLabels([])
      }
    }, [all.fixname])

    //*** Get API Indicator */
    const [open, setOpen] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
    const [items, setIndicator] = useState<{ value: string, label: string }[]>([]);

    const IndicatorPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res_ind = await axios.get(`/api/${apiindicatorlist}?company=${companyS}`)
        const items = await res_ind.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
        setIndicator(items)

      } catch (error) {
        console.error(error)
      }
    }

    //*** Get API TimeL */
    const [open1, setOpen1] = useState(false)
    const [selectedStatus1, setSelectedStatus1] = useState<{ value: string, label: string } | null>(null)
    const [items1, settimeL] = useState<{ value: string, label: string }[]>([]);

    const timePosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res_timeL = await axios.get(`/api/${apitimeL}?company=${companyS}`)
        const items = await res_timeL.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
        settimeL(items)

      } catch (error) {
        console.error(error)
      }
    }

    //*** Get API UseL */
    const [open2, setOpen2] = useState(false)
    const [selectedStatus2, setSelectedStatus2] = useState<{ value: string, label: string } | null>(null)
    const [items2, setuseL] = useState<{ value: string, label: string }[]>([]);

    const usePosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res_useL = await axios.get(`/api/${apiuseL}?company=${companyS}`)
        const items = await res_useL.data.map((item: { id: string; fullname: string }) => ({ value: item.id, label: item.fullname }))
        setuseL(items)

      } catch (error) {
        console.error(error)
      }
    }


    //*** Get API TimeUseL */
    const [open3, setOpen3] = useState(false)
    const [selectedStatus3, setSelectedStatus3] = useState<{ value: string, label: string } | null>(null)
    const [items3, settimeuseL] = useState<{ value: string, label: string }[]>([]);

    const TimeusePosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res_timeuseL = await axios.get(`/api/${apitimeuseL}?company=${companyS}`)
        const items = await res_timeuseL.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
        settimeuseL(items)

      } catch (error) {
        console.error(error)
      }
    }


    //*** Get API KeepL */
    const [open4, setOpen4] = useState(false)
    const [selectedStatus4, setSelectedStatus4] = useState<{ value: string, label: string } | null>(null)
    const [items4, setkeepL] = useState<{ value: string, label: string }[]>([]);

    const KeepPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res_keepL = await axios.get(`/api/${apikeepL}?company=${companyS}`)
        const items = await res_keepL.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
        setkeepL(items)

      } catch (error) {
        console.error(error)
      }
    }

    //*** Get API RemarkL */
    const [open5, setOpen5] = useState(false)
    const [selectedStatus5, setSelectedStatus5] = useState<{ value: string, label: string } | null>(null)
    const [items5, setRemarkL] = useState<{ value: string, label: string }[]>([]);

    const RemarkPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res_RemarkL = await axios.get(`/api/${apiRemarkL}?company=${companyS}`)
        const items = await res_RemarkL.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
        setRemarkL(items)

      } catch (error) {
        console.error(error)
      }
    }

    const comboStyle = {
      wrapper: { position: 'relative' as const, width: '100%' },
      inputRow: {
        display: 'flex', alignItems: 'center', gap: '4px', width: '100%',
      },
      input: (hasValue: boolean, isOpen: boolean) => ({
        flex: 1, fontFamily: 'Kanit', fontSize: '12px', padding: '6px 10px',
        border: isOpen ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
        borderRadius: '8px', outline: 'none', height: '34px',
        background: isOpen ? '#fffde7' : 'white',
        color: hasValue ? '#1e293b' : '#94a3b8',
        boxShadow: isOpen ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
      }),
      triggerBtn: (isOpen: boolean) => ({
        width: '30px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: isOpen ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
        borderRadius: '8px', background: isOpen ? '#fffde7' : 'white', cursor: 'pointer',
        boxShadow: isOpen ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease', flexShrink: 0, outline: 'none',
      }),
      chevron: (isOpen: boolean) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isOpen ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
      ),
      popover: { borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' },
      itemStyle: { fontFamily: 'Kanit', fontSize: '12px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
      check: (isSelected: boolean) => ({
        width: '16px', height: '16px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: isSelected ? '#f59e0b' : '#f1f5f9', border: isSelected ? '1px solid #f59e0b' : '1px solid #e2e8f0',
      }),
      checkIcon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
      itemText: (isSelected: boolean) => ({ color: isSelected ? '#f59e0b' : '#334155', fontWeight: isSelected ? 600 : 400 }),
    }

    const ind_drop = (
      <div style={comboStyle.wrapper}>
        <div style={comboStyle.inputRow}>
          <input
            value={alllabel.indicatorlistS ?? ""}
            onChange={(e) => setlabel({ ...alllabel, indicatorlistS: e.target.value })}
            placeholder="พิมพ์หรือเลือก ข้อบ่งใช้..."
            style={comboStyle.input(!!alllabel.indicatorlistS, open)}
          />
          <Popover open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) IndicatorPosts() }}>
            <PopoverTrigger asChild>
              <button style={comboStyle.triggerBtn(open)}>{comboStyle.chevron(open)}</button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="end" style={{ width: '320px', ...comboStyle.popover }}>
              <Command>
                <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาข้อบ่งใช้..." style={{ fontFamily: 'Kanit' }} /></div>
                <CommandList style={{ maxHeight: '200px' }}>
                  <CommandEmpty><div style={{ padding: '12px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                  <CommandGroup>
                    {items.map((s) => (
                      <CommandItem key={s.value} value={s.label} onSelect={() => { setlabel({ ...alllabel, indicatorlistS: s.label }); setOpen(false) }} style={comboStyle.itemStyle}>
                        <span style={comboStyle.check(alllabel.indicatorlistS === s.label)}>{alllabel.indicatorlistS === s.label && comboStyle.checkIcon}</span>
                        <span style={comboStyle.itemText(alllabel.indicatorlistS === s.label)}>{s.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )

    const use_drop = (
      <div style={comboStyle.wrapper}>
        <div style={comboStyle.inputRow}>
          <input
            value={alllabel.useS ?? ""}
            onChange={(e) => setlabel({ ...alllabel, useS: e.target.value })}
            placeholder="วิธีใช้สินค้า..."
            style={comboStyle.input(!!alllabel.useS, open2)}
          />
          <Popover open={open2} onOpenChange={(isOpen) => { setOpen2(isOpen); if (isOpen) usePosts() }}>
            <PopoverTrigger asChild>
              <button style={comboStyle.triggerBtn(open2)}>{comboStyle.chevron(open2)}</button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="end" style={{ width: '280px', ...comboStyle.popover }}>
              <Command>
                <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาวิธีใช้สินค้า..." style={{ fontFamily: 'Kanit' }} /></div>
                <CommandList style={{ maxHeight: '200px' }}>
                  <CommandEmpty><div style={{ padding: '12px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                  <CommandGroup>
                    {items2.map((s) => (
                      <CommandItem key={s.value} value={s.label} onSelect={() => { setlabel({ ...alllabel, useS: s.label }); setOpen2(false) }} style={comboStyle.itemStyle}>
                        <span style={comboStyle.check(alllabel.useS === s.label)}>{alllabel.useS === s.label && comboStyle.checkIcon}</span>
                        <span style={comboStyle.itemText(alllabel.useS === s.label)}>{s.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )

    const timeuse_drop = (
      <div style={comboStyle.wrapper}>
        <div style={comboStyle.inputRow}>
          <input
            value={alllabel.timeuseS ?? ""}
            onChange={(e) => setlabel({ ...alllabel, timeuseS: e.target.value })}
            placeholder="ช่วงเวลา..."
            style={comboStyle.input(!!alllabel.timeuseS, open3)}
          />
          <Popover open={open3} onOpenChange={(isOpen) => { setOpen3(isOpen); if (isOpen) TimeusePosts() }}>
            <PopoverTrigger asChild>
              <button style={comboStyle.triggerBtn(open3)}>{comboStyle.chevron(open3)}</button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="end" style={{ width: '280px', ...comboStyle.popover }}>
              <Command>
                <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาช่วงเวลา..." style={{ fontFamily: 'Kanit' }} /></div>
                <CommandList style={{ maxHeight: '200px' }}>
                  <CommandEmpty><div style={{ padding: '12px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                  <CommandGroup>
                    {items3.map((s) => (
                      <CommandItem key={s.value} value={s.label} onSelect={() => { setlabel({ ...alllabel, timeuseS: s.label }); setOpen3(false) }} style={comboStyle.itemStyle}>
                        <span style={comboStyle.check(alllabel.timeuseS === s.label)}>{alllabel.timeuseS === s.label && comboStyle.checkIcon}</span>
                        <span style={comboStyle.itemText(alllabel.timeuseS === s.label)}>{s.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )

    const time_drop = (
      <div style={comboStyle.wrapper}>
        <div style={comboStyle.inputRow}>
          <input
            value={alllabel.timeS ?? ""}
            onChange={(e) => setlabel({ ...alllabel, timeS: e.target.value })}
            placeholder="เวลา..."
            style={comboStyle.input(!!alllabel.timeS, open1)}
          />
          <Popover open={open1} onOpenChange={(isOpen) => { setOpen1(isOpen); if (isOpen) timePosts() }}>
            <PopoverTrigger asChild>
              <button style={comboStyle.triggerBtn(open1)}>{comboStyle.chevron(open1)}</button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="end" style={{ width: '280px', ...comboStyle.popover }}>
              <Command>
                <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาเวลา..." style={{ fontFamily: 'Kanit' }} /></div>
                <CommandList style={{ maxHeight: '200px' }}>
                  <CommandEmpty><div style={{ padding: '12px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                  <CommandGroup>
                    {items1.map((s) => (
                      <CommandItem key={s.value} value={s.label} onSelect={() => { setlabel({ ...alllabel, timeS: s.label }); setOpen1(false) }} style={comboStyle.itemStyle}>
                        <span style={comboStyle.check(alllabel.timeS === s.label)}>{alllabel.timeS === s.label && comboStyle.checkIcon}</span>
                        <span style={comboStyle.itemText(alllabel.timeS === s.label)}>{s.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )

    const keep_drop = (
      <div style={comboStyle.wrapper}>
        <div style={comboStyle.inputRow}>
          <input
            value={alllabel.keepS ?? ""}
            onChange={(e) => setlabel({ ...alllabel, keepS: e.target.value })}
            placeholder="พื้นที่เก็บ..."
            style={comboStyle.input(!!alllabel.keepS, open4)}
          />
          <Popover open={open4} onOpenChange={(isOpen) => { setOpen4(isOpen); if (isOpen) KeepPosts() }}>
            <PopoverTrigger asChild>
              <button style={comboStyle.triggerBtn(open4)}>{comboStyle.chevron(open4)}</button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="end" style={{ width: '280px', ...comboStyle.popover }}>
              <Command>
                <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาพื้นที่เก็บ..." style={{ fontFamily: 'Kanit' }} /></div>
                <CommandList style={{ maxHeight: '200px' }}>
                  <CommandEmpty><div style={{ padding: '12px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                  <CommandGroup>
                    {items4.map((s) => (
                      <CommandItem key={s.value} value={s.label} onSelect={() => { setlabel({ ...alllabel, keepS: s.label }); setOpen4(false) }} style={comboStyle.itemStyle}>
                        <span style={comboStyle.check(alllabel.keepS === s.label)}>{alllabel.keepS === s.label && comboStyle.checkIcon}</span>
                        <span style={comboStyle.itemText(alllabel.keepS === s.label)}>{s.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )

    const remark_drop = (
      <div style={comboStyle.wrapper}>
        <div style={comboStyle.inputRow}>
          <input
            value={alllabel.remarkS ?? ""}
            onChange={(e) => setlabel({ ...alllabel, remarkS: e.target.value })}
            placeholder="หมายเหตุ..."
            style={comboStyle.input(!!alllabel.remarkS, open5)}
          />
          <Popover open={open5} onOpenChange={(isOpen) => { setOpen5(isOpen); if (isOpen) RemarkPosts() }}>
            <PopoverTrigger asChild>
              <button style={comboStyle.triggerBtn(open5)}>{comboStyle.chevron(open5)}</button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="end" style={{ width: '320px', ...comboStyle.popover }}>
              <Command>
                <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาหมายเหตุ..." style={{ fontFamily: 'Kanit' }} /></div>
                <CommandList style={{ maxHeight: '200px' }}>
                  <CommandEmpty><div style={{ padding: '12px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '12px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                  <CommandGroup>
                    {items5.map((s) => (
                      <CommandItem key={s.value} value={s.label} onSelect={() => { setlabel({ ...alllabel, remarkS: s.label }); setOpen5(false) }} style={comboStyle.itemStyle}>
                        <span style={comboStyle.check(alllabel.remarkS === s.label)}>{alllabel.remarkS === s.label && comboStyle.checkIcon}</span>
                        <span style={comboStyle.itemText(alllabel.remarkS === s.label)}>{s.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )


    return (
      <>
        <LoadingOverlay show={loading} />
        {/* Professional Drug Label Card */}
        <div className={styles.drugLabelCard}>
          <div className={styles.drugLabelCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>💊 ข้อมูลฉลากสินค้า</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="file"
                ref={labelFileInputRef}
                onChange={handleImportLabeldataFile}
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => labelFileInputRef.current?.click()}
                disabled={isImportingLabeldata}
                title="Import ฉลากสินค้าจาก Excel"
                style={{
                  background: '#3E86C7',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                  cursor: isImportingLabeldata ? 'not-allowed' : 'pointer',
                  opacity: isImportingLabeldata ? 0.7 : 1
                }}
              >
                {isImportingLabeldata ? '⏳' : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className={styles.drugLabelCardBody}>
            {/* Info Text */}
            <div className={styles.drugLabelInfo}>
              กรุณาเลือกข้อมูลฉลากสินค้า คุณสามารถแก้ไขและเปลี่ยนแปลงได้ที่เมนู "ตั้งค่าข้อมูลฉลากสินค้า"
            </div>

            {/* Customer Type */}
            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', marginBottom: 2 }}>ลูกค้าทั่วไป</div>

            {/* Product Name */}
            <div className={styles.drugLabelProductName}>{all.ProductName}</div>

            {/* Generic Label Shortname Selector + Reset */}
            {genericLabels.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <select
                  value={selectedGenericLabel}
                  onChange={(e) => {
                    const found = genericLabels.find((g: any) => g.shortname === e.target.value)
                    if (found) handleSelectGenericLabel(found)
                  }}
                  style={{
                    flex: 1, fontFamily: 'Kanit', fontSize: 11, padding: '5px 8px',
                    border: '1px solid #ddd6fe', borderRadius: 6, outline: 'none',
                    backgroundColor: '#faf5ff', color: '#6d28d9',
                  }}
                >
                  <option value="">เลือกชุดฉลากสินค้า ({all.fixname})...</option>
                  {genericLabels.map((g: any) => (
                    <option key={g.id} value={g.shortname}>{g.shortname || `ชุดที่ ${g.id}`}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleResetLabel}
                  title="ล้างข้อมูลฉลากสินค้า"
                  style={{
                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #fecaca', borderRadius: 6, backgroundColor: '#fef2f2',
                    color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
            )}
            {genericLabels.length === 0 && all.fixname && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={handleResetLabel}
                  title="ล้างข้อมูลฉลากสินค้า"
                  style={{
                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #fecaca', borderRadius: 6, backgroundColor: '#fef2f2',
                    color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Dropdowns in Grid */}
            <div style={{ display: 'grid', gap: 6 }}>
              {ind_drop}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {use_drop}
                {timeuse_drop}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {time_drop}
                {keep_drop}
              </div>
              {remark_drop}
            </div>

            {/* Action Buttons */}
            <div className={styles.drugLabelBtnGroup} style={{ marginTop: 12, flexDirection: 'row', gap: 8, display: 'flex', justifyContent: 'flex-end' }}>
              {alllabel.code === "" ?
                <button onClick={() => PostLabel()} type="button" className={styles.drugLabelSaveBtn}>บันทึกฉลากสินค้า (F11)</button> :
                <button onClick={() => EditLabel()} type="button" className={styles.drugLabelEditBtn}>แก้ไขฉลากสินค้า (F11)</button>
              }
              <button onClick={() => DeleteLabel()} type="button" className={styles.drugLabelDeleteBtn}>ลบฉลากสินค้า</button>
            </div>

            {/* Not Found Warning */}
            {alllabel.code === "" && (
              <div className={styles.drugLabelNotFound}>ไม่พบข้อมูลฉลากสินค้า</div>
            )}

            {/* UsageLabelGroup Section */}
            {usageLabelGroups.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                <div
                  onClick={() => setShowUsageGroups(!showUsageGroups)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', padding: '6px 0',
                  }}
                >
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#1E5088', display: 'flex', alignItems: 'center', gap: 4 }}>
                    🏷️ เลือกตัวช่วย สร้างวิธีการใช้สินค้า ({usageLabelGroups.length})
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b', transition: 'transform 0.2s', transform: showUsageGroups ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>
                {showUsageGroups && (
                  <div style={{ marginTop: 4 }}>
                    <input
                      value={usageGroupSearch}
                      onChange={(e) => setUsageGroupSearch(e.target.value)}
                      placeholder="🔍 ค้นหากลุ่ม..."
                      style={{
                        fontFamily: 'Kanit', fontSize: 11, width: '100%', padding: '6px 10px',
                        border: '1px solid #CCDFF1', borderRadius: 6, outline: 'none',
                        backgroundColor: '#F3F8FC', marginBottom: 6,
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#3E86C7'; e.target.style.boxShadow = '0 0 0 2px rgba(62, 134, 199,0.15)' }}
                      onBlur={(e) => { e.target.style.borderColor = '#CCDFF1'; e.target.style.boxShadow = 'none' }}
                    />
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                      {filteredUsageGroups.map((g: any) => (
                        <div
                          key={g.id}
                          onClick={() => handleSelectUsageGroup(g)}
                          title={[g.useS && `วิธีใช้: ${g.useS}`, g.timeS && `ช่วงเวลา: ${g.timeS}`, g.timeuseS && `เวลา: ${g.timeuseS}`, g.keepS && `เก็บ: ${g.keepS}`, g.remarkS && `หมายเหตุ: ${g.remarkS}`].filter(Boolean).join('\n')}
                          style={{
                            padding: '5px 6px', borderRadius: 6, cursor: 'pointer',
                            border: '1px solid #E5EEF8', backgroundColor: 'white',
                            transition: 'all 0.15s', textAlign: 'center',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3F8FC'; e.currentTarget.style.borderColor = '#3E86C7'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(62, 134, 199,0.15)' }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#E5EEF8'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                          <div style={{ fontFamily: 'Kanit_B', fontSize: 10, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.groupName}</div>
                          {g.shortName && <div style={{ fontFamily: 'Kanit', fontSize: 8, color: '#3E86C7', marginTop: 1 }}>{g.shortName}</div>}
                        </div>
                      ))}
                      {filteredUsageGroups.length === 0 && (
                        <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: 12, fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>ไม่พบกลุ่ม</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    )

  }





  useEffect(() => {
    const useMyHook = async () => {
      try {
        fetchPost()
      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [Number(ids ?? "")])

  useEffect(() => {
    const productCode = String(all.code || "").trim()
    const company = localStorage.getItem("company_") || ""

    if (!canViewCost || !productCode || !company) {
      setLatestCost(null)
      setAverageCost(null)
      return
    }

    let isActive = true

    const fetchCostSummary = async () => {
      try {
        fetchCostPriceMode(company).then((mode) => { if (isActive) setCostPriceMode(mode) })
        const res = await axios.get(`/api/dataitemlist?company=${encodeURIComponent(company)}&itemcode=${encodeURIComponent(productCode)}&fields=cost-summary`)
        const nextLatestCost = res.data?.latestCost
        const nextAverageCost = res.data?.averageCost
        if (isActive) {
          setLatestCost(nextLatestCost === null || nextLatestCost === undefined ? null : Number(nextLatestCost))
          setAverageCost(nextAverageCost === null || nextAverageCost === undefined ? null : Number(nextAverageCost))
        }
      } catch (error) {
        console.error(error)
        if (isActive) { setLatestCost(null); setAverageCost(null) }
      }
    }

    fetchCostSummary()

    return () => {
      isActive = false
    }
  }, [all.code, canViewCost])

  // ตรวจว่าสินค้ามีความเคลื่อนไหวสต็อกหรือยัง (รับ/ขาย/โอนออก/รับโอน/ปรับยอด)
  // ถ้ามีอย่างใดอย่างหนึ่งแล้ว ให้ล็อก Barcode / หน่วยขายย่อย / ลบสินค้า
  useEffect(() => {
    const productCode = String(all.code || "").trim()
    const company = localStorage.getItem("company_") || ""

    if (!productCode || !company) {
      setStockLocked(false)
      return
    }

    let isActive = true

    const checkStockActivity = async () => {
      try {
        const idQuery = ids ? `&id=${Number(ids)}` : ""
        const res = await axios.get(`/api/stock-balance-summary?itemcode=${encodeURIComponent(productCode)}&company=${encodeURIComponent(company)}${idQuery}`)
        const summary = res.data || {}
        const hasActivity =
          Number(summary.totalReceived || 0) > 0 ||
          Number(summary.totalSale || 0) > 0 ||
          Number(summary.totalTransferOut || 0) > 0 ||
          Number(summary.totalTransferIn || 0) > 0 ||
          Number(summary.totalAdjust || 0) !== 0
        if (isActive) setStockLocked(hasActivity)
      } catch (error) {
        console.error(error)
        if (isActive) setStockLocked(false)
      }
    }

    checkStockActivity()

    return () => {
      isActive = false
    }
  }, [all.code, ids])

  useEffect(() => {
    const useMyHook = async () => {
      try {
        localStorage.setItem("pd", "")
        localStorage.setItem("bar", "")
      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [])



  const fetchPost = async () => {

    try {
      const res = await axios.get(`/api/${apis}/${Number(ids || "")}`)
      if (res.data !== undefined) {
        productNameDraftRef.current = res.data?.ProductName || ""
        setall1({
          ...initialValues,
          ...res.data,
          ROPs: res.data?.ROP ?? res.data?.ROPs ?? "",
        })
      }

      localStorage.setItem("pd", res.data.ProductName)
      localStorage.setItem("bar", res.data.Barcode)
      // setall1(res.data)

    } catch (error) {
      console.error(error)
    }

  }
  const setcpage = useMessageStore((state) => state.setcpage);
  // Delete/id
  const DeletePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const productText = [all.code, all.ProductName].filter(Boolean).join(" - ")
    if (!window.confirm(`ยืนยันลบข้อมูลสินค้า${productText ? `\n${productText}` : ""}\n\nต้องการลบใช่หรือไม่?`)) return

    try {
      await axios.delete(`/api/${apis}/${Number(ids || "")}`)
      setcpage("0")
    } catch (error) {
      console.error('Failed to delete the post', error)
    }
  }




  //*** Get API Fixname */
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);

  const FixnamePosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Fixnameapis}?company=${company}`)
      const items = await res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
      setFixname(items)
      console.log(items)
      //setFixname(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  //*** Get API group */    
  const [open1, setOpen1] = useState(false)
  const [selectedStatus1, setSelectedStatus1] = useState<{ value: string, label: string } | null>(null)
  const [items1, setFixname1] = useState<{ value: string, label: string }[]>([]);

  const GroupPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Groupapis}?company=${company}`)
      const items = await res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
      setFixname1(items)
      console.log(items)
      //setFixname(res.data)

    } catch (error) {
      console.error(error)
    }
  }

 //*** Get API Type */    
   const [open2, setOpen2] = useState(false)
   const [selectedStatus2, setSelectedStatus2] = useState<{ value: string, label: string } | null>(null)
   const [items2, setFixname2] = useState<{ value: string, label: string }[]>([]);
 
   const TypePosts = async () => {
     const company = (localStorage.getItem("company_") || "")
     const defaults = [
       { value: 'default_khy9', label: 'ขย.9' },
       { value: 'default_dash', label: '-' },
     ]
     try {
      
       const merged = [...defaults.filter(d => !items.some((i: any) => i.label === d.label)), ...items]
       setFixname2(merged)
 
       //setFixname(res.data)
 
     } catch (error) {
       console.error(error)
     }
   }
 
   //*** Get API Type Special */    
   const [open3, setOpen3] = useState(false)
   const [selectedStatus3, setSelectedStatus3] = useState<{ value: string, label: string } | null>(null)
   const [items3, setFixname3] = useState<{ value: string, label: string }[]>([]);
 
   const TypePostsSpecial = async () => {
     const company = (localStorage.getItem("company_") || "")
     const defaults = [
       { value: 'default_khy9', label: 'ขย.10' },
       { value: 'default_khy10', label: 'ขย.11' },
       { value: 'default_khy11', label: 'ขย.12' },
       { value: 'default_khy12', label: 'ขย.13' },
       { value: 'default_khy10_11', label: 'ขย.10 และ ขย.11' },
       { value: 'default_khy10_12', label: 'ขย.10 และ ขย.12' },
       { value: 'default_khy11_12', label: 'ขย.11 และ ขย.12' },
       { value: 'default_dash', label: '-' },
     ]
     try {
      
       const merged = [...defaults.filter(d => !items.some((i: any) => i.label === d.label)), ...items]
       setFixname3(merged)
 
       //setFixname(res.data)
 
     } catch (error) {
       console.error(error)
     }
   }

  //*** Get API Area */    
  const [open4, setOpen4] = useState(false)
  const [selectedStatus4, setSelectedStatus4] = useState<{ value: string, label: string } | null>(null)
  const [items4, setFixname4] = useState<{ value: string, label: string }[]>([]);

  const AreaPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Areaapis}?company=${company}`)
      const items = await res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
      setFixname4(items)

      //setFixname(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  //*** Get API Gatagory */    
  const [open5, setOpen5] = useState(false)
  const [selectedStatus5, setSelectedStatus5] = useState<{ value: string, label: string } | null>(null)
  const [items5, setFixname5] = useState<{ value: string, label: string }[]>([]);

  const GetagoryPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Getagoryapis}?company=${company}`)
      const items = await res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
      setFixname5(items)

      //setFixname(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  //*** Get API Unit */    
  const [open6, setOpen6] = useState(false)
  const [selectedStatus6, setSelectedStatus6] = useState<{ value: string, label: string } | null>(null)
  const [items6, setFixname6] = useState<{ value: string, label: string }[]>([]);

  const UnitPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${Unitapis}?company=${company}`)
      const items = await res.data.map((item: { id: string; list: string }) => ({ value: item.id, label: item.list }))
      setFixname6(items)

      //setFixname(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  // ผู้ผลิต (ดึงรายชื่อบริษัท/ผู้ขาย ค้นหาได้)
  const [openMaker, setOpenMaker] = useState(false)
  const [makerItems, setMakerItems] = useState<{ value: string, label: string }[]>([]);

  const MakerPosts = async () => {
    const company = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/supplier?company=${company}&names=&fields=list`)
      const rows = Array.isArray(res.data) ? res.data : []
      const uniqueByName = Array.from(new Map(rows
        .filter((r: any) => String(r?.names || '').trim())
        .map((r: any) => [String(r.names).trim(), r])
      ).values())
      setMakerItems(uniqueByName.map((r: any) => ({ value: String(r.id ?? r.names), label: String(r.names).trim() })))
    } catch (error) {
      console.error(error)
    }
  }



  //*******************************Add Image Logo************************ */
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  let companyS = (localStorage.getItem("company_") || "")

  useEffect(() => {
    const useMyHook = async () => {
      try {
        setPreview(null)
      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [Number(ids || "")])


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  }

  const UploadImg = async () => {
    // Send to backend
    const res = await fetch("/api/setting/store/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: preview, company: companyS, hard: String(all.code) }),
    });
    const data = await res.json();
    if (data.file) {
      setUploadedUrl(data.file);

    }
    // Edit()
    // setTimeout(async() => {
    //    location.reload();
    // },1000);
  };

  //************************************************************************ */


  //******************************************** */
  // Get/id



  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setall1({
      ...all,
      [name]: value,
    });
  };

  const AlertUpdateComplete = () => {

    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะสินค้า</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> แก้ไข ข้อมูลสินค้าเรียบร้อย</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault()
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
        UpdateFixname(fakeEvent)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const UpdateFixname = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = all.code
  const ProductName = productNameDraftRef.current || all.ProductName
    const fixname = all.fixname
    const group = all.group
    const type = all.type
    const subtype = all.subtype
    const Category = all.Category
    const DrugRegistor = all.DrugRegistor
    const Area = all.Area
    const CostActual = Number(all.CostActual)
    const Unit = all.Unit
    const price = Number(all.price)
    const wholesaleprice = Number(all.wholesaleprice)
    const online = Number(all.online)
    const PriceA = Number(all.PriceA)
    const PriceB = Number(all.PriceB)
    const PriceC = Number(all.PriceC)
    const PriceD = Number(all.PriceD)
    const PriceE = Number(all.PriceE)
    const PriceF = Number(all.PriceF)
    const PriceG = Number(all.PriceG)
    const PriceH = Number(all.PriceH)
    const Barcode = all.Barcode
    const Max = Number(all.Max)
    const Min = Number(all.Min)
    const ROP = Number(all.ROPs)
    const AlarmExp = all.AlarmExp
    const Show = all.Show
    const Child = all.Child
    const CI = all.CI
    const Remark = all.Remark
    const concentration = all.concentration ? parseFloat(all.concentration) : null
    const dosePerKg = all.dosePerKg ? parseFloat(all.dosePerKg) : null
    const doseFrequency = all.doseFrequency ? parseInt(all.doseFrequency) : null
    const maxDosePerDay = all.maxDosePerDay ? parseFloat(all.maxDosePerDay) : null
    const memberDiscountEligible = all.memberDiscountEligible !== false && String(all.memberDiscountEligible) !== "false"
    const requireLot = normalizeRequireLot(all.requireLot)
    const maker = all.maker ?? ""
    const qty_unit = all.qty_unit ?? ""
    const pic = String("/uploads/" + all.code + "_" + companyS + ".jpg")

    // Check for duplicate barcode first
    if (Barcode && Barcode.trim() !== "") {
      try {
        // Check in Datalist
        const checkRes = await axios.get(`/api/datalist?company=${companyS}&Barcode=${Barcode.trim()}`)
        if (checkRes.data && checkRes.data.length > 0) {
          const isDuplicate = checkRes.data.some((item: any) => item.code !== code)
          if (isDuplicate) {
            alert(`บาร์โค้ด ${Barcode} มีการใช้งานแล้วในระบบ`)
            return
          }
        }

        // Check in UnitConversion
        const checkUnitRes = await axios.get(`/api/unitconversion?company=${companyS}&Barcode=${Barcode.trim()}`)
        if (checkUnitRes.data && checkUnitRes.data.length > 0) {
          const isDuplicateUnit = checkUnitRes.data.some((item: any) => item.productCode !== code)
          if (isDuplicateUnit) {
            alert(`บาร์โค้ด ${Barcode} มีการใช้งานแล้วในระบบ (หน่วยย่อย)`)
            return
          }
        }

        // Check in ProductBarcode (บาร์โค้ดสำรองของสินค้าตัวอื่น)
        // บาร์โค้ดหนึ่งตัวต้องชี้สินค้าได้ตัวเดียว ไม่งั้นสแกนแล้วตัดสต็อกผิดตัว
        const checkAliasRes = await axios.get(`/api/product-barcode?company=${companyS}&barcode=${Barcode.trim()}`)
        if (Array.isArray(checkAliasRes.data) && checkAliasRes.data.length > 0) {
          const conflict = checkAliasRes.data.find((item: any) => item.productCode !== code)
          if (conflict) {
            alert(`บาร์โค้ด ${Barcode} ถูกใช้เป็นบาร์โค้ดสำรองของสินค้า ${conflict.productCode} แล้ว`)
            return
          }
        }
      } catch (error) {
        console.error("Error checking barcode:", error)
      }
    }

    try {
      await axios.put(`/api/${apis}/${Number(ids || "")}`,
        {
          ProductName, fixname, group, type, subtype, Category, DrugRegistor, Area, CostActual, Unit, price, wholesaleprice, online, PriceA, PriceB, PriceC, PriceD, PriceE, PriceF, PriceG, PriceH, Barcode, Max, Min, ROP, AlarmExp, Show, Child, CI, Remark, pic, maker, qty_unit, concentration, dosePerKg, doseFrequency, maxDosePerDay, memberDiscountEligible, requireLot
        }
      )
      await AlertUpdateComplete()
      await UploadImg()
      setPreview(null)
      await fetchPost()
    } catch (error) {
      console.error(error)
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล")
    }
  }

  const BarcodeS = () => {


    const [barcode, setbarcode] = useState(all.Barcode)

    useEffect(() => {
      setbarcode(localStorage.getItem("bar") || "")

    }, [barcode])

    const BarcodeInput = async (e: any) => {
      setbarcode(e.target.value)
      localStorage.setItem("bar", e.target.value)

    }



    return (
      <>
        <div className="" style={{ width: widths1 }}><div className={styles.btnsubhead_pro} >Barcode :</div></div>
        <div className="col-2 " style={{ marginLeft: 10 }}>
          <input
            type="text"
            name="Barcode"
            value={barcode ?? ""}
            onChange={BarcodeInput}
            className="form-control form-control-sm"
            placeholder=""
            style={{ fontFamily: "Kanit" }}
          />
        </div>
      </>

    )
  }

  const productLogbookName = all.ProductName || ""
  const productLogbookContext = [all.code, productLogbookName].filter(Boolean).join(" ")
  const memberDiscountEligible = all.memberDiscountEligible !== false && String(all.memberDiscountEligible) !== "false"
  const requireLot = normalizeRequireLot(all.requireLot)
  // ราคาระดับ A–H — ร้านส่วนใหญ่ไม่ได้ใช้ จึงพับไว้ก่อน แล้วกางเองถ้าสินค้าตัวนี้ตั้งราคาไว้
  const tierPriceCount = TIER_PRICE_FIELDS.filter(({ key }) => {
    const v = (all as any)[key]
    return v !== null && v !== undefined && String(v).trim() !== ""
  }).length
  const tierPricesOpen = tierPricesOpenOverride ?? tierPriceCount > 0

  return (
    <>
      <LoadingOverlay show={loading} />
      <form className='form'>
        <div className={styles.productFormContainer} >
          {/* Main Grid Layout */}
          <div className={styles.productFormGrid} >
            {/* Left Column - Product Info & Pricing */}
            <div className={styles.productEditorColumn}>
              {/* Product Info Card */}
              <div className={`${styles.productInfoCard} ${styles.productInfoCardDataCompact}`}>
                <div className={`${styles.productInfoCardHeader} ${styles.pfCardHeader}`}>
                  <span className={styles.productSectionIcon} aria-hidden="true" /> ข้อมูลสินค้า
                  <span className={styles.pfHeaderMeta}>
                    {stockLocked ? (
                      <span className={`${styles.pfHeaderChip} ${styles.pfHeaderChipLock}`} title={STOCK_LOCK_MESSAGE}>
                        <LockGlyph /> ล็อก Barcode / หน่วยขายย่อย
                      </span>
                    ) : (
                      <span className={styles.pfHeaderChip}>แก้ไขได้ทุกช่อง</span>
                    )}
                  </span>
                </div>
                <div className={`${styles.productInfoCardBody} ${styles.pfCardBody}`}>
                  <div className={styles.pfGrid}>
                    {/* รหัสสินค้า — ระบบกำหนดให้อัตโนมัติ แก้ไขไม่ได้ */}
                    <div className={`${styles.pfField} ${styles.pfSpan2}`}>
                      <label className={styles.pfLabel} htmlFor="pfProductCode">รหัสสินค้า</label>
                      <input
                        id="pfProductCode"
                        type="text"
                        name="code"
                        value={all.code ?? ""}
                        onChange={handleInputChange}
                        className={`${styles.pfInput} ${styles.pfInputCode}`}
                        disabled={true}
                      />
                    </div>

                    {/* Barcode */}
                    <div className={`${styles.pfField} ${styles.pfSpan2}`}>
                      <label className={styles.pfLabel} htmlFor="pfProductBarcode">
                        Barcode
                        {stockLocked && <span className={styles.pfLabelLock} title={STOCK_LOCK_MESSAGE}><LockGlyph /></span>}
                      </label>
                      <input
                        id="pfProductBarcode"
                        type="text"
                        name="Barcode"
                        value={all.Barcode ?? ""}
                        onChange={handleInputChange}
                        disabled={stockLocked}
                        title={stockLocked ? STOCK_LOCK_MESSAGE : undefined}
                        placeholder="สแกนหรือพิมพ์บาร์โค้ด"
                        className={`${styles.pfInput} ${styles.pfInputBarcode} ${stockLocked ? styles.pfFieldLocked : ''}`}
                      />
                    </div>

                    {/* หน่วยขายย่อย — หน่วยเล็กสุดที่ใช้ตัดสต็อก */}
                    <div className={`${styles.pfField} ${styles.pfSpan2}`}>
                      <label className={styles.pfLabel}>
                        หน่วยขายย่อย
                        {stockLocked && <span className={styles.pfLabelLock} title={STOCK_LOCK_MESSAGE}><LockGlyph /></span>}
                      </label>
                      <Popover open={open6} onOpenChange={(isOpen) => { if (stockLocked) return; setOpen6(isOpen); if (isOpen) UnitPosts() }}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={styles.pfSelect}
                            disabled={stockLocked}
                            title={stockLocked ? STOCK_LOCK_MESSAGE : undefined}
                            style={{
                              cursor: stockLocked ? 'not-allowed' : 'pointer',
                              background: stockLocked ? '#f1f5f9' : (open6 ? '#fffdf5' : 'white'),
                              border: stockLocked ? '1px solid #dde5ee' : (open6 ? '1.5px solid #f59e0b' : '1px solid #cbd5e1'),
                              color: stockLocked ? '#94a3b8' : (all.Unit ? '#0f172a' : '#a8b4c2'),
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
                              boxShadow: stockLocked ? 'none' : (open6 ? '0 0 0 3px rgba(245,158,11,0.15)' : 'inset 0 1px 2px rgba(15,23,42,0.04)'),
                              outline: 'none',
                            }}
                            onMouseOver={(e) => { if (!open6 && !stockLocked) { e.currentTarget.style.borderColor = '#9db9d6' } }}
                            onMouseOut={(e) => { if (!open6 && !stockLocked) { e.currentTarget.style.borderColor = '#cbd5e1' } }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.Unit ? 500 : 400 }}>{all.Unit || "เลือกหน่วย..."}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stockLocked ? '#cbd5e1' : (open6 ? '#f59e0b' : '#94a3b8')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open6 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '320px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                          <Command>
                            <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาหน่วย..." style={{ fontFamily: 'Kanit' }} /></div>
                            <CommandList style={{ maxHeight: '260px' }}>
                              <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '14px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                              <CommandGroup>
                                {items6.map((status6) => (
                                  <CommandItem key={status6.value} value={status6.label} onSelect={() => { setSelectedStatus6(status6); setall1({ ...all, Unit: status6.label }); setOpen6(false) }} style={{ fontFamily: 'Kanit', fontSize: '14px', padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.Unit === status6.label ? '#f59e0b' : '#f1f5f9', border: all.Unit === status6.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                      {all.Unit === status6.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                    </span>
                                    <span style={{ color: all.Unit === status6.label ? '#f59e0b' : '#334155', fontWeight: all.Unit === status6.label ? 600 : 400 }}>{status6.label}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                  {/* Product Name */}
                  <ProductNameDraftInput
                    value={all.ProductName ?? ""}
                    onDraftChange={handleProductNameDraftChange}
                    onCommit={commitProductNameDraft}
                  />

                  {/* Generic Name */}
                  <div className={styles.productFormRow} style={{ display: 'none' }}>
                    <label className={styles.productFormLabel}>ชื่อสามัญ :</label>
                    <Popover open={open} onOpenChange={(isOpen) => {
                      setOpen(isOpen)
                      if (isOpen) FixnamePosts()
                    }}>
                      <PopoverTrigger asChild>
                        <button
                          className={styles.productFormSelectCompact}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            cursor: 'pointer',
                            background: open ? '#fffde7' : 'white',
                            border: open ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontFamily: 'Kanit',
                            fontSize: '14px',
                            color: all.fixname ? '#1e293b' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            height: '36px',
                            transition: 'all 0.2s ease',
                            boxShadow: open ? '0 0 0 3px rgba(245, 158, 11, 0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                            outline: 'none',
                          }}
                          onMouseOver={(e) => {
                            if (!open) {
                              e.currentTarget.style.borderColor = '#f59e0b'
                              e.currentTarget.style.boxShadow = '0 1px 4px rgba(245, 158, 11, 0.15)'
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!open) {
                              e.currentTarget.style.borderColor = '#e2e8f0'
                              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
                            }
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.fixname ? 500 : 400 }}>
                            {all.fixname || "เลือกชื่อสามัญ..."}
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '400px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <Command>
                          <div style={{ padding: '8px 8px 0 8px' }}>
                            <CommandInput placeholder="🔍  พิมพ์ค้นหาชื่อสามัญ..." style={{ fontFamily: 'Kanit' }} />
                          </div>
                          <CommandList style={{ maxHeight: '250px' }}>
                            <CommandEmpty>
                              <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>
                                ไม่พบข้อมูลชื่อสามัญ
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {items.map((status) => (
                                <CommandItem
                                  key={status.value}
                                  value={status.label}
                                  onSelect={() => {
                                    setSelectedStatus(status)
                                    setall1({ ...all, fixname: status.label })
                                    setOpen(false)
                                  }}
                                  style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  <span style={{
                                    width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    background: all.fixname === status.label ? '#f59e0b' : '#f1f5f9',
                                    border: all.fixname === status.label ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                                  }}>
                                    {all.fixname === status.label && (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    )}
                                  </span>
                                  <span style={{ color: all.fixname === status.label ? '#f59e0b' : '#334155', fontWeight: all.fixname === status.label ? 600 : 400 }}>
                                    {status.label}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Drug Group */}
                  <div className={styles.productFormRow} style={{ display: 'none' }}>
                    <label className={styles.productFormLabel}>กลุ่มสินค้า :</label>
                    <Popover open={open1} onOpenChange={(isOpen) => { setOpen1(isOpen); if (isOpen) GroupPosts() }}>
                      <PopoverTrigger asChild>
                        <button
                          className={styles.productFormSelectCompact}
                          style={{
                            flex: 1, textAlign: 'left', cursor: 'pointer',
                            background: open1 ? '#fffde7' : 'white',
                            border: open1 ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                            borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px',
                            color: all.group ? '#1e293b' : '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            height: '36px', transition: 'all 0.2s ease',
                            boxShadow: open1 ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                            outline: 'none',
                          }}
                          onMouseOver={(e) => { if (!open1) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245,158,11,0.15)' } }}
                          onMouseOut={(e) => { if (!open1) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' } }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.group ? 500 : 400 }}>{all.group || "เลือกกลุ่มสินค้า..."}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open1 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open1 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '400px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <Command>
                          <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  พิมพ์ค้นหากลุ่มสินค้า..." style={{ fontFamily: 'Kanit' }} /></div>
                          <CommandList style={{ maxHeight: '250px' }}>
                            <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                            <CommandGroup>
                              {items1.map((status1) => (
                                <CommandItem key={status1.value} value={status1.label} onSelect={() => { setSelectedStatus1(status1); setall1({ ...all, group: status1.label }); setOpen1(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.group === status1.label ? '#f59e0b' : '#f1f5f9', border: all.group === status1.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                    {all.group === status1.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                  </span>
                                  <span style={{ color: all.group === status1.label ? '#f59e0b' : '#334155', fontWeight: all.group === status1.label ? 600 : 400 }}>{status1.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Report Type & Drug Register — ซ่อนไว้ (ค่าเดิมยังถูกบันทึกตามปกติ) */}
                  <div className={styles.productFormRow} style={{ display: 'none' }}>
                    <label className={styles.productFormLabel}>รายงาน ขย :</label>
                    <Popover open={open2} onOpenChange={(isOpen) => { setOpen2(isOpen); if (isOpen) TypePosts() }}>
                      <PopoverTrigger asChild>
                        <button
                          className={styles.productFormSelectCompact}
                          style={{
                            maxWidth: '20%', flex: 1, textAlign: 'left', cursor: 'pointer',
                            background: open2 ? '#fffde7' : 'white',
                            border: open2 ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                            borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px',
                            color: all.type ? '#1e293b' : '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            height: '36px', transition: 'all 0.2s ease',
                            boxShadow: open2 ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                            outline: 'none',
                          }}
                          onMouseOver={(e) => { if (!open2) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245,158,11,0.15)' } }}
                          onMouseOut={(e) => { if (!open2) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' } }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.type ? 500 : 400 }}>{all.type || "เลือก ขย..."}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open2 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open2 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '300px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <Command>
                          <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหา ขย..." style={{ fontFamily: 'Kanit' }} /></div>
                          <CommandList style={{ maxHeight: '250px' }}>
                            <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                            <CommandGroup>
                              {items2.map((status2) => (
                                <CommandItem key={status2.value} value={status2.label} onSelect={() => { setSelectedStatus2(status2); setall1({ ...all, type: status2.label }); setOpen2(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.type === status2.label ? '#f59e0b' : '#f1f5f9', border: all.type === status2.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                    {all.type === status2.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                  </span>
                                  <span style={{ color: all.type === status2.label ? '#f59e0b' : '#334155', fontWeight: all.type === status2.label ? 600 : 400 }}>{status2.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <label className={styles.productFormLabelSm}>ทะเบียนสินค้า :</label>
                    <input
                      type="text"
                      name="DrugRegistor"
                      id="DrugRegistor"
                      value={all.DrugRegistor ?? ""}
                      onChange={handleInputChange}
                      className={styles.productFormInput}
                      style={{ maxWidth: '20%' }}
                    />
                  </div>

                  {/* พื้นที่เก็บ */}
                  <div className={`${styles.pfField} ${styles.pfSpan3}`}>
                    {/* ข.ย. (10,11,12,13) — ซ่อนไว้ (ค่าเดิมยังถูกบันทึกตามปกติ) */}
                    <div style={{ display: 'none' }}>
                    <label className={styles.productFormLabel}>ข.ย. (10,11,12,13) :</label>
                    <Popover open={open3} onOpenChange={(isOpen) => { setOpen3(isOpen); if (isOpen) TypePostsSpecial() }}>
                      <PopoverTrigger asChild>
                        <button
                          className={styles.productFormSelectCompact}
                          style={{
                            maxWidth: '20%', flex: 1, textAlign: 'left', cursor: 'pointer',
                            background: open3 ? '#fffde7' : 'white',
                            border: open3 ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                            borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px',
                            color: all.subtype ? '#1e293b' : '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            height: '36px', transition: 'all 0.2s ease',
                            boxShadow: open3 ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                            outline: 'none',
                          }}
                          onMouseOver={(e) => { if (!open3) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245,158,11,0.15)' } }}
                          onMouseOut={(e) => { if (!open3) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' } }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.subtype ? 500 : 400 }}>{all.subtype || "เลือก..."}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open3 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open3 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '300px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <Command>
                          <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหา ข.ย. ..." style={{ fontFamily: 'Kanit' }} /></div>
                          <CommandList style={{ maxHeight: '250px' }}>
                            <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                            <CommandGroup>
                              {items3.map((status3) => (
                                <CommandItem key={status3.value} value={status3.label} onSelect={() => { setSelectedStatus3(status3); setall1({ ...all, subtype: status3.label }); setOpen3(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.subtype === status3.label ? '#f59e0b' : '#f1f5f9', border: all.subtype === status3.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                    {all.subtype === status3.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                  </span>
                                  <span style={{ color: all.subtype === status3.label ? '#f59e0b' : '#334155', fontWeight: all.subtype === status3.label ? 600 : 400 }}>{status3.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    </div>
                    <label className={styles.pfLabel}>พื้นที่เก็บ</label>
                    <Popover open={open4} onOpenChange={(isOpen) => { setOpen4(isOpen); if (isOpen) AreaPosts() }}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={styles.pfSelect}
                          style={{
                            cursor: 'pointer',
                            background: open4 ? '#fffdf5' : 'white',
                            border: open4 ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
                            color: all.Area ? '#0f172a' : '#a8b4c2',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
                            boxShadow: open4 ? '0 0 0 3px rgba(245,158,11,0.15)' : 'inset 0 1px 2px rgba(15,23,42,0.04)',
                            outline: 'none',
                          }}
                          onMouseOver={(e) => { if (!open4) { e.currentTarget.style.borderColor = '#9db9d6' } }}
                          onMouseOut={(e) => { if (!open4) { e.currentTarget.style.borderColor = '#cbd5e1' } }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.Area ? 500 : 400 }}>{all.Area || "เลือกพื้นที่เก็บ..."}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={open4 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open4 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '320px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <Command>
                          <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาพื้นที่เก็บ..." style={{ fontFamily: 'Kanit' }} /></div>
                          <CommandList style={{ maxHeight: '260px' }}>
                            <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '14px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                            <CommandGroup>
                              {items4.map((status4) => (
                                <CommandItem key={status4.value} value={status4.label} onSelect={() => { setSelectedStatus4(status4); setall1({ ...all, Area: status4.label }); setOpen4(false) }} style={{ fontFamily: 'Kanit', fontSize: '14px', padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.Area === status4.label ? '#f59e0b' : '#f1f5f9', border: all.Area === status4.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                    {all.Area === status4.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                  </span>
                                  <span style={{ color: all.Area === status4.label ? '#f59e0b' : '#334155', fontWeight: all.Area === status4.label ? 600 : 400 }}>{status4.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* หมวด */}
                  <div className={`${styles.pfField} ${styles.pfSpan3}`}>
                    <label className={styles.pfLabel}>หมวด</label>
                    <Popover open={open5} onOpenChange={(isOpen) => { setOpen5(isOpen); if (isOpen) GetagoryPosts() }}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={styles.pfSelect}
                          style={{
                            cursor: 'pointer',
                            background: open5 ? '#fffdf5' : 'white',
                            border: open5 ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
                            color: all.Category ? '#0f172a' : '#a8b4c2',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
                            boxShadow: open5 ? '0 0 0 3px rgba(245,158,11,0.15)' : 'inset 0 1px 2px rgba(15,23,42,0.04)',
                            outline: 'none',
                          }}
                          onMouseOver={(e) => { if (!open5) { e.currentTarget.style.borderColor = '#9db9d6' } }}
                          onMouseOut={(e) => { if (!open5) { e.currentTarget.style.borderColor = '#cbd5e1' } }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.Category ? 500 : 400 }}>{all.Category || "เลือกหมวด..."}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={open5 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open5 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '320px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <Command>
                          <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาหมวด..." style={{ fontFamily: 'Kanit' }} /></div>
                          <CommandList style={{ maxHeight: '260px' }}>
                            <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '14px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                            <CommandGroup>
                              {items5.map((status5) => (
                                <CommandItem key={status5.value} value={status5.label} onSelect={() => { setSelectedStatus5(status5); setall1({ ...all, Category: status5.label }); setOpen5(false) }} style={{ fontFamily: 'Kanit', fontSize: '14px', padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.Category === status5.label ? '#f59e0b' : '#f1f5f9', border: all.Category === status5.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                    {all.Category === status5.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                  </span>
                                  <span style={{ color: all.Category === status5.label ? '#f59e0b' : '#334155', fontWeight: all.Category === status5.label ? 600 : 400 }}>{status5.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Maker & Package size */}
                  <div className={styles.productFormRow} style={{ display: 'none' }}>
                    <label className={styles.productFormLabel}>ผู้ผลิต :</label>
                    <Popover open={openMaker} onOpenChange={(isOpen) => { setOpenMaker(isOpen); if (isOpen) MakerPosts() }}>
                      <PopoverTrigger asChild>
                        <button
                          className={styles.productFormSelectCompact}
                          style={{
                            maxWidth: '20%', flex: 1, textAlign: 'left', cursor: 'pointer',
                            background: openMaker ? '#fffde7' : 'white',
                            border: openMaker ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                            borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px',
                            color: all.maker ? '#1e293b' : '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            height: '36px', transition: 'all 0.2s ease',
                            boxShadow: openMaker ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                            outline: 'none',
                          }}
                          onMouseOver={(e) => { if (!openMaker) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245,158,11,0.15)' } }}
                          onMouseOut={(e) => { if (!openMaker) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' } }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.maker ? 500 : 400 }}>{all.maker || "เลือกผู้ผลิต..."}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={openMaker ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: openMaker ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '320px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <Command>
                          <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาผู้ผลิต..." style={{ fontFamily: 'Kanit' }} /></div>
                          <CommandList style={{ maxHeight: '250px' }}>
                            <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                            <CommandGroup>
                              {all.maker && (
                                <CommandItem value="__clear__" onSelect={() => { setall1({ ...all, maker: "" }); setOpenMaker(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', color: '#ef4444' }}>
                                  ✕ ล้างค่า
                                </CommandItem>
                              )}
                              {makerItems.map((m) => (
                                <CommandItem key={m.value} value={m.label} onSelect={() => { setall1({ ...all, maker: m.label }); setOpenMaker(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.maker === m.label ? '#f59e0b' : '#f1f5f9', border: all.maker === m.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                    {all.maker === m.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                  </span>
                                  <span style={{ color: all.maker === m.label ? '#f59e0b' : '#334155', fontWeight: all.maker === m.label ? 600 : 400 }}>{m.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <label className={styles.productFormLabelSm}>ขนาดบรรจุ :</label>
                    <input
                      type="text"
                      value={all.qty_unit ?? ""}
                      onChange={(e) => setall1({ ...all, qty_unit: e.target.value })}
                      placeholder="เช่น 10x10's, 100 เม็ด/กล่อง..."
                      className={styles.productFormSelectCompact}
                      style={{ maxWidth: '20%', flex: 1, height: '36px', borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className={`${styles.pricingCard} ${styles.pricingCardDataCompact}`} >
                <div className={`${styles.pricingCardHeader} ${styles.pfCardHeader}`}>
                  <span className={styles.pricingSectionIcon} aria-hidden="true" /> ข้อมูลราคา
                </div>
                <div className={styles.pricingCardBody}>
                  {/* แถว 1 — ราคาที่ใช้ขายจริงทุกวัน */}
                  <div className={styles.priceRow}>
                    {canViewCost && (
                      <label className={styles.priceField} title={stockLocked ? STOCK_LOCK_MESSAGE : "ราคาทุนตั้งต้นของสินค้า"}>
                        <span className={styles.priceFieldLabel}>ทุนตั้งต้น</span>
                        <input
                          type="text"
                          name="CostActual"
                          id="CostActual"
                          value={all.CostActual ?? ""}
                          onChange={handleInputChange}
                          disabled={stockLocked}
                          className={styles.priceFieldInput}
                        />
                        <span className={styles.priceFieldUnit}>บาท</span>
                      </label>
                    )}
                    {canViewCost && (
                      <span className={styles.latestCostChip} title={costPriceMode === 'average' ? "ทุนเฉลี่ยจากทุกครั้งที่รับเข้า" : "ทุนล่าสุดจากรายการรับเข้า"}>
                        {costPriceModeLabel(costPriceMode)} <strong>{formatCostDisplay(costPriceMode === 'average' ? averageCost : latestCost)}</strong>
                      </span>
                    )}
                    <label className={styles.priceField} title="ราคาขายหน้าร้าน (ราคาปกติ)">
                      <span className={styles.priceFieldLabel}>หน้าร้าน</span>
                      <input
                        type="text"
                        name="price"
                        id="price"
                        value={all.price ?? ""}
                        onChange={handleInputChange}
                        className={styles.priceFieldInput}
                      />
                      <span className={styles.priceFieldUnit}>บาท</span>
                    </label>
                    <label className={styles.priceField} title="ราคาขายส่ง">
                      <span className={styles.priceFieldLabel}>ขายส่ง</span>
                      <input
                        type="text"
                        name="wholesaleprice"
                        id="wholesaleprice"
                        value={all.wholesaleprice ?? ""}
                        onChange={handleInputChange}
                        className={styles.priceFieldInput}
                      />
                      <span className={styles.priceFieldUnit}>บาท</span>
                    </label>
                    <label className={styles.priceField} title="ราคาสำหรับลูกค้าสมาชิก">
                      <span className={styles.priceFieldLabel}>สมาชิก</span>
                      <input
                        type="text"
                        name="online"
                        id="online"
                        value={all.online ?? ""}
                        onChange={handleInputChange}
                        className={styles.priceFieldInput}
                      />
                      <span className={styles.priceFieldUnit}>บาท</span>
                    </label>
                    {/* ราคาระดับ A–H ใช้เฉพาะร้านที่ตั้งราคาหลายระดับ จึงพับเก็บไว้ท้ายแถวราคา */}
                    <button
                      type="button"
                      onClick={() => setTierPricesOpenOverride(!tierPricesOpen)}
                      aria-expanded={tierPricesOpen}
                      title="ราคาขายหลายระดับ (A–H) สำหรับลูกค้าแต่ละกลุ่ม"
                      className={`${styles.priceTierToggle} ${tierPricesOpen ? styles.priceTierToggleOpen : ""}`}
                    >
                      <span>ราคาระดับ A–H</span>
                      {tierPriceCount > 0 && <span className={styles.priceTierBadge}>{tierPriceCount}</span>}
                      <span className={styles.priceTierChevron} aria-hidden="true">▾</span>
                    </button>
                  </div>
                  {tierPricesOpen && (
                    <div className={styles.priceTierGrid}>
                      {TIER_PRICE_FIELDS.map(({ key, label }) => (
                        <label key={key} className={styles.priceField} title={`ราคาระดับ ${label}`}>
                          <span className={styles.priceFieldLabel}>{label}</span>
                          <input
                            type="text"
                            name={key}
                            id={key}
                            value={(all as any)[key] ?? ""}
                            onChange={handleInputChange}
                            className={styles.priceFieldInput}
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {/* แถว 3 — ค่าควบคุมสต็อก */}
                  <div className={styles.priceStockRow}>
                    <span className={styles.priceRowCaption}>ค่าควบคุมสต็อก</span>
                    <label className={styles.priceField} title="เหลือถึงจำนวนนี้ ให้เตือนสั่งซื้อ">
                      <span className={styles.priceFieldLabel}>จุดสั่งซื้อ</span>
                      <input
                        type="text"
                        name="ROPs"
                        id="ROPs"
                        value={all.ROPs ?? ""}
                        onChange={handleInputChange}
                        className={styles.priceFieldInput}
                      />
                    </label>
                    <label className={styles.priceField} title="จำนวนที่ควรเก็บสูงสุด">
                      <span className={styles.priceFieldLabel}>เก็บสูงสุด</span>
                      <input
                        type="text"
                        name="Max"
                        id="Max"
                        value={all.Max ?? ""}
                        onChange={handleInputChange}
                        className={styles.priceFieldInput}
                      />
                    </label>
                    <label className={styles.priceField} title="จำนวนที่ควรมีติดร้านอย่างต่ำ">
                      <span className={styles.priceFieldLabel}>เก็บต่ำสุด</span>
                      <input
                        type="text"
                        name="Min"
                        id="Min"
                        value={all.Min ?? ""}
                        onChange={handleInputChange}
                        className={styles.priceFieldInput}
                      />
                    </label>
                  </div>

                  {/* แถว 4 — สวิตช์ตั้งค่าสินค้า + ปุ่มบันทึก/ลบ อยู่บรรทัดเดียวกัน */}
                  <div className={styles.priceFooter}>
                    <div className={styles.priceSwitches}>
                      {/* ระงับการใช้งาน — ติ๊กแล้วสินค้าจะไม่ถูกนำไปขาย */}
                      <div
                        className={`${styles.productMemberDiscountControl} ${styles.productMemberDiscountInline} ${styles.productSuspendControl}`}
                        title="ระงับแล้วสินค้าจะไม่ขึ้นให้เลือกตอนขาย"
                      >
                        <label className={styles.productMemberDiscountLabel}>
                          <input
                            type="checkbox"
                            checked={all.Show === "True" || all.Show === "true" || all.Show === "TRUE"}
                            onChange={(e) => {
                              setall1({
                                ...all,
                                Show: e.target.checked ? "True" : "False"
                              });
                            }}
                          />
                          <span className={styles.productMemberDiscountSwitch} aria-hidden="true"><span /></span>
                          <span className={styles.productMemberDiscountText}>ระงับการใช้งาน</span>
                        </label>
                        <span className={(all.Show === "True" || all.Show === "true" || all.Show === "TRUE") ? styles.productSuspendBadgeOn : styles.productSuspendBadgeOff}>
                          {(all.Show === "True" || all.Show === "true" || all.Show === "TRUE") ? "ระงับ" : "ใช้งาน"}
                        </span>
                      </div>

                      <div
                        className={`${styles.productMemberDiscountControl} ${styles.productMemberDiscountInline}`}
                        title="เปิดไว้ = สินค้านี้ร่วมโปรส่วนลดสมาชิก"
                      >
                        <label className={styles.productMemberDiscountLabel}>
                          <input
                            type="checkbox"
                            checked={memberDiscountEligible}
                            onChange={(e) => setall1((previous) => ({ ...previous, memberDiscountEligible: e.target.checked }))}
                          />
                          <span className={styles.productMemberDiscountSwitch} aria-hidden="true"><span /></span>
                          <span className={styles.productMemberDiscountText}>ร่วมส่วนลดสมาชิก</span>
                        </label>
                        <span className={memberDiscountEligible ? styles.productMemberDiscountBadgeOn : styles.productMemberDiscountBadgeOff}>
                          {memberDiscountEligible ? "ลดได้" : "ยกเว้น"}
                        </span>
                      </div>

                      {/* สินค้า lot — ควบคุมว่า รับสินค้า/ขาย/โอน/รับโอน/ปรับยอด ต้องระบุ Lot หรือไม่ */}
                      <div
                        className={`${styles.productMemberDiscountControl} ${styles.productMemberDiscountInline} ${styles.productLotControl}`}
                        title={requireLot
                          ? "ต้องระบุ Lot/วันหมดอายุ ทุกครั้งที่ รับสินค้า · ขาย · โอน · รับโอน · ปรับยอด"
                          : "ไม่ต้องระบุ Lot ทุกธุรกรรม — ระบบเลือก/ปันส่วน Lot ให้อัตโนมัติแบบใกล้หมดอายุก่อน"}
                      >
                        <label className={styles.productMemberDiscountLabel}>
                          <input
                            type="checkbox"
                            checked={requireLot}
                            onChange={(e) => setall1((previous) => ({ ...previous, requireLot: e.target.checked }))}
                          />
                          <span className={styles.productMemberDiscountSwitch} aria-hidden="true"><span /></span>
                          <span className={styles.productMemberDiscountText}>สินค้า lot</span>
                        </label>
                        <span className={requireLot ? styles.productLotBadgeOn : styles.productLotBadgeOff}>
                          {requireLot ? LOT_BADGE_ON : LOT_BADGE_OFF}
                        </span>
                      </div>
                    </div>

                    <div className={styles.priceActions}>
                      <button
                        onClick={UpdateFixname}
                        type="button"
                        data-logbook-context={productLogbookContext}
                        data-logbook-code={all.code || ""}
                        data-logbook-name={productLogbookName}
                        className={`${styles.pricingActionButton} ${styles.pricingSaveButton}`}
                      >แก้ไขข้อมูล (F12)</button>
                      <button
                        onClick={DeletePost}
                        type="button"
                        disabled={stockLocked}
                        title={stockLocked ? STOCK_LOCK_MESSAGE : undefined}
                        data-logbook-context={productLogbookContext}
                        data-logbook-code={all.code || ""}
                        data-logbook-name={productLogbookName}
                        className={`${styles.pricingActionButton} ${styles.pricingDeleteButton}`}
                        style={stockLocked ? { opacity: 0.45, cursor: 'not-allowed', filter: 'grayscale(0.35)' } : undefined}
                      >ลบข้อมูล</button>
                    </div>
                  </div>

                  {/* แจ้งเตือนแบบมืออาชีพ เมื่อสินค้ามีความเคลื่อนไหวสต็อกแล้ว */}
                  {stockLocked && (
                    <div className={styles.productLockNotice} role="note">
                      <span className={styles.productLockNoticeIcon} aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <span className={styles.productLockNoticeText}>
                        มีการ <strong>รับ · ขาย · โอน · ปรับยอด</strong> ไปแล้ว ไม่สามารถแก้ <strong>Barcode</strong> · <strong>หน่วยย่อย</strong> และ <strong>ลบสินค้า</strong> ได้
                      </span>
                    </div>
                  )}

                  {/* บาร์โค้ดสำรอง — หลายบาร์โค้ดต่อหนึ่งหน่วยสินค้า
                      เป็นเรื่องของ "สินค้าตัวเดียวหน่วยเดียว" ต่างจากตารางหน่วยในการขาย
                      (คอลัมน์ขวา ใต้รูปภาพ) ที่เป็นการขายคนละหน่วย คนละราคา คนละจำนวน */}
                  <ProductBarcodeTable
                    productCode={all.code}
                    company={companyS}
                    primaryBarcode={all.Barcode}
                    stockLocked={stockLocked}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Image & Drug Label */}
            <div>
              {/* Product Image Card */}
              <div className={styles.productImageCard}>
                <div className={styles.productImageWrapper}>
                  {all.pic == null || preview !== null ?
                    preview && (<img className={styles.productImagePreview} src={preview} alt="preview" width={130} height={130} />)
                    :
                    <img className={styles.productImagePreview} src={"/api" + String(all.pic) + "?t=" + Date.now()} alt="preview" width={130} height={130} />
                  }
                </div>
                <div>
                  <label className={styles.productImageUploadBtn} htmlFor="inputGroupFile01">
                    📷 เลือกรูป
                  </label>
                  <input type="file" accept="image/*" onChange={handleFileChange} id="inputGroupFile01" style={{ display: 'none' }} />
                </div>
              </div>

              {/* หน่วยในการขาย — ต่อท้ายรูปภาพ ใช้พื้นที่ว่างของคอลัมน์ขวา */}
              <UnitConversionTable
                productCode={all.code}
                company={companyS}
                subUnit={all.Unit}
              />

              {/* Drug Label Section */}
              <div style={{ marginTop: '16px', display: 'none' }}>
                <SetLabel />
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
export default ProductPagedata

