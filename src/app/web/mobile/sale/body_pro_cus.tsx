'use client'

import React, { useRef, useState, useEffect, Suspense, createContext, useContext, ChangeEvent, KeyboardEvent } from 'react'
import axios from 'axios'
import styles from "../../componant/mystyle.module.css";
import { Table } from 'react-bootstrap';
import { fetchBarcodeAliases, buildAliasesByCode } from "@/lib/barcodeAliasClient";

const widthsh = 100;
import Link from "next/link";
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

import { Input } from "@/components/ui/input";
import BodyTabSale from './body_sale.tsx';
import { id } from 'date-fns/locale';
const widths = 70;
// Tittle
const apis = "receive"
const apidatalist = "datalist"
const apidataitem = "dataitemlist"
import { Check, AArrowDown, ChevronDownIcon, ChevronsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Modal1 from 'react-bootstrap/Modal';
import Button1 from 'react-bootstrap/Button';
import LoadingOverlay from '../../componant/LoadingOverlay';

const btncolors = "rgba(175, 175, 175, 0.88)"
const btniconcolor = "rgba(255, 255, 255, 1)"
const greeniconcolor = "rgba(102, 102, 102, 1)"

const IDContext_SaleItem = createContext<any>(undefined)
const frameworks = [
  {
    value: "หน้าร้าน",
    label: "หน้าร้าน",
  },
  {
    value: "ขายส่ง",
    label: "ขายส่ง",
  },
  {
    value: "สมาชิก",
    label: "สมาชิก",
  },
  {
    value: "ราคา A",
    label: "ราคา A",
  },
  {
    value: "ราคา B",
    label: "ราคา B",
  },
  {
    value: "ราคา C",
    label: "ราคา C",
  },
  {
    value: "ราคา D",
    label: "ราคา D",
  },
  {
    value: "ราคา E",
    label: "ราคา E",
  },
  {
    value: "ราคา F",
    label: "ราคา F",
  },
  {
    value: "ราคา G",
    label: "ราคา G",
  },
  {
    value: "ราคา H",
    label: "ราคา H",
  },

]

import { enableFullscreen } from "@/lib/fullscreen";
import { useMessageStore } from "./useMessageStore";



function BodyTabIndexm() {

  const [idc, setidss] = useState({ idcus: "", pay: "หน้าร้าน", mu: "1" })

  const [showcolor, setshowcolor] = useState("")
  const [companyR, setcom] = useState("")
  //รับค่า
  const message = useMessageStore((state) => state.message)

  //ส่งค่า
  const setsavemu = useMessageStore((state) => state.setsavemu);
  const setsale = useMessageStore((state) => state.setsale);


  useEffect(() => {


    fetchPosts()

  }, [])




  const fetchPosts = async () => {
    if (typeof window === "undefined") return; // check client
    let companyS = localStorage.getItem("company_") || "";

    try {
      const [res, aliases] = await Promise.all([
        axios.get(`/api/${apidatalist}?company=${companyS}`),
        // บาร์โค้ดสำรอง — ให้ค้นด้วยบาร์โค้ดตัวไหนของสินค้าก็เจอสินค้าตัวเดียวกัน
        fetchBarcodeAliases(companyS),
      ])
      setAliasesByCode(buildAliasesByCode(aliases))
      setatalist(res.data)
      setdataProduct(res.data)

      const items = await res.data.map((item: { id: string; ProductName: string }) => ({ value: item.id, label: item.ProductName }))
      setFixname(items)

      // console.log(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {

    const useMyHook = async () => {
      // *** ย้ายการอ่าน localStorage มาไว้ที่นี่ ***
      let companyS = "";
      if (typeof window !== 'undefined') {
        companyS = localStorage.getItem("company_") || "";
        setcom(localStorage.getItem("company_") || "")
        localStorage.setItem("countrow", "หน้าร้าน")
        localStorage.setItem("show", "1")
        localStorage.setItem("mu", "1")
      }

      try {


        // อ่านค่าอื่นๆ ที่ใช้ localStorage ต่อไป
        setshowcolor(localStorage.getItem("mu") || "")
        setsavemu(localStorage.getItem("mu") || "")

      } catch (e) {
        console.error(e);
      }
    }

    useMyHook()

  }, [])


  const [dataProduct, setdataProduct] = useState([])
  // บาร์โค้ดสำรองจัดกลุ่มตามรหัสสินค้า — ใช้เฉพาะกรองผลค้นหา ไม่แตะยอดใด ๆ
  const [aliasesByCode, setAliasesByCode] = useState<Map<string, string[]>>(new Map())
  const [listM, setlistM] = useState("")
  const [showS, setShow] = useState("")
  const [switchdata, setswitchdata] = useState('2')

  /**************Data Company******************************/

  const initialValues1 = {
    ProductName: "",
    Barcode: "",
    pay: "",
    idcs: ""
  };

  const [alldatalist, setatalist] = useState(initialValues1)
  const [idDatalist, setidW] = useState("")


  //***********Get ID************************** */
  useEffect(() => {
    const id_s = String(dataProduct.filter((supplier: any) => supplier.ProductName === alldatalist.ProductName).map((supplier: any) => supplier.id))
    const idR_s = String(dataProduct.filter((supplier: any) => supplier.Barcode === alldatalist.Barcode).map((supplier: any) => supplier.id))

    const useMyHook = async () => {
      try {

        const idDatalists = switchdata === "1" ? id_s : idR_s
        setidW(idDatalists)
        setsale(idDatalists)

        // setidss({...idc,idcus:String(idDatalists),});
        localStorage.setItem("countrow", idc.pay)
        const items = localStorage.getItem("itemlist") || ""
        if (items) {
          setlistM(items);
        }
        const visShow = localStorage.getItem("show") || ""
        if (visShow) {
          setShow(visShow);
        }
        // console.log(items)
      } catch (e) {
        console.error(e);
      }
    }

    useMyHook()

  }, [Number(alldatalist.Barcode) || dataProduct.filter((supplier: any) => supplier.ProductName === alldatalist.ProductName).map((supplier: any) => supplier.id) || Number(localStorage.getItem("itemlist"))])


  const handleInputChange1 = () => {


    const pp = localStorage.getItem("bar") || ""
    setatalist({ ...alldatalist, Barcode: pp, });

    setTimeout(() => {
      setatalist(initialValues1)

    }, 1);

  };




  //*** Get API Fixname */
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<{ value: string, label: string } | null>(null)
  const [items, setFixname] = useState<{ value: string, label: string }[]>([]);



  /***********Get datalist*/




  //******** */ Search สินค้า*****************/
  function Search_Product() {

    //*******Show Modal **********************************/
    const [show1, setShow1] = useState(false);
    const handleClose = () => setShow1(false);
    const handleShow = () => setShow1(true);

    //******* */  Key ค้นหา สินค้า  ************************/
    const [data, setData] = useState(dataProduct);
    const [search, setsearch] = useState("")

    const handleChange = (value: any) => {
      setsearch(value);
      filterDataProduct(value);
    };

    // filter records by Productname
    const filterDataProduct = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData(dataProduct);
      else {
        const filteredData = data.filter((user: any) =>
          user.ProductName.toLowerCase().includes(search.toLowerCase())
          || user.code.toLowerCase().includes(search.toLowerCase())
          || user.Barcode.toLowerCase().includes(search.toLowerCase())
          // บาร์โค้ดสำรองของสินค้าตัวเดียวกัน (หลายบาร์โค้ด/หน่วยเดียว)
          || (aliasesByCode.get(String(user.code || "")) || []).some((b: string) => b.toLowerCase().includes(search.toLowerCase()))
        );
        setData(filteredData);
      }
    };

    //***************************************************************** */


    return (
      <>
        <Button1
          disabled={message === "" ? false : true}
          variant="outline-dark"
          onClick={handleShow}
          className="form-control form-control-sm"
          style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 12, height: 30 }}
        >
          {switchdata === "2" ? "คลิก ค้นหาชื่อ, รหัส, Barcode สินค้า" : alldatalist.ProductName != undefined ? alldatalist.ProductName : "คลิก ค้นหาชื่อ, รหัส, Barcode สินค้า"}
        </Button1>

        <Modal1 show={show1} onHide={handleClose}>
          <Modal1.Header closeButton>
            <Modal1.Title
              style={{ fontFamily: "Kanit", textAlign: "left", fontSize: 15, height: 20 }}>
              ค้นหาชื่อ, รหัส, Barcode สินค้า
            </Modal1.Title>
          </Modal1.Header>
          <Modal1.Body>
            <div>
              <div className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>ค้นหา</div>
              <div className={styles.bodydetailTable_Re} style={{ width: "20vw" }}>
                <input
                  value={search}
                  onChange={(e) => handleChange(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
                  style={{ fontFamily: "Kanit", fontSize: 10, height: 12 }} />
              </div>

              <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <table className="table table-sm table-hover"   >
                  <thead style={{ position: "sticky", top: "0" }}>
                    <tr>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "4vw" }}>
                        <div style={{ width: "4vw" }}>รหัสสินค้า</div>

                      </th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "15vw" }}>
                        <div style={{ width: "15vw" }}>ชื่อสินค้า</div>

                      </th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: "7vw" }}>
                        <div style={{ width: "7vw" }}>barcode</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-group-divider " >
                    {data.map((post: any) => (
                      <tr key={post.id}
                        onClick={() => {
                          setatalist({ ...alldatalist, ProductName: post.ProductName, }),
                            setswitchdata("1"),
                            handleClose
                        }}>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "4vw" }}>{post.code}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "15vw" }}>{post.ProductName}</td>
                        <td className={styles.bodydetailTable_Re1} style={{ width: "7vw" }}>{post.Barcode}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
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


  //****** */ input Scanner****************/
  const Scanbarcode = () => {

    const [barcodeS, setbarcodeS] = useState("")


    const BarInput = async (e: any) => {

      localStorage.setItem("bar", e.target.value)
      await setbarcodeS(e.target.value)

      setTimeout(async () => {
        await setatalist({ ...alldatalist, Barcode: String(localStorage.getItem("bar") || "") });

        setTimeout(async () => {
          setatalist(initialValues1)
          setbarcodeS("")
        }, 55);

      }, 180);

    }

    return (

      <div className="input-group">
        <span className="input-group-text" id="visible-addon" style={{ fontFamily: "kanit", fontSize: 13, width: 70, height: 30 }}>ค้นหา :</span>
        <input
          type="text"
          autoFocus
          disabled={message === "" ? false : true}
          onClick={() => { setswitchdata("2"), setatalist(initialValues1) }}
          className="form-control"
          placeholder="Scan barcode"
          aria-label=""
          aria-describedby="visible-addon"
          value={barcodeS}
          onChange={BarInput}
          style={{ fontFamily: "kanit", fontSize: 13, height: 30 }} />
      </div>
    )

  }

  //*******Func Sex********************** */
  function Payinput() {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            name="pay"
            disabled={Number(listM) >= 1 ? true : false}
            aria-expanded={open}
            className="rounded  "
            style={{ fontFamily: "Kanit", fontSize: 12, width: 120, height: 30 }}
          >

            {idc.pay ? idc.pay : "หน้าร้าน"}
            <ChevronDownIcon className="opacity-70" style={{ marginLeft: 5 }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="หน้าร้าน" className="h-9" />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue)
                      setidss({ ...idc, pay: currentValue === value ? "" : currentValue, });
                      setOpen(false)

                    }}
                  >
                    {framework.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === framework.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }




  const customerWin = useRef<Window | null>(null);

  const openCustomerOnSecondScreen = async () => {
    if ("getScreenDetails" in window) {
      // @ts-ignore
      const details = await window.getScreenDetails();

      const screens = details.screens;
      const extend = screens.find((s: any) => !s.isPrimary);

      if (extend) {
        window.open(
          "/web/sales/customer",
          "_blank",
          `
          left=${extend.left},
          top=${extend.top},
          width=${extend.width},
          height=${extend.height},
          fullscreen=yes,
          resizable=yes,
          scrollbars=no
        `
        );
        return;
      }
    }


    // ส่งคำสั่ง fullscreen ให้ทันทีหลังจากเปิด
    setTimeout(() => {
      customerWin.current?.postMessage({ action: "enter_fullscreen" }, "*");

    }, 2000);
  };




  const KeyScan = () => {



    return (

      <div className='row '>
        <div className="col-sm-3 "> <Scanbarcode /></div>
        <div className="col-sm-3" > <Search_Product /></div>
        <div className="col-sm-1" > {Payinput()}</div>

        <div className="col" style={{ marginLeft: 30, height: 30 }}>
          <div className='d-flex'>

            <button
              style={{ backgroundColor: showcolor == "1" ? btncolors : "white" }}
              onClick={() => { setshowcolor("1"), setsavemu("1"), localStorage.setItem("mu", "1") }}
              className='shadow-sm rounded border p-1'>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="22" fill={showcolor == "1" ? btniconcolor : greeniconcolor} className="bi bi-list-ul" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
              </svg>
            </button>

            <button
              style={{ marginLeft: 10, backgroundColor: showcolor == "2" ? btncolors : "white" }}
              onClick={() => { setshowcolor("2"), setsavemu("2"), localStorage.setItem("mu", "2") }}
              className='shadow-sm rounded border p-1' >
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="22" fill={showcolor == "2" ? btniconcolor : greeniconcolor} className="bi bi-list" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
              </svg>
            </button>

            <button
              type='button'

              style={{ fontFamily: "Kanit", fontSize: 13, width: 80, height: 32, marginLeft: 10 }}
              onClick={() => { openCustomerOnSecondScreen() }}
              className='btn btn-outline-dark p-1 shadow-sm rounded border' >

              จอลูกค้า
            </button>



          </div>
        </div>

      </div>

    )
  }

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (

    <>
      <LoadingOverlay show={loading} />
      <div className="row  ">

        <div className="row ">

          {/*ตาราง สินค้า*/}


          {message === "" ? <KeyScan /> : ""}







        </div>




        <IDContext_SaleItem.Provider value={idc}>
          <BodyTabSale data1={idDatalist} />
        </IDContext_SaleItem.Provider>


      </div>
    </>









  )

}


export default BodyTabIndexm




export function useSaleContext() {
  return useContext(IDContext_SaleItem)
}
