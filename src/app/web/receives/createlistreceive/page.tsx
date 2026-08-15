'use client'

import React, { useState, useEffect, Suspense, createContext, useContext, useRef, useMemo } from 'react'

import axios from 'axios'
import HeadTab from "../../componant/headtab.jsx"
import styles from "../../componant/mystyle.module.css";
const widths = 80;
const widthsh = 100;
import { Table } from 'react-bootstrap';
import Link from "next/link";
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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  RadioGroup, Radio
} from "@heroui/react";
import InputSearch1 from './additemreceive.tsx';
import { Import, Printer, FileSpreadsheet, Download, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Toaster, toast } from "sonner";
//import { useRecContext } from '../page.tsx';
import { useMessageStore } from "./useMessageStore";
import { fetchBarcodeAliases, buildAliasesByCode, normalizeBarcode, type AliasIndexRow } from "@/lib/barcodeAliasClient";
import { isLotRequired, NO_LOT_LABEL } from "@/lib/lotPolicy";
import { UC_SELECT_PREFIX, normalizeFactor, roundUnit, type UnitConversionRow } from "@/lib/receiveUnit";
import { cachedGet } from "@/lib/catalogCache";
const apis = "receive"
const apidatalist = "datalist"
const apidataitem = "dataitemlist"
import Updateitemreceive from './updateitemreceive.tsx';
//import { console } from 'inspector';
const IDContext_RecItem = createContext<any>(undefined)



