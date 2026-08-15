"use client"

import React, { useEffect, useState, ChangeEvent, KeyboardEvent, use } from 'react'
import dynamic from 'next/dynamic'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ReferenceLine, ComposedChart } from "recharts";
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import Modal_blt from 'react-bootstrap/Modal';
import styles from "./../componant/mystyle.module.css"
const apipl = "pl/pl"
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Tab from 'react-bootstrap/Tab';
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import { jwtDecode } from "jwt-decode";
import { enableFullscreen } from "@/lib/fullscreen";
const linkcompanyapi = "linkcompany/link"
import { Toaster, toast } from "sonner"
import { Award, Clock, Users, User, CheckCircle, XCircle, X, Trash2, MessageSquare, FileSpreadsheet } from 'lucide-react';

// Lazy-load AnalyzeBranchTab — separate tab, not needed on initial render
const AnalyzeBranchTab = dynamic(() => import('./AnalyzeBranch'), {
  ssr: false,
  loading: () => <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Kanit', color: '#94a3b8' }}>กำลังโหลด...</div>
});


const CompanyLossPage = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();


  const [monthS, SetMonth] = useState(("0" + (Number(currentMonth) + 1)).slice(-2))
  const [yearS, SetYear] = useState(currentYear)

  //******* */ month********/ 
  const MonthInput = (e: any) => {
    SetMonth(e.target.value)
  }
  //******* */ Year********/ 
  const YearInput = (e: any) => {
    SetYear(e.target.value)
  }

  const month = [
    { id: 1, month: "01" },
    { id: 2, month: "02" },
    { id: 3, month: "03" },
    { id: 4, month: "04" },
    { id: 5, month: "05" },
    { id: 6, month: "06" },
    { id: 7, month: "07" },
    { id: 8, month: "08" },
    { id: 9, month: "09" },
    { id: 10, month: "10" },
    { id: 11, month: "11" },
    { id: 12, month: "12" },
  ]


  const year = [
    { id: 1, year: currentYear },
    { id: 2, year: currentYear - 1 },
    { id: 3, year: currentYear - 2 }
  ]

  // Branch connection status
  const [sidebarBranches, setSidebarBranches] = useState<any[]>([]);
  const [sidebarCheckingAll, setSidebarCheckingAll] = useState(false);
  const [sidebarCheckingId, setSidebarCheckingId] = useState<number | null>(null);

  const fetchSidebarBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = jwtDecode<any>(token);
      const userId = Number(payload.idcompany);
      const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
      const accepted = connRes.data.filter((c: any) => c.status === "accepted");
      setSidebarBranches(accepted);
    } catch (e) { console.error('fetchSidebarBranches:', e); }
  };

  const handleSidebarCheckStatus = async (connId: number) => {
    setSidebarCheckingId(connId);
    try {
      const res = await axios.post("/api/branchconnection/check", { connectionId: connId });
      setSidebarBranches(prev => prev.map(c => c.id === connId ? { ...c, isOnline: res.data.isOnline, lastCheckedAt: res.data.lastCheckedAt } : c));
    } catch (e) { console.error('checkStatus:', e); }
    setSidebarCheckingId(null);
  };

  const handleSidebarRefreshAll = async () => {
    setSidebarCheckingAll(true);
    for (const conn of sidebarBranches) {
      setSidebarCheckingId(conn.id);
      try {
        const res = await axios.post("/api/branchconnection/check", { connectionId: conn.id });
        setSidebarBranches(prev => prev.map(c => c.id === conn.id ? { ...c, isOnline: res.data.isOnline, lastCheckedAt: res.data.lastCheckedAt } : c));
      } catch (e) { console.error('checkStatus:', e); }
    }
    setSidebarCheckingId(null);
    setSidebarCheckingAll(false);
  };

  //***************************************************************** */
  const [saledaily, setsaledaily] = useState([])
  const [countday, setcountday] = useState(0);
  const [countnow, setnowday] = useState(0);
  const [countlast, setlastday] = useState(0);

  useEffect(() => {
    // Fire all independent API calls in parallel
    Promise.allSettled([
      fetchPostsz(),
      GetPL(),
      fetchSidebarBranches()
    ]).catch(error => console.error(error));
  }, [])


  const fetchPostsz = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const resday = await axios.get(`/api/pl/summary?company=${companyS}&createDate=${isNaN(new Date().getFullYear()) === true ?
        currentYear + "-" + ("0" + (Number(currentMonth) + 1)).slice(-2) :
        yearS + "-" + ("0" + (Number(monthS))).slice(-2)}`)

      setsaledaily(resday.data ?? "")

      const dateS = isNaN(new Date().getFullYear()) === true ?
        new Date(currentYear + "-" + ("0" + (Number(currentMonth) + 1)).slice(-2) + "-01") :
        new Date(yearS + "-" + ("0" + (Number(monthS))).slice(-2) + "-01")

      let startDay = (new Date(dateS.getFullYear(), dateS.getMonth(), dateS.getDate()).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', }));
      let lastDay = parseInt(new Date(dateS.getFullYear(), dateS.getMonth() + 1, 0).toLocaleDateString('es-US', { day: '2-digit' }));
      let nowS = parseInt(new Date().toLocaleDateString('es-US', { day: '2-digit' }));

      let datecount = new Date() > new Date(dateS.getFullYear(), dateS.getMonth() + 1, 0) ?
        parseInt(new Date(dateS.getFullYear(), dateS.getMonth() + 1, 0).toLocaleDateString('es-US', { day: '2-digit' })) :
        parseInt(new Date().toLocaleDateString('es-US', { day: '2-digit' }))

      setcountday(datecount ?? "")
      setnowday(nowS ?? "")
      setlastday(lastDay ?? "")

    } catch (error) {
      console.error(error)
    }

  }


  const [pl, setpl] = useState([])
  const [plid, setplid] = useState(0)


  const GetPL = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/pl/pl?company=${companyS}&monthyear=${isNaN(new Date().getFullYear()) === true ?
        String(currentYear + "-" + ("0" + (Number(currentMonth) + 1)).slice(-2)) :
        String(yearS + "-" + ("0" + (Number(monthS))).slice(-2))}`)

      setpl(res.data ?? "")
      setplid(res.data[0] !== undefined ? res.data[0].id : 0)

      localStorage.setItem("plid", String(res.data[0] !== undefined ? res.data[0].id : ""))

    } catch (error) {
      console.error(error)
    }

  }





  const [showte, setShowte] = useState(false);


  const PL_Edit = () => {



    const [R4001S, setR4001] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.R4001)))
    const [R4002S, setR4002] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.R4002)))

    const [C5001S, setC5001] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.C5001)))

    const [S6000S, setS6000] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6000)))
    const [S6001S, setS6001] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6001)))
    const [S6002S, setS6002] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6002)))
    const [S6003S, setS6003] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6003)))
    const [S6004S, setS6004] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6004)))
    const [S6005S, setS6005] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6005)))
    const [S6006S, setS6006] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6006)))
    const [S6007S, setS6007] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6007)))
    const [S6008S, setS6008] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6008)))
    const [S6009S, setS6009] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6009)))
    const [S6010S, setS6010] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.S6010)))

    const [A7000S, setA7000] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.A7000)))
    const [A7001S, setA7001] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.A7001)))
    const [A7002S, setA7002] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.A7002)))
    const [A7003S, setA7003] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.A7003)))
    const [A7004S, setA7004] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.A7004)))
    const [A7005S, setA7005] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.A7005)))
    const [A7006S, setA7006] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.A7006)))
    const [A7007S, setA7007] = useState(String(pl.filter((a: any) => a.id == a.id).map((a: any) => a.A7007)))

    const [vatS, setvat] = useState("")

    //***********Post Promotion************************** */  &nbsp;
    const SavePL = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const company = companyS
      const month = String(isNaN(new Date().getFullYear()) === true ?
        ("0" + (Number(currentMonth) + 1)).slice(-2) :
        ("0" + (Number(monthS))).slice(-2))
      const year = String(isNaN(new Date().getFullYear()) === true ?
        currentYear : yearS)
      const monthyear = String(isNaN(new Date().getFullYear()) === true ?
        currentYear + "-" + ("0" + (Number(currentMonth) + 1)).slice(-2) :
        yearS + "-" + ("0" + (Number(monthS))).slice(-2))

      const R4000 = Number((saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)).toFixed(0))
      const R4001 = Number(R4001S)
      const R4002 = Number(R4002S)

      const C5000 = Number((saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0)).toFixed(0))
      const C5001 = Number(C5001S)

      const S6000 = Number(S6000S)
      const S6001 = Number(S6001S)
      const S6002 = Number(S6002S)
      const S6003 = Number(S6003S)
      const S6004 = Number(S6004S)
      const S6005 = Number(S6005S)
      const S6006 = Number(S6006S)
      const S6007 = Number(S6007S)
      const S6008 = Number(S6008S)
      const S6009 = Number(S6009S)
      const S6010 = Number(S6010S)

      const A7000 = Number(A7000S)
      const A7001 = Number(A7001S)
      const A7002 = Number(A7002S)
      const A7003 = Number(A7003S)
      const A7004 = Number(A7004S)
      const A7005 = Number(A7005S)
      const A7006 = Number(A7006S)
      const A7007 = Number(A7007S)
      const vat = Number(vatS)

      // company,name_promotion,customer,conditionid,condition,startdate,enddate,unit,pay_condition,discount,status,person
      try {
        await axios.post(`/api/${apipl}`,
          {
            company, month, year, monthyear,
            R4000, R4001, R4002,
            C5000, C5001,
            S6000, S6001, S6002, S6003, S6004, S6005, S6006, S6007, S6008, S6009, S6010,
            A7000, A7001, A7002, A7003, A7004, A7005, A7006, A7007
          }
        )
        GetPL()
      } catch (error) {
        console.error(error)
      }
    }

    //***********Post Promotion************************** */  &nbsp;
    const EditPL = async () => {
      const idss = localStorage.getItem("plid") || ""


      const R4000 = Number((saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)).toFixed(0))
      const R4001 = Number(R4001S)
      const R4002 = Number(R4002S)

      const C5000 = Number((saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0)).toFixed(0))
      const C5001 = Number(C5001S)

      const S6000 = Number(S6000S)
      const S6001 = Number(S6001S)
      const S6002 = Number(S6002S)
      const S6003 = Number(S6003S)
      const S6004 = Number(S6004S)
      const S6005 = Number(S6005S)
      const S6006 = Number(S6006S)
      const S6007 = Number(S6007S)
      const S6008 = Number(S6008S)
      const S6009 = Number(S6009S)
      const S6010 = Number(S6010S)

      const A7000 = Number(A7000S)
      const A7001 = Number(A7001S)
      const A7002 = Number(A7002S)
      const A7003 = Number(A7003S)
      const A7004 = Number(A7004S)
      const A7005 = Number(A7005S)
      const A7006 = Number(A7006S)
      const A7007 = Number(A7007S)
      const vat = Number(vatS)

      // company,name_promotion,customer,conditionid,condition,startdate,enddate,unit,pay_condition,discount,status,person
      try {
        await axios.put(`/api/${apipl}/${Number(idss)}`,
          {

            R4000, R4001, R4002,
            C5000, C5001,
            S6000, S6001, S6002, S6003, S6004, S6005, S6006, S6007, S6008, S6009, S6010,
            A7000, A7001, A7002, A7003, A7004, A7005, A7006, A7007
          }
        )
        GetPL()
      } catch (error) {
        console.error(error)
      }
    }

    return (
      <>

        <Modal_blt
          show={showte}
          onHide={() => setShowte(false)}
          size="lg"
          scrollable={true}
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_blt.Header closeButton>
            <Modal_blt.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>ลงข้อมูล งบประมาณ</div>
            </Modal_blt.Title>
          </Modal_blt.Header>
          <Modal_blt.Body style={{ backgroundColor: "white" }}>

            <div>
              <table>
                <tbody>



                  <tr>
                    <td colSpan={2}>
                      <div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", color: "#2A6AAA" }}>รายได้</div>

                    </td>

                  </tr>
                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>4000</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 380 }}>รายได้จากการขาย (หน้าร้าน)</div></td>
                    <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", height: 30 }}>
                      {(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)).toFixed(0)}
                    </div>
                    </td>

                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>4001</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>รายได้จากการขาย (Online)</div></td>
                    <td>
                      <input
                        type="number"
                        value={R4001S}
                        onChange={(e) => setR4001(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>4002</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>รายได้จากการขาย อื่นๆ </div></td>
                    <td>
                      <input
                        type="number"
                        value={R4002S}
                        onChange={(e) => setR4002(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>


                  <tr>
                    <td colSpan={2}>
                      <div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", color: "purple" }}>ต้นทุนขาย</div>
                    </td>
                  </tr>
                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>5000</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ต้นทุนสินค้า</div></td>
                    <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", height: 30 }}>
                      {saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0).toFixed(0)}
                    </div>
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>5001</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ต้นทุนขนส่ง </div></td>
                    <td>
                      <input
                        type="number"
                        value={C5001S}
                        onChange={(e) => setC5001(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>


                  <tr>
                    <td colSpan={2}>
                      <div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", color: "brown" }}>ค่าใช้จ่ายในการขาย</div>
                    </td>
                  </tr>
                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6000</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>เงินเดือนพนักงานขาย (เภสัชกร)</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6000S}
                        onChange={(e) => setS6000(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6001</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>เงินเดือนพนักงานขาย (ผู้ช่วยเภสัชกร)</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6001S}
                        onChange={(e) => setS6001(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6002</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>OT พนักงานขาย (เภสัชกร)</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6002S}
                        onChange={(e) => setS6002(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6003</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>OT พนักงานขาย (ผู้ช่วยเภสัชกร)</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6003S}
                        onChange={(e) => setS6003(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6004</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>เภสัชร part time</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6004S}
                        onChange={(e) => setS6004(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6005</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ผู้ช่วยเภสัช part time</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6005S}
                        onChange={(e) => setS6005(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6006</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าหยิบ/ค่าคอมมิสชั่น/ยอดเป้า</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6006S}
                        onChange={(e) => setS6006(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6007</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าโฆษณา/ค่าการตลาด</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6007S}
                        onChange={(e) => setS6007(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6008</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าน้ำมันส่งของให้ลูกค้า</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6008S}
                        onChange={(e) => setS6008(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6009</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่า Software (POS)</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6009S}
                        onChange={(e) => setS6009(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6010</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าใช้จ่ายอื่นๆ ที่เกี่ยวกับการขาย</div></td>
                    <td>
                      <input
                        type="number"
                        value={S6010S}
                        onChange={(e) => setS6010(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td colSpan={2}>
                      <div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", color: "brown" }}>ค่าใช้จ่ายในการบริหาร</div>
                    </td>
                  </tr>
                  <tr >
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7000</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>เงินเดือนผู้บริหาร</div></td>
                    <td>
                      <input
                        type="number"
                        value={A7000S}
                        onChange={(e) => setA7000(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7001</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าเช่า </div></td>
                    <td>
                      <input
                        type="number"
                        value={A7001S}
                        onChange={(e) => setA7001(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7002</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าไฟฟ้า </div></td>
                    <td>
                      <input
                        type="number"
                        value={A7002S}
                        onChange={(e) => setA7002(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7003</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าน้ำ </div></td>
                    <td>
                      <input
                        type="number"
                        value={A7003S}
                        onChange={(e) => setA7003(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7004</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าซ่อมบำรุงสำนักงาน/ร้านค้า </div></td>
                    <td>
                      <input
                        type="number"
                        value={A7004S}
                        onChange={(e) => setA7004(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7005</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าเสื่อมราคา </div></td>
                    <td>
                      <input
                        type="number"
                        value={A7005S}
                        onChange={(e) => setA7005(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7006</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าอุปกรณ์สำนักงาน </div></td>
                    <td>
                      <input
                        type="number"
                        value={A7006S}
                        onChange={(e) => setA7006(e.target.value)}
                        className="form-control form-control-sm  mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>

                  <tr>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7007</div></td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าอื่นๆที่เกี่ยวกับการบริหารจัดการ </div></td>
                    <td>
                      <input
                        type="number"
                        value={A7007S}
                        onChange={(e) => setA7007(e.target.value)}
                        className="form-control form-control-sm mt-1"
                        style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "blue", width: 100 }} />
                    </td>
                    <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10 }}>บาท</div></td>
                  </tr>



                </tbody>
              </table>

            </div>




          </Modal_blt.Body>
          <Modal_blt.Footer>

            {plid === 0 ?

              <button
                className="btn btn-success"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => { SavePL(), setShowte(false) }}
              >
                บันทึก
              </button>
              :
              <button
                className="btn btn-warning"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={() => { EditPL(), setShowte(false) }}
              >
                แก้ไข
              </button>
            }
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowte(false)}>
              ปิด
            </button>

          </Modal_blt.Footer>
        </Modal_blt>

      </>

    )
  }

  const PL = () => {

    return (
      <div className='row'>

        <div className="col-5">
          <div className='col shadow-sm rounded border' style={{ backgroundColor: "white" }}>
            <div className='row-5 mt-2 mb-2' style={{ marginLeft: 5 }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "center" }}>กำไร ขาดทุน</div>
            </div>
            <div className="input-group mt-2" style={{ width: 360, marginLeft: 20 }}>
              <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 150, color: "GrayText" }}>ค้นหา ข้อมูลประจำเดือน/ปี :</span>
              <select className="form-select" id="inputGroup" onChange={MonthInput} style={{ fontFamily: "kanit", fontSize: 12 }} value={monthS !== undefined ? monthS : "เลือกเดือน"}>
                {month.length > 0 &&
                  month.map((option: any, index: any) =>
                    <option
                      value={option.value}
                      disabled={option.disable ? true : false}
                      key={index}
                      selected={option.selected}
                      style={{ fontFamily: "kanit", fontSize: 12 }} >
                      {option.month}
                    </option>
                  )}
              </select>
              <select className="form-select" id="inputGroup" onChange={YearInput} style={{ fontFamily: "kanit", fontSize: 12 }} value={yearS !== undefined ? yearS : "เลือกปี"}>
                {year.length > 0 &&
                  year.map((option: any, index: any) =>
                    <option
                      value={option.value}
                      disabled={option.disable ? true : false}
                      key={index}
                      selected={option.selected}
                      style={{ fontFamily: "kanit", fontSize: 12 }} >
                      {option.year}
                    </option>
                  )}
              </select>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => { fetchPostsz(), GetPL() }}
                style={{ fontFamily: "kanit", fontSize: 12, justifySelf: "center", width: 60 }}>
                ค้นหา
              </button>
            </div>

            <div className='mt-2' style={{ marginLeft: 10 }}>
              <table className="table table-sm table-hover" style={{ width: 500 }}>
                <thead>
                  <tr>
                    <th style={{ fontFamily: "kanit", fontSize: 10, width: 80 }}>วันที่</th>
                    <th style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 60 }}>บิล</th>
                    <th style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 60 }}>ยอดขาย</th>
                    <th style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 60 }}>ต้นทุน</th>
                    <th style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 60 }}>กำไร</th>
                    <th style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 60 }}>%กำไร</th>
                    <th style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80 }}>ยอดรับสินค้า</th>
                    <th style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80 }}>ยอด(ขาย-รับ)</th>

                  </tr>
                </thead>
                <tbody>
                  {saledaily.map((n: any) =>
                    <tr key={n.date} >
                      <td style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}>{n.date}</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", width: 60 }}>{isNaN(Number(n.bill)) ? "" : Number(n.bill || 0).toFixed(0) ?? ""}</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", width: 60 }}>{isNaN(Number(n.sale)) ? "" : Number(n.sale || 0).toFixed(0) ?? ""}</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", width: 60 }}>{isNaN(Number(n.cost)) ? "" : Number(n.cost || 0).toFixed(0) ?? ""}</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", width: 60 }}>{isNaN(Number(n.sale)) ? "" : Number(Number(n.sale) - Number(n.cost || 0)).toFixed(0) ?? ""}</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", width: 60 }}>{isNaN(Number(((Number(n.sale || 0) - Number(n.cost || 0)) / Number(n.sale || 0)) * 100)) === true ? 0 : Number(((Number(n.sale || 0) - Number(n.cost || 0)) / Number(n.sale || 0)) * 100).toFixed(0) ?? ""}%</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", width: 80 }}>{isNaN(Number(n.rc)) ? "" : Number(n.rc || 0).toFixed(0) ?? ""}</td>
                      <td style={{ fontFamily: "kanit", fontSize: 12, textAlign: "right", width: 80 }}>{isNaN(Number(n.diff)) ? "" : Number(n.diff || "").toFixed(0) ?? ""}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/** รวม */}
              <div className='d-flex' style={{ width: 500 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "right", width: 80 }}>รวม ({countday}) วัน</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.bill) || 0), 0)).toFixed(0)}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)).toFixed(0)}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0)).toFixed(0)}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>
                  {(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) - saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0)).toFixed(0)}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>
                  {(((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)) - Number(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0))) / Number(saledaily.reduce((a: any, b: any) => a + b.sale || 0, 0))) * 100).toFixed(0)}%</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 80 }}>{saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0).toFixed(0)}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 80 }}>{saledaily.reduce((a: any, b: any) => a + (Number(b.diff) || 0), 0).toFixed(0)}</div>
              </div>

              {/** เฉลี่ย */}
              <div className='d-flex mb-2' style={{ width: 500 }}>
                <div style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "right", width: 80 }}>เฉลี่ย ({countday}) วัน</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.bill) || 0), 0) / countday).toFixed(0) ?? ""}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) / countday).toFixed(0) ?? ""}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0) / countday).toFixed(0) ?? ""}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>
                  {((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)) - Number(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0))) / countday).toFixed(0) ?? ""}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>
                  {((((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)) - Number(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0))) / Number(saledaily.reduce((a: any, b: any) => a + b.sale || 0, 0))) * 100)).toFixed(0) ?? ""}%</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 80 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0) / countday).toFixed(0) ?? ""}</div>
                <div style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 80 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.diff) || 0), 0) / countday).toFixed(0) ?? ""}</div>
              </div>


            </div>
          </div>
        </div>

        <div className='col-sm-6 shadow-sm rounded border' style={{ backgroundColor: "white", justifyItems: "center" }}>
          <div className='row-5 mt-2 mb-2 ' style={{ marginLeft: 5 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "center" }}>งบดำเนินการ</div>
          </div>

          <div className='row-5 mt-2 mb-2 ' style={{ marginLeft: 5, justifySelf: "end" }}>
            <button
              className='btn btn-outline-secondary'
              type='button'
              style={{ fontFamily: "kanit", fontSize: 10, justifySelf: "end" }}
              onClick={() => setShowte(true)}
            >เพิ่มข้อมูล</button>
            <PL_Edit />
          </div>

          <table>

            {pl.map((a: any) =>
              <tbody key={a.id}>


                <tr >
                  <td colSpan={2}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", color: "#2A6AAA" }}>รายได้</div>

                  </td>
                  <td><div style={{ fontFamily: "kanit_B", textAlign: "center", fontSize: 11, justifySelf: "center", marginLeft: 10 }}>หน่วย (บาท)</div></td>
                  <td><div style={{ fontFamily: "kanit_B", textAlign: "center", fontSize: 11, justifySelf: "center", width: 70 }}>%เทียบยอดขาย</div></td>
                </tr>
                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>4000</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 380 }}>รายได้จากการขาย (หน้าร้าน)</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>
                    {saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0).toFixed(0)}
                  </div>
                  </td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}
                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>4001</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>รายได้จากการขาย (Online)</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.R4001}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.R4001) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}
                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>4002</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>รายได้จากการขาย อื่นๆ </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.R4002}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.R4002) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350, color: "#2A6AAA" }}>(1) รายได้รวมจากการขายและบริการ (Sale) </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "#2A6AAA" }}>
                    {(
                      Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                      + Number(a.R4001)
                      + Number(a.R4002)
                    )}</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "#2A6AAA" }}>100%</div></td>
                </tr>

                <tr>
                  <td colSpan={2}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", color: "purple" }}>ต้นทุนขาย</div>
                  </td>
                </tr>
                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>5000</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ต้นทุนสินค้า</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>
                    {saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0).toFixed(0)}
                  </div>
                  </td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0)) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>5001</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ต้นทุนขนส่ง </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.C5001}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.C5001) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>


                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350, color: "purple" }}>(2) ต้นทุนการขาย (Cost of goods sold)</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "purple" }}>
                    {Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0)) + Number(a.C5001)}
                  </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "purple" }}>
                    {(((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0)) + Number(a.C5001)) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350, color: "#2A6AAA" }}>(3) กำไรขั้นต้น (Gross Profit) (1)-(2)</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "#2A6AAA" }}>
                    {(
                      Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                      + Number(a.R4001)
                      + Number(a.R4002)
                      - (Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0)) + Number(a.C5001))
                    )}
                  </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "#2A6AAA" }}>
                    {(((
                      Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                      + Number(a.R4001)
                      + Number(a.R4002)
                      - (Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0)) + Number(a.C5001))
                    ) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td colSpan={2}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", color: "brown" }}>ค่าใช้จ่ายในการขาย</div>
                  </td>
                </tr>
                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6000</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>เงินเดือนพนักงานขาย (เภสัชกร)</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6000}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6000) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6001</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>เงินเดือนพนักงานขาย (ผู้ช่วยเภสัชกร)</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6001}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6001) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6002</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>OT พนักงานขาย (เภสัชกร)</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6002}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6002) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6003</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>OT พนักงานขาย (ผู้ช่วยเภสัชกร)</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6003}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6003) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6004</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>เภสัชร part time</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6004}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6004) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6005</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ผู้ช่วยเภสัช part time</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6005}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6005) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6006</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าหยิบ/ค่าคอมมิสชั่น/ยอดเป้า</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6006}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6006) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6007</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าโฆษณา/ค่าการตลาด</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6007}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6007) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6008</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าน้ำมันส่งของให้ลูกค้า</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6008}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6008) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6009</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่า Software (POS)</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6009}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6009) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>6010</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าใช้จ่ายอื่นๆ ที่เกี่ยวกับการขาย</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.S6010}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.S6010) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350, color: "brown" }}>(4) ค่าใช้จ่ายในการขายรวม (Selling Expenses)</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "brown" }}>
                    {
                      Number(a.S6000)
                      + Number(a.S6001)
                      + Number(a.S6002)
                      + Number(a.S6003)
                      + Number(a.S6004)
                      + Number(a.S6005)
                      + Number(a.S6006)
                      + Number(a.S6007)
                      + Number(a.S6008)
                      + Number(a.S6009)
                      + Number(a.S6010)

                    }
                  </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "brown" }}>
                    {(((
                      Number(a.S6000)
                      + Number(a.S6001)
                      + Number(a.S6002)
                      + Number(a.S6003)
                      + Number(a.S6004)
                      + Number(a.S6005)
                      + Number(a.S6006)
                      + Number(a.S6007)
                      + Number(a.S6008)
                      + Number(a.S6009)
                      + Number(a.S6010)) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td colSpan={2}>
                    <div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", color: "brown" }}>ค่าใช้จ่ายในการบริหาร</div>
                  </td>
                </tr>
                <tr >
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7000</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>เงินเดือนผู้บริหาร</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.A7000}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.A7000) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7001</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าเช่า </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.A7001}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.A7001) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7002</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าไฟฟ้า </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.A7002}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.A7002) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7003</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าน้ำ </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.A7003}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.A7002) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7004</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าซ่อมบำรุงสำนักงาน/ร้านค้า </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.A7004}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.A7004) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7005</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าเสื่อมราคา </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.A7005}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.A7005) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7006</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าอุปกรณ์สำนักงาน </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.A7006}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.A7006) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}>7007</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350 }}>ค่าอื่นๆที่เกี่ยวกับการบริหารจัดการ </div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{a.A7007}</div></td>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                    {((Number(a.A7007) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 380, color: "brown" }}>(5) ค่าใช้จ่ายในการบริหารจัดการรวม (Administrative Expenses)</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "brown" }}>
                    {
                      (Number(a.A7000)
                        + Number(a.A7001)
                        + Number(a.A7002)
                        + Number(a.A7003)
                        + Number(a.A7004)
                        + Number(a.A7005)
                        + Number(a.A7006)
                        + Number(a.A7007))

                    }

                  </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "brown" }}>
                    {(((Number(a.A7000)
                      + Number(a.A7001)
                      + Number(a.A7002)
                      + Number(a.A7003)
                      + Number(a.A7004)
                      + Number(a.A7005)
                      + Number(a.A7006)
                      + Number(a.A7007)) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350, color: "brown" }}>(6) ต้นทุนดำเนินงาน (Operating Cost) (4)+(5)</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "brown" }}>
                    {
                      (Number(a.S6000)
                        + Number(a.S6001)
                        + Number(a.S6002)
                        + Number(a.S6003)
                        + Number(a.S6004)
                        + Number(a.S6005)
                        + Number(a.S6006)
                        + Number(a.S6007)
                        + Number(a.S6008)
                        + Number(a.S6009)
                        + Number(a.S6010)

                        + Number(a.A7000)
                        + Number(a.A7001)
                        + Number(a.A7002)
                        + Number(a.A7003)
                        + Number(a.A7004)
                        + Number(a.A7005)
                        + Number(a.A7006)
                        + Number(a.A7007))

                    }

                  </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "brown" }}>
                    {(((Number(a.S6000)
                      + Number(a.S6001)
                      + Number(a.S6002)
                      + Number(a.S6003)
                      + Number(a.S6004)
                      + Number(a.S6005)
                      + Number(a.S6006)
                      + Number(a.S6007)
                      + Number(a.S6008)
                      + Number(a.S6009)
                      + Number(a.S6010)

                      + Number(a.A7000)
                      + Number(a.A7001)
                      + Number(a.A7002)
                      + Number(a.A7003)
                      + Number(a.A7004)
                      + Number(a.A7005)
                      + Number(a.A7006)
                      + Number(a.A7007)) /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350, color: "#2A6AAA" }}>(7) กำไรจากการดำเนินงาน (Operating Profit) (1)-(6) </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "#2A6AAA" }}>
                    {(
                      Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                      + Number(a.R4001)
                      + Number(a.R4002)
                      - (
                        Number(a.S6000)
                        + Number(a.S6001)
                        + Number(a.S6002)
                        + Number(a.S6003)
                        + Number(a.S6004)
                        + Number(a.S6005)
                        + Number(a.S6006)
                        + Number(a.S6007)
                        + Number(a.S6008)
                        + Number(a.S6009)
                        + Number(a.S6010)

                        + Number(a.A7000)
                        + Number(a.A7001)
                        + Number(a.A7002)
                        + Number(a.A7003)
                        + Number(a.A7004)
                        + Number(a.A7005)
                        + Number(a.A7006)
                        + Number(a.A7007)
                      )


                    )}

                  </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "#2A6AAA" }}>
                    {((
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                        - (
                          Number(a.S6000)
                          + Number(a.S6001)
                          + Number(a.S6002)
                          + Number(a.S6003)
                          + Number(a.S6004)
                          + Number(a.S6005)
                          + Number(a.S6006)
                          + Number(a.S6007)
                          + Number(a.S6008)
                          + Number(a.S6009)
                          + Number(a.S6010)

                          + Number(a.A7000)
                          + Number(a.A7001)
                          + Number(a.A7002)
                          + Number(a.A7003)
                          + Number(a.A7004)
                          + Number(a.A7005)
                          + Number(a.A7006)
                          + Number(a.A7007)
                        )


                      )

                      /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350, color: "#2A6AAA" }}>(8) กำไรก่อนหักภาษีเงินได้ (EBT) (1)-(2)-(6)</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "#2A6AAA" }}>
                    {((
                      Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                      + Number(a.R4001)
                      + Number(a.R4002)
                      - (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0))
                        + Number(a.C5001)

                        + Number(a.S6000)
                        + Number(a.S6001)
                        + Number(a.S6002)
                        + Number(a.S6003)
                        + Number(a.S6004)
                        + Number(a.S6005)
                        + Number(a.S6006)
                        + Number(a.S6007)
                        + Number(a.S6008)
                        + Number(a.S6009)
                        + Number(a.S6010)

                        + Number(a.A7000)
                        + Number(a.A7001)
                        + Number(a.A7002)
                        + Number(a.A7003)
                        + Number(a.A7004)
                        + Number(a.A7005)
                        + Number(a.A7006)
                        + Number(a.A7007)
                      ))


                    )}

                  </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "#2A6AAA" }}>
                    {((
                      ((
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                        - (
                          Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0))
                          + Number(a.C5001)

                          + Number(a.S6000)
                          + Number(a.S6001)
                          + Number(a.S6002)
                          + Number(a.S6003)
                          + Number(a.S6004)
                          + Number(a.S6005)
                          + Number(a.S6006)
                          + Number(a.S6007)
                          + Number(a.S6008)
                          + Number(a.S6009)
                          + Number(a.S6010)

                          + Number(a.A7000)
                          + Number(a.A7001)
                          + Number(a.A7002)
                          + Number(a.A7003)
                          + Number(a.A7004)
                          + Number(a.A7005)
                          + Number(a.A7006)
                          + Number(a.A7007)
                        ))


                      )
                      /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}
                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "left", marginLeft: 10, width: 350, color: "grey" }}>(9) หักภาษี </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "grey" }}>0</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "grey" }}>
                    {((
                      0
                      /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}

                  </div></td>
                </tr>

                <tr>
                  <td><div style={{ fontFamily: "kanit", fontSize: 15, justifySelf: "right", marginLeft: 20 }}></div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "left", marginLeft: 10, width: 350, color: "blue" }}>(10) กำไรสุทธิ (Net Profit) (8)-(9)</div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "blue" }}>
                    {(
                      Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                      + Number(a.R4001)
                      + Number(a.R4002)
                      - (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0))
                        + Number(a.C5001)

                        + Number(a.S6000)
                        + Number(a.S6001)
                        + Number(a.S6002)
                        + Number(a.S6003)
                        + Number(a.S6004)
                        + Number(a.S6005)
                        + Number(a.S6006)
                        + Number(a.S6007)
                        + Number(a.S6008)
                        + Number(a.S6009)
                        + Number(a.S6010)

                        + Number(a.A7000)
                        + Number(a.A7001)
                        + Number(a.A7002)
                        + Number(a.A7003)
                        + Number(a.A7004)
                        + Number(a.A7005)
                        + Number(a.A7006)
                        + Number(a.A7007)
                      )


                    )}

                  </div></td>
                  <td><div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "right", marginLeft: 10, color: "blue" }}>
                    {((
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                        - (
                          Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0))
                          + Number(a.C5001)

                          + Number(a.S6000)
                          + Number(a.S6001)
                          + Number(a.S6002)
                          + Number(a.S6003)
                          + Number(a.S6004)
                          + Number(a.S6005)
                          + Number(a.S6006)
                          + Number(a.S6007)
                          + Number(a.S6008)
                          + Number(a.S6009)
                          + Number(a.S6010)

                          + Number(a.A7000)
                          + Number(a.A7001)
                          + Number(a.A7002)
                          + Number(a.A7003)
                          + Number(a.A7004)
                          + Number(a.A7005)
                          + Number(a.A7006)
                          + Number(a.A7007)
                        )


                      )
                      /
                      (
                        Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0))
                        + Number(a.R4001)
                        + Number(a.R4002)
                      )) * 100).toFixed(1) + " %"}
                  </div></td>
                </tr>
              </tbody>)}

          </table>
        </div>
      </div>
    )
  }


  const PLcompany = () => {
    const router = useRouter();
    const [plLoading, setPlLoading] = useState(true);
    const [plCurrentUser, setPlCurrentUser] = useState<any>(null);
    const [allBranches, setAllBranches] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    });
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [branchData, setBranchData] = useState<Record<string, any>>({});
    const BCOLORS = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777'];
    const userLevel = typeof window !== 'undefined' ? localStorage.getItem("level_") || "" : "";

    useEffect(() => {
      const fetchBranches = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);
          const [userRes, connRes] = await Promise.all([
            axios.get(`/api/login/logins/${userId}`),
            axios.get(`/api/branchconnection?userId=${userId}&type=all`),
          ]);
          setPlCurrentUser(userRes.data);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");
          const branches = accepted.map((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const localBranchId = Number(branch?.id);
            const isRemote = !localBranchId || Number.isNaN(localBranchId) || !branch;
            const bid = isRemote ? c.remoteUserId : localBranchId;
            if (!bid || (!isRemote && localBranchId === userId)) return null;
            return {
              id: bid, companyId: isRemote ? String(c.remoteUserId) : String(localBranchId),
              dataKey: isRemote ? `remote_${c.id}` : `local_${localBranchId}`,
              branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || "ไม่ทราบชื่อ",
              isRemote, tunnelUrl: c.tunnelUrl || "", remoteUserId: c.remoteUserId || null,
            };
          }).filter((b: any) => b !== null);
          const currentBranch = {
            id: userId, companyId: String(userId),
            dataKey: `self_${userId}`,
            branchName: userRes.data.company || "สาขาปัจจุบัน",
            isRemote: false, tunnelUrl: "", remoteUserId: null,
          };
          setAllBranches([currentBranch, ...branches]);
        } catch (error) { console.error("Error fetching branches:", error); }
      };
      fetchBranches();
    }, []);

    useEffect(() => {
      if (allBranches.length === 0) return;
      const fetchAllData = async () => {
        setPlLoading(true);
        const dt = new Date(selectedDate);
        const yr = dt.getFullYear();
        const mo = `${yr}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        const newData: Record<string, any> = {};
        await Promise.all(allBranches.map(async (branch: any) => {
          const cid = branch.companyId;
          const dk = branch.dataKey;
          try {
            if (branch.isRemote && branch.tunnelUrl) {
              const rc = branch.remoteUserId;
              const base = `/api/sale_cal/branch-proxy?tunnelUrl=${encodeURIComponent(branch.tunnelUrl)}`;
              const [s, d, m, p, g] = await Promise.all([
                axios.get(`${base}&apiPath=/api/sale_cal/sale_sum&company=${rc}&createDate=${selectedDate}`).catch(() => ({ data: [] })),
                axios.get(`${base}&apiPath=/api/sale_cal/sale_daily&company=${rc}&createDate=${mo}`).catch(() => ({ data: [] })),
                axios.get(`${base}&apiPath=/api/sale_cal/sale_monthly&company=${rc}&createDate=${yr}`).catch(() => ({ data: [] })),
                axios.get(`${base}&apiPath=/api/sale_cal/sale_product_good&company=${rc}&createDate=${selectedDate}`).catch(() => ({ data: [] })),
                axios.get(`${base}&apiPath=/api/sale_cal/sale_group&company=${rc}&createDate=${selectedDate}`).catch(() => ({ data: [] })),
              ]);
              newData[dk] = { summary: s.data?.[0] || {}, daily: d.data || [], monthly: m.data || [], topProducts: p.data || [], groupProducts: g.data || [] };
            } else {
              const res = await axios.get(`/api/sale_cal/sale_branch_summary?company=${encodeURIComponent(cid)}&createDate=${selectedDate}`);
              const d = res.data || {};
              newData[dk] = { summary: d.summary || {}, daily: d.daily || [], monthly: d.monthly || [], topProducts: d.topProducts || [], groupProducts: d.groupProducts || [] };
            }
          } catch (err) {
            console.error(`Error fetching data for branch ${branch.id}:`, err);
            newData[dk] = { summary: {}, daily: [], monthly: [], topProducts: [], groupProducts: [] };
          }
        }));
        setBranchData(newData);
        setPlLoading(false);
      };
      fetchAllData();
    }, [selectedDate, allBranches]);

    const visible = selectedBranch === "all" ? allBranches : allBranches.filter((b: any) => b.dataKey === selectedBranch);
    const sumF = (field: string) => visible.reduce((s: number, b: any) => s + (Number(branchData[b.dataKey]?.summary?.[field]) || 0), 0);
    const totalRevenue = sumF('revenue');
    const totalBills = sumF('bill');
    const totalCost = sumF('cost');
    const totalProfit = totalRevenue - totalCost;
    const avgPerBill = totalBills > 0 ? totalRevenue / totalBills : 0;
    const profitPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";
    const totalCash = sumF('cash');
    const totalPayment = sumF('payment');

    const dailyChart = (() => {
      if (allBranches.length === 0) return [];
      const ref = branchData[allBranches[0].dataKey]?.daily || [];
      return ref.map((d: any, i: number) => {
        const pt: any = { date: d.date?.split('/')[0] || d.date };
        visible.forEach((b: any) => { pt[b.branchName] = branchData[b.dataKey]?.daily?.[i]?.value || 0; });
        if (visible.length > 1) pt['รวม'] = visible.reduce((s: number, b: any) => s + (branchData[b.dataKey]?.daily?.[i]?.value || 0), 0);
        return pt;
      });
    })();

    const monthlyChart = (() => {
      if (allBranches.length === 0) return [];
      const ref = branchData[allBranches[0].dataKey]?.monthly || [];
      return ref.map((d: any, i: number) => {
        const pt: any = { month: d.month };
        visible.forEach((b: any) => { pt[b.branchName] = branchData[b.dataKey]?.monthly?.[i]?.value || 0; });
        if (visible.length > 1) pt['รวม'] = visible.reduce((s: number, b: any) => s + (branchData[b.dataKey]?.monthly?.[i]?.value || 0), 0);
        return pt;
      });
    })();

    const topProducts = (() => {
      const map = new Map<string, { Id: string; name: string; total: number; qty: number }>();
      visible.forEach((b: any) => {
        (branchData[b.dataKey]?.topProducts || []).forEach((p: any) => {
          const key = p.Id || p.name;
          const existing = map.get(key);
          if (existing) { existing.total += Number(p.total) || 0; existing.qty += Number(p.qty) || 0; }
          else map.set(key, { Id: p.Id, name: p.name, total: Number(p.total) || 0, qty: Number(p.qty) || 0 });
        });
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 15);
    })();

    const groupProducts = (() => {
      const map = new Map<string, { Id: string; total: number; qty: number }>();
      visible.forEach((b: any) => {
        (branchData[b.dataKey]?.groupProducts || []).forEach((g: any) => {
          const key = g.Id || 'ไม่ระบุ';
          const existing = map.get(key);
          if (existing) { existing.total += Number(g.total) || 0; existing.qty += Number(g.qty) || 0; }
          else map.set(key, { Id: key, total: Number(g.total) || 0, qty: Number(g.qty) || 0 });
        });
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    })();
    const GROUP_COLORS = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777', '#B45309', '#65A30D', '#E11D48', '#0F766E', '#A855F7', '#F59E0B'];
    const groupTotal = groupProducts.reduce((s, g) => s + g.total, 0);

    const fmt2 = (n: number) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const fmtK = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

    const SaleTooltip = ({ active, payload, label }: any) => {
      if (!active || !payload?.length) return null;
      return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</div>
          {payload.map((e: any, i: number) => (
            <div key={i} style={{ fontFamily: 'Kanit', fontSize: 11, color: e.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span>{e.name}</span><span style={{ fontWeight: 600 }}>{fmt2(e.value)} ฿</span>
            </div>
          ))}
        </div>
      );
    };

    const KpiCard = ({ icon, title, value, sub, gradient, border }: any) => (
      <div style={{
        background: gradient, borderRadius: 14, padding: '16px 18px', border: `1px solid ${border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s', cursor: 'default', minWidth: 0
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 500, color: '#64748b' }}>{title}</span>
        </div>
        <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{value}</div>
        {sub && <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    );

    return (
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>📊 สรุปยอดขายสาขา</div>
            <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>เปรียบเทียบข้อมูลยอดขายทุกสาขาที่เชื่อมต่อ</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
              style={{ fontFamily: 'Kanit', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', minWidth: 160 }}>
              <option value="all">ทุกสาขา ({allBranches.length})</option>
              {allBranches.map((b: any, i: number) => (
                <option key={b.dataKey} value={b.dataKey}>
                  {i === 0 ? `⭐ ${b.branchName} (ปัจจุบัน)` : b.branchName}{b.isRemote ? ' 🌐' : ''}
                </option>
              ))}
            </select>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{ fontFamily: 'Kanit', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155' }} />
          </div>
        </div>

        {plLoading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'Kanit', color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 20 }}>
              <KpiCard icon="💰" title="ยอดขายรวม" value={`${fmt2(totalRevenue)} ฿`} gradient="linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)" border="#CCDFF1" />
              <KpiCard icon="📋" title="จำนวนบิล" value={fmt2(totalBills)} sub="บิล" gradient="linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)" border="#CCDFF1" />
              <KpiCard icon="📊" title="เฉลี่ย/บิล" value={`${fmt2(avgPerBill)} ฿`} gradient="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" border="#fde68a" />
              {userLevel !== "level1" && <KpiCard icon="📈" title="กำไร" value={`${fmt2(totalProfit)} ฿`} sub={`${profitPct}%`} gradient="linear-gradient(135deg, #EDF9F3 0%, #D3F0E2 100%)" border="#A9E1C6" />}
              <KpiCard icon="💵" title="เงินสด" value={`${fmt2(totalCash)} ฿`} gradient="linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" border="#e9d5ff" />
              <KpiCard icon="🏦" title="โอน" value={`${fmt2(totalPayment)} ฿`} gradient="linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)" border="#fecdd3" />
            </div>

            {allBranches.length > 1 && selectedBranch === "all" && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>🏢 เปรียบเทียบสาขา</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {allBranches.map((b: any, idx: number) => {
                    const sd = branchData[b.dataKey]?.summary || {};
                    const rev = Number(sd.revenue) || 0; const cost2 = Number(sd.cost) || 0;
                    const profit2 = rev - cost2; const bills2 = Number(sd.bill) || 0;
                    const clr = BCOLORS[idx % BCOLORS.length];
                    return (
                      <div key={b.dataKey} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `2px solid ${clr}20`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderLeft: `4px solid ${clr}` }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: clr, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: clr }} />{b.branchName} {idx === 0 ? '⭐' : ''}{b.isRemote ? ' 🌐' : ''}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontFamily: 'Kanit', fontSize: 11 }}>
                          <div style={{ color: '#64748b' }}>ยอดขาย</div><div style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{fmt2(rev)} ฿</div>
                          <div style={{ color: '#64748b' }}>บิล</div><div style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{fmt2(bills2)}</div>
                          {userLevel !== "level1" && <><div style={{ color: '#64748b' }}>กำไร</div><div style={{ fontWeight: 600, color: profit2 >= 0 ? '#147F56' : '#dc2626', textAlign: 'right' }}>{fmt2(profit2)} ฿</div></>}
                          <div style={{ color: '#64748b' }}>เฉลี่ย/บิล</div><div style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{bills2 > 0 ? fmt2(rev / bills2) : 0} ฿</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#173F6B', marginBottom: 12 }}>📅 ยอดขายรายวัน</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontFamily: 'Kanit', fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtK} tick={{ fontFamily: 'Kanit', fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                    <Tooltip content={<SaleTooltip />} />
                    <Legend wrapperStyle={{ fontFamily: 'Kanit', fontSize: 10 }} iconType="circle" iconSize={8} />
                    {visible.length > 1 && <Area type="monotone" dataKey="รวม" stroke="#0f172a" strokeWidth={2} fill="#0f172a" fillOpacity={0.04} strokeDasharray="5 3" />}
                    {visible.map((b: any) => (
                      <Area key={b.dataKey} type="monotone" dataKey={b.branchName} stroke={BCOLORS[allBranches.indexOf(b) % BCOLORS.length]} strokeWidth={2}
                        fill={BCOLORS[allBranches.indexOf(b) % BCOLORS.length]} fillOpacity={0.08} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#2A6AAA', marginBottom: 12 }}>📆 ยอดขายรายเดือน</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontFamily: 'Kanit', fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtK} tick={{ fontFamily: 'Kanit', fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                    <Tooltip content={<SaleTooltip />} />
                    <Legend wrapperStyle={{ fontFamily: 'Kanit', fontSize: 10 }} iconType="circle" iconSize={8} />
                    {visible.map((b: any) => (
                      <Bar key={b.dataKey} dataKey={b.branchName} fill={BCOLORS[allBranches.indexOf(b) % BCOLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={visible.length > 2 ? 20 : 35} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#7c3aed', marginBottom: 8, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>🏷️ กลุ่มสินค้าขายดี</div>
                {groupProducts.length === 0 ? (
                  <div style={{ padding: 40, fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>ไม่มีข้อมูล</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={groupProducts} dataKey="total" nameKey="Id" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} strokeWidth={2} stroke="#fff">
                        {groupProducts.map((_: any, idx: number) => (
                          <Cell key={idx} fill={GROUP_COLORS[idx % GROUP_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const pct = groupTotal > 0 ? ((d.total / groupTotal) * 100).toFixed(1) : '0';
                        return (
                          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>{d.Id}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>ยอดขาย: <b style={{ color: '#2A6AAA' }}>{fmt2(d.total)} ฿</b></div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>จำนวน: <b>{fmt2(d.qty)}</b> ชิ้น</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>สัดส่วน: <b style={{ color: '#7c3aed' }}>{pct}%</b></div>
                          </div>
                        );
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#7c3aed', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>📋 รายละเอียดกลุ่มสินค้า</div>
                {groupProducts.length === 0 ? (
                  <div style={{ padding: 40, fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>ไม่มีข้อมูล</div>
                ) : (
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {groupProducts.map((g: any, idx: number) => {
                      const pct = groupTotal > 0 ? ((g.total / groupTotal) * 100) : 0;
                      return (
                        <div key={g.Id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: idx < groupProducts.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: GROUP_COLORS[idx % GROUP_COLORS.length], flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.Id || 'ไม่ระบุ'}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{fmt2(g.qty)} ชิ้น</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#2A6AAA' }}>{fmt2(g.total)} ฿</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#7c3aed', fontWeight: 600 }}>{pct.toFixed(1)}%</div>
                          </div>
                          <div style={{ width: 80, height: 6, background: '#f1f5f9', borderRadius: 3, flexShrink: 0, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: GROUP_COLORS[idx % GROUP_COLORS.length], borderRadius: 3, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: allBranches.length > 1 && selectedBranch === "all" ? '1fr 1.2fr' : '1fr', gap: 16 }}>
              {allBranches.length > 1 && selectedBranch === "all" && (
                <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#7c3aed', marginBottom: 12 }}>🏆 เปรียบเทียบยอดขาย</div>
                  <ResponsiveContainer width="100%" height={Math.max(180, allBranches.length * 55)}>
                    <BarChart data={allBranches.map((b: any, i: number) => {
                      const item: any = { name: b.branchName, ยอดขาย: Number(branchData[b.dataKey]?.summary?.revenue) || 0 };
                      if (userLevel !== "level1") item['กำไร'] = (Number(branchData[b.dataKey]?.summary?.revenue) || 0) - (Number(branchData[b.dataKey]?.summary?.cost) || 0);
                      return item;
                    })} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tickFormatter={fmtK} tick={{ fontFamily: 'Kanit', fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Kanit', fontSize: 11, fill: '#334155' }} width={100} axisLine={false} />
                      <Tooltip content={<SaleTooltip />} />
                      <Legend wrapperStyle={{ fontFamily: 'Kanit', fontSize: 10 }} />
                      <Bar dataKey="ยอดขาย" fill="#3E86C7" radius={[0, 4, 4, 0]} maxBarSize={25} />
                      {userLevel !== "level1" && <Bar dataKey="กำไร" fill="#1F9D6B" radius={[0, 4, 4, 0]} maxBarSize={25} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⭐</span>
                  <span style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#b45309' }}>
                    สินค้าขายดี {selectedBranch !== "all" ? `(${visible[0]?.branchName})` : '(รวมทุกสาขา)'}
                  </span>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fefce8', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#92400e', textAlign: 'left', borderBottom: '2px solid #fde68a' }}>#</th>
                        <th style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#92400e', textAlign: 'left', borderBottom: '2px solid #fde68a' }}>รหัส</th>
                        <th style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#92400e', textAlign: 'left', borderBottom: '2px solid #fde68a' }}>รายการ</th>
                        <th style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#92400e', textAlign: 'center', borderBottom: '2px solid #fde68a' }}>จำนวน</th>
                        <th style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#92400e', textAlign: 'right', borderBottom: '2px solid #fde68a' }}>ยอดขาย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>ไม่มีข้อมูล</td></tr>
                      ) : topProducts.map((p: any, i: number) => (
                        <tr key={p.Id || i} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={(e: any) => e.currentTarget.style.background = '#fefce8'}
                          onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '8px 14px', fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8', borderBottom: '1px solid #fef9c3' }}>{i + 1}</td>
                          <td style={{ padding: '8px 14px', fontFamily: 'Kanit', fontSize: 11, color: '#1E5088', fontWeight: 500, borderBottom: '1px solid #fef9c3' }}>{p.Id}</td>
                          <td style={{ padding: '8px 14px', fontFamily: 'Kanit', fontSize: 11, color: '#334155', borderBottom: '1px solid #fef9c3', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</td>
                          <td style={{ padding: '8px 14px', fontFamily: 'Kanit', fontSize: 11, color: '#334155', textAlign: 'center', borderBottom: '1px solid #fef9c3' }}>{fmt2(p.qty)}</td>
                          <td style={{ padding: '8px 14px', fontFamily: 'Kanit', fontSize: 12, color: '#2A6AAA', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #fef9c3' }}>{fmt2(p.total)} ฿</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }


  const Linkcompany = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // สาขาปัจจุบัน
    const [currentUser, setCurrentUser] = useState<any>(null);

    // สาขาที่เชื่อมต่อทั้งหมด (จากตั้งค่าเชื่อมสาขา)
    const [connectedBranches, setConnectedBranches] = useState<any[]>([]);
    const [acceptedConnectionsCount, setAcceptedConnectionsCount] = useState(0);
    const [unavailableTransferConnectionsCount, setUnavailableTransferConnectionsCount] = useState(0);

    // สาขาที่เลือกโอน (หลายสาขา)
    const [selectedBranches, setSelectedBranches] = useState<any[]>([]);
    const [branchDropdownValue, setBranchDropdownValue] = useState("");

    // ค้นหาสินค้า (scan barcode)
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);

    // สินค้าที่ scan แล้ว - แสดงข้อมูลทั้งสาขาหลักและสาขาปลายทาง
    const [scannedProduct, setScannedProduct] = useState<any>(null);

    // จำนวนโอนต่อสาขา { [branchId]: qty }
    const [branchTransferQty, setBranchTransferQty] = useState<Record<number, number>>({});

    // เลือก lot สำหรับโอน
    const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

    // รายการโอนทั้งหมด
    const [transferItems, setTransferItems] = useState<any[]>([]);

    // Loading
    const [submitting, setSubmitting] = useState(false);

    // ประวัติการโอน
    const [showHistory, setShowHistory] = useState(false);
    const [transferHistory, setTransferHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    const fetchTransferHistory = async () => {
      if (!currentUser?.id) return;
      setHistoryLoading(true);
      try {
        const res = await axios.get(`/api/stocktransfer?userId=${currentUser.id}`);
        setTransferHistory(res.data || []);
      } catch (err) {
        console.error("Failed to fetch transfer history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    // พิมพ์ใบโอนสินค้า A4
    const printTransferDocument = (order: any) => {
      const isRemote = order.remark?.includes("Remote") || order.remark?.includes("remote");
      const totalItems = order.items?.length || 0;
      const totalQty = order.items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;
      const totalCost = order.items?.reduce((sum: number, item: any) => sum + ((item.qty || 0) * (item.cost || 0)), 0) || 0;
      const statusLabel = order.status === "completed" ? "สำเร็จ" : order.status === "failed" ? "ไม่สำเร็จ" : order.status === "pending_remote" ? "รอส่ง" : "รอดำเนินการ";
      const createdDate = new Date(order.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const completedDate = order.completedAt ? new Date(order.completedAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

      const ITEMS_PER_PAGE = 20;
      const pages = [];
      const itemsCopy = [...(order.items || [])];
      while (itemsCopy.length > 0) {
        pages.push(itemsCopy.splice(0, ITEMS_PER_PAGE));
      }
      if (pages.length === 0) pages.push([]);

      const generatePage = (pageItems: any[], pageNum: number, totalPages: number) => {
        const rows = pageItems.map((item: any, idx: number) => `
          <tr>
            <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#64748b;">${(pageNum - 1) * ITEMS_PER_PAGE + idx + 1}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#1E5088;font-weight:500;">${item.itemcode || "-"}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${item.itemName || "-"}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#64748b;">${item.barcode || "-"}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#64748b;">${item.lot || "-"}</td>
            <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#64748b;">${item.dateExp ? new Date(item.dateExp).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
            <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;">${item.qty || 0}</td>
            <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${item.cost ? Number(item.cost).toLocaleString("th-TH", { minimumFractionDigits: 2 }) : "-"}</td>
            <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:500;">${item.cost && item.qty ? (Number(item.cost) * Number(item.qty)).toLocaleString("th-TH", { minimumFractionDigits: 2 }) : "-"}</td>
          </tr>
        `).join("");

        // Empty rows to fill page
        const emptyRows = Array(Math.max(0, ITEMS_PER_PAGE - pageItems.length)).fill("").map(() => `
          <tr><td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;" colspan="9">&nbsp;</td></tr>
        `).join("");

        return `
          <div class="page">
            <!-- Header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:14px;border-bottom:3px solid #1E5088;">
              <div>
                <h1 style="margin:0;font-size:22px;color:#1E5088;font-weight:800;letter-spacing:0.5px;">ใบโอนสินค้าระหว่างสาขา</h1>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">Stock Transfer Document ${isRemote ? "(Remote)" : "(Local)"}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:1px;">${order.transferNo || "#" + order.id}</div>
                <div style="font-size:10px;color:#94a3b8;margin-top:2px;">หน้า ${pageNum}/${totalPages}</div>
                <div style="display:inline-block;margin-top:4px;padding:2px 10px;border-radius:12px;font-size:10px;font-weight:600;background:${order.status === "completed" ? "#D3F0E2" : order.status === "failed" ? "#fee2e2" : "#fef3c7"};color:${order.status === "completed" ? "#0C5238" : order.status === "failed" ? "#991b1b" : "#92400e"};">${statusLabel}</div>
              </div>
            </div>

            <!-- Info Grid -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">
                <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">สาขาผู้ส่ง (From)</div>
                <div style="font-size:14px;font-weight:700;color:#0f172a;">${order.fromBranchName || "-"}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${order.fromEmail || ""}</div>
              </div>
              <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">
                <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">สาขาผู้รับ (To)</div>
                <div style="font-size:14px;font-weight:700;color:#0f172a;">${order.toBranchName || "-"}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${order.toEmail || ""}</div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
              <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;">
                <div style="font-size:10px;color:#94a3b8;">ผู้ทำรายการ</div>
                <div style="font-size:12px;font-weight:600;color:#0f172a;">${order.person || "-"}</div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;">
                <div style="font-size:10px;color:#94a3b8;">วันที่โอน</div>
                <div style="font-size:12px;font-weight:600;color:#0f172a;">${createdDate}</div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;">
                <div style="font-size:10px;color:#94a3b8;">วันที่รับ</div>
                <div style="font-size:12px;font-weight:600;color:#0f172a;">${completedDate}</div>
              </div>
            </div>

            <!-- Items Table -->
            <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="text-align:center;padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;width:35px;">#</th>
                  <th style="padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;width:70px;">รหัส</th>
                  <th style="padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;">ชื่อสินค้า</th>
                  <th style="padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;width:80px;">Barcode</th>
                  <th style="padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;width:60px;">Lot</th>
                  <th style="text-align:center;padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;width:70px;">วันหมดอายุ</th>
                  <th style="text-align:center;padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;width:50px;">จำนวน</th>
                  <th style="text-align:right;padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;width:65px;">ราคาทุน</th>
                  <th style="text-align:right;padding:8px 6px;font-size:10px;color:#64748b;font-weight:700;border-bottom:2px solid #cbd5e1;width:75px;">รวม</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                ${emptyRows}
              </tbody>
            </table>

            ${pageNum === totalPages ? `
              <!-- Summary (last page only) -->
              <div style="border-top:2px solid #1E5088;padding-top:10px;display:flex;justify-content:flex-end;gap:24px;margin-bottom:20px;">
                <div style="text-align:right;">
                  <span style="font-size:11px;color:#64748b;">จำนวนรายการ: </span>
                  <span style="font-size:14px;font-weight:700;color:#0f172a;">${totalItems} รายการ</span>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:11px;color:#64748b;">จำนวนรวม: </span>
                  <span style="font-size:14px;font-weight:700;color:#1E5088;">${totalQty} ชิ้น</span>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:11px;color:#64748b;">มูลค่ารวม: </span>
                  <span style="font-size:14px;font-weight:700;color:#0f172a;">฿${totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <!-- Signature Section -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px;">
                <div style="text-align:center;">
                  <div style="border-bottom:1px solid #cbd5e1;padding-bottom:40px;margin:0 20px;"></div>
                  <div style="font-size:11px;color:#64748b;margin-top:6px;">ผู้ส่งสินค้า / Sender</div>
                  <div style="font-size:10px;color:#94a3b8;">วันที่ ....../....../......</div>
                </div>
                <div style="text-align:center;">
                  <div style="border-bottom:1px solid #cbd5e1;padding-bottom:40px;margin:0 20px;"></div>
                  <div style="font-size:11px;color:#64748b;margin-top:6px;">ผู้รับสินค้า / Receiver</div>
                  <div style="font-size:10px;color:#94a3b8;">วันที่ ....../....../......</div>
                </div>
              </div>
            ` : ""}

            <!-- Footer -->
            <div style="position:absolute;bottom:20px;left:20mm;right:20mm;text-align:center;font-size:9px;color:#cbd5e1;border-top:1px solid #f1f5f9;padding-top:6px;">
              เอกสารนี้สร้างโดยระบบ SmileStore POS · ${order.transferNo || "#" + order.id} · หน้า ${pageNum}/${totalPages}
            </div>
          </div>
        `;
      };

      const allPages = pages.map((pageItems, i) => generatePage(pageItems, i + 1, pages.length)).join("");

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ใบโอนสินค้า ${order.transferNo || "#" + order.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Kanit', sans-serif; }
            .page {
              width: 210mm; min-height: 297mm; padding: 15mm 20mm 25mm 20mm;
              position: relative; background: #fff;
              page-break-after: always;
            }
            .page:last-child { page-break-after: auto; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
              .page { padding: 10mm 15mm 20mm 15mm; }
            }
            @media screen {
              body { background: #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px 0; }
              .page { box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
            <button onclick="window.print()" style="padding:10px 24px;background:#1E5088;color:#fff;border:none;border-radius:8px;font-family:Kanit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(30, 80, 136,0.3);">🖨️ พิมพ์</button>
            <button onclick="window.close()" style="padding:10px 18px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-family:Kanit;font-size:14px;cursor:pointer;">✕ ปิด</button>
          </div>
          ${allPages}
        </body>
        </html>
      `);
      printWindow.document.close();
    };

    // ดึงข้อมูลสาขาและการเชื่อม
    useEffect(() => {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            router.push("/");
            return;
          }

          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);

          const userRes = await axios.get(`/api/login/logins/${userId}`);
          setCurrentUser(userRes.data);

          const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");

          const branches = accepted.map((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const localBranchId = Number(branch?.id);
            const isRemote = !localBranchId || Number.isNaN(localBranchId) || !branch;
            const branchId = isRemote
              ? (c.remoteUserId ? `remote_${c.id}` : null)
              : localBranchId;
            if (!branchId || (!isRemote && localBranchId === userId)) return null;
            return {
              id: branchId,
              company: branch?.company || c.remoteCompany || "",
              email: branch?.email || "",
              name: branch?.name || "",
              branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || "ไม่ทราบชื่อ",
              connectionId: c.id,
              isRemote: isRemote,
              tunnelUrl: c.tunnelUrl || "",
              apiToken: c.apiToken || "",
              remoteUserId: c.remoteUserId || null
            };
          }).filter((b: any) => b !== null);

          console.log("[DEBUG] accepted connections:", accepted);
          console.log("[DEBUG] mapped branches:", branches);
          setConnectedBranches(branches);
          setAcceptedConnectionsCount(accepted.length);
          setUnavailableTransferConnectionsCount(Math.max(accepted.length - branches.length, 0));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }, []);

    // เพิ่มสาขาเข้ารายการโอน
    const addBranch = () => {
      console.log("[DEBUG] addBranch called, branchDropdownValue:", branchDropdownValue);
      if (!branchDropdownValue) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเลือกสาขาปลายทาง</div>);
        return;
      }
      const branch = connectedBranches.find(b => String(b.id) === String(branchDropdownValue));
      console.log("[DEBUG] matched branch:", branch, "connectedBranches:", connectedBranches);
      if (!branch) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>ไม่พบข้อมูลสาขาที่เลือก</div>);
        return;
      }
      if (selectedBranches.find(b => String(b.id) === String(branch.id))) {
        toast.info(<div style={{ fontFamily: "Kanit" }}>สาขานี้ถูกเลือกแล้ว</div>);
        return;
      }
      setSelectedBranches((prev) => [...prev, branch]);
      setBranchDropdownValue("");
      setScannedProduct(null);
      setBranchTransferQty({});
    };

    // ลบสาขาออกจากรายการโอน
    const removeBranch = (branchId: number) => {
      setSelectedBranches(selectedBranches.filter(b => b.id !== branchId));
      setTransferItems(transferItems.filter(item => item.toBranchId !== branchId));
      const newQty = { ...branchTransferQty };
      delete newQty[branchId];
      setBranchTransferQty(newQty);
    };

    // Scan barcode / ค้นหาสินค้า
    const handleSearch = async () => {
      if (!searchQuery.trim() || !currentUser || selectedBranches.length === 0) {
        if (selectedBranches.length === 0) {
          toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเลือกสาขาปลายทางก่อน</div>);
        }
        return;
      }

      setSearchLoading(true);
      setScannedProduct(null);
      setBranchTransferQty({});
      setSelectedLotId(null);

      try {
        // แยก local กับ remote branches
        const localBranches = selectedBranches.filter((b: any) => !b.isRemote);
        const remoteBranchList = selectedBranches.filter((b: any) => b.isRemote).map((b: any) => ({
          branchId: b.id,
          tunnelUrl: b.tunnelUrl,
          apiToken: b.apiToken,
          remoteUserId: b.remoteUserId,
          branchName: b.branchName || b.company || "",
          remoteCompany: b.company || ""
        }));

        const res = await axios.post("/api/stocktransfer/branch-lookup", {
          query: searchQuery.trim(),
          mainCompanyId: currentUser.id,
          branchIds: localBranches.map((b: any) => b.id),
          remoteBranches: remoteBranchList
        });

        if (res.data.length === 0) {
          toast.info(<div style={{ fontFamily: "Kanit" }}>ไม่พบสินค้า</div>);
        } else if (res.data.length === 1) {
          setScannedProduct(res.data[0]);
        } else {
          setScannedProduct({ multipleResults: res.data });
        }
      } catch (error) {
        console.error("Error searching:", error);
        toast.error(<div style={{ fontFamily: "Kanit" }}>ค้นหาล้มเหลว</div>);
      } finally {
        setSearchLoading(false);
      }
    };

    // เลือกสินค้าจากหลายรายการ
    const selectProduct = (product: any) => {
      setScannedProduct(product);
      setBranchTransferQty({});
      setSelectedLotId(null);
    };

    // เพิ่มรายการโอน
    const addToTransferList = () => {
      if (!scannedProduct || scannedProduct.multipleResults || !selectedLotId) return;

      const selectedLot = scannedProduct.mainLots?.find((l: any) => l.id === selectedLotId);
      if (!selectedLot) return;

      const lotBalance = parseFloat(String(selectedLot.balance)) || 0;

      // ตรวจสอบจำนวนรวมทุกสาขาต้องไม่เกิน balance
      let totalTransfer = 0;
      const branchEntries: any[] = [];

      for (const branch of selectedBranches) {
        const qty = branchTransferQty[branch.id] || 0;
        if (qty > 0) {
          totalTransfer += qty;
          const branchBalance = scannedProduct.branchBalances?.find((bb: any) => bb.branchId === branch.id);
          branchEntries.push({
            toBranchId: branch.id,
            toBranchName: branch.branchName || branch.company,
            toBranchEmail: branch.email,
            qty: qty,
            receiverProductCode: branchBalance?.productCode || null,
            receiverProductName: branchBalance?.productName || null,
            receiverBarcode: branchBalance?.barcode || null,
            receiverBalance: branchBalance?.totalBalance || 0
          });
        }
      }

      if (branchEntries.length === 0) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาระบุจำนวนโอนอย่างน้อย 1 สาขา</div>);
        return;
      }

      if (totalTransfer > lotBalance) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>จำนวนรวมทุกสาขา ({totalTransfer}) เกินยอดคงเหลือ ({lotBalance})</div>);
        return;
      }

      // ตรวจสอบ lot ซ้ำ
      const existingLotItems = transferItems.filter(item => item.lotId === selectedLotId);
      const existingBranchIds = existingLotItems.map(item => item.toBranchId);

      for (const entry of branchEntries) {
        if (existingBranchIds.includes(entry.toBranchId)) {
          toast.error(<div style={{ fontFamily: "Kanit" }}>Lot นี้มีในรายการสาขา {entry.toBranchName} แล้ว</div>);
          return;
        }
      }

      const newItems = branchEntries.map(entry => ({
        lotId: selectedLotId,
        itemcode: scannedProduct.code,
        itemName: scannedProduct.ProductName,
        Barcode: scannedProduct.Barcode,
        Unit: scannedProduct.Unit,
        lot: selectedLot.lot,
        dateExp: selectedLot.dateExp,
        balance: selectedLot.balance,
        cost: selectedLot.newCost || scannedProduct.CostActual || 0,
        ...entry
      }));

      setTransferItems([...transferItems, ...newItems]);
      setSearchQuery("");
      setScannedProduct(null);
      setBranchTransferQty({});
      setSelectedLotId(null);
      toast.success(<div style={{ fontFamily: "Kanit" }}>เพิ่มรายการสำเร็จ</div>);
    };

    // ลบรายการโอน
    const removeItem = (index: number) => {
      setTransferItems(transferItems.filter((_, i) => i !== index));
    };

    // ยืนยันการโอน (โอนทีละสาขา, รองรับทั้ง local และ remote)
    const handleTransfer = async () => {
      if (transferItems.length === 0) {
        toast.error(<div style={{ fontFamily: "Kanit" }}>กรุณาเพิ่มสินค้าในรายการ</div>);
        return;
      }

      setSubmitting(true);

      // === Pre-check: ตรวจสอบการเชื่อมต่อก่อนโอน (ผ่าน server-side เพื่อหลีกเลี่ยง CORS) ===
      try {
        const branchIdsInTransfer = [...new Set(transferItems.map(item => String(item.toBranchId)))];
        const branchesToCheck = branchIdsInTransfer.map(id => {
          const branch = selectedBranches.find(b => String(b.id) === id);
          return branch ? {
            branchName: branch.branchName || branch.company || "ไม่ทราบ",
            tunnelUrl: branch.tunnelUrl || "",
            isRemote: !!branch.isRemote
          } : null;
        }).filter(Boolean);

        const checkRes = await axios.post("/api/stocktransfer/check-connection", { branches: branchesToCheck });
        const { allOk, failed } = checkRes.data;

        if (!allOk && failed?.length > 0) {
          setSubmitting(false);
          const failedNames = failed.map((f: any) => `${f.branchName} (${f.error})`).join(", ");
          toast.error(
            <div style={{ fontFamily: "Kanit", fontSize: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>ไม่สามารถยืนยันการโอนได้</div>
              <div>กรุณาตรวจสอบ Internet หรือการเชื่อมต่อสาขาต้นทางและปลายทาง</div>
              <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>
                สาขาที่เชื่อมต่อไม่ได้: {failedNames}
              </div>
            </div>,
            { duration: 8000 }
          );
          return;
        }
      } catch (checkError) {
        console.error("Pre-transfer check error:", checkError);
        setSubmitting(false);
        toast.error(
          <div style={{ fontFamily: "Kanit" }}>
            <div style={{ fontWeight: 600 }}>ไม่สามารถยืนยันการโอนได้</div>
            <div>กรุณาตรวจสอบ Internet หรือการเชื่อมต่อสาขาต้นทางและปลายทาง</div>
          </div>,
          { duration: 8000 }
        );
        return;
      }

      try {
        // จัดกลุ่มตามสาขาปลายทาง
        const byBranch: Record<string, any[]> = {};
        for (const item of transferItems) {
          const key = String(item.toBranchId);
          if (!byBranch[key]) byBranch[key] = [];
          byBranch[key].push(item);
        }

        const results: any[] = [];
        for (const [branchIdStr, items] of Object.entries(byBranch)) {
          const branch = selectedBranches.find(b => String(b.id) === branchIdStr);

          const payload: any = {
            fromUserId: currentUser.id,
            fromCompany: currentUser.company,
            toCompany: branch?.company || "",
            items: items.map((item: any) => ({
              lotId: item.lotId,
              itemcode: item.itemcode,
              itemName: item.itemName,
              lot: item.lot,
              dateExp: item.dateExp,
              qty: item.qty,
              cost: item.cost
            })),
            person: currentUser.email
          };

          if (branch?.isRemote) {
            // Remote transfer ผ่าน Tunnel
            payload.isRemote = true;
            payload.tunnelUrl = branch.tunnelUrl;
            payload.apiToken = branch.apiToken;
            payload.remoteUserId = branch.remoteUserId;
          } else {
            // Local transfer ใน DB เดียวกัน
            payload.toUserId = branch?.id;
          }

          const res = await axios.post("/api/stocktransfer", payload);
          results.push({
            branch: branch?.branchName || branch?.company,
            transferNo: res.data.data.transfer.transferNo,
            isRemote: !!branch?.isRemote
          });
        }

        const summary = results.map(r =>
          `${r.branch}${r.isRemote ? " (Remote)" : ""}: ${r.transferNo}`
        ).join(", ");
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>โอนสินค้าเรียบร้อย ({summary})</div>,
          duration: 5000,
        });

        setTransferItems([]);
        setScannedProduct(null);
        setBranchTransferQty({});
      } catch (error: any) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>{error.response?.data?.error || "ไม่สามารถโอนได้"}</div>,
          duration: 5000,
        });
      } finally {
        setSubmitting(false);
      }
    };

    // หาสาขาที่ยังไม่ได้เลือก
    const availableBranches = connectedBranches.filter(
      (b) => !selectedBranches.find((s) => String(s.id) === String(b.id))
    );

    return (
      <div className="container-fluid" style={{ padding: 20 }}>
        {/* หัวข้อ */}
        <div className="mb-4 d-flex align-items-center justify-content-between" style={{
          backgroundColor: "#F3F8FC",
          padding: 15,
          borderRadius: 12,
          border: "1px solid #CCDFF1"
        }}>
          <div style={{ width: 120 }}></div>
          <div style={{ fontFamily: "kanit_B", fontSize: 22, color: "#1E5088" }}>📦 โอนสินค้าระหว่างสาขา</div>
          <button
            onClick={() => { setShowHistory(true); fetchTransferHistory(); }}
            style={{
              fontFamily: "Kanit",
              fontSize: 13,
              backgroundColor: "#1E5088",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 6px rgba(30, 80, 136,0.3)"
            }}
          >
            📋 ประวัติการโอน
          </button>
        </div>

        {/* === Transfer History Modal === */}
        {showHistory && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center"
          }} onClick={() => setShowHistory(false)}>
            <div style={{
              backgroundColor: "#fff", borderRadius: 16, width: "90%", maxWidth: 900,
              maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)"
            }} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div style={{
                padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #1E5088 0%, #3E86C7 100%)",
                color: "#fff", borderRadius: "16px 16px 0 0",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontFamily: "kanit_B", fontSize: 20 }}>📋 ประวัติการโอนสินค้า</div>
                  <div style={{ fontFamily: "Kanit", fontSize: 12, opacity: 0.8 }}>รายการโอนทั้งหมด {transferHistory.length} ออเดอร์</div>
                </div>
                <button onClick={() => setShowHistory(false)} style={{
                  background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
                  width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
                  fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center"
                }}>✕</button>
              </div>

              {/* Body */}
              <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
                {historyLoading ? (
                  <div style={{ textAlign: "center", padding: 40, fontFamily: "Kanit", color: "#64748b" }}>
                    🔄 กำลังโหลด...
                  </div>
                ) : transferHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, fontFamily: "Kanit", color: "#94a3b8" }}>
                    ยังไม่มีประวัติการโอน
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {transferHistory.map((order: any) => {
                      const isExpanded = expandedOrderId === order.id;
                      const statusColor = order.status === "completed" ? "#147F56" : order.status === "failed" ? "#dc2626" : "#f59e0b";
                      const statusLabel = order.status === "completed" ? "สำเร็จ" : order.status === "failed" ? "ไม่สำเร็จ" : order.status === "pending_remote" ? "รอส่ง Remote" : order.status;
                      const isRemoteOrder = order.remark?.includes("Remote") || order.remark?.includes("remote");
                      const totalItems = order.items?.length || 0;
                      const totalQty = order.items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;

                      return (
                        <div key={order.id} style={{
                          border: `1px solid ${isExpanded ? "#3E86C7" : "#e2e8f0"}`,
                          borderRadius: 12,
                          overflow: "hidden",
                          transition: "all 0.2s",
                          boxShadow: isExpanded ? "0 4px 12px rgba(62, 134, 199,0.15)" : "0 1px 3px rgba(0,0,0,0.04)"
                        }}>
                          {/* Order Header - Clickable */}
                          <div
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            style={{
                              padding: "14px 18px", cursor: "pointer",
                              backgroundColor: isExpanded ? "#F3F8FC" : "#fafafa",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              transition: "background-color 0.15s"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{
                                width: 42, height: 42, borderRadius: 10,
                                backgroundColor: statusColor + "18",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 20
                              }}>
                                {order.status === "completed" ? "✅" : order.status === "failed" ? "❌" : "⏳"}
                              </div>
                              <div>
                                <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1e293b" }}>
                                  {order.transferNo || `#${order.id}`}
                                  {isRemoteOrder && <span style={{ fontSize: 10, color: "#7c3aed", marginLeft: 6, backgroundColor: "#f3e8ff", padding: "2px 6px", borderRadius: 10 }}>Remote</span>}
                                </div>
                                <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b", display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 2 }}>
                                  <span>📤 <strong>{order.fromBranchName || "-"}</strong></span>
                                  <span>➡️</span>
                                  <span>📥 <strong>{order.toBranchName || "-"}</strong></span>
                                </div>
                                <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#94a3b8", display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 1 }}>
                                  <span>ผู้โอน: {order.person || "-"}</span>
                                  <span>· วันที่โอน: {new Date(order.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                  {order.completedAt && <span>· วันที่รับ: {new Date(order.completedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                                  <span>· {totalItems} รายการ · {totalQty} ชิ้น</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button
                                title="พิมพ์ใบโอนสินค้า"
                                onClick={(e) => { e.stopPropagation(); printTransferDocument(order); }}
                                style={{
                                  background: "#F3F8FC", border: "1px solid #CCDFF1", color: "#1E5088",
                                  width: 30, height: 30, borderRadius: 8, cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 14, transition: "all 0.15s"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#1E5088"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#F3F8FC"; e.currentTarget.style.color = "#1E5088"; }}
                              >🖨️</button>
                              <span style={{
                                fontFamily: "Kanit", fontSize: 11, fontWeight: 600,
                                color: statusColor, backgroundColor: statusColor + "15",
                                padding: "3px 10px", borderRadius: 20
                              }}>{statusLabel}</span>
                              <span style={{ fontSize: 14, color: "#94a3b8", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                            </div>
                          </div>

                          {/* Expanded Items */}
                          {isExpanded && order.items && (
                            <div style={{ borderTop: "1px solid #e2e8f0" }}>
                              <div style={{
                                padding: "10px 18px", backgroundColor: "#f8fafc",
                                display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr",
                                gap: 8, fontFamily: "kanit_B", fontSize: 11, color: "#64748b"
                              }}>
                                <div>รหัส</div>
                                <div>ชื่อสินค้า</div>
                                <div>Lot</div>
                                <div style={{ textAlign: "center" }}>จำนวน</div>
                                <div style={{ textAlign: "right" }}>ต้นทุน</div>
                              </div>
                              {order.items.map((item: any, idx: number) => (
                                <div key={item.id || idx} style={{
                                  padding: "10px 18px",
                                  display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr",
                                  gap: 8, fontFamily: "Kanit", fontSize: 12,
                                  borderBottom: idx < order.items.length - 1 ? "1px solid #f1f5f9" : "none",
                                  backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa"
                                }}>
                                  <div style={{ color: "#1E5088", fontWeight: 500 }}>{item.itemcode}</div>
                                  <div style={{ color: "#334155" }}>{item.itemName}</div>
                                  <div style={{ color: "#64748b" }}>{item.lot || "-"}</div>
                                  <div style={{ textAlign: "center", fontWeight: 600, color: "#0f172a" }}>{item.qty}</div>
                                  <div style={{ textAlign: "right", color: "#64748b" }}>{item.cost ? `฿${Number(item.cost).toLocaleString()}` : "-"}</div>
                                </div>
                              ))}
                              {/* Footer */}
                              <div style={{
                                padding: "10px 18px", backgroundColor: "#F3F8FC",
                                display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6,
                                fontFamily: "Kanit", fontSize: 12, color: "#475569"
                              }}>
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                  <span>ผู้ทำรายการ: <strong>{order.person || "-"}</strong></span>
                                  <span>สาขาผู้ส่ง: <strong>{order.fromBranchName || "-"}</strong> ({order.fromEmail || "-"})</span>
                                  <span>สาขาผู้รับ: <strong>{order.toBranchName || "-"}</strong> ({order.toEmail || "-"})</span>
                                </div>
                                <div>รวม: <strong style={{ color: "#1E5088" }}>{totalQty} ชิ้น</strong></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === Section: สาขาผู้ส่ง + เลือกสาขาผู้รับ (หลายสาขา) === */}
        <div className="row mb-4">
          {/* สาขาผู้ส่ง */}
          <div className="col-md-4">
            <div style={{
              backgroundColor: "#F3F8FC",
              padding: 15,
              borderRadius: 12,
              border: "1px solid #CCDFF1",
              height: "100%"
            }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#173F6B", marginBottom: 10 }}>📤 สาขาผู้ส่ง (สาขาหลัก)</div>
              <div style={{ fontFamily: "Kanit", fontSize: 16, fontWeight: 600 }}>{currentUser?.company || "-"}</div>
              <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>{currentUser?.email || "-"}</div>
            </div>
          </div>

          <div className="col-md-1 d-flex align-items-center justify-content-center">
            <div style={{ fontSize: 28 }}>➡️</div>
          </div>

          {/* สาขาผู้รับ (เลือกหลายสาขา) */}
          <div className="col-md-7">
            <div style={{
              backgroundColor: "#fef3c7",
              padding: 15,
              borderRadius: 12,
              border: "1px solid #fcd34d"
            }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#854d0e", marginBottom: 10 }}>📥 สาขาผู้รับ (เลือกได้หลายสาขา)</div>

              {/* Dropdown + ปุ่มเพิ่ม */}
              <div className="d-flex gap-2 mb-2">
                <select
                  className="form-control"
                  style={{ fontFamily: "Kanit", fontSize: 13 }}
                  value={branchDropdownValue}
                  onChange={(e) => setBranchDropdownValue(e.target.value)}
                >
                  <option value="">-- เลือกสาขาปลายทาง --</option>
                  {availableBranches.map((branch, index) => (
                    <option key={branch.id ?? `branch-${index}`} value={String(branch.id)}>
                      {branch.branchName || branch.company || branch.name} {branch.isRemote ? "(Remote)" : `(${branch.email})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={addBranch}
                  disabled={!branchDropdownValue}
                  style={{ fontFamily: "Kanit", fontSize: 13, whiteSpace: "nowrap" }}
                >
                  + เพิ่ม
                </button>
              </div>

              {/* รายการสาขาที่เลือก */}
              {selectedBranches.length === 0 ? (
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#92400e", marginTop: 5 }}>
                  ยังไม่ได้เลือกสาขาปลายทาง
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {selectedBranches.map((branch) => (
                    <div key={branch.id} style={{
                      backgroundColor: "#fff",
                      border: "1px solid #f59e0b",
                      borderRadius: 20,
                      padding: "4px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "Kanit",
                      fontSize: 12
                    }}>
                      <span style={{ color: "#92400e", fontWeight: 500 }}>
                        {branch.branchName || branch.company}
                        {branch.isRemote && <span style={{ color: "#7c3aed", fontSize: 10, marginLeft: 4 }}>(Remote)</span>}
                      </span>
                      <button
                        onClick={() => removeBranch(branch.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: 0,
                          lineHeight: 1
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {connectedBranches.length === 0 && acceptedConnectionsCount === 0 && (
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#dc2626", marginTop: 5 }}>
                  ⚠️ ไม่มีสาขาที่เชื่อมต่อ กรุณาเชื่อมสาขาก่อน (ตั้งค่าเชื่อมสาขา)
                </div>
              )}

              {unavailableTransferConnectionsCount > 0 && (
                <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#b45309", marginTop: 5 }}>
                  ⚠️ พบการเชื่อมสาขา {unavailableTransferConnectionsCount} รายการ ที่ข้อมูลไม่สมบูรณ์ (ไม่มี remoteUserId) กรุณาเชื่อมสาขาใหม่อีกครั้ง
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === Section: Scan Barcode / ค้นหาสินค้า === */}
        <div className="mb-4" style={{
          backgroundColor: "#f8fafc",
          padding: 15,
          borderRadius: 12,
          border: "1px solid #e2e8f0"
        }}>
          <div style={{ fontFamily: "kanit_B", fontSize: 14, marginBottom: 10, color: "#475569" }}>🔍 Scan Barcode / ค้นหาสินค้า</div>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Scan Barcode / พิมพ์รหัสสินค้า / ชื่อสินค้า"
              style={{ fontFamily: "Kanit", fontSize: 15 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={searchLoading || selectedBranches.length === 0}
              style={{ fontFamily: "Kanit" }}
            >
              {searchLoading ? "🔄" : "🔍 ค้นหา"}
            </button>
          </div>
        </div>

        {/* === Section: ผลการ Scan - ถ้ามีหลายรายการให้เลือก === */}
        {scannedProduct?.multipleResults && (
          <div className="mb-4" style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 12,
            border: "1px solid #3E86C7"
          }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1E5088", marginBottom: 10 }}>
              พบ {scannedProduct.multipleResults.length} รายการ - เลือกสินค้า
            </div>
            {scannedProduct.multipleResults.map((p: any, idx: number) => (
              <div
                key={idx}
                onClick={() => selectProduct(p)}
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer",
                  fontFamily: "Kanit",
                  borderRadius: 8,
                  transition: "background-color 0.15s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F3F8FC"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.ProductName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>รหัส: {p.code} | Barcode: {p.Barcode || "-"}</div>
                  </div>
                  <div style={{
                    backgroundColor: "#E5EEF8",
                    color: "#173F6B",
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    คงเหลือ: {p.mainTotalBalance} {p.Unit || ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === Section: แสดงข้อมูลสินค้า (ซ้าย: สาขาหลัก / ขวา: สาขาปลายทาง) === */}
        {scannedProduct && !scannedProduct.multipleResults && (
          <div className="mb-4" style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 12,
            border: "2px solid #3E86C7"
          }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#1E5088", marginBottom: 15 }}>
              📋 ข้อมูลสินค้า: {scannedProduct.ProductName}
            </div>

            <div className="row">
              {/* ===== ฝั่งซ้าย: ข้อมูลสาขาหลัก ===== */}
              <div className="col-md-5">
                <div style={{
                  backgroundColor: "#F3F8FC",
                  padding: 15,
                  borderRadius: 12,
                  border: "1px solid #CCDFF1",
                  height: "100%"
                }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#173F6B", marginBottom: 10 }}>
                    📤 สาขาหลัก - ยอดคงเหลือ
                  </div>
                  <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: "#64748b" }}>รหัส:</span> <strong>{scannedProduct.code}</strong>
                  </div>
                  <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: "#64748b" }}>Barcode:</span> {scannedProduct.Barcode || "-"}
                  </div>
                  <div style={{ fontFamily: "Kanit", fontSize: 13, marginBottom: 12 }}>
                    <span style={{ color: "#64748b" }}>ยอดคงเหลือรวม:</span>{" "}
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#173F6B" }}>
                      {scannedProduct.mainTotalBalance} {scannedProduct.Unit || ""}
                    </span>
                  </div>

                  {/* เลือก Lot */}
                  <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#475569", marginBottom: 6 }}>เลือก Lot:</div>
                  {scannedProduct.mainLots && scannedProduct.mainLots.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {scannedProduct.mainLots.map((lot: any) => (
                        <div
                          key={lot.id}
                          onClick={() => setSelectedLotId(lot.id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: selectedLotId === lot.id ? "2px solid #3E86C7" : "1px solid #d1d5db",
                            backgroundColor: selectedLotId === lot.id ? "#E5EEF8" : "#fff",
                            cursor: "pointer",
                            fontFamily: "Kanit",
                            fontSize: 12,
                            transition: "all 0.15s"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Lot: {lot.lot || "N/A"}</span>
                            <span style={{ fontWeight: 600, color: "#173F6B" }}>{lot.balance} {scannedProduct.Unit || ""}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            หมดอายุ: {lot.dateExp ? new Date(lot.dateExp).toLocaleDateString("th-TH") : "-"}
                            {lot.newCost ? ` | ต้นทุน: ${lot.newCost}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#dc2626" }}>
                      ไม่มี Lot ที่มีสินค้าคงเหลือ
                    </div>
                  )}
                </div>
              </div>

              {/* ===== ฝั่งขวา: ข้อมูลแต่ละสาขาปลายทาง ===== */}
              <div className="col-md-7">
                <div style={{
                  backgroundColor: "#fffbeb",
                  padding: 15,
                  borderRadius: 12,
                  border: "1px solid #fde68a",
                  height: "100%"
                }}>
                  <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#854d0e", marginBottom: 10 }}>
                    📥 สาขาปลายทาง - ยอดคงเหลือ & จำนวนโอน
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedBranches.map((branch) => {
                      const branchBalance = scannedProduct.branchBalances?.find((bb: any) => bb.branchId === branch.id);
                      return (
                        <div key={branch.id} style={{
                          backgroundColor: "#fff",
                          padding: 12,
                          borderRadius: 10,
                          border: "1px solid #e5e7eb"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#1e293b" }}>
                                {branch.branchName || branch.company}
                              </div>
                              <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b" }}>
                                {branch.email}
                              </div>
                            </div>
                            <div style={{
                              backgroundColor: branchBalance?.hasProduct ? "#D3F0E2" : "#fef2f2",
                              color: branchBalance?.hasProduct ? "#0C5238" : "#dc2626",
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontFamily: "Kanit",
                              fontWeight: 500
                            }}>
                              {branchBalance?.hasProduct ? `คงเหลือ: ${branchBalance.totalBalance}` : (branchBalance?.remoteError || "ไม่พบสินค้า")}
                            </div>
                          </div>

                          {branchBalance?.hasProduct && (
                            <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                              รหัสสาขา: {branchBalance.productCode || "-"} | ชื่อ: {branchBalance.productName || "-"}
                              {branchBalance.queriedCompanyId && (
                                <span style={{ color: "#9333ea", marginLeft: 6 }}>
                                  [companyId: {branchBalance.queriedCompanyId}, src: {branchBalance.source}]
                                </span>
                              )}
                            </div>
                          )}

                          {/* Input จำนวนโอน */}
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontFamily: "Kanit", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>จำนวนโอน:</span>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ fontFamily: "Kanit", fontSize: 13, maxWidth: 120, textAlign: "center" }}
                              min={0}
                              value={branchTransferQty[branch.id] || ""}
                              onChange={(e) => {
                                setBranchTransferQty({
                                  ...branchTransferQty,
                                  [branch.id]: parseInt(e.target.value) || 0
                                });
                              }}
                              placeholder="0"
                            />
                            <span style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>{scannedProduct.Unit || ""}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ปุ่มเพิ่มลงรายการ */}
                  <div className="text-center mt-3">
                    <button
                      className="btn btn-primary"
                      style={{ fontFamily: "Kanit", fontSize: 14, padding: "8px 30px" }}
                      onClick={addToTransferList}
                      disabled={!selectedLotId || Object.values(branchTransferQty).every(q => !q || q <= 0)}
                    >
                      ➕ เพิ่มลงรายการโอน
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Section: ตารางรายการโอน === */}
        <div style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 20
        }}>
          <div style={{ fontFamily: "kanit_B", fontSize: 16, marginBottom: 10, color: "#173F6B" }}>
            📋 รายการโอน ({transferItems.length})
          </div>

          {transferItems.length === 0 ? (
            <div className="text-center py-4" style={{ fontFamily: "Kanit", color: "#9ca3af" }}>
              ยังไม่มีสินค้าในรายการ
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover" style={{ fontFamily: "Kanit", fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th style={{ fontSize: 12, backgroundColor: "#E5EEF8", color: "#1E5088" }}>รหัส</th>
                    <th style={{ fontSize: 12, backgroundColor: "#E5EEF8", color: "#1E5088" }}>ชื่อสินค้า</th>
                    <th style={{ fontSize: 12, backgroundColor: "#E5EEF8", color: "#1E5088" }}>Barcode</th>
                    <th style={{ fontSize: 12 }}>Lot</th>
                    <th style={{ fontSize: 12 }}>หมดอายุ</th>
                    <th style={{ fontSize: 12, backgroundColor: "#fef3c7", color: "#92400e" }}>สาขาปลายทาง</th>
                    <th style={{ fontSize: 12, backgroundColor: "#fef3c7", color: "#92400e" }}>ยอดคงเหลือปลายทาง</th>
                    <th style={{ fontSize: 12, backgroundColor: "#E5EEF8", color: "#173F6B" }}>จำนวนโอน</th>
                    <th style={{ fontSize: 12, width: 50 }}>ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {transferItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontSize: 11, color: "#3E86C7", fontWeight: 500 }}>{item.itemcode || "-"}</td>
                      <td style={{ fontSize: 11 }}>{item.itemName}</td>
                      <td style={{ fontSize: 10, color: "#64748b" }}>{item.Barcode || "-"}</td>
                      <td style={{ fontSize: 11, color: "#64748b" }}>{item.lot || "-"}</td>
                      <td style={{ fontSize: 11 }}>{item.dateExp ? new Date(item.dateExp).toLocaleDateString("th-TH") : "-"}</td>
                      <td style={{ fontSize: 11 }}>
                        <span style={{
                          backgroundColor: "#fef3c7",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          color: "#92400e",
                          fontWeight: 500
                        }}>
                          {item.toBranchName}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, textAlign: "center" }}>{item.receiverBalance || 0}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: "#2A6AAA", textAlign: "center" }}>{item.qty}</td>
                      <td>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeItem(idx)}
                          style={{ fontSize: 10, padding: "2px 6px" }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ปุ่มยืนยัน */}
        <div className="text-center">
          <button
            className="btn btn-success btn-lg"
            style={{ fontFamily: "kanit_B", fontSize: 18, padding: "12px 40px" }}
            onClick={handleTransfer}
            disabled={submitting || transferItems.length === 0}
          >
            {submitting ? "กำลังโอน..." : "📤 ยืนยันการโอน"}
          </button>
        </div>
      </div>
    );
  }

  const Settingcompany = () => {

    const router = useRouter();

    // ข้อมูลสาขาปัจจุบัน
    const [currentUser, setCurrentUser] = useState<any>(null);

    // ตั้งค่า Tunnel URL ของเรา
    const [myTunnelUrl, setMyTunnelUrl] = useState("");
    const [myApiToken, setMyApiToken] = useState("");
    const [editingTunnel, setEditingTunnel] = useState(false);
    const [tunnelInput, setTunnelInput] = useState("");
    const [savingTunnel, setSavingTunnel] = useState(false);

    // Token visibility
    const [showToken, setShowToken] = useState(false);
    const [generatingToken, setGeneratingToken] = useState(false);

    // Pairing Code
    const [myPairingCode, setMyPairingCode] = useState("");
    const [pairingExpiresAt, setPairingExpiresAt] = useState<string | null>(null);
    const [generatingPairing, setGeneratingPairing] = useState(false);
    const [pairingCountdown, setPairingCountdown] = useState(0);

    // เชื่อมต่อสาขาใหม่
    const [connectTunnelUrl, setConnectTunnelUrl] = useState("");
    const [connectPairingCode, setConnectPairingCode] = useState("");
    const [connectBranchName, setConnectBranchName] = useState("");
    const [connecting, setConnecting] = useState(false);

    // รายการสาขาที่เชื่อมต่อ
    const [allConnections, setAllConnections] = useState<any[]>([]);

    // แก้ไข connection
    const [editingConnId, setEditingConnId] = useState<number | null>(null);
    const [editTunnelUrl, setEditTunnelUrl] = useState("");
    const [editApiToken, setEditApiToken] = useState("");
    const [editBranchName, setEditBranchName] = useState("");

    // Checking status
    const [checkingId, setCheckingId] = useState<number | null>(null);

    // ดึงข้อมูลทั้งหมด
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const payload = jwtDecode<any>(token);
        const userId = Number(payload.idcompany);

        // ดึงข้อมูล user + settings
        const [userRes, settingsRes] = await Promise.all([
          axios.get(`/api/login/logins/${userId}`),
          axios.get(`/api/branchconnection/settings?userId=${userId}`)
        ]);

        setCurrentUser(userRes.data);
        setMyTunnelUrl(settingsRes.data.tunnelUrl || "");
        setMyApiToken(settingsRes.data.apiToken || "");
        setTunnelInput(settingsRes.data.tunnelUrl || "");

        // ดึงรายการ connections
        const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
        const accepted = connRes.data.filter((c: any) => c.status === "accepted");
        setAllConnections(accepted);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    useEffect(() => {
      fetchData();
    }, []);

    // บันทึก Tunnel URL ของเรา
    const handleSaveTunnel = async () => {
      if (!currentUser) return;
      setSavingTunnel(true);
      try {
        await axios.put("/api/branchconnection/settings", {
          userId: currentUser.id,
          tunnelUrl: tunnelInput.trim()
        });
        setMyTunnelUrl(tunnelInput.trim());
        setEditingTunnel(false);
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึก Tunnel URL สำเร็จ</div>, { duration: 2000 });
      } catch (err: any) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกไม่สำเร็จ</div>, { duration: 2000 });
      } finally {
        setSavingTunnel(false);
      }
    };

    // สร้าง/Regenerate API Token
    const handleGenerateToken = async () => {
      if (!currentUser) return;
      if (myApiToken && !confirm("การสร้าง Token ใหม่จะทำให้ Token เดิมใช้งานไม่ได้ ต้องการดำเนินการต่อ?")) return;
      setGeneratingToken(true);
      try {
        const res = await axios.post("/api/branchconnection/settings", {
          userId: currentUser.id
        });
        setMyApiToken(res.data.apiToken);
        setShowToken(true);
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สร้าง Token ใหม่สำเร็จ</div>, { duration: 2000 });
      } catch (err: any) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สร้าง Token ไม่สำเร็จ</div>, { duration: 2000 });
      } finally {
        setGeneratingToken(false);
      }
    };

    // สร้างรหัสจับคู่
    const handleGeneratePairing = async () => {
      if (!currentUser) return;
      if (!myTunnelUrl) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>กรุณาตั้งค่า Tunnel URL ก่อน</div>, { duration: 2000 });
        return;
      }
      setGeneratingPairing(true);
      try {
        const res = await axios.post("/api/branchconnection/pairing", {
          userId: currentUser.id
        });
        setMyPairingCode(res.data.pairingCode);
        setPairingExpiresAt(res.data.expiresAt);
        setPairingCountdown(600);
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สร้างรหัสจับคู่สำเร็จ</div>, { duration: 2000 });
      } catch (err: any) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>{err.response?.data?.error || "สร้างรหัสไม่สำเร็จ"}</div>, { duration: 2000 });
      } finally {
        setGeneratingPairing(false);
      }
    };

    // Countdown timer สำหรับ pairing code
    useEffect(() => {
      if (pairingCountdown <= 0) return;
      const timer = setInterval(() => {
        setPairingCountdown(prev => {
          if (prev <= 1) {
            setMyPairingCode("");
            setPairingExpiresAt(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }, [pairingCountdown]);

    // คัดลอก Token
    const handleCopyToken = () => {
      navigator.clipboard.writeText(myApiToken);
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>คัดลอก Token แล้ว</div>, { duration: 1500 });
    };

    // คัดลอก Tunnel URL
    const handleCopyTunnel = () => {
      navigator.clipboard.writeText(myTunnelUrl);
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>คัดลอก Tunnel URL แล้ว</div>, { duration: 1500 });
    };

    // คัดลอกรหัสจับคู่
    const handleCopyPairing = () => {
      navigator.clipboard.writeText(myPairingCode);
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>คัดลอกรหัสจับคู่แล้ว</div>, { duration: 1500 });
    };

    // เชื่อมต่อสาขาใหม่ด้วย Tunnel URL + Pairing Code
    const handleConnect = async () => {
      if (!currentUser || !connectTunnelUrl.trim() || !connectPairingCode.trim()) return;
      setConnecting(true);
      try {
        await axios.post("/api/branchconnection/connect", {
          fromUserId: currentUser.id,
          tunnelUrl: connectTunnelUrl.trim(),
          pairingCode: connectPairingCode.trim(),
          branchName: connectBranchName.trim()
        });

        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>เชื่อมต่อสาขาสำเร็จ</div>, { duration: 2000 });
        setConnectTunnelUrl("");
        setConnectPairingCode("");
        setConnectBranchName("");
        fetchData();
      } catch (err: any) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>{err.response?.data?.error || "เชื่อมต่อไม่สำเร็จ"}</div>, { duration: 3000 });
      } finally {
        setConnecting(false);
      }
    };

    // เช็คสถานะ connection
    const handleCheckStatus = async (connId: number) => {
      setCheckingId(connId);
      try {
        const res = await axios.post("/api/branchconnection/check", { connectionId: connId });
        // อัปเดต local state
        setAllConnections(prev => prev.map(c =>
          c.id === connId ? { ...c, isOnline: res.data.isOnline, lastCheckedAt: res.data.lastCheckedAt } : c
        ));
        toast.success(
          <div style={{ fontFamily: "Kanit", fontSize: 15 }}>
            {res.data.isOnline ? "สาขาออนไลน์อยู่" : "สาขาออฟไลน์"}
          </div>,
          { duration: 2000 }
        );
      } catch (err) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>เช็คสถานะไม่สำเร็จ</div>, { duration: 2000 });
      } finally {
        setCheckingId(null);
      }
    };

    // แก้ไข connection
    const startEditConn = (conn: any) => {
      setEditingConnId(conn.id);
      setEditTunnelUrl(conn.tunnelUrl || "");
      setEditApiToken(conn.apiToken || "");
      setEditBranchName(conn.branchName || "");
    };

    const handleSaveEditConn = async () => {
      if (editingConnId === null) return;
      try {
        await axios.put(`/api/branchconnection/${editingConnId}`, {
          tunnelUrl: editTunnelUrl.trim(),
          apiToken: editApiToken.trim(),
          branchName: editBranchName.trim()
        });
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกการแก้ไขสำเร็จ</div>, { duration: 2000 });
        setEditingConnId(null);
        fetchData();
      } catch (err) {
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกไม่สำเร็จ</div>, { duration: 2000 });
      }
    };

    // ลบการเชื่อม
    const handleDelete = async (connectionId: number) => {
      if (!confirm("ต้องการลบการเชื่อมสาขานี้ใช่หรือไม่?")) return;
      try {
        await axios.delete(`/api/branchconnection/${connectionId}`);
        toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ลบการเชื่อมสาขาเรียบร้อย</div>, { duration: 2000 });
        fetchData();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    };

    // Masked token display
    const maskedToken = (token: string) => {
      if (!token) return "-";
      if (showToken) return token;
      return token.substring(0, 8) + "••••••••••••••••" + token.substring(token.length - 8);
    };

    const cardStyle = (bgColor: string, borderColor: string) => ({
      backgroundColor: bgColor,
      padding: 20,
      borderRadius: 14,
      border: `1px solid ${borderColor}`,
      marginBottom: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
    });

    return (
      <div className="container-fluid" style={{ padding: 20, maxWidth: 1200 }}>

        {/* ===== Section 1: สาขาปัจจุบัน ===== */}
        <div style={{
          ...cardStyle("#F3F8FC", "#CCDFF1"),
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #3E86C7, #1E5088)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 24, flexShrink: 0
          }}>🏪</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "kanit_B", fontSize: 20, color: "#1E5088" }}>สาขาปัจจุบัน</div>
            <div style={{ fontFamily: "Kanit", fontSize: 16, color: "#1e293b" }}>{currentUser?.company || "-"}</div>
            <div style={{ fontFamily: "Kanit", fontSize: 13, color: "#64748b" }}>{currentUser?.email || "-"}</div>
          </div>
        </div>

        <div className="row">
          {/* ===== Column Left ===== */}
          <div className="col-lg-6">

            {/* ===== Section 2: ตั้งค่า Tunnel URL ของเรา ===== */}
            <div style={cardStyle("#fffbeb", "#fde68a")}>
              <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#92400e", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 16
                }}>🌐</span>
                Cloudflare Tunnel URL ของเรา
              </div>
              <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#78716c", marginBottom: 12 }}>
                URL นี้ใช้ให้สาขาอื่นเชื่อมต่อเข้ามาหาเครื่องนี้
              </div>

              {!editingTunnel ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    flex: 1, fontFamily: "Kanit", fontSize: 13, color: myTunnelUrl ? "#1e293b" : "#9ca3af",
                    backgroundColor: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                    wordBreak: "break-all"
                  }}>
                    {myTunnelUrl || "ยังไม่ได้ตั้งค่า"}
                  </div>
                  {myTunnelUrl && (
                    <button onClick={handleCopyTunnel} className="btn btn-sm" title="คัดลอก"
                      style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px", fontSize: 14 }}>
                      📋
                    </button>
                  )}
                  <button onClick={() => { setTunnelInput(myTunnelUrl); setEditingTunnel(true); }}
                    className="btn btn-sm btn-outline-warning"
                    style={{ fontFamily: "Kanit", borderRadius: 8 }}>
                    แก้ไข
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={tunnelInput}
                    onChange={(e) => setTunnelInput(e.target.value)}
                    className="form-control form-control-sm mb-2"
                    placeholder="https://your-tunnel.trycloudflare.com"
                    style={{ fontFamily: "Kanit", borderRadius: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleSaveTunnel} disabled={savingTunnel}
                      className="btn btn-sm btn-warning" style={{ fontFamily: "Kanit", borderRadius: 8, flex: 1 }}>
                      {savingTunnel ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                    <button onClick={() => setEditingTunnel(false)}
                      className="btn btn-sm btn-outline-secondary" style={{ fontFamily: "Kanit", borderRadius: 8 }}>
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===== Section 3: รหัสจับคู่ (Pairing Code) ===== */}
            <div style={cardStyle("#fdf4ff", "#e9d5ff")}>
              <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#6b21a8", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 16
                }}>🔑</span>
                รหัสจับคู่สาขา
              </div>
              <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#78716c", marginBottom: 12 }}>
                สร้างรหัส 6 ตัว แล้วบอกให้สาขาอื่นกรอกเพื่อเชื่อมต่อ (หมดอายุ 10 นาที)
              </div>

              {myPairingCode && pairingCountdown > 0 ? (
                <>
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <div style={{
                      fontFamily: "monospace", fontSize: 36, fontWeight: 700,
                      letterSpacing: 12, color: "#6b21a8",
                      backgroundColor: "#faf5ff", padding: "16px 24px", borderRadius: 12,
                      border: "2px dashed #c084fc", display: "inline-block"
                    }}>
                      {myPairingCode}
                    </div>
                    <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#a855f7", marginTop: 8 }}>
                      หมดอายุใน {Math.floor(pairingCountdown / 60)}:{("0" + (pairingCountdown % 60)).slice(-2)} นาที
                    </div>
                  </div>
                  <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b", marginBottom: 12, textAlign: "center" }}>
                    บอกรหัสนี้ + Tunnel URL ด้านบนให้สาขาที่ต้องการเชื่อม
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={handleCopyPairing}
                      className="btn btn-sm btn-outline-secondary" style={{ fontFamily: "Kanit", borderRadius: 8 }}>
                      📋 คัดลอกรหัส
                    </button>
                    <button onClick={handleGeneratePairing} disabled={generatingPairing}
                      className="btn btn-sm btn-outline-danger" style={{ fontFamily: "Kanit", borderRadius: 8 }}>
                      🔄 สร้างใหม่
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={handleGeneratePairing} disabled={generatingPairing || !myTunnelUrl}
                  className="btn btn-sm w-100"
                  style={{
                    fontFamily: "Kanit", borderRadius: 8, backgroundColor: "#7c3aed",
                    color: "#fff", border: "none", padding: "10px 0", fontSize: 14
                  }}>
                  {generatingPairing ? "กำลังสร้าง..." : "🔑 สร้างรหัสจับคู่"}
                </button>
              )}
              {!myTunnelUrl && (
                <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#dc2626", marginTop: 8 }}>
                  * กรุณาตั้งค่า Tunnel URL ก่อนสร้างรหัสจับคู่
                </div>
              )}
            </div>

            {/* ===== Section 4: เชื่อมต่อสาขาใหม่ ===== */}
            <div style={cardStyle("#F3F8FC", "#CCDFF1")}>
              <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#173F6B", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg, #3E86C7, #2A6AAA)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 16
                }}>🔗</span>
                เชื่อมต่อสาขาใหม่
              </div>
              <div style={{ fontFamily: "Kanit", fontSize: 12, color: "#78716c", marginBottom: 12 }}>
                กรอก Tunnel URL และ รหัสจับคู่ 6 ตัว ที่ได้รับจากสาขาปลายทาง
              </div>

              <div className="mb-2">
                <label style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>ชื่อสาขา (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={connectBranchName}
                  onChange={(e) => setConnectBranchName(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="เช่น สาขาสีลม"
                  style={{ fontFamily: "Kanit", borderRadius: 8 }}
                />
              </div>

              <div className="mb-2">
                <label style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>Tunnel URL ของสาขาปลายทาง</label>
                <input
                  type="text"
                  value={connectTunnelUrl}
                  onChange={(e) => setConnectTunnelUrl(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="https://branch-tunnel.example.com"
                  style={{ fontFamily: "Kanit", borderRadius: 8 }}
                />
              </div>

              <div className="mb-3">
                <label style={{ fontFamily: "Kanit", fontSize: 12, color: "#64748b" }}>รหัสจับคู่ (6 ตัว)</label>
                <input
                  type="text"
                  value={connectPairingCode}
                  onChange={(e) => setConnectPairingCode(e.target.value.toUpperCase().slice(0, 6))}
                  className="form-control form-control-sm"
                  placeholder="เช่น ABC123"
                  maxLength={6}
                  style={{ fontFamily: "monospace", fontSize: 18, letterSpacing: 6, textAlign: "center", borderRadius: 8 }}
                />
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting || !connectTunnelUrl.trim() || connectPairingCode.trim().length !== 6}
                className="btn btn-success w-100"
                style={{ fontFamily: "Kanit", borderRadius: 8 }}
              >
                {connecting ? "กำลังเชื่อมต่อ..." : "🔗 เชื่อมต่อสาขา"}
              </button>
            </div>
          </div>

          {/* ===== Column Right: สาขาที่เชื่อมต่อแล้ว ===== */}
          <div className="col-lg-6">
            <div style={{ ...cardStyle("#f8fafc", "#e2e8f0"), minHeight: 400 }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 16, color: "#1e293b", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg, #3E86C7, #2A6AAA)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 16
                }}>📡</span>
                สาขาที่เชื่อมต่อแล้ว ({allConnections.length})
              </div>

              {allConnections.length === 0 ? (
                <div className="text-center py-5" style={{ fontFamily: "Kanit", color: "#9ca3af" }}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🔗</div>
                  <div style={{ fontSize: 14 }}>ยังไม่มีสาขาที่เชื่อมต่อ</div>
                  <div style={{ fontSize: 12, color: "#d1d5db" }}>เพิ่มสาขาจากฟอร์มด้านซ้าย</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {allConnections.map((conn: any) => {
                    const isFromUs = conn.fromUserId === currentUser?.id;
                    const otherBranch = isFromUs ? (conn.toUser || { displayName: conn.remoteCompany }) : conn.fromUser;
                    const isEditing = editingConnId === conn.id;

                    return (
                      <div key={conn.id} style={{
                        backgroundColor: "#fff",
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${conn.isOnline ? "#A9E1C6" : "#fecaca"}`,
                        transition: "all 0.2s"
                      }}>
                        {!isEditing ? (
                          <>
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                              <div style={{
                                width: 10, height: 10, borderRadius: "50%",
                                backgroundColor: conn.isOnline ? "#1F9D6B" : "#ef4444",
                                boxShadow: conn.isOnline ? "0 0 6px #1F9D6B" : "0 0 6px #ef4444",
                                flexShrink: 0
                              }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: "kanit_B", fontSize: 14, color: "#1e293b" }}>
                                  {conn.branchName || otherBranch?.company || otherBranch?.name || "-"}
                                </div>
                                <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#94a3b8" }}>
                                  {otherBranch?.email || "-"}
                                </div>
                              </div>
                              <span style={{
                                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontFamily: "Kanit",
                                backgroundColor: conn.isOnline ? "#D3F0E2" : "#fef2f2",
                                color: conn.isOnline ? "#147F56" : "#dc2626"
                              }}>
                                {conn.isOnline ? "ออนไลน์" : "ออฟไลน์"}
                              </span>
                            </div>

                            {/* Tunnel URL */}
                            {conn.tunnelUrl && (
                              <div style={{
                                fontFamily: "monospace", fontSize: 11, color: "#64748b",
                                backgroundColor: "#f8fafc", padding: "4px 8px", borderRadius: 6,
                                marginBottom: 8, wordBreak: "break-all"
                              }}>
                                🌐 {conn.tunnelUrl}
                              </div>
                            )}

                            {/* Last checked */}
                            {conn.lastCheckedAt && (
                              <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#cbd5e1", marginBottom: 8 }}>
                                เช็คล่าสุด: {new Date(conn.lastCheckedAt).toLocaleString("th-TH")}
                              </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button
                                onClick={() => handleCheckStatus(conn.id)}
                                disabled={checkingId === conn.id}
                                className="btn btn-sm btn-outline-primary"
                                style={{ fontFamily: "Kanit", borderRadius: 8, fontSize: 12 }}
                              >
                                {checkingId === conn.id ? "กำลังเช็ค..." : "📡 เช็คสถานะ"}
                              </button>
                              <button
                                onClick={() => startEditConn(conn)}
                                className="btn btn-sm btn-outline-warning"
                                style={{ fontFamily: "Kanit", borderRadius: 8, fontSize: 12 }}
                              >
                                ✏️ แก้ไข
                              </button>
                              <button
                                onClick={() => handleDelete(conn.id)}
                                className="btn btn-sm btn-outline-danger"
                                style={{ fontFamily: "Kanit", borderRadius: 8, fontSize: 12 }}
                              >
                                🗑️ ลบ
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Edit Mode */}
                            <div style={{ fontFamily: "kanit_B", fontSize: 13, color: "#d97706", marginBottom: 10 }}>
                              ✏️ แก้ไขการเชื่อมต่อ
                            </div>
                            <div className="mb-2">
                              <label style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b" }}>ชื่อสาขา</label>
                              <input type="text" value={editBranchName} onChange={(e) => setEditBranchName(e.target.value)}
                                className="form-control form-control-sm" style={{ fontFamily: "Kanit", borderRadius: 8 }} />
                            </div>
                            <div className="mb-2">
                              <label style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b" }}>Tunnel URL</label>
                              <input type="text" value={editTunnelUrl} onChange={(e) => setEditTunnelUrl(e.target.value)}
                                className="form-control form-control-sm" style={{ fontFamily: "Kanit", borderRadius: 8 }} />
                            </div>
                            <div className="mb-2">
                              <label style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b" }}>API Token</label>
                              <input type="password" value={editApiToken} onChange={(e) => setEditApiToken(e.target.value)}
                                className="form-control form-control-sm" style={{ fontFamily: "Kanit", borderRadius: 8 }} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={handleSaveEditConn}
                                className="btn btn-sm btn-warning" style={{ fontFamily: "Kanit", borderRadius: 8, flex: 1 }}>
                                💾 บันทึก
                              </button>
                              <button onClick={() => setEditingConnId(null)}
                                className="btn btn-sm btn-outline-secondary" style={{ fontFamily: "Kanit", borderRadius: 8 }}>
                                ยกเลิก
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const AnalyzeBranch = () => <AnalyzeBranchTab />;

  const BranchPL = () => {
    const [plBranches, setPlBranches] = useState<any[]>([]);
    const [plData, setPlData] = useState<Record<string, any>>({});
    const [plLoading2, setPlLoading2] = useState(true);
    const [plMonth, setPlMonth] = useState(() => {
      const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    });
    const [plBranch, setPlBranch] = useState("all");
    const BCOLORS2 = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777'];

    useEffect(() => {
      const init = async () => {
        try {
          const token = localStorage.getItem("token"); if (!token) return;
          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);
          const userRes = await axios.get(`/api/login/logins/${userId}`);
          const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");
          const branches = accepted.map((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const localId = Number(branch?.id);
            const isRemote = !localId || Number.isNaN(localId) || !branch;
            const bid = isRemote ? c.remoteUserId : localId;
            if (!bid || (!isRemote && localId === userId)) return null;
            return { id: bid, companyId: isRemote ? String(c.remoteUserId) : String(localId), dataKey: isRemote ? `remote_${c.id}` : `local_${localId}`, branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || "ไม่ทราบชื่อ", isRemote, tunnelUrl: c.tunnelUrl || "", remoteUserId: c.remoteUserId || null };
          }).filter(Boolean);
          const self = { id: userId, companyId: String(userId), dataKey: `self_${userId}`, branchName: userRes.data.company || "สาขาปัจจุบัน", isRemote: false, tunnelUrl: "", remoteUserId: null };
          setPlBranches([self, ...branches]);
        } catch (e) { console.error("BranchPL init error:", e); }
      };
      init();
    }, []);

    useEffect(() => {
      if (plBranches.length === 0) return;
      const fetchPL = async () => {
        setPlLoading2(true);
        const nd: Record<string, any> = {};
        await Promise.all(plBranches.map(async (b: any) => {
          try {
            if (b.isRemote && b.tunnelUrl) {
              const base = `/api/sale_cal/branch-proxy?tunnelUrl=${encodeURIComponent(b.tunnelUrl)}`;
              const [plRes, sumRes] = await Promise.all([
                axios.get(`${base}&apiPath=/api/pl/pl&company=${b.remoteUserId}&monthyear=${plMonth}`).catch(() => ({ data: [] })),
                axios.get(`${base}&apiPath=/api/pl/summary&company=${b.remoteUserId}&createDate=${plMonth}`).catch(() => ({ data: [] })),
              ]);
              nd[b.dataKey] = { pl: plRes.data?.[0] || null, summary: sumRes.data || [] };
            } else {
              const [plRes, sumRes] = await Promise.all([
                axios.get(`/api/pl/pl?company=${b.companyId}&monthyear=${plMonth}`),
                axios.get(`/api/pl/summary?company=${b.companyId}&createDate=${plMonth}`),
              ]);
              nd[b.dataKey] = { pl: plRes.data?.[0] || null, summary: sumRes.data || [] };
            }
          } catch { nd[b.dataKey] = { pl: null, summary: [] }; }
        }));
        setPlData(nd);
        setPlLoading2(false);
      };
      fetchPL();
    }, [plMonth, plBranches]);

    const visible2 = plBranch === "all" ? plBranches : plBranches.filter((b: any) => b.dataKey === plBranch);
    const fmt = (n: number) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const fmtK2 = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

    const calcBranch = (dk: string) => {
      const d = plData[dk]; if (!d) return null;
      const pl = d.pl || {};
      const sum = d.summary || [];
      const saleTotal = sum.reduce((a: number, b: any) => a + (Number(b.sale) || 0), 0);
      const costTotal = sum.reduce((a: number, b: any) => a + (Number(b.cost) || 0), 0);
      const revenue = saleTotal + (Number(pl.R4001) || 0) + (Number(pl.R4002) || 0);
      const cogs = (Number(pl.C5000) || 0) + (Number(pl.C5001) || 0);
      const grossProfit = revenue - cogs;
      const sellingExp = [pl.S6000, pl.S6001, pl.S6002, pl.S6003, pl.S6004, pl.S6005, pl.S6006, pl.S6007, pl.S6008, pl.S6009, pl.S6010].reduce((s: number, v: any) => s + (Number(v) || 0), 0);
      const adminExp = [pl.A7000, pl.A7001, pl.A7002, pl.A7003, pl.A7004, pl.A7005, pl.A7006, pl.A7007].reduce((s: number, v: any) => s + (Number(v) || 0), 0);
      const opCost = sellingExp + adminExp;
      const netProfit = grossProfit - opCost;
      const gpPct = revenue > 0 ? (grossProfit / revenue * 100) : 0;
      const npPct = revenue > 0 ? (netProfit / revenue * 100) : 0;
      return { saleTotal, costTotal, revenue, cogs, grossProfit, sellingExp, adminExp, opCost, netProfit, gpPct, npPct, pl, summary: sum,
        sellingItems: [
          { code: '6000', name: 'เงินเดือนพนักงานขาย (เภสัชกร)', val: Number(pl.S6000) || 0 },
          { code: '6001', name: 'เงินเดือนพนักงานขาย (ผู้ช่วยเภสัชกร)', val: Number(pl.S6001) || 0 },
          { code: '6002', name: 'OT พนักงานขาย (เภสัชกร)', val: Number(pl.S6002) || 0 },
          { code: '6003', name: 'OT พนักงานขาย (ผู้ช่วยเภสัชกร)', val: Number(pl.S6003) || 0 },
          { code: '6004', name: 'เกษียร part time', val: Number(pl.S6004) || 0 },
          { code: '6005', name: 'ผู้ช่วยเกษียร part time', val: Number(pl.S6005) || 0 },
          { code: '6006', name: 'ค่าหยิบ/ค่าคอมมิชชั่น/ยอดเป้า', val: Number(pl.S6006) || 0 },
          { code: '6007', name: 'ค่าโฆษณา/ค่าการตลาด', val: Number(pl.S6007) || 0 },
          { code: '6008', name: 'ค่าน้ำมันส่งของให้ลูกค้า', val: Number(pl.S6008) || 0 },
          { code: '6009', name: 'ค่า Software (POS)', val: Number(pl.S6009) || 0 },
          { code: '6010', name: 'ค่าใช้จ่ายอื่น ที่เกี่ยวกับการขาย', val: Number(pl.S6010) || 0 },
        ],
        adminItems: [
          { code: '7000', name: 'เงินเดือนผู้บริหาร', val: Number(pl.A7000) || 0 },
          { code: '7001', name: 'ค่าเช่า', val: Number(pl.A7001) || 0 },
          { code: '7002', name: 'ค่าไฟฟ้า', val: Number(pl.A7002) || 0 },
          { code: '7003', name: 'ค่าน้ำ', val: Number(pl.A7003) || 0 },
          { code: '7004', name: 'ค่าซ่อมบำรุงสำนักงาน/ร้านค้า', val: Number(pl.A7004) || 0 },
          { code: '7005', name: 'ค่าเสื่อมราคา', val: Number(pl.A7005) || 0 },
          { code: '7006', name: 'ค่าอุปกรณ์สำนักงาน', val: Number(pl.A7006) || 0 },
          { code: '7007', name: 'ค่าอื่นๆ ที่เกี่ยวกับการบริหาร', val: Number(pl.A7007) || 0 },
        ],
      };
    };

    const agg = (() => {
      const init = { revenue: 0, cogs: 0, grossProfit: 0, sellingExp: 0, adminExp: 0, opCost: 0, netProfit: 0 };
      visible2.forEach((b: any) => {
        const c = calcBranch(b.dataKey); if (!c) return;
        init.revenue += c.revenue; init.cogs += c.cogs; init.grossProfit += c.grossProfit;
        init.sellingExp += c.sellingExp; init.adminExp += c.adminExp; init.opCost += c.opCost; init.netProfit += c.netProfit;
      });
      return { ...init, gpPct: init.revenue > 0 ? (init.grossProfit / init.revenue * 100) : 0, npPct: init.revenue > 0 ? (init.netProfit / init.revenue * 100) : 0 };
    })();

    const expenseData = (() => {
      const items: { name: string; value: number }[] = [];
      if (agg.sellingExp > 0) items.push({ name: 'ค่าใช้จ่ายการขาย', value: agg.sellingExp });
      if (agg.adminExp > 0) items.push({ name: 'ค่าใช้จ่ายบริหาร', value: agg.adminExp });
      if (agg.cogs > 0) items.push({ name: 'ต้นทุนขาย', value: agg.cogs });
      return items;
    })();
    const EXP_COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899'];

    const branchCompare = plBranches.map((b: any, i: number) => {
      const c = calcBranch(b.dataKey);
      return { name: b.branchName, revenue: c?.revenue || 0, grossProfit: c?.grossProfit || 0, netProfit: c?.netProfit || 0, gpPct: c?.gpPct || 0, npPct: c?.npPct || 0, color: BCOLORS2[i % BCOLORS2.length] };
    });

    return (
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>💹 กำไร-ขาดทุนสาขา</div>
            <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>เปรียบเทียบงบกำไรขาดทุนทุกสาขาที่เชื่อมต่อ</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={plBranch} onChange={e => setPlBranch(e.target.value)}
              style={{ fontFamily: 'Kanit', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', minWidth: 160 }}>
              <option value="all">ทุกสาขา ({plBranches.length})</option>
              {plBranches.map((b: any, i: number) => (
                <option key={b.dataKey} value={b.dataKey}>{i === 0 ? `⭐ ${b.branchName}` : b.branchName}{b.isRemote ? ' 🌐' : ''}</option>
              ))}
            </select>
            <input type="month" value={plMonth} onChange={e => setPlMonth(e.target.value)}
              style={{ fontFamily: 'Kanit', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155' }} />
          </div>
        </div>

        {plLoading2 ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'Kanit', color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', borderRadius: 14, padding: '16px 18px', border: '1px solid #CCDFF1' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginBottom: 6 }}>💰 รายได้รวม</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{fmt(agg.revenue)} ฿</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', borderRadius: 14, padding: '16px 18px', border: '1px solid #fca5a5' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginBottom: 6 }}>📦 ต้นทุนขาย</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{fmt(agg.cogs)} ฿</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', borderRadius: 14, padding: '16px 18px', border: '1px solid #CCDFF1' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginBottom: 6 }}>📊 กำไรขั้นต้น</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#1E5088' }}>{fmt(agg.grossProfit)} ฿</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#3E86C7' }}>{agg.gpPct.toFixed(1)}%</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: 14, padding: '16px 18px', border: '1px solid #fde68a' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginBottom: 6 }}>🏗️ ค่าใช้จ่ายดำเนินงาน</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#b45309' }}>{fmt(agg.opCost)} ฿</div>
              </div>
              <div style={{ background: agg.netProfit >= 0 ? 'linear-gradient(135deg, #EDF9F3 0%, #A9E1C6 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', borderRadius: 14, padding: '16px 18px', border: `1px solid ${agg.netProfit >= 0 ? '#74CCA4' : '#fca5a5'}` }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginBottom: 6 }}>{agg.netProfit >= 0 ? '✅' : '❌'} กำไร/ขาดทุนสุทธิ</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: agg.netProfit >= 0 ? '#147F56' : '#dc2626' }}>{fmt(agg.netProfit)} ฿</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: agg.netProfit >= 0 ? '#147F56' : '#dc2626' }}>{agg.npPct.toFixed(1)}%</div>
              </div>
            </div>

            {/* Branch comparison + Expense chart */}
            <div style={{ display: 'grid', gridTemplateColumns: plBranches.length > 1 && plBranch === "all" ? '1.2fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
              {plBranches.length > 1 && plBranch === "all" && (
                <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#7c3aed', marginBottom: 12 }}>🏆 เปรียบเทียบกำไรขาดทุนสาขา</div>
                  <ResponsiveContainer width="100%" height={Math.max(200, plBranches.length * 65)}>
                    <BarChart data={branchCompare} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tickFormatter={fmtK2} tick={{ fontFamily: 'Kanit', fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Kanit', fontSize: 11, fill: '#334155' }} width={100} axisLine={false} />
                      <Tooltip content={({ active, payload, label }: any) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</div>
                            {payload.map((e: any, i: number) => (
                              <div key={i} style={{ fontFamily: 'Kanit', fontSize: 11, color: e.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                <span>{e.name}</span><span style={{ fontWeight: 600 }}>{fmt(e.value)} ฿</span>
                              </div>
                            ))}
                          </div>
                        );
                      }} />
                      <Legend wrapperStyle={{ fontFamily: 'Kanit', fontSize: 10 }} />
                      <Bar dataKey="revenue" name="รายได้" fill="#3E86C7" radius={[0, 4, 4, 0]} maxBarSize={20} />
                      <Bar dataKey="grossProfit" name="กำไรขั้นต้น" fill="#1F9D6B" radius={[0, 4, 4, 0]} maxBarSize={20} />
                      <Bar dataKey="netProfit" name="กำไรสุทธิ" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8, alignSelf: 'flex-start' }}>📊 สัดส่วนค่าใช้จ่าย</div>
                {expenseData.length === 0 ? (
                  <div style={{ padding: 40, fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>ไม่มีข้อมูล</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} strokeWidth={2} stroke="#fff">
                        {expenseData.map((_: any, i: number) => <Cell key={i} fill={EXP_COLORS[i % EXP_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const total = expenseData.reduce((s, e) => s + e.value, 0);
                        const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
                        return (
                          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>{d.name}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>จำนวน: <b style={{ color: '#dc2626' }}>{fmt(d.value)} ฿</b></div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>สัดส่วน: <b style={{ color: '#7c3aed' }}>{pct}%</b></div>
                          </div>
                        );
                      }} />
                      <Legend wrapperStyle={{ fontFamily: 'Kanit', fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Branch P&L cards */}
            {plBranches.length > 1 && plBranch === "all" && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 10 }}>🏢 สรุปกำไร-ขาดทุนแต่ละสาขา</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {plBranches.map((b: any, idx: number) => {
                    const c = calcBranch(b.dataKey);
                    const clr = BCOLORS2[idx % BCOLORS2.length];
                    if (!c) return (
                      <div key={b.dataKey} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${clr}` }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: clr, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: clr }} />{b.branchName}
                        </div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>ไม่มีข้อมูล</div>
                      </div>
                    );
                    return (
                      <div key={b.dataKey} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `2px solid ${clr}20`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderLeft: `4px solid ${clr}` }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: clr, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: clr }} />{b.branchName} {idx === 0 ? '⭐' : ''}{b.isRemote ? ' 🌐' : ''}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontFamily: 'Kanit', fontSize: 11 }}>
                          <div style={{ color: '#64748b' }}>รายได้</div><div style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{fmt(c.revenue)} ฿</div>
                          <div style={{ color: '#64748b' }}>ต้นทุนขาย</div><div style={{ fontWeight: 600, color: '#dc2626', textAlign: 'right' }}>{fmt(c.cogs)} ฿</div>
                          <div style={{ color: '#64748b' }}>กำไรขั้นต้น</div><div style={{ fontWeight: 600, color: '#1E5088', textAlign: 'right' }}>{fmt(c.grossProfit)} ฿ <span style={{ fontSize: 9, color: '#3E86C7' }}>({c.gpPct.toFixed(1)}%)</span></div>
                          <div style={{ color: '#64748b' }}>ค่าใช้จ่ายการขาย</div><div style={{ fontWeight: 600, color: '#b45309', textAlign: 'right' }}>{fmt(c.sellingExp)} ฿</div>
                          <div style={{ color: '#64748b' }}>ค่าใช้จ่ายบริหาร</div><div style={{ fontWeight: 600, color: '#b45309', textAlign: 'right' }}>{fmt(c.adminExp)} ฿</div>
                          <div style={{ color: '#64748b', fontWeight: 600 }}>กำไร/ขาดทุนสุทธิ</div><div style={{ fontWeight: 700, color: c.netProfit >= 0 ? '#147F56' : '#dc2626', textAlign: 'right' }}>{fmt(c.netProfit)} ฿ <span style={{ fontSize: 9 }}>({c.npPct.toFixed(1)}%)</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed P&L Statement */}
            {visible2.map((b: any, bIdx: number) => {
              const c = calcBranch(b.dataKey);
              if (!c) return null;
              const clr = BCOLORS2[plBranches.indexOf(b) % BCOLORS2.length];
              const pctOf = (v: number) => c.revenue > 0 ? ((v / c.revenue) * 100).toFixed(1) + '%' : '0%';
              return (
                <div key={b.dataKey} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '2px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc, #fff)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: clr }} />
                    <span style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      📋 งบกำไรขาดทุน — {b.branchName} {bIdx === 0 && plBranch === "all" ? '⭐' : ''}{b.isRemote ? ' 🌐' : ''}
                    </span>
                    <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{plMonth}</span>
                  </div>
                  <div style={{ padding: '12px 20px', maxHeight: 500, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 0', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'left', width: '50%' }}>รายการ</th>
                          <th style={{ padding: '8px 0', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'right' }}>จำนวน (฿)</th>
                          <th style={{ padding: '8px 0', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'right', width: '15%' }}>% ของรายได้</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Revenue section */}
                        <tr><td colSpan={3} style={{ padding: '10px 0 4px', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#2A6AAA' }}>รายได้</td></tr>
                        <tr style={{ borderBottom: '1px solid #f8fafc' }}><td style={{ padding: '4px 0 4px 16px', fontFamily: 'Kanit', fontSize: 11, color: '#334155' }}>4000 รายได้จากการขาย (หน้าร้าน)</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11 }}>{fmt(c.saleTotal)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{pctOf(c.saleTotal)}</td></tr>
                        <tr style={{ borderBottom: '1px solid #f8fafc' }}><td style={{ padding: '4px 0 4px 16px', fontFamily: 'Kanit', fontSize: 11, color: '#334155' }}>4001 รายได้จากการขาย (Online)</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11 }}>{fmt(Number(c.pl.R4001) || 0)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{pctOf(Number(c.pl.R4001) || 0)}</td></tr>
                        <tr style={{ borderBottom: '1px solid #f8fafc' }}><td style={{ padding: '4px 0 4px 16px', fontFamily: 'Kanit', fontSize: 11, color: '#334155' }}>4002 รายได้จากการขาย อื่น</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11 }}>{fmt(Number(c.pl.R4002) || 0)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{pctOf(Number(c.pl.R4002) || 0)}</td></tr>
                        <tr style={{ borderBottom: '2px solid #E5EEF8', background: '#F3F8FC' }}><td style={{ padding: '6px 0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#2A6AAA' }}>(1) รายได้รวมจากการขายและบริการ</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#2A6AAA' }}>{fmt(c.revenue)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#2A6AAA' }}>100%</td></tr>

                        {/* COGS section */}
                        <tr><td colSpan={3} style={{ padding: '10px 0 4px', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>ต้นทุนขาย</td></tr>
                        <tr style={{ borderBottom: '1px solid #f8fafc' }}><td style={{ padding: '4px 0 4px 16px', fontFamily: 'Kanit', fontSize: 11, color: '#334155' }}>5000 ต้นทุนสินค้า</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11 }}>{fmt(Number(c.pl.C5000) || 0)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{pctOf(Number(c.pl.C5000) || 0)}</td></tr>
                        <tr style={{ borderBottom: '1px solid #f8fafc' }}><td style={{ padding: '4px 0 4px 16px', fontFamily: 'Kanit', fontSize: 11, color: '#334155' }}>5001 ต้นทุนขนส่ง</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11 }}>{fmt(Number(c.pl.C5001) || 0)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{pctOf(Number(c.pl.C5001) || 0)}</td></tr>
                        <tr style={{ borderBottom: '2px solid #fecaca', background: '#fef2f2' }}><td style={{ padding: '6px 0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>(2) ต้นทุนการขาย (Cost of goods sold)</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{fmt(c.cogs)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#dc2626' }}>{pctOf(c.cogs)}</td></tr>

                        {/* Gross profit */}
                        <tr style={{ borderBottom: '2px solid #CCDFF1', background: '#F3F8FC' }}><td style={{ padding: '8px 0', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#1E5088' }}>(3) กำไรขั้นต้น (Gross Profit) (1)-(2)</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 15, fontWeight: 700, color: '#1E5088' }}>{fmt(c.grossProfit)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#1E5088' }}>{pctOf(c.grossProfit)}</td></tr>

                        {/* Selling expenses */}
                        <tr><td colSpan={3} style={{ padding: '10px 0 4px', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#b45309' }}>ค่าใช้จ่ายในการขาย</td></tr>
                        {c.sellingItems.map((item: any) => (
                          <tr key={item.code} style={{ borderBottom: '1px solid #f8fafc' }}><td style={{ padding: '4px 0 4px 16px', fontFamily: 'Kanit', fontSize: 11, color: '#334155' }}>{item.code} {item.name}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11 }}>{fmt(item.val)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{pctOf(item.val)}</td></tr>
                        ))}
                        <tr style={{ borderBottom: '2px solid #fde68a', background: '#fffbeb' }}><td style={{ padding: '6px 0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#b45309' }}>(4) ค่าใช้จ่ายในการขายรวม (Selling Expenses)</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#b45309' }}>{fmt(c.sellingExp)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#b45309' }}>{pctOf(c.sellingExp)}</td></tr>

                        {/* Admin expenses */}
                        <tr><td colSpan={3} style={{ padding: '10px 0 4px', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#b45309' }}>ค่าใช้จ่ายในการบริหาร</td></tr>
                        {c.adminItems.map((item: any) => (
                          <tr key={item.code} style={{ borderBottom: '1px solid #f8fafc' }}><td style={{ padding: '4px 0 4px 16px', fontFamily: 'Kanit', fontSize: 11, color: '#334155' }}>{item.code} {item.name}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11 }}>{fmt(item.val)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{pctOf(item.val)}</td></tr>
                        ))}
                        <tr style={{ borderBottom: '2px solid #fde68a', background: '#fffbeb' }}><td style={{ padding: '6px 0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#b45309' }}>(5) ค่าใช้จ่ายในการบริหารจัดการรวม (Admin Expenses)</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#b45309' }}>{fmt(c.adminExp)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#b45309' }}>{pctOf(c.adminExp)}</td></tr>

                        {/* Operating cost */}
                        <tr style={{ borderBottom: '2px solid #fca5a5', background: '#fef2f2' }}><td style={{ padding: '6px 0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>(6) ต้นทุนดำเนินงาน (Operating Cost) (4)+(5)</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{fmt(c.opCost)}</td><td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#dc2626' }}>{pctOf(c.opCost)}</td></tr>

                        {/* Net profit */}
                        <tr style={{ background: c.netProfit >= 0 ? '#EDF9F3' : '#fef2f2', borderBottom: `3px solid ${c.netProfit >= 0 ? '#74CCA4' : '#fca5a5'}` }}>
                          <td style={{ padding: '10px 0', fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: c.netProfit >= 0 ? '#147F56' : '#dc2626' }}>{c.netProfit >= 0 ? '✅' : '❌'} (7) กำไร(ขาดทุน)สุทธิ (Net Profit) (3)-(6)</td>
                          <td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 18, fontWeight: 700, color: c.netProfit >= 0 ? '#147F56' : '#dc2626' }}>{fmt(c.netProfit)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: c.netProfit >= 0 ? '#147F56' : '#dc2626' }}>{pctOf(c.netProfit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  };

  const BranchStaff = () => {
    const [bsLoading, setBsLoading] = useState(true);
    const [bsBranches, setBsBranches] = useState<any[]>([]);
    const [bsUser, setBsUser] = useState<any>(null);
    const [bsStartDate, setBsStartDate] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`; });
    const [bsEndDate, setBsEndDate] = useState(() => { const n = new Date(); const ld = new Date(n.getFullYear(), n.getMonth()+1, 0).getDate(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(ld).padStart(2,'0')}`; });
    const [bsBranchFilter, setBsBranchFilter] = useState('all');
    const [bsEmployees, setBsEmployees] = useState<any[]>([]);
    const [bsEmpLoading, setBsEmpLoading] = useState(false);
    const [bsSelEmp, setBsSelEmp] = useState<any>(null);
    const [bsRecords, setBsRecords] = useState<any[]>([]);
    const [bsRecLoading, setBsRecLoading] = useState(false);
    const [bsEditId, setBsEditId] = useState<number|null>(null);
    const [bsEditForm, setBsEditForm] = useState({ checkin: '', checkout: '' });
    const [bsSearchQ, setBsSearchQ] = useState('');
    const [bsShowAdd, setBsShowAdd] = useState(false);
    const [bsAddForm, setBsAddForm] = useState({ date: '', checkin: '', checkout: '' });
    const [bsLeaveConfig, setBsLeaveConfig] = useState<any>({ vacationDays: 6, personalDays: 3, sickDays: 30, lateLimit: 3, workStartTime: '08:30' });
    const [bsLeaveRecords, setBsLeaveRecords] = useState<any[]>([]);
    // All-branch leave overview modal states
    const [bsAllLeaveRecords, setBsAllLeaveRecords] = useState<any[]>([]);
    const [bsShowLeaveModal, setBsShowLeaveModal] = useState(false);
    const [bsLeaveFilterStatus, setBsLeaveFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [bsLeaveFilterType, setBsLeaveFilterType] = useState<'all' | 'vacation' | 'personal' | 'sick'>('all');
    const [bsLeaveFilterPerson, setBsLeaveFilterPerson] = useState<string>('all');
    const [bsShowRejectModal, setBsShowRejectModal] = useState(false);
    const [bsRejectTarget, setBsRejectTarget] = useState<any>(null);
    const [bsRejectReason, setBsRejectReason] = useState('');
    const BS_COLORS = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777', '#B45309'];

    useEffect(() => {
      const init = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);
          const userRes = await axios.get(`/api/login/logins/${userId}`);
          setBsUser(userRes.data);
          const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");
          const branches: any[] = accepted.map((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const localId = Number(branch?.id);
            const isRemote = !localId || Number.isNaN(localId) || !branch;
            const bid = isRemote ? c.remoteUserId : localId;
            if (!bid || (!isRemote && localId === userId)) return null;
            return { id: bid, companyId: String(bid), dataKey: isRemote ? `remote_${c.id}` : `local_${localId}`, branchName: c.branchName || branch?.company || c.remoteCompany || 'ไม่ทราบชื่อ', isRemote, tunnelUrl: c.tunnelUrl || '', apiToken: c.apiToken || '', remoteCompany: c.remoteCompany || '', companyStr: branch?.company || c.remoteCompany || '', remoteUserId: c.remoteUserId || null };
          }).filter(Boolean);
          const companyLS = localStorage.getItem('company_') || '';
          const self = { id: userId, companyId: String(userId), dataKey: `self_${userId}`, branchName: userRes.data.company || 'สาขาปัจจุบัน', isRemote: false, tunnelUrl: '', apiToken: '', companyStr: companyLS || userRes.data.company || '' };
          const allBr = [self, ...branches];
          setBsBranches(allBr);
          setBsEmpLoading(true);
          const allEmps: any[] = [];
          try { const r = await axios.get(`/api/setting/employee?id_company=${userId}`); (r.data||[]).forEach((e:any)=>allEmps.push({...e,branchName:self.branchName,branchDataKey:self.dataKey,companyStr:companyLS||e.company||self.companyStr,isRemote:false,tunnelUrl:'',apiToken:''})); } catch(e){}
          for (const br of branches.filter((b:any)=>!b.isRemote && !b.tunnelUrl)) { try { const r = await axios.get(`/api/setting/employee?id_company=${br.id}`); console.log(`BS local: ${br.branchName} id_company=${br.id} => ${(r.data||[]).length} emps`); (r.data||[]).forEach((e:any)=>allEmps.push({...e,branchName:br.branchName,branchDataKey:br.dataKey,companyStr:e.company||br.companyStr,isRemote:false,tunnelUrl:'',apiToken:''})); } catch(e){ console.error(`BS local: ${br.branchName} failed`, e); } }
          for (const br of branches.filter((b:any)=>b.tunnelUrl)) {
            const remId = br.remoteUserId || br.id;
            let remEmps: any[] = [];
            try { const r1 = await axios.post('/api/setting/employee/remote', { tunnelUrl: br.tunnelUrl, apiToken: br.apiToken, id_company: remId }); remEmps = r1.data || []; console.log(`BS: ${br.branchName} id_company=${remId} => ${remEmps.length} emps`); } catch(e1){ console.warn(`BS: ${br.branchName} offline or failed (id_company=${remId})`); }
            if (remEmps.length === 0 && br.remoteCompany) { try { const r2 = await axios.post('/api/setting/employee/remote', { tunnelUrl: br.tunnelUrl, apiToken: br.apiToken, company: br.remoteCompany }); remEmps = r2.data || []; } catch(e2){ /* offline */ } }
            if (remEmps.length === 0) { try { const r3 = await axios.post('/api/setting/employee/remote', { tunnelUrl: br.tunnelUrl, apiToken: br.apiToken }); remEmps = r3.data || []; } catch(e3){ /* offline */ } }
            remEmps.forEach((e:any)=>allEmps.push({...e,branchName:br.branchName,branchDataKey:br.dataKey,companyStr:e.company||br.remoteCompany||br.companyStr,isRemote:true,tunnelUrl:br.tunnelUrl,apiToken:br.apiToken}));
          }
          setBsEmployees(allEmps);
        } catch(e) { console.error('BranchStaff init:', e); }
        setBsEmpLoading(false);
        setBsLoading(false);
      };
      init();
    }, []);

    const fetchBsRecords = async (emp: any) => {
      if (!emp) return;
      setBsRecLoading(true);
      try {
        const start = new Date(bsStartDate), end = new Date(bsEndDate);
        const months = new Set<string>();
        let d = new Date(start.getFullYear(), start.getMonth(), 1);
        while (d <= end) { months.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); d.setMonth(d.getMonth()+1); }
        let all: any[] = [];
        for (const ym of months) {
          const [yr, mn] = (ym as string).split('-');
          if (emp.isRemote && emp.tunnelUrl) {
            try { const r = await axios.post('/api/checkin/remote', { tunnelUrl: emp.tunnelUrl, apiToken: emp.apiToken, action: 'get', idcompany: emp.companyStr, personId: emp.id, month: mn, year: yr, sort: 'asc' }); all = [...all, ...(r.data || [])]; } catch(e) {}
          } else {
            const r = await axios.get(`/api/checkin?idcompany=${emp.companyStr}&personId=${emp.id}&month=${mn}&year=${yr}&sort=asc`);
            all = [...all, ...(r.data || [])];
          }
        }
        const filtered = all.filter((r: any) => { if (!r.checkin) return false; const rd = toThaiDateString(r.checkin); return rd >= bsStartDate && rd <= bsEndDate; });
        setBsRecords(filtered.sort((a: any, b: any) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime()));
      } catch(e) { setBsRecords([]); }
      setBsRecLoading(false);
    };

    const fetchBsLeaveData = async (emp: any) => {
      if (!emp || emp.isRemote) { setBsLeaveRecords([]); return; }
      const branch = bsBranches.find((b: any) => b.dataKey === emp.branchDataKey);
      const companyId = branch ? String(branch.id) : '0';
      const year = new Date(bsStartDate).getFullYear().toString();
      try {
        const [cfgRes, recRes] = await Promise.all([
          axios.get(`/api/leave-config?idcompany=${companyId}`),
          axios.get(`/api/leave-record?idcompany=${companyId}&personId=${emp.id}&year=${year}`)
        ]);
        setBsLeaveConfig(cfgRes.data);
        setBsLeaveRecords(Array.isArray(recRes.data) ? recRes.data : []);
      } catch (e) { console.error('fetchBsLeaveData:', e); }
    };
    const bsLeaveStats = () => {
      const year = new Date(bsStartDate).getFullYear();
      const yearRecs = bsLeaveRecords.filter((r: any) => new Date(r.leaveDate).getFullYear() === year && r.status === 'approved');
      const vacUsed = yearRecs.filter((r: any) => r.leaveType === 'vacation').length;
      const perUsed = yearRecs.filter((r: any) => r.leaveType === 'personal').length;
      const sickUsed = yearRecs.filter((r: any) => r.leaveType === 'sick').length;
      const startTime = bsLeaveConfig.workStartTime || '08:30';
      const [sH, sM] = startTime.split(':').map(Number);
      const lateDays = bsRecords.filter((r: any) => { if (!r.checkin) return false; const d = new Date(r.checkin); return d.getHours() > sH || (d.getHours() === sH && d.getMinutes() > sM); }).length;
      return {
        vacation: { entitled: bsLeaveConfig.vacationDays || 0, used: vacUsed, remaining: Math.max(0, (bsLeaveConfig.vacationDays || 0) - vacUsed) },
        personal: { entitled: bsLeaveConfig.personalDays || 0, used: perUsed, remaining: Math.max(0, (bsLeaveConfig.personalDays || 0) - perUsed) },
        sick: { entitled: bsLeaveConfig.sickDays || 0, used: sickUsed, remaining: Math.max(0, (bsLeaveConfig.sickDays || 0) - sickUsed) },
        late: { limit: bsLeaveConfig.lateLimit || 0, count: lateDays, over: Math.max(0, lateDays - (bsLeaveConfig.lateLimit || 0)) }
      };
    };
    const bsSelectEmp = (emp: any) => { setBsSelEmp(emp); setBsEditId(null); setBsShowAdd(false); fetchBsRecords(emp); fetchBsLeaveData(emp); };

    // Fetch all leave records from all branches
    const fetchAllBranchLeaveRecords = async () => {
      const year = new Date(bsStartDate).getFullYear().toString();
      const allRecs: any[] = [];
      for (const br of bsBranches) {
        if (br.isRemote) continue;
        try {
          const res = await axios.get(`/api/leave-record?idcompany=${br.id}&year=${year}`);
          const recs = Array.isArray(res.data) ? res.data : [];
          recs.forEach((r: any) => allRecs.push({ ...r, branchName: br.branchName, branchId: br.id }));
        } catch (e) { console.error(`fetchAllBranchLeave ${br.branchName}:`, e); }
      }
      setBsAllLeaveRecords(allRecs);
    };

    useEffect(() => { if (bsBranches.length > 0) fetchAllBranchLeaveRecords(); }, [bsBranches, bsStartDate]);

    const handleBsApproveLeave = async (id: number) => {
      const person = localStorage.getItem("person_") || "";
      try {
        await axios.put('/api/leave-record', { id, status: 'approved', approvedBy: person });
        fetchAllBranchLeaveRecords();
        if (bsSelEmp) fetchBsLeaveData(bsSelEmp);
      } catch (e) { console.error('handleBsApproveLeave:', e); }
    };
    const handleBsRejectLeave = () => {
      if (!bsRejectTarget || !bsRejectReason.trim()) return;
      const person = localStorage.getItem("person_") || "";
      axios.put('/api/leave-record', { id: bsRejectTarget.id, status: 'rejected', rejectReason: bsRejectReason, approvedBy: person })
        .then(() => { setBsShowRejectModal(false); setBsRejectTarget(null); setBsRejectReason(''); fetchAllBranchLeaveRecords(); if (bsSelEmp) fetchBsLeaveData(bsSelEmp); })
        .catch(e => console.error('handleBsRejectLeave:', e));
    };
    const handleBsApproveAll = async () => {
      const person = localStorage.getItem("person_") || "";
      const pending = bsAllLeaveRecords.filter(r => r.status === 'pending');
      for (const r of pending) {
        try { await axios.put('/api/leave-record', { id: r.id, status: 'approved', approvedBy: person }); } catch (e) {}
      }
      fetchAllBranchLeaveRecords();
      if (bsSelEmp) fetchBsLeaveData(bsSelEmp);
    };
    const handleBsDeleteLeave = async (id: number) => {
      try { await axios.delete(`/api/leave-record?id=${id}`); fetchAllBranchLeaveRecords(); if (bsSelEmp) fetchBsLeaveData(bsSelEmp); } catch (e) {}
    };

    const bsCalcH = (ci: string|null, co: string|null): number|null => {
      if (!ci || !co) return null;
      const i = new Date(ci).getTime(), o = new Date(co).getTime();
      if (isNaN(i) || isNaN(o) || o <= i) return null;
      return (o - i) / 3600000;
    };
    const bsFmtT = (s: string|null) => { if (!s) return '-'; const dd = new Date(s); if (isNaN(dd.getTime())) return '-'; return dd.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); };
    const bsFmtDay = (s: string) => { const dd = new Date(s); const days = ['\u0e2d\u0e32.','\u0e08.','\u0e2d.','\u0e1e.','\u0e1e\u0e24.','\u0e28.','\u0e2a.']; return `${days[dd.getDay()]} ${dd.getDate()}`; };

    const bsEditStart = (rec: any) => {
      setBsEditId(rec.id);
      const ci = rec.checkin ? new Date(rec.checkin) : null;
      const co = rec.checkout ? new Date(rec.checkout) : null;
      setBsEditForm({ checkin: ci ? ci.toTimeString().slice(0,5) : '', checkout: co ? co.toTimeString().slice(0,5) : '' });
    };
    const bsEditSave = async (rec: any) => {
      try {
        const dateStr = rec.checkin ? toThaiDateString(rec.checkin) : bsStartDate;
        const ciDt = bsEditForm.checkin ? new Date(`${dateStr}T${bsEditForm.checkin}:00`).toISOString() : null;
        const coDt = bsEditForm.checkout ? new Date(`${dateStr}T${bsEditForm.checkout}:00`).toISOString() : null;
        if (bsSelEmp?.isRemote && bsSelEmp?.tunnelUrl) {
          await axios.post('/api/checkin/remote', { tunnelUrl: bsSelEmp.tunnelUrl, apiToken: bsSelEmp.apiToken, action: 'update', recordId: rec.id, data: { checkin: ciDt, checkout: coDt } });
        } else {
          await axios.put(`/api/checkin/${rec.id}`, { checkin: ciDt, checkout: coDt });
        }
        setBsEditId(null); fetchBsRecords(bsSelEmp);
      } catch(e) { alert('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e44\u0e14\u0e49'); }
    };
    const bsApprove = async (rec: any) => {
      const person = localStorage.getItem("person_") || "";
      try {
        if (bsSelEmp?.isRemote && bsSelEmp?.tunnelUrl) {
          await axios.post('/api/checkin/remote', { tunnelUrl: bsSelEmp.tunnelUrl, apiToken: bsSelEmp.apiToken, action: 'update', recordId: rec.id, data: { approve: 'approved', approveDate: new Date().toISOString(), approvePerson: person } });
        } else {
          await axios.put(`/api/checkin/${rec.id}`, { approve: 'approved', approveDate: new Date().toISOString(), approvePerson: person });
        }
        fetchBsRecords(bsSelEmp);
      } catch(e) { alert('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34\u0e44\u0e14\u0e49'); }
    };
    const bsAddRecord = async () => {
      if (!bsSelEmp || !bsAddForm.date) return;
      try {
        const ciDt = bsAddForm.checkin ? new Date(`${bsAddForm.date}T${bsAddForm.checkin}:00`).toISOString() : null;
        const coDt = bsAddForm.checkout ? new Date(`${bsAddForm.date}T${bsAddForm.checkout}:00`).toISOString() : null;
        const body = { idcompany: bsSelEmp.companyStr, company: bsSelEmp.companyStr, personId: bsSelEmp.id, person: bsSelEmp.name || '', status: 'normal', checkin: ciDt, checkout: coDt, approve: '', approvePerson: '', remark: '' };
        if (bsSelEmp.isRemote && bsSelEmp.tunnelUrl) {
          await axios.post('/api/checkin/remote', { tunnelUrl: bsSelEmp.tunnelUrl, apiToken: bsSelEmp.apiToken, action: 'create', data: body });
        } else { await axios.post('/api/checkin', body); }
        setBsShowAdd(false); setBsAddForm({ date: '', checkin: '', checkout: '' }); fetchBsRecords(bsSelEmp);
      } catch(e) { alert('ไม่สามารถเพิ่มได้'); }
    };

    const bsFilteredEmps = bsEmployees.filter((e: any) => {
      const matchBr = bsBranchFilter === 'all' || e.branchDataKey === bsBranchFilter;
      const matchQ = !bsSearchQ.trim() || (e.name || '').toLowerCase().includes(bsSearchQ.toLowerCase()) || (e.position || '').toLowerCase().includes(bsSearchQ.toLowerCase());
      return matchBr && matchQ;
    });
    const bsTotalH = bsRecords.reduce((s: number, r: any) => s + (bsCalcH(r.checkin, r.checkout) || 0), 0);
    const bsWorkDays = bsRecords.filter((r: any) => r.checkin).length;

    const bsLeaveTypeLabel = (type: string) => type === 'vacation' ? 'ลาพักร้อน' : type === 'personal' ? 'ลากิจ' : type === 'sick' ? 'ลาป่วย' : type || '-';
    const bsLeaveStatusLabel = (status: string) => status === 'approved' ? 'อนุมัติ' : status === 'rejected' ? 'ไม่อนุมัติ' : status === 'pending' ? 'รออนุมัติ' : status || '-';
    const bsApprovalLabel = (approve: string) => approve === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ';
    const bsBranchFilterLabel = bsBranchFilter === 'all' ? 'ทุกสาขา' : bsBranches.find((b: any) => b.dataKey === bsBranchFilter)?.branchName || '-';

    const handleBsExportExcel = async () => {
      if (bsFilteredEmps.length === 0 && !bsSelEmp) {
        alert('ไม่มีข้อมูลพนักงานสำหรับ Export Excel');
        return;
      }
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        const selectedEmployeeName = bsSelEmp?.name || '-';
        const selectedBranchName = bsSelEmp?.branchName || '-';

        const summaryRows = [
          { 'หัวข้อ': 'รายงาน', 'ข้อมูล': 'พนักงานสาขา' },
          { 'หัวข้อ': 'ช่วงวันที่', 'ข้อมูล': `${bsStartDate} ถึง ${bsEndDate}` },
          { 'หัวข้อ': 'ตัวกรองสาขา', 'ข้อมูล': bsBranchFilterLabel },
          { 'หัวข้อ': 'จำนวนสาขาทั้งหมด', 'ข้อมูล': bsBranches.length },
          { 'หัวข้อ': 'จำนวนพนักงานตามตัวกรอง', 'ข้อมูล': bsFilteredEmps.length },
          { 'หัวข้อ': 'พนักงานที่เลือก', 'ข้อมูล': selectedEmployeeName },
          { 'หัวข้อ': 'สาขาของพนักงานที่เลือก', 'ข้อมูล': selectedBranchName },
          { 'หัวข้อ': 'ชั่วโมงทำงานรวมของพนักงานที่เลือก', 'ข้อมูล': bsSelEmp ? `${bsTotalH.toFixed(1)} ชม.` : '-' },
          { 'หัวข้อ': 'วันทำงานของพนักงานที่เลือก', 'ข้อมูล': bsSelEmp ? `${bsWorkDays} วัน` : '-' },
          { 'หัวข้อ': 'รายการลารออนุมัติทุกสาขา', 'ข้อมูล': bsAllLeaveRecords.filter((r: any) => r.status === 'pending').length },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
        summarySheet['!cols'] = [{ wch: 34 }, { wch: 46 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');

        const employeeRows = bsFilteredEmps.map((emp: any, index: number) => ({
          '#': index + 1,
          'สาขา': emp.branchName || '-',
          'ชื่อพนักงาน': emp.name || '-',
          'ตำแหน่ง': emp.position || '-',
          'บริษัท/รหัสบริษัท': emp.companyStr || '-',
          'ประเภทสาขา': emp.isRemote ? 'Remote' : 'Local'
        }));
        const employeeSheet = XLSX.utils.json_to_sheet(employeeRows);
        employeeSheet['!cols'] = [{ wch: 6 }, { wch: 24 }, { wch: 28 }, { wch: 24 }, { wch: 24 }, { wch: 14 }];
        if (employeeRows.length > 0) employeeSheet['!autofilter'] = { ref: `A1:F${employeeRows.length + 1}` };
        XLSX.utils.book_append_sheet(workbook, employeeSheet, 'รายชื่อพนักงาน');

        if (bsSelEmp) {
          const attendanceRows = bsRecords.map((rec: any, index: number) => {
            const hours = bsCalcH(rec.checkin, rec.checkout);
            return {
              '#': index + 1,
              'วันที่': rec.checkin ? toThaiDateString(rec.checkin) : '-',
              'วัน': rec.checkin ? bsFmtDay(rec.checkin) : '-',
              'สาขา': selectedBranchName,
              'พนักงาน': selectedEmployeeName,
              'เวลาเข้า': bsFmtT(rec.checkin),
              'เวลาออก': bsFmtT(rec.checkout),
              'ชั่วโมงรวม': hours !== null ? Number(hours.toFixed(2)) : '-',
              'สถานะ': rec.status === 'normal' ? 'ปกติ' : rec.status || '-',
              'การอนุมัติ': bsApprovalLabel(rec.approve),
              'หมายเหตุ': rec.remark || '-'
            };
          });
          const attendanceSheet = XLSX.utils.json_to_sheet(attendanceRows);
          attendanceSheet['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 26 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 28 }];
          if (attendanceRows.length > 0) attendanceSheet['!autofilter'] = { ref: `A1:K${attendanceRows.length + 1}` };
          XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'เข้าออกงาน');

          const leaveStats = bsLeaveStats();
          const selectedLeaveSummaryRows = [
            { 'ประเภท': 'ลาพักร้อน', 'สิทธิ์': leaveStats.vacation.entitled, 'ใช้แล้ว': leaveStats.vacation.used, 'คงเหลือ': leaveStats.vacation.remaining },
            { 'ประเภท': 'ลากิจ', 'สิทธิ์': leaveStats.personal.entitled, 'ใช้แล้ว': leaveStats.personal.used, 'คงเหลือ': leaveStats.personal.remaining },
            { 'ประเภท': 'ลาป่วย', 'สิทธิ์': leaveStats.sick.entitled, 'ใช้แล้ว': leaveStats.sick.used, 'คงเหลือ': leaveStats.sick.remaining },
            { 'ประเภท': 'มาสาย', 'สิทธิ์': leaveStats.late.limit, 'ใช้แล้ว': leaveStats.late.count, 'คงเหลือ': leaveStats.late.over },
          ];
          const selectedLeaveRows = bsLeaveRecords.map((record: any, index: number) => ({
            '#': index + 1,
            'วันที่': record.leaveDate ? toThaiDateString(record.leaveDate) : '-',
            'ประเภท': bsLeaveTypeLabel(record.leaveType),
            'เหตุผล': record.reason || '-',
            'สถานะ': bsLeaveStatusLabel(record.status),
            'ผู้อนุมัติ': record.approvedBy || '-',
            'หมายเหตุ': record.rejectReason || '-'
          }));
          const selectedLeaveSheet = XLSX.utils.json_to_sheet([...selectedLeaveSummaryRows, {}, ...selectedLeaveRows]);
          selectedLeaveSheet['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 28 }];
          XLSX.utils.book_append_sheet(workbook, selectedLeaveSheet, 'การลาพนักงานที่เลือก');
        }

        const allLeaveRows = bsAllLeaveRecords.map((record: any, index: number) => ({
          '#': index + 1,
          'สาขา': record.branchName || '-',
          'พนักงาน': record.person || '-',
          'ประเภท': bsLeaveTypeLabel(record.leaveType),
          'วันที่ลา': record.leaveDate ? toThaiDateString(record.leaveDate) : '-',
          'เหตุผล': record.reason || '-',
          'สถานะ': bsLeaveStatusLabel(record.status),
          'ผู้อนุมัติ': record.approvedBy || '-',
          'หมายเหตุ': record.rejectReason || '-'
        }));
        if (allLeaveRows.length > 0) {
          const allLeaveSheet = XLSX.utils.json_to_sheet(allLeaveRows);
          allLeaveSheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 18 }, { wch: 28 }];
          allLeaveSheet['!autofilter'] = { ref: `A1:I${allLeaveRows.length + 1}` };
          XLSX.utils.book_append_sheet(workbook, allLeaveSheet, 'การลาทุกสาขา');
        }

        const safeName = String(bsSelEmp?.name || bsBranchFilterLabel || 'all').replace(/[\\/:*?"<>|]/g, '_');
        XLSX.writeFile(workbook, `พนักงานสาขา_${safeName}_${bsStartDate}_${bsEndDate}.xlsx`);
      } catch (error) {
        console.error('Branch staff export excel error:', error);
        alert('Export Excel ไม่สำเร็จ');
      }
    };

    if (bsLoading) return (<div style={{ textAlign: 'center', padding: 60, fontFamily: 'Kanit', color: '#94a3b8' }}><div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>กำลังโหลดข้อมูล...</div>);
    return (<div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>👥 พนักงานสาขา</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>จัดการข้อมูลเข้า-ออกงานพนักงานทุกสาขา ({bsBranches.length} สาขา, {bsEmployees.length} คน)</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
          <button
            onClick={handleBsExportExcel}
            disabled={bsEmpLoading || bsFilteredEmps.length === 0}
            title={bsFilteredEmps.length > 0 ? 'Export Excel' : 'ไม่มีข้อมูลสำหรับ Export Excel'}
            style={{
              fontFamily: 'Kanit',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: bsFilteredEmps.length > 0 ? 'linear-gradient(135deg, #2A6AAA 0%, #173F6B 100%)' : '#e2e8f0',
              color: bsFilteredEmps.length > 0 ? '#fff' : '#94a3b8',
              border: bsFilteredEmps.length > 0 ? '1px solid #2A6AAA' : '1px solid #cbd5e1',
              padding: '7px 14px 7px 10px',
              borderRadius: 10,
              boxShadow: bsFilteredEmps.length > 0 ? '0 8px 18px rgba(20, 127, 86,0.22), inset 0 1px 0 rgba(255,255,255,0.18)' : 'none',
              cursor: bsFilteredEmps.length > 0 ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              minHeight: 36,
              letterSpacing: 0
            }}
          >
            <span style={{ width: 22, height: 22, borderRadius: 7, background: bsFilteredEmps.length > 0 ? 'rgba(255,255,255,0.18)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={14} />
            </span>
            Export Excel
          </button>

          {/* อนุมัติการลา Button with Badge */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setBsShowLeaveModal(true)} style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, boxShadow: '0 2px 8px rgba(245,158,11,0.3)', cursor: 'pointer' }}>
              <Clock size={14} /> อนุมัติการลา
            </button>
            {bsAllLeaveRecords.filter(r => r.status === 'pending').length > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, background: '#ef4444', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'Kanit', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(239,68,68,0.4)', padding: '0 4px' }}>
                {bsAllLeaveRecords.filter(r => r.status === 'pending').length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== All-Branch Leave Overview Modal ===== */}
      {bsShowLeaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setBsShowLeaveModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '90vw', maxWidth: 1000, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #F3F8FC, #E5EEF8)', borderBottom: '1px solid #CCDFF1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#102C4C' }}>ภาพรวมการลา — พนักงานทั้งหมด</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>ปี {new Date(bsStartDate).getFullYear() + 543}</div>
                </div>
              </div>
              <button onClick={() => setBsShowLeaveModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            {/* Filter Bar */}
            <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {(() => {
                const pending = bsAllLeaveRecords.filter(r => r.status === 'pending').length;
                const approved = bsAllLeaveRecords.filter(r => r.status === 'approved').length;
                const rejected = bsAllLeaveRecords.filter(r => r.status === 'rejected').length;
                return (<>
                  <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: bsLeaveFilterStatus === 'pending' ? '#f59e0b' : '#fef3c7', color: bsLeaveFilterStatus === 'pending' ? '#fff' : '#b45309', border: '1px solid #fde68a', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                    onClick={() => setBsLeaveFilterStatus(bsLeaveFilterStatus === 'pending' ? 'all' : 'pending')}>
                    รออนุมัติ {pending}
                  </span>
                  <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: bsLeaveFilterStatus === 'approved' ? '#147F56' : '#D3F0E2', color: bsLeaveFilterStatus === 'approved' ? '#fff' : '#147F56', border: '1px solid #74CCA4', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                    onClick={() => setBsLeaveFilterStatus(bsLeaveFilterStatus === 'approved' ? 'all' : 'approved')}>
                    อนุมัติ {approved}
                  </span>
                  <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: bsLeaveFilterStatus === 'rejected' ? '#dc2626' : '#fee2e2', color: bsLeaveFilterStatus === 'rejected' ? '#fff' : '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                    onClick={() => setBsLeaveFilterStatus(bsLeaveFilterStatus === 'rejected' ? 'all' : 'rejected')}>
                    ไม่อนุมัติ {rejected}
                  </span>
                </>);
              })()}
              <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
              <select value={bsLeaveFilterType} onChange={(e) => setBsLeaveFilterType(e.target.value as any)}
                style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                <option value="all">ทุกประเภท</option>
                <option value="vacation">ลาพักร้อน</option>
                <option value="personal">ลากิจ</option>
                <option value="sick">ลาป่วย</option>
              </select>
              <select value={bsLeaveFilterPerson} onChange={(e) => setBsLeaveFilterPerson(e.target.value)}
                style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', maxWidth: 180 }}>
                <option value="all">พนักงานทั้งหมด</option>
                {[...new Set(bsAllLeaveRecords.map(r => r.person).filter(Boolean))].sort().map((name: string) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {bsAllLeaveRecords.filter(r => r.status === 'pending').length > 0 && (
                <button onClick={handleBsApproveAll}
                  style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, background: '#2A6AAA', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', cursor: 'pointer' }}>
                  <CheckCircle size={12} /> อนุมัติทั้งหมด
                </button>
              )}
            </div>
            {/* Table Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {(() => {
                const isDefaultView = bsLeaveFilterType === 'all' && bsLeaveFilterPerson === 'all';
                const filtered = bsAllLeaveRecords.filter(r => {
                  if (isDefaultView && bsLeaveFilterStatus === 'all') { return r.status === 'pending'; }
                  if (bsLeaveFilterStatus !== 'all' && r.status !== bsLeaveFilterStatus) return false;
                  if (bsLeaveFilterType !== 'all' && r.leaveType !== bsLeaveFilterType) return false;
                  if (bsLeaveFilterPerson !== 'all' && r.person !== bsLeaveFilterPerson) return false;
                  return true;
                });
                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <Users size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                      <div style={{ color: '#94a3b8', fontFamily: 'Kanit', fontSize: 14 }}>
                        {bsAllLeaveRecords.length === 0 ? 'ยังไม่มีรายการลา' : 'ไม่พบรายการที่ตรงกับตัวกรอง'}
                      </div>
                    </div>
                  );
                }
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                        {['พนักงาน', 'ประเภท', 'วันที่ลา', 'เหตุผล', 'สถานะ', 'ผู้อนุมัติ', 'หมายเหตุ', 'จัดการ'].map((h, i) => (
                          <th key={i} style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 12, color: '#64748b', fontWeight: 600, textAlign: i === 7 ? 'center' : 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((lr: any) => (
                        <tr key={lr.id} style={{ borderBottom: '1px solid #f1f5f9', background: lr.status === 'pending' ? '#fffbeb' : 'transparent', transition: 'background 0.15s' }}>
                          <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 13, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={14} color="#4f46e5" />
                              </div>
                              {lr.person || '-'}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '3px 12px', borderRadius: 10, whiteSpace: 'nowrap', background: lr.leaveType === 'vacation' ? '#E5EEF8' : lr.leaveType === 'personal' ? '#fef9c3' : '#fee2e2', color: lr.leaveType === 'vacation' ? '#1E5088' : lr.leaveType === 'personal' ? '#b45309' : '#dc2626' }}>
                              {lr.leaveType === 'vacation' ? 'ลาพักร้อน' : lr.leaveType === 'personal' ? 'ลากิจ' : 'ลาป่วย'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 13, color: '#334155', whiteSpace: 'nowrap' }}>
                            {lr.leaveDate ? new Date(lr.leaveDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 13, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lr.reason || '-'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {lr.status === 'approved' ? (
                              <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#2A6AAA', display: 'flex', alignItems: 'center', gap: 4, background: '#E5EEF8', padding: '3px 10px', borderRadius: 20, width: 'fit-content' }}>
                                <CheckCircle size={12} /> อนุมัติ
                              </span>
                            ) : lr.status === 'rejected' ? (
                              <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, background: '#fee2e2', padding: '3px 10px', borderRadius: 20, width: 'fit-content' }}>
                                <XCircle size={12} /> ไม่อนุมัติ
                              </span>
                            ) : (
                              <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#b45309', display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '3px 10px', borderRadius: 20, width: 'fit-content' }}>
                                <Clock size={12} /> รออนุมัติ
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>
                            {lr.approvedBy || '-'}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 12, color: '#ef4444', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lr.rejectReason || '-'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            {lr.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button onClick={() => handleBsApproveLeave(lr.id)}
                                  style={{ fontFamily: 'Kanit', fontSize: 11, background: '#2A6AAA', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 8, cursor: 'pointer' }}>
                                  อนุมัติ
                                </button>
                                <button onClick={() => { setBsRejectTarget(lr); setBsRejectReason(''); setBsShowRejectModal(true); }}
                                  style={{ fontFamily: 'Kanit', fontSize: 11, background: '#ef4444', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 8, cursor: 'pointer' }}>
                                  ไม่อนุมัติ
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => handleBsDeleteLeave(lr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            {/* Modal Footer */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>ทั้งหมด {bsAllLeaveRecords.length} รายการ</span>
              <button onClick={() => setBsShowLeaveModal(false)} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Reject Reason Modal ===== */}
      {bsShowRejectModal && bsRejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setBsShowRejectModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={20} color="#dc2626" /> ไม่อนุมัติการลา
              </div>
              <button onClick={() => setBsShowRejectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid #fca5a5' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginBottom: 4 }}>รายการลาของ</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                {bsRejectTarget.person} — {bsRejectTarget.leaveType === 'vacation' ? 'ลาพักร้อน' : bsRejectTarget.leaveType === 'personal' ? 'ลากิจ' : 'ลาป่วย'}
              </div>
              <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>
                วันที่: {bsRejectTarget.leaveDate ? new Date(bsRejectTarget.leaveDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'Kanit', fontSize: 13, color: '#334155', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                <MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                สาเหตุที่ไม่อนุมัติ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea value={bsRejectReason} onChange={(e) => setBsRejectReason(e.target.value)} placeholder="กรุณาระบุสาเหตุ..." rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #fca5a5', fontFamily: 'Kanit', fontSize: 13, outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', boxSizing: 'border-box' as const }}
                onFocus={(e) => (e.target.style.borderColor = '#ef4444')} onBlur={(e) => (e.target.style.borderColor = '#fca5a5')} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setBsShowRejectModal(false)} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}>ยกเลิก</button>
              <button onClick={handleBsRejectLeave} disabled={!bsRejectReason.trim()}
                style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: bsRejectReason.trim() ? 1 : 0.5 }}>
                <XCircle size={14} /> ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, #fefce8, #fff)', borderBottom: '2px solid #f1f5f9' }}>
            <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#b45309', marginBottom: 8 }}>📅 ช่วงเวลา</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <input type="date" value={bsStartDate} onChange={ev => setBsStartDate(ev.target.value)} style={{ flex: 1, fontFamily: 'Kanit', fontSize: 11, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', outline: 'none' }} />
              <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>ถึง</span>
              <input type="date" value={bsEndDate} onChange={ev => setBsEndDate(ev.target.value)} style={{ flex: 1, fontFamily: 'Kanit', fontSize: 11, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>
            <select value={bsBranchFilter} onChange={ev => setBsBranchFilter(ev.target.value)} style={{ width: '100%', fontFamily: 'Kanit', fontSize: 11, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 8 }}>
              <option value="all">ทุกสาขา</option>
              {bsBranches.map((b: any) => <option key={b.dataKey} value={b.dataKey}>{b.branchName}</option>)}
            </select>
            <input value={bsSearchQ} onChange={ev => setBsSearchQ(ev.target.value)} placeholder="🔍 ค้นหาพนักงาน..." style={{ width: '100%', fontFamily: 'Kanit', fontSize: 11, padding: '7px 10px', borderRadius: 6, border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            {bsEmpLoading ? <div style={{ padding: 30, textAlign: 'center', fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>กำลังโหลดพนักงาน...</div>
            : bsFilteredEmps.length === 0 ? <div style={{ padding: 30, textAlign: 'center', fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>ไม่พบพนักงาน</div>
            : bsFilteredEmps.map((emp: any, i: number) => {
              const isAct = bsSelEmp?.id === emp.id && bsSelEmp?.branchDataKey === emp.branchDataKey;
              const brIdx = bsBranches.findIndex((b: any) => b.dataKey === emp.branchDataKey);
              const brClr = BS_COLORS[brIdx >= 0 ? brIdx % BS_COLORS.length : 0];
              return (<div key={`${emp.branchDataKey}_${emp.id}`} onClick={() => bsSelectEmp(emp)} style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: isAct ? '#fef3c7' : i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'all 0.15s', borderLeft: isAct ? '3px solid #f59e0b' : '3px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{emp.name}</div><div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b' }}>{emp.position || '-'}</div></div>
                  <span style={{ fontFamily: 'Kanit', fontSize: 9, background: brClr + '18', color: brClr, padding: '2px 8px', borderRadius: 10 }}>{emp.branchName}</span>
                </div>
              </div>);
            })}
          </div>
          {bsFilteredEmps.length > 0 && <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>แสดง {bsFilteredEmps.length} คน</div>}
        </div>
        <div>
          {!bsSelEmp ? (<div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '80px 20px', textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>👥</div><div style={{ fontFamily: 'Kanit', fontSize: 14, color: '#94a3b8' }}>เลือกพนักงานจากรายการด้านซ้าย</div></div>
          ) : (<div>
            <div style={{ background: 'linear-gradient(135deg, #fefce8, #fff)', borderRadius: 14, border: '1px solid #fde68a', padding: '14px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#92400e' }}>{bsSelEmp.name}</div><div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#78716c' }}>{bsSelEmp.position || '-'} • {bsSelEmp.branchName}</div></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => fetchBsRecords(bsSelEmp)} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' }}>🔄</button>
                  <button onClick={() => { setBsShowAdd(!bsShowAdd); setBsAddForm({ date: '', checkin: '', checkout: '' }); }} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#3E86C7', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>➕ เพิ่ม</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #e0e7ff', borderLeft: '4px solid #6366f1' }}><div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 4 }}>⏱ ชั่วโมงรวม</div><div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#4338ca' }}>{bsRecLoading ? '...' : bsTotalH.toFixed(1)}</div><div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>ชั่วโมง</div></div>
              <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #E5EEF8', borderLeft: '4px solid #2A6AAA' }}><div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 4 }}>📅 วันทำงาน</div><div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#2A6AAA' }}>{bsRecLoading ? '...' : bsWorkDays}</div><div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>วัน</div></div>
              <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #fef3c7', borderLeft: '4px solid #f59e0b' }}><div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 4 }}>📊 เฉลี่ย/วัน</div><div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#b45309' }}>{bsRecLoading ? '...' : bsWorkDays > 0 ? (bsTotalH / bsWorkDays).toFixed(1) : '0.0'}</div><div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>ชม./วัน</div></div>
            </div>
            {/* ===== Leave Statistics Section ===== */}
            {(() => {
              const st = bsLeaveStats();
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>📋 สถิติการลา ปี {new Date(bsStartDate).getFullYear() + 543}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {/* ลาพักร้อน */}
                    <div style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', borderRadius: 10, padding: '10px 12px', border: '1px solid #CCDFF1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>🌴</span>
                        <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#1E5088', whiteSpace: 'nowrap' }}>ลาพักร้อน</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#3E86C7' }}>{st.vacation.entitled}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>สิทธิ์</div></div>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{st.vacation.used}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>ลาแล้ว</div></div>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#2A6AAA' }}>{st.vacation.remaining}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>คงเหลือ</div></div>
                      </div>
                      <div style={{ marginTop: 6, background: '#e2e8f0', borderRadius: 4, height: 5, overflow: 'hidden' }}><div style={{ width: `${st.vacation.entitled > 0 ? Math.min((st.vacation.used / st.vacation.entitled) * 100, 100) : 0}%`, height: '100%', background: '#3E86C7', borderRadius: 4, transition: 'width 0.3s' }} /></div>
                    </div>
                    {/* ลากิจ */}
                    <div style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', borderRadius: 10, padding: '10px 12px', border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>💼</span>
                        <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#b45309', whiteSpace: 'nowrap' }}>ลากิจ</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{st.personal.entitled}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>สิทธิ์</div></div>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{st.personal.used}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>ลาแล้ว</div></div>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#2A6AAA' }}>{st.personal.remaining}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>คงเหลือ</div></div>
                      </div>
                      <div style={{ marginTop: 6, background: '#e2e8f0', borderRadius: 4, height: 5, overflow: 'hidden' }}><div style={{ width: `${st.personal.entitled > 0 ? Math.min((st.personal.used / st.personal.entitled) * 100, 100) : 0}%`, height: '100%', background: '#f59e0b', borderRadius: 4, transition: 'width 0.3s' }} /></div>
                    </div>
                    {/* ลาป่วย */}
                    <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', borderRadius: 10, padding: '10px 12px', border: '1px solid #fca5a5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>🤒</span>
                        <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}>ลาป่วย</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{st.sick.entitled}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>สิทธิ์</div></div>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{st.sick.used}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>ลาแล้ว</div></div>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#2A6AAA' }}>{st.sick.remaining}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>คงเหลือ</div></div>
                      </div>
                      <div style={{ marginTop: 6, background: '#e2e8f0', borderRadius: 4, height: 5, overflow: 'hidden' }}><div style={{ width: `${st.sick.entitled > 0 ? Math.min((st.sick.used / st.sick.entitled) * 100, 100) : 0}%`, height: '100%', background: '#ef4444', borderRadius: 4, transition: 'width 0.3s' }} /></div>
                    </div>
                    {/* สาย */}
                    <div style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #f5d0fe 100%)', borderRadius: 10, padding: '10px 12px', border: '1px solid #e9d5ff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>⚠️</span>
                        <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#7c3aed', whiteSpace: 'nowrap' }}>สาย</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#a855f7' }}>{st.late.limit}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>อนุโลม</div></div>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: st.late.count > st.late.limit ? '#ef4444' : '#334155' }}>{st.late.count}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>สายจริง</div></div>
                        <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: st.late.over > 0 ? '#ef4444' : '#147F56' }}>{st.late.over}</div><div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>เกิน</div></div>
                      </div>
                      <div style={{ marginTop: 6, background: '#e2e8f0', borderRadius: 4, height: 5, overflow: 'hidden' }}><div style={{ width: `${st.late.limit > 0 ? Math.min((st.late.count / st.late.limit) * 100, 100) : 0}%`, height: '100%', background: st.late.count > st.late.limit ? '#ef4444' : '#a855f7', borderRadius: 4, transition: 'width 0.3s' }} /></div>
                    </div>
                  </div>
                  {/* Leave Records List */}
                  {bsLeaveRecords.length > 0 && (
                    <div style={{ marginTop: 10, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#64748b' }}>รายการลาทั้งหมด (ปี {new Date(bsStartDate).getFullYear() + 543})</div>
                      <div style={{ maxHeight: 140, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead><tr style={{ background: '#f8fafc' }}>{['วันที่', 'ประเภท', 'เหตุผล', 'สถานะ'].map((h, i) => <th key={i} style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
                          <tbody>{bsLeaveRecords.map((lr: any) => (
                            <tr key={lr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 11, color: '#334155', whiteSpace: 'nowrap' }}>{lr.leaveDate ? new Date(lr.leaveDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}</td>
                              <td style={{ padding: '5px 10px' }}><span style={{ fontFamily: 'Kanit', fontSize: 10, padding: '2px 6px', borderRadius: 10, whiteSpace: 'nowrap', background: lr.leaveType === 'vacation' ? '#E5EEF8' : lr.leaveType === 'personal' ? '#fef9c3' : '#fee2e2', color: lr.leaveType === 'vacation' ? '#1E5088' : lr.leaveType === 'personal' ? '#b45309' : '#dc2626' }}>{lr.leaveType === 'vacation' ? 'พักร้อน' : lr.leaveType === 'personal' ? 'ลากิจ' : 'ลาป่วย'}</span></td>
                              <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 11, color: '#64748b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lr.reason || '-'}</td>
                              <td style={{ padding: '5px 10px' }}>{lr.status === 'approved' ? <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#147F56' }}>✅ อนุมัติ</span> : lr.status === 'rejected' ? <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#dc2626' }}>❌ ไม่อนุมัติ</span> : <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#b45309' }}>⏳ รออนุมัติ</span>}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {bsShowAdd && (<div style={{ background: '#F3F8FC', borderRadius: 12, padding: '12px 14px', marginBottom: 14, border: '1px solid #CCDFF1' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#1E5088', marginBottom: 8 }}>➕ เพิ่มรายการ</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                <input type="date" value={bsAddForm.date} onChange={ev => setBsAddForm({...bsAddForm, date: ev.target.value})} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                <input type="time" value={bsAddForm.checkin} onChange={ev => setBsAddForm({...bsAddForm, checkin: ev.target.value})} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', width: 100 }} />
                <input type="time" value={bsAddForm.checkout} onChange={ev => setBsAddForm({...bsAddForm, checkout: ev.target.value})} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', width: 100 }} />
                <button onClick={bsAddRecord} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 14px', borderRadius: 6, border: 'none', background: '#2A6AAA', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>บันทึก</button>
                <button onClick={() => setBsShowAdd(false)} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}>ยกเลิก</button>
              </div>
            </div>)}
            {bsRecLoading ? (<div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit', color: '#94a3b8' }}>⏳ กำลังดึงข้อมูล...</div>
            ) : (<div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #F3F8FC, #fff)', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#2A6AAA' }}>📋 รายงานเข้า-ออกงาน</span><span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{bsRecords.length} รายการ</span></div>
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f8fafc' }}>{['วันที่','สาขา','เวลาเข้า','เวลาออก','ชม.รวม','สถานะ','จัดการ'].map((h: string, hi: number) => <th key={hi} style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
                  <tbody>{bsRecords.length === 0 ? <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>ไม่มีข้อมูล</td></tr> : bsRecords.map((rec: any) => { const hrs = bsCalcH(rec.checkin, rec.checkout); const isEd = bsEditId === rec.id; return (<tr key={rec.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, color: '#334155', textAlign: 'center' }}>{rec.checkin ? bsFmtDay(rec.checkin) : '-'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}><span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#475569' }}>{bsSelEmp.branchName}</span></td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{isEd ? <input type="time" value={bsEditForm.checkin} onChange={ev => setBsEditForm({...bsEditForm, checkin: ev.target.value})} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid #A6C8E7', width: 80 }} /> : <span style={{ fontFamily: 'Kanit', fontSize: 11, background: rec.checkin ? '#D3F0E2' : 'transparent', color: rec.checkin ? '#147F56' : '#94a3b8', padding: '2px 6px', borderRadius: 4 }}>{bsFmtT(rec.checkin)}</span>}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{isEd ? <input type="time" value={bsEditForm.checkout} onChange={ev => setBsEditForm({...bsEditForm, checkout: ev.target.value})} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid #A6C8E7', width: 80 }} /> : <span style={{ fontFamily: 'Kanit', fontSize: 11, background: rec.checkout ? '#fee2e2' : 'transparent', color: rec.checkout ? '#dc2626' : '#94a3b8', padding: '2px 6px', borderRadius: 4 }}>{bsFmtT(rec.checkout)}</span>}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#4338ca', textAlign: 'center' }}>{hrs !== null ? <span style={{ background: '#e0e7ff', padding: '2px 6px', borderRadius: 4 }}>{hrs.toFixed(1)}</span> : '-'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{rec.approve === 'approved' ? <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#D3F0E2', color: '#147F56', padding: '2px 8px', borderRadius: 10 }}>✅</span> : <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 10 }}>⏳</span>}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{isEd ? <span style={{ display: 'inline-flex', gap: 4 }}><button onClick={() => bsEditSave(rec)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, border: 'none', background: '#3E86C7', color: '#fff', cursor: 'pointer' }}>💾</button><button onClick={() => setBsEditId(null)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>✕</button></span> : <span style={{ display: 'inline-flex', gap: 4 }}><button onClick={() => bsEditStart(rec)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}>✏️</button>{rec.approve !== 'approved' && <button onClick={() => bsApprove(rec)} style={{ fontFamily: 'Kanit', fontSize: 9, padding: '4px 6px', borderRadius: 4, border: 'none', background: '#3E86C7', color: '#fff', cursor: 'pointer' }}>อนุมัติ</button>}</span>}</td>
                  </tr>); })}</tbody>
                  {bsRecords.length > 0 && <tfoot><tr style={{ background: '#F3F8FC', borderTop: '2px solid #CCDFF1' }}><td colSpan={4} style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 700, color: '#1E5088', textAlign: 'right' }}>รวม</td><td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: '#4338ca', textAlign: 'center' }}>{bsTotalH.toFixed(1)}</td><td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#2A6AAA', textAlign: 'center', fontWeight: 600 }}>{bsWorkDays} วัน</td><td></td></tr></tfoot>}
                </table>
              </div>
            </div>)}
          </div>)}
        </div>
      </div>
    </div>);
  };

  const BranchStock = () => {
    const [stBranches, setStBranches] = useState<any[]>([]);
    const [stCurrentUser, setStCurrentUser] = useState<any>(null);
    const [stLoading, setStLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selProduct, setSelProduct] = useState<any>(null);
    const [stockData, setStockData] = useState<any>(null);
    const [stockLoading, setStockLoading] = useState(false);
    const [stBranchFilter, setStBranchFilter] = useState('all');
    const ST_COLORS = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777', '#B45309', '#65A30D'];

    useEffect(() => {
      const init = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);
          const userRes = await axios.get(`/api/login/logins/${userId}`);
          setStCurrentUser(userRes.data);
          const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");
          const branches = accepted.map((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const localBranchId = Number(branch?.id);
            const isRemote = !localBranchId || Number.isNaN(localBranchId) || !branch;
            const bid = isRemote ? c.remoteUserId : localBranchId;
            if (!bid || (!isRemote && localBranchId === userId)) return null;
            return {
              id: bid, companyId: isRemote ? String(c.remoteUserId) : String(localBranchId),
              dataKey: isRemote ? `remote_${c.id}` : `local_${localBranchId}`,
              branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || 'ไม่ทราบชื่อ',
              isRemote, tunnelUrl: c.tunnelUrl || '', remoteUserId: c.remoteUserId || null,
              apiToken: c.apiToken || '', remoteCompany: c.remoteCompany || '',
            };
          }).filter(Boolean);
          const self = {
            id: userId, companyId: String(userId), dataKey: `self_${userId}`,
            branchName: userRes.data.company || 'สาขาปัจจุบัน',
            isRemote: false, tunnelUrl: '', remoteUserId: null, apiToken: '', remoteCompany: '',
          };
          setStBranches([self, ...branches]);
        } catch (e) { console.error('BranchStock init error:', e); }
        setStLoading(false);
      };
      init();
    }, []);

    const doSearch = async () => {
      if (!searchQ.trim() || !stCurrentUser) return;
      setSearchLoading(true);
      try {
        const cid = String(stCurrentUser.id);
        const res = await axios.get(`/api/datalist?company=${cid}&ProductName=${encodeURIComponent(searchQ.trim())}&fields=list`);
        let items = res.data || [];
        if (items.length === 0) {
          const res2 = await axios.get(`/api/datalist?company=${cid}&Barcode=${encodeURIComponent(searchQ.trim())}&fields=list`);
          items = res2.data || [];
        }
        if (items.length === 0) {
          const res3 = await axios.get(`/api/datalist?company=${cid}&code=${encodeURIComponent(searchQ.trim())}&fields=list`);
          items = res3.data || [];
        }
        setSearchResults(items.slice(0, 50));
      } catch (e) { console.error('Search error:', e); setSearchResults([]); }
      setSearchLoading(false);
    };

    const selectProduct = async (product: any) => {
      setSelProduct(product);
      setStockLoading(true);
      setStockData(null);
      try {
        const mainId = String(stCurrentUser.id);
        const localBranches = stBranches.filter(b => !b.isRemote && b.dataKey !== `self_${stCurrentUser.id}`).map(b => b.companyId);
        const remoteBranches = stBranches.filter(b => b.isRemote).map(b => ({
          branchId: b.dataKey, tunnelUrl: b.tunnelUrl, apiToken: b.apiToken,
          remoteUserId: b.remoteUserId, branchName: b.branchName, remoteCompany: b.remoteCompany,
        }));
        const query = product.Barcode || product.code || product.ProductName;
        const res = await axios.post('/api/stocktransfer/branch-lookup', {
          query, mainCompanyId: mainId, branchIds: localBranches, remoteBranches,
        });
        const data = res.data;
        const match = Array.isArray(data) ? data.find((d: any) => String(d.code) === String(product.code)) || data[0] : data;
        setStockData(match || null);
      } catch (e) { console.error('Stock lookup error:', e); setStockData(null); }
      setStockLoading(false);
    };

    const fmtS = (n: number) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

    const getBranchStockList = () => {
      if (!stockData) return [];
      const list: any[] = [];
      const selfBranch = stBranches.find(b => b.dataKey.startsWith('self_'));
      if (selfBranch) list.push({ branchName: selfBranch.branchName + ' ⭐', dataKey: selfBranch.dataKey, balance: stockData.mainTotalBalance || 0, isMain: true });
      (stockData.branchBalances || []).forEach((bb: any) => {
        const br = stBranches.find(b => b.dataKey === bb.branchId || b.companyId === String(bb.branchId));
        list.push({ branchName: br?.branchName || bb.branchId, dataKey: bb.branchId, balance: bb.totalBalance || 0, isMain: false, isRemote: bb.isRemote, hasProduct: bb.hasProduct, error: bb.remoteError });
      });
      return list;
    };

    const branchStockList = selProduct && stockData ? getBranchStockList() : [];
    const filteredStock = stBranchFilter === 'all' ? branchStockList : branchStockList.filter(b => b.dataKey === stBranchFilter);
    const totalAllBranch = branchStockList.reduce((s, b) => s + (b.balance || 0), 0);

    if (stLoading) return (
      <div style={{ textAlign: 'center', padding: 60, fontFamily: 'Kanit', color: '#94a3b8' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>กำลังโหลดข้อมูลสาขา...</div>
    );

    return (
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>📦 Stock สาขา</div>
        <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>ค้นหาสินค้าและดูยอดคงเหลือทุกสาขาที่เชื่อมต่อ ({stBranches.length} สาขา)</div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>
          {/* COL 1: Product Search */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, #F3F8FC, #fff)', borderBottom: '2px solid #f1f5f9' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#1E5088', marginBottom: 8 }}>🔍 ค้นหาสินค้า</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
                  placeholder="รหัส, ชื่อ, หรือ Barcode..."
                  style={{ flex: 1, fontFamily: 'Kanit', fontSize: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none' }} />
                <button onClick={doSearch} disabled={searchLoading}
                  style={{ fontFamily: 'Kanit', fontSize: 11, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3E86C7', color: '#fff', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {searchLoading ? '...' : 'ค้นหา'}
                </button>
              </div>
            </div>
            <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>
                  {searchQ ? 'ไม่พบสินค้า' : 'พิมพ์ชื่อหรือรหัสสินค้าเพื่อค้นหา'}
                </div>
              ) : (
                searchResults.map((p: any, i: number) => {
                  const isActive = selProduct?.id === p.id;
                  return (
                    <div key={p.id} onClick={() => selectProduct(p)}
                      style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: isActive ? '#F3F8FC' : i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'all 0.15s', borderLeft: isActive ? '3px solid #3E86C7' : '3px solid transparent' }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#F3F8FC'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'; }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#1E5088', marginBottom: 2 }}>{p.code}</div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#334155', lineHeight: 1.3 }}>{p.ProductName}</div>
                      {p.Barcode && <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>BC: {p.Barcode}</div>}
                      <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                        {p.type && <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 4 }}>{p.type}</span>}
                        {p.Show === 'show' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3E86C7', marginTop: 3 }} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {searchResults.length > 0 && (
              <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
                แสดง {searchResults.length} รายการ
              </div>
            )}
          </div>

          {/* COL 2: Stock Details */}
          <div>
            {!selProduct ? (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>📦</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 14, color: '#94a3b8' }}>เลือกสินค้าจากรายการด้านซ้ายเพื่อดูยอดคงเหลือแต่ละสาขา</div>
              </div>
            ) : (
              <div>
                {/* Product Info Card */}
                <div style={{ background: 'linear-gradient(135deg, #F3F8FC, #fff)', borderRadius: 14, border: '1px solid #CCDFF1', padding: '14px 18px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>รหัสสินค้า</div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#1E5088' }}>{selProduct.code}</div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 13, color: '#334155', marginTop: 2 }}>{selProduct.ProductName}</div>
                      {(stockData?.Barcode || selProduct.Barcode) && (
                        <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>Barcode: {stockData?.Barcode || selProduct.Barcode}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>ยอดรวมทุกสาขา</div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 28, fontWeight: 700, color: totalAllBranch > 0 ? '#147F56' : totalAllBranch < 0 ? '#dc2626' : '#64748b' }}>
                        {stockLoading ? '...' : fmtS(totalAllBranch)}
                      </div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{stockData?.Unit || ''}</div>
                    </div>
                  </div>
                </div>

                {stockLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit', color: '#94a3b8' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>กำลังดึงข้อมูลสต็อกจากทุกสาขา...</div>
                ) : stockData ? (
                  <>
                    {/* Summary KPI per branch */}
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(branchStockList.length, 5)}, 1fr)`, gap: 10, marginBottom: 14 }}>
                      {branchStockList.slice(0, 5).map((b, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: `1px solid ${ST_COLORS[i % ST_COLORS.length]}25`, borderLeft: `4px solid ${ST_COLORS[i % ST_COLORS.length]}` }}>
                          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.branchName}</div>
                          <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: b.balance > 0 ? '#147F56' : b.balance < 0 ? '#dc2626' : '#94a3b8' }}>{fmtS(b.balance)}</div>
                          {b.error && <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#f59e0b', marginTop: 2 }}>⚠ {b.error}</div>}
                        </div>
                      ))}
                    </div>

                    {/* Chart + Table */}
                    <div style={{ display: 'grid', gridTemplateColumns: branchStockList.length > 1 ? '1fr 1fr' : '1fr', gap: 14, marginBottom: 14 }}>
                      {branchStockList.length > 1 && (
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16 }}>
                          <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#7c3aed', marginBottom: 10 }}>📊 เปรียบเทียบยอดคงเหลือ</div>
                          <ResponsiveContainer width="100%" height={Math.max(140, branchStockList.length * 40)}>
                            <BarChart data={branchStockList.map((b, i) => ({ name: b.branchName.replace(' ⭐', ''), stock: b.balance, fill: ST_COLORS[i % ST_COLORS.length] }))} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis type="number" tick={{ fontFamily: 'Kanit', fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                              <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Kanit', fontSize: 10, fill: '#334155' }} width={90} axisLine={false} />
                              <Tooltip content={({ active, payload }: any) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                                    <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#334155' }}>{payload[0].payload.name}</div>
                                    <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: payload[0].value >= 0 ? '#147F56' : '#dc2626' }}>{fmtS(payload[0].value)} ชิ้น</div>
                                  </div>
                                );
                              }} />
                              <Bar dataKey="stock" radius={[0, 4, 4, 0]} maxBarSize={22}>
                                {branchStockList.map((_, i) => <Cell key={i} fill={ST_COLORS[i % ST_COLORS.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #F3F8FC, #fff)', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#2A6AAA' }}>📋 รายละเอียดสต็อก</span>
                          {branchStockList.length > 1 && (
                            <select value={stBranchFilter} onChange={e => setStBranchFilter(e.target.value)}
                              style={{ fontFamily: 'Kanit', fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff' }}>
                              <option value="all">ทุกสาขา</option>
                              {branchStockList.map((b, i) => <option key={i} value={b.dataKey}>{b.branchName}</option>)}
                            </select>
                          )}
                        </div>
                        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                                <th style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>สาขา</th>
                                <th style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Barcode</th>
                                <th style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>คงเหลือ</th>
                                <th style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>สถานะ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredStock.map((b, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#334155' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ST_COLORS[branchStockList.indexOf(b) % ST_COLORS.length], flexShrink: 0 }} />
                                      <div>
                                        <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#334155' }}>{b.branchName}</div>
                                        {b.isRemote && <span style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>🌐 Remote</span>}
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b', textAlign: 'left' }}>{stockData?.Barcode || selProduct?.Barcode || '-'}</td>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: b.balance > 0 ? '#147F56' : b.balance < 0 ? '#dc2626' : '#94a3b8', textAlign: 'right' }}>{fmtS(b.balance)}</td>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                                    {b.error ? (
                                      <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 10 }}>⚠ ข้อผิดพลาด</span>
                                    ) : b.balance > 10 ? (
                                      <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#E5EEF8', color: '#2A6AAA', padding: '2px 8px', borderRadius: 10 }}>เพียงพอ</span>
                                    ) : b.balance > 0 ? (
                                      <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 10 }}>ใกล้หมด</span>
                                    ) : (
                                      <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#fecaca', color: '#dc2626', padding: '2px 8px', borderRadius: 10 }}>หมด</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: '#F3F8FC', borderTop: '2px solid #CCDFF1' }}>
                                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 700, color: '#1E5088' }}>รวมทุกสาขา</td>
                                <td style={{ padding: '8px 10px' }}></td>
                                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: totalAllBranch > 0 ? '#147F56' : '#dc2626', textAlign: 'right' }}>{fmtS(totalAllBranch)}</td>
                                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b', textAlign: 'center' }}>{branchStockList.length} สาขา</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Lot Details */}
                    {stockData.mainLots && stockData.mainLots.length > 0 && (
                      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #fdf4ff, #fff)', borderBottom: '2px solid #f1f5f9' }}>
                          <span style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#9333ea' }}>📋 Lot สาขาหลัก ({stockData.mainLots.length} lots)</span>
                        </div>
                        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                                {['Lot', 'วันหมดอายุ', 'รับเข้า', 'คงเหลือ', 'ต้นทุน'].map((h, hi) => (
                                  <th key={hi} style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: hi >= 2 ? 'right' : 'left', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {stockData.mainLots.map((lot: any, li: number) => (
                                <tr key={li} style={{ borderBottom: '1px solid #f8fafc' }}>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#334155' }}>{lot.lot || '-'}</td>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b' }}>{lot.dateExp ? new Date(lot.dateExp).toLocaleDateString('th-TH') : '-'}</td>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#334155', textAlign: 'right' }}>{fmtS(Number(lot.qty) || 0)}</td>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: (lot.balance || 0) > 0 ? '#147F56' : '#dc2626', textAlign: 'right' }}>{fmtS(lot.balance || 0)}</td>
                                  <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b', textAlign: 'right' }}>{lot.newCost ? fmtS(Number(lot.newCost)) : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #fecaca', padding: '30px 20px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Kanit', fontSize: 13, color: '#dc2626' }}>❌ ไม่พบข้อมูลสต็อกสำหรับสินค้านี้</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AnalyzeProduct = () => {
    const [apLoading, setApLoading] = useState(false);
    const [apLoadingDetail, setApLoadingDetail] = useState(false);
    const [apProducts, setApProducts] = useState<any[]>([]);
    const [apSelected, setApSelected] = useState<any>(null);
    const [apDetail, setApDetail] = useState<any>(null);
    const [apBranches, setApBranches] = useState<any[]>([]);
    const [apBranchInfos, setApBranchInfos] = useState<{name: string, company: string}[]>([]);
    const [apBranchFilter, setApBranchFilter] = useState('all');
    const today = toThaiDateString();
    const thirtyDaysAgo = toThaiDateString(Date.now() - 30 * 86400000);
    const [apStart, setApStart] = useState(thirtyDaysAgo);
    const [apEnd, setApEnd] = useState(today);
    const [apSearch, setApSearch] = useState('');

    useEffect(() => {
      const init = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);
          const userRes = await axios.get(`/api/login/logins/${userId}`);
          const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");
          const companyLS = localStorage.getItem('company_') || '';
          const selfCo = companyLS || userRes.data.company || '';
          const brInfos: {name: string, company: string}[] = [{ name: userRes.data.company || 'ร้านหลัก', company: selfCo }];
          const brCos: string[] = [selfCo];
          accepted.forEach((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const co = branch?.company || c.remoteCompany || '';
            const nm = c.branchName || co || 'ไม่ทราบชื่อ';
            if (co && !brCos.includes(co)) { brCos.push(co); brInfos.push({ name: nm, company: co }); }
          });
          setApBranchInfos(brInfos);
          setApBranches(brCos.filter(Boolean));
        } catch (e) { console.error('AnalyzeProduct init:', e); }
      };
      init();
    }, []);

    const apGetFilteredCompanies = () => apBranchFilter === 'all' ? apBranches : [apBranchFilter];

    const apFetchProducts = async (companies?: string[]) => {
      setApLoading(true);
      const cos = companies || apGetFilteredCompanies();
      if (cos.length === 0) { setApLoading(false); return; }
      try {
        const mainCo = apBranchInfos.length > 0 ? apBranchInfos[0].company : '';
        const res = await axios.get(`/api/sale_cal/sale_product_analysis_barcode?companies=${encodeURIComponent(cos.join(','))}&mainCompany=${encodeURIComponent(mainCo)}&startDate=${apStart}&endDate=${apEnd}`);
        setApProducts(Array.isArray(res.data) ? res.data : []);
        setApSelected(null); setApDetail(null);
      } catch (e) { console.error('apFetchProducts:', e); setApProducts([]); }
      setApLoading(false);
    };

    useEffect(() => { if (apBranches.length > 0) apFetchProducts(apBranches); }, [apBranches]);

    const apFetchDetail = async (product: any) => {
      setApLoadingDetail(true); setApSelected(product);
      const cos = apGetFilteredCompanies();
      try {
        const res = await axios.get(`/api/sale_cal/sale_product_detail_barcode?companies=${encodeURIComponent(cos.join(','))}&barcode=${encodeURIComponent(product.barcode)}&startDate=${apStart}&endDate=${apEnd}`);
        setApDetail(res.data);
      } catch (e) { console.error('apFetchDetail:', e); setApDetail(null); }
      setApLoadingDetail(false);
    };

    const apFiltered = apProducts.filter(p =>
      p.name.toLowerCase().includes(apSearch.toLowerCase()) || p.code.toLowerCase().includes(apSearch.toLowerCase()) || (p.barcode || '').toLowerCase().includes(apSearch.toLowerCase())
    );

    const ApStatCard = ({ icon: Icon, label, value, color, subValue }: { icon: any, label: string, value: string, color: string, subValue?: string }) => (
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: 1, minWidth: 140 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ backgroundColor: `${color}15`, borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} style={{ color }} /></div>
          <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>{label}</span>
        </div>
        <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{value}</div>
        {subValue && <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>{subValue}</div>}
      </div>
    );

    const ApChartCard = ({ title, data, color }: { title: string, data: { label: string; qty: number }[], color: string }) => (
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12 }}>
        <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>{title}</div>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'Kanit' }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10, fontFamily: 'Kanit' }} stroke="#94a3b8" tickFormatter={(v: number) => v.toLocaleString()} />
              <Tooltip contentStyle={{ fontFamily: 'Kanit', fontSize: 12, borderRadius: 8 }} formatter={(value: number) => [`${value.toLocaleString()} ชิ้น`, 'จำนวน']} />
              <Line type="monotone" dataKey="qty" stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12, padding: '40px 0' }}>ไม่มีข้อมูล</div>
        )}
      </div>
    );

    return (
      <div style={{ backgroundColor: 'white', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden', height: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#f5f3ff', borderBottom: '2px solid #8b5cf6', color: '#6d28d9', padding: '16px 20px', fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          📦 วิเคราะห์สินค้า <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>วิเคราะห์ข้อมูลสินค้าแต่ละรายการจากทุกสาขา</span>
        </div>
        {/* Date Filter */}
        <div style={{ padding: '12px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#64748b' }}>วันเริ่ม:</span>
            <input type="date" value={apStart} onChange={(e) => setApStart(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155' }} />
          </div>
          <span style={{ color: '#94a3b8' }}>➜</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#64748b' }}>วันจบ:</span>
            <input type="date" value={apEnd} onChange={(e) => setApEnd(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155' }} />
          </div>
          <select value={apBranchFilter} onChange={(e) => setApBranchFilter(e.target.value)}
            style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155', background: '#fff', cursor: 'pointer' }}>
            <option value="all">ทุกสาขา ({apBranchInfos.length})</option>
            {apBranchInfos.map((b, i) => <option key={i} value={b.company}>{i === 0 ? `⭐ ${b.name} (ร้านหลัก)` : b.name}</option>)}
          </select>
          <button onClick={() => apFetchProducts()} disabled={apLoading} style={{ fontFamily: 'Kanit', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
            🔍 ค้นหา
          </button>
        </div>
        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Column 1: Product List */}
          <div style={{ width: '40%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span>รายการสินค้า ({apFiltered.length} รายการ)</span>
              <input type="text" placeholder="ค้นหารหัส/ชื่อ/barcode..." value={apSearch} onChange={(e) => setApSearch(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, width: 160, outline: 'none' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {apLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit' }}>กำลังโหลด...</div>
              ) : apProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit' }}>ไม่พบข้อมูลสินค้า</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>#</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>รหัส</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>ชื่อสินค้า</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>จำนวน</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apFiltered.map((product: any) => (
                      <tr key={product.barcode} onClick={() => apFetchDetail(product)}
                        style={{ cursor: 'pointer', backgroundColor: apSelected?.barcode === product.barcode ? '#ede9fe' : 'transparent', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => { if (apSelected?.barcode !== product.barcode) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f5f3ff'; }}
                        onMouseLeave={(e) => { if (apSelected?.barcode !== product.barcode) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{product.rank}</td>
                        <td style={{ padding: '10px 8px', color: '#6366f1', fontWeight: 500 }}>{product.code}</td>
                        <td style={{ padding: '10px 8px', color: '#334155', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>{product.qty.toLocaleString()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2A6AAA', fontWeight: 500 }}>฿{product.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {/* Column 2: Product Dashboard */}
          <div style={{ width: '60%', backgroundColor: '#f8fafc', overflowY: 'auto', padding: 16 }}>
            {!apSelected ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Kanit' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📦</div>
                <div style={{ fontSize: 14 }}>เลือกสินค้าเพื่อดูรายละเอียด</div>
              </div>
            ) : apLoadingDetail ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Kanit' }}>กำลังโหลดข้อมูล...</div>
            ) : apDetail ? (
              <>
                {/* Product Header */}
                <div style={{ background: '#f5f3ff', borderBottom: '2px solid #8b5cf6', borderRadius: 12, padding: 16, marginBottom: 16, color: '#6d28d9' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 12, opacity: 0.8 }}>{apSelected.code}</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700 }}>{apSelected.name}</div>
                </div>
                {/* Stats Cards */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <ApStatCard icon={Award} label="จำนวนขาย" value={apDetail.summary.totalQty.toLocaleString()} color="#6366f1" subValue="ชิ้น" />
                  <ApStatCard icon={Award} label="ยอดขาย" value={`฿${apDetail.summary.totalRevenue.toLocaleString()}`} color="#2A6AAA" />
                  <ApStatCard icon={Award} label="ราคาทุน" value={`฿${apDetail.summary.totalCost.toLocaleString()}`} color="#ef4444" />
                  <ApStatCard icon={Award} label="กำไร" value={`฿${apDetail.summary.profit.toLocaleString()}`} color="#f59e0b" subValue={`${apDetail.summary.profitPercent}%`} />
                  <ApStatCard icon={Award} label="%กำไร" value={`${apDetail.summary.profitPercent}%`} color="#1F9D6B" />
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <ApStatCard icon={Award} label="ราคาขาย/หน่วย" value={`฿${apDetail.summary.avgPrice.toLocaleString()}`} color="#3E86C7" />
                  <ApStatCard icon={Award} label="ราคาทุน/หน่วย" value={`฿${apDetail.summary.costPerUnit.toLocaleString()}`} color="#3E86C7" />
                </div>
                {/* Charts */}
                <ApChartCard title="📅 กราฟจำนวนขายตามวันที่ (1-31)" data={apDetail.dayOfMonthSales} color="#ec4899" />
                <ApChartCard title="📈 กราฟจำนวนขายรายวัน" data={apDetail.dailySales} color="#6366f1" />
                <ApChartCard title="📊 กราฟจำนวนขายรายสัปดาห์" data={apDetail.weeklySales} color="#2A6AAA" />
                <ApChartCard title="📉 กราฟจำนวนขายรายเดือน" data={apDetail.monthlySales} color="#f59e0b" />
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const AnalyzeCategory = () => {
    const [acLoading, setAcLoading] = useState(false);
    const [acLoadingDetail, setAcLoadingDetail] = useState(false);
    const [acCategories, setAcCategories] = useState<any[]>([]);
    const [acSelected, setAcSelected] = useState<any>(null);
    const [acDetail, setAcDetail] = useState<any>(null);
    const [acBranches, setAcBranches] = useState<string[]>([]);
    const [acBranchInfos, setAcBranchInfos] = useState<{name: string, company: string}[]>([]);
    const [acBranchFilter, setAcBranchFilter] = useState('all');
    const acToday = toThaiDateString();
    const acThirtyAgo = toThaiDateString(Date.now() - 30 * 86400000);
    const [acStart, setAcStart] = useState(acThirtyAgo);
    const [acEnd, setAcEnd] = useState(acToday);
    const [acSearchCat, setAcSearchCat] = useState('');
    const [acSearchProd, setAcSearchProd] = useState('');

    useEffect(() => {
      const init = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);
          const userRes = await axios.get(`/api/login/logins/${userId}`);
          const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");
          const companyLS = localStorage.getItem('company_') || '';
          const selfCo = companyLS || userRes.data.company || '';
          const brInfos: {name: string, company: string}[] = [{ name: userRes.data.company || 'ร้านหลัก', company: selfCo }];
          const brCos: string[] = [selfCo];
          accepted.forEach((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const co = branch?.company || c.remoteCompany || '';
            const nm = c.branchName || co || 'ไม่ทราบชื่อ';
            if (co && !brCos.includes(co)) { brCos.push(co); brInfos.push({ name: nm, company: co }); }
          });
          setAcBranchInfos(brInfos);
          setAcBranches(brCos.filter(Boolean));
        } catch (e) { console.error('AnalyzeCategory init:', e); }
      };
      init();
    }, []);

    const acGetFilteredCos = () => acBranchFilter === 'all' ? acBranches : [acBranchFilter];

    const acFetchCategories = async (companies?: string[]) => {
      setAcLoading(true);
      const cos = companies || acGetFilteredCos();
      if (cos.length === 0) { setAcLoading(false); return; }
      const mainCo = acBranchInfos.length > 0 ? acBranchInfos[0].company : '';
      try {
        const res = await axios.get(`/api/sale_cal/sale_category_analysis_barcode?companies=${encodeURIComponent(cos.join(','))}&mainCompany=${encodeURIComponent(mainCo)}&startDate=${acStart}&endDate=${acEnd}`);
        setAcCategories(Array.isArray(res.data) ? res.data : []);
        setAcSelected(null); setAcDetail(null);
      } catch (e) { console.error('acFetchCategories:', e); setAcCategories([]); }
      setAcLoading(false);
    };

    useEffect(() => { if (acBranches.length > 0) acFetchCategories(acBranches); }, [acBranches]);

    const acFetchDetail = async (cat: any) => {
      setAcLoadingDetail(true); setAcSelected(cat);
      const cos = acGetFilteredCos();
      const mainCo = acBranchInfos.length > 0 ? acBranchInfos[0].company : '';
      try {
        const res = await axios.get(`/api/sale_cal/sale_category_detail_barcode?companies=${encodeURIComponent(cos.join(','))}&mainCompany=${encodeURIComponent(mainCo)}&category=${encodeURIComponent(cat.name)}&startDate=${acStart}&endDate=${acEnd}`);
        setAcDetail(res.data);
      } catch (e) { console.error('acFetchDetail:', e); setAcDetail(null); }
      setAcLoadingDetail(false);
    };

    const acFilteredCats = acCategories.filter(c => c.name.toLowerCase().includes(acSearchCat.toLowerCase()));
    const acFilteredProds = (acDetail?.products || []).filter((p: any) =>
      p.name.toLowerCase().includes(acSearchProd.toLowerCase()) || p.code.toLowerCase().includes(acSearchProd.toLowerCase()) || (p.barcode || '').toLowerCase().includes(acSearchProd.toLowerCase())
    );

    const AcStatCard = ({ icon: Icon, label, value, color, subValue }: { icon: any, label: string, value: string, color: string, subValue?: string }) => (
      <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', flex: 1, minWidth: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ backgroundColor: `${color}15`, borderRadius: 6, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} style={{ color }} /></div>
          <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>{label}</span>
        </div>
        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{value}</div>
        {subValue && <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{subValue}</div>}
      </div>
    );

    const AcChartCard = ({ title, data, color }: { title: string, data: { label: string; qty: number }[], color: string }) => (
      <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 10 }}>{title}</div>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'Kanit' }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 9, fontFamily: 'Kanit' }} stroke="#94a3b8" tickFormatter={(v: number) => v.toLocaleString()} />
              <Tooltip contentStyle={{ fontFamily: 'Kanit', fontSize: 11, borderRadius: 6 }} formatter={(value: number) => [`${value.toLocaleString()} ชิ้น`, 'จำนวน']} />
              <Line type="monotone" dataKey="qty" stroke={color} strokeWidth={2} dot={{ fill: color, r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: 11, padding: '30px 0' }}>ไม่มีข้อมูล</div>
        )}
      </div>
    );

    return (
      <div style={{ backgroundColor: 'white', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden', height: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#fffbeb', borderBottom: '2px solid #f59e0b', color: '#b45309', padding: '16px 20px', fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          🏷️ วิเคราะห์กลุ่มสินค้า <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>วิเคราะห์ข้อมูลตามกลุ่มสินค้าจากทุกสาขา</span>
        </div>
        {/* Date Filter */}
        <div style={{ padding: '10px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>วันเริ่ม:</span>
            <input type="date" value={acStart} onChange={(e) => setAcStart(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', color: '#334155' }} />
          </div>
          <span style={{ color: '#94a3b8' }}>➜</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>วันจบ:</span>
            <input type="date" value={acEnd} onChange={(e) => setAcEnd(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', color: '#334155' }} />
          </div>
          <select value={acBranchFilter} onChange={(e) => setAcBranchFilter(e.target.value)}
            style={{ fontFamily: 'Kanit', fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', color: '#334155', background: '#fff', cursor: 'pointer' }}>
            <option value="all">ทุกสาขา ({acBranchInfos.length})</option>
            {acBranchInfos.map((b, i) => <option key={i} value={b.company}>{i === 0 ? `⭐ ${b.name} (ร้านหลัก)` : b.name}</option>)}
          </select>
          <button onClick={() => acFetchCategories()} disabled={acLoading} style={{ fontFamily: 'Kanit', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>
            🔍 ค้นหา
          </button>
        </div>
        {/* 3-Column Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Column 1: Category List */}
          <div style={{ width: '25%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>กลุ่มสินค้า ({acFilteredCats.length})</span>
              <input type="text" placeholder="ค้นหา..." value={acSearchCat} onChange={(e) => setAcSearchCat(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 10, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, width: 80, outline: 'none' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {acLoading ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12 }}>กำลังโหลด...</div>
              ) : acCategories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12 }}>ไม่พบข้อมูล</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: 11 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '8px 6px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>#</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>กลุ่มสินค้า</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acFilteredCats.map((cat: any) => (
                      <tr key={cat.name} onClick={() => acFetchDetail(cat)}
                        style={{ cursor: 'pointer', backgroundColor: acSelected?.name === cat.name ? '#fef3c7' : 'transparent', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => { if (acSelected?.name !== cat.name) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fef9c3'; }}
                        onMouseLeave={(e) => { if (acSelected?.name !== cat.name) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>{cat.rank}</td>
                        <td style={{ padding: '8px 6px', color: '#334155', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#2A6AAA', fontWeight: 500 }}>฿{cat.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {/* Column 2: Products in Category */}
          <div style={{ width: '30%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#fafafa' }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>สินค้าในกลุ่ม {acSelected ? `(${acFilteredProds.length})` : ''}</span>
              <input type="text" placeholder="ค้นหารหัส/ชื่อ..." value={acSearchProd} onChange={(e) => setAcSearchProd(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 10, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, width: 100, outline: 'none' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {!acSelected ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12 }}>เลือกกลุ่มสินค้า</div>
              ) : acLoadingDetail ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12 }}>กำลังโหลด...</div>
              ) : acFilteredProds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit', fontSize: 12 }}>ไม่พบสินค้า</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: 11 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '8px 6px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>#</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>รหัส</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>ชื่อสินค้า</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>จำนวน</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acFilteredProds.map((p: any) => (
                      <tr key={p.barcode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>{p.rank}</td>
                        <td style={{ padding: '8px 6px', color: '#6366f1', fontWeight: 500 }}>{p.code}</td>
                        <td style={{ padding: '8px 6px', color: '#334155', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#334155' }}>{p.qty.toLocaleString()}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#2A6AAA', fontWeight: 500 }}>฿{p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {/* Column 3: Category Dashboard */}
          <div style={{ width: '45%', backgroundColor: '#f8fafc', overflowY: 'auto', padding: 12 }}>
            {!acSelected ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Kanit' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🏷️</div>
                <div style={{ fontSize: 13 }}>เลือกกลุ่มสินค้าเพื่อดูรายละเอียด</div>
              </div>
            ) : acLoadingDetail ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Kanit', fontSize: 13 }}>กำลังโหลดข้อมูล...</div>
            ) : acDetail ? (
              <>
                {/* Category Header */}
                <div style={{ background: '#fffbeb', borderBottom: '2px solid #f59e0b', borderRadius: 10, padding: 12, marginBottom: 12, color: '#b45309' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 700 }}>{acSelected.name}</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 11, opacity: 0.8 }}>กลุ่มสินค้า</div>
                </div>
                {/* Stats Cards */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <AcStatCard icon={Award} label="จำนวนขาย" value={acDetail.summary.totalQty.toLocaleString()} color="#6366f1" subValue="ชิ้น" />
                  <AcStatCard icon={Award} label="ยอดขายรวม" value={`฿${acDetail.summary.totalRevenue.toLocaleString()}`} color="#2A6AAA" />
                  <AcStatCard icon={Award} label="ต้นทุนรวม" value={`฿${acDetail.summary.totalCost.toLocaleString()}`} color="#ef4444" />
                  <AcStatCard icon={Award} label="กำไร" value={`฿${acDetail.summary.profit.toLocaleString()}`} color="#f59e0b" />
                  <AcStatCard icon={Award} label="%กำไร" value={`${acDetail.summary.profitPercent}%`} color="#1F9D6B" />
                </div>
                {/* Charts */}
                <AcChartCard title="📅 กราฟจำนวนขายตามวันที่ (1-31)" data={acDetail.dayOfMonthSales} color="#ec4899" />
                <AcChartCard title="📈 กราฟจำนวนขายรายวัน" data={acDetail.dailySales} color="#6366f1" />
                <AcChartCard title="📊 กราฟจำนวนขายรายสัปดาห์" data={acDetail.weeklySales} color="#2A6AAA" />
                <AcChartCard title="📉 กราฟจำนวนขายรายเดือน" data={acDetail.monthlySales} color="#f59e0b" />
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const AnalyzeOrder = () => {
    const [aoLoading, setAoLoading] = useState(false);
    const [aoProducts, setAoProducts] = useState<any[]>([]);
    const [aoBranches, setAoBranches] = useState<any[]>([]);
    const [aoBranchInfos, setAoBranchInfos] = useState<{name: string, company: string}[]>([]);
    const [aoBranchFilter, setAoBranchFilter] = useState('all');
    const aoToday = toThaiDateString();
    const aoThirtyAgo = toThaiDateString(Date.now() - 30 * 86400000);
    const [aoStart, setAoStart] = useState(aoThirtyAgo);
    const [aoEnd, setAoEnd] = useState(aoToday);
    const [aoSearch, setAoSearch] = useState('');
    const [aoSuppliers, setAoSuppliers] = useState<any[]>([]);
    const [aoSelectedSupplier, setAoSelectedSupplier] = useState('');
    const aoSelectedSupplierObj = aoSuppliers.find(s => String(s.id) === aoSelectedSupplier);
    const [aoSafetyFactor, setAoSafetyFactor] = useState(() => {
      if (typeof window !== 'undefined') { return localStorage.getItem('ao_safety_factor') || ''; }
      return '';
    });
    const aoDateDiff = Math.max(0, Math.round((new Date(aoEnd + 'T00:00:00').getTime() - new Date(aoStart + 'T00:00:00').getTime()) / 86400000));
    const [aoNextOrderDate, setAoNextOrderDate] = useState('');
    const aoNextOrderDays = aoNextOrderDate ? Math.max(0, Math.round((new Date(aoNextOrderDate + 'T00:00:00').getTime() - new Date(aoToday + 'T00:00:00').getTime()) / 86400000)) : 0;
    const [aoBalances, setAoBalances] = useState<Record<string, number>>({});

    useEffect(() => {
      const init = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);
          const userRes = await axios.get(`/api/login/logins/${userId}`);
          const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");
          const companyLS = localStorage.getItem('company_') || '';
          const selfCo = companyLS || userRes.data.company || '';
          const brInfos: {name: string, company: string}[] = [{ name: userRes.data.company || 'ร้านหลัก', company: selfCo }];
          const brCos: string[] = [selfCo];
          accepted.forEach((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const co = branch?.company || c.remoteCompany || '';
            const nm = c.branchName || co || 'ไม่ทราบชื่อ';
            if (co && !brCos.includes(co)) { brCos.push(co); brInfos.push({ name: nm, company: co }); }
          });
          setAoBranchInfos(brInfos);
          setAoBranches(brCos.filter(Boolean));
          try {
            const supRes = await axios.get(`/api/supplier?company=${encodeURIComponent(selfCo)}&fields=list`);
            setAoSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
          } catch (e2) { console.error('fetch suppliers:', e2); }
        } catch (e) { console.error('AnalyzeOrder init:', e); }
      };
      init();
    }, []);

    const aoGetFilteredCos = () => aoBranchFilter === 'all' ? aoBranches : [aoBranchFilter];

    const aoFetchProducts = async (companies?: string[]) => {
      setAoLoading(true);
      const cos = companies || aoGetFilteredCos();
      if (cos.length === 0) { setAoLoading(false); return; }
      try {
        const mainCo = aoBranchInfos.length > 0 ? aoBranchInfos[0].company : '';
        const cosParam = encodeURIComponent(cos.join(','));
        const [res, balRes] = await Promise.all([
          axios.get(`/api/sale_cal/sale_product_analysis_barcode?companies=${cosParam}&mainCompany=${encodeURIComponent(mainCo)}&startDate=${aoStart}&endDate=${aoEnd}`),
          axios.get(`/api/sale_cal/sale_balance_barcode?companies=${cosParam}`),
        ]);
        setAoProducts(Array.isArray(res.data) ? res.data : []);
        const balMap: Record<string, number> = {};
        (Array.isArray(balRes.data) ? balRes.data : []).forEach((b: any) => { if (b.barcode) balMap[b.barcode] = b.balance; });
        setAoBalances(balMap);
      } catch (e) { console.error('aoFetchProducts:', e); setAoProducts([]); }
      setAoLoading(false);
    };

    useEffect(() => { if (aoBranches.length > 0) aoFetchProducts(aoBranches); }, [aoBranches]);

    const aoFiltered = aoProducts.filter(p =>
      p.name.toLowerCase().includes(aoSearch.toLowerCase()) || p.code.toLowerCase().includes(aoSearch.toLowerCase()) || (p.barcode || '').toLowerCase().includes(aoSearch.toLowerCase())
    );

    return (
      <div style={{ backgroundColor: 'white', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden', height: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#F3F8FC', borderBottom: '2px solid #3E86C7', color: '#173F6B', padding: '16px 20px', fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          🛒 วิเคราะห์สั่งซื้อสินค้า <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>วิเคราะห์ข้อมูลการสั่งซื้อสินค้าจากทุกสาขา</span>
        </div>
        {/* Date Filter */}
        <div style={{ padding: '12px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#64748b' }}>วันเริ่ม:</span>
            <input type="date" value={aoStart} onChange={(e) => setAoStart(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155' }} />
          </div>
          <span style={{ color: '#94a3b8' }}>➜</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#64748b' }}>วันจบ:</span>
            <input type="date" value={aoEnd} onChange={(e) => setAoEnd(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155' }} />
          </div>
          <select value={aoBranchFilter} onChange={(e) => setAoBranchFilter(e.target.value)}
            style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155', background: '#fff', cursor: 'pointer' }}>
            <option value="all">ทุกสาขา ({aoBranchInfos.length})</option>
            {aoBranchInfos.map((b, i) => <option key={i} value={b.company}>{i === 0 ? `⭐ ${b.name} (ร้านหลัก)` : b.name}</option>)}
          </select>
          <button onClick={() => aoFetchProducts()} disabled={aoLoading} style={{ fontFamily: 'Kanit', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#3E86C7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
            🔍 ค้นหา
          </button>
          <select value={aoSelectedSupplier} onChange={(e) => setAoSelectedSupplier(e.target.value)}
            style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155', background: '#fff', cursor: 'pointer' }}>
            <option value="">-- เลือกผู้ขาย --</option>
            {aoSuppliers.map((s: any) => <option key={s.id} value={String(s.id)}>{s.code} - {s.names}</option>)}
          </select>
          {aoSelectedSupplierObj && (
            <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#F3F8FC', padding: '6px 12px', borderRadius: 8, border: '1px solid #E5EEF8' }}>
              Leadtime: <span style={{ fontWeight: 700, color: '#2A6AAA' }}>{aoSelectedSupplierObj.leadtime ?? 0} วัน</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>SafetyStock (วัน):</span>
            <input type="number" min="0" step="any" value={aoSafetyFactor}
              onChange={(e) => { setAoSafetyFactor(e.target.value); localStorage.setItem('ao_safety_factor', e.target.value); }}
              style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155', width: 80, textAlign: 'center' }}
              placeholder="0" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>สั่งสินค้าครั้งถัดไป:</span>
            <input type="date" value={aoNextOrderDate} onChange={(e) => setAoNextOrderDate(e.target.value)}
              style={{ fontFamily: 'Kanit', fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155' }} />
            {aoNextOrderDate && (
              <span style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#2A6AAA', backgroundColor: '#F3F8FC', padding: '4px 10px', borderRadius: 8, border: '1px solid #E5EEF8' }}>{aoNextOrderDays} วัน</span>
            )}
          </div>
        </div>
        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Product List */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span>รายการสินค้า ({aoFiltered.length} รายการ) <span style={{ fontWeight: 400, color: '#ef4444', fontSize: 11 }}>(คำนวณย้อนหลัง : {aoDateDiff} วัน)</span></span>
              <input type="text" placeholder="ค้นหารหัส/ชื่อ/barcode..." value={aoSearch} onChange={(e) => setAoSearch(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, width: 160, outline: 'none' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {aoLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit' }}>กำลังโหลด...</div>
              ) : aoProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontFamily: 'Kanit' }}>ไม่พบข้อมูลสินค้า</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>#</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>รหัส</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>ชื่อสินค้า</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>จำนวน</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>เฉลี่ย/วัน</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>ROP</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>MIN</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>MAX</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>คงเหลือ</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>สถานะ</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>จำนวนสั่งซื้อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aoFiltered.map((product: any) => (
                      <tr key={product.barcode}
                        style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{product.rank}</td>
                        <td style={{ padding: '10px 8px', color: '#3E86C7', fontWeight: 500 }}>{product.code}<div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{product.barcode || ''}</div></td>
                        <td style={{ padding: '10px 8px', color: '#334155', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>{product.qty.toLocaleString()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2A6AAA', fontWeight: 500 }}>{aoDateDiff > 0 ? (product.qty / aoDateDiff).toFixed(1) : '0'}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#6366f1', fontWeight: 700 }}>{(() => { const avg = aoDateDiff > 0 ? Math.round(product.qty / aoDateDiff * 100) / 100 : 0; const lt = aoSelectedSupplierObj?.leadtime ?? 0; const sf = Number(aoSafetyFactor) || 0; return ((avg * lt) + (avg * sf)).toFixed(0); })()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>{(() => { const avg = aoDateDiff > 0 ? Math.round(product.qty / aoDateDiff * 100) / 100 : 0; const sf = Number(aoSafetyFactor) || 0; return (avg *  sf).toFixed(0); })()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>{(() => { const avg = aoDateDiff > 0 ? Math.round(product.qty / aoDateDiff * 100) / 100 : 0; const lt = aoSelectedSupplierObj?.leadtime ?? 0; return ((avg * lt) + (avg * aoNextOrderDays)).toFixed(0); })()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155', fontWeight: 700 }}>{(aoBalances[product.barcode] ?? 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>{(() => { const bal = aoBalances[product.barcode] ?? 0; const avg = aoDateDiff > 0 ? Math.round(product.qty / aoDateDiff * 100) / 100 : 0; const lt = aoSelectedSupplierObj?.leadtime ?? 0; const sf = Number(aoSafetyFactor) || 0; const rop = (avg * lt) + (avg * sf); return bal < rop ? (<span style={{ fontFamily: 'Kanit', fontSize: 10, backgroundColor: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 20, border: '1px solid #fecaca', fontWeight: 600, whiteSpace: 'nowrap' }}>⚠ ต่ำกว่า ROP</span>) : null; })()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#3E86C7', fontWeight: 700 }}>{(() => { const bal = Math.max(0, aoBalances[product.barcode] ?? 0); const avg = aoDateDiff > 0 ? Math.round(product.qty / aoDateDiff * 100) / 100 : 0; const lt = aoSelectedSupplierObj?.leadtime ?? 0; const maxVal = (avg * lt) + (avg * aoNextOrderDays); return Math.max(0, Math.round(maxVal - bal)); })()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BranchOrder = () => {
    const [boLoading, setBoLoading] = useState(false);
    const [boBranches, setBoBranches] = useState<any[]>([]);
    const [boOrders, setBoOrders] = useState<Record<string, any[]>>({});
    const [boSelectedBranch, setBoSelectedBranch] = useState('all');
    const [boSelectedOrderId, setBoSelectedOrderId] = useState<number | null>(null);
    const [boSelectedBranchKey, setBoSelectedBranchKey] = useState<string>('');
    const [boSearch, setBoSearch] = useState('');
    const [boStatusFilter, setBoStatusFilter] = useState('all');
    const [boShowPrice, setBoShowPrice] = useState(true);

    useEffect(() => {
      const init = async () => {
        try {
          const token = localStorage.getItem("token"); if (!token) return;
          const payload = jwtDecode<any>(token);
          const userId = Number(payload.idcompany);
          const userRes = await axios.get(`/api/login/logins/${userId}`);
          const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
          const accepted = connRes.data.filter((c: any) => c.status === "accepted");
          const companyLS = localStorage.getItem('company_') || '';
          const selfCo = companyLS || userRes.data.company || '';
          const branches = accepted.map((c: any) => {
            const isFromUs = c.fromUserId === userId;
            const branch = isFromUs ? c.toUser : c.fromUser;
            const localId = Number(branch?.id);
            const isRemote = !localId || Number.isNaN(localId) || !branch;
            const bid = isRemote ? c.remoteUserId : localId;
            if (!bid || (!isRemote && localId === userId)) return null;
            return { id: bid, company: branch?.company || c.remoteCompany || '', dataKey: isRemote ? `remote_${c.id}` : `local_${localId}`, branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || "ไม่ทราบชื่อ", isRemote, tunnelUrl: c.tunnelUrl || "", remoteUserId: c.remoteUserId || null };
          }).filter(Boolean);
          const self = { id: userId, company: selfCo, dataKey: `self_${userId}`, branchName: userRes.data.company || "สาขาปัจจุบัน", isRemote: false, tunnelUrl: "", remoteUserId: null };
          setBoBranches([self, ...branches]);
        } catch (e) { console.error("BranchOrder init:", e); }
      };
      init();
    }, []);

    useEffect(() => {
      if (boBranches.length === 0) return;
      const fetchAll = async () => {
        setBoLoading(true);
        const nd: Record<string, any[]> = {};
        await Promise.all(boBranches.map(async (b: any) => {
          try {
            if (b.isRemote && b.tunnelUrl) {
              const base = `/api/sale_cal/branch-proxy?tunnelUrl=${encodeURIComponent(b.tunnelUrl)}`;
              const res = await axios.get(`${base}&apiPath=/api/order&company=${b.remoteUserId || b.company}`).catch(() => ({ data: [] }));
              nd[b.dataKey] = Array.isArray(res.data) ? res.data : [];
            } else {
              const res = await axios.get(`/api/order?company=${encodeURIComponent(b.company)}`);
              nd[b.dataKey] = Array.isArray(res.data) ? res.data : [];
            }
          } catch { nd[b.dataKey] = []; }
        }));
        setBoOrders(nd);
        setBoLoading(false);
      };
      fetchAll();
    }, [boBranches]);

    const allOrdersList = (() => {
      const target = boSelectedBranch === 'all' ? boBranches : boBranches.filter(b => b.dataKey === boSelectedBranch);
      const list: any[] = [];
      target.forEach((b: any) => {
        (boOrders[b.dataKey] || []).forEach((o: any) => {
          list.push({ ...o, _branchName: b.branchName, _branchKey: b.dataKey });
        });
      });
      list.sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime());
      return list;
    })();

    const filteredOrders = allOrdersList.filter(o => {
      if (boStatusFilter !== 'all' && o.status !== boStatusFilter) return false;
      if (boSearch) {
        const s = boSearch.toLowerCase();
        return (o.orderfull || '').toLowerCase().includes(s) || (o.supplierName || '').toLowerCase().includes(s) || (o._branchName || '').toLowerCase().includes(s);
      }
      return true;
    });

    const selectedOrder = boSelectedOrderId ? allOrdersList.find(o => o.id === boSelectedOrderId && o._branchKey === boSelectedBranchKey) : null;
    const selectedItems = selectedOrder?.items ? [...selectedOrder.items].sort((a: any, b: any) => (a.itemName || '').localeCompare(b.itemName || '', 'th')) : [];

    const totalAllOrders = filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const pendingCount = filteredOrders.filter(o => o.status === 'Pending').length;
    const acknowledgedCount = filteredOrders.filter(o => o.status === 'Acknowledged').length;
    const receivedCount = filteredOrders.filter(o => o.status === 'Received').length;

    const COLORS = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777'];

    return (
      <div style={{ backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden', height: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #173F6B, #3E86C7)', color: '#fff', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
            <div>
              <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700 }}>ข้อมูลสั่งสินค้าสาขา</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 11, opacity: 0.8 }}>รวมข้อมูลการสั่งซื้อสินค้าจากทุกสาขา</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700 }}>{filteredOrders.length}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, opacity: 0.8 }}>รายการทั้งหมด</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#fde68a' }}>{pendingCount}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, opacity: 0.8 }}>รอดำเนินการ</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#A6C8E7' }}>{acknowledgedCount}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, opacity: 0.8 }}>รับทราบแล้ว</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#A6C8E7' }}>{receivedCount}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, opacity: 0.8 }}>รับสินค้าแล้ว</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700 }}>{totalAllOrders.toLocaleString()}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 10, opacity: 0.8 }}>มูลค่ารวม (บาท)</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '10px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select value={boSelectedBranch} onChange={(e) => { setBoSelectedBranch(e.target.value); setBoSelectedOrderId(null); }}
            style={{ fontFamily: 'Kanit', fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155', background: '#fff', cursor: 'pointer', minWidth: 160 }}>
            <option value="all">🏢 ทุกสาขา ({boBranches.length})</option>
            {boBranches.map((b, i) => <option key={b.dataKey} value={b.dataKey}>{i === 0 ? `⭐ ${b.branchName}` : b.branchName}</option>)}
          </select>
          <select value={boStatusFilter} onChange={(e) => setBoStatusFilter(e.target.value)}
            style={{ fontFamily: 'Kanit', fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155', background: '#fff', cursor: 'pointer' }}>
            <option value="all">📋 ทุกสถานะ</option>
            <option value="Pending">⏳ รอดำเนินการ</option>
            <option value="Acknowledged">👁️ รับทราบแล้ว</option>
            <option value="Received">✅ รับสินค้าแล้ว</option>
          </select>
          <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
            <input type="text" placeholder="🔍 ค้นหา Order / ผู้ขาย / สาขา..." value={boSearch} onChange={(e) => setBoSearch(e.target.value)}
              style={{ fontFamily: 'Kanit', fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155', width: '100%', outline: 'none' }} />
          </div>
          {boLoading && <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#3E86C7' }}>⏳ กำลังโหลด...</span>}
        </div>

        {/* Content: Master-Detail */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Master: Order List */}
          <div style={{ width: '42%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📜 ประวัติการสั่งสินค้า ({filteredOrders.length})</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontFamily: 'Kanit', fontSize: 13 }}>
                  <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>📭</div>
                  ไม่พบข้อมูลการสั่งซื้อ
                </div>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isSelected = boSelectedOrderId === order.id && boSelectedBranchKey === order._branchKey;
                  const brColor = COLORS[boBranches.findIndex(b => b.dataKey === order._branchKey) % COLORS.length];
                  return (
                    <div key={`${order._branchKey}_${order.id}`}
                      onClick={() => { setBoSelectedOrderId(order.id); setBoSelectedBranchKey(order._branchKey); }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#F3F8FC' : idx % 2 === 0 ? '#fafafa' : '#fff',
                        borderLeft: isSelected ? `4px solid #2A6AAA` : `4px solid transparent`,
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div>
                          <span style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#173F6B' }}>{order.orderfull}</span>
                          <span style={{ fontFamily: 'Kanit', fontSize: 10, color: brColor, marginLeft: 8, backgroundColor: `${brColor}15`, padding: '2px 8px', borderRadius: 10, border: `1px solid ${brColor}30` }}>{order._branchName}</span>
                        </div>
                        <span style={{
                          fontFamily: 'Kanit', fontSize: 10, padding: '2px 10px', borderRadius: 10, fontWeight: 600,
                          background: order.status === 'Pending' ? '#fef9c3' : order.status === 'Acknowledged' ? '#E5EEF8' : '#D3F0E2',
                          color: order.status === 'Pending' ? '#854d0e' : order.status === 'Acknowledged' ? '#173F6B' : '#0C5238',
                          border: `1px solid ${order.status === 'Pending' ? '#facc15' : order.status === 'Acknowledged' ? '#A6C8E7' : '#43B283'}`
                        }}>
                          {order.status === 'Pending' ? '⏳ รอดำเนินการ' : order.status === 'Acknowledged' ? '👁️ รับทราบแล้ว' : '✅ รับสินค้าแล้ว'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#334155' }}>{order.supplierName || '-'}</div>
                          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>
                            {new Date(order.createDate).toLocaleDateString('th-TH')} · {new Date(order.createDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            {order.person ? ` · ${order.person}` : ''}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: '#173F6B' }}>
                          {(order.totalAmount || 0).toLocaleString()} <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>บาท</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail: Order Items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedOrder ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'Kanit' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>👈</div>
                <div style={{ fontSize: 14 }}>เลือกรายการสั่งซื้อเพื่อดูรายละเอียด</div>
              </div>
            ) : (
              <>
                {/* Detail Header */}
                <div style={{ padding: '14px 20px', backgroundColor: '#F3F8FC', borderBottom: '2px solid #3E86C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: '#173F6B', display: 'flex', alignItems: 'center', gap: 8 }}>
                      🔍 รายละเอียดใบสั่งซื้อ
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>#{selectedOrder.orderfull}</span>
                    </div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {selectedOrder._branchName} · {selectedOrder.supplierName} · {selectedItems.length} รายการ
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Kanit', fontSize: 11, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={boShowPrice} onChange={(e) => setBoShowPrice(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#2A6AAA', cursor: 'pointer' }} />
                      แสดงราคา
                    </label>
                    {selectedOrder.status === 'Pending' && (
                      <button onClick={() => {
                        if (!confirm('ยืนยันรับทราบการสั่งซื้อ #' + selectedOrder.orderfull + ' ?\n(รับทราบว่ามีการสั่งสินค้า ไม่ใช่การรับสินค้า)')) return;
                        axios.put('/api/order', { orderId: selectedOrder.id, status: 'Acknowledged' }).then(() => {
                          setBoOrders(prev => {
                            const updated = { ...prev };
                            const key = selectedOrder._branchKey;
                            if (updated[key]) {
                              updated[key] = updated[key].map((o: any) => o.id === selectedOrder.id ? { ...o, status: 'Acknowledged' } : o);
                            }
                            return updated;
                          });
                          toast.success(<div style={{ fontFamily: 'Kanit', fontSize: 14 }}>👁️ รับทราบการสั่งซื้อเรียบร้อย</div>, { duration: 2500 });
                        }).catch(() => {
                          toast.error(<div style={{ fontFamily: 'Kanit', fontSize: 14 }}>เกิดข้อผิดพลาด</div>, { duration: 2500 });
                        });
                      }} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '5px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 6px rgba(62, 134, 199,0.3)', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(62, 134, 199,0.35)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(62, 134, 199,0.3)'; }}>
                        ✅ Confirm รับทราบ
                      </button>
                    )}
                    <button onClick={() => {
                      if (!selectedOrder) return;
                      const companyName = localStorage.getItem('cp_') || localStorage.getItem('company_') || '';
                      const items = selectedItems;
                      const totalAmount = selectedOrder.totalAmount || items.reduce((s: number, i: any) => s + (i.total || 0), 0);
                      const orderDate = selectedOrder.createDate ? new Date(selectedOrder.createDate) : new Date();
                      const thDate = orderDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
                      const pw = window.open('', '_blank', 'width=800,height=1000');
                      if (!pw) return;
                      pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ใบสั่งซื้อ ${selectedOrder.orderfull}</title><style>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
@page { size: A4 portrait; margin: 15mm 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Sarabun', sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; }
.page { max-width: 210mm; margin: 0 auto; }
.header { text-align: center; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 3px solid #173F6B; }
.header h1 { font-size: 22px; font-weight: 700; color: #173F6B; letter-spacing: 2px; }
.header .subtitle { font-size: 13px; color: #64748b; }
.info-grid { display: flex; justify-content: space-between; margin-bottom: 14px; gap: 12px; }
.info-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
.info-box .label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; font-weight: 600; }
.info-box .value { font-size: 13px; font-weight: 600; color: #1e293b; }
table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
thead th { background: #173F6B; color: #fff; font-weight: 600; font-size: 12px; padding: 8px 10px; text-align: center; }
thead th:first-child { border-radius: 6px 0 0 0; }
thead th:last-child { border-radius: 0 6px 0 0; }
tbody td { padding: 7px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
tbody tr:nth-child(even) { background: #f8fafc; }
.text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; }
.item-code { color: #173F6B; font-weight: 600; font-size: 11px; }
.total-row { background: #F3F8FC !important; border-top: 2px solid #173F6B; }
.total-row td { font-weight: 700; font-size: 14px; padding: 10px; color: #173F6B; }
.footer { margin-top: 30px; display: flex; justify-content: space-between; padding: 0 20px; }
.sign-box { text-align: center; width: 180px; }
.sign-line { border-bottom: 1px solid #64748b; margin-bottom: 6px; height: 50px; }
.sign-label { font-size: 11px; color: #64748b; }
.branch-badge { display: inline-block; background: #E5EEF8; color: #173F6B; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; margin-left: 8px; }
.status-badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; }
.status-pending { background: #fef9c3; color: #854d0e; }
.status-acknowledged { background: #E5EEF8; color: #173F6B; }
.status-received { background: #E5EEF8; color: #173F6B; }
.print-info { text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="page">
  <div class="header">
    <h1>ใบสั่งซื้อสินค้า</h1>
    <div class="subtitle">PURCHASE ORDER</div>
  </div>
  <div class="info-grid">
    <div class="info-box"><div class="label">สาขา / Branch</div><div class="value">${selectedOrder._branchName || '-'}</div></div>
    <div class="info-box"><div class="label">เลขที่ / Order No.</div><div class="value">${selectedOrder.orderfull || '-'}</div></div>
    <div class="info-box"><div class="label">วันที่ / Date</div><div class="value">${thDate}</div></div>
  </div>
  <div class="info-grid">
    <div class="info-box"><div class="label">ผู้ขาย / Supplier</div><div class="value">${selectedOrder.supplierName || '-'}</div></div>
    <div class="info-box"><div class="label">ผู้สั่งซื้อ / Ordered By</div><div class="value">${selectedOrder.person || '-'}</div></div>
    <div class="info-box"><div class="label">สถานะ / Status</div><div class="value"><span class="status-badge ${selectedOrder.status === 'Pending' ? 'status-pending' : selectedOrder.status === 'Acknowledged' ? 'status-acknowledged' : 'status-received'}">${selectedOrder.status === 'Pending' ? 'รอดำเนินการ' : selectedOrder.status === 'Acknowledged' ? 'รับทราบแล้ว' : 'รับสินค้าแล้ว'}</span></div></div>
  </div>
  <table>
    <thead><tr><th style="width:6%">ลำดับ</th><th style="width:12%">รหัสสินค้า</th><th style="width:${boShowPrice ? '38' : '62'}%;text-align:left">รายการสินค้า</th><th style="width:10%">จำนวน</th>${boShowPrice ? '<th style="width:15%">ราคา/หน่วย</th><th style="width:15%">รวม (บาท)</th>' : ''}</tr></thead>
    <tbody>
      ${items.map((item: any, idx: number) => `<tr><td class="text-center">${idx + 1}</td><td class="text-center item-code">${item.itemcode || '-'}</td><td class="text-left">${item.itemName || '-'}</td><td class="text-center">${(item.qty || 0).toLocaleString()}</td>${boShowPrice ? `<td class="text-right">${(item.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td class="text-right">${(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ''}</tr>`).join('')}
      ${boShowPrice ? `<tr class="total-row"><td colspan="5" class="text-right">ยอดรวมทั้งสิ้น</td><td class="text-right">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td></tr>` : ''}
    </tbody>
  </table>
  <div style="text-align:right;font-size:12px;color:#64748b;margin-bottom:4px">จำนวนรายการ: ${items.length} รายการ</div>
  <div class="footer">
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">ผู้สั่งซื้อ</div><div class="sign-label">(${selectedOrder.person || '............................'})</div></div>
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">ผู้อนุมัติ</div><div class="sign-label">(............................)</div></div>
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">ผู้รับสินค้า</div><div class="sign-label">(............................)</div></div>
  </div>
  <div class="print-info">พิมพ์เมื่อ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} | SmileStore POS</div>
</div></body></html>`);
                      pw.document.close();
                      setTimeout(() => { pw.print(); }, 500);
                    }} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '5px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 6px rgba(124,58,237,0.25)', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(124,58,237,0.35)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(124,58,237,0.25)'; }}>
                      🖨️ Print
                    </button>
                    <button onClick={() => {
                      if (!selectedOrder?.items?.length) return;
                      const data = selectedItems.map((item: any, i: number) => ({
                        'ลำดับ': i + 1, 'รหัสสินค้า': item.itemcode || '', 'รายการสินค้า': item.itemName || '',
                        'จำนวน': item.qty || 0, 'ราคา/หน่วย': item.cost || 0, 'รวม': item.total || 0,
                      }));
                      import('xlsx').then(XLSX => {
                        const ws = XLSX.utils.json_to_sheet(data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'รายการสั่งซื้อ');
                        XLSX.writeFile(wb, `สั่งซื้อ_${selectedOrder._branchName}_${selectedOrder.orderfull}.xlsx`);
                      });
                    }} style={{ fontFamily: 'Kanit', fontSize: 11, padding: '5px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #2A6AAA, #1E5088)', color: '#fff', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      📊 Export Excel
                    </button>
                  </div>
                </div>

                {/* Detail Table */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit', fontSize: 12 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600, width: '6%', fontSize: 11 }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, width: '12%', fontSize: 11 }}>รหัส</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11 }}>รายการสินค้า</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600, width: '10%', fontSize: 11 }}>จำนวน</th>
                        {boShowPrice && <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 600, width: '14%', fontSize: 11 }}>ราคา/หน่วย</th>}
                        {boShowPrice && <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 600, width: '14%', fontSize: 11 }}>รวม</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item: any, idx: number) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', color: '#2A6AAA', fontWeight: 600, fontSize: 11 }}>{item.itemcode}</td>
                          <td style={{ padding: '10px 12px', color: '#1e293b', fontSize: 12 }}>{item.itemName}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#2A6AAA', backgroundColor: '#F3F8FC', padding: '3px 12px', borderRadius: 8, border: '1px solid #E5EEF8' }}>{item.qty}</span>
                          </td>
                          {boShowPrice && <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569', fontSize: 12 }}>{(item.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>}
                          {boShowPrice && <td style={{ padding: '10px 12px', textAlign: 'right', color: '#1e293b', fontWeight: 600, fontSize: 12 }}>{(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detail Footer */}
                <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b' }}>
                    จำนวนรายการ: <span style={{ fontWeight: 600, color: '#334155' }}>{selectedItems.length}</span>
                  </div>
                  {boShowPrice && (
                    <div style={{ fontFamily: 'Kanit', fontSize: 15, fontWeight: 700, color: '#173F6B' }}>
                      รวมทั้งสิ้น: {(selectedOrder.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })} <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>บาท</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15 }} className="" >

      <div className="row justify-content-start " >
        <HeadTab />
      </div>
      <div className="row justify-content-start " >

        <div className="col-sm-1" >
          <MenuTab_Small />
        </div>

        <div className='col-sm-11'>
          <div className='row' >
            <Tab.Container id="left-tabs-example" defaultActiveKey="first">
              <Row>
                <Col sm={2}>
                  <Nav variant="pills" className="flex-column custom-pills" style={{ width: "80%" }}>
                    <div className='mb-2' style={{ fontFamily: "kanit_B", fontSize: 15, marginTop: 20 }}>ข้อมูลสาขา</div>
                    <Nav.Item>
                      <Nav.Link eventKey="first" style={{ fontFamily: "kanit", fontSize: 13 }}>สรุปยอดขายสาขา</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="analyze" style={{ fontFamily: "kanit", fontSize: 13 }}>วิเคราะห์ยอดขายสาขา</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="analyzeProduct" style={{ fontFamily: "kanit", fontSize: 13 }}>วิเคราะห์สินค้า</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="analyzeCategory" style={{ fontFamily: "kanit", fontSize: 13 }}>วิเคราะห์กลุ่มสินค้า</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="branchOrder" style={{ fontFamily: "kanit", fontSize: 13 }}>ข้อมูลสั่งสินค้าสาขา</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="branchpl" style={{ fontFamily: "kanit", fontSize: 13 }}>กำไร-ขาดทุนสาขา</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="branchstaff" style={{ fontFamily: "kanit", fontSize: 13 }}>พนักงานสาขา</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="branchstock" style={{ fontFamily: "kanit", fontSize: 13 }}>Stock สาขา</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="second" style={{ fontFamily: "kanit", fontSize: 13 }}>โอนระหว่างสาขา</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="three" style={{ fontFamily: "kanit", fontSize: 13 }}>ตั้งค่าเชื่อมสาขา</Nav.Link>
                    </Nav.Item>

                  </Nav>

                  {/* Branch Connection Status Panel */}
                  {sidebarBranches.length > 0 && (
                    <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #F3F8FC, #CCDFF1)', borderBottom: '1px solid #E5EEF8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 700, color: '#173F6B' }}>📡 สถานะสาขา</span>
                        <button
                          onClick={handleSidebarRefreshAll}
                          disabled={sidebarCheckingAll}
                          style={{ fontFamily: 'Kanit', fontSize: 9, padding: '3px 8px', borderRadius: 6, border: '1px solid #CCDFF1', background: sidebarCheckingAll ? '#E5EEF8' : '#fff', color: '#2A6AAA', cursor: sidebarCheckingAll ? 'default' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.2s' }}>
                          {sidebarCheckingAll ? '⏳ กำลังตรวจ...' : '🔄 Refresh'}
                        </button>
                      </div>
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {sidebarBranches.map((conn: any) => {
                          const isFromUs = conn.fromUserId === Number(jwtDecode<any>(localStorage.getItem("token") || "").idcompany || 0);
                          const brName = conn.branchName || (isFromUs ? conn.toUser?.company : conn.fromUser?.company) || conn.remoteCompany || 'ไม่ทราบชื่อ';
                          const isOnline = conn.isOnline === true;
                          const isChecking = sidebarCheckingId === conn.id;
                          const lastCheck = conn.lastCheckedAt ? new Date(conn.lastCheckedAt).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
                          return (
                            <div key={conn.id}
                              onClick={() => !isChecking && handleSidebarCheckStatus(conn.id)}
                              style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, cursor: isChecking ? 'default' : 'pointer', transition: 'background 0.15s', background: isChecking ? '#EDF9F3' : 'transparent' }}
                              onMouseEnter={(e) => { if (!isChecking) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
                              onMouseLeave={(e) => { if (!isChecking) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                              <div style={{ position: 'relative', flexShrink: 0 }}>
                                {isChecking ? (
                                  <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #f59e0b', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                                ) : (
                                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: isOnline ? '#1F9D6B' : '#94a3b8', boxShadow: isOnline ? '0 0 6px rgba(31, 157, 107,0.5)' : 'none', transition: 'all 0.3s' }} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brName}</div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>
                                  {isChecking ? 'กำลังตรวจสอบ...' : isOnline ? '🟢 ออนไลน์' : '⚫ ออฟไลน์'}
                                  {lastCheck && !isChecking && <span style={{ marginLeft: 4 }}>· {lastCheck}</span>}
                                </div>
                              </div>
                              <div style={{ flexShrink: 0 }}>
                                <span style={{ fontFamily: 'Kanit', fontSize: 9, padding: '2px 6px', borderRadius: 8, background: isOnline ? '#D3F0E2' : '#f1f5f9', color: isOnline ? '#147F56' : '#94a3b8', fontWeight: 600 }}>
                                  {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* CSS for spinner animation */}
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </Col>
                <Col sm={10}>
                  <Tab.Content>
                    <Tab.Pane eventKey="first" mountOnEnter unmountOnExit><PLcompany /></Tab.Pane>
                    <Tab.Pane eventKey="analyze" mountOnEnter unmountOnExit><AnalyzeBranch /></Tab.Pane>
                    <Tab.Pane eventKey="analyzeProduct" mountOnEnter unmountOnExit><AnalyzeProduct /></Tab.Pane>
                    <Tab.Pane eventKey="analyzeCategory" mountOnEnter unmountOnExit><AnalyzeCategory /></Tab.Pane>
                    <Tab.Pane eventKey="analyzeOrder" mountOnEnter unmountOnExit><AnalyzeOrder /></Tab.Pane>
                    <Tab.Pane eventKey="branchOrder" mountOnEnter unmountOnExit><BranchOrder /></Tab.Pane>
                    <Tab.Pane eventKey="branchpl" mountOnEnter unmountOnExit><BranchPL /></Tab.Pane>
                    <Tab.Pane eventKey="branchstaff" mountOnEnter unmountOnExit><BranchStaff /></Tab.Pane>
                    <Tab.Pane eventKey="branchstock" mountOnEnter unmountOnExit><BranchStock /></Tab.Pane>
                    <Tab.Pane eventKey="second" mountOnEnter unmountOnExit><Linkcompany /></Tab.Pane>
                    <Tab.Pane eventKey="three" mountOnEnter unmountOnExit><Settingcompany /></Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </div>
        </div>

      </div>

    </div>




  );
}
export default CompanyLossPage
