'use client'

import React, { useEffect, useState, Suspense, createContext, useContext } from "react";
import styles from "./../componant/mystyle.module.css"
import Link from "next/link";
const widths = 80;
const widthsh = 100;
import axios from 'axios'

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
// Tittle
const getsalehistory = "salehistory"

const apisalemain = "sale"

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

const apiRC = "receivelist"


function ReceiptItem(idDatalist: any) {

  const idF = Number(idDatalist.data)

  const [itemsale, setItemsale] = useState([])
  const [itemdetail, setItemdetail] = useState({})
  const [itemdetailM, setItemdetailM] = useState([])
  const [itemdetailRC, setItemdetailRC] = useState([])
  const [salemain, setsalemain] = useState([])
  const [saleid, setsaleid] = useState("")
  const [itemRC, setitemRC] = useState("")
  const [customerName, setCustomerName] = useState("")


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
  const [vatEnabledR, setVatEnabledR] = useState("false")
  const [branchNameR, setBranchNameR] = useState("")
  const [allS, Setall] = useState(false)
  const [logoS, Setlogo] = useState(true);
  const [lineS, Setline] = useState(true)

  // Setting Reward
  const [SaleS, SetSaleInput] = useState("")
  const [pointeqS, SetPoint] = useState("")
  const [pointsetS, SetPointSet] = useState("")
  const [discountS, SetDiscount] = useState("")
  const [statusS, SetStatus] = useState("")




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

  //******************Get Stting************************************ */
  const fetchPostStore = async () => {
    let companyS = (localStorage.getItem("company_") || "")
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
      res.data[0] == undefined ? "" : setVatEnabledR(res.data[0].vatEnabled || "false")
      res.data[0] == undefined ? "" : setBranchNameR(res.data[0].branchName || "")
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

    } catch (error: any) {
      // Ignore axios cancellation / aborted requests (component unmounted or idF changed)
      if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.message === 'canceled') return
      console.error(error)
    }

  }


  useEffect(() => {
    fetchPostStore()
    if (!idF) {
      setItemsale([])
      setsalemain([])
      setCustomerName("")
      return
    }
    fetchPostsz()
  }, [idF])



  const fetchPostsz = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/salelist?company=${companyS}&id_salemain=${idF}`)
      const ressalemain = await axios.get(`/api/sale/${idF}`)
      setItemsale(res.data)
      //setsalemain(ressalemain.data)
      ressalemain.data == undefined ? "" : setsalemain(ressalemain.data)

      // Fetch customer name
      const codeCus = ressalemain.data?.code_costomer
      if (codeCus && companyS) {
        const resCus = await axios.get(`/api/customer?company=${companyS}`)
        const found = resCus.data?.find((c: any) => c.code === codeCus)
        if (found?.names) setCustomerName(found.names)
      }

    } catch (error: any) {
      if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.message === 'canceled') return
      console.error(error)
    }
  }












  // Helper: get salemain data for this receipt
  const sm = [salemain].filter((b: any) => Number(b.id) === idF)[0] as any
  const isCancelled = sm?.statussall === 'ยกเลิก'
  const totalall = isCancelled ? 0 : Number(sm?.totalall ?? 0)
  const discountVal = isCancelled ? 0 : Number(sm?.discount ?? 0)
  const memberDiscountVal = isCancelled ? 0 : Number(sm?.memberDiscount ?? 0)
  const userewardVal = isCancelled ? 0 : Number(sm?.usereward ?? 0)
  const sumtotalVal = isCancelled ? 0 : Number(sm?.sumtotal ?? 0)
  const vatAmountVal = isCancelled ? 0 : Number(sm?.vatAmount ?? 0)
  const beforeVatVal = isCancelled ? 0 : Number(sm?.beforeVat ?? 0)
  const taxInvoiceNo = String(sm?.taxInvoiceNo ?? "")
  const payMethod = String(sm?.pay ?? "")
  const cashAmountVal = isCancelled ? 0 : Number(sm?.cashAmount ?? 0)
  const transferAmountVal = isCancelled ? 0 : Number(sm?.transferAmount ?? 0)

  const isVat = vatEnabledR === "true" && taxInvoiceNo !== ""
  const receiptDateRaw = itemsale.map((a: any) => a.createDate)[0]
  const receiptDate = receiptDateRaw ? new Date(receiptDateRaw) : null
  const receiptDateLabel = receiptDate && !Number.isNaN(receiptDate.getTime())
    ? `${receiptDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}  ${receiptDate.toLocaleTimeString('en-GB', { hour12: false, hour: "2-digit", minute: "2-digit" })}`
    : "-"
  const sellerName = itemsale.map((a: any) => a.person)[0] || sm?.personall || "-"
  const orderNoLabel = String(sm?.orderNo ?? "").trim()
  const customerLabel = sm?.code_costomer ? `${sm.code_costomer}${customerName ? ` ${customerName}` : ''}` : "ลูกค้าทั่วไป"

  if (!idF) {
    return (
      <div className={styles.receiptSlip}>
        <div className={styles.receiptHeader}>
          <div style={{ fontFamily: "Kanit_B", fontSize: 14 }}>ใบเสร็จรับเงิน</div>
          <div className={styles.receiptStoreName}>{storeS || "-"}</div>
          <div className={styles.receiptAddress}>{addressS || "-"}</div>
          <div className={styles.receiptAddress}>โทร: {telS || "-"}</div>
        </div>
        <div className={styles.receiptEmptyState}>เลือกรายการขายเพื่อดูใบเสร็จ</div>
      </div>
    )
  }

  return (

    <div className={styles.receiptSlip}>
      {/* Logo */}
      {uploadedUrl && String(uploadedUrl) !== "" && (
        <div style={{ width: 50, height: 50, margin: "0 auto 8px" }}>
          <img alt={""} src={String(uploadedUrl)} />
        </div>
      )}

      {/* Header - conditional VAT/non-VAT */}
      <div className={styles.receiptHeader}>
      {isVat ? (
        <>
          <div style={{ fontFamily: "Kanit_B", fontSize: 13 }}>ใบกำกับภาษีแบบย่อ</div>
          <div style={{ fontFamily: "Kanit", fontSize: 9, color: "#555" }}>TAX INVOICE (ABBREVIATED)</div>
        </>
      ) : (
        <div style={{ fontFamily: "Kanit_B", fontSize: 14 }}>ใบเสร็จรับเงิน</div>
      )}

      <div className={styles.receiptStoreName}>{storeS}</div>
      {isVat && branchNameR && (
        <div className={styles.receiptAddress}>สาขา: {branchNameR}</div>
      )}
      <div className={styles.receiptAddress}>{addressS}</div>
      <div className={styles.receiptAddress}>เลขประจำตัวผู้เสียภาษี: {taxS}</div>
      <div className={styles.receiptAddress}>โทร: {telS}</div>
      </div>

      <div className={styles.receiptDivider}>------------------------------------------------</div>

      {/* Tax Invoice Number - only when VAT */}
      {isVat && (
        <div className={styles.receiptLine} style={{ fontFamily: "kanit_B" }}>เลขที่ใบกำกับภาษี: {taxInvoiceNo}</div>
      )}

      {orderNoLabel && (
        <div className={styles.receiptLine} style={{ fontFamily: "kanit_B" }}>เลขที่ออเดอร์: {orderNoLabel}</div>
      )}
      <div className={styles.receiptLine}>พนักงานขาย: {sellerName}</div>
      <div className={styles.receiptLine}>วันที่: {receiptDateLabel}</div>
      <div className={styles.receiptDivider}>-----------------------------------------------</div>
      <div className={styles.receiptLine}>ลูกค้า: {customerLabel}</div>
      <div className={styles.receiptDivider}>-----------------------------------------------</div>

      {/* Product Table Header */}
      <div className={styles.receiptItemsHeader}>
        <div>รายการ</div>
        <div className={styles.receiptNumber}>รวม</div>
      </div>

      {/* Product Table Body */}
      {itemsale.map((saleItem: any) => {
        const unitLabel = String(saleItem.unit || '').trim()
        const qtyLabel = `${saleItem.qty}${unitLabel ? ` ${unitLabel}` : ''}`
        const discountValue = Number(saleItem.discount || 0)

        return (
          <div key={saleItem.id} id="selcet-print" className={styles.receiptItemGrid} style={{ opacity: saleItem.statuss === 'ยกเลิก' ? 0.55 : 1 }}>
            <div className={styles.receiptItemMain}>
              <div className={styles.receiptItemName} style={{ textDecoration: saleItem.statuss === 'ยกเลิก' ? 'line-through' : 'none' }}>
                {saleItem.name_product}{saleItem.statuss === 'ยกเลิก' && <span style={{ color: '#b91c1c', fontSize: 9, fontFamily: 'kanit_B' }}> (ยกเลิก)</span>}
              </div>
              <div className={styles.receiptNumber}>{saleItem.total}</div>
            </div>
            <div className={styles.receiptItemFormula}>{qtyLabel} x {saleItem.price}</div>
            {discountValue > 0 && <div className={styles.receiptItemDiscount}>ลด {saleItem.discount}</div>}
          </div>
        )
      })}
      <div className={styles.receiptDivider}>-----------------------------------------------</div>

      {/* Item count & payment method */}
      <div className={styles.receiptLine}>ทั้งหมด: {itemsale.length} รายการ&nbsp;&nbsp;&nbsp;&nbsp;ชำระสินค้า: {payMethod === "เงินสด+โอน" ? "แยกจ่าย" : payMethod}</div>
      {payMethod === "เงินสด+โอน" && (
        <div className={styles.receiptLine}>
          เงินสด: {cashAmountVal?.toFixed(0)} บาท / โอน: {transferAmountVal?.toFixed(0)} บาท
        </div>
      )}

      {/* ===== Footer Summary ===== */}
      <div className="container">
        <div className="row">
          <div className="col-12">

            {isVat ? (
              /* ========== VAT Receipt Footer ========== */
              <div style={{ marginTop: 5 }}>
                {/* รวมมูลค่าสินค้า */}
                <div className="d-flex bd-highlight" style={{ justifyContent: "flex-end" }}>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 105, height: 15 }}>รวมมูลค่าสินค้า :</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 45, height: 15 }}>{totalall?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 20, height: 15, paddingLeft: 3 }}>บาท</div>
                </div>

                {/* ส่วนลด */}
                {discountVal > 0 && (
                  <div className="d-flex bd-highlight" style={{ justifyContent: "flex-end" }}>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 105, height: 15 }}>ส่วนลด :</div>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 45, height: 15 }}>-{discountVal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 20, height: 15, paddingLeft: 3 }}>บาท</div>
                  </div>
                )}

                {/* ส่วนลดสมาชิก */}
                {memberDiscountVal > 0 && (
                  <div className="d-flex bd-highlight" style={{ justifyContent: "flex-end" }}>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 105, height: 15 }}>ส่วนลดสมาชิก :</div>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 45, height: 15 }}>-{memberDiscountVal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 20, height: 15, paddingLeft: 3 }}>บาท</div>
                  </div>
                )}

                {/* ใช้แต้มส่วนลด */}
                {userewardVal > 0 && (
                  <div className="d-flex bd-highlight" style={{ justifyContent: "flex-end" }}>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 105, height: 15 }}>ใช้แต้มส่วนลด :</div>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 45, height: 15 }}>-{userewardVal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 20, height: 15, paddingLeft: 3 }}>บาท</div>
                  </div>
                )}

                {/* Divider */}
                <div className="row" style={{ fontFamily: "kanit", fontSize: 8, textAlign: "right", justifySelf: "center", margin: "2px 0" }}>- - - - - - - - - - - - - - - - - - - - - - - - - - -</div>

                {/* มูลค่าสินค้า (before VAT) */}
                <div className="d-flex bd-highlight" style={{ justifyContent: "flex-end" }}>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 105, height: 15 }}>มูลค่าสินค้า :</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 45, height: 15 }}>{beforeVatVal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 20, height: 15, paddingLeft: 3 }}>บาท</div>
                </div>

                {/* ภาษีมูลค่าเพิ่ม 7% */}
                <div className="d-flex bd-highlight" style={{ justifyContent: "flex-end" }}>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 105, height: 15 }}>ภาษีมูลค่าเพิ่ม 7% :</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 45, height: 15 }}>{vatAmountVal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 20, height: 15, paddingLeft: 3 }}>บาท</div>
                </div>

                {/* Double line divider */}
                <div className="row" style={{ fontFamily: "kanit", fontSize: 8, textAlign: "right", justifySelf: "center", margin: "2px 0" }}>═══════════════════════════</div>

                {/* รวมทั้งสิ้น (Grand Total) */}
                <div className="d-flex bd-highlight" style={{ justifyContent: "flex-end" }}>
                  <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 13, textAlign: "right", width: 105, height: 18 }}>รวมทั้งสิ้น :</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 13, textAlign: "right", width: 45, height: 18 }}>{sumtotalVal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 13, textAlign: "left", width: 20, height: 18, paddingLeft: 3 }}>บาท</div>
                </div>

                {/* VAT note */}
                <div className="row mt-1" style={{ fontFamily: "kanit", fontSize: 8, textAlign: "center", justifySelf: "center", color: "#555" }}>** ราคารวมภาษีมูลค่าเพิ่มแล้ว **</div>
              </div>
            ) : (
              /* ========== Non-VAT Receipt Footer (Original) ========== */
              <div className="d-flex flex-column" style={{ alignItems: "flex-end" }}>
                <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80, height: 15 }}>รวมมูลค่าสินค้า :</div>
                  <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", width: 30, height: 15 }}>{totalall?.toFixed(0)}</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                </div>

                <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80, height: 15 }}>ส่วนลด :</div>
                  <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", width: 30, height: 15 }}>{discountVal?.toFixed(0)}</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                </div>

                {memberDiscountVal > 0 && (
                  <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80, height: 15 }}>ส่วนลดสมาชิก :</div>
                    <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", width: 30, height: 15 }}>{memberDiscountVal?.toFixed(0)}</div>
                    <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                  </div>
                )}

                <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "right", width: 80, height: 15 }}>ใช้แต้มส่วนลด :</div>
                  <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "center", width: 30, height: 15 }}>{userewardVal?.toFixed(0)}</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit", fontSize: 10, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                </div>

                <div className="d-flex bd-highlight" style={{ justifySelf: "end" }}>
                  <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "right", width: 80, height: 15 }}>ยอดรวมสุทธิ :</div>
                  <div className="bd-highlight ml-1 mr-1" style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "center", width: 30, height: 15 }}>{sumtotalVal?.toFixed(0)}</div>
                  <div className="bd-highlight" style={{ fontFamily: "kanit_B", fontSize: 12, textAlign: "left", width: 15, height: 15 }}>บาท</div>
                </div>
              </div>
            )}

          </div>
          <div className="h-5"></div>
        </div>
      </div>

    </div>

  )



}
export default ReceiptItem