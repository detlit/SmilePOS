
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { usePermission } from '@/utils/usePermission'
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
import { Toaster, toast } from "sonner"

function GiftproductP() {





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
  const AlertComplete = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
      description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
      duration: 3000, // ปิดเองใน 3 วิ
    });
  };

  // Post Data
  const CleckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const company = (localStorage.getItem("company_") || "")
    const code_product = all.code
    const id_product = Number(all.id)
    const name_product = all.ProductName
    const gift = Number(gifts)
    const person = ""


    try {
      await axios.post(`/api/${apigiftlist}`,
        {
          company, code_product, id_product, name_product, gift, person
        }
      )

      AlertComplete()
      await fetchGet_Giftlist()

    } catch (error) {
      console.error(error)
    }
  }

  //**************************************** */
  // Delete/id
  const deletePost = async (id: Number) => {
    try {
      await axios.delete(`/api/${apigiftlist}/${id}`)
      await fetchGet_Giftlist()
    } catch (error) {
      console.error('Failed to delete the post', error)
    }
  }


  const handleInputChange = (e: any) => {
    const { name, value } = e.target;

    setall1({
      ...all,
      [name]: value,
    });




  };




  useEffect(() => {
  }, []);
  const [l, setlevel] = useState([])
  const { hasPermission } = usePermission()



  return (

    <form className='form' >
      <div className='row'>


        {hasPermission("C3") ?
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

              <div className="d-flex mt-1 mb-1" style={{ alignItems: "center" }}>
                <div className="" style={{ width: widths1, fontSize: 10 }}>
                  <div className={styles.btnsubhead_pro} style={{ fontSize: 13, color: "#2A6AAA" }}>ราคาขาย :</div></div>
                <div className="col-2 " style={{ marginLeft: 10 }}>
                  <div style={{ fontFamily: "Kanit", backgroundColor: "white", color: "#2A6AAA", fontSize: 13, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {all.price}&nbsp;&nbsp;{"บาท"}</div>
                </div>

                <div className="" style={{ width: widths1, fontSize: 10 }}>
                  <div className={styles.btnsubhead_pro} style={{ fontSize: 13, color: "#2A6AAA" }}>ราคาทุน :</div></div>
                <div className="col-2 " style={{ marginLeft: 10 }}>
                  <div style={{ fontFamily: "Kanit", backgroundColor: "white", color: "#2A6AAA", fontSize: 13, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {itembalance.map((r: any) => r.cost)}&nbsp;&nbsp;{"บาท"}</div>
                </div>

              </div>


              <div className="d-flex mt-1 mb-1" style={{ alignItems: "center" }}>
                <div className="" style={{ width: widths1, fontSize: 10 }}>
                  <div className={styles.btnsubhead_pro} style={{ fontSize: 13, color: "#2A6AAA" }}>กำไร :</div></div>
                <div className="col-2 " style={{ marginLeft: 10 }}>
                  <div style={{ fontFamily: "Kanit", backgroundColor: "white", color: "#2A6AAA", fontSize: 13, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {Number(all.price) - Number(itembalance.map((r: any) => r.cost))}&nbsp;&nbsp;{"บาท"}</div>
                </div>

                <div className="" style={{ width: widths1, fontSize: 10 }}>
                  <div className={styles.btnsubhead_pro} style={{ fontSize: 13, color: "#2A6AAA" }}>%กำไร :</div></div>
                <div className="col-2 " style={{ marginLeft: 10 }}>
                  <div style={{ fontFamily: "Kanit", backgroundColor: "white", color: "#2A6AAA", fontSize: 13, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {parseInt(String((Number(all.price) - Number(itembalance.map((r: any) => r.cost))) / (Number(all.price)) * 100))}&nbsp;&nbsp;{"%"}</div>
                </div>

              </div>


            </div>


            <div className='row mt-2'>

              <div className="d-flex mt-1 mb-1" style={{ alignItems: "center" }}>
                <div className="" style={{ width: widths1, fontSize: 10 }}>
                  <div className={styles.btnsubhead_pro} style={{ fontSize: 13, color: "blue" }}>ค่าหยิบ :</div></div>
                <div className="col-1 " style={{ marginLeft: 10 }}>
                  <input
                    type="number"
                    required
                    value={gifts}
                    onChange={(e) => setgift(e.target.value)}
                    className="form-control form-control-sm"
                    placeholder=""
                    style={{ fontFamily: "Kanit_B", width: 60, textAlign: "center", color: "brown" }}
                  />


                </div>

                <div className={styles.btnsubhead_pro} style={{ fontSize: 13, color: "blue", textAlign: "left", marginLeft: 30 }}>บาท</div>

              </div>


              <div className="d-flex mt-1 mb-1" style={{ alignItems: "center" }}>
                <div className="" style={{ width: widths1, fontSize: 10 }}>
                  <div className={styles.btnsubhead_pro} style={{ fontSize: 13, color: "blue" }}>กำไรใหม่ :</div></div>
                <div className="col-2 " style={{ marginLeft: 10 }}>
                  <div style={{ fontFamily: "Kanit", backgroundColor: "white", color: "blue", fontSize: 13, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {Number(all.price) - Number(itembalance.map((r: any) => r.cost)) - Number(gifts)}&nbsp;&nbsp;{"บาท"}</div>
                </div>

                <div className="" style={{ width: widths1, fontSize: 10 }}>
                  <div className={styles.btnsubhead_pro} style={{ fontSize: 13, color: "blue" }}>%กำไรใหม่ :</div></div>
                <div className="col-2 " style={{ marginLeft: 10 }}>
                  <div style={{ fontFamily: "Kanit", backgroundColor: "white", color: "blue", fontSize: 13, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}> {parseInt(String((Number(all.price) - Number(itembalance.map((r: any) => r.cost)) - Number(gifts)) / (Number(all.price)) * 100))}&nbsp;&nbsp;{"%"}</div>
                </div>

              </div>


            </div>

            <div className='row-2 mt-2' style={{ justifySelf: "center" }}>
              <button type="button" className="btn btn-outline-success" onClick={CleckSubmit}>บันทึก</button>
            </div>
          </div>
          : ""}

        <div className='col-sm  m-1 rounded border shadow-sm  ' style={{ height: "90vh" }}>
          <div className='row' style={{ fontFamily: "Kanit", backgroundColor: "white", fontSize: 12, margin: 3, color: "brown" }}>ข้อมูลสินค้าหยิบ&nbsp;&nbsp; {giftlist.length}&nbsp;&nbsp; รายการ</div>
          <div style={{ overflowY: "scroll" }} >
            <Table className="table mt-1" size="sm" >
              <thead>
                <tr>

                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>รหัสสินค้า</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "50%", textAlign: "left", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>สินค้า</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>ค่าหยิบ (บาท)</td>
                  <td className={styles.bodydetailTable_Re1} style={{ width: "5%", textAlign: "center", fontSize: 9, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>ลบ</td>

                </tr>
              </thead>
              <tbody className="table-group-divider" style={{ overflowY: 'scroll' }}>
                {giftlist.map((p: any) => (
                  <tr key={p.id}  >

                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{p.code_product}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "50%", textAlign: "left", fontSize: 10, whiteSpace: 'nowrap', overflow: "hidden", textOverflow: "ellipsis" }}>{p.name_product}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "10%", textAlign: "center", fontWeight: "bold", fontSize: 13, color: "brown" }}>{p.gift}</td>
                    <td className={styles.bodydetailTable_Re1} style={{ width: "5%", textAlign: "center", fontWeight: "bold", fontSize: 13, color: "brown" }}>
                      {hasPermission("C3") ?
                        <button onClick={() => deletePost(p.id)} style={{ width: 18, height: 15, borderColor: "blue" }}>
                          <Image alt={""} src={deletes} quality={40} />
                        </button> : ""}

                    </td>

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

export default GiftproductP
