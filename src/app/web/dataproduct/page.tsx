'use client'

import React, { useEffect, useState, createContext, useContext, Suspense, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import { usePermission } from '@/utils/usePermission'
import styles from "./../componant/mystyle.module.css";
import { Table } from 'react-bootstrap';
import MenuProductHead from '../componant/menuproducthead';
//import MenuProductHeadData from '../componant/menuproductheadata';
import ProductPagedata from "./product/dataproduct/updateproduct.tsx";
import CreateProductPagedata from './product/dataproduct/createproduct.tsx'
import StockCardproduct from './product/stockcard/page.tsx'
import Labelproduct from './product/label/page.tsx'
import Giftproduct from './product/gift/page.tsx'
import PediatricDosePage from './product/pediatric/page.tsx'
import StockCountModal from './product/stockcount/StockCountModal'
import StockChangeModal from './product/stockchange/StockChangeModal'
import PriceTagModal from './product/pricetag/PriceTagModal'
import StickerTagModal from './product/stickertag/StickerTagModal'
import StockBalanceSummary from './product/stockbalance/StockBalanceSummary'
import DrugSetModal from './product/drugset/DrugSetModal'
import { fetchBarcodeAliases, buildAliasesByCode } from '@/lib/barcodeAliasClient'

const widths = 70;
const widthsh = 70;

const widths1 = 90;
const widthsh1 = 100;

import Image from "next/image";
import Loading from "./loading.tsx";
import deletes from "../../icon/delete-junk.svg"
import cancel from "../../icon/cancel.jpg"

import LoadingOverlay from '../componant/LoadingOverlay';

const IDContext = createContext<any>(undefined)
import { useMessageStore } from "./useMessageStore";

const apis = "datalist"
const btncolors = "#3E86C7"
const btncolort = "white"

// Shown in the detail pane while no product is selected yet.
const EmptyProductPane = () => (
  <div style={{
    minHeight: "calc(83vh - 50px)", // ends level with the product list card next to it
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 28,
    fontFamily: "Kanit",
    color: "#94a3b8",
    textAlign: "center",
  }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.28 }}>
      <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z" />
    </svg>
    <div style={{ fontSize: 14 }}>เลือกสินค้าจากรายการด้านซ้าย</div>
    <div style={{ fontSize: 12, color: "#cbd5e1" }}>หรือกด &quot;+ เพิ่มสินค้า&quot; เพื่อสร้างรายการใหม่</div>
  </div>
)



