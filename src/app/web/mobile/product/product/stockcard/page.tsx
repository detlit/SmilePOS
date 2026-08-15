
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import styles from "../../../../componant/mystyle.module.css";
import { Table } from 'react-bootstrap';
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





function StockCardproductP() {



  const apis = "datalist"
  const apiitemRC = "receivelist"
  const apisaleitem = "sale_cal/sale_list_item"
  const apibalance = "sale_cal/sale_balance"
  const Fixnameapis = "fixname"
  const Groupapis = "group"
  const Typeapis = "type"
  const Areaapis = "area"
  const Getagoryapis = "getagory"
  const Unitapis = "unit"

  // const {ids} =useAppContext(); 
  //  const {itemcodes} =useAppContext(); 
  const ids = useMessageStore((state) => state.ids)
  const itemcodes = useMessageStore((state) => state.itemcodes)



  const initialValues = {
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
  const [itemRC, setGet_ItemRC] = useState([])
  const [itemSale, setGet_ItemSale] = useState([])
  const [itembalance, setbalance] = useState([])
  //const   itemCode=String(all.filter((s:any)=>s.id===ids).map((s:any)=>s.itemcode))

  console.log(itemRC)

  useEffect(() => {

    const useMyHook = async () => {
      try {
        await fetchPost()
        await fetchGet_ItemRC()
        await fetchGet_ItemSale()
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

  const fetchGet_ItemRC = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiitemRC}?company=${companyS}&itemcode=${itemcodes}`)

      setGet_ItemRC(res.data)

    } catch (error) {
      console.error(error)
    }

  }

  const fetchGet_ItemSale = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apisaleitem}?company=${companyS}&code_product=${itemcodes}`)

      setGet_ItemSale(res.data)

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


  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTimeout(() => {
      setall1({
        ...all,
        [name]: value,
      });
    }, 40);



  };







  return (
    <form className='form' >
      <div className='row'>

        <div className="row-sm  " style={{ margin: 5 }}>

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
            <div className="col-4 " style={{ marginLeft: 10 }}>
              <div style={{ fontFamily: "Kanit_B", backgroundColor: "white", fontSize: 12, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.ProductName}</div>
            </div>

          </div>

          <div className="d-flex mt-1 " style={{ alignItems: "center" }}>
            <div className="" style={{ width: widths1 }}>
              <div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>ชื่อสามัญ :</div></div>
            <div className="col-2 " style={{ marginLeft: 10 }}>
              <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.fixname}</div>
            </div>


            <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>กลุ่มสินค้า :</div></div>
            <div className="col-2 " style={{ marginLeft: 10 }}>
              <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.group}</div>
            </div>

            <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>รายงาน ขย :</div></div>
            <div className="col-1 " style={{ marginLeft: 10 }}>
              <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.type}{all.subtype == null ? "" : " / "}{all.subtype}</div>
            </div>

            <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 13, fontWeight: "bold", color: "#2A6AAA" }}>คงเหลือ :</div></div>
            <div className="col-1 " style={{ marginLeft: 10 }}>
              <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 13, fontWeight: "bold", color: "#2A6AAA" }}>{itembalance.map((r: any) => r.balance)} &nbsp;&nbsp;{all.Unit}</div>
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

            <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>หน่วย :</div></div>
            <div className="col-1 " style={{ marginLeft: 10 }}>
              <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10 }}> {all.Unit}</div>
            </div>

            <div className="" style={{ width: widths1, fontSize: 10 }}><div className={styles.btnsubhead_pro} style={{ fontSize: 10 }}>ราคา :</div></div>
            <div className="col-1 " style={{ marginLeft: 10 }}>
              <div style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 10 }}> {all.price}&nbsp;&nbsp;{"บาท"}</div>
            </div>


          </div>



        </div>

        <div className="row " style={{ height: "68vh", justifySelf: "center", margin: 3 }} >
          <div className='col-sm rounded border shadow-sm '>
            <div className='row' style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 12, margin: 3, color: "blue" }}>ข้อมูลรับสินค้า</div>
            <Table className="table mt-1" size="sm"  >
              <thead>
                <tr>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>ใบรับสินค้า</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>วันรับสินค้า</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9 }}>รับ</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9 }}>หน่วย</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>ทุนใหม่</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>คงเหลือ</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>หมดอายุ</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "15%", textAlign: "center", fontSize: 9 }}>Lot</td>
                </tr>
              </thead>
              <tbody className="table-group-divider">
                {itemRC.map((p: any) => (
                  <tr key={p.id}  >
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>RC{p.codenames}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{new Date(p.dateRC).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: '2-digit', })}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontWeight: "bold" }}>{p.qty}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.unit}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.newCost}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}><div style={{ color: Number.parseInt(String((Date.parse(String(new Date(p.dateExp))) - Date.parse(String(new Date()))) / (24 * 3600 * 1000))) <= 0 ? "red" : "black" }}>{Number.parseInt(String((Date.parse(String(new Date(p.dateExp))) - Date.parse(String(new Date()))) / (24 * 3600 * 1000)))}</div></td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{new Date(p.dateExp).toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: '2-digit', })}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "15%", textAlign: "center", whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{p.lot}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className='col-sm-6 rounded border shadow-sm ml-1 ' >
            <div className='row' style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 12, margin: 3, color: "brown" }}>ข้อมูลขายสินค้า</div>
            <Table className="table mt-1" size="sm"  >
              <thead>
                <tr>

                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9 }}>วันที่ขาย</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9 }}>ขาย</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9 }}>หน่วย</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9 }}>lot1</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>ตัด lot1</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9 }}>lot2</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>ตัด lot2</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9 }}>lot3</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>ตัด lot3</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>สถานะ</td>
                </tr>
              </thead>
              <tbody className="table-group-divider">
                {itemSale.map((p: any) => (
                  <tr key={p.id}  >

                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 8.5, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{new Date(String(p.createDate)).toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontWeight: "bold" }}>{p.qty}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.unit}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.lot_receive1}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "15%", textAlign: "center" }}>{p.qty_lot1}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.lot_receive2}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.qty_lot2}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.lot_receive3}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.qty_lot3}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center" }}>{p.statuss}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

          </div>

        </div>

      </div>

    </form>
  )
}

export default StockCardproductP
