
'use client'
import styles from "../../componant/mystyle.module.css";
import React, { useEffect, useState, ChangeEvent, KeyboardEvent, use, useRef } from 'react'

import Image from "next/image";
import axios from 'axios'
import {
  getPrinters as getPlatformPrinters,
  isSilentPrintAvailable,
  printSilent,
} from "@/lib/runtime/print";
import { usePermission } from '@/utils/usePermission'
import { Table } from 'react-bootstrap';
import Toast from 'react-bootstrap/Toast';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
const widths = 70;
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  RadioGroup, Radio
} from "@heroui/react";
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
import { Label } from "@/components/ui/label"
import { ifError } from "assert";
import { ta } from "date-fns/locale";
import Modal1 from 'react-bootstrap/Modal';
import Button1 from 'react-bootstrap/Button';
import Modal_rw from 'react-bootstrap/Modal';
import Button_rw from 'react-bootstrap/Button';
import Modal_dc from 'react-bootstrap/Modal';
import Button_dc from 'react-bootstrap/Button';
import Modal_rc from 'react-bootstrap/Modal';
import Button_rc from 'react-bootstrap/Button';
import Modal_fill from 'react-bootstrap/Modal';
import Button_full from 'react-bootstrap/Button';
import Modal_qa from 'react-bootstrap/Modal';
import QRCode from "react-qr-code";

import SpinnerIcon from '../../componant/spinnerIcon';
import LoadingOverlay from '../../componant/LoadingOverlay';

import DatePicker from "react-datepicker";
import { Toaster, toast } from "sonner"
import "react-datepicker/dist/react-datepicker.css";

// Tittle
const getsalehistory = "salehistory"

const apis = "receive"
const apidatalist = "datalist"
const apidataitemlist = "dataitemlist"
const apicustomer = "customer"
const apibalance = "sale_cal/sale_balance"

// Label
const apiindicatorlist = "label/indicatorlist"
const apitimes = "label/times"
const apitimeL = "label/timeL"
const apiuseL = "label/useL"
const apitimeuseL = "label/timeuseL"
const apikeepL = "label/keepL"
const apiRemarkL = "label/remarkL"

// Setting
const getemployee = "setting/employee"
const getpoint = "setting/point"
const getlabel = "setting/label"
const getstore = "setting/store/store"
const getpayment = "setting/payment"

const apipromotion = "promotion"

const apilabeldata = "label/labeldata"
const apilabeldata_all = "label/labeldata_all"

const apiquatation = "quatation"

const getdrugg = "drugallergy"

const getInteraction = "interaction"

const apigiftlist = "gift/giftlist"

import deletes from "../../../icon/cancel.jpg"
import LabelPage from "../../dataproduct/label/page";
import { useReactToPrint } from "react-to-print";
import ReactDOMServer from 'react-dom/server';

import { useMessageStore } from "./useMessageStore";




