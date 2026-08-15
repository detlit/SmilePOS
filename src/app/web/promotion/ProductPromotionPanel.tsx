'use client'

// แผงตั้งค่า "โปรโมชั่นสินค้า" (พื้นที่ด้านขวาของหน้าตั้งค่าโปรโมชั่น)
// - เลือกสินค้า + ระดับราคา + ช่วงวันที่ + เปิด/ปิดใช้งาน
// - รูปแบบ: ซื้อครบ/มากกว่า N ลดเป็นบาทหรือ %  |  ซื้อครบ N แถม M
// - รายการโปรทั้งหมดแก้ไข/สลับสถานะ/ลบได้จากตารางด้านล่าง

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Switch } from "@heroui/react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDownIcon, Search, Tag, Gift, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cachedGet } from "@/lib/catalogCache"
import { PRICE_TIER_VALUES } from "../sales/priceTier"
import {
  PROMO_TIER_ALL,
  ProductPromo,
  isPromoActiveNow,
  promoConditionText,
  promoRewardText,
} from "./productPromoUtils"

const apiProductPromotion = "product-promotion"

const kanit = { fontFamily: "kanit" }
const kanitB = { fontFamily: "kanit_B" }

const TIER_OPTIONS = [PROMO_TIER_ALL, ...PRICE_TIER_VALUES]

function tierPrice(product: any, tier: string): number {
  if (!product) return 0
  switch (tier) {
    case "ขายส่ง": return Number(product.wholesaleprice || 0)
    case "สมาชิก": return Number(product.online || 0) > 0 ? Number(product.online) : Number(product.price || 0)
    case "ราคา A": return Number(product.PriceA || 0)
    case "ราคา B": return Number(product.PriceB || 0)
    case "ราคา C": return Number(product.PriceC || 0)
    case "ราคา D": return Number(product.PriceD || 0)
    case "ราคา E": return Number(product.PriceE || 0)
    case "ราคา F": return Number(product.PriceF || 0)
    case "ราคา G": return Number(product.PriceG || 0)
    case "ราคา H": return Number(product.PriceH || 0)
    default: return Number(product.price || 0) // หน้าร้าน / ทุกระดับราคา
  }
}

const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"