function CreateReceivePage() {

  const barcodeRef = useRef<HTMLInputElement>(null)
  const newCostRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const [idc, setidss] = useState({ idcus: "", maxRec: "", codes: "", companys: "", barcodes: "", itemcodes: "" })
  const [isFetching, setIsFetching] = useState(true)

  const setmaxRec = useMessageStore((state) => state.setmaxRec);
  const setidcus = useMessageStore((state) => state.setidcus);
  const setcodes = useMessageStore((state) => state.setcodes);
  const setcompanys = useMessageStore((state) => state.setcompanys);
  const setrcnumber = useMessageStore((state) => state.setrcnumber);

  /**************Data Company******************************/
  const initialValues = {
    company: "",
    code: "",
    codenames: "",
    names: "",
    invoice_No: "",
    order_date: "",
    receive_date: "",
    tax_date: "",
    pay_date: "",
    statuss: "",
    totalRC: "",
    vatRC: "",
    discountRC: "",
    totalRCAll: "",
    orderNo: "",
    orderfull: ""
  };



  //************************************ */
  const [all, setall1] = useState(initialValues)
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;

    setall1({
      ...all,
      [name]: value,
    });


  };

  const setcpage = useMessageStore((state) => state.setcpage);
  const cpage = useMessageStore((state) => state.cpage)
  const decimalPlaces = useMessageStore((state) => state.decimalPlaces)
  const setDecimalPlaces = useMessageStore((state) => state.setDecimalPlaces)





  //***********Get ID************************** */

  // === per-tab order context ===
  // เก็บ order ของใบรับสินค้าไว้ใน sessionStorage (แยกต่อ tab) แทน localStorage (แชร์ทุก tab)
  // seed ค่าจาก URL (?id=..&code=..) ครั้งเดียวตอน render แรก ก่อน child (add/edit) จะ mount
  // เพื่อให้เปิดหลาย order หลาย tab พร้อมกันได้โดยไม่ทับกัน
  useMemo(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const urlId = params.get('id')
    const urlCode = params.get('code')
    if (urlId) {
      sessionStorage.setItem('id_RC', urlId)
      if (urlCode !== null) sessionStorage.setItem('codeS', urlCode)
    } else if (!sessionStorage.getItem('id_RC') && localStorage.getItem('id_RC')) {
      // fallback (เข้าหน้าตรงๆ ไม่ผ่านปุ่มเพิ่ม): รับ order ล่าสุดจาก localStorage เข้ามาใน tab นี้
      sessionStorage.setItem('id_RC', localStorage.getItem('id_RC') || '')
      sessionStorage.setItem('codeS', localStorage.getItem('codeS') || '')
    }
  }, [])

  useEffect(() => {
    const isInitialLoad = cpage === "" || cpage === "1"

    const useMyHook = async () => {
      try {
        setIsFetching(true)
        // แคตตาล็อกสินค้า (fetchPosts) กับใบรับสินค้า (fetchPost) ไม่ขึ้นต่อกัน
        // ยิงขนานกัน — spinner จึงรอแค่ตัวที่ช้าที่สุด ไม่ใช่ผลรวมของทั้งสอง
        await Promise.all([fetchPosts(), fetchPost()])
        setcpage("1")

        // Focus barcode after refresh (only if not initial load)
        if (!isInitialLoad) {
          setTimeout(() => {
            barcodeRef.current?.focus()
            barcodeRef.current?.select()
          }, 200)
        }
      } catch (e) {
        console.error(e);
      }
    }

    useMyHook()
    // cpage เป็น nonce สั่งรีโหลด (ลูกตั้งเป็น "0" หรือ Date.now())
    // ค่าเริ่มต้น "" กับ "1" ที่ตั้งเองท้ายรอบนี้ ต้องนับเป็นรอบเดียวกัน
    // ไม่งั้น "" -> "1" จะเด้ง effect ซ้ำ = โหลดทุกอย่างสองรอบตอนเปิดหน้า
  }, [Number(cpage || 1)])


  //*/********suppler RC********/



  const initialValues1 = {
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
    Remark: ""
  };

  const [alldatalist, setatalist] = useState(initialValues1)
  const [dataitem, setdataitem] = useState([])
  const [totalcost, setTotalcost] = useState("")
  const [totalallrc, setTotalall] = useState(0)
  const [filterNoLot, setFilterNoLot] = useState(false)
  const [receiveConfirmed, setReceiveConfirmed] = useState(false)

  //*****************************Data List********************* */
  //***แปลงวันที่ */
  const date_receive = new Date(String(all.receive_date))




  const [iditem, setiditem] = useState('')
  const [searchname, setsearchname] = useState('')
  const [dataProduct, setdataProduct] = useState([])
  const [selectedReceiveItem, setSelectedReceiveItem] = useState<any>(null)

  const [switchdata, setswitchdata] = useState('2')
  //*** Get API Fixname */
  const [open, setOpen] = useState(false)
  const [searchP, setSearchP] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  // รายการในช่องค้นหา — หนึ่งแถวต่อ "หน่วยที่รับได้" (สินค้าหน่วยฐาน + หน่วยขายของมัน)
  type SearchOption = {
    value: string       // id ของสินค้า หรือ sentinel __UC__<id> เมื่อเป็นหน่วยขาย
    label: string
    code: string
    barcode: string
    unitLabel?: string  // ชื่อหน่วยที่จะรับ
    unitFactor?: number // จำนวนหน่วยย่อยต่อ 1 หน่วยนี้
    baseUnit?: string
    isUnit?: boolean    // true = แถวหน่วยขาย (UnitConversion)
  }
  const [items, setFixname] = useState<SearchOption[]>([]);
  const userLevel = typeof window !== 'undefined'
    ? String(localStorage.getItem('level_') || '').trim().toLowerCase()
    : ''
  const disableReceiveActions = receiveConfirmed && userLevel === 'level1'

  // บาร์โค้ดสำรอง — สินค้าตัวเดียว/หน่วยเดียว สแกนได้หลายบาร์โค้ด
  // ใช้ทั้งช่องสแกนบาร์โค้ดและช่องค้นหาชื่อสินค้าของหน้ารับสินค้า
  const [barcodeAliases, setBarcodeAliases] = useState<AliasIndexRow[]>([])
  useEffect(() => {
    const companyS = typeof window !== 'undefined' ? (localStorage.getItem("company_") || "") : ""
    if (!companyS) return
    let cancelled = false
    fetchBarcodeAliases(companyS).then((rows) => { if (!cancelled) setBarcodeAliases(rows) })
    return () => { cancelled = true }
  }, [])

  // หน่วยขาย (กล่อง/ลัง/แพ็ค) ของทั้งบริษัท — ใช้ทั้งสแกนบาร์โค้ดหน่วยขาย
  // และให้ผู้ใช้เลือกหน่วยรับจากช่องค้นหา (ดู src/lib/receiveUnit.ts)
  const [unitConversions, setUnitConversions] = useState<UnitConversionRow[]>([])
  useEffect(() => {
    const companyS = typeof window !== 'undefined' ? (localStorage.getItem("company_") || "") : ""
    if (!companyS) return
    let cancelled = false
    axios.get(`/api/unitconversion?company=${encodeURIComponent(companyS)}`)
      .then((res) => { if (!cancelled) setUnitConversions(Array.isArray(res.data) ? res.data : []) })
      .catch((err) => console.error('load unit conversions failed:', err))
    return () => { cancelled = true }
  }, [])

  const aliasesByCode = useMemo(() => buildAliasesByCode(barcodeAliases), [barcodeAliases])
  /** บาร์โค้ดสำรอง → รหัสสินค้า (ใช้แปลงบาร์โค้ดที่สแกนกลับเป็นตัวสินค้า) */
  const aliasCodeMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of barcodeAliases) {
      const b = normalizeBarcode(a?.b)
      const c = String(a?.c || "")
      if (b && c) map.set(b, c)
    }
    return map
  }, [barcodeAliases])

  /** สินค้าตามรหัส — ใช้ผูก UnitConversion.productCode กลับเป็นตัวสินค้า */
  const productByCode = useMemo(() => {
    const map = new Map<string, any>()
    for (const p of (dataProduct as any[]) || []) {
      const code = String(p?.code || "")
      if (code) map.set(code, p)
    }
    return map
  }, [dataProduct])

  /** หน่วยขายตาม id — ใช้ตอนเลือกหน่วยจากช่องค้นหา (หน่วยที่ไม่มีบาร์โค้ดก็เลือกได้) */
  const ucById = useMemo(() => {
    const map = new Map<number, UnitConversionRow>()
    for (const uc of unitConversions) if (uc?.id != null) map.set(Number(uc.id), uc)
    return map
  }, [unitConversions])

  /** หน่วยขายตามบาร์โค้ด — ใช้ตอนสแกนบาร์โค้ดที่ติดข้างกล่อง/ลัง */
  const ucByBarcode = useMemo(() => {
    const map = new Map<string, UnitConversionRow>()
    for (const uc of unitConversions) {
      const bc = normalizeBarcode(uc?.Barcode)
      if (bc) map.set(bc, uc)
    }
    return map
  }, [unitConversions])

  /**
   * ตัวเลือกในช่องค้นหา = สินค้า (หน่วยฐาน) + หน่วยขายทุกตัวของสินค้านั้น
   * ทำให้ค้นชื่อสินค้าครั้งเดียวแล้วเลือกได้เลยว่าจะรับเป็น "ขวด" หรือ "กล่อง"
   */
  const searchOptions = useMemo<SearchOption[]>(() => {
    if (unitConversions.length === 0) return items
    const byCode = new Map<string, SearchOption[]>()
    for (const uc of unitConversions) {
      const code = String(uc?.productCode || "")
      const unitLabel = String(uc?.saleUnit || "").trim()
      if (!code || !unitLabel) continue
      const product = productByCode.get(code)
      if (!product) continue
      const option: SearchOption = {
        value: `${UC_SELECT_PREFIX}${uc.id}`,
        label: String(product.ProductName || ""),
        code,
        barcode: String(uc.Barcode || "").trim(),
        unitLabel,
        unitFactor: normalizeFactor(uc.subQty),
        baseUnit: String(product.Unit || ""),
        isUnit: true,
      }
      const list = byCode.get(code)
      if (list) list.push(option)
      else byCode.set(code, [option])
    }
    if (byCode.size === 0) return items

    // แทรกหน่วยขายไว้ใต้สินค้าเจ้าของทันที เพื่อให้อ่านเป็นกลุ่มเดียวกัน
    const merged: SearchOption[] = []
    for (const item of items) {
      merged.push(item)
      const units = byCode.get(item.code)
      if (units) merged.push(...units)
    }
    return merged
  }, [items, unitConversions, productByCode])

  const filteredItems = useMemo(() => {
    const s = searchP.toLowerCase()
    if (!s) return searchOptions
    return searchOptions.filter(item =>
      item.code.toLowerCase().startsWith(s) ||
      item.label.toLowerCase().includes(s) ||
      item.barcode.toLowerCase().includes(s) ||
      (item.unitLabel || "").toLowerCase().includes(s) ||
      (aliasesByCode.get(item.code) || []).some((b) => b.toLowerCase().includes(s))
    )
  }, [searchP, searchOptions, aliasesByCode])

  /***********Get datalist*/
  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")

    try {
      // แคตตาล็อกทั้งร้าน (~4 พันแถว / ~1 MB) โหลดผ่าน cache เดียวกับที่
      // additemreceive/updateitemreceive ใช้ — เปิดหน้าหนึ่งครั้งจึงยิงจริงครั้งเดียว
      // แทนที่จะยิงซ้ำทุกครั้งที่ฟอร์มลูก mount (คลิกแถวเพื่อแก้ไข)
      const res = await cachedGet<any>(`/api/${apidatalist}?company=${companyS}&fields=receive`, { ttlMs: 120_000 })

      setatalist(res.data)
      setdataProduct(res.data)
      const items = await res.data.map((item: { id: string; ProductName: string; code: string; Barcode: string }) => ({
        value: item.id.toString(),
        label: item.ProductName,
        code: item.code || "",
        barcode: item.Barcode || ""
      }))
      setFixname(items)


      // console.log(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchPost = async () => {
    const idrc = (sessionStorage.getItem("id_RC") || "")
    const companyS = (localStorage.getItem("company_") || "")
    const codeS = (sessionStorage.getItem("codeS") || "")
    const idrcNum = Number(idrc)
    // กัน 500 (P2025 record not found): ถ้า id_RC ว่าง/ไม่ใช่จำนวนเต็มบวก ไม่ต้องยิง GET/PUT
    if (!idrc || !Number.isInteger(idrcNum) || idrcNum <= 0) {
      setIsFetching(false)
      return
    }
    try {
      const res = await axios.get(`/api/${apis}/${idrcNum}`)
      const res1 = await axios.get(`/api/${apidataitem}?company=${companyS}&codenames=${codeS}`)

      // ไม่พบใบรับตาม id — ตั้งค่า state เท่าที่มี แล้วหยุด (กัน null.vatRC และ PUT ไปยัง record ที่ไม่มี)
      if (!res.data || !res.data.id) {
        setall1(res.data)
        setdataitem(res1.data || [])
        setIsFetching(false)
        return
      }

      setall1(res.data)
      const confirmStatus = String(res.data?.confirmRecord?.status || '').trim().toLowerCase()
      const legacyReceiveStatus = String(res.data?.statuss || '').trim().toLowerCase()
      setReceiveConfirmed(confirmStatus === 'confirmed' || legacyReceiveStatus === 'confirmed')

      setdataitem(res1.data)
      setTotalcost(res1.data.reduce((a: any, b: any) => a + (Number(b.totalcost) || 0) - (Number(b.discountbaht) || 0), 0))
      setTotalall(Number(res1.data.reduce((a: any, b: any) => a + (Number(b.totalcost) || 0) - (Number(b.discountbaht) || 0), 0)) + Number(res.data.vatRC) - Number(res.data.discountRC))
      localStorage.setItem("vat", String(res.data.vatRC ?? 0))
      localStorage.setItem("dis", String(res.data.discountRC ?? 0))

      const totalRC = Number(res1.data.reduce((a: any, b: any) => a + (Number(b.totalcost) || 0) - (Number(b.discountbaht) || 0), 0))
      const vatRC = Number(res.data.vatRC)
      const discountRC = Number(res.data.discountRC)
      const totalRCAll = Number(res1.data.reduce((a: any, b: any) => a + (Number(b.totalcost) || 0) - (Number(b.discountbaht) || 0), 0)) + Number(res.data.vatRC) - Number(res.data.discountRC)
      const countorder = Number(res1.data.length)

      const EditBill = async () => {
        try {
          await axios.put(`/api/${apis}/${idrcNum}`,
            {
              totalRC, vatRC, discountRC, totalRCAll, countorder
            }

          )
        } catch (error) {
          console.error(error)
        }
      }

      EditBill()

      setIsFetching(false)

    } catch (error) {
      console.error(error)
      setIsFetching(false)
    }

  }



  const handleInputChange1 = (e: any) => {
    const { name, value } = e.target;

    setatalist({
      ...alldatalist,
      [name]: value,
    });

  };


  const [chanhepage, setchanhepage] = useState(1)


  const id_s = String(dataProduct.filter((supplier: any) => supplier.ProductName === alldatalist.ProductName).map((supplier: any) => supplier.id))
  /**
   * แปลงสิ่งที่อยู่ในช่องบาร์โค้ดให้เป็น "สินค้า + หน่วยที่จะรับ"
   * ลำดับเดียวกับฝั่งเซิร์ฟเวอร์ (src/lib/barcodeResolve.ts) เพื่อให้ผลตรงกันเสมอ:
   *   0. sentinel __UC__<id> — ผู้ใช้เลือกหน่วยขายจากช่องค้นหา (หน่วยที่ไม่มีบาร์โค้ด)
   *   1. บาร์โค้ดหลัก  (Datalist.Barcode)      → รับด้วยหน่วยฐาน
   *   2. บาร์โค้ดสำรอง (ProductBarcode)        → รับด้วยหน่วยฐาน (alias = สินค้า/หน่วยเดียวกัน)
   *   3. บาร์โค้ดหน่วยขาย (UnitConversion)     → รับด้วยหน่วยขายนั้น (กล่อง/ลัง)
   *
   * ผลลัพธ์คือ id ของสินค้า + id ของหน่วยขายเท่านั้น — ฟอร์มยังบันทึก Barcode หลัก
   * ของสินค้าลง RCitemlist ตามเดิม และแปลงจำนวนเป็นหน่วยย่อยก่อนบันทึกเสมอ
   * ยอดคงเหลือจึงคำนวณเหมือนไม่มีฟีเจอร์นี้อยู่เลย
   */
  const scanTarget = useMemo<{ productId: string; unitConversionId: number | null }>(() => {
    const none = { productId: "", unitConversionId: null }
    const raw = String(alldatalist.Barcode ?? "")
    if (!raw) return none

    // 0) เลือกหน่วยขายจากช่องค้นหา
    if (raw.startsWith(UC_SELECT_PREFIX)) {
      const uc = ucById.get(Number(raw.slice(UC_SELECT_PREFIX.length)))
      const product = uc ? productByCode.get(String(uc.productCode || "")) : null
      return product ? { productId: String(product.id), unitConversionId: Number(uc!.id) } : none
    }

    const scanned = normalizeBarcode(raw)
    if (!scanned) return none

    // 1) บาร์โค้ดหลัก
    const byPrimary = (dataProduct as any[]).find((p: any) => normalizeBarcode(p.Barcode) === scanned)
    if (byPrimary) return { productId: String(byPrimary.id), unitConversionId: null }

    // 2) บาร์โค้ดสำรอง
    const aliasCode = aliasCodeMap.get(scanned)
    if (aliasCode) {
      const product = productByCode.get(aliasCode)
      if (product) return { productId: String(product.id), unitConversionId: null }
    }

    // 3) บาร์โค้ดหน่วยขาย
    const uc = ucByBarcode.get(scanned)
    if (uc) {
      const product = productByCode.get(String(uc.productCode || ""))
      if (product) return { productId: String(product.id), unitConversionId: Number(uc.id) }
    }

    return none
  }, [dataProduct, alldatalist.Barcode, aliasCodeMap, ucById, ucByBarcode, productByCode])

  const idR_s = scanTarget.productId
  const idDatalist = switchdata === "1" ? id_s : idR_s
  const idDatalist1 = chanhepage === 3 ? String(selectedReceiveItem?.Barcode || selectedReceiveItem?.itemcode || "") : idR_s

  useEffect(() => {
    if (!idc.idcus) return
    const currentItem = dataitem.find((item: any) => String(item.id) === String(idc.idcus))
    if (currentItem) setSelectedReceiveItem(currentItem)
  }, [dataitem, idc.idcus])

  const selectReceiveItemForEdit = (item: any) => {
    const itemId = String(item?.id || "")
    setidss((current) => ({
      ...current,
      idcus: itemId,
      barcodes: String(item?.Barcode || ""),
      itemcodes: String(item?.itemcode || ""),
    }))
    setSelectedReceiveItem(item)
    setidcus(itemId)
    setchanhepage(3)
    sessionStorage.setItem("iditemS", itemId)
    sessionStorage.setItem("BarcodeS", String(item?.Barcode || ""))
  }




  const [posts, setPosts] = useState([])
  const seachNames = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apis}?company=${companyS}&names=${searchname}`)
      await setPosts(res.data)

    } catch (error) {
      console.error(error)
    }
  }





  const NameP = () => {

    return (

      <Popover open={open} onOpenChange={setOpen} >
        <PopoverTrigger asChild>
          <button onClick={() => setswitchdata("1")} className="form-control form-control-sm" style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "black", height: 40 }} >
            {chanhepage === 3 ? "คลิก ค้นหาชื่อสินค้า" : switchdata === "2" ? "คลิก ค้นหาชื่อสินค้า" : alldatalist.ProductName != undefined ? alldatalist.ProductName ?? "" : "คลิก ค้นหาชื่อสินค้า"}
          </button>

        </PopoverTrigger>
        <PopoverContent className="p-0" side="right" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="ค้นหา ชื่อ หรือ รหัสสินค้า"
              value={searchP}
              onValueChange={setSearchP}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filteredItems.slice(0, 100).map((status) => (
                  <CommandItem
                    key={status.value}
                    value={status.value}

                    onSelect={async (value) => {
                      // cmdk ส่ง value กลับมาเป็นตัวพิมพ์เล็กเสมอ — sentinel __UC__ มีตัวใหญ่ จึงต้องเทียบแบบไม่สนตัวพิมพ์
                      const selected = searchOptions.find((p) => p.value.toLowerCase() === String(value).toLowerCase())
                      if (selected) {
                        setatalist({
                          ...alldatalist,
                          ProductName: selected.label,
                          // เลือกหน่วยขาย → ส่ง sentinel เข้าช่องบาร์โค้ด (หน่วยที่ไม่มีบาร์โค้ดก็เลือกได้)
                          Barcode: selected.isUnit ? selected.value : selected.barcode
                        });
                        setswitchdata("2")
                        setSearchP("")

                        // Focus and select New Cost field
                        setTimeout(() => {
                          newCostRef.current?.focus()
                          newCostRef.current?.select()
                        }, 100)
                      }
                      setOpen(false)
                    }}
                  >

                    <div
                      className="d-flex flex-column w-100"
                      style={{
                        fontFamily: 'Kanit',
                        padding: '4px 0',
                        // แถวหน่วยขายเยื้องเข้าไป + มีเส้นซ้าย เพื่อให้เห็นว่าเป็นหน่วยของสินค้าด้านบน
                        ...(status.isUnit ? { paddingLeft: '10px', marginLeft: '6px', borderLeft: '2px solid #c7d2fe' } : {}),
                      }}
                    >
                      <div className="d-flex align-items-center mb-1" style={{ gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          background: status.isUnit ? '#eef2ff' : '#e3f2fd',
                          color: status.isUnit ? '#4338ca' : '#1565c0',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          minWidth: '60px',
                          textAlign: 'center'
                        }}>
                          {status.code}
                        </span>
                        {status.isUnit && (
                          <span style={{
                            fontSize: '11px',
                            background: '#4f46e5',
                            color: '#ffffff',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}>
                            📦 {status.unitLabel} = {roundUnit(Number(status.unitFactor) || 1)} {status.baseUnit}
                          </span>
                        )}
                        <span style={{
                          fontSize: '11px',
                          color: '#78909c',
                          flex: 1
                        }}>
                          <span style={{ color: '#b0bec5' }}>Barcode:</span> {status.barcode || '-'}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', color: status.isUnit ? '#4f46e5' : '#263238', fontWeight: 500 }}>
                        {status.label}
                      </span>
                    </div>

                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover >
    )
  }

  const Scanbarcode = () => {



    return (

      <input
        ref={barcodeRef}
        onClick={() => setswitchdata("2")}
        name='Barcode'
        // sentinel ของหน่วยขาย (__UC__id) เป็นค่าภายใน ไม่ใช่บาร์โค้ดจริง จึงไม่แสดงให้ผู้ใช้เห็น
        value={chanhepage === 3 ? "" : switchdata === "1" ? "" : String(alldatalist.Barcode ?? "").startsWith(UC_SELECT_PREFIX) ? "" : alldatalist.Barcode ?? ""}
        onChange={handleInputChange1}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            newCostRef.current?.focus()
            newCostRef.current?.select()
          }
        }}
        className="form-control form-control-sm"
        placeholder="สแกน barcode : สินค้า / สำรอง / หน่วยขาย"
        style={{ fontFamily: "Kanit", fontSize: 15, height: 40 }} />
    )

  }


  // Professional table styles
  const tableStyles = {
    cardContainer: {
      background: 'linear-gradient(145deg, #ffffff, #fafafa)',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
    },
    cardHeader: {
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      color: '#475569',
      fontFamily: 'Kanit',
      fontSize: '14px',
      fontWeight: 600,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderBottom: '1px solid #cbd5e1',
    },
    filterSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf0 100%)',
      borderBottom: '1px solid #e0e0e0',
    },
    searchButton: {
      fontFamily: 'Kanit',
      fontSize: '11px',
      padding: '6px 14px',
      borderRadius: '6px',
      border: '1px solid #90a4ae',
      background: 'linear-gradient(145deg, #ffffff, #eceff1)',
      color: '#546e7a',
      cursor: 'pointer',
    },
    addButton: {
      fontFamily: 'Kanit',
      fontSize: '11px',
      padding: '6px 14px',
      borderRadius: '6px',
      border: 'none',
      background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)',
      color: 'white',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)',
    },
    tableHeader: {
      background: '#F3F8FC',
      borderBottom: '2px solid #E5EEF8',
    },
    tableHeaderCell: {
      color: '#173F6B',
      fontFamily: 'Kanit',
      fontSize: '14px',
      fontWeight: 600,
      textAlign: 'center' as const,
      padding: '8px 6px',
      borderBottom: 'none',
    },
    tableRow: {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    tableCell: {
      fontFamily: 'Kanit',
      fontSize: '14px',
      padding: '6px 6px',
      textAlign: 'center' as const,
      verticalAlign: 'middle' as const,
    },
  };

  /* คอลัมน์ "หน่วยขาย" / "หน่วยย่อย" — จำนวนอยู่บรรทัดบน หน่วยอยู่บรรทัดล่าง */
  const stackedCell = {
    display: 'inline-flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    lineHeight: 1.15,
  };
  const stackedValue = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#37474f',
  };
  const stackedUnit = {
    fontSize: '11px',
    fontWeight: 400,
    color: '#90a4ae',
    marginTop: '1px',
  };

  // Debounced Search Logic
  const [debouncedSearch, setDebouncedSearch] = useState(searchname);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchname);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchname]);

  // นโยบาย lot ต่อรหัสสินค้า — ใช้แยก "แถวที่ลืมกรอก lot" ออกจาก
  // "สินค้าที่ตั้งค่าไม่ติดตาม lot" (แถวหลังนี้ lot ว่างโดยตั้งใจ)
  const lotPolicyByCode = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const product of (dataProduct as any[]) || []) {
      if (product?.code) map.set(String(product.code), isLotRequired(product));
    }
    return map;
  }, [dataProduct]);

  const itemLotRequired = (item: any) => lotPolicyByCode.get(String(item?.itemcode || "")) ?? true;

  const filteredDataItems = useMemo(() => {
    if (!dataitem) return [];
    return dataitem.filter((item: any) => {
      const search = (debouncedSearch || "").toLowerCase();
      const itemCode = (item.itemcode || "").toLowerCase();
      const itemName = (item.itemName || "").toLowerCase();
      const barcode = (item.Barcode || "").toLowerCase();
      const matchSearch = itemCode.includes(search) || itemName.includes(search) || barcode.includes(search);
      if (filterNoLot) {
        // สินค้าที่ตั้งค่า "ไม่มี Lot" ไม่ถือว่าตกหล่น จึงไม่ต้องขึ้นในตัวกรองนี้
        return matchSearch && itemLotRequired(item) && (!item.lot || item.lot === "");
      }
      return matchSearch;
    }).sort((a: any, b: any) => Number(a.id) - Number(b.id));
  }, [dataitem, debouncedSearch, filterNoLot, lotPolicyByCode]);







  //******Set TotatcostAll RC******* */
  const TotalallInput = (e: any) => {

    //  setTotalall(e.target.value)
    handleInputChange
  }



  // Update Data
  const toBillNumber = (value: any) => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : 0
  }

  const UpdateCus = async (nextValues: { vatRC?: string | number; discountRC?: string | number }) => {
    let idrc = (sessionStorage.getItem("id_RC") || "")

    const totalRC = toBillNumber(totalcost)
    const vatRC = toBillNumber(nextValues.vatRC ?? all.vatRC)
    const discountRC = toBillNumber(nextValues.discountRC ?? all.discountRC)
    const totalRCAll = totalRC + vatRC - discountRC
    try {
      const res = await axios.put(`/api/${apis}/${Number(idrc)}`,
        {
          totalRC, vatRC, discountRC, totalRCAll
        }

      )
      setall1({
        ...all,
        ...res.data,
        totalRC: String(totalRC),
        vatRC: String(vatRC),
        discountRC: String(discountRC),
        totalRCAll: String(totalRCAll),
      })
      setTotalall(totalRCAll)
      localStorage.setItem("vat", String(vatRC))
      localStorage.setItem("dis", String(discountRC))
    } catch (error) {
      console.error(error)
      toast.error("บันทึกยอดท้ายบิลไม่สำเร็จ")
    }
  }


  // input Vat
  const Vat_s = () => {


    const [vat, setvat] = useState("0")



    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return (

      <>
        <button
          type="button"
          style={pageStyles.footerActionButton}
          onClick={() => { onOpen(), setvat(String(all.vatRC ?? 0)) }}
        >
          {formatFooterAmount(all.vatRC)}
        </button>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior={"inside"}>
          <ModalContent className=" shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)", width: 400, height: 180 }}>
            {(onClose) => (
              <>

                <ModalBody >
                  <div style={{ width: "auto", marginTop: 15, height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>Vat :</div>
                  <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                    <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                      Vat :  </div>

                    <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                      value={vat ?? ""}
                      onChange={(e) => setvat(e.target.value)}

                    />
                    <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท
                    </div>

                  </div>


                </ModalBody>
                <ModalFooter className="d-flex border " style={{ height: 80, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                  <button
                    className="btn btn-success"

                    style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                    onClick={async () => {
                      await UpdateCus({ vatRC: vat })
                      onClose()
                    }}

                  >
                    OK
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                    onClick={onClose}
                  >
                    Close
                  </button>

                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>

    )
  }


  // input Discount
  const Discount_s = () => {

    const [discountrc, setDiscount] = useState("0")


    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return (

      <>
        <button
          type="button"
          style={{ ...pageStyles.footerActionButton, ...pageStyles.footerDiscountButton }}
          onClick={() => { onOpen(), setDiscount(String(all.discountRC ?? 0)) }}
        >
          {formatFooterAmount(all.discountRC)}
        </button>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior={"inside"}>
          <ModalContent className=" shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)", width: 400, height: 180 }}>
            {(onClose) => (
              <>

                <ModalBody >
                  <div style={{ width: "auto", marginTop: 15, height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ส่วนลดท้ายบิล :</div>
                  <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                    <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                      ส่วนลด :  </div>

                    <input className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                      value={discountrc}
                      onChange={(e) => setDiscount(e.target.value)}

                    />
                    <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท
                    </div>

                  </div>


                </ModalBody>
                <ModalFooter className="d-flex border " style={{ height: 80, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                  <button
                    className="btn btn-success"

                    style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                    onClick={async () => {
                      await UpdateCus({ discountRC: discountrc })
                      onClose()
                    }}
                  >
                    OK
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                    onClick={onClose}
                  >
                    Close
                  </button>

                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>

    )
  }

  // ============ Print Receive (A4 Portrait) ============
  const handlePrintReceive = () => {
    if (!dataitem || dataitem.length === 0) return
    const companyName = localStorage.getItem("companyname_") || "SmileStore POS"
    const sortedItems = [...dataitem].sort((a: any, b: any) => Number(a.id) - Number(b.id))
    const totalAmount = sortedItems.reduce((sum: number, item: any) => sum + (Number(item.totalcost || 0) - Number(item.discountbaht || 0)), 0)
    const vatAmount = Number(all.vatRC || 0)
    const discountAmount = Number(all.discountRC || 0)
    const grandTotal = totalAmount + vatAmount - discountAmount
    const receiveDate = new Date(String(all.receive_date))
    const receiveDateStr = `${receiveDate.getDate()}/${receiveDate.getMonth() + 1}/${receiveDate.getFullYear()}`
    const printDate = new Date()
    const printDateStr = `${printDate.getDate()}/${printDate.getMonth() + 1}/${printDate.getFullYear()} ${printDate.getHours().toString().padStart(2,'0')}:${printDate.getMinutes().toString().padStart(2,'0')}`

    const itemRows = sortedItems.map((item: any, idx: number) => {
      const expDate = item.dateExp && !isNaN(new Date(item.dateExp).getTime())
        ? `${new Date(item.dateExp).getDate()}/${new Date(item.dateExp).getMonth() + 1}/${new Date(item.dateExp).getFullYear()}`
        : '-'
      // หน่วยขายที่รับมา (กล่อง/ลัง) — แถวเก่าที่ไม่มีข้อมูลนี้เว้นเป็น "-"
      const packText = Number(item.saleFactor) > 1 && item.saleQty != null
        ? `${roundUnit(Number(item.saleQty))} ${item.saleUnit || ''}`
        : '-'
      return `<tr>
        <td style="text-align:center;padding:6px 4px;border-bottom:1px solid #e0e0e0;font-size:12px;color:#546e7a;">${idx + 1}</td>
        <td style="text-align:center;padding:6px 4px;border-bottom:1px solid #e0e0e0;font-size:12px;color:#1565c0;font-weight:600;">${item.itemcode || ''}</td>
        <td style="text-align:left;padding:6px 8px;border-bottom:1px solid #e0e0e0;font-size:12px;">${item.itemName || ''}</td>
        <td style="text-align:center;padding:6px 4px;border-bottom:1px solid #e0e0e0;font-size:11px;color:#4338ca;">${packText}</td>
        <td style="text-align:center;padding:6px 4px;border-bottom:1px solid #e0e0e0;font-size:12px;">${item.qty || 0}</td>
        <td style="text-align:center;padding:6px 4px;border-bottom:1px solid #e0e0e0;font-size:12px;">${item.unit || ''}</td>
        <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #e0e0e0;font-size:12px;">${Number(item.newCost || 0).toFixed(2)}</td>
        <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #e0e0e0;font-size:12px;">${Number(item.discountbaht || 0).toFixed(2)}</td>
        <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #e0e0e0;font-size:12px;font-weight:600;color:#1565c0;">${Number(item.totalcost || 0).toFixed(2)}</td>
        <td style="text-align:center;padding:6px 4px;border-bottom:1px solid #e0e0e0;font-size:11px;">${expDate}</td>
        <td style="text-align:center;padding:6px 4px;border-bottom:1px solid #e0e0e0;font-size:11px;">${item.lot || '-'}</td>
      </tr>`
    }).join('')

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html><html><head><title>ใบรับสินค้า RC${all.orderfull || ''}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Sarabun',sans-serif; padding:20px 30px; color:#333; }
      @page { size:A4 portrait; margin:15mm 12mm; }
      @media print { body { padding:0; } .no-print { display:none; } }
      .header-line { height:3px; background:linear-gradient(90deg,#1a237e,#1565c0,#42a5f5); margin:10px 0 16px; border-radius:2px; }
      table { width:100%; border-collapse:collapse; }
      .info-table td { padding:3px 0; font-size:13px; vertical-align:top; }
      .info-label { color:#546e7a; font-weight:500; width:120px; }
      .info-value { color:#1a237e; font-weight:600; }
      .items-header { background:#F3F8FC; }
      .items-header th { padding:8px 4px; font-size:12px; font-weight:600; color:#173F6B; border-bottom:2px solid #90caf9; }
      .total-row td { padding:8px; font-weight:700; border-top:2px solid #1565c0; }
      .sign-box { display:inline-block; width:30%; text-align:center; margin-top:50px; }
      .sign-line { border-bottom:1px dotted #999; width:160px; margin:0 auto 6px; }
      .footer-text { text-align:center; font-size:10px; color:#9e9e9e; margin-top:20px; border-top:1px solid #e0e0e0; padding-top:8px; }
    </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:22px;font-weight:700;color:#1a237e;">📦 ใบรับสินค้า</div>
          <div style="font-size:13px;color:#64748b;font-weight:500;">GOODS RECEIVED NOTE</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:16px;font-weight:700;color:#1a237e;">${companyName}</div>
          <div style="font-size:11px;color:#78909c;">SmileStore POS</div>
        </div>
      </div>
      <div class="header-line"></div>
      <div style="display:flex;gap:40px;margin-bottom:16px;">
        <table class="info-table" style="width:50%;">
          <tr><td class="info-label">เลขที่ Order :</td><td class="info-value">RC${all.orderfull || ''}</td></tr>
          <tr><td class="info-label">ผู้จำหน่าย :</td><td class="info-value" style="color:#173F6B;">${all.names || '-'}</td></tr>
          <tr><td class="info-label">เลขที่ใบสั่งซื้อ :</td><td class="info-value">${all.invoice_No || '-'}</td></tr>
        </table>
        <table class="info-table" style="width:50%;">
          <tr><td class="info-label">วันที่รับสินค้า :</td><td class="info-value">${receiveDateStr}</td></tr>
          <tr><td class="info-label">จำนวนรายการ :</td><td class="info-value">${sortedItems.length} รายการ</td></tr>
          <tr><td class="info-label">สถานะ :</td><td class="info-value" style="color:#f57c00;">${all.statuss || '-'}</td></tr>
        </table>
      </div>
      <table>
        <thead class="items-header">
          <tr>
            <th style="width:4%;text-align:center;">ลำดับ</th>
            <th style="width:9%;text-align:center;">รหัส</th>
            <th style="width:24%;text-align:left;padding-left:8px;">รายการสินค้า</th>
            <th style="width:8%;text-align:center;">หน่วยขาย</th>
            <th style="width:7%;text-align:center;">จำนวน</th>
            <th style="width:7%;text-align:center;">หน่วย</th>
            <th style="width:10%;text-align:right;padding-right:8px;">ทุนใหม่</th>
            <th style="width:9%;text-align:right;padding-right:8px;">ส่วนลด</th>
            <th style="width:10%;text-align:right;padding-right:8px;">รวมทุน</th>
            <th style="width:8%;text-align:center;">หมดอายุ</th>
            <th style="width:8%;text-align:center;">Lot</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr class="total-row" style="background:#f5f5f5;">
            <td colspan="8" style="text-align:right;padding-right:12px;font-size:13px;color:#455a64;">ยอดรวมสินค้า :</td>
            <td style="text-align:right;padding-right:8px;font-size:14px;color:#1565c0;">${totalAmount.toFixed(2)}</td>
            <td colspan="2"></td>
          </tr>
          ${vatAmount > 0 ? `<tr><td colspan="8" style="text-align:right;padding:4px 12px 4px 0;font-size:12px;color:#546e7a;">VAT :</td><td style="text-align:right;padding:4px 8px;font-size:13px;color:#333;">${vatAmount.toFixed(2)}</td><td colspan="2"></td></tr>` : ''}
          ${discountAmount > 0 ? `<tr><td colspan="8" style="text-align:right;padding:4px 12px 4px 0;font-size:12px;color:#546e7a;">ส่วนลดท้ายบิล :</td><td style="text-align:right;padding:4px 8px;font-size:13px;color:#d32f2f;">-${discountAmount.toFixed(2)}</td><td colspan="2"></td></tr>` : ''}
          <tr style="background:#e3f2fd;">
            <td colspan="8" style="text-align:right;padding:10px 12px 10px 0;font-size:14px;font-weight:700;color:#1a237e;">ยอดรวมสุทธิ :</td>
            <td style="text-align:right;padding:10px 8px;font-size:16px;font-weight:700;color:#d32f2f;">${grandTotal.toFixed(2)} บาท</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
      <div style="display:flex;justify-content:space-around;margin-top:50px;">
        <div class="sign-box"><div class="sign-line"></div><div style="font-size:12px;color:#546e7a;">ผู้ส่งสินค้า</div><div style="font-size:10px;color:#9e9e9e;">วันที่ ___/___/______</div></div>
        <div class="sign-box"><div class="sign-line"></div><div style="font-size:12px;color:#546e7a;">ผู้รับสินค้า</div><div style="font-size:10px;color:#9e9e9e;">วันที่ ___/___/______</div></div>
        <div class="sign-box"><div class="sign-line"></div><div style="font-size:12px;color:#546e7a;">ผู้ตรวจสอบ</div><div style="font-size:10px;color:#9e9e9e;">วันที่ ___/___/______</div></div>
      </div>
      <div class="footer-text">พิมพ์วันที่ ${printDateStr} | SmileStore POS</div>
    </body></html>`)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 500)
  }

  // ============ Export Excel Receive ============
  const handleExportExcelReceive = () => {
    if (!dataitem || dataitem.length === 0) return
    const sortedItems = [...dataitem].sort((a: any, b: any) => Number(a.id) - Number(b.id))
    const receiveDate = new Date(String(all.receive_date))
    const receiveDateStr = `${receiveDate.getDate()}/${receiveDate.getMonth() + 1}/${receiveDate.getFullYear()}`

    const exportData = sortedItems.map((item: any, idx: number) => {
      const expDate = item.dateExp && !isNaN(new Date(item.dateExp).getTime())
        ? `${new Date(item.dateExp).getDate()}/${new Date(item.dateExp).getMonth() + 1}/${new Date(item.dateExp).getFullYear()}`
        : ''
      return {
        'ลำดับ': idx + 1,
        'รหัสสินค้า': item.itemcode || '',
        'รายการสินค้า': item.itemName || '',
        // หน่วยขายที่รับมา (กล่อง/ลัง) — จำนวนที่เข้าสต็อกจริงอยู่คอลัมน์ จำนวน/หน่วย
        'จำนวนหน่วยขาย': item.saleQty === null || item.saleQty === undefined ? '' : roundUnit(Number(item.saleQty)),
        'หน่วยขาย': item.saleUnit || '',
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

    const totalAmount = sortedItems.reduce((sum: number, item: any) => sum + (Number(item.totalcost || 0) - Number(item.discountbaht || 0)), 0)
    exportData.push({
      'ลำดับ': '' as any,
      'รหัสสินค้า': '',
      'รายการสินค้า': '',
      'จำนวนหน่วยขาย': '' as any,
      'หน่วยขาย': '',
      'จำนวน': '' as any,
      'หน่วย': '',
      'ทุนใหม่': '' as any,
      'ส่วนลด': '' as any,
      'รวมทุน': totalAmount,
      'หมดอายุ': '',
      'Lot': '',
      'คงเหลือ': '' as any,
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    // Set column widths
    ws['!cols'] = [
      { wch: 6 }, { wch: 12 }, { wch: 40 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'รับสินค้า')
    XLSX.writeFile(wb, `ใบรับสินค้า_RC${all.orderfull || ''}_${receiveDateStr.replace(/\//g, '-')}.xlsx`)
  }

  // ============ Download Import Template ============
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'รหัสสินค้า': 'DG001',
        'รายการสินค้า': 'ตัวอย่าง - พาราเซตามอล',
        'จำนวน': 100,
        'ทุนใหม่': 25.50,
        'ส่วนลด': 0,
        'หมดอายุ': '31/12/2026',
        'Lot': 'LOT001',
        'คงเหลือ': 100,
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    ws['!cols'] = [
      { wch: 14 }, { wch: 40 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, `Template_Import_รับสินค้า.xlsx`)
  }

  // ============ Import Excel Receive ============
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset file input so the same file can be re-selected
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

      // Column header mapping (Thai → field name)
      const headerMap: Record<string, string> = {
        'รหัสสินค้า': 'itemcode',
        'รายการสินค้า': 'itemName',
        'จำนวน': 'qty',
        'หน่วย': 'unit',
        'ทุนใหม่': 'newCost',
        'ส่วนลด': 'discountbaht',
        'รวมทุน': 'totalcost',
        'หมดอายุ': 'dateExp',
        'Lot': 'lot',
        'คงเหลือ': 'balance',
        // English fallback
        'itemcode': 'itemcode',
        'itemName': 'itemName',
        'qty': 'qty',
        'unit': 'unit',
        'newCost': 'newCost',
        'discountbaht': 'discountbaht',
        'totalcost': 'totalcost',
        'dateExp': 'dateExp',
        'lot': 'lot',
        'balance': 'balance',
      }

      const companyS = localStorage.getItem('company_') || ''
      const codeS = sessionStorage.getItem('codeS') || ''
      const person = localStorage.getItem('person_') || ''
      const dateRC = all.receive_date ? new Date(all.receive_date) : new Date()

      // Parse date string (dd/mm/yyyy or yyyy-mm-dd)
      const parseDate = (val: any): Date | null => {
        if (!val) return null
        const str = String(val).trim()
        // Excel serial number
        if (!isNaN(Number(str))) {
          const excelEpoch = new Date(1899, 11, 30)
          return new Date(excelEpoch.getTime() + Number(str) * 86400000)
        }
        // dd/mm/yyyy
        const parts = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (parts) {
          return new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]))
        }
        // yyyy-mm-dd
        const iso = new Date(str)
        if (!isNaN(iso.getTime())) return iso
        return null
      }

      // Map rows to items
      const items: any[] = []
      const errors: string[] = []

      jsonData.forEach((row, idx) => {
        // Skip rows that look like the total summary row (ลำดับ column empty or ลำดับ column = '')
        const mapped: Record<string, any> = {}
        for (const [key, value] of Object.entries(row)) {
          const fieldName = headerMap[key]
          if (fieldName) mapped[fieldName] = value
        }

        // Skip empty or summary rows
        if (!mapped.itemcode && !mapped.itemName) return

        const itemcode = String(mapped.itemcode || '').trim()
        if (!itemcode) {
          errors.push(`แถวที่ ${idx + 2}: ไม่มีรหัสสินค้า`)
          return
        }

        const qty = Number(mapped.qty || 0)
        const newCost = Number(mapped.newCost || 0)
        if (qty <= 0) {
          errors.push(`แถวที่ ${idx + 2}: จำนวนต้องมากกว่า 0 (${itemcode})`)
          return
        }
        if (newCost <= 0) {
          errors.push(`แถวที่ ${idx + 2}: ทุนใหม่ต้องมากกว่า 0 (${itemcode})`)
          return
        }

        const discountbaht = Number(mapped.discountbaht || 0)
        const totalcost = mapped.totalcost ? Number(mapped.totalcost) : (qty * newCost)
        const expDate = parseDate(mapped.dateExp)
        const lot = String(mapped.lot || '').trim()
        const mappedBalance = mapped.balance !== undefined && mapped.balance !== '' ? Number(mapped.balance) : qty
        const balance = Number.isFinite(mappedBalance) && mappedBalance >= 0 && mappedBalance <= qty ? mappedBalance : qty

        items.push({
          company: companyS,
          codenames: codeS,
          itemcode,
          itemName: String(mapped.itemName || '').trim(),
          unit: String(mapped.unit || '').trim(),
          newCost,
          qty,
          totalcost,
          lot: lot || null,
          dateExp: expDate,
          freebaht: 0,
          discountbaht,
          sale: 0,
          balance,
          person,
          statuss: '',
          dateRC,
          codevender: String(all.codenames || ''),
          namevender: String(all.names || ''),
        })
      })

      if (errors.length > 0 && items.length === 0) {
        toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Import Excel ผิดพลาด</div>, {
          description: <div style={{ fontFamily: 'Kanit', fontSize: 13 }}>{errors.slice(0, 5).join(', ')}</div>,
          duration: 5000,
        })
        setImporting(false)
        return
      }

      if (items.length === 0) {
        toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Import Excel</div>, {
          description: <div style={{ fontFamily: 'Kanit', fontSize: 16 }}>ไม่พบรายการที่สามารถ Import ได้</div>,
          duration: 3000,
        })
        setImporting(false)
        return
      }

      // Fetch existing items to check for duplicates (match by itemcode + lot)
      const companyS2 = localStorage.getItem('company_') || ''
      const codeS2 = sessionStorage.getItem('codeS') || ''
      const existingRes = await axios.get(`/api/${apidataitem}?company=${companyS2}&codenames=${codeS2}`)
      const existingItems: any[] = existingRes.data || []

      // Build lookup map: key = itemcode|lot
      const existingMap = new Map<string, any>()
      existingItems.forEach((ex: any) => {
        const key = `${ex.itemcode || ''}|${ex.lot || ''}`
        existingMap.set(key, ex)
      })

      // Separate into update vs create
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

      // Update existing items
      await Promise.all(toUpdate.map(({ id, data }) =>
        axios.put(`/api/${apidataitem}/${id}`, data)
      ))

      // Create new items
      if (toCreate.length > 0) {
        await axios.post(`/api/receivelist`, toCreate)
      }

      // Refresh data
      await fetchPost()
      setcpage(String(Date.now()))

      const updatedCount = toUpdate.length
      const createdCount = toCreate.length
      const successMsg = `Import สำเร็จ: สร้างใหม่ ${createdCount}, อัพเดท ${updatedCount} รายการ`
      const warnMsg = errors.length > 0 ? ` (ข้ามข้อผิดพลาด ${errors.length} แถว)` : ''
      toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Import Excel</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 16 }}>{successMsg}{warnMsg}</div>,
        duration: 4000,
      })

    } catch (err: any) {
      console.error('Import Excel error:', err)
      toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>Import Excel ผิดพลาด</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 13 }}>{err?.message || 'เกิดข้อผิดพลาด'}</div>,
        duration: 5000,
      })
    } finally {
      setImporting(false)
    }
  }

  // ============ Delete All Items ============
  const handleDeleteAll = async () => {
    if (!dataitem || dataitem.length === 0) {
      toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>ลบทั้งหมด</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 16 }}>ไม่มีรายการสินค้า</div>,
        duration: 3000,
      })
      return
    }
    if (!confirm(`ยืนยันลบรายการสินค้าทั้งหมด ${dataitem.length} รายการ?`)) return
    try {
      const companyS = localStorage.getItem('company_') || ''
      const codeS = sessionStorage.getItem('codeS') || ''
      await axios.delete(`/api/${apidataitem}?company=${companyS}&codenames=${codeS}`)
      await fetchPost()
      setcpage(String(Date.now()))
      toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>ลบทั้งหมด</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 16 }}>ลบรายการสินค้าทั้งหมดเรียบร้อย</div>,
        duration: 3000,
      })
    } catch (err: any) {
      console.error('Delete all error:', err)
      toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>ลบทั้งหมดผิดพลาด</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 13 }}>{err?.message || 'เกิดข้อผิดพลาด'}</div>,
        duration: 5000,
      })
    }
  }

  // ============ Edit Lot Balance (คงเหลือ) ============
  const [balanceEdit, setBalanceEdit] = useState<{ item: any; value: string } | null>(null)
  const [balanceSaving, setBalanceSaving] = useState(false)

  const openBalanceEdit = (item: any) => {
    if (disableReceiveActions) return
    setBalanceEdit({ item, value: String(Number(item.balance || 0)) })
  }

  const saveBalanceEdit = async () => {
    if (!balanceEdit || balanceSaving) return
    const newBalance = Number(balanceEdit.value)
    if (!Number.isFinite(newBalance) || newBalance < 0) {
      toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>ยอดคงเหลือไม่ถูกต้อง</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 14 }}>กรุณากรอกตัวเลข 0 ขึ้นไป</div>,
        duration: 3000,
      })
      return
    }
    try {
      setBalanceSaving(true)
      // ใช้ /api/lot-edit เพราะอัพเดทเฉพาะ field ที่ส่ง (ไม่ทับ dateExp/dateRC)
      // และ sync ตัวนับขาย (sale) ให้อัตโนมัติ เพื่อให้หน้าขายเห็น lot ตามคงเหลือใหม่
      const res = await axios.put(`/api/lot-edit`, {
        lotId: Number(balanceEdit.item.id),
        balance: newBalance,
        person: localStorage.getItem('person_') || '',
      })
      const updatedSale = res.data?.data?.sale
      setdataitem((prev: any) => prev.map((it: any) =>
        Number(it.id) === Number(balanceEdit.item.id)
          ? { ...it, balance: newBalance, ...(updatedSale !== undefined ? { sale: updatedSale } : {}) }
          : it
      ))
      toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>บันทึกยอดคงเหลือ</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 14 }}>{balanceEdit.item.itemName} = {newBalance}</div>,
        duration: 2500,
      })
      setBalanceEdit(null)
    } catch (err: any) {
      console.error('Save balance error:', err)
      toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 15 }}>บันทึกยอดคงเหลือไม่สำเร็จ</div>, {
        description: <div style={{ fontFamily: 'Kanit', fontSize: 13 }}>{err?.message || 'เกิดข้อผิดพลาด'}</div>,
        duration: 4000,
      })
    } finally {
      setBalanceSaving(false)
    }
  }

  const billOrderTotal = toBillNumber(totalcost)
  const billDiscount = toBillNumber(all.discountRC)
  const billBeforeVat = billOrderTotal - billDiscount
  const billVat = toBillNumber(all.vatRC)
  const billGrandTotal = billBeforeVat + billVat

  const formatFooterAmount = (value: any) => {
    return toBillNumber(value).toLocaleString('th-TH', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })
  }

  // Professional page styles
  const pageStyles = {
    mainContainer: {
      paddingLeft: '20px',
      paddingRight: '20px',
      paddingTop: '5px',
      paddingBottom: '10px',
      backgroundColor: '#f8fafc',
    },
    contentWrapper: {
      background: 'linear-gradient(145deg, #ffffff, #fafafa)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e0e0e0',
      padding: '12px',
      marginTop: '0',
    },
    formCard: {
      background: 'linear-gradient(145deg, #ffffff, #fafafa)',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
    },
    formHeader: {
      background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)',
      color: '#1E5088',
      fontFamily: 'Kanit',
      fontSize: '14px',
      fontWeight: 600,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderBottom: '1px solid #A6C8E7',
    },
    formBody: {
      padding: '16px',
    },
    formRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
    },
    formLabel: {
      fontFamily: 'Kanit',
      fontSize: '14px',
      color: '#546e7a',
      fontWeight: 500,
      width: '120px',
      textAlign: 'right' as const,
      paddingRight: '12px',
    },
    formValue: {
      fontFamily: 'Kanit',
      fontSize: '15px',
      color: '#2A6AAA',
      fontWeight: 600,
    },
    formValueGreen: {
      fontFamily: 'Kanit',
      fontSize: '16px',
      color: '#2A6AAA',
      fontWeight: 600,
    },
    formInfoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.1fr',
      gap: '0 8px',
      marginBottom: '4px',
      padding: '0 8px',
    },
    formRowCompact: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '2px',
    },
    formLabelCompact: {
      fontFamily: 'Kanit',
      fontSize: '11px',
      color: '#546e7a',
      fontWeight: 500,
      width: '85px',
      textAlign: 'right' as const,
      paddingRight: '6px',
    },
    formValueCompact: {
      fontFamily: 'Kanit',
      fontSize: '12px',
      color: '#2A6AAA',
      fontWeight: 600,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '140px',
    },
    searchSection: {
      padding: '12px 16px',
      background: '#fafafa',
      borderTop: '1px solid #e0e0e0',
      borderRadius: '0 0 8px 8px',
    },
    // Footer styles - accounting summary bar
    footerCard: {
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '10px',
      padding: '12px 16px',
      margin: '12px 0',
      display: 'flex',
      alignItems: 'stretch',
      flexWrap: 'wrap' as const,
      gap: '10px',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      border: '1px solid #dbe4ee',
    },
    footerTitle: {
      minWidth: '110px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      padding: '4px 12px 4px 4px',
      borderRight: '1px solid #dbe4ee',
    },
    footerTitleText: {
      fontFamily: 'Kanit',
      fontSize: '14px',
      color: '#0f172a',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    footerTitleSub: {
      fontFamily: 'Kanit',
      fontSize: '10px',
      color: '#64748b',
      marginTop: '2px',
    },
    footerItem: {
      minWidth: '150px',
      flex: '1 1 150px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      gap: '5px',
      padding: '2px 4px 2px 12px',
      borderLeft: '1px solid #edf2f7',
    },
    footerValueRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      minHeight: '34px',
    },
    footerLabel: {
      fontFamily: 'Kanit',
      fontSize: '11px',
      color: '#64748b',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    footerInput: {
      fontFamily: 'Kanit',
      fontSize: '15px',
      fontWeight: 700,
      color: '#1E5088',
      background: '#ffffff',
      border: '1.5px solid #CCDFF1',
      borderRadius: '6px',
      padding: '5px 10px',
      width: '112px',
      height: '34px',
      textAlign: 'right' as const,
      boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
    },
    footerActionButton: {
      fontFamily: 'Kanit',
      fontSize: '15px',
      fontWeight: 700,
      color: '#1E5088',
      background: '#F3F8FC',
      border: '1.5px solid #A6C8E7',
      borderRadius: '6px',
      padding: '5px 10px',
      width: '112px',
      height: '34px',
      textAlign: 'right' as const,
      cursor: 'pointer',
      boxShadow: 'inset 0 1px 2px rgba(42, 106, 170, 0.08)',
    },
    footerDiscountButton: {
      color: '#b91c1c',
      background: '#fff1f2',
      borderColor: '#fecdd3',
    },
    footerUnit: {
      fontFamily: 'Kanit',
      fontSize: '11px',
      color: '#64748b',
      whiteSpace: 'nowrap' as const,
    },
    footerDecimalItem: {
      minWidth: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      paddingLeft: '10px',
      borderLeft: '1px solid #dbe4ee',
    },
  };

  return (
    <div style={pageStyles.mainContainer}>

      <div className="row justify-content-start" style={{ paddingLeft: 10 }}>
        <HeadTab />
      </div>

      {isFetching ? (
        <div style={{
          padding: '100px 24px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '16px',
          backgroundColor: 'white', borderRadius: '16px', marginTop: '20px'
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
        <>
          <div className="row justify-content-start" style={{ paddingLeft: 10 }}>
            <div className="col-sm-12">
              <div className="row" style={pageStyles.contentWrapper}>

                {/* Left - Table */}
                <div className="col-sm-7 p-2">
                  <div style={tableStyles.cardContainer}>
                    {/* Card Header */}
                    <div style={tableStyles.cardHeader}>
                      <span style={{ fontSize: '16px' }}>📦</span>
                      <span>ข้อมูล กลุ่มสินค้า</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Print Button */}
                        <button
                          onClick={handlePrintReceive}
                          title="Print"
                          style={{
                            background: 'linear-gradient(145deg, #7c3aed, #6d28d9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(124, 58, 237, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(124, 58, 237, 0.2)';
                          }}
                        >
                          <Printer size={14} />
                        </button>
                        {/* Export Excel Button */}
                        <button
                          onClick={handleExportExcelReceive}
                          title="Export Excel"
                          style={{
                            background: 'linear-gradient(145deg, #2A6AAA, #1E5088)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(42, 106, 170, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(42, 106, 170, 0.2)';
                          }}
                        >
                          <FileSpreadsheet size={14} />
                        </button>
                        {/* Import Excel Button */}
                        <button
                          onClick={() => {
                            if (disableReceiveActions) return
                            fileInputRef.current?.click()
                          }}
                          disabled={importing || disableReceiveActions}
                          title={importing ? 'กำลัง Import...' : 'Import Excel'}
                          style={{
                            background: importing
                              ? 'linear-gradient(145deg, #9ca3af, #6b7280)'
                              : 'linear-gradient(145deg, #2A6AAA, #1E5088)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: importing || disableReceiveActions ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(42, 106, 170, 0.2)',
                            opacity: importing ? 0.7 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!importing && !disableReceiveActions) {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(42, 106, 170, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(42, 106, 170, 0.2)';
                          }}
                        >
                          <Upload size={14} />
                        </button>
                        {/* Download Template Button */}
                        <button
                          onClick={handleDownloadTemplate}
                          title="Download Template"
                          style={{
                            background: 'linear-gradient(145deg, #f59e0b, #d97706)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(245, 158, 11, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.2)';
                          }}
                        >
                          <Download size={14} />
                        </button>
                        {/* Delete All Button */}
                        <button
                          onClick={() => {
                            if (disableReceiveActions) return
                            handleDeleteAll()
                          }}
                          disabled={disableReceiveActions}
                          title="ลบทั้งหมด"
                          style={{
                            background: disableReceiveActions
                              ? 'linear-gradient(145deg, #9ca3af, #6b7280)'
                              : 'linear-gradient(145deg, #ef4444, #dc2626)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: disableReceiveActions ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            if (!disableReceiveActions) {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                        {/* Hidden file input for Import */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          style={{ display: 'none' }}
                          onChange={handleImportExcel}
                        />
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontFamily: 'Kanit',
                            fontSize: '11px',
                            color: filterNoLot ? '#d32f2f' : '#546e7a',
                            fontWeight: 500,
                            background: filterNoLot ? '#ffebee' : '#f5f5f5',
                            border: filterNoLot ? '1px solid #ef9a9a' : '1px solid #e0e0e0',
                            borderRadius: '6px',
                            padding: '3px 10px',
                            transition: 'all 0.2s',
                            userSelect: 'none' as const,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={filterNoLot}
                            onChange={(e) => setFilterNoLot(e.target.checked)}
                            style={{ accentColor: '#d32f2f', width: '14px', height: '14px', cursor: 'pointer' }}
                          />
                          ไม่มี Lot
                        </label>
                        <span style={{
                          background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          boxShadow: '0 2px 4px rgba(42, 106, 170, 0.3)'
                        }}>
                          รวม {filteredDataItems.length} รายการ
                        </span>
                      </div>
                    </div>

                    {/* Filter Section */}
                    <div style={tableStyles.filterSection}>
                      <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#455a64' }}>🔍 ค้นหา :</span>
                      <input
                        value={searchname ?? ""}
                        onChange={(e) => { setsearchname(e.target.value) }}
                        className="form-control form-control-sm"
                        placeholder="พิมพ์ค้นหา..."
                        style={{ fontFamily: "Kanit", width: 170, borderRadius: '6px', fontSize: '12px' }}
                      />
                      {/* <button onClick={seachNames} type="button" style={tableStyles.searchButton}>ค้นหา</button> */}
                      <button
                        onClick={() => {
                          if (disableReceiveActions) return;
                          setchanhepage(1);
                          setSelectedReceiveItem(null);
                          setTimeout(() => {
                            barcodeRef.current?.focus()
                            barcodeRef.current?.select()
                          }, 100);
                        }}
                        type="button"
                        disabled={disableReceiveActions}
                        title={disableReceiveActions ? 'รายการนี้ยืนยันรับแล้ว ผู้ใช้ level1 ไม่สามารถเพิ่มสินค้าได้' : undefined}
                        style={{
                          ...tableStyles.addButton,
                          opacity: disableReceiveActions ? 0.55 : 1,
                          cursor: disableReceiveActions ? 'not-allowed' : 'pointer',
                          boxShadow: disableReceiveActions ? 'none' : tableStyles.addButton.boxShadow,
                        }}
                      >
                        ➕ เพิ่มสินค้า
                      </button>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto', maxHeight: 'calc(90vh - 100px)', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={tableStyles.tableHeader}>
                          <tr>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '5%' }}>ลำดับ</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '8%' }}>รหัส</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '18%', textAlign: 'left' }}>สินค้า</th>
                            {/* หน่วยขายที่รับเข้า (กล่อง/ลัง) — จำนวนที่เข้าสต็อกจริงอยู่คอลัมน์ หน่วยย่อย ถัดไป */}
                            <th style={{ ...tableStyles.tableHeaderCell, width: '9%', color: '#4338ca' }}>หน่วยขาย</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '9%' }}>หน่วยย่อย</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '9%' }}>ทุนใหม่</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '9%' }}>รวมทุน</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '7%' }}>ลดราคา</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '9%' }}>ทุนสุทธิ</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '7%' }}>คงเหลือ</th>
                            <th style={{ ...tableStyles.tableHeaderCell, width: '5%' }}>ข.ย.</th>
                            {/* Lot อยู่บรรทัดบน / วันหมดอายุอยู่บรรทัดล่าง */}
                            <th style={{ ...tableStyles.tableHeaderCell, width: '12%' }}>Lot / หมดอายุ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDataItems.map((p: any, index: number) => (
                            <tr
                              key={p.id}
                              onClick={() => selectReceiveItemForEdit(p)}
                              style={{
                                ...tableStyles.tableRow,
                                backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff',
                                borderBottom: '1px solid #e8e8e8',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(90deg, #F3F8FC, #f1f8e9)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = index % 2 === 0 ? '#fafafa' : '#ffffff';
                              }}
                            >
                              <td style={{ ...tableStyles.tableCell, color: '#78909c', fontWeight: 500 }}>{index + 1}</td>
                              <td style={{ ...tableStyles.tableCell, color: '#1565c0', fontWeight: 600 }}>{p.itemcode}</td>
                              <td style={{ ...tableStyles.tableCell, textAlign: 'left' }}>{p.itemName}</td>
                              {/* หน่วยขายที่รับมาจริง (กล่อง/ลัง) — จำนวนบน / หน่วยล่าง, แถวเก่าที่ยังไม่มีข้อมูลนี้แสดง "–" */}
                              <td
                                style={tableStyles.tableCell}
                                title={Number(p.saleFactor) > 1 ? `1 ${p.saleUnit} = ${roundUnit(Number(p.saleFactor))} ${p.unit}` : undefined}
                              >
                                {p.saleQty === null || p.saleQty === undefined
                                  ? <span style={{ color: '#cbd5e1' }}>–</span>
                                  : (
                                    <span style={stackedCell}>
                                      <span style={{ ...stackedValue, color: '#4338ca' }}>{roundUnit(Number(p.saleQty))}</span>
                                      <span style={{ ...stackedUnit, color: '#6366f1' }}>{p.saleUnit || '–'}</span>
                                    </span>
                                  )}
                              </td>
                              {/* หน่วยย่อย = จำนวนที่เข้าสต็อกจริง */}
                              <td style={tableStyles.tableCell}>
                                <span style={stackedCell}>
                                  <span style={stackedValue}>{p.qty}</span>
                                  <span style={stackedUnit}>{p.unit || '–'}</span>
                                </span>
                              </td>
                              <td style={{ ...tableStyles.tableCell, color: '#1565c0', fontWeight: 500 }}>{Number(p.newCost).toFixed(decimalPlaces)}</td>
                              <td style={{ ...tableStyles.tableCell, color: '#d32f2f', fontWeight: 600 }}>{Number(p.totalcost).toFixed(decimalPlaces)}</td>
                              <td style={tableStyles.tableCell}>{p.discountbaht}</td>
                              <td style={{ ...tableStyles.tableCell, color: '#173F6B', fontWeight: 600 }}>{(Number(p.totalcost) - Number(p.discountbaht || 0)).toFixed(decimalPlaces)}</td>
                              <td
                                title="คลิกเพื่อแก้ไขยอดคงเหลือ"
                                onClick={(e) => { e.stopPropagation(); openBalanceEdit(p) }}
                                style={{ ...tableStyles.tableCell, color: '#f57c00', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline dotted' }}
                              >{Number(p.balance || 0)}</td>
                              <td style={tableStyles.tableCell}>{p.type}</td>
                              {/* Lot บรรทัดบน / วันหมดอายุบรรทัดล่าง */}
                              <td style={tableStyles.tableCell}>
                                <span style={stackedCell}>
                                  <span style={{ ...stackedValue, fontSize: '13px' }}>
                                    {p.lot
                                      ? p.lot
                                      : (itemLotRequired(p)
                                        ? <span style={{ color: '#cbd5e1' }}>–</span>
                                        : <span style={{ fontSize: '11px', fontWeight: 400, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '1px 6px', whiteSpace: 'nowrap' }}>{NO_LOT_LABEL}</span>)}
                                  </span>
                                  <span style={stackedUnit}>
                                    {p.dateExp && !isNaN(new Date(p.dateExp).getTime())
                                      ? new Date(p.dateExp).getDate() + "/" + (new Date(p.dateExp).getMonth() + 1) + "/" + new Date(p.dateExp).getFullYear()
                                      : <span style={{ color: '#cbd5e1' }}>–</span>
                                    }
                                  </span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right - Form */}
                <div className="col-sm-5 p-2">
                  <div style={pageStyles.formCard}>
                    {/* Form Header */}
                    <div style={pageStyles.formHeader}>
                      <span style={{ fontSize: '16px' }}>{chanhepage === 1 ? "📝" : "✏️"}</span>
                      <span>{chanhepage === 1 ? "เพิ่ม " : "แก้ไข "}ข้อมูลรับสินค้า</span>
                    </div>

                    <div style={pageStyles.formBody}>
                      {/* Order Info - Two Columns */}
                      <div style={pageStyles.formInfoGrid}>
                        <div style={pageStyles.formRowCompact}>
                          <div style={pageStyles.formLabelCompact}>เลขที่ Order :</div>
                          <div style={pageStyles.formValueCompact}>RC{all.orderfull ?? ""}</div>
                        </div>
                        <div style={pageStyles.formRowCompact}>
                          <div style={pageStyles.formLabelCompact}>บริษัท :</div>
                          <div style={{ ...pageStyles.formValueCompact, color: '#173F6B' }} title={all.names ?? ""}>{all.names ?? ""}</div>
                        </div>
                        <div style={pageStyles.formRowCompact}>
                          <div style={pageStyles.formLabelCompact}>เลขที่ใบสั่งซื้อ :</div>
                          <div style={pageStyles.formValueCompact}>{all.invoice_No ?? ""}</div>
                        </div>
                        <div style={pageStyles.formRowCompact}>
                          <div style={pageStyles.formLabelCompact}>วันที่รับสินค้า :</div>
                          <div style={pageStyles.formValueCompact}>{date_receive.getDate()}/{String(date_receive.getMonth() + 1)}/{date_receive.getFullYear()}</div>
                        </div>
                      </div>

                      <div style={{ ...pageStyles.formRow, paddingLeft: '8px', marginBottom: '6px' }}>
                        <div style={{ ...pageStyles.formLabel, width: '100px', fontSize: '12px' }}>จำนวนรายการ :</div>
                        <div style={{ ...pageStyles.formValueGreen, fontSize: '13px' }}>{dataitem.length}</div>
                        <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#546e7a', marginLeft: '8px' }}>รายการ</span>
                      </div>

                      {/* Search Section */}
                      <div style={pageStyles.searchSection}>
                        <div className="d-flex" style={{ alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ fontFamily: 'Kanit', fontSize: '14px', color: '#546e7a', fontWeight: 600, width: '85px' }}>{chanhepage === 3 ? "" : "ค้นหาสินค้า :"}</div>
                          <div className="col">
                            {chanhepage === 3 ? "" : NameP()}
                          </div>
                        </div>
                        <div className="d-flex" style={{ alignItems: 'center' }}>
                          <div style={{ width: '85px' }}></div>
                          <div className="col">
                            {chanhepage === 3 ? "" : Scanbarcode()}
                          </div>
                        </div>
                      </div>

                      {/* Input Form */}
                      <IDContext_RecItem.Provider value={idc}>
                        {chanhepage === 1 ? (
                          <InputSearch1
                            data={idDatalist}
                            newCostRef={newCostRef}
                            barcodeRef={barcodeRef}
                            disabledActions={disableReceiveActions}
                            allItems={[...dataitem].sort((a: any, b: any) => Number(a.id) - Number(b.id))}
                            unitConversions={unitConversions}
                            pickedUnitId={scanTarget.unitConversionId}
                          />
                        ) : (
                          <Updateitemreceive
                            data={idDatalist1}
                            disabledActions={disableReceiveActions}
                            allItems={[...dataitem].sort((a: any, b: any) => Number(a.id) - Number(b.id))}
                            unitConversions={unitConversions}
                          />
                        )}
                      </IDContext_RecItem.Provider>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div style={pageStyles.footerCard}>
            <div style={pageStyles.footerTitle}>
              <span style={pageStyles.footerTitleText}>ยอดท้ายบิล</span>
              <span style={pageStyles.footerTitleSub}>สรุปมูลค่าเอกสาร</span>
            </div>
            <div style={pageStyles.footerItem}>
              <span style={pageStyles.footerLabel}>1. ยอดสั่งซื้อ :</span>
              <div style={pageStyles.footerValueRow}>
                <input
                  disabled
                  value={formatFooterAmount(billOrderTotal)}
                  onChange={(e) => setTotalcost(e.target.value)}
                  style={pageStyles.footerInput}
                />
                <span style={pageStyles.footerUnit}>บาท</span>
              </div>
            </div>
            <div style={pageStyles.footerItem}>
              <span style={pageStyles.footerLabel}>2. ลดท้ายบิล :</span>
              <div style={pageStyles.footerValueRow}>
                <Discount_s />
                <span style={pageStyles.footerUnit}>บาท</span>
              </div>
            </div>
            <div style={pageStyles.footerItem}>
              <span style={pageStyles.footerLabel}>3. ยอดสั่งซื้อก่อนหัก Vat :</span>
              <div style={pageStyles.footerValueRow}>
                <input
                  disabled
                  value={formatFooterAmount(billBeforeVat)}
                  style={{ ...pageStyles.footerInput, color: '#0f766e', borderColor: '#99f6e4', background: '#f0fdfa' }}
                />
                <span style={pageStyles.footerUnit}>บาท</span>
              </div>
            </div>
            <div style={pageStyles.footerItem}>
              <span style={pageStyles.footerLabel}>4. หัก Vat :</span>
              <div style={pageStyles.footerValueRow}>
                <Vat_s />
                <span style={pageStyles.footerUnit}>บาท</span>
              </div>
            </div>
            <div style={{ ...pageStyles.footerItem, minWidth: '165px' }}>
              <span style={{ ...pageStyles.footerLabel, color: '#991b1b', fontWeight: 700 }}>5. รวมยอดสุทธิ :</span>
              <div style={pageStyles.footerValueRow}>
                <input
                  disabled
                  value={formatFooterAmount(billGrandTotal)}
                  onChange={TotalallInput}
                  style={{ ...pageStyles.footerInput, color: '#dc2626', borderColor: '#fecaca', background: '#fff7ed', width: '122px' }}
                />
                <span style={pageStyles.footerUnit}>บาท</span>
              </div>
            </div>
            <div style={pageStyles.footerDecimalItem}>
              <span style={pageStyles.footerLabel}>ทศนิยม :</span>
              <select
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                style={{ fontFamily: 'Kanit', fontSize: '14px', fontWeight: 600, width: '55px', height: '34px', textAlign: 'center', borderRadius: '6px', border: '1.5px solid #7c3aed', color: '#7c3aed', background: '#f5f3ff', cursor: 'pointer', outline: 'none' }}
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
              <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#6b7280' }}>ตำแหน่ง</span>
            </div>
          </div>

          {/* Modal แก้ไขยอดคงเหลือ */}
          <Modal isOpen={!!balanceEdit} onOpenChange={(open) => { if (!open) setBalanceEdit(null) }} scrollBehavior={"inside"}>
            <ModalContent className=" shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)", width: 400, height: 215 }}>
              {(onClose) => (
                <>
                  <ModalBody >
                    <div style={{ marginTop: 15, fontSize: 14, fontFamily: "Kanit_B" }}>
                      แก้ไขยอดคงเหลือ {balanceEdit?.item?.lot ? `(Lot ${balanceEdit.item.lot})` : ''}
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "Kanit", color: '#546e7a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {balanceEdit?.item?.itemName ?? ''}
                    </div>
                    <div className="d-flex" style={{ alignItems: 'center', height: 40 }}>
                      <div style={{ fontSize: 16, fontFamily: "Kanit" }}>คงเหลือ :</div>
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        className="form-control form-control-sm"
                        style={{ width: 90, marginLeft: 10, marginRight: 10, height: 30, fontSize: 18, fontFamily: "Kanit_B", textAlign: 'center' }}
                        value={balanceEdit?.value ?? ''}
                        onChange={(e) => setBalanceEdit((cur) => cur ? { ...cur, value: e.target.value } : cur)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveBalanceEdit()
                          }
                        }}
                      />
                      <div style={{ fontSize: 15, fontFamily: "Kanit", color: '#546e7a' }}>{balanceEdit?.item?.unit ?? ''}</div>
                    </div>
                  </ModalBody>
                  <ModalFooter className="d-flex border " style={{ height: 70, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                    <button
                      className="btn btn-success"
                      disabled={balanceSaving}
                      style={{ width: 90, height: 35, fontSize: 16, fontFamily: "Kanit" }}
                      onClick={saveBalanceEdit}
                    >
                      {balanceSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ width: 80, height: 35, fontSize: 16, fontFamily: "Kanit" }}
                      onClick={onClose}
                    >
                      ยกเลิก
                    </button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      )}
    </div>
  )
}

export default CreateReceivePage
