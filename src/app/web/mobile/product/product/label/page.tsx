
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import styles from "../../../../componant/mystyle.module.css";
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
import deletes from "../../../../../icon/delete-junk.svg"

const apis = "datalist"
const apiitemRC = "receivelist"
const apisaleitem = "sale_cal/sale_list_item"
const apibalance = "sale_cal/sale_balance"
const apigiftlist = "gift/giftlist"

const apiindicatorlist = "label/indicatorlist"
const apitimes = "label/times"
const apitimeL = "label/timeL"
const apiuseL = "label/useL"
const apitimeuseL = "label/timeuseL"
const apikeepL = "label/keepL"
const apiRemarkL = "label/remarkL"
import QRCode from "react-qr-code";
const apilabeldata = "label/labeldata"
const apitranslate = "label/label_translate"

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
const getlabel = "setting/label"
const getstore = "setting/store/store"

const getmethodlist = "setting/store/store"

// ตั้งค่่าฉลากยา
const SetLabel = () => {


  const initialValues = {
    id: "",
    code: "",
    company: "",
    ProductName: "",

  };

  const initialValues1 = {
    id: "",
    company: "",
    code: "",
    indicatorlistS: "",
    timeS: "",
    useS: "",
    timeuseS: "",
    keepS: "",
    remarkS: "",
  };

  // const {ids} =useAppContext(); 
  //  const {itemcodes} =useAppContext(); 
  const ids = useMessageStore((state) => state.ids)
  const itemcodes = useMessageStore((state) => state.itemcodes)


  const [all, setall1] = useState(initialValues)
  const [alllabel, setlabel] = useState(initialValues1)

  useEffect(() => {
    const useMyHook = async () => {
      try {
        await fetchPost()
        await LabelData()


      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [ids])

  //Get DataProduct
  const fetchPost = async () => {

    try {
      const res = await axios.get(`/api/${apis}/${Number(ids)}`)
      //  setall1(res.data)
      res.data !== undefined ? setall1(res.data) : setall1(initialValues)

    } catch (error) {
      console.error(error)
    }

  }


  //Get Label Data
  const LabelData = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apilabeldata}?company=${companyS}&code=${itemcodes}`)
      res.data[0] !== undefined ? setlabel(res.data[0]) : setlabel(initialValues1)

    } catch (error) {
      console.error(error)
    }

  }


  const [storeS, SetStore] = useState("")
  const [addressS, SetAddress] = useState("")
  const [telS, SetTel] = useState("")
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedUrl1, setUploadedUrl1] = useState<string | null>(null);
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

    } catch (error) {
      console.error(error)
    }

  }

  useEffect(() => {
    fetchPostStore()
  }, []);

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

    } catch (error) {
      console.error(error)
    }

  }

  useEffect(() => {
    fetchPosts()

  }, []);




  return (
    <div className='row mt-4' style={{ justifyContent: "center" }}>
      <div className='col-9 rounded border border-2 shadow shadow-sm' style={{ height: "32vh", backgroundColor: "white" }}>
        <div className='row'>
          <div className='row' style={{ height: 60 }}>
            {allS === false ?
              <div className='row' >
                {logoS === true ?
                  <div className='col-2 '>
                    <div style={{ height: "7vh", width: "3vw", marginTop: 5, justifyItems: "center", marginLeft: 5 }}>
                      <img alt={""} src={String(uploadedUrl)} width={55} height={50} />

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
                      <img alt={""} src={String(uploadedUrl1)} width={60} height={60} />
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
                <div className='row' style={{ fontFamily: "kanit", fontSize: 15, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{all.ProductName}</div>
                <div className='row' style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{alllabel.indicatorlistS}</div>
                <div className='d-flex mt-1'>
                  <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{alllabel.useS}&nbsp;&nbsp;&nbsp;&nbsp;{alllabel.timeuseS}</div>
                </div>
                <div className='d-flex'>
                  <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 15, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{alllabel.timeS}&nbsp;&nbsp;&nbsp;&nbsp;{alllabel.keepS}</div>
                </div>
                <div className='row  mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 15, width: "19vw" }}>หมายเหตุ:{alllabel.remarkS}</div>
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


    </div>

  )

}



function LabelproductP() {







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
  const [itembalance, setbalance] = useState([])
  const [giftlist, setgiftlist] = useState([])
  const [gifts, setgift] = useState("1")
  //const   itemCode=String(all.filter((s:any)=>s.id===ids).map((s:any)=>s.itemcode))

  //console.log(itemRC)

  const initialValues1 = {
    id: "",
    company: "",
    code: "",
    indicatorlistS: "",
    timeS: "",
    useS: "",
    timeuseS: "",
    keepS: "",
    remarkS: "",
  };

  const [indiS, setindiS] = useState([])
  const [timeS, settimeS] = useState([])
  const [useS, setuseS] = useState([])
  const [timeuseS, settimeuseS] = useState([])
  const [keepS, setkeepS] = useState([])
  const [remarkS, setremarkS] = useState([])


  const [alllabel, setlabel] = useState(initialValues1)


  useEffect(() => {
    const useMyHook = async () => {
      try {

        await LabelData()




      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [ids])

  //Get Label Data
  const LabelData = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apilabeldata}?company=${companyS}&code=${itemcodes}`)
      res.data[0] !== undefined ? setlabel(res.data[0]) : setlabel(initialValues1)
    } catch (error) {
      console.error(error)
    }
  }

  //Get Label Data
  const LabelTran = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const indi = await axios.get(`/api/${apiindicatorlist}?company=${companyS}`)
      const time = await axios.get(`/api/${apitimeL}?company=${companyS}`)
      const use = await axios.get(`/api/${apiuseL}?company=${companyS}`)
      const timeuse = await axios.get(`/api/${apitimeuseL}?company=${companyS}`)
      const keep = await axios.get(`/api/${apikeepL}?company=${companyS}`)
      const remark = await axios.get(`/api/${apiRemarkL}?company=${companyS}`)
      setindiS(indi.data)
      settimeS(time.data)
      setuseS(use.data)
      settimeuseS(timeuse.data)
      setkeepS(keep.data)
      setremarkS(remark.data)

    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {

    const useMyHook = async () => {
      try {
        LabelTran()

      } catch (e) {
        console.error(e);
      }
    }
    useMyHook()
  }, [])





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
    }

  }











  return (

    <form className='form' >
      <div className='row'>



        <div className="col-sm-6 mt-1 " style={{ height: "68vh" }} >



          <div className="row  " style={{ margin: 5 }}>

            <div className="d-flex mt-1 " style={{ alignItems: "center" }}>
              <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>รหัสสินค้า :</div></div>
              <div className="col-2 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit_B", backgroundColor: "white", fontSize: 10 }}> {all.code}</div>

              </div>
              <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>Barcode :</div></div>
              <div className="col-2 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10 }}> {all.Barcode}</div>
              </div>
            </div>

            <div className="d-flex mt-1 " style={{ alignItems: "center" }}>

              <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>ชื่อสินค้า :</div></div>
              <div className="col-8 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit_B", backgroundColor: "white", fontSize: 12, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.ProductName}</div>
              </div>

            </div>

            <div className="d-flex mt-1 " style={{ alignItems: "center" }}>
              <div className="" style={{ width: widths1 }}>
                <div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>ชื่อสามัญ :</div></div>
              <div className="col-4 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.fixname}</div>
              </div>



            </div>


            <div className="d-flex mt-1 " style={{ alignItems: "center" }}>

              <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>กลุ่มสินค้า :</div></div>
              <div className="col-4 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.group}</div>
              </div>



            </div>

            <div className="d-flex mt-1 " style={{ alignItems: "center" }}>

              <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>รายงาน ขย :</div></div>
              <div className="col-2 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.type}{all.subtype == null ? "" : " / "}{all.subtype}</div>
              </div>

              <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 12, fontWeight: "bold" }}>คงเหลือ :</div></div>
              <div className="col-2 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 12, fontWeight: "bold" }}>{itembalance.map((r: any) => r.balance)} &nbsp;&nbsp;{all.Unit}</div>
              </div>

            </div>


            <div className="d-flex mt-1 mb-1" style={{ alignItems: "center" }}>
              <div className="" style={{ width: widths1 }}>
                <div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>หมวด :</div></div>
              <div className="col-2 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.Category}</div>
              </div>


              <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>พื้นที่เก็บ :</div></div>
              <div className="col-2 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.Area}</div>
              </div>


            </div>




            <div className="d-flex mt-1 mb-1" style={{ alignItems: "center" }}>


              <div className="" style={{ width: widths1, fontSize: 10 }}>
                <div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>หน่วย :</div></div>
              <div className="col-2 " style={{ marginLeft: 10 }}>
                <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.Unit}</div>
              </div>


            </div>




          </div>

          <div className='row'>

            {/**ฉลากยา */}
            <SetLabel />


          </div>



        </div>

        <div className='col-sm  m-1 rounded border shadow-sm  ' style={{ height: "75vh" }}>
          <div className='row' style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 12, margin: 3, color: "brown" }}>แปลาภาษา ฉลากสินค้า</div>
          {/**ภาษา พม่า */}
          <div className='row' style={{ fontFamily: "kanit", fontSize: 15, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>ภาษาพม่า</div>
          <div className='row' style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_my)}</div>
          <div className='d-flex mt-1'>
            <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_my)}</div>
            <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_my)}</div>
          </div>
          <div className='d-flex'>
            <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_my)}</div>
            <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_my)}</div>

          </div>
          <div className='row  mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_my)}</div>
          {/**ภาษา ลาว */}
          <div className='mt-1'>

            <div className='row' style={{ fontFamily: "kanit", fontSize: 15, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>ภาษาลาว</div>
            <div className='row' style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_lo)}</div>
            <div className='d-flex mt-1'>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_lo)}</div>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_lo)}</div>
            </div>
            <div className='d-flex'>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_lo)}</div>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_lo)}</div>

            </div>
            <div className='row  mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_lo)}</div>
          </div>
          {/**ภาษา อังกฤษ */}
          <div className='mt-1'>

            <div className='row' style={{ fontFamily: "kanit", fontSize: 15, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>ภาษาอังกฤษ</div>
            <div className='row' style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_eng)}</div>
            <div className='d-flex mt-1'>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_eng)}</div>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_eng)}</div>
            </div>
            <div className='d-flex'>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_eng)}</div>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_eng)}</div>

            </div>
            <div className='row  mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_eng)}</div>
          </div>

          {/**ภาษา จีน */}
          <div className='mt-1'>

            <div className='row' style={{ fontFamily: "kanit", fontSize: 15, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>ภาษาจีน</div>
            <div className='row' style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_zh)}</div>
            <div className='d-flex mt-1'>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_zh)}</div>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_zh)}</div>
            </div>
            <div className='d-flex'>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_zh)}</div>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_zh)}</div>

            </div>
            <div className='row  mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_zh)}</div>
          </div>

          {/**ภาษา กัมพูชา */}
          <div className='mt-1'>

            <div className='row' style={{ fontFamily: "kanit", fontSize: 15, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>ภาษากัมพูชา</div>
            <div className='row' style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_km)}</div>
            <div className='d-flex mt-1'>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_km)}</div>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_km)}</div>
            </div>
            <div className='d-flex'>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "10vw" }}>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_km)}</div>
              <div className='col' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "9vw" }}>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_km)}</div>

            </div>
            <div className='row  mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "19vw" }}>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_km)}</div>
          </div>



        </div>

      </div>



    </form>

  )
}

export default LabelproductP
