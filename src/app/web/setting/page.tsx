'use client'

import React, { useState, useRef, useEffect, Suspense, createContext, useContext, ChangeEvent, KeyboardEvent, use } from 'react'
import axios from 'axios'
import { saveDirHandle, loadDirHandle } from '@/lib/backupDirStore'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import { usePermission } from '@/utils/usePermission'
import {
  getPrinters as getPlatformPrinters,
  isSilentPrintAvailable,
  printSilent,
} from '@/lib/runtime/print'
import { INSTALL_LOGS } from '@/lib/installPaths'
import { Listbox, ListboxItem, cn } from "@heroui/react";
import Link from 'next/link';
import Image from "next/image";
const btncolors = "#3E86C7"
const btncolort = "white"
import { Input } from "@heroui/input";
import imageS from "../../icon/samaporn.jpg"
import { Switch } from "@heroui/react";
import { Label } from "@/components/ui/label"
import ReactDOM from "react-dom";
import QRCode from "react-qr-code";
import QRCODE from "../../icon/qr.jpg"
import PaymentProviderSetting from "./PaymentProviderSetting"
import { useRouter } from "next/navigation";
const getemployee = "setting/employee"
const getpoint = "setting/point"
const getlabel = "setting/label"
const getstore = "setting/store/store"
const getpayment = "setting/payment"
import { jwtDecode } from 'jwt-decode';
const getlevel = "level"
import { Toaster, toast } from "sonner"
import { enableFullscreen } from "@/lib/fullscreen";
import leveljson from "../../json/level.json"
import bcrypt from "bcryptjs";
import { detectSmartcardAgent, pingSmartcardAgent, readSmartcardThroughProxy, SMARTCARD_CANDIDATES } from "@/utils/smartcard"
import { Activity, AlertTriangle, Ban, CheckCircle2, ClipboardList, Clock3, Eraser, Eye, Filter, Monitor, Palette, Pencil, Plus, Power, RefreshCw, RotateCcw, Save as SaveIcon, Search, Signature, Trash2, UserRound, XCircle } from "lucide-react"
import { getDeviceId, getDeviceType, getDeviceTypeShort } from "@/utils/checkinDevice"
import { DEFAULT_EXPIRY_COLOR_RULES, colorWithAlpha, getReadableTextColor, getReadableTintTextColor, normalizeExpiryColorRules, type ExpiryColorRule } from "@/lib/expiryColorRules"
import { normalizeCostPriceMode, setCachedCostPriceMode, type CostPriceMode } from "@/lib/costPriceMode"
import { logAction } from "@/lib/logbook"

const levelDefaultsByCode = new Map((leveljson as any[]).map((item: any) => [item.codename, item]))
const deprecatedLevelCodes = new Set(["E3"])
const mergeLevelDefaults = (rows: any[]) => {
  const seen = new Set<string>()
  return rows
    .filter((row: any) => !deprecatedLevelCodes.has(row.codename) || levelDefaultsByCode.has(row.codename))
    .filter((row: any) => {
      if (seen.has(row.codename)) return false
      seen.add(row.codename)
      return true
    })
    .map((row: any) => {
      const defaults = levelDefaultsByCode.get(row.codename)
      return defaults ? { ...row, main: defaults.main, list: defaults.list } : row
    })
}

