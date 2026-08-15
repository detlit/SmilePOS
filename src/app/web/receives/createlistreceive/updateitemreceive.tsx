'use client'

import React, { useState, useEffect, useMemo, Suspense, createContext, useContext, useRef, forwardRef } from 'react'

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
//import { useRecItemContext } from './page';
import { useMessageStore } from "./useMessageStore";
import { enableFullscreen } from "@/lib/fullscreen";
import { fetchCostPriceMode, getCachedCostPriceMode, costPriceModeLabel, type CostPriceMode } from "@/lib/costPriceMode";
import { isLotRequired, NO_LOT_VALUE, NO_LOT_LABEL } from "@/lib/lotPolicy";
import { computeNetCostOrNull } from "@/lib/lotCost";
import ReceiveUnitPicker from "./ReceiveUnitPicker";
import {
  BASE_UNIT_KEY,
  buildReceiveQuantities,
  buildUnitOptions,
  findUnitOption,
  optionFromSavedItem,
  reinterpretOnUnitChange,
  roundUnit,
  toBaseCost,
  toUnitCost,
  type ReceiveUnitOption,
  type UnitConversionRow,
} from "@/lib/receiveUnit";
const apis = "receive"
const apidatalist = "datalist"
const apidataitemlist = "dataitemlist"
const apidataitem = "dataitemlist"
import { cachedGet, patchCatalogById } from "@/lib/catalogCache";
import { Toaster, toast } from "sonner"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Check, AArrowDown, ChevronDownIcon, ChevronsDown, Save, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

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

