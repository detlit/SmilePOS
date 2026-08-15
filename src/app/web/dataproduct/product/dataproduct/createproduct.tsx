
'use client'

import React, { useEffect, useState, useContext, createContext, useRef } from 'react'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import { normalizeRequireLot, LOT_BADGE_ON, LOT_BADGE_OFF } from '@/lib/lotPolicy'
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
import packageIcon from "../../../../icon/packaging-product-14475.svg"
import documentIcon from "../../../../icon/document-664.svg"
import deleteIcon from "../../../../icon/delete-junk.svg"
import arrowIcon from "../../../../icon/arrow-right-square.svg"
import databaseIcon from "../../../../icon/database-server-black-outline-20310.svg"
import editIcon from "../../../../icon/edit.svg"
import Modal1 from 'react-bootstrap/Modal';
import Button1 from 'react-bootstrap/Button';
import { useMessageStore } from "../../useMessageStore";
import { usePermission } from '@/utils/usePermission'
//import { useAppContext } from '../../page';
import { Toaster, toast } from "sonner"
import UnitConversionTable from './UnitConversionTable'
import { match } from 'assert';
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
const apidatalist = "datalist"

const apiindicatorlist = "label/indicatorlist"
const apitimes = "label/times"
const apitimeL = "label/timeL"
const apiuseL = "label/useL"
const apitimeuseL = "label/timeuseL"
const apikeepL = "label/keepL"
const apiRemarkL = "label/remarkL"

const apilabeldata = "label/labeldata"
const apilabeldata_all = "label/labeldata_all"

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

const IDSaveLabelContext = createContext<any>(undefined)