/*********************************************** */
function BodyTabSalemS(idDatalist: any) {



  //  const idsale=useMessageStore((state) => state.idsale)
  const idF = Number(idDatalist.data1)
  //console.log(idF)






  //ส่งค่ากลับ
  const setMessage = useMessageStore((state) => state.setMessage);
  const setsavehis = useMessageStore((state) => state.setsavehis);
  const savehis = useMessageStore((state) => state.savehis)

  //รับค่า
  const savemu = useMessageStore((state) => state.savemu)

  const [dataProduct, setdataProduct] = useState([])
  const [dataRCFull, setdataItemRCFull] = useState([])
  const [dateitemRC, setdateitemRC] = useState([])

  const initialValues7 = {
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

  const [alllabel, setlabel] = useState([])
  const [alllabelitem, setlabelitem] = useState(initialValues7)
  /**Todat List */
  const [list, setList] = useState<Task[]>([]);
  const [list_rc, setList_rc] = useState<Task_rc[]>([]);

  // Translation
  const [indi, setindi] = useState([])
  const [timeL, settimeL] = useState([])
  const [useL, setuseL] = useState([])
  const [timeuseL, settimeuseL] = useState([])
  const [keepL, setkeepL] = useState([])
  const [RemarkL, setRemarkL] = useState([])

  // Setting Employee
  const [postsEmp, setPostsEmp] = useState([])

  // Setting Interaction
  const [interaction, setInertaction] = useState([])

  // Setting Label
  /***************************************************** */
  const [idS, SetId] = useState("")
  const [compa, Setcompany] = useState("")
  const [storeS, SetStore] = useState("")
  const [addressS, SetAddress] = useState("")
  const [telS, SetTel] = useState("")
  const [taxS, SetTax] = useState("")
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedUrl1, setUploadedUrl1] = useState<string | null>(null);
  const [allS, Setall] = useState(false)
  const [logoS, Setlogo] = useState(true);
  const [lineS, Setline] = useState(true)

  // Setting Reward
  const [SaleS, SetSaleInput] = useState("")
  const [pointeqS, SetPoint] = useState("")
  const [pointsetS, SetPointSet] = useState("")
  const [discountS, SetDiscount] = useState("")
  const [statusS, SetStatus] = useState("")

  // ค่าหยิบ      
  const [giftlist, setgiftlist] = useState([])


  const [companyS, setcom] = useState("")
  const [paystore, Setpaystore] = useState("")
  useEffect(() => {

    if (typeof window !== 'undefined') {
      localStorage.setItem("countrow", "หน้าร้าน")
    }

    let companyS = "";
    if (typeof window !== 'undefined') {
      setcom(localStorage.getItem("company_") || "")

    }

    setTimeout(() => {
      Setpaystore(localStorage.getItem("countrow") || "")
    }, 500);



  }, [])
  const [promotionfullS, SetPromotionfull] = useState<PromotionS[]>([])

  interface PromotionS {
    id: number,
    name_promotion: string,
    customer: string,
    conditionid: number,
    condition: string,
    startdate: string,
    enddate: string,
    unit: string,
    pay_condition: number,
    discount: number,
    status: string,
    msg_condition: string,
    msg_discount: string,
    cal: number

  }
  // console.log([...promotionfullS])
  //*************************** */
  useEffect(() => {

    const fetchPosts = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${apidatalist}?company=${companyS}`)
        setdataProduct(res.data)
        // console.log(res.data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchPosts()


    const fetchItemRC = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${apidataitemlist}?company=${companyS}`)
        setdataItemRCFull(res.data)
        // console.log(res.data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchItemRC()

    //Get Label Data
    const LabelData = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${apilabeldata_all}?company=${companyS} `)
        setlabel(res.data)

      } catch (error) {
        console.error(error)
      }

    }
    LabelData()

    //Get Label Data    Translator
    const LabelLangage = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const indicator = await axios.get(`/api/${apiindicatorlist}?company=${companyS}`)
        const timeL = await axios.get(`/api/${apitimeL}?company=${companyS}`)
        const useL = await axios.get(`/api/${apiuseL}?company=${companyS}`)
        const timeuseL = await axios.get(`/api/${apitimeuseL}?company=${companyS}`)
        const keepL = await axios.get(`/api/${apikeepL}?company=${companyS}`)
        const RemarkL = await axios.get(`/api/${apiRemarkL}?company=${companyS}`)

        setindi(indicator.data)
        settimeL(timeL.data)
        setuseL(useL.data)
        settimeuseL(timeuseL.data)
        setkeepL(keepL.data)
        setRemarkL(RemarkL.data)
        //  console.log(useL.data)
      } catch (error) {
        console.error(error)
      }

    }
    LabelLangage()


    // Get Setting Employee          
    const GetEmployee = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${getemployee}?company=${companyS}`)  //Get_Employee
        setPostsEmp(res.data)
      } catch (error) {
        console.error(error)
      }

    }
    GetEmployee()

    // Get GetInertaction        
    const GetInertaction = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${getInteraction}?company=${companyS}`)  //Get_Employee
        setInertaction(res.data)
      } catch (error) {
        console.error(error)
      }

    }
    GetInertaction()


    //******************Get Stting************************************ */
    const fetchPostStore = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        //ร้านค้า
        const res = await axios.get(`/api/${getstore}?company=${companyS}`)  //Get_Employee
        res.data[0] == undefined ? "" : SetId(res.data[0].id)
        res.data[0] == undefined ? "" : Setcompany(res.data[0].company)
        res.data[0] == undefined ? "" : SetStore(res.data[0].namestore)
        res.data[0] == undefined ? "" : SetAddress(res.data[0].address)
        res.data[0] == undefined ? "" : SetTel(res.data[0].tel)
        res.data[0] == undefined ? "" : SetTax(res.data[0].taxnumber)
        res.data[0] == undefined ? "" : setUploadedUrl(res.data[0].publiclogo)
        res.data[0] == undefined ? "" : setUploadedUrl1(res.data[0].publicline)
        //ฉลากยา
        const res1 = await axios.get(`/api/${getlabel}?company=${companyS}`)
        res1.data[0] == undefined ? "" : Setall(res1.data[0].all === "true" ? true : false)
        res1.data[0] == undefined ? "" : Setlogo(res1.data[0].logo === "true" ? true : false)
        res1.data[0] == undefined ? "" : Setline(res1.data[0].line === "true" ? true : false)
        //แต้มสะสม  
        const res2 = await axios.get(`/api/${getpoint}?company=${companyS}`)
        res2.data[0] == undefined ? "" : SetSaleInput(res2.data[0].sale)
        res2.data[0] == undefined ? "" : SetPoint(res2.data[0].pointeq)
        res2.data[0] == undefined ? "" : SetPointSet(res2.data[0].pointset)
        res2.data[0] == undefined ? "" : SetDiscount(res2.data[0].discount)
        res2.data[0] == undefined ? "" : SetStatus(res2.data[0].status)

        const res3 = await axios.get(`/api/${apipromotion}?company=${companyS}`)
        await res3.data[0] == undefined ? "" : SetPromotionfull(res3.data)

      } catch (error) {
        console.error(error)
      }

    }
    fetchPostStore()

    /** ค่าหยิบ************************************** */
    const fetchGet_Giftlist = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${apigiftlist}?company=${companyS}`)

        setgiftlist(res.data)

      } catch (error) {
        console.error(error)
      }
    }
    fetchGet_Giftlist()


    localStorage.setItem("his", JSON.stringify([{
      followup: String(""),
      solution: String(""),
      id_history: "",
      count: String(""),
      statusH: "",
      duedate: new Date(),
      person: ""
    }]))


    localStorage.setItem("dg", JSON.stringify([]))



  }, [])

  //*****Printer****************** */
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter_label, setSelectedPrinter_label] = useState<string>("");
  const [selectedPrinter_rc, setSelectedPrinter_rc] = useState<string>("");
  const [selectedPrinter_a4, setSelectedPrinter_a4] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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





  //************************************************************** */

  //  const [dateRC, setdateRC] = useState([])
  // Function to delete item from list using id to delete
  const deleteItem = (id: any) => {
    const updatedList = list.filter((item) => item.id !== id);
    setList(updatedList);
  };
  const deleteall = () => {

    setList([]);
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem("listS", JSON.stringify(list))
  }







  const [priceAct, setEditedpriceAct] = useState<string>("");
  const [priceDis, setEditedpriceDis] = useState<string>("");
  const [editedTaskText, setEditedTaskText] = useState<string>("");
  const [editedTaskText1, setEditedTaskText1] = useState<string>("");
  const [editedcode, setEditedcode] = useState<string>("");
  const [editedTaskname, setEditedname] = useState<string>("");
  const [costS, setcostS] = useState("")

  const [receivebaht, setreceivebaht] = useState<string>("");
  const [netbaht, setnetbaht] = useState<string>("");

  interface Task {

    id: number,
    company: string,
    id_product: number,
    code_product: string,
    name_product: string,
    fixname: string,
    cetagory: string,
    unit: string,
    barcode: string,
    qty: number,
    cost: Number,
    costtotal: Number,
    price: number,
    discount: number,
    gift: number,
    totalgift: number,
    diff: number,
    total: number,
    id_receive1: number,
    lot_receive1: string,
    qty_lot1: number,
    std_qty_lot1: number,
    sale_qty_lot1: number,
    id_receive2: number,
    lot_receive2: string,
    qty_lot2: number,
    std_qty_lot2: number,
    sale_qty_lot2: number,
    id_receive3: number,
    lot_receive3: string,
    qty_lot3: number,
    std_qty_lot3: number,
    sale_qty_lot3: number,
    person: string,
    statuss: string,
    label: boolean,
    indicatorlistS: string,
    timeS: string,
    useS: string,
    timeuseS: string,
    keepS: string,
    remarkS: string,
    my_indicatorlistS: string,
    my_timeS: string,
    my_useS: string,
    my_timeuseS: string,
    my_keepS: string,
    my_remarkS: string,
    lo_indicatorlistS: string,
    lo_timeS: string,
    lo_useS: string,
    lo_timeuseS: string,
    lo_keepS: string,
    lo_remarkS: string,
    en_indicatorlistS: string,
    en_timeS: string,
    en_useS: string,
    en_timeuseS: string,
    en_keepS: string,
    en_remarkS: string,
    zh_indicatorlistS: string,
    zh_timeS: string,
    zh_useS: string,
    zh_timeuseS: string,
    zh_keepS: string,
    zh_remarkS: string,
    pic: string,
    balance: number


  }


  interface Task_rc {

    id: number,
    sale: number,
    balance: number
  }


  let qty_e = Number(list.filter((supplier: any) => supplier.id_product === idF).map((supplier: any) => supplier.id_product))
  let qty_A = Number(list.filter((supplier: any) => supplier.id_product === idF).map((supplier: any) => supplier.qty))
  const id_product_e = Number(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.id))
  const code_product_e = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.code))
  const name_product_e = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.ProductName))
  const fixname_e = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.fixname))
  const barcode_e = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.Barcode))
  const Category_e = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.Category))
  const unit_e = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.Unit))
  const cost_e = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.CostActual))
  const pic_e = String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.pic))
  const price_e = paystore === "หน้าร้าน" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.price)) :
    paystore === "ขายส่ง" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.wholesaleprice)) :
      paystore === "สมาชิก" ? (Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.online)) > 0 ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.online)) : Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.price))) :
        paystore === "ราคา A" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.PriceA)) :
          paystore === "ราคา B" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.PriceB)) :
            paystore === "ราคา C" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.PriceC)) :
              paystore === "ราคา D" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.PriceD)) :
                paystore === "ราคา E" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.PriceE)) :
                  paystore === "ราคา F" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.PriceF)) :
                    paystore === "ราคา G" ? Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.PriceG)) :
                      Number(dataProduct.filter((supplier: any) => supplier.id === idF)?.map((supplier: any) => supplier.PriceH))

  //  ฉลากยา ไทย
  let code_Prod = code_product_e
  const label_inticator = alllabel.filter((s: any) => s.code === String(code_Prod)).map((supplier: any) => supplier.indicatorlistS)
  const label_timeS = alllabel.filter((s: any) => s.code === String(code_Prod)).map((supplier: any) => supplier.timeS)
  const label_useS = alllabel.filter((s: any) => s.code === String(code_Prod)).map((supplier: any) => supplier.useS)
  const label_timeuseS = alllabel.filter((s: any) => s.code === String(code_Prod)).map((supplier: any) => supplier.timeuseS)
  const label_keepS = alllabel.filter((s: any) => s.code === String(code_Prod)).map((supplier: any) => supplier.keepS)
  const label_remarkS = alllabel.filter((s: any) => s.code === String(code_Prod)).map((supplier: any) => supplier.remarkS)

  let my_indi = label_inticator
  let my_timeS = label_timeS
  let my_useS = label_useS
  let my_timeuseS = label_timeuseS
  let my_keepS = label_keepS
  let my_remarkS = label_remarkS



  //  ฉลากยา inticator
  const my_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_my)
  const lo_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_lo)
  const en_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_eng)
  const zh_label_inticator = indi.filter((i: any) => i.list === String(my_indi)).map((c: any) => c.list_zh)

  //  ฉลากยา timeL
  const my_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_my)
  const lo_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_lo)
  const en_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_eng)
  const zh_label_timeS = timeL.filter((i: any) => i.list === String(my_timeS)).map((c: any) => c.list_zh)

  //  ฉลากยา useS
  const my_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_my)
  const lo_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_lo)
  const en_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_eng)
  const zh_label_useS = useL.filter((i: any) => i.fullname === String(my_useS)).map((c: any) => c.list_zh)

  //  ฉลากยา timeuseS  
  const my_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_my)
  const lo_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_lo)
  const en_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_eng)
  const zh_label_timeuseS = timeuseL.filter((i: any) => i.list === String(my_timeuseS)).map((c: any) => c.list_zh)

  //  ฉลากยา keepS 
  const my_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_my)
  const lo_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_lo)
  const en_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_eng)
  const zh_label_keepS = keepL.filter((i: any) => i.list === String(my_keepS)).map((c: any) => c.list_zh)

  //  ฉลากยา remarkS   
  const my_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_my)
  const lo_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_lo)
  const en_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_eng)
  const zh_label_remarkS = RemarkL.filter((i: any) => i.list === String(my_remarkS)).map((c: any) => c.list_zh)

  // ค่าหยิบ
  const gift_p = Number(giftlist.filter((s: any) => s.code_product === String(code_Prod)).map((supplier: any) => supplier.gift)[0])


  const lot_id = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.code)) && (r.balance == null || r.qty > r.sale))]][0][0]
    .map((lots: any) => lots.id)

  const cost = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.code)) && (r.balance == null || r.qty > r.sale))]][0][0]
    .map((lots: any) => lots.newCost)


  const lot_RC = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.code)) && (r.balance == null || r.qty > r.sale))]][0][0]
    .map((lots: any) => lots.lot)

  const lot_qty = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.code)) && (r.balance == null || r.qty > r.sale))]][0][0]
    .map((lots: any) => lots.qty)

  const lot_sale = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === String(dataProduct.filter((supplier: any) => supplier.id === idF).map((supplier: any) => supplier.code)) && (r.balance == null || r.qty > r.sale))]][0][0]
    .map((lots: any) => lots.sale)



  //******************************************************************************************* */
  const lot_id_T = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === editedcode && (r.balance == null || r.qty > r.sale)).map((supplier: any) => supplier.id)]][0][0]


  const lot_RC_T = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === editedcode && (r.balance == null || r.qty > r.sale)).map((supplier: any) => supplier.lot)]][0][0]


  const lot_qty_T = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === editedcode && (r.balance == null || r.qty > r.sale)).map((supplier: any) => supplier.qty)]][0][0]

  const lot_sale_T = [[dataRCFull
    .sort((a: any, b: any) => a.dateExp.localeCompare(b.dateExp) && a.createDate.localeCompare(b.createDate))
    .filter((r: any) => r.itemcode === editedcode && (r.balance == null || r.qty > r.sale)).map((supplier: any) => supplier.sale)]][0][0]


  const act_lot0 = Number(list.filter((supplier: any) => supplier.id_product === idF).map((supplier: any) => supplier.qty)[0])

  //console.log(list)

  //*******Cut Lot ************************* */
  const cut_lot = () => {

    return (
      setList(list.map((task) => task.id_product === idF ?
        {
          ...task,

          qty: Number(task.qty) + 1,
          discount: Number(task.discount),
          total: (Number(task.qty + 1) * (Number(task.diff))),
          cost: (Number(task.cost)),
          gift: Number(task.gift),
          totalgift: (Number(task.qty) + 1) * Number(task.gift),
          costtotal: (Number(task.qty) + 1) * Number(task.cost),
          sale_qty_lot1: act_lot0 + 1 > Number(lot_qty[0]) - Number(lot_sale[0]) ?
            Number(lot_qty[0]) :
            act_lot0 + 1 + Number(lot_sale[0]),

          sale_qty_lot2: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) > Number(lot_qty[1]) - Number(lot_sale[1]) ?
            Number(lot_qty[1]) :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) < 0 ? 0 :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])) === true ? 0 :
                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])
          ,

          sale_qty_lot3: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) > Number(lot_qty[2]) - Number(lot_sale[2]) ?
            Number(lot_qty[2]) :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) < 0 ? 0 :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])) === true ? 0 :
                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])
          ,

          qty_lot1: act_lot0 + 1 > (Number(lot_qty[0]) - Number(lot_sale[0])) ?
            Number(lot_qty[0]) - Number(lot_sale[0]) :
            act_lot0 + 1,

          qty_lot2: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) > Number(lot_qty[1]) - Number(lot_sale[1]) ?
            Number(lot_qty[1]) - Number(lot_sale[1]) :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) < 0 ?
              0 :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])) === true ? 0 :
                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])
          ,

          qty_lot3: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) > Number(lot_qty[2]) - Number(lot_sale[2]) ?
            Number(lot_qty[2]) - Number(lot_sale[2]) :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) < 0 ? 0 :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])) === true ? 0 :
                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])
          ,

          lot_receive2: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) > Number(lot_qty[1]) ?
            lot_RC[1] :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1]) < 0 ? "" :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])) === true ? "" :

                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) + Number(lot_sale[1])
                  === 0 ? "" : lot_RC[1],

          lot_receive3: act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) > Number(lot_qty[2]) ?
            lot_RC[1] :
            act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2]) < 0 ? "" :
              isNaN(act_lot0 + 1 - Number(lot_qty[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])) === true ? "" :

                act_lot0 + 1 - Number(lot_qty[0]) + Number(lot_sale[0]) - Number(lot_qty[1]) + Number(lot_sale[1]) + Number(lot_sale[2])
                  === 0 ? "" : lot_RC[2],
        }

        :


        { ...task, qty: Number(task.qty), total: Number(task.qty) * Number(task.price) }
      )))
  }
  //  Qty Manual    
  const cut_lot_Price_manual = () => {

    return (
      setList(list.map((task) => task.code_product === editedcode ?
        {
          ...task,

          qty: Number(editedTaskText),
          total: Number(editedTaskText) * (Number(task.diff)),
          cost: Number(task.cost),
          costtotal: Number(editedTaskText) * Number(task.cost),
          gift: Number(task.gift),
          totalgift: Number(editedTaskText) * Number(task.gift),
          sale_qty_lot1: Number(editedTaskText) > Number(lot_qty_T[0]) - Number(lot_sale_T[0]) ?
            Number(lot_qty_T[0]) :
            Number(editedTaskText) + Number(lot_sale_T[0]),

          sale_qty_lot2: Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) > Number(lot_qty_T[1]) - Number(lot_sale_T[1]) ?
            Number(lot_qty_T[1]) :
            Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) < 0 ? 0 :
              isNaN(Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])) === true ? 0 :
                Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])
          ,

          sale_qty_lot3: Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) > Number(lot_qty_T[2]) - Number(lot_sale_T[2]) ?
            Number(lot_qty_T[2]) :
            Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) < 0 ? 0 :
              isNaN(Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])) === true ? 0 :
                Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])
          ,

          qty_lot1: Number(editedTaskText) > (Number(lot_qty_T[0]) - Number(lot_sale_T[0])) ?
            Number(lot_qty_T[0]) - Number(lot_sale_T[0]) :
            Number(editedTaskText),

          qty_lot2: Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) > Number(lot_qty_T[1]) - Number(lot_sale_T[1]) ?
            Number(lot_qty_T[1]) - Number(lot_sale_T[1]) :
            Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) < 0 ?
              0 :
              isNaN(Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])) === true ? 0 :
                Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])
          ,

          qty_lot3: Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) > Number(lot_qty_T[2]) - Number(lot_sale_T[2]) ?
            Number(lot_qty_T[2]) - Number(lot_sale_T[2]) :
            Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) < 0 ? 0 :
              isNaN(Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])) === true ? 0 :
                Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])
          ,

          lot_receive2: Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) > Number(lot_qty_T[1]) ?
            lot_RC_T[1] :
            Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1]) < 0 ? "" :
              isNaN(Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])) === true ? "" :

                Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) + Number(lot_sale_T[1])
                  === 0 ? "" : lot_RC_T[1],

          lot_receive3: Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) > Number(lot_qty_T[2]) ?
            lot_RC_T[1] :
            Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2]) < 0 ? "" :
              isNaN(Number(editedTaskText) - Number(lot_qty_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])) === true ? "" :

                Number(editedTaskText) - Number(lot_qty_T[0]) + Number(lot_sale_T[0]) - Number(lot_qty_T[1]) + Number(lot_sale_T[1]) + Number(lot_sale_T[2])
                  === 0 ? "" : lot_RC_T[2],
        }

        : task
      )))
  }
  // Discount
  const cut_lot_Discount_manual = () => {

    return (
      setList(list.map((task) => task.code_product === editedcode ?
        {
          ...task,

          discount: Number(priceDis),
          diff: (Number(task.price) - Number(priceDis)),
          total: Number(task.qty) * (Number(task.price) - Number(priceDis)),
        }

        : task
      )))
  }









  useEffect(() => {

    const fetchPosts = async () => {
      //    console.log(alllabel)

      try {


        //*****List ****** */
        {
          idF === 0 ?
            await setList([...list])
            :
            idF === qty_e ?
              cut_lot()

              :
              await setList([...list, {

                id: idF,
                company: (localStorage.getItem("company_") || ""),
                id_product: id_product_e,
                code_product: code_product_e,
                name_product: name_product_e,
                fixname: fixname_e,
                cetagory: Category_e,
                unit: unit_e,
                barcode: barcode_e,
                qty: 1,
                price: price_e,
                gift: gift_p,
                totalgift: gift_p,
                cost: Number(cost) === 0 || isNaN(Number(cost)) === true ? Number(cost_e) : Number(cost),
                costtotal: Number(cost) === 0 || isNaN(Number(cost)) === true ? Number(cost_e) : Number(cost),
                discount: 0,
                diff: price_e,
                total: price_e,
                id_receive1: lot_id[0] === undefined ? 0 : Number(lot_id[0]),
                lot_receive1: lot_RC[0] === undefined ? "" : lot_RC[0],
                qty_lot1: 1,
                std_qty_lot1: lot_qty[0] === undefined ? 0 : Number(lot_qty[0]),
                sale_qty_lot1: 1 + Number(lot_sale[0]),
                id_receive2: lot_id[1] === undefined ? 0 : Number(lot_id[1]),
                lot_receive2: isNaN(lot_RC[1]) === true ? "" : "",
                qty_lot2: isNaN(lot_qty[1]) === true ? 0 : 0,
                std_qty_lot2: lot_qty[1] === undefined ? 0 : Number(lot_qty[1]),
                sale_qty_lot2: isNaN(lot_sale[1]) === true ? 0 : 0 + Number(lot_sale[1]),
                id_receive3: lot_id[2] === undefined ? 0 : Number(lot_id[2]),
                lot_receive3: isNaN(lot_RC[2]) === true ? "" : "",
                qty_lot3: isNaN(lot_qty[2]) === true ? 0 : 0,
                std_qty_lot3: lot_qty[2] === undefined ? 0 : Number(lot_qty[2]),
                sale_qty_lot3: isNaN(lot_sale[2]) === true ? 0 : 0 + Number(lot_sale[2]),
                person: "",
                statuss: "OK",
                label: true,
                indicatorlistS: String(label_inticator),
                timeS: String(label_timeS),
                useS: String(label_useS),
                timeuseS: String(label_timeuseS),
                keepS: String(label_keepS),
                remarkS: String(label_remarkS),
                my_indicatorlistS: String(my_label_inticator),
                my_timeS: String(my_label_timeS),
                my_useS: String(my_label_useS),
                my_timeuseS: String(my_label_timeuseS),
                my_keepS: String(my_label_keepS),
                my_remarkS: String(my_label_remarkS),
                lo_indicatorlistS: String(lo_label_inticator),
                lo_timeS: String(lo_label_timeS),
                lo_useS: String(lo_label_useS),
                lo_timeuseS: String(lo_label_timeuseS),
                lo_keepS: String(lo_label_keepS),
                lo_remarkS: String(lo_label_remarkS),
                en_indicatorlistS: String(en_label_inticator),
                en_timeS: String(en_label_timeS),
                en_useS: String(en_label_useS),
                en_timeuseS: String(en_label_timeuseS),
                en_keepS: String(en_label_keepS),
                en_remarkS: String(en_label_remarkS),
                zh_indicatorlistS: String(zh_label_inticator),
                zh_timeS: String(zh_label_timeS),
                zh_useS: String(zh_label_useS),
                zh_timeuseS: String(zh_label_timeuseS),
                zh_keepS: String(zh_label_keepS),
                zh_remarkS: String(zh_label_remarkS),
                pic: pic_e,
                balance: Number(lot_qty.reduce((a: number, b: number) => a + b, 0)) - Number(lot_sale.reduce((a: number, b: number) => a + b, 0))
              }

              ])
        }




      } catch (error) {
        console.error(error)
      }
    }

    fetchPosts()
    localStorage.setItem("itemlist", String(list.length))






  }, [idF])

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const modal1 = useDisclosure()
  const modal2 = useDisclosure()



  // Get Item*******************************************************************************
  const [dataitem, setdataitem] = useState([])
  const [codeproductS, setcodeproductS] = useState('')


  useEffect(() => {

    const useMyHook = async () => {
      try {
        DetailItem()
        DetailItemRC()
        fetchGet_Balance()
        LabelData()
      } catch (e) {
        console.error(e);
      }
    }

    useMyHook()
  }, [Number(codeproductS)])

  const DetailItem = async () => {
    let companyS = (localStorage.getItem("company_") || "")

    try {
      const res = await axios.get(`/api/${apidatalist}?company=${companyS}&code=${codeproductS}`)

      setdataitem(res.data)


    } catch (error) {
      console.error(error)
    }
  }

  const DetailItemRC = async () => {
    let companyS = (localStorage.getItem("company_") || "")

    try {
      const resitemRC = await axios.get(`/api/${apidataitemlist}?company=${companyS}&itemcode=${codeproductS}`)
      // const resRC = await axios.get(`/api/${apis}?company=${companyS}`)
      setdateitemRC(resitemRC.data)
      //  setdateRC(resRC.data)
      // console.log(resitemRC.data)
    } catch (error) {
      console.error(error)
    }
  }

  //Get Label Data
  const LabelData = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apilabeldata}?company=${companyS}&code=${codeproductS}`)
      res.data[0] !== undefined ? setlabelitem(res.data[0]) : setlabelitem(initialValues7)

    } catch (error) {
      console.error(error)
    }




  }

  //******************Get Costomer ************************************************* */



  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);
  const [searchname, setPosts] = useState([])

  const initialValues4 = {
    names: "",
    totalPoint: "",
    id_main: "",
    id_costomer: "",
    code_costomer: "",
    name_customer: "",
    group_price: "",
    promotion: "",
    pay: "",
    bill: "",
    total: "",
    discount: "",
    sumtotal: "",
    addreward: "",
    usereward: "",
    receivebaht: "",
    person: "",
    statuss: "",
    taxnumber: "",

    qt_date: "",
    qt_enddate: "",
    qt_credit: "",
    qt_number: "",
    qt_orderNo: "",
    qt_status: "",
    qt_person: "",
    qt_remark: "",

    bl_date: "",
    bl_enddate: "",
    bl_credit: "",
    bl_number: "",
    bl_orderNo: "",
    bl_status: "",
    bl_person: "",
    bl_remark: "",

    inv_date: "",
    inv_enddate: "",
    inv_credit: "",
    inv_number: "",
    inv_orderNo: "",
    inv_status: "",
    inv_person: "",
    inv_remark: "",

    re_date: "",
    re_enddate: "",
    re_credit: "",
    re_number: "",
    re_orderNo: "",
    re_status: "",
    re_person: "",
    re_remark: "",

    followup: "",
    solution: "",
    id_history: "",
    count: "",
    statusH: "",
    remark: ""
  };

  const [alldatalist, setatalist] = useState(initialValues4)



  useEffect(() => {
    seachNames()
  }, [])


  const seachNames = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apicustomer}?company=${companyS}`)
      setPosts(res.data)

    } catch (error) {
      console.error(error)
    }
  }

  const id_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.id))
  const code_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.code))
  const name_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.names))
  const address_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.address))
  const numbertax_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.numbertax))
  const tel_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.tel))
  const total_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.totalPoint))
  const drug_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.drugallergy))
  const congen_cus = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.congenitalDisease))
  const totalPont = String(searchname.filter((supplier: any) => supplier.names === alldatalist.names).map((supplier: any) => supplier.totalPoint))

  //**********Sort Promotion************************************************/
  //new Date().toLocaleDateString('es-US', { day: '2-digit',month: '2-digit',year: 'numeric', })
  let dateNow = new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' })
  let nameCus = name_cus


  let code_Promotion = nameCus == "" ? promotionfullS.filter((a: any) => a.conditionid === Number(1) && a.customer === String("ลูกค้าทั้งหมด") && new Date(a.startdate) <= new Date() && new Date(a.enddate) >= new Date()) :   //promotionfullS
    promotionfullS.filter((a: any) => a.conditionid === Number(1) && new Date(a.startdate) <= new Date() && new Date(a.enddate) >= new Date())

  let sumSale = Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))


  // Pronotion Percent
  let P_percent = code_Promotion.filter((a: any) => Number(sumSale) >= Number(a.pay_condition) && a.unit === "percent").reduce((acc: any, current: any) => {
    const {
      discount,
      unit
    } = current;
    const currentRegionState = acc[unit] ?? {
      perscentTotal: 0,
      bahtTotal: 0

    };
    acc[unit] = {
      perscentTotal: currentRegionState.perscentTotal + ((Number(discount) * Number(sumSale)) / 100),

    };
    return acc;
  }, {});



  // Pronotion baht
  let P_baht = code_Promotion.filter((a: any) => Number(sumSale) >= Number(a.pay_condition) && a.unit === "baht").reduce((acc: any, current: any) => {
    const {
      discount,
      unit
    } = current;
    const currentRegionState = acc[unit] ?? {
      bahtTotal: 0

    };
    acc[unit] = {
      bahtTotal: currentRegionState.bahtTotal + Number(discount),

    };
    return acc;
  }, {});

  let SumPro = ((Number(P_percent.percent == undefined ? 0 : P_percent.percent.perscentTotal)) + Number(P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal)).toFixed(0)


  /*
list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)>=Number(a.pay_condition)?
 a.unit==="percent"?(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)*Number(a.discount))/100:
 a.unit==="baht"?Number(a.discount):0
:0*/
  /*************************************************************************** */

  const [changepay, setchangePay] = useState("")

  //*****************Post Sale********** */

  // Post Data RC1
  const Update_ItemRC = async () => {

    const sales_lot = list.map(posts => ({
      id_receive1: Number(posts.id_receive1),
      qty_lot1: Number(posts.qty_lot1),
      lot_receive1: posts.lot_receive1,
      sale_lot1: Number(posts.sale_qty_lot1),
      balance_lot1: Number(posts.std_qty_lot1) - Number(posts.sale_qty_lot1),
      id_receive2: Number(posts.id_receive2),
      lot_receive2: posts.lot_receive2,
      qty_lot2: Number(posts.qty_lot2),
      sale_lot2: Number(posts.sale_qty_lot2),
      balance_lot2: Number(posts.std_qty_lot2) - Number(posts.sale_qty_lot2),
      id_receive3: Number(posts.id_receive3),
      lot_receive3: posts.lot_receive3,
      qty_lot3: Number(posts.qty_lot3),
      sale_lot3: Number(posts.sale_qty_lot3),
      balance_lot3: Number(posts.std_qty_lot3) - Number(posts.sale_qty_lot3),
    }))
    try {
      await axios.put(`/api/rc1`,
        {
          sales_lot
        }
      )

    } catch (error) {
      console.error(error)
    }
  }


  const discount =
    Number(alldatalist.discount || 0) +
    Number(alldatalist.promotion || 0) +
    (isNaN(parseInt(alldatalist.usereward)) ? 0 : parseInt(alldatalist.usereward));

  const total = list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
  const pay = alldatalist.pay === "cash" ? 1 : 2;

  if (typeof window !== "undefined") {
    // อัปเดต localStorage
    localStorage.setItem("order", JSON.stringify(list));
    localStorage.setItem("salemain", JSON.stringify(alldatalist));
    localStorage.setItem(
      "main",
      JSON.stringify([
        {
          bill: list.length,
          discount,
          total,
          pay
        },
      ])
    );


  }
  const handlePayment = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 20 }}>ชำระเงินสำเร็จ 🎉</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> ลูกค้าชำระสินค้าเรียบร้อยแล้ว</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };

  // Post Data & Post Customer Point
  const SaleMainSubmit = async () => {

    let companyS = (localStorage.getItem("company_") || "")
    const HisT = JSON.parse(localStorage.getItem("his") || "")
    const companyall = companyS
    const id_costomer = Number(alldatalist.id_costomer)
    const code_costomer = alldatalist.code_costomer
    const group_price = alldatalist.group_price
    const pay = alldatalist.pay === "cash" ? "เงินสด" : alldatalist.pay === "payment" ? "โอน" : ""
    const bill = Number(alldatalist.bill)
    const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
    const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
    const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(alldatalist.promotion) - Number(parseInt(alldatalist.usereward)))
    const addreward = Number(alldatalist.addreward)
    const usereward = Number(alldatalist.usereward)
    const personall = alldatalist.person
    const statussall = alldatalist.statuss
    const sales = list.map(posts => ({
      company: posts.company,
      id_product: Number(posts.id_product),
      code_product: posts.code_product,
      name_product: posts.name_product,
      cetagory: posts.cetagory,
      fixname: posts.fixname,
      unit: posts.unit,
      cost: Number(posts.costtotal),
      qty: Number(posts.qty),
      price: Number(posts.price),
      gifts: Number(posts.totalgift),
      discount: Number(posts.discount),
      total: Number(posts.total),
      id_receive1: Number(posts.id_receive1),
      lot_receive1: posts.lot_receive1,
      qty_lot1: Number(posts.qty_lot1),
      id_receive2: Number(posts.id_receive2),
      lot_receive2: posts.lot_receive2,
      qty_lot2: Number(posts.qty_lot2),
      id_receive3: Number(posts.id_receive3),
      lot_receive3: posts.lot_receive3,
      qty_lot3: Number(posts.qty_lot3),
      person: posts.person,
      statuss: posts.statuss,
    }))


    const historys = [{
      code_costomer: String(code_costomer),
      company: String(companyS),
      id_costomer: Number(id_costomer),
      name_customer: name_cus,
      duedate: new Date((HisT.map((a: any) => a.duedate)).toString()),
      followup: (HisT.map((a: any) => a.followup)).toString(),
      solution: (HisT.map((a: any) => a.solution)).toString(),
      id_history: 0,
      count: Number((HisT.map((a: any) => a.count)).toString()),
      statusH: (HisT.map((a: any) => a.statusH)).toString(),
      person: (HisT.map((a: any) => a.person)).toString(),
      remark: ""
    }]



    const point = parseInt(String(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) / (Number(SaleS) / Number(pointeqS))))
    const totalPoint = parseInt(String((Number(total_cus) + Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) / (Number(SaleS) / Number(pointeqS)))))
    try {
      localStorage.setItem("show", "1")
      //Save Sale
      await axios.post(`/api/sale`,
        {
          companyall, id_costomer, code_costomer, group_price, pay, bill, totalall, discount, sumtotal, addreward, usereward, personall, statussall, sales, historys
        })
      // Svae Cus Point    
      id_costomer === 0 ? "" : await axios.put(`/api/${apicustomer}/${id_costomer}`,
        {
          point, totalPoint

        })

      Update_ItemRC()
      handlePayment()
      DetailItemRC()

      seachNames()

      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)

        const dd =
          [{
            followup: String(""),
            solution: String(""),
            id_history: "",
            count: String(""),
            statusH: "",
            duedate: new Date(),
            person: ""
          }]

        localStorage.setItem("his", JSON.stringify(dd))


      }, 30);




      // await  fetchPosts()
      // localStorage.setItem("loadingM","/web/customers")

    } catch (error) {
      console.error(error)
    }
  }

  /*******ข้อมูล Quatation ************************ */
  // Date Real — use Thai timezone
  var dt = new Date();

  let year = parseInt(dt.toLocaleDateString('en-CA', { year: 'numeric', timeZone: 'Asia/Bangkok' }));
  let month = dt.toLocaleDateString('en-CA', { month: '2-digit', timeZone: 'Asia/Bangkok' });
  let day = dt.toLocaleDateString('en-CA', { day: '2-digit', timeZone: 'Asia/Bangkok' });
  /***************************************** */

  const [qt, setqt] = useState([])


  const fetchQT = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiquatation}?companyall=${companyS}`)
      res.data.length === 0 ? "" : setqt(res.data)
    } catch (error) {
      console.error(error)
    }
  }


  /****************Max QT********************** */
  const [maxS, setMax] = useState("")
  let maxRecN = Number(maxS) == -Infinity ? 100 : Number(maxS) + 1


  const maxV = async () => {
    let result = qt.filter((a: any) => a.qt_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.qt_number))
    console.log(result)

    let maxValue = Math.max.apply(null, result)
    setMax(String(maxValue))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValue)
  }


  /****************Max Bill********************** */
  const [maxSB, setMaxB] = useState("")
  let maxRecNB = Number(maxSB) == -Infinity ? 100 : Number(maxSB) + 1


  const maxVB = async () => {
    let resultB = qt.filter((a: any) => a.bl_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.bl_number))
    console.log(resultB)

    let maxValueB = Math.max.apply(null, resultB)
    setMaxB(String(maxValueB))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueB)
  }

  /****************Max INVOICE********************** */
  const [maxSI, setMaxI] = useState("")
  let maxRecNI = Number(maxSI) == -Infinity ? 100 : Number(maxSI) + 1


  const maxVI = async () => {
    let resultI = qt.filter((a: any) => a.inv_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.inv_number))
    console.log(resultI)

    let maxValueI = Math.max.apply(null, resultI)
    setMaxI(String(maxValueI))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueI)
  }

  /****************Max Re********************** */
  const [maxSR, setMaxR] = useState("")
  let maxRecNR = Number(maxSR) == -Infinity ? 100 : Number(maxSR) + 1


  const maxVR = async () => {
    let resultR = qt.filter((a: any) => a.re_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.re_number))
    console.log(resultR)

    let maxValueR = Math.max.apply(null, resultR)
    setMaxR(String(maxValueR))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueR)
  }

  /****************Max Re********************** */
  const [maxST, setMaxT] = useState("")
  let maxRecNT = Number(maxST) == -Infinity ? 100 : Number(maxST) + 1


  const maxVT = async () => {
    let resultT = qt.filter((a: any) => a.tax_orderNo === String(year) + String(month) + String(day)).map((pp: any) => (pp.tax_number))
    console.log(resultT)

    let maxValueT = Math.max.apply(null, resultT)
    setMaxT(String(maxValueT))
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueT)
  }



  /***************************************** */

  const [selectedOption, setSelectedOption] = useState('cash');
  const [itembalance, setbalance] = useState([])

  const fetchGet_Balance = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const idQuery = idF ? `&id=${idF}` : ''
      const res = await axios.get(`/api/${apibalance}?company=${companyS}&code_product=${codeproductS}${idQuery}`)

      setbalance(res.data)

    } catch (error) {
      console.error(error)
    }

  }








  //**************************************** */
  // input Discount
  const Discount_s = () => {

    const [discountS, setdiscountS] = useState('0')
    const [discountPo, setdiscountPo] = useState(alldatalist.promotion)

    useEffect(() => {
      setdiscountPo(localStorage.getItem("discount_Po") || "")
      setdiscountS(localStorage.getItem("discount_s") || "")

    }, [Number(discountS), Number(discountPo), Number(localStorage.getItem("discount_Po") || "")]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [show2, setShow2] = useState(false);

    const discount =
      Number(alldatalist.discount || 0) +
      Number(alldatalist.promotion || 0) +
      (isNaN(parseInt(alldatalist.usereward)) ? 0 : parseInt(alldatalist.usereward));

    const total = list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay
            },
          ])
        );


      }
    }, [Number(discountS), Number(discountPo), show2])

    return (


      <>

        <button
          type="button"
          className="btn btn-outline-success "
          style={{ fontFamily: "Kanit_B", width: 80, textAlign: "center", fontSize: 20, height: 50 }}
          onClick={() => { setShow2(true), localStorage.setItem("discount_s", "0"), setSelectedOption("cash"), localStorage.setItem("discount_Po", String(alldatalist.promotion)) }}
        >
          {Number(alldatalist.discount) + Number(alldatalist.promotion)}
        </button>

        <Modal_dc
          show={show2}
          onHide={() => setShow2(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_dc.Header closeButton>
            <Modal_dc.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ส่วนลดท้ายบิล</div>
            </Modal_dc.Title>
          </Modal_dc.Header>
          <Modal_dc.Body>

            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>

              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                ส่วนลด :  </div>

              <input className="form-control form-control-sm mt-1"
                style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                value={discountS}
                onChange={(e) => { setdiscountS(e.target.value), localStorage.setItem("discount_s", e.target.value) }}
              />
              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท
              </div>

            </div>
            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                ส่วนลดโปรโมชั่น :</div>
              {/**  {Number(alldatalist.promotion)}*/}
              <input className="form-control form-control-sm mt-1"
                style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                value={discountPo}
                onChange={(e) => { setdiscountPo(e.target.value), localStorage.setItem("discount_Po", e.target.value) }}
              />

              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท
              </div>

            </div>
            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit_B", marginTop: 10, textAlign: "left", height: 35 }}>
              ส่วนลดรวม : &nbsp;&nbsp;{Number(discountPo) + Number(discountS)}&nbsp;&nbsp; บาท  </div>


            {/**Promotion */}
            {code_Promotion.length > 0 ? <div className="row-4 mt-1 shadow-sm rounded border  " style={{ backgroundColor: "white", justifySelf: "center", marginLeft: 10 }}>
              <div className="d-flex  mt-1 mb-1 " style={{ justifyContent: "center" }}>
                <div className="" style={{ width: 190, justifyItems: "center" }}><div className={styles.bodydetail_head} >ส่วนลด โปรโมชั่น {((Number(P_percent.percent == undefined ? 0 : P_percent.percent.perscentTotal)) + Number(P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal)).toFixed(0)} บาท</div></div>
              </div>
              <div className='' style={{ overflowY: 'auto', marginLeft: 5 }}>
                <Table className="table" size="sm"  >
                  <thead className="">
                    <tr className="">

                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "40%" }}>ชื่อโปรโมชั่น</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15%" }}>ลูกค้า</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "40%" }}>โปรโมชั่น</th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "20%" }}>คำนวณ</th>
                    </tr>
                  </thead>
                  <tbody className="table-group-divider">
                    {code_Promotion.map((a: any) =>
                      <tr className="" key={a.id}>
                        <th scope="row" className={styles.bodydetailTable_Re1} style={{ width: "40%" }}>{a.name_promotion}</th>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "15%" }}>{a.customer}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "40%" }}>{a.msg_condition + " " + a.msg_discount}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "20%" }}>
                          {

                            list.map(num => num).reduce((acc, curr) => acc + curr.total, 0) >= Number(a.pay_condition) ?
                              a.unit === "percent" ? (list.map(num => num).reduce((acc, curr) => acc + curr.total, 0) * Number(a.discount)) / 100 :
                                a.unit === "baht" ? Number(a.discount) : 0
                              :
                              0

                          }

                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

            </div> : ""}
          </Modal_dc.Body>
          <Modal_dc.Footer>
            <button
              className="btn btn-success"

              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => {
                setShow2(false),
                  setatalist({ ...alldatalist, discount: discountS, promotion: discountPo }),
                  setdiscountS(localStorage.getItem("discount_s") || "")
                setdiscountPo(localStorage.getItem("discount_Po") || "")
                setSelectedOption("cash")
              }}
            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => setShow2(false)}
            >
              Close
            </button>

          </Modal_dc.Footer>
        </Modal_dc>

      </>

    )
  }


  // input use reward
  const Usereward_s = () => {

    const [userewardS, setuserewardS] = useState("0")

    const caluserreward = ((Number(userewardS == undefined ? 0 : userewardS) / Number(pointsetS)) * Number(discountS))

    useEffect(() => {

      setuserewardS(localStorage.getItem("usereward_s") || "")

    }, [Number(userewardS)]);

    const [show1, setShow1] = useState(false);


    const discount =
      Number(alldatalist.discount || 0) +
      Number(alldatalist.promotion || 0) +
      (isNaN(parseInt(alldatalist.usereward)) ? 0 : parseInt(alldatalist.usereward));

    const total = list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay
            },
          ])
        );


      }
    }, [Number(userewardS), show1])


    return (

      <>

        <button
          type="button"
          className="btn btn-outline-success "
          style={{ fontFamily: "Kanit_B", width: 80, textAlign: "center", fontSize: 20, height: 50 }}
          onClick={() => { setShow1(true), localStorage.setItem("usereward_s", "0"), setSelectedOption("cash") }}>
          {isNaN(parseInt(String(alldatalist.usereward))) === true ? 0 : parseInt(String(alldatalist.usereward))}
        </button>

        <Modal_rw
          show={show1}
          onHide={() => setShow1(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_rw.Header closeButton>
            <Modal_rw.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>ใช้แต้มส่วนลด</div>
            </Modal_rw.Title>
          </Modal_rw.Header>
          <Modal_rw.Body>
            <div className="col-3" style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 15, width: 180 }}>{code_cus}&nbsp;&nbsp;&nbsp;{name_cus}</div>
            <div className="d-flex">
              <div className="d-flex" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 13, width: 80, marginLeft: 10 }}>มีแต้มทั้งหมด :</div>
              <div className="d-flex" style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 13 }}>{total_cus}</div>
              <div className="d-flex" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 13, width: 80, marginLeft: 10 }}>แต้ม</div>
            </div>

            <div className="d-flex mt-1" style={{ textAlign: "center", height: 40 }}>
              <div style={{ width: "auto", fontSize: 15, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>  ใช้แต้มส่วนลด :  </div>

              <input defaultValue={0} className="form-control form-control-sm mt-1" style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 17, fontFamily: "Kanit_B", justifyItems: "center" }}
                value={userewardS ?? 0}
                disabled={statusS === "true" ? false : true}
                onChange={(e) => { setuserewardS(e.target.value), localStorage.setItem("usereward_s", e.target.value) }}

              />
              <div style={{ width: "auto", fontSize: 15, marginTop: 10, fontFamily: "Kanit" }}>แต้ม
              </div>
              <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                <div style={{ width: 80, fontSize: 15, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>คิดเป็น :  </div>

                <div style={{ width: "auto", fontSize: 15, marginTop: 10, fontFamily: "Kanit", marginRight: 10 }}>{isNaN(parseInt(String(caluserreward))) === true ? 0 : parseInt(String(caluserreward))}</div>
                <div style={{ width: 80, fontSize: 15, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>แต้ม  </div>
              </div>

            </div>
            <div style={{ width: "auto", fontSize: 10, marginTop: 10, fontFamily: "Kanit", color: "GrayText" }}>{statusS === "true" ? "เปิด ใช้งานแต้มสะสม" : "ปิด ใช้งานแต้มสะสม (เปิดการใช้งานได้ที่ ตั้งค่า => ตั้งค่าแต้มสะสม)"}</div>
            <div style={{ width: "auto", fontSize: 10, marginTop: 10, fontFamily: "Kanit", color: "GrayText" }}>ซื้อครบ : {SaleS} บาท คิดเป็นแต้ม : {pointeqS} แต้ม และแต้ม :  {pointsetS} แต้ม คิดเป็นส่วนลด : {discountS} บาท</div>

          </Modal_rw.Body>
          <Modal_rw.Footer>
            <button
              className="btn btn-success"

              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => {
                setShow1(false)
                setatalist({ ...alldatalist, usereward: String(caluserreward) }),
                  setuserewardS(localStorage.getItem("usereward_s") || ""),
                  setSelectedOption("cash")


              }}

            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => setShow1(false)}>
              Close
            </button>
          </Modal_rw.Footer>
        </Modal_rw>

      </>
    )
  }

  // input receive Baht
  const Rereveive_s = () => {

    const [receivebahtS, setreceivebahtS] = useState('0')
    useEffect(() => {

      setreceivebahtS(localStorage.getItem("receivebaht_s") || "")

    }, [Number(receivebahtS)]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [show3, setShow3] = useState(false);


    const discount =
      Number(alldatalist.discount || 0) +
      Number(alldatalist.promotion || 0) +
      (isNaN(parseInt(alldatalist.usereward)) ? 0 : parseInt(alldatalist.usereward));

    const total = list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay
            },
          ])
        );


      }
    }, [Number(receivebahtS), show3])


    return (

      <>

        <button
          type="button"
          className="btn btn-outline-success "
          style={{ fontFamily: "Kanit_B", width: 80, textAlign: "center", fontSize: 20, height: 50 }}
          onClick={() => { setShow3(true), localStorage.setItem("receivebaht_s", "0") }}
        >
          {alldatalist.receivebaht}
        </button>

        <Modal_rc
          show={show3}
          onHide={() => setShow3(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title">
          <Modal_rc.Header closeButton>
            <Modal_rc.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>รับเงิน</div>
            </Modal_rc.Title>
          </Modal_rc.Header>
          <Modal_rc.Body>


            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                รับเงินสด :  </div>

              <input className="form-control form-control-sm mt-1" style={{ width: 70, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                value={receivebahtS}
                onChange={(e) => { setreceivebahtS(e.target.value), localStorage.setItem("receivebaht_s", e.target.value) }}
              />
              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท
              </div>
            </div>
            <div className="d-flex mt-2">
              <button
                type="button"
                className="btn btn-outline-secondary "
                onClick={(e) => {
                  setreceivebahtS("20"),
                    localStorage.setItem("receivebaht_s", "20"),
                    setatalist({ ...alldatalist, receivebaht: "20", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>20
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("50"),
                    localStorage.setItem("receivebaht_s", "50"),
                    setatalist({ ...alldatalist, receivebaht: "50", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>50
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("60"),
                    localStorage.setItem("receivebaht_s", "60"),
                    setatalist({ ...alldatalist, receivebaht: "60", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>60
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("80"),
                    localStorage.setItem("receivebaht_s", "80"),
                    setatalist({ ...alldatalist, receivebaht: "80", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>80
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("100"),
                    localStorage.setItem("receivebaht_s", "100"),
                    setatalist({ ...alldatalist, receivebaht: "100", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>100
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("200"),
                    localStorage.setItem("receivebaht_s", "200"),
                    setatalist({ ...alldatalist, receivebaht: "200", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>200
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("500"),
                    localStorage.setItem("receivebaht_s", "500"),
                    setatalist({ ...alldatalist, receivebaht: "500", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}>
                500
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  setreceivebahtS("1000"),
                    localStorage.setItem("receivebaht_s", "1000"),
                    setatalist({ ...alldatalist, receivebaht: "1000", total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                    setShow3(false)
                }}
              >1000
              </button>
            </div>
          </Modal_rc.Body>
          <Modal_rc.Footer>
            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => {
                setShow3(false),
                  setatalist({ ...alldatalist, receivebaht: receivebahtS, total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) }),
                  setreceivebahtS(localStorage.getItem("receivebaht_s") || "")
              }}
            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
              onClick={() => setShow3(false)}
            >
              Close
            </button>

          </Modal_rc.Footer>
        </Modal_rc>
      </>
    )
  }

  // input Radio Pay
  const Radio_pay = () => {

    const [payS, setpay] = useState('0')

    useEffect(() => {

      setpay(localStorage.getItem("pay_s") || "")

    }, [Number(payS)]);


    const handleOptionChange1 = (e: any) => {

      const { name, value } = e.target;
      setSelectedOption(e.target.value);
      setatalist({
        ...alldatalist,
        pay: e.target.value,
        receivebaht: String(pat_baht),
        total: String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
      });
      localStorage.setItem("pay_s", String(e.target.value))

    };


    /*
    setatalist({...alldatalist, receivebaht:"50",
    total:String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))})*/

    const pat_baht =
      Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
      - Number(alldatalist.discount)
      - Number(alldatalist.promotion)
      - Number(isNaN(parseInt(alldatalist.usereward)) === true ? 0 : isNaN(parseInt(alldatalist.usereward)))

    return (

      <>
        <div className="col">
          <label style={{ fontFamily: "Kanit", fontSize: 17 }}>
            <input
              type="radio"
              name="cash" // Same name for all radio buttons in the group
              value="cash"
              checked={selectedOption === 'cash'} // Controlled by state
              onChange={handleOptionChange1}
              style={{ marginRight: 10, fontFamily: "Kanit" }}
            />
            เงินสด
          </label>

          <label style={{ fontFamily: "Kanit", fontSize: 17 }}>
            <input
              type="radio"
              name="payment"
              value="payment"
              checked={selectedOption === 'payment'}
              onChange={handleOptionChange1}
              style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
            />
            โอน
          </label>

        </div>

      </>
    )
  }

  const [addhis, setaddhis] = useState(0)    // add history     


  // Search ลูกค้า
  function Search_Cus() {


    const handleClose = () => setShow(false);

    const [drugs, setdrugs] = useState([])
    //******* */  Key ค้นหา สินค้า  ************************/
    const [data, setData] = useState(searchname);
    const [search, setsearch] = useState("")

    const handleChange = (value: any) => {
      setsearch(value);
      filterDataProduct(value);
    };

    // filter records by Productname
    const filterDataProduct = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData(searchname);
      else {
        const filteredData = data.filter((user: any) =>
          user.names.toLowerCase().includes(search.toLowerCase())
          || user.code.toLowerCase().includes(search.toLowerCase())
          || user.tel.toLowerCase().includes(search.toLowerCase())
        );
        setData(filteredData);
      }
    };

    //***************************************************************** */
    const [show, setShow] = useState(false);


    const [idcusS, setidcus] = useState(0)
    const [sh, setsh] = useState([])

    const id_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.id))
    const code_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.code))
    const name_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.names))
    const address_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.address))
    const numbertax_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.numbertax))
    const tel_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.tel))
    const total_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.totalPoint))
    const drug_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.drugallergy))
    const congen_cus1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.congenitalDisease))
    const totalPont1 = String(searchname.filter((supplier: any) => supplier.id === Number(idcusS)).map((supplier: any) => supplier.totalPoint))

    const GetHistory = async (id: Number) => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getsalehistory}?companyall=${companyS}&id_costomer=${Number(id)}`)
        setsh(res.data)
        //   console.log(res.data)
        //   localStorage.setItem("dg",JSON.stringify(res.data))
      } catch (error) {
        console.error(error)
      }
    }

    const GetDrug = async (id: Number) => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getdrugg}?company=${companyS}&id_cus=${Number(id)}`)
        setdrugs(res.data)
        console.log(res.data)
        localStorage.setItem("dg", JSON.stringify(res.data))
      } catch (error) {
        console.error(error)
      }
    }


    return (
      <>
        <button
          type="button"
          className="btn btn-outline-dark "
          onClick={() => { setShow(true) }}
          style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 12, height: 30, width: "50%" }}
        >
          คลิก ค้นหา ข้อมูลลูกค้า....
        </button >

        {name_cus === "" ? "" :
          <button
            type="button"
            className="btn btn-outline-primary "
            onClick={() => { setaddhis(1) }}
            style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 12, height: 30, marginLeft: 10 }}
          >
            เพิ่มประวัติ
          </button >
        }

        <button
          type="button"
          className="btn btn-outline-warning "
          onClick={() => { setatalist({ ...alldatalist, names: "" }), localStorage.setItem("dg", JSON.stringify([])), setaddhis(0) }}
          style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 12, height: 30, marginLeft: 10 }}
        >
          reset
        </button >



        <Modal1
          show={show}
          onHide={() => { setShow(false), setatalist({ ...alldatalist, names: "" }) }}
          size="xl"
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title">
          <Modal1.Header closeButton>
            <Modal1.Title
              style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
              ค้นหา ชื่อลูกค้า, รหัสลูกค้า , เบอร์โทรศัพท์
            </Modal1.Title>
          </Modal1.Header>
          <Modal1.Body>

            <div className="row" style={{ height: "80vh" }}>
              <div className="col-5">
                <div style={{ fontFamily: "Kanit_B", textAlign: "center", fontSize: 15, height: 20 }}>ค้นหาลูกค้า</div>
                <div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ค้นหา</div>
                  <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                    <input
                      value={search}
                      onChange={(e) => handleChange(e.target.value)}
                      className="form-control form-control-sm"
                      placeholder="ค้นหา ชื่อลูกค้า, รหัสลูกค้า , เบอร์โทรศัพท์"
                      style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <Table className="table mt-1" size="sm" >
                      <thead style={{ position: "sticky", top: "0" }}>
                        <tr>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "20%", fontSize: 12 }}>
                            <div>รหัสลูกค้า</div>
                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "60%", fontSize: 12 }}>
                            <div>ชื่อลูกค้า</div>

                          </th>
                          <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "20%", fontSize: 12 }}>
                            <div>เบอร์โทรศัพท์</div>
                          </th>

                        </tr>
                      </thead>
                      <tbody className="table-group-divider">
                        {data.map((post: any) => (
                          <tr key={post.id}  >
                            <th className={styles.bodydetailTable_Re1} style={{ width: "20%", fontSize: 13 }}>{post.code}</th>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "60%", fontSize: 13 }}>{post.names}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "10%", fontSize: 13 }}>{post.tel}</td>
                            <td className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                              <button className="btn btn-success" onClick={() => { GetDrug(post.id), GetHistory(post.id), setatalist({ ...alldatalist, names: post.names },), setShow(false) }} style={{ width: 50, height: 25, fontSize: 10 }}>เลือก</button>
                            </td>
                            <td onClick={() => { setidcus(post.id), GetHistory(post.id) }} className={styles.bodydetailTable_Re1} style={{ width: "10%" }}>
                              <button className="btn btn-primary" style={{ width: 50, height: 25, fontSize: 10 }}>ประวัติ</button>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                </div>

              </div>

              <div className="col">
                <div style={{ fontFamily: "Kanit_B", textAlign: "center", fontSize: 15, height: 20 }}>ประวัติการรักษา</div>

                <div>
                  <div className="row  justify-content-start">
                    <div className="d-flex  mt-1" style={{ alignItems: "center" }}>
                      <div className="" style={{ width: widths }}><div className={styles.bodydetail} >รหัส :</div></div>
                      <div className="col-sm-9 ">
                        <div className={styles.bodydetail_B} >{code_cus1}{" _ "} {name_cus1}</div>
                      </div>
                    </div>
                  </div>

                  <div className="row  justify-content-start">
                    <div className="d-flex  " style={{ alignItems: "center" }}>
                      <div className="" style={{ width: widths }}>
                        <div className={styles.bodydetail} >เบอร์โทร :</div>
                      </div>
                      <div className="d-flex  alignItems-center">
                        <div className={styles.bodydetail_B} style={{ width: 65 }}>{tel_cus1}</div>
                      </div>

                      <div className="" style={{ width: widths }}>
                        <div className={styles.bodydetail} >แต้มสะสม :</div>
                      </div>
                      <div className="d-flex  alignItems-center">
                        <div className={styles.bodydetail_B} style={{ width: 25, textAlign: "left" }}>{total_cus1}</div>
                        <div className={styles.bodydetail_unit} style={{ width: 40 }}>แต้ม</div>
                      </div>
                    </div>
                  </div>



                  <div className="row  justify-content-start">
                    <div className="d-flex  " style={{ alignItems: "center" }}>
                      <div className="" style={{ width: 60 }}><div className={styles.bodydetail} >แพ้สินค้า :</div></div>
                      <div className="col  " >
                        <div className={styles.bodydetail_B} style={{ paddingLeft: 10 }}>{drug_cus1}</div>

                      </div>
                    </div>
                  </div>

                  <div className="row  justify-content-start">
                    <div className="d-flex  " style={{ alignItems: "center" }}>
                      <div className="" style={{ width: 60, paddingLeft: 10 }}><div className={styles.bodydetail} >โรคประจำตัว :</div></div>
                      <div className="col  " >
                        <div className={styles.bodydetail_B} style={{ paddingLeft: 10 }}>{congen_cus1}</div>

                      </div>
                    </div>
                  </div>
                  <div className="row">


                  </div>
                  <div className="col">
                    <div className='' style={{ height: "65vh", overflowY: 'auto' }}>
                      <Table className="table table-hover"  >

                        <tbody className="table-group-divider">
                          {sh.map((s: any) => (
                            <tr key={s.id}>
                              <td className={styles.bodydetailTable_Re1} style={{ width: 70 }}>
                                {new Date(s.createDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              </td>

                              <td  >

                                {s.sales.map((a: any) => (
                                  <tr key={a.id}  >
                                    <td className={styles.bodydetailTable_Re1} style={{ width: 50 }}>
                                      {a.code_product}
                                    </td>
                                    <td className={styles.bodydetailTable_Re1} style={{ width: 450 }}>
                                      {a.name_product}
                                    </td>
                                    <td className={styles.bodydetailTable_Re1} style={{ width: 50, marginLeft: 5 }}>
                                      {a.qty}
                                    </td>
                                  </tr>
                                ))}



                              </td>

                              <td >

                                {s.historys.map((b: any) => (
                                  <tr key={b.id} >

                                    <td className={styles.bodydetailTable_Re1} style={{ width: "15%" }}>
                                      <div className="row">อาการ : {b.followup}</div>
                                      <div className="row">
                                        <div className="row">การรักษา :</div>
                                        <div className="row" style={{ whiteSpace: "pre-line" }}>{((b.solution ?? "").split("*").map((item: any) => item.trim()).join("\n"))}</div>
                                      </div>
                                      <div className="row">

                                        ติดตามผล : {new Date(b.duedate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                                      </div>
                                    </td>
                                  </tr>
                                ))}



                              </td>

                            </tr>

                          ))}
                        </tbody>
                      </Table>
                    </div>



                  </div>


                </div>

              </div>
            </div>


          </Modal1.Body>
          {/**   <Modal1.Footer>
          <Button1 
                variant="secondary" 
                onClick={handleClose}
                style={{fontFamily:"Kanit" ,textAlign:"left",fontSize:15,color:"white"}}
                >
            ปิด
          </Button1>
          <Button1 
                variant="primary" 
                onClick={handleClose}
                style={{fontFamily:"Kanit" ,textAlign:"left",fontSize:15,color:"white"}}
                >
            เลือก
          </Button1>
        </Modal1.Footer>*/}
        </Modal1>


      </>
    );
  }




  type Props = {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  };

  const SpeechToText: React.FC<Props> = ({
    language = "th-TH",
    continuous = true,
    interimResults = true,
  }) => {

    const [supported, setSupported] = useState<boolean | null>(null);
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState("");
    const [finalTranscript, setFinalTranscript] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const [follow, setfollow] = useState("")
    const [sol, setsol] = useState("")
    const [startDate, setStartDate] = useState(new Date());
    const [H, setH] = useState(0)

    useEffect(() => {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        setSupported(false);
        return;
      }


      const recognition = new SpeechRecognitionClass() as SpeechRecognition;
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => setListening(true);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }


        if (finalText) {
          setFinalTranscript((prev) => (prev ? prev + " " + finalText : finalText));
          setfollow((prev) => (prev ? prev + " " + finalText : finalText));
          setInterim("");
        } else {
          setInterim(interimText);
        }
      };



      recognition.onerror = (err) => {
        console.error("Speech recognition error", err);
        setListening(false);
      };

      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      setSupported(true);

      return () => {
        recognition.stop();
        recognitionRef.current = null;
      };
    }, [language, continuous, interimResults]);

    const startListening = async () => {
      if (!recognitionRef.current) return;
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Microphone permission denied", err);
      }
    };

    const stopListening = () => {
      recognitionRef.current?.stop();
      setListening(false);
    };

    const clearText = () => {
      setFinalTranscript("");
      setfollow("");
      setInterim("");

    };

    useEffect(() => {
      const A1 = list.filter((d: any) => d.label === true).map((a: any) => "*- " + a.fixname + " ช่วย " + a.indicatorlistS + " " + a.useS + " " + a.timeuseS + " " + a.timeS)

      setsol(A1.toString().split(",").map(item => item.trim()).join("\n"))


    }, [Number(idF ?? "")])

    if (supported === false) {
      return (
        <div className="p-4 border rounded bg-red-50 text-red-700">
          <p>เบราว์เซอร์ของคุณไม่รองรับ Speech Recognition API</p>
          <p>แนะนำใช้ Chrome Desktop หรือ Android</p>
        </div>
      );
    }


    const SaveHis = async () => {


      setH(0)

      const dd =
        [{
          followup: String(follow ?? ""),
          solution: String(sol ?? ""),
          id_history: "",
          count: String(1),
          statusH: "ติดตามผล",
          duedate: new Date(startDate ?? ""),
          person: ""
        }]

      localStorage.setItem("his", JSON.stringify(dd))
    }




    return (
      <>
        {addhis === 0 ? "" :
          <div className="p-2 border rounded space-y-3 mt-2">
            <div className="flex gap-2">
              <button
                onClick={startListening}
                disabled={listening}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                เริ่มพูด
              </button>
              <button
                onClick={stopListening}
                disabled={!listening}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                หยุด
              </button>
              <button
                onClick={clearText}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 border rounded">
                ล้างข้อความ
              </button>

              <span
                className="ml-auto text-sm text-gray-600"
                style={{ fontFamily: "kanit", fontSize: 12 }}>
                {listening ? "🎙️ กำลังฟัง..." : "⏹️ หยุดฟัง"}
              </span>
            </div>


            <div className="row" >

              <div>
                <div className="input-group" style={{ minHeight: 70 }}>
                  <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}>อาการ</span>
                  <textarea
                    className="form-control"
                    aria-label="With textarea"
                    value={follow ?? ""}
                    onChange={(e) => setfollow(e.target.value)}
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                  />

                </div>

              </div>


              <div>
                <div className="input-group mt-2" style={{ minHeight: 130 }}>
                  <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}>การรักษา</span>
                  <textarea
                    className="form-control"
                    aria-label="With textarea"
                    value={sol ?? ""}
                    onChange={(e) => setsol(e.target.value)}
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                  />

                </div>


              </div>
              <div>
                <div className="row mt-2">
                  <div className="col-2" style={{ fontFamily: "kanit", fontSize: 13, width: 115, marginTop: 5 }}>ติดตามผล วันที่ :</div>
                  <div className='col-2 border border-gray shadow shadow-sm rounded ' style={{ width: 200, height: 30, cursor: "pointer" }}>
                    <div style={{ width: 200, marginTop: 2, cursor: "pointer" }}>
                      <DatePicker

                        value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                        // selected={startDate} 
                        onChange={(date: any) => setStartDate(date)} />
                    </div>


                  </div>
                  <div className="col-2" style={{ marginLeft: 10 }}>
                    <button
                      className={H === 1 ? "btn btn-success" : "btn btn-warning"}
                      style={{ width: 80, height: 35, fontSize: 10, fontFamily: "Kanit" }}
                      onClick={() => { SaveHis(), setH(1) }}>
                      {H === 1 ? "บันทึกเรียบร้อย" : "บันทึกประวัติ"}
                    </button>
                  </div>

                </div>

              </div>



            </div>


          </div>
        }
      </>



    );
  };






  // input ใบเสนอราคา
  function QuotationTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);


    // Post Quatation
    const CreateQuatation = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = alldatalist.group_price
      const pay = alldatalist.pay === "cash" ? "เงินสด" : alldatalist.pay === "payment" ? "โอน" : ""
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(parseInt(alldatalist.usereward)))
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = alldatalist.person
      const statussall = alldatalist.statuss
      const qt_date = new Date(startDate)
      const qt_enddate = new Date(startDate1)
      const qt_credit = Number(daysDiff)
      const qt_number = Number(maxRecN)
      const qt_orderNo = year + month + day
      const qt_orderfull = "QT" + year + month + day + Number(maxRecN)
      const qt_status = "รออนุมัติ"
      const qt_person = ""
      const qt_remark = ""
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: posts.person,
        statuss: posts.statuss,
      }
      )
      )

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            qt_date, qt_number, qt_orderNo, qt_status, qt_person, qt_remark, qt_enddate, qt_credit, qt_orderfull,

            detailsale
          })

      } catch (error) {
        console.error(error)
      }
    }



    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      await CreateQuatation()
      await fetchQT()
      setShowW(false)

      seachNames()

      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);

      setLoading(false);

    };

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        // fetchQT()
        maxV()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="col">

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === 'notax'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === 'three'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 7 %
            </label>
          </div>

        </>
      )
    }

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 =
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 =
      Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));



    return (


      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบเสนอราคาได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">

              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true), maxV() }}
            type="button"
            className="btn btn-outline-secondary"
            style={{ width: 110, height: 30, fontSize: 11, marginTop: 5, fontFamily: "Kanit" }}>
            สร้างใบเสนอราคา
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบเสนอราคา</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >


              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูขาย */}
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>



                  {/**ผู้ซื้อ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ชื้อ</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบเสนอราคา
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                    </div>
                    <div className="col ">
                      <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>QT{year}{month}{day}{maxRecN}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                        {/**Open */}
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              selected={startDate}
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{daysDiff} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })} selected={startDate1} onChange={(date: any) => setStartDate1(date)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>
                    </div>
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <table className="table"   >
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.filter((q: any) => q.label === true).map((a: any) =>
                          <div key={a.id} id="selcet-print">
                            <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                              <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", height: 23, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30 }}>{a.qty}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.unit}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 70 }}>{a.price}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.discount}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50, marginRight: 5 }}>{a.total}</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {String(taxNum) === "" ? "" :
                        <div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                        </div>
                      }

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                          (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                            - Number(alldatalist.discount)
                            - Number(alldatalist.promotion)
                            - Number(parseInt(alldatalist.usereward)) +
                            ((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                        }</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>


                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้สั่งซื้อสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>

                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>

                  </div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>

                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้อนุมัติ</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>



            </div>




          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn2}>
              Print
            </button>

            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={handleClick}>
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}

            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowW(false)}>
              ปิด
            </button>

          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }

  // input ใบวางบิล
  function BillTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);


    // Post Quatation
    const CreateBill = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = alldatalist.group_price
      const pay = alldatalist.pay === "cash" ? "เงินสด" : alldatalist.pay === "payment" ? "โอน" : ""
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(parseInt(alldatalist.usereward)))
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = alldatalist.person
      const statussall = alldatalist.statuss
      const bl_date = new Date(startDate)
      const bl_enddate = new Date(startDate1)
      const bl_credit = Number(daysDiff)
      const bl_number = Number(maxRecNB)
      const bl_orderNo = year + month + day
      const bl_orderfull = "BL" + year + month + day + Number(maxRecNB)
      const bl_status = "รออนุมัติ"
      const bl_person = ""
      const bl_remark = ""
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: posts.person,
        statuss: posts.statuss,
      }
      )
      )

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            bl_date, bl_number, bl_orderNo, bl_status, bl_person, bl_remark, bl_enddate, bl_credit, bl_orderfull,

            detailsale
          })

      } catch (error) {
        console.error(error)
      }
    }



    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill()
      await fetchQT()
      setShowW(false)

      seachNames()
      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);


      setLoading(false);

    };

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        // fetchQT()
        maxVB()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="col">

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === 'notax'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === 'three'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 7 %
            </label>
          </div>

        </>
      )
    }

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 =
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 =
      Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));



    return (


      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบวางบิลได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">

              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true) }}
            type="button"
            className="btn btn-outline-secondary"
            style={{ width: 100, height: 30, fontSize: 12, marginLeft: 10, marginTop: 5, fontFamily: "Kanit" }}>
            สร้างใบวางบิล
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบวางบิล</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >


              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูขาย */}
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>



                  {/**ผู้ซื้อ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ชื้อ</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบวางบิล
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                    </div>
                    <div className="col ">
                      <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>BL{year}{month}{day}{maxRecNB}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                        {/**Open */}
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //  selected={startDate} 
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{daysDiff} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //selected={startDate1} 
                              onChange={(date: any) => setStartDate1(date)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>
                    </div>
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <table className="table"   >
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.filter((q: any) => q.label === true).map((a: any) =>
                          <div key={a.id} id="selcet-print">
                            <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                              <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", height: 23, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30 }}>{a.qty}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.unit}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 70 }}>{a.price}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.discount}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50, marginRight: 5 }}>{a.total}</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {String(taxNum) === "" ? "" :
                        <div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                        </div>
                      }

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                          (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                            - Number(alldatalist.discount)
                            - Number(alldatalist.promotion)
                            - Number(parseInt(alldatalist.usereward)) +
                            ((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                        }</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>


                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้สั่งซื้อสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>

                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>

                  </div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>

                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้อนุมัติ</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>



            </div>




          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn2}>
              Print
            </button>

            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={handleClick}>
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}

            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowW(false)}>
              ปิด
            </button>

          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }

  // input ใบแจ้งหนี้
  function InvoiceTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);


    // Post Quatation
    const CreateBill = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = alldatalist.group_price
      const pay = alldatalist.pay === "cash" ? "เงินสด" : alldatalist.pay === "payment" ? "โอน" : ""
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(parseInt(alldatalist.usereward)))
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = alldatalist.person
      const statussall = alldatalist.statuss
      const inv_date = new Date(startDate)
      const inv_enddate = new Date(startDate1)
      const inv_credit = Number(daysDiff)
      const inv_number = Number(maxRecNI)
      const inv_orderNo = year + month + day
      const inv_orderfull = "INV" + year + month + day + Number(maxRecNI)
      const inv_status = "รออนุมัติ"
      const inv_person = ""
      const inv_remark = ""
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: posts.person,
        statuss: posts.statuss,
      }
      )
      )

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            inv_date, inv_number, inv_orderNo, inv_status, inv_person, inv_remark, inv_enddate, inv_credit, inv_orderfull,

            detailsale
          })

      } catch (error) {
        console.error(error)
      }
    }



    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill()
      await fetchQT()
      setShowW(false)


      seachNames()

      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);


      setLoading(false);

    };

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        // fetchQT()
        maxVI()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="col">

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === 'notax'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === 'three'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 7 %
            </label>
          </div>

        </>
      )
    }

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 =
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 =
      Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));



    return (


      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบแจข้งหนี้ได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">

              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true), maxVI() }}
            type="button"
            className="btn btn-outline-secondary"
            style={{ width: 110, height: 30, fontSize: 12, marginLeft: 10, marginTop: 5, fontFamily: "Kanit" }}>
            สร้างใบแจ้งหนี้
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบแจ้งหนี้</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >


              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูขาย */}
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>



                  {/**ผู้ซื้อ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ชื้อ</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบแจ้งหนี้
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                    </div>
                    <div className="col ">
                      <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>INV{year}{month}{day}{maxRecNI}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                        {/**Open */}
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //  selected={startDate} 
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{daysDiff} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //selected={startDate1} 
                              onChange={(date: any) => setStartDate1(date)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>
                    </div>
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <table className="table"   >
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.filter((q: any) => q.label === true).map((a: any) =>
                          <div key={a.id} id="selcet-print">
                            <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                              <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", height: 23, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30 }}>{a.qty}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.unit}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 70 }}>{a.price}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.discount}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50, marginRight: 5 }}>{a.total}</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {String(taxNum) === "" ? "" :
                        <div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                        </div>
                      }

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                          (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                            - Number(alldatalist.discount)
                            - Number(alldatalist.promotion)
                            - Number(parseInt(alldatalist.usereward)) +
                            ((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                        }</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>


                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้สั่งซื้อสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>

                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>

                  </div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>

                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้อนุมัติ</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>



            </div>




          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn2}>
              Print
            </button>

            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={handleClick}>
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}

            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowW(false)}>
              ปิด
            </button>

          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }

  // input ใบเสร็จรับเงิน
  function ReTemplate() {

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);


    // Post Quatation
    const CreateBill = async () => {

      let companyS = (localStorage.getItem("company_") || "")

      const companyall = companyS
      const id_costomer = Number(alldatalist.id_costomer)
      const code_costomer = alldatalist.code_costomer
      const name_costomer = String(name_cus)
      const group_price = alldatalist.group_price
      const pay = alldatalist.pay === "cash" ? "เงินสด" : alldatalist.pay === "payment" ? "โอน" : ""
      const bill = Number(alldatalist.bill)
      const totalall = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)))
      const discount = Number(alldatalist.discount) + Number(alldatalist.promotion)
      const sumtotal = Number(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) - Number(alldatalist.discount) - Number(parseInt(alldatalist.usereward)))
      const addreward = Number(alldatalist.addreward)
      const usereward = Number(alldatalist.usereward)
      const taxnumber = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
        String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
          String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""
      const personall = alldatalist.person
      const statussall = alldatalist.statuss
      const re_date = new Date(startDate)
      const re_enddate = new Date(startDate1)
      const re_credit = Number(daysDiff)
      const re_number = Number(maxRecNR)
      const re_orderNo = year + month + day
      const re_orderfull = "RE" + year + month + day + Number(maxRecNR)
      const re_status = "รออนุมัติ"
      const re_person = ""
      const re_remark = ""
      const detailsale = list.map(posts => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: posts.person,
        statuss: posts.statuss,
      }
      )
      )

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`,
          {
            companyall, id_costomer, code_costomer, name_costomer, group_price, pay, bill,
            totalall, discount, sumtotal, addreward, usereward, personall, statussall, taxnumber,
            re_date, re_number, re_orderNo, re_status, re_person, re_remark, re_enddate, re_credit, re_orderfull,

            detailsale
          })

      } catch (error) {
        console.error(error)
      }
    }



    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill()
      await fetchQT()
      setShowW(false)


      seachNames()

      setTimeout(() => {
        deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2")
        setatalist(initialValues4)
        setMessage("")
      }, 30);


      setLoading(false);

    };

    let taxNum = String(localStorage.getItem("numbertax_S") || "") === String("notax") ? "" :
      String(localStorage.getItem("numbertax_S") || "") === String("three") ? "3" :
        String(localStorage.getItem("numbertax_S") || "") === String("seven") ? "7" : ""

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState('notax');

    const Radio_tax = () => {

      useEffect(() => {

        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "")
        // fetchQT()
        maxVR()

      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {

        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value)
      };
      return (

        <>
          <div className="col">

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === 'notax'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === 'three'} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === 'seven'}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }} />
              หักภาษี 7 %
            </label>
          </div>

        </>
      )
    }

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 =
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 =
      Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));



    return (


      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>ไม่สามารถ สร้างใบแจข้งหนี้ได้ !</Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">

              <button style={{ fontSize: 14, fontFamily: "Kanit" }} onClick={() => setShow(false)} className="outline-success">
                ปิด
              </button>
            </div>
          </Alert>

          {!show && <button
            disabled={list.length < 1 ? true : false}
            onClick={() => { name_cus === "" ? setShow(true) : setShowW(true), maxVR() }}
            type="button"
            className="btn btn-outline-secondary"
            style={{ width: 120, height: 30, fontSize: 12, marginLeft: 10, marginTop: 5, fontFamily: "Kanit" }}>
            สร้างใบเสร็จรับเงิน
          </button>}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div style={{ width: "auto", height: 20, fontSize: 13, fontFamily: "Kanit" }}>สร้างใบเสร็จรับเงิน</div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>

            <div className="col  " style={{ justifySelf: "center", backgroundColor: "white", marginLeft: 20, marginRight: 20 }} ref={contentRef} >


              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>

                <div className="col " >

                  {/**ผูขาย */}
                  <div className="row mt-4" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ขาย</div>
                  <div className="row  " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{storeS}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{addressS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{taxS}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {telS}</div>



                  {/**ผู้ซื้อ */}
                  <div className="row mt-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>ผู้ชื้อ</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 11 }}>{name_cus}</div>
                  <div className="row" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>{address_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>เลขที่ผู้เสียภาษี :{numbertax_cus}</div>
                  <div className="row " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 11 }}>โทร : {tel_cus}</div>

                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div className="row "
                    style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20, justifySelf: "center" }}>
                    ใบเสร็จรับเงิน
                  </div>
                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เลขที่ :</div>
                      <div className="mt-1" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันที่ :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>เครดิต :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>วันครบกำหนด :</div>
                      <div className="mt-2" style={{ textAlign: "right", fontFamily: "kanit", fontSize: 13 }}>ผู้ขาย :</div>
                    </div>
                    <div className="col ">
                      <div className="col " style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>RE{year}{month}{day}{maxRecNI}</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>

                        {/**Open */}
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //  selected={startDate} 
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>{daysDiff} วัน</div>
                      <div className="mt-1" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>
                        <div className='border border-black shadow shadow-sm rounded ' style={{ width: 130, height: 25 }}>
                          <div style={{ width: 100, marginLeft: 10, marginTop: 2 }}>
                            <DatePicker value={new Date(startDate1).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}
                              //selected={startDate1} 
                              onChange={(date: any) => setStartDate1(date)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 mb-2" style={{ textAlign: "left", fontFamily: "kanit", fontSize: 13 }}>ชื่อผู้ขาย</div>
                    </div>
                  </div>

                  <div className="mt-1 mb-2" style={{ justifySelf: "center", width: "70%", height: 1, backgroundColor: "black" }}></div>

                </div>
              </div>

              <div className="row mt-3" style={{ marginLeft: 20, marginRight: 20 }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "right" }}>
                  <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit_B", fontSize: 11, textAlign: "start", height: 15, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รายการ</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 45 }}>จำนวน</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>หน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 70 }}>ราคาต่อหน่วย</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>ลด/ชิ้น</div>
                  <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", height: 15, width: 50 }}>รวม</div>
                </div>
                <div className="mt-1 " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <table className="table"   >
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.filter((q: any) => q.label === true).map((a: any) =>
                          <div key={a.id} id="selcet-print">
                            <div className="d-flex bd-highlight" style={{ justifyItems: "end" }} >
                              <div className=' flex-grow-1 bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", height: 23, width: "5vw", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{a.name_product}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", height: 23, width: 30 }}>{a.qty}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.unit}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 70 }}>{a.price}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50 }}>{a.discount}</div>
                              <div className=' bd-highlight' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "end", height: 23, width: 50, marginRight: 5 }}>{a.total}</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className=" " style={{ justifySelf: "center", width: "100%", height: 1, backgroundColor: "black" }}></div>
                <div className="row " style={{ fontFamily: "kanit", fontSize: 11, justifySelf: "left", marginLeft: 3 }}>ทั้งหมด : {list.length} รายการ  </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>รวมเงิน :</div>
                        <div className=" bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20, }}>{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                        <div className=" bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ส่วนลดท้ายบิล :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>ใช้แต้มส่วนลด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{parseInt(String(alldatalist.usereward))}</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                      </div>

                      {String(taxNum) === "" ? "" :
                        <div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>จำนวนเงินรวมทั้งสิ้น :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                          <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                          <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 20 }}>หักภาษี ณ ที่จ่าย {String(taxNum)} % :</div>
                            <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 20 }}>{(((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                            }</div>
                            <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 20 }}>บาท</div>
                          </div>
                        </div>
                      }

                      <div className="d-flex bd-highlight" style={{ justifySelf: "end" }} >
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "right", width: 200, height: 30 }}>ยอดชำระทั้งหมด :</div>
                        <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "center", width: 70, height: 30 }}>{
                          (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                            - Number(alldatalist.discount)
                            - Number(alldatalist.promotion)
                            - Number(parseInt(alldatalist.usereward)) +
                            ((Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              - Number(alldatalist.discount)
                              - Number(alldatalist.promotion)
                              - Number(parseInt(alldatalist.usereward))) * Number(taxNum)) / 100).toFixed(1)
                        }</div>
                        <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 11, textAlign: "left", width: 20, height: 30 }}>บาท</div>
                      </div>
                      <div className="row" style={{ justifySelf: "right", width: "32%", height: 1, backgroundColor: "black" }}></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>


                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {name_cus}</div></div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>.......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้สั่งซื้อสินค้า</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........../............/.....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>

                  </div>
                  <div className="col-sm-1" style={{ justifyItems: "center" }}>

                  </div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row" >
                      <div className="row  "><div style={{ width: "100%", textAlign: "center", fontFamily: "Kanit", fontSize: 11, height: 60 }}>ในนาม {storeS}</div></div>

                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>......................................................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>ผู้อนุมัติ</div>
                      </div>
                      <div className="col">
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>........./.........../....................</div>
                        <div style={{ textAlign: "center", fontFamily: "kanit", fontSize: 10 }}>วันที่</div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>



            </div>




          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={reactToPrintFn2}>
              Print
            </button>

            <button
              className="btn btn-success"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={handleClick}>
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}

            </button>
            <button
              className="btn btn-secondary"
              style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
              onClick={() => setShowW(false)}>
              ปิด
            </button>

          </Modal_qa.Footer>
        </Modal_qa>

      </>

    )
  }


  // Before Sale
  function Beforepay() {


    //*********Loading*********************** */
    const [loading1, setLoading1] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 500));
      setatalist({
        ...alldatalist,
        discount: "0",
        usereward: "0",
        receivebaht: "0",
        bill: String(list.filter(item => item.qty > 0).length),
        code_costomer: code_cus,
        names: name_cus,
        id_costomer: id_cus,
        group_price: localStorage.getItem("countrow") || "",
        pay: "cash",
        totalPoint: String(totalPont),
        id_main: String(Date.now()),
        promotion: String(SumPro)
      }),
        setchangePay("1"),
        localStorage.setItem("showhead", "0"),
        localStorage.setItem("pay_s", "cash"),
        setMessage("0")
      fetchQT()



      setLoading(false);
    };

    const handleSave = () => list.length > 0 ? handleClick() : "";


    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        switch (key) {
          case 'f12':
            event.preventDefault();
            handleSave();
            break;

        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener('keydown', handleKeyDown as EventListener);

      return () => {
        window.removeEventListener('keydown', handleKeyDown as EventListener);
      };
    }, [handleSave /*, handlePrint, handleClear*/]);
    //****************************************** */

    const [drugs, setdrugs] = useState([])

    useEffect(() => {

      setTimeout(() => {
        setdrugs(JSON.parse(localStorage.getItem("dg") || "[]"))
      }, 1000);


      //setdrugs(JSON.parse(localStorage.getItem("dg")||"")) 
    }, [id_cus])

    /*
            const GetDrug = async () => {
               let companyS= (localStorage.getItem("company_") || "")
                try {
                  const res = await axios.get(`/api/${getdrugg}?company=${companyS}&id_cus=${Number(id_cus)}`)
                  
                    
                  id_cus!==undefined?  setdrugs(res.data):""
                  localStorage.setItem("dg",JSON.stringify(res.data))
             
                } catch (error) {
                  console.error(error)
                }
               
              }  

*/

    const [l, setlevel] = useState([])
    const { hasPermission } = usePermission()
    // การมองเห็น
    useEffect(() => {
    }, []);


    // Mobile-friendly styles for Beforepay
    const mobileCardStyle: React.CSSProperties = {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    };

    const cardHeaderStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px',
      paddingBottom: '10px',
      borderBottom: '2px solid #F3F8FC'
    };

    const headerIconStyle: React.CSSProperties = {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px'
    };

    const infoRowStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #f5f5f5'
    };

    const labelStyle: React.CSSProperties = {
      fontFamily: 'Kanit',
      fontSize: '12px',
      color: '#6b7280',
      minWidth: '80px',
      flexShrink: 0
    };

    const valueStyle: React.CSSProperties = {
      fontFamily: 'Kanit',
      fontSize: '13px',
      color: '#1f2937',
      fontWeight: 500,
      flex: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };

    const priceTagStyle: React.CSSProperties = {
      background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '20px',
      fontFamily: 'Kanit',
      fontSize: '14px',
      fontWeight: 600
    };

    const stockTagStyle: React.CSSProperties = {
      background: '#E5EEF8',
      color: '#2A6AAA',
      padding: '4px 12px',
      borderRadius: '20px',
      fontFamily: 'Kanit',
      fontSize: '12px',
      fontWeight: 500
    };

    const customerBadgeStyle: React.CSSProperties = {
      background: '#F3F8FC',
      color: '#2A6AAA',
      padding: '6px 12px',
      borderRadius: '8px',
      fontFamily: 'Kanit',
      fontSize: '13px',
      fontWeight: 500
    };

    const pointBadgeStyle: React.CSSProperties = {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      padding: '4px 10px',
      borderRadius: '16px',
      fontFamily: 'Kanit',
      fontSize: '12px',
      fontWeight: 600
    };

    const summaryCardStyle: React.CSSProperties = {
      background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      border: '2px solid #CCDFF1'
    };

    const totalAmountStyle: React.CSSProperties = {
      fontFamily: 'Kanit',
      fontSize: '28px',
      fontWeight: 700,
      color: '#2A6AAA',
      textAlign: 'center'
    };

    const actionButtonStyle: React.CSSProperties = {
      width: '100%',
      padding: '14px',
      borderRadius: '12px',
      border: 'none',
      fontFamily: 'Kanit',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };

    return (
      <div style={{ fontFamily: 'Kanit', padding: '8px' }}>

        {/* Summary & Actions Card - Hidden as per user request */}
        {/* 
        <div style={summaryCardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#173F6B', marginBottom: '4px' }}>ยอดรวมก่อนหักส่วนลด</div>
            <div style={totalAmountStyle}>
              ฿{list.map(num => num).reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
            </div>
            <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#2A6AAA', marginTop: '4px' }}>
              {list.filter(item => item.qty > 0).length} รายการ
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              disabled={list.length < 1}
              onClick={() => {
                deleteall();
                localStorage.setItem("itemlist", String(list.length));
                localStorage.setItem("dg", JSON.stringify([]));
                localStorage.setItem("his", JSON.stringify([{
                  followup: "", solution: "", id_history: "", count: "", statusH: "", duedate: new Date(), person: ""
                }]));
              }}
              style={{
                ...actionButtonStyle,
                flex: 1,
                background: list.length < 1 ? '#e5e7eb' : '#fee2e2',
                color: list.length < 1 ? '#9ca3af' : '#dc2626'
              }}
            >
              🗑️ ยกเลิกบิล
            </button>
          </div>

          <button
            disabled={list.length < 1 || savehis === "3" || loading}
            onClick={handleSave}
            style={{
              ...actionButtonStyle,
              background: (list.length < 1 || savehis === "3") ? '#e5e7eb' : 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
              color: (list.length < 1 || savehis === "3") ? '#9ca3af' : 'white',
              fontSize: '18px',
              padding: '16px'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <SpinnerIcon size={18} color="text-white" /> กำลังบันทึก...
              </span>
            ) : (
              <span>✅ ชำระสินค้า (F12)</span>
            )}
          </button>
        </div>
        */}

        {/* ข้อมูลสินค้า Card - Hidden as per user request */}
        {/*
        {addhis === 1 ? "" :
          addhis === 0 ?
            <div style={mobileCardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ ...headerIconStyle, background: '#E5EEF8' }}>📦</div>
                <div style={{ fontFamily: 'Kanit', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>ข้อมูลสินค้า</div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                {String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.pic)) !== "" && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      alt="product"
                      src={String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.pic))}
                      style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #f0f0f0' }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>
                    {String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.code))}
                  </div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '15px', fontWeight: 600, color: '#1f2937', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.ProductName))}
                  </div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
                    {String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.fixname))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={priceTagStyle}>
                      ฿{String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.price))}
                    </span>
                    <span style={stockTagStyle}>
                      คงเหลือ {itembalance.map((r: any) => r.balance)} {String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.Unit))}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px' }}>
                <div style={infoRowStyle}>
                  <span style={labelStyle}>📍 ที่เก็บ</span>
                  <span style={valueStyle}>{String(dataitem.filter((supplier: any) => supplier.code === codeproductS).map((supplier: any) => supplier.Area))}</span>
                </div>
                {(hasPermission("B2")) && (
                  <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
                    <span style={labelStyle}>💰 ราคาทุน</span>
                    <span style={{ ...valueStyle, color: '#f59e0b' }}>{Number(costS).toFixed(0)} บาท</span>
                  </div>
                )}
              </div>

              {alllabelitem.indicatorlistS && (
                <div style={{ marginTop: '12px', background: '#fef3c7', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#92400e', fontWeight: 600, marginBottom: '6px' }}>💊 สรรพคุณ</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#78350f' }}>{alllabelitem.indicatorlistS}</div>
                  {alllabelitem.useS && (
                    <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#92400e', marginTop: '4px' }}>
                      ข้อบ่งใช้: {alllabelitem.useS} {alllabelitem.timeuseS} {alllabelitem.timeS}
                    </div>
                  )}
                </div>
              )}
            </div>
            : ""
        }
        */}

        {/* ข้อมูลลูกค้า Card - Hidden as per user request */}
        {/*
        <div style={mobileCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ ...headerIconStyle, background: '#E5EEF8' }}>👤</div>
            <div style={{ fontFamily: 'Kanit', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>ข้อมูลลูกค้า</div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <Search_Cus />
          </div>

          {code_cus && (
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#9ca3af' }}>{code_cus}</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>{name_cus}</div>
                </div>
                {Number(total_cus) > 0 && (
                  <span style={pointBadgeStyle}>⭐ {total_cus} แต้ม</span>
                )}
              </div>

              {tel_cus && (
                <div style={{ ...infoRowStyle }}>
                  <span style={labelStyle}>📞 เบอร์โทร</span>
                  <span style={valueStyle}>{tel_cus}</span>
                </div>
              )}

              {congen_cus && (
                <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
                  <span style={labelStyle}>🏥 โรคประจำตัว</span>
                  <span style={{ ...valueStyle, color: '#dc2626' }}>{congen_cus}</span>
                </div>
              )}
            </div>
          )}

          {Number(id_cus) !== 0 && drugs?.length > 0 && (
            <div style={{ marginTop: '12px', background: '#fef2f2', borderRadius: '12px', padding: '12px', border: '2px solid #fecaca' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>⚠️ แพ้สินค้า</div>
              {drugs?.map((s: any) => (
                <div key={s.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  marginBottom: '6px',
                  borderRadius: '8px',
                  background: list.filter((w: any) => w.fixname === s.drugallergy).length > 0 ? '#dc2626' : 'white',
                  color: list.filter((w: any) => w.fixname === s.drugallergy).length > 0 ? 'white' : '#1f2937',
                  border: list.filter((w: any) => w.fixname === s.drugallergy).length > 0 ? 'none' : '1px solid #fecaca'
                }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: '12px', fontWeight: 500, flex: 1 }}>{s.drugallergy}</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '11px', opacity: 0.9 }}>{s.remark}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '12px' }}>
            <SpeechToText language="th-TH" />
          </div>
        </div>
        */}

        {/* Promotion Section */}
        {code_Promotion.length > 0 && (
          <div style={mobileCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ ...headerIconStyle, background: '#fef3c7' }}>🎁</div>
              <div style={{ fontFamily: 'Kanit', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                โปรโมชั่น ลด {(Number(P_percent.percent == undefined ? 0 : P_percent.percent.perscentTotal)) + Number(P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal)} บาท
              </div>
            </div>
            {code_Promotion.map((a: any) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', background: '#fef3c7', borderRadius: '10px', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: '13px', fontWeight: 600, color: '#92400e' }}>{a.name_promotion}</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#a16207' }}>{a.msg_condition} {a.msg_discount}</div>
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: '15px', fontWeight: 700, color: '#2A6AAA' }}>
                  -{list.reduce((acc, curr) => acc + curr.total, 0) >= Number(a.pay_condition)
                    ? a.unit === "percent" ? ((list.reduce((acc, curr) => acc + curr.total, 0) * Number(a.discount)) / 100).toFixed(0)
                      : a.unit === "baht" ? Number(a.discount) : 0
                    : 0} ฿
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }


  // After Sale
  function Afterpay() {


    const handleAutoPrint_rc = async () => {
      if (!isSilentPrintAvailable()) {
        alert("ไม่พบช่องทางการพิมพ์ของเครื่องนี้");
        return;
      }

      const content = `
        <div style="width: 67mm; background-color: white;  box-sizing: border-box; font-family: 'Kanit'; justify-self: left;">
          
          <div style="width: 100%; display: flex; justify-content: center; margin-bottom: 5px;">
             ${uploadedUrl ? `<img src="${String(uploadedUrl)}" style="width: 50px; height: 50px;" />` : ''}
          </div>

          <div style="text-align: center; font-size: 13px; font-family: 'Kanit';">ใบเสร็จรับเงิน</div>
          <div style="text-align: center; font-size: 17px; font-family: 'Kanit'; font-weight: bold;">${storeS}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">${addressS}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">เลขที่ผู้เสียภาษี : ${taxS}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">โทร : ${telS}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">--------------------------------------</div>
          
          <div style="font-size: 10px; font-family: 'Kanit'; text-align: left;">พนักงานขาย : เดชฤทธิ์ สอนสุระ</div>
           <div style="font-size: 10px; font-family: 'Kanit'; text-align: left;">
            วันที่ : ${new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}&nbsp;&nbsp;&nbsp;
            ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}
          </div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">--------------------------------------</div>
          <div style="font-size: 10px; font-family: 'Kanit'; text-align: left;">ลูกค้า : ${name_cus === "" ? "ลูกค้าทั่วไป" : name_cus}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">--------------------------------------</div>

          <!-- Header -->
          <div style="display: flex; font-size: 7px; font-family: 'Kanit'; font-weight: bold; border-bottom: 1px dashed black; padding-bottom: 2px; margin-bottom: 2px;">
             <div style="flex-grow: 1; text-align: left; width: 50%;">รายการ</div>
             <div style="text-align: center; width: 9%;">จำนวน</div>
             <div style="text-align: right; width: 9%;">หน่วย</div>
             <div style="text-align: right; width: 9%;">ราคา</div>
             <div style="text-align: right; width: 9%;">ลด/ชิ้น</div>
             <div style="text-align: right; width: 12%;">รวม</div>
          </div>

          <!-- List -->
          <div style="display: flex; flex-direction: column;">
            ${list.filter((q: any) => q.label === true).map((a: any) => `
              <div style="display: flex; font-size: 10px; font-family: 'Kanit'; font-weight: bold; margin-bottom: 2px;">
                <div style="flex-grow: 1; text-align: left; width: 50%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.name_product}</div>
                <div style="text-align: center; width: 9%;">${a.qty}</div>
                <div style="text-align: right; font-size: 6px; width: 9%;">${a.unit}</div>
                <div style="text-align: right; width: 9%;">${a.price}</div>
                <div style="text-align: right;  width: 9%;">${a.discount}</div>
                <div style="text-align: right; width: 12%;">${a.total}</div>
              </div>
            `).join('')}
          </div>

          <div style="text-align: center; font-size: 10px; font-family: 'Kanit'; margin-top: 5px;">--------------------------------------</div>
          <div style="font-size: 10px; font-family: 'Kanit'; text-align: left;">ทั้งหมด : ${list.length} รายการ    ชำระสินค้า : ${alldatalist.pay === "payment" ? "โอน" : alldatalist.pay === "cash" ? "เงินสด" : ""}</div>
          
          <!-- Footer Totals -->
          <div style="display: flex; margin-top: 10px;">
             <!-- Left side (Points) -->
             <div style="width: 30%;">
                
             </div>

             <!-- Right side (Money) -->
             <div style="width: 70%;">
                <div style="display: flex; font-size: 10px; font-family: 'Kanit'; justify-content: flex-end;">
                  <div style="text-align: right; margin-right: 5px;">รวมเงิน :</div>
                  <div style="width: 40px; text-align: right;">${list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                   <div style="width: 25px; text-align: right;">บาท</div>
                </div>
                <div style="display: flex; font-size: 10px; font-family: 'Kanit'; justify-content: flex-end;">
                  <div style="width: 60px; text-align: right; margin-right: 5px;">ส่วนลด :</div>
                   <div style="width: 40px; text-align: right;">${Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                   <div style="width: 25px; text-align: right;">บาท</div>
                </div>
                  <div style="display: flex; font-size: 10px; font-family: 'Kanit'; justify-content: flex-end;">
                  <div style="width: 70px; text-align: right; margin-right: 5px;">ใช้แต้มส่วนลด :</div>
                   <div style="width: 40px; text-align: right;">${parseInt(String(alldatalist.usereward))}</div>
                   <div style="width: 25px; text-align: right;">บาท</div>
                </div>
                 <div style=" display: flex; font-size: 11px; font-family: 'Kanit'; font-weight: bold; justify-content: flex-end; margin-top: 5px;">
                  <div style="width: 70px; text-align: right; margin-right: 5px;">ยอดรวมสุทธิ :</div>
                   <div style="width: 40px; text-align: right;">${Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
        - Number(alldatalist.discount)
        - Number(alldatalist.promotion)
        - Number(parseInt(alldatalist.usereward))
        }</div>
                   <div style="width: 25px; text-align: right;">บาท</div>
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


    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn1 = useReactToPrint({
      contentRef,
      print: async (iframe: HTMLIFrameElement) => {
        const html = iframe.contentDocument?.documentElement.outerHTML;

        if (html && isSilentPrintAvailable()) {
          handleAutoPrint_rc()
        } else {
          // เบราว์เซอร์ล้วน: ไม่มีช่องทางพิมพ์เงียบ ต้องเด้ง dialog ของระบบ
          await iframe.contentWindow?.print();
        }
      }
    })

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);




    const handleClick = async () => {

      setLoading(true);
      await new Promise((r) => setTimeout(r
        , 2000));

      SaleMainSubmit(),

        setMessage(""),
        localStorage.setItem("dg", JSON.stringify([]))


      setLoading(false);

      reactToPrintFn1()

    };

    //****************************************** */

    const handlePay = () => { handleClick() };
    const handlePrint = reactToPrintFn1;
    // const handlePrint1 = handleAutoPrint_rc;
    const handleback = () => {

      localStorage.setItem("showhead", String((Math.floor(Math.random() * 100) + 1))),
        setchangePay("2"),
        setMessage(""),
        localStorage.setItem("pay_s", "cash")
      setSelectedOption("cash")

    };


    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        switch (key) {
          case 'f12':
            event.preventDefault();
            handlePay();
            break;
          case 'f11':
            event.preventDefault();
            handlePrint();
            //    handlePrint1();
            break;
          case 'f10':
            event.preventDefault();
            handleback();
            break;

        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener('keydown', handleKeyDown as EventListener);

      return () => {
        window.removeEventListener('keydown', handleKeyDown as EventListener);
      };
    }, [handlePay, handlePrint, handleback]);





    return (

      <div>
        {/*Detail code สินค้า*/}
        <div className="row-sm shadow-sm rounded border border-1 " style={{ height: "89vh", backgroundColor: "white" }}>
          <div className="row  justify-content-start mt-2 mb-2">
            <div className="container-fluid" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 20 }}>สรุปข้อมูลการขาย</div>
          </div>



          <div className="row">
            <div className="col-sm-7">
              <div className="row  justify-content-start mt-1">
                <div className="col-3" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 13, width: 130, marginLeft: 10 }}>วันที่ :</div>
                <div className="col-sm" style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 14, width: 100 }}>
                  {new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}&nbsp;&nbsp;&nbsp;
                  {new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}

                </div>
              </div>
              <div className="row  ">
                <div className="col-3" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 15, width: 130, marginLeft: 10 }}>สมาชิก :</div>
                <div className="col-3" style={{ textAlign: "left", fontFamily: "Kanit_B", fontSize: 15, width: 180 }}>{code_cus === "" ? "ลูกค้าทั่วไป" : code_cus}&nbsp;&nbsp;&nbsp;{name_cus}</div>

              </div>
              <div className="col-sm" >
                <div className="row mt-3">
                  <div className="col-3-sm" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 13, width: 130 }}>แต้มทั้งหมด :</div>
                  <div className="col-1" style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 15, width: 50 }}>{code_cus === "" ? 0 : total_cus}</div>
                  <div className="col-3" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 15, width: 30 }}>แต้ม</div>
                </div>
                <div className="row mt-1">
                  <div className="col-3-sm" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 13, width: 130 }}>แต้มยอดบิล :</div>
                  <div className="col-1" style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 15, width: 50 }}>
                    {
                      isNaN(parseInt(String(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) / (Number(SaleS) / Number(pointeqS))))) === true ? 0 :
                        parseInt(String(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) / (Number(SaleS) / Number(pointeqS))))
                    }</div>
                  <div className="col-3" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 15, width: 30 }}>แต้ม</div>
                </div>
                <div className="row mt-1">
                  <div className="col-3-sm" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 13, width: 130 }}>แต้มรวม :</div>
                  <div className="col-1" style={{ textAlign: "center", fontFamily: "Kanit_B", fontSize: 15, width: 50 }}>
                    {
                      isNaN(parseInt(String((Number(total_cus) + Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) / (Number(SaleS) / Number(pointeqS)))))) === true ? 0 :
                        parseInt(String((Number(total_cus) + Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)) / (Number(SaleS) / Number(pointeqS)))))
                    }</div>
                  <div className="col-3" style={{ textAlign: "left", fontFamily: "Kanit", fontSize: 15, width: 30 }}>แต้ม</div>
                </div>
              </div>






              <div className="d-flex mt-2">
                <div className="d-flex justify-content-end" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 16, width: 130, marginRight: 10, marginTop: 15 }}>ยอดรวม :</div>
                <div className="d-flex justify-content-start" >
                  <input
                    name="names"
                    disabled={true}
                    value={list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)}
                    onChange={(e) => setatalist({ ...alldatalist, discount: e.target.value })}
                    className="form-control form-control-sm "
                    placeholder=""
                    style={{ fontFamily: "Kanit_B", width: 80, textAlign: "center", fontSize: 20, height: 50 }}
                  />
                </div>

                <div className="d-flex justify-content-start" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 16, marginLeft: 10, height: 40, marginTop: 15, width: 50 }} >บาท</div>


                <div className="d-flex justify-content-end" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 16, width: 100, marginRight: 10, marginTop: 15 }}>รับเงิน :</div>
                <div className="d-flex justify-content-start" >
                  <Rereveive_s />
                </div>
                <div className="d-flex justify-content-start" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 16, marginLeft: 10, height: 40, marginTop: 15, width: 50 }} >บาท</div>
              </div>

              <div className="d-flex mt-3 mb-3">
                <div className="d-flex justify-content-end" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 16, width: 130, marginRight: 10, marginTop: 15 }}>ใช้แต้มส่วนลด :</div>
                <div className="d-flex justify-content-start" >
                  <Usereward_s />
                </div>
                <div className="d-flex justify-content-start" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 16, marginLeft: 10, height: 40, marginTop: 15, width: 50 }} >บาท</div>

                <div className="d-flex justify-content-end" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 16, width: 100, marginRight: 10, marginTop: 15 }}>ยอดสุทธิ :</div>
                <div className="d-flex justify-content-start" >
                  <input
                    name="names"
                    value={
                      Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                      - Number(alldatalist.discount)
                      - Number(alldatalist.promotion)
                      - Number(isNaN(Number(parseInt(alldatalist.usereward))) === true ? 0 : isNaN(Number(parseInt(alldatalist.usereward))))
                    }
                    disabled={true}
                    className="form-control form-control-sm mt-1"
                    placeholder=""
                    style={{ fontFamily: "Kanit_B", width: 80, textAlign: "center", fontSize: 20, height: 50 }}
                  />
                </div>
                <div className="d-flex justify-content-start" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 16, marginLeft: 10, height: 40, marginTop: 15, width: 50 }} >บาท</div>
              </div>

              <div className="d-flex ">
                <div className="d-flex justify-content-end" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 16, width: 130, marginRight: 10, marginTop: 15 }}>ส่วนลด :</div>
                <div className="d-flex justify-content-start" >
                  <Discount_s />
                </div>
                <div className="d-flex justify-content-start" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 16, marginLeft: 10, height: 40, marginTop: 15, width: 50 }} >บาท</div>

                <div className="d-flex justify-content-end" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 16, width: 100, marginRight: 10, marginTop: 15 }}>เงินทอน :</div>
                <div className="d-flex justify-content-start" >
                  <input
                    name="names"
                    value={Number(alldatalist.receivebaht)
                      - (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                        - Number(alldatalist.discount)
                        - Number(alldatalist.promotion)
                        - Number(isNaN(Number(parseInt(alldatalist.usereward))) === true ? 0 : isNaN(Number(parseInt(alldatalist.usereward)))))
                    }
                    //   onChange={(e)=>setatalist({...alldatalist, discount:e.target.value })}
                    className="form-control form-control-sm mt-1"
                    placeholder=""
                    disabled={true}
                    style={{ fontFamily: "Kanit_B", width: 80, textAlign: "center", fontSize: 20, height: 50 }}
                  />
                </div>
                <div className="d-flex justify-content-start" style={{ textAlign: "center", fontFamily: "Kanit", fontSize: 16, marginLeft: 10, height: 40, marginTop: 15, width: 50 }} >บาท</div>
              </div>
              <div className="d-flex mt-3 mb-3" style={{ justifySelf: "center" }}>
                <div className="col-3" style={{ textAlign: "right", fontFamily: "Kanit", fontSize: 16, width: 130, marginRight: 10 }}>ช่องทางชำระ :</div>
                <Radio_pay />



              </div>
              <div className="d-flex  mt-3" style={{ justifySelf: "center", fontSize: 13, marginTop: 5, fontFamily: "Kanit", color: "red" }}>

                {(Number(alldatalist.receivebaht)
                  - (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                    - Number(alldatalist.discount)
                    - Number(alldatalist.promotion)
                    - Number(parseInt(alldatalist.usereward)))
                ) >= 0 ? "" : "ไม่สามารถกำชำระสินค้าได้ เนื่องจากเงินทอนติดลบ"

                }


              </div>
              <div className="d-flex " style={{ backgroundColor: "white", width: "100%", justifyContent: "center" }}>

                <div className=" d-flex m-1" >


                  <button
                    onClick={handlePrint}
                    type="button"
                    disabled={Number(alldatalist.receivebaht)
                      - (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                        - Number(alldatalist.discount)
                        - Number(alldatalist.promotion)
                        - Number(parseInt(alldatalist.usereward)))
                      >= 0 ? false : true}
                    className="btn btn-secondary"
                    style={{ width: 140, height: 55, fontSize: 15, marginTop: 5, fontFamily: "Kanit" }}>
                    พิมพ์ใบเสร็จ <div style={{ fontSize: 12, fontFamily: "Kanit" }}>(F11)</div>
                  </button>

                  <button

                    onClick={handlePay}

                    type="button"
                    disabled={Number(alldatalist.receivebaht)
                      - (Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                        - Number(alldatalist.discount)
                        - Number(alldatalist.promotion)
                        - Number(parseInt(alldatalist.usereward)))
                      >= 0 ? false : true || loading}
                    className="btn btn-success"
                    style={{ width: 170, height: 55, fontSize: 18, marginTop: 5, fontFamily: "Kanit", marginLeft: 10 }}>
                    {loading ? (
                      <>
                        <SpinnerIcon size={18} color="text-white" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <span>ชำระสินค้า <div style={{ fontSize: 12, fontFamily: "Kanit" }}>(F12)</div></span>
                    )}
                  </button>

                  <button onClick={handleback}

                    /* setatalist({...alldatalist,
                     sumtotal:String(Number(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))
                              -Number(alldatalist.discount)-Number(alldatalist.usereward)),
                            }),console.log(alldatalist),console.log(list)*/

                    type="button" className="btn btn-secondary" style={{ width: 100, height: 55, fontSize: 15, marginTop: 5, fontFamily: "Kanit", marginLeft: 10 }}>
                    กลับ <div style={{ fontSize: 12, fontFamily: "Kanit" }}>(F10)</div>
                  </button>

                </div>

              </div>
              <div className="row" style={{ justifyContent: "center" }}>

                <QuotationTemplate /> {/**ใบเสนอราคา */}
                <BillTemplate />     {/**ใบวางบิล */}
                <InvoiceTemplate />  {/**ใบแจ้งหนี้ */}
                <ReTemplate />        {/**ใบเสร็จรับเงิน */}

              </div>



            </div>


            {/** Slip */}
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






        </div>




      </div>

    )
  }





  const [isChecked, setIsChecked] = useState(true);

  const handleCheckboxChange = (event: any) => {
    setIsChecked(event.target.checked);
  };


  //${"50"}
  //Print Label
  const handleAutoPrint_label = async () => {
    if (!isSilentPrintAvailable()) {
      alert("ไม่พบช่องทางการพิมพ์ของเครื่องนี้");
      return;
    }


    const selectedOption1 = typeof window !== 'undefined' ? localStorage.getItem("lg") || 'th' : 'th';
    const content = ReactDOMServer.renderToStaticMarkup(
      <div style={{ width: "100mm", fontFamily: "Kanit" }}>
        {list.filter((q: any) => q.label === true).map((a: any) => (
          <div key={a.id} id="selcet-print" className='col-12 rounded border border-2 shadow shadow-sm' style={{ height: 200, backgroundColor: "white", marginBottom: "10px", pageBreakInside: "avoid" }}  >
            <div className='row' >

              <Container style={{ height: 60 }}>
                {allS === false ?
                  <Row >
                    {logoS === true ?
                      <Col sm={2}>
                        <div style={{ maxWidth: 45, width: 45, marginTop: 5, justifyItems: "center", marginLeft: 5 }}>
                          <img alt={""} src={String(uploadedUrl)} width={55} height={50} />

                        </div>
                      </Col>
                      : ""}
                    <Col sm={5} style={{ marginLeft: logoS === true ? 10 : 35 }}>
                      <div className='row'>
                        <div className={logoS === true ? 'col-8' : 'col-9'} style={{ fontFamily: "kanit_B", fontSize: 16, textAlign: "start", width: "100%" }}>{storeS}</div>

                      </div>
                      <div style={{ fontFamily: "kanit", fontSize: 9, width: 200 }}>{addressS}{" โทร : "}  {telS}</div>
                      <div className='row rounded  shadow shadow mb-2' style={{ borderColor: "black", fontFamily: "kanit", height: 2, fontSize: 10, backgroundColor: "black" }}></div>
                    </Col>
                    {lineS === true ?
                      <Col sm={2}>
                        <div style={{ maxWidth: 45, width: 45, marginLeft: 10 }}>
                          <img alt={""} src={String(uploadedUrl1)} width={60} height={60} />
                          <div style={{ fontFamily: "kanit", fontSize: 8, textAlign: "center" }}>Line ร้านค้า</div>
                        </div>
                      </Col> : ""}
                  </Row> : ""}
              </Container>


              <div>
                {allS === true ? <div className='row ' style={{ marginLeft: 8, backgroundColor: "black", width: "95%", borderColor: "black", height: 2 }}></div> : ""}
                <div className='row mt-1'>
                  <div className='col-auto me-auto ' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "start", marginLeft: 5 }}>{typeof name_cus !== "undefined" && name_cus === "" ? "ลูกค้าทั่วไป" : typeof name_cus !== "undefined" ? name_cus : "ลูกค้าทั่วไป"}</div>
                  <div className='col-auto' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", marginRight: 10 }}>{new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>
                </div>


                <div className='row' style={{ height: "20vh" }}>
                  <div className='col-9 me-auto'>

                    <div className='d-flex' style={{ fontFamily: "kanit_B", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{a.name_product}</div>
                    <div
                      className='d-flex'
                      style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>

                      {
                        selectedOption1 === "th" ? a.indicatorlistS :
                          selectedOption1 === "my" ? a.my_indicatorlistS :
                            selectedOption1 === "lo" ? a.lo_indicatorlistS :
                              selectedOption1 === "en" ? a.en_indicatorlistS :
                                selectedOption1 === "zh-CN" ? a.zh_indicatorlistS :
                                  selectedOption1 === "ms" ? a.ms_indicatorlistS :
                                  ""}

                    </div>


                    <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                      <div
                        className='d-flex'
                        style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>

                        {
                          selectedOption1 === "th" ? a.useS :
                            selectedOption1 === "my" ? a.my_useS :
                              selectedOption1 === "lo" ? a.lo_useS :
                                selectedOption1 === "en" ? a.en_useS :
                                  selectedOption1 === "zh-CN" ? a.zh_useS :
                                    selectedOption1 === "ms" ? a.ms_useS :
                                    ""}
                        &nbsp;&nbsp;&nbsp;
                        {
                          selectedOption1 === "th" ? a.timeuseS :
                            selectedOption1 === "my" ? a.my_timeuseS :
                              selectedOption1 === "lo" ? a.lo_timeuseS :
                                selectedOption1 === "en" ? a.en_timeuseS :
                                  selectedOption1 === "zh-CN" ? a.zh_timeuseS :
                                    selectedOption1 === "ms" ? a.ms_timeuseS :
                                    ""}

                      </div>


                    </div>


                    {/**     <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.timeuseS}</div>*/}


                    <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                      {/**  {a.timeS} */}
                      <div
                        className='d-flex'
                        style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>

                        {
                          selectedOption1 === "th" ? a.timeS :
                            selectedOption1 === "my" ? a.my_timeS :
                              selectedOption1 === "lo" ? a.lo_timeS :
                                selectedOption1 === "en" ? a.en_timeS :
                                  selectedOption1 === "zh-CN" ? a.zh_timeS :
                                    selectedOption1 === "ms" ? a.ms_timeS :
                                    ""}
                        &nbsp;&nbsp;&nbsp;
                        {
                          selectedOption1 === "th" ? a.keepS :
                            selectedOption1 === "my" ? a.my_keepS :
                              selectedOption1 === "lo" ? a.lo_keepS :
                                selectedOption1 === "en" ? a.en_keepS :
                                  selectedOption1 === "zh-CN" ? a.zh_keepS :
                                    selectedOption1 === "ms" ? a.ms_keepS :
                                    ""}

                      </div>


                    </div>
                    {/**   <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.keepS}</div>*/}


                    <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                      {/**     {a.remarkS}*/}
                      <div
                        className='d-flex'
                        style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>

                        หมายเหตุ : {
                          selectedOption1 === "th" ? a.remarkS :
                            selectedOption1 === "my" ? a.my_remarkS :
                              selectedOption1 === "lo" ? a.lo_remarkS :
                                selectedOption1 === "en" ? a.en_remarkS :
                                  selectedOption1 === "zh-CN" ? a.zh_remarkS :
                                    selectedOption1 === "ms" ? a.ms_remarkS :
                                    "."}

                      </div>

                    </div>
                    <div className='row mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>เภสัชกร : {postsEmp.filter((a: any) => a.position === "เภสัชกรประจำร้าน").map((b: any) => b.name)}</div>
                  </div>


                  <div className='col-3' style={{ marginTop: 60 }}>

                    <div style={{ height: "auto", margin: "0 auto", maxWidth: 40, width: "100%" }}>


                      <QRCode
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={a.barcode}
                        viewBox={"0 0 256 256"}
                      />


                    </div>
                    <div style={{ fontFamily: "kanit", fontSize: 8, textAlign: "left", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{a.barcode}</div>
                  </div>

                </div>
              </div>



            </div>
          </div>
        ))}
      </div>
    );

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


  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    print: async (iframe: HTMLIFrameElement) => {
      const html = iframe.contentDocument?.documentElement.outerHTML;

      if (html) {
        await iframe.contentWindow?.print();
      }
    }
  })


  // ตั้งค่่าฉลากยา
  function SetLabel() {

    const [listS, setListS] = useState<any[]>([]); // กำหนด Type ให้เป็น Array ของอะไรบางอย่าง
    const [listL, setlistL] = useState(list)



    const handlelabel = () => {

      list.length > 0 ? onOpen() : "",
        localStorage.setItem("lg", "th"),
        setListS(list)
    };






    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        switch (key) {
          case 'f11':
            event.preventDefault();
            handlelabel();
            break;

        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener('keydown', handleKeyDown as EventListener);

      return () => {
        window.removeEventListener('keydown', handleKeyDown as EventListener);
      };
    }, [handlelabel /*, handlePrint, handleClear*/]);


    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [selectedOption1, setSelectedOption1] = useState('th');  // Initial selected value
    //  const listS=JSON.parse(localStorage.getItem("listS") || "") ===undefined?[]:JSON.parse(localStorage.getItem("listS") || "")






    const handleOptionChange2 = (e: any) => {
      localStorage.setItem("lg", e.target.value)
      const { name, value } = e.target;
      setSelectedOption1(e.target.value);
      console.log(list)
    };

    const [showA, setShowA] = useState(false);
    const [showB, setShowB] = useState(false);
    const [showC, setShowC] = useState(false);
    const [showD, setShowD] = useState(false);

    const toggleShowA = () => setShowA(!showA);
    const toggleShowB = () => setShowB(!showB);
    const toggleShowC = () => setShowC(!showC);
    const toggleShowD = () => setShowD(!showD);

    const [num, setNum] = useState(0)
    const [code_pro, setId_pro] = useState("")
    const [id_Name, setName_pro] = useState("")

    const [windiE, setIndiE] = useState("")
    //Indicator   
    const IndiShow = () => {
      const [indiE, wsetIndiE] = useState(windiE)
      const IndiInput = (e: any) => {
        wsetIndiE(e.target.value)
      }
      return (
        <Toast show={showA} onClose={toggleShowA}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข ข้อบ่งใช้ == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={indiE}
                onChange={IndiInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{ fontFamily: "Kanit", width: "70%", textAlign: "start", fontSize: 12 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, indicatorlistS: String(indiE) } : task
                  )), setShowA(!showA)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }

    const [wuseE, setuseE] = useState("")
    //Use     
    const UseShow = () => {
      const [useE, wsetuseE] = useState(wuseE)
      const useInput = (e: any) => {
        wsetuseE(e.target.value)
      }
      return (
        <Toast show={showB} onClose={toggleShowB}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข วิธีและช่วงเวลา == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={useE}
                onChange={useInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{ fontFamily: "Kanit", width: "70%", textAlign: "start", fontSize: 12 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, useS: String(useE), timeuseS: String("") } : task
                  )), setShowB(!showB)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }

    const [wtimeE, settimeE] = useState("")
    //timeS      
    const TimeShow = () => {
      const [timeE, wsettimeE] = useState(wtimeE)
      const timeInput = (e: any) => {
        wsettimeE(e.target.value)
      }


      return (
        <Toast show={showC} onClose={toggleShowC}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข ช่วงเวลาและวิธีเก็บ == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={timeE}
                onChange={timeInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{ fontFamily: "Kanit", width: "70%", textAlign: "start", fontSize: 12 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, timeS: String(timeE), keepS: String("") } : task
                  )), setShowC(!showC)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }

    const [remarkE, setremarkE] = useState("")
    //RemarkS   
    const RemarkShow = () => {
      const [wremarkE, wsetremarkE] = useState(remarkE)
      const remarkInput = (e: any) => {
        wsetremarkE(e.target.value)
      }
      return (
        <Toast show={showD} onClose={toggleShowD}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto" style={{ fontFamily: "Kanit", width: "100%", textAlign: "start", fontSize: 10 }}>แก้ไข หมายเหตุ == {id_Name}</strong>

          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={wremarkE}
                onChange={remarkInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{ fontFamily: "Kanit", width: "70%", textAlign: "start", fontSize: 12 }}

              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setlistL(listL.map((task: any) => task.code_product === code_pro ?
                    { ...task, remarkS: String(wremarkE) } : task
                  )), setShowD(!showD)
                }}
                style={{ fontFamily: "Kanit", width: "20%", textAlign: "center", fontSize: 12, marginLeft: 5 }}>
                ตกลง
              </button>
            </div>

          </Toast.Body>
        </Toast>
      )
    }


    return (
      <div className="" style={{ backgroundColor: "white" }}>
        <button

          disabled={list.length < 1 ? true : false}
          className="btn btn-warning "
          style={{ height: 30, fontSize: 11, marginTop: 5, marginLeft: 5, fontFamily: "Kanit" }}
          onClick={handlelabel}>
          พิมพ์ฉลากสินค้า (F11)
        </button>



        <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior={"inside"} >
          <ModalContent className=" shadow-sm rounded rounded-2 border border" style={{ backgroundColor: "rgba(255, 255, 255, 1)", width: "35vw", height: "98vh" }}>

            {(onClose) => (
              <>
                <ModalHeader style={{ height: 60, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                  <div className="col">
                    <div className="row" style={{ width: "100%", height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>เลือกภาษา :


                      <>
                        <div className="col" >
                          <label style={{ fontFamily: "Kanit", fontSize: 15, width: 70 }}>
                            <input
                              type="radio"
                              name="th" // Same name for all radio buttons in the group
                              value="th"
                              checked={selectedOption1 === 'th'} // Controlled by state
                              onChange={handleOptionChange2}

                              style={{ marginRight: 10, fontFamily: "Kanit" }}
                            />
                            ไทย
                          </label>


                          <label style={{ fontFamily: "Kanit", fontSize: 15, width: 70 }}>
                            <input
                              type="radio"
                              name="my" // Same name for all radio buttons in the group
                              value="my"
                              checked={selectedOption1 === 'my'} // Controlled by state
                              onChange={handleOptionChange2}

                              style={{ marginRight: 10, fontFamily: "Kanit" }}
                            />
                            พม่า
                          </label>

                          <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                            <input
                              type="radio"
                              name="lo"
                              value="lo"
                              checked={selectedOption1 === 'lo'}
                              onChange={handleOptionChange2}

                              style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
                            />
                            ลาว
                          </label>

                          <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                            <input
                              type="radio"
                              name="en"
                              value="en"
                              checked={selectedOption1 === 'en'}
                              onChange={handleOptionChange2}

                              style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
                            />
                            อังกฤษ
                          </label>

                          <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                            <input
                              type="radio"
                              name="zh-CN"
                              value="zh-CN"
                              checked={selectedOption1 === 'zh-CN'}
                              onChange={handleOptionChange2}

                              style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
                            />
                            จีน
                          </label>

                          <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                            <input
                              type="radio"
                              name="ms"
                              value="ms"
                              checked={selectedOption1 === 'ms'}
                              onChange={handleOptionChange2}

                              style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
                            />
                            บาฮาซา
                          </label>

                        </div>

                      </>


                    </div>
                  </div>
                </ModalHeader>
                <ModalBody >
                  <div className="col">
                    <div className="col" style={{ textAlign: "center" }}>
                      <Table className="table" size="sm"  >
                        <tbody className="table-group-divider">
                          <tr className="">
                            <th scope="row" className={styles.bodydetailTable_Re1} style={{ width: "15%" }}>

                              <div className='row mt-1' style={{ justifyContent: "center" }} ref={contentRef}>

                                {listL.filter((q: any) => q.label === true).map((a: any) =>
                                  <div key={a.id} id="selcet-print" className='col-9 rounded border border-2 shadow shadow-sm' style={{ height: 200, backgroundColor: "white" }}  >
                                    <div className='row' >

                                      <div className='row' style={{ height: 60 }}>
                                        {allS === false ?
                                          <div className='row' >
                                            {logoS === true ?
                                              <div className='col-2 '>
                                                <div style={{ height: "auto", margin: "0 auto", maxWidth: 45, width: 45, marginTop: 5, justifyItems: "center", marginLeft: 5 }}>
                                                  <img alt={""} src={String(uploadedUrl)} width={55} height={50} />

                                                </div>
                                              </div>
                                              : ""}
                                            <div className={logoS === true ? 'col-8' : 'col-9'} style={{ marginLeft: logoS === true ? 10 : 35 }}>
                                              <div className='row'>
                                                <div className={logoS === true ? 'col-8' : 'col-9'} style={{ fontFamily: "kanit_B", fontSize: 16, textAlign: "start", width: "100%" }}>{storeS}</div>

                                              </div>
                                              <div style={{ fontFamily: "kanit", fontSize: 9, width: 200 }}>{addressS}{" โทร : "}  {telS}</div>
                                              <div className='row rounded  shadow shadow mb-2' style={{ borderColor: "black", fontFamily: "kanit", height: 2, fontSize: 10, backgroundColor: "black" }}></div>
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
                                        {allS === true ? <div className='row ' style={{ marginLeft: 8, backgroundColor: "black", width: "95%", borderColor: "black", height: 2 }}></div> : ""}
                                        <div className='row mt-1'>
                                          <div className='col-auto me-auto ' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "start", marginLeft: 5 }}>{name_cus === "" ? "ลูกค้าทั่วไป" : name_cus}</div>
                                          <div className='col-auto' style={{ fontFamily: "kanit", fontSize: 10, textAlign: "end", marginRight: 10 }}>{new Date().toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric', })}</div>
                                        </div>


                                        <div className='row' style={{ height: "20vh" }}>
                                          <div className='col-8 me-auto'>

                                            <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 350 }}>{a.name_product}</div>
                                            <button
                                              className='d-flex'
                                              onClick={() => {
                                                setShowA(!showA),
                                                  setId_pro(a.code_product)
                                                setName_pro(a.name_product)
                                                setNum(1)
                                                setIndiE(
                                                  selectedOption1 === "th" ? a.indicatorlistS :
                                                    selectedOption1 === "my" ? a.my_indicatorlistS :
                                                      selectedOption1 === "lo" ? a.lo_indicatorlistS :
                                                        selectedOption1 === "en" ? a.en_indicatorlistS :
                                                          selectedOption1 === "zh-CN" ? a.zh_indicatorlistS :
                                                            selectedOption1 === "ms" ? a.ms_indicatorlistS :
                                                            "")
                                              }}
                                              style={{ fontFamily: "kanit", fontSize: 13, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 350 }}>

                                              {
                                                selectedOption1 === "th" ? a.indicatorlistS :
                                                  selectedOption1 === "my" ? a.my_indicatorlistS :
                                                    selectedOption1 === "lo" ? a.lo_indicatorlistS :
                                                      selectedOption1 === "en" ? a.en_indicatorlistS :
                                                        selectedOption1 === "zh-CN" ? a.zh_indicatorlistS :
                                                          selectedOption1 === "ms" ? a.ms_indicatorlistS :
                                                          ""}

                                            </button>


                                            <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: "20vw" }}>
                                              <button
                                                className='d-flex'
                                                onClick={() => {
                                                  setShowB(!showB),
                                                    setId_pro(a.code_product)
                                                  setName_pro(a.name_product)
                                                  setNum(2)
                                                  setuseE(
                                                    selectedOption1 === "th" ? a.useS + "  " + a.timeuseS :
                                                      selectedOption1 === "my" ? a.my_useS + "  " + a.my_timeuseS :
                                                        selectedOption1 === "lo" ? a.lo_useS + "  " + a.lo_timeuseS :
                                                          selectedOption1 === "en" ? a.en_useS + "  " + a.en_timeuseS :
                                                            selectedOption1 === "zh-CN" ? a.zh_useS + "  " + a.zh_timeuseS :
                                                              selectedOption1 === "ms" ? a.ms_useS + "  " + a.ms_timeuseS :
                                                              "")
                                                }}
                                                style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 350 }}>

                                                {
                                                  selectedOption1 === "th" ? a.useS :
                                                    selectedOption1 === "my" ? a.my_useS :
                                                      selectedOption1 === "lo" ? a.lo_useS :
                                                        selectedOption1 === "en" ? a.en_useS :
                                                          selectedOption1 === "zh-CN" ? a.zh_useS :
                                                            selectedOption1 === "ms" ? a.ms_useS :
                                                            ""}
                                                &nbsp;&nbsp;&nbsp;
                                                {
                                                  selectedOption1 === "th" ? a.timeuseS :
                                                    selectedOption1 === "my" ? a.my_timeuseS :
                                                      selectedOption1 === "lo" ? a.lo_timeuseS :
                                                        selectedOption1 === "en" ? a.en_timeuseS :
                                                          selectedOption1 === "zh-CN" ? a.zh_timeuseS :
                                                            selectedOption1 === "ms" ? a.ms_timeuseS :
                                                            ""}

                                              </button>


                                            </div>


                                            {/**     <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.timeuseS}</div>*/}


                                            <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 350 }}>
                                              {/**  {a.timeS} */}
                                              <button
                                                className='d-flex'
                                                onClick={() => {
                                                  setShowC(!showC),
                                                    setId_pro(a.code_product)
                                                  setName_pro(a.name_product)
                                                  setNum(3)
                                                  settimeE(
                                                    selectedOption1 === "th" ? a.timeS + "  " + a.keepS :
                                                      selectedOption1 === "my" ? a.my_timeS + "  " + a.my_keepS :
                                                        selectedOption1 === "lo" ? a.lo_timeS + "  " + a.lo_keepS :
                                                          selectedOption1 === "en" ? a.en_timeS + "  " + a.en_keepS :
                                                            selectedOption1 === "zh-CN" ? a.zh_timeS + "  " + a.zh_keepS :
                                                              selectedOption1 === "ms" ? a.ms_timeS + "  " + a.ms_keepS :
                                                              "")
                                                }}
                                                style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 350 }}>

                                                {
                                                  selectedOption1 === "th" ? a.timeS :
                                                    selectedOption1 === "my" ? a.my_timeS :
                                                      selectedOption1 === "lo" ? a.lo_timeS :
                                                        selectedOption1 === "en" ? a.en_timeS :
                                                          selectedOption1 === "zh-CN" ? a.zh_timeS :
                                                            selectedOption1 === "ms" ? a.ms_timeS :
                                                            ""}
                                                &nbsp;&nbsp;&nbsp;
                                                {
                                                  selectedOption1 === "th" ? a.keepS :
                                                    selectedOption1 === "my" ? a.my_keepS :
                                                      selectedOption1 === "lo" ? a.lo_keepS :
                                                        selectedOption1 === "en" ? a.en_keepS :
                                                          selectedOption1 === "zh-CN" ? a.zh_keepS :
                                                            selectedOption1 === "ms" ? a.ms_keepS :
                                                            ""}

                                              </button>


                                            </div>
                                            {/**   <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.keepS}</div>*/}


                                            <div className='d-flex' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 250 }}>
                                              {/**     {a.remarkS}*/}
                                              <button
                                                className='d-flex'
                                                onClick={() => {
                                                  setShowD(!showD),
                                                    setId_pro(a.code_product)
                                                  setName_pro(a.name_product)
                                                  setNum(4)
                                                  setremarkE(
                                                    selectedOption1 === "th" ? a.remarkS :
                                                      selectedOption1 === "my" ? a.my_remarkS :
                                                        selectedOption1 === "lo" ? a.lo_remarkS :
                                                          selectedOption1 === "en" ? a.en_remarkS :
                                                            selectedOption1 === "zh-CN" ? a.zh_remarkS :
                                                              selectedOption1 === "ms" ? a.ms_remarkS :
                                                              "")
                                                }}
                                                style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 250 }}>

                                                หมายเหตุ : {
                                                  selectedOption1 === "th" ? a.remarkS :
                                                    selectedOption1 === "my" ? a.my_remarkS :
                                                      selectedOption1 === "lo" ? a.lo_remarkS :
                                                        selectedOption1 === "en" ? a.en_remarkS :
                                                          selectedOption1 === "zh-CN" ? a.zh_remarkS :
                                                            selectedOption1 === "ms" ? a.ms_remarkS :
                                                            "."}

                                              </button>

                                            </div>
                                            <div className='row mt-1' style={{ fontFamily: "kanit", fontSize: 11, textAlign: "start", marginLeft: 5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 200 }}>เภสัชกร : {postsEmp.filter((a: any) => a.position === "เภสัชกรประจำร้าน").map((b: any) => b.name)}</div>
                                          </div>


                                          <div className='col-3' style={{ marginTop: 60 }}>

                                            <div style={{ height: "auto", margin: "0 auto", maxWidth: 40, width: "100%" }}>


                                              <QRCode
                                                size={256}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                value={a.barcode}
                                                viewBox={`0 0 256 256`}
                                              />


                                            </div>
                                            <div style={{ fontFamily: "kanit", fontSize: 8, textAlign: "left", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis", width: 95 }}>{a.barcode}</div>
                                          </div>

                                        </div>
                                      </div>



                                    </div>
                                  </div>

                                )}

                              </div>


                            </th>
                          </tr>
                        </tbody>
                      </Table>


                    </div>
                  </div>

                </ModalBody>


                <ModalFooter className="d-flex border " style={{ height: showA === true || showB === true || showC === true || showD === true ? 150 : 70, backgroundColor: "rgba(241, 241, 241, 1)" }}>



                  <button
                    className="btn btn-success"

                    style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                    onClick={reactToPrintFn}
                  >
                    OK
                  </button>




                  <button
                    className="btn btn-secondary"
                    style={{ width: 80, height: 35, fontSize: 15, fontFamily: "Kanit" }}
                    onClick={() => onClose()}
                  >
                    Close
                  </button>


                  {
                    num === 1 ? <IndiShow /> :
                      num === 2 ? <UseShow /> :
                        num === 3 ? <TimeShow /> :
                          num === 4 ? <RemarkShow /> :
                            ""

                  }

                </ModalFooter>


              </>
            )}
          </ModalContent>
        </Modal>



      </div>

    )

  }


  const [drugs, setdrugs] = useState([])
  const [mu, setmu] = useState("")

  useEffect(() => {

    setTimeout(() => {
      setdrugs(JSON.parse(localStorage.getItem("dg") || "[]"))
      setmu(localStorage.getItem("mu") || "")
    }, 1000);


    //setdrugs(JSON.parse(localStorage.getItem("dg")||"")) 
  }, [Number(id_cus), Number(idF)])


  //*************check drug interaction**************************************************** */

  const result = interaction.map((pair: any) => {
    const foundA = list.some((item: any) => item.fixname === pair.fixname1);
    const foundB = list.some((item: any) => item.fixname === pair.fixname2);
    const found = foundA && foundB;

    return {
      ...pair,
      found
    };
  });

  const foundPairs = result.filter(r => r.found);




  return (
    <div className="row g-1" style={{ paddingLeft: 5 }} id="after-print">

      <div className={changepay === "1" ? "col-sm-5" : "col-sm-8"} >
        <div className="row-4 shadow-sm rounded border border-success  " ></div>

        <div className="container-fluid ">

          {/*ตารางรายการ sale - Modern Card Layout*/}
          <div style={{ padding: '8px' }}>
            {/* Sale Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {list.length === 0 ? (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '2px dashed #e5e7eb'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '16px', color: '#6b7280' }}>ยังไม่มีสินค้าในรายการ</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>สแกนหรือค้นหาสินค้าเพื่อเพิ่มในรายการขาย</div>
                </div>
              ) : (
                list.map((item, index) => {
                  // Check for warnings
                  const hasDrugInteraction = foundPairs.filter((d: any) => d.fixname2 === String(item.fixname))[0] || foundPairs.filter((d: any) => d.fixname1 === String(item.fixname))[0];
                  const hasDrugAllergy = drugs.filter((w: any) => w.drugallergy === item.fixname).length > 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => { setcodeproductS(item.code_product), setcostS(String(item.cost)) }}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '8px 10px',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                        border: hasDrugInteraction || hasDrugAllergy ? '2px solid #ef4444' : '1px solid #f0f0f0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Warning Badges */}
                      {(hasDrugInteraction || hasDrugAllergy) && (
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                          {hasDrugInteraction && (
                            <span style={{
                              background: '#dc2626',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontFamily: 'Kanit',
                              fontWeight: 600
                            }}>⚠️ Drug Interaction</span>
                          )}
                          {hasDrugAllergy && (
                            <span style={{
                              background: '#ea580c',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontFamily: 'Kanit',
                              fontWeight: 600
                            }}>💊 แพ้สินค้า</span>
                          )}
                        </div>
                      )}

                      {/* Product Info Row */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Product Image */}
                        {savemu === "1" && item.pic && item.pic !== "" && (
                          <div style={{ flexShrink: 0 }}>
                            <img
                              alt=""
                              src={item.pic}
                              style={{
                                width: '40px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #f0f0f0'
                              }}
                            />
                          </div>
                        )}

                        {/* Product Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#9ca3af' }}>{item.code_product}</div>
                          <div style={{
                            fontFamily: 'Kanit',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#1f2937',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.2'
                          }}>
                            {item.name_product}
                          </div>

                        </div>
                      </div>

                      {/* Price & Quantity Row - Compact */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        paddingTop: '6px',
                        borderTop: '1px solid #f5f5f5'
                      }}>
                        {/* Unit & Quantity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: '#F3F8FC',
                            color: '#2A6AAA',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontFamily: 'Kanit',
                            fontSize: '10px',
                            fontWeight: 500
                          }}>{item.unit}</span>

                          {/* Stock Balance Badge */}
                          <span style={{
                            background: '#E5EEF8',
                            color: '#2A6AAA',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontFamily: 'Kanit',
                            fontSize: '10px',
                            fontWeight: 500
                          }}>คงเหลือ {item.balance || 0}</span>

                          {/* Quantity Button */}
                          <button
                            disabled={changepay === "1"}
                            onClick={(e) => {
                              e.stopPropagation();
                              modal1.onOpen();
                              setEditedTaskText(String(item.qty));
                              setEditedTaskText1(String(item.qty));
                              setEditedcode(String(item.code_product));
                              setEditedname(String(item.name_product));
                            }}
                            style={{
                              background: changepay === "1" ? '#f3f4f6' : '#E5EEF8',
                              color: changepay === "1" ? '#9ca3af' : '#2A6AAA',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              fontFamily: 'Kanit',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: changepay === "1" ? 'not-allowed' : 'pointer'
                            }}
                          >
                            ×{item.qty}
                          </button>
                        </div>

                        {/* Price Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#9ca3af' }}>฿{item.price}</div>
                            {item.discount > 0 && (
                              <div style={{ fontFamily: 'Kanit', fontSize: '9px', color: '#ef4444' }}>-฿{item.discount}</div>
                            )}
                          </div>
                          <div style={{
                            background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontFamily: 'Kanit',
                            fontSize: '14px',
                            fontWeight: 700
                          }}>
                            ฿{item.total}
                          </div>
                        </div>
                      </div>

                      {/* Action Row (when not in payment mode) */}
                      {changepay !== "1" && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px',
                          paddingTop: '6px',
                          borderTop: '1px solid #f5f5f5'
                        }}>
                          {/* Discount Button */}
                          <button
                            disabled={changepay === "1"}
                            onClick={(e) => {
                              e.stopPropagation();
                              modal2.onOpen();
                              setEditedpriceDis(String(item.discount));
                              setEditedpriceAct(String(item.price));
                              setEditedcode(String(item.code_product));
                              setEditedname(String(item.name_product));
                            }}
                            style={{
                              background: '#fef3c7',
                              color: '#d97706',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              fontFamily: 'Kanit',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            🏷️ ส่วนลด ฿{item.discount}
                          </button>

                          {/* Label Checkbox & Delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={item.label}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setIsChecked(e.target.checked);
                                  setList(list.map((task) => task.id === item.id ? { ...task, label: e.target.checked } : task));
                                }}
                                style={{ width: '14px', height: '14px', accentColor: '#3E86C7' }}
                              />
                              <span style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#6b7280' }}>ฉลาก</span>
                            </label>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                                localStorage.setItem("itemlist", String(list.length));
                              }}
                              style={{
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontFamily: 'Kanit',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              🗑️ ลบ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modals for Quantity and Discount */}
            <Modal isOpen={modal1.isOpen} onOpenChange={modal1.onOpenChange} scrollBehavior={"inside"}>
              <ModalContent style={{
                backgroundColor: "white",
                borderRadius: '20px',
                width: '90%',
                maxWidth: '400px',
                margin: 'auto'
              }}>
                {(onClose) => (
                  <>
                    <ModalBody>
                      <div style={{ padding: '20px 0' }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#9ca3af' }}>{editedcode}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>{editedTaskname}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: 'Kanit', fontSize: '14px', color: '#6b7280' }}>จาก {editedTaskText1} เป็น</span>
                          <input
                            type="number"
                            value={editedTaskText}
                            onChange={(e) => setEditedTaskText(e.target.value)}
                            style={{
                              width: '80px',
                              padding: '10px 12px',
                              fontSize: '18px',
                              fontFamily: 'Kanit',
                              fontWeight: 700,
                              textAlign: 'center',
                              border: '2px solid #3E86C7',
                              borderRadius: '12px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </ModalBody>
                    <ModalFooter style={{ display: 'flex', gap: '10px', padding: '16px', background: '#f9fafb', borderRadius: '0 0 20px 20px' }}>
                      <button
                        onClick={() => { cut_lot_Price_manual(); onClose(); }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontFamily: 'Kanit',
                          fontSize: '16px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ✓ ยืนยัน
                      </button>
                      <button
                        onClick={onClose}
                        style={{
                          padding: '12px 24px',
                          background: '#e5e7eb',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '12px',
                          fontFamily: 'Kanit',
                          fontSize: '16px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ปิด
                      </button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>

            <Modal isOpen={modal2.isOpen} onOpenChange={modal2.onOpenChange} scrollBehavior={"inside"}>
              <ModalContent style={{
                backgroundColor: "white",
                borderRadius: '20px',
                width: '90%',
                maxWidth: '400px',
                margin: 'auto'
              }}>
                {(onClose) => (
                  <>
                    <ModalBody>
                      <div style={{ padding: '20px 0' }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#9ca3af' }}>{editedcode}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>{editedTaskname}</div>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                          <span style={{ fontFamily: 'Kanit', fontSize: '14px', color: '#6b7280' }}>ราคา {priceAct} บาท ลดราคาชิ้นละ</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            value={priceDis}
                            onChange={(e) => setEditedpriceDis(e.target.value)}
                            style={{
                              width: '100px',
                              padding: '10px 12px',
                              fontSize: '18px',
                              fontFamily: 'Kanit',
                              fontWeight: 700,
                              textAlign: 'center',
                              border: '2px solid #f59e0b',
                              borderRadius: '12px',
                              outline: 'none'
                            }}
                          />
                          <span style={{ fontFamily: 'Kanit', fontSize: '14px', color: '#6b7280' }}>บาท</span>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '12px' }}>
                          <span style={{ fontFamily: 'Kanit', fontSize: '16px', fontWeight: 600, color: '#3E86C7' }}>
                            คงเหลือ: {Number(priceAct) - Number(priceDis)} บาท
                          </span>
                        </div>
                      </div>
                    </ModalBody>
                    <ModalFooter style={{ display: 'flex', gap: '10px', padding: '16px', background: '#f9fafb', borderRadius: '0 0 20px 20px' }}>
                      <button
                        onClick={() => { cut_lot_Discount_manual(); onClose(); }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontFamily: 'Kanit',
                          fontSize: '16px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ✓ ยืนยันส่วนลด
                      </button>
                      <button
                        onClick={onClose}
                        style={{
                          padding: '12px 24px',
                          background: '#e5e7eb',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '12px',
                          fontFamily: 'Kanit',
                          fontSize: '16px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ปิด
                      </button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
          </div>


        </div>
      </div>
      <div className="col-sm" >

        {changepay === "1" ? < Afterpay /> : < Beforepay />}
      </div>
    </div>

  )




}
export default BodyTabSalemS


