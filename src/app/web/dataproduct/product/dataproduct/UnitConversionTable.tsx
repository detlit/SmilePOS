"use client"
import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
import { toast } from "sonner"
import styles from "./UnitConversionTable.module.css"

interface Row {
    id?: number
    qty: number
    saleUnit: string
    subQty: number | string // ยอมให้เป็น string ระหว่างพิมพ์ (เช่น "0." ก่อนพิมพ์ต่อ) แล้วค่อยแปลงเป็นตัวเลขตอนบันทึก
    subUnit: string
    priceRetail: number | null
    priceWholesale: number | null
    priceOnline: number | null
    priceA: number | null
    priceB: number | null
    priceC: number | null
    priceD: number | null
    priceE: number | null
    priceF: number | null
    priceG: number | null
    priceH: number | null
    Barcode: string
    isNew?: boolean
    isEditing?: boolean
}

interface Props {
    productCode: string
    company: string
    subUnit: string
}

/** ช่องราคาหลักที่ใช้บ่อยที่สุด — แยกออกมาเด่นกว่าราคาระดับ A–H */
const MAIN_PRICE_FIELDS: { key: keyof Row; label: string }[] = [
    { key: "priceRetail", label: "หน้าร้าน" },
    { key: "priceWholesale", label: "ส่ง" },
    { key: "priceOnline", label: "สมาชิก" },
]

/** ราคาระดับ A–H — จัดกลุ่มไว้ด้วยกัน ใช้แค่ตัวอักษรเป็น label เพราะมีหัวข้อกำกับอยู่แล้ว */
const TIER_PRICE_FIELDS: { key: keyof Row; label: string }[] = [
    { key: "priceA", label: "A" },
    { key: "priceB", label: "B" },
    { key: "priceC", label: "C" },
    { key: "priceD", label: "D" },
    { key: "priceE", label: "E" },
    { key: "priceF", label: "F" },
    { key: "priceG", label: "G" },
    { key: "priceH", label: "H" },
]

/** นับว่าแถวนี้ตั้งราคาระดับ A–H ไว้กี่ช่อง — ใช้ตัดสินว่าจะกางกลุ่มนั้นให้เลยไหม */
const countTierPrices = (row: Row) =>
    TIER_PRICE_FIELDS.filter(({ key }) => row[key] !== null && row[key] !== undefined && row[key] !== "").length