function Updateitemreceive({
  data,
  disabledActions = false,
  allItems = [],
  unitConversions = [],
}: {
  data: any,
  disabledActions?: boolean,
  allItems?: any[],
  /** หน่วยขายทั้งบริษัท (ส่งมาจากหน้าแม่ — โหลดครั้งเดียว) */
  unitConversions?: UnitConversionRow[],
}) {

  const newCostRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)
  const lotRef = useRef<HTMLInputElement>(null)
  const dateExpRef = useRef<HTMLInputElement>(null)
  const editBtnRef = useRef<HTMLButtonElement>(null)
  const itemPostRequestRef = useRef(0)

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

  const [vat, setvat] = useState(0)
  const [discountrc, setDiscount] = useState(0)
  const [totalallrc, setTotalall] = useState(0)

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
  };


  //  const {idcus} =useRecItemContext(); 
  const idcus = useMessageStore((state) => state.idcus)
  //************************************ */
  const [all, setall1] = useState(initialValues)

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;

    setall1({
      ...all,
      [name]: value,
    });


  };

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
  const [open5, setOpen5] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)


  // const idF=Number(idcus)
  const idF = data
  const [alldatalist, setatalist] = useState(initialValues1)
  const [itempostU, setitempost] = useState([])

  const [dataProduct, setdataProduct] = useState([])
  //*** Get API Fixname */
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);



  useEffect(() => {
    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        // ฟอร์มนี้ mount ใหม่ทุกครั้งที่คลิกแถวเพื่อแก้ไข — ใช้ cache ก้อนเดียวกับหน้าแม่
        // ไม่งั้นการคลิกแต่ละแถวจะดาวน์โหลดสินค้าทั้งร้านใหม่ทุกครั้ง
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
  const [allitemlist1, setitemlist1] = useState(initialValues2)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [editPrice, setEditPrice] = useState<string>("")
  const [savingPrice, setSavingPrice] = useState(false)
  const [targetPosition, setTargetPosition] = useState(1)
  const [latestRCCost, setLatestRCCost] = useState<number | null>(null)
  const [averageRCCost, setAverageRCCost] = useState<number | null>(null)
  const [costPriceMode, setCostPriceMode] = useState<CostPriceMode>(getCachedCostPriceMode())
  const selectedReceiveItemId = String((allitemlist1 as any).id || idcus || (typeof window !== "undefined" ? sessionStorage.getItem("iditemS") : "") || "")

  const handleInputChange2 = (e: any) => {
    const { name, value } = e.target;

    setitemlist1({
      ...allitemlist1,
      [name]: value,
    });



  };

  useEffect(() => {
    setitemlist1(initialValues2)
    ItemPost()
  }, [idcus])

  // Sync position dropdown to current item's position when selection changes
  useEffect(() => {
    if (!allItems || allItems.length === 0 || !idcus) return
    const sorted = [...allItems].sort((a: any, b: any) => Number(a.id) - Number(b.id))
    const idx = sorted.findIndex((item: any) => String(item.id) === String(idcus))
    setTargetPosition(idx >= 0 ? idx + 1 : 1)
  }, [idcus, allItems])


  const ItemPost = async () => {
    const receiveItemId = Number(idcus)
    const requestId = ++itemPostRequestRef.current
    if (!receiveItemId) {
      setitemlist1(initialValues2)
      return
    }

    try {
      const res = await axios.get(`/api/${apidataitemlist}/${receiveItemId}`)
      //  setdataProduct(res.data)
      if (requestId !== itemPostRequestRef.current) return
      if (res.data) {
        setitemlist1(res.data)
      }

      // Focus and select after data is fetched
      setTimeout(() => {
        if (requestId !== itemPostRequestRef.current) return
        if (newCostRef.current) {
          newCostRef.current.focus()
          newCostRef.current.select()
        }
      }, 50)
    } catch (error) {
      console.error(error)
    }

  }

  const fetchBalance = async (code: string) => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const productId = (dataProduct.find((p: any) => p.code === code) as any)?.id
      const idQuery = productId ? `&id=${productId}` : ''
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







  //*/********Main RC********/





  // อ้างอิงจากรายการรับที่เลือกจริงเป็นหลัก เพื่อไม่ให้สินค้าในฟอร์มสลับกับแถวที่กดเลือก
  const selectedItemBarcode = String((allitemlist1 as any).Barcode || "")
  const selectedItemCode = String(allitemlist1.itemcode || "")
  const fallbackProductKey = String(idF || "")
  const matchedProduct = (dataProduct.find((supplier: any) => selectedItemBarcode && String(supplier.Barcode) === selectedItemBarcode)
    || dataProduct.find((supplier: any) => fallbackProductKey && String(supplier.Barcode) === fallbackProductKey)
    || dataProduct.find((supplier: any) => selectedItemCode && String(supplier.code) === selectedItemCode)
    || dataProduct.find((supplier: any) => fallbackProductKey && String(supplier.code) === fallbackProductKey)) as any

  const code_s = String(matchedProduct?.code ?? selectedItemCode)
  const productName_s = String(matchedProduct?.ProductName ?? allitemlist1.itemName ?? "")
  const unit_s = String(matchedProduct?.Unit ?? allitemlist1.unit ?? "")
  const priceA_s = editPrice !== "" ? editPrice : String(matchedProduct?.price ?? "")
  const costAct_s = String(matchedProduct?.CostActual ?? "")
  const productId_s = matchedProduct
  // นโยบาย lot ของสินค้าในแถวที่กำลังแก้ไข (หาไม่เจอ = ถือว่าต้องมี lot ไว้ก่อน)
  const lotRequired = isLotRequired(matchedProduct)

  // ══ หน่วยรับ: แถวใน RCitemlist เก็บเป็นหน่วยย่อยเสมอ ══
  // ฟอร์มนี้ทำงานใน "หน่วยรับ" ที่เลือก (เหมือนหน้าเพิ่มสินค้า) แล้วแปลงกลับตอนบันทึก
  // ดู src/lib/receiveUnit.ts สำหรับเหตุผลที่ต้องแปลงที่จุดเดียว
  const unitOptions = useMemo(
    () => buildUnitOptions(matchedProduct, unitConversions),
    [matchedProduct, unitConversions]
  )
  const [unitKey, setUnitKey] = useState<string>(BASE_UNIT_KEY)
  const selectedUnit: ReceiveUnitOption = findUnitOption(unitOptions, unitKey)
  const unitFactor = selectedUnit.factor
  const isPackUnit = unitFactor !== 1

  /** ค่าที่ผู้ใช้กำลังแก้ไข "ในหน่วยรับ" (แปลงมาจากแถวที่บันทึกไว้) */
  const [packForm, setPackForm] = useState({ qty: "", newCost: "", freebaht: "" })
  const hydratedKeyRef = useRef("")

  // เปิดรายการ → แปลงค่าที่บันทึกไว้ (หน่วยย่อย) กลับเป็นหน่วยที่รับมาจริง
  // รอจน matchedProduct พร้อมก่อน ไม่งั้นจะได้ factor 1 ผิด ๆ แล้วตัวเลขเพี้ยนทั้งฟอร์ม
  useEffect(() => {
    const rowId = String((allitemlist1 as any)?.id || "")
    if (!rowId || !matchedProduct) {
      if (!rowId) hydratedKeyRef.current = ""
      return
    }
    const key = `${rowId}|${unitOptions.length}`
    if (hydratedKeyRef.current === key) return
    hydratedKeyRef.current = key

    const option = optionFromSavedItem(unitOptions, allitemlist1 as any)
    const factor = option.factor
    setUnitKey(option.key)

    // ใช้ saleQty ที่บันทึกไว้เป็นหลัก (ตรงกับที่ผู้ใช้พิมพ์ตอนรับ)
    // แถวเก่าที่ยังไม่มีค่านี้ ให้ถอดกลับจาก qty ÷ ตัวคูณ
    const savedSaleQty = Number((allitemlist1 as any).saleQty)
    const qtyInUnit = Number.isFinite(savedSaleQty) && savedSaleQty > 0 && factor !== 1
      ? roundUnit(savedSaleQty)
      : roundUnit((Number(allitemlist1.qty) || 0) / factor)
    const freeRaw = (allitemlist1 as any).freebaht

    // ทุนต่อหน่วยขาย: ถอดจาก "ทุนรวม ÷ จำนวนหน่วยขาย" ก่อน เพราะเป็นตัวเลขที่ผู้ใช้พิมพ์จริง
    // ถ้าคูณกลับจาก newCost (ทุนต่อหน่วยย่อยที่ถูกหารมาแล้ว) จะได้เศษลอย เช่น 109.999998
    const savedTotal = Number((allitemlist1 as any).totalcost)
    const costInUnit = factor !== 1 && qtyInUnit > 0 && Number.isFinite(savedTotal) && savedTotal > 0
      ? roundUnit(savedTotal / qtyInUnit, 4)
      : roundUnit(toUnitCost(allitemlist1.newCost, factor), 4)

    setPackForm({
      qty: qtyInUnit ? String(qtyInUnit) : "",
      newCost: String(costInUnit),
      freebaht: freeRaw === null || freeRaw === undefined || String(freeRaw) === ""
        ? ""
        : String(roundUnit((Number(freeRaw) || 0) / factor)),
    })
  }, [allitemlist1, matchedProduct, unitOptions])

  const handlePackChange = (e: any) => {
    const { name, value } = e.target
    setPackForm((prev) => ({ ...prev, [name]: value }))
  }

  /** สลับหน่วยเอง — คงปริมาณ/มูลค่าจริงไว้ (2 กล่อง ⇄ 24 ขวด, 267/กล่อง ⇄ 22.25/ขวด) */
  const handleUnitChange = (nextKey: string) => {
    const fromFactor = selectedUnit.factor
    const toFactor = findUnitOption(unitOptions, nextKey).factor
    setUnitKey(nextKey)
    if (fromFactor === toFactor) return
    setPackForm((prev) => ({
      qty: reinterpretOnUnitChange(prev.qty, fromFactor, toFactor, "qty"),
      newCost: reinterpretOnUnitChange(prev.newCost, fromFactor, toFactor, "cost"),
      freebaht: reinterpretOnUnitChange(prev.freebaht, fromFactor, toFactor, "qty"),
    }))
  }

  /** ทุนต่อหน่วยย่อย — ใช้เทียบกับราคาขาย/ทุนล่าสุด ซึ่งเป็นราคาต่อหน่วยย่อยทั้งคู่ */
  const baseNewCost = toBaseCost(packForm.newCost, unitFactor)
  const previewBaseQty = roundUnit((Number(packForm.qty) || 0) * unitFactor)
  const previewBaseFree = roundUnit((Number(packForm.freebaht) || 0) * unitFactor)
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

  // reset editPrice เมื่อเปลี่ยนสินค้า
  useEffect(() => { setEditPrice("") }, [selectedReceiveItemId, selectedItemBarcode, selectedItemCode])

  const handleSavePrice = async (showToast = true) => {
    if (editPrice === "" || disabledActions) return true
    if (!productId_s?.id) return true
    setSavingPrice(true)
    try {
      const nextPrice = parseFloat(editPrice) || 0
      await axios.put(`/api/${apidatalist}/${productId_s.id}`, { price: nextPrice })
      // อัปเดต dataProduct ใน state ด้วย
      setdataProduct((prev: any) => prev.map((p: any) => p.id === productId_s.id ? { ...p, price: nextPrice } : p))
      patchCatalogById(apidatalist, productId_s.id, { price: nextPrice })
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
  const Baecode_s = String(matchedProduct?.Barcode ?? selectedItemBarcode)
  const type_s = String(matchedProduct?.type ?? (allitemlist1 as any).type ?? "")
  const subtype_s = String(matchedProduct?.subtype ?? (allitemlist1 as any).subtype ?? "")

  useEffect(() => {
    if (code_s && code_s !== "undefined" && code_s !== "") {
      fetchBalance(code_s)
      fetchLatestRCCost(code_s)
    }
  }, [code_s])




  //***********Get ID**ฑฉ************************ */

  useEffect(() => {

    const useMyHook = async () => {
      try {
        fetchPost()
        Getdataitem()


      } catch (e) {
        console.error(e);
      }
    }

    useMyHook()
  }, [])

  //*/********Main RC********/
  const fetchPost = async () => {
    let idrc = (sessionStorage.getItem("id_RC") || "")
    try {
      const res = await axios.get(`/api/${apis}/${Number(idrc)}`)

      setall1(res.data)

    } catch (error) {
      console.error(error)
    }

  }

  const [totalcost, setTotalcost] = useState("")

  const Getdataitem = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    let codeS = (sessionStorage.getItem("codeS") || "")
    let iditemS = (sessionStorage.getItem("iditemS") || "")

    try {
      const res = await axios.get(`/api/${apidataitem}?company=${companyS}&codenames=${codeS}`)

      setTotalcost(res.data.reduce((a: any, b: any) => a + b.totalcost, 0))
      setTotalall(Number(res.data.reduce((a: any, b: any) => a + b.totalcost, 0)) + Number(discountrc) + Number(totalcost))
      //  console.log(res.data)
    } catch (error) {
      console.error(error)
    }

  }

  //const    codew=String(itempostU.filter((supplier:any)=>supplier.id==Number(idcus)).map((supplier:any)=>supplier.code))==null?"":String(itempostU.filter((supplier:any)=>supplier.id==Number(idcus)).map((supplier:any)=>supplier.code))
  //************************************ */
  const CreateCus = async () => {
    try {

      setitemlist1(initialValues2);

    } catch (error) {
      console.error(error)
    }

  }



  // Delete/id
  const DeletePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (disabledActions) return;
    if (!confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;
    setLoading(true);

    const iditemS = selectedReceiveItemId
    if (!iditemS) {
      setLoading(false)
      return
    }
    try {
      await axios.delete(`/api/${apidataitemlist}/${Number(iditemS)}`)
      setcpage("0")
    } catch (error) {
      console.error('Failed to delete the post', error)
    } finally {
      setLoading(false);
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
  const UpdateCus = async (e: any) => {
    e.preventDefault();
    if (loading) return;
    if (disabledActions) return;

    // Lot/วันหมดอายุ บังคับกรอกเฉพาะสินค้าที่ตั้งค่า "สินค้า lot" ไว้เท่านั้น
    if (!packForm.newCost || !packForm.qty || (lotRequired && (!allitemlist1.lot || !allitemlist1.dateExp))) {
      AlertWarning();
      return;
    }

    setLoading(true);

    let companyS = (localStorage.getItem("company_") || "")
    let codeS = (sessionStorage.getItem("codeS") || "")
    const iditemS = selectedReceiveItemId
    if (!iditemS) {
      setLoading(false)
      return
    }
    const company = companyS

    const itemcode = code_s
    // unit ต้องเป็นหน่วยฐานของสินค้าเสมอ ห้ามเขียนชื่อหน่วยขายลงไป
    // ไม่งั้นยอดคงเหลือ/FEFO จะจับกลุ่มผิด (เหตุผลเต็ม: src/lib/receiveUnit.ts)
    const itemName = productName_s
    const unit = unit_s
    // จุดแปลงหน่วยจุดเดียวของฟอร์ม: หน่วยรับที่ผู้ใช้แก้ไข → หน่วยย่อยที่เข้าสต็อก
    const packed = buildReceiveQuantities({
      qtyInUnit: packForm.qty,
      costPerUnit: packForm.newCost,
      freeInUnit: packForm.freebaht,
      option: selectedUnit,
    })
    const newCost = packed.newCost
    const qty = packed.qty
    // ทุนรวม (gross) = ทุนใหม่ × จำนวน (ก่อนหักส่วนลด) — ส่วนลดอยู่ที่ช่องทุนสุทธิ
    const totalcost = packed.totalcost
    // สินค้าไม่ใช้ lot → ล้าง lot/วันหมดอายุออกจากแถวรับเข้า (ดู src/lib/lotPolicy.ts)
    const lot = lotRequired ? allitemlist1.lot : NO_LOT_VALUE
    const dateExp = lotRequired && allitemlist1.dateExp ? new Date(allitemlist1.dateExp) : null
    // ของแถมแปลงด้วยตัวคูณเดียวกัน (แถม 1 กล่อง = 12 ขวดเข้าสต็อก)
    const freebaht = packed.freebaht
    const discountbaht = Number(allitemlist1.discountbaht)
    // ที่มาของจำนวน: รับมากี่ "หน่วยขาย" — ไว้แสดง/ตรวจสอบย้อนหลังเท่านั้น
    const saleQty = packed.saleQty
    const saleUnit = packed.saleUnit
    const saleFactor = packed.saleFactor
    const Barcode = Baecode_s
    const type = type_s
    const subtype = subtype_s
    // หมายเหตุ: ห้ามส่ง sale ไปกับ PUT — sale คือตัวนับจำนวนที่ขายไปแล้วของ lot (เดิมเคยส่งราคาขายทับ ทำให้หน้าขายมองว่า lot หมด)
    const person = ""
    const statuss = ""
    const codevender = String(all.codenames)
    const namevender = String(all.names)
    try {
      const priceSaved = await handleSavePrice(false)
      if (!priceSaved) return

      await axios.put(`/api/${apidataitemlist}/${Number(iditemS)}`,
        {
          company, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateExp, freebaht, discountbaht, Barcode, type, subtype, person, statuss, codevender, namevender, saleQty, saleUnit, saleFactor


        }

      )

      // อัปเดต "ทุนตั้งต้น" (CostActual) ในข้อมูลสินค้าให้ตรงกับราคาทุนใหม่ที่แก้ไข
      // ต้องเป็น "ทุนสุทธิหลังหักส่วนลด" ให้ตรงกับที่หน้าขายใช้ (src/lib/lotCost.ts)
      // ไม่งั้นสินค้าที่หา lot ไม่เจอจะเด้งกลับไปใช้ทุนก่อนหักส่วนลดแบบเงียบ ๆ
      const costActual = computeNetCostOrNull({ newCost, qty, totalcost, discountbaht, freebaht }) ?? newCost
      if (productId_s?.id && newCost > 0) {
        try {
          // ส่ง memberDiscountEligible เดิมไปด้วย เพราะ PUT นี้จะ reset เป็น true ถ้าไม่ส่งค่ามา
          await axios.put(`/api/${apidatalist}/${productId_s.id}`, {
            CostActual: costActual,
            memberDiscountEligible: productId_s?.memberDiscountEligible,
          })
          setdataProduct((prev: any) => prev.map((p: any) => p.id === productId_s.id ? { ...p, CostActual: costActual } : p))
          patchCatalogById(apidatalist, productId_s.id, { CostActual: costActual })
        } catch (err) {
          console.error('update CostActual failed:', err)
        }
      }

      // Reorder if position changed
      const sortedAll = [...allItems].sort((a: any, b: any) => Number(a.id) - Number(b.id))
      const currentIdx = sortedAll.findIndex((item: any) => String(item.id) === String(iditemS))
      if (currentIdx >= 0 && targetPosition !== currentIdx + 1) {
        await axios.post('/api/dataitemlist/reorder', {
          company,
          codenames: codeS,
          fromId: Number(iditemS),
          toPosition: targetPosition,
        })
      }

      setcpage(String("0"))
      AlertComplete()
      await fetchPost()
      // localStorage.setItem("loadingM","/web/customers")

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false);
    }
  }

  //******Set Vat******* */
  const VatInput = (e: any) => {
    let vvat = e.target.value
    setall1({ ...all, vatRC: e.target.value })
    setall1({ ...all, totalRCAll: e.target.value + discountrc + Number(totalcost) })
    setTotalall(Number(vvat) + Number(discountrc) + Number(totalcost))
    setvat(e.target.value)
    handleInputChange
  }
  //******Set Discount RC******* */
  const DiscountInput = (e: any) => {
    let vvat = e.target.value
    setall1({ ...all, discountRC: e.target.value })
    setall1({ ...all, totalRCAll: e.target.value + vat + Number(totalcost) })
    setTotalall(Number(vvat) + Number(vat) + Number(totalcost))
    setDiscount(e.target.value)
    handleInputChange
  }
  //******Set TotatcostAll RC******* */
  const TotalallInput = (e: any) => {

    //  setTotalall(e.target.value)
    handleInputChange
  }

  // Professional form styles
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
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#cfd8dc',
      padding: '4px 8px',
      height: '35px',
      transition: 'border-color 0.2s ease',
    },
    inputSmall: {
      width: '75px',
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
    editButton: {
      fontFamily: 'Kanit_B',
      fontSize: '14px',
      padding: '8px 24px',
      borderRadius: '8px',
      border: 'none',
      background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      color: 'white',
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)',
      fontWeight: 600,
    },
    deleteButton: {
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
  // ราคาทุนอ้างอิงตามโหมด: ทุนล่าสุด (ค่าเริ่มต้น) หรือ ทุนเฉลี่ย
  const refRCCost: number | null = (costPriceMode === 'average' && averageRCCost !== null) ? averageRCCost : latestRCCost
  const latestCostCompare = refRCCost !== null ? Number(refRCCost) : Number(costAct_s)
  // เทียบที่หน่วยย่อยเสมอ (ทุนล่าสุด/ราคาขาย เป็นราคาต่อหน่วยย่อย)
  const newCostNum = baseNewCost
  const isNewCostHigher =
    Number.isFinite(latestCostCompare) && latestCostCompare > 0 &&
    Number.isFinite(newCostNum) && newCostNum > latestCostCompare + 0.5
  const newCostDiff = isNewCostHigher ? newCostNum - latestCostCompare : 0
  const newCostAlertStyle = isNewCostHigher
    ? { color: '#dc2626', fontWeight: 700, borderColor: '#ef4444', background: '#fef2f2', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)' }
    : {};

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

      <div style={formStyles.divider}></div>

      {/* Receive Unit Row — แก้ไขหน่วยที่รับได้ ระบบจะแปลงเป็นหน่วยย่อยให้ */}
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
          value={priceA_s}
          onChange={(e) => setEditPrice(e.target.value)}
          onFocus={(e) => {
            if (editPrice === "") {
              const orig = matchedProduct?.price ?? ""
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
          value={packForm.newCost || ""}
          onChange={handlePackChange}
          onFocus={handleFocus}
          onKeyDown={(e) => handleKeyDown(e, qtyRef)}
          disabled={disabledActions}
          title={isNewCostHigher ? `ต้นทุนใหม่สูงกว่าทุนล่าสุด ${newCostDiff.toFixed(decimalPlaces)} บาท` : undefined}
          style={{ ...formStyles.input, ...formStyles.inputSmall, ...newCostAlertStyle, ...disabledInputStyle }}
        />
        <div style={formStyles.unit}>บาท{isPackUnit ? `/${selectedUnit.label}` : ''}</div>
        {isPackUnit && Number(packForm.newCost) > 0 && (
          <span style={convertedHintStyle} title="ทุนต่อหน่วยย่อยที่จะบันทึกลงสต็อก">
            = {baseNewCost.toFixed(Math.max(decimalPlaces, 2))} /{selectedUnit.baseUnit}
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
        {baseNewCost > 0 && Number(priceA_s) > 0 && (
          <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: Number(priceA_s) >= baseNewCost ? '#ef4444' : '#dc2626', marginLeft: '4px' }}>
          %กำไร :  {(((Number(priceA_s) - baseNewCost) / Number(priceA_s)) * 100).toFixed(1)}%
          </span>
        )}
        <div style={{ ...formStyles.label, marginLeft: '10px' }}>จำนวนรับ :</div>
        <input
          ref={qtyRef}
          name='qty'
          type="number"
          step="0.01"
          value={packForm.qty || ""}
          onChange={handlePackChange}
          onFocus={handleFocus}
          onKeyDown={(e) => handleKeyDown(e, lotRequired ? lotRef : editBtnRef)}
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
      <div style={formStyles.row}>
        <div style={formStyles.label}>ทุนรวม :</div>
        {/* คิดจากหน่วยรับโดยตรง (ทุน/กล่อง × จำนวนกล่อง) — ไม่มีเศษจากการหาร จึงตรงกับใบกำกับ */}
        <input
          name='totalcost'
          value={(Number(packForm.newCost) * Number(packForm.qty)).toFixed(decimalPlaces) || 0}
          onChange={handleInputChange2}
          disabled={true}
          style={{ ...formStyles.input, ...formStyles.inputSmall, background: '#f5f5f5', fontWeight: 600 }}
        />
        <div style={formStyles.unit}>บาท</div>
        {lotRequired && (<>
          <div style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#9e9e9e', marginLeft: '10px', width: '70px', textAlign: 'right' }}>ตัวอย่าง พ.ศ.:</div>
          <input
            name='dateExp'
            value={allitemlist1.dateExp && !isNaN(new Date(allitemlist1.dateExp).getTime())
              ? new Date(allitemlist1.dateExp).toLocaleDateString('th-TH', { month: '2-digit', day: '2-digit', year: 'numeric', })
              : ""}
            onChange={handleInputChange2}
            disabled={true}
            style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#9e9e9e', width: '80px', marginLeft: '4px', border: 'none', background: 'transparent' }}
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
            value={allitemlist1.lot || ""}
            onChange={handleInputChange2}
            onFocus={handleFocus}
            onKeyDown={(e) => handleKeyDown(e, dateExpRef)}
            disabled={disabledActions}
            style={{ ...formStyles.input, ...formStyles.inputMedium, ...disabledInputStyle }}
          />
          <div style={{ ...formStyles.label, marginLeft: '10px' }}>หมดอายุ ค.ศ.:</div>
          <div style={{ width: 140, height: 35, backgroundColor: 'white', marginLeft: 10 }}>
            <DatePicker
              selected={allitemlist1.dateExp && !isNaN(new Date(allitemlist1.dateExp).getTime()) ? new Date(allitemlist1.dateExp) : null}
              onChange={(date) => setitemlist1({ ...allitemlist1, dateExp: date ? date.toISOString() : "" })}
              dateFormat="dd/MM/yyyy"
              className="form-control form-control-sm"
              placeholderText="วว/ดด/ปปปป"
              disabled={disabledActions}
              onKeyDown={(e: any) => handleKeyDown(e, editBtnRef)}
              customInput={
                <CustomDateInput
                  externalRef={dateExpRef}
                  onKeyDown={(e: any) => handleKeyDown(e, editBtnRef)}
                  disabled={disabledActions}
                  style={{ ...formStyles.input, width: '140px', height: '35px', fontSize: '13px', textAlign: 'center', ...disabledInputStyle }}
                />
              }
            />
          </div>
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
          value={packForm.freebaht ?? ""}
          onChange={handlePackChange}
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
          value={allitemlist1.discountbaht ?? ""}
          onChange={handleInputChange2}
          onFocus={handleFocus}
          disabled={disabledActions}
          style={{ ...formStyles.input, ...formStyles.inputSmall, ...disabledInputStyle }}
        />
        <div style={formStyles.unit}>บาท</div>
      </div>

      {/* Buttons */}
      <div style={formStyles.buttonContainer}>
        {/* Position selector */}
        {allItems.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '4px' }}>
            <span style={{
              fontFamily: 'Kanit',
              fontSize: '12px',
              color: '#64748b',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}>ลำดับ</span>
            <select
              value={targetPosition}
              onChange={(e) => setTargetPosition(Number(e.target.value))}
              disabled={disabledActions}
              style={{
                fontFamily: 'Kanit',
                fontSize: '13px',
                color: '#374151',
                borderRadius: '6px',
                border: '1.5px solid #cbd5e1',
                background: disabledActions ? '#f1f5f9' : '#f8fafc',
                padding: '0 6px',
                height: '32px',
                minWidth: '52px',
                cursor: disabledActions ? 'not-allowed' : 'pointer',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'border-color 0.15s',
              }}
            >
              {[...allItems]
                .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                .map((_: any, i: number) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
            </select>
          </div>
        )}
        <button
          ref={editBtnRef}
          onClick={UpdateCus}
          type="button"
          data-logbook-context={`${code_s} ${productName_s}`.trim()}
          data-logbook-code={code_s}
          data-logbook-name={productName_s}
          style={{ ...formStyles.editButton, opacity: loading || disabledActions ? 0.55 : 1, cursor: loading || disabledActions ? 'not-allowed' : 'pointer' }}
          disabled={loading || disabledActions}>
          {loading ? "กำลังบันทึก..." : "แก้ไข"}
        </button>
        <button
          onClick={DeletePost}
          type="button"
          data-logbook-context={`${code_s} ${productName_s}`.trim()}
          data-logbook-code={code_s}
          data-logbook-name={productName_s}
          style={{ ...formStyles.deleteButton, opacity: loading || disabledActions ? 0.55 : 1, cursor: loading || disabledActions ? 'not-allowed' : 'pointer' }}
          disabled={loading || disabledActions}
        >
          {loading ? "กำลังลบ..." : "ลบ"}
        </button>
        <Link href="/web/receives"><button type="button" style={formStyles.backButton}>กลับ</button></Link>
      </div>
    </div>
  )
}

export default Updateitemreceive


