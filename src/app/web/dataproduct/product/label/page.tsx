
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
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
    <div className={styles.drugLabelCard} style={{ marginTop: 10, border: '1px solid #e9d5ff', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{
        background: '#faf5ff',
        padding: '8px 16px',
        borderBottom: '1px solid #f3e8ff',
        borderLeft: '4px solid #a855f7',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'Kanit_B',
        fontSize: '14px',
        color: '#1e293b'
      }}>
        <span>🏷️ ตัวอย่างฉลากสินค้า</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 'normal', color: '#7c3aed' }}>วันที่ 26/09/2025</span>
      </div>
      <div className={styles.drugLabelCardBody}>
        {/* Store Header */}
        {allS === false && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: '2px solid #333' }}>
            {logoS === true && uploadedUrl && (
              <img alt="" src={String(uploadedUrl)} width={45} height={40} style={{ borderRadius: 4 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#333' }}>{storeS}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#666' }}>{addressS} โทร: {telS}</div>
            </div>
            {lineS === true && uploadedUrl1 && (
              <div style={{ textAlign: 'center' }}>
                <img alt="" src={String(uploadedUrl1)} width={40} height={40} style={{ borderRadius: 4 }} />
                <div style={{ fontFamily: 'Kanit', fontSize: 7, color: '#666' }}>Line ร้านค้า</div>
              </div>
            )}
          </div>
        )}

        {/* Customer Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666' }}>ลูกค้าทั่วไป</span>
        </div>

        {/* Drug Label Content */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#333', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{all.ProductName}</div>
            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#2A6AAA', marginBottom: 4 }}>{alllabel.indicatorlistS}</div>
            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', marginBottom: 2 }}>
              {alllabel.useS}&nbsp;&nbsp;&nbsp;&nbsp;{alllabel.timeuseS}
            </div>
            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', marginBottom: 2 }}>
              {alllabel.timeS}&nbsp;&nbsp;&nbsp;&nbsp;{alllabel.keepS}
            </div>
            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', marginBottom: 2 }}>หมายเหตุ: {alllabel.remarkS}</div>
            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#999' }}>ชื่อเภสัชกร.............</div>
          </div>

          {/* QR Code */}
          <div style={{ textAlign: 'center', minWidth: 60 }}>
            <QRCode
              size={256}
              style={{ height: 'auto', maxWidth: 50, width: 50 }}
              value={"duis"}
              viewBox={`0 0 256 256`}
            />
            <div style={{ fontFamily: 'Kanit', fontSize: 8, color: '#666', marginTop: 2 }}>QR สินค้า</div>
          </div>
        </div>
      </div>
    </div>
  )

}



function Labelproduct() {







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
    <form className='form'>
      <div className={styles.productFormContainer}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr', gap: '12px' }}>

          {/* Left Column - Product Info & Label Preview */}
          <div>
            {/* Product Info Card */}
            <div className={styles.productInfoCard} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: 12 }}>
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
                {/* Code & Barcode Row */}
                <div className={styles.productFormRow}>
                  <label className={styles.productFormLabel}>รหัสสินค้า :</label>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: 11, color: '#333', minWidth: 60 }}>{all.code}</div>
                  <label className={styles.productFormLabelSm}>Barcode :</label>
                  <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#666' }}>{all.Barcode}</div>
                </div>

                {/* Product Name */}
                <div className={styles.productFormRow}>
                  <label className={styles.productFormLabel}>ชื่อสินค้า :</label>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{all.ProductName}</div>
                </div>

                {/* Generic Name */}
                <div className={styles.productFormRow}>
                  <label className={styles.productFormLabel}>ชื่อสามัญ :</label>
                  <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{all.fixname}</div>
                </div>

                {/* Drug Group */}
                <div className={styles.productFormRow}>
                  <label className={styles.productFormLabel}>กลุ่มสินค้า :</label>
                  <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666' }}>{all.group}</div>
                </div>

                {/* Report Type & Balance */}
                <div className={styles.productFormRow}>
                  <label className={styles.productFormLabel}>รายงาน ขย :</label>
                  <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', minWidth: 80 }}>{all.type}{all.subtype == null ? "" : " / "}{all.subtype}</div>
                  <label className={styles.productFormLabelSm} style={{ fontWeight: 'bold', color: '#2A6AAA' }}>คงเหลือ :</label>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#2A6AAA' }}>{itembalance.map((r: any) => r.balance)} {all.Unit}</div>
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

            {/* Label Preview */}
            <SetLabel />
          </div>

          {/* Right Column - Language Translations */}
          <div className={styles.pricingCard} style={{ height: 'fit-content', border: '1px solid #ffe4e6', borderRadius: '12px', overflow: 'hidden' }}>
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
              <span style={{ fontSize: '18px' }}>🌐</span> แปลภาษา ฉลากสินค้า
            </div>
            <div className={styles.pricingCardBody} style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {/* Myanmar Language */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🇲🇲</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#333' }}>ภาษาพม่า</span>
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', lineHeight: 1.4, paddingLeft: 20 }}>
                  <div>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_my)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_my)}</span>
                    <span>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_my)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_my)}</span>
                    <span>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_my)}</span>
                  </div>
                  <div>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_my)}</div>
                </div>
              </div>

              {/* Lao Language */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🇱🇦</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#333' }}>ภาษาลาว</span>
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', lineHeight: 1.4, paddingLeft: 20 }}>
                  <div>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_lo)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_lo)}</span>
                    <span>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_lo)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_lo)}</span>
                    <span>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_lo)}</span>
                  </div>
                  <div>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_lo)}</div>
                </div>
              </div>

              {/* English Language */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🇬🇧</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#333' }}>ภาษาอังกฤษ</span>
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', lineHeight: 1.4, paddingLeft: 20 }}>
                  <div>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_eng)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_eng)}</span>
                    <span>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_eng)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_eng)}</span>
                    <span>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_eng)}</span>
                  </div>
                  <div>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_eng)}</div>
                </div>
              </div>

              {/* Chinese Language */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🇨🇳</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#333' }}>ภาษาจีน</span>
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', lineHeight: 1.4, paddingLeft: 20 }}>
                  <div>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_zh)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_zh)}</span>
                    <span>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_zh)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_zh)}</span>
                    <span>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_zh)}</span>
                  </div>
                  <div>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_zh)}</div>
                </div>
              </div>

              {/* Cambodian Language */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🇰🇭</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#333' }}>ภาษากัมพูชา</span>
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#666', lineHeight: 1.4, paddingLeft: 20 }}>
                  <div>{indiS.filter((a: any) => a.list === alllabel.indicatorlistS).map((d: any) => d.list_km)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{useS.filter((a: any) => a.list === alllabel.useS).map((d: any) => d.list_km)}</span>
                    <span>{timeuseS.filter((a: any) => a.list === alllabel.timeuseS).map((d: any) => d.list_km)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span>{timeS.filter((a: any) => a.list === alllabel.timeS).map((d: any) => d.list_km)}</span>
                    <span>{keepS.filter((a: any) => a.list === alllabel.keepS).map((d: any) => d.list_km)}</span>
                  </div>
                  <div>{remarkS.filter((a: any) => a.list === alllabel.remarkS).map((d: any) => d.list_km)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form >
  )
}

export default Labelproduct