export default function UnitConversionTable({ productCode, company, subUnit }: Props) {
    const [rows, setRows] = useState<Row[]>([])
    const [unitOptions, setUnitOptions] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    // กาง/พับกลุ่มราคาระดับ A–H รายแถว — ไม่มีค่าใน state = ใช้ค่าเริ่มต้น (กางเมื่อมีราคาอยู่แล้ว)
    const [tierOpen, setTierOpen] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const res = await axios.get(`/api/unit?company=${company}`)
                setUnitOptions(res.data.map((u: any) => u.list).filter(Boolean))
            } catch (e) {
                console.error(e)
            }
        }
        if (company) fetchUnits()
    }, [company])

    useEffect(() => {
        const fetchData = async () => {
            if (!productCode || !company) return
            setLoading(true)
            try {
                const res = await axios.get(`/api/unitconversion?company=${company}&productCode=${productCode}`)
                setRows(res.data.map((r: any) => ({ ...r, isNew: false, isEditing: false })))
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [productCode, company])

    const addRow = () => {
        setRows([...rows, {
            qty: 1,
            saleUnit: "",
            subQty: 12,
            subUnit: subUnit,
            priceRetail: null,
            priceWholesale: null,
            priceOnline: null,
            priceA: null,
            priceB: null,
            priceC: null,
            priceD: null,
            priceE: null,
            priceF: null,
            priceG: null,
            priceH: null,
            Barcode: "",
            isNew: true,
            isEditing: true,
        }])
    }

    const updateRow = (i: number, field: keyof Row, value: any) => {
        const updated = [...rows]
        updated[i] = { ...updated[i], [field]: value }
        setRows(updated)
    }

    const saveRow = async (i: number) => {
        const row = rows[i]
        // แปลงค่าที่ผู้ใช้พิมพ์ (อาจเป็น string เช่น "0.5") ให้เป็นตัวเลขก่อนบันทึก
        // ถ้าว่าง/ไม่ถูกต้อง/<=0 ให้ใช้ 1 (อัตราแปลงหน่วยแบบ 1:1)
        const parsedSubQty = parseFloat(String(row.subQty))
        const subQtyValue = !isNaN(parsedSubQty) && parsedSubQty > 0 ? parsedSubQty : 1
        try {
            // Check for duplicate barcode first
            if (row.Barcode && row.Barcode.trim() !== "") {
                const checkRes = await axios.get(`/api/datalist?company=${company}&Barcode=${row.Barcode.trim()}`)
                // If barcode exists in Datalist and it's not the current product's main barcode
                if (checkRes.data && checkRes.data.length > 0) {
                    const isDuplicate = checkRes.data.some((item: any) => item.code !== productCode)
                    if (isDuplicate) {
                        alert(`บาร์โค้ด ${row.Barcode} มีการใช้งานแล้วในระบบ`)
                        return
                    }
                }
            }

            if (row.isNew) {
                const res = await axios.post("/api/unitconversion", {
                    company, productCode,
                    // subUnit must always mirror the product's base unit (the locked
                    // "หน่วยย่อย" field shows this prop), so the value persisted stays in
                    // sync even if the base unit was changed after this row was created.
                    qty: row.qty, saleUnit: row.saleUnit, subQty: subQtyValue, subUnit: subUnit,
                    priceRetail: row.priceRetail, priceWholesale: row.priceWholesale,
                    priceOnline: row.priceOnline, priceA: row.priceA, priceB: row.priceB,
                    priceC: row.priceC, priceD: row.priceD, priceE: row.priceE,
                    priceF: row.priceF, priceG: row.priceG, priceH: row.priceH,
                    Barcode: row.Barcode
                })
                const updated = [...rows]
                updated[i] = { ...res.data, isNew: false, isEditing: false }
                setRows(updated)
            } else {
                await axios.put("/api/unitconversion", {
                    id: row.id,
                    // Keep subUnit synced to the current base unit (see note in create branch)
                    qty: row.qty, saleUnit: row.saleUnit, subQty: subQtyValue, subUnit: subUnit,
                    priceRetail: row.priceRetail, priceWholesale: row.priceWholesale,
                    priceOnline: row.priceOnline, priceA: row.priceA, priceB: row.priceB,
                    priceC: row.priceC, priceD: row.priceD, priceE: row.priceE,
                    priceF: row.priceF, priceG: row.priceG, priceH: row.priceH,
                    Barcode: row.Barcode
                })
                const updated = [...rows]
                // เก็บค่าตัวเลขที่แปลงแล้วกลับเข้า state เพื่อให้ช่องแสดงผลตรงกับที่บันทึกจริง
                updated[i] = { ...updated[i], subQty: subQtyValue, isEditing: false }
                setRows(updated)
            }
        } catch (e: any) {
            console.error(e)
            if (e.response && e.response.status === 409) {
                alert(`บาร์โค้ด ${row.Barcode} มีการใช้งานแล้วในระบบ (หน่วยย่อย)`)
            } else {
                alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
            }
        }
    }

    const deleteRow = async (i: number) => {
        const row = rows[i]
        if (row.isNew) {
            setRows(rows.filter((_, idx) => idx !== i))
            return
        }
        try {
            await axios.delete(`/api/unitconversion?id=${row.id}`)
            setRows(rows.filter((_, idx) => idx !== i))
        } catch (e) {
            console.error(e)
        }
    }

    // --- Import / Export / Template ของหน่วยในการขาย (ทุกสินค้า) ---
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)

    const refetchRows = async () => {
        if (!productCode || !company) return
        try {
            const res = await axios.get(`/api/unitconversion?company=${company}&productCode=${productCode}`)
            setRows(res.data.map((r: any) => ({ ...r, isNew: false, isEditing: false })))
        } catch (e) {
            console.error(e)
        }
    }

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!company) {
            toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
                description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
                duration: 3000,
            })
            return
        }

        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('company', company)

            const res = await axios.post('/api/unitconversion/import-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (res.data.success) {
                toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
                    description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
                    duration: 3000,
                })
                await refetchRows()
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล'
            toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
                description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
                duration: 4000,
            })
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleExportExcel = async () => {
        if (!company) {
            toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
                description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
                duration: 3000,
            })
            return
        }

        setIsExporting(true)
        try {
            const res = await axios.get(`/api/unitconversion/export-excel?company=${encodeURIComponent(company)}`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `unitconversion_${company}_${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
                description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ดาวน์โหลดไฟล์ Excel สำเร็จ</div>,
                duration: 3000,
            })
        } catch (error: any) {
            toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
                description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่สามารถ Export ข้อมูลได้</div>,
                duration: 3000,
            })
        } finally {
            setIsExporting(false)
        }
    }

    const handleDownloadTemplate = async () => {
        if (!company) {
            toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
                description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่พบข้อมูล company</div>,
                duration: 3000,
            })
            return
        }

        setIsDownloadingTemplate(true)
        try {
            const res = await axios.get(`/api/unitconversion/template-excel?company=${encodeURIComponent(company)}`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `template_unitconversion_${company}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
                description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ดาวน์โหลด Template สำเร็จ</div>,
                duration: 3000,
            })
        } catch (error: any) {
            toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
                description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>ไม่สามารถดาวน์โหลด Template ได้</div>,
                duration: 3000,
            })
        } finally {
            setIsDownloadingTemplate(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.headerTitle}>หน่วยในการขาย</span>
                <div className={styles.toolbar}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportExcel}
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        title="นำเข้าหน่วยในการขาย (ทุกสินค้า) จาก Excel"
                        className={`${styles.toolBtn} ${styles.toolBtnImport}`}
                    >
                        {isImporting ? '⏳' : '📥'}
                    </button>
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        title="ส่งออกหน่วยในการขาย (ทุกสินค้า) เป็น Excel"
                        className={`${styles.toolBtn} ${styles.toolBtnExport}`}
                    >
                        {isExporting ? '⏳' : '📤'}
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        disabled={isDownloadingTemplate}
                        title="ดาวน์โหลด Template Excel สำหรับหน่วยในการขาย"
                        className={`${styles.toolBtn} ${styles.toolBtnTemplate}`}
                    >
                        {isDownloadingTemplate ? '⏳' : '📝'}
                    </button>
                    <span className={styles.toolDivider} aria-hidden="true" />
                    <button type="button" onClick={addRow} className={styles.addBtn}>+ เพิ่มหน่วย</button>
                </div>
            </div>
            <div className={styles.body}>
                {loading ? (
                    <div className={styles.empty}>กำลังโหลด...</div>
                ) : rows.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon} aria-hidden="true">📦</span>
                        <span className={styles.emptyTitle}>ยังไม่มีหน่วยในการขาย</span>
                        <span className={styles.emptyHint}>กดปุ่ม “+ เพิ่มหน่วย” เพื่อกำหนดหน่วยใหญ่ เช่น 1 ลัง = 12 {subUnit || "หน่วยย่อย"}</span>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {rows.map((row, i) => {
                            const rowKey = String(row.id ?? `new-${i}`)
                            const tierCount = countTierPrices(row)
                            const isTierOpen = tierOpen[rowKey] ?? tierCount > 0
                            const unitName = row.saleUnit || "หน่วยขาย"
                            return (
                                <div
                                    key={rowKey}
                                    className={`${styles.card} ${row.isEditing ? styles.cardEditing : ""}`}
                                >
                                    {/* แถว 1 — สมการแปลงหน่วย: 1 [ถาด] = [12] ขวด */}
                                    <div className={styles.eqRow}>
                                        <input
                                            type="number"
                                            title="จำนวนหน่วยขาย"
                                            value={row.qty}
                                            onChange={(e) => updateRow(i, "qty", parseInt(e.target.value) || 1)}
                                            disabled={!row.isEditing}
                                            className={`${styles.cell} ${styles.cellQty}`}
                                        />
                                        <select
                                            title="หน่วยขาย"
                                            value={row.saleUnit}
                                            onChange={(e) => updateRow(i, "saleUnit", e.target.value)}
                                            disabled={!row.isEditing}
                                            className={`${styles.cell} ${styles.cellUnit}`}
                                        >
                                            <option value="">เลือกหน่วย</option>
                                            {unitOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                        <span className={styles.eqSign} aria-hidden="true">=</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            title={`จำนวน ${subUnit || "หน่วยย่อย"} ต่อ 1 ${unitName}`}
                                            value={row.subQty}
                                            onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) updateRow(i, "subQty", v) }}
                                            disabled={!row.isEditing}
                                            className={`${styles.cell} ${styles.cellQty}`}
                                        />
                                        {/* หน่วยย่อยล็อกตามหน่วยขายย่อยของสินค้า — แสดงเป็นป้าย ไม่ใช่ช่องกรอก */}
                                        <span className={styles.unitChip} title="หน่วยย่อย (ตามหน่วยขายย่อยของสินค้า)">
                                            {subUnit || "—"}
                                        </span>
                                        <div className={styles.actions}>
                                            {row.isEditing ? (
                                                <button type="button" onClick={() => saveRow(i)} title="บันทึกหน่วยนี้" className={`${styles.actionBtn} ${styles.saveBtn}`}>💾</button>
                                            ) : (
                                                <button type="button" onClick={() => updateRow(i, "isEditing", true)} title="แก้ไขหน่วยนี้" className={`${styles.actionBtn} ${styles.editBtn}`}>✏️</button>
                                            )}
                                            <button type="button" onClick={() => deleteRow(i)} title="ลบหน่วยนี้" className={`${styles.actionBtn} ${styles.deleteBtn}`}>🗑️</button>
                                        </div>
                                    </div>

                                    {/* แถว 2 — ราคาหลัก ต่อ 1 หน่วยขาย */}
                                    <div className={styles.mainRow} title={`ราคาขายต่อ 1 ${unitName}`}>
                                        {MAIN_PRICE_FIELDS.map(({ key, label }) => (
                                            <label key={key} className={styles.group}>
                                                <span className={styles.groupLabel}>{label}</span>
                                                <input
                                                    type="number"
                                                    value={(row[key] as number | null) ?? ""}
                                                    onChange={(e) => updateRow(i, key, e.target.value ? parseFloat(e.target.value) : null)}
                                                    disabled={!row.isEditing}
                                                    className={styles.groupInput}
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    {/* แถว 3 — Barcode + ปุ่มกางราคาระดับ A–H (ใช้ไม่บ่อย จึงพับไว้) */}
                                    <div className={styles.metaRow}>
                                        <label className={`${styles.group} ${styles.groupGrow}`}>
                                            <span className={styles.groupLabel}>Barcode</span>
                                            <input
                                                type="text"
                                                value={row.Barcode ?? ""}
                                                onChange={(e) => updateRow(i, "Barcode", e.target.value)}
                                                disabled={!row.isEditing}
                                                className={`${styles.groupInput} ${styles.groupInputText}`}
                                                placeholder="สแกน / พิมพ์บาร์โค้ด"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setTierOpen((p) => ({ ...p, [rowKey]: !isTierOpen }))}
                                            aria-expanded={isTierOpen}
                                            title="ราคาระดับ A–H"
                                            className={`${styles.tierToggle} ${isTierOpen ? styles.tierToggleOpen : ""}`}
                                        >
                                            <span>A–H</span>
                                            {tierCount > 0 && <span className={styles.tierBadge}>{tierCount}</span>}
                                            <span className={styles.chevron} aria-hidden="true">▾</span>
                                        </button>
                                    </div>

                                    {isTierOpen && (
                                        <div className={styles.tierRow}>
                                            {TIER_PRICE_FIELDS.map(({ key, label }) => (
                                                <label key={key} className={styles.group}>
                                                    <span className={styles.groupLabel}>{label}</span>
                                                    <input
                                                        type="number"
                                                        value={(row[key] as number | null) ?? ""}
                                                        onChange={(e) => updateRow(i, key, e.target.value ? parseFloat(e.target.value) : null)}
                                                        disabled={!row.isEditing}
                                                        className={styles.groupInput}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
