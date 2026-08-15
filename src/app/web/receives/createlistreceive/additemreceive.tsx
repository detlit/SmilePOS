'use client'

import React, { useState, useEffect, useMemo, Suspense, createContext, useContext, useRef, forwardRef } from 'react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
import { Toaster, toast } from "sonner"
import { Save, TrendingUp } from "lucide-react"
import ReceiveUnitPicker from "./ReceiveUnitPicker"

const apis = "receive"
const apidatalist = "datalist"
const apidataitemlist = "dataitemlist"
import { enableFullscreen } from "@/lib/fullscreen";
import { useMessageStore } from "./useMessageStore";
import { fetchCostPriceMode, getCachedCostPriceMode, costPriceModeLabel, type CostPriceMode } from "@/lib/costPriceMode";
import { isLotRequired, NO_LOT_VALUE, NO_LOT_LABEL } from "@/lib/lotPolicy";
import { computeNetCostOrNull } from "@/lib/lotCost";
import { cachedGet, patchCatalogById } from "@/lib/catalogCache";
import {
  BASE_UNIT_KEY,
  buildReceiveQuantities,
  buildUnitOptions,
  findUnitOption,
  reinterpretOnUnitChange,
  roundUnit,
  toBaseCost,
  toUnitCost,
  type ReceiveUnitOption,
  type UnitConversionRow,
} from "@/lib/receiveUnit";

const CustomDateInput = forwardRef(({ value, onClick, onChange, onFocus, onKeyDown, style, placeholder, externalRef, disabled }: any, ref: any) => (
  <input
    value={value}
    onClick={onClick}
    onChange={onChange}
    onFocus={(e) => {
      onFocus?.(e);
      e.target.select();
    }}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    ref={(node) => {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;

      if (typeof externalRef === 'function') externalRef(node);
      else if (externalRef) externalRef.current = node;
    }}
    disabled={disabled}
    style={style}
  />
));

