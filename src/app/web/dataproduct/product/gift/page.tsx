
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { usePermission } from '@/utils/usePermission'
import styles from "../../../componant/mystyle.module.css";
import { Table } from 'react-bootstrap';
import Image from "next/image";
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
//import { useAppContext } from '../../page';
import { useMessageStore } from "../../useMessageStore";
const widthsh = 70;
const widths1 = 90;
const widthsh1 = 100;
import deletes from "../../../../icon/delete-junk.svg"

const apis = "datalist"
const apiitemRC = "receivelist"
const apisaleitem = "sale_cal/sale_list_item"
const apibalance = "sale_cal/sale_balance"
const apigiftlist = "gift/giftlist"
import { Toaster, toast } from "sonner"

function Giftproduct() {





  // const {ids} =useAppContext(); 
  //  const {itemcodes} =useAppContext(); 
  const ids = useMessageStore((state) => state.ids)
  const itemcodes = useMessageStore((state) => state.itemcodes)


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

  const [all, setall1] = useState(initialValues)
  const [itembalance, setbalance] = useState<any[]>([])
  const [giftlist, setgiftlist] = useState<any[]>([])
  const [gifts, setgift] = useState("1")
  const [listReady, setListReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [keyword, setKeyword] = useState("")
  const syncedCodeRef = useRef<string>("")
  const activeRowRef = useRef<HTMLTableRowElement | null>(null)

  const currentCode = String(all.code || "").trim()

  // รายการค่าหยิบเดิมของสินค้าที่กำลังเปิดอยู่ (ถ้ามี = กดบันทึกแล้วจะเป็นการแก้ไข)
  const existingGift = useMemo(
    () => giftlist.find((g: any) => String(g.code_product || "").trim() === currentCode && currentCode !== ""),
    [giftlist, currentCode]
  )

  // รหัสที่มีมากกว่า 1 รายการ (ข้อมูลซ้ำที่ค้างจากระบบเดิม) เพื่อให้ผู้ใช้เห็นและลบออกได้
  const duplicateCodes = useMemo(() => {
    const count = new Map<string, number>()
    giftlist.forEach((g: any) => {
      const code = String(g.code_product || "").trim()
      if (code) count.set(code, (count.get(code) || 0) + 1)
    })
    return new Set(Array.from(count.entries()).filter(([, n]) => n > 1).map(([code]) => code))
  }, [giftlist])

  const filteredGiftlist = useMemo(() => {
    const key = keyword.trim().toLowerCase()
    if (!key) return giftlist
    return giftlist.filter((g: any) =>
      String(g.code_product || "").toLowerCase().includes(key) ||
      String(g.name_product || "").toLowerCase().includes(key)
    )
  }, [giftlist, keyword])

  const costValue = Number(itembalance.map((r: any) => r.cost))
  const cost = Number.isFinite(costValue) ? costValue : 0
  const priceValue = Number(all.price) || 0
  const giftValue = Number(gifts)
  const newProfit = priceValue - cost - (Number.isFinite(giftValue) ? giftValue : 0)
  const newProfitPercent = priceValue > 0 ? Math.trunc((newProfit / priceValue) * 100) : 0
  const giftInvalid = gifts === "" || !Number.isFinite(giftValue) || giftValue < 0
  //const   itemCode=String(all.filter((s:any)=>s.id===ids).map((s:any)=>s.itemcode))

  //console.log(itemRC)

  useEffect(() => {

    const useMyHook = async () => {
      try {
        await fetchPost()
        await fetchGet_Giftlist()
        await fetchGet_Balance()
      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [ids])




  const fetchPost = async () => {
    try {
      const res = await axios.get(`/api/${apis}/${Number(ids)}`)

      setall1(res.data)

    } catch (error) {
      console.error(error)
    }

  }



  const fetchGet_Balance = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const idQuery = ids ? `&id=${ids}` : ''
      const res = await axios.get(`/api/${apibalance}?company=${companyS}&code_product=${itemcodes}${idQuery}`)

      setbalance(res.data)

    } catch (error) {
      console.error(error)
    }

  }

  const fetchGet_Giftlist = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apigiftlist}?company=${companyS}`)

      setgiftlist(res.data)

    } catch (error) {
      console.error(error)
    } finally {
      setListReady(true)
    }

  }
  const AlertComplete = (mode: "created" | "updated", value: number) => {
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>{mode === "updated" ? "แก้ไขสำเร็จ" : "บันทึกสำเร็จ"}</div>, {
      description: (
        <div style={{ fontFamily: "Kanit", fontSize: 18 }}>
          {mode === "updated" ? "แก้ไขค่าหยิบเป็น " : "เพิ่มค่าหยิบ "}{value} บาท เรียบร้อย
        </div>
      ),
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };

  const AlertError = (message: string) => {
    toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 18 }}>{message}</div>,
      duration: 3000,
    });
  };

  // เติมค่าหยิบเดิมลงช่องกรอก เมื่อเปลี่ยนสินค้า (ไม่ทับค่าที่ผู้ใช้กำลังพิมพ์อยู่)
  useEffect(() => {
    if (!currentCode || !listReady) return
    if (syncedCodeRef.current === currentCode) return
    syncedCodeRef.current = currentCode
    setgift(existingGift ? String(existingGift.gift ?? 0) : "1")
  }, [currentCode, listReady, existingGift])

  // เลื่อนรายการด้านขวาไปยังสินค้าที่กำลังแก้ไข
  useEffect(() => {
    if (!existingGift) return
    activeRowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [existingGift, keyword])

  // Post Data
  const CleckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return

    const company = (localStorage.getItem("company_") || "")
    const code_product = currentCode
    const id_product = Number(all.id)
    const name_product = all.ProductName
    const gift = Number(gifts)
    const person = ""

    if (!code_product) {
      AlertError("กรุณาเลือกสินค้าก่อนบันทึกค่าหยิบ")
      return
    }
    if (giftInvalid) {
      AlertError("ค่าหยิบต้องเป็นตัวเลข และห้ามติดลบ")
      return
    }

    setSaving(true)
    try {
      const res = await axios.post(`/api/${apigiftlist}`,
        {
          company, code_product, id_product, name_product, gift, person
        }
      )

      await fetchGet_Giftlist()
      AlertComplete(res.data?.mode === "updated" ? "updated" : "created", gift)

    } catch (error) {
      console.error(error)
      AlertError("บันทึกค่าหยิบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setSaving(false)
    }
  }

  //**************************************** */
  // Delete/id
  const deletePost = async (id: Number, name?: string) => {
    if (!confirm(`ต้องการลบค่าหยิบของ ${name || "รายการนี้"} หรือไม่?`)) return
    try {
      await axios.delete(`/api/${apigiftlist}/${id}`)
      await fetchGet_Giftlist()
    } catch (error) {
      console.error('Failed to delete the post', error)
      AlertError("ลบค่าหยิบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    }
  }


  const handleInputChange = (e: any) => {
    const { name, value } = e.target;

    setall1({
      ...all,
      [name]: value,
    });




  };




  useEffect(() => {
  }, []);
  const [l, setlevel] = useState([])
  const { hasPermission } = usePermission()



  return (
    <form className='form'>
      <div className={styles.productFormContainer}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

          {/* Left Column - Product Info & Pricing */}
          {hasPermission("C3") ? (
            <div>
              {/* Product Info Card */}
              <div className={styles.productInfoCard} style={{ marginBottom: 10, border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{
                  background: '#f8fafc',
                  padding: '10px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  borderLeft: '4px solid #3E86C7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Kanit_B',
                  fontSize: '14px',
                  color: '#1e293b'
                }}>
                  <span style={{ fontSize: '18px' }}>📦</span> ข้อมูลสินค้า
                </div>
                <div className={styles.productInfoCardBody}>
                  {/* Code & Barcode */}
                  <div className={styles.productFormRow}>
                    <label className={styles.productFormLabel}>รหัสสินค้า :</label>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: 11, color: '#333', minWidth: 80 }}>{all.code}</div>
                    <label className={styles.productFormLabelSm}>Barcode :</label>
                    <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#666' }}>{all.Barcode}</div>
                  </div>

                  {/* Product Name */}
                  <div className={styles.productFormRow}>
                    <label className={styles.productFormLabel}>ชื่อสินค้า :</label>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{all.ProductName}</div>
                  </div>

                  {/* Generic Name */}
                  <div className={styles.productFormRow} style={{ display: 'none' }}>
                    <label className={styles.productFormLabel}>ชื่อสามัญ :</label>
                    <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666' }}>{all.fixname}</div>
                  </div>

                  {/* Drug Group */}
                  <div className={styles.productFormRow} style={{ display: 'none' }}>
                    <label className={styles.productFormLabel}>กลุ่มสินค้า :</label>
                    <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666' }}>{all.group}</div>
                  </div>

                  {/* Report Type & Balance */}
                  <div className={styles.productFormRow} style={{ display: 'none' }}>
                    <label className={styles.productFormLabel}>รายงาน ขย :</label>
                    <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 60 }}>{all.type}{all.subtype == null ? "" : " / "}{all.subtype}</div>
                    <label className={styles.productFormLabelSm} style={{ fontWeight: 'bold', color: '#2A6AAA', display: 'none' }}>คงเหลือ :</label>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#2A6AAA', display: 'none' }}>{itembalance.map((r: any) => r.balance)} {all.Unit}</div>
                  </div>

                  {/* Category & Area */}
                  <div className={styles.productFormRow}>
                    <label className={styles.productFormLabel}>หมวด :</label>
                    <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 80 }}>{all.Category}</div>
                    <label className={styles.productFormLabelSm}>พื้นที่เก็บ :</label>
                    <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666' }}>{all.Area}</div>
                  </div>

                  {/* Unit */}
                  <div className={styles.productFormRow}>
                    <label className={styles.productFormLabel}>หน่วย :</label>
                    <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666' }}>{all.Unit}</div>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className={styles.pricingCard} style={{ marginBottom: 10, border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{
                  background: '#f8fafc',
                  padding: '8px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  borderLeft: '4px solid #2A6AAA',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Kanit_B',
                  fontSize: '14px',
                  color: '#1e293b'
                }}>
                  <span style={{ fontSize: '18px' }}>💰</span> ข้อมูลราคาและกำไร
                </div>
                <div className={styles.pricingCardBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {/* Left: Prices */}
                    <div>
                      <div className={styles.productFormRow}>
                        <label className={styles.productFormLabel} style={{ color: '#2A6AAA' }}>ราคาขาย :</label>
                        <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#2A6AAA' }}>{all.price} บาท</div>
                      </div>
                      <div className={styles.productFormRow}>
                        <label className={styles.productFormLabel} style={{ color: '#147F56' }}>กำไร :</label>
                        <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#2A6AAA' }}>{Number(all.price) - Number(itembalance.map((r: any) => r.cost))} บาท</div>
                      </div>
                      <div className={styles.productFormRow}>
                        <label className={styles.productFormLabel} style={{ color: '#f59e0b' }}>ค่าหยิบ :</label>
                        <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#f59e0b' }}>{giftlist.find((g: any) => g.code_product === all.code)?.gift ?? 0} บาท</div>
                      </div>
                    </div>
                    {/* Right: Cost & Percentage */}
                    <div>
                      <div className={styles.productFormRow}>
                        <label className={styles.productFormLabel} style={{ color: '#2A6AAA' }}>ราคาทุน :</label>
                        <div style={{ fontFamily: 'Kanit', fontSize: 13, color: '#2A6AAA' }}>{itembalance.map((r: any) => r.cost)} บาท</div>
                      </div>
                      <div className={styles.productFormRow}>
                        <label className={styles.productFormLabel} style={{ color: '#147F56' }}>%กำไร :</label>
                        <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#2A6AAA' }}>{parseInt(String((Number(all.price) - Number(itembalance.map((r: any) => r.cost))) / (Number(all.price)) * 100))} %</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gift Input Card */}
              <div className={styles.pricingCard} style={{ border: `1px solid ${existingGift ? '#fcd34d' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{
                  background: '#f8fafc',
                  padding: '8px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${existingGift ? '#f59e0b' : '#2A6AAA'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Kanit_B',
                  fontSize: '14px',
                  color: '#1e293b'
                }}>
                  <span style={{ fontSize: '18px' }}>🎁</span> ค่าหยิบและกำไรใหม่
                  <span style={{
                    marginLeft: 'auto',
                    fontFamily: 'Kanit',
                    fontSize: 10,
                    padding: '2px 10px',
                    borderRadius: 999,
                    background: existingGift ? '#fef3c7' : '#E5EEF8',
                    color: existingGift ? '#b45309' : '#1E5088',
                    border: `1px solid ${existingGift ? '#fcd34d' : '#CCDFF1'}`
                  }}>
                    {existingGift ? '✏️ แก้ไขรายการเดิม' : '➕ เพิ่มรายการใหม่'}
                  </span>
                </div>
                <div className={styles.pricingCardBody}>
                  {/* สถานะรายการเดิม */}
                  {existingGift ? (
                    <div style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 8,
                      padding: '6px 10px',
                      marginBottom: 10,
                      fontFamily: 'Kanit',
                      fontSize: 11,
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap'
                    }}>
                      <span>สินค้านี้มีค่าหยิบอยู่แล้ว</span>
                      <b style={{ fontFamily: 'Kanit_B', fontSize: 13 }}>{existingGift.gift ?? 0}</b>
                      <span>บาท</span>
                      {!giftInvalid && giftValue !== Number(existingGift.gift ?? 0) ? (
                        <>
                          <span style={{ color: '#b45309' }}>→</span>
                          <b style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#dc2626' }}>{giftValue}</b>
                          <span>บาท</span>
                        </>
                      ) : null}
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#a16207' }}>กดบันทึกเพื่อแก้ไขค่าเดิม (ไม่เพิ่มรายการซ้ำ)</span>
                    </div>
                  ) : null}

                  {/* Gift Input */}
                  <div className={styles.productFormRow} style={{ marginBottom: 10 }}>
                    <label className={styles.productFormLabel} style={{ color: '#2A6AAA', fontWeight: 'bold' }}>ค่าหยิบ :</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={gifts}
                      onChange={(e) => setgift(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); CleckSubmit(e) } }}
                      className="form-control form-control-sm"
                      style={{ fontFamily: 'Kanit_B', width: 70, textAlign: 'center', color: '#dc2626', borderColor: giftInvalid ? '#dc2626' : '#2A6AAA' }}
                    />
                    <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#2A6AAA', marginLeft: 8 }}>บาท</span>
                    {giftInvalid ? (
                      <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#dc2626', marginLeft: 10 }}>กรอกตัวเลข 0 ขึ้นไป</span>
                    ) : null}
                  </div>

                  {/* New Profit */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div className={styles.productFormRow}>
                      <label className={styles.productFormLabel} style={{ color: '#2A6AAA' }}>กำไรใหม่ :</label>
                      <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: newProfit < 0 ? '#dc2626' : '#2A6AAA' }}>{newProfit} บาท</div>
                    </div>
                    <div className={styles.productFormRow}>
                      <label className={styles.productFormLabel} style={{ color: '#2A6AAA' }}>%กำไรใหม่ :</label>
                      <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: newProfit < 0 ? '#dc2626' : '#2A6AAA' }}>{newProfitPercent} %</div>
                    </div>
                  </div>

                  {newProfit < 0 ? (
                    <div style={{ marginTop: 8, fontFamily: 'Kanit', fontSize: 10, color: '#dc2626' }}>
                      ⚠️ ค่าหยิบสูงกว่ากำไร ทำให้กำไรใหม่ติดลบ
                    </div>
                  ) : null}

                  {/* Save Button */}
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <button
                      type="button"
                      className={existingGift ? "btn btn-warning" : "btn btn-success"}
                      onClick={CleckSubmit}
                      disabled={saving || giftInvalid || !currentCode}
                      style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 24px', borderRadius: 6, color: existingGift ? '#78350f' : undefined }}
                    >
                      {saving ? '⏳ กำลังบันทึก...' : existingGift ? '✏️ แก้ไขค่าหยิบ' : '💾 บันทึกค่าหยิบ'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : ""}

          {/* Right Column - Gift List */}
          <div className={styles.pricingCard} style={{ background: '#fffcf5', border: '1px solid #ffe4e6', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{
              background: '#fef2f2',
              padding: '8px 16px',
              borderBottom: '1px solid #fee2e2',
              borderLeft: '4px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Kanit_B',
              fontSize: '14px',
              color: '#1e293b'
            }}>
              <span style={{ fontSize: '18px' }}>🎁</span> ข้อมูลสินค้าหยิบ {giftlist.length} รายการ
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {keyword.trim() ? (
                  <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b' }}>พบ {filteredGiftlist.length} รายการ</span>
                ) : null}
                <input
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="🔍 ค้นหารหัส / ชื่อสินค้า"
                  className="form-control form-control-sm"
                  style={{ fontFamily: 'Kanit', fontSize: 11, width: 180, height: 28 }}
                />
              </div>
            </div>
            <div className={styles.pricingCardBody} style={{ padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
              <Table className="table" size="sm">
                <thead style={{ position: 'sticky', top: 0, background: '#fef3c7' }}>
                  <tr>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "15%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>รหัสสินค้า</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "55%", textAlign: "left", fontSize: 9, fontWeight: 'bold' }}>สินค้า</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "15%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>ค่าหยิบ (บาท)</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, fontWeight: 'bold' }}>ลบ</td>
                  </tr>
                </thead>
                <tbody className="table-group-divider">
                  {filteredGiftlist.map((p: any) => {
                    const isActive = currentCode !== "" && String(p.code_product || "").trim() === currentCode
                    return (
                      <tr
                        key={p.id}
                        ref={isActive ? activeRowRef : null}
                        style={isActive ? { background: '#fef3c7', boxShadow: 'inset 3px 0 0 #f59e0b' } : undefined}
                      >
                        <td className={styles.bodydetailTable_Re1} style={{ textAlign: "center", fontSize: 10, fontWeight: isActive ? 'bold' : undefined }}>{p.code_product}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ textAlign: "left", fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 'bold' : undefined }}>
                          {p.name_product}
                          {isActive ? <span style={{ marginLeft: 6, fontFamily: 'Kanit', fontSize: 9, color: '#b45309' }}>• กำลังแก้ไข</span> : null}
                          {duplicateCodes.has(String(p.code_product || "").trim()) ? (
                            <span title="รหัสนี้มีมากกว่า 1 รายการ ควรลบรายการซ้ำออก" style={{ marginLeft: 6, fontFamily: 'Kanit', fontSize: 9, color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 999, padding: '0 6px' }}>ซ้ำ</span>
                          ) : null}
                        </td>
                        <td className={styles.bodydetailTable_Re1} style={{ textAlign: "center", fontWeight: "bold", fontSize: 13, color: '#dc2626' }}>{p.gift}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ textAlign: "center" }}>
                          {hasPermission("C3") ? (
                            <button
                              type="button"
                              title="ลบค่าหยิบ"
                              onClick={() => deletePost(p.id, p.name_product)}
                              style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
                            >
                              <Image alt="" src={deletes} width={12} height={12} />
                            </button>
                          ) : ""}
                        </td>
                      </tr>
                    )
                  })}
                  {listReady && filteredGiftlist.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8', padding: '18px 0' }}>
                        {keyword.trim() ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีข้อมูลสินค้าหยิบ'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export default Giftproduct
