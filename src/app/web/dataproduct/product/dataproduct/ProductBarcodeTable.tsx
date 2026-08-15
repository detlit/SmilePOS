"use client"
// แผงจัดการ "บาร์โค้ดสำรอง" ของสินค้า — หนึ่งหน่วยสินค้ามีบาร์โค้ดได้หลายตัว
//
// ใช้กับกรณีจริงที่พบบ่อย: ผู้ผลิตเปลี่ยนกล่อง/เปลี่ยนบาร์โค้ดกลางคัน, ของนำเข้า
// ล็อตใหม่มาคนละบาร์โค้ด, หรือมีทั้งบาร์โค้ดผู้ผลิตและบาร์โค้ดที่ร้านพิมพ์เอง
// ทั้งหมดคือ "สินค้าตัวเดียวกัน หน่วยขายเดียวกัน" จึงต้องสแกนแล้วได้สินค้าตัวเดิม
//
// ═══════════════════════════════════════════════════════════════════════════
// ทำไมเพิ่มได้แม้สินค้าจะถูกล็อกไม่ให้แก้ Barcode แล้ว
// ═══════════════════════════════════════════════════════════════════════════
// ช่อง "Barcode" ในฟอร์มสินค้า = บาร์โค้ดหลัก ซึ่งเป็นคีย์ที่ระบบใช้จับกลุ่ม
// ยอดรับ/ขาย/โอน/ปรับยอด (ดู src/lib/stockBalance.ts) การแก้จึงถูกล็อกทันที
// ที่สินค้ามีความเคลื่อนไหว — ถ้าแก้ ยอดเก่าจะหลุดกลุ่ม
//
// บาร์โค้ดสำรองในแผงนี้ไม่ใช่คีย์ของยอด มันมีผลแค่ตอน "สแกน" เท่านั้น:
// สแกนแล้วระบบแปลงกลับเป็นสินค้าตัวเดิม แล้วบันทึกเอกสารด้วยบาร์โค้ดหลัก
// เหมือนเดิมทุกประการ → เพิ่ม/ลบกี่ครั้งก็ไม่ขยับยอดสักหน่วยเดียว

