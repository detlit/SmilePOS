"use client"

import React, { useEffect, useState, ChangeEvent, KeyboardEvent, use } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import axios from 'axios'
import Modal_blt from 'react-bootstrap/Modal';
import PermissionGuard from '@/components/PermissionGuard'

const apipl = "pl/pl"


const ProfitLossPage = () => {
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

  //***************************************************************** */
  const [saledaily, setsaledaily] = useState([])
  const [countday, setcountday] = useState(0);
  const [countnow, setnowday] = useState(0);
  const [countlast, setlastday] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const avgDays = (() => {
    const now = new Date();
    const selMonth = parseInt(String(monthS));
    const selYear = parseInt(String(yearS));
    if (selYear === now.getFullYear() && selMonth === now.getMonth() + 1) {
      return now.getDate();
    } else {
      return new Date(selYear, selMonth, 0).getDate();
    }
  })();

  useEffect(() => {
    const EEE = async () => {
      try {

        fetchPostsz()
        GetPL()
      } catch (error) {
        console.error(error)
      }
    }
    EEE()


  }, [])

  const fetchPostsz = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    setIsLoading(true)
    try {
      const resday = await axios.get(`/api/pl/summary?company=${companyS}&createDate=${yearS}-${monthS}&v=${new Date().getTime()}`)
      setsaledaily(resday.data ?? [])
      setcountday(resday.data.length ?? 0)

      const nowS = parseInt(new Date().toLocaleDateString('es-US', { day: '2-digit' }));
      setnowday(nowS ?? 0)
    } catch (error) {
      console.error("Error in fetchPostsz:", error)
    } finally {
      setIsLoading(false)
    }
  }


  const [pl, setpl] = useState([])
  const [plid, setplid] = useState(0)


  const GetPL = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/pl/pl?company=${companyS}&monthyear=${yearS}-${monthS}`)

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
      const month = monthS
      const year = yearS
      const monthyear = `${yearS}-${monthS}`

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
                onClick={async () => { await SavePL(); setShowte(false) }}
              >
                บันทึก
              </button>
              :
              <button
                className="btn btn-warning"
                style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                onClick={async () => { await EditPL(); setShowte(false) }}
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
          <div className='row shadow-sm rounded border' style={{ backgroundColor: "white" }}>
            <div className=' mt-2 mb-2 col-10' style={{ marginLeft: 5 }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "center" }}>กำไร ขาดทุน</div>
            </div>

            <div className='col-5 ' style={{ backgroundColor: "white" }}>

              <div className="input-group mt-2" style={{ width: 360, marginLeft: 20 }}>
                <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 150, color: "GrayText" }}>ค้นหา ข้อมูลประจำเดือน/ปี :</span>
                <select className="form-select" id="inputGroup" onChange={MonthInput} style={{ fontFamily: "kanit", fontSize: 12 }} value={monthS !== undefined ? monthS : "เลือกเดือน"}>
                  {month.length > 0 &&
                    month.map((option: any, index: any) =>
                      <option
                        value={option.month}
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
                        value={option.year}
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
                  disabled={isLoading}
                  style={{ fontFamily: "kanit", fontSize: 12, justifySelf: "center", width: 60 }}>
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    "ค้นหา"
                  )}
                </button>
              </div>

              <div className='mt-2' style={{ marginLeft: 10 }}>
                {isLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="mt-2" style={{ fontFamily: "kanit", fontSize: 12 }}>กำลังโหลดข้อมูล...</div>
                  </div>
                ) : (
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
                    <tfoot>
                      <tr>
                        <td style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "right", width: 80 }}>รวม ({countday}) วัน</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.bill) || 0), 0)).toFixed(0)}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)).toFixed(0)}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0)).toFixed(0)}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>
                          {(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) - saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0)).toFixed(0)}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>
                          {(((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)) - Number(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0))) / Number(saledaily.reduce((a: any, b: any) => a + b.sale || 0, 0))) * 100).toFixed(0)}%</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 80 }}>{saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0).toFixed(0)}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 80 }}>{saledaily.reduce((a: any, b: any) => a + (Number(b.diff) || 0), 0).toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "right", width: 80 }}>เฉลี่ย ({avgDays}) วัน</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.bill) || 0), 0) / avgDays).toFixed(0) ?? ""}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0) / avgDays).toFixed(0) ?? ""}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0) / avgDays).toFixed(0) ?? ""}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>
                          {((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)) - Number(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0))) / avgDays).toFixed(0) ?? ""}
                        </td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 60 }}>
                          {(((Number(saledaily.reduce((a: any, b: any) => a + (Number(b.sale) || 0), 0)) - Number(saledaily.reduce((a: any, b: any) => a + (Number(b.cost) || 0), 0))) / Number(saledaily.reduce((a: any, b: any) => a + b.sale || 0, 0))) * 100).toFixed(0) ?? ""}%</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 80 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0) / avgDays).toFixed(0) ?? ""}</td>
                        <td style={{ fontFamily: "kanit_B", fontSize: 15, textAlign: "right", width: 80 }}>{(saledaily.reduce((a: any, b: any) => a + (Number(b.diff) || 0), 0) / avgDays).toFixed(0) ?? ""}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
            <div className="col-5 " style={{ backgroundColor: "white" }}>
              <button
                className='btn btn-outline-secondary'
                type='button'
                style={{ fontFamily: "kanit", fontSize: 10, justifySelf: "end" }}
                onClick={() => setShowte(true)}
              >เพิ่มข้อมูล</button>
              <PL_Edit />


              <table>

                {pl.map((a: any) => {
                  return (
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.R4001).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.R4002).toFixed(0)}</div></td>
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
                          ).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.C5001).toFixed(0)}</div></td>
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
                          {(Number(saledaily.reduce((a: any, b: any) => a + (Number(b.rc) || 0), 0)) + Number(a.C5001)).toFixed(0)}
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
                          ).toFixed(0)}
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6000).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6001).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6002).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6003).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6004).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6005).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6006).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6007).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6008).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6009).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.S6010).toFixed(0)}</div></td>
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
                              + Number(a.S6010)).toFixed(0)

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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.A7000).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.A7001).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.A7002).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.A7003).toFixed(0)}</div></td>
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10 }}>
                          {((Number(a.A7003) /
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.A7004).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.A7005).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.A7006).toFixed(0)}</div></td>
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
                        <td><div style={{ fontFamily: "kanit", fontSize: 13, justifySelf: "right", marginLeft: 10, color: "black" }}>{Number(a.A7007).toFixed(0)}</div></td>
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
                              + Number(a.A7007)).toFixed(0)

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
                              + Number(a.A7007)).toFixed(0)

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


                          ).toFixed(0)}

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
                            )
                          )).toFixed(0)}

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
                          ).toFixed(0)}

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
                    </tbody>
                  );
                })}
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
function ProfitLossPageWrapper() {
  return <PermissionGuard codename="L1"><ProfitLossPage /></PermissionGuard>
}
export default ProfitLossPageWrapper;