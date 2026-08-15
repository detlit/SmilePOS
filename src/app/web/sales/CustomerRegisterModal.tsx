'use client'

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Modal from "react-bootstrap/Modal";
import { toast } from "sonner";
import {
    UserPlus,
    CreditCard,
    ScanLine,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Save,
    X,
    AlertTriangle,
    Wifi,
    WifiOff,
} from "lucide-react";
import { detectSmartcardAgent, pingSmartcardAgent, readSmartcardThroughProxy, resolveSmartcardAgent } from "@/utils/smartcard";

/**
 * Customer register modal with two registration modes:
 *  1) Manual form registration
 *  2) Thai National ID Smart Card reader registration
 *
 * Smart card reader uses a configurable local HTTP bridge endpoint:
 *  - localStorage "smartcard_url"     -> base URL (default http://127.0.0.1:8182)
 *  - localStorage "smartcard_path"    -> path (default /read)
 *  - localStorage "smartcard_timeout" -> request timeout ms (default 15000)
 */

const apiCustomer = "customer";
type Mode = "manual" | "card";

interface CardData {
    cid?: string;
    titleTH?: string;
    firstNameTH?: string;
    lastNameTH?: string;
    fullNameTH?: string;
    titleEN?: string;
    firstNameEN?: string;
    lastNameEN?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    issueDate?: string;
    expireDate?: string;
    photo?: string;
}

interface Props {
    show: boolean;
    onHide: () => void;
    onCreated?: () => void;
    onSelectCustomer?: (names: string) => void;
    nextCode?: string | number;
}

const gradientHeader = "linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)";
const gradientBlue = "linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)";

const labelStyle: React.CSSProperties = {
    fontFamily: "Kanit",
    fontSize: 12,
    color: "#64748b",
    minWidth: 110,
    textAlign: "right",
    paddingRight: 10,
};

const inputStyle: React.CSSProperties = {
    fontFamily: "Kanit",
    fontSize: 13,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    padding: "8px 12px",
    flex: 1,
    outline: "none",
    background: "white",
};

function parseThaiDate(raw?: string): string {
    if (!raw) return "";
    const only = raw.replace(/[^0-9]/g, "");
    if (only.length === 8) {
        const y = parseInt(only.slice(0, 4), 10);
        const m = only.slice(4, 6);
        const d = only.slice(6, 8);
        const year = y > 2400 ? y - 543 : y;
        return `${d}/${m}/${year}`;
    }
    return raw;
}

