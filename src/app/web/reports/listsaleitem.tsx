'use client'

import React, { useEffect, useState } from "react";
import { Table } from 'react-bootstrap';
import axios from 'axios'
import { ShoppingCart, X, Printer, ReceiptText, Landmark, Tag, Truck } from "lucide-react";
import styles from "../componant/mystyle.module.css";

import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";

import { usePermission } from "@/utils/usePermission";
import LabelPrintModal from "./LabelPrintModal";

const apiRC = "receivelist"

function SaleListItem({ data, onPrint, onPrintA4, onGenTax, onPrintDeliveryNote, onRefresh, storeS, addressS, telS, uploadedUrl }: any) {

  const idF = Number(data)

  const { hasPermission } = usePermission()
  const canCancel = hasPermission("J16")

  const [isOwner, setIsOwner] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOwner((localStorage.getItem("level_") || "") === "level2")
    }
  }, [])

  const [selectedPS, setSelectedPS] = useState("")
  useEffect(() => {
    setSelectedPS(localStorage.getItem("ps") || "")
  }, [])


  const [itemsale, setItemsale] = useState<any[]>([])
  const [itemdetail, setItemdetail] = useState<any>({})
  const [itemdetailM, setItemdetailM] = useState<any[]>([])
  const [itemdetailRC, setItemdetailRC] = useState<any[]>([])
  const [salemain, setsalemain] = useState<any[]>([])
  const [saleid, setsaleid] = useState("")
  const [itemRC, setitemRC] = useState("")
  const [liveBalance, setLiveBalance] = useState<number | null>(null)

  useEffect(() => {
    fetchPostsz()
  }, [idF])

  const fetchPostsz = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/salelist?company=${companyS}&id_salemain=${idF}`)
      setItemsale(res.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    Promise.all([GetDataSaleItem(), GetRCItem()])
  }, [Number(saleid), idF]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!itemRC) { setLiveBalance(null); return; }
      try {
        const companyS = localStorage.getItem("company_") || "";
        const res = await axios.get(`/api/sale_cal/sale_balance?company=${companyS}&code_product=${itemRC}`);
        setLiveBalance(res.data?.[0]?.balance ?? 0);
      } catch { setLiveBalance(null); }
    };
    fetchBalance();
  }, [itemRC]);

  const GetDataSaleItem = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    // ยังไม่ได้เลือกรายการขาย (saleid ว่าง/0/ไม่ถูกต้อง) → ไม่ต้องเรียก API
    if (!Number.isInteger(Number(saleid)) || Number(saleid) <= 0) return
    try {
      const res = await axios.get(`/api/salelist/${Number(saleid)}`)
      const itemdetailS = res.data
      Number(saleid) === 0 ? "" : setItemdetail(itemdetailS)
      Number(saleid) === 0 ? "" : setItemdetailM(itemdetailS)
      const idsalemain = JSON.stringify(itemdetailS)
      const pausesalemain = JSON.parse(idsalemain)
      let idMainSale = Number(saleid) === 0 ? "" : [pausesalemain].map((a: any) => a.id_salemain)[0] ?? ""
      const res_salemain = await axios.get(`/api/sale/${Number(idMainSale)}`)
      Number(saleid) === 0 ? "" : setsalemain(res_salemain.data)
    } catch (error) { console.error(error) }
  }

  const GetRCItem = async () => {
    let companyS = (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${apiRC}?company=${companyS}&itemcode=${itemRC}`)
      setItemdetailRC(res.data)
    } catch (error) { console.error(error) }
  }

  const Update_ItemRC = async () => {
    try {
      const detailHeader = Array.isArray(itemdetail) ? itemdetail[0] : itemdetail;
      if (!detailHeader || !detailHeader.code_product) {
        console.warn("Update_ItemRC: detailHeader or code_product is missing.");
        return;
      }

      // จำนวนขาย: ใช้ subqty ถ้ามีค่า, ถ้าไม่มีใช้ qty
      const subqty = detailHeader?.subqty;
      const saleQty = (subqty === 0 || subqty === "" || subqty === null || subqty === undefined)
        ? Number(detailHeader?.qty || 0)
        : Number(subqty);

      // ยอดคงเหลือจาก API
      const currentBalance = liveBalance !== null ? liveBalance : 0;

      // Get current RC lot records
      const lot1 = itemdetailRC.find((a: any) => a.id === Number(detailHeader?.id_receive1));

      if (!lot1) {
        console.warn("Update_ItemRC: No lot record found for id_receive1.");
        return;
      }

      const sales_lot = [{
        id_receive1: Number(detailHeader?.id_receive1 || 0),
        qty_lot1: saleQty,
        lot_receive1: detailHeader?.lot_receive1 || "",
        sale_lot1: Number(lot1?.sale || 0) - saleQty,
        balance_lot1: Number(lot1?.balance || 0) + saleQty,
      }]

      console.log("Update_ItemRC:", { saleQty, currentBalance, sales_lot });

      const person = localStorage.getItem("person_") || ""
      await axios.put(`/api/cutstock`, { sales_lot, person })
    } catch (error) { console.error("Update_ItemRC Error:", error) }
  }

  const UpdateSale = async () => {
    try {
      const saleMainObj = Array.isArray(salemain) ? salemain[0] : salemain;
      const detailObj = Array.isArray(itemdetail) ? itemdetail[0] : itemdetail;

      if (!saleMainObj || !saleMainObj.id || !detailObj) {
        console.warn("UpdateSale: Missing salemain or itemdetail data.");
        return;
      }

      const id_salemain = Number(saleMainObj.id);
      const saleIdNum = Number(saleid);

      if (isNaN(id_salemain) || id_salemain === 0 || isNaN(saleIdNum) || saleIdNum === 0) {
        console.warn("UpdateSale: Invalid ID detected.", { id_salemain, saleIdNum });
        return;
      }

      // Fetch fresh salemain data to prevent stale data issues
      const freshSaleMainRes = await axios.get(`/api/sale/${id_salemain}`);
      const freshSaleMain = freshSaleMainRes.data;

      const personall = localStorage.getItem("person_") || "";

      const id_receive1 = 0;
      const lot_receive1 = "";
      const qty_lot1 = 0;
      const id_receive2 = 0;
      const lot_receive2 = "";
      const qty_lot2 = 0;
      const id_receive3 = 0;
      const lot_receive3 = "";
      const qty_lot3 = 0;
      const person = localStorage.getItem("person_") || "";
      const statuss = "ยกเลิก";

      // Check if this is the last active item in the bill
      const activeItems = itemsale.filter((item: any) => item.statuss !== 'ยกเลิก');
      const isLastItem = activeItems.length <= 1;

      // Only mark bill as cancelled when ALL items are cancelled
      const statussall = isLastItem ? "ยกเลิก" : "";

      let totalall: number;
      let sumtotal: number;
      let usereward: number | undefined = undefined;
      let discount: number | undefined = undefined;

      let beforeVat: number | undefined = undefined;
      let vatAmount: number | undefined = undefined;

      if (isLastItem) {
        // All items cancelled → reset everything to 0
        totalall = 0;
        sumtotal = 0;
        usereward = 0;
        discount = 0;
        beforeVat = 0;
        vatAmount = 0;

        const userewardBaht = Number(freshSaleMain?.usereward || 0);

        if (userewardBaht > 0) {
          // Fetch reward settings to convert baht → points
          const companyS = localStorage.getItem("company_") || "";
          const pointSettingRes = await axios.get(`/api/setting/point?company=${companyS}`);
          const pointSetting = pointSettingRes.data?.[0];

          if (pointSetting) {
            const pointsetS = Number(pointSetting.pointset || 0);
            const discountS = Number(pointSetting.discount || 0);

            if (discountS > 0 && pointsetS > 0) {
              // Convert baht back to points: points = (baht / discountS) * pointsetS
              const refundPoints = Math.round((userewardBaht / discountS) * pointsetS);

              // Return points to customer
              const customerId = Number(freshSaleMain?.id_costomer || 0);
              if (customerId > 0 && refundPoints > 0) {
                try {
                  const cusRes = await axios.get(`/api/customer/${customerId}`);
                  const currentTotalPoint = Number(cusRes.data?.totalPoint || 0);
                  const newTotalPoint = currentTotalPoint + refundPoints;
                  await axios.put(`/api/customer/${customerId}`, {
                    totalPoint: newTotalPoint
                  });
                  console.log(`Refunded ${refundPoints} points to customer ${customerId}. totalPoint: ${currentTotalPoint} → ${newTotalPoint}`);
                } catch (cusError) {
                  console.error("Refund points to customer failed:", cusError);
                }
              }
            }
          }
        }
      } else {
        totalall = Number(freshSaleMain?.totalall || 0) - Number(detailObj.total || 0);
        sumtotal = Number(freshSaleMain?.sumtotal || 0) - Number(detailObj.total || 0);
        // Recalculate VAT based on new sumtotal
        if (Number(freshSaleMain?.vatAmount || 0) > 0) {
          beforeVat = Number((sumtotal / 1.07).toFixed(2));
          vatAmount = Number((sumtotal - beforeVat).toFixed(2));
        }
      }

      await axios.put(`/api/sale/${saleIdNum}`,
        { id_salemain, totalall, sumtotal, personall, statussall, id_receive1, lot_receive1, qty_lot1, id_receive2, lot_receive2, qty_lot2, id_receive3, lot_receive3, qty_lot3, person, statuss, usereward, discount, beforeVat, vatAmount }
      );

      setTimeout(() => {
        fetchPostsz()
        if (onRefresh) onRefresh()
      }, 300);
    } catch (error) { console.error("UpdateSale Error:", error) }
  }

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isLabelOpen, onOpen: onLabelOpen, onOpenChange: onLabelOpenChange } = useDisclosure();

  const saleMainObjView = Array.isArray(salemain) ? salemain[0] : salemain;

  return (
    <div className={styles.reportItemPanelInner}>
      {/* Header */}
      <div className={styles.reportItemHeader}>
        <div className={styles.reportItemTitleGroup}>
          <span className={styles.reportItemTitleIcon}><ShoppingCart size={16} strokeWidth={2.4} /></span>
          <span>รายงานสินค้า</span>
        </div>
        <div className={styles.reportItemHeaderActions}>
          <button
            onClick={() => onGenTax?.()}
            className={`${styles.reportItemPrintButton} ${styles.reportItemGenTaxButton}`}
            title="สร้างใบกำกับภาษี"
            disabled={!idF || !onGenTax}
          >
            <Landmark size={15} strokeWidth={2.3} />
            <span>ภาษี</span>
          </button>
          <button
            onClick={() => onPrintA4?.()}
            className={`${styles.reportItemPrintButton} ${styles.reportItemPrintA4Button}`}
            title="พิมพ์ใบเสร็จรับเงิน A4"
            disabled={!idF || !onPrintA4}
          >
            <ReceiptText size={15} strokeWidth={2.3} />
            <span>A4</span>
          </button>
          <button
            onClick={() => onLabelOpen()}
            className={`${styles.reportItemPrintButton} ${styles.reportItemPrintLabelButton}`}
            title="พิมพ์ฉลากสินค้า"
            disabled={!idF || itemsale.length === 0}
          >
            <Tag size={15} strokeWidth={2.3} />
            <span>พิมพ์ฉลาก</span>
          </button>
          <button
            onClick={() => onPrintDeliveryNote?.()}
            className={`${styles.reportItemPrintButton} ${styles.reportItemDeliveryNoteButton}`}
            title="สร้างใบส่งสินค้า"
            disabled={!idF || !onPrintDeliveryNote}
          >
            <Truck size={15} strokeWidth={2.3} />
            <span>ใบส่งสินค้า</span>
          </button>
          <button
            onClick={() => onPrint()}
            className={styles.reportItemPrintButton}
            title="พิมพ์ใบเสร็จ"
            disabled={!idF}
          >
            <Printer size={15} strokeWidth={2.3} />
          </button>
        </div>
      </div>


      {/* Table */}
      <div className={styles.reportItemTableArea}>
        <Table hover borderless className={`mb-0 ${styles.reportItemTable}`} style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr style={{
              background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
              boxShadow: 'inset 0 -1px 0 #e2e8f0'
            }}>
              <th style={{ padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: '0.3px', textTransform: 'uppercase' }}>รหัส</th>
              <th style={{ padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#475569', fontWeight: 700, textAlign: 'left', letterSpacing: '0.3px', textTransform: 'uppercase' }}>รายการสินค้า</th>
              <th style={{ padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: '0.3px', textTransform: 'uppercase' }}>หน่วย</th>
              <th style={{ padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#475569', fontWeight: 700, textAlign: 'right', letterSpacing: '0.3px', textTransform: 'uppercase' }}>จำนวน</th>
              <th style={{ padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#475569', fontWeight: 700, textAlign: 'right', letterSpacing: '0.3px', textTransform: 'uppercase' }}>ราคา</th>
              <th style={{ padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#475569', fontWeight: 700, textAlign: 'right', letterSpacing: '0.3px', textTransform: 'uppercase' }}>รวม</th>
              {isOwner && (
                <>
                  <th style={{ padding: '8px 4px', fontFamily: 'Kanit_B', fontSize: '11px', color: '#b45309', fontWeight: 700, textAlign: 'right', letterSpacing: '0.2px', textTransform: 'uppercase', background: '#fffbeb', width: '60px' }}>ทุนรวม</th>
                  <th style={{ padding: '8px 4px', fontFamily: 'Kanit_B', fontSize: '11px', color: '#0F6845', fontWeight: 700, textAlign: 'right', letterSpacing: '0.2px', textTransform: 'uppercase', background: '#EDF9F3', width: '70px' }}>กำไร / %</th>
                </>
              )}
              <th style={{ padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: '0.3px', textTransform: 'uppercase' }}>สถานะ</th>
              {canCancel && (
                <th style={{ padding: '10px 8px', fontFamily: 'Kanit_B', fontSize: '12px', color: '#475569', fontWeight: 700, textAlign: 'center', letterSpacing: '0.3px', textTransform: 'uppercase' }}>ยกเลิกบิล</th>
              )}
            </tr>
          </thead>
          <tbody>
            {itemsale.map((w: any, idx: number) => {
              const isCancelled = w.statuss === 'ยกเลิก'
              const total = Number(w.total || 0)
              const cost = Number(w.cost || 0)
              const profit = total - cost
              const profitPct = total > 0 ? (profit / total) * 100 : 0
              const numFmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              return (
              <tr key={w.id} style={{
                borderBottom: '1px solid #f1f5f9',
                background: isCancelled ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#fafbfc'),
                opacity: isCancelled ? 0.7 : 1,
                transition: 'background 0.15s'
              }}>
                <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '13px', color: '#6366f1', textAlign: 'center', fontWeight: 600, textDecoration: isCancelled ? 'line-through' : 'none' }}>{w.code_product}</td>
                <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '13px', color: '#1e293b', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: isCancelled ? 'line-through' : 'none' }} title={w.name_product}>{w.name_product}</td>
                <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>{w.unit}</td>
                <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '13px', color: '#1e293b', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{Number(w.qty || 0).toLocaleString()}</td>
                <td style={{ padding: '8px', fontFamily: 'Kanit', fontSize: '13px', color: '#475569', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{numFmt(Number(w.price || 0))}</td>
                <td style={{ padding: '8px', fontFamily: 'Kanit_B', fontSize: '13px', color: '#3E86C7', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{numFmt(total)}</td>
                {isOwner && (
                  <>
                    <td style={{ padding: '6px 4px', fontFamily: 'Kanit', fontSize: '11px', color: '#b45309', textAlign: 'right', fontVariantNumeric: 'tabular-nums', background: '#fffbeb', whiteSpace: 'nowrap' }}>{numFmt(cost)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', background: '#F3F8FC', whiteSpace: 'nowrap' }}>
                      <div style={{
                        fontFamily: 'Kanit_B', fontSize: '11px',
                        color: profit >= 0 ? '#0F6845' : '#dc2626',
                        fontVariantNumeric: 'tabular-nums', fontWeight: 700, lineHeight: 1.2
                      }}>{numFmt(profit)}</div>
                      <div style={{
                        fontFamily: 'Kanit', fontSize: '10px',
                        color: profitPct >= 20 ? '#147F56' : profitPct >= 0 ? '#a16207' : '#dc2626',
                        fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, fontWeight: 600
                      }}>{profitPct.toFixed(1)}%</div>
                    </td>
                  </>
                )}
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <span style={{
                    fontFamily: 'Kanit_B', fontSize: '12px', padding: '3px 10px', borderRadius: '999px',
                    fontWeight: 600,
                    backgroundColor: isCancelled ? '#fee2e2' : '#D3F0E2',
                    color: isCancelled ? '#ef4444' : '#147F56',
                    border: isCancelled ? '1px solid #fecaca' : '1px solid #A9E1C6'
                  }}>{w.statuss || 'ปกติ'}</span>
                </td>
                {canCancel && (
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {!isCancelled && (
                    <button
                      onClick={() => { setsaleid(w.id), setitemRC(w.code_product), onOpen() }}
                      data-logbook-context={`${w.code_product || ''} ${w.name_product || ''}`.trim()}
                      data-logbook-code={w.code_product || ''}
                      data-logbook-name={w.name_product || ''}
                      style={{
                        fontFamily: 'Kanit', fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
                        border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer',
                        fontWeight: 600, transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2' }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
                    >
                      ยกเลิก
                    </button>
                  )}

                  <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior={"inside"}>
                    <ModalContent style={{ backgroundColor: 'white', borderRadius: '16px', width: 380, maxHeight: '50vh' }}>
                      {(onClose) => (
                        <>
                          <div style={{
                            background: '#fef2f2',
                            borderBottom: '2px solid #ef4444',
                            color: '#991b1b', padding: '16px 20px', fontFamily: 'Kanit_B', fontSize: '15px',
                            display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '16px 16px 0 0'
                          }}>
                            <X size={18} /> ยกเลิก รายการสินค้า
                          </div>
                          <ModalBody style={{ padding: '20px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                                {[itemdetail].map((a: any) => a.code_product)[0]} {[itemdetail].map((a: any) => a.name_product)[0]}
                              </div>
                              <div style={{ fontFamily: 'Kanit', fontSize: '15px', color: '#64748b' }}>
                                จำนวน: {[itemdetail].map((a: any) => a.qty)[0]} {[itemdetail].map((a: any) => a.unit)[0]}
                              </div>
                              <div style={{ fontFamily: 'Kanit', fontSize: '15px', color: '#64748b' }}>
                                จำนวนย่อย: {[itemdetail].map((a: any) => a.subqty)[0]} {[itemdetail].map((a: any) => a.subunit)[0]}
                              </div><div style={{ fontFamily: 'Kanit', fontSize: '15px', color: '#64748b' }}>
                                คงเหลือ: {liveBalance !== null ? liveBalance : [itemdetail].map((a: any) => a.subqty)[0]} {[itemdetail].map((a: any) => a.subunit)[0]}
                              </div>
                            </div>
                          </ModalBody>
                          <ModalFooter style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button onClick={() => { onClose(), Update_ItemRC(), UpdateSale() }}
                              data-logbook-context={`${[itemdetail].map((a: any) => a.code_product)[0] || ''} ${[itemdetail].map((a: any) => a.name_product)[0] || ''}`.trim()}
                              data-logbook-code={[itemdetail].map((a: any) => a.code_product)[0] || ''}
                              data-logbook-name={[itemdetail].map((a: any) => a.name_product)[0] || ''}
                              style={{
                                fontFamily: 'Kanit', fontSize: '14px', padding: '10px 24px', borderRadius: '8px', border: 'none',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', cursor: 'pointer'
                              }}>
                              ยกเลิก
                            </button>
                            <button onClick={onClose}
                              style={{
                                fontFamily: 'Kanit', fontSize: '14px', padding: '10px 24px', borderRadius: '8px',
                                border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer'
                              }}>
                              ปิด
                            </button>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
                </td>
                )}
              </tr>
              )
            })}
          </tbody>
        </Table>
        {itemsale.length === 0 && (
          <div className={styles.reportItemEmptyState}>
            <ShoppingCart size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontFamily: 'Kanit' }}>เลือกรายการเพื่อดูสินค้า</div>
          </div>
        )}
      </div>

      <LabelPrintModal
        isOpen={isLabelOpen}
        onOpenChange={onLabelOpenChange}
        items={itemsale.filter((w: any) => w.statuss !== 'ยกเลิก')}
        storeS={storeS}
        addressS={addressS}
        telS={telS}
        uploadedUrl={uploadedUrl}
        customerName={itemsale[0]?.name_customer || ""}
        pharmacistName={selectedPS || saleMainObjView?.personall || ""}
      />
    </div>
  )
}
export default SaleListItem