function InputSearch1({
  data,
  newCostRef: externalNewCostRef,
  barcodeRef,
  disabledActions = false,
  allItems = [],
  unitConversions = [],
  pickedUnitId = null,
}: {
  data: any,
  newCostRef?: React.RefObject<HTMLInputElement | null>,
  barcodeRef?: React.RefObject<HTMLInputElement | null>,
  disabledActions?: boolean,
  allItems?: any[],
  /** หน่วยขายทั้งบริษัท (ส่งมาจากหน้าแม่ — โหลดครั้งเดียว) */
  unitConversions?: UnitConversionRow[],
  /** หน่วยขายที่สแกน/เลือกมา (null = รับด้วยหน่วยฐาน) */
  pickedUnitId?: number | null,
}) {

  const idF = Number(data)

  const internalNewCostRef = useRef<HTMLInputElement>(null)
  const newCostRef = externalNewCostRef || internalNewCostRef
  const qtyRef = useRef<HTMLInputElement>(null)
  const lotRef = useRef<HTMLInputElement>(null)
  const dateExpRef = useRef<HTMLInputElement>(null)
  const saveBtnRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef.current?.focus()
      if (nextRef.current instanceof HTMLInputElement) {
        nextRef.current.select()
      }
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  console.log(idF)

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
    orderNo: "",
    orderfull: ""
  };




  //************************************ */
  const [all, setall1] = useState(initialValues)

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

  const initialValues2 = {
    company: "",
    codenames: "",
    itemcode: "",
    itemName: "",
    unit: "",
    createDate: "",
    newCost: "",
    qty: "",
    totalcost: "",
    lot: "",
    dateExp: "",
    freebaht: "",
    discountbaht: "",
    sale: "",
    balance: "",
    person: "",
    statuss: "",
  };


  const [alldatalist, setatalist] = useState(initialValues1)


  const [dataProduct, setdataProduct] = useState([])

  //*** Get API Fixname */
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);



  useEffect(() => {
    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        // แคตตาล็อกก้อนเดียวกับหน้าแม่ — ผ่าน cache เพื่อไม่ให้ทุกครั้งที่ฟอร์มนี้ mount
        // ต้องดาวน์โหลดสินค้าทั้งร้านซ้ำ (แก้ค่าทุน/ราคาแล้ว patch cache ไว้ให้ตรง)
        const res = await cachedGet<any>(`/api/${apidatalist}?company=${companyS}&fields=receive`, { ttlMs: 120_000 })
        const items = await res.data.map((item: { id: string; ProductName: string }) => ({ value: item.id, label: item.ProductName }))

        setatalist(res.data)
        setdataProduct(res.data)
        setFixname(items)


        // console.log(res.data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchPosts()


  }, [])




  const [allitemlist, setitemlist] = useState(initialValues2)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [targetPosition, setTargetPosition] = useState<number>(allItems.length + 1)
  const [editPrice, setEditPrice] = useState<string>("")

  useEffect(() => {
    setTargetPosition(allItems.length + 1)
  }, [allItems.length])
  const [savingPrice, setSavingPrice] = useState(false)
  const [latestRCCost, setLatestRCCost] = useState<number | null>(null)
  const [averageRCCost, setAverageRCCost] = useState<number | null>(null)
  const [costPriceMode, setCostPriceMode] = useState<CostPriceMode>(getCachedCostPriceMode())
  // ราคาทุนอ้างอิงตามโหมด: ทุนล่าสุด (ค่าเริ่มต้น) หรือ ทุนเฉลี่ย
  const refRCCost: number | null = (costPriceMode === 'average' && averageRCCost !== null) ? averageRCCost : latestRCCost


  // ผู้ใช้แก้ "ราคาทุนใหม่" เองแล้วหรือยัง — ถ้าแก้แล้วจะไม่เอาค่า default ทับ
  const newCostTouchedRef = useRef(false)
  // กัน validateNewCost ยิงซ้ำ: Enter ตรวจแล้ว → โฟกัสช่องถัดไปทำให้เกิด blur → ตรวจซ้ำ
  const skipNextBlurValidateRef = useRef(false)

  const handleInputChange2 = (e: any) => {
    const { name, value } = e.target;

    if (name === 'newCost') newCostTouchedRef.current = true

    setitemlist({
      ...allitemlist,
      [name]: value,
    });

  };



  // สินค้าที่กำลังรับเข้า + นโยบาย lot ของสินค้าตัวนั้น
  // (สินค้าที่ยังไม่ได้เลือก/หาไม่เจอ ให้ถือว่าต้องมี lot ไว้ก่อน)
  const selectedProduct: any = (dataProduct as any[]).find((p: any) => p.id === idF) || null
  const lotRequired = isLotRequired(selectedProduct)

  // ══ หน่วยรับ: รับเป็นกล่อง/ลังได้ แต่เก็บลงสต็อกเป็นหน่วยย่อยเสมอ ══
  // ทุกช่องกรอกในฟอร์มนี้ (จำนวนรับ · ราคาทุนใหม่ · จำนวนแถม) อยู่ใน "หน่วยที่เลือก"
  // แล้วแปลงเป็นหน่วยย่อยครั้งเดียวตอนกดบันทึก — ดู src/lib/receiveUnit.ts
  const unitOptions = useMemo(
    () => buildUnitOptions(selectedProduct, unitConversions),
    [selectedProduct, unitConversions]
  )
  const [unitKey, setUnitKey] = useState<string>(BASE_UNIT_KEY)
  const selectedUnit: ReceiveUnitOption = findUnitOption(unitOptions, unitKey)
  const unitFactor = selectedUnit.factor
  const isPackUnit = unitFactor !== 1

  // สแกน/เลือกใหม่ → ใช้หน่วยที่สแกนมา (บาร์โค้ดกล่อง = รับเป็นกล่อง)
  // ตั้งใจไม่ใส่ unitOptions ใน deps: รายการหน่วยถูกสร้างใหม่ทุกครั้งที่ catalog อัปเดต
  // ถ้าใส่ไปการเลือกหน่วยเองของผู้ใช้จะถูกรีเซ็ตทิ้งกลางคัน
  useEffect(() => {
    setUnitKey(pickedUnitId != null ? String(pickedUnitId) : BASE_UNIT_KEY)
  }, [idF, pickedUnitId])

  /** ผู้ใช้สลับหน่วยเอง — คงปริมาณ/มูลค่าจริงไว้ (2 กล่อง ⇄ 24 ขวด, 267/กล่อง ⇄ 22.25/ขวด) */
  const handleUnitChange = (nextKey: string) => {
    const fromFactor = selectedUnit.factor
    const toFactor = findUnitOption(unitOptions, nextKey).factor
    setUnitKey(nextKey)
    if (fromFactor === toFactor) return
    setitemlist((prev) => ({
      ...prev,
      qty: reinterpretOnUnitChange(prev.qty, fromFactor, toFactor, "qty"),
      newCost: reinterpretOnUnitChange(prev.newCost, fromFactor, toFactor, "cost"),
      freebaht: reinterpretOnUnitChange(prev.freebaht, fromFactor, toFactor, "qty"),
    }))
  }

  // ปิดโหมด lot อยู่ → ล้างค่า lot/วันหมดอายุที่ค้างจากสินค้าตัวก่อน ไม่ให้หลุดลงแถวรับเข้า
  useEffect(() => {
    if (lotRequired) return
    setitemlist(prev => (prev.lot || prev.dateExp) ? { ...prev, lot: "", dateExp: "" } : prev)
  }, [lotRequired])

  const code_s = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.code))
  const productName_s = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.ProductName))
  const unit_s = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.Unit))
  const priceA_s = editPrice !== "" ? editPrice : String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.price))
  const costAct_s = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.CostActual))

  // reset editPrice เมื่อเปลี่ยนสินค้า
  useEffect(() => { setEditPrice("") }, [idF])

  const handleSavePrice = async (showToast = true) => {
    if (!idF || editPrice === "" || disabledActions) return true
    setSavingPrice(true)
    try {
      const nextPrice = parseFloat(editPrice) || 0
      await axios.put(`/api/${apidatalist}/${idF}`, { price: nextPrice })
      setdataProduct((prev: any) => prev.map((p: any) => p.id === idF ? { ...p, price: nextPrice } : p))
      patchCatalogById(apidatalist, idF, { price: nextPrice })
      setEditPrice("")
      if (showToast) toast.success("บันทึกราคาขายเรียบร้อย", { style: { fontFamily: "Kanit" } })
      return true
    } catch (error) {
      console.error(error)
      toast.error("บันทึกราคาขายไม่สำเร็จ", { style: { fontFamily: "Kanit" } })
      return false
    } finally {
      setSavingPrice(false)
    }
  }
  const Baecode_s = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.Barcode))
  const type_s = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.type))
  const subtype_s = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.subtype))

  useEffect(() => {
    if (code_s && code_s !== "undefined" && code_s !== "") {
      fetchBalance(code_s)
      fetchLatestRCCost(code_s)
    } else {
      // สแกน/ค้นหาไม่เจอสินค้า → ล้างค่าคงเหลือ/ทุนล่าสุดที่ค้างจากสินค้าก่อนหน้า
      setBalance(0)
      setLatestRCCost(null)
    }
  }, [code_s])

  // เปลี่ยนสินค้าใหม่/สแกนหน่วยใหม่ → อนุญาตให้เติมค่า default ทุนล่าสุดอีกครั้ง
  useEffect(() => { newCostTouchedRef.current = false }, [idF, pickedUnitId])

  // Default "ราคาทุนใหม่" = ทุนล่าสุด (latestRCCost หรือ CostActual) เมื่อสแกน/ค้นหาสินค้า
  // แล้ว focus + select ให้พิมพ์ทับเปลี่ยนราคาได้ทันที (ไม่ทับค่าที่ผู้ใช้กรอกเอง)
  // ทุนล่าสุดเก็บเป็น "ทุนต่อหน่วยย่อย" จึงต้องคูณกลับเป็นทุนต่อหน่วยที่กำลังรับ
  // (รับเป็นกล่องละ 12 → เสนอราคาทุนต่อกล่อง ไม่ใช่ต่อขวด)
  useEffect(() => {
    if (!idF || newCostTouchedRef.current) return
    const latestBase = refRCCost !== null ? Number(refRCCost) : Number(costAct_s)
    if (!Number.isFinite(latestBase) || latestBase <= 0) return
    // ปัด 4 ตำแหน่งกันเศษลอยจากการคูณกลับ (18.333333 × 6 = 109.999998 → 110)
    const displayLatest = roundUnit(toUnitCost(latestBase, unitFactor), 4)
    if (String(allitemlist.newCost) === String(displayLatest)) return
    setitemlist(prev => ({ ...prev, newCost: String(displayLatest) }))
    setTimeout(() => {
      newCostRef.current?.focus()
      newCostRef.current?.select()
    }, 60)
  }, [idF, refRCCost, costAct_s, allitemlist.newCost, unitFactor])

  // ตรวจสอบ "ราคาทุนใหม่" ที่ผู้ใช้กรอก
  //  1) ทุนใหม่ > ราคาขาย  → ข้อมูลไม่ถูกต้อง แล้วรีเซ็ตกลับเป็นทุนล่าสุด
  //  2) ทุนใหม่ สูงกว่าทุนล่าสุด เกิน 5% → เตือน (คงค่าที่กรอกไว้)
  // return false = ไม่ผ่าน (case 1), true = ผ่าน/เตือนเฉย ๆ
  const validateNewCost = () => {
    // เทียบกันที่ "หน่วยย่อย" เสมอ เพราะราคาขาย/ทุนล่าสุดเป็นราคาต่อหน่วยย่อย
    // (ถ้าเทียบทุนต่อกล่องกับราคาขายต่อขวด จะเตือนผิดทุกครั้งที่รับเป็นกล่อง)
    const newCostVal = toBaseCost(allitemlist.newCost, unitFactor)
    if (!Number.isFinite(newCostVal) || newCostVal <= 0) return true

    const sellingPrice = Number(priceA_s)
    const latestCost = refRCCost !== null ? Number(refRCCost) : Number(costAct_s)

    // 1) ราคาทุนใหม่ มากกว่า ราคาขาย
    if (sellingPrice > 0 && newCostVal > sellingPrice) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ข้อมูลไม่ถูกต้อง</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 18 }}>ราคาทุนใหม่มากกว่าราคาขาย</div>,
        duration: 3000,
      })
      // แสดงราคาทุนล่าสุดเหมือนเดิม (แปลงกลับเป็นทุนต่อหน่วยที่กำลังรับ)
      setitemlist(prev => ({
        ...prev,
        newCost: Number.isFinite(latestCost) && latestCost > 0 ? String(roundUnit(toUnitCost(latestCost, unitFactor), 4)) : "",
      }))
      setTimeout(() => {
        newCostRef.current?.focus()
        newCostRef.current?.select()
      }, 50)
      return false
    }

    // 2) ราคาทุนใหม่ สูงกว่าทุนล่าสุด เกิน 5%
    if (Number.isFinite(latestCost) && latestCost > 0 && newCostVal > latestCost * 1.05) {
      const pct = (((newCostVal - latestCost) / latestCost) * 100).toFixed(1)
      toast.warning(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>แจ้งเตือน</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 18 }}>ราคาทุนเพิ่มสูงขึ้นจากทุนล่าสุด มากกว่า 5% ({pct}%)</div>,
        duration: 4000,
      })
    }

    return true
  }







  //***********Get ID**ฑฉ************************ */

  useEffect(() => {

    const useMyHook = async () => {
      try {

        await fetchPost()



      } catch (e) {
        console.error(e);
      }
    }

    useMyHook()
  }, [])

  //*/********suppler RC********/
  const fetchPost = async () => {
    let idrc = (sessionStorage.getItem("id_RC") || "")
    try {
      const res = await axios.get(`/api/${apis}/${Number(idrc)}`)

      setall1(res.data)

      setTimeout(() => {
        barcodeRef?.current?.focus()
        barcodeRef?.current?.select()
      }, 100)
    } catch (error) {
      console.error(error)
    }

  }

  const fetchBalance = async (code: string) => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const idQuery = idF ? `&id=${idF}` : ''
      const res = await axios.get(`/api/sale_cal/sale_balance?company=${companyS}&code_product=${code}${idQuery}`)
      if (res.data && res.data[0]) {
        setBalance(res.data[0].balance)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchLatestRCCost = async (code: string) => {
    let companyS = (localStorage.getItem("company_") || "")
    fetchCostPriceMode(companyS).then(setCostPriceMode)
    try {
      const res = await axios.get(`/api/sale_cal/latest_receive_cost?company=${companyS}&itemcode=${code}`)
      if (res.data && res.data.newCost !== null) {
        setLatestRCCost(res.data.newCost)
      } else {
        setLatestRCCost(null)
      }
      const avg = res.data?.averageCost
      setAverageRCCost(avg === null || avg === undefined ? null : Number(avg))
    } catch (error) {
      console.error('Error fetching latest receive cost:', error)
    }
  }



  //************************************ */
  const CreateCus = async () => {
    try {

      setitemlist(initialValues2);

    } catch (error) {
      console.error(error)
    }

  }


  const setcpage = useMessageStore((state) => state.setcpage);
  const cpage = useMessageStore((state) => state.cpage)
  const decimalPlaces = useMessageStore((state) => state.decimalPlaces)

  const AlertComplete = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะสินค้า</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };

  const AlertWarning = () => {
    toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> กรุณากรอกข้อมูลรับสินค้า ให้ครบถ้วนค่ะ</div>,
      duration: 3000,
    });
  };

  // Post Data
  const CleckSubmit = async (e: any) => {
    e.preventDefault();
    if (loading) return;
    if (disabledActions) return;

    // Lot/วันหมดอายุ บังคับกรอกเฉพาะสินค้าที่ตั้งค่า "สินค้า lot" ไว้เท่านั้น
    if (!allitemlist.newCost || !allitemlist.qty || (lotRequired && (!allitemlist.lot || !allitemlist.dateExp))) {
      AlertWarning();
      return;
    }

    setLoading(true);

    let companyS = (localStorage.getItem("company_") || "")
    const company = companyS
    const codenames = all.orderfull
    const itemcode = code_s
    const itemName = productName_s
    // จุดแปลงหน่วยจุดเดียวของฟอร์ม: สิ่งที่ผู้ใช้กรอก (หน่วยขาย) → หน่วยย่อยที่เข้าสต็อก
    // unit ต้องเป็นหน่วยฐานของสินค้าเสมอ ห้ามเขียนชื่อหน่วยขายลงไป
    // ไม่งั้นยอดคงเหลือ/FEFO จะจับกลุ่มผิด (เหตุผลเต็ม: src/lib/receiveUnit.ts)
    const unit = unit_s
    const packed = buildReceiveQuantities({
      qtyInUnit: allitemlist.qty,
      costPerUnit: allitemlist.newCost,
      freeInUnit: allitemlist.freebaht,
      option: selectedUnit,
    })
    const newCost = packed.newCost
    const qty = packed.qty
    // ทุนรวม (gross) = ทุนใหม่ × จำนวน (ก่อนหักส่วนลด) — ส่วนลดอยู่ที่ช่องทุนสุทธิ
    const totalcost = packed.totalcost
    // สินค้าไม่ใช้ lot → เก็บ lot เป็นค่าว่าง และไม่มีวันหมดอายุ (ดู src/lib/lotPolicy.ts)
    const lot = lotRequired ? allitemlist.lot : NO_LOT_VALUE
    // ยังไม่กรอกวันรับสินค้า → ส่ง null ให้ API ไป fallback เป็นวันรับของหัวบิลเอง
    // (ห้าม new Date("") เพราะได้ Invalid Date → ถูกบันทึกเป็น NULL แล้วรายงานมองไม่เห็น)
    const dateRC = all.receive_date ? new Date(all.receive_date) : null
    const dateExp = lotRequired && allitemlist.dateExp ? new Date(allitemlist.dateExp) : null
    // ของแถมแปลงด้วยตัวคูณเดียวกัน (แถม 1 กล่อง = 12 ขวดเข้าสต็อก)
    const freebaht = packed.freebaht
    const discountbaht = Number(allitemlist.discountbaht)
    // sale = ตัวนับจำนวนที่ขายไปแล้วของ lot นี้ ต้องเริ่มที่ 0 (ห้ามใส่ราคาขาย ไม่งั้นหน้าขายมองว่า lot ขายหมดแล้ว)
    const sale = 0
    // จำนวนเข้าสต็อกจริง = จำนวนรับ + ของแถม (freebaht) — หน่วยย่อยทั้งคู่
    const balance = packed.balance
    // ที่มาของจำนวน: รับมากี่ "หน่วยขาย" — ไว้แสดง/ตรวจสอบย้อนหลังเท่านั้น
    const saleQty = packed.saleQty
    const saleUnit = packed.saleUnit
    const saleFactor = packed.saleFactor
    const Barcode = Baecode_s
    const type = type_s
    const subtype = subtype_s
    const person = ""
    const statuss = ""
    const codevender = String(all.codenames)
    const namevender = String(all.names)

    try {
      const priceSaved = await handleSavePrice(false)
      if (!priceSaved) return

      const res = await axios.post(`/api/${apidataitemlist}`,
        {
          company, codenames, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateExp, freebaht, discountbaht, Barcode, type, subtype, person, statuss, dateRC, sale, balance, codevender, namevender, saleQty, saleUnit, saleFactor
        }
      )

      // อัปเดต "ทุนตั้งต้น" (CostActual) ในข้อมูลสินค้าให้ตรงกับราคาทุนใหม่ที่รับเข้า
      // ต้องเป็น "ทุนสุทธิหลังหักส่วนลด" ให้ตรงกับที่หน้าขายใช้ (src/lib/lotCost.ts)
      // ไม่งั้นสินค้าที่หา lot ไม่เจอจะเด้งกลับไปใช้ทุนก่อนหักส่วนลดแบบเงียบ ๆ
      const costActual = computeNetCostOrNull({ newCost, qty, totalcost, discountbaht, freebaht }) ?? newCost
      if (idF && newCost > 0) {
        try {
          // ส่ง memberDiscountEligible เดิมไปด้วย เพราะ PUT นี้จะ reset เป็น true ถ้าไม่ส่งค่ามา
          const currentProduct = dataProduct.find((p: any) => p.id === idF) as any
          await axios.put(`/api/${apidatalist}/${idF}`, {
            CostActual: costActual,
            memberDiscountEligible: currentProduct?.memberDiscountEligible,
          })
          setdataProduct((prev: any) => prev.map((p: any) => p.id === idF ? { ...p, CostActual: costActual } : p))
          patchCatalogById(apidatalist, idF, { CostActual: costActual })
        } catch (err) {
          console.error('update CostActual failed:', err)
        }
      }

      // Reorder if not adding at the end
      const newItemId = res.data?.id
      const isLastPosition = targetPosition >= allItems.length + 1
      if (newItemId && !isLastPosition) {
        try {
          const codeS = sessionStorage.getItem("codeS") || ""
          await axios.post('/api/dataitemlist/reorder', {
            company,
            codenames: codeS,
            fromId: Number(newItemId),
            toPosition: targetPosition,
          })
        } catch (err) {
          console.error('reorder after add failed:', err)
        }
      }

      setcpage(String(Date.now()))
      setitemlist(initialValues2);
      AlertComplete()
      fetchPost()

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false);
    }
  }

  // Professional form styles - 20% more compact
  const formStyles = {
    container: {
      padding: '8px 0',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
    },
    label: {
      fontFamily: 'Kanit',
      fontSize: '14px',
      color: '#546e7a',
      textAlign: 'right' as const,
      width: '110px',
      paddingRight: '12px',
      fontWeight: 500,
    },
    value: {
      fontFamily: 'Kanit',
      fontSize: '15px',
      color: '#2A6AAA',
      fontWeight: 600,
    },
    input: {
      fontFamily: 'Kanit',
      fontSize: '15px',
      color: '#2A6AAA',
      textAlign: 'center' as const,
      borderRadius: '6px',
      border: '1px solid #cfd8dc',
      padding: '4px 8px',
      height: '35px',
      transition: 'border-color 0.2s ease',
    },
    inputSmall: {
      width: '65px',
    },
    inputMedium: {
      width: '120px',
    },
    unit: {
      fontFamily: 'Kanit',
      fontSize: '13px',
      color: '#78909c',
      marginLeft: '5px',
      width: '50px',
    },
    productName: {
      fontFamily: 'Kanit_B',
      fontSize: '16px',
      color: '#2A6AAA',
      fontWeight: 600,
      marginLeft: '12px',
    },
    divider: {
      borderTop: '1px solid #e0e0e0',
      margin: '10px 0',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      marginTop: '12px',
    },
    saveButton: {
      fontFamily: 'Kanit_B',
      fontSize: '14px',
      padding: '8px 24px',
      borderRadius: '8px',
      border: 'none',
      background: 'linear-gradient(135deg, #2A6AAA, #3E86C7)',
      color: 'white',
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(42, 106, 170, 0.2)',
      fontWeight: 600,
    },
    clearButton: {
      fontFamily: 'Kanit',
      fontSize: '14px',
      padding: '8px 20px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
      color: '#64748b',
      cursor: 'pointer',
    },
    backButton: {
      fontFamily: 'Kanit',
      fontSize: '14px',
      padding: '8px 20px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
      color: '#64748b',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
    },
  };

  const disabledInputStyle = disabledActions
    ? { background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' as const }
    : {};

  // เตือนเมื่อ "ราคาทุนใหม่" สูงกว่า "ทุนล่าสุด" เกิน 0.5 บาท
  // เทียบที่หน่วยย่อยเสมอ (ทุนล่าสุด/ราคาขาย เป็นราคาต่อหน่วยย่อย)
  const latestCostCompare = refRCCost !== null ? Number(refRCCost) : Number(costAct_s)
  const newCostNum = toBaseCost(allitemlist.newCost, unitFactor)
  const isNewCostHigher =
    Number.isFinite(latestCostCompare) && latestCostCompare > 0 &&
    Number.isFinite(newCostNum) && newCostNum > latestCostCompare + 0.5
  const newCostDiff = isNewCostHigher ? newCostNum - latestCostCompare : 0
  // ใช้ shorthand `border` ให้ตรงกับ formStyles.input — ห้ามใส่ borderColor เดี่ยว ๆ ทับ
  // เพราะเมื่อสไตล์เตือนหายไป React จะถอด borderColor ทิ้งทั้งที่ border ยังอยู่ (styling bug)
  const newCostAlertStyle = isNewCostHigher
    ? { color: '#dc2626', fontWeight: 700, border: '1px solid #ef4444', background: '#fef2f2', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)' }
    : {};

  // มีสินค้าที่ค้นเจอ/เลือกไว้จริงหรือไม่ — ถ้าไม่มี ให้ซ่อนฟอร์มรายละเอียดและกดบันทึกไม่ได้
  const hasProduct = !!idF && dataProduct.some((p: any) => p.id === idF)

  // สรุปผลการแปลงหน่วยที่จะบันทึกจริง — แสดงใต้ช่องกรอกเพื่อให้ผู้ใช้เห็นก่อนกดบันทึก
  const previewBaseQty = roundUnit((Number(allitemlist.qty) || 0) * unitFactor)
  const previewBaseFree = roundUnit((Number(allitemlist.freebaht) || 0) * unitFactor)
  const convertedHintStyle: React.CSSProperties = {
    fontFamily: 'Kanit',
    fontSize: '11px',
    fontWeight: 600,
    color: '#4338ca',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: '10px',
    padding: '1px 7px',
    marginLeft: '4px',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={formStyles.container}>
      {/* Product Name */}
      <div style={formStyles.row}>
        <div style={formStyles.label}>สินค้า :</div>
        <div style={formStyles.productName}>{code_s} {productName_s}</div>
      </div>

      {/* Balance */}
      <div style={formStyles.row}>
        <div style={formStyles.label}>คงเหลือ :</div>
        <div style={{ ...formStyles.value, width: '40px', textAlign: 'center' }}>{balance}</div>
        <div style={formStyles.unit}>{unit_s}</div>
        <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#ef4444', marginLeft: '10px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fca5a5', background: '#fef2f2' }}>{type_s}</div>
        <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#2A6AAA', marginLeft: '6px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #A6C8E7', background: '#F3F8FC' }}>{subtype_s}</div>
      </div>

      {hasProduct && (<>
      <div style={formStyles.divider}></div>

      {/* Receive Unit Row — เลือกรับเป็นหน่วยฐาน หรือ หน่วยขาย (กล่อง/ลัง) */}
      <ReceiveUnitPicker
        options={unitOptions}
        value={selectedUnit.key}
        onChange={handleUnitChange}
        disabled={disabledActions}
        rowStyle={formStyles.row}
        labelStyle={formStyles.label}
      />

      {/* Cost & Price Row */}
      <div style={formStyles.row}>
        <div style={formStyles.label}>{costPriceModeLabel(costPriceMode)} :</div>
        <div style={{ ...formStyles.value, width: '50px', textAlign: 'center' }}>{refRCCost !== null ? Number(refRCCost).toFixed(decimalPlaces) : (Number(costAct_s) ? Number(costAct_s).toFixed(decimalPlaces) : costAct_s)}</div>
        <div style={formStyles.unit}>บาท</div>
        {isPackUnit && latestCostCompare > 0 && (
          <span style={convertedHintStyle} title={`ทุนล่าสุดเทียบเป็นราคาต่อ 1 ${selectedUnit.label}`}>
            = {toUnitCost(latestCostCompare, unitFactor).toFixed(Math.max(decimalPlaces, 2))} /{selectedUnit.label}
          </span>
        )}
        {((refRCCost !== null ? refRCCost : Number(costAct_s)) > 0) && Number(priceA_s) > 0 && (
          <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: Number(priceA_s) >= (refRCCost !== null ? refRCCost : Number(costAct_s)) ? '#2A6AAA' : '#ef4444', marginLeft: '4px' }}>
            %กำไร : {(((Number(priceA_s) - (refRCCost !== null ? refRCCost : Number(costAct_s))) / Number(priceA_s)) * 100).toFixed(1)}%
          </span>
        )}
        <div style={{ ...formStyles.label, marginLeft: '10px' }}>ราคาขาย :</div>
        <input
          type="number"
          step="0.01"
          value={editPrice !== "" ? editPrice : (dataProduct.find((p: any) => p.id === idF) as any)?.price ?? ""}
          onChange={(e) => setEditPrice(e.target.value)}
          onFocus={(e) => {
            if (editPrice === "") {
              const orig = (dataProduct.find((p: any) => p.id === idF) as any)?.price ?? ""
              setEditPrice(String(orig))
            }
            e.target.select()
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSavePrice() } }}
          disabled={disabledActions}
          style={{ ...formStyles.input, width: '60px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#ea580c', border: '1.5px solid #fb923c', borderRadius: '6px', padding: '2px 4px', ...disabledInputStyle }}
        />
        <div style={formStyles.unit}>บาท</div>
        <button
          onClick={() => { void handleSavePrice() }}
          disabled={disabledActions || savingPrice || editPrice === ""}
          title="บันทึกราคาขาย"
          style={{ background: 'none', border: 'none', cursor: disabledActions ? 'not-allowed' : (editPrice !== "" ? 'pointer' : 'default'), marginLeft: '4px', padding: '2px', display: 'flex', alignItems: 'center', opacity: disabledActions ? 0.3 : (editPrice !== "" ? 1 : 0.3) }}
        >
          <Save size={18} color={!disabledActions && editPrice !== "" ? '#2A6AAA' : '#9ca3af'} />
        </button>
      </div>

      {/* New Cost & Quantity Row — ตัวเลขทั้งแถวอยู่ใน "หน่วยรับ" ที่เลือกไว้ */}
      <div style={formStyles.row}>
        <div style={formStyles.label}>ราคาทุนใหม่ :</div>
        <input
          ref={newCostRef}
          name='newCost'
          type="number"
          step="0.01"
          value={allitemlist.newCost || ""}
          onChange={handleInputChange2}
          onFocus={handleFocus}
          onBlur={() => {
            if (skipNextBlurValidateRef.current) {
              skipNextBlurValidateRef.current = false
              return
            }
            validateNewCost()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              // ตรวจก่อนย้ายไปช่องจำนวน — ถ้าไม่ผ่าน (ทุน > ราคาขาย) จะรีเซ็ตและคงโฟกัสไว้ที่ช่องเดิม
              if (validateNewCost()) {
                skipNextBlurValidateRef.current = true
                qtyRef.current?.focus()
                qtyRef.current?.select()
              }
            }
          }}
          disabled={disabledActions}
          title={isNewCostHigher ? `ต้นทุนใหม่สูงกว่าทุนล่าสุด ${newCostDiff.toFixed(decimalPlaces)} บาท` : undefined}
          style={{ ...formStyles.input, ...formStyles.inputSmall, ...newCostAlertStyle, ...disabledInputStyle }}
        />
        <div style={formStyles.unit}>บาท{isPackUnit ? `/${selectedUnit.label}` : ''}</div>
        {isPackUnit && Number(allitemlist.newCost) > 0 && (
          <span style={convertedHintStyle} title="ทุนต่อหน่วยย่อยที่จะบันทึกลงสต็อก">
            = {newCostNum.toFixed(Math.max(decimalPlaces, 2))} /{selectedUnit.baseUnit}
          </span>
        )}
        {isNewCostHigher && !disabledActions && (
          <span
            title={`ต้นทุนใหม่สูงกว่าทุนล่าสุด ${newCostDiff.toFixed(decimalPlaces)} บาท`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontFamily: 'Kanit', fontSize: '11px', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '1px 6px', marginLeft: '2px', whiteSpace: 'nowrap' }}
          >
            <TrendingUp size={12} /> +{newCostDiff.toFixed(decimalPlaces)}
          </span>
        )}
        {newCostNum > 0 && Number(priceA_s) > 0 && (
          <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: Number(priceA_s) >= newCostNum ? '#ef4444' : '#dc2626', marginLeft: '4px' }}>
            %กำไร : {(((Number(priceA_s) - newCostNum) / Number(priceA_s)) * 100).toFixed(1)}%
          </span>
        )}
        <div style={{ ...formStyles.label, marginLeft: '10px' }}>จำนวนรับ :</div>
        <input
          ref={qtyRef}
          name='qty'
          value={allitemlist.qty || ""}
          onChange={handleInputChange2}
          onFocus={handleFocus}
          onKeyDown={(e) => handleKeyDown(e, lotRequired ? lotRef : saveBtnRef)}
          disabled={disabledActions}
          style={{ ...formStyles.input, ...formStyles.inputSmall, ...disabledInputStyle }}
        />
        <div style={formStyles.unit}>{selectedUnit.label || unit_s}</div>
        {isPackUnit && previewBaseQty > 0 && (
          <span style={convertedHintStyle} title="จำนวนหน่วยย่อยที่จะเข้าสต็อก">
            = {previewBaseQty} {selectedUnit.baseUnit}
          </span>
        )}
      </div>

      {/* Total & Date Row */}
      {/* ทุนรวมคิดจากหน่วยรับโดยตรง (ทุน/กล่อง × จำนวนกล่อง) — ได้ยอดเท่ากับหน่วยย่อย
          แต่ไม่มีเศษจากการหาร จึงตรงกับใบกำกับของผู้ขายเสมอ */}
      <div style={formStyles.row}>
        <div style={formStyles.label}>ทุนรวม :</div>
        <input
          name='totalcost'
          value={(Number(allitemlist.newCost) * Number(allitemlist.qty)).toFixed(decimalPlaces) || 0}
          onChange={handleInputChange2}
          disabled={true}
          style={{ ...formStyles.input, ...formStyles.inputSmall, background: '#f5f5f5', fontWeight: 600 }}
        />
        <div style={formStyles.unit}>บาท</div>
        {lotRequired && (<>
          <div style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#9e9e9e', marginLeft: '10px', width: '70px', textAlign: 'right' }}>ตัวอย่าง พ.ศ.:</div>
          <input
            name='dateExp_preview'
            value={allitemlist.dateExp && !isNaN(new Date(allitemlist.dateExp).getTime())
              ? new Date(allitemlist.dateExp).toLocaleDateString('th-TH', { month: '2-digit', day: '2-digit', year: 'numeric', })
              : ""}
            disabled={true}
            style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#9e9e9e', width: '80px', marginLeft: '4px', border: 'none', background: 'transparent' }}
          />
        </>)}
      </div>

      {/* Lot & Expiry Date Row — ซ่อนทั้งแถวเมื่อสินค้าตั้งค่า "ไม่มี Lot" */}
      {lotRequired ? (
        <div style={formStyles.row}>
          <div style={formStyles.label}>Lot :</div>
          <input
            ref={lotRef}
            name='lot'
            value={allitemlist.lot || ""}
            onChange={handleInputChange2}
            onKeyDown={(e) => handleKeyDown(e, dateExpRef)}
            disabled={disabledActions}
            style={{ ...formStyles.input, ...formStyles.inputMedium, ...disabledInputStyle }}
          />
          <div style={{ ...formStyles.label, marginLeft: '10px' }}>หมดอายุ ค.ศ.:</div>
          <DatePicker
            selected={allitemlist.dateExp && !isNaN(new Date(allitemlist.dateExp).getTime()) ? new Date(allitemlist.dateExp) : null}
            onChange={(date) => setitemlist({ ...allitemlist, dateExp: date ? date.toISOString() : "" })}
            dateFormat="dd/MM/yyyy"
            className="form-control form-control-sm"
            placeholderText="วว/ดด/ปปปป"
            disabled={disabledActions}
            onKeyDown={(e: any) => handleKeyDown(e, saveBtnRef)}
            customInput={
              <CustomDateInput
                externalRef={dateExpRef}
                disabled={disabledActions}
                style={{ ...formStyles.input, width: '120px', height: '35px', fontSize: '15px', textAlign: 'center', ...disabledInputStyle }}
              />
            }
          />
        </div>
      ) : (
        <div style={formStyles.row}>
          <div style={formStyles.label}>Lot :</div>
          <span className={styles.receiveNoLotNotice}>
            🏷️ {NO_LOT_LABEL} — สินค้านี้ตั้งค่าไม่ติดตาม Lot จึงไม่ต้องกรอก Lot/วันหมดอายุ
          </span>
        </div>
      )}

      {/* Free & Discount Row */}
      <div style={formStyles.row}>
        <div style={formStyles.label}>จำนวนแถม :</div>
        <input
          name='freebaht'
          value={allitemlist.freebaht || ""}
          onChange={handleInputChange2}
          onFocus={handleFocus}
          disabled={disabledActions}
          style={{ ...formStyles.input, ...formStyles.inputSmall, ...disabledInputStyle }}
        />
        <div style={formStyles.unit}>{selectedUnit.label || unit_s}</div>
        {isPackUnit && previewBaseFree > 0 && (
          <span style={convertedHintStyle} title="จำนวนแถมที่จะเข้าสต็อก (หน่วยย่อย)">
            = {previewBaseFree} {selectedUnit.baseUnit}
          </span>
        )}
        <div style={{ ...formStyles.label, marginLeft: '10px' }}>ลดราคา :</div>
        <input
          name='discountbaht'
          value={allitemlist.discountbaht || ""}
          onChange={handleInputChange2}
          onFocus={handleFocus}
          disabled={disabledActions}
          style={{ ...formStyles.input, ...formStyles.inputSmall, ...disabledInputStyle }}
        />
        <div style={formStyles.unit}>บาท</div>
      </div>
      </>)}

      {/* Buttons */}
      <div style={formStyles.buttonContainer}>
        {allItems.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#9e9e9e' }}>ลำดับ</span>
            <select
              value={targetPosition}
              onChange={(e) => setTargetPosition(Number(e.target.value))}
              disabled={disabledActions}
              style={{
                fontFamily: 'Kanit',
                fontSize: '12px',
                color: '#546e7a',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                padding: '2px 4px',
                height: '32px',
                cursor: disabledActions ? 'not-allowed' : 'pointer',
                outline: 'none',
              }}
            >
              {Array.from({ length: allItems.length + 1 }, (_, i) => i + 1).map((pos) => (
                <option key={pos} value={pos}>
                  {pos === allItems.length + 1 ? `${pos} (ท้าย)` : String(pos)}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          ref={saveBtnRef}
          onClick={CleckSubmit}
          type="button"
          style={{ ...formStyles.saveButton, opacity: loading || disabledActions || !hasProduct ? 0.55 : 1, cursor: loading || disabledActions || !hasProduct ? 'not-allowed' : 'pointer' }}
          disabled={loading || disabledActions || !hasProduct}>
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button
          onClick={CreateCus}
          type="button"
          style={{ ...formStyles.clearButton, opacity: disabledActions ? 0.55 : 1, cursor: loading || disabledActions ? 'not-allowed' : 'pointer' }}
          disabled={loading || disabledActions}
        >
          ล้าง
        </button>
        <Link href="/web/receives"><button type="button" style={formStyles.backButton}>กลับ</button></Link>
      </div>
    </div>
  )
}

export default InputSearch1