function computeAge(birth?: string): string {
    if (!birth) return "";
    const parts = birth.split("/");
    if (parts.length !== 3) return "";
    const [d, m, y] = parts.map((p) => parseInt(p, 10));
    if (!d || !m || !y) return "";
    const dob = new Date(y, m - 1, d);
    if (isNaN(dob.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const mm = today.getMonth() - dob.getMonth();
    if (mm < 0 || (mm === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 0 ? String(age) : "";
}

const CustomerRegisterModal: React.FC<Props> = ({ show, onHide, onCreated, onSelectCustomer, nextCode }) => {
    const [mode, setMode] = useState<Mode>("manual");

    const initialForm = {
        code: "",
        names: "",
        sex: "",
        idcode: "",
        birthday: "",
        age: "",
        address: "",
        tel: "",
        numbertax: "",
        levelPrice: "หน้าร้าน",
        customer: "ปลีก",
        congenitalDisease: "",
        photo: "",
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);

    const [reading, setReading] = useState(false);
    const [cardError, setCardError] = useState("");
    const [connStatus, setConnStatus] = useState<"idle" | "ok" | "fail">("idle");
    const [cardData, setCardData] = useState<CardData | null>(null);

    const firstInputRef = useRef<HTMLInputElement>(null);

    const smartcardUrl = useMemo(() => {
        if (typeof window === "undefined") return "http://127.0.0.1:8182";
        return localStorage.getItem("smartcard_url") || "http://127.0.0.1:8182";
    }, [show]);
    const smartcardPath = useMemo(() => {
        if (typeof window === "undefined") return "/read";
        return localStorage.getItem("smartcard_path") || "/read";
    }, [show]);
    const smartcardTimeout = useMemo(() => {
        if (typeof window === "undefined") return 15000;
        return Number(localStorage.getItem("smartcard_timeout") || 15000);
    }, [show]);

    // URL ที่เชื่อมต่อได้จริง (อาจเปลี่ยนจาก smartcardUrl หลัง auto-detect)
    const [resolvedUrl, setResolvedUrl] = useState<string>(smartcardUrl);
    useEffect(() => { setResolvedUrl(smartcardUrl); }, [smartcardUrl]);

    useEffect(() => {
        if (show) {
            setForm({ ...initialForm, code: String(nextCode ?? "") });
            setMode("manual");
            setCardData(null);
            setCardError("");
            setConnStatus("idle");
            setTimeout(() => firstInputRef.current?.focus(), 180);
            // auto-detect smartcard agent แบบเงียบ ๆ
            (async () => {
                const first = await pingSmartcardAgent(smartcardUrl, 1200);
                if (first) {
                    setResolvedUrl(first.url);
                    setConnStatus("ok");
                    return;
                }
                const found = await detectSmartcardAgent({ preferred: smartcardUrl });
                if (found) {
                    localStorage.setItem("smartcard_url", found.url);
                    setResolvedUrl(found.url);
                    setConnStatus("ok");
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const handleField = (name: string, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const testConnection = async () => {
        setConnStatus("idle");
        try {
            // 1) ลอง URL ปัจจุบันก่อน
            const direct = await pingSmartcardAgent(resolvedUrl, 1500);
            if (direct) {
                setResolvedUrl(direct.url);
                setConnStatus("ok");
                return;
            }
            // 2) ไม่ตอบ → ค้นหาอัตโนมัติจากพอร์ตที่พบทั่วไป
            const found = await detectSmartcardAgent({ preferred: resolvedUrl });
            if (found) {
                setResolvedUrl(found.url);
                localStorage.setItem("smartcard_url", found.url);
                setConnStatus("ok");
                toast.success(
                    <div style={{ fontFamily: "Kanit", fontSize: 15 }}>เชื่อมต่อเครื่องอ่านบัตรอัตโนมัติ</div>,
                    { description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>{found.url}</div> }
                );
            } else {
                setConnStatus("fail");
            }
        } catch {
            setConnStatus("fail");
        }
    };

    const readCard = async () => {
        setReading(true);
        setCardError("");
        setCardData(null);
        try {
            // ให้แน่ใจก่อนว่า agent ยังอยู่ ถ้าไม่อยู่ลองค้นหาให้
            let activeUrl = resolvedUrl;
            const alive = await pingSmartcardAgent(activeUrl, 1200);
            if (!alive) {
                const found = await resolveSmartcardAgent({ forceDetect: true });
                if (!found) throw new Error("ไม่พบเครื่องอ่านบัตร กรุณาเปิดโปรแกรม Smart Card Agent");
                activeUrl = found.url;
                setResolvedUrl(found.url);
            }

            // อ่านผ่าน proxy ฝั่งเซิร์ฟเวอร์ เลี่ยงปัญหา CORS / PNA ของบราวเซอร์
            const json: CardData = await readSmartcardThroughProxy(activeUrl, smartcardPath, smartcardTimeout);
            setCardData(json);
            const fullName = json.fullNameTH
                || [json.titleTH, json.firstNameTH, json.lastNameTH].filter(Boolean).join(" ").trim();
            const birth = parseThaiDate(json.birthDate);
            const gender = json.gender === "1" || /ชาย|male/i.test(json.gender || "") ? "ชาย"
                : json.gender === "2" || /หญิง|female/i.test(json.gender || "") ? "หญิง" : "";
            setForm((prev) => ({
                ...prev,
                names: fullName || prev.names,
                idcode: json.cid || prev.idcode,
                birthday: birth || prev.birthday,
                age: computeAge(birth) || prev.age,
                sex: gender || prev.sex,
                address: json.address || prev.address,
                photo: json.photo || "",
            }));
            toast.success(
                <div style={{ fontFamily: "Kanit", fontSize: 15 }}>อ่านบัตรประชาชน</div>,
                { description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>อ่านข้อมูลจากบัตรสำเร็จ</div> }
            );
        } catch (e: any) {
            const msg = e?.name === "AbortError"
                ? "หมดเวลาเชื่อมต่อเครื่องอ่านบัตร"
                : e?.message || "ไม่สามารถเชื่อมต่อเครื่องอ่านบัตรได้";
            setCardError(msg);
        } finally {
            setReading(false);
        }
    };

    const handleSave = async () => {
        if (!form.names.trim()) {
            toast.error(<div style={{ fontFamily: "Kanit", fontSize: 14 }}>กรุณากรอก ชื่อ-สกุล</div>);
            return;
        }
        setSaving(true);
        try {
            const company = localStorage.getItem("company_") || "";
            const payload = {
                company,
                code: form.code || String(nextCode ?? ""),
                names: form.names,
                sex: form.sex,
                idcode: form.idcode,
                age: Number(form.age) || 0,
                birthday: form.birthday,
                address: form.address,
                branch: "",
                levelPrice: form.levelPrice,
                tel: form.tel,
                pointStart: 0,
                point: 0,
                totalPoint: 0,
                customer: form.customer,
                congenitalDisease: form.congenitalDisease,
                statuss: "",
                numbertax: form.numbertax,
                drugallergys: [],
            };
            await axios.post(`/api/${apiCustomer}`, payload);
            toast.success(
                <div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกสำเร็จ</div>,
                { description: <div style={{ fontFamily: "Kanit", fontSize: 14 }}>สมัครสมาชิกลูกค้าเรียบร้อย</div> }
            );
            onCreated?.();
            onSelectCustomer?.(form.names);
            onHide();
        } catch (err: any) {
            toast.error(<div style={{ fontFamily: "Kanit", fontSize: 14 }}>บันทึกไม่สำเร็จ</div>);
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <style>{`
                .__cus_spin { animation: __cusSpin 0.9s linear infinite; }
                @keyframes __cusSpin { to { transform: rotate(360deg); } }
            `}</style>
            <div style={{ fontFamily: "Kanit" }}>

                {/* Header */}
                <div style={{
                    background: gradientHeader, color: "white", padding: "16px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Kanit_B", fontSize: 16 }}>
                        <UserPlus size={20} /> สมัครสมาชิกลูกค้า
                    </div>
                    <button onClick={onHide}
                        style={{
                            background: "rgba(255,255,255,0.18)", border: "none", color: "white",
                            width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Mode switcher */}
                <div style={{ display: "flex", gap: 12, padding: "18px 24px 0 24px" }}>
                    <button type="button" onClick={() => setMode("manual")}
                        style={{
                            flex: 1, fontFamily: "Kanit", fontSize: 13,
                            padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                            border: mode === "manual" ? "2px solid #3E86C7" : "1px solid #e2e8f0",
                            background: mode === "manual" ? "linear-gradient(135deg,#F3F8FC,#ffffff)" : "white",
                            display: "flex", alignItems: "center", gap: 12,
                            boxShadow: mode === "manual" ? "0 4px 14px rgba(62, 134, 199,0.18)" : "none",
                            transition: "all 0.2s",
                        }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: mode === "manual" ? gradientHeader : "#f1f5f9",
                            color: mode === "manual" ? "white" : "#64748b",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <UserPlus size={20} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a" }}>สมัครแบบปกติ</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>กรอกข้อมูลลูกค้าด้วยตนเอง</div>
                        </div>
                    </button>

                    <button type="button" onClick={() => setMode("card")}
                        style={{
                            flex: 1, fontFamily: "Kanit", fontSize: 13,
                            padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                            border: mode === "card" ? "2px solid #2A6AAA" : "1px solid #e2e8f0",
                            background: mode === "card" ? "linear-gradient(135deg,#F3F8FC,#ffffff)" : "white",
                            display: "flex", alignItems: "center", gap: 12,
                            boxShadow: mode === "card" ? "0 4px 14px rgba(42, 106, 170,0.18)" : "none",
                            transition: "all 0.2s",
                        }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: mode === "card" ? gradientBlue : "#f1f5f9",
                            color: mode === "card" ? "white" : "#64748b",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <CreditCard size={20} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a" }}>อ่านบัตรประชาชน</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>ใช้ Smart Card Reader อัตโนมัติ</div>
                        </div>
                    </button>
                </div>

                {/* Card reader panel */}
                {mode === "card" && (
                    <div style={{ padding: "16px 24px 0 24px" }}>
                        <div style={{
                            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12,
                            padding: 18, display: "flex", gap: 16, alignItems: "center",
                        }}>
                            <div style={{
                                width: 78, height: 78, borderRadius: 12, background: gradientBlue,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 6px 18px rgba(42, 106, 170,0.25)", color: "white", flexShrink: 0,
                            }}>
                                {reading ? <Loader2 size={34} className="__cus_spin" /> : <ScanLine size={34} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: "Kanit_B", fontSize: 14, color: "#0f172a" }}>
                                    เครื่องอ่านบัตรประชาชน (Smart Card Reader)
                                </div>
                                <div style={{ fontFamily: "Kanit", fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                    เสียบบัตรประชาชนในเครื่องอ่านแล้วกด &quot;อ่านบัตร&quot;
                                </div>
                                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                    <button type="button" onClick={readCard} disabled={reading}
                                        style={{
                                            fontFamily: "Kanit", fontSize: 12,
                                            padding: "8px 18px", borderRadius: 8, border: "none",
                                            background: gradientBlue, color: "white",
                                            cursor: reading ? "not-allowed" : "pointer", opacity: reading ? 0.7 : 1,
                                            display: "flex", alignItems: "center", gap: 6,
                                            boxShadow: "0 2px 8px rgba(42, 106, 170,0.3)"
                                        }}>
                                        {reading ? <Loader2 size={14} className="__cus_spin" /> : <ScanLine size={14} />}
                                        {reading ? "กำลังอ่านบัตร..." : "อ่านบัตร"}
                                    </button>
                                    <button type="button" onClick={testConnection}
                                        style={{
                                            fontFamily: "Kanit", fontSize: 11,
                                            padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                                            background: "white", color: "#334155", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: 6,
                                        }}>
                                        <RefreshCw size={12} /> ทดสอบเชื่อมต่อ
                                    </button>
                                    {connStatus !== "idle" && (
                                        <span style={{
                                            fontFamily: "Kanit", fontSize: 11,
                                            padding: "4px 10px", borderRadius: 999,
                                            background: connStatus === "ok" ? "#D3F0E2" : "#fee2e2",
                                            color: connStatus === "ok" ? "#0F6845" : "#b91c1c",
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                        }}>
                                            {connStatus === "ok" ? <Wifi size={11} /> : <WifiOff size={11} />}
                                            {connStatus === "ok" ? "เชื่อมต่อสำเร็จ" : "เชื่อมต่อไม่สำเร็จ"}
                                        </span>
                                    )}
                                    <span style={{ fontFamily: "Kanit", fontSize: 10, color: "#94a3b8" }}>
                                        {resolvedUrl}{smartcardPath}
                                    </span>
                                </div>
                            </div>
                            {cardData?.photo && (
                                <div style={{
                                    width: 90, height: 110, borderRadius: 10, overflow: "hidden",
                                    border: "2px solid #e2e8f0", background: "#f1f5f9",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <img src={`data:image/jpeg;base64,${cardData.photo}`} alt="photo"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                            )}
                        </div>

                        {cardError && (
                            <div style={{
                                marginTop: 10, padding: "10px 14px", borderRadius: 10,
                                background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
                                fontFamily: "Kanit", fontSize: 12,
                                display: "flex", gap: 8, alignItems: "flex-start",
                            }}>
                                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontFamily: "Kanit_B" }}>ไม่สามารถอ่านบัตรได้</div>
                                    <div>{cardError}</div>
                                    <div style={{ marginTop: 4, color: "#991b1b", fontSize: 11 }}>
                                        โปรดตรวจสอบว่าเครื่องอ่านบัตรเชื่อมต่ออยู่ และโปรแกรม Agent ทำงานอยู่
                                        (ตั้งค่าได้ที่ เมนูตั้งค่า {'>'} ตั้งค่าเครื่องอ่านบัตรประชาชน)
                                    </div>
                                </div>
                            </div>
                        )}

                        {cardData && !cardError && (
                            <div style={{
                                marginTop: 10, padding: "10px 14px", borderRadius: 10,
                                background: "#F3F8FC", border: "1px solid #CCDFF1", color: "#173F6B",
                                fontFamily: "Kanit", fontSize: 12,
                                display: "flex", gap: 8, alignItems: "center",
                            }}>
                                <CheckCircle2 size={16} />
                                อ่านข้อมูลจากบัตรเรียบร้อย — ตรวจสอบข้อมูลด้านล่างแล้วกด บันทึก
                            </div>
                        )}
                    </div>
                )}

                {/* Form body */}
                <div style={{ padding: "18px 24px" }}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>รหัสลูกค้า :</div>
                                <input value={form.code} disabled style={{ ...inputStyle, background: "#f8fafc" }} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>ชื่อ-สกุล :</div>
                                <input ref={firstInputRef} value={form.names}
                                    onChange={(e) => handleField("names", e.target.value)}
                                    placeholder="ชื่อ นามสกุล" style={inputStyle} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>เลขบัตร ปชช. :</div>
                                <input value={form.idcode}
                                    onChange={(e) => handleField("idcode", e.target.value)}
                                    placeholder="1-0000-00000-00-0" style={inputStyle} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>เบอร์โทรศัพท์ :</div>
                                <input value={form.tel}
                                    onChange={(e) => handleField("tel", e.target.value)}
                                    placeholder="08x-xxx-xxxx" style={inputStyle} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>วัน/เดือน/ปีเกิด :</div>
                                <input value={form.birthday}
                                    onChange={(e) => handleField("birthday", e.target.value)}
                                    placeholder="DD/MM/YYYY" style={{ ...inputStyle, maxWidth: 180 }} />
                                <div style={{ ...labelStyle, minWidth: 50, marginLeft: 10 }}>อายุ :</div>
                                <input value={form.age}
                                    onChange={(e) => handleField("age", e.target.value)}
                                    style={{ ...inputStyle, maxWidth: 80 }} />
                                <span style={{ fontFamily: "Kanit", fontSize: 12, color: "#94a3b8", marginLeft: 6 }}>ปี</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>เพศ :</div>
                                <select value={form.sex} onChange={(e) => handleField("sex", e.target.value)}
                                    style={{ ...inputStyle, flex: "0 0 120px", cursor: "pointer" }}>
                                    <option value="">-เลือก-</option>
                                    <option value="ชาย">ชาย</option>
                                    <option value="หญิง">หญิง</option>
                                    <option value="ไม่ระบุ">ไม่ระบุ</option>
                                </select>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 10 }}>
                                <div style={labelStyle}>ที่อยู่ :</div>
                                <textarea value={form.address}
                                    onChange={(e) => handleField("address", e.target.value)}
                                    style={{ ...inputStyle, height: 70, resize: "none" }}
                                    placeholder="บ้านเลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด" />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>การซื้อ :</div>
                                <select value={form.customer} onChange={(e) => handleField("customer", e.target.value)}
                                    style={{ ...inputStyle, flex: "0 0 120px", cursor: "pointer" }}>
                                    <option value="ปลีก">ปลีก</option>
                                    <option value="ส่ง">ส่ง</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>ระดับราคา :</div>
                                <select value={form.levelPrice} onChange={(e) => handleField("levelPrice", e.target.value)}
                                    style={{ ...inputStyle, flex: "0 0 160px", cursor: "pointer" }}>
                                    <option value="หน้าร้าน">หน้าร้าน</option>
                                    <option value="ขายส่ง">ขายส่ง</option>
                                    <option value="สมาชิก">สมาชิก</option>
                                    <option value="ราคา A">ราคา A</option>
                                    <option value="ราคา B">ราคา B</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>เลขภาษี :</div>
                                <input value={form.numbertax}
                                    onChange={(e) => handleField("numbertax", e.target.value)}
                                    style={inputStyle} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                <div style={labelStyle}>โรคประจำตัว :</div>
                                <input value={form.congenitalDisease}
                                    onChange={(e) => handleField("congenitalDisease", e.target.value)}
                                    style={inputStyle} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 24px",
                    borderTop: "1px solid #e2e8f0", background: "#f8fafc",
                }}>
                    <button type="button" onClick={onHide}
                        style={{
                            fontFamily: "Kanit", fontSize: 13,
                            padding: "9px 20px", borderRadius: 8,
                            border: "1px solid #e2e8f0", background: "white", color: "#64748b",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        }}>
                        <X size={14} /> ยกเลิก
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving}
                        style={{
                            fontFamily: "Kanit", fontSize: 13,
                            padding: "9px 26px", borderRadius: 8, border: "none",
                            background: gradientHeader, color: "white",
                            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                            display: "flex", alignItems: "center", gap: 6,
                            boxShadow: "0 2px 8px rgba(62, 134, 199,0.3)"
                        }}>
                        {saving ? <Loader2 size={14} className="__cus_spin" /> : <Save size={14} />}
                        {saving ? "กำลังบันทึก..." : "บันทึกสมาชิก"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CustomerRegisterModal;