// ตั้งค่่าฉลากยา
export const SetLabel = () => {


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

  const { maxcodes } = useSaveContext();
  const { saves } = useSaveContext();
  const { codeS } = useSaveContext();
  const { fixname: contextFixname } = useSaveContext();
  //const {maxSup} =useAppContext(); 
  //let maxPro=Number(maxSup)+1

  const [all, setall1] = useState(initialValues)
  const [alllabel, setlabel] = useState(initialValues1)

  // Labeldata import/export states
  const labelFileInputRef = useRef<HTMLInputElement>(null)
  const [isImportingLabeldata, setIsImportingLabeldata] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isDeletingLabeldata, setIsDeletingLabeldata] = useState(false)

  // Handle Import Labeldata from Excel Sheet2
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
      const doImport = async (overwrite: boolean = false) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('company', company)
        if (overwrite) {
          formData.append('overwrite', 'true')
        }

        const res = await axios.post('/api/labeldata/import-csv-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (res.data.requiresConfirmation) {
          const confirmOverwrite = window.confirm(res.data.message)
          if (confirmOverwrite) {
            await doImport(true)
          } else {
            toast.info(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ยกเลิก</div>, {
              description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ยกเลิกการนำเข้าฉลากสินค้า</div>,
              duration: 3000,
            })
          }
          return
        }

        if (res.data.success) {
          toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
            description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
            duration: 3000,
          })
        }
      }

      await doImport(false)
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

  // Handle Export Excel (Datalist + Labeldata)
  const handleExportExcel = async () => {
    const company = localStorage.getItem('company_') || ''
    if (!company) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
        duration: 3000,
      })
      return
    }

    setIsExportingExcel(true)
    try {
      const res = await axios.get(`/api/datalist/export-excel?company=${company}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `data_${company}_${toThaiDateString()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ดาวน์โหลดไฟล์ Excel สำเร็จ</div>,
        duration: 3000,
      })
    } catch (error: any) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่สามารถ Export ข้อมูลได้</div>,
        duration: 3000,
      })
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Handle Download Template
  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get('/api/datalist/template-csv', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'template_drug.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ดาวน์โหลด Template สำเร็จ</div>,
        duration: 3000,
      })
    } catch (error: any) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่สามารถดาวน์โหลด Template ได้</div>,
        duration: 3000,
      })
    }
  }

  // Handle Delete Labeldata
  const handleDeleteLabeldata = async () => {
    const company = localStorage.getItem('company_') || ''
    if (!company) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
        duration: 3000,
      })
      return
    }

    if (!window.confirm(`ต้องการลบข้อมูลฉลากสินค้าทั้งหมดสำหรับ company: ${company} ใช่หรือไม่?`)) {
      return
    }

    setIsDeletingLabeldata(true)
    try {
      const res = await axios.delete(`/api/labeldata/delete-all?company=${company}`)
      if (res.data.success) {
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
          duration: 3000,
        })
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
        duration: 3000,
      })
    } finally {
      setIsDeletingLabeldata(false)
    }
  }

  useEffect(() => {
    const useMyHook = async () => {
      try {

        await LabelData()


      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [Number(codeS)])

  useEffect(() => {
    const useMyHook = async () => {
      try {

        saves === "1" ? await PostLabel() : ""


      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [Number(saves || "")])

  //Get Label Data
  const LabelData = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apilabeldata}?company=1000&code=${String(localStorage.getItem("code") || "")}`)
      res.data[0] !== undefined ? setlabel(res.data[0]) : setlabel(initialValues1)

    } catch (error) {
      console.error(error)
    }

  }



  console.log(alllabel.indicatorlistS)
  console.log(alllabel)
  // Post LabelData
  const PostLabel = async () => {

    let company = (localStorage.getItem("company_") || "")
    const code = String(maxcodes || "")
    const indicatorlistS = alllabel.indicatorlistS.toString()
    const timeS = String(alllabel.timeS)
    const useS = String(alllabel.useS)
    const timeuseS = String(alllabel.timeuseS)
    const keepS = String(alllabel.keepS)
    const remarkS = String(alllabel.remarkS)

    try {
      await axios.post(`/api/${apilabeldata}`,
        {
          company, code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS
        }
      )

      //  setTimeout( () => {
      //     location.reload();
      //     }, 300);
    }
    catch (error) {
      console.error(error)
    }
  }

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
          code, indicatorlistS, timeS, useS, timeuseS, keepS, remarkS
        }
      )

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
  const [usageGroupSearch, setUsageGroupSearch] = useState('')
  const [showUsageGroups, setShowUsageGroups] = useState(true)

  const fetchUsageLabelGroups = async () => {
    const companyS = localStorage.getItem('company_') || ''
    try {
      const res = await axios.get(`/api/usage-label-group?company=${companyS}&sort=asc`)
      setUsageLabelGroups(res.data || [])
      setFilteredUsageGroups(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchUsageLabelGroups()
  }, [])

  useEffect(() => {
    if (!usageGroupSearch.trim()) {
      setFilteredUsageGroups(usageLabelGroups)
      return
    }

    const query = usageGroupSearch.toLowerCase()
    setFilteredUsageGroups(
      usageLabelGroups.filter((group: any) =>
        (group.groupName || '').toLowerCase().includes(query) ||
        (group.shortName || '').toLowerCase().includes(query)
      )
    )
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
    if (contextFixname) {
      fetchGenericLabels(contextFixname)
      setSelectedGenericLabel('')
    } else {
      setGenericLabels([])
    }
  }, [contextFixname])

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
          placeholder="การเก็บรักษา..."
          style={comboStyle.input(!!alllabel.keepS, open4)}
        />
        <Popover open={open4} onOpenChange={(isOpen) => { setOpen4(isOpen); if (isOpen) KeepPosts() }}>
          <PopoverTrigger asChild>
            <button style={comboStyle.triggerBtn(open4)}>{comboStyle.chevron(open4)}</button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="bottom" align="end" style={{ width: '280px', ...comboStyle.popover }}>
            <Command>
              <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาการเก็บรักษา..." style={{ fontFamily: 'Kanit' }} /></div>
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
      {/* Professional Drug Label Card */}
      <div className={styles.drugLabelCard}>
        <div className={styles.drugLabelCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>💊 ข้อมูลฉลากสินค้า</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Import Labeldata Button */}
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
              title="Import ฉลากสินค้าจาก Excel (Sheet2)"
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
              {isImportingLabeldata ? '⏳' : <Image src={arrowIcon} alt="Import" width={14} height={14} />}
            </button>
            {/* Export Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              title="Export ข้อมูลสินค้า+ฉลากสินค้า เป็น Excel"
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10,
                cursor: isExportingExcel ? 'not-allowed' : 'pointer',
                opacity: isExportingExcel ? 0.7 : 1
              }}
            >
              {isExportingExcel ? '⏳' : <Image src={databaseIcon} alt="Export" width={14} height={14} />}
            </button>
            {/* Template Button */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              title="ดาวน์โหลด Template Excel"
              style={{
                background: '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10,
                cursor: 'pointer'
              }}
            >
              <Image src={editIcon} alt="Template" width={14} height={14} />
            </button>
            {/* Delete Labeldata Button */}
            <button
              type="button"
              onClick={handleDeleteLabeldata}
              disabled={isDeletingLabeldata}
              title="ลบข้อมูลฉลากสินค้า ทั้งหมด"
              style={{
                background: '#94a3b8',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10,
                cursor: isDeletingLabeldata ? 'not-allowed' : 'pointer',
                opacity: isDeletingLabeldata ? 0.7 : 1
              }}
            >
              {isDeletingLabeldata ? '⏳' : <Image src={deleteIcon} alt="ลบ" width={14} height={14} />}
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
                <option value="">เลือกชุดฉลากสินค้า ({contextFixname})...</option>
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
          {genericLabels.length === 0 && contextFixname && (
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
                    {filteredUsageGroups.map((group: any) => (
                      <div
                        key={group.id}
                        onClick={() => handleSelectUsageGroup(group)}
                        title={[
                          group.useS && `วิธีใช้: ${group.useS}`,
                          group.timeS && `ช่วงเวลา: ${group.timeS}`,
                          group.timeuseS && `เวลา: ${group.timeuseS}`,
                          group.keepS && `เก็บ: ${group.keepS}`,
                          group.remarkS && `หมายเหตุ: ${group.remarkS}`,
                        ].filter(Boolean).join('\n')}
                        style={{
                          padding: '5px 6px', borderRadius: 6, cursor: 'pointer',
                          border: '1px solid #E5EEF8', backgroundColor: 'white',
                          transition: 'all 0.15s', textAlign: 'center',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3F8FC'; e.currentTarget.style.borderColor = '#3E86C7'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(62, 134, 199,0.15)' }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#E5EEF8'; e.currentTarget.style.boxShadow = 'none' }}
                      >
                        <div style={{ fontFamily: 'Kanit_B', fontSize: 10, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.groupName}</div>
                        {group.shortName && <div style={{ fontFamily: 'Kanit', fontSize: 8, color: '#3E86C7', marginTop: 1 }}>{group.shortName}</div>}
                      </div>
                    ))}
                    {filteredUsageGroups.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8', padding: '10px 0' }}>
                        ไม่พบกลุ่มที่ค้นหา
                      </div>
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


// ข้อมูลยา
function CreateProductPagedata() {
  const maxSup = useMessageStore((state) => state.maxSup)
  const { hasPermission } = usePermission()
  const canViewCost = hasPermission("C4")
  // null = ยังไม่ได้กดเอง ให้ใช้ค่าเริ่มต้น (กางถ้ามีราคาระดับกรอกไว้แล้ว)
  const [tierPricesOpenOverride, setTierPricesOpenOverride] = useState<boolean | null>(null)
  //const {maxSup} =useAppContext(); 
  let maxPro = Number(maxSup) == -Infinity ? 10000 : Number(maxSup) + 1

  const initialValues = {
    code: String(maxPro),
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
    concentration: "",
    dosePerKg: "",
    doseFrequency: "",
    maxDosePerDay: "",
    memberDiscountEligible: true,
    requireLot: true
  };



  const [all, setall1] = useState(initialValues)

  // Keep the displayed product code in sync once the live max-code lookup (maxV)
  // resolves. The form mounts before that async request finishes, so on first load
  // maxSup is still "" → Number("") + 1 = 1. Without this effect the code field would
  // stay stuck at "1" instead of updating to maxCode + 1 when the store fills in.
  useEffect(() => {
    setall1(prev => ({ ...prev, code: String(maxPro) }))
  }, [maxSup])

  // Import CSV PD states
  const [isImportedDatalistPD, setIsImportedDatalistPD] = useState(false)
  const [isImportingDatalistPD, setIsImportingDatalistPD] = useState(false)
  const [isImportedLabeldataPD, setIsImportedLabeldataPD] = useState(false)
  const [isImportingLabeldataPD, setIsImportingLabeldataPD] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)

  // แสดงปุ่มเครื่องมือ (import/export/ลบ) เฉพาะผู้ใช้ระดับ level2
  const [isLevel2, setIsLevel2] = useState(false)

  useEffect(() => {
    checkImportStatusDatalistPD()
    checkImportStatusLabeldataPD()
    setIsLevel2(String(localStorage.getItem("level_") || "") === "level2")
  }, [])

  const checkImportStatusDatalistPD = async () => {
    const company = localStorage.getItem('company_') || ''
    if (!company) return
    try {
      const res = await axios.get(`/api/datalist/import-csv-pd?company=${company}`)
      setIsImportedDatalistPD(res.data.imported)
    } catch (error) {
      console.error('Failed to check datalist PD import status', error)
    }
  }

  const checkImportStatusLabeldataPD = async () => {
    const company = localStorage.getItem('company_') || ''
    if (!company) return
    try {
      const res = await axios.get(`/api/labeldata/import-csv-pd?company=${company}`)
      setIsImportedLabeldataPD(res.data.imported)
    } catch (error) {
      console.error('Failed to check labeldata PD import status', error)
    }
  }

  const handleImportDatalistPD = async () => {
    if (isImportedDatalistPD || isImportingDatalistPD) return

    const company = localStorage.getItem('company_') || ''
    if (!company) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
        duration: 3000,
      })
      return
    }

    if (!window.confirm(`ต้องการนำเข้าข้อมูลสินค้าสำหรับ company: ${company} ใช่หรือไม่?`)) {
      return
    }

    setIsImportingDatalistPD(true)
    try {
      const res = await axios.post('/api/datalist/import-csv-pd', { company })
      if (res.data.success) {
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
          duration: 3000,
        })
        setIsImportedDatalistPD(true)
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
        duration: 3000,
      })
    } finally {
      setIsImportingDatalistPD(false)
    }
  }

  const handleImportLabeldataPD = async () => {
    if (isImportedLabeldataPD || isImportingLabeldataPD) return

    const company = localStorage.getItem('company_') || ''
    if (!company) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
        duration: 3000,
      })
      return
    }

    if (!window.confirm(`ต้องการนำเข้าข้อมูลฉลากสินค้าสำหรับ company: ${company} ใช่หรือไม่?`)) {
      return
    }

    setIsImportingLabeldataPD(true)
    try {
      const res = await axios.post('/api/labeldata/import-csv-pd', { company })
      if (res.data.success) {
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
          duration: 3000,
        })
        setIsImportedLabeldataPD(true)
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
        duration: 3000,
      })
    } finally {
      setIsImportingLabeldataPD(false)
    }
  }

  const handleDeleteAll = async () => {
    if (isDeletingAll) return

    const company = localStorage.getItem('company_') || ''
    if (!company) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
        duration: 3000,
      })
      return
    }

    if (!window.confirm(`⚠️ คำเตือน! ต้องการลบข้อมูลสินค้าและฉลากสินค้าทั้งหมดสำหรับ company: ${company} ใช่หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้!`)) {
      return
    }

    setIsDeletingAll(true)
    try {
      // Delete Datalist
      const res1 = await axios.delete(`/api/datalist/delete-all?company=${company}`)
      // Delete Labeldata
      const res2 = await axios.delete(`/api/labeldata/delete-all?company=${company}`)

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ลบข้อมูลสินค้า {res1.data.count} รายการ และฉลากสินค้า {res2.data.count} รายการ</div>,
        duration: 3000,
      })

      // Reset import status so buttons can be used again
      setIsImportedDatalistPD(false)
      setIsImportedLabeldataPD(false)
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
        duration: 3000,
      })
    } finally {
      setIsDeletingAll(false)
    }
  }

  // ล้างข้อมูล
  const clearData = () => {
    setall1(initialValues)
  }

  // Import CSV file ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImportingCSV, setIsImportingCSV] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)

  // Handle Import CSV file
  const handleImportCSVFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsImportingCSV(true)
    try {
      const doImport = async (overwrite: boolean = false) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('company', company)
        if (overwrite) {
          formData.append('overwrite', 'true')
        }

        const res = await axios.post('/api/datalist/import-csv-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (res.data.requiresConfirmation) {
          const confirmOverwrite = window.confirm(res.data.message)
          if (confirmOverwrite) {
            await doImport(true)
          } else {
            // Check if they want to cancel or import only non-duplicates? The prompt said if not duplicate it saves normal, if duplicate ask to overwrite. If they say no, maybe we just don't import anything or import normally ignoring duplicates?
            // Actually the prompt says "ถ้า ช้อมูลซ้ำ ให้แจ้งว่าต้องการ save ข้อมูลทับข้อมูลเดิมหรือไม่แจ้งจำนวนด้วย ถ้าทับ ก็บันทึกข้อมูลทับข้อมูลที่ Barcode เดียวกันได้เลย แต่ถ้าไม่ซ้ำก็บันทึกปกติ"
            // Let's assume if they don't confirm, we just skip import for now, or just send overwrite=false but without asking again? 
            // Wait, our backend handles overwrite=false by skipping duplicates if requiresConfirmation is NOT returned. 
            // Wait, if overwrite is false, backend returns requiresConfirmation. So if they say no, we can just not do anything, or we could modify backend to have a 'skip' option.
            // "แต่ถ้าไม่ซ้ำก็บันทึกปกติ" means if no duplicates, it saves normally.
            // If they click Cancel on the prompt, it means they abort the operation.
            toast.info(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ยกเลิก</div>, {
              description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ยกเลิกการนำเข้าข้อมูล</div>,
              duration: 3000,
            })
          }
          return
        }

        if (res.data.success) {
          toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
            description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
            duration: 3000,
          })
        }
      }

      await doImport(false)
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
        duration: 3000,
      })
    } finally {
      setIsImportingCSV(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle Export Excel
  const handleExportCSV = async () => {
    const company = localStorage.getItem('company_') || ''
    if (!company) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
        duration: 3000,
      })
      return
    }

    setIsExportingCSV(true)
    try {
      const res = await axios.get(`/api/datalist/export-excel?company=${encodeURIComponent(company)}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `data_${company}_${toThaiDateString()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ดาวน์โหลดไฟล์ Excel สำเร็จ</div>,
        duration: 3000,
      })
    } catch (error: any) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่สามารถ Export ข้อมูลได้</div>,
        duration: 3000,
      })
    } finally {
      setIsExportingCSV(false)
    }
  }

  // Handle Download Template
  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get('/api/datalist/template-csv', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'template_drug.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ดาวน์โหลด Template สำเร็จ</div>,
        duration: 3000,
      })
    } catch (error: any) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่สามารถดาวน์โหลด Template ได้</div>,
        duration: 3000,
      })
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




  //*******************************Add Image Logo************************ */
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  let companyS = (localStorage.getItem("company_") || "")

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
      body: JSON.stringify({ imageBase64: preview, company: companyS, hard: String(maxPro) }),
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
  const memberDiscountEligible = all.memberDiscountEligible !== false && String(all.memberDiscountEligible) !== "false"
  const requireLot = normalizeRequireLot(all.requireLot)
  // ราคาระดับ A–H — ร้านส่วนใหญ่ไม่ได้ใช้ จึงพับไว้ก่อน แล้วกางเองถ้ากรอกไว้แล้ว
  const tierPriceCount = TIER_PRICE_FIELDS.filter(({ key }) => {
    const v = (all as any)[key]
    return v !== null && v !== undefined && String(v).trim() !== ""
  }).length
  const tierPricesOpen = tierPricesOpenOverride ?? tierPriceCount > 0

  const AlertComplete = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะสินค้า</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึกสินค้าเรียบร้อย</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };

  const setcpage = useMessageStore((state) => state.setcpage);

  const CreateData = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    const company = (localStorage.getItem("company_") || "")
    const code = String(maxPro)
    const ProductName = localStorage.getItem("pd") || ""
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
    const Barcode = localStorage.getItem("bar") || ""
    const Max = Number(all.Max)
    const Min = Number(all.Min)
    const ROP = Number(all.ROPs)
    const AlarmExp = all.AlarmExp
    const Show = all.Show || "False"
    const Child = all.Child
    const CI = all.CI
    const Remark = all.Remark
    const concentration = all.concentration ? parseFloat(all.concentration) : null
    const dosePerKg = all.dosePerKg ? parseFloat(all.dosePerKg) : null
    const doseFrequency = all.doseFrequency ? parseInt(all.doseFrequency) : null
    const maxDosePerDay = all.maxDosePerDay ? parseFloat(all.maxDosePerDay) : null
    const memberDiscountEligible = all.memberDiscountEligible !== false && String(all.memberDiscountEligible) !== "false"
    const requireLot = normalizeRequireLot(all.requireLot)
    const pic = String("/uploads/" + String(maxPro) + "_" + companyS + ".jpg")

    // Check for duplicate barcode first
    if (Barcode && Barcode.trim() !== "") {
      try {
        // Check in Datalist
        const checkRes = await axios.get(`/api/datalist?company=${companyS}&Barcode=${Barcode.trim()}`)
        if (checkRes.data && checkRes.data.length > 0) {
          alert(`บาร์โค้ด ${Barcode} มีการใช้งานแล้วในระบบ`)
          return
        }
        
        // Check in UnitConversion
        const checkUnitRes = await axios.get(`/api/unitconversion?company=${companyS}&Barcode=${Barcode.trim()}`)
        if (checkUnitRes.data && checkUnitRes.data.length > 0) {
          alert(`บาร์โค้ด ${Barcode} มีการใช้งานแล้วในระบบ (หน่วยย่อย)`)
          return
        }

        // Check in ProductBarcode (บาร์โค้ดสำรองของสินค้าตัวอื่น)
        // บาร์โค้ดหนึ่งตัวต้องชี้สินค้าได้ตัวเดียว ไม่งั้นสแกนแล้วตัดสต็อกผิดตัว
        const checkAliasRes = await axios.get(`/api/product-barcode?company=${companyS}&barcode=${Barcode.trim()}`)
        if (Array.isArray(checkAliasRes.data) && checkAliasRes.data.length > 0) {
          alert(`บาร์โค้ด ${Barcode} ถูกใช้เป็นบาร์โค้ดสำรองของสินค้า ${checkAliasRes.data[0].productCode} แล้ว`)
          return
        }
      } catch (error) {
        console.error("Error checking barcode:", error)
      }
    }

    try {
      await axios.post(`/api/${apis}`,
        {
          company, code, ProductName, fixname, group, type, subtype, Category, DrugRegistor, Area, CostActual, Unit, price, wholesaleprice, online, PriceA, PriceB, PriceC, PriceD, PriceE, PriceF, PriceG, PriceH, Barcode, Max, Min, ROP, AlarmExp, Show, Child, CI, Remark, pic, concentration, dosePerKg, doseFrequency, maxDosePerDay, memberDiscountEligible, requireLot
        }
      )

      UploadImg()
      setcpage(String("0"))
      await AlertComplete()
    } catch (error: any) {
      console.error(error)
      if (error?.response?.status === 409 && error?.response?.data?.error === "DUPLICATE_CODE") {
        alert(`รหัสสินค้า ${code} มีอยู่ในระบบแล้ว กรุณาปิดหน้านี้แล้วกดปุ่ม "+ เพิ่มสินค้า" อีกครั้งเพื่อรับรหัสใหม่`)
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
      }
    }
  }




  const [codelabel, setidss] = useState({ saves: "", maxcodes: "", codeS: "" })
  useEffect(() => {
    setidss({ ...codelabel, maxcodes: String(maxPro), saves: "0", codeS: "" })
    localStorage.setItem("bar", "")
    localStorage.setItem("code", "")
    localStorage.setItem("pd", "")


  }, [])

  useEffect(() => {
    const handleF12 = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault()
        CreateData()
        setidss((prev: any) => ({ ...prev, saves: "0" }))
        setTimeout(() => {
          setidss((prev: any) => ({ ...prev, saves: "1" }))
        }, 50)
      }
    }
    window.addEventListener('keydown', handleF12)
    return () => window.removeEventListener('keydown', handleF12)
  }, [all])



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
        <label className={styles.productFormLabelSm}>Barcode :</label>
        <input
          type="text"
          name="Barcode"
          value={barcode ?? ""}
          onChange={BarcodeInput}
          className={`${styles.productFormInput} ${styles.productBarcodeInput}`}
          placeholder=""
          style={{ maxWidth: '140px' }}
        />
      </>

    )
  }

  const ProductNameS = () => {


    const [Pd, setPd] = useState(all.ProductName)


    useEffect(() => {
      setPd(localStorage.getItem("pd") || "")

    }, [Pd])

    const ProductNameInput = async (e: any) => {


      setPd(e.target.value)
      localStorage.setItem("pd", e.target.value)

    }

    return (
      <>
        <div className={styles.productFormRow}>
          <label className={styles.productFormLabel}>ชื่อสินค้า :</label>
          <input
            type="text"
            name="ProductName"
            id="ProductName"
            value={Pd ?? ""}
            onChange={ProductNameInput}
            className={styles.productFormInput}
            placeholder=""
            style={{ backgroundColor: "white" }}
          />
        </div>
      </>

    )
  }


  /***********Get datalist*/


  const [dataProduct, setdataProduct] = useState<any[]>([])
  const [codeSS, setcodeS] = useState("")

  const fetchDataDrug = async () => {
    let companyS = (localStorage.getItem("company_") || "")

    try {
      const res = await axios.get(`/api/${apidatalist}?company=1000&sort=asc`)
      const sorted = [...res.data].sort((a: any, b: any) => {
        const codeA = parseInt(a.code) || 0
        const codeB = parseInt(b.code) || 0
        return codeA - codeB
      })
      setdataProduct(sorted)
    } catch (error) {
      console.error(error)
    }
  }




  useEffect(() => {

    fetchDataDrug()

  }, [])


  //******** */ Search สินค้า*****************/
  function Search_Product() {


    //*******Show Modal **********************************/
    const [show1, setShow1] = useState(false);
    const handleClose = () => setShow1(false);
    const handleShow = () => setShow1(true);

    // Import CSV states
    const [isImportedDatalist, setIsImportedDatalist] = useState(false)
    const [isImportingDatalist, setIsImportingDatalist] = useState(false)
    const [isImportedLabeldata, setIsImportedLabeldata] = useState(false)
    const [isImportingLabeldata, setIsImportingLabeldata] = useState(false)

    useEffect(() => {
      checkImportStatusDatalist()
      checkImportStatusLabeldata()
    }, [])

    const checkImportStatusDatalist = async () => {
      try {
        const res = await axios.get('/api/datalist/import-csv')
        setIsImportedDatalist(res.data.imported)
      } catch (error) {
        console.error('Failed to check datalist import status', error)
      }
    }

    const checkImportStatusLabeldata = async () => {
      try {
        const res = await axios.get('/api/labeldata/import-csv')
        setIsImportedLabeldata(res.data.imported)
      } catch (error) {
        console.error('Failed to check labeldata import status', error)
      }
    }

    const handleImportDatalist = async () => {
      if (isImportedDatalist || isImportingDatalist) return

      setIsImportingDatalist(true)
      try {
        const res = await axios.post('/api/datalist/import-csv')
        if (res.data.success) {
          toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
            description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
            duration: 3000,
          })
          setIsImportedDatalist(true)
          await fetchDataDrug()
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
          duration: 3000,
        })
      } finally {
        setIsImportingDatalist(false)
      }
    }

    const handleImportLabeldata = async () => {
      if (isImportedLabeldata || isImportingLabeldata) return

      setIsImportingLabeldata(true)
      try {
        const res = await axios.post('/api/labeldata/import-csv')
        if (res.data.success) {
          toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
            description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
            duration: 3000,
          })
          setIsImportedLabeldata(true)
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
          duration: 3000,
        })
      } finally {
        setIsImportingLabeldata(false)
      }
    }

    //******* */  Key ค้นหา สินค้า  ************************/
    const [data, setData] = useState(dataProduct);
    const [search, setsearch] = useState("")

    useEffect(() => {
      setData(dataProduct)
    }, [dataProduct])

    const handleChange = (value: any) => {
      setsearch(value);
      filterDataProduct(value);
    };

    // filter records by Productname
    const filterDataProduct = (value: any) => {
      const lower = value.toLowerCase().trim();
      if (lower === "") {
        setData(dataProduct);
      } else {
        const filteredData = dataProduct.filter((user: any) => {
          const name = user.ProductName?.toLowerCase() || "";
          const fix = user.fixname?.toLowerCase() || "";
          const bar = user.Barcode?.toLowerCase() || "";

          return (
            name.includes(lower) ||
            fix.includes(lower) ||
            bar.includes(lower)
          );
        });

        setData(filteredData);
      }
    };

    //***************************************************************** */


    return (
      <>
        <Button1

          variant="outline-primary"
          onClick={handleShow}
          className={styles.productFormHelperButton}

          style={{ fontFamily: "Kanit", textAlign: "left" }}
        >
          ตัวช่วย ลงข้อมูลสินค้า
        </Button1>

        <Modal1 show={show1} onHide={handleClose}>
          <Modal1.Header closeButton>
            <Modal1.Title
              style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              ตัวช่วย ลงข้อมูลสินค้า
              <button
                onClick={handleImportDatalist}
                disabled={isImportedDatalist || isImportingDatalist}
                style={{
                  background: isImportedDatalist ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontFamily: 'Kanit',
                  cursor: isImportedDatalist || isImportingDatalist ? 'not-allowed' : 'pointer',
                  opacity: isImportedDatalist ? 0.7 : 1
                }}
              >
                {isImportingDatalist ? '⏳ กำลังนำเข้า...' : isImportedDatalist ? '✅ สินค้า' : '🔄 GEN สินค้า'}
              </button>
              <button
                onClick={handleImportLabeldata}
                disabled={isImportedLabeldata || isImportingLabeldata}
                style={{
                  background: isImportedLabeldata ? '#9ca3af' : '#3E86C7',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontFamily: 'Kanit',
                  cursor: isImportedLabeldata || isImportingLabeldata ? 'not-allowed' : 'pointer',
                  opacity: isImportedLabeldata ? 0.7 : 1
                }}
              >
                {isImportingLabeldata ? '⏳ กำลังนำเข้า...' : isImportedLabeldata ? '✅ ฉลากสินค้า' : '🔄 GEN ฉลากสินค้า'}
              </button>
            </Modal1.Title>
          </Modal1.Header>
          <Modal1.Body>
            <div>
              <div className="row" style={{ fontFamily: "Kanit", textAlign: "center", fontSize: 12, color: "red" }}>
                รบกวนกรอกข้อมูล หมวดสินค้า, ชื่อทางการ, หน่วยสินค้า, พื้นที่เก็บ, ตั้งค่าข้อมูลฉลากสินค้า ก่อนค่ะ ^^
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ค้นหา</div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={search}
                  onChange={(e) => handleChange(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="ค้นหาชื่อ,  Barcode สินค้า"
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
              </div>

              <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <table className="table table-sm table-hover"   >
                  <thead style={{ position: "sticky", top: "0" }}>
                    <tr>

                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15vw" }}>
                        <div style={{ width: "15vw" }}>ชื่อสินค้า</div>

                      </th>
                      <th scope="col" >
                        <div style={{ fontFamily: "Kanit", fontSize: 10 }}>barcode</div>
                      </th>

                    </tr>
                  </thead>
                  <tbody className="table-group-divider " >
                    {data.map((post: any) => (
                      <tr key={post.id} onClick={() => {
                        setall1({
                          ...all,
                          ProductName: post.ProductName,
                          fixname: post.fixname,
                          group: post.group,
                          type: post.type,
                          subtype: post.subtype,
                          Category: post.Category,
                          Unit: post.Unit,
                          Barcode: post.Barcode

                        }),
                          setShow1(false),

                          setidss({ ...codelabel, codeS: post.code })
                        localStorage.setItem("bar", post.Barcode),
                          localStorage.setItem("pd", post.ProductName)
                        localStorage.setItem("code", post.code)
                      }}>


                        <td className={styles.bodydetailTable_Re1} style={{ width: "15vw" }}>
                          <div className='row'>
                            <div style={{ fontFamily: "Kanit", fontSize: 13 }}>{post.ProductName ?? ""}&nbsp;&nbsp;: {post.Unit ?? ""}</div>
                            <div>{post.fixname ?? ""}</div>
                            <div>{post.type ?? ""}&nbsp;&nbsp;{post.subtype ?? ""}&nbsp;&nbsp;{post.Category ?? ""}</div>



                          </div>

                        </td>
                        <td style={{ fontFamily: "Kanit", fontSize: 10 }}>
                          {post.Barcode}

                        </td>


                      </tr>


                    ))}
                  </tbody>
                </table>
              </div>

            </div>


          </Modal1.Body>
          {/**   <Modal1.Footer>
           <Button1 
                 variant="secondary" 
                 onClick={handleClose}
                 style={{fontFamily:"Kanit" ,textAlign:"left",fontSize:15,color:"white"}}
                 >
             ปิด
           </Button1>
           <Button1 
                 variant="primary" 
                 onClick={handleClose}
                 style={{fontFamily:"Kanit" ,textAlign:"left",fontSize:15,color:"white"}}
                 >
             เลือก
           </Button1>
         </Modal1.Footer>*/}
        </Modal1>
      </>
    );
  }




  return (
    <form className='form'>
      <div className={styles.productFormContainer}>
        {/* Main Grid Layout */}
        <div className={styles.productFormGrid}>
          {/* Left Column - Product Info & Pricing */}
          <div className={styles.productEditorColumn}>
            {/* Product Info Card */}
            <div className={`${styles.productInfoCard} ${styles.productInfoCardDataCompact}`}>
              <div className={styles.productInfoCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className={styles.productSectionIcon} aria-hidden="true" /> ข้อมูลสินค้า</div>
                {isLevel2 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {/* Import Product Data */}
                  <button
                    type="button"
                    onClick={handleImportDatalistPD}
                    disabled={isImportedDatalistPD || isImportingDatalistPD}
                    title="สร้างรายการสินค้า ข้อมูลจาก Smilepharmacy"
                    style={{
                      width: '26px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isImportedDatalistPD ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: isImportedDatalistPD || isImportingDatalistPD ? 'not-allowed' : 'pointer',
                      opacity: isImportedDatalistPD ? 0.6 : 1,
                      boxShadow: '0 2px 8px rgba(62, 134, 199,0.3)', transition: 'all 0.2s ease',
                      fontSize: '12px',
                    }}
                    onMouseOver={(e) => { if (!isImportedDatalistPD) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(62, 134, 199,0.4)' } }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(62, 134, 199,0.3)' }}
                  >
                    {isImportingDatalistPD ? '⏳' : '📦'}
                  </button>
                  {/* Import Label Data */}
                  <button
                    type="button"
                    onClick={handleImportLabeldataPD}
                    disabled={isImportedLabeldataPD || isImportingLabeldataPD}
                    title="สร้างฉลากสินค้า ข้อมูลจาก Smilepharmacy"
                    style={{
                      width: '26px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isImportedLabeldataPD ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: isImportedLabeldataPD || isImportingLabeldataPD ? 'not-allowed' : 'pointer',
                      opacity: isImportedLabeldataPD ? 0.6 : 1,
                      boxShadow: '0 2px 8px rgba(62, 134, 199,0.3)', transition: 'all 0.2s ease',
                      fontSize: '12px',
                    }}
                    onMouseOver={(e) => { if (!isImportedLabeldataPD) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(62, 134, 199,0.4)' } }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(62, 134, 199,0.3)' }}
                  >
                    {isImportingLabeldataPD ? '⏳' : '🏷️'}
                  </button>
                  {/* Delete All */}
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={isDeletingAll}
                    title="ลบรายการสินค้า ทั้งหมด"
                    style={{
                      width: '26px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: isDeletingAll ? 'not-allowed' : 'pointer',
                      opacity: isDeletingAll ? 0.6 : 1,
                      boxShadow: '0 2px 8px rgba(239,68,68,0.3)', transition: 'all 0.2s ease',
                      fontSize: '12px',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.4)' }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(239,68,68,0.3)' }}
                  >
                    {isDeletingAll ? '⏳' : '🗑️'}
                  </button>
                  {/* Separator */}
                  <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }}></div>
                  {/* Import CSV */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportCSVFile}
                    accept=".csv,.xlsx,.xls"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImportingCSV}
                    title="Import ไฟล์ CSV/Excel"
                    style={{
                      width: '26px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: isImportingCSV ? 'not-allowed' : 'pointer',
                      opacity: isImportingCSV ? 0.6 : 1,
                      boxShadow: '0 2px 8px rgba(62, 134, 199,0.3)', transition: 'all 0.2s ease',
                      fontSize: '12px',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(62, 134, 199,0.4)' }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(62, 134, 199,0.3)' }}
                  >
                    {isImportingCSV ? '⏳' : '📥'}
                  </button>
                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={isExportingCSV}
                    title="Export ข้อมูลสินค้าเป็น Excel"
                    style={{
                      width: '26px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: isExportingCSV ? 'not-allowed' : 'pointer',
                      opacity: isExportingCSV ? 0.6 : 1,
                      boxShadow: '0 2px 8px rgba(139,92,246,0.3)', transition: 'all 0.2s ease',
                      fontSize: '12px',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.4)' }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,92,246,0.3)' }}
                  >
                    {isExportingCSV ? '⏳' : '📤'}
                  </button>
                  {/* Template Download */}
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    title="ดาวน์โหลด Template Excel"
                    style={{
                      width: '26px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(245,158,11,0.3)', transition: 'all 0.2s ease',
                      fontSize: '12px',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.4)' }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,158,11,0.3)' }}
                  >
                    📝
                  </button>
                </div>
                )}
              </div>
              <div className={styles.productInfoCardBody}>
                {/* Code & Barcode Row */}
                <div className={styles.productFormRow}>
                  <label className={styles.productFormLabel}>รหัสสินค้า :</label>
                  <input
                    type="text"
                    name="code"
                    value={all.code ?? ""}
                    onChange={handleInputChange}
                    className={`${styles.productFormInput} ${styles.productCodeInput}`}
                    style={{ maxWidth: '80px' }}
                    disabled={true}
                  />
                  <BarcodeS />
                  <Search_Product />
                </div>

                {/* Product Name */}
                <ProductNameS />

                {/* Generic Name */}
                <div className={styles.productFormRow} style={{ display: 'none' }}>
                  <label className={styles.productFormLabel}>ชื่อสามัญ :</label>
                  <Popover open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) FixnamePosts() }}>
                    <PopoverTrigger asChild>
                      <button
                        className={styles.productFormSelectCompact}
                        style={{
                          flex: 1, textAlign: 'left', cursor: 'pointer',
                          background: open ? '#fffde7' : 'white',
                          border: open ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                          borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px',
                          color: all.fixname ? '#1e293b' : '#94a3b8',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          height: '36px', transition: 'all 0.2s ease',
                          boxShadow: open ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                          outline: 'none',
                        }}
                        onMouseOver={(e) => { if (!open) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245,158,11,0.15)' } }}
                        onMouseOut={(e) => { if (!open) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' } }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.fixname ? 500 : 400 }}>{all.fixname || "เลือกชื่อสามัญ..."}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '400px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <Command>
                        <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาชื่อสามัญ..." style={{ fontFamily: 'Kanit' }} /></div>
                        <CommandList style={{ maxHeight: '250px' }}>
                          <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                          <CommandGroup>
                            {items.map((s) => (
                              <CommandItem key={s.value} value={s.label} onSelect={() => { setall1({ ...all, fixname: s.label }); setOpen(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.fixname === s.label ? '#f59e0b' : '#f1f5f9', border: all.fixname === s.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                  {all.fixname === s.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </span>
                                <span style={{ color: all.fixname === s.label ? '#f59e0b' : '#334155', fontWeight: all.fixname === s.label ? 600 : 400 }}>{s.label}</span>
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
                        <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหากลุ่มสินค้า..." style={{ fontFamily: 'Kanit' }} /></div>
                        <CommandList style={{ maxHeight: '250px' }}>
                          <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                          <CommandGroup>
                            {items1.map((s) => (
                              <CommandItem key={s.value} value={s.label} onSelect={() => { setall1({ ...all, group: s.label }); setOpen1(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.group === s.label ? '#f59e0b' : '#f1f5f9', border: all.group === s.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                  {all.group === s.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </span>
                                <span style={{ color: all.group === s.label ? '#f59e0b' : '#334155', fontWeight: all.group === s.label ? 600 : 400 }}>{s.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                       
                {/* Report Type & Drug Register — ซ่อนไว้ (ค่ายังถูกบันทึกตามปกติ) */}
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
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.type ? 500 : 400 }}>{all.type || "เลือกรายงาน ขย..."}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open2 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open2 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '300px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <Command>
                        <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหารายงาน ขย..." style={{ fontFamily: 'Kanit' }} /></div>
                        <CommandList style={{ maxHeight: '250px' }}>
                          <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                          <CommandGroup>
                            {items2.map((s) => (
                              <CommandItem key={s.value} value={s.label} onSelect={() => { setall1({ ...all, type: s.label }); setOpen2(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.type === s.label ? '#f59e0b' : '#f1f5f9', border: all.type === s.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                  {all.type === s.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </span>
                                <span style={{ color: all.type === s.label ? '#f59e0b' : '#334155', fontWeight: all.type === s.label ? 600 : 400 }}>{s.label}</span>
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
                    style={{ flex: 1 }}
                  />
                </div>

                {/* Subtype & Area */}
                <div className={styles.productFormRow}>
                  {/* ข.ย. (10,11,12,13) — ซ่อนไว้ (ค่ายังถูกบันทึกตามปกติ) */}
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
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.subtype ? 500 : 400 }}>{all.subtype || "เลือก ข.ย...."}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open3 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open3 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '300px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <Command>
                        <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหา ข.ย...." style={{ fontFamily: 'Kanit' }} /></div>
                        <CommandList style={{ maxHeight: '250px' }}>
                          <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                          <CommandGroup>
                            {items3.map((s) => (
                              <CommandItem key={s.value} value={s.label} onSelect={() => { setall1({ ...all, subtype: s.label }); setOpen3(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.subtype === s.label ? '#f59e0b' : '#f1f5f9', border: all.subtype === s.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                  {all.subtype === s.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </span>
                                <span style={{ color: all.subtype === s.label ? '#f59e0b' : '#334155', fontWeight: all.subtype === s.label ? 600 : 400 }}>{s.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  </div>
                  <label className={styles.productFormLabel}>พื้นที่เก็บ :</label>
                  <Popover open={open4} onOpenChange={(isOpen) => { setOpen4(isOpen); if (isOpen) AreaPosts() }}>
                    <PopoverTrigger asChild>
                      <button
                        className={styles.productFormSelectCompact}
                        style={{
                          flex: 1, textAlign: 'left', cursor: 'pointer',
                          background: open4 ? '#fffde7' : 'white',
                          border: open4 ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                          borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px',
                          color: all.Area ? '#1e293b' : '#94a3b8',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          height: '36px', transition: 'all 0.2s ease',
                          boxShadow: open4 ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                          outline: 'none',
                        }}
                        onMouseOver={(e) => { if (!open4) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245,158,11,0.15)' } }}
                        onMouseOut={(e) => { if (!open4) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' } }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.Area ? 500 : 400 }}>{all.Area || "เลือกพื้นที่เก็บ..."}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open4 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open4 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '300px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <Command>
                        <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาพื้นที่เก็บ..." style={{ fontFamily: 'Kanit' }} /></div>
                        <CommandList style={{ maxHeight: '250px' }}>
                          <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                          <CommandGroup>
                            {items4.map((s) => (
                              <CommandItem key={s.value} value={s.label} onSelect={() => { setall1({ ...all, Area: s.label }); setOpen4(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.Area === s.label ? '#f59e0b' : '#f1f5f9', border: all.Area === s.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                  {all.Area === s.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </span>
                                <span style={{ color: all.Area === s.label ? '#f59e0b' : '#334155', fontWeight: all.Area === s.label ? 600 : 400 }}>{s.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Category & Unit */}
                <div className={styles.productFormRow}>
                  <label className={styles.productFormLabel}>หมวด :</label>
                  <Popover open={open5} onOpenChange={(isOpen) => { setOpen5(isOpen); if (isOpen) GetagoryPosts() }}>
                    <PopoverTrigger asChild>
                      <button
                        className={styles.productFormSelectCompact}
                        style={{
                          maxWidth: '20%', flex: 1, textAlign: 'left', cursor: 'pointer',
                          background: open5 ? '#fffde7' : 'white',
                          border: open5 ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                          borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px',
                          color: all.Category ? '#1e293b' : '#94a3b8',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          height: '36px', transition: 'all 0.2s ease',
                          boxShadow: open5 ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                          outline: 'none',
                        }}
                        onMouseOver={(e) => { if (!open5) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245,158,11,0.15)' } }}
                        onMouseOut={(e) => { if (!open5) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' } }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.Category ? 500 : 400 }}>{all.Category || "เลือกหมวด..."}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open5 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open5 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '300px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <Command>
                        <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาหมวด..." style={{ fontFamily: 'Kanit' }} /></div>
                        <CommandList style={{ maxHeight: '250px' }}>
                          <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                          <CommandGroup>
                            {items5.map((s) => (
                              <CommandItem key={s.value} value={s.label} onSelect={() => { setall1({ ...all, Category: s.label }); setOpen5(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.Category === s.label ? '#f59e0b' : '#f1f5f9', border: all.Category === s.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                  {all.Category === s.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </span>
                                <span style={{ color: all.Category === s.label ? '#f59e0b' : '#334155', fontWeight: all.Category === s.label ? 600 : 400 }}>{s.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <label className={styles.productFormLabelSm}>หน่วยขายย่อย :</label>
                  <Popover open={open6} onOpenChange={(isOpen) => { setOpen6(isOpen); if (isOpen) UnitPosts() }}>
                    <PopoverTrigger asChild>
                      <button
                        className={styles.productFormSelectCompact}
                        style={{
                          flex: 1, textAlign: 'left', cursor: 'pointer',
                          background: open6 ? '#fffde7' : 'white',
                          border: open6 ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                          borderRadius: '8px', padding: '6px 12px', fontFamily: 'Kanit', fontSize: '14px',
                          color: all.Unit ? '#1e293b' : '#94a3b8',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          height: '36px', transition: 'all 0.2s ease',
                          boxShadow: open6 ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                          outline: 'none',
                        }}
                        onMouseOver={(e) => { if (!open6) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245,158,11,0.15)' } }}
                        onMouseOut={(e) => { if (!open6) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' } }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: all.Unit ? 500 : 400 }}>{all.Unit || "เลือกหน่วย..."}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open6 ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open6 ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" side="bottom" align="start" style={{ width: '300px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <Command>
                        <div style={{ padding: '8px 8px 0 8px' }}><CommandInput placeholder="🔍  ค้นหาหน่วย..." style={{ fontFamily: 'Kanit' }} /></div>
                        <CommandList style={{ maxHeight: '250px' }}>
                          <CommandEmpty><div style={{ padding: '16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: '13px', color: '#94a3b8' }}>ไม่พบข้อมูล</div></CommandEmpty>
                          <CommandGroup>
                            {items6.map((s) => (
                              <CommandItem key={s.value} value={s.label} onSelect={() => { setall1({ ...all, Unit: s.label }); setOpen6(false) }} style={{ fontFamily: 'Kanit', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: all.Unit === s.label ? '#f59e0b' : '#f1f5f9', border: all.Unit === s.label ? '1px solid #f59e0b' : '1px solid #e2e8f0' }}>
                                  {all.Unit === s.label && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </span>
                                <span style={{ color: all.Unit === s.label ? '#f59e0b' : '#334155', fontWeight: all.Unit === s.label ? 600 : 400 }}>{s.label}</span>
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

            {/* Pricing Card */}
            <div className={`${styles.pricingCard} ${styles.pricingCardDataCompact}`}>
              <div className={styles.pricingCardHeader}>
                <span className={styles.pricingSectionIcon} aria-hidden="true" /> ข้อมูลราคา
              </div>
              <div className={styles.pricingCardBody}>
                {/* แถว 1 — ราคาที่ใช้ขายจริงทุกวัน */}
                <div className={styles.priceRow}>
                  {canViewCost && (
                    <label className={styles.priceField} title="ราคาทุนตั้งต้นของสินค้า">
                      <span className={styles.priceFieldLabel}>ทุนตั้งต้น</span>
                      <input
                        type="text"
                        name="CostActual"
                        id="CostActual"
                        value={all.CostActual ?? ""}
                        onChange={handleInputChange}
                        className={styles.priceFieldInput}
                      />
                      <span className={styles.priceFieldUnit}>บาท</span>
                    </label>
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

                {/* แถว 4 — สวิตช์ตั้งค่าสินค้า + ปุ่มบันทึก/ล้าง อยู่บรรทัดเดียวกัน */}
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
                      onClick={() => { CreateData(), setidss({ ...codelabel, saves: "1" }) }}
                      type="button"
                      className={`${styles.pricingActionButton} ${styles.pricingSaveButton}`}
                    >บันทึก (F12)</button>
                    <button
                      onClick={() => clearData()}
                      type="button"
                      className={`${styles.pricingActionButton} ${styles.pricingClearButton}`}
                    >ล้าง</button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Column - Image & Drug Label */}
          <div>
            {/* Product Image Card */}
            <div className={styles.productImageCard}>
              <div className={styles.productImageWrapper}>
                {uploadedUrl == null ?
                  preview && (<img className={styles.productImagePreview} src={preview} alt="preview" width={95} height={95} />)
                  :
                  <img className={styles.productImagePreview} src={"/api" + String(uploadedUrl) + "?t=" + Date.now()} alt="preview" width={95} height={95} />
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
              productCode={all.code ?? ""}
              company={typeof window !== 'undefined' ? localStorage.getItem("company_") ?? "" : ""}
              subUnit={all.Unit ?? ""}
            />

            {/* Drug Label Section */}
            <div style={{ marginTop: '10px', display: 'none' }}>
              <IDSaveLabelContext.Provider value={{...codelabel, fixname: all.fixname}}>
                <SetLabel />
              </IDSaveLabelContext.Provider>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
export default CreateProductPagedata

export function useSaveContext() {
  return useContext(IDSaveLabelContext)
}