import React, { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import styles from "./ProductBarcodeTable.module.css"
import { invalidateBarcodeAliases, normalizeBarcode } from "@/lib/barcodeAliasClient"

interface Row {
    id?: number
    barcode: string
    note: string
    isActive: boolean
    isNew?: boolean
    isEditing?: boolean
}

interface Props {
    productCode: string
    company: string
    /** Datalist.Barcode — บาร์โค้ดหลัก แสดงไว้ให้เห็นบริบท (แก้ที่ช่องด้านบนของฟอร์ม) */
    primaryBarcode?: string
    /** true เมื่อสินค้ามีความเคลื่อนไหวสต็อกแล้ว — ใช้เลือกข้อความอธิบาย ไม่ได้ปิดการใช้งาน */
    stockLocked?: boolean
}

export default function ProductBarcodeTable({ productCode, company, primaryBarcode, stockLocked }: Props) {
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState<number | "new" | null>(null)
    const [error, setError] = useState("")

    const primary = normalizeBarcode(primaryBarcode)

    const fetchRows = useCallback(async () => {
        if (!productCode || !company) { setRows([]); return }
        setLoading(true)
        try {
            const res = await axios.get(
                `/api/product-barcode?company=${encodeURIComponent(company)}&productCode=${encodeURIComponent(productCode)}`
            )
            const data = Array.isArray(res.data) ? res.data : []
            setRows(data.map((r: any) => ({
                id: r.id,
                barcode: r.barcode || "",
                note: r.note || "",
                isActive: r.isActive !== false,
                isNew: false,
                isEditing: false,
            })))
            setError("")
        } catch (e) {
            console.error(e)
            setError("โหลดรายการบาร์โค้ดสำรองไม่สำเร็จ")
        } finally {
            setLoading(false)
        }
    }, [productCode, company])

    useEffect(() => { fetchRows() }, [fetchRows])

    const addRow = () => {
        // กันเผลอกด "เพิ่ม" รัว ๆ จนได้แถวว่างหลายแถว
        if (rows.some((r) => r.isNew)) return
        setRows((prev) => [...prev, { barcode: "", note: "", isActive: true, isNew: true, isEditing: true }])
    }

    const updateRow = (i: number, field: keyof Row, value: any) => {
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
    }

    /** ดึงข้อความ error ภาษาไทยที่ API ส่งมา (ชนบาร์โค้ด ฯลฯ) */
    const apiError = (e: any, fallback: string) =>
        e?.response?.data?.error || fallback

    const saveRow = async (i: number) => {
        const row = rows[i]
        const barcode = normalizeBarcode(row.barcode)

        if (!barcode) { setError("กรุณากรอกบาร์โค้ด"); return }
        if (barcode === primary) {
            setError(`บาร์โค้ด ${barcode} เป็นบาร์โค้ดหลักของสินค้านี้อยู่แล้ว`)
            return
        }

        setBusyId(row.isNew ? "new" : row.id ?? null)
        setError("")
        try {
            if (row.isNew) {
                const res = await axios.post("/api/product-barcode", {
                    company,
                    productCode,
                    barcode,
                    note: row.note,
                    isActive: row.isActive,
                    createdBy: (typeof window !== "undefined" && localStorage.getItem("person_")) || "",
                })
                setRows((prev) => prev.map((r, idx) => (idx === i
                    ? { id: res.data.id, barcode: res.data.barcode, note: res.data.note || "", isActive: res.data.isActive !== false, isNew: false, isEditing: false }
                    : r)))
            } else {
                await axios.put(`/api/product-barcode/${row.id}`, {
                    barcode,
                    note: row.note,
                    isActive: row.isActive,
                })
                setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, barcode, isEditing: false } : r)))
            }
            // หน้าขาย/รับสินค้าอ่าน alias จาก cache — ล้างเพื่อให้สแกนติดทันที
            invalidateBarcodeAliases(company)
            toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>บันทึกบาร์โค้ดสำรองแล้ว</div>, { duration: 2000 })
        } catch (e: any) {
            console.error(e)
            setError(apiError(e, "บันทึกไม่สำเร็จ"))
        } finally {
            setBusyId(null)
        }
    }

    const deleteRow = async (i: number) => {
        const row = rows[i]
        if (row.isNew) {
            setRows((prev) => prev.filter((_, idx) => idx !== i))
            return
        }
        if (!window.confirm(`ลบบาร์โค้ดสำรอง ${row.barcode} ?\n\nยอดคงเหลือและเอกสารเดิมไม่ได้รับผลกระทบ\nแต่จะสแกนบาร์โค้ดนี้ไม่ติดอีกต่อไป`)) return

        setBusyId(row.id ?? null)
        setError("")
        try {
            await axios.delete(`/api/product-barcode/${row.id}`)
            setRows((prev) => prev.filter((_, idx) => idx !== i))
            invalidateBarcodeAliases(company)
        } catch (e: any) {
            console.error(e)
            setError(apiError(e, "ลบไม่สำเร็จ"))
        } finally {
            setBusyId(null)
        }
    }

    const toggleActive = async (i: number) => {
        const row = rows[i]
        if (row.isNew) { updateRow(i, "isActive", !row.isActive); return }

        setBusyId(row.id ?? null)
        setError("")
        try {
            await axios.put(`/api/product-barcode/${row.id}`, { isActive: !row.isActive })
            setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, isActive: !r.isActive } : r)))
            invalidateBarcodeAliases(company)
        } catch (e: any) {
            console.error(e)
            setError(apiError(e, "เปลี่ยนสถานะไม่สำเร็จ"))
        } finally {
            setBusyId(null)
        }
    }

    const activeCount = rows.filter((r) => r.isActive && !r.isNew).length

    if (!productCode) return null

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.headerTitle}>
                    บาร์โค้ดสำรอง (สแกนได้หลายบาร์โค้ด / หน่วยเดียวกัน)
                    {activeCount > 0 && <span className={styles.countBadge}>{activeCount}</span>}
                </span>
                <button type="button" className={styles.addBtn} onClick={addRow} disabled={loading || rows.some((r) => r.isNew)}>
                    + เพิ่มบาร์โค้ด
                </button>
            </div>

            <div className={styles.body}>
                {/* บาร์โค้ดหลัก + คำอธิบายความปลอดภัย รวมไว้บรรทัดเดียว
                    รายละเอียดเต็มอยู่ใน title ให้ชี้ดูได้ ไม่ต้องกินพื้นที่ 3 บรรทัดตลอดเวลา */}
                <div className={styles.infoRow}>
                    {primary && (
                        <>
                            <span className={styles.primaryTag}>บาร์โค้ดหลัก</span>
                            <span className={styles.primaryValue} title="คีย์ของยอดสต็อก — แก้ได้ที่ช่อง Barcode ด้านบน">{primary}</span>
                        </>
                    )}
                    <span
                        className={styles.infoNote}
                        title={"บาร์โค้ดในตารางนี้ใช้สแกนเข้าสินค้าตัวเดียวกัน — เวลาบันทึก รับ · ขาย · โอน · รับโอน · ปรับยอด "
                            + "ระบบยังใช้บาร์โค้ดหลักเสมอ จึงไม่กระทบยอดคงเหลือและยอดสะสมใด ๆ"
                            + (stockLocked ? " เพิ่ม/ลบได้แม้สินค้าจะมีความเคลื่อนไหวสต็อกแล้ว" : "")}
                    >
                        {/* ตอนยังไม่มีบาร์โค้ดสำรอง บอกวิธีเริ่มไปเลยในบรรทัดเดียวกัน ไม่ต้องเพิ่มแถวว่าง */}
                        {rows.length === 0 && !loading
                            ? "🛡️ ยังไม่มีบาร์โค้ดสำรอง — กด “+ เพิ่มบาร์โค้ด” เพื่อให้สินค้านี้สแกนได้หลายบาร์โค้ด"
                            : "🛡️ ทุกบาร์โค้ดสแกนได้เป็นสินค้าตัวเดียวกัน · ไม่กระทบยอดคงเหลือ"}
                    </span>
                </div>

                {rows.length === 0 ? (
                    loading ? <div className={styles.empty}>กำลังโหลด...</div> : null
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: "34%" }}>บาร์โค้ด</th>
                                <th>หมายเหตุ (เช่น กล่องล็อตใหม่ / ผู้ผลิต B)</th>
                                <th style={{ width: 72 }}>สถานะ</th>
                                <th style={{ width: 150 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => {
                                const busy = busyId === (row.isNew ? "new" : row.id)
                                return (
                                    <tr key={row.id ?? `new-${i}`} className={!row.isActive && !row.isNew ? styles.rowInactive : undefined}>
                                        <td>
                                            {row.isEditing ? (
                                                <input
                                                    className={`${styles.input} ${styles.barcodeInput}`}
                                                    value={row.barcode}
                                                    onChange={(e) => updateRow(i, "barcode", e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRow(i) } }}
                                                    placeholder="ยิงสแกนหรือพิมพ์บาร์โค้ด"
                                                    autoFocus
                                                    spellCheck={false}
                                                    autoComplete="off"
                                                />
                                            ) : (
                                                <span className={styles.barcodeCell}>{row.barcode}</span>
                                            )}
                                        </td>
                                        <td>
                                            {row.isEditing ? (
                                                <input
                                                    className={styles.input}
                                                    value={row.note}
                                                    onChange={(e) => updateRow(i, "note", e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRow(i) } }}
                                                    placeholder="ไม่บังคับ"
                                                />
                                            ) : (
                                                <span style={{ color: "#64748b" }}>{row.note || "-"}</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`${styles.statusTag} ${row.isActive ? styles.statusOn : styles.statusOff}`}>
                                                {row.isActive ? "สแกนได้" : "ปิดใช้งาน"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                {row.isEditing ? (
                                                    <>
                                                        <button type="button" className={`${styles.iconBtn} ${styles.saveBtn}`} onClick={() => saveRow(i)} disabled={busy}>
                                                            {busy ? "..." : "บันทึก"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.iconBtn}
                                                            disabled={busy}
                                                            onClick={() => {
                                                                setError("")
                                                                if (row.isNew) setRows((prev) => prev.filter((_, idx) => idx !== i))
                                                                else { updateRow(i, "isEditing", false); fetchRows() }
                                                            }}
                                                        >ยกเลิก</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button type="button" className={styles.iconBtn} onClick={() => updateRow(i, "isEditing", true)} disabled={busy}>แก้ไข</button>
                                                        <button type="button" className={styles.iconBtn} onClick={() => toggleActive(i)} disabled={busy}>
                                                            {row.isActive ? "ปิด" : "เปิด"}
                                                        </button>
                                                        <button type="button" className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => deleteRow(i)} disabled={busy}>ลบ</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}

                {error && <div className={styles.error}>⚠️ {error}</div>}
            </div>
        </div>
    )
}
