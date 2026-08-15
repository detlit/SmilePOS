
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'

import MenuTab_Small from "../../componant/menutab_small.tsx"
import HeadTab from "../../componant/headtab.jsx"
import MenuProductHead from "../../componant/menuproducthead.jsx"
import styles from "../../componant/mystyle.module.css";

import { Table } from 'react-bootstrap';
import Image from "next/image";
import deletes from "../../../icon/delete-junk.svg"
import edits from "../../../icon/editSS.png"
import { time } from 'console'
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
import { Edit } from 'lucide-react'
import Modal1 from 'react-bootstrap/Modal';
import Button1 from 'react-bootstrap/Button';


import { Toaster, toast } from "sonner"
const apiindicatorlist = "label/indicatorlist"
const apitimes = "label/times"
const apitimeL = "label/timeL"
const apiuseL = "label/useL"
const apitimeuseL = "label/timeuseL"
const apikeepL = "label/keepL"
const apiRemarkL = "label/remarkL"

const apilanguage = "language"

const btncolors = "grayText"
const btncolort = "white"

const AVAILABLE_TARGETS = [
  { code: 'zh', label: 'Chinese (zh)' },
  { code: 'lo', label: 'Lao (lo)' },
  { code: 'my', label: 'Myanmar (my)' },
  { code: 'km', label: 'Khmer (km)' },
  { code: 'en', label: 'English (en-US)' },
]

type Result = { target: string; translatedText: string; mirror: string }