export default function ProductPromotionPanel() {

  const [promos, setPromos] = useState<ProductPromo[]>([])
  const [catalog, setCatalog] = useState<any[]>([])

  // ------- form state -------
  const [editId, setEditId] = useState<number | null>(null)
  const [nameS, setNameS] = useState("")
  const [product, setProduct] = useState<any | null>(null)
  const [tierS, setTierS] = useState(PROMO_TIER_ALL)
  const [typeS, setTypeS] = useState<"discount" | "freebie">("discount")
  const [minQtyS, setMinQtyS] = useState("")
  const [discValS, setDiscValS] = useState("")
  const [discUnitS, setDiscUnitS] = useState<"percent" | "baht">("percent")
  const [discScopeS, setDiscScopeS] = useState<"unit" | "bill">("unit")
  const [freeQtyS, setFreeQtyS] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d })
  const [activeS, setActiveS] = useState(true)

  const [openStart, setOpenStart] = useState(false)
  const [openEnd, setOpenEnd] = useState(false)
  const [openProduct, setOpenProduct] = useState(false)
  const [searchText, setSearchText] = useState("")

  const companyS = typeof window !== "undefined" ? (localStorage.getItem("company_") || "") : ""

  // ------- load data -------
  const fetchPromos = async () => {
    try {
      const res = await axios.get(`/api/${apiProductPromotion}?company=${companyS}`)
      setPromos(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchPromos()
    const loadCatalog = async () => {
      try {
        const res = await cachedGet<any[]>(`/api/datalist?company=${companyS}&fields=sale`)
        setCatalog(Array.isArray(res.data) ? res.data : [])
      } catch (e) { console.error(e) }
    }
    loadCatalog()
  }, [])

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (q === "") return catalog.slice(0, 50)
    return catalog.filter((p: any) =>
      String(p.code || "").toLowerCase().includes(q) ||
      String(p.ProductName || "").toLowerCase().includes(q) ||
      String(p.Barcode || "").toLowerCase().includes(q)
    ).slice(0, 50)
  }, [catalog, searchText])

  const refPrice = tierPrice(product, tierS)
  const unitName = String(product?.Unit || "หน่วย")

  // ตัวอย่างข้อความโปรที่ผู้ขายจะเห็นในหน้าขาย
  const previewPromo: ProductPromo = {
    id: 0,
    unit: unitName,
    promo_type: typeS,
    min_qty: Number(minQtyS) || 0,
    discount_unit: discUnitS,
    discount_scope: discScopeS,
    discount_value: Number(discValS) || 0,
    free_qty: Number(freeQtyS) || 0,
  }

  // ------- actions -------
  const clearForm = () => {
    setEditId(null)
    setNameS("")
    setProduct(null)
    setTierS(PROMO_TIER_ALL)
    setTypeS("discount")
    setMinQtyS("")
    setDiscValS("")
    setDiscUnitS("percent")
    setDiscScopeS("unit")
    setFreeQtyS("")
    setStartDate(new Date())
    const d = new Date(); d.setDate(d.getDate() + 30); setEndDate(d)
    setActiveS(true)
    setSearchText("")
  }

  const validate = (): string | null => {
    if (!product) return "กรุณาเลือกสินค้า"
    if (!(Number(minQtyS) > 0)) return "กรุณาระบุจำนวนซื้อครบ (มากกว่า 0)"
    if (typeS === "discount" && !(Number(discValS) > 0)) return "กรุณาระบุมูลค่าส่วนลด"
    if (typeS === "discount" && discUnitS === "percent" && Number(discValS) > 100) return "ส่วนลด % ต้องไม่เกิน 100"
    if (typeS === "freebie" && !(Number(freeQtyS) > 0)) return "กรุณาระบุจำนวนของแถม"
    if (endDate < startDate) return "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม"
    return null
  }

  const save = async () => {
    const err = validate()
    if (err) {
      toast.error(<div style={{ ...kanit, fontSize: 14 }}>{err}</div>, { duration: 3000 })
      return
    }
    const payload = {
      company: companyS,
      name: nameS.trim() !== "" ? nameS.trim() :
        `${String(product.ProductName)} ${promoConditionText(previewPromo)} ${promoRewardText(previewPromo)}`,
      id_product: product.id,
      code_product: product.code,
      name_product: product.ProductName,
      unit: unitName,
      price_tier: tierS,
      promo_type: typeS,
      min_qty: Number(minQtyS) || 0,
      discount_unit: discUnitS,
      discount_scope: discScopeS,
      discount_value: typeS === "discount" ? (Number(discValS) || 0) : 0,
      free_qty: typeS === "freebie" ? (Number(freeQtyS) || 0) : 0,
      startdate: startDate,
      enddate: endDate,
      status: activeS ? "active" : "inactive",
      person: typeof window !== "undefined" ? (localStorage.getItem("person_") || "") : "",
    }
    try {
      if (editId === null) {
        await axios.post(`/api/${apiProductPromotion}`, payload)
      } else {
        await axios.put(`/api/${apiProductPromotion}/${editId}`, payload)
      }
      toast.success(<div style={{ ...kanit, fontSize: 14 }}>บันทึกโปรโมชั่นสินค้าเรียบร้อย</div>, { duration: 3000 })
      clearForm()
      fetchPromos()
    } catch (e) {
      console.error(e)
      toast.error(<div style={{ ...kanit, fontSize: 14 }}>บันทึกไม่สำเร็จ</div>, { duration: 3000 })
    }
  }

  const editPromo = (p: ProductPromo) => {
    setEditId(p.id)
    setNameS(String(p.name || ""))
    const prod = catalog.find((c: any) => c.id === p.id_product || c.code === p.code_product)
    setProduct(prod || { id: p.id_product, code: p.code_product, ProductName: p.name_product, Unit: p.unit })
    setTierS(String(p.price_tier || PROMO_TIER_ALL))
    setTypeS(String(p.promo_type) === "freebie" ? "freebie" : "discount")
    setMinQtyS(String(p.min_qty ?? ""))
    setDiscValS(p.discount_value ? String(p.discount_value) : "")
    setDiscUnitS(String(p.discount_unit) === "baht" ? "baht" : "percent")
    setDiscScopeS(String(p.discount_scope) === "bill" ? "bill" : "unit")
    setFreeQtyS(p.free_qty ? String(p.free_qty) : "")
    setStartDate(p.startdate ? new Date(p.startdate) : new Date())
    setEndDate(p.enddate ? new Date(p.enddate) : new Date())
    setActiveS(String(p.status) === "active")
  }

  const toggleStatus = async (p: ProductPromo) => {
    const next = String(p.status) === "active" ? "inactive" : "active"
    // อัปเดตหน้าจอทันที แล้วค่อยยิง API (ถ้าพลาดจะโหลดคืน)
    setPromos(promos.map((x) => x.id === p.id ? { ...x, status: next } : x))
    try {
      await axios.put(`/api/${apiProductPromotion}/${p.id}`, { status: next })
    } catch (e) {
      console.error(e)
      fetchPromos()
    }
  }

  const deletePromo = async (id: number) => {
    if (!window.confirm("ต้องการลบโปรโมชั่นนี้หรือไม่?")) return
    try {
      await axios.delete(`/api/${apiProductPromotion}/${id}`)
      if (editId === id) clearForm()
      fetchPromos()
    } catch (e) { console.error(e) }
  }

  const activeCount = promos.filter((p) => isPromoActiveNow(p)).length

  // ------- styles -------
  const labelStyle: React.CSSProperties = { ...kanit, fontSize: 12, width: 110, color: "GrayText" }
  const typeCard = (selected: boolean): React.CSSProperties => ({
    flex: 1,
    cursor: "pointer",
    borderRadius: 8,
    padding: "8px 10px",
    border: selected ? "2px solid #2A6AAA" : "1px solid #d1d5db",
    backgroundColor: selected ? "#F3F8FC" : "white",
    transition: "all .15s",
  })

  return (
    <div className="col-6" style={{ borderLeft: "1px solid #e5e7eb", paddingLeft: 18, maxHeight: "82vh", overflowY: "auto" }}>

      {/* ----- header ----- */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center mt-2 mb-1" style={{ gap: 8 }}>
          <Tag size={16} color="#2A6AAA" />
          <span style={{ ...kanitB, fontSize: 15 }}>โปรโมชั่นสินค้า</span>
          <span style={{
            ...kanit, fontSize: 10, backgroundColor: "#E5EEF8", color: "#1E5088",
            border: "1px solid #A6C8E7", borderRadius: 999, padding: "1px 8px"
          }}>
            ใช้งานอยู่ {activeCount} รายการ
          </span>
        </div>
        <div>
          <button
            type="button"
            className={editId === null ? "btn btn-success" : "btn btn-warning"}
            onClick={save}
            style={{ ...kanit, fontSize: 14 }}>
            {editId === null ? "บันทึก" : "แก้ไข"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={clearForm}
            style={{ ...kanit, fontSize: 14, marginLeft: 5 }}>
            ล้าง
          </button>
        </div>
      </div>

      {/* ----- ชื่อโปรโมชั่น ----- */}
      <div className="input-group">
        <span className="input-group-text" style={labelStyle}>ชื่อโปรโมชั่น</span>
        <input
          type="text"
          className="form-control"
          placeholder="(ไม่ระบุ = ตั้งชื่ออัตโนมัติ)"
          value={nameS}
          onChange={(e) => setNameS(e.target.value)}
          style={{ ...kanit, fontSize: 14 }} />
      </div>

      {/* ----- เลือกสินค้า ----- */}
      <div className="input-group mt-2">
        <span className="input-group-text" style={labelStyle}>สินค้า</span>
        <Popover open={openProduct} onOpenChange={setOpenProduct}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="form-control d-flex align-items-center justify-content-between"
              style={{ ...kanit, fontSize: 13, textAlign: "left", backgroundColor: "white", cursor: "pointer" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: product ? "#111827" : "#9ca3af" }}>
                {product ? `${product.code}  ${product.ProductName}` : "ค้นหาสินค้า (รหัส / ชื่อ / บาร์โค้ด)"}
              </span>
              <Search size={14} color="#6b7280" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start" style={{ width: 420 }}>
            <div style={{ padding: 8 }}>
              <input
                autoFocus
                className="form-control form-control-sm"
                placeholder="พิมพ์เพื่อค้นหา..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ ...kanit, fontSize: 13 }} />
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {filteredProducts.length === 0 &&
                <div style={{ ...kanit, fontSize: 12, color: "#6b7280", padding: 10 }}>ไม่พบสินค้า</div>}
              {filteredProducts.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => { setProduct(p); setOpenProduct(false) }}
                  className="d-flex justify-content-between align-items-center"
                  style={{ padding: "6px 10px", cursor: "pointer", borderTop: "1px solid #f3f4f6" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F8FC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...kanit, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.ProductName}</div>
                    <div style={{ ...kanit, fontSize: 10, color: "#6b7280" }}>{p.code} · {p.Unit || "-"}</div>
                  </div>
                  <div style={{ ...kanitB, fontSize: 12, color: "#1E5088", marginLeft: 8, whiteSpace: "nowrap" }}>{Number(p.price || 0)} ฿</div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ----- ระดับราคา ----- */}
      <div className="input-group mt-2">
        <span className="input-group-text" style={labelStyle}>ระดับราคา</span>
        <select
          className="form-select"
          value={tierS}
          onChange={(e) => setTierS(e.target.value)}
          style={{ ...kanit, fontSize: 12 }}>
          {TIER_OPTIONS.map((t) => <option key={t} value={t} style={{ ...kanit, fontSize: 12 }}>{t}</option>)}
        </select>
        <span className="input-group-text" style={{ ...kanit, fontSize: 12, color: "#1E5088", minWidth: 110, justifyContent: "center" }}>
          {product ? `ราคา ${refPrice} ฿/${unitName}` : "ราคา -"}
        </span>
      </div>

      {/* ----- รูปแบบโปรโมชั่น ----- */}
      <div className="d-flex mt-2" style={{ gap: 8 }}>
        <div style={typeCard(typeS === "discount")} onClick={() => setTypeS("discount")}>
          <div className="d-flex align-items-center" style={{ gap: 6 }}>
            <input type="radio" checked={typeS === "discount"} onChange={() => setTypeS("discount")} />
            <Tag size={13} color={typeS === "discount" ? "#2A6AAA" : "#6b7280"} />
            <span style={{ ...kanitB, fontSize: 12 }}>ส่วนลด</span>
          </div>
          <div style={{ ...kanit, fontSize: 10, color: "#6b7280", marginTop: 2 }}>ซื้อครบ/มากกว่า...ลดเป็น บาท หรือ %</div>
        </div>
        <div style={typeCard(typeS === "freebie")} onClick={() => setTypeS("freebie")}>
          <div className="d-flex align-items-center" style={{ gap: 6 }}>
            <input type="radio" checked={typeS === "freebie"} onChange={() => setTypeS("freebie")} />
            <Gift size={13} color={typeS === "freebie" ? "#2A6AAA" : "#6b7280"} />
            <span style={{ ...kanitB, fontSize: 12 }}>ของแถม</span>
          </div>
          <div style={{ ...kanit, fontSize: 10, color: "#6b7280", marginTop: 2 }}>ซื้อครบ...แถม... (คิดทวีคูณอัตโนมัติ)</div>
        </div>
      </div>

      {/* ----- เงื่อนไข ----- */}
      <div className="input-group mt-2" style={{ maxWidth: 330 }}>
        <span className="input-group-text" style={labelStyle}>ซื้อครบ/มากกว่า</span>
        <input
          type="number"
          min={0}
          className="form-control"
          value={minQtyS}
          onChange={(e) => setMinQtyS(e.target.value)}
          style={{ ...kanit, fontSize: 14, textAlign: "center" }} />
        <span className="input-group-text" style={{ ...kanit, fontSize: 12, minWidth: 70, justifyContent: "center" }}>{unitName}</span>
      </div>

      {typeS === "discount" ?
        <>
          <div className="input-group mt-1" style={{ maxWidth: 330 }}>
            <span className="input-group-text" style={labelStyle}>ลด</span>
            <input
              type="number"
              min={0}
              className="form-control"
              value={discValS}
              onChange={(e) => setDiscValS(e.target.value)}
              style={{ ...kanit, fontSize: 14, textAlign: "center" }} />
            <select
              className="form-select"
              value={discUnitS}
              onChange={(e) => setDiscUnitS(e.target.value as "percent" | "baht")}
              style={{ ...kanit, fontSize: 12, maxWidth: 80 }}>
              <option value="percent">%</option>
              <option value="baht">บาท</option>
            </select>
            {discUnitS === "baht" &&
              <select
                className="form-select"
                value={discScopeS}
                onChange={(e) => setDiscScopeS(e.target.value as "unit" | "bill")}
                style={{ ...kanit, fontSize: 12, maxWidth: 110 }}>
                <option value="unit">ต่อหน่วย</option>
                <option value="bill">ต่อรายการ</option>
              </select>}
          </div>
          {discUnitS === "percent" && product && Number(discValS) > 0 &&
            <div style={{ ...kanit, fontSize: 10, color: "#6b7280", marginTop: 2 }}>
              ≈ ลด {Math.round(refPrice * Number(discValS)) / 100} บาท/{unitName} (จากราคา {refPrice} ฿)
            </div>}
        </>
        :
        <div className="input-group mt-1" style={{ maxWidth: 330 }}>
          <span className="input-group-text" style={labelStyle}>แถม</span>
          <input
            type="number"
            min={0}
            className="form-control"
            value={freeQtyS}
            onChange={(e) => setFreeQtyS(e.target.value)}
            style={{ ...kanit, fontSize: 14, textAlign: "center" }} />
          <span className="input-group-text" style={{ ...kanit, fontSize: 12, minWidth: 70, justifyContent: "center" }}>{unitName}</span>
        </div>}

      {/* ----- ช่วงวันที่ + สถานะ ----- */}
      <div className="d-flex mt-2 align-items-center" style={{ gap: 5, flexWrap: "wrap" }}>
        <div style={{ ...kanit, fontSize: 12, width: 55 }}>เริ่ม วันที่ :</div>
        <Popover open={openStart} onOpenChange={setOpenStart}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start rounded" style={{ ...kanit, fontSize: 12, width: 120, height: 30 }}>
              <div style={{ width: 90 }}>{startDate.toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              captionLayout="dropdown"
              onSelect={(d) => { if (d) setStartDate(d); setOpenStart(false) }} />
          </PopoverContent>
        </Popover>

        <div style={{ ...kanit, fontSize: 12, width: 50, textAlign: "right", marginRight: 5 }}>ถึง วันที่ :</div>
        <Popover open={openEnd} onOpenChange={setOpenEnd}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start rounded" style={{ ...kanit, fontSize: 12, width: 120, height: 30 }}>
              <div style={{ width: 90 }}>{endDate.toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              captionLayout="dropdown"
              onSelect={(d) => { if (d) setEndDate(d); setOpenEnd(false) }} />
          </PopoverContent>
        </Popover>

        <div className="d-flex align-items-center" style={{ marginLeft: 10, gap: 5 }}>
          <Switch size="sm" isSelected={activeS} onValueChange={setActiveS} color="success" />
          <span style={{ ...kanit, fontSize: 12, color: activeS ? "#1E5088" : "#6b7280" }}>
            {activeS ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          </span>
        </div>
      </div>

      {/* ----- ตัวอย่างที่ผู้ขายเห็น ----- */}
      {product && Number(minQtyS) > 0 && (typeS === "discount" ? Number(discValS) > 0 : Number(freeQtyS) > 0) &&
        <div className="mt-2" style={{
          ...kanit, fontSize: 12, backgroundColor: "#F3F8FC", border: "1px dashed #A6C8E7",
          borderRadius: 8, padding: "6px 10px", color: "#1E5088"
        }}>
          {typeS === "freebie" ? "🎁" : "🏷️"} ตัวอย่าง : {String(product.ProductName)} — {promoConditionText({ ...previewPromo })} {promoRewardText({ ...previewPromo })}
          {tierS !== PROMO_TIER_ALL ? ` (เฉพาะ${tierS})` : ""}
        </div>}

      {/* ----- ตารางรายการโปร ----- */}
      <div className="mt-3">
        <table className="table table-hover">
          <thead>
            <tr>
              <th style={{ ...kanit, fontSize: 10 }}>ใช้งาน</th>
              <th style={{ ...kanit, fontSize: 10 }}>สินค้า</th>
              <th style={{ ...kanit, fontSize: 10 }}>ระดับราคา</th>
              <th style={{ ...kanit, fontSize: 10 }}>เงื่อนไข</th>
              <th style={{ ...kanit, fontSize: 10 }}>สิทธิ์ที่ได้</th>
              <th style={{ ...kanit, fontSize: 10 }}>ตั้งแต่</th>
              <th style={{ ...kanit, fontSize: 10 }}>ถึง</th>
              <th style={{ ...kanit, fontSize: 10 }}></th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 &&
              <tr><td colSpan={8} style={{ ...kanit, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>ยังไม่มีโปรโมชั่นสินค้า</td></tr>}
            {promos.map((p) => {
              const expired = !!p.enddate && new Date(new Date(p.enddate).setHours(23, 59, 59, 999)) < new Date()
              const activeNow = isPromoActiveNow(p)
              return (
                <tr key={p.id} onClick={() => editPromo(p)} style={{ cursor: "pointer", opacity: String(p.status) === "active" ? 1 : 0.55 }}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Switch
                      size="sm"
                      isSelected={String(p.status) === "active"}
                      onValueChange={() => toggleStatus(p)}
                      color="success" />
                  </td>
                  <td style={{ ...kanit, fontSize: 10 }}>
                    <div style={{ ...kanitB, fontSize: 10 }}>{p.name_product}</div>
                    <div style={{ color: "#6b7280" }}>{p.code_product}</div>
                    {activeNow &&
                      <span style={{ fontSize: 9, backgroundColor: "#E5EEF8", color: "#1E5088", borderRadius: 999, padding: "0px 6px" }}>กำลังใช้งาน</span>}
                  </td>
                  <td style={{ ...kanit, fontSize: 10 }}>{p.price_tier || PROMO_TIER_ALL}</td>
                  <td style={{ ...kanit, fontSize: 10 }}>{promoConditionText(p)}</td>
                  <td style={{ ...kanit, fontSize: 10, color: "#1E5088" }}>
                    {String(p.promo_type) === "freebie" ? "🎁 " : "🏷️ "}{promoRewardText(p)}
                  </td>
                  <td style={{ ...kanit, fontSize: 10 }}>{fmtDate(p.startdate)}</td>
                  <td style={{ ...kanit, fontSize: 10, color: expired ? "#dc2626" : undefined }}>
                    {fmtDate(p.enddate)}{expired ? " (หมดเขต)" : ""}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="btn btn-sm p-0 me-2" title="แก้ไข" onClick={() => editPromo(p)}>
                      <Pencil size={13} color="#d97706" />
                    </button>
                    <button type="button" className="btn btn-sm p-0" title="ลบ" onClick={() => deletePromo(p.id)}>
                      <Trash2 size={13} color="#dc2626" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
