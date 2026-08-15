'use client'

import React, { useState, useEffect, Suspense, createContext, useContext, ChangeEvent, KeyboardEvent } from 'react'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import PermissionGuard from '@/components/PermissionGuard'
import styles from "../componant/mystyle.module.css";
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
import axios from 'axios'
const apipromotion = "promotion"
import { Check, AArrowDown, ChevronDownIcon, ChevronsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Toaster, toast } from "sonner"
import ProductPromotionPanel from "./ProductPromotionPanel"


function PromotionPage() {

  const [showcolor, setshowcolor] = useState("")

  useEffect(() => {

    // change background color with a random color
    setshowcolor("1")


  }, []);


  // **************  Promotion ************************************
  const MainPromotion = () => {

    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(undefined)

    const [open1, setOpen1] = React.useState(false)
    const [date1, setDate1] = React.useState<Date | undefined>(undefined)

    //***************************************************************** */
    const [promotionfullS, SetPromotionfull] = useState([])

    const [idS, Setid] = useState("")
    const [conidS, SetConid] = useState("")
    const [promotionS, SetPromotion] = useState("")
    const [conditionS, SetCondition] = useState("")
    const [condiS, SetCon] = useState("")
    const [conunitS, SetConunit] = useState("")
    const [customerS, SetCustomer] = useState("")
    const [discountS, SetDiscount] = useState("")
    const [unitdisS, SetUnitDis] = useState("")

    const [startdateS, SetStartDate] = useState("")
    const [enddateS, SetEndDate] = useState("")

    const [saleeqS, SetSaleEQ] = useState("")
    const [diseqS, SetDisEQ] = useState("")

    const [randoms, setUpdete] = useState(0)

    const [selectedOption, setSelectedOption] = useState('percent');  //Ratio bath/%

    const initialValues = {
      company: "",
      idSaleItem: "",
      start_date: "",
      end_date: "",
      baht: ""

    };

    const [all, setall1] = useState(initialValues)
    console.log(startdateS)
    const handleInputChange = (e: any) => {
      const { name, value } = e.target;
      setTimeout(() => {
        setall1({
          ...all,
          [name]: value,
        });
      }, 30);
    };

    const customer = [
      { value: "เลือกประเภทลูกค้า" },
      { value: "ลูกค้าทั้งหมด" },
      { value: "ลูกค้าสมาชิก" }
    ]
    const promotionlist = [
      { id: 0, value: "เลือกเงื่อนไขโปรโมชั่น", con: "", unit: "", discount: "" },
      { id: 1, value: "ซื้อตามยอดกำหนด", con: "ซื้อยอดครบ", unit: "บาท", discount: "ส่วนลด ท้ายบิล", unitdis: "% ยอดขาย", unitdisbaht: "บาท" },
      //  {id:3,value:"ลดสินค้าตาม%",con:"ซื้อสินค้าครบ",unit:"ชิ้น",discount:"ส่วนลดสินค้า",unitdis:"% ยอดสินค้า",unitdisbaht:"บาท"},
      //  { id: 4, value: "ซื้อ..แถม..", con: "ซื้อ", unit: "ชิ้น", discount: "แถม", unitdis: "ชิ้น", unitdisbaht: "ชิ้น" },
      { id: 1, value: "เกิดเดือนนี้", con: "ซื้อยอดครบ", unit: "บาท", discount: "ส่วนลด ท้ายบิล", unitdis: "% ยอดขาย", unitdisbaht: "บาท" },
      { id: 2, value: "แนะนำเพื่อนใหม่", con: "แนะนำเพื่อน", unit: "คน", discount: "ส่วนลด ท้ายบิล", unitdis: "% ยอดขาย", unitdisbaht: "บาท" },
      { id: 1, value: "สมัครสมาขิกใหม่", con: "ซื้อสินค้าครบ", unit: "บาท", discount: "ส่วนลด ท้ายบิล", unitdis: "% ยอดขาย", unitdisbaht: "บาท" }
    ]

    //******** */ Name Promotion date******************************
    const PromotionInput = (e: any) => {
      SetPromotion(e.target.value)
    }

    //******** */ condition ******************************
    const ConditionInput = (e: any) => {
      SetCondition(e.target.value)

      e.target.value === e.target.value ? SetCon(promotionlist.filter((p: any) => p.value === String(e.target.value)).map((c: any) => c.con)[0]) : ""

      e.target.value === e.target.value ? SetConunit(promotionlist.filter((p: any) => p.value === String(e.target.value)).map((c: any) => c.unit)[0]) : ""

      e.target.value === e.target.value ? SetDiscount(promotionlist.filter((p: any) => p.value === String(e.target.value)).map((c: any) => c.discount)[0]) : ""

      e.target.value === e.target.value ? SetConid(promotionlist.filter((p: any) => p.value === String(e.target.value)).map((c: any) => c.id)[0]) : ""


    }
    //******** */ customer  ******************************
    const CustomerInput = (e: any) => {
      SetCustomer(e.target.value)
    }

    //******** */  Promotion number******************************
    const SaleEQInput = (e: any) => {
      SetSaleEQ(e.target.value)
    }

    //******** */  Promotion discount******************************
    const DisEQInput = (e: any) => {
      SetDisEQ(e.target.value)
    }
    //************************************************ */
    // input Radio Pay
    const Radio_pay = () => {



      const [payS, setpay] = useState(0)
      useEffect(() => {

        selectedOption === "percent" ? SetUnitDis(promotionlist.filter((p: any) => p.value === conditionS).map((c: any) => c.unitdis)[0]) :
          SetUnitDis(promotionlist.filter((p: any) => p.value === conditionS).map((c: any) => c.unitdisbaht)[0])

      }, [Number(payS)]);

      return (

        <>
          <div className="col">
            <label style={{ fontFamily: "Kanit", fontSize: 12 }}>
              <input
                type="radio"
                name="percent"
                value="percent"
                checked={selectedOption === 'percent'}
                onChange={(e) => { setSelectedOption(e.target.value), setpay(Math.random) }}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              คำนวณเป็น %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 12, marginLeft: 20 }}>
              <input
                type="radio"
                name="baht" // Same name for all radio buttons in the group
                value="baht"
                checked={selectedOption === 'baht'} // Controlled by state
                onChange={(e) => { setSelectedOption(e.target.value), setpay(Math.random) }}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              คำนวณเป็น บาท
            </label>
          </div>

        </>
      )
    }
    //*********Get Promotion ************************** */
    useEffect(() => {

      fetchPosts()

    }, [randoms])

    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${apipromotion}?company=${companyS}`)
        await res.data[0] == undefined ? "" : SetPromotionfull(res.data)
      } catch (error) {
        console.error(error)
      }
    }


    const AlertComplete = () => {
      // เมื่อชำระเงินสำเร็จ
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
        duration: 3000, // ปิดเองใน 3 วิ
      });
    };

    //***********Post Promotion************************** */  &nbsp;
    const Save = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const company = companyS
      const name_promotion = promotionS
      const customer = customerS
      const conditionid = Number(conidS)
      const condition = conditionS
      const startdate = all.start_date === "" ?
        new Date(new Date().setDate(new Date().getDate())) :
        new Date(new Date(all.start_date).setDate(new Date(all.start_date).getDate()))
      const enddate = all.end_date === "" ?
        new Date(new Date().setDate(new Date().getDate())) :
        new Date(new Date(all.end_date).setDate(new Date(all.end_date).getDate()))
      const unit = selectedOption
      const pay_condition = Number(saleeqS)
      const discount = Number(diseqS)
      const msg_condition = condiS + " " + saleeqS + " " + conunitS
      const msg_discount = discountS + " " + diseqS + " " + unitdisS
      const status = "OK"
      const person = ""
      // company,name_promotion,customer,conditionid,condition,startdate,enddate,unit,pay_condition,discount,status,person
      try {
        await axios.post(`/api/${apipromotion}`,
          {
            company, name_promotion, customer, conditionid, condition, startdate, enddate, unit, pay_condition, discount, status, person, msg_condition, msg_discount
          }
        )
        AlertComplete()
        setUpdete(Math.random)
      } catch (error) {
        console.error(error)
      }
    }

    //***********Edit Promotion************************** */
    const Edit = async () => {
      const name_promotion = promotionS
      const customer = customerS
      const conditionid = Number(conidS)
      const condition = conditionS
      const startdate = new Date(new Date(startdateS).setDate(new Date(startdateS).getDate()))
      const enddate = new Date(new Date(enddateS).setDate(new Date(enddateS).getDate()))
      const unit = selectedOption
      const pay_condition = Number(saleeqS)
      const discount = Number(diseqS)
      const msg_condition = condiS + " " + saleeqS + " " + conunitS
      const msg_discount = discountS + " " + diseqS + " " + unitdisS
      const status = "OK"
      const person = ""
      // company,name_promotion,customer,conditionid,condition,startdate,enddate,unit,pay_condition,discount,status,person
      try {
        await axios.put(`/api/${apipromotion}/${Number(idS)}`,
          {
            name_promotion, customer, conditionid, condition, startdate, enddate, unit, pay_condition, discount, status, person, msg_condition, msg_discount
          }
        )
        AlertComplete()
        setUpdete(Math.random)
      } catch (error) {
        console.error(error)
      }
    }
    //********* */ Delete Data*************************/
    const Delete = async (deleteId: number) => {
      if (!deleteId || isNaN(deleteId)) {
        console.error("Invalid ID for delete")
        return
      }
      try {
        await axios.delete(`/api/${apipromotion}/${deleteId}`)
        setall1(initialValues)
        Setid("")
        SetPromotion("")
        SetConid("")
        SetCondition("")
        SetCustomer("")
        SetUnitDis("")
        SetSaleEQ("")
        SetDisEQ("")
        setUpdete(Math.random)
      } catch (error) {
        console.error(error)
      }
    }

    // **********Clear Data********************************/
    const Clear = async () => {
      setall1(initialValues)
      Setid("")
      SetPromotion("")
      SetConid("")
      SetCondition("")
      SetCustomer("")
      SetUnitDis("")
      SetSaleEQ("")
      SetDisEQ("")

    }
    //************Get ID Promotion***************************/
    useEffect(() => {

      idS === "" ? "" : fetchGetID()

    }, [idS]);

    const fetchGetID = async () => {
      try {
        const res = await axios.get(`/api/${apipromotion}/${Number(idS)}`);
        res.data !== undefined ? Setid([res.data][0].id) : ""
        res.data !== undefined ? SetPromotion([res.data][0].name_promotion) : ""
        res.data !== undefined ? SetConid([res.data][0].conditionid) : ""
        res.data !== undefined ? SetCondition([res.data][0].condition) : ""
        res.data !== undefined ? SetCustomer([res.data][0].customer) : ""
        res.data !== undefined ? SetUnitDis([res.data][0].unit) : ""
        res.data !== undefined ? setSelectedOption([res.data][0].unit) : ""
        res.data !== undefined ? SetStartDate([res.data][0].startdate) : ""
        res.data !== undefined ? SetEndDate([res.data][0].enddate) : ""
        res.data !== undefined ? SetSaleEQ([res.data][0].pay_condition) : ""
        res.data !== undefined ? SetDisEQ([res.data][0].discount) : ""

        SetCon(promotionlist.filter((p: any) => p.value === String([res.data][0].condition)).map((c: any) => c.con)[0])
        SetConunit(promotionlist.filter((p: any) => p.value === String([res.data][0].condition)).map((c: any) => c.unit)[0])
        SetDiscount(promotionlist.filter((p: any) => p.value === String([res.data][0].condition)).map((c: any) => c.discount)[0])
        SetConid(promotionlist.filter((p: any) => p.value === String([res.data][0].condition)).map((c: any) => c.id)[0])
        res.data !== undefined ? setall1(res.data) : ""
      } catch (error) {
        console.error(error)
      }
    }

    const date_start = new Date(String(all.start_date))
    const date_end = new Date(String(all.end_date))
    return (

      <div className='col-6'>
        <div className="row justify-content-between mb-2">
          <div className="col-4">
            <div className='mt-2 mb-2' style={{ fontFamily: "kanit", fontSize: 15, width: 180 }}>โปรโมชั่น</div>
          </div>
          <div className="col col-lg-3">
            <button
              type="button"
              className={idS === "" ? "btn btn-success" : "btn btn-warning"}
              onClick={() => idS === "" ? Save() : Edit()}
              style={{ fontFamily: "kanit", fontSize: 14 }}>
              {idS === "" ? "บันทีก" : "แก้ไข"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => Clear()}
              style={{ fontFamily: "kanit", fontSize: 14, marginLeft: 5 }}>
              ล้าง
            </button>
          </div>
        </div>

        <div className="input-group">
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>ชื่อโปรโมชั่น</span>
          <input
            type="text"
            className="form-control"
            placeholder=""
            aria-label="Username"
            value={promotionS}
            onChange={PromotionInput}
            aria-describedby="visible-addon"
            style={{ fontFamily: "kanit", fontSize: 15 }} />
        </div>

        <div className="input-group mt-2">
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>ลูกค้าที่รับสิทธิ์</span>
          <select className="form-select" id="inputGroup" onChange={CustomerInput} style={{ fontFamily: "kanit", fontSize: 12 }} value={customerS !== undefined ? customerS : "เลือกประเภทลูกค้า"}>
            {customer.length > 0 &&
              customer.map((option: any, index: any) =>
                <option
                  value={option.value}
                  disabled={option.disable ? true : false}
                  key={index}
                  selected={option.selected}
                  style={{ fontFamily: "kanit", fontSize: 12 }} >
                  {option.value}
                </option>
              )}
          </select>
        </div>


        <div className="input-group mt-2">
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>เงื่อนไข โปรโมชั่น</span>
          <select className="form-select" id="inputGroup" onChange={ConditionInput} style={{ fontFamily: "kanit", fontSize: 12 }} value={conditionS !== undefined ? conditionS : "เลือกเงื่อนไขโปรโมชั่น"}>
            {promotionlist.length > 0 &&
              promotionlist.map((option: any, index: any) =>
                <option
                  value={option.value}
                  disabled={option.disable ? true : false}
                  key={index}
                  selected={option.selected}
                  style={{ fontFamily: "kanit", fontSize: 12 }}>
                  {option.value}
                </option>
              )}
          </select>
        </div>

        <div className='row mt-2'>
          <div className='d-flex' style={{ justifyContent: "start" }}>

            <div className={styles.bodydetail} style={{ width: 50, height: 27, alignContent: "center", marginRight: 5 }} >เริ่ม วันที่ :</div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild >
                <Button
                  variant="outline"
                  id="order_date"
                  name="order_date"
                  className=" justify-start mb-1 rounded"
                  style={{ fontFamily: "Kanit", fontSize: 12, width: 120, height: 30 }}>
                  <div style={{ width: 110 }}>
                    {all.start_date && !isNaN(new Date(all.start_date).getTime())
                      ? new Date(all.start_date).toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric", })
                      : new Date().toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric", })}
                  </div>
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger >
              <PopoverContent className="w-auto overflow-hidden p-0" align="end" >
                <Calendar
                  mode="single"
                  selected={date}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setDate(date)
                    setall1({ ...all, start_date: date ? date.toLocaleDateString() : "", })
                    setOpen(false)
                  }} />
              </PopoverContent>
            </Popover>

            <div className={styles.bodydetail} style={{ width: 50, height: 27, alignContent: "center", marginRight: 5 }} >ถึง วันที่ :</div>
            <Popover open={open1} onOpenChange={setOpen1}>
              <PopoverTrigger asChild >
                <Button
                  variant="outline"
                  id="order_date"
                  name="order_date"
                  className=" justify-start mb-1 rounded"
                  style={{ fontFamily: "Kanit", fontSize: 12, width: 120, height: 30 }}>
                  <div style={{ width: 110 }}>
                    {all.end_date && !isNaN(new Date(all.end_date).getTime())
                      ? new Date(all.end_date).toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric", })
                      : new Date().toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric", })}
                  </div>
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger >
              <PopoverContent className="w-auto overflow-hidden p-0" align="end" >
                <Calendar
                  mode="single"
                  selected={date1}
                  captionLayout="dropdown"
                  onSelect={(date1) => {
                    setDate1(date1)
                    setall1({ ...all, end_date: date1 ? date1.toLocaleDateString() : "", })
                    setOpen1(false)
                  }} />
              </PopoverContent>                                                                                                                                                                                                           </Popover>
          </div>
        </div>

        <Radio_pay />

        <div className="input-group mt-1" style={{ width: 270 }}>

          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>{condiS}</span>
          <input
            type="number"
            className="form-control"
            placeholder=""
            aria-label="Username"
            aria-describedby="visible-addon"
            value={saleeqS}
            onChange={SaleEQInput}
            style={{ fontFamily: "kanit", fontSize: 15, textAlign: "center" }} />
          <span className="input-group-text" id="basic-addon2" style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}>{conunitS}</span>
        </div>
        <div className="input-group mt-1" style={{ width: 270 }}>
          <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 110, color: "GrayText" }}>{discountS}</span>
          <input
            type="number"
            className="form-control"
            placeholder=""
            aria-label="Username"
            aria-describedby="visible-addon"
            value={diseqS}
            onChange={DisEQInput}
            style={{ fontFamily: "kanit", fontSize: 15, textAlign: "center" }} />
          <span className="input-group-text" id="basic-addon2" style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}>{unitdisS}</span>
        </div>

        <div className='mt-2'>
          <table className="table table-hover">
            <thead>
              <tr>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ชื่อโปรโมชั่น</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ลูกค้าที่ได้รับสิทธิ์</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>เลือกเงื่อนไขโปรโมชั่น</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ตั้งแต่</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ถึง</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ข้อความสิทธิ์</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>สิทธิ์ที่ได้รับ</th>
                <th style={{ fontFamily: "kanit", fontSize: 10 }}>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {promotionfullS.map((n: any) =>
                <tr key={n.id} onClick={() => { Setid(n.id) }}>
                  <td style={{ fontFamily: "kanit", fontSize: 10 }}>{n.name_promotion}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 10 }}>{n.customer}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 10 }}>{n.condition}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 10 }}>{new Date(n.startdate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: '2-digit', })}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 10 }}>{new Date(n.enddate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: '2-digit', })}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 10 }}>{n.msg_condition}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 10 }}>{n.msg_discount}</td>
                  <td style={{ fontFamily: "kanit", fontSize: 10, color: "red" }}><button type='button' onClick={(e) => { e.stopPropagation(); Delete(n.id) }}>ลบ</button></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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

        <div className="col-sm-11">
          <div className='col shadow-sm rounded border' style={{ backgroundColor: "white", height: "90vh" }}>
            <div className='row-5 mt-2 mb-2' style={{ marginLeft: 5 }}>
              <div style={{ fontFamily: "kanit_B", fontSize: 15, justifySelf: "center" }}>ตั้งค่า โปรโมชั่น</div>
            </div>

            <div className='row' style={{ marginLeft: 40 }}>
              {showcolor === "1" ? < MainPromotion /> : ""}
              {showcolor === "1" ? < ProductPromotionPanel /> : ""}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
function PromotionPageWrapper() {
  return <PermissionGuard codename="M1"><PromotionPage /></PermissionGuard>
}
export default PromotionPageWrapper