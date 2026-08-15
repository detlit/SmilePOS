'use client'

import React from 'react'
import { unitOptionLabel, roundUnit, type ReceiveUnitOption } from "@/lib/receiveUnit"

/**
 * แถบเลือก "หน่วยรับ" ของฟอร์มรับสินค้า (ใช้ร่วมกันทั้งหน้าเพิ่มและหน้าแก้ไข)
 *
 * สินค้าที่ไม่มีหน่วยขาย (UnitConversion) จะไม่มีอะไรให้เลือก → แสดงเป็นป้ายหน่วยฐานเฉย ๆ
 * เพื่อไม่ให้ฟอร์มรกขึ้นโดยไม่จำเป็น
 */
export default function ReceiveUnitPicker({
    options,
    value,
    onChange,
    disabled = false,
    labelStyle,
    rowStyle,
}: {
    options: ReceiveUnitOption[]
    value: string
    onChange: (key: string) => void
    disabled?: boolean
    labelStyle?: React.CSSProperties
    rowStyle?: React.CSSProperties
}) {
    const selected = options.find((o) => o.key === value) || options[0]
    const hasChoices = options.length > 1
    const isPack = !!selected && selected.factor !== 1

    return (
        <div style={rowStyle}>
            <div style={labelStyle}>หน่วยรับ :</div>

            {hasChoices ? (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    title="เลือกหน่วยที่รับเข้า — ระบบจะแปลงเป็นหน่วยย่อยให้อัตโนมัติ"
                    style={{
                        fontFamily: 'Kanit',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isPack ? '#4338ca' : '#2A6AAA',
                        background: disabled ? '#f8fafc' : (isPack ? '#eef2ff' : '#ffffff'),
                        border: `1.5px solid ${isPack ? '#a5b4fc' : '#cfd8dc'}`,
                        borderRadius: '6px',
                        height: '35px',
                        minWidth: '190px',
                        padding: '0 8px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        outline: 'none',
                    }}
                >
                    {options.map((option) => (
                        <option key={option.key} value={option.key}>
                            {unitOptionLabel(option)}{option.legacy ? ' (หน่วยเดิมของรายการนี้)' : ''}
                        </option>
                    ))}
                </select>
            ) : (
                <span style={{ fontFamily: 'Kanit', fontSize: '14px', color: '#2A6AAA', fontWeight: 600 }}>
                    {selected?.label || '-'}
                </span>
            )}

            {isPack && (
                <span
                    title={`รับ 1 ${selected.label} = ${roundUnit(selected.factor)} ${selected.baseUnit} เข้าสต็อก`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: '8px',
                        fontFamily: 'Kanit',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#4338ca',
                        background: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    📦 1 {selected.label} = {roundUnit(selected.factor)} {selected.baseUnit}
                </span>
            )}
        </div>
    )
}
