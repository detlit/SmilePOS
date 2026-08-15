"use client";
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Head from "next/head";
import { Table } from 'react-bootstrap';
import styles from "../../componant/mystyle.module.css"
import LogoSmile from '../../../../app/icon/Smile2.png'
import Headpp from '../../../../app/icon/pp.png'
import Image from "next/image";
import PromptPayQRCode from '../../componant/PromptPayQRCode'
import axios from 'axios'
import BuyerCommunicationModal from '../BuyerCommunicationModal'
const getpayment = "setting/payment"


export default function CustomerPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [connected, setConnected] = useState(false);



    useEffect(() => {
        const handler = async (e: MessageEvent) => {
            if (e.data?.action === "enter_fullscreen") {
                try {
                    // เข้าสู่ fullscreen อัตโนมัติ
                    await document.documentElement.requestFullscreen();
                } catch (err) {
                    console.log("Fullscreen failed:", err);
                }
            }
        };

        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);

    useEffect(() => {
        fetchPosts()
    }, []);

    const [nameS, SetnameS] = useState("")
    const fetchPosts = async () => {
        let companyS = (localStorage.getItem("company_") || "")
        try {
            const res = await axios.get(`/api/${getpayment}?company=${companyS}`)  //Get_Employee

            res.data == undefined ? "" : SetnameS(res.data[0].name)
            console.log(res.data)

        } catch (error) {
            console.error(error)
        }

    }

    const [orderList, setOrderList] = useState<any[]>([]);
    const [summary, setSummary] = useState<any[]>([]);
    const [hidePrice, setHidePrice] = useState(false);
    console.log(summary)

    useEffect(() => {
        const interval = setInterval(async () => {

            try {
                let listS = JSON.parse(localStorage.getItem("listS") || "[]")
                let mainS = JSON.parse(localStorage.getItem("main") || "[]")
                setOrderList(listS);
                setSummary(mainS);
            } catch {
                setOrderList([]);
                setSummary([]);
            }
            setHidePrice(localStorage.getItem('hideCustomerPrice') === 'true');

        }, 3000); // poll ทุก 2 วินาที

        return () => clearInterval(interval);
    }, []);


    const [salemain, setsalemain] = useState({});
    useEffect(() => {
        const interval = setInterval(async () => {

            try {
                let salemainS = JSON.parse(localStorage.getItem("salemain") || "{}")
                setsalemain(salemainS);
            } catch {
                setsalemain({});
            }

        }, 3000); // poll ทุก 2 วินาที

        return () => clearInterval(interval);
    }, []);

    // Customer points data
    const [customerPoints, setCustomerPoints] = useState<{
        code_cus: string;
        name_cus: string;
        total_cus: string;
        pointFromBill: number;
        totalPointAfter: number;
    }>({
        code_cus: "",
        name_cus: "",
        total_cus: "0",
        pointFromBill: 0,
        totalPointAfter: 0
    });

    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const pointsData = localStorage.getItem("customerPoints");
                if (pointsData) {
                    setCustomerPoints(JSON.parse(pointsData));
                }
            } catch (e) {
                console.error("Failed to parse customerPoints", e);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // Customer Points Display Component
    const CustomerPointsDisplay = () => {
        if (!customerPoints.code_cus) return null;

        return (
            <div style={{
                background: "#ffffff",
                borderRadius: 8,
                padding: "8px 12px",
                margin: "5px 15px",
                border: "2px solid #e0e0e0",
                fontFamily: "kanit"
            }}>
                <div style={{ fontSize: 14, color: "#2c5282", marginBottom: 4, fontWeight: "600" }}>
                    🎯 แต้มสะสมลูกค้า - {customerPoints.name_cus || "ลูกค้าทั่วไป"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", gap: 8 }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#222", fontWeight: "500" }}>แต้มก่อนขาย</div>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#000", lineHeight: 1.1 }}>{customerPoints.total_cus || 0}</div>
                        <div style={{ fontSize: 10, color: "#444" }}>แต้ม</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#222", fontWeight: "500" }}>แต้มยอดบิล</div>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#0a5d22", lineHeight: 1.1 }}>{customerPoints.pointFromBill || 0}</div>
                        <div style={{ fontSize: 10, color: "#444" }}>แต้ม</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#222", fontWeight: "500" }}>แต้มรวม</div>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#8b4000", lineHeight: 1.1 }}>{customerPoints.totalPointAfter || 0}</div>
                        <div style={{ fontSize: 10, color: "#444" }}>แต้ม</div>
                    </div>
                </div>
            </div>
        );
    };

    // Payment Gateway state
    const [selectedProvider, setSelectedProvider] = useState("promptpay")
    const [gatewayData, setGatewayData] = useState<any>(null) // { txId, qrData, qrImageUrl, message }
    const [txStatus, setTxStatus] = useState<string>("") // "pending","success","failed","expired"
    const [lastCreatedKey, setLastCreatedKey] = useState("") // track provider+amount to avoid duplicate create

    const providerLabels: Record<string, { name: string; color: string }> = {
        promptpay: { name: "PromptPay", color: "#003b80" },
        maemanee: { name: "แม่มณี (SCB)", color: "#4e2a84" },
        scb: { name: "แม่มณี (SCB)", color: "#4e2a84" },
        kshop: { name: "K-Shop (KBank)", color: "#00813e" },
        alipay: { name: "Alipay", color: "#1677ff" },
        wechat: { name: "WeChat Pay", color: "#07c160" },
        truemoney: { name: "TrueMoney Wallet", color: "#ff6600" },
        edc: { name: "EDC (บัตร)", color: "#333" },
    }

    const totalAmount = Number(orderList.reduce((acc, item) => acc + item.total, 0) ?? 0) - Number(summary.reduce((acc, item) => acc + item.discount, 0) ?? 0)
    const syncedProvider = selectedProvider || (salemain as any)?.payment_provider || "promptpay"

    // ยอดที่ต้องแสดง QR / ขอรับ:
    //  - pay = "payment" (โอนทั้งหมด)  → totalAmount
    //  - pay = "split"  (แยกจ่าย)         → transferAmount จาก salemain
    const payMode = String((salemain as any)?.pay ?? "")
    const splitTransferAmount = Number((salemain as any)?.transferAmount || 0)
    const qrAmount = payMode === "split" ? splitTransferAmount : totalAmount

    // Poll payment_provider from salemain to stay in sync with sales page
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const salemainData = JSON.parse(localStorage.getItem("salemain") || "{}")
                const currentProvider = localStorage.getItem("payment_provider") || salemainData.payment_provider || "promptpay"
                setSelectedProvider(prev => {
                    if (prev !== currentProvider) return currentProvider
                    return prev
                })
            } catch (e) {
                // ignore parse errors
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Create payment via gateway when provider/amount changes
    // Skip for promptpay (client-side QR) and edc (manual card swipe)
    useEffect(() => {
        const payMode2 = String([salemain]?.map((t: any) => t.pay)?.[0] ?? "")
        const isPayment = payMode2 === "payment" || (payMode2 === "split" && qrAmount > 0)

        if (!isPayment || qrAmount <= 0 || syncedProvider === "promptpay" || syncedProvider === "edc") {
            setGatewayData(null)
            setTxStatus("")
            return
        }

        const key = `${syncedProvider}_${qrAmount}`
        if (key === lastCreatedKey && gatewayData) return // already created

        const createPayment = async () => {
            const companyS = localStorage.getItem("company_") || ""
            try {
                const res = await axios.post("/api/gateway/create-payment", {
                    company: companyS,
                    provider: syncedProvider,
                    amount: qrAmount,
                })
                setGatewayData(res.data)
                setTxStatus(res.data.status || "pending")
                setLastCreatedKey(key)
                // Store txId for manual confirm from sales page
                localStorage.setItem("current_txId", res.data.txId || "")
            } catch (error: any) {
                console.error("create-payment error:", error)
                setGatewayData(null)
                setTxStatus("")
            }
        }
        createPayment()
    }, [salemain, totalAmount, syncedProvider])

    // Poll check-status for pending transactions
    useEffect(() => {
        if (!gatewayData?.txId || txStatus !== "pending") return

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`/api/gateway/check-status/${gatewayData.txId}`)
                const newStatus = res.data.status
                if (newStatus !== txStatus) {
                    setTxStatus(newStatus)
                }
            } catch (error) {
                console.error("check-status error:", error)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [gatewayData?.txId, txStatus])

    const Change = () => {
        const payMode2 = String([salemain]?.map((t: any) => t.pay)?.[0] ?? "")
        const isPayment = payMode2 === "payment" || (payMode2 === "split" && qrAmount > 0)
        const pLabel = providerLabels[syncedProvider] || { name: syncedProvider, color: "#333" }

        // Payment success overlay
        if (isPayment && txStatus === "success") {
            return (
                <>
                    <div style={{
                        textAlign: "center", padding: "30px 20px",
                        background: "linear-gradient(135deg, #F3F8FC, #E5EEF8)",
                        borderRadius: 16, margin: "10px 15px",
                        border: "2px solid #A6C8E7",
                    }}>
                        <div style={{ fontSize: 64, marginBottom: 8 }}>✅</div>
                        <div style={{ fontFamily: "kanit", fontSize: 32, fontWeight: 700, color: "#1E5088" }}>
                            ชำระเงินสำเร็จ
                        </div>
                        <div style={{ fontFamily: "kanit", fontSize: 18, color: "#173F6B", marginTop: 4 }}>
                            {pLabel.name} — {qrAmount.toLocaleString()} บาท
                        </div>
                    </div>
                    <CustomerPointsDisplay />
                </>
            )
        }

        return (
            <>
                {isPayment ? (
                    <div className='row' style={{ justifyContent: "center" }}>
                        {/* Provider Header */}
                        <div style={{
                            textAlign: "center", padding: "8px 0", marginBottom: 4,
                            fontFamily: "kanit", fontSize: 22, fontWeight: 700,
                            color: pLabel.color,
                        }}>
                            {pLabel.name}
                            {payMode === "split" && (
                                <div style={{ fontFamily: 'kanit', fontSize: 14, fontWeight: 500, color: '#64748b', marginTop: 2 }}>
                                    💳 แยกจ่าย — ส่วนที่โอน <b style={{ color: '#2A6AAA' }}>{qrAmount.toLocaleString()}</b> บาท
                                </div>
                            )}
                        </div>

                        {/* PromptPay - auto generate QR */}
                        {syncedProvider === "promptpay" && (
                            <>
                                <Image alt={""} src={Headpp} quality={100} style={{ width: '60%', height: '100%' }} />
                                <div style={{ justifyItems: "center", fontFamily: "kanit", fontSize: 20 }}>
                                    <PromptPayQRCode promptPayId={nameS} amount={qrAmount} />
                                </div>
                            </>
                        )}

                        {/* EDC - manual confirm */}
                        {syncedProvider === "edc" && (
                            <div style={{ textAlign: "center", padding: "40px 20px" }}>
                                <div style={{ fontSize: 60, marginBottom: 10 }}>💳</div>
                                <div style={{ fontFamily: "kanit", fontSize: 28, fontWeight: 700, color: "#333" }}>
                                    กรุณารูดบัตร
                                </div>
                                <div style={{ fontFamily: "kanit", fontSize: 36, fontWeight: 700, color: "#2A6AAA", marginTop: 10 }}>
                                    {qrAmount.toLocaleString()} บาท
                                </div>
                            </div>
                        )}

                        {/* Other providers - static QR image from gateway */}
                        {syncedProvider !== "promptpay" && syncedProvider !== "edc" && (
                            <div style={{ textAlign: "center", padding: "10px 0" }}>
                                {gatewayData?.qrImageUrl ? (
                                    <>
                                        <img
                                            src={gatewayData.qrImageUrl}
                                            alt={pLabel.name + " QR"}
                                            style={{
                                                maxWidth: 250, maxHeight: 250,
                                                objectFit: "contain", borderRadius: 8,
                                                border: "2px solid #e5e7eb",
                                                margin: "0 auto", display: "block",
                                            }}
                                        />
                                        <div style={{
                                            fontFamily: "kanit", fontSize: 28, fontWeight: 700,
                                            color: "#2A6AAA", marginTop: 10, textAlign: "center",
                                        }}>
                                            ยอดโอน {totalAmount.toLocaleString()} บาท
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: "30px 0" }}>
                                        <div style={{ fontSize: 50, marginBottom: 8 }}>📱</div>
                                        <div style={{ fontFamily: "kanit", fontSize: 18, color: "#9ca3af" }}>
                                            ยังไม่ได้อัปโหลด QR Code
                                        </div>
                                        <div style={{ fontFamily: "kanit", fontSize: 14, color: "#d1d5db", marginTop: 4 }}>
                                            กรุณาตั้งค่าในหน้า Setting
                                        </div>
                                        <div style={{
                                            fontFamily: "kanit", fontSize: 28, fontWeight: 700,
                                            color: "#2A6AAA", marginTop: 10,
                                        }}>
                                            ยอดโอน {totalAmount.toLocaleString()} บาท
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Transaction status indicator */}
                        {gatewayData?.txId && txStatus === "pending" && (
                            <div style={{
                                textAlign: "center", fontFamily: "kanit", fontSize: 13,
                                color: "#94a3b8", marginTop: 6,
                            }}>
                                รอการชำระ...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='row'>
                        <Image alt={""} src={LogoSmile} quality={100} style={{ width: '100%', height: '100%' }} />
                    </div>
                )}
                <CustomerPointsDisplay />
            </>
        )
    }

    return (
        <div >

            <div className='row'>
                <div className='col-sm-6'>
                    <div className="p-1 ">
                        <Change />
                    </div>

                </div>

                <div className='col-sm-6  ' >

                    {!hidePrice && (
                    <>
                    <div className="row justify-content-between" style={{ justifyContent: "right", width: "97%", height: 25 }}>
                        <div className="col" style={{ fontFamily: "kanit", fontSize: 18, textAlign: "left", width: "Auto", justifySelf: "left", marginTop: 10 }}>รับเงิน :</div>
                        <div className="col" style={{ fontFamily: "kanit", fontSize: 25, textAlign: "right", width: "Auto", alignSelf: "end" }}>{Number([salemain]?.map((t: any) => t.receivebaht)?.[0] ?? "").toLocaleString()}</div>

                    </div>

                    <div className="row justify-content-between" style={{ justifyContent: "right", width: "97%", height: 18 }}>
                        <div className="col" style={{ fontFamily: "kanit", fontSize: 18, textAlign: "left", width: "Auto", justifySelf: "left", marginTop: 10 }}>ส่วนลด :</div>
                        <div className="col" style={{ fontFamily: "kanit", fontSize: 25, textAlign: "right", width: "Auto", alignSelf: "end" }}>{Number(summary.reduce((acc, item) => acc + item.discount, 0) ?? 0).toLocaleString()}</div>

                    </div>



                    <div className="row justify-content-between" style={{ justifyContent: "right", width: "97%", height: 45 }}>
                        <div className="col" style={{ fontFamily: "kanit", fontSize: 30, textAlign: "left", width: "Auto", marginTop: 20, justifySelf: "left" }}>ยอดรวม :</div>
                        <div className="col " style={{ fontFamily: "kanit", fontSize: 45, textAlign: "right", width: "Auto", alignSelf: "end", color: "#2A6AAA" }}>{(Number(orderList.reduce((acc, item) => acc + item.total, 0) ?? 0) - Number(summary.reduce((acc, item) => acc + item.discount, 0) ?? 0)).toLocaleString()}</div>

                    </div>
                    <div className="row justify-content-between" style={{ justifyContent: "right", width: "97%", height: 45 }}>
                        <div className="col" style={{ fontFamily: "kanit", fontSize: 23, textAlign: "left", marginTop: 15, width: "Auto", justifySelf: "left" }}>เงินทอน :</div>
                        <div className="col " style={{ fontFamily: "kanit", fontSize: 35, textAlign: "right", width: "Auto", alignSelf: "end", color: "brown" }}>
                            {
                                Number(Number([salemain]?.map((t: any) => t.receivebaht)?.[0] ?? 0) +
                                    Number(summary.reduce((acc, item) => acc + item.discount, 0) ?? 0) -
                                    Number(orderList.reduce((acc, item) => acc + item.total, 0) ?? 0))
                            }</div>

                    </div>
                    </>
                    )}



                    {!hidePrice && (
                    <div className='row mt-2 '>
                        <Table className="table  " size="sm" style={{ width: "95%" }}>
                            <thead>
                                <tr>

                                    <td className={styles.bodydetailTable_Re} style={{ width: "65%", color: "GrayText", fontFamily: "kanit", fontSize: 12 }}>รายการสินค้า</td>
                                    <td className={styles.bodydetailTable_Re} style={{ width: "10%", color: "GrayText", fontFamily: "kanit", fontSize: 12, textAlign: "center" }}>จำนวน</td>
                                    <td className={styles.bodydetailTable_Re} style={{ width: "10%", color: "GrayText", fontFamily: "kanit", fontSize: 12, textAlign: "center" }}>รวม</td>
                                </tr>
                            </thead>

                            <tbody className="table-group-divider "  >

                                {orderList?.map((w: any) =>
                                    <tr key={w.id} >
                                        <td className={styles.bodydetailTable_Re1} ><div style={{ width: "100%", fontFamily: "kanit", fontSize: 17 }}>{w.name_product}</div></td>
                                        <td className={styles.bodydetailTable_Re1} style={{ width: "10%", fontFamily: "kanit", fontSize: 17, textAlign: "center" }}>{w.qty}</td>
                                        <td className={styles.bodydetailTable_Re1} style={{ width: "10%", fontFamily: "kanit", fontSize: 17, textAlign: "center" }}>{Number(w.total).toLocaleString()}</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                    )}
                </div>



            </div>

            {/* Buyer Communication Modal */}
            <BuyerCommunicationModal />
        </div>
    );
}