// ตัวอย่าง ข้อบ่งใช้ (standalone component to preserve scroll position)
const IndicatorSearchEx = ({ postsA, posts, onAdd, styles }: { postsA: any[], posts: any[], onAdd: (list: string, id: number) => void, styles: any }) => {
  const [data, setData] = useState(postsA);
  const [search1, setsearch1] = useState("")

  useEffect(() => { setData(postsA); }, [postsA]);

  const handleChange1 = (value: any) => {
    setsearch1(value);
    const lowercasedValue = value.toLowerCase().trim();
    if (lowercasedValue === "") setData(postsA);
    else {
      setData(postsA.filter((user: any) =>
        user.list.toLowerCase().includes(lowercasedValue)
      ));
    }
  };

  return (
    <div className="row ">
      <div className={styles.gatagory_head} style={{ color: "#4b5563", marginTop: 5 }}>ตัวอย่าง ข้อบ่งใช้</div>
      <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <table className="table table-sm table-hover mt-1" >
          <thead style={{ position: "sticky", top: "0" }}>
            <tr>
              <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%", color: "#4b5563" }}>
                ข้อบ่งใช้
                <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                  <input
                    value={search1}
                    onChange={(e) => handleChange1(e.target.value)}
                    className="form-control form-control-sm"
                    placeholder="ค้นหาข้อบ่งใช้"
                    style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                </div>
              </th>
              <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%", color: "#4b5563" }}>เพิ่ม</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {data.map((post: any) => {
              const rowB = posts.find((r: any) => r.list === post.list);
              return (
                <tr key={post.id} >
                  <td className={styles.bodydetailTable_Re1}
                    style={{
                      color: "#4b5563",
                      background: rowB && rowB.list === post.list ? "#f0f0f0ff" : "transparent"
                    }}>{post.list}</td>
                  <td className={styles.bodydetailTable_Re1} style={{ color: "#4b5563" }}>
                    <button onClick={() => onAdd(post.list, post.id)}>
                      เพิ่ม
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ตัวอย่าง ช่วงเวลา/เวลาที่ใช้/วิธีเก็บรักษา/หมายเหตุ (shared standalone component)
const TimeStyleSearchEx = ({ postsA, posts, onAdd, styles, title, placeholder }: { postsA: any[], posts: any[], onAdd: (t: string, id: number) => void, styles: any, title: string, placeholder: string }) => {
  const [data, setData] = useState(postsA);
  const [search1, setsearch1] = useState("")

  useEffect(() => { setData(postsA); }, [postsA]);

  const handleChange1 = (value: any) => {
    setsearch1(value);
    const lowercasedValue = value.toLowerCase().trim();
    if (lowercasedValue === "") setData(postsA);
    else {
      setData(postsA.filter((user: any) =>
        user.t.toLowerCase().includes(lowercasedValue)
      ));
    }
  };

  return (
    <div className="row ">
      <div className={styles.gatagory_head} style={{ color: "#4b5563", marginTop: 5 }}>{title}</div>
      <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <table className="table table-sm table-hover mt-1" >
          <thead style={{ position: "sticky", top: "0" }}>
            <tr>
              <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%", color: "#4b5563" }}>
                {placeholder}
                <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                  <input
                    value={search1}
                    onChange={(e) => handleChange1(e.target.value)}
                    className="form-control form-control-sm"
                    placeholder={placeholder}
                    style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                </div>
              </th>
              <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%", color: "#4b5563" }}>เพิ่ม</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {data.map((post: any) => {
              const rowB = posts.find((r: any) => r.list === post.t);
              return (
                <tr key={post.id} >
                  <td className={styles.bodydetailTable_Re1}
                    style={{
                      color: "#4b5563",
                      background: rowB && rowB.list === post.t ? "#f0f0f0ff" : "transparent"
                    }}>{post.t}</td>
                  <td className={styles.bodydetailTable_Re1} style={{ color: "#4b5563" }}>
                    <button onClick={() => onAdd(post.t, post.id)}>
                      เพิ่ม
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ตัวอย่าง วิธีใช้ (standalone component for Body_Use1)
const UseSearchEx = ({ postsA, posts, language, onSubmit, styles }: { postsA: any[], posts: any[], language: any[], onSubmit: (data: { fullname: string, list: string, qty: string, unit: string }) => void, styles: any }) => {
  const [data, setData] = useState(postsA);
  const [search1, setsearch1] = useState("")

  useEffect(() => { setData(postsA); }, [postsA]);

  const handleChange1 = (value: any) => {
    setsearch1(value);
    const lowercasedValue = value.toLowerCase().trim();
    if (lowercasedValue === "") setData(postsA);
    else {
      setData(postsA.filter((user: any) =>
        user.t.toLowerCase().includes(lowercasedValue)
      ));
    }
  };

  return (
    <div className="row ">
      <div className={styles.gatagory_head} style={{ color: "#4b5563", marginTop: 5 }}>ตัวอย่าง ช่วงเวลา</div>
      <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <table className="table table-sm table-hover mt-1" >
          <thead style={{ position: "sticky", top: "0" }}>
            <tr>
              <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%", color: "#4b5563" }}>
                วิธีใช้สินค้า
                <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                  <input
                    value={search1}
                    onChange={(e) => handleChange1(e.target.value)}
                    className="form-control form-control-sm"
                    placeholder="ค้นหาช่วงเวลา"
                    style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                </div>
              </th>
              <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%", color: "#4b5563" }}>เพิ่ม</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {data.map((post: any) => (
              <tr key={post.id} style={{ height: 20 }}>
                <td className={styles.bodydetailTable_Re1} style={{ width: "90%", color: "#4b5563" }}>{post.fullname}</td>
                <td className={styles.bodydetailTable_Re1} style={{ width: "10%", color: "#4b5563" }} >
                  <button
                    type='button'
                    className="btn btn-link "
                    style={{ fontFamily: "kanit", fontSize: 9, height: 20, width: 40 }}
                    onClick={() => onSubmit({ fullname: post.fullname, list: post.list, qty: post.qty, unit: post.unit })}>เพิ่ม </button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ข้อบ่งใช้ New
const Body_Indicator = () => {

  interface PostItem {
    id: number;
    list: string;
  }

  //Get Data
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsA, setPostsA] = useState<PostItem[]>([]);
  const [list, setlist] = useState('')
  const [listid, setlistid] = useState(0)
  const [language, setlanguage] = useState([])
  const [isImported, setIsImported] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiindicatorlist}?company=${companyS}`)
      const resA = await axios.get(`/api/${apiindicatorlist}?company=A`)
      const languageS = await axios.get(`/api/${apilanguage}`)
      setPosts(res.data)
      setPostsA(resA.data)
      setlanguage(languageS.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchPosts()
    checkImportStatus()
  }, [])

  const checkImportStatus = async () => {
    try {
      const res = await axios.get('/api/indicator/import-csv')
      setIsImported(res.data.imported)
    } catch (error) {
      console.error('Failed to check import status', error)
    }
  }

  const handleImportCSV = async () => {
    if (isImported || isImporting) return
    
    setIsImporting(true)
    try {
      const res = await axios.post('/api/indicator/import-csv')
      if (res.data.success) {
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
          duration: 3000,
        })
        setIsImported(true)
        await fetchPosts()
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
        duration: 3000,
      })
    } finally {
      setIsImporting(false)
    }
  }

  useEffect(() => {

    fetchPosts()
    listid === 0 ? "" : CleckSubmit()
  }, [listid])


  const AlertComplete = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };

  // Post  สร้าง แปลภาษา จาก list ข้อมูลกลาง
  const CleckSubmit = async () => {
    // ตรวจสอบข้อมูลซ้ำ
    if (posts.some((p) => p.list === list)) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ข้อมูลซ้ำ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>"{list}" มีอยู่แล้ว ไม่สามารถเพิ่มซ้ำได้</div>,
        duration: 3000,
      });
      setlist("")
      setlistid(0)
      return
    }
    let company = (localStorage.getItem("company_") || "")
    const list_lo = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo))
    const list_my = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my))
    const list_km = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km))
    const list_zh = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh))
    const list_eng = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng))
    try {
      await axios.post(`/api/${apiindicatorlist}`,
        {
          company, list, list_lo, list_my, list_km, list_zh, list_eng
        }
      )
      AlertComplete()
      await fetchPosts()
      setlist("")
      setlistid(0)
    }

    catch (error) {
      console.error(error)
    }
  }

  // แปลภาษา สร้างใหม่     
  function TranslatePage() {
    const [text, setText] = useState("")
    const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
    const [results, setResults] = useState<Record<string, Result>>({})
    const [error, setError] = useState<string | null>(null)
    const [loadingTran, setLoadingTran] = useState(false)

    function toggle(code: string) {
      setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
    }

    // 🟢 Auto-translate per language with debounce
    useEffect(() => {
      if (!text) return
      setLoadingTran(true)
      const timer = setTimeout(async () => {
        setResults({}) // clear previous results
        setError(null)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targets: selected }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()
          const newResults: Record<string, any> = {}
          data.results.forEach((r: any) => { newResults[r.target] = r })
          setResults(newResults)
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoadingTran(false)
        }
      }, 500)

      return () => { clearTimeout(timer); setLoadingTran(false) }
    }, [text, selected])



    let zh_T = results.zh;
    let lo_T = results.lo;
    let my_T = results.my;
    let km_T = results.km;
    let en_T = results.en;


    //Post สร้าง แปลภาษาใหม่
    const CleckSubmitCreate = async () => {
      const list = String(text)
      const list_lo = String(lo_T !== undefined ? lo_T.translatedText : "")
      const list_my = String(my_T !== undefined ? my_T.translatedText : "")
      const list_km = String(km_T !== undefined ? km_T.translatedText : "")
      const list_zh = String(zh_T !== undefined ? zh_T.translatedText : "")
      const list_eng = String(en_T !== undefined ? en_T.translatedText : "")
      let company = (localStorage.getItem("company_") || "")
      try {
        await axios.post(`/api/${apiindicatorlist}`,
          {
            company, list, list_lo, list_my, list_km, list_zh, list_eng
          }
        )
        AlertComplete()
        await fetchPosts()
        setText("")

      }

      catch (error) {
        console.error(error)
      }
    }

    // Input Key ข้อมูล
    const CrateInput = () => {
      const [listW, setlistW] = useState('')



      const CleckTran = () => {
        setText(listW);
      }
      const handlist = async (e: any) => {
        setlistW(e.target.value);
        localStorage.setItem("tr", e.target.value)

      };


      return (
        <div className="d-flex" style={{ marginTop: 5 }}>
          <input
            type="text"
            value={listW}
            onChange={handlist}
            className="form-control form-control-sm"
            placeholder="กรอก ข้อมูลข้อบ่งใช้"
            style={{ fontFamily: "Kanit", width: 170, fontSize: 10 }}
          />
          <button onClick={() => CleckTran()} type="button" className="btn btn-outline-secondary" disabled={loadingTran} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 25 }}>{loadingTran ? "กำลังแปล..." : "แปลภาษา"}</button>

        </div>
      )

    }

    return (
      <div>
        <div className='row'>

          <CrateInput />
          <div style={{ fontFamily: "kanit_B", fontSize: 12, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาไทย : {text}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาจีน : {zh_T !== undefined ? zh_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาลาว :{lo_T !== undefined ? lo_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาพม่า :{my_T !== undefined ? my_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาเขมร :{km_T !== undefined ? km_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาอังกฤษ :{en_T !== undefined ? en_T.translatedText : ""}</div>

        </div>
        <div style={{ justifySelf: "center" }}>
          <button onClick={() => CleckSubmitCreate()} type="button" className="btn btn-outline-primary mt-2" style={{ fontFamily: "kanit", fontSize: 10, height: 25, width: 70, justifyItems: "center" }}>สร้าง</button>
        </div>
      </div>
    )

  }

  //***แปลภาษา แก้ไข    *************/
  const SearchS = () => {
    const [data, setData] = useState(posts);
    const [search1, setsearch1] = useState("")
    const [idss, setidss] = useState('')
    const [listE, setlistE] = useState('')

    const handleChange1 = (value: any) => {
      setsearch1(value);
      filterDataProduct1(value);
    };

    // filter records by Productname
    const filterDataProduct1 = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData(posts);
      else {
        const filteredData = data.filter((user: any) =>
          user.list.toLowerCase().includes(search1.toLowerCase())
          //  || user.code.toLowerCase().includes(search.toLowerCase())  
          //  || user.Barcode.toLowerCase().includes(search.toLowerCase())                                       
        );
        setData(filteredData);
      }
    };

    // แปลภาษา Edit       
    function TranslatePageE() {


      const [text, setText] = useState(listE)
      const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
      const [results, setResults] = useState<Record<string, Result>>({})
      const [error, setError] = useState<string | null>(null)

      const [ZH_E, setZH_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh)))
      const [LO_E, setLO_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo)))
      const [MY_E, setMY_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my)))
      const [KM_E, setKM_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km)))
      const [EN_E, setEN_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng)))

      function toggle(code: string) {
        setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
      }

      // 🟢 Auto-translate per language with debounce
      useEffect(() => {
        if (!text) return


        selected.forEach(async (target) => {
          try {
            const resp = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, targets: [target] }),
            })
            if (!resp.ok) throw new Error(await resp.text())
            const data = await resp.json()
            setResults((prev) => ({ ...prev, [target]: data.results[0], }))

          } catch (err: any) {
            setResults((prev) => ({
              ...prev,
              [target]: { target, translatedText: `ERROR: ${err.message}`, mirror: '' },
            }))
          }
        })



      }, [Number(text), selected])

      let zh_T = results.zh;
      let lo_T = results.lo;
      let my_T = results.my;
      let km_T = results.km;
      let en_T = results.en;


      const [search, setsearch] = useState(listE)
      const [loading, setLoading] = useState(false)

      const handleChange = (value: any) => {
        setsearch(value);
        localStorage.setItem("list_Indi", value)
      };

      const T_zh = (value: any) => {
        setZH_E(value);
        localStorage.setItem("zh_Indi", value)
      };

      const T_lo = (value: any) => {
        setLO_E(value);
        localStorage.setItem("lo_Indi", value)
      };

      const T_my = (value: any) => {
        setMY_E(value);
        localStorage.setItem("my_Indi", value)
      };

      const T_en = (value: any) => {
        setEN_E(value);
        localStorage.setItem("en_Indi", value)
      };

      const Tran = async () => {
        if (!search) return
        setLoading(true)
        setText(search)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: search, targets: ['zh', 'lo', 'my', 'km', 'en'] }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()

          const resultsMap: Record<string, any> = {}
          data.results.forEach((r: any) => { resultsMap[r.target] = r })

          setZH_E(resultsMap.zh?.translatedText || "")
          setLO_E(resultsMap.lo?.translatedText || "")
          setMY_E(resultsMap.my?.translatedText || "")
          setKM_E(resultsMap.km?.translatedText || "")
          setEN_E(resultsMap.en?.translatedText || "")

          localStorage.setItem("list_Indi", search)
          localStorage.setItem("zh_Indi", resultsMap.zh?.translatedText || "")
          localStorage.setItem("lo_Indi", resultsMap.lo?.translatedText || "")
          localStorage.setItem("my_Indi", resultsMap.my?.translatedText || "")
          localStorage.setItem("en_Indi", resultsMap.en?.translatedText || "")
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoading(false)
        }
      }

      return (
        <>
          <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ข้อบ่งใช้</div>
          <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
            <div className='d-flex'>
              <input
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                className="form-control form-control-sm"
                placeholder=""
                style={{ fontFamily: "Kanit", fontSize: 12, height: 12 }} />
              <button onClick={() => Tran()} type="button" className="btn btn-outline-primary" disabled={loading} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 30 }}>{loading ? "กำลังแปล..." : "แปล"}</button>
            </div>
          </div>


          <div className='row'>
            {/*ลาว*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาลาว :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_lo)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={LO_E}
                  onChange={(e) => T_lo(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*พม่า*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาพม่า :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_my)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={MY_E}
                  onChange={(e) => T_my(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*อังกฤษ*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาอังกฤษ :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_eng)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={EN_E}
                  onChange={(e) => T_en(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*จีน*/}
            <div className='col mt-2 mb-3' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาจีน :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_zh)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={ZH_E}
                  onChange={(e) => T_zh(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>


          </div>
        </>
      )

    }

    // แก้ไขภาษา
    function Edit_list() {

      //*******Show Modal **********************************/
      const [show1, setShow1] = useState(false);
      const handleClose = () => setShow1(false);
      const handleShow = () => { setShow1(true) };
      const handleClose1 = () => { handleSubmit(), setShow1(false) };
      //***************************************************************** */


      return (
        <>
          <Image alt={""} src={edits} quality={40} color='grayText' onClick={handleShow} />


          <Modal1 show={show1} onHide={handleClose}>
            <Modal1.Header closeButton>
              <Modal1.Title
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                แก้ไข
              </Modal1.Title>
            </Modal1.Header>
            <Modal1.Body>
              <div>


                <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <TranslatePageE />
                </div>

              </div>


            </Modal1.Body>
            <Modal1.Footer>
              <Button1
                variant="secondary"
                onClick={handleClose}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
              >
                ปิด
              </Button1>
              <Button1
                variant="warning"
                onClick={handleClose1}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}

              >
                แก้ไข
              </Button1>
            </Modal1.Footer>
          </Modal1>
        </>
      );
    }

    /************************************ */
    // Edit/id
    const handleSubmit = async () => {
      let company = (localStorage.getItem("company_") || "")
      const list = String(localStorage.getItem("list_Indi") || "")
      const list_lo = String(localStorage.getItem("lo_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("lo_Indi") || "")
      const list_my = String(localStorage.getItem("my_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("my_Indi") || "")
      //  const list_km=String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))===""?String(KM):String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))
      const list_zh = String(localStorage.getItem("zh_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("zh_Indi") || "")
      const list_eng = String(localStorage.getItem("en_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("en_Indi") || "")


      try {
        await axios.put(`/api/${apiindicatorlist}/${idss}`,
          {
            list, company, list_lo, list_my, list_zh, list_eng
          }
        )
        await fetchPosts()
        setlist("")



      } catch (error) {
        console.error(error)
      }
    }

    // Delete/id
    const deletePost = async (id: Number) => {
      try {
        await axios.delete(`/api/${apiindicatorlist}/${id}`)
        await fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }
    return (
      <>
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <table className="table table-sm table-hover mt-1" >
            <thead style={{ position: "sticky", top: "0" }}>
              <tr>

                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%" }}>
                  ข้อบ่งใช้
                  <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                    <input
                      value={search1}
                      onChange={(e) => handleChange1(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาข้อบ่งใช้"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>
                </th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>แก้ไข ภาษา</th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>ลบ</th>

              </tr>
            </thead>
            <tbody className="table-group-divider">
              {data.map((post: any) => (
                <tr key={post.id}>

                  <td className={styles.bodydetailTable_Re1} style={{ width: "70%", fontSize: 12 }}>{post.list}</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => { setidss(post.id), setlistE(post.list) }} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Edit_list />
                    </button>

                  </td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => deletePost(post.id)} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Image alt={""} src={deletes} quality={40} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </>
    )
  }


  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>

      {/* Create Card */}
      <div className={styles.productInfoCard}>
        <div className={styles.productInfoCardHeader}>
          <span>➕</span> สร้าง ข้อบ่งใช้
        </div>
        <div className={styles.productInfoCardBody}>
          <TranslatePage />
        </div>
      </div>

      {/* Data List Card */}
      <div className={styles.pricingCard}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' }}>
          <span>💊</span> ข้อมูล ข้อบ่งใช้
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <SearchS />
        </div>
      </div>

      {/* Sample Card */}
      <div className={styles.pricingCard} style={{ background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)' }}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)', color: '#1E5088', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span>📋</span> ตัวอย่าง ข้อบ่งใช้</div>
          <button
            onClick={handleImportCSV}
            disabled={isImported || isImporting}
            style={{
              background: isImported ? '#9ca3af' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              padding: '4px 12px',
              fontSize: 11,
              fontFamily: 'Kanit',
              cursor: isImported || isImporting ? 'not-allowed' : 'pointer',
              opacity: isImported ? 0.7 : 1
            }}
          >
            {isImporting ? '⏳ กำลังนำเข้า...' : isImported ? '✅ นำเข้าแล้ว' : '🔄 GEN'}
          </button>
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <IndicatorSearchEx postsA={postsA} posts={posts} onAdd={(l, id) => { setlist(l); setlistid(id); }} styles={styles} />
        </div>
      </div>

    </div>
  )
}

// ช่วงเวลา New
const Body_Time1 = () => {

  interface PostItem {
    id: number;
    list: string;
  }

  interface PostItem1 {
    id: number;
    t: string;
  }

  //Get Data
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsA, setPostsA] = useState<PostItem1[]>([]);
  const [list, setlist] = useState('')
  const [listid, setlistid] = useState(0)
  const [language, setlanguage] = useState([])

  const PA_time = postsA.filter((r: any) => r.name === "A")
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apitimeL}?company=${companyS}`)
      const resA = await axios.get(`/api/${apitimes}`)
      const languageS = await axios.get(`/api/${apilanguage}`)
      setPosts(res.data)
      setPostsA(resA.data)
      setlanguage(languageS.data)
    } catch (error) {
      console.error(error)
    }
  }
  //******************************** */

  useEffect(() => {

    fetchPosts()
    listid === 0 ? "" : CleckSubmit()
  }, [listid])

  const AlertComplete = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };
  // Post  สร้าง แปลภาษา จาก list ข้อมูลกลาง
  const CleckSubmit = async () => {
    // ตรวจสอบข้อมูลซ้ำ
    if (posts.some((p: any) => p.list === list)) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ข้อมูลซ้ำ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>"{list}" มีอยู่แล้ว ไม่สามารถเพิ่มซ้ำได้</div>,
        duration: 3000,
      });
      setlist("")
      setlistid(0)
      return
    }
    let company = (localStorage.getItem("company_") || "")
    const list_lo = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo))
    const list_my = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my))
    const list_km = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km))
    const list_zh = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh))
    const list_eng = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng))
    try {
      await axios.post(`/api/${apitimeL}`,
        {
          company, list, list_lo, list_my, list_km, list_zh, list_eng
        }
      )
      AlertComplete()
      await fetchPosts()
      setlist("")
      setlistid(0)
    }

    catch (error) {
      console.error(error)
    }
  }

  // แปลภาษา สร้างใหม่     
  function TranslatePage() {
    const [text, setText] = useState("")
    const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
    const [results, setResults] = useState<Record<string, Result>>({})
    const [error, setError] = useState<string | null>(null)
    const [loadingTran, setLoadingTran] = useState(false)

    function toggle(code: string) {
      setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
    }

    // 🟢 Auto-translate per language with debounce
    useEffect(() => {
      if (!text) return
      setLoadingTran(true)
      const timer = setTimeout(async () => {
        setResults({}) // clear previous results
        setError(null)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targets: selected }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()
          const newResults: Record<string, any> = {}
          data.results.forEach((r: any) => { newResults[r.target] = r })
          setResults(newResults)
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoadingTran(false)
        }
      }, 500)

      return () => { clearTimeout(timer); setLoadingTran(false) }
    }, [text, selected])



    let zh_T = results.zh;
    let lo_T = results.lo;
    let my_T = results.my;
    let km_T = results.km;
    let en_T = results.en;


    //Post สร้าง แปลภาษาใหม่
    const CleckSubmitCreate = async () => {
      const list = String(text)
      const list_lo = String(lo_T !== undefined ? lo_T.translatedText : "")
      const list_my = String(my_T !== undefined ? my_T.translatedText : "")
      const list_km = String(km_T !== undefined ? km_T.translatedText : "")
      const list_zh = String(zh_T !== undefined ? zh_T.translatedText : "")
      const list_eng = String(en_T !== undefined ? en_T.translatedText : "")
      let company = (localStorage.getItem("company_") || "")
      try {
        await axios.post(`/api/${apitimeL}`,
          {
            company, list, list_lo, list_my, list_km, list_zh, list_eng
          }
        )
        AlertComplete()
        await fetchPosts()
        setText("")

      }

      catch (error) {
        console.error(error)
      }
    }

    // Input Key ข้อมูล
    const CrateInput = () => {
      const [listW, setlistW] = useState('')



      const CleckTran = () => {
        setText(listW);
      }
      const handlist = async (e: any) => {
        setlistW(e.target.value);
        localStorage.setItem("tr", e.target.value)

      };


      return (
        <div className="d-flex" style={{ marginTop: 5 }}>
          <input
            type="text"
            value={listW}
            onChange={handlist}
            className="form-control form-control-sm"
            placeholder="กรอก ช่วงเวลา"
            style={{ fontFamily: "Kanit", width: 170, fontSize: 10 }}
          />
          <button onClick={() => CleckTran()} type="button" className="btn btn-outline-secondary" disabled={loadingTran} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 25 }}>{loadingTran ? "กำลังแปล..." : "แปลภาษา"}</button>

        </div>
      )

    }

    return (
      <div>
        <div className='row'>

          <CrateInput />
          <div style={{ fontFamily: "kanit_B", fontSize: 12, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาไทย : {text}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาจีน : {zh_T !== undefined ? zh_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาลาว :{lo_T !== undefined ? lo_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาพม่า :{my_T !== undefined ? my_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาเขมร :{km_T !== undefined ? km_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาอังกฤษ :{en_T !== undefined ? en_T.translatedText : ""}</div>

        </div>
        <div style={{ justifySelf: "center" }}>
          <button onClick={() => CleckSubmitCreate()} type="button" className="btn btn-outline-primary mt-2" style={{ fontFamily: "kanit", fontSize: 10, height: 25, width: 70, justifyItems: "center" }}>สร้าง</button>
        </div>
      </div>
    )

  }

  //***แปลภาษา แก้ไข    *************/
  const SearchS = () => {
    const [data, setData] = useState(posts);
    const [search1, setsearch1] = useState("")
    const [idss, setidss] = useState('')
    const [listE, setlistE] = useState('')

    const handleChange1 = (value: any) => {
      setsearch1(value);
      filterDataProduct1(value);
    };

    // filter records by Productname
    const filterDataProduct1 = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData(posts);
      else {
        const filteredData = data.filter((user: any) =>
          user.list.toLowerCase().includes(search1.toLowerCase())
          //  || user.code.toLowerCase().includes(search.toLowerCase())  
          //  || user.Barcode.toLowerCase().includes(search.toLowerCase())                                       
        );
        setData(filteredData);
      }
    };

    // แปลภาษา Edit       
    function TranslatePageE() {


      const [text, setText] = useState(listE)
      const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
      const [results, setResults] = useState<Record<string, Result>>({})
      const [error, setError] = useState<string | null>(null)

      const [ZH_E, setZH_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh)))
      const [LO_E, setLO_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo)))
      const [MY_E, setMY_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my)))
      const [KM_E, setKM_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km)))
      const [EN_E, setEN_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng)))

      function toggle(code: string) {
        setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
      }

      // 🟢 Auto-translate per language with debounce
      useEffect(() => {
        if (!text) return


        selected.forEach(async (target) => {
          try {
            const resp = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, targets: [target] }),
            })
            if (!resp.ok) throw new Error(await resp.text())
            const data = await resp.json()
            setResults((prev) => ({ ...prev, [target]: data.results[0], }))

          } catch (err: any) {
            setResults((prev) => ({
              ...prev,
              [target]: { target, translatedText: `ERROR: ${err.message}`, mirror: '' },
            }))
          }
        })



      }, [Number(text), selected])

      let zh_T = results.zh;
      let lo_T = results.lo;
      let my_T = results.my;
      let km_T = results.km;
      let en_T = results.en;


      const [search, setsearch] = useState(listE)
      const [loading, setLoading] = useState(false)

      const handleChange = (value: any) => {
        setsearch(value);
        localStorage.setItem("list_Indi", value)
      };

      const T_zh = (value: any) => {
        setZH_E(value);
        localStorage.setItem("zh_Indi", value)
      };

      const T_lo = (value: any) => {
        setLO_E(value);
        localStorage.setItem("lo_Indi", value)
      };

      const T_my = (value: any) => {
        setMY_E(value);
        localStorage.setItem("my_Indi", value)
      };

      const T_en = (value: any) => {
        setEN_E(value);
        localStorage.setItem("en_Indi", value)
      };

      const Tran = async () => {
        if (!search) return
        setLoading(true)
        setText(search)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: search, targets: ['zh', 'lo', 'my', 'km', 'en'] }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()

          const resultsMap: Record<string, any> = {}
          data.results.forEach((r: any) => { resultsMap[r.target] = r })

          setZH_E(resultsMap.zh?.translatedText || "")
          setLO_E(resultsMap.lo?.translatedText || "")
          setMY_E(resultsMap.my?.translatedText || "")
          setKM_E(resultsMap.km?.translatedText || "")
          setEN_E(resultsMap.en?.translatedText || "")

          localStorage.setItem("list_Indi", search)
          localStorage.setItem("zh_Indi", resultsMap.zh?.translatedText || "")
          localStorage.setItem("lo_Indi", resultsMap.lo?.translatedText || "")
          localStorage.setItem("my_Indi", resultsMap.my?.translatedText || "")
          localStorage.setItem("en_Indi", resultsMap.en?.translatedText || "")
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoading(false)
        }
      }

      return (
        <>
          <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ช่วงเวลา</div>
          <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
            <div className='d-flex'>
              <input
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                className="form-control form-control-sm"
                placeholder=""
                style={{ fontFamily: "Kanit", fontSize: 12, height: 12 }} />
              <button onClick={() => Tran()} type="button" className="btn btn-outline-primary" disabled={loading} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 30 }}>{loading ? "กำลังแปล..." : "แปล"}</button>
            </div>
          </div>


          <div className='row'>
            {/*ลาว*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาลาว :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_lo)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={LO_E}
                  onChange={(e) => T_lo(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*พม่า*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาพม่า :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_my)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={MY_E}
                  onChange={(e) => T_my(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*อังกฤษ*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาอังกฤษ :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_eng)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={EN_E}
                  onChange={(e) => T_en(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*จีน*/}
            <div className='col mt-2 mb-3' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาจีน :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_zh)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={ZH_E}
                  onChange={(e) => T_zh(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>


          </div>
        </>
      )

    }

    // แก้ไขภาษา
    function Edit_list() {

      //*******Show Modal **********************************/
      const [show1, setShow1] = useState(false);
      const handleClose = () => setShow1(false);
      const handleShow = () => { setShow1(true) };
      const handleClose1 = () => { handleSubmit(), setShow1(false) };
      //***************************************************************** */


      return (
        <>
          <Image alt={""} src={edits} quality={40} color='grayText' onClick={handleShow} />


          <Modal1 show={show1} onHide={handleClose}>
            <Modal1.Header closeButton>
              <Modal1.Title
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                แก้ไข
              </Modal1.Title>
            </Modal1.Header>
            <Modal1.Body>
              <div>


                <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <TranslatePageE />
                </div>

              </div>


            </Modal1.Body>
            <Modal1.Footer>
              <Button1
                variant="secondary"
                onClick={handleClose}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
              >
                ปิด
              </Button1>
              <Button1
                variant="warning"
                onClick={handleClose1}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}

              >
                แก้ไข
              </Button1>
            </Modal1.Footer>
          </Modal1>
        </>
      );
    }

    /************************************ */
    // Edit/id
    const handleSubmit = async () => {
      let company = (localStorage.getItem("company_") || "")
      const list = String(localStorage.getItem("list_Indi") || "")
      const list_lo = String(localStorage.getItem("lo_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("lo_Indi") || "")
      const list_my = String(localStorage.getItem("my_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("my_Indi") || "")
      //  const list_km=String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))===""?String(KM):String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))
      const list_zh = String(localStorage.getItem("zh_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("zh_Indi") || "")
      const list_eng = String(localStorage.getItem("en_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("en_Indi") || "")


      try {
        await axios.put(`/api/${apitimeL}/${idss}`,
          {
            list, company, list_lo, list_my, list_zh, list_eng
          }
        )
        await fetchPosts()
        setlist("")



      } catch (error) {
        console.error(error)
      }
    }

    // Delete/id
    const deletePost = async (id: Number) => {
      try {
        await axios.delete(`/api/${apitimeL}/${id}`)
        await fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }
    return (
      <>
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <table className="table table-sm table-hover mt-1" >
            <thead style={{ position: "sticky", top: "0" }}>
              <tr>

                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%" }}>
                  ช่วงเวลา
                  <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                    <input
                      value={search1}
                      onChange={(e) => handleChange1(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาช่วงเวลา"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>
                </th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>แก้ไข ภาษา</th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>ลบ</th>

              </tr>
            </thead>
            <tbody className="table-group-divider">
              {data.map((post: any) => (
                <tr key={post.id}>

                  <td className={styles.bodydetailTable_Re1} style={{ width: "70%", fontSize: 12 }}>{post.list}</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => { setidss(post.id), setlistE(post.list) }} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Edit_list />
                    </button>

                  </td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => deletePost(post.id)} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Image alt={""} src={deletes} quality={40} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </>
    )
  }

  //** ตัวอย่าง ช่วงเวลา ********** */ 
  // <SearchEx />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>

      {/* Create Card */}
      <div className={styles.productInfoCard}>
        <div className={styles.productInfoCardHeader}>
          <span>➕</span> สร้าง ช่วงเวลา
        </div>
        <div className={styles.productInfoCardBody}>
          <TranslatePage />
        </div>
      </div>

      {/* Data List Card */}
      <div className={styles.pricingCard}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' }}>
          <span>⏰</span> ข้อมูล ช่วงเวลา
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <SearchS />
        </div>
      </div>

      {/* Sample Card */}
      <div className={styles.pricingCard} style={{ background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)' }}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)', color: '#1E5088' }}>
          <span>📋</span> ตัวอย่าง ช่วงเวลา
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <TimeStyleSearchEx postsA={PA_time} posts={posts} onAdd={(t, id) => { setlist(t); setlistid(id); }} styles={styles} title="ตัวอย่าง ช่วงเวลา" placeholder="ค้นหาช่วงเวลา" />
        </div>
      </div>

    </div>
  )
}

// ช่วงวิธีใช้ New
const Body_Use1 = () => {



  //Get Data
  const [posts, setPosts] = useState([]);
  const [postsA, setPostsA] = useState([]);
  const [fullname, setfullname] = useState('')
  const [list, setlist] = useState('')
  const [listQ, setlistQ] = useState('')
  const [listU, setlistU] = useState('')
  const [listid, setlistid] = useState(0)
  const [company, setcompany] = useState('1000')
  const [idss, setidss] = useState('')
  const [language, setlanguage] = useState([])
  const [isImportedUse, setIsImportedUse] = useState(false)
  const [isImportingUse, setIsImportingUse] = useState(false)

  //*** Get API Use */
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);

  const FixnamePosts = async () => {
    try {
      const resA = await axios.get(`/api/${apitimes}`)
      const PA_timeQQ = resA.data.filter((r: any) => r.name === "D")
      const items = await PA_timeQQ.map((item: { id: string; t: string }) => ({ value: item.id, label: item.t }))
      setFixname(items)
      console.log(items)
      //setFixname(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  //*** Get API Unit */
  const [open1, setOpen1] = useState(false)
  const [selectedStatus1, setSelectedStatus1] = useState<{ value: string, label: string } | null>(null)
  const [items1, setFixname1] = useState<{ value: string, label: string }[]>([]);

  const FixnamePosts1 = async () => {
    try {
      const resA = await axios.get(`/api/${apitimes}`)
      const PA_timeQQ = resA.data.filter((r: any) => r.name === "E")
      const items = await PA_timeQQ.map((item: { id: string; t: string }) => ({ value: item.id, label: item.t }))
      setFixname1(items)
      console.log(items)
      //setFixname(res.data)

    } catch (error) {
      console.error(error)
    }
  }


  const PA_time = postsA

  useEffect(() => {
    fetchPosts()
    FixnamePosts()
    checkImportStatusUse()
  }, [])

  const checkImportStatusUse = async () => {
    try {
      const res = await axios.get('/api/methodlist/import-csv')
      setIsImportedUse(res.data.imported)
    } catch (error) {
      console.error('Failed to check import status', error)
    }
  }

  const handleImportCSVUse = async () => {
    if (isImportedUse || isImportingUse) return

    setIsImportingUse(true)
    try {
      const res = await axios.post('/api/methodlist/import-csv')
      if (res.data.success) {
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
          duration: 3000,
        })
        setIsImportedUse(true)
        await fetchPosts()
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
        duration: 3000,
      })
    } finally {
      setIsImportingUse(false)
    }
  }

  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiuseL}?company=${companyS}`)
      const resA = await axios.get(`/api/${apiuseL}?company=A`)
      const languageS = await axios.get(`/api/${apilanguage}`)
      setPosts(res.data)
      setPostsA(resA.data)
      setlanguage(languageS.data)
    } catch (error) {
      console.error(error)
    }
  }
  //******************************** */




  // แปลภาษา สร้างใหม่     
  function TranslatePage() {
    const [text, setText] = useState("")
    const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
    const [results, setResults] = useState<Record<string, Result>>({})
    const [error, setError] = useState<string | null>(null)
    const [loadingTran, setLoadingTran] = useState(false)

    function toggle(code: string) {
      setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
    }

    // 🟢 Auto-translate per language with debounce
    useEffect(() => {
      if (!text) return
      setLoadingTran(true)
      const timer = setTimeout(async () => {
        setResults({}) // clear previous results
        setError(null)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targets: selected }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()
          const newResults: Record<string, any> = {}
          data.results.forEach((r: any) => { newResults[r.target] = r })
          setResults(newResults)
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoadingTran(false)
        }
      }, 500)

      return () => { clearTimeout(timer); setLoadingTran(false) }
    }, [text, selected])



    let zh_T = results.zh;
    let lo_T = results.lo;
    let my_T = results.my;
    let km_T = results.km;
    let en_T = results.en;


    const [cfullname, csetfullname] = useState('')
    const [clist, csetlist] = useState('')
    const [clistQ, csetlistQ] = useState('')
    const [clistU, csetlistU] = useState('')

    const AlertComplete = () => {
      // เมื่อชำระเงินสำเร็จ
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
        duration: 3000, // ปิดเองใน 3 วิ
      });
    };
    //Post สร้าง แปลภาษาใหม่
    const CleckSubmitCreate = async () => {

      const qty = clistQ
      const unit = clistU
      const fullname = String(text)
      const list_lo = String(lo_T !== undefined ? lo_T.translatedText : "")
      const list_my = String(my_T !== undefined ? my_T.translatedText : "")
      const list_km = String(km_T !== undefined ? km_T.translatedText : "")
      const list_zh = String(zh_T !== undefined ? zh_T.translatedText : "")
      const list_eng = String(en_T !== undefined ? en_T.translatedText : "")
      let company = (localStorage.getItem("company_") || "")
      try {
        await axios.post(`/api/${apiuseL}`,
          {
            company, list, qty, unit, fullname, list_lo, list_my, list_km, list_zh, list_eng
          }
        )
        AlertComplete()
        await fetchPosts()
        setText("")

      }

      catch (error) {
        console.error(error)
      }
    }

    // Input Key ข้อมูล
    const CrateInput = () => {
      const [listW, setlistW] = useState('')



      const CleckTran = () => {
        setText(list + " " + listW + " " + listU);
      }



      return (
        <>
          <div className="d-flex" style={{ marginTop: 5 }}>
            <div className="d-flex" >

              <div className=''>
                <Popover open={open} onOpenChange={setOpen} >
                  <PopoverTrigger asChild>

                    <button
                      name="list"
                      id="list"

                      onClick={FixnamePosts}

                      className="form-control form-control-sm"

                      style={{ fontFamily: "Kanit", width: 150, fontSize: 10 }}
                    >
                      {list === "" ? "คลิกเลือก วิธีใช้" : list}

                    </button>

                  </PopoverTrigger>
                  <PopoverContent className="p-0" side="right" align="start">
                    <Command>
                      <CommandInput placeholder="ค้นหา วิธีใช้สินค้า" />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                          {items.map((status) => (
                            <CommandItem
                              key={status.value}
                              value={status.value}

                              onSelect={async (value) => {
                                setSelectedStatus(items.find((priority) => priority.value === value) || null,)
                                setlist(status.label);
                                setOpen(false)

                              }


                              }



                            >

                              {status.label}

                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

              </div>

              <input
                type="text"
                name="list"
                id="list"
                required
                value={listW}
                onChange={(e) => setlistW(e.target.value)}
                className="form-control form-control-sm"
                placeholder="จำนวน"
                style={{ fontFamily: "Kanit", width: 50, fontSize: 10, textAlign: "center", marginLeft: 5 }}
              />

              <div className=''>
                <Popover open={open1} onOpenChange={setOpen1} >
                  <PopoverTrigger asChild>

                    <button
                      name="listU"
                      id="listU"

                      onClick={FixnamePosts1}

                      className="form-control form-control-sm"

                      style={{ fontFamily: "Kanit", width: 70, fontSize: 10, marginLeft: 5 }}
                    >
                      {listU === "" ? "เลือกหน่วย" : listU}

                    </button>

                  </PopoverTrigger>
                  <PopoverContent className="p-0" side="right" align="start">
                    <Command>
                      <CommandInput placeholder="ค้นหา หน่วยใช้สินค้า" />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                          {items1.map((status) => (
                            <CommandItem
                              key={status.value}
                              value={status.value}

                              onSelect={async (value) => {
                                setSelectedStatus1(items1.find((priority) => priority.value === value) || null,)
                                setlistU(status.label);
                                setOpen1(false)

                              }


                              }



                            >

                              {status.label}

                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

              </div>


            </div>
            {/**   <input
                                            type="text"
                                            value={listW}
                                            onChange={handlist}
                                            className="form-control form-control-sm" 
                                            placeholder="กรอก ช่วงเวลา" 
                                            style={{fontFamily:"Kanit",width:170,fontSize:10}}
                                        />*/}
            <button onClick={() => CleckTran()} type="button" className="btn btn-outline-secondary" disabled={loadingTran} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 25 }}>{loadingTran ? "กำลังแปล..." : "แปลภาษา"}</button>

          </div>



        </>
      )

    }



    return (
      <div>
        <div className='row'>

          <CrateInput />
          <div style={{ fontFamily: "kanit_B", fontSize: 12, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาไทย : {text}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาจีน : {zh_T !== undefined ? zh_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาลาว :{lo_T !== undefined ? lo_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาพม่า :{my_T !== undefined ? my_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาเขมร :{km_T !== undefined ? km_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาอังกฤษ :{en_T !== undefined ? en_T.translatedText : ""}</div>

        </div>
        <div style={{ justifySelf: "center" }}>
          <button onClick={() => CleckSubmitCreate()} type="button" className="btn btn-outline-primary mt-2" style={{ fontFamily: "kanit", fontSize: 10, height: 25, width: 70, justifyItems: "center" }}>สร้าง</button>
        </div>
      </div>
    )

  }

  //***แปลภาษา แก้ไข    *************/
  const SearchS = () => {
    const [data, setData] = useState(posts);
    const [search1, setsearch1] = useState("")
    const [idss, setidss] = useState('')
    const [listE, setlistE] = useState('')
    const [wlist, wsetlist] = useState('')
    const [wlistQ, wsetlistQ] = useState('')
    const [fullnameQ, wsetfullname] = useState('')
    const [wlistU, wsetlistU] = useState('')

    const handleChange1 = (value: any) => {
      setsearch1(value);
      filterDataProduct1(value);
    };

    // filter records by Productname
    const filterDataProduct1 = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData(posts);
      else {
        const filteredData = data.filter((user: any) =>
          user.list.toLowerCase().includes(search1.toLowerCase())
          //  || user.code.toLowerCase().includes(search.toLowerCase())  
          //  || user.Barcode.toLowerCase().includes(search.toLowerCase())                                       
        );
        setData(filteredData);
      }
    };

    // แปลภาษา Edit       
    function TranslatePageE() {


      const [text, setText] = useState(listE)
      const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
      const [results, setResults] = useState<Record<string, Result>>({})
      const [error, setError] = useState<string | null>(null)

      const [ZH_E, setZH_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh)))
      const [LO_E, setLO_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo)))
      const [MY_E, setMY_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my)))
      const [KM_E, setKM_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km)))
      const [EN_E, setEN_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng)))

      function toggle(code: string) {
        setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
      }

      // 🟢 Auto-translate per language with debounce
      useEffect(() => {
        if (!text) return


        selected.forEach(async (target) => {
          try {
            const resp = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, targets: [target] }),
            })
            if (!resp.ok) throw new Error(await resp.text())
            const data = await resp.json()
            setResults((prev) => ({ ...prev, [target]: data.results[0], }))

          } catch (err: any) {
            setResults((prev) => ({
              ...prev,
              [target]: { target, translatedText: `ERROR: ${err.message}`, mirror: '' },
            }))
          }
        })



      }, [Number(text), selected])

      let zh_T = results.zh;
      let lo_T = results.lo;
      let my_T = results.my;
      let km_T = results.km;
      let en_T = results.en;


      const [search, setsearch] = useState(listE)
      const [loading, setLoading] = useState(false)

      const handleChange = (value: any) => {
        setsearch(value);
        localStorage.setItem("list_Indi", value)
      };

      const T_zh = (value: any) => {
        setZH_E(value);
        localStorage.setItem("zh_Indi", value)
      };

      const T_lo = (value: any) => {
        setLO_E(value);
        localStorage.setItem("lo_Indi", value)
      };

      const T_my = (value: any) => {
        setMY_E(value);
        localStorage.setItem("my_Indi", value)
      };

      const T_en = (value: any) => {
        setEN_E(value);
        localStorage.setItem("en_Indi", value)
      };

      const Tran = async () => {
        if (!search) return
        setLoading(true)
        setText(search)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: search, targets: ['zh', 'lo', 'my', 'km', 'en'] }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()

          const resultsMap: Record<string, any> = {}
          data.results.forEach((r: any) => { resultsMap[r.target] = r })

          setZH_E(resultsMap.zh?.translatedText || "")
          setLO_E(resultsMap.lo?.translatedText || "")
          setMY_E(resultsMap.my?.translatedText || "")
          setKM_E(resultsMap.km?.translatedText || "")
          setEN_E(resultsMap.en?.translatedText || "")

          localStorage.setItem("list_Indi", search)
          localStorage.setItem("zh_Indi", resultsMap.zh?.translatedText || "")
          localStorage.setItem("lo_Indi", resultsMap.lo?.translatedText || "")
          localStorage.setItem("my_Indi", resultsMap.my?.translatedText || "")
          localStorage.setItem("en_Indi", resultsMap.en?.translatedText || "")
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoading(false)
        }
      }

      return (
        <>
          <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ช่วงเวลา</div>
          <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
            <div className='d-flex'>
              <input
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                className="form-control form-control-sm"
                placeholder=""
                style={{ fontFamily: "Kanit", fontSize: 12, height: 12 }} />
              <button onClick={() => Tran()} type="button" className="btn btn-outline-primary" disabled={loading} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 30 }}>{loading ? "กำลังแปล..." : "แปล"}</button>
            </div>
          </div>


          <div className='row'>
            {/*ลาว*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาลาว :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.fullname === search).map((a: any) => a.list_lo)[0]}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={LO_E}
                  onChange={(e) => T_lo(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*พม่า*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาพม่า :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.fullname === search).map((a: any) => a.list_my)[0]}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={MY_E}
                  onChange={(e) => T_my(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*อังกฤษ*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาอังกฤษ :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.fullname === search).map((a: any) => a.list_eng)[0]}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={EN_E}
                  onChange={(e) => T_en(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*จีน*/}
            <div className='col mt-2 mb-3' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาจีน :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.fullname === search).map((a: any) => a.list_zh)[0]}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={ZH_E}
                  onChange={(e) => T_zh(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>


          </div>
        </>
      )

    }

    // แก้ไขภาษา
    function Edit_list() {

      //*******Show Modal **********************************/
      const [show1, setShow1] = useState(false);
      const handleClose = () => setShow1(false);
      const handleShow = () => { setShow1(true) };
      const handleClose1 = () => { handleSubmit(), setShow1(false) };
      //***************************************************************** */


      return (
        <>
          <Image alt={""} src={edits} quality={40} color='grayText' onClick={handleShow} />


          <Modal1 show={show1} onHide={handleClose}>
            <Modal1.Header closeButton>
              <Modal1.Title
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                แก้ไข
              </Modal1.Title>
            </Modal1.Header>
            <Modal1.Body>
              <div>


                <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <TranslatePageE />
                </div>

              </div>


            </Modal1.Body>
            <Modal1.Footer>
              <Button1
                variant="secondary"
                onClick={handleClose}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
              >
                ปิด
              </Button1>
              <Button1
                variant="warning"
                onClick={handleClose1}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}

              >
                แก้ไข
              </Button1>
            </Modal1.Footer>
          </Modal1>
        </>
      );
    }

    /************************************ */
    // Edit/id
    const handleSubmit = async () => {
      let company = (localStorage.getItem("company_") || "")
      const list = String(wlist)
      const list_lo = String(localStorage.getItem("lo_Indi") || "") === "" ? String(posts.filter((a: any) => a.fullname === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("lo_Indi") || "")
      const list_my = String(localStorage.getItem("my_Indi") || "") === "" ? String(posts.filter((a: any) => a.fullname === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_my)) : String(localStorage.getItem("my_Indi") || "")
      //  const list_km=String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))===""?String(KM):String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))
      const list_zh = String(localStorage.getItem("zh_Indi") || "") === "" ? String(posts.filter((a: any) => a.fullname === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_zh)) : String(localStorage.getItem("zh_Indi") || "")
      const list_eng = String(localStorage.getItem("en_Indi") || "") === "" ? String(posts.filter((a: any) => a.fullname === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_eng)) : String(localStorage.getItem("en_Indi") || "")
      const qty = wlistQ
      const unit = wlistU
      const fullname = listE

      try {
        await axios.put(`/api/${apiuseL}/${idss}`,
          {
            list, company, qty, unit, fullname, list_lo, list_my, list_zh, list_eng
          }
        )
        await fetchPosts()
        setlistE("")



      } catch (error) {
        console.error(error)
      }
    }

    // Delete/id
    const deletePost = async (id: Number) => {
      try {
        await axios.delete(`/api/${apiuseL}/${id}`)
        await fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }
    return (
      <>
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <table className="table table-sm table-hover mt-1" >
            <thead style={{ position: "sticky", top: "0" }}>
              <tr>

                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%" }}>
                  ช่วงเวลา
                  <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                    <input
                      value={search1}
                      onChange={(e) => handleChange1(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาช่วงเวลา"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>
                </th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>แก้ไข ภาษา</th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>ลบ</th>

              </tr>
            </thead>
            <tbody className="table-group-divider">
              {data.map((post: any) => (
                <tr key={post.id}>

                  <td className={styles.bodydetailTable_Re1} style={{ width: "70%", fontSize: 12 }}>{post.fullname}</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => { setlistE(post.fullname), wsetlist(post.list), wsetlistQ(post.qty), wsetlistU(post.unit), setidss(post.id) }} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Edit_list />
                    </button>

                  </td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => deletePost(post.id)} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Image alt={""} src={deletes} quality={40} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </>
    )
  }

  //** ตัวอย่าง วิธีใช้ - uses extracted UseSearchEx component */
  const handleUseAdd = async (xdata: { fullname: string, list: string, qty: string, unit: string }) => {
    // ตรวจสอบข้อมูลซ้ำ
    if (posts.some((p: any) => p.fullname === xdata.fullname)) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ข้อมูลซ้ำ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>"{xdata.fullname}" มีอยู่แล้ว ไม่สามารถเพิ่มซ้ำได้</div>,
        duration: 3000,
      });
      return
    }
    let company = (localStorage.getItem("company_") || "")
    const list_lo = String(language.filter((a: any) => a.list === xdata.fullname).map((a: any) => a.list_lo))
    const list_my = String(language.filter((a: any) => a.list === xdata.fullname).map((a: any) => a.list_my))
    const list_km = String(language.filter((a: any) => a.list === xdata.fullname).map((a: any) => a.list_km))
    const list_zh = String(language.filter((a: any) => a.list === xdata.fullname).map((a: any) => a.list_zh))
    const list_eng = String(language.filter((a: any) => a.list === xdata.fullname).map((a: any) => a.list_eng))
    try {
      await axios.post(`/api/${apiuseL}`,
        {
          company, list: xdata.list, qty: xdata.qty, unit: xdata.unit, fullname: xdata.fullname, list_lo, list_my, list_km, list_zh, list_eng
        }
      )
      await fetchPosts()
      await setfullname("")
    }
    catch (error) {
      console.error(error)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>

      {/* Create Card */}
      <div className={styles.productInfoCard}>
        <div className={styles.productInfoCardHeader}>
          <span>➕</span> สร้าง วิธีใช้
        </div>
        <div className={styles.productInfoCardBody}>
          <TranslatePage />
        </div>
      </div>

      {/* Data List Card */}
      <div className={styles.pricingCard}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' }}>
          <span>📝</span> ข้อมูล วิธีใช้
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <SearchS />
        </div>
      </div>

      {/* Sample Card */}
      <div className={styles.pricingCard} style={{ background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)' }}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)', color: '#1E5088', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span>📋</span> ตัวอย่าง วิธีใช้</div>
          <button
            onClick={handleImportCSVUse}
            disabled={isImportedUse || isImportingUse}
            style={{
              background: isImportedUse ? '#9ca3af' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              padding: '4px 12px',
              fontSize: 11,
              fontFamily: 'Kanit',
              cursor: isImportedUse || isImportingUse ? 'not-allowed' : 'pointer',
              opacity: isImportedUse ? 0.7 : 1
            }}
          >
            {isImportingUse ? '⏳ กำลังนำเข้า...' : isImportedUse ? '✅ นำเข้าแล้ว' : '🔄 GEN'}
          </button>
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <UseSearchEx postsA={PA_time} posts={posts} language={language} onSubmit={handleUseAdd} styles={styles} />
        </div>
      </div>

    </div>
  )
}

// ช่วงเวลาใช้ New
const Body_TimeUse1 = () => {

  interface PostItem {
    id: number;
    list: string;
  }

  interface PostItem1 {
    id: number;
    t: string;
  }

  //Get Data
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsA, setPostsA] = useState<PostItem1[]>([]);
  const [list, setlist] = useState('')
  const [listid, setlistid] = useState(0)
  const [language, setlanguage] = useState([])

  const PA_time = postsA.filter((r: any) => r.name === "B")
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apitimeuseL}?company=${companyS}`)
      const resA = await axios.get(`/api/${apitimes}`)
      const languageS = await axios.get(`/api/${apilanguage}`)
      setPosts(res.data)
      setPostsA(resA.data)
      setlanguage(languageS.data)
    } catch (error) {
      console.error(error)
    }
  }
  //******************************** */

  useEffect(() => {

    fetchPosts()
    listid === 0 ? "" : CleckSubmit()
  }, [listid])

  const AlertComplete = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };
  // Post  สร้าง แปลภาษา จาก list ข้อมูลกลาง
  const CleckSubmit = async () => {
    // ตรวจสอบข้อมูลซ้ำ
    if (posts.some((p: any) => p.list === list)) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ข้อมูลซ้ำ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>"{list}" มีอยู่แล้ว ไม่สามารถเพิ่มซ้ำได้</div>,
        duration: 3000,
      });
      setlist("")
      setlistid(0)
      return
    }
    let company = (localStorage.getItem("company_") || "")
    const list_lo = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo))
    const list_my = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my))
    const list_km = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km))
    const list_zh = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh))
    const list_eng = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng))
    try {
      await axios.post(`/api/${apitimeuseL}`,
        {
          company, list, list_lo, list_my, list_km, list_zh, list_eng
        }
      )
      AlertComplete()
      await fetchPosts()
      setlist("")
      setlistid(0)
    }

    catch (error) {
      console.error(error)
    }
  }

  // แปลภาษา สร้างใหม่     
  function TranslatePage() {
    const [text, setText] = useState("")
    const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
    const [results, setResults] = useState<Record<string, Result>>({})
    const [error, setError] = useState<string | null>(null)
    const [loadingTran, setLoadingTran] = useState(false)

    function toggle(code: string) {
      setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
    }

    // 🟢 Auto-translate per language with debounce
    useEffect(() => {
      if (!text) return
      setLoadingTran(true)
      const timer = setTimeout(async () => {
        setResults({}) // clear previous results
        setError(null)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targets: selected }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()
          const newResults: Record<string, any> = {}
          data.results.forEach((r: any) => { newResults[r.target] = r })
          setResults(newResults)
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoadingTran(false)
        }
      }, 500)

      return () => { clearTimeout(timer); setLoadingTran(false) }
    }, [text, selected])



    let zh_T = results.zh;
    let lo_T = results.lo;
    let my_T = results.my;
    let km_T = results.km;
    let en_T = results.en;


    //Post สร้าง แปลภาษาใหม่
    const CleckSubmitCreate = async () => {
      const list = String(text)
      const list_lo = String(lo_T !== undefined ? lo_T.translatedText : "")
      const list_my = String(my_T !== undefined ? my_T.translatedText : "")
      const list_km = String(km_T !== undefined ? km_T.translatedText : "")
      const list_zh = String(zh_T !== undefined ? zh_T.translatedText : "")
      const list_eng = String(en_T !== undefined ? en_T.translatedText : "")
      let company = (localStorage.getItem("company_") || "")
      try {
        await axios.post(`/api/${apitimeuseL}`,
          {
            company, list, list_lo, list_my, list_km, list_zh, list_eng
          }
        )
        AlertComplete()
        await fetchPosts()
        setText("")

      }

      catch (error) {
        console.error(error)
      }
    }

    // Input Key ข้อมูล
    const CrateInput = () => {
      const [listW, setlistW] = useState('')



      const CleckTran = () => {
        setText(listW);
      }
      const handlist = async (e: any) => {
        setlistW(e.target.value);
        localStorage.setItem("tr", e.target.value)

      };


      return (
        <div className="d-flex" style={{ marginTop: 5 }}>
          <input
            type="text"
            value={listW}
            onChange={handlist}
            className="form-control form-control-sm"
            placeholder="กรอก ช่วงเวลาที่ใช้"
            style={{ fontFamily: "Kanit", width: 170, fontSize: 10 }}
          />
          <button onClick={() => CleckTran()} type="button" className="btn btn-outline-secondary" disabled={loadingTran} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 25 }}>{loadingTran ? "กำลังแปล..." : "แปลภาษา"}</button>

        </div>
      )

    }

    return (
      <div>
        <div className='row'>

          <CrateInput />
          <div style={{ fontFamily: "kanit_B", fontSize: 12, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาไทย : {text}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาจีน : {zh_T !== undefined ? zh_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาลาว :{lo_T !== undefined ? lo_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาพม่า :{my_T !== undefined ? my_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาเขมร :{km_T !== undefined ? km_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาอังกฤษ :{en_T !== undefined ? en_T.translatedText : ""}</div>

        </div>
        <div style={{ justifySelf: "center" }}>
          <button onClick={() => CleckSubmitCreate()} type="button" className="btn btn-outline-primary mt-2" style={{ fontFamily: "kanit", fontSize: 10, height: 25, width: 70, justifyItems: "center" }}>สร้าง</button>
        </div>
      </div>
    )

  }

  //***แปลภาษา แก้ไข    *************/
  const SearchS = () => {
    const [data, setData] = useState(posts);
    const [search1, setsearch1] = useState("")
    const [idss, setidss] = useState('')
    const [listE, setlistE] = useState('')

    const handleChange1 = (value: any) => {
      setsearch1(value);
      filterDataProduct1(value);
    };

    // filter records by Productname
    const filterDataProduct1 = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData(posts);
      else {
        const filteredData = data.filter((user: any) =>
          user.list.toLowerCase().includes(search1.toLowerCase())
          //  || user.code.toLowerCase().includes(search.toLowerCase())  
          //  || user.Barcode.toLowerCase().includes(search.toLowerCase())                                       
        );
        setData(filteredData);
      }
    };

    // แปลภาษา Edit       
    function TranslatePageE() {


      const [text, setText] = useState(listE)
      const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
      const [results, setResults] = useState<Record<string, Result>>({})
      const [error, setError] = useState<string | null>(null)

      const [ZH_E, setZH_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh)))
      const [LO_E, setLO_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo)))
      const [MY_E, setMY_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my)))
      const [KM_E, setKM_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km)))
      const [EN_E, setEN_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng)))

      function toggle(code: string) {
        setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
      }

      // 🟢 Auto-translate per language with debounce
      useEffect(() => {
        if (!text) return


        selected.forEach(async (target) => {
          try {
            const resp = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, targets: [target] }),
            })
            if (!resp.ok) throw new Error(await resp.text())
            const data = await resp.json()
            setResults((prev) => ({ ...prev, [target]: data.results[0], }))

          } catch (err: any) {
            setResults((prev) => ({
              ...prev,
              [target]: { target, translatedText: `ERROR: ${err.message}`, mirror: '' },
            }))
          }
        })



      }, [Number(text), selected])

      let zh_T = results.zh;
      let lo_T = results.lo;
      let my_T = results.my;
      let km_T = results.km;
      let en_T = results.en;


      const [search, setsearch] = useState(listE)
      const [loading, setLoading] = useState(false)

      const handleChange = (value: any) => {
        setsearch(value);
        localStorage.setItem("list_Indi", value)
      };

      const T_zh = (value: any) => {
        setZH_E(value);
        localStorage.setItem("zh_Indi", value)
      };

      const T_lo = (value: any) => {
        setLO_E(value);
        localStorage.setItem("lo_Indi", value)
      };

      const T_my = (value: any) => {
        setMY_E(value);
        localStorage.setItem("my_Indi", value)
      };

      const T_en = (value: any) => {
        setEN_E(value);
        localStorage.setItem("en_Indi", value)
      };

      const Tran = async () => {
        if (!search) return
        setLoading(true)
        setText(search)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: search, targets: ['zh', 'lo', 'my', 'km', 'en'] }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()

          const resultsMap: Record<string, any> = {}
          data.results.forEach((r: any) => { resultsMap[r.target] = r })

          setZH_E(resultsMap.zh?.translatedText || "")
          setLO_E(resultsMap.lo?.translatedText || "")
          setMY_E(resultsMap.my?.translatedText || "")
          setKM_E(resultsMap.km?.translatedText || "")
          setEN_E(resultsMap.en?.translatedText || "")

          localStorage.setItem("list_Indi", search)
          localStorage.setItem("zh_Indi", resultsMap.zh?.translatedText || "")
          localStorage.setItem("lo_Indi", resultsMap.lo?.translatedText || "")
          localStorage.setItem("my_Indi", resultsMap.my?.translatedText || "")
          localStorage.setItem("en_Indi", resultsMap.en?.translatedText || "")
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoading(false)
        }
      }

      return (
        <>
          <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ช่วงเวลาที่ใช้</div>
          <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
            <div className='d-flex'>
              <input
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                className="form-control form-control-sm"
                placeholder=""
                style={{ fontFamily: "Kanit", fontSize: 12, height: 12 }} />
              <button onClick={() => Tran()} type="button" className="btn btn-outline-primary" disabled={loading} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 30 }}>{loading ? "กำลังแปล..." : "แปล"}</button>
            </div>
          </div>


          <div className='row'>
            {/*ลาว*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาลาว :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_lo)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={LO_E}
                  onChange={(e) => T_lo(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*พม่า*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาพม่า :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_my)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={MY_E}
                  onChange={(e) => T_my(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*อังกฤษ*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาอังกฤษ :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_eng)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={EN_E}
                  onChange={(e) => T_en(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*จีน*/}
            <div className='col mt-2 mb-3' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาจีน :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_zh)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={ZH_E}
                  onChange={(e) => T_zh(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>


          </div>
        </>
      )

    }

    // แก้ไขภาษา
    function Edit_list() {

      //*******Show Modal **********************************/
      const [show1, setShow1] = useState(false);
      const handleClose = () => setShow1(false);
      const handleShow = () => { setShow1(true) };
      const handleClose1 = () => { handleSubmit(), setShow1(false) };
      //***************************************************************** */


      return (
        <>
          <Image alt={""} src={edits} quality={40} color='grayText' onClick={handleShow} />


          <Modal1 show={show1} onHide={handleClose}>
            <Modal1.Header closeButton>
              <Modal1.Title
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                แก้ไข
              </Modal1.Title>
            </Modal1.Header>
            <Modal1.Body>
              <div>


                <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <TranslatePageE />
                </div>

              </div>


            </Modal1.Body>
            <Modal1.Footer>
              <Button1
                variant="secondary"
                onClick={handleClose}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
              >
                ปิด
              </Button1>
              <Button1
                variant="warning"
                onClick={handleClose1}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}

              >
                แก้ไข
              </Button1>
            </Modal1.Footer>
          </Modal1>
        </>
      );
    }

    /************************************ */
    // Edit/id
    const handleSubmit = async () => {
      let company = (localStorage.getItem("company_") || "")
      const list = String(localStorage.getItem("list_Indi") || "")
      const list_lo = String(localStorage.getItem("lo_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("lo_Indi") || "")
      const list_my = String(localStorage.getItem("my_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("my_Indi") || "")
      //  const list_km=String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))===""?String(KM):String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))
      const list_zh = String(localStorage.getItem("zh_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("zh_Indi") || "")
      const list_eng = String(localStorage.getItem("en_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("en_Indi") || "")


      try {
        await axios.put(`/api/${apitimeuseL}/${idss}`,
          {
            list, company, list_lo, list_my, list_zh, list_eng
          }
        )
        await fetchPosts()
        setlist("")



      } catch (error) {
        console.error(error)
      }
    }

    // Delete/id
    const deletePost = async (id: Number) => {
      try {
        await axios.delete(`/api/${apitimeuseL}/${id}`)
        await fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }
    return (
      <>
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <table className="table table-sm table-hover mt-1" >
            <thead style={{ position: "sticky", top: "0" }}>
              <tr>

                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%" }}>
                  ช่วงเวลาที่ใช้
                  <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                    <input
                      value={search1}
                      onChange={(e) => handleChange1(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหาช่วงเวลาที่ใช้"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>
                </th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>แก้ไข ภาษา</th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>ลบ</th>

              </tr>
            </thead>
            <tbody className="table-group-divider">
              {data.map((post: any) => (
                <tr key={post.id}>

                  <td className={styles.bodydetailTable_Re1} style={{ width: "70%", fontSize: 12 }}>{post.list}</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => { setidss(post.id), setlistE(post.list) }} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Edit_list />
                    </button>

                  </td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => deletePost(post.id)} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Image alt={""} src={deletes} quality={40} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </>
    )
  }


  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>

      {/* Create Card */}
      <div className={styles.productInfoCard}>
        <div className={styles.productInfoCardHeader}>
          <span>➕</span> สร้าง เวลาที่ใช้
        </div>
        <div className={styles.productInfoCardBody}>
          <TranslatePage />
        </div>
      </div>

      {/* Data List Card */}
      <div className={styles.pricingCard}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' }}>
          <span>🕐</span> ข้อมูล เวลาที่ใช้
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <SearchS />
        </div>
      </div>

      {/* Sample Card */}
      <div className={styles.pricingCard} style={{ background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)' }}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)', color: '#1E5088' }}>
          <span>📋</span> ตัวอย่าง เวลาที่ใช้
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <TimeStyleSearchEx postsA={PA_time} posts={posts} onAdd={(t, id) => { setlist(t); setlistid(id); }} styles={styles} title="ตัวอย่าง ช่วงเวลาที่ใช้" placeholder="ค้นหาช่วงเวลาที่ใช้" />
        </div>
      </div>

    </div>
  )
}

//  วิธีเก็บรักษา New
const Body_Keep1 = () => {

  interface PostItem {
    id: number;
    list: string;
  }

  interface PostItem1 {
    id: number;
    t: string;
  }

  //Get Data
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsA, setPostsA] = useState<PostItem1[]>([]);
  const [list, setlist] = useState('')
  const [listid, setlistid] = useState(0)
  const [language, setlanguage] = useState([])

  const PA_time = postsA.filter((r: any) => r.name === "C")
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apikeepL}?company=${companyS}`)
      const resA = await axios.get(`/api/${apitimes}`)
      const languageS = await axios.get(`/api/${apilanguage}`)
      setPosts(res.data)
      setPostsA(resA.data)
      setlanguage(languageS.data)
    } catch (error) {
      console.error(error)
    }
  }
  //******************************** */

  useEffect(() => {

    fetchPosts()
    listid === 0 ? "" : CleckSubmit()
  }, [listid])

  // Post  สร้าง แปลภาษา จาก list ข้อมูลกลาง
  const CleckSubmit = async () => {
    // ตรวจสอบข้อมูลซ้ำ
    if (posts.some((p: any) => p.list === list)) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ข้อมูลซ้ำ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>"{list}" มีอยู่แล้ว ไม่สามารถเพิ่มซ้ำได้</div>,
        duration: 3000,
      });
      setlist("")
      setlistid(0)
      return
    }
    let company = (localStorage.getItem("company_") || "")
    const list_lo = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo))
    const list_my = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my))
    const list_km = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km))
    const list_zh = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh))
    const list_eng = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng))
    try {
      await axios.post(`/api/${apikeepL}`,
        {
          company, list, list_lo, list_my, list_km, list_zh, list_eng
        }
      )
      await fetchPosts()
      setlist("")
      setlistid(0)
    }

    catch (error) {
      console.error(error)
    }
  }

  // แปลภาษา สร้างใหม่     
  function TranslatePage() {
    const [text, setText] = useState("")
    const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
    const [results, setResults] = useState<Record<string, Result>>({})
    const [error, setError] = useState<string | null>(null)
    const [loadingTran, setLoadingTran] = useState(false)

    function toggle(code: string) {
      setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
    }

    // 🟢 Auto-translate per language with debounce
    useEffect(() => {
      if (!text) return
      setLoadingTran(true)
      const timer = setTimeout(async () => {
        setResults({}) // clear previous results
        setError(null)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targets: selected }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()
          const newResults: Record<string, any> = {}
          data.results.forEach((r: any) => { newResults[r.target] = r })
          setResults(newResults)
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoadingTran(false)
        }
      }, 500)

      return () => { clearTimeout(timer); setLoadingTran(false) }
    }, [text, selected])



    let zh_T = results.zh;
    let lo_T = results.lo;
    let my_T = results.my;
    let km_T = results.km;
    let en_T = results.en;

    const AlertComplete = () => {
      // เมื่อชำระเงินสำเร็จ
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
        duration: 3000, // ปิดเองใน 3 วิ
      });
    };
    //Post สร้าง แปลภาษาใหม่
    const CleckSubmitCreate = async () => {
      const list = String(text)
      const list_lo = String(lo_T !== undefined ? lo_T.translatedText : "")
      const list_my = String(my_T !== undefined ? my_T.translatedText : "")
      const list_km = String(km_T !== undefined ? km_T.translatedText : "")
      const list_zh = String(zh_T !== undefined ? zh_T.translatedText : "")
      const list_eng = String(en_T !== undefined ? en_T.translatedText : "")
      let company = (localStorage.getItem("company_") || "")
      try {
        await axios.post(`/api/${apikeepL}`,
          {
            company, list, list_lo, list_my, list_km, list_zh, list_eng
          }
        )
        AlertComplete()
        await fetchPosts()
        setText("")

      }

      catch (error) {
        console.error(error)
      }
    }

    // Input Key ข้อมูล
    const CrateInput = () => {
      const [listW, setlistW] = useState('')



      const CleckTran = () => {
        setText(listW);
      }
      const handlist = async (e: any) => {
        setlistW(e.target.value);
        localStorage.setItem("tr", e.target.value)

      };


      return (
        <div className="d-flex" style={{ marginTop: 5 }}>
          <input
            type="text"
            value={listW}
            onChange={handlist}
            className="form-control form-control-sm"
            placeholder="กรอก วิธีเก็บรักษา"
            style={{ fontFamily: "Kanit", width: 170, fontSize: 10 }}
          />
          <button onClick={() => CleckTran()} type="button" className="btn btn-outline-secondary" disabled={loadingTran} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 25 }}>{loadingTran ? "กำลังแปล..." : "แปลภาษา"}</button>

        </div>
      )

    }

    return (
      <div>
        <div className='row'>

          <CrateInput />
          <div style={{ fontFamily: "kanit_B", fontSize: 12, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาไทย : {text}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาจีน : {zh_T !== undefined ? zh_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาลาว :{lo_T !== undefined ? lo_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาพม่า :{my_T !== undefined ? my_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาเขมร :{km_T !== undefined ? km_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาอังกฤษ :{en_T !== undefined ? en_T.translatedText : ""}</div>

        </div>
        <div style={{ justifySelf: "center" }}>
          <button onClick={() => CleckSubmitCreate()} type="button" className="btn btn-outline-primary mt-2" style={{ fontFamily: "kanit", fontSize: 10, height: 25, width: 70, justifyItems: "center" }}>สร้าง</button>
        </div>
      </div>
    )

  }

  //***แปลภาษา แก้ไข    *************/
  const SearchS = () => {
    const [data, setData] = useState(posts);
    const [search1, setsearch1] = useState("")
    const [idss, setidss] = useState('')
    const [listE, setlistE] = useState('')

    const handleChange1 = (value: any) => {
      setsearch1(value);
      filterDataProduct1(value);
    };

    // filter records by Productname
    const filterDataProduct1 = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData(posts);
      else {
        const filteredData = data.filter((user: any) =>
          user.list.toLowerCase().includes(search1.toLowerCase())
          //  || user.code.toLowerCase().includes(search.toLowerCase())  
          //  || user.Barcode.toLowerCase().includes(search.toLowerCase())                                       
        );
        setData(filteredData);
      }
    };

    // แปลภาษา Edit       
    function TranslatePageE() {


      const [text, setText] = useState(listE)
      const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
      const [results, setResults] = useState<Record<string, Result>>({})
      const [error, setError] = useState<string | null>(null)

      const [ZH_E, setZH_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh)))
      const [LO_E, setLO_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo)))
      const [MY_E, setMY_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my)))
      const [KM_E, setKM_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km)))
      const [EN_E, setEN_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng)))

      function toggle(code: string) {
        setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
      }

      // 🟢 Auto-translate per language with debounce
      useEffect(() => {
        if (!text) return


        selected.forEach(async (target) => {
          try {
            const resp = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, targets: [target] }),
            })
            if (!resp.ok) throw new Error(await resp.text())
            const data = await resp.json()
            setResults((prev) => ({ ...prev, [target]: data.results[0], }))

          } catch (err: any) {
            setResults((prev) => ({
              ...prev,
              [target]: { target, translatedText: `ERROR: ${err.message}`, mirror: '' },
            }))
          }
        })



      }, [Number(text), selected])

      let zh_T = results.zh;
      let lo_T = results.lo;
      let my_T = results.my;
      let km_T = results.km;
      let en_T = results.en;


      const [search, setsearch] = useState(listE)
      const [loading, setLoading] = useState(false)

      const handleChange = (value: any) => {
        setsearch(value);
        localStorage.setItem("list_Indi", value)
      };

      const T_zh = (value: any) => {
        setZH_E(value);
        localStorage.setItem("zh_Indi", value)
      };

      const T_lo = (value: any) => {
        setLO_E(value);
        localStorage.setItem("lo_Indi", value)
      };

      const T_my = (value: any) => {
        setMY_E(value);
        localStorage.setItem("my_Indi", value)
      };

      const T_en = (value: any) => {
        setEN_E(value);
        localStorage.setItem("en_Indi", value)
      };

      const Tran = async () => {
        if (!search) return
        setLoading(true)
        setText(search)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: search, targets: ['zh', 'lo', 'my', 'km', 'en'] }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()

          const resultsMap: Record<string, any> = {}
          data.results.forEach((r: any) => { resultsMap[r.target] = r })

          setZH_E(resultsMap.zh?.translatedText || "")
          setLO_E(resultsMap.lo?.translatedText || "")
          setMY_E(resultsMap.my?.translatedText || "")
          setKM_E(resultsMap.km?.translatedText || "")
          setEN_E(resultsMap.en?.translatedText || "")

          localStorage.setItem("list_Indi", search)
          localStorage.setItem("zh_Indi", resultsMap.zh?.translatedText || "")
          localStorage.setItem("lo_Indi", resultsMap.lo?.translatedText || "")
          localStorage.setItem("my_Indi", resultsMap.my?.translatedText || "")
          localStorage.setItem("en_Indi", resultsMap.en?.translatedText || "")
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoading(false)
        }
      }

      return (
        <>
          <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>วิธีเก็บรักษา</div>
          <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
            <div className='d-flex'>
              <input
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                className="form-control form-control-sm"
                placeholder=""
                style={{ fontFamily: "Kanit", fontSize: 12, height: 12 }} />
              <button onClick={() => Tran()} type="button" className="btn btn-outline-primary" disabled={loading} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 30 }}>{loading ? "กำลังแปล..." : "แปล"}</button>
            </div>
          </div>


          <div className='row'>
            {/*ลาว*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาลาว :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_lo)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={LO_E}
                  onChange={(e) => T_lo(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*พม่า*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาพม่า :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_my)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={MY_E}
                  onChange={(e) => T_my(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*อังกฤษ*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาอังกฤษ :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_eng)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={EN_E}
                  onChange={(e) => T_en(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*จีน*/}
            <div className='col mt-2 mb-3' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาจีน :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_zh)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={ZH_E}
                  onChange={(e) => T_zh(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>


          </div>
        </>
      )

    }

    // แก้ไขภาษา
    function Edit_list() {

      //*******Show Modal **********************************/
      const [show1, setShow1] = useState(false);
      const handleClose = () => setShow1(false);
      const handleShow = () => { setShow1(true) };
      const handleClose1 = () => { handleSubmit(), setShow1(false) };
      //***************************************************************** */


      return (
        <>
          <Image alt={""} src={edits} quality={40} color='grayText' onClick={handleShow} />


          <Modal1 show={show1} onHide={handleClose}>
            <Modal1.Header closeButton>
              <Modal1.Title
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                แก้ไข
              </Modal1.Title>
            </Modal1.Header>
            <Modal1.Body>
              <div>


                <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <TranslatePageE />
                </div>

              </div>


            </Modal1.Body>
            <Modal1.Footer>
              <Button1
                variant="secondary"
                onClick={handleClose}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
              >
                ปิด
              </Button1>
              <Button1
                variant="warning"
                onClick={handleClose1}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}

              >
                แก้ไข
              </Button1>
            </Modal1.Footer>
          </Modal1>
        </>
      );
    }

    /************************************ */
    // Edit/id
    const handleSubmit = async () => {
      let company = (localStorage.getItem("company_") || "")
      const list = String(localStorage.getItem("list_Indi") || "")
      const list_lo = String(localStorage.getItem("lo_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("lo_Indi") || "")
      const list_my = String(localStorage.getItem("my_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("my_Indi") || "")
      //  const list_km=String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))===""?String(KM):String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))
      const list_zh = String(localStorage.getItem("zh_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("zh_Indi") || "")
      const list_eng = String(localStorage.getItem("en_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("en_Indi") || "")


      try {
        await axios.put(`/api/${apikeepL}/${idss}`,
          {
            list, company, list_lo, list_my, list_zh, list_eng
          }
        )
        await fetchPosts()
        setlist("")



      } catch (error) {
        console.error(error)
      }
    }

    // Delete/id
    const deletePost = async (id: Number) => {
      try {
        await axios.delete(`/api/${apikeepL}/${id}`)
        await fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }
    return (
      <>
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <table className="table table-sm table-hover mt-1" >
            <thead style={{ position: "sticky", top: "0" }}>
              <tr>

                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%" }}>
                  วิธีเก็บรักษา
                  <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                    <input
                      value={search1}
                      onChange={(e) => handleChange1(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหา วิธีเก็บรักษา"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>
                </th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>แก้ไข ภาษา</th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>ลบ</th>

              </tr>
            </thead>
            <tbody className="table-group-divider">
              {data.map((post: any) => (
                <tr key={post.id}>

                  <td className={styles.bodydetailTable_Re1} style={{ width: "70%", fontSize: 12 }}>{post.list}</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => { setidss(post.id), setlistE(post.list) }} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Edit_list />
                    </button>

                  </td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => deletePost(post.id)} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Image alt={""} src={deletes} quality={40} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </>
    )
  }


  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>

      {/* Create Card */}
      <div className={styles.productInfoCard}>
        <div className={styles.productInfoCardHeader}>
          <span>➕</span> สร้าง วิธีเก็บรักษา
        </div>
        <div className={styles.productInfoCardBody}>
          <TranslatePage />
        </div>
      </div>

      {/* Data List Card */}
      <div className={styles.pricingCard}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' }}>
          <span>📦</span> ข้อมูล วิธีเก็บรักษา
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <SearchS />
        </div>
      </div>

      {/* Sample Card */}
      <div className={styles.pricingCard} style={{ background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)' }}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)', color: '#1E5088' }}>
          <span>📋</span> ตัวอย่าง วิธีเก็บรักษา
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <TimeStyleSearchEx postsA={PA_time} posts={posts} onAdd={(t, id) => { setlist(t); setlistid(id); }} styles={styles} title="ตัวอย่าง วิธีเก็บรักษา" placeholder="ค้นหา วิธีเก็บรักษา" />
        </div>
      </div>

    </div>
  )
}

// หมายเหตุ New
const Body_Remark1 = () => {

  interface PostItem {
    id: number;
    list: string;
  }

  interface PostItem1 {
    id: number;
    t: string;
  }

  //Get Data
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsA, setPostsA] = useState<PostItem1[]>([]);
  const [list, setlist] = useState('')
  const [listid, setlistid] = useState(0)
  const [language, setlanguage] = useState([])

  const PA_time = postsA.filter((r: any) => r.name === "F")
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiRemarkL}?company=${companyS}`)
      const resA = await axios.get(`/api/${apitimes}`)
      const languageS = await axios.get(`/api/${apilanguage}`)
      setPosts(res.data)
      setPostsA(resA.data)
      setlanguage(languageS.data)
    } catch (error) {
      console.error(error)
    }
  }
  //******************************** */

  useEffect(() => {

    fetchPosts()
    listid === 0 ? "" : CleckSubmit()
  }, [listid])

  // Post  สร้าง แปลภาษา จาก list ข้อมูลกลาง
  const CleckSubmit = async () => {
    // ตรวจสอบข้อมูลซ้ำ
    if (posts.some((p: any) => p.list === list)) {
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ข้อมูลซ้ำ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>"{list}" มีอยู่แล้ว ไม่สามารถเพิ่มซ้ำได้</div>,
        duration: 3000,
      });
      setlist("")
      setlistid(0)
      return
    }
    let company = (localStorage.getItem("company_") || "")
    const list_lo = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo))
    const list_my = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my))
    const list_km = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km))
    const list_zh = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh))
    const list_eng = String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng))
    try {
      await axios.post(`/api/${apiRemarkL}`,
        {
          company, list, list_lo, list_my, list_km, list_zh, list_eng
        }
      )
      await fetchPosts()
      setlist("")
      setlistid(0)
    }

    catch (error) {
      console.error(error)
    }
  }

  // แปลภาษา สร้างใหม่     
  function TranslatePage() {
    const [text, setText] = useState("")
    const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
    const [results, setResults] = useState<Record<string, Result>>({})
    const [error, setError] = useState<string | null>(null)
    const [loadingTran, setLoadingTran] = useState(false)

    function toggle(code: string) {
      setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
    }

    // 🟢 Auto-translate per language with debounce
    useEffect(() => {
      if (!text) return
      setLoadingTran(true)
      const timer = setTimeout(async () => {
        setResults({}) // clear previous results
        setError(null)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targets: selected }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()
          const newResults: Record<string, any> = {}
          data.results.forEach((r: any) => { newResults[r.target] = r })
          setResults(newResults)
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoadingTran(false)
        }
      }, 500)

      return () => { clearTimeout(timer); setLoadingTran(false) }
    }, [text, selected])



    let zh_T = results.zh;
    let lo_T = results.lo;
    let my_T = results.my;
    let km_T = results.km;
    let en_T = results.en;

    const AlertComplete = () => {
      // เมื่อชำระเงินสำเร็จ
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
        duration: 3000, // ปิดเองใน 3 วิ
      });
    };
    //Post สร้าง แปลภาษาใหม่
    const CleckSubmitCreate = async () => {
      const list = String(text)
      const list_lo = String(lo_T !== undefined ? lo_T.translatedText : "")
      const list_my = String(my_T !== undefined ? my_T.translatedText : "")
      const list_km = String(km_T !== undefined ? km_T.translatedText : "")
      const list_zh = String(zh_T !== undefined ? zh_T.translatedText : "")
      const list_eng = String(en_T !== undefined ? en_T.translatedText : "")
      let company = (localStorage.getItem("company_") || "")
      try {
        await axios.post(`/api/${apiRemarkL}`,
          {
            company, list, list_lo, list_my, list_km, list_zh, list_eng
          }
        )
        AlertComplete()
        await fetchPosts()
        setText("")

      }

      catch (error) {
        console.error(error)
      }
    }

    // Input Key ข้อมูล
    const CrateInput = () => {
      const [listW, setlistW] = useState('')



      const CleckTran = () => {
        setText(listW);
      }
      const handlist = async (e: any) => {
        setlistW(e.target.value);
        localStorage.setItem("tr", e.target.value)

      };


      return (
        <div className="d-flex" style={{ marginTop: 5 }}>
          <input
            type="text"
            value={listW}
            onChange={handlist}
            className="form-control form-control-sm"
            placeholder="กรอก หมายเหตุ"
            style={{ fontFamily: "Kanit", width: 170, fontSize: 10 }}
          />
          <button onClick={() => CleckTran()} type="button" className="btn btn-outline-secondary" disabled={loadingTran} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 25 }}>{loadingTran ? "กำลังแปล..." : "แปลภาษา"}</button>

        </div>
      )

    }

    return (
      <div>
        <div className='row'>

          <CrateInput />
          <div style={{ fontFamily: "kanit_B", fontSize: 12, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาไทย : {text}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 10 }}>ภาษาจีน : {zh_T !== undefined ? zh_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาลาว :{lo_T !== undefined ? lo_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาพม่า :{my_T !== undefined ? my_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาเขมร :{km_T !== undefined ? km_T.translatedText : ""}</div>
          <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#4b5563", marginTop: 5 }}>ภาษาอังกฤษ :{en_T !== undefined ? en_T.translatedText : ""}</div>

        </div>
        <div style={{ justifySelf: "center" }}>
          <button onClick={() => CleckSubmitCreate()} type="button" className="btn btn-outline-primary mt-2" style={{ fontFamily: "kanit", fontSize: 10, height: 25, width: 70, justifyItems: "center" }}>สร้าง</button>
        </div>
      </div>
    )

  }

  //***แปลภาษา แก้ไข    *************/
  const SearchS = () => {
    const [data, setData] = useState(posts);
    const [search1, setsearch1] = useState("")
    const [idss, setidss] = useState('')
    const [listE, setlistE] = useState('')

    const handleChange1 = (value: any) => {
      setsearch1(value);
      filterDataProduct1(value);
    };

    // filter records by Productname
    const filterDataProduct1 = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData(posts);
      else {
        const filteredData = data.filter((user: any) =>
          user.list.toLowerCase().includes(search1.toLowerCase())
          //  || user.code.toLowerCase().includes(search.toLowerCase())  
          //  || user.Barcode.toLowerCase().includes(search.toLowerCase())                                       
        );
        setData(filteredData);
      }
    };

    // แปลภาษา Edit       
    function TranslatePageE() {


      const [text, setText] = useState(listE)
      const [selected, setSelected] = useState<string[]>(AVAILABLE_TARGETS.map((t) => t.code))
      const [results, setResults] = useState<Record<string, Result>>({})
      const [error, setError] = useState<string | null>(null)

      const [ZH_E, setZH_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_zh)))
      const [LO_E, setLO_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_lo)))
      const [MY_E, setMY_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_my)))
      const [KM_E, setKM_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_km)))
      const [EN_E, setEN_E] = useState(String(language.filter((a: any) => a.list === list).map((a: any) => a.list_eng)))

      function toggle(code: string) {
        setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
      }

      // 🟢 Auto-translate per language with debounce
      useEffect(() => {
        if (!text) return


        selected.forEach(async (target) => {
          try {
            const resp = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, targets: [target] }),
            })
            if (!resp.ok) throw new Error(await resp.text())
            const data = await resp.json()
            setResults((prev) => ({ ...prev, [target]: data.results[0], }))

          } catch (err: any) {
            setResults((prev) => ({
              ...prev,
              [target]: { target, translatedText: `ERROR: ${err.message}`, mirror: '' },
            }))
          }
        })



      }, [Number(text), selected])

      let zh_T = results.zh;
      let lo_T = results.lo;
      let my_T = results.my;
      let km_T = results.km;
      let en_T = results.en;


      const [search, setsearch] = useState(listE)
      const [loading, setLoading] = useState(false)

      const handleChange = (value: any) => {
        setsearch(value);
        localStorage.setItem("list_Indi", value)
      };

      const T_zh = (value: any) => {
        setZH_E(value);
        localStorage.setItem("zh_Indi", value)
      };

      const T_lo = (value: any) => {
        setLO_E(value);
        localStorage.setItem("lo_Indi", value)
      };

      const T_my = (value: any) => {
        setMY_E(value);
        localStorage.setItem("my_Indi", value)
      };

      const T_en = (value: any) => {
        setEN_E(value);
        localStorage.setItem("en_Indi", value)
      };

      const Tran = async () => {
        if (!search) return
        setLoading(true)
        setText(search)

        try {
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: search, targets: ['zh', 'lo', 'my', 'km', 'en'] }),
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()

          const resultsMap: Record<string, any> = {}
          data.results.forEach((r: any) => { resultsMap[r.target] = r })

          setZH_E(resultsMap.zh?.translatedText || "")
          setLO_E(resultsMap.lo?.translatedText || "")
          setMY_E(resultsMap.my?.translatedText || "")
          setKM_E(resultsMap.km?.translatedText || "")
          setEN_E(resultsMap.en?.translatedText || "")

          localStorage.setItem("list_Indi", search)
          localStorage.setItem("zh_Indi", resultsMap.zh?.translatedText || "")
          localStorage.setItem("lo_Indi", resultsMap.lo?.translatedText || "")
          localStorage.setItem("my_Indi", resultsMap.my?.translatedText || "")
          localStorage.setItem("en_Indi", resultsMap.en?.translatedText || "")
        } catch (err) {
          console.error('Translation error:', err)
        } finally {
          setLoading(false)
        }
      }

      return (
        <>
          <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>หมายเหตุ</div>
          <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
            <div className='d-flex'>
              <input
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                className="form-control form-control-sm"
                placeholder=""
                style={{ fontFamily: "Kanit", fontSize: 12, height: 12 }} />
              <button onClick={() => Tran()} type="button" className="btn btn-outline-primary" disabled={loading} style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, height: 30 }}>{loading ? "กำลังแปล..." : "แปล"}</button>
            </div>
          </div>


          <div className='row'>
            {/*ลาว*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาลาว :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_lo)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={LO_E}
                  onChange={(e) => T_lo(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*พม่า*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาพม่า :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_my)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={MY_E}
                  onChange={(e) => T_my(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*อังกฤษ*/}
            <div className='col mt-2' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาอังกฤษ :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_eng)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={EN_E}
                  onChange={(e) => T_en(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>

            {/*จีน*/}
            <div className='col mt-2 mb-3' style={{ marginLeft: 10 }}>
              <div className='d-flex'>
                <div style={{ fontFamily: "kanit", fontSize: 9, marginLeft: 3, color: "#4b5563" }}>ภาษาจีน :</div>
                <div style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 3, color: "#2A6AAA" }}>{posts.filter((a: any) => a.list === listE).map((a: any) => a.list_zh)}</div>
              </div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={ZH_E}
                  onChange={(e) => T_zh(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder=""
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12, marginTop: 5 }} />
              </div>
            </div>


          </div>
        </>
      )

    }

    // แก้ไขภาษา
    function Edit_list() {

      //*******Show Modal **********************************/
      const [show1, setShow1] = useState(false);
      const handleClose = () => setShow1(false);
      const handleShow = () => { setShow1(true) };
      const handleClose1 = () => { handleSubmit(), setShow1(false) };
      //***************************************************************** */


      return (
        <>
          <Image alt={""} src={edits} quality={40} color='grayText' onClick={handleShow} />


          <Modal1 show={show1} onHide={handleClose}>
            <Modal1.Header closeButton>
              <Modal1.Title
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
                แก้ไข
              </Modal1.Title>
            </Modal1.Header>
            <Modal1.Body>
              <div>


                <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <TranslatePageE />
                </div>

              </div>


            </Modal1.Body>
            <Modal1.Footer>
              <Button1
                variant="secondary"
                onClick={handleClose}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}
              >
                ปิด
              </Button1>
              <Button1
                variant="warning"
                onClick={handleClose1}
                style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, color: "white" }}

              >
                แก้ไข
              </Button1>
            </Modal1.Footer>
          </Modal1>
        </>
      );
    }

    /************************************ */
    // Edit/id
    const handleSubmit = async () => {
      let company = (localStorage.getItem("company_") || "")
      const list = String(localStorage.getItem("list_Indi") || "")
      const list_lo = String(localStorage.getItem("lo_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("lo_Indi") || "")
      const list_my = String(localStorage.getItem("my_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("my_Indi") || "")
      //  const list_km=String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))===""?String(KM):String(language.filter((a:any)=>a.list===list).map((a:any)=>a.list_km))
      const list_zh = String(localStorage.getItem("zh_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("zh_Indi") || "")
      const list_eng = String(localStorage.getItem("en_Indi") || "") === "" ? String(posts.filter((a: any) => a.list === String(localStorage.getItem("list_Indi") || "")).map((a: any) => a.list_lo)) : String(localStorage.getItem("en_Indi") || "")


      try {
        await axios.put(`/api/${apiRemarkL}/${idss}`,
          {
            list, company, list_lo, list_my, list_zh, list_eng
          }
        )
        await fetchPosts()
        setlist("")



      } catch (error) {
        console.error(error)
      }
    }

    // Delete/id
    const deletePost = async (id: Number) => {
      try {
        await axios.delete(`/api/${apiRemarkL}/${id}`)
        await fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }
    return (
      <>
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <table className="table table-sm table-hover mt-1" >
            <thead style={{ position: "sticky", top: "0" }}>
              <tr>

                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "90%" }}>
                  หมายเหตุ
                  <div className={styles.bodydetailTable_Re} style={{ width: "10vw" }}>
                    <input
                      value={search1}
                      onChange={(e) => handleChange1(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหา หมายเหตุ"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>
                </th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>แก้ไข ภาษา</th>
                <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "10%" }}>ลบ</th>

              </tr>
            </thead>
            <tbody className="table-group-divider">
              {data.map((post: any) => (
                <tr key={post.id}>

                  <td className={styles.bodydetailTable_Re1} style={{ width: "70%", fontSize: 12 }}>{post.list}</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => { setidss(post.id), setlistE(post.list) }} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Edit_list />
                    </button>

                  </td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                    <button onClick={() => deletePost(post.id)} style={{ width: 18, height: 15, borderColor: "blue" }}>
                      <Image alt={""} src={deletes} quality={40} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>

      {/* Create Card */}
      <div className={styles.productInfoCard}>
        <div className={styles.productInfoCardHeader}>
          <span>➕</span> สร้าง หมายเหตุ
        </div>
        <div className={styles.productInfoCardBody}>
          <TranslatePage />
        </div>
      </div>

      {/* Data List Card */}
      <div className={styles.pricingCard}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' }}>
          <span>📋</span> ข้อมูล หมายเหตุ
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <SearchS />
        </div>
      </div>

      {/* Sample Card */}
      <div className={styles.pricingCard} style={{ background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)' }}>
        <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)', color: '#1E5088' }}>
          <span>📋</span> ตัวอย่าง หมายเหตุ
        </div>
        <div className={styles.pricingCardBody} style={{ padding: 0 }}>
          <TimeStyleSearchEx postsA={PA_time} posts={posts} onAdd={(t, id) => { setlist(t); setlistid(id); }} styles={styles} title="ตัวอย่าง หมายเหตุ" placeholder="ค้นหา หมายเหตุ" />
        </div>
      </div>

    </div>
  )
}

function LabelPage() {
  const [showcolor, setshowcolor] = useState("")

  useEffect(() => {
    setshowcolor("1")
  }, [])

  return (
    <div className="" style={{ paddingLeft: 15, paddingRight: 15 }}  >

      <div className="row justify-content-start " >
        <HeadTab />
      </div>

      <div className="row justify-content-start " >

        <div className="col-sm-1" >
          <MenuTab_Small />
        </div>

        <div className="col-sm-11">
          <div className="row shadow shadow-sm rounded border border" style={{ backgroundColor: "white", padding: '10px' }}>

            {/*Button head product */}
            <MenuProductHead />

            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px', marginTop: '10px' }}>

              {/* Left Sidebar - Tab Navigation */}
              <div className={styles.productInfoCard} style={{ height: 'fit-content' }}>
                <div className={styles.productInfoCardHeader}>
                  <span>🏷️</span> ข้อมูลฉลากสินค้า
                </div>
                <div className={styles.productInfoCardBody} style={{ padding: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => setshowcolor("1")}
                      type="button"
                      style={{
                        fontFamily: 'Kanit',
                        fontSize: 12,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: showcolor === "1" ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' : '#f3f4f6',
                        color: showcolor === "1" ? 'white' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      💊 ข้อบ่งใช้
                    </button>
                    <button
                      onClick={() => setshowcolor("2")}
                      type="button"
                      style={{
                        fontFamily: 'Kanit',
                        fontSize: 12,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: showcolor === "2" ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' : '#f3f4f6',
                        color: showcolor === "2" ? 'white' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⏰ ช่วงเวลา
                    </button>
                    <button
                      onClick={() => setshowcolor("3")}
                      type="button"
                      style={{
                        fontFamily: 'Kanit',
                        fontSize: 12,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: showcolor === "3" ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' : '#f3f4f6',
                        color: showcolor === "3" ? 'white' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📝 วิธีใช้
                    </button>
                    <button
                      onClick={() => setshowcolor("4")}
                      type="button"
                      style={{
                        fontFamily: 'Kanit',
                        fontSize: 12,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: showcolor === "4" ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' : '#f3f4f6',
                        color: showcolor === "4" ? 'white' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🕐 เวลาที่ใช้
                    </button>
                    <button
                      onClick={() => setshowcolor("5")}
                      type="button"
                      style={{
                        fontFamily: 'Kanit',
                        fontSize: 12,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: showcolor === "5" ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' : '#f3f4f6',
                        color: showcolor === "5" ? 'white' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📦 วิธีเก็บ
                    </button>
                    <button
                      onClick={() => setshowcolor("6")}
                      type="button"
                      style={{
                        fontFamily: 'Kanit',
                        fontSize: 12,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: showcolor === "6" ? 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)' : '#f3f4f6',
                        color: showcolor === "6" ? 'white' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📋 หมายเหตุ
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div>
                {
                  showcolor === "1" ? <Body_Indicator /> :
                    showcolor === "2" ? <Body_Time1 /> :
                      showcolor === "3" ? <Body_Use1 /> :
                        showcolor === "4" ? <Body_TimeUse1 /> :
                          showcolor === "5" ? <Body_Keep1 /> :
                            showcolor === "6" ? <Body_Remark1 /> : ""
                }
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
export default LabelPage