function SettingPage() {

  const [showcolor, setshowcolor] = useState("")
  const [isOwnerLevel2, setIsOwnerLevel2] = useState(false)

  useEffect(() => {

    // change background color with a random color
    setshowcolor("7")
    setIsOwnerLevel2((localStorage.getItem('level_') || '') === 'level2')


  }, []);


  const AlertComplete = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };


  // Menu
  const MainPage = () => {
    const [isOwner, setIsOwner] = useState(false)
    useEffect(() => {
      if (typeof window !== 'undefined') {
        setIsOwner((localStorage.getItem('level_') || '') === 'level2')
      }
    }, [])

    return (


      <div className='container-sm m-1' >
        <div className="btn-group-sm" role="group" aria-label="Basic outlined example" >
          <button onClick={() => { setshowcolor("7") }} type="button" className="btn btn-outline-secondary " style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "7" ? btncolors : "white", color: showcolor == "7" ? btncolort : "gray" }}>ตั้งค่าเครื่องพิมพ์</button>
          <button onClick={() => { setshowcolor("1") }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "1" ? btncolors : "white", color: showcolor == "1" ? btncolort : "gray" }}>ข้อมูลร้านค้า</button>
          <button onClick={() => { setshowcolor("10") }} type="button" className="btn btn-outline-secondary " style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "10" ? btncolors : "white", color: showcolor == "10" ? btncolort : "gray" }}>ข้อมูลทั่วไป</button>
          <button onClick={() => { setshowcolor("2") }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "2" ? btncolors : "white", color: showcolor == "2" ? btncolort : "gray" }}>ข้อมูลเภสัชกร พนักงาน</button>
          <button onClick={() => { setshowcolor("3") }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "3" ? btncolors : "white", color: showcolor == "3" ? btncolort : "gray" }}>ตั้งค่ารูปแบบ ฉลากสินค้า</button>
          <button onClick={() => { setshowcolor("4") }} type="button" className="btn btn-outline-secondary " style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "4" ? btncolors : "white", color: showcolor == "4" ? btncolort : "gray" }}>ตั้งค่าแต้มสะสมและส่วนลด</button>
          <button onClick={() => { setshowcolor("5") }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "5" ? btncolors : "white", color: showcolor == "5" ? btncolort : "gray" }}>ตั้งค่า QR Payment</button>
          <button onClick={() => { setshowcolor("6") }} type="button" className="btn btn-outline-secondary " style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "6" ? btncolors : "white", color: showcolor == "6" ? btncolort : "gray" }}>การมองเห็น</button>
          <button onClick={() => { setshowcolor("8") }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "8" ? btncolors : "white", color: showcolor == "8" ? btncolort : "gray" }}>แบ็คอัพข้อมูล</button>
          <button onClick={() => { setshowcolor("9") }} type="button" className="btn btn-outline-secondary " style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "9" ? btncolors : "white", color: showcolor == "9" ? btncolort : "gray" }}>ตั้งค่าเครื่องอ่านบัตรประชาชน</button>
          <button onClick={() => { setshowcolor("11") }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "11" ? btncolors : "white", color: showcolor == "11" ? btncolort : "gray", display: "inline-flex", alignItems: "center", gap: 5 }}><ClipboardList size={13} /> Logbook</button>
          {isOwner && (
            <button onClick={() => { setshowcolor("12") }} type="button" className="btn btn-outline-secondary " style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "12" ? btncolors : "white", color: showcolor == "12" ? btncolort : "gray", display: "inline-flex", alignItems: "center", gap: 5 }}><Monitor size={13} /> ผูกคอมพิวเตอร์ Check-in</button>
          )}
          {isOwner && (
            <button onClick={() => { setshowcolor("13") }} type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: showcolor == "13" ? btncolors : "white", color: showcolor == "13" ? btncolort : "gray", display: "inline-flex", alignItems: "center", gap: 5 }}><Power size={13} /> ตั้งเวลา เปิด-ปิด เครื่อง</button>
          )}
          {isOwner && (
            <Link href="/web/setting/telegram">
              <button type="button" className="btn btn-outline-secondary m-1" style={{ fontFamily: "kanit", fontSize: 12, height: 30, backgroundColor: "#0088CC", color: "white", border: "none" }}>
                📨 ตั้งค่า Telegram แจ้งเตือน
              </button>
            </Link>
          )}

        </div>
      </div>



    )

  }

  // ตั้งค่าหน้าร้าน
  const CommonPage = () => {
    const router = useRouter();
    const [user, setuser] = useState<any[]>([])

    const [postsshow, setshow] = useState<any[]>([])
    const [EmpId, SetId] = useState("")

    const [compa, Setcompany] = useState("")
    const [storeS, SetStore] = useState("")
    const [addressS, SetAddress] = useState("")
    const [telS, SetTel] = useState("")
    const [lineidS, SetLineID] = useState("")
    const [ownerNameS, SetOwnerName] = useState("")
    const [taxS, SetTax] = useState("")
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [uploadedUrl1, setUploadedUrl1] = useState<string | null>(null);
    // Cache-buster: logo/line files are saved with a fixed name per company (logo_{company}.jpg),
    // so the URL string never changes after a re-upload and the browser serves the old cached image.
    // Bumping this value forces the <img> to refetch the file whenever it is uploaded/loaded.
    const [imgVersion, setImgVersion] = useState(() => Date.now())
    const [vatEnabled, setVatEnabled] = useState("false")
    const [branchNameS, setBranchName] = useState("")
    const [branchCodeS, setBranchCode] = useState("")

    const [randoms, setUpdete] = useState(0)


    useEffect(() => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/");
        return;
      }

      try {
        interface JwtPayload {
          id: number;
          idcompany?: string;
          [key: string]: any;
        }

        const payload = jwtDecode<JwtPayload>(token);

        if (!payload?.id) {
          console.error("Invalid payload, missing user ID");
          router.push("/");
          return;
        }

        const fetchGetIDUser = async () => {
          const res = await axios.get(`/api/login/loginuser/${payload.id}`);
          SetStore(res.data.company);
        };

        fetchGetIDUser();

      } catch (error) {
        console.error("Token decoding failed:", error);
        router.push("/");
      }
    }, []);




    //********************************************************* */
    // Store   
    const StoreInput = (e: any) => {
      SetStore(e.target.value)
    }
    // Address  
    const AddressInput = (e: any) => {
      SetAddress(e.target.value)
    }
    // Tel 
    const TelInput = (e: any) => {
      SetTel(e.target.value)
    }
    // LineID
    const LineIDInput = (e: any) => {
      SetLineID(e.target.value)
    }
    // OwnerName
    const OwnerNameInput = (e: any) => {
      SetOwnerName(e.target.value)
    }
    // Tax
    const TaxInput = (e: any) => {
      SetTax(e.target.value)
    }

    //*******************************Add Image Logo************************ */
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
        body: JSON.stringify({ imageBase64: preview, company: companyS, hard: "logo" }),
      });
      const data = await res.json();
      if (data.file) {
        setUploadedUrl(data.file);
        setImgVersion(Date.now());

      }
      Edit()
      AlertComplete()
    };

    //************************************************************************ */
    //*******************************Add Image LineID************************ */
    const [preview1, setPreview1] = useState<string | null>(null);


    const handleFileChange1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file1 = e.target.files?.[0];
      if (!file1) return;

      // Convert file to Base64
      const reader1 = new FileReader();
      reader1.onloadend = async () => {
        const base64 = reader1.result as string;
        setPreview1(base64);
      };
      reader1.readAsDataURL(file1);
    }

    const UploadImg1 = async () => {
      // Send to backend
      const res = await fetch("/api/setting/store/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: preview1, company: companyS, hard: "line" }),
      });
      const data = await res.json();
      if (data.file) {
        setUploadedUrl1(data.file);
        setImgVersion(Date.now());

      }

      Edit()
      AlertComplete()


    };

    //************************************************************************ */
    //******************Get Store************************************ */
    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getstore}?company=${companyS}`)  //Get_Employee
        res.data[0] == undefined ? "" : SetId(res.data[0].id)
        res.data[0] == undefined ? "" : Setcompany(res.data[0].company)
        res.data[0] == undefined ? "" : SetStore(res.data[0].namestore)
        res.data[0] == undefined ? "" : SetAddress(res.data[0].address)
        res.data[0] == undefined ? "" : SetTel(res.data[0].tel)
        res.data[0] == undefined ? "" : SetLineID(res.data[0].lineid)
        res.data[0] == undefined ? "" : SetOwnerName(res.data[0].ownerName || "")
        res.data[0] == undefined ? "" : SetTax(res.data[0].taxnumber)
        res.data[0] == undefined ? "" : setUploadedUrl(res.data[0].publiclogo)
        res.data[0] == undefined ? "" : setUploadedUrl1(res.data[0].publicline)
        res.data[0] == undefined ? "" : setVatEnabled(res.data[0].vatEnabled || "false")
        res.data[0] == undefined ? "" : setBranchName(res.data[0].branchName || "")
        res.data[0] == undefined ? "" : setBranchCode(res.data[0].branchCode || "")
        setImgVersion(Date.now())
        setshow(res.data)



      } catch (error) {
        console.error(error)
      }

    }

    useEffect(() => {
      fetchPosts()
    }, []);
    /************************************************************************** */
    //******* */ Post Data********************************************************/
    const Save = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const company = String(companyS)
      const namestore = String(storeS)
      const address = String(addressS)
      const tel = String(telS)
      const lineid = String(lineidS)
      const taxnumber = String(taxS)
      const publiclogo = String(uploadedUrl)
      const publicline = String(uploadedUrl1)

      //company, namestore, address, tel, lineid, taxnumber, publiclogo, publicline
      try {
        await axios.post(`/api/${getstore}`,
          {
            company, namestore, address, tel, lineid, taxnumber, publiclogo, publicline
          }
        )
      } catch (error) {
        console.error(error)
      }

    }

    //******* */ Post Data********************************************************/
    const SaveStart = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const company = String(companyS)
      const namestore = String(storeS)
      const address = ""
      const tel = ""
      const lineid = ""
      const taxnumber = ""
      const publiclogo = ""
      const publicline = ""

      //company, namestore, address, tel, lineid, taxnumber, publiclogo, publicline
      try {
        await axios.post(`/api/${getstore}`,
          {
            company, namestore, address, tel, lineid, taxnumber, publiclogo, publicline
          }
        )
        AlertComplete()
        await fetchPosts()
      } catch (error) {
        console.error(error)
      }

    }

    //******* */ Edit Data********************************************************
    const Edit = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const namestore = String(storeS)
      const address = String(addressS)
      const tel = String(telS)
      const lineid = String(lineidS)
      const ownerName = String(ownerNameS)
      const taxnumber = String(taxS)
      const publiclogo = "/uploads/logo_" + companyS + ".jpg"
      const publicline = "/uploads/line_" + companyS + ".jpg"
      const vatEnabledVal = String(vatEnabled)
      const branchName = String(branchNameS)
      const branchCode = String(branchCodeS)

      // Upload Logo if preview exists
      if (preview && preview !== "") {
        try {
          const resLogo = await fetch("/api/setting/store/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: preview, company: companyS, hard: "logo" }),
          });
          const dataLogo = await resLogo.json();
          if (dataLogo.file) {
            setUploadedUrl(dataLogo.file);
            setImgVersion(Date.now());
          }
        } catch (error) {
          console.error("Upload logo error:", error)
        }
      }

      // Upload LineID if preview1 exists
      if (preview1 && preview1 !== "") {
        try {
          const resLine = await fetch("/api/setting/store/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: preview1, company: companyS, hard: "line" }),
          });
          const dataLine = await resLine.json();
          if (dataLine.file) {
            setUploadedUrl1(dataLine.file);
            setImgVersion(Date.now());
          }
        } catch (error) {
          console.error("Upload line error:", error)
        }
      }

      try {
        await axios.put(`/api/${getstore}/${Number(EmpId)}`,
          {
            namestore, address, tel, lineid, ownerName, taxnumber, publiclogo, publicline, vatEnabled: vatEnabledVal, branchName, branchCode
          }
        )
        await fetchPosts() // refresh data after update
      } catch (error) {
        console.error(error)
      }
      AlertComplete()
      setUpdete(Math.random())
    }



    return (
      <>
        {postsshow.length > 0 ? "" :

          <div >
            <button
              onClick={() => SaveStart()}
              type='button'
              className='btn btn-secondary'
              style={{ fontFamily: "kanit", fontSize: 15 }}>
              คลิก เริ่มการตั้งค่าร้านค้า
            </button>
          </div>}
        {postsshow.length < 1 ? "" :
          <div className='col-5'>
            <div className="row justify-content-between mb-2">
              <div className="col-4">
                <div className='mt-2 mb-2' style={{ fontFamily: "kanit", fontSize: 15, width: 100 }}>ตั้งค่าหน้าร้าน</div>
              </div>
              <div className="col col-lg-2">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => Edit()}
                  style={{ fontFamily: "kanit", fontSize: 15 }}>
                  บันทีก
                </button>
              </div>
            </div>

            <div className="input-group">
              <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>ชื่อร้านค้า</span>
              <input
                type="text"
                className="form-control"
                placeholder=""
                aria-label="Username"
                aria-describedby="visible-addon"
                value={storeS}
                onChange={StoreInput}
                style={{ fontFamily: "kanit", fontSize: 15 }} />
            </div>

            <div className="input-group mt-2">
              <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>ที่อยู่</span>
              <input
                type="text"
                className="form-control"
                placeholder=""
                aria-label="Username"
                aria-describedby="visible-addon"
                value={addressS}
                onChange={AddressInput}
                style={{ fontFamily: "kanit", fontSize: 15 }} />
            </div>

            <div className="input-group mt-2">
              <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>เบอร์โทร</span>
              <input
                type="text"
                className="form-control"
                placeholder=""
                aria-label="Username"
                aria-describedby="visible-addon"
                value={telS}
                onChange={TelInput}
                style={{ fontFamily: "kanit", fontSize: 15 }} />
            </div>

            <div className="input-group mt-2">
              <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>Line ID</span>
              <input
                type="text"
                className="form-control"
                placeholder=""
                aria-label="Username"
                aria-describedby="visible-addon"
                value={lineidS}
                onChange={LineIDInput}
                style={{ fontFamily: "kanit", fontSize: 15 }} />
            </div>

            <div className="input-group mt-2">
              <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>ชื่อผู้ประกอบการ</span>
              <input
                type="text"
                className="form-control"
                placeholder=""
                aria-label="Username"
                aria-describedby="visible-addon"
                value={ownerNameS}
                onChange={OwnerNameInput}
                style={{ fontFamily: "kanit", fontSize: 15 }} />
            </div>

            <div className="input-group mt-2">
              <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>เลขที่ใบกำกับภาษี</span>
              <input
                type="text"
                className="form-control"
                placeholder=""
                aria-label="Username"
                aria-describedby="visible-addon"
                value={taxS}
                onChange={TaxInput}
                style={{ fontFamily: "kanit", fontSize: 15 }} />
            </div>

            {/* VAT 7% Toggle */}
            <div className="mt-3 p-3 border rounded" style={{ backgroundColor: "#f8f9fa" }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span style={{ fontFamily: "kanit", fontSize: 14, fontWeight: "bold" }}>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "GrayText" }}>เปิดเพื่อออกใบกำกับภาษีแบบย่อในใบเสร็จ</div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="vatSwitch"
                    checked={vatEnabled === "true"}
                    onChange={(e) => setVatEnabled(e.target.checked ? "true" : "false")}
                    style={{ width: 45, height: 22 }}
                  />
                </div>
              </div>
              {vatEnabled === "true" && (
                <div className="d-flex gap-2 mt-2">
                  <div className="input-group" style={{ flex: 1 }}>
                    <span className="input-group-text" style={{ fontFamily: "kanit", fontSize: 12, width: 70, color: "GrayText" }}>สาขา</span>
                    <select
                      className="form-select"
                      value={branchNameS}
                      onChange={(e) => {
                        const selected = e.target.value
                        const toThai = (s: string) => s.replace(/[0-9]/g, d => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d)])
                        const code = selected === 'สำนักงานใหญ่' ? '๐๐๐๐๐' : toThai(String(parseInt(selected.replace('สาขาที่ ', ''))).padStart(5, '0'))
                        setBranchName(selected)
                        setBranchCode(code)
                      }}
                      style={{ fontFamily: "kanit", fontSize: 14 }}
                    >
                      <option value="สำนักงานใหญ่">สำนักงานใหญ่</option>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={`สาขาที่ ${n}`}>สาขาที่ {n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <span className="input-group-text" style={{ fontFamily: "kanit", fontSize: 12, width: 70, color: "GrayText" }}>เลขที่</span>
                    <input
                      type="text"
                      className="form-control"
                      readOnly
                      value={branchCodeS || '๐๐๐๐๐'}
                      style={{ fontFamily: "kanit", fontSize: 15, backgroundColor: '#f0f0f0' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='row justify-content-center'>
              <div className='col-sm-4'>
                <div className=" mt-4 justify-content-between  " style={{ width: 150, height: 150, justifyContent: "center" }}>
                  <div className='shadow-sm rounded border border-2 justify-content-center' style={{ width: 150, height: 150 }} >
                      {(uploadedUrl == null || uploadedUrl === "") || (preview !== null && preview !== "") ?
                                        preview && preview !== "" && (<img className='img-fluid rounded mx-auto d-block' src={preview} alt="preview" width={130} height={130} />)
                                                              :
                      <img className='img-fluid rounded mx-auto d-block' src={uploadedUrl ? `${uploadedUrl}?v=${imgVersion}` : "/placeholder.png"} alt="preview" width={140} height={140} />
                    }

                  </div>

                  <div className="input-group input-group-sm mt-2 d-flex " style={{ width: 60, justifySelf: "center" }} >
                    <label className="input-group-text rounded border border-2" htmlFor="inputGroupFile01">เลือกรูป</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} id="inputGroupFile01" style={{ height: 0 }}></input>
                  </div>
                  <div style={{ justifySelf: "center" }} >
                    <button
                      className="btn btn-outline-secondary mt-1 "
                      onClick={UploadImg}
                      style={{ fontFamily: "kanit", fontSize: 12, width: 120 }}>
                      บันทึก Logo
                    </button>

                  </div>
                </div>

              </div>

              <div className='col-sm-4'>
                <div className="row-4 mt-4 justify-content-between  " style={{ width: 150, height: 150, justifyContent: "center" }}>
                  <div className='shadow-sm rounded border border-2 justify-content-center' style={{ width: 150, height: 150 }} >
                    {(uploadedUrl1 == null || uploadedUrl1 === "") || (preview1 !== null && preview1 !== "") ?
                      preview1 && preview1 !== "" && (<img className='img-fluid rounded mx-auto d-block' src={preview1} alt="preview1" width={140} height={140} />)
                      :
                      <img className='img-fluid rounded mx-auto d-block' src={uploadedUrl1 ? `${uploadedUrl1}?v=${imgVersion}` : "/placeholder.png"} alt="preview" width={140} height={140} />
                    }

                  </div>

                  <div className="input-group input-group-sm mt-2 d-flex " style={{ width: 60, justifySelf: "center" }} >
                    <label className="input-group-text rounded border border-2" htmlFor="inputGroupFile02">เลือกรูป</label>
                    <input type="file" accept="image/*" onChange={handleFileChange1} id="inputGroupFile02" style={{ height: 0 }}></input>
                  </div>
                  <div style={{ justifySelf: "center" }} >
                    <button
                      className="btn btn-outline-secondary mt-1 "
                      onClick={UploadImg1}
                      style={{ fontFamily: "kanit", fontSize: 12, width: 120 }}>
                      บันทึก LineID
                    </button>

                  </div>
                </div>
              </div>
            </div>
          </div>}
      </>
    )

  }

  // ตั้งค่าข้อมูลทั่วไป
  const GeneralPage = () => {
    const [settingId, setSettingId] = useState("")
    const [blockNegativeStockSale, setBlockNegativeStockSale] = useState(false)
    const [costPriceMode, setCostPriceMode] = useState<CostPriceMode>("latest")
    const [expiryColorRules, setExpiryColorRules] = useState<ExpiryColorRule[]>(DEFAULT_EXPIRY_COLOR_RULES)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchGeneralSetting = async () => {
      const companyS = localStorage.getItem("company_") || ""
      try {
        const res = await axios.get(`/api/${getstore}?company=${companyS}`)
        const store = Array.isArray(res.data) ? res.data[0] : null
        if (store) {
          setSettingId(String(store.id || ""))
          setBlockNegativeStockSale(String(store.blockNegativeStockSale || "false") === "true")
          const mode = normalizeCostPriceMode(store.costPriceMode)
          setCostPriceMode(mode)
          setCachedCostPriceMode(mode)
          setExpiryColorRules(normalizeExpiryColorRules(store.expiryColorRules))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchGeneralSetting()
    }, [])

    const SaveGeneralSetting = async () => {
      const companyS = localStorage.getItem("company_") || ""
      const blockValue = blockNegativeStockSale ? "true" : "false"
      const expiryRulesValue = JSON.stringify(normalizeExpiryColorRules(expiryColorRules))
      setSaving(true)
      try {
        if (settingId) {
          await axios.put(`/api/${getstore}/${Number(settingId)}`, { blockNegativeStockSale: blockValue, expiryColorRules: expiryRulesValue, costPriceMode })
        } else {
          const res = await axios.post(`/api/${getstore}`, { company: String(companyS), blockNegativeStockSale: blockValue, expiryColorRules: expiryRulesValue, costPriceMode })
          if (res.data?.id) setSettingId(String(res.data.id))
        }
        setCachedCostPriceMode(costPriceMode)
        AlertComplete()
        await fetchGeneralSetting()
      } catch (error) {
        console.error(error)
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกข้อมูลทั่วไปไม่สำเร็จ</div>)
      } finally {
        setSaving(false)
      }
    }

    const sortedExpiryColorRules = normalizeExpiryColorRules(expiryColorRules)
    const previewRule = sortedExpiryColorRules.find((rule) => rule.enabled) || DEFAULT_EXPIRY_COLOR_RULES[0]

    const updateExpiryRule = (id: string, patch: Partial<ExpiryColorRule>) => {
      setExpiryColorRules((prev) => normalizeExpiryColorRules(prev.map((rule) => rule.id === id ? { ...rule, ...patch } : rule)))
    }

    const addExpiryRule = () => {
      const maxDays = sortedExpiryColorRules.reduce((max, rule) => Math.max(max, Number(rule.days) || 0), 0)
      setExpiryColorRules((prev) => normalizeExpiryColorRules([
        ...prev,
        { id: `rule-${Date.now()}`, label: "ช่วงใหม่", days: maxDays + 30, color: "#E5EEF8", enabled: true },
      ]))
    }

    const removeExpiryRule = (id: string) => {
      if (sortedExpiryColorRules.length <= 1) return
      setExpiryColorRules((prev) => normalizeExpiryColorRules(prev.filter((rule) => rule.id !== id)))
    }

    const resetExpiryRules = () => setExpiryColorRules(DEFAULT_EXPIRY_COLOR_RULES)

    return (
      <div className='col-11' style={{ maxWidth: 980 }}>
        <div className='mt-2 mb-3' style={{ fontFamily: "kanit_B", fontSize: 20, color: "#0f172a" }}>ข้อมูลทั่วไป</div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.9fr) minmax(420px, 1.4fr)", gap: 16, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 16, alignItems: "start" }}>
          <section style={{ border: "1px solid #e2e8f0", borderRadius: 8, background: "#ffffff", padding: 16, boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 15, color: "#0f172a", marginBottom: 12 }}>การขายสินค้า</div>
            <div className="form-check" style={{ fontFamily: "kanit", fontSize: 14 }}>
              <input
                className="form-check-input"
                type="checkbox"
                id="blockNegativeStockSale"
                checked={blockNegativeStockSale}
                disabled={loading || saving}
                onChange={(e) => setBlockNegativeStockSale(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="blockNegativeStockSale" style={{ color: "#1f2937" }}>
                ไม่ให้สแกน Barcode หรือค้นหาสินค้าที่มียอดคงเหลือน้อยกว่าหรือเท่ากับ 0 ไปขาย
              </label>
            </div>
            <div className="mt-2" style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b", lineHeight: 1.55 }}>
              เมื่อเปิดใช้งาน ระบบจะแจ้งเตือนว่าไม่สามารถขายสินค้า เนื่องจากยอดคงเหลือน้อยกว่าหรือเท่ากับ 0
            </div>
          </section>

          <section style={{ border: "1px solid #e2e8f0", borderRadius: 8, background: "#ffffff", padding: 16, boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 15, color: "#0f172a", marginBottom: 4 }}>ราคาทุนที่ใช้แสดงผล</div>
            <div style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b", lineHeight: 1.55, marginBottom: 12 }}>
              เลือกราคาทุนที่ระบบจะใช้แสดงและคำนวณ (หน้าข้อมูลสินค้า, รับสินค้า, ขายสินค้า และรายงานมูลค่าสต๊อก)
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {([
                { value: "latest" as CostPriceMode, title: "ใช้ราคาทุนล่าสุด", desc: "ราคาทุนของล็อตที่รับเข้าล่าสุด (ค่าเริ่มต้น)" },
                { value: "average" as CostPriceMode, title: "ใช้ราคาทุนเฉลี่ย", desc: "ค่าเฉลี่ยของราคาทุนจากทุกครั้งที่รับเข้า" },
              ]).map((opt) => {
                const active = costPriceMode === opt.value
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10, cursor: loading || saving ? "not-allowed" : "pointer",
                      border: `1px solid ${active ? "#2A6AAA" : "#e2e8f0"}`,
                      borderRadius: 8, padding: "10px 12px",
                      background: active ? "#F3F8FC" : "#ffffff",
                    }}>
                    <input
                      type="radio"
                      name="costPriceMode"
                      className="form-check-input mt-1"
                      checked={active}
                      disabled={loading || saving}
                      onChange={() => setCostPriceMode(opt.value)}
                    />
                    <span>
                      <span style={{ display: "block", fontFamily: "kanit_B", fontSize: 14, color: active ? "#1E5088" : "#1f2937" }}>{opt.title}</span>
                      <span style={{ display: "block", fontFamily: "kanit", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{opt.desc}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
          </div>

          <section style={{ border: "1px solid #E5EEF8", borderRadius: 8, background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)", padding: 16, boxShadow: "0 10px 30px rgba(42, 106, 170,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F3F8FC", border: "1px solid #CCDFF1", color: "#1E5088" }}>
                  <Palette size={16} strokeWidth={2.3} />
                </span>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#0f172a" }}>ตั้งค่าแสดงสีวันหมดอายุ</div>
                  <div style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>เทียบกับวันหมดอายุของ Lot ที่จะตัดสต๊อก</div>
                </div>
              </div>
              <button
                type="button"
                onClick={addExpiryRule}
                disabled={loading || saving}
                className="btn btn-sm btn-outline-primary"
                style={{ fontFamily: "kanit", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Plus size={14} /> เพิ่มช่วง
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 110px 92px 70px 38px", gap: 8, alignItems: "center", fontFamily: "kanit_B", fontSize: 11, color: "#475569", padding: "0 4px 6px" }}>
              <div>ชื่อช่วง</div>
              <div>ภายในวัน</div>
              <div>สี</div>
              <div style={{ textAlign: "center" }}>แสดง</div>
              <div></div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {sortedExpiryColorRules.map((rule) => {
                const textColor = getReadableTextColor(rule.color)
                return (
                  <div key={rule.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 110px 92px 70px 38px", gap: 8, alignItems: "center", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8 }}>
                    <input
                      className="form-control form-control-sm"
                      value={rule.label}
                      disabled={loading || saving}
                      onChange={(e) => updateExpiryRule(rule.id, { label: e.target.value })}
                      style={{ fontFamily: "kanit", fontSize: 12, height: 31 }}
                    />
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      min={0}
                      value={rule.days}
                      disabled={loading || saving}
                      onChange={(e) => updateExpiryRule(rule.id, { days: Number(e.target.value) })}
                      style={{ fontFamily: "kanit_B", fontSize: 12, height: 31, textAlign: "center" }}
                    />
                    <label style={{ height: 31, borderRadius: 7, border: "1px solid #cbd5e1", background: rule.color, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: loading || saving ? "not-allowed" : "pointer", color: textColor, fontFamily: "kanit_B", fontSize: 10 }}>
                      <input
                        type="color"
                        value={rule.color}
                        disabled={loading || saving}
                        onChange={(e) => updateExpiryRule(rule.id, { color: e.target.value })}
                        style={{ width: 22, height: 20, border: 0, padding: 0, background: "transparent" }}
                      />
                      {rule.color}
                    </label>
                    <div style={{ textAlign: "center" }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={rule.enabled}
                        disabled={loading || saving}
                        onChange={(e) => updateExpiryRule(rule.id, { enabled: e.target.checked })}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      title="ลบช่วง"
                      disabled={loading || saving || sortedExpiryColorRules.length <= 1}
                      onClick={() => removeExpiryRule(rule.id)}
                      style={{ width: 31, height: 31, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: "kanit", fontSize: 11, color: "#64748b" }}>ตัวอย่าง</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: 280, borderRadius: 999, border: `1px solid ${colorWithAlpha(previewRule.color, 0.75)}`, background: colorWithAlpha(previewRule.color, 0.18), color: getReadableTintTextColor(previewRule.color), padding: "4px 10px", fontFamily: "kanit_B", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  EXP 30/09/70 เหลือ {previewRule.days} วัน
                </span>
              </div>
              <button
                type="button"
                onClick={resetExpiryRules}
                disabled={loading || saving}
                className="btn btn-sm btn-outline-secondary"
                style={{ fontFamily: "kanit", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <RotateCcw size={13} /> ค่าเริ่มต้น
              </button>
            </div>
          </section>
        </div>

        <button
          onClick={SaveGeneralSetting}
          type='button'
          disabled={loading || saving}
          className='btn btn-primary mt-4'
          style={{ fontFamily: "kanit", fontSize: 15, minWidth: 128, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <SaveIcon size={16} /> {saving ? "กำลังบันทึก" : "บันทึก"}
        </button>
      </div>
    )
  }

  // ตั้งค่าพนักงาน
  const PeoplePage = () => {


    const [postsEmp, setPostsEmp] = useState<any[]>([])
    const [EmpId, setId] = useState("")

    const [nameinputS, SetNameInput] = useState("")
    const [positionS, Setposition] = useState("")
    const [levelS, Setlevel] = useState("")
    const [usernameS, Setusername] = useState("")
    const [passwordS, Setpassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [passwordChanged, setPasswordChanged] = useState(false)
    const [originalHashedPassword, setOriginalHashedPassword] = useState("")
    const [mobileS, Setmobile] = useState(false)
    const [timeInS, SetTimeIn] = useState("")
    const [timeOutS, SetTimeOut] = useState("")
    const [salaryS, SetSalary] = useState(0)
    const [otRateS, SetOtRate] = useState(0)
    const [signatureUrl, setSignatureUrl] = useState("")
    const [signatureOpen, setSignatureOpen] = useState(false)
    const [signatureSaving, setSignatureSaving] = useState(false)
    const [signatureHasInk, setSignatureHasInk] = useState(false)
    const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const signatureDrawingRef = useRef(false)
    const lastSignaturePointRef = useRef<{ x: number; y: number } | null>(null)

    // ===== Employee Permission States =====
    const [empPerms, setEmpPerms] = useState<any[]>([])
    const [empLevelData, setEmpLevelData] = useState<any[]>([])
    const [empPermLoading, setEmpPermLoading] = useState(false)
    const [empPermSaving, setEmpPermSaving] = useState<string | null>(null)

    // Fetch global level data once
    useEffect(() => {
      const fetchLevelData = async () => {
        const companyS = localStorage.getItem("company_") || ""
        if (!companyS) return
        try {
          const res = await axios.get(`/api/${getlevel}?company=${companyS}`)
          let data: any[] = res.data || []

          // Auto-seed missing codenames from level.json (e.g. when new permissions
          // are added in updates so existing customers get the new rows).
          if (data.length > 0) {
            const existing = new Set(data.map((d: any) => d.codename))
            const missing = (leveljson as any[]).filter(
              (j) => !existing.has(j.codename)
            )
            if (missing.length > 0) {
              const levelId = data[0].levelId
              if (levelId) {
                try {
                  await axios.post(`/api/${getlevel}`, {
                    levelId,
                    mainlevel: missing.map((m: any) => ({
                      company: companyS,
                      codename: m.codename,
                      main: m.main,
                      list: m.list,
                      level1: Boolean(m.level1),
                      level2: Boolean(m.level2),
                      level3: Boolean(m.level3),
                    })),
                  })
                  const res2 = await axios.get(`/api/${getlevel}?company=${companyS}`)
                  data = res2.data || []
                } catch (e) {
                  console.error("Auto-seed missing level rows failed:", e)
                }
              }
            }
          }

          setEmpLevelData(mergeLevelDefaults(data))
        } catch (e) { console.error(e) }
      }
      fetchLevelData()
    }, [])

    // Fetch employee permissions when EmpId changes
    useEffect(() => {
      if (!EmpId || EmpId === "") {
        setEmpPerms([])
        return
      }
      const fetchEmpPerms = async () => {
        setEmpPermLoading(true)
        try {
          const res = await axios.get(`/api/employee-permission?employeeId=${EmpId}`)
          setEmpPerms(res.data)
        } catch (e) { console.error(e) }
        setEmpPermLoading(false)
      }
      fetchEmpPerms()
    }, [EmpId])

    // Toggle single employee permission
    const toggleEmpPerm = async (codename: string, currentAllowed: boolean) => {
      setEmpPermSaving(codename)
      try {
        await axios.put(`/api/employee-permission`, {
          employeeId: Number(EmpId),
          codename,
          allowed: !currentAllowed
        })
        // Refresh
        const res = await axios.get(`/api/employee-permission?employeeId=${EmpId}`)
        setEmpPerms(res.data)
        // Update cache if editing currently logged-in employee
        if (String(EmpId) === localStorage.getItem("personid_")) {
          localStorage.setItem("emp_permissions", JSON.stringify(res.data))
        }
      } catch (e) { console.error(e) }
      setEmpPermSaving(null)
    }

    // Reset employee permissions to default
    const resetEmpPerms = async () => {
      if (!EmpId) return
      try {
        await axios.delete(`/api/employee-permission/${EmpId}`)
        setEmpPerms([])
        // Update cache if editing currently logged-in employee
        if (String(EmpId) === localStorage.getItem("personid_")) {
          localStorage.setItem("emp_permissions", JSON.stringify([]))
        }
        AlertComplete()
      } catch (e) { console.error(e) }
    }

    // Get effective permission for a codename (override > global)
    const getEffective = (codename: string): boolean => {
      const override = empPerms.find((p: any) => p.codename === codename)
      if (override) return override.allowed
      const global = empLevelData.find((g: any) => g.codename === codename)
      if (global) return global.level1 !== false
      return true
    }

    // Check if codename has override
    const hasOverride = (codename: string): boolean => {
      return empPerms.some((p: any) => p.codename === codename)
    }

    // Group level data by main category
    const groupedLevel = empLevelData.reduce((acc: any, item: any) => {
      if (!acc[item.main]) acc[item.main] = []
      acc[item.main].push(item)
      return acc
    }, {} as Record<string, any[]>)

    const [randoms, setUpdete] = useState(0)



    useEffect(() => {

      EmpId === "" ? "" : fetchGet()

    }, [EmpId]);

    useEffect(() => {
      if (!EmpId) {
        setSignatureUrl("")
        return
      }
      fetchEmployeeSignature(EmpId)
    }, [EmpId])

    //Get by ID
    const fetchGet = async () => {
      try {
        const res = await axios.get(`/api/${getemployee}/${EmpId}`);  //Get_Employee
        res.data !== undefined ? SetNameInput([res.data][0].name) : ""
        res.data !== undefined ? Setposition([res.data][0].position) : ""
        res.data !== undefined ? Setlevel([res.data][0].level) : ""
        res.data !== undefined ? Setusername([res.data][0].username) : ""
        res.data !== undefined ? Setpassword([res.data][0].passwords) : ""
        res.data !== undefined ? setOriginalHashedPassword([res.data][0].password || "") : ""
        setPasswordChanged(false)
        res.data !== undefined ? Setmobile([res.data][0].mobile || false) : ""
        res.data !== undefined ? SetTimeIn([res.data][0].timeIn || "") : ""
        res.data !== undefined ? SetTimeOut([res.data][0].timeOut || "") : ""
        res.data !== undefined ? SetSalary([res.data][0].salary || 0) : ""
        res.data !== undefined ? SetOtRate([res.data][0].otRate || 0) : ""
        res.data !== undefined ? setall1(res.data) : ""

      } catch (error) {
        console.error(error)
      }

    }



    const initialValues = {
      id: "",
      company: "",
      name: "",
      position: "",
      level: "",
      username: "",
      password: "",
      mobile: false,
      timeIn: "",
      timeOut: "",
      salary: 0,
      otRate: 0

    };

    const [all, setall1] = useState(initialValues)

    const handleInputChange = (e: any) => {
      const { name, value } = e.target;

      setall1({
        ...all,
        [name]: value,
      });

    };
    useEffect(() => {
      const fetchPosts = async () => {
        let companyS = (localStorage.getItem("company_") || "")
        try {
          const res = await axios.get(`/api/${getemployee}?id_company=${companyS}`)  //Get_Employee
          setPostsEmp(res.data)
          setall1(res.data)
        } catch (error) {
          console.error(error)
        }

      }
      fetchPosts()

    }, [randoms]);

    const router = useRouter();
    const [companyname, setuser] = useState("")

    useEffect(() => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/");
        return;
      }

      try {
        interface JwtPayload {
          id: number;
          idcompany?: string;
          [key: string]: any;
        }

        const payload = jwtDecode<JwtPayload>(token);

        if (!payload?.id) {
          console.error("Invalid payload, missing user ID");
          router.push("/");
          return;
        }

        const fetchGetIDUser = async () => {
          const res = await axios.get(`/api/login/loginuser/${payload.id}`);
          setuser(res.data.company);
        };

        fetchGetIDUser();

      } catch (error) {
        console.error("Token decoding failed:", error);
        router.push("/");
      }
    }, []);


    // Post Data
    const Save = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const company = companyname
      const id_company = Number(companyS)
      const name = all.name
      const position = all.position
      const level = all.position === "เจ้าของกิจการ" ? String("level2") : String("level1")
      const username = all.username
      const password = all.password
      const passwords = all.password
      const mobile = all.mobile || false
      const timeIn = all.timeIn || null
      const timeOut = all.timeOut || null
      const salary = Number(all.salary) || 0
      const otRate = Number(all.otRate) || 0
      try {
        await axios.post(`/api/${getemployee}`,
          {
            company, name, position, level, username, password, passwords, id_company, mobile, timeIn, timeOut, salary, otRate
          }
        )
      } catch (error) {
        console.error(error)
      }
      AlertComplete()
      setUpdete(Math.random)
      setall1(initialValues)
      setId("")
      SetNameInput("")
      Setposition("")
      Setlevel("")
      Setusername("")
      Setpassword("")
      Setmobile(false)
      SetTimeIn("")
      SetTimeOut("")
      SetSalary(0)
      SetOtRate(0)
      setSignatureUrl("")
      setSignatureOpen(false)

    }

    // Edit Data
    const Edit = async () => {
      const name = all.name
      const position = all.position
      const username = all.username
      // ถ้า password ไม่ได้เปลี่ยน ใช้ค่าเดิมจาก DB (ไม่ hash ซ้ำ)
      const password = passwordChanged ? await bcrypt.hash(String(passwordS), 10) : originalHashedPassword
      const passwords = passwordChanged ? passwordS : (all as any).passwords || passwordS
      const mobile = mobileS
      const timeIn = timeInS || null
      const timeOut = timeOutS || null
      const salary = Number(salaryS) || 0
      const otRate = Number(otRateS) || 0
      try {
        await axios.put(`/api/${getemployee}/${Number(EmpId)}`,
          {
            name, position, username, password, passwords, mobile, timeIn, timeOut, salary, otRate
          }
        )
      } catch (error) {
        console.error(error)
      }
      AlertComplete()
      setUpdete(Math.random)
      setall1(initialValues)
      setId("")
      SetNameInput("")
      Setposition("")
      Setlevel("")
      Setusername("")
      Setpassword("")
      setPasswordChanged(false)
      setOriginalHashedPassword("")
      Setmobile(false)
      SetTimeIn("")
      SetTimeOut("")
      SetSalary(0)
      SetOtRate(0)
      setSignatureUrl("")
      setSignatureOpen(false)

    }

    // Delete Data
    const Delete = async (id: number) => {
      // Validate id before deleting
      if (!id || isNaN(id)) {
        console.error("Invalid ID for delete")
        return
      }
      try {
        const companyS = localStorage.getItem("company_") || "default"
        await axios.delete(`/api/setting/employee-signature?employeeId=${id}&company=${companyS}`).catch((signatureError) => console.error(signatureError))
        await axios.delete(`/api/${getemployee}/${id}`)
        AlertComplete()
        setUpdete(Math.random)
        setId("")
        SetNameInput("")
        Setposition("")
        Setlevel("")
        Setusername("")
        Setpassword("")
        Setmobile(false)
        SetTimeIn("")
        SetTimeOut("")
        SetSalary(0)
        SetOtRate(0)
        setSignatureUrl("")
        setSignatureOpen(false)
      } catch (error) {
        console.error(error)
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>เกิดข้อผิดพลาด</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 16 }}>ไม่สามารถลบข้อมูลได้</div>,
          duration: 3000,
        });
      }
    }

    // Clear Data
    const Clear = async () => {
      setall1(initialValues)
      setId("")
      SetNameInput("")
      Setposition("")
      Setlevel("")
      Setusername("")
      Setpassword("")
      Setmobile(false)
      SetTimeIn("")
      SetTimeOut("")
      SetSalary(0)
      SetOtRate(0)
      setSignatureUrl("")
      setSignatureOpen(false)
    }

    const fetchEmployeeSignature = async (employeeId: string) => {
      const companyS = localStorage.getItem("company_") || "default"
      try {
        const res = await axios.get(`/api/setting/employee-signature?employeeId=${employeeId}&company=${companyS}`)
        const nextUrl = res.data?.signatureUrl ? `${res.data.signatureUrl}?v=${Date.now()}` : ""
        setSignatureUrl(nextUrl)
      } catch (error) {
        console.error(error)
        setSignatureUrl("")
      }
    }

    const getSignaturePoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget
      const rect = canvas.getBoundingClientRect()
      return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      }
    }

    const prepareSignatureCanvas = () => {
      const canvas = signatureCanvasRef.current
      if (!canvas) return
      const context = canvas.getContext("2d")
      if (!context) return

      canvas.width = 900
      canvas.height = 280
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.lineCap = "round"
      context.lineJoin = "round"
      context.lineWidth = 4
      context.strokeStyle = "#111827"

      if (!signatureUrl) {
        setSignatureHasInk(false)
        return
      }

      const image = new window.Image()
      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        setSignatureHasInk(true)
      }
      image.src = signatureUrl
    }

    useEffect(() => {
      if (!signatureOpen) return
      const timer = window.setTimeout(() => prepareSignatureCanvas(), 40)
      return () => window.clearTimeout(timer)
    }, [signatureOpen, signatureUrl])

    const startSignatureDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault()
      const canvas = event.currentTarget
      canvas.setPointerCapture(event.pointerId)
      signatureDrawingRef.current = true
      lastSignaturePointRef.current = getSignaturePoint(event)
      setSignatureHasInk(true)
    }

    const drawSignature = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!signatureDrawingRef.current || !lastSignaturePointRef.current) return
      event.preventDefault()
      const canvas = event.currentTarget
      const context = canvas.getContext("2d")
      if (!context) return
      const nextPoint = getSignaturePoint(event)
      context.beginPath()
      context.moveTo(lastSignaturePointRef.current.x, lastSignaturePointRef.current.y)
      context.lineTo(nextPoint.x, nextPoint.y)
      context.stroke()
      lastSignaturePointRef.current = nextPoint
    }

    const stopSignatureDraw = () => {
      signatureDrawingRef.current = false
      lastSignaturePointRef.current = null
    }

    const clearSignatureCanvas = () => {
      const canvas = signatureCanvasRef.current
      const context = canvas?.getContext("2d")
      if (!canvas || !context) return
      context.clearRect(0, 0, canvas.width, canvas.height)
      setSignatureHasInk(false)
    }

    const openSignatureModal = () => {
      if (!EmpId) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>กรุณาเลือกพนักงานก่อน</div>, { duration: 2500 })
        return
      }
      setSignatureOpen(true)
    }

    const saveEmployeeSignature = async () => {
      const canvas = signatureCanvasRef.current
      if (!canvas || !EmpId || !signatureHasInk) return
      const companyS = localStorage.getItem("company_") || "default"
      setSignatureSaving(true)
      try {
        const res = await axios.post("/api/setting/employee-signature", {
          employeeId: Number(EmpId),
          company: companyS,
          signatureData: canvas.toDataURL("image/png"),
        })
        const nextUrl = res.data?.signatureUrl ? `${res.data.signatureUrl}?v=${Date.now()}` : ""
        setSignatureUrl(nextUrl)
        setSignatureOpen(false)
        AlertComplete()
      } catch (error) {
        console.error(error)
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ไม่สามารถบันทึกลายเซ็นได้</div>, { duration: 3000 })
      }
      setSignatureSaving(false)
    }

    const deleteEmployeeSignature = async () => {
      if (!EmpId) return
      const companyS = localStorage.getItem("company_") || "default"
      setSignatureSaving(true)
      try {
        await axios.delete(`/api/setting/employee-signature?employeeId=${EmpId}&company=${companyS}`)
        setSignatureUrl("")
        clearSignatureCanvas()
        AlertComplete()
      } catch (error) {
        console.error(error)
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ไม่สามารถลบลายเซ็นได้</div>, { duration: 3000 })
      }
      setSignatureSaving(false)
    }
    //************************************************************* */
    // name   
    const NameInput = (e: any) => {
      setall1({ ...all, name: e.target.value })
      SetNameInput(e.target.value)
      handleInputChange
    }

    // position

    const PositionInput = (e: any) => {
      setall1({ ...all, position: e.target.value })
      Setposition(e.target.value)
      handleInputChange
    }

    // level การมองเห็น

    const LevelInput = (e: any) => {
      setall1({ ...all, level: e.target.value })
      Setlevel(e.target.value)
      handleInputChange
    }

    // username

    const UsernameInput = (e: any) => {
      setall1({ ...all, username: e.target.value })
      Setusername(e.target.value)
      handleInputChange
    }

    // password

    const PasswordInput = (e: any) => {
      setall1({ ...all, password: e.target.value })
      Setpassword(e.target.value)
      setPasswordChanged(true)
      handleInputChange
    }

    // timeIn
    const TimeInInput = (e: any) => {
      setall1({ ...all, timeIn: e.target.value })
      SetTimeIn(e.target.value)
    }

    // timeOut
    const TimeOutInput = (e: any) => {
      setall1({ ...all, timeOut: e.target.value })
      SetTimeOut(e.target.value)
    }

    // salary
    const SalaryInput = (e: any) => {
      setall1({ ...all, salary: e.target.value })
      SetSalary(e.target.value)
    }

    // otRate
    const OtRateInput = (e: any) => {
      setall1({ ...all, otRate: e.target.value })
      SetOtRate(e.target.value)
    }

    // toggle mobile switch in table
    const toggleMobileSwitch = async (id: number, checked: boolean) => {
      try {
        await axios.put(`/api/${getemployee}/${id}`, {
          mobile: checked
        })
        // Update local state
        setPostsEmp(postsEmp.map((emp: any) => 
          emp.id === id ? { ...emp, mobile: checked } : emp
        ))
        AlertComplete()
      } catch (error) {
        console.error(error)
      }
    }

    const position = [
      { posi: "เลือกตำแหน่ง" },
      { posi: "เจ้าของกิจการ" },
      { posi: "เภสัชกรประจำร้าน" },
      { posi: "เภสัชกร Parttime" },
      { posi: "ผู้ช่วยเภสัชกร" },
       { posi: "พนักงาน" },

    ]

    const level = [
      { posi: "เลือกสิทธิ์การมองเห็น" },
      { posi: "level1" },
      { posi: "level2" }

    ]

    return (
      <><div className='col-5'>



        <div className="row justify-content-between mb-2" >
          <div className="col-4">
            <div className='mt-2 mb-2' style={{ fontFamily: "kanit", fontSize: 15, width: 100 }}>ตั้งค่า พนักงาน</div>
          </div>
          <div className="col-auto">
            <div className='d-flex flex-wrap justify-content-end' style={{ gap: 6 }}>
              <button
                type="button"
                className={EmpId === "" ? "btn btn-success" : "btn btn-warning"}
                onClick={() => EmpId === "" ? Save() : Edit()}
                style={{ fontFamily: "kanit", fontSize: 14 }}>
                {EmpId === "" ? "บันทีก" : "แก้ไข"}
              </button>
              <button
                type="button"
                className="btn btn-outline-dark"
                disabled={!EmpId}
                onClick={openSignatureModal}
                title="ลายเซ็นอิเล็กทรอนิกส์"
                style={{ fontFamily: "kanit", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Signature size={14} />
                ลายเซ็น
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => Clear()}
                style={{ fontFamily: "kanit", fontSize: 14 }}>
                เพิ่มใหม่
              </button>
            </div>
          </div>

        </div>

        <div className="input-group">
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>ชื่อพนักงาน</span>
          <input
            type="text"
            className="form-control"
            placeholder=""
            aria-label="Username"
            aria-describedby="visible-addon"
            value={nameinputS}
            onChange={NameInput}
            style={{ fontFamily: "kanit", fontSize: 15 }} />
        </div>


        <div className="input-group mt-2">
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>ตำแหน่ง</span>
          <select className="form-select" id="inputGroup" onChange={PositionInput} style={{ fontFamily: "kanit", fontSize: 12 }} value={positionS !== undefined ? positionS : "เลือกตำแหน่ง"}>
            {position.length > 0 &&
              position.map((option: any, index: any) =>
                <option
                  value={option.value}
                  //  disabled={positionS==="เจ้าของกิจการ"? true : false}
                  key={index}
                  selected={option.selected}
                  style={{ fontFamily: "kanit", fontSize: 12 }} >
                  {option.posi}
                </option>
              )}
          </select>

        </div>

        <div className="input-group mt-2">

          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>การมองเห็น</span>
          <select className="form-select" id="inputGroup" onChange={LevelInput} style={{ fontFamily: "kanit", fontSize: 12 }} value={levelS !== undefined ? levelS : "เลือกสิทธิ์การมองเห็น"}>
            {level.length > 0 &&
              level.map((option: any, index: any) =>
                <option
                  value={option.value}
                  disabled={levelS === "เลือกสิทธิ์การมองเห็น" ? true : false}
                  key={index}
                  selected={option.selected}
                  style={{ fontFamily: "kanit", fontSize: 12 }} >
                  {option.posi}
                </option>
              )}
          </select>

        </div>
        <div style={{ fontFamily: "kanit", fontSize: 11, color: "red", marginTop: 2 }}>Level1  : สามารถมองเห็นบางส่วน ขึ้นอยู่การตั้งค่าการมองเห็น || level2  มองเห็นทั้งหมด </div>
        <div className="input-group mt-2">
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>Username</span>
          <input
            type="text"
            className="form-control"
            // disabled={positionS==="เจ้าของกิจการ"?true:false}
            placeholder=""
            aria-label="Username"
            aria-describedby="visible-addon"
            value={usernameS}
            onChange={UsernameInput}
            style={{ fontFamily: "kanit", fontSize: 15 }} />
        </div>

        <div className="input-group mt-2">
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>Password</span>
          <div className="position-relative" style={{ flex: "1 1 auto" }}>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder=""
              aria-label="Password"
              aria-describedby="visible-addon"
              value={passwordS}
              onChange={PasswordInput}
              style={{ fontFamily: "kanit", fontSize: 15, paddingRight: "40px", height: "100%" }} />
            <button
              type="button"
              className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none"
              style={{ zIndex: 5, padding: "0.375rem 0.75rem", color: "GrayText" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          <span className="input-group-text" style={{ fontFamily: "kanit", fontSize: 12, color: "GrayText" }}>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="mobileSwitch"
                checked={mobileS}
                onChange={(e) => {
                  Setmobile(e.target.checked)
                  setall1({ ...all, mobile: e.target.checked })
                }}
              />
              <label className="form-check-label ms-1" htmlFor="mobileSwitch" style={{ fontSize: 11 }}>Mobile</label>
            </div>
          </span>
        </div>

        <div className="d-flex gap-2 mt-2">
          <div className="input-group" style={{ flex: 1 }}>
            <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, color: "GrayText" }}>เวลาเข้างาน</span>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น 08:00"
              maxLength={5}
              value={timeInS}
              onChange={(e) => {
                let v = e.target.value.replace(/[^0-9:]/g, "")
                if (v.length === 2 && !v.includes(":") && timeInS.length < v.length) v += ":"
                if (v.length > 5) v = v.slice(0, 5)
                SetTimeIn(v)
                setall1({ ...all, timeIn: v })
              }}
              style={{ fontFamily: "kanit", fontSize: 15 }} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, color: "GrayText" }}>เวลาออกงาน</span>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น 17:00"
              maxLength={5}
              value={timeOutS}
              onChange={(e) => {
                let v = e.target.value.replace(/[^0-9:]/g, "")
                if (v.length === 2 && !v.includes(":") && timeOutS.length < v.length) v += ":"
                if (v.length > 5) v = v.slice(0, 5)
                SetTimeOut(v)
                setall1({ ...all, timeOut: v })
              }}
              style={{ fontFamily: "kanit", fontSize: 15 }} />
          </div>
        </div>

        <div className="d-flex gap-2 mt-2">
          <div className="input-group" style={{ flex: 1 }}>
            <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, color: "GrayText" }}>เงินเดือน</span>
            <input
              type="number"
              className="form-control"
              placeholder="0"
              value={salaryS || ""}
              onChange={SalaryInput}
              style={{ fontFamily: "kanit", fontSize: 15 }} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, color: "GrayText" }}>ค่า OT/ชม.</span>
            <input
              type="number"
              className="form-control"
              placeholder="0"
              value={otRateS || ""}
              onChange={OtRateInput}
              style={{ fontFamily: "kanit", fontSize: 15 }} />
          </div>
        </div>

        <div
          className="mt-2"
          style={{
            border: "1px solid #dbe4ef",
            borderRadius: 10,
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            padding: 10,
            display: "grid",
            gridTemplateColumns: "1fr 150px auto",
            gap: 10,
            alignItems: "center",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#F3F8FC", color: "#1E5088", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #CCDFF1" }}>
              <Signature size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#0f172a" }}>ลายเซ็นอิเล็กทรอนิกส์</div>
              <div style={{ fontFamily: "kanit", fontSize: 11, color: EmpId ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {EmpId ? (nameinputS || usernameS || "พนักงานที่เลือก") : "ยังไม่ได้เลือกพนักงาน"}
              </div>
            </div>
          </div>
          <div style={{ height: 50, border: "1px dashed #cbd5e1", borderRadius: 8, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {signatureUrl ? (
              <img src={signatureUrl} alt="ลายเซ็นอิเล็กทรอนิกส์" style={{ maxWidth: "100%", maxHeight: 44, objectFit: "contain" }} />
            ) : (
              <span style={{ fontFamily: "kanit", fontSize: 11, color: "#94a3b8" }}>ยังไม่มีลายเซ็น</span>
            )}
          </div>
          <button
            type="button"
            className={signatureUrl ? "btn btn-outline-success" : "btn btn-success"}
            disabled={!EmpId}
            onClick={openSignatureModal}
            style={{ fontFamily: "kanit", fontSize: 12, minWidth: 118, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Signature size={14} />
            {signatureUrl ? "แก้ไขลายเซ็น" : "สร้างลายเซ็น"}
          </button>
        </div>

        <div className='mt-2'>
          <table className="table table-hover">
            <thead>
              <tr>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ชื่อพนักงาน</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ตำแหน่ง</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>Level</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>Username</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>Mobile</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>เข้างาน</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ออกงาน</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>เงินเดือน</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>OT/ชม.</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {postsEmp.map((n: any) =>
                <tr key={n.id} onClick={() => { setId(n.id) }} style={{ cursor: "pointer" }}>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.name}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.position}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.level}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.username}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={!!n.mobile}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleMobileSwitch(n.id, e.target.checked);
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.timeIn || "-"}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.timeOut || "-"}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.salary ? Number(n.salary).toLocaleString() : "-"}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.otRate ? Number(n.otRate).toLocaleString() : "-"}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>
                    <button
                      type='button'
                      className="btn btn-sm btn-outline-danger"
                      style={{
                        fontFamily: "kanit",
                        fontSize: 10,
                        padding: "2px 8px",
                        outline: "none",
                        boxShadow: "none"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        Delete(Number(n.id));
                      }}>
                      ลบ
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


      </div>

      {signatureOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{ width: 700, maxWidth: "96vw", background: "#ffffff", borderRadius: 14, boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#F3F8FC", color: "#1E5088", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #CCDFF1" }}>
                  <Signature size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 17, color: "#0f172a" }}>ลายเซ็นอิเล็กทรอนิกส์</div>
                  <div style={{ fontFamily: "kanit", fontSize: 12, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nameinputS || usernameS || "พนักงาน"}</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={() => setSignatureOpen(false)}
                style={{ fontFamily: "kanit", fontSize: 12 }}
              >
                ปิด
              </button>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, background: "#ffffff", padding: 10, boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.02)" }}>
                <canvas
                  ref={signatureCanvasRef}
                  onPointerDown={startSignatureDraw}
                  onPointerMove={drawSignature}
                  onPointerUp={stopSignatureDraw}
                  onPointerCancel={stopSignatureDraw}
                  onPointerLeave={stopSignatureDraw}
                  style={{ width: "100%", height: 220, display: "block", background: "linear-gradient(#ffffff, #ffffff) padding-box, repeating-linear-gradient(0deg, transparent, transparent 35px, #f1f5f9 36px) border-box", borderRadius: 8, cursor: "crosshair", touchAction: "none" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={clearSignatureCanvas}
                    disabled={signatureSaving}
                    style={{ fontFamily: "kanit", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Eraser size={14} />
                    ล้าง
                  </button>
                  {signatureUrl && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={deleteEmployeeSignature}
                      disabled={signatureSaving}
                      style={{ fontFamily: "kanit", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Trash2 size={14} />
                      ลบลายเซ็น
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSignatureOpen(false)}
                    disabled={signatureSaving}
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={saveEmployeeSignature}
                    disabled={signatureSaving || !signatureHasInk}
                    style={{ fontFamily: "kanit", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, minWidth: 116, justifyContent: "center" }}
                  >
                    <SaveIcon size={14} />
                    {signatureSaving ? "กำลังบันทึก" : "บันทึกลายเซ็น"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Employee Permission Panel ===== */}
      {EmpId && EmpId !== "" && (
        <div className='col-7' style={{ fontFamily: "kanit" }}>
          <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
            <div style={{ fontSize: 15, fontWeight: 500 }}>
              สิทธิ์รายบุคคล: <span style={{ color: "#2A6AAA" }}>{nameinputS}</span>
            </div>
            <div className="d-flex gap-2">
              {empPerms.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  style={{ fontFamily: "kanit", fontSize: 12 }}
                  onClick={resetEmpPerms}
                >
                  รีเซ็ต (ใช้ค่าเริ่มต้น)
                </button>
              )}
            </div>
          </div>

          {empPermLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-success" role="status" />
              <span className="ms-2" style={{ fontSize: 13, color: "#6b7280" }}>กำลังโหลด...</span>
            </div>
          ) : empLevelData.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af" }}>ยังไม่มีข้อมูลการมองเห็น กรุณาตั้งค่าที่แท็บ "การมองเห็น" ก่อน</div>
          ) : (
            <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: 4 }}>
              {Object.entries(groupedLevel).map(([mainName, items]: [string, any]) => (
                <div key={mainName} className="mb-3">
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: "#374151",
                    borderBottom: "1px solid #e5e7eb", paddingBottom: 4, marginBottom: 6
                  }}>
                    {mainName}
                  </div>
                  {items.map((item: any) => {
                    const effective = getEffective(item.codename)
                    const overridden = hasOverride(item.codename)
                    const isSaving = empPermSaving === item.codename
                    const isMobileStockAdjustPerm = item.codename === "P8"
                    return (
                      <div key={item.codename} className="d-flex align-items-center justify-content-between py-1 px-2"
                        style={{
                          borderRadius: isMobileStockAdjustPerm ? 10 : 6,
                          backgroundColor: overridden ? "#F3F8FC" : isMobileStockAdjustPerm ? "#f8fffb" : "transparent",
                          border: isMobileStockAdjustPerm ? "1px solid #CCDFF1" : "1px solid transparent",
                          boxShadow: isMobileStockAdjustPerm ? "0 1px 3px rgba(15, 23, 42, 0.05)" : "none",
                          marginBottom: isMobileStockAdjustPerm ? 6 : 2,
                          paddingTop: isMobileStockAdjustPerm ? 8 : undefined,
                          paddingBottom: isMobileStockAdjustPerm ? 8 : undefined
                        }}>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 28 }}>{item.codename}</span>
                          {isMobileStockAdjustPerm && <RefreshCw size={13} color="#2A6AAA" />}
                          <span style={{ fontSize: 13, color: "#374151" }}>{item.list}</span>
                          {isMobileStockAdjustPerm && (
                            <span style={{
                              fontSize: 10, color: "#173F6B", backgroundColor: "#E5EEF8",
                              border: "1px solid #A6C8E7", padding: "1px 7px", borderRadius: 999,
                              fontWeight: 600, whiteSpace: "nowrap"
                            }}>Diff มือถือ</span>
                          )}
                          {overridden && (
                            <span style={{
                              fontSize: 10, color: "#2A6AAA", backgroundColor: "#F3F8FC",
                              padding: "1px 6px", borderRadius: 4, fontWeight: 500
                            }}>กำหนดเอง</span>
                          )}
                        </div>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={effective}
                            disabled={isSaving}
                            onChange={() => toggleEmpPerm(item.codename, effective)}
                            style={{ cursor: isSaving ? "wait" : "pointer" }}
                          />
                          <label className="form-check-label" style={{
                            fontSize: 11,
                            color: effective ? "#147F56" : "#ef4444",
                            minWidth: 24
                          }}>
                            {effective ? "เปิด" : "ปิด"}
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </>

    )

  }

  // ตั้งค่ารูปแบบฉลากยา
  const SetLabelPage = () => {

    /***************************************************** */
    const [storeS, SetStore] = useState("")
    const [addressS, SetAddress] = useState("")
    const [telS, SetTel] = useState("")
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [uploadedUrl1, setUploadedUrl1] = useState<string | null>(null);
    // Cache-buster: logo/line files are saved with a fixed name per company (logo_{company}.jpg),
    // so the URL string never changes after a re-upload and the browser serves the old cached image.
    const [imgVersion, setImgVersion] = useState(() => Date.now())
    //******************Get Store************************************ */
    const fetchPostStore = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getstore}?company=${companyS}`)  //Get_Employee
        res.data[0] == undefined ? "" : SetId(res.data[0].id)
        res.data[0] == undefined ? "" : Setcompany(res.data[0].company)
        res.data[0] == undefined ? "" : SetStore(res.data[0].namestore)
        res.data[0] == undefined ? "" : SetAddress(res.data[0].address)
        res.data[0] == undefined ? "" : SetTel(res.data[0].tel)
        res.data[0] == undefined ? "" : setUploadedUrl(res.data[0].publiclogo)
        res.data[0] == undefined ? "" : setUploadedUrl1(res.data[0].publicline)
        setImgVersion(Date.now())

      } catch (error) {
        console.error(error)
      }

    }

    useEffect(() => {
      fetchPostStore()
    }, []);

    /******************************************************* */


    const [randoms, setUpdete] = useState(0)

    const [idS, SetId] = useState("")
    const [compa, Setcompany] = useState("")
    const [allS, Setall] = useState(false)
    const [logoS, Setlogo] = useState(true);
    const [lineS, Setline] = useState(true)


    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getlabel}?company=${companyS}`)  //Get_Employee
        res.data[0] == undefined ? "" : SetId(res.data[0].id)
        res.data[0] == undefined ? "" : Setcompany(res.data[0].company)
        res.data[0] == undefined ? Setall(false) : Setall(res.data[0].all === "true" ? true : false)
        res.data[0] == undefined ? Setlogo(true) : Setlogo(res.data[0].logo === "true" ? true : false)
        res.data[0] == undefined ? Setline(true) : Setline(res.data[0].line === "true" ? true : false)

        setTimeout(async () => {
          await res.data[0] == undefined ? Save() : ""
        }, 500);
      } catch (error) {
        console.error(error)
      }

    }

    useEffect(() => {
      fetchPosts()

    }, []);


    // Post Data
    const Save = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const company = companyS
      const all = String(allS)
      const logo = String(logoS)
      const line = String(lineS)

      try {
        const res = await axios.post(`/api/${getlabel}`,
          {
            company, all, logo, line
          }
        )
        // Keep the new record id so a later Edit() updates instead of hitting id=0
        if (res?.data?.id != null) SetId(res.data.id)
        AlertComplete()
      } catch (error) {
        console.error(error)
      }

    }

    // Edit Data
    const Edit = async () => {
      // No saved record yet: create one instead of PUT /.../0 (which 500s)
      if (!idS) {
        await Save()
        setUpdete(Math.random)
        return
      }
      const all = String(allS)
      const logo = String(logoS)
      const line = String(lineS)
      try {
        await axios.put(`/api/${getlabel}/${Number(idS)}`,
          {
            all, logo, line
          }
        )
        AlertComplete()
      } catch (error) {
        console.error(error)
      }
      setUpdete(Math.random)
    }

    // Status All
    const toggleSwitchall = () => {
      Setall(!allS)
      !allS === true ? Setline(false) : Setline(true)
      !allS === true ? Setlogo(false) : Setlogo(true)
    };

    // Status line
    const toggleSwitchline = () => {
      Setline(!lineS)
      !lineS === true ? Setall(false) : Setall(false)
    };

    // Status logo
    const toggleSwitchlogo = () => {
      Setlogo(!logoS)
      !logoS === true ? Setall(false) : Setall(false)
    };

    return (

      <div className='row' style={{ width: "100%", gap: 18, alignItems: "flex-start" }}>
      <div className='col-5'>
        <div className="row justify-content-between mb-2">
          <div className="col-8 ">
            <div className="row justify-content-between mb-2">
              <div className="col-4">
                <div className='mt-2 mb-2' style={{ fontFamily: "kanit", fontSize: 15, width: 100 }}>ตั้งค่า ฉลากสินค้า</div>
              </div>
              <div className="col col-lg-3">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => Edit()}
                  style={{ fontFamily: "kanit", fontSize: 15 }}>
                  บันทีก
                </button>
              </div>
            </div>
            <div className='rounded border border-2 shadow shadow-sm' style={{ height: "32vh", backgroundColor: "white" }}>
              <div className='row'>
                <div className='row' style={{ height: 60 }}>
                  {allS === false ?
                    <div className='row' >
                      {logoS === true ?
                        <div className='col-2 '>
                          <div style={{ height: "7vh", width: "3vw", marginTop: 5, justifyItems: "center", marginLeft: 5 }}>
                            <img alt={""} src={uploadedUrl ? `${uploadedUrl}?v=${imgVersion}` : "/placeholder.png"} width={55} height={50} />

                          </div>
                        </div>
                        : ""}
                      <div className={logoS === true ? 'col-8' : 'col-9'} style={{ marginLeft: logoS === true ? 10 : 35 }}>
                        <div className='row'>
                          <div className='col-8' style={{ fontFamily: "kanit_B", fontSize: 17, textAlign: "start", width: "100%" }}>{storeS}</div>

                        </div>
                        <div style={{ fontFamily: "kanit", fontSize: 9, width: "100%" }}>{addressS}{" โทร : "}  {telS}</div>
                        <div className='row rounded border border shadow shadow mb-2' style={{ fontFamily: "kanit", fontSize: 10, backgroundColor: "black" }}></div>
                      </div>
                      {lineS === true ?
                        <div className='col-1 mt-1'>
                          <div style={{ height: "auto", margin: "0 auto", maxWidth: 45, width: 45, marginLeft: 10 }}>
                            <img alt={""} src={uploadedUrl1 ? `${uploadedUrl1}?v=${imgVersion}` : "/placeholder.png"} width={60} height={60} />
                            <div style={{ fontFamily: "kanit", fontSize: 8, textAlign: "center" }}>Line ร้านค้า</div>
                          </div>
                        </div> : ""}
                    </div> : ""}
                </div>
                <div>
                  {allS === true ? <div className='row rounded border border shadow shadow ' style={{ marginLeft: 8, fontFamily: "kanit", fontSize: 10, backgroundColor: "black", width: "95%" }}></div> : ""}
                  <div className='row mt-1'>

                    <div className='col-auto me-auto ' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "start", marginLeft: 15 }}>ลูกค้าทั่วไป</div>
                    <div className='col-auto' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", marginRight: 10 }}>26/09/2025</div>
                  </div>

                  <div className='row' style={{ height: "20vh" }}>
                    <div className='col-9 me-auto'>
                      <div className='row' style={{ fontFamily: "kanit", fontSize: 15, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>ชื่อสินค้า</div>
                      <div className='row' style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>ลดไข้ บรรเทาอาการปวด</div>
                      <div className='d-flex mt-1'>
                        <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>รับประทานครั้งละ....เม็ด&nbsp;&nbsp;&nbsp;&nbsp;หลังอาหาร</div>
                      </div>
                      <div className='d-flex'>
                        <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>เช้า-กลางวัน-เย็น&nbsp;&nbsp;&nbsp;&nbsp;เก็บไว้ในอูณหภูมิห้อง</div>
                      </div>
                      <div className='row  mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 15, width: "19vw" }}>หมายเหตุ.............</div>
                      <div className='row' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>ชื่อเภสัชกร.............</div>
                    </div>

                    <div className='col align-self-end' style={{ marginRight: 10 }}>

                      <div style={{ height: "auto", margin: "0 auto", maxWidth: 50, width: "100%" }}>


                        <QRCode
                          size={256}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          value={"duis"}
                          viewBox={`0 0 256 256`}
                        />
                        <div style={{ fontFamily: "kanit", fontSize: 8, textAlign: "center", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>QR สินค้า</div>

                      </div>

                    </div>


                  </div>
                </div>



              </div>
            </div>
            <div className='  mt-2' style={{ height: "43vh", backgroundColor: "white" }}>
              <div className='row mt-3'>
                {/**แสดง Logo */}
                <div className='col-auto me-auto '>
                  <div className='d-flex'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-credit-card-2-front col-auto ml-2" viewBox="0 0 16 16">
                      <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                      <path d="M2 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5" />
                    </svg>
                    <div className='ml-2' style={{ fontFamily: "kanit", fontSize: 13 }}>แสดงโลโก้ร้าน</div>
                  </div>
                </div>
                <div className="form-check form-switch col-auto">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="flexSwitchCheckDefault"
                    checked={logoS}
                    onChange={toggleSwitchlogo}
                  />
                </div>
              </div>

              {/**แสดง QR-code ร้าน  */}
              <div className='row mt-1'>
                <div className='col-auto me-auto '>
                  <div className='d-flex'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-credit-card-2-front col-auto ml-2" viewBox="0 0 16 16" >
                      <path d="M2 2h2v2H2z" />
                      <path d="M6 0v6H0V0zM5 1H1v4h4zM4 12H2v2h2z" />
                      <path d="M6 10v6H0v-6zm-5 1v4h4v-4zm11-9h2v2h-2z" />
                      <path d="M10 0v6h6V0zm5 1v4h-4V1zM8 1V0h1v2H8v2H7V1zm0 5V4h1v2zM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8zm0 0v1H2V8H1v1H0V7h3v1zm10 1h-1V7h1zm-1 0h-1v2h2v-1h-1zm-4 0h2v1h-1v1h-1zm2 3v-1h-1v1h-1v1H9v1h3v-2zm0 0h3v1h-2v1h-1zm-4-1v1h1v-2H7v1z" />
                      <path d="M7 12h1v3h4v1H7zm9 2v2h-3v-1h2v-1z" />
                    </svg>
                    <div className='ml-2' style={{ fontFamily: "kanit", fontSize: 13 }}>แสดง QR-code ร้าน</div>
                  </div>
                </div>
                <div className="form-check form-switch col-auto">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="flexSwitchCheckDefault"
                    checked={lineS}
                    onChange={toggleSwitchline}
                  />
                </div>
              </div>


              {/**แสดงหัว ฉลาก */}
              <div className='row mt-1'>
                <div className='col-auto me-auto '>
                  <div className='d-flex'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-credit-card-2-front col-auto ml-2" viewBox="0 0 16 16" >
                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
                      <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                    </svg>
                    <div className='ml-2' style={{ fontFamily: "kanit", fontSize: 13 }}>ปิดหัว ฉลากสินค้าทั้งหมด</div>
                  </div>
                </div>
                <div className="form-check form-switch col-auto">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="flexSwitchCheckDefault"
                    checked={allS}
                    onChange={toggleSwitchall}
                  />
                </div>
              </div>

            </div>


          </div>


        </div>
      </div>

      </div>

    )

  }

  // ตั้งค่าแต้มสะสม
  const PointPage = () => {

    const initialValues = {
      id: "",
      company: "",
      sale: "",
      pointeq: "",
      pointset: "",
      discount: "",
      status: "",
      memberDiscountPercent: "2",
      memberDiscountEnabled: false

    };

    const [all, setall1] = useState(initialValues)
    const [postsEmp, setPostsEmp] = useState([])
    const [getId, setgetId] = useState([])
    const [EmpId, setId] = useState("")

    const [SaleS, SetSaleInput] = useState("")
    const [pointeqS, SetPoint] = useState("")
    const [pointsetS, SetPointSet] = useState("")
    const [discountS, SetDiscount] = useState("")
    const [statusS, SetStatus] = useState("")
    const [memberDiscountPercentS, SetMemberDiscountPercent] = useState("2")
    const [memberDiscountEnabledS, SetMemberDiscountEnabled] = useState(false)

    const [randoms, setUpdete] = useState(0)

    const [isActive, setIsActive] = useState(Boolean(statusS));

    const clampMemberDiscountPercent = (value: unknown) => {
      const numericValue = Number(value ?? 2)
      if (!Number.isFinite(numericValue)) return 2
      return Math.min(100, Math.max(0, numericValue))
    }

    const handleInputChange = (e: any) => {
      const { name, value } = e.target;

      setall1({
        ...all,
        [name]: value,
      });

    };
    useEffect(() => {
      const fetchPosts = async () => {
        let companyS = (localStorage.getItem("company_") || "")
        try {
          const res = await axios.get(`/api/${getpoint}?company=${companyS}`)  //Get_Employee
          setPostsEmp(res.data)
          const pointSetting = res.data[0]
          if (pointSetting !== undefined) {
            setall1({ ...initialValues, ...pointSetting })
            setId(pointSetting.id)
            SetSaleInput(pointSetting.sale)
            SetPoint(pointSetting.pointeq)
            SetPointSet(pointSetting.pointset)
            SetDiscount(pointSetting.discount)
            SetStatus(pointSetting.status)
            setIsActive(pointSetting.status === "true" ? true : false)
            SetMemberDiscountPercent(String(pointSetting.memberDiscountPercent ?? 2))
            SetMemberDiscountEnabled(pointSetting.memberDiscountEnabled ?? false)
          }

        } catch (error) {
          console.error(error)
        }

      }
      fetchPosts()

    }, [randoms]);


    // Post Data
    const Save = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const company = companyS
      const sale = Number(all.sale)
      const pointeq = Number(all.pointeq)
      const pointset = Number(all.pointset)
      const discount = Number(all.discount)
      const status = String(statusS)
      const memberDiscountPercent = clampMemberDiscountPercent(memberDiscountPercentS)
      const memberDiscountEnabled = memberDiscountEnabledS
      try {
        await axios.post(`/api/${getpoint}`,
          {
            company, sale, pointeq, pointset, discount, status, memberDiscountPercent, memberDiscountEnabled
          }
        )
        AlertComplete()
      } catch (error) {
        console.error(error)
      }
      setUpdete(Math.random)
    }

    // Edit Data
    const Edit = async () => {
      const sale = Number(SaleS)
      const pointeq = Number(pointeqS)
      const pointset = Number(pointsetS)
      const discount = Number(discountS)
      const status = String(statusS)
      const memberDiscountPercent = clampMemberDiscountPercent(memberDiscountPercentS)
      const memberDiscountEnabled = memberDiscountEnabledS
      try {
        await axios.put(`/api/${getpoint}/${Number(postsEmp.map((a: any) => a.id)[0])}`,
          {
            sale, pointeq, pointset, discount, status, memberDiscountPercent, memberDiscountEnabled
          }
        )
        AlertComplete()
      } catch (error) {
        console.error(error)
      }
      setUpdete(Math.random)
    }

    // Sale   
    const SaleInput = (e: any) => {
      setall1({ ...all, sale: e.target.value })
      SetSaleInput(e.target.value)
      handleInputChange
    }

    // point 
    const PointInput = (e: any) => {
      setall1({ ...all, pointeq: e.target.value })
      SetPoint(e.target.value)
      handleInputChange
    }

    // pointset
    const PointSetInput = (e: any) => {
      setall1({ ...all, pointset: e.target.value })
      SetPointSet(e.target.value)
      handleInputChange
    }

    // discount
    const DiscountInput = (e: any) => {
      setall1({ ...all, discount: e.target.value })
      SetDiscount(e.target.value)
      handleInputChange
    }

    const MemberDiscountInput = (e: any) => {
      setall1({ ...all, memberDiscountPercent: e.target.value })
      SetMemberDiscountPercent(e.target.value)
      handleInputChange
    }

    // Status

    const toggleSwitch = () => {

      SetStatus(String(!isActive)),
        setall1({ ...all, status: String(!isActive) }),
        setIsActive(!isActive)
    };

    const toggleMemberDiscount = () => {
      const nextStatus = !memberDiscountEnabledS
      SetMemberDiscountEnabled(nextStatus)
      setall1({ ...all, memberDiscountEnabled: nextStatus })
    };






    return (

      <div className='row' style={{ width: "100%", gap: 18, alignItems: "flex-start" }}>
      <div className='col-5'>



        <div className="row justify-content-between mb-2">
          <div className="col-4">
            <div className='mt-2 mb-2' style={{ fontFamily: "kanit", fontSize: 15, width: 100 }}>ตั้งค่า แต้มสะสม</div>
          </div>
          <div className="col col-lg-2">
            <button
              type="button"
              className={EmpId === "" ? "btn btn-success" : "btn btn-warning"}
              onClick={() => EmpId === "" ? Save() : Edit()}
              style={{ fontFamily: "kanit", fontSize: 14 }}>
              {EmpId === "" ? "บันทีก" : "แก้ไข"}
            </button>
          </div>
        </div>

        <div className="input-group" style={{ width: 250 }}>
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>ซื้อครบ</span>
          <input
            type="number"
            className="form-control"
            placeholder=""
            aria-label="Username"
            aria-describedby="visible-addon"
            value={SaleS}
            onChange={SaleInput}
            style={{ fontFamily: "kanit", fontSize: 15, textAlign: "center" }} />
          <span className="input-group-text" id="basic-addon2" style={{ fontFamily: "kanit", fontSize: 12 }}>บาท</span>
        </div>

        <div className="input-group" style={{ width: 250, marginTop: 5 }}>
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>คิดเป็นแต้ม</span>
          <input
            type="number"
            className="form-control"
            placeholder=""
            aria-label="Username"
            aria-describedby="visible-addon"
            value={pointeqS}
            onChange={PointInput}
            style={{ fontFamily: "kanit", fontSize: 15, textAlign: "center" }} />
          <span className="input-group-text" id="basic-addon2" style={{ fontFamily: "kanit", fontSize: 12 }}>แต้ม</span>
        </div>

        <div className="input-group" style={{ width: 250, marginTop: 20 }}>
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>แต้ม</span>
          <input
            type="number"
            className="form-control"
            placeholder=""
            aria-label="Username"
            aria-describedby="visible-addon"
            value={pointsetS}
            onChange={PointSetInput}
            style={{ fontFamily: "kanit", fontSize: 15, textAlign: "center" }} />
          <span className="input-group-text" id="basic-addon2" style={{ fontFamily: "kanit", fontSize: 12 }}>แต้ม</span>
        </div>

        <div className="input-group" style={{ width: 250, marginTop: 5 }}>
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>คิดเป็นส่วนลด</span>
          <input
            type="number"
            className="form-control"
            placeholder=""
            aria-label="Username"
            aria-describedby="visible-addon"
            value={discountS}
            onChange={DiscountInput}
            style={{ fontFamily: "kanit", fontSize: 15, textAlign: "center" }} />
          <span className="input-group-text" id="basic-addon2" style={{ fontFamily: "kanit", fontSize: 12 }}>บาท</span>
        </div>


        <div className='  mt-2' style={{ height: "43vh", backgroundColor: "white" }}>
          <div className='row mt-3'>
            {/**แสดง Logo */}
            <div className='col-auto me-auto '>
              <div className='d-flex'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-credit-card-2-front col-auto ml-2" viewBox="0 0 16 16">
                  <path d="M9.669.864 8 0 6.331.864l-1.858.282-.842 1.68-1.337 1.32L2.6 6l-.306 1.854 1.337 1.32.842 1.68 1.858.282L8 12l1.669-.864 1.858-.282.842-1.68 1.337-1.32L13.4 6l.306-1.854-1.337-1.32-.842-1.68zm1.196 1.193.684 1.365 1.086 1.072L12.387 6l.248 1.506-1.086 1.072-.684 1.365-1.51.229L8 10.874l-1.355-.702-1.51-.229-.684-1.365-1.086-1.072L3.614 6l-.25-1.506 1.087-1.072.684-1.365 1.51-.229L8 1.126l1.356.702z" />
                  <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1z" />
                </svg>
                <div className='ml-2' style={{ fontFamily: "kanit", fontSize: 13 }}>เปิดการใช้งาน แต้มสะสม</div>
              </div>
            </div>
            <div className="form-check form-switch col-auto">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="flexSwitchCheckDefault"
                checked={isActive}
                onChange={toggleSwitch}

              />
            </div>
          </div>



        </div>
      </div>

      <div className='col' style={{ maxWidth: 560 }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dbe7f3",
            borderRadius: 8,
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
            marginTop: 33,
            fontFamily: "Kanit",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 14px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#2A6AAA", boxShadow: "0 0 0 3px rgba(42, 106, 170, 0.12)" }} />
              <span style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a" }}>ตั้งค่าส่วนลดสมาชิก</span>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 24,
                padding: "2px 10px",
                borderRadius: 999,
                border: memberDiscountEnabledS ? "1px solid #A6C8E7" : "1px solid #cbd5e1",
                backgroundColor: memberDiscountEnabledS ? "#E5EEF8" : "#f1f5f9",
                color: memberDiscountEnabledS ? "#1E5088" : "#64748b",
                fontFamily: "Kanit_B",
                fontSize: 11,
                whiteSpace: "nowrap",
              }}
            >
              {memberDiscountEnabledS ? `เปิดใช้ ${clampMemberDiscountPercent(memberDiscountPercentS)}%` : "ปิดใช้งาน"}
            </span>
          </div>

          <div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <div style={{ color: "#475569", fontSize: 12 }}>ส่วนลดสมาชิก</div>
              <div className="input-group" style={{ width: 180 }}>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="100"
                  step="0.01"
                  value={memberDiscountPercentS}
                  onChange={MemberDiscountInput}
                  style={{ fontFamily: "Kanit_B", fontSize: 18, textAlign: "center", color: "#1E5088" }}
                />
                <span className="input-group-text" style={{ fontFamily: "Kanit", fontSize: 12 }}>%</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, alignItems: "center" }}>
              <div style={{ color: "#475569", fontSize: 12 }}>เปิดใช้งานส่วนลด</div>
              <div className="form-check form-switch" style={{ margin: 0 }}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="memberDiscountSwitch"
                  checked={memberDiscountEnabledS}
                  onChange={toggleMemberDiscount}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 8,
                marginTop: 16,
              }}
            >
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 10px", backgroundColor: "#f8fafc" }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>ค่าเริ่มต้น</div>
                <div style={{ fontFamily: "Kanit_B", fontSize: 17, color: "#0f172a" }}>2%</div>
              </div>
              <div style={{ border: "1px solid #CCDFF1", borderRadius: 7, padding: "8px 10px", backgroundColor: "#F3F8FC" }}>
                <div style={{ fontSize: 10, color: "#1E5088" }}>ค่าส่วนลดปัจจุบัน</div>
                <div style={{ fontFamily: "Kanit_B", fontSize: 17, color: "#1E5088" }}>{clampMemberDiscountPercent(memberDiscountPercentS)}%</div>
              </div>
              <div style={{ border: "1px solid #CCDFF1", borderRadius: 7, padding: "8px 10px", backgroundColor: "#F3F8FC" }}>
                <div style={{ fontSize: 10, color: "#1E5088" }}>ทำงานเมื่อ</div>
                <div style={{ fontFamily: "Kanit_B", fontSize: 13, color: "#1E5088", whiteSpace: "nowrap" }}>เลือกลูกค้า</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

    )

  }

  // ตั้งค่า QR Payment
  const QRPaymentPage = () => {

    const inputValue = (value: unknown) => value == null ? "" : String(value)

    //company,bank,name,bookbankno,promtpayno,publicId
    const [EmpId, SetId] = useState("")

    const [compa, Setcompany] = useState("")
    const [bankS, SetbankS] = useState("")
    const [nameS, SetnameS] = useState("")
    const [bookbanknoS, SetbookbanknoS] = useState("")
    const [promtpaynoS, SetpromtpaynoS] = useState("")
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    console.log(bookbanknoS)
    const [randoms, setUpdete] = useState(0)

    const bank = [
      { id: "1", name: "เลือกธนาคาร" },
      { id: "1", name: "ธนาคารกรุงเทพ" },
      { id: "2", name: "ธนาคารกรุงไทย" },
      { id: "3", name: "ธนาคารไทยพาณิชย์" },
      { id: "4", name: "ธนาคารกสิกรไทย" },
      { id: "5", name: "ธนาคารทหารไทยธนชาต" },
      { id: "6", name: "ธนาคารกรุงศรีอยุธยา" },
      { id: "7", name: "ธนาคารทิสโก้" },
      { id: "8", name: "ธนาคารเกียรตินาคินภัทร" },
      { id: "9", name: "ธนาคารยูโอบี" },
      { id: "10", name: "ธนาคารสแตนดาร์ดชาร์เตอร์ด (ไทย)" },
      { id: "11", name: "ธนาคารไอซีบีซี (ไทย)" },
      { id: "12", name: "ธนาคารซีไอเอ็มบีไทย" },
      { id: "13", name: "ธนาคารแลนด์แอนด์เฮ้าส์" }
    ]


    //********************************************************* */
    // name   
    const BankInput = (e: any) => {
      SetbankS(e.target.value)
    }
    // name   
    const NameInput = (e: any) => {
      SetnameS(e.target.value)
    }
    // bookbank  
    const BookbankInput = (e: any) => {
      SetbookbanknoS(e.target.value)
    }
    // promtpay  
    const PromtpayInput = (e: any) => {
      SetpromtpaynoS(e.target.value)
    }

    //*******************************Add Image Promtpay************************ */
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
        body: JSON.stringify({ imageBase64: preview, company: companyS, hard: "promtpay" }),
      });
      const data = await res.json();
      if (data.file) {
        setUploadedUrl(data.file);

      }
      AlertComplete()
      Edit()

    };

    //************************************************************************ */
    //******************Get Promtpay************************************ */
    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getpayment}?company=${companyS}`)  //Get_Employee
        const payment = res.data[0]
        payment == undefined ? "" : SetId(inputValue(payment.id))
        payment == undefined ? "" : Setcompany(inputValue(payment.company))
        payment == undefined ? "" : SetbankS(inputValue(payment.bank))
        payment == undefined ? "" : SetnameS(inputValue(payment.name))
        payment == undefined ? "" : SetbookbanknoS(inputValue(payment.bookbankno))
        payment == undefined ? "" : SetpromtpaynoS(inputValue(payment.promtpayno))
        payment == undefined ? "" : setUploadedUrl(payment.publicId ?? null)


        setTimeout(async () => {
          await payment == undefined ? Save() : ""
        }, 500);
      } catch (error) {
        console.error(error)
      }

    }

    useEffect(() => {
      fetchPosts()
    }, []);
    /************************************************************************** */
    //******* */ Post Data********************************************************/
    const Save = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const company = companyS
      const bank = String(bankS)
      const name = String(nameS)
      const bookbankno = String(bookbanknoS)
      const promtpayno = String(promtpaynoS)
      const publicId = "/uploads/promtpay_" + companyS + ".jpg"
      //company,bank,name,bookbankno,promtpayno,publicId
      try {
        await axios.post(`/api/${getpayment}`,
          {
            company, bank, name, bookbankno, promtpayno, publicId
          }
        )
        AlertComplete()
      } catch (error) {
        console.error(error)
      }

    }

    //******* */ Edit Data********************************************************
    const Edit = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const bank = String(bankS)
      const name = String(nameS)
      const bookbankno = String(bookbanknoS)
      const promtpayno = String(promtpaynoS)
      const publicId = "/uploads/promtpay_" + companyS + ".jpg"
      try {
        await axios.put(`/api/${getpayment}/${Number(EmpId)}`,
          {
            bank, name, bookbankno, promtpayno, publicId
          }
        )
        AlertComplete()
      } catch (error) {
        console.error(error)
      }
      setUpdete(Math.random)
    }

    return (

      <div style={{ width: "100%" }}>
        {/*  
        <div className="input-group mt-2">
          <span className="input-group-text" id="visible-addon" style={{fontFamily:"kanit",fontSize:12,width:110,color:"GrayText"}}>ตำแหน่ง</span>
           <select  className="form-select" id="inputGroup"  onChange={BankInput}   style={{fontFamily:"kanit",fontSize:12}} value={bankS!==undefined?bankS:"เลือกธนาคาร"}> 
           {bank.length > 0 &&
           bank.map((option:any,index:any)=>
                <option 
                        value={option.value}
                        disabled={option.disable ? true : false}
                        key={index}
                        selected={option.selected}
                        style={{fontFamily:"kanit",fontSize:12}} >
                        {option.name}
                </option>
            )}  
          </select>   
          
        </div>*/}

        {/** 
        <div className="input-group mt-2">
          <span className="input-group-text" id="visible-addon" style={{fontFamily:"kanit",fontSize:12,width:110,color:"GrayText"}}>เลขบัญชี</span>
          <input 
              type="text" 
              className="form-control"
              placeholder="" 
              aria-label="Username"
              value={bookbanknoS}
              onChange={BookbankInput} 
              aria-describedby="visible-addon" 
              style={{fontFamily:"kanit",fontSize:15}}/>         
        </div>    
      */}
        {/** 
        <div className="input-group mt-2">
          <span className="input-group-text" id="visible-addon" style={{fontFamily:"kanit",fontSize:12,width:110,color:"GrayText"}}>เลข พร้อมเพย์</span>
          <input 
              type="text" 
              className="form-control" 
              placeholder="" 
              aria-label="Username"
              value={promtpaynoS}
              onChange={PromtpayInput} 
              aria-describedby="visible-addon" 
              style={{fontFamily:"kanit",fontSize:15}}/>         
        </div>   


      
        <div className='row justify-content-center'>
              <div className='col-sm-4'>
                <div className=" mt-4 justify-content-between  " style={{width:150,height: 150,justifyContent:"center"}}> 
                <div className='shadow-sm rounded border border-2 justify-content-center' style={{width:150,height: 210}} >
             
               <img className='img-fluid rounded mx-auto d-block' src={String(uploadedUrl) } alt="preview" width={140} height={160}/> 
              </div>
          
              <div className="input-group input-group-sm mt-2 d-flex "  style={{width:60,justifySelf:"center"}} >
              <label  className="input-group-text rounded border border-2"   htmlFor="inputGroupFile01">เลือกรูป</label>
                <input type="file" accept="image/*"  onChange={handleFileChange}  id="inputGroupFile01" style={{height:0}}></input>
              </div>
              <div style={{justifySelf:"center"}} >
              <button  
                      className="btn btn-outline-secondary mt-1 "
                      onClick={UploadImg}           
                      style={{fontFamily:"kanit",fontSize:12,width:120}}>
                      บันทึก PromptPay
              </button> 
              {preview && ( <img className='img-fluid rounded mx-auto d-block' src={preview} alt="preview" width={140} height={140}/>)}      
              </div>
        </div>
        
        </div> 
       
        </div>
        */}


        <PaymentProviderSetting
          AlertComplete={AlertComplete}
          promptPayContent={
            <div style={{ fontFamily: "kanit" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                เลขพร้อมเพย์
              </div>
              <div className="d-flex" style={{ gap: 6 }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="เบอร์ / เลขบัตร"
                  aria-label="เลขพร้อมเพย์"
                  value={nameS ?? ""}
                  onChange={NameInput}
                  style={{ fontFamily: "kanit", fontSize: 11, minHeight: 28, borderColor: "#dbe3ec" }}
                />
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() => Edit()}
                  style={{ fontFamily: "kanit", fontSize: 11, minHeight: 28, minWidth: 58 }}>
                  บันทึก
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#8a96a8", marginTop: 3 }}>
                Auto Generate QR
              </div>
            </div>
          }
        />

      </div>

    )

  }

  // ตั้งค่าการมองเห็น
  const Level = () => {
    type RowData = {
      id: number;
      company: string;
      codename: string;
      main: string;
      list: string;
      level1: boolean;
      level2: boolean;
      level3: boolean;
    };
    const [mainlevel, setmainlevel] = useState([])

    const [rows, setRows] = useState<RowData[]>(mainlevel);


    // toggle handler
    const handleToggle = async (
      id: number,
      field: keyof RowData,
      value: boolean
    ) => {
      // update UI ทันที
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );

      // call PUT API
      try {
        await axios.put(`/api/${getlevel}/${id}`, { [field]: value });
        console.log(`Updated ${field} for id=${id} → ${value}`);
        await fetchPosts()
      } catch (err) {
        console.error("Update failed:", err);
      }
    };


    useEffect(() => {

      fetchPosts()


    }, [])

    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getlevel}?company=${companyS}`)  //Get_Employee
        let data: any[] = res.data || []
        if (data.length > 0) {
          const existing = new Set(data.map((d: any) => d.codename))
          const missing = (leveljson as any[]).filter((j: any) => !existing.has(j.codename))
          const levelId = data[0].levelId
          if (missing.length > 0 && levelId) {
            await axios.post(`/api/${getlevel}`, {
              levelId,
              mainlevel: missing.map((m: any) => ({
                company: companyS,
                codename: m.codename,
                main: m.main,
                list: m.list,
                level1: Boolean(m.level1),
                level2: Boolean(m.level2),
                level3: Boolean(m.level3),
              })),
            })
            const res2 = await axios.get(`/api/${getlevel}?company=${companyS}`)
            data = res2.data || []
          }
        }
        const mergedData = mergeLevelDefaults(data)
        setmainlevel(mergedData as any)
        console.log(mergedData)
      } catch (error) {
        console.error(error)
      }

    }

    // Post Level ตั้งต้น
    const SaveMainLevel = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const mainlevel = leveljson.map(posts => ({
        company: companyS,
        codename: posts.codename,
        main: posts.main,
        list: posts.list,
        level1: Boolean(posts.level1),
        level2: Boolean(posts.level2),
        level3: Boolean(posts.level3),

      }))

      try {
        await axios.post(`/api/${getlevel}`,
          {
            mainlevel
          }
        )
        AlertComplete()
        await fetchPosts()
      } catch (error) {
        console.error(error)
      }

    }




    return (
      <>

        {mainlevel.length > 10 ? "" :

          <div >
            <button
              onClick={() => SaveMainLevel()}
              type='button'
              className='btn btn-secondary'
              style={{ fontFamily: "kanit", fontSize: 15 }}>
              คลิก เริ่มการตั้งค่าการมองเห็น
            </button>
          </div>}

        <div className='col-sm-7 '
          style={{ fontFamily: "kanit", fontSize: 15, textAlign: "center" }}>
          ตั้งค่าการมองเห็น

        </div>
        <div className='col-sm-7'>
          <table className="table table-hover">
            <thead>
              <tr>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>code</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>เมนู</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>รายการ</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>Level1</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>Level2</th>


              </tr>
            </thead>
            <tbody>
              {mainlevel.map((n: any) =>
                <tr key={n.id} >
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.codename}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.main}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }}>{n.list}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }} >

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="switchCheckChecked"
                        checked={n.level1}
                        onChange={(e) =>
                          handleToggle(n.id, "level1", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="switchCheckChecked">{n.level1 === true ? "เปิด" : "ปิด"}</label>
                    </div>
                  </td>
                  <td style={{ fontFamily: "kanit", fontSize: 12 }} >

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        disabled={true}
                        id="switchCheckChecked"
                        checked={n.level2}
                        onChange={(e) =>
                          handleToggle(n.id, "level2", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="switchCheckChecked">{n.level2 === true ? "เปิด" : "ปิด"}</label>
                    </div>

                  </td>


                </tr>
              )}
            </tbody>
          </table>

        </div>


      </>


    )
  }

  // ตั้งค่าเครื่องพิมพ์
  const Printer = () => {
    const [printers, setPrinters] = useState<any[]>([]);
    const [selectedPrinter_label, setSelectedPrinter_label] = useState<string>("");
    const [selectedPrinter_rc, setSelectedPrinter_rc] = useState<string>("");
    const [selectedPrinter_a4, setSelectedPrinter_a4] = useState<string>("");
    const [isClient, setIsClient] = useState(false);
    const [receiptPaperSize, setReceiptPaperSize] = useState<string>("80");

    useEffect(() => {
      setIsClient(true);
      const savedPaperSize = localStorage.getItem("receipt_paper_size");
      if (savedPaperSize) {
        setReceiptPaperSize(savedPaperSize);
      }

      const savedPrinter = localStorage.getItem("auto_printer_label");
      if (savedPrinter) {
        setSelectedPrinter_label(savedPrinter);

      }

      const savedPrinter_rc = localStorage.getItem("auto_printer_rc");
      if (savedPrinter_rc) {
        setSelectedPrinter_rc(savedPrinter_rc);

      }

      const savedPrinter_a4 = localStorage.getItem("auto_printer_a4");
      if (savedPrinter_a4) {
        setSelectedPrinter_a4(savedPrinter_a4);

      }

      getPlatformPrinters().then((printerList) => {
        setPrinters(printerList as any[]);
      });
    }, []);



    const handleAutoPrint_rc = async () => {
      if (!isSilentPrintAvailable()) {
        alert("ไม่พบช่องทางการพิมพ์ของเครื่องนี้");
        return;
      }

      const content = `
          <div style="font-family: Arial; padding: 20px;">
            <h1>Dui</h1>
            <p>Printer: ${selectedPrinter_rc || "Default"}</p>
            <p>Time: ${new Date().toLocaleString()}</p>
            <hr/>
            <p>Duissss</p>

            <div className="col-sm-4 shadow-sm rounded border border-1 " style={{ justifyItems: "center", backgroundColor: "white" }} ref={contentRef} >
            
            
                          <div style={{ width: 50, height: 50, justifySelf: "center" }}>
                            <img alt={""} src={String(uploadedUrl)} />
                          </div>
            
                          <div className="row mt-1 " style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 13, justifySelf: "center" }}>ใบเสร็จรับเงิน</div>
                          <div className="row  " style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 17, justifySelf: "center" }}>{storeS}</div>
                          <div className="row" style={{ fontFamily: "kanit", fontSize: 10, marginLeft: 2 }}>{addressS}</div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10 }}>โทร : {telS}</div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10 }}>--------------------------------------</div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10, justifySelf: "left", marginLeft: 3 }}>พนักงานขาย : เดชฤทธิ์ สอนสุระ</div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10, justifySelf: "left", marginLeft: 3 }}>
                            วันที่ : {new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}&nbsp;&nbsp;&nbsp;
                            {new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}
            
                          </div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10 }}>--------------------------------------</div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10, justifySelf: "left", marginLeft: 3 }}>ลูกค้า : {name_cus === "" ? "ลูกค้าทั่วไป" : name_cus}</div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10 }}>--------------------------------------</div>
            
            
                          <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                            <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 8, textAlign: "start", height: 15, width: 100, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>ราการ</div>
                            <div className=' bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 8, textAlign: "center", height: 15, width: 20 }}>จำนวน</div>
                            <div className=' bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 8, textAlign: "end", height: 15, width: 23 }}>หน่วย</div>
                            <div className=' bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 8, textAlign: "end", height: 15, width: 23 }}>ราคา</div>
                            <div className=' bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 8, textAlign: "end", height: 15, width: 25 }}>ลด/ชิ้น</div>
                            <div className=' bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 8, textAlign: "end", height: 15, width: 25, marginRight: 5 }}>รวม</div>
                          </div>
            
                          <Table className="table" size="sm"  >
                            <tbody className="">
                              <tr className="">
                                <th scope="row" className="">
            
            
            
                                  {list.filter((q: any) => q.label === true).map((a: any) =>
                                    <div key={a.id} id="selcet-print" style={{ backgroundColor: "white" }}  >
            
            
            
            
            
            
                                      <div className="d-flex bd-highlight" style={{ justifyItems: "end" }}>
                                        <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                                        <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", height: 15, width: 20 }}>{a.qty}</div>
                                        <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 20 }}>{a.unit}</div>
                                        <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 20 }}>{a.price}</div>
                                        <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 20 }}>{a.discount}</div>
                                        <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 30 }}>{a.total}</div>
                                      </div>
            
                                    </div>
            
                                  )}
            
            
            
            
                                </th>
                              </tr>
                            </tbody>
                          </Table>
            
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10 }}>--------------------------------------</div>
                          <div className="row " style={{ fontFamily: "kanit", fontSize: 10, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ    ชำระสินค้า : {alldatalist.pay === "payment" ? "โอน" : alldatalist.pay === "cash" ? "เงินสด" : ""}</div>
                          {/**ท้ายบิล Slip */}
                          <div className="container">
                            <div className="row ">
                              <div className="col-6" style={{ justifySelf: "stert" }}>
            
                                {/**แต้มสะสม */}
            
                                <div className="d-flex bd-highlight">
                                  <div className="bd-highlight" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 10, width: 60 }}>แต้มทั้งหมด :</div>
                                  <div className="bd-highlight" style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 10, width: 25 }}>{total_cus === "" ? 0 : total_cus}</div>
                                  <div className="bd-highlight" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 10, width: 15 }}>แต้ม</div>
                                </div>
                                <div className="d-flex bd-highlight">
                                  <div className="bd-highlight" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 10, width: 60 }}>แต้มยอดบิล :</div>
                                  <div className="bd-highlight" style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 10, width: 25 }}>{total_cus === "" ? 0 : parseInt(String(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) / (Number(SaleS) / Number(pointeqS))))}</div>
                                  <div className="bd-highlight" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 10, width: 15 }}>แต้ม</div>
                                </div>
                                <div className="d-flex bd-highlight">
                                  <div className="bd-highlight" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 10, width: 60 }}>แต้มรวม :</div>
                                  <div className="bd-highlight" style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 10, width: 25 }}>{total_cus === "" ? 0 : parseInt(String((Number(total_cus) + Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) / (Number(SaleS) / Number(pointeqS)))))}</div>
                                  <div className="bd-highlight" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 10, width: 15 }}>แต้ม</div>
                                </div>
            
            
            
                              </div>
            
                              <div className="col-6 ">
                                <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                                  <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80, height: 15 }}>รวมเงิน :</div>
                                  <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", width: 30, height: 15, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                                  <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                                </div>
            
                                <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80, height: 15 }}>ส่วนลด :</div>
                                  <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", width: 30, height: 15 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                                </div>
            
                                <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80, height: 15 }}>ใช้แต้มส่วนลด :</div>
                                  <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", width: 30, height: 15 }}>{parseInt(String(alldatalist.usereward))}</div>
                                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                                </div>
            
                                <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                                  <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "right", width: 80, height: 15 }}>ยอดรวมสุทธิ :</div>
                                  <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "center", width: 30, height: 15 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                                    - Number(alldatalist.discount)
                                    - Number(alldatalist.promotion)
                                    - Number(parseInt(alldatalist.usereward))
                                  }</div>
                                  <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                                </div>
                              </div>
                              <div className="h-5"></div>
                            </div>
                          </div>
            
            
                        </div>
          </div>
        `;

      try {
        await printSilent({
          content: content,
          printerName: selectedPrinter_rc
        });
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> ส่งพิมพ์เรียบร้อย</div>,
          duration: 3000,
        });

      } catch (error) {
        console.error("Printing failed:", error);
        alert("Printing failed");
      }
    };



    const handleSavePrinter_label = () => {
      localStorage.setItem("auto_printer_label", selectedPrinter_label);
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึกเครื่องพิมพ์เรียบร้อยแล้ว</div>,
        duration: 3000,
      });
    };

    const handleSavePrinter_rc = () => {
      localStorage.setItem("auto_printer_rc", selectedPrinter_rc);
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึกเครื่องพิมพ์เรียบร้อยแล้ว</div>,
        duration: 3000,
      });
    };

    const handleSavePrinter_a4 = () => {
      localStorage.setItem("auto_printer_a4", selectedPrinter_a4);
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึกเครื่องพิมพ์เรียบร้อยแล้ว</div>,
        duration: 3000,
      });
    };


    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontFamily: "kanit_B", fontSize: 20, marginBottom: 20 }}>ตั้งค่าเครื่องพิมพ์อัตโนมัติ สำหรับ Window Application</div>

        {/** 
        <div className="row mb-3">
          <div className="col-md-6">
            <label style={{ fontFamily: "kanit", fontSize: 15, marginBottom: 10 }}>เลือกเครื่องพิมพ์ สำหรับ พิมพ์ฉลากสินค้า:</label>
            <select
              className="form-control"
              style={{ fontFamily: "kanit" }}
              value={selectedPrinter_label}
              onChange={(e) => setSelectedPrinter_label(e.target.value)}
            >
              <option value="">-- เลือกเครื่องพิมพ์ --</option>
              {printers.map((p, index) => (
                <option key={index} value={p.name}>
                  {p.name} {p.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              style={{ fontFamily: "kanit" }}
              onClick={handleSavePrinter_label}
            >
              บันทึก
            </button>
          </div>
        </div>
        */}

        <div className="row mt-3">
          <div className="col-md-6">
            <label style={{ fontFamily: "kanit", fontSize: 15, marginBottom: 10 }}>เลือกเครื่องพิมพ์ สำหรับ พิมพ์ใบเสร็จ:</label>
            <select
              className="form-control"
              style={{ fontFamily: "kanit" }}
              value={selectedPrinter_rc}
              onChange={(e) => setSelectedPrinter_rc(e.target.value)}
            >
              <option value="">-- เลือกเครื่องพิมพ์ --</option>
              {printers.map((p, index) => (
                <option key={index} value={p.name}>
                  {p.name} {p.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleSavePrinter_rc}
            >
              บันทึก
            </button>
          </div>
        </div>

        {/* Receipt Paper Size Selector */}
        <div className="row mt-4">
          <div className="col-md-6">
            <label style={{ fontFamily: "kanit", fontSize: 15, marginBottom: 10 }}>ขนาดกระดาษใบเสร็จ:</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setReceiptPaperSize("58");
                  localStorage.setItem("receipt_paper_size", "58");
                  toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
                    description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>เลือกขนาดกระดาษ 58 mm</div>,
                    duration: 3000,
                  });
                }}
                style={{
                  fontFamily: "Kanit",
                  fontSize: 14,
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: receiptPaperSize === "58" ? '2px solid #2A6AAA' : '2px solid #e2e8f0',
                  background: receiptPaperSize === "58" ? 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)' : 'white',
                  color: receiptPaperSize === "58" ? '#1E5088' : '#64748b',
                  fontWeight: receiptPaperSize === "58" ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: receiptPaperSize === "58" ? '0 2px 8px rgba(42, 106, 170,0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {receiptPaperSize === "58" && <span style={{ fontSize: 16 }}>✓</span>}
                58 mm
              </button>
              <button
                onClick={() => {
                  setReceiptPaperSize("80");
                  localStorage.setItem("receipt_paper_size", "80");
                  toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
                    description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>เลือกขนาดกระดาษ 80 mm</div>,
                    duration: 3000,
                  });
                }}
                style={{
                  fontFamily: "Kanit",
                  fontSize: 14,
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: receiptPaperSize === "80" ? '2px solid #2A6AAA' : '2px solid #e2e8f0',
                  background: receiptPaperSize === "80" ? 'linear-gradient(135deg, #E5EEF8 0%, #CCDFF1 100%)' : 'white',
                  color: receiptPaperSize === "80" ? '#1E5088' : '#64748b',
                  fontWeight: receiptPaperSize === "80" ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: receiptPaperSize === "80" ? '0 2px 8px rgba(42, 106, 170,0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {receiptPaperSize === "80" && <span style={{ fontSize: 16 }}>✓</span>}
                80 mm
              </button>
            </div>
            <div style={{ fontFamily: "kanit", fontSize: 12, color: '#94a3b8', marginTop: '8px' }}>
              ค่าปัจจุบัน: {receiptPaperSize} mm
            </div>
          </div>
        </div>

        {/** 
        <div className="row mt-3">
          <div className="col-md-6">
            <label style={{ fontFamily: "kanit", fontSize: 15, marginBottom: 10 }}>เลือกเครื่องพิมพ์ สำหรับ พิมพ์ A4:</label>
            <select
              className="form-control"
              style={{ fontFamily: "kanit" }}
              value={selectedPrinter_a4}
// ...
              onChange={(e) => setSelectedPrinter_a4(e.target.value)}
            >
              <option value="">-- เลือกเครื่องพิมพ์ --</option>
              {printers.map((p, index) => (
                <option key={index} value={p.name}>
                  {p.name} {p.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              style={{ fontFamily: "kanit" }}
              onClick={handleSavePrinter_a4}
            >
              บันทึก
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <button
              className="btn btn-success"
              style={{ fontFamily: "kanit" }}
              onClick={handleAutoPrint_rc}
            >
              <i className="bi bi-printer"></i> Print Auto
            </button>
          </div>
        </div>
*/}

      </div>
    )
  }

  // แบ็คอัพข้อมูล
  const BackupPage = () => {
    const [backupLoading, setBackupLoading] = useState(false)
    const [restoreLoading, setRestoreLoading] = useState(false)
    const [backupAll, setBackupAll] = useState(true)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [previewData, setPreviewData] = useState<any>(null)
    const [restoreFile, setRestoreFile] = useState<File | null>(null)
    const [statusMsg, setStatusMsg] = useState("")
    const [statusType, setStatusType] = useState<"success" | "error" | "">("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    // System update
    const [versionInfo, setVersionInfo] = useState<{ current: string; latest: string | null; hasUpdate: boolean; error?: string } | null>(null)
    const [versionLoading, setVersionLoading] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [updateLog, setUpdateLog] = useState("")

    // Cloudflare Tunnel
    // mode = "android" หมายถึง tunnel รันอยู่ในแท็บเล็ตเครื่องนี้เอง (ดู src/lib/mobile/api/routes/tunnel.ts)
    // ส่วนบนเครื่องคอมพิวเตอร์จะไม่มีฟิลด์นี้ เพราะ tunnel รันเป็น container ของ Podman
    const [tunnelStatus, setTunnelStatus] = useState<{
      available?: boolean; installed?: boolean; running?: boolean; hasToken?: boolean; status?: string
      hostname?: string; image?: string; error?: string; mode?: string; tunnelMode?: "quick" | "token"
      port?: number; serverReady?: boolean; exposeLan?: boolean; url?: string
    } | null>(null)
    const [tunnelToken, setTunnelToken] = useState("")
    const [tunnelBusy, setTunnelBusy] = useState(false)
    const [tunnelLog, setTunnelLog] = useState<string>("")
    const [tunnelLogOpen, setTunnelLogOpen] = useState(false)
    const [tunnelPhase, setTunnelPhase] = useState<"idle" | "starting" | "stopping" | "restarting">("idle")
    /** เฉพาะแท็บเล็ต: เลือกระหว่างลิงก์ชั่วคราวที่ไม่ต้องมีบัญชี กับ tunnel ถาวรของร้าน */
    const [tunnelDeviceMode, setTunnelDeviceMode] = useState<"quick" | "token">("quick")
    const tunnelAutoStartRef = useRef(false)
    /** ตั้งค่าโหมดจากสถานะที่บันทึกไว้ครั้งเดียวตอนเปิดหน้า ไม่ใช่ทุกรอบที่ poll — ดู loadTunnelStatus */
    const tunnelModeSeededRef = useRef(false)

    // Rollback
    const [rollbackTags, setRollbackTags] = useState<string[]>([])
    const [selectedRollbackTag, setSelectedRollbackTag] = useState<string>("")
    const [rollbackLog, setRollbackLog] = useState<string>("")
    const [rollingBack, setRollingBack] = useState(false)
    const [showRollback, setShowRollback] = useState(false)

    // OneDrive Backup Sync
    const [oneDriveStatus, setOneDriveStatus] = useState<{ detectedPaths?: string[]; isLinked?: boolean; linkTarget?: string; config?: { enabled?: boolean }; error?: string } | null>(null)
    const [oneDriveBusy, setOneDriveBusy] = useState(false)
    const [selectedOneDrivePath, setSelectedOneDrivePath] = useState<string>("")

    // Auto-backup scheduling
    const [autoInterval, setAutoInterval] = useState(() => typeof window !== "undefined" ? localStorage.getItem("autoBackupInterval") || "off" : "off")
    const [lastAutoBackup, setLastAutoBackup] = useState(() => typeof window !== "undefined" ? localStorage.getItem("lastAutoBackup") || "" : "")
    const [autoBackupDir, setAutoBackupDir] = useState<any>(null)
    const [autoBackupDirName, setAutoBackupDirName] = useState(() => typeof window !== "undefined" ? localStorage.getItem("autoBackupDirName") || "" : "")
    const [autoBackupRunning, setAutoBackupRunning] = useState(false)
    // สำรองข้อมูลทุกครั้งที่ปิดบิลประจำวัน (เปิดใช้งานเป็นค่าเริ่มต้น)
    const [dailyCloseBackup, setDailyCloseBackup] = useState(() =>
      typeof window !== "undefined" ? localStorage.getItem("dailyCloseAutoBackup") !== "off" : true)
    const [lastDailyCloseBackup, setLastDailyCloseBackup] = useState(() =>
      typeof window !== "undefined" ? localStorage.getItem("lastDailyCloseBackup") || "" : "")
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [backupHistory, setBackupHistory] = useState<any[]>(() => {
      try { return typeof window !== "undefined" ? JSON.parse(localStorage.getItem("backupHistory") || "[]") : [] } catch { return [] }
    })
    const [showTableModal, setShowTableModal] = useState(false)

    // Restore directory handle from IndexedDB on mount
    useEffect(() => {
      loadDirHandle().then(handle => {
        if (handle) setAutoBackupDir(handle)
      }).catch(() => {})
    }, [])

    const ALL_TABLES = [
      "User", "SettingEmployee", "CheckinFace", "BranchConnection",
      "Getagory", "Group", "Fixname", "Type", "Unit", "Area",
      "Datalist", "Customer", "Drugallergy", "Supplier",
      "Receive", "RCitemlist", "SaleMain", "Sale", "History",
      "Gifts", "Indicator", "Methodlist", "TimeL", "UseL",
      "TimeUseL", "KeepL", "RemarkL", "Labeldata",
      "SettingStore", "SettingLabel", "Settingpoint", "Settingpayment",
      "PaymentProvider", "PaymentTransaction", "Promotion", "Label_language",
      "DocMain", "DocDetail", "PL", "Interaction",
      "Level", "MainLevel", "Checkin", "CheckinSet", "Checkstock",
      "RCstockchange", "StockTransaction", "OrderMain", "OrderDetail",
      "IncentiveSetting", "StockTransfer", "StockTransferItem",
      "UnitConversion", "TemperatureRecord", "TemperatureSetting",
      "TemperaturePoint", "LeaveConfig", "LeaveRecord",
      "SyncLog", "SyncSchedule",
    ]

    const [selectedAutoTables, setSelectedAutoTables] = useState<string[]>(() => {
      try {
        if (typeof window === "undefined") return [...ALL_TABLES]
        const saved = JSON.parse(localStorage.getItem("autoBackupTables") || "[]")
        return saved.length > 0 ? saved : [...ALL_TABLES]
      } catch { return [...ALL_TABLES] }
    })

    const toggleTable = (name: string) => {
      setSelectedAutoTables(prev => {
        const next = prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
        localStorage.setItem("autoBackupTables", JSON.stringify(next))
        window.dispatchEvent(new CustomEvent("autoBackupConfigChanged"))
        return next
      })
    }

    const selectAllTables = () => {
      setSelectedAutoTables([...ALL_TABLES])
      localStorage.setItem("autoBackupTables", JSON.stringify(ALL_TABLES))
      window.dispatchEvent(new CustomEvent("autoBackupConfigChanged"))
    }

    const deselectAllTables = () => {
      setSelectedAutoTables([])
      localStorage.setItem("autoBackupTables", "[]")
      window.dispatchEvent(new CustomEvent("autoBackupConfigChanged"))
    }

    const intervalOptions = [
      { value: "off", label: "ปิด" },
      { value: "1", label: "ทุก 1 ชั่วโมง" },
      { value: "2", label: "ทุก 2 ชั่วโมง" },
      { value: "7", label: "ทุก 7 ชั่วโมง" },
      { value: "24", label: "ทุกวัน (24 ชั่วโมง)" },
    ]

    const handleSelectAutoBackupDir = async () => {
      if (typeof window !== "undefined" && (window as any).showDirectoryPicker) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" })
          setAutoBackupDir(dirHandle)
          setAutoBackupDirName(dirHandle.name)
          localStorage.setItem("autoBackupDirName", dirHandle.name)
          await saveDirHandle(dirHandle)
          window.dispatchEvent(new CustomEvent("autoBackupConfigChanged"))
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Directory picker error:", err)
          }
        }
      } else {
        setAutoBackupDirName("Downloads (default)")
        localStorage.setItem("autoBackupDirName", "Downloads (default)")
      }
    }

    const runAutoBackup = async () => {
      if (autoBackupRunning) return
      setAutoBackupRunning(true)
      try {
        const companyS = localStorage.getItem("company_") || ""
        const tablesToBackup = selectedAutoTables.length < ALL_TABLES.length ? selectedAutoTables : undefined
        const res = await axios.post("/api/backup/create", { company: companyS, selectedTables: tablesToBackup, saveOnServer: true })
        const backupJson = JSON.stringify(res.data, null, 2)
        const blob = new Blob([backupJson], { type: "application/json" })
        const now = new Date()
        const fname = `auto_backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.json`

        // Try current state handle first, then IndexedDB
        let dirHandle = autoBackupDir
        if (!dirHandle) {
          try { dirHandle = await loadDirHandle() } catch {}
        }

        if (dirHandle) {
          try {
            const perm = await (dirHandle as any).queryPermission({ mode: "readwrite" })
            if (perm !== "granted") {
              const req = await (dirHandle as any).requestPermission({ mode: "readwrite" })
              if (req !== "granted") dirHandle = null
            }
          } catch { dirHandle = null }
        }

        if (dirHandle) {
          try {
            const fileHandle = await dirHandle.getFileHandle(fname, { create: true })
            const writable = await (fileHandle as any).createWritable()
            await writable.write(blob)
            await writable.close()
          } catch (dirErr: any) {
            console.error("Auto-backup dir write failed, falling back to download:", dirErr)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = fname
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        } else {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = fname
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }

        const timeStr = now.toLocaleString("th-TH")
        setLastAutoBackup(timeStr)
        localStorage.setItem("lastAutoBackup", timeStr)
        const entry = { date: timeStr, file: fname, folder: autoBackupDirName || "Downloads", status: "สำเร็จ", records: Object.values(res.data?.metadata?.recordCounts || {}).reduce((a: number, b: any) => a + Number(b), 0) }
        const updated = [entry, ...backupHistory].slice(0, 50)
        setBackupHistory(updated)
        localStorage.setItem("backupHistory", JSON.stringify(updated))
      } catch (err: any) {
        console.error("Auto-backup failed:", err)
        const entry = { date: new Date().toLocaleString("th-TH"), file: "-", folder: autoBackupDirName || "Downloads", status: "ล้มเหลว: " + (err?.message || "Unknown"), records: 0 }
        const updated = [entry, ...backupHistory].slice(0, 50)
        setBackupHistory(updated)
        localStorage.setItem("backupHistory", JSON.stringify(updated))
      }
      setAutoBackupRunning(false)
    }

    const clearBackupHistory = () => {
      setBackupHistory([])
      localStorage.setItem("backupHistory", "[]")
    }

    const handleIntervalChange = (val: string) => {
      setAutoInterval(val)
      localStorage.setItem("autoBackupInterval", val)
      window.dispatchEvent(new CustomEvent("autoBackupConfigChanged"))
    }

    const handleDailyCloseBackupChange = (enabled: boolean) => {
      setDailyCloseBackup(enabled)
      localStorage.setItem("dailyCloseAutoBackup", enabled ? "on" : "off")
    }

    const checkVersion = async () => {
      setVersionLoading(true)
      try {
        const r = await fetch("/api/system/version", { cache: "no-store" })
        setVersionInfo(await r.json())
      } catch (e: any) {
        setVersionInfo({ current: "?", latest: null, hasUpdate: false, error: e.message })
      } finally {
        setVersionLoading(false)
      }
    }

    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 8000) => {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), timeoutMs)
      try {
        return await fetch(url, { ...options, signal: controller.signal })
      } finally {
        window.clearTimeout(timer)
      }
    }

    const setUpdateRestartHint = (missCount: number) => {
      setUpdateLog((prev) => {
        const base = prev.replace(/\n\(กำลัง restart โปรแกรม\/เชื่อมต่อใหม่\.\.\. ครั้งที่ \d+\)$/u, "")
        return `${base}\n(กำลัง restart โปรแกรม/เชื่อมต่อใหม่... ครั้งที่ ${missCount})`
      })
    }

    const runUpdate = async (tag: string = "latest") => {
      if (!window.confirm(`ระบบจะสำรองข้อมูลอัตโนมัติและอัพเดทเป็นเวอร์ชัน "${tag}"\nใช้เวลาประมาณ 2-5 นาที\n\nระหว่างอัพเดทหน้าเว็บอาจ reconnect ชั่วคราว หากหน้าเว็บเข้าไม่ได้ให้เปิด SmileStore POS Updater จาก Desktop\n\nดำเนินการต่อ?`)) return
      setUpdating(true)
      setUpdateLog("กำลังเริ่มอัพเดท...\nระหว่าง restart โปรแกรม หน้านี้อาจขาดการเชื่อมต่อชั่วคราว ระบบจะเชื่อมต่อใหม่เอง\nหากหน้าเว็บเข้าไม่ได้ ให้เปิด SmileStore POS Updater จาก Desktop")
      try {
        const r = await fetchWithTimeout("/api/system/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag }),
        }, 15000)
        const data = await r.json()
        if (!r.ok) {
          setUpdateLog("❌ " + (data.error || "Update failed"))
          setUpdating(false)
          return
        }
        setUpdateLog(data.message || "กำลังอัพเดท...")

        const startedAt = Date.now()
        let missCount = 0

        const pollLog = async () => {
          if (Date.now() - startedAt > 10 * 60 * 1000) {
            setUpdateLog((prev) => `${prev}\n⚠️ ใช้เวลานานกว่าปกติ กรุณาเปิดหน้าเว็บใหม่ หรือดู ${INSTALL_LOGS}\\update.log`)
            setUpdating(false)
            return
          }

          try {
            const lr = await fetchWithTimeout(`/api/system/update?t=${Date.now()}`, { cache: "no-store" }, 8000)
            if (lr.ok) {
              const ld = await lr.json()
              const log = ld.log || ""
              if (log) setUpdateLog(log)
              missCount = 0

              if (ld.state === "done") {
                setUpdating(false)
                setUpdateLog(`${log}\n✅ อัพเดทสำเร็จ กำลังโหลดหน้าใหม่...`)
                window.setTimeout(() => window.location.reload(), 3000)
                return
              }

              if (ld.state === "failed") {
                setUpdating(false)
                return
              }
            }
          } catch {
            missCount += 1
            setUpdateRestartHint(missCount)
          }

          window.setTimeout(pollLog, Math.min(15000, 5000 + missCount * 2000))
        }

        window.setTimeout(pollLog, 3000)
      } catch (e: any) {
        setUpdateLog("❌ " + (e.message || "Update failed"))
        setUpdating(false)
      }
    }

    const loadTunnelStatus = async () => {
      try {
        const r = await fetch("/api/system/tunnel", { cache: "no-store" })
        const data = await r.json()
        setTunnelStatus(data)
        // เอาโหมดที่บันทึกไว้มาตั้งเป็นค่าเริ่มต้น "ครั้งเดียว" เท่านั้น
        // หน้านี้ poll สถานะทุกไม่กี่วินาที ถ้าตั้งทุกรอบ ตัวเลือกที่ผู้ใช้เพิ่งกดจะถูกดีดกลับ
        // ไปเป็นค่าเดิมภายในไม่กี่วินาที จนสลับโหมดไม่ได้เลย
        if (!tunnelModeSeededRef.current && (data?.tunnelMode === "quick" || data?.tunnelMode === "token")) {
          tunnelModeSeededRef.current = true
          setTunnelDeviceMode(data.tunnelMode)
        }

        // Auto-reconnect (UI fallback): if a token was previously saved but the
        // container is not running, kick off a single start automatically so the
        // user does not have to click "เชื่อมต่อ" again after reset/restart.
        //
        // บนแท็บเล็ตข้ามขั้นตอนนี้: ฝั่ง native เปิดต่อให้เองอยู่แล้ว (TunnelController.resumeIfEnabled)
        // และคำสั่ง start ที่ไม่มี token จากตรงนี้จะถูกตีความเป็นโหมด "ลิงก์ชั่วคราว"
        // ซึ่งไปทับโหมดถาวรที่ผู้ใช้ตั้งไว้
        if (
          !tunnelAutoStartRef.current &&
          data &&
          data.mode !== "android" &&
          data.available !== false &&
          data.hasToken &&
          !data.running &&
          !tunnelBusy
        ) {
          tunnelAutoStartRef.current = true
          try {
            await fetch("/api/system/tunnel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "start" }),
            })
          } catch {}
        }
      } catch (e: any) {
        setTunnelStatus({ available: false, error: e.message })
      }
    }

    const loadTunnelLog = async () => {
      try {
        const r = await fetch("/api/system/tunnel?action=logs", { cache: "no-store" })
        const data = await r.json()
        if (typeof data?.log === "string") setTunnelLog(data.log)
        if (data?.hostname) {
          setTunnelStatus((prev) => prev ? { ...prev, hostname: data.hostname } : prev)
        }
      } catch {}
    }

    // Clean up a pasted token before sending: trims whitespace/newlines (common
    // cause of a 400 "Invalid token format"), extracts the token if the user
    // pasted the whole `cloudflared tunnel run --token <token>` command, and
    // strips surrounding quotes.
    const sanitizeTunnelToken = (raw?: string): string | undefined => {
      if (!raw) return undefined
      let t = raw.trim()
      if (!t) return undefined
      const cmd = t.match(/--token\s+(\S+)/)
      if (cmd) t = cmd[1]
      t = t.replace(/^['"]+|['"]+$/g, "").replace(/\s+/g, "")
      return t || undefined
    }

    const tunnelAction = async (action: "start" | "stop" | "restart", token?: string) => {
      const cleanToken = sanitizeTunnelToken(token)
      const onDevice = tunnelStatus?.mode === "android"

      // Android 13+ ซ่อนแถบสถานะของ foreground service ถ้าไม่ได้รับสิทธิ์แจ้งเตือน
      // ผลคือเครื่องเปิดให้เข้าจากภายนอกอยู่โดยผู้ใช้ไม่เห็นร่องรอยและไม่มีปุ่มหยุด — ต้องขอก่อนเริ่ม
      if (onDevice && action !== "stop") {
        try {
          const { ensureTunnelNotificationPermission } = await import("@/lib/mobile/native/tunnel")
          await ensureTunnelNotificationPermission()
        } catch {}
      }

      setTunnelBusy(true)
      setTunnelPhase(action === "start" ? "starting" : action === "stop" ? "stopping" : "restarting")
      try {
        const r = await fetch("/api/system/tunnel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            token: cleanToken,
            ...(onDevice ? { mode: tunnelDeviceMode } : {}),
          }),
        })
        const data = await r.json()
        if (!r.ok) {
          alert("ผิดพลาด: " + (data.error || "Unknown"))
        } else {
          if (action === "start") setTunnelToken("")
          // Poll status a few times so the hostname appears once cloudflared registers
          await loadTunnelStatus()
          for (let i = 0; i < 6; i++) {
            await new Promise((res) => setTimeout(res, 1500))
            await loadTunnelStatus()
            await loadTunnelLog()
          }
        }
      } catch (e: any) {
        alert("ผิดพลาด: " + e.message)
      } finally {
        setTunnelBusy(false)
        setTunnelPhase("idle")
      }
    }

    // Rollback handlers
    const loadRollbackTags = async () => {
      try {
        const r = await fetch("/api/system/rollback", { cache: "no-store" })
        const data = await r.json()
        setRollbackTags(data.availableTags || [])
        setRollbackLog(data.log || "")
      } catch (e: any) {
        setRollbackLog("Error: " + (e?.message || "unknown"))
      }
    }

    const runRollback = async () => {
      if (!selectedRollbackTag) {
        alert("กรุณาเลือกเวอร์ชันที่ต้องการย้อนกลับ")
        return
      }
      if (!confirm(
        `ยืนยันย้อนเวอร์ชันกลับไป ${selectedRollbackTag}?\n\n` +
        `ระบบจะ backup ฐานข้อมูลก่อนอัตโนมัติ แต่ถ้ามีการเปลี่ยนโครงสร้างข้อมูลในเวอร์ชันใหม่ ข้อมูลบางส่วนอาจหายได้`
      )) return

      setRollingBack(true)
      setRollbackLog("กำลังย้อนเวอร์ชัน... (ใช้เวลา ~1-2 นาที)\n")
      try {
        await fetch("/api/system/rollback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: selectedRollbackTag }),
        })
        const interval = setInterval(async () => {
          try {
            const r = await fetch("/api/system/rollback", { cache: "no-store" })
            const data = await r.json()
            setRollbackLog(data.log || "")
            if ((data.log || "").includes("ROLLBACK SUCCESS") ||
                (data.log || "").includes("ROLLBACK FAILED")) {
              clearInterval(interval)
              setRollingBack(false)
            }
          } catch {}
        }, 5000)
      } catch (e: any) {
        setRollbackLog("Error: " + (e?.message || "unknown"))
        setRollingBack(false)
      }
    }

    // OneDrive handlers
    const loadOneDriveStatus = async () => {
      try {
        const r = await fetch("/api/system/onedrive", { cache: "no-store" })
        const data = await r.json()
        setOneDriveStatus(data)
        if (data.detectedPaths?.[0] && !selectedOneDrivePath) {
          setSelectedOneDrivePath(data.detectedPaths[0])
        }
      } catch (e: any) {
        setOneDriveStatus({ error: e?.message })
      }
    }

    const toggleOneDrive = async (enable: boolean) => {
      if (enable && !selectedOneDrivePath) {
        alert("ไม่พบ OneDrive บนเครื่อง กรุณาติดตั้ง OneDrive ก่อน")
        return
      }
      if (!confirm(
        enable
          ? `ย้ายโฟลเดอร์ backup ไป ${selectedOneDrivePath}\\SmilePharmacy-Backups ?`
          : "ยกเลิกการ sync OneDrive? (ไฟล์ backup จะ copy กลับมาที่เครื่อง)"
      )) return

      setOneDriveBusy(true)
      try {
        const r = await fetch("/api/system/onedrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: enable ? "enable" : "disable",
            path: enable ? selectedOneDrivePath : undefined,
          }),
        })
        const data = await r.json()
        if (data.error) alert("ผิดพลาด: " + data.error)
        else alert(enable ? "เปิดใช้ OneDrive Sync แล้ว" : "ปิด OneDrive Sync แล้ว")
        await loadOneDriveStatus()
      } catch (e: any) {
        alert("ผิดพลาด: " + (e?.message || "unknown"))
      } finally {
        setOneDriveBusy(false)
      }
    }

    // Listen for auto-backup updates from the global scheduler
    useEffect(() => {
      const handleUpdate = () => {
        setLastAutoBackup(localStorage.getItem("lastAutoBackup") || "")
        setLastDailyCloseBackup(localStorage.getItem("lastDailyCloseBackup") || "")
        try { setBackupHistory(JSON.parse(localStorage.getItem("backupHistory") || "[]")) } catch {}
      }
      window.addEventListener("autoBackupUpdated", handleUpdate)
      return () => window.removeEventListener("autoBackupUpdated", handleUpdate)
    }, [])

    // Load tunnel status once on mount + poll while running so hostname/log refresh
    useEffect(() => {
      loadTunnelStatus()
      const id = setInterval(() => {
        loadTunnelStatus()
        if (tunnelLogOpen) loadTunnelLog()
      }, 8000)
      return () => clearInterval(id)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tunnelLogOpen])

    // Load OneDrive status once on mount
    useEffect(() => {
      loadOneDriveStatus()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleCreateBackup = async () => {
      setBackupLoading(true)
      setStatusMsg("")
      setStatusType("")
      try {
        const companyS = localStorage.getItem("company_") || ""
        const payload: any = { company: companyS }
        if (!backupAll && startDate && endDate) {
          payload.startDate = startDate
          payload.endDate = endDate
        }
        const res = await axios.post("/api/backup/create", payload)
        const backupJson = JSON.stringify(res.data, null, 2)
        const blob = new Blob([backupJson], { type: "application/json" })
        const now = new Date()
        const fname = `backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.json`

        // Try File System Access API (showSaveFilePicker)
        if (typeof window !== "undefined" && (window as any).showSaveFilePicker) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: fname,
              types: [{ description: "JSON Backup", accept: { "application/json": [".json"] } }],
            })
            const writable = await handle.createWritable()
            await writable.write(blob)
            await writable.close()
            setStatusMsg("สร้าง Backup สำเร็จ และบันทึกไฟล์แล้ว")
            setStatusType("success")
            setBackupLoading(false)
            return
          } catch (pickerErr: any) {
            if (pickerErr.name === "AbortError") {
              setBackupLoading(false)
              return
            }
          }
        }
        // Fallback: <a download>
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fname
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setStatusMsg("สร้าง Backup สำเร็จ ไฟล์กำลังดาวน์โหลด")
        setStatusType("success")
      } catch (err: any) {
        console.error(err)
        setStatusMsg("เกิดข้อผิดพลาด: " + (err?.response?.data?.error || err.message))
        setStatusType("error")
      }
      setBackupLoading(false)
    }

    const handleFileSelect = async () => {
      // Try File System Access API
      if (typeof window !== "undefined" && (window as any).showOpenFilePicker) {
        try {
          const [handle] = await (window as any).showOpenFilePicker({
            types: [{ description: "JSON Backup", accept: { "application/json": [".json"] } }],
            multiple: false,
          })
          const file = await handle.getFile()
          await processSelectedFile(file)
          return
        } catch (pickerErr: any) {
          if (pickerErr.name === "AbortError") return
        }
      }
      // Fallback: use hidden file input
      fileInputRef.current?.click()
    }

    const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) await processSelectedFile(file)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const processSelectedFile = async (file: File) => {
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        if (!parsed?.metadata || !parsed?.data) {
          setStatusMsg("ไฟล์ไม่ถูกต้อง: ไม่พบ metadata หรือ data")
          setStatusType("error")
          return
        }
        setRestoreFile(file)
        setPreviewData(parsed.metadata)
        setStatusMsg("")
        setStatusType("")
      } catch (err) {
        setStatusMsg("ไม่สามารถอ่านไฟล์ได้ กรุณาเลือกไฟล์ .json ที่ถูกต้อง")
        setStatusType("error")
      }
    }

    const handleRestore = async () => {
      if (!restoreFile) return
      const confirmed = window.confirm(
        "คำเตือน: การกู้คืนข้อมูลจะลบข้อมูลปัจจุบันทั้งหมดแล้วแทนที่ด้วยข้อมูลจาก Backup\n\nคุณแน่ใจหรือไม่?"
      )
      if (!confirmed) return
      const confirmed2 = window.confirm(
        "ยืนยันอีกครั้ง: ข้อมูลปัจจุบันจะถูกลบทั้งหมด และแทนที่ด้วยข้อมูลจากไฟล์ Backup\n\nกด OK เพื่อดำเนินการ"
      )
      if (!confirmed2) return

      setRestoreLoading(true)
      setStatusMsg("กำลังกู้คืนข้อมูล...")
      setStatusType("")
      try {
        const text = await restoreFile.text()
        const parsed = JSON.parse(text)
        const targetCompany = localStorage.getItem("company_") || ""
        const restorePayload = targetCompany ? { ...parsed, targetCompany } : parsed
        const res = await axios.post("/api/backup/restore", restorePayload, {
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        })
        if (res.data.success) {
          setStatusMsg("กู้คืนข้อมูลสำเร็จ!")
          setStatusType("success")
          setPreviewData(null)
          setRestoreFile(null)
          localStorage.removeItem("token")
          localStorage.removeItem("level_")
          localStorage.removeItem("person_")
          localStorage.removeItem("personid_")
          localStorage.removeItem("emp_permissions")
          window.setTimeout(() => {
            window.location.href = "/"
          }, 1200)
        } else {
          setStatusMsg("เกิดข้อผิดพลาด: " + (res.data.error || "Unknown error"))
          setStatusType("error")
        }
      } catch (err: any) {
        console.error(err)
        setStatusMsg("เกิดข้อผิดพลาด: " + (err?.response?.data?.error || err.message))
        setStatusType("error")
      }
      setRestoreLoading(false)
    }

    return (
      <div className="col-sm-10" style={{ fontFamily: "kanit" }}>
        {/* === สร้าง Backup === */}
        <div className="card p-3 mb-3 shadow-sm">
          <h6 style={{ fontWeight: "bold" }}><i className="bi bi-cloud-arrow-up"></i> สร้าง Backup</h6>
          <div className="form-check mt-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="backupAll"
              checked={backupAll}
              onChange={(e) => setBackupAll(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="backupAll" style={{ fontSize: 13 }}>
              แบ็คอัพทั้งหมด (ไม่จำกัดช่วงเวลา)
            </label>
          </div>
          {!backupAll && (
            <div className="row mt-2">
              <div className="col-auto">
                <label style={{ fontSize: 12 }}>วันเริ่มต้น</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ fontSize: 12 }}
                />
              </div>
              <div className="col-auto">
                <label style={{ fontSize: 12 }}>วันสิ้นสุด</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>
          )}
          <button
            className="btn btn-success btn-sm mt-3"
            style={{ fontFamily: "kanit", width: 200 }}
            onClick={handleCreateBackup}
            disabled={backupLoading || (!backupAll && (!startDate || !endDate))}
          >
            {backupLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status"></span>กำลังสร้าง...</>
            ) : (
              <><i className="bi bi-download me-1"></i> สร้าง Backup</>
            )}
          </button>
        </div>

        {/* === ตั้งเวลา Auto Backup === */}
        <div className="card p-3 mb-3 shadow-sm">
          <h6 style={{ fontWeight: "bold" }}><i className="bi bi-clock-history"></i> ตั้งเวลา Backup อัตโนมัติ</h6>
          <div className="row mt-2 align-items-end">
            <div className="col-auto">
              <label style={{ fontSize: 12 }}>ความถี่</label>
              <select
                className="form-select form-select-sm"
                style={{ fontSize: 12, width: 200 }}
                value={autoInterval}
                onChange={(e) => handleIntervalChange(e.target.value)}
              >
                {intervalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <button
                className="btn btn-outline-secondary btn-sm"
                style={{ fontFamily: "kanit", fontSize: 12 }}
                onClick={handleSelectAutoBackupDir}
              >
                <i className="bi bi-folder me-1"></i> เลือกโฟลเดอร์บันทึก
              </button>
            </div>
            <div className="col-auto">
              <button
                className="btn btn-outline-primary btn-sm"
                style={{ fontFamily: "kanit", fontSize: 12 }}
                onClick={() => setShowTableModal(true)}
              >
                <i className="bi bi-table me-1"></i> เลือกตาราง ({selectedAutoTables.length}/{ALL_TABLES.length})
              </button>
            </div>
            {autoInterval !== "off" && (
              <div className="col-auto">
                <button
                  className="btn btn-warning btn-sm"
                  style={{ fontFamily: "kanit", fontSize: 12 }}
                  onClick={runAutoBackup}
                  disabled={autoBackupRunning}
                >
                  {autoBackupRunning ? (
                    <><span className="spinner-border spinner-border-sm me-1" role="status"></span>กำลังทำงาน...</>
                  ) : (
                    <><i className="bi bi-play-fill me-1"></i> Backup ตอนนี้</>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="mt-2" style={{ fontSize: 11 }}>
            {autoBackupDirName && (
              <div><span className="text-muted">โฟลเดอร์:</span> <strong>{autoBackupDirName}</strong></div>
            )}
            {lastAutoBackup && (
              <div><span className="text-muted">Backup อัตโนมัติล่าสุด:</span> <strong>{lastAutoBackup}</strong></div>
            )}
            {autoInterval !== "off" && (
              <div className="mt-1">
                <span className="badge bg-success" style={{ fontSize: 10 }}>
                  <i className="bi bi-check-circle me-1"></i>เปิดใช้งาน — {intervalOptions.find(o => o.value === autoInterval)?.label}
                </span>
              </div>
            )}
          </div>
          <div className="mt-2">
            <button
              className="btn btn-info btn-sm"
              style={{ fontFamily: "kanit", fontSize: 12 }}
              onClick={() => setShowHistoryModal(true)}
            >
              <i className="bi bi-table me-1"></i> ดูตารางการ Backup
            </button>
          </div>
          <div className="mt-2" style={{ fontSize: 11, color: "gray" }}>
            <i className="bi bi-info-circle me-1"></i>
            Auto Backup จะทำงานอัตโนมัติตลอดเวลาแม้เปลี่ยนหน้า ไฟล์จะบันทึกลงเซิร์ฟเวอร์ (uploads/backups)
          </div>
        </div>

        {/* === Backup เมื่อปิดบิลประจำวัน === */}
        <div className="card p-3 mb-3 shadow-sm">
          <div className="d-flex align-items-start justify-content-between">
            <div>
              <h6 style={{ fontWeight: "bold" }}><i className="bi bi-lock-fill"></i> Backup เมื่อปิดบิลประจำวัน</h6>
              <div style={{ fontSize: 11, color: "gray" }}>
                เมื่อกดปุ่ม <strong>ปิดบิล (ล็อก)</strong> ในหน้ารายงาน ระบบจะสำรองข้อมูลให้ทันทีโดยอัตโนมัติ
              </div>
            </div>
            <div className="form-check form-switch" style={{ transform: "scale(1.2)", marginTop: 4 }}>
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="dailyCloseBackupSwitch"
                checked={dailyCloseBackup}
                onChange={(e) => handleDailyCloseBackupChange(e.target.checked)}
              />
            </div>
          </div>
          <div className="mt-2" style={{ fontSize: 11 }}>
            <span className={`badge ${dailyCloseBackup ? "bg-success" : "bg-secondary"}`} style={{ fontSize: 10 }}>
              <i className={`bi ${dailyCloseBackup ? "bi-check-circle" : "bi-pause-circle"} me-1`}></i>
              {dailyCloseBackup ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </span>
            {lastDailyCloseBackup && (
              <span className="ms-2"><span className="text-muted">ปิดบิลล่าสุดสำรองเมื่อ:</span> <strong>{lastDailyCloseBackup}</strong></span>
            )}
          </div>
          <div className="mt-2" style={{ fontSize: 11, color: "gray" }}>
            <i className="bi bi-info-circle me-1"></i>
            ใช้โฟลเดอร์และรายการตารางชุดเดียวกับ Auto Backup ด้านบน · ไฟล์ขึ้นต้นด้วย <code>dailyclose_backup_</code> และเก็บไว้ 90 วัน
            (ยาวกว่า Auto Backup ที่เก็บ 48 ชั่วโมง) หากสำรองไม่สำเร็จ บิลจะยังถูกปิดตามปกติและแจ้งให้ลองใหม่ในหน้าปิดบิล
          </div>
        </div>

        {/* === Modal ตาราง Backup === */}
        {showHistoryModal && (
          <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header py-2">
                  <h6 className="modal-title" style={{ fontFamily: "kanit", fontWeight: "bold" }}>
                    <i className="bi bi-table me-2"></i>ตารางประวัติการ Backup
                  </h6>
                  <button type="button" className="btn-close" onClick={() => setShowHistoryModal(false)}></button>
                </div>
                <div className="modal-body" style={{ fontFamily: "kanit", maxHeight: "60vh", overflowY: "auto" }}>
                  {backupHistory.length === 0 ? (
                    <div className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                      <i className="bi bi-inbox" style={{ fontSize: 30 }}></i>
                      <div className="mt-2">ยังไม่มีประวัติการ Backup อัตโนมัติ</div>
                    </div>
                  ) : (
                    <table className="table table-sm table-striped table-hover" style={{ fontSize: 11 }}>
                      <thead className="table-dark">
                        <tr>
                          <th style={{ width: 30 }}>#</th>
                          <th>วันที่/เวลา</th>
                          <th style={{ width: 80 }}>ประเภท</th>
                          <th>ชื่อไฟล์</th>
                          <th>โฟลเดอร์</th>
                          <th style={{ width: 60 }}>จำนวน</th>
                          <th>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backupHistory.map((h: any, i: number) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{h.date}</td>
                            <td>
                              {h.kind === "dailyclose" ? (
                                <span className="badge bg-warning text-dark" style={{ fontSize: 10 }} title={h.note || ""}>ปิดบิล</span>
                              ) : h.kind === "auto" ? (
                                <span className="badge bg-primary" style={{ fontSize: 10 }}>ตามเวลา</span>
                              ) : (
                                <span className="badge bg-secondary" style={{ fontSize: 10 }}>สั่งเอง</span>
                              )}
                            </td>
                            <td style={{ wordBreak: "break-all" }}>{h.file}</td>
                            <td>{h.folder}</td>
                            <td className="text-center">{h.records?.toLocaleString?.() ?? h.records}</td>
                            <td>
                              {h.status === "สำเร็จ" ? (
                                <span className="badge bg-success" style={{ fontSize: 10 }}>{h.status}</span>
                              ) : (
                                <span className="badge bg-danger" style={{ fontSize: 10 }}>{h.status}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="modal-footer py-2">
                  {backupHistory.length > 0 && (
                    <button
                      className="btn btn-outline-danger btn-sm me-auto"
                      style={{ fontFamily: "kanit", fontSize: 11 }}
                      onClick={() => {
                        if (window.confirm("ล้างประวัติทั้งหมด?")) clearBackupHistory()
                      }}
                    >
                      <i className="bi bi-trash me-1"></i> ล้างประวัติ
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                    onClick={() => setShowHistoryModal(false)}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Modal เลือกตาราง === */}
        {showTableModal && (
          <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header py-2">
                  <h6 className="modal-title" style={{ fontFamily: "kanit", fontWeight: "bold" }}>
                    <i className="bi bi-database me-2"></i>เลือกตารางข้อมูลสำหรับ Auto Backup
                  </h6>
                  <button type="button" className="btn-close" onClick={() => setShowTableModal(false)}></button>
                </div>
                <div className="modal-body" style={{ fontFamily: "kanit", maxHeight: "60vh", overflowY: "auto" }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ fontSize: 12 }}>
                      เลือกแล้ว <strong>{selectedAutoTables.length}</strong> / {ALL_TABLES.length} ตาราง
                    </span>
                    <div>
                      <button className="btn btn-outline-success btn-sm me-1" style={{ fontSize: 11, fontFamily: "kanit" }} onClick={selectAllTables}>
                        <i className="bi bi-check-all me-1"></i>เลือกทั้งหมด
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" style={{ fontSize: 11, fontFamily: "kanit" }} onClick={deselectAllTables}>
                        <i className="bi bi-x-lg me-1"></i>ยกเลิกทั้งหมด
                      </button>
                    </div>
                  </div>
                  <div className="row">
                    {ALL_TABLES.map((tbl) => (
                      <div key={tbl} className="col-6 col-md-4 col-lg-3 mb-1">
                        <div className="form-check" style={{ fontSize: 11 }}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`tbl_${tbl}`}
                            checked={selectedAutoTables.includes(tbl)}
                            onChange={() => toggleTable(tbl)}
                          />
                          <label className="form-check-label" htmlFor={`tbl_${tbl}`} style={{ cursor: "pointer" }}>
                            {tbl}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <span style={{ fontSize: 11, color: "gray" }} className="me-auto">
                    <i className="bi bi-info-circle me-1"></i>การตั้งค่าจะถูกบันทึกอัตโนมัติ
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                    onClick={() => setShowTableModal(false)}
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === อัพเดทเวอร์ชันโปรแกรม === */}
        <div className="card p-3 mb-3 shadow-sm">
          <h6 style={{ fontWeight: "bold" }}>
            <i className="bi bi-cloud-download"></i> อัพเดทเวอร์ชันโปรแกรม
          </h6>
          <p style={{ fontSize: 12, color: "gray", marginBottom: 8 }}>
            ระบบจะสำรองข้อมูลอัตโนมัติก่อนอัพเดททุกครั้ง
          </p>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <button
              className="btn btn-outline-primary btn-sm"
              style={{ fontFamily: "kanit", fontSize: 12 }}
              onClick={checkVersion}
              disabled={versionLoading || updating}
            >
              <i className="bi bi-search me-1"></i>
              {versionLoading ? "กำลังตรวจสอบ..." : "ตรวจสอบเวอร์ชัน"}
            </button>
            {versionInfo && (
              <>
                <span style={{ fontSize: 12 }}>
                  ปัจจุบัน: <strong>{versionInfo.current}</strong>
                </span>
                <span style={{ fontSize: 12 }}>
                  ล่าสุด: <strong>{versionInfo.latest || "-"}</strong>
                </span>
                {versionInfo.hasUpdate && versionInfo.latest && (
                  <button
                    className="btn btn-success btn-sm"
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                    onClick={() => runUpdate(versionInfo.latest!)}
                    disabled={updating}
                  >
                    <i className="bi bi-arrow-up-circle me-1"></i>
                    {updating ? "กำลังอัพเดท..." : `อัพเดทเป็น ${versionInfo.latest}`}
                  </button>
                )}
                {!versionInfo.hasUpdate && versionInfo.latest && !versionInfo.error && (
                  <span className="badge bg-success" style={{ fontSize: 10 }}>
                    <i className="bi bi-check-circle me-1"></i>เป็นเวอร์ชันล่าสุดแล้ว
                  </span>
                )}
                {versionInfo.error && (
                  <span className="text-danger" style={{ fontSize: 11 }}>
                    <i className="bi bi-exclamation-triangle me-1"></i>{versionInfo.error}
                  </span>
                )}
              </>
            )}
          </div>
          {updateLog && (
            <pre className="mt-2 p-2" style={{
              fontSize: 10,
              maxHeight: 200,
              overflowY: "auto",
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              borderRadius: 4,
              fontFamily: "Consolas, monospace",
            }}>{updateLog}</pre>
          )}

          {/* Rollback section */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #eee" }}>
            <button
              className="btn btn-outline-warning btn-sm"
              style={{ fontFamily: "kanit", fontSize: 12 }}
              onClick={() => {
                const next = !showRollback
                setShowRollback(next)
                if (next) loadRollbackTags()
              }}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>
              {showRollback ? "ซ่อน Rollback" : "ย้อนเวอร์ชัน (Rollback)"}
            </button>

            {showRollback && (
              <div className="mt-2 p-2" style={{ background: "#fff8e1", borderRadius: 4 }}>
                <p style={{ fontSize: 11, color: "#b86a00", marginBottom: 8 }}>
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  <b>คำเตือน:</b> การย้อนเวอร์ชันอาจทำให้ข้อมูลบางส่วนหาย ถ้าเวอร์ชันเก่าไม่มี column ที่เวอร์ชันใหม่เพิ่มเข้ามา ระบบจะ backup DB ให้อัตโนมัติก่อน rollback
                </p>
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  <select
                    className="form-select form-select-sm"
                    style={{ fontSize: 12, maxWidth: 200 }}
                    value={selectedRollbackTag}
                    onChange={(e) => setSelectedRollbackTag(e.target.value)}
                    disabled={rollingBack}
                  >
                    <option value="">-- เลือกเวอร์ชัน --</option>
                    {rollbackTags.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-warning btn-sm"
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                    onClick={runRollback}
                    disabled={rollingBack || !selectedRollbackTag}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                    {rollingBack ? "กำลังย้อน..." : "ยืนยัน Rollback"}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={loadRollbackTags}
                    disabled={rollingBack}
                  >
                    <i className="bi bi-arrow-repeat"></i>
                  </button>
                </div>
                {rollbackLog && (
                  <pre className="mt-2 p-2" style={{
                    fontSize: 10, maxHeight: 150, overflowY: "auto",
                    backgroundColor: "#1e1e1e", color: "#d4d4d4",
                    borderRadius: 4, fontFamily: "Consolas, monospace",
                  }}>{rollbackLog}</pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === Cloudflare Tunnel === */}
        {(() => {
          const running = !!tunnelStatus?.running
          const hasToken = !!tunnelStatus?.hasToken
          const available = tunnelStatus?.available !== false
          /** tunnel รันอยู่ในแท็บเล็ตเครื่องนี้ ไม่ใช่บนเครื่องคอมพิวเตอร์ */
          const onDevice = tunnelStatus?.mode === "android"
          /** โหมดลิงก์ชั่วคราวไม่ต้องมี token — ปุ่มเชื่อมต่อจึงกดได้เลย */
          const readyToStart = onDevice ? tunnelDeviceMode === "quick" || !!tunnelToken || hasToken : !!tunnelToken || hasToken
          const stateLabel = running
            ? "เชื่อมต่ออยู่"
            : hasToken || (onDevice && tunnelStatus?.installed)
              ? "พร้อมเชื่อมต่อ"
              : "ยังไม่ได้ตั้งค่า"
          const stateColor = running ? "#147F56" : hasToken ? "#d97706" : "#64748b"
          const stateBg = running ? "#D3F0E2" : hasToken ? "#fef3c7" : "#e2e8f0"
          const hostname = tunnelStatus?.hostname || ""

          return (
            <div className="card mb-3 shadow-sm" style={{ overflow: "hidden", borderRadius: 12, border: "1px solid #e5e7eb" }}>
              {/* Hero header */}
              <div style={{
                padding: "16px 20px",
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
                    <path fill="#fff" d="M44.5 36.6c.4-1.3.5-2.7.2-4-1-4.6-5.1-7.9-9.8-7.9-3.5 0-6.7 1.8-8.5 4.7-1-.7-2.2-1-3.5-1-3.4 0-6.1 2.7-6.1 6.1 0 .5.1 1 .2 1.5-2.6.7-4.5 3.1-4.5 5.9 0 3.4 2.7 6.2 6.2 6.2h25.4c2.9 0 5.2-2.4 5.2-5.2 0-2.6-1.9-4.7-4.4-5.2z"/>
                    <path fill="#fde68a" d="M50.2 26.5c-.2 0-.5 0-.7.1.4 1.1.6 2.2.6 3.4 0 .9-.1 1.7-.3 2.5 1.7.7 2.9 2.4 2.9 4.4 0 .5-.1 1-.2 1.5h.4c2.6 0 4.7-2.1 4.7-4.7 0-3.9-3.3-7.2-7.4-7.2z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 0.4, textTransform: "uppercase" }}>
                    Cloudflare Tunnel
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "kanit" }}>
                    การเข้าถึงจากภายนอกแบบปลอดภัย
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                    {onDevice ? (
                      <>
                        รันในแท็บเล็ตเครื่องนี้ ผ่าน server ในเครื่องที่พอร์ต{" "}
                        <code style={{ background: "rgba(0,0,0,0.18)", padding: "1px 6px", borderRadius: 4 }}>
                          {tunnelStatus?.port || 8787}
                        </code>
                      </>
                    ) : (
                      <>
                        รันผ่าน Podman ด้วย image <code style={{ background: "rgba(0,0,0,0.18)", padding: "1px 6px", borderRadius: 4 }}>cloudflare/cloudflared:latest</code>
                      </>
                    )}
                  </div>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: stateBg, color: stateColor,
                  padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.4)",
                  whiteSpace: "nowrap",
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: stateColor,
                    boxShadow: running ? `0 0 0 0 ${stateColor}` : "none",
                    animation: running ? "tunnelPulse 1.6s infinite" : "none",
                  }} />
                  {stateLabel}
                </div>
              </div>

              <style>{`
                @keyframes tunnelPulse {
                  0% { box-shadow: 0 0 0 0 rgba(42, 106, 170,0.6); }
                  70% { box-shadow: 0 0 0 8px rgba(42, 106, 170,0); }
                  100% { box-shadow: 0 0 0 0 rgba(42, 106, 170,0); }
                }
              `}</style>

              <div style={{ padding: 18 }}>
                {!available && (
                  <div className="alert alert-warning py-2 mb-3" style={{ fontSize: 12 }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {onDevice
                      ? "แอปเวอร์ชันนี้ยังไม่ได้ฝังส่วนขยาย tunnel มาด้วย ต้องติดตั้ง .apk ที่ build หลังดาวน์โหลด cloudflared แล้ว"
                      : "ยังไม่พบ host bridge หรือ tunnel script บนเครื่องนี้ ฟีเจอร์นี้ต้องติดตั้งผ่าน SmileStore POS Installer ก่อน"}
                    {tunnelStatus?.error && (
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.8 }}>{tunnelStatus.error}</div>
                    )}
                  </div>
                )}

                {onDevice && available && tunnelStatus?.serverReady === false && (
                  <div className="alert alert-info py-2 mb-3" style={{ fontSize: 12 }}>
                    <i className="bi bi-hourglass-split me-2"></i>
                    ระบบในเครื่องยังเตรียมข้อมูลไม่เสร็จ — รอสักครู่แล้วกดรีเฟรชสถานะ
                  </div>
                )}

                {/* Connected state */}
                {running ? (
                  <div>
                    <div style={{
                      background: "#F3F8FC", border: "1px solid #CCDFF1",
                      padding: 14, borderRadius: 10, marginBottom: 14,
                    }}>
                      <div style={{ fontSize: 11, color: "#173F6B", marginBottom: 4, fontWeight: 600 }}>
                        Public URL
                      </div>
                      {hostname ? (
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <code style={{ fontSize: 13, color: "#102C4C", background: "#E5EEF8", padding: "4px 10px", borderRadius: 6 }}>
                            https://{hostname}
                          </code>
                          <a
                            className="btn btn-sm btn-outline-success"
                            style={{ fontSize: 11 }}
                            href={`https://${hostname}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bi bi-box-arrow-up-right me-1"></i>เปิด
                          </a>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ fontSize: 11 }}
                            onClick={() => navigator.clipboard?.writeText(`https://${hostname}`)}
                          >
                            <i className="bi bi-clipboard me-1"></i>คัดลอก
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "#1E5088" }}>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          กำลังลงทะเบียน tunnel กับ Cloudflare เดี๋ยว URL จะปรากฏที่นี่
                        </div>
                      )}

                      {onDevice && tunnelStatus?.tunnelMode === "quick" && hostname && (
                        <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 8, lineHeight: 1.6 }}>
                          <i className="bi bi-info-circle me-1"></i>
                          ที่อยู่นี้เป็นแบบชั่วคราว — จะเปลี่ยนเป็นที่อยู่ใหม่ทุกครั้งที่ตัดการเชื่อมต่อแล้วเปิดใหม่
                          ถ้าต้องการที่อยู่คงที่ ให้เปลี่ยนไปใช้ &laquo;โดเมนของร้าน&raquo;
                        </div>
                      )}
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-warning btn-sm"
                        style={{ fontFamily: "kanit", fontSize: 12 }}
                        onClick={() => tunnelAction("restart")}
                        disabled={tunnelBusy}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        {tunnelPhase === "restarting" ? "กำลังรีสตาร์ต..." : "รีสตาร์ต"}
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        style={{ fontFamily: "kanit", fontSize: 12 }}
                        onClick={() => tunnelAction("stop")}
                        disabled={tunnelBusy}
                      >
                        <i className="bi bi-stop-circle me-1"></i>
                        {tunnelPhase === "stopping" ? "กำลังหยุด..." : "ตัดการเชื่อมต่อ"}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm ms-auto"
                        style={{ fontFamily: "kanit", fontSize: 12 }}
                        onClick={loadTunnelStatus}
                        disabled={tunnelBusy}
                        title="รีเฟรชสถานะ"
                      >
                        <i className="bi bi-arrow-repeat"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Configuration state */
                  <div>
                    {onDevice && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                          เลือกวิธีแชร์
                        </div>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {([
                            {
                              key: "quick" as const,
                              title: "ลิงก์ชั่วคราว",
                              detail: "ไม่ต้องมีบัญชี Cloudflare · ได้ลิงก์ทันที · ที่อยู่เปลี่ยนทุกครั้งที่เปิดใหม่",
                            },
                            {
                              key: "token" as const,
                              title: "โดเมนของร้าน",
                              detail: "ที่อยู่คงที่ตลอด · ต้องมีบัญชี Cloudflare และ Tunnel token",
                            },
                          ]).map((option) => {
                            const active = tunnelDeviceMode === option.key
                            return (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() => setTunnelDeviceMode(option.key)}
                                disabled={tunnelBusy || !available}
                                style={{
                                  flex: "1 1 220px", textAlign: "left", cursor: "pointer",
                                  padding: "10px 12px", borderRadius: 10,
                                  border: active ? "2px solid #ea580c" : "1px solid #e5e7eb",
                                  background: active ? "#fff7ed" : "#fff",
                                }}
                              >
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", fontFamily: "kanit" }}>
                                  <i className={`bi bi-${active ? "record-circle-fill" : "circle"} me-2`} style={{ color: active ? "#ea580c" : "#94a3b8" }}></i>
                                  {option.title}
                                </div>
                                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
                                  {option.detail}
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        <div className="alert alert-warning py-2 mb-3" style={{ fontSize: 11, lineHeight: 1.7 }}>
                          <i className="bi bi-shield-exclamation me-2"></i>
                          ลิงก์ที่ได้เปิดระบบขายของร้านสู่อินเทอร์เน็ต ใครมีลิงก์ก็เปิดหน้าเข้าสู่ระบบได้
                          ควรตั้งรหัสผ่านผู้ใช้ให้แข็งแรง และปิดการเชื่อมต่อเมื่อไม่ได้ใช้
                          <div style={{ marginTop: 4 }}>
                            แท็บเล็ตต้องเปิดแอปค้างไว้ (ย่อลงได้) ระบบจะแสดงแถบแจ้งเตือนตลอดเวลาที่เปิดให้เข้าจากภายนอก
                          </div>
                        </div>
                      </>
                    )}

                    {(!onDevice || tunnelDeviceMode === "token") && (
                    <>
                    <ol style={{ fontSize: 12, color: "#475569", paddingLeft: 18, marginBottom: 12 }}>
                      <li>เปิด <a href="https://one.dash.cloudflare.com" target="_blank" rel="noopener noreferrer">Cloudflare Zero Trust Dashboard</a> &raquo; Networks &raquo; Tunnels</li>
                      <li>สร้าง/เลือก tunnel แล้วคัดลอก <strong>Tunnel token</strong> (สตริงยาวที่ขึ้นต้นด้วย <code>eyJ</code>)</li>
                      {onDevice ? (
                        <li>
                          ตั้ง Public hostname ให้ชี้ไปที่ service{" "}
                          <code>http://127.0.0.1:{tunnelStatus?.port || 8787}</code>
                          <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>
                            ต้องเป็นตัวเลข <code>127.0.0.1</code> เท่านั้น ห้ามใช้คำว่า <code>localhost</code> —
                            ตัว cloudflared บน Android แปลงชื่อไม่ได้ แล้วจะขึ้น 502 ทั้งที่ทุกอย่างตั้งถูก
                          </div>
                        </li>
                      ) : null}
                      <li>วาง token ในช่องด้านล่างแล้วกด <strong>เชื่อมต่อ</strong></li>
                    </ol>

                    <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Tunnel Token
                    </label>
                    <div className="d-flex gap-2 mt-1">
                      <div style={{ flex: 1, position: "relative" }}>
                        <input
                          type="password"
                          className="form-control"
                          style={{ fontSize: 12, fontFamily: "monospace", paddingRight: 80 }}
                          placeholder={hasToken ? "•••••• (ใช้ token ที่บันทึกไว้)" : "eyJhIjoi..."}
                          value={tunnelToken}
                          onChange={(e) => setTunnelToken(e.target.value)}
                          disabled={tunnelBusy || !available}
                        />
                        <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ fontSize: 10, padding: "2px 8px" }}
                            disabled={tunnelBusy || !available}
                            onClick={async () => {
                              try {
                                const text = await navigator.clipboard?.readText()
                                if (text) setTunnelToken(text.trim())
                              } catch {}
                            }}
                          >
                            <i className="bi bi-clipboard"></i> วาง
                          </button>
                          {tunnelToken && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              style={{ fontSize: 10, padding: "2px 8px" }}
                              onClick={() => setTunnelToken("")}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: 10 }}>
                      วางเฉพาะ token เท่านั้น ไม่ต้องวางคำสั่ง <code>cloudflared tunnel run</code>
                      {hasToken && " · ถ้าใช้ token เดิม ปล่อยช่องนี้ว่างได้"}
                    </div>
                    </>
                    )}

                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-success"
                        style={{ fontFamily: "kanit", fontSize: 13, minWidth: 160 }}
                        onClick={() => tunnelAction("start", tunnelToken || undefined)}
                        disabled={tunnelBusy || !available || !readyToStart}
                      >
                        {tunnelBusy ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                            {tunnelPhase === "starting" ? "กำลังเชื่อมต่อ..." : "กำลังทำงาน..."}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-play-circle-fill me-2"></i>
                            เชื่อมต่อ
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm ms-auto"
                        style={{ fontFamily: "kanit", fontSize: 12 }}
                        onClick={loadTunnelStatus}
                        disabled={tunnelBusy}
                      >
                        <i className="bi bi-arrow-repeat"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Live logs */}
                {available && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px dashed #e5e7eb" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                      style={{ fontSize: 11, color: "#475569" }}
                      onClick={async () => {
                        const next = !tunnelLogOpen
                        setTunnelLogOpen(next)
                        if (next) await loadTunnelLog()
                      }}
                    >
                      <i className={`bi bi-chevron-${tunnelLogOpen ? "down" : "right"} me-1`}></i>
                      {onDevice ? "บันทึกการทำงาน (cloudflared)" : "Container logs (cloudflared)"}
                    </button>
                    {tunnelLogOpen && (
                      <div className="mt-2">
                        <div className="d-flex justify-content-end mb-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ fontSize: 10 }}
                            onClick={loadTunnelLog}
                          >
                            <i className="bi bi-arrow-repeat me-1"></i>รีเฟรช
                          </button>
                        </div>
                        <pre style={{
                          fontSize: 10, maxHeight: 220, overflowY: "auto",
                          backgroundColor: "#0f172a", color: "#e2e8f0",
                          borderRadius: 6, padding: 10,
                          fontFamily: "Consolas, monospace",
                          margin: 0,
                        }}>{tunnelLog || "ยังไม่มี log (container อาจยังไม่ได้เริ่ม)"}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* === OneDrive Backup Sync === */}
        <div className="card p-3 mb-3 shadow-sm">
          <h6 style={{ fontWeight: "bold" }}>
            <i className="bi bi-cloud-arrow-up"></i> Backup สำรองขึ้น OneDrive
          </h6>
          <p style={{ fontSize: 12, color: "gray", marginBottom: 8 }}>
            ซิงก์โฟลเดอร์ backup ไป OneDrive อัตโนมัติ เพื่อป้องกันข้อมูลหายหากฮาร์ดดิสก์เสีย
          </p>

          {!oneDriveStatus && (
            <div className="text-muted" style={{ fontSize: 11 }}>กำลังโหลด...</div>
          )}

          {oneDriveStatus?.error && (
            <div className="alert alert-warning py-2 mb-2" style={{ fontSize: 11 }}>
              <i className="bi bi-exclamation-triangle me-1"></i>
              ต้องติดตั้งผ่าน SmileStore POS Installer จึงจะใช้งานได้จริง (แสดงเป็นตัวอย่าง UI)
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.75 }}>{oneDriveStatus.error}</div>
            </div>
          )}

          {oneDriveStatus && (
            <>
              <div className="mb-2" style={{ fontSize: 12 }}>
                สถานะ:{" "}
                {oneDriveStatus.isLinked ? (
                  <span className="badge bg-success" style={{ fontSize: 10 }}>
                    <i className="bi bi-check-circle me-1"></i>
                    เปิดใช้งาน → {oneDriveStatus.linkTarget}
                  </span>
                ) : (
                  <span className="badge bg-secondary" style={{ fontSize: 10 }}>ยังไม่ได้เปิด</span>
                )}
              </div>

              {!oneDriveStatus.isLinked && (
                <>
                  {(oneDriveStatus.detectedPaths?.length || 0) > 0 ? (
                    <div className="mb-2">
                      <label style={{ fontSize: 11 }}>เลือก OneDrive account:</label>
                      <select
                        className="form-select form-select-sm"
                        style={{ fontSize: 12 }}
                        value={selectedOneDrivePath}
                        onChange={(e) => setSelectedOneDrivePath(e.target.value)}
                        disabled={oneDriveBusy}
                      >
                        {(oneDriveStatus.detectedPaths || []).map((p: string) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="alert alert-warning py-2" style={{ fontSize: 11 }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      ไม่พบ OneDrive บนเครื่อง กรุณาติดตั้งและ sign-in ก่อน
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-sm"
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                    onClick={() => toggleOneDrive(true)}
                    disabled={oneDriveBusy || !(oneDriveStatus.detectedPaths?.length)}
                  >
                    <i className="bi bi-cloud-upload me-1"></i>
                    {oneDriveBusy ? "กำลังเปิด..." : "เปิดใช้ OneDrive Sync"}
                  </button>
                </>
              )}

              {oneDriveStatus.isLinked && (
                <button
                  className="btn btn-outline-danger btn-sm"
                  style={{ fontFamily: "kanit", fontSize: 12 }}
                  onClick={() => toggleOneDrive(false)}
                  disabled={oneDriveBusy}
                >
                  <i className="bi bi-cloud-slash me-1"></i>
                  {oneDriveBusy ? "กำลังปิด..." : "ปิด OneDrive Sync"}
                </button>
              )}
            </>
          )}
        </div>

        {/* === กู้คืน Restore === */}
        <div className="card p-3 mb-3 shadow-sm">
          <h6 style={{ fontWeight: "bold" }}><i className="bi bi-cloud-arrow-down"></i> กู้คืนข้อมูล (Restore)</h6>
          <p style={{ fontSize: 12, color: "gray" }}>เลือกไฟล์ .json ที่สร้างจากระบบ Backup เพื่อกู้คืนข้อมูล</p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileInputChange}
          />
          <button
            className="btn btn-outline-primary btn-sm"
            style={{ fontFamily: "kanit", width: 280 }}
            onClick={handleFileSelect}
            disabled={restoreLoading}
          >
            <i className="bi bi-folder2-open me-1"></i> เลือกไฟล์ Backup เพื่อกู้คืน
          </button>

          {previewData && (
            <div className="mt-3 p-3 border rounded" style={{ backgroundColor: "#f8f9fa" }}>
              <h6 style={{ fontSize: 14, fontWeight: "bold" }}>ข้อมูลไฟล์ Backup</h6>
              <div style={{ fontSize: 12 }}>
                <div><strong>วันที่สร้าง:</strong> {new Date(previewData.createdAt).toLocaleString("th-TH")}</div>
                <div><strong>ร้าน:</strong> {previewData.company}</div>
                <div><strong>ประเภท:</strong> {previewData.type === "full" ? "แบ็คอัพทั้งหมด" : "แบ็คอัพตามช่วงเวลา"}</div>
                {previewData.startDate && (
                  <div><strong>ช่วงเวลา:</strong> {previewData.startDate} ถึง {previewData.endDate}</div>
                )}
                <div className="mt-2"><strong>จำนวนข้อมูล:</strong></div>
                <div className="row" style={{ fontSize: 11 }}>
                  {previewData.recordCounts && Object.entries(previewData.recordCounts).filter(([, v]) => (v as number) > 0).map(([key, val]) => (
                    <div key={key} className="col-3">
                      <span className="text-muted">{key}:</span> <strong>{String(val)}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <button
                  className="btn btn-danger btn-sm me-2"
                  style={{ fontFamily: "kanit" }}
                  onClick={handleRestore}
                  disabled={restoreLoading}
                >
                  {restoreLoading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status"></span>กำลังกู้คืน...</>
                  ) : (
                    <><i className="bi bi-arrow-counterclockwise me-1"></i> ยืนยันกู้คืนข้อมูล</>
                  )}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontFamily: "kanit" }}
                  onClick={() => { setPreviewData(null); setRestoreFile(null) }}
                  disabled={restoreLoading}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* === Status Message === */}
        {statusMsg && (
          <div className={`alert ${statusType === "success" ? "alert-success" : statusType === "error" ? "alert-danger" : "alert-info"} py-2`} style={{ fontSize: 13 }}>
            {statusMsg}
          </div>
        )}

        <div style={{ fontSize: 11, color: "gray", marginTop: 10 }}>
          <i className="bi bi-info-circle me-1"></i>
          Backup จะบันทึกข้อมูลทั้งหมดของร้านค้าเป็นไฟล์ .json สามารถเลือก drive และ folder ที่ต้องการได้
        </div>
      </div>
    )
  }

  type LogbookEntry = {
    id: number
    company?: string | null
    personId?: number | null
    personName?: string | null
    actionType: string
    entityType: string
    entityId?: string | null
    entityCode?: string | null
    route?: string | null
    buttonLabel?: string | null
    status: string
    message?: string | null
    errorMessage?: string | null
    metadata?: any
    durationMs?: number | null
    sessionId?: string | null
    createdAt: string
  }

  // ผูกคอมพิวเตอร์สำหรับ Check-in / Check-out
  const CheckinDevicePage = () => {
    const [devices, setDevices] = useState<any[]>([])
    const [current, setCurrent] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [busy, setBusy] = useState(false)
    const [thisDeviceId, setThisDeviceId] = useState("")
    const [editing, setEditing] = useState<any>(null)
    const [editName, setEditName] = useState("")
    const [editBranch, setEditBranch] = useState("")

    const idcompany = typeof window !== 'undefined'
      ? (localStorage.getItem('ci_') || localStorage.getItem('company_') || '')
      : ''
    const personName = typeof window !== 'undefined' ? (localStorage.getItem('person_') || '') : ''

    const fmtDate = (d: string | null | undefined) => {
      if (!d) return '-'
      try {
        return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
      } catch { return '-' }
    }

    const load = async () => {
      if (!idcompany) return
      setLoading(true)
      try {
        const did = getDeviceId()
        setThisDeviceId(did)
        const res = await axios.get(`/api/checkin-device?idcompany=${encodeURIComponent(idcompany)}&deviceId=${encodeURIComponent(did)}`)
        setDevices(Array.isArray(res.data?.devices) ? res.data.devices : [])
        setCurrent(res.data?.current || null)
      } catch (e) {
        console.error('load devices failed', e)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => { load() }, [])

    const registerThis = async () => {
      if (!idcompany) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 16 }}>ไม่พบรหัสบริษัท กรุณาเข้าสู่ระบบใหม่</div>)
        return
      }
      setBusy(true)
      try {
        await axios.post('/api/checkin-device', {
          idcompany,
          deviceId: getDeviceId(),
          name: `เครื่อง ${new Date().toLocaleDateString('th-TH')}`,
          deviceType: getDeviceTypeShort(),
          registeredBy: personName,
        })
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 16 }}>✅ ผูกเครื่องนี้สำเร็จ</div>)
        await load()
      } catch (e: any) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 16 }}>{e?.response?.data?.error || 'เกิดข้อผิดพลาด'}</div>)
      } finally {
        setBusy(false)
      }
    }

    const removeDevice = async (device: any, isThis: boolean) => {
      const ok = window.confirm(isThis
        ? 'ต้องการลบสิทธิ์เครื่องนี้ใช่หรือไม่? เครื่องนี้จะลงเวลา Check-in/Check-out ไม่ได้จนกว่าจะผูกใหม่'
        : `ต้องการลบสิทธิ์ "${device?.name || device?.deviceId}" ใช่หรือไม่?`)
      if (!ok) return
      setBusy(true)
      try {
        await axios.delete(`/api/checkin-device?id=${device.id}`)
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 16 }}>ลบสิทธิ์เครื่องเรียบร้อย</div>)
        await load()
      } catch (e) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 16 }}>เกิดข้อผิดพลาดในการลบ</div>)
      } finally {
        setBusy(false)
      }
    }

    const toggleStatus = async (device: any) => {
      setBusy(true)
      try {
        await axios.put('/api/checkin-device', { id: device.id, status: device.status === 'active' ? 'disabled' : 'active' })
        await load()
      } catch {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 16 }}>ปรับสถานะไม่สำเร็จ</div>)
      } finally {
        setBusy(false)
      }
    }

    const openEdit = (device: any) => {
      setEditing(device)
      setEditName(device.name || "")
      setEditBranch(device.branch || "")
    }

    const saveEdit = async () => {
      if (!editing) return
      setBusy(true)
      try {
        await axios.put('/api/checkin-device', { id: editing.id, name: editName, branch: editBranch })
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 16 }}>บันทึกข้อมูลเครื่องเรียบร้อย</div>)
        setEditing(null)
        await load()
      } catch {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 16 }}>บันทึกไม่สำเร็จ</div>)
      } finally {
        setBusy(false)
      }
    }

    const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }
    const isRegistered = !!current

    return (
      <div style={{ fontFamily: "Kanit", width: "100%", padding: "8px 18px 24px 0", maxHeight: "82vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Monitor size={22} color="#0f766e" />
            <div style={{ fontFamily: "kanit_B", fontSize: 19, color: "#0f172a" }}>ผูกคอมพิวเตอร์สำหรับ Check-in / Check-out</div>
          </div>
          <button onClick={load} disabled={loading} type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0f766e", background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 10, padding: "6px 14px", cursor: "pointer" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> รีเฟรช
          </button>
        </div>

        {/* This computer card */}
        <div style={{ ...cardStyle, background: isRegistered ? "#EDF9F3" : "#fff7ed", border: isRegistered ? "1px solid #A9E1C6" : "1px solid #fed7aa", padding: 20, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {isRegistered
                  ? <CheckCircle2 size={20} color="#2A6AAA" />
                  : <AlertTriangle size={20} color="#ea580c" />}
                <span style={{ fontFamily: "kanit_B", fontSize: 17, color: isRegistered ? "#0F6845" : "#c2410c" }}>เครื่องนี้</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", marginBottom: 8, flexWrap: "wrap" }}>
                <span>Device ID:</span>
                <code style={{ background: "#fce7f3", color: "#9d174d", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{thisDeviceId || '...'}</code>
                <span style={{ color: "#94a3b8" }}>· {getDeviceType()}</span>
              </div>
              {isRegistered && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#334155" }}>
                  <span style={{ fontWeight: 600 }}>{current?.name}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: current?.status === 'active' ? "#0F6845" : "#b91c1c", background: current?.status === 'active' ? "#D3F0E2" : "#fee2e2", padding: "2px 10px", borderRadius: 100 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: current?.status === 'active' ? "#147F56" : "#dc2626" }} />
                    {current?.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
              )}
              {!isRegistered && (
                <div style={{ fontSize: 13, color: "#9a3412", maxWidth: 520 }}>
                  เครื่องนี้ยังไม่ได้ผูกกับระบบลงเวลา กดปุ่ม “ผูกเครื่องนี้” เพื่อให้พนักงานสามารถกด Check-in / Check-out จากเครื่องนี้ได้
                </div>
              )}
            </div>
            <div>
              {isRegistered ? (
                <button onClick={() => removeDevice(current, true)} disabled={busy} type="button"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>
                  <Trash2 size={15} /> ลบสิทธิ์เครื่องนี้
                </button>
              ) : (
                <button onClick={registerThis} disabled={busy} type="button"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#fff", background: "#0d9488", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}>
                  <Plus size={16} /> ผูกเครื่องนี้
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Authorized devices table */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#0f172a", marginBottom: 14 }}>
            เครื่องที่ได้รับอนุญาต ({devices.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#64748b", borderBottom: "2px solid #f1f5f9" }}>
                  <th style={{ padding: "10px 12px", fontWeight: 600 }}>ชื่อเครื่อง</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600 }}>สาขา</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600 }}>ประเภท</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600 }}>Device ID</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600 }}>สถานะ</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600 }}>ลงทะเบียนโดย</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600 }}>วันที่</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right" }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "28px 12px", textAlign: "center", color: "#94a3b8" }}>
                    {loading ? 'กำลังโหลด...' : 'ยังไม่มีเครื่องที่ได้รับอนุญาต'}
                  </td></tr>
                )}
                {devices.map((d) => {
                  const isThis = d.deviceId === thisDeviceId
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9", background: isThis ? "#f0fdfa" : "transparent" }}>
                      <td style={{ padding: "12px", color: "#0f172a", fontWeight: 500 }}>
                        {d.name || '-'}{isThis && <span style={{ color: "#0d9488", fontSize: 12, fontWeight: 600 }}> (เครื่องนี้)</span>}
                      </td>
                      <td style={{ padding: "12px", color: "#475569" }}>{d.branch || '–'}</td>
                      <td style={{ padding: "12px", color: "#475569" }}>{d.deviceType || 'Web'}</td>
                      <td style={{ padding: "12px" }}>
                        <code style={{ color: "#64748b", fontSize: 12 }}>{String(d.deviceId).slice(0, 18)}...</code>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: d.status === 'active' ? "#0F6845" : "#b91c1c", background: d.status === 'active' ? "#D3F0E2" : "#fee2e2", padding: "2px 10px", borderRadius: 100 }}>
                          {d.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#475569" }}>{d.registeredBy || '-'}</td>
                      <td style={{ padding: "12px", color: "#475569" }}>{fmtDate(d.createdAt)}</td>
                      <td style={{ padding: "12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button onClick={() => toggleStatus(d)} disabled={busy} type="button" title={d.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 8px", marginRight: 6, cursor: "pointer", color: d.status === 'active' ? "#147F56" : "#94a3b8" }}>
                          <Power size={14} />
                        </button>
                        <button onClick={() => openEdit(d)} disabled={busy} type="button"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", marginRight: 6, cursor: "pointer", color: "#475569", fontSize: 12 }}>
                          <Pencil size={13} /> แก้ไข
                        </button>
                        <button onClick={() => removeDevice(d, d.deviceId === thisDeviceId)} disabled={busy} type="button"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #fecaca", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#dc2626", fontSize: 12 }}>
                          <Trash2 size={13} /> ลบ
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit modal */}
        {editing && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1080 }}
            onClick={() => setEditing(null)}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, width: 420, maxWidth: "92vw", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 17, marginBottom: 16, color: "#0f172a" }}>แก้ไขข้อมูลเครื่อง</div>
              <label style={{ fontSize: 13, color: "#64748b" }}>ชื่อเครื่อง</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)}
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: "9px 12px", margin: "6px 0 14px", fontFamily: "Kanit", fontSize: 14 }} />
              <label style={{ fontSize: 13, color: "#64748b" }}>สาขา</label>
              <input value={editBranch} onChange={(e) => setEditBranch(e.target.value)}
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: "9px 12px", margin: "6px 0 20px", fontFamily: "Kanit", fontSize: 14 }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setEditing(null)} type="button" style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", cursor: "pointer", fontFamily: "Kanit" }}>ยกเลิก</button>
                <button onClick={saveEdit} disabled={busy} type="button" style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", cursor: "pointer", fontFamily: "Kanit", fontWeight: 600 }}>บันทึก</button>
              </div>
            </div>
          </div>
        )}
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const LogbookPage = () => {
    const todayInput = () => {
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      return now.toISOString().slice(0, 10)
    }

    const [logs, setLogs] = useState<LogbookEntry[]>([])
    const [actors, setActors] = useState<string[]>([])
    const [summary, setSummary] = useState<Record<string, number>>({})
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [errorText, setErrorText] = useState("")
    const [fromDate, setFromDate] = useState(todayInput())
    const [toDate, setToDate] = useState(todayInput())
    const [statusFilter, setStatusFilter] = useState("all")
    const [actionFilter, setActionFilter] = useState("all")
    const [entityFilter, setEntityFilter] = useState("all")
    const [personFilter, setPersonFilter] = useState("all")
    const [keyword, setKeyword] = useState("")
    const [page, setPage] = useState(1)
    const [selectedLog, setSelectedLog] = useState<LogbookEntry | null>(null)

    const limit = 100

    const actionOptions = [
      { value: "all", label: "ทุก Action" },
      { value: "save", label: "Save / บันทึก" },
      { value: "edit", label: "Edit / แก้ไข" },
      { value: "delete", label: "Delete / ลบ" },
      { value: "confirm", label: "Confirm / ยืนยัน" },
      { value: "cancel", label: "Cancel / ยกเลิก" },
      { value: "sync", label: "Sync" },
      { value: "import", label: "Import" },
      { value: "export", label: "Export" },
      { value: "blocked", label: "Blocked" },
    ]

    const entityOptions = [
      { value: "all", label: "ทุก Module" },
      { value: "sale", label: "ขายสินค้า" },
      { value: "receive", label: "รับสินค้า" },
      { value: "product", label: "สินค้า" },
      { value: "label", label: "ฉลากสินค้า" },
      { value: "customer", label: "ลูกค้า" },
      { value: "supplier", label: "ผู้ขาย" },
      { value: "setting", label: "ตั้งค่า" },
      { value: "sync", label: "Sync" },
      { value: "order", label: "สั่งซื้อ" },
      { value: "promotion", label: "โปรโมชัน" },
      { value: "report", label: "รายงาน" },
      { value: "management", label: "กำไร/ขาดทุน" },
    ]

    const statusConfig: Record<string, { label: string, color: string, bg: string, border: string, icon: React.ReactNode }> = {
      clicked: { label: "กดปุ่ม", color: "#1E5088", bg: "#F3F8FC", border: "#CCDFF1", icon: <Activity size={14} /> },
      success: { label: "สำเร็จ", color: "#0F6845", bg: "#EDF9F3", border: "#A9E1C6", icon: <CheckCircle2 size={14} /> },
      failed: { label: "ล้มเหลว", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", icon: <XCircle size={14} /> },
      cancelled: { label: "ยกเลิก", color: "#92400e", bg: "#fffbeb", border: "#fde68a", icon: <Ban size={14} /> },
      blocked: { label: "ถูกบล็อก", color: "#7c2d12", bg: "#fff7ed", border: "#fed7aa", icon: <AlertTriangle size={14} /> },
    }

    const cardStyle: React.CSSProperties = {
      background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
      boxShadow: "0 4px 18px rgba(15,23,42,0.06)",
    }

    const inputStyle: React.CSSProperties = {
      height: 38, border: "1px solid #cbd5e1", borderRadius: 8,
      padding: "0 10px", fontFamily: "Kanit", fontSize: 12, color: "#0f172a", background: "white",
    }

    const fetchLogs = async (targetPage = page) => {
      const company = typeof window !== "undefined" ? (localStorage.getItem("company_") || "") : ""
      if (!company) {
        setErrorText("ไม่พบข้อมูลบริษัท กรุณาเข้าสู่ระบบใหม่")
        return
      }

      setLoading(true)
      setErrorText("")
      try {
        const params = new URLSearchParams()
        params.set("company", company)
        params.set("limit", String(limit))
        params.set("page", String(targetPage))
        if (fromDate) params.set("from", fromDate)
        if (toDate) params.set("to", toDate)
        if (statusFilter !== "all") params.set("status", statusFilter)
        if (actionFilter !== "all") params.set("actionType", actionFilter)
        if (entityFilter !== "all") params.set("entityType", entityFilter)
        if (personFilter !== "all") params.set("personName", personFilter)
        if (keyword.trim()) params.set("keyword", keyword.trim())

        const res = await axios.get(`/api/logbook?${params.toString()}`)
        setLogs(Array.isArray(res.data?.logs) ? res.data.logs : [])
        setActors(Array.isArray(res.data?.actors) ? res.data.actors : [])
        setSummary(res.data?.summary || {})
        setTotal(Number(res.data?.total || 0))
        setPage(targetPage)
      } catch (error: any) {
        setErrorText(error?.response?.data?.error || error?.message || "โหลด Logbook ไม่สำเร็จ")
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchLogs(1)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSearch = () => fetchLogs(1)

    const formatDateTime = (value: string) => {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return "-"
      return date.toLocaleString("th-TH", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      })
    }

    const getStatus = (status: string) => statusConfig[status] || statusConfig.failed
    const displayActor = (log: LogbookEntry) => log.personName || "ไม่ทราบผู้ใช้"
    const displayReference = (log: LogbookEntry) => log.entityCode || log.entityId || "-"
    const displayDetail = (log: LogbookEntry) => log.errorMessage || log.message || log.route || "-"
    const toLogbookText = (value: unknown) => value === null || value === undefined ? "" : String(value).trim()
    const formatLogbookSaleItem = (item: any) => {
      const code = toLogbookText(item?.code || item?.code_product || item?.productCode)
      const name = toLogbookText(item?.name || item?.name_product || item?.productName)
      const qty = toLogbookText(item?.qty)
      const unit = toLogbookText(item?.unit)
      const productText = [code, name].filter(Boolean).join(" - ")
      const qtyText = qty ? ` x${qty}${unit ? ` ${unit}` : ""}` : ""
      return `${productText}${qtyText}`.trim()
    }
    const extractLabeledProductHint = (value: unknown) => {
      const text = toLogbookText(value)
      if (!text) return ""

      const codeMatch = text.match(/(?:รหัสสินค้า|รหัส|productCode|code_product|code)\s*[:：]?\s*([A-Za-z0-9][A-Za-z0-9._/-]{1,60})/i)
      const nameMatch = text.match(/(?:ชื่อสินค้า|ProductName|productName|name_product)\s*[:：]?\s*(.{2,120}?)(?=\s+(?:Barcode|บาร์โค้ด|ชื่อสามัญ|กลุ่ม|ประเภท|หมวด|ราคา|ทุน|Cost|Unit|หน่วย|รหัสสินค้า|code|$))/i)
      const code = toLogbookText(codeMatch?.[1])
      const name = toLogbookText(nameMatch?.[1])

      return [code, name].filter(Boolean).join(" - ")
    }
    const displayProductHint = (log: LogbookEntry) => {
      const metadata = log.metadata || {}
      const labeledProduct = extractLabeledProductHint(metadata.contextText || metadata.actionContextSummary || metadata.contextSummary)
      if (labeledProduct) return labeledProduct

      const directSummary = toLogbookText(metadata.saleItemSummary || metadata.productSummary || metadata.itemSummary || metadata.actionContextSummary || metadata.contextSummary)
      if (directSummary) return directSummary

      const saleItems = Array.isArray(metadata.saleItems) ? metadata.saleItems : Array.isArray(metadata.productItems) ? metadata.productItems : Array.isArray(metadata.items) ? metadata.items : []
      if (saleItems.length > 0) {
        const labels = saleItems.slice(0, 3).map(formatLogbookSaleItem).filter(Boolean)
        const itemCount = Number(metadata.itemCount || saleItems.length)
        const remainingCount = Math.max((Number.isFinite(itemCount) ? itemCount : saleItems.length) - labels.length, 0)
        const summary = labels.join(", ")
        return remainingCount > 0 ? `${summary} +${remainingCount} รายการ` : summary
      }

      const code = toLogbookText(metadata.productCode || metadata.code_product || metadata.code)
      const name = toLogbookText(metadata.productName || metadata.name_product || metadata.name)
      const productText = [code, name].filter(Boolean).join(" - ")
      if (productText) return productText

      if (["edit", "delete", "cancel"].includes(log.actionType) && log.route) return log.route.replace(/^\/web\//, "")
      return ""
    }
    const displayHintLabel = (log: LogbookEntry) => {
      const metadata = log.metadata || {}
      return metadata.actionContextSummary || metadata.contextSummary || metadata.contextText || ["edit", "delete", "cancel"].includes(log.actionType) ? "ข้อมูล" : "สินค้า"
    }
    const totalPages = Math.max(Math.ceil(total / limit), 1)

    return (
      <div style={{ padding: 20, width: "100%", maxWidth: 1220, fontFamily: "Kanit" }}>
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, #0f766e 0%, #2A6AAA 100%)", color: "white", padding: 20, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: 12, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList size={28} />
            </div>
            <div>
              <div style={{ fontFamily: "Kanit_B", fontSize: 20 }}>Logbook</div>
              <div style={{ fontSize: 12, opacity: 0.92 }}>ประวัติการกดปุ่มสำคัญ พร้อมผู้กด เวลา และสถานะผลลัพธ์</div>
            </div>
          </div>
          <button onClick={() => fetchLogs(page)} disabled={loading} style={{ border: "1px solid rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.16)", color: "white", borderRadius: 8, height: 38, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "Kanit", fontSize: 12, cursor: loading ? "default" : "pointer" }}>
            <RefreshCw size={15} /> {loading ? "กำลังโหลด" : "Refresh"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(120px, 1fr))", gap: 10, marginBottom: 14 }}>
          {[
            { label: "ทั้งหมด", value: total, icon: <Activity size={18} />, color: "#2A6AAA", bg: "#F3F8FC" },
            { label: "กดปุ่ม", value: summary.clicked || 0, icon: <Activity size={18} />, color: "#1E5088", bg: "#F3F8FC" },
            { label: "สำเร็จ", value: summary.success || 0, icon: <CheckCircle2 size={18} />, color: "#147F56", bg: "#EDF9F3" },
            { label: "ล้มเหลว", value: summary.failed || 0, icon: <XCircle size={18} />, color: "#dc2626", bg: "#fef2f2" },
            { label: "ยกเลิก/บล็อก", value: (summary.cancelled || 0) + (summary.blocked || 0), icon: <AlertTriangle size={18} />, color: "#d97706", bg: "#fffbeb" },
          ].map((item) => (
            <div key={item.label} style={{ ...cardStyle, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: item.bg, color: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{item.label}</div>
                <div style={{ fontFamily: "Kanit_B", fontSize: 22, color: "#0f172a", lineHeight: 1.1 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Kanit_B", color: "#0f172a", marginBottom: 10 }}>
            <Filter size={16} /> ตัวกรอง
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 8, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>ตั้งแต่วันที่</div>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>ถึงวันที่</div>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>ผู้กด</div>
              <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                <option value="all">ทุกคน</option>
                {actors.map((actor) => <option key={actor} value={actor}>{actor}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>สถานะ</div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                <option value="all">ทุกสถานะ</option>
                <option value="clicked">กดปุ่ม</option>
                <option value="success">สำเร็จ</option>
                <option value="failed">ล้มเหลว</option>
                <option value="cancelled">ยกเลิก</option>
                <option value="blocked">ถูกบล็อก</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Action</div>
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                {actionOptions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Module</div>
              <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                {entityOptions.map((entity) => <option key={entity.value} value={entity.value}>{entity.label}</option>)}
              </select>
            </div>
            <button onClick={handleSearch} disabled={loading} style={{ height: 38, border: "none", borderRadius: 8, background: "#2A6AAA", color: "white", fontFamily: "Kanit_B", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: loading ? "default" : "pointer" }}>
              <Search size={15} /> ค้นหา
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }} placeholder="ค้นหาปุ่ม, เอกสาร, route หรือข้อความ..." style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>

        <div style={{ ...cardStyle, overflow: "hidden" }}>
          {errorText && <div style={{ background: "#fef2f2", color: "#b91c1c", borderBottom: "1px solid #fecaca", padding: "10px 14px", fontSize: 12 }}>{errorText}</div>}
          <div style={{ overflow: "auto", maxHeight: "54vh" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                <tr>
                  {["เวลา", "ผู้กด", "สถานะ", "ปุ่ม / Action", "Module", "อ้างอิง", "รายละเอียด", "ดู"].map((head) => (
                    <th key={head} style={{ textAlign: "left", padding: "11px 12px", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#475569", fontFamily: "Kanit_B", whiteSpace: "nowrap" }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 34, color: "#64748b", fontSize: 13 }}>กำลังโหลด Logbook...</td></tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 34, color: "#94a3b8", fontSize: 13 }}>ยังไม่มีรายการตามตัวกรองนี้</td></tr>
                )}
                {logs.map((log) => {
                  const status = getStatus(log.status)
                  const productHint = displayProductHint(log)
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#0f172a", whiteSpace: "nowrap" }}><Clock3 size={13} style={{ marginRight: 5, verticalAlign: "-2px", color: "#64748b" }} />{formatDateTime(log.createdAt)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#0f172a", whiteSpace: "nowrap" }} title={log.personId ? `ID: ${log.personId}` : ""}><UserRound size={13} style={{ marginRight: 5, verticalAlign: "-2px", color: "#64748b" }} />{displayActor(log)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${status.border}`, background: status.bg, color: status.color, borderRadius: 999, padding: "4px 9px", fontFamily: "Kanit_B", fontSize: 11 }}>{status.icon}{status.label}</span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#0f172a" }}>
                        <div style={{ fontFamily: "Kanit_B" }}>{log.buttonLabel || log.actionType}</div>
                        <div style={{ color: "#64748b", fontSize: 11 }}>{log.actionType}</div>
                        {productHint && log.entityType === "product" && <div title={productHint} style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b", fontSize: 10.5, maxWidth: 170 }}>{productHint}</div>}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155", whiteSpace: "nowrap" }}>{log.entityType}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155", whiteSpace: "nowrap" }}>{displayReference(log)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: log.status === "failed" ? "#b91c1c" : "#334155", maxWidth: 260 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayDetail(log)}</div>
                        {productHint && <div title={productHint} style={{ marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b", fontSize: 10.5 }}>{displayHintLabel(log)}: {productHint}</div>}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <button onClick={() => setSelectedLog(log)} title="ดูรายละเอียด" style={{ width: 32, height: 30, borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#2A6AAA", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Eye size={15} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>แสดง {logs.length} จาก {total} รายการ</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => { const next = Math.max(page - 1, 1); fetchLogs(next) }} disabled={loading || page <= 1} style={{ ...inputStyle, opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "default" : "pointer" }}>ก่อนหน้า</button>
              <div style={{ fontSize: 12, color: "#334155" }}>{page} / {totalPages}</div>
              <button onClick={() => { const next = Math.min(page + 1, totalPages); fetchLogs(next) }} disabled={loading || page >= totalPages} style={{ ...inputStyle, opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? "default" : "pointer" }}>ถัดไป</button>
            </div>
          </div>
        </div>

        {selectedLog && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedLog(null)}>
            <div style={{ width: "min(760px, 96vw)", maxHeight: "86vh", overflow: "auto", background: "white", borderRadius: 12, boxShadow: "0 22px 60px rgba(15,23,42,0.28)" }} onClick={(event) => event.stopPropagation()}>
              <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "Kanit_B", fontSize: 16, color: "#0f172a" }}>{selectedLog.buttonLabel || selectedLog.actionType}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{formatDateTime(selectedLog.createdAt)} · {displayActor(selectedLog)}</div>
                </div>
                <button onClick={() => setSelectedLog(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, width: 34, height: 34, color: "#475569", fontSize: 18 }}>×</button>
              </div>
              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, fontSize: 12 }}>
                {[
                  ["ผู้กด", displayActor(selectedLog)],
                  ["เวลา", formatDateTime(selectedLog.createdAt)],
                  ["สถานะ", getStatus(selectedLog.status).label],
                  ["Action", selectedLog.actionType],
                  ["Module", selectedLog.entityType],
                  ["อ้างอิง", displayReference(selectedLog)],
                  ["Route", selectedLog.route || "-"],
                  ["Duration", selectedLog.durationMs ? `${selectedLog.durationMs} ms` : "-"],
                ].map(([label, value]) => (
                  <div key={label} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, background: "#f8fafc" }}>
                    <div style={{ color: "#64748b", marginBottom: 3 }}>{label}</div>
                    <div style={{ color: "#0f172a", fontFamily: "Kanit_B", wordBreak: "break-word" }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ fontFamily: "Kanit_B", fontSize: 13, marginBottom: 8, color: "#0f172a" }}>รายละเอียด</div>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, background: "#f8fafc", fontSize: 12, color: "#334155", marginBottom: 10 }}>
                  <div>{displayDetail(selectedLog)}</div>
                  {displayProductHint(selectedLog) && <div style={{ marginTop: 6, color: "#64748b", fontSize: 11 }}>{displayHintLabel(selectedLog)}: {displayProductHint(selectedLog)}</div>}
                </div>
                <pre style={{ margin: 0, border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, background: "#0f172a", color: "#e2e8f0", maxHeight: 260, overflow: "auto", fontSize: 11 }}>{selectedLog.metadata ? JSON.stringify(selectedLog.metadata, null, 2) : "{}"}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ตั้งเวลา เปิด-ปิด เครื่องอัตโนมัติ (Auto power on/off scheduler)
  const PowerSchedulePage = () => {
    type OffAction = "shutdown" | "sleep" | "hibernate"
    const DAYS: { key: string; label: string }[] = [
      { key: "mon", label: "จ" }, { key: "tue", label: "อ" }, { key: "wed", label: "พ" },
      { key: "thu", label: "พฤ" }, { key: "fri", label: "ศ" }, { key: "sat", label: "ส" }, { key: "sun", label: "อา" },
    ]

    const electronAPI = (typeof window !== "undefined") ? (window as any).electronAPI : null
    const isDesktop = !!(electronAPI?.getPowerSchedule)

    const [onEnabled, setOnEnabled] = useState(false)
    const [onTime, setOnTime] = useState("08:00")
    const [offEnabled, setOffEnabled] = useState(false)
    const [offTime, setOffTime] = useState("20:00")
    const [offAction, setOffAction] = useState<OffAction>("shutdown")
    const [warningSec, setWarningSec] = useState("60")
    const [days, setDays] = useState<string[]>(DAYS.map(d => d.key))
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ supported: boolean; shutdownTask: boolean; wakeTask: boolean } | null>(null)

    const loadSchedule = async () => {
      if (!isDesktop) { setLoading(false); return }
      try {
        const res = await electronAPI.getPowerSchedule()
        const s = res?.schedule || {}
        setOnEnabled(!!s.onEnabled)
        setOnTime(s.onTime || "08:00")
        setOffEnabled(!!s.offEnabled)
        setOffTime(s.offTime || "20:00")
        setOffAction((s.offAction as OffAction) || "shutdown")
        setWarningSec(String(s.warningSec ?? 60))
        if (Array.isArray(s.days) && s.days.length) setDays(s.days)
        setStatus(res?.status || null)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => { loadSchedule() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

    const toggleDay = (key: string) => {
      setDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key])
    }

    const handleSave = async () => {
      if (!isDesktop) return
      if (days.length === 0) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>กรุณาเลือกวันอย่างน้อย 1 วัน</div>)
        return
      }
      setSaving(true)
      const payload = { onEnabled, onTime, offEnabled, offTime, offAction, warningSec: Number(warningSec) || 0, days }
      try {
        const res = await electronAPI.setPowerSchedule(payload)
        if (res?.ok) {
          toast.success(
            <div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกการตั้งเวลาเรียบร้อย</div>,
            { description: <div style={{ fontFamily: "Kanit", fontSize: 13 }}>ระบบสร้างตารางเวลาใน Windows Task Scheduler แล้ว</div>, duration: 3000 }
          )
          await loadSchedule()
        } else {
          toast.error(
            <div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกไม่สำเร็จ</div>,
            { description: <div style={{ fontFamily: "Kanit", fontSize: 13 }}>{res?.error || "เกิดข้อผิดพลาด"}</div>, duration: 6000 }
          )
        }
        void logAction({
          actionType: "save",
          entityType: "setting",
          buttonLabel: "บันทึกตั้งเวลาเปิด-ปิดเครื่อง",
          status: res?.ok ? "success" : "failed",
          message: res?.ok ? "บันทึกตารางเปิด-ปิดเครื่อง" : (res?.error || "error"),
          metadata: { setting: "power_schedule", ...payload },
        })
      } catch (e: any) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>{e?.message || "เกิดข้อผิดพลาด"}</div>)
      } finally {
        setSaving(false)
      }
    }

    const gradient = "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
    const cardStyle: React.CSSProperties = {
      background: "white", border: "1px solid #e2e8f0", borderRadius: 14,
      padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", marginBottom: 16,
    }
    const timeInputStyle: React.CSSProperties = {
      fontFamily: "Kanit", fontSize: 22, fontWeight: 600, color: "#1e293b",
      padding: "6px 14px", borderRadius: 10, border: "1px solid #cbd5e1", outline: "none", textAlign: "center",
    }

    return (
      <div style={{ fontFamily: "Kanit", maxWidth: 820, margin: "0 auto", paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ background: gradient, borderRadius: 16, padding: "22px 26px", color: "white", marginBottom: 18, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 6px 20px rgba(79,70,229,0.25)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Power size={28} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>ตั้งเวลา เปิด-ปิด เครื่องอัตโนมัติ</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>ตั้งเวลาให้เครื่องเปิด (ปลุก) และปิดเองตามเวลาทำการของร้าน</div>
          </div>
        </div>

        {!isDesktop && (
          <div style={{ ...cardStyle, borderColor: "#fcd34d", background: "#fffbeb", color: "#92400e", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13 }}>
              ฟังก์ชันนี้ใช้งานได้เฉพาะบน <b>โปรแกรมเดสก์ท็อป (SmileStore POS บน Windows)</b> เท่านั้น
              เนื่องจากต้องสั่งงานระบบปฏิบัติการโดยตรง กรุณาเปิดผ่านโปรแกรมที่ติดตั้งบนเครื่อง
            </div>
          </div>
        )}

        {isDesktop && loading && (
          <div style={{ ...cardStyle, textAlign: "center", color: "#64748b", fontSize: 14 }}>กำลังโหลดการตั้งค่า...</div>
        )}

        {isDesktop && !loading && (
          <>
            {/* สถานะปัจจุบัน */}
            {status && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "6px 12px", borderRadius: 999, background: status.wakeTask ? "#D3F0E2" : "#f1f5f9", color: status.wakeTask ? "#0C5238" : "#64748b" }}>
                  {status.wakeTask ? <CheckCircle2 size={14} /> : <XCircle size={14} />} เปิดอัตโนมัติ: {status.wakeTask ? "ทำงานอยู่" : "ปิดอยู่"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "6px 12px", borderRadius: 999, background: status.shutdownTask ? "#D3F0E2" : "#f1f5f9", color: status.shutdownTask ? "#0C5238" : "#64748b" }}>
                  {status.shutdownTask ? <CheckCircle2 size={14} /> : <XCircle size={14} />} ปิดอัตโนมัติ: {status.shutdownTask ? "ทำงานอยู่" : "ปิดอยู่"}
                </span>
              </div>
            )}

            {/* เปิดเครื่อง */}
            <div style={{ ...cardStyle, borderColor: onEnabled ? "#A6C8E7" : "#e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "#E5EEF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Power size={20} color="#2A6AAA" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>เปิดเครื่องอัตโนมัติ</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>ปลุกเครื่องให้พร้อมใช้งานก่อนเปิดร้าน</div>
                  </div>
                </div>
                <Switch isSelected={onEnabled} onValueChange={setOnEnabled} color="success" />
              </div>
              {onEnabled && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
                  <Clock3 size={18} color="#64748b" />
                  <span style={{ fontSize: 13, color: "#475569" }}>เปิดเครื่องเวลา</span>
                  <input type="time" value={onTime} onChange={(e) => setOnTime(e.target.value)} style={timeInputStyle} />
                  <span style={{ fontSize: 12.5, color: "#94a3b8" }}>น.</span>
                </div>
              )}
            </div>

            {/* ปิดเครื่อง */}
            <div style={{ ...cardStyle, borderColor: offEnabled ? "#fca5a5" : "#e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Power size={20} color="#dc2626" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>ปิดเครื่องอัตโนมัติ</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>สั่งปิด / Sleep / Hibernate เมื่อปิดร้าน</div>
                  </div>
                </div>
                <Switch isSelected={offEnabled} onValueChange={setOffEnabled} color="danger" />
              </div>
              {offEnabled && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed #e2e8f0", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Clock3 size={18} color="#64748b" />
                    <span style={{ fontSize: 13, color: "#475569" }}>ปิดเครื่องเวลา</span>
                    <input type="time" value={offTime} onChange={(e) => setOffTime(e.target.value)} style={timeInputStyle} />
                    <span style={{ fontSize: 12.5, color: "#94a3b8" }}>น.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "#475569", minWidth: 70 }}>วิธีการ</span>
                    {([
                      { v: "shutdown", t: "ปิดเครื่อง (Shutdown)" },
                      { v: "sleep", t: "Sleep (พร้อมปลุกอัตโนมัติ)" },
                      { v: "hibernate", t: "Hibernate" },
                    ] as { v: OffAction; t: string }[]).map(opt => (
                      <button key={opt.v} type="button" onClick={() => setOffAction(opt.v)}
                        style={{
                          fontFamily: "Kanit", fontSize: 12.5, padding: "7px 14px", borderRadius: 9, cursor: "pointer",
                          border: offAction === opt.v ? "1.5px solid #4f46e5" : "1px solid #cbd5e1",
                          background: offAction === opt.v ? "#eef2ff" : "white",
                          color: offAction === opt.v ? "#4338ca" : "#64748b", fontWeight: offAction === opt.v ? 600 : 400,
                        }}>
                        {opt.t}
                      </button>
                    ))}
                  </div>
                  {offAction === "shutdown" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, color: "#475569", minWidth: 70 }}>แจ้งเตือนก่อนปิด</span>
                      <input type="number" min={0} max={600} value={warningSec} onChange={(e) => setWarningSec(e.target.value)}
                        style={{ fontFamily: "Kanit", fontSize: 14, width: 90, padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", textAlign: "center" }} />
                      <span style={{ fontSize: 12.5, color: "#94a3b8" }}>วินาที (ให้เวลาผู้ใช้บันทึกงานก่อนปิด)</span>
                    </div>
                  )}
                  {offAction === "shutdown" && onEnabled && (
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px" }}>
                      <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12.5, color: "#b91c1c", lineHeight: 1.6 }}>
                        โหมด <b>ปิดเครื่อง (Shutdown)</b> จะทำให้ <b>เปิดเครื่องอัตโนมัติทำงานไม่ได้</b> —
                        Windows ปลุกเครื่องได้เฉพาะจาก Sleep / Hibernate เท่านั้น
                        หากต้องการให้เปิด-ปิดทำงานคู่กัน แนะนำให้เลือก <b>Sleep</b> หรือ <b>Hibernate</b>
                      </div>
                    </div>
                  )}
                  {(offAction === "sleep" || offAction === "hibernate") && (
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#F3F8FC", border: "1px solid #CCDFF1", borderRadius: 10, padding: "10px 14px" }}>
                      <AlertTriangle size={16} color="#2A6AAA" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12.5, color: "#1E5088", lineHeight: 1.6 }}>
                        เครื่องโน้ตบุ๊กรุ่นใหม่ที่เป็น <b>Modern Standby (S0)</b> การปลุกจาก Sleep อาจไม่เสถียร
                        หากตั้งแล้วเครื่องไม่ยอมเปิดเองตามเวลา แนะนำให้เปลี่ยนเป็น <b>Hibernate</b> ซึ่งปลุกได้แน่นอนกว่า
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* วันในสัปดาห์ */}
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>ทำงานในวัน</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DAYS.map(d => {
                  const active = days.includes(d.key)
                  return (
                    <button key={d.key} type="button" onClick={() => toggleDay(d.key)}
                      style={{
                        width: 46, height: 46, borderRadius: 12, cursor: "pointer", fontFamily: "Kanit", fontSize: 14, fontWeight: 600,
                        border: active ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                        background: active ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#f8fafc",
                        color: active ? "white" : "#94a3b8",
                      }}>
                      {d.label}
                    </button>
                  )
                })}
                <button type="button" onClick={() => setDays(days.length === 7 ? [] : DAYS.map(d => d.key))}
                  style={{ marginLeft: 6, fontFamily: "Kanit", fontSize: 12.5, padding: "0 14px", height: 46, borderRadius: 12, cursor: "pointer", border: "1px dashed #cbd5e1", background: "white", color: "#64748b" }}>
                  {days.length === 7 ? "ล้างทั้งหมด" : "เลือกทุกวัน"}
                </button>
              </div>
            </div>

            {/* คำอธิบายเชิงเทคนิค */}
            <div style={{ ...cardStyle, background: "#f8fafc", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.7 }}>
                <b>การเปิดเครื่องอัตโนมัติ</b> ทำงานโดยตั้ง "ปลุกเครื่อง (Wake)" ผ่าน Windows Task Scheduler
                ซึ่งปลุกได้เมื่อเครื่องอยู่ในสถานะ <b>Sleep / Hibernate</b> เท่านั้น<br />
                หากต้องการให้เปิดจากสถานะ <b>ปิดสนิท (Shutdown)</b> ต้องตั้งค่า <b>RTC Alarm / Auto Power On</b> ใน BIOS ของเครื่องเพิ่มเติม
                จึงแนะนำให้เลือกวิธีปิดแบบ <b>Sleep</b> เพื่อให้เปิด-ปิดทำงานคู่กันได้สมบูรณ์<br />
                ระบบจะขอสิทธิ์เปิดใช้ Wake Timer ให้อัตโนมัติ — หากบันทึกไม่สำเร็จ กรุณาเปิดโปรแกรมด้วยสิทธิ์ Administrator
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={handleSave} disabled={saving}
                style={{
                  fontFamily: "Kanit", fontSize: 14, fontWeight: 600, color: "white", border: "none", cursor: saving ? "default" : "pointer",
                  padding: "10px 28px", borderRadius: 10, background: gradient, opacity: saving ? 0.6 : 1,
                  display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                }}>
                <SaveIcon size={17} /> {saving ? "กำลังบันทึก..." : "บันทึกการตั้งเวลา"}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ตั้งค่าเครื่องอ่านบัตรประชาชน (Thai ID Smart Card Reader)
  const SmartCardReaderPage = () => {
    const [scUrl, setScUrl] = useState<string>(() => typeof window !== "undefined" ? (localStorage.getItem("smartcard_url") || "http://127.0.0.1:8182") : "http://127.0.0.1:8182")
    const [scSavedUrl, setScSavedUrl] = useState<string>(() => typeof window !== "undefined" ? (localStorage.getItem("smartcard_url") || "") : "")
    const [scPath, setScPath] = useState<string>(() => typeof window !== "undefined" ? (localStorage.getItem("smartcard_path") || "/read") : "/read")
    const [scTimeout, setScTimeout] = useState<string>(() => typeof window !== "undefined" ? (localStorage.getItem("smartcard_timeout") || "15000") : "15000")
    const [scAutoRead, setScAutoRead] = useState<boolean>(() => typeof window !== "undefined" ? (localStorage.getItem("smartcard_autoread") === "true") : false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ ok: boolean, message: string } | null>(null)
    const [sampleLoading, setSampleLoading] = useState(false)
    const [sampleData, setSampleData] = useState<any>(null)
    const [detecting, setDetecting] = useState(false)
    const [detectedList, setDetectedList] = useState<string[]>([])
    const [starting, setStarting] = useState(false)
    const [autoStart, setAutoStart] = useState<boolean>(() => typeof window !== "undefined" ? (localStorage.getItem("smartcard_autostart") === "true") : false)
    const autoDetectedRef = useRef(false)

    const handleSave = () => {
      const finalUrl = scUrl.trim() || "http://127.0.0.1:8182"
      localStorage.setItem("smartcard_url", finalUrl)
      localStorage.setItem("smartcard_path", scPath.trim() || "/read")
      localStorage.setItem("smartcard_timeout", String(Number(scTimeout) || 15000))
      localStorage.setItem("smartcard_autoread", String(scAutoRead))
      setScSavedUrl(finalUrl)
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกการตั้งค่า</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>บันทึกค่าเครื่องอ่านบัตรเรียบร้อย</div>,
        duration: 2500,
      })
      void logAction({
        actionType: "save",
        entityType: "setting",
        buttonLabel: "บันทึกการตั้งค่าเครื่องอ่านบัตรประชาชน",
        status: "success",
        message: "บันทึกค่าเครื่องอ่านบัตรเรียบร้อย",
        metadata: {
          setting: "smartcard_reader",
          smartcardUrl: finalUrl,
          smartcardPath: scPath.trim() || "/read",
          timeoutMs: Number(scTimeout) || 15000,
          autoRead: scAutoRead,
        },
      })
    }

    const handleReset = () => {
      setScUrl("http://127.0.0.1:8182")
      setScPath("/read")
      setScTimeout("15000")
      setScAutoRead(false)
    }

    const testConnection = async () => {
      setTesting(true); setTestResult(null)
      try {
        // 1) ลองยิงไปที่ URL ปัจจุบันก่อน (ถ้ามีและตอบสนอง = ใช้ค่านี้ได้เลย)
        const current = scUrl.trim()
        if (current) {
          const found = await pingSmartcardAgent(current, 2500)
          if (found) {
            setTestResult({ ok: true, message: `เชื่อมต่อสำเร็จกับ ${found.url} (${found.pingMs} ms)` })
            // sync ค่าให้ตรงกัน + บันทึกอัตโนมัติ
            setScUrl(found.url)
            localStorage.setItem("smartcard_url", found.url)
            setScSavedUrl(found.url)
            return
          }
        }
        // 2) URL ปัจจุบันใช้ไม่ได้ → scan หาทุกพอร์ต/host alias อัตโนมัติ
        setTestResult({ ok: false, message: `กำลังค้นหาเครื่องอ่านบัตรอัตโนมัติ...` })
        const auto = await detectSmartcardAgent({ preferred: current || null, timeoutMs: 1500 })
        if (auto) {
          setScUrl(auto.url)
          localStorage.setItem("smartcard_url", auto.url)
          setScSavedUrl(auto.url)
          setTestResult({
            ok: true,
            message: `พบและเชื่อมต่อกับ ${auto.url} (${auto.pingMs} ms) — บันทึกอัตโนมัติแล้ว`,
          })
          toast.success(
            <div style={{ fontFamily: "Kanit", fontSize: 15 }}>เชื่อมต่อสำเร็จ</div>,
            { description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>{auto.url}</div> }
          )
        } else {
          setTestResult({
            ok: false,
            message: `ไม่พบเครื่องอ่านบัตร — กรุณาตรวจสอบว่าเปิดโปรแกรม Smart Card Agent แล้ว และเสียบเครื่องอ่านบัตร`,
          })
        }
      } catch (e: any) {
        setTestResult({ ok: false, message: e?.message || "เชื่อมต่อไม่สำเร็จ" })
      } finally { setTesting(false) }
    }

    // เริ่มโปรแกรม Smart Card Agent (start.bat) และเก็บค่าให้เปิดอัตโนมัติทุกครั้งที่เข้าระบบ
    const startAgent = async () => {
      setStarting(true)
      try {
        // เรียกผ่าน Electron (host Windows) ถ้ามี มิฉะนั้น fallback ไป API
        const electronAPI = (typeof window !== "undefined") ? (window as any).electronAPI : null
        let data: any = null
        if (electronAPI?.startSmartcardAgent) {
          data = await electronAPI.startSmartcardAgent()
        } else {
          const res = await fetch("/api/smartcard/start", { method: "POST" })
          data = await res.json().catch(() => ({}))
        }
        if (!data?.started) {
          toast.error(
            <div style={{ fontFamily: "Kanit", fontSize: 15 }}>เปิดโปรแกรม Agent ไม่สำเร็จ</div>,
            { description: <div style={{ fontFamily: "Kanit", fontSize: 13 }}>{data?.error || "ไม่พบไฟล์ start.bat"}</div> }
          )
          return
        }
        // เก็บค่าให้เปิดอัตโนมัติทุกครั้ง
        localStorage.setItem("smartcard_autostart", "true")
        setAutoStart(true)
        toast.success(
          <div style={{ fontFamily: "Kanit", fontSize: 15 }}>เปิดโปรแกรม Smart Card Agent แล้ว</div>,
          { description: <div style={{ fontFamily: "Kanit", fontSize: 13 }}>ระบบจะเปิดให้อัตโนมัติทุกครั้งที่เข้าใช้งาน</div>, duration: 3000 }
        )
        // รอสักครู่แล้ว ping ดูว่า agent พร้อมหรือยัง
        setTimeout(() => {
          testConnection()
        }, 2500)
      } catch (e: any) {
        toast.error(
          <div style={{ fontFamily: "Kanit", fontSize: 15 }}>เกิดข้อผิดพลาด</div>,
          { description: <div style={{ fontFamily: "Kanit", fontSize: 13 }}>{e?.message || "ไม่สามารถเริ่มโปรแกรมได้"}</div> }
        )
      } finally {
        setStarting(false)
      }
    }

    const disableAutoStart = () => {
      localStorage.removeItem("smartcard_autostart")
      setAutoStart(false)
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ปิดการเปิดอัตโนมัติแล้ว</div>)
    }

    // ตรวจว่ารันใน Electron หรือ web เบราว์เซอร์ทั่วไป
    const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI?.startSmartcardAgent

    // ดาวน์โหลด installer .bat สำหรับโหมด web (Docker/Linux container ไม่สามารถสั่ง .bat ได้)
    const downloadInstaller = () => {
      const a = document.createElement("a")
      a.href = "/api/smartcard/installer"
      a.download = "install-smartcard-agent.bat"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(
        <div style={{ fontFamily: "Kanit", fontSize: 15 }}>ดาวน์โหลด Installer แล้ว</div>,
        { description: <div style={{ fontFamily: "Kanit", fontSize: 13 }}>ดับเบิลคลิกไฟล์ที่ดาวน์โหลดเพื่อติดตั้งให้เปิดอัตโนมัติ</div>, duration: 4000 }
      )
      // จำค่า autostart เพื่อให้ระบบ ping ตรวจสถานะได้
      localStorage.setItem("smartcard_autostart", "true")
      setAutoStart(true)
    }

    const tryReadSample = async () => {
      setSampleLoading(true); setSampleData(null)
      try {
        // อ่านผ่าน Next.js server proxy เพื่อเลี่ยง CORS / PNA ของบราวเซอร์
        const json = await readSmartcardThroughProxy(scUrl, scPath || "/read", Number(scTimeout) || 15000)
        setSampleData(json)
      } catch (e: any) {
        setSampleData({ error: e?.message || "ไม่สามารถอ่านข้อมูลจากบัตรได้" })
      } finally { setSampleLoading(false) }
    }

    // ค้นหา Smart Card Agent อัตโนมัติ - ยิง /ping ไปทุกพอร์ตที่น่าจะเป็น
    const autoDetect = async (opts?: { silent?: boolean }) => {
      setDetecting(true)
      if (!opts?.silent) setTestResult(null)
      try {
        const found = await detectSmartcardAgent({ preferred: scUrl })
        if (found) {
          setScUrl(found.url)
          localStorage.setItem("smartcard_url", found.url)
          setDetectedList([found.url])
          setTestResult({
            ok: true,
            message: `พบเครื่องอ่านบัตรที่ ${found.url} (${found.pingMs} ms) - บันทึกค่าอัตโนมัติแล้ว`,
          })
          if (!opts?.silent) {
            toast.success(
              <div style={{ fontFamily: "Kanit", fontSize: 15 }}>เชื่อมต่ออัตโนมัติสำเร็จ</div>,
              { description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>{found.url}</div> }
            )
          }
        } else {
          setDetectedList([])
          if (!opts?.silent) {
            setTestResult({
              ok: false,
              message: `ค้นหาไม่พบ Smart Card Agent (ลองพอร์ต: ${SMARTCARD_CANDIDATES.length} พอร์ต) กรุณาตรวจว่าได้ติดตั้งและเปิดโปรแกรม Agent แล้ว`,
            })
          }
        }
      } finally { setDetecting(false) }
    }

    // auto-detect ครั้งแรกที่เปิดหน้าตั้งค่า (เฉพาะถ้าพอร์ตปัจจุบันไม่ตอบ)
    useEffect(() => {
      if (autoDetectedRef.current) return
      autoDetectedRef.current = true
      let cancelled = false
      ; (async () => {
        const first = await pingSmartcardAgent(scUrl, 1200)
        if (cancelled) return
        if (first) {
          setTestResult({ ok: true, message: `เชื่อมต่อกับ ${first.url} สำเร็จ` })
          return
        }
        // ค้นหาเงียบ ๆ - ถ้าเจอค่อยบอก
        autoDetect({ silent: true })
      })()
      return () => { cancelled = true }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const gradient = "linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)"

    const cardStyle: React.CSSProperties = {
      background: "white", border: "1px solid #e2e8f0", borderRadius: 14,
      padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", marginBottom: 16,
    }

    const labelStyle: React.CSSProperties = {
      fontFamily: "Kanit", fontSize: 12, color: "#64748b", minWidth: 160, textAlign: "right", paddingRight: 12,
    }

    const inputStyle: React.CSSProperties = {
      fontFamily: "Kanit", fontSize: 13, flex: 1,
      padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", outline: "none",
    }

    return (
      <div style={{ padding: 20, width: "100%", maxWidth: 1100, fontFamily: "Kanit" }}>

        {/* Hero */}
        <div style={{
          ...cardStyle,
          background: gradient, color: "white", display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14,
            background: "rgba(255,255,255,0.18)", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 30,
          }}>💳</div>
          <div>
            <div style={{ fontFamily: "Kanit_B", fontSize: 18 }}>ตั้งค่าเครื่องอ่านบัตรประชาชน</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
              กำหนดค่าการเชื่อมต่อกับโปรแกรม Smart Card Agent (HTTP Local Bridge)
              เพื่อใช้สมัครสมาชิกลูกค้าผ่านหน้า "หน้าขาย"
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-7">
            {/* Settings form */}
            <div style={cardStyle}>
              <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                ⚙️ การเชื่อมต่อ
              </div>

              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <div style={labelStyle}>URL เครื่องอ่านบัตร :</div>
                <input
                  list="smartcard-url-options"
                  value={scUrl}
                  onChange={(e) => setScUrl(e.target.value)}
                  style={inputStyle}
                  placeholder="http://127.0.0.1:8182"
                />
                <datalist id="smartcard-url-options">
                  <option value="http://127.0.0.1:8182" />
                  <option value="http://172.25.240.1:8182" />
                </datalist>
              </div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 6, flexWrap: "wrap", paddingLeft: 160 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "Kanit" }}>เลือกด่วน :</span>
                {["http://127.0.0.1:8182", "http://172.25.240.1:8182"].map((u) => {
                  const active = scUrl.trim() === u
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setScUrl(u)}
                      style={{
                        fontFamily: "Kanit",
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 6,
                        border: `1px solid ${active ? "#2A6AAA" : "#cbd5e1"}`,
                        background: active ? "#2A6AAA" : "#fff",
                        color: active ? "#fff" : "#334155",
                        cursor: "pointer",
                      }}
                    >
                      {u}
                    </button>
                  )
                })}scSavedUrl || "(ยังไม่ได้บันทึก)
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: "Kanit", marginLeft: 8 }}>
                  ค่าที่บันทึก : <b style={{ color: "#0f172a" }}>{typeof window !== "undefined" ? (localStorage.getItem("smartcard_url") || "(ยังไม่ได้บันทึก)") : ""}</b>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <div style={labelStyle}>Path (อ่านบัตร) :</div>
                <input value={scPath} onChange={(e) => setScPath(e.target.value)} style={inputStyle} placeholder="/read" />
              </div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <div style={labelStyle}>Timeout (ms) :</div>
                <input value={scTimeout} onChange={(e) => setScTimeout(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ ...inputStyle, flex: "0 0 160px" }} placeholder="15000" />
                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 10 }}>มิลลิวินาที (แนะนำ 10000 - 20000)</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <div style={labelStyle}>อ่านบัตรอัตโนมัติ :</div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={scAutoRead} onChange={(e) => setScAutoRead(e.target.checked)} />
                  <span style={{ fontFamily: "Kanit", fontSize: 12, color: "#334155" }}>
                    เมื่อเปิด Modal สมัครสมาชิก ให้อ่านบัตรอัตโนมัติ
                  </span>
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <button type="button" onClick={handleSave}
                  style={{
                    fontFamily: "Kanit", fontSize: 13, padding: "9px 22px",
                    borderRadius: 8, border: "none", background: gradient, color: "white",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    boxShadow: "0 2px 8px rgba(42, 106, 170,0.3)",
                  }}>
                  💾 บันทึก
                </button>
                <button type="button" onClick={() => autoDetect()} disabled={detecting}
                  style={{
                    fontFamily: "Kanit", fontSize: 13, padding: "9px 22px",
                    borderRadius: 8, border: "1px solid #3E86C7", background: "white", color: "#3E86C7",
                    cursor: detecting ? "not-allowed" : "pointer", opacity: detecting ? 0.7 : 1,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  {detecting ? "🔎 กำลังค้นหา..." : "🔎 ค้นหาอัตโนมัติ"}
                </button>
                <button type="button" onClick={handleReset}
                  style={{
                    fontFamily: "Kanit", fontSize: 13, padding: "9px 22px",
                    borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#64748b", cursor: "pointer",
                  }}>
                  ↺ รีเซ็ตเป็นค่าเริ่มต้น
                </button>
              </div>
            </div>

            {/* Start Agent panel */}
            <div style={cardStyle}>
              <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                🚀 เปิดโปรแกรม Smart Card Agent
              </div>
              <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#475569", marginBottom: 14, lineHeight: 1.7 }}>
                กดปุ่มเพื่อเปิดโปรแกรม Smart Card Agent (start.bat) <b>เพียงครั้งเดียว</b> ระบบจะจดจำค่านี้ไว้
                และจะเปิดโปรแกรมให้โดยอัตโนมัติทุกครั้งที่เข้าใช้งาน เพื่อให้เครื่องอ่านบัตรพร้อมใช้งานเสมอ
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {isElectron ? (
                  <button type="button" onClick={startAgent} disabled={starting}
                    style={{
                      fontFamily: "Kanit", fontSize: 13, padding: "10px 26px",
                      borderRadius: 8, border: "none",
                      background: starting ? "#94a3b8" : "linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)",
                      color: "white",
                      cursor: starting ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      boxShadow: "0 2px 8px rgba(62, 134, 199,0.3)",
                    }}>
                    {starting ? "กำลังเปิด..." : "▶ เปิดโปรแกรม Agent (จดจำไว้ตลอด)"}
                  </button>
                ) : (
                  <button type="button" onClick={downloadInstaller}
                    style={{
                      fontFamily: "Kanit", fontSize: 13, padding: "10px 26px",
                      borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)",
                      color: "white", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      boxShadow: "0 2px 8px rgba(62, 134, 199,0.3)",
                    }}>
                    ⬇ ดาวน์โหลด Installer (ติดตั้งให้เปิดอัตโนมัติ)
                  </button>
                )}
                {autoStart && (
                  <span style={{
                    fontFamily: "Kanit", fontSize: 12,
                    background: "#F3F8FC", color: "#1E5088",
                    border: "1px solid #CCDFF1", borderRadius: 999,
                    padding: "6px 12px",
                  }}>
                    ✓ เปิดอัตโนมัติทุกครั้งที่เข้าระบบ
                  </span>
                )}
                {autoStart && (
                  <button type="button" onClick={disableAutoStart}
                    style={{
                      fontFamily: "Kanit", fontSize: 12, padding: "7px 14px",
                      borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#64748b", cursor: "pointer",
                    }}>
                    ยกเลิกการเปิดอัตโนมัติ
                  </button>
                )}
              </div>
              {!isElectron && (
                <div style={{
                  marginTop: 14, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a",
                  borderRadius: 8, fontFamily: "Kanit", fontSize: 11, color: "#92400e", lineHeight: 1.7,
                }}>
                  <b>📝 วิธีใช้งานในเวอร์ชัน Web:</b>
                  <ol style={{ margin: "6px 0 0 16px", padding: 0 }}>
                    <li>กดปุ่ม "ดาวน์โหลด Installer" ด้านบน</li>
                    <li>เปิดไฟล์ <code>install-smartcard-agent.bat</code> ที่ดาวน์โหลดมา (ดับเบิลคลิก)</li>
                    <li>Installer จะติดตั้งให้เปิด Agent อัตโนมัติทุกครั้งที่เข้า Windows และเปิดให้ทันที</li>
                    <li>ทำครั้งเดียวพอ ไม่ต้องทำซ้ำ</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Test panel */}
            <div style={cardStyle}>
              <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                🧪 ทดสอบเครื่องอ่านบัตร
              </div>
              <div style={{
                fontFamily: "Kanit", fontSize: 12, color: "#475569", marginBottom: 14, lineHeight: 1.7,
                background: "#F3F8FC", border: "1px solid #CCDFF1", padding: "10px 14px", borderRadius: 8,
              }}>
                <b>💡 เคล็ดลับ:</b> เพียงกดปุ่ม "🔌 เชื่อมต่ออัตโนมัติ" — ระบบจะค้นหาเครื่องอ่านบัตรให้เองทุกพอร์ต
                และบันทึกค่าที่ใช้งานได้ให้อัตโนมัติ ไม่ต้องตั้งค่า URL ด้วยตนเอง
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={testConnection} disabled={testing}
                  style={{
                    fontFamily: "Kanit", fontSize: 13, padding: "10px 24px",
                    borderRadius: 8, border: "none",
                    background: testing ? "#94a3b8" : "linear-gradient(135deg, #2A6AAA 0%, #1E5088 100%)",
                    color: "white",
                    cursor: testing ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(42, 106, 170,0.3)",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  {testing ? "🔎 กำลังเชื่อมต่อ..." : "🔌 เชื่อมต่ออัตโนมัติ"}
                </button>
                <button type="button" onClick={tryReadSample} disabled={sampleLoading}
                  style={{
                    fontFamily: "Kanit", fontSize: 12, padding: "8px 18px",
                    borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#334155",
                    cursor: sampleLoading ? "not-allowed" : "pointer", opacity: sampleLoading ? 0.7 : 1,
                  }}>
                  {sampleLoading ? "กำลังอ่าน..." : "📇 ทดลองอ่านข้อมูลจากบัตร"}
                </button>
              </div>

              {testResult && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10, fontFamily: "Kanit", fontSize: 12,
                  background: testResult.ok ? "#EDF9F3" : "#fef2f2",
                  border: `1px solid ${testResult.ok ? "#A9E1C6" : "#fecaca"}`,
                  color: testResult.ok ? "#0C5238" : "#b91c1c",
                }}>
                  {testResult.ok ? "✅" : "⚠️"} {testResult.message}
                </div>
              )}

              {sampleData && (
                <div style={{
                  marginTop: 10, padding: 12, background: "#0f172a", color: "#e2e8f0",
                  borderRadius: 10, maxHeight: 240, overflow: "auto",
                  fontFamily: "monospace", fontSize: 11, whiteSpace: "pre-wrap",
                }}>
                  {JSON.stringify(sampleData, null, 2)}
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            {/* Help panel */}
            <div style={cardStyle}>
              <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                📘 คำแนะนำการติดตั้ง
              </div>
              <ol style={{ fontFamily: "Kanit", fontSize: 12, color: "#334155", paddingLeft: 18, lineHeight: 1.9 }}>
                <li>เสียบเครื่องอ่านบัตรประชาชน (Smart Card Reader) ที่รองรับ PC/SC เข้ากับพอร์ต USB ของคอมพิวเตอร์</li>
                <li>ติดตั้งโปรแกรม <b>Smart Card Agent</b> ที่ทำหน้าที่เป็น Local HTTP Bridge สำหรับอ่านข้อมูลจากบัตรประชาชน</li>
                <li>เปิดโปรแกรม Agent ให้ทำงานอยู่เบื้องหลัง (ปกติจะฟังที่พอร์ต 8182)</li>
                <li>ตั้งค่า URL และ Path ให้ตรงกับ Endpoint ของ Agent ที่ใช้งาน</li>
                <li>กด <b>ทดสอบการเชื่อมต่อ</b> เพื่อยืนยันว่า Agent พร้อมใช้งาน</li>
                <li>ไปที่หน้า <b>หน้าขาย</b> กดปุ่ม สมัครสมาชิกลูกค้า แล้วเลือกโหมด "อ่านบัตรประชาชน"</li>
              </ol>
            </div>

            <div style={cardStyle}>
              <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a", marginBottom: 10 }}>
                📄 รูปแบบข้อมูล (JSON) ที่ระบบคาดหวัง
              </div>
              <div style={{
                padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0",
                fontFamily: "monospace", fontSize: 11, color: "#475569", whiteSpace: "pre",
                overflow: "auto",
              }}>
{`{
  "cid": "1100xxxxxxxxx",
  "titleTH": "นาย",
  "firstNameTH": "สมชาย",
  "lastNameTH": "ใจดี",
  "fullNameTH": "นาย สมชาย ใจดี",
  "birthDate": "25320115",
  "gender": "1",
  "address": "123 หมู่ 1 ต.xxx อ.xxx จ.xxx",
  "issueDate": "20200101",
  "expireDate": "20300101",
  "photo": "<base64 jpeg>"
}`}
              </div>
              <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                * Agent ควรคืนค่าเป็น JSON โดยฟิลด์ <code>birthDate</code> อยู่ในรูป YYYYMMDD (พ.ศ. หรือ ค.ศ. ก็ได้ ระบบจะแปลงให้)
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {


  }, [])

  const [l, setlevel] = useState([])
  const { hasPermission } = usePermission()
  return (
    <div style={{ paddingLeft: 15, paddingRight: 15 }} className="" >

      <div className="row justify-content-start " >
        <HeadTab />
      </div>


      <div className="row justify-content-start " >

        <div className="col-sm-1" >
          <MenuTab_Small />
        </div>

        <div className="col-sm-11">
          <div className='col shadow-sm rounded border' style={{ backgroundColor: "white", height: "90vh" }}>
            <div className='row' style={{ marginLeft: 5 }}>
              <MainPage />
            </div>

            <div className='row' style={{ marginLeft: 40 }}>
              {showcolor === "1" ?

                hasPermission("N2") ?
                  <CommonPage />
                  : ""
                :
                showcolor === "10" ?
                  hasPermission("N2") ?
                    <GeneralPage />
                    : ""
                  :
                showcolor === "2" ?
                  hasPermission("N3") ?
                    <PeoplePage />
                    : ""
                  :
                  showcolor === "3" ?
                    hasPermission("N4") ?
                      <SetLabelPage />
                      : ""
                    :
                    showcolor === "4" ?
                      hasPermission("N5") ?
                        <PointPage />
                        : ""
                      :
                      showcolor === "5" ?
                        hasPermission("N6") ?
                          <QRPaymentPage />
                          : ""
                        :
                        showcolor === "6" ?
                          hasPermission("N7") ?
                            <Level />
                            : ""
                          :

                          showcolor === "7" ?
                            hasPermission("N8") ?
                              <Printer />
                              : ""
                            :
                            showcolor === "8" ?
                              hasPermission("N9") ?
                              <BackupPage />
                              : ""
                            :
                            showcolor === "9" ?
                              <SmartCardReaderPage />
                              :
                              showcolor === "11" ?
                                <LogbookPage />
                                :
                                showcolor === "12" ?
                                  (isOwnerLevel2 ? <CheckinDevicePage /> : "")
                                  :
                                  showcolor === "13" ?
                                    (isOwnerLevel2 ? <PowerSchedulePage /> : "")
                                    : ""

              }

            </div>
          </div>


        </div>

      </div>

    </div>
  )
}
export default SettingPage