function ProductPage() {

  const [loading, setLoading] = useState(true);
  const cpage = useMessageStore((state) => state.cpage)
  const setcpage = useMessageStore((state) => state.setcpage);
  useEffect(() => {
    setLoading(false);
  }, []);



  function Bodyproductdata() {

    const [showStockCountModal, setShowStockCountModal] = useState(false);
    const [showStockChangeModal, setShowStockChangeModal] = useState(false);
    const [showPriceTagModal, setShowPriceTagModal] = useState(false);
    const [showStickerTagModal, setShowStickerTagModal] = useState(false);
    const [showDrugSetModal, setShowDrugSetModal] = useState(false);
    const [isLevel2, setIsLevel2] = useState(false);

    useEffect(() => {

      // change background color with a random color
      const color = localStorage.getItem("bgcolor") || ""
      document.body.style.background = color;
      setIsLevel2(String(localStorage.getItem("level_") || "") === "level2")


    }, []);
    /*** API ************************************ */
    //Get Data
    const [posts, setPosts] = useState<any[]>([])
    const [searchname, setsearchname] = useState('')
    const [loadingData, setLoadingData] = useState(true)

    const [data1, setData1] = useState<any[]>(posts);
    const [search1, setsearch1] = useState("")
    const [selectedKY, setSelectedKY] = useState('')
    const [sortCodeAsc, setSortCodeAsc] = useState(true)
    const [sortNameAsc, setSortNameAsc] = useState<boolean | null>(null)
    const MAX_RENDER = 100
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Map: productCode -> list of sub-unit barcodes (จาก หน่วยในการขาย)
    const [subBarcodeMap, setSubBarcodeMap] = useState<Record<string, string[]>>({})
    // Map: productCode -> บาร์โค้ดสำรอง (สินค้าตัวเดียว หน่วยเดียว หลายบาร์โค้ด)
    // แยกจาก subBarcodeMap เพราะเป็นคนละความหมาย: อันนั้นคือคนละหน่วยขาย
    const [aliasBarcodeMap, setAliasBarcodeMap] = useState<Map<string, string[]>>(new Map())

    // Pre-computed lowercase search index — built once when posts or barcode maps change
    const searchIndex = useMemo(() => {
      return posts.map((p: any) => ({
        item: p,
        _name: (p.ProductName || '').toLowerCase(),
        _barcode: (p.Barcode || '').toLowerCase(),
        _code: (p.code || '').toLowerCase(),
        _subBarcodes: [
          ...(subBarcodeMap[p.code] || []),
          ...(aliasBarcodeMap.get(p.code) || []),
        ].map((b: string) => b.toLowerCase()),
      }))
    }, [posts, subBarcodeMap, aliasBarcodeMap])

    const kyFilterMap: Record<string, string[]> = {
      'ky9': ['ข.ย.9', 'ขย.9'],
      'ky10': ['ข.ย.10', 'ขย.10'],
      'ky11': ['ข.ย.11', 'ขย.11'],
      'ky12': ['ข.ย.12', 'ขย.12'],
      'ky13': ['ข.ย.13', 'ขย.13'],
    }


    useEffect(() => {

      fetchPosts()
      setcpage("1")
    }, [Number(cpage)])

    /***************************************** */

    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      setLoadingData(true)
      try {
        const res = await axios.get(`/api/${apis}?company=${companyS}&fields=list`)

        res.data !== undefined ? setPosts(res.data) : ""
        res.data !== undefined ? setData1(res.data) : ""
        //  console.log(res.data)

        // โหลด Barcode ของหน่วยในการขาย (หน่วยย่อย/หน่วยใหญ่) เพื่อใช้ค้นหา
        try {
          const ucRes = await axios.get(`/api/unitconversion?company=${companyS}`)
          const map: Record<string, string[]> = {}
          for (const uc of (ucRes.data || [])) {
            if (!uc.productCode || !uc.Barcode) continue
            if (!map[uc.productCode]) map[uc.productCode] = []
            map[uc.productCode].push(uc.Barcode)
          }
          setSubBarcodeMap(map)
        } catch (e) {
          console.error(e)
        }

        // บาร์โค้ดสำรอง — ค้นด้วยบาร์โค้ดตัวไหนของสินค้าก็ต้องเจอสินค้าตัวเดียวกัน
        try {
          setAliasBarcodeMap(buildAliasesByCode(await fetchBarcodeAliases(companyS)))
        } catch (e) {
          console.error(e)
        }

      } catch (error) {
        console.error(error)
      } finally {
        setLoadingData(false)
      }
    }

    /*
        const Searchproduct = async () => {
           let companyS= (localStorage.getItem("company_") || "")
      try {
       const res = await axios.get(`/api/${apis}?company=${companyS}&ProductName=${searchname}`)
       await setPosts(res.data)
    
   
  
  
      } catch (error) {
        console.error(error)
      }
    }
  */

    //**************************************** */
    // Delete/id
    const deletePost = async (id: Number) => {
      try {
        await axios.delete(`/api/${apis}/${id}`)
        await fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }



    const [showcolor, setshowcolor] = useState("")

    useEffect(() => {
      let value
      value = localStorage.getItem("bhs") || ""
      // แท็บที่ซ่อนปุ่มไปแล้ว (4 = ประวัติการตัด stock, 5 = ยาน้ำเด็ก, 7 = ของเดิม)
      // และค่าว่าง ให้เด้งกลับแท็บ "ข้อมูลยา" ไม่งั้นจะเปิดค้างอยู่หน้าที่ไม่มีปุ่มให้กดแล้ว
      if (value === "" || value === "4" || value === "5" || value === "7") {
        value = "1"
        localStorage.setItem("bhs", "1")
      }
      setshowcolor(value)

    }, [])

    const saveToLocalStorage = (e: any) => {
      e.preventDefault()
      localStorage.setItem("bhs", showcolor);
    }

    const setidcus = useMessageStore((state) => state.setidcus);
    const setitem = useMessageStore((state) => state.setitem);
    const setMax = useMessageStore((state) => state.setMax);

    const [idssw, setidss] = useState({ ids: "", itemcodes: "", maxSup: "" })

    const [chanhepage, setchanhepage] = useState(2)


    const maxV = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/datalist/next-code?company=${companyS}`)
        const maxValue = res.data?.maxValue ?? "10000"
        setMax(String(maxValue))
        setidss({ ...idssw, maxSup: String(maxValue) })
      } catch (error) {
        console.error(error)
        // Fallback to the in-memory list if the live lookup fails
        let result = posts.map((pp: any) => Number(pp.code)).filter((n: number) => !isNaN(n) && isFinite(n))
        let maxValue = result.length > 0 ? Math.max.apply(null, result) : 10000
        setMax(String(maxValue))
        setidss({ ...idssw, maxSup: String(maxValue) })
      }
    }

    //  ค้นหาสินค้า******************************* (Optimized with debounce + pre-computed index)
    const handleChange1 = useCallback((value: any) => {
      setsearch1(value);
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        filterDataProduct1(value)
      }, 150)
    }, [searchIndex]);

    // filter records by Productname — uses pre-computed lowercase index
    const filterDataProduct1 = useCallback((value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue !== "") {
        const filteredData: any[] = []
        for (let i = 0; i < searchIndex.length; i++) {
          const s = searchIndex[i]
          if (
            s._name.includes(lowercasedValue) ||
            s._barcode.includes(lowercasedValue) ||
            s._code.includes(lowercasedValue) ||
            s._subBarcodes.some((b: string) => b.includes(lowercasedValue))
          ) {
            filteredData.push(s.item)
          }
        }
        setData1(filteredData);
      }
      else {
        setData1(posts);
      }
    }, [searchIndex, posts]);
    const [l, setlevel] = useState([])
    const { hasPermission } = usePermission()
    // การมองเห็น
    useEffect(() => {
    }, []);


    return (

      <>
      <StockCountModal isOpen={showStockCountModal} onClose={() => setShowStockCountModal(false)} />
      <StockChangeModal isOpen={showStockChangeModal} onClose={() => setShowStockChangeModal(false)} />
      <PriceTagModal isOpen={showPriceTagModal} onClose={() => setShowPriceTagModal(false)} />
      <StickerTagModal isOpen={showStickerTagModal} onClose={() => setShowStickerTagModal(false)} />
      <DrugSetModal isOpen={showDrugSetModal} onClose={() => setShowDrugSetModal(false)} />
      <div className="row  "  >

        {/*Button head product */}
        <MenuProductHead />

        {/*Body search product */}
        <div className="col-3  rounded" style={{
          backgroundColor: "white",
          height: "83vh",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e8ecf0",
          overflow: "hidden"
        }}>
          {/* Header Section */}
          <div style={{
            background: "#f8fafc",
            padding: "10px 16px",
            borderBottom: "1px solid #e2e8f0",
            borderLeft: "4px solid #3E86C7",
            borderRadius: "0",
            marginBottom: "0"
          }}>
            <div style={{
              color: "#1e293b",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "Kanit",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{
                background: "#F3F8FC",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                border: "1px solid #E5EEF8"
              }}>📦 ข้อมูลสินค้า</span>

              {/* ตัวกรอง ข.ย. — ซ่อนไว้ (ลบ display:none เพื่อเปิดกลับ) */}
              <div style={{
                marginLeft: 'auto',
                display: 'none',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  padding: "2px 2px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "500",

                  color: "#494949ff",
                  backgroundColor: "#ffffffff"
                }}>ข.ย. :</div>

                <select
                  value={selectedKY}
                  onChange={(e) => {
                    const val = e.target.value
                    setSelectedKY(val)
                    if (!val) {
                      setData1(posts)
                    } else {
                      const matches = kyFilterMap[val] || []
                      setData1(posts.filter((p: any) => {
                        const t = (p.type || '').trim()
                        const st = (p.subtype || '').trim()
                        return matches.some((m: string) => t.includes(m) || st.includes(m))
                      }))
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    fontFamily: 'Kanit',
                    color: selectedKY ? '#2A6AAA' : '#64748b',
                    backgroundColor: selectedKY ? '#F3F8FC' : 'white',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">ทั้งหมด</option>
                  <option value="ky9">ข.ย.9</option>
                  <option value="ky10">ข.ย.10</option>
                  <option value="ky11">ข.ย.11</option>
                  <option value="ky12">ข.ย.12</option>
                  <option value="ky13">ข.ย.13</option>
                </select>
              </div>
            </div>
          </div>

          {/*ค้นหา ข้อมูล */}
          <div style={{
            padding: "10px 12px",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e8ecf0"
          }}>
            <div style={{
              display: "flex",
              gap: "10px",
              alignItems: "center"
            }}>
              <div style={{
                position: "relative",
                flex: 1
              }}>
                <span style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: "14px"
                }}>🔍</span>
                <input
                  value={search1}
                  onChange={(e) => { handleChange1(e.target.value) }}
                  placeholder="ค้นหาชื่อสินค้า, รหัส, Barcode (รวมหน่วยขาย)..."
                  style={{
                    fontFamily: "Kanit",
                    fontSize: "12px",
                    width: "100%",
                    padding: "8px 10px 8px 32px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    transition: "all 0.2s ease",
                    outline: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3E86C7";
                    e.target.style.boxShadow = "0 0 0 3px rgba(62, 134, 199, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                  }}
                />
              </div>
              <button
                onClick={() => { setchanhepage(1), setshowcolor("1"), maxV(), setcpage("1") }}
                type="button"
                style={{
                  fontFamily: "Kanit",
                  fontSize: "11px",
                  padding: "8px 12px",
                  background: "linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(62, 134, 199, 0.3)",
                  whiteSpace: "nowrap",
                  fontWeight: "500"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(62, 134, 199, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(62, 134, 199, 0.3)";
                }}
              >
                + เพิ่มสินค้า
              </button>
            </div>
          </div>

          <Suspense fallback={<Loading />}>
            <div style={{
              height: "calc(100% - 90px)",
              overflowY: "auto",
              overflowX: "hidden"
            }}>
              {/* Custom Table Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr 50px",
                backgroundColor: "#f1f5f9",
                padding: "12px 16px",
                borderBottom: "2px solid #e2e8f0",
                position: "sticky",
                top: 0,
                zIndex: 10,
                fontFamily: "Kanit",
                fontSize: "12px",
                fontWeight: "600",
                color: "#475569"
              }}>
                <div
                  onClick={() => {
                    const newAsc = !sortCodeAsc
                    setSortCodeAsc(newAsc)
                    setSortNameAsc(null)
                    const sorted = [...data1].sort((a: any, b: any) => {
                      const cA = parseInt(a.code) || 0
                      const cB = parseInt(b.code) || 0
                      return newAsc ? cA - cB : cB - cA
                    })
                    setData1(sorted)
                  }}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  รหัส {sortCodeAsc ? "▲" : "▼"}
                </div>
                <div
                  onClick={() => {
                    const newAsc = sortNameAsc === null ? true : !sortNameAsc
                    setSortNameAsc(newAsc)
                    setSortCodeAsc(true)
                    const sorted = [...data1].sort((a: any, b: any) => {
                      const nA = (a.ProductName || '').toLowerCase()
                      const nB = (b.ProductName || '').toLowerCase()
                      return newAsc ? nA.localeCompare(nB) : nB.localeCompare(nA)
                    })
                    setData1(sorted)
                  }}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  ชื่อสินค้า {sortNameAsc === null ? "" : sortNameAsc ? "▲" : "▼"}
                </div>
                <div style={{ textAlign: "center" }}>สถานะ</div>
              </div>

              {/* Table Body */}
              {loadingData ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 16px',
                  color: '#94a3b8',
                  fontFamily: 'Kanit',
                  fontSize: '13px',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid #e5e7eb',
                    borderTopColor: '#3E86C7',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  กำลังโหลดข้อมูลสินค้า...
                </div>
              ) : data1.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 16px',
                  color: '#94a3b8',
                  fontFamily: 'Kanit',
                  fontSize: '13px'
                }}>
                  ไม่พบข้อมูลสินค้า
                </div>
              ) : (<>{data1.length > MAX_RENDER && (
                <div style={{
                  textAlign: 'center', padding: '6px 0', fontFamily: 'Kanit', fontSize: '11px',
                  color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0'
                }}>
                  แสดง {MAX_RENDER} จาก {data1.length} รายการ — พิมพ์เพิ่มเพื่อจำกัดผลลัพธ์
                </div>
              )}
              {data1.slice(0, MAX_RENDER).map((post: any, index: number) => (
                <div
                  key={post.id}
                  onClick={() => {
                    setidss({ ...idssw, ids: post.id, itemcodes: post.code });
                    setidcus(String(post.id));
                    setitem(String(post.code));
                    setchanhepage(2);
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "70px 1fr 50px",
                    padding: "12px 16px",
                    backgroundColor: index % 2 === 0 ? "white" : "#fafbfc",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    fontFamily: "Kanit",
                    fontSize: "12px",
                    alignItems: "center"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#F3F8FC";
                    e.currentTarget.style.borderLeft = "3px solid #3E86C7";
                    e.currentTarget.style.paddingLeft = "13px";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#fafbfc";
                    e.currentTarget.style.borderLeft = "none";
                    e.currentTarget.style.paddingLeft = "16px";
                  }}
                >
                  <div style={{
                    color: "#2A6AAA",
                    fontWeight: "600",
                    fontSize: "11px"
                  }}>
                    {post.code}
                  </div>
                  <div style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    lineHeight: "1.35",
                    color: "#334155",
                    paddingRight: "8px"
                  }}>
                    {post.ProductName}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    {post.Show === "False" || post.Show === "FALSE" || post.Show === "false" ? (
                      <span style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#3E86C7",
                        borderRadius: "50%",
                        boxShadow: "0 0 6px rgba(62, 134, 199, 0.4)"
                      }}></span>
                    ) : (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#fef2f2",
                        borderRadius: "50%",
                        border: "1px solid #fecaca"
                      }}>
                        <span style={{ color: "#ef4444", fontSize: "10px" }}>✕</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}</>)}
            </div>
          </Suspense>
        </div>

        {/*Body ข้อมูลยา/ฉลากยา/ค่าหยิบยา/Stockยา */}
        <div className="col-9    shadow-sm rounded border  " style={{ backgroundColor: "white" }}  >

          {/*Button body data product */}
          <div className=''>
            <div className='container mt-1' >
              <div className="btn-group-sm" role="group" aria-label="Basic outlined example" >
                <button onClick={() => { setshowcolor("1"), saveToLocalStorage }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "1" ? btncolors : "white", color: showcolor == "1" ? btncolort : "gray" }}>ข้อมูลสินค้า</button>
                <button onClick={() => { setshowcolor("2"), saveToLocalStorage }} type="button" className="btn btn-outline-secondary " style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "2" ? btncolors : "white", color: showcolor == "2" ? btncolort : "gray", display: "none" }}>ภาษาฉลากสินค้า</button>
                {hasPermission("D1") ?
                  <button onClick={() => { setshowcolor("4"), saveToLocalStorage }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "4" ? btncolors : "white", color: showcolor == "4" ? btncolort : "gray", display: "none" }}>ประวัติการตัด stock</button>
                  : ""}

                {hasPermission("C2") ?
                  <button onClick={() => { setshowcolor("3"), saveToLocalStorage }} type="button" className="btn btn-outline-secondary " style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "3" ? btncolors : "white", color: showcolor == "3" ? btncolort : "gray" }}>ตั้งค่าเชียร์สินค้า</button>
                  : ""}

                <button onClick={() => { setShowStockCountModal(true) }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", fontWeight: 500 }}>นับสินค้า</button>
                {hasPermission("D2") ?

                  <button onClick={() => { setShowStockChangeModal(true) }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontWeight: 500, display: "none" }}>ปรับ Lot และ ยอดคงเหลือ</button>

                  : ""}
                <button onClick={() => { setShowPriceTagModal(true) }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: "#F3F8FC", color: "#2A6AAA", border: "1px solid #CCDFF1", fontWeight: 500 }}>🏷️ ป้ายราคา</button>
                <button onClick={() => { setShowStickerTagModal(true) }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", fontWeight: 500 }}>🎯 สติ๊กเกอร์ ติดสินค้า</button>
                <button onClick={() => { setshowcolor("5"), saveToLocalStorage }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "5" ? btncolors : "white", color: showcolor == "5" ? btncolort : "gray", display: "none" }}>💧 สินค้าน้ำเด็ก</button>
                {isLevel2 ?
                  <button onClick={() => { setShowDrugSetModal(true) }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showDrugSetModal ? "#0891b2" : "#ecfeff", color: showDrugSetModal ? "white" : "#0e7490", border: "1px solid #a5f3fc", fontWeight: 600 }}>จัดชุดสินค้า</button>
                  : ""}
                <button onClick={() => { setshowcolor("6"), saveToLocalStorage }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "6" ? "#173F6B" : "#F3F8FC", color: showcolor == "6" ? "white" : "#173F6B", border: "1px solid #CCDFF1", fontWeight: 600 }}>📊 สรุปยอดคงเหลือ</button>

              </div>
            </div>
          </div>
          <div className=''>
            {/** */}

            {showcolor === "1" ?
              <IDContext.Provider value={idssw}>
                {chanhepage == 1 ? <CreateProductPagedata /> : idssw.ids === "" ? <EmptyProductPane /> : <ProductPagedata />}
              </IDContext.Provider> :
              showcolor === "2" ?
                <IDContext.Provider value={idssw}>
                  {idssw.ids === "" ? <EmptyProductPane /> : <Labelproduct />}
                </IDContext.Provider> :
                showcolor === "3" ?
                  <IDContext.Provider value={idssw}>
                    {idssw.ids === "" ? <EmptyProductPane /> : <><Giftproduct /></>}
                  </IDContext.Provider> :

                  showcolor === "5" ?
                  <IDContext.Provider value={idssw}>
                    {idssw.ids === "" ? <EmptyProductPane /> : <PediatricDosePage />}
                  </IDContext.Provider> :

                  showcolor === "6" ?
                  <IDContext.Provider value={idssw}>
                    {idssw.ids === "" ? <EmptyProductPane /> : <StockBalanceSummary />}
                  </IDContext.Provider> :

                  <IDContext.Provider value={idssw}>
                    {idssw.ids === "" ? <EmptyProductPane /> : <StockCardproduct />}
                  </IDContext.Provider>}




          </div>
          {/*Button body data */}

        </div>



      </div>
      </>

    )



  }



  return (

    <>
      <LoadingOverlay show={loading} />
      <div className="" style={{ paddingLeft: 15, paddingRight: 15 }}  >

        <div className="row justify-content-start " >
          <HeadTab />
        </div>

        <div className="row justify-content-start " >

          <div className="col-sm-1" >
            <MenuTab_Small />
          </div>

          <div className="col-sm-11">

            <Bodyproductdata />

          </div>


        </div>
      </div>
    </>
  )
}
export default ProductPage



