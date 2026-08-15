'use client'

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import MenuTab_Small from '../../componant/menutab_small.tsx'
import HeadTab from '../../componant/headtab.jsx'
import MenuProductHead from '../../componant/menuproducthead.jsx'

/* --------- Types --------- */
interface DupRow {
  id: number
  code: string
  ProductName: string
  Barcode: string
  isKeeper: boolean
  newCode?: string
}
interface CodeGroup {
  code: string
  rows: DupRow[]
}
interface BarcodeGroup {
  Barcode: string
  rows: DupRow[]
}
interface EmptyBarcodeRow {
  id: number
  code: string
  ProductName: string
  Barcode: string
  newBarcode: string | null
  conflict?: string
}
interface ScanResult {
  ok: boolean
  company: string
  totalProducts: number
  nextCodeStart: number
  duplicateCodes: CodeGroup[]
  duplicateBarcodes: BarcodeGroup[]
  emptyBarcodeRows: EmptyBarcodeRow[]
  summary: {
    codeGroups: number
    codeRowsToRename: number
    barcodeGroups: number
    barcodeRowsToClear: number
    emptyBarcodes: number
    emptyBarcodesToFill: number
  }
}

/* --------- Helpers --------- */
function csvEscape(v: any) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCSV(filename: string, rows: string[][]) {
  // BOM so Excel detects UTF-8 Thai correctly
  const csv = '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* --------- Page --------- */
export default function DuplicatesPage() {
  return (
    <div className="container-fluid" style={{ fontFamily: 'kanit', paddingLeft: 15, paddingRight: 15 }}>
      <div className="row justify-content-start">
        <HeadTab />
      </div>
      <div className="row justify-content-start">
        <div className="col-sm-1">
          <MenuTab_Small />
        </div>
        <div className="col-sm-11">
          <MenuProductHead />
          <Body />
        </div>
      </div>
    </div>
  )
}

function Body() {
  const [company, setCompany] = useState('')
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [applyCodes, setApplyCodes] = useState(true)
  const [applyBarcodes, setApplyBarcodes] = useState(true)
  const [applyFillBarcodes, setApplyFillBarcodes] = useState(true)
  // Per-row decision for each Barcode-duplicate row: 'clear' = ล้าง Barcode, 'keep' = ไม่ดำเนินการ
  const [barcodeDecisions, setBarcodeDecisions] = useState<Record<number, 'clear' | 'keep'>>({})
  const [resultMsg, setResultMsg] = useState<string>('')
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    const c = (typeof window !== 'undefined' && localStorage.getItem('company_')) || ''
    setCompany(c)
  }, [])

  const doScan = async () => {
    if (!company) return
    setLoading(true)
    setResultMsg('')
    setWarnings([])
    try {
      const res = await axios.get<ScanResult>(
        `/api/datalist/duplicate-codes?company=${encodeURIComponent(company)}`
      )
      setScan(res.data)
      // Initialise default decisions: keeper -> 'keep', others -> 'clear'
      const init: Record<number, 'clear' | 'keep'> = {}
      for (const g of res.data.duplicateBarcodes || []) {
        for (const r of g.rows) init[r.id] = r.isKeeper ? 'keep' : 'clear'
      }
      setBarcodeDecisions(init)
    } catch (e: any) {
      setResultMsg('❌ สแกนล้มเหลว: ' + (e?.response?.data?.error || e?.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  const doApply = async () => {
    if (!company || !scan) return
    setApplying(true)
    setResultMsg('')
    setWarnings([])
    try {
      const res = await axios.post(`/api/datalist/duplicate-codes`, {
        company,
        applyCodes,
        applyBarcodes,
        applyFillBarcodes,
        barcodeClearIds: applyBarcodes ? selectedClearIds : [],
        dryRun: false,
      })
      const s = res.data?.summary
      setWarnings(s?.warnings || [])
      setResultMsg(
        `✅ สำเร็จ: เปลี่ยนรหัส ${s?.codesFixed || 0} รายการ, ล้าง Barcode ซ้ำ ${s?.barcodesFixed || 0} รายการ, เติม Barcode จากรหัส ${s?.barcodesFilled || 0} รายการ`
      )
      // refresh scan
      await doScan()
    } catch (e: any) {
      setResultMsg('❌ ดำเนินการล้มเหลว: ' + (e?.response?.data?.error || e?.message || 'unknown'))
    } finally {
      setApplying(false)
      setConfirming(false)
    }
  }

  const exportCSV = () => {
    if (!scan) return
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

    // Codes report
    const codeRows: string[][] = [
      ['ประเภท', 'รหัสเดิม', 'id', 'ชื่อสินค้า', 'Barcode', 'สถานะ', 'รหัสใหม่'],
    ]
    for (const g of scan.duplicateCodes) {
      for (const r of g.rows) {
        codeRows.push([
          'รหัสซ้ำ',
          g.code,
          String(r.id),
          r.ProductName,
          r.Barcode,
          r.isKeeper ? 'เก็บ' : 'เปลี่ยน',
          r.newCode || '',
        ])
      }
    }
    downloadCSV(`duplicate-codes_${company}_${stamp}.csv`, codeRows)

    // Barcodes report
    const bcRows: string[][] = [
      ['ประเภท', 'Barcode', 'id', 'รหัส', 'ชื่อสินค้า', 'สถานะ'],
    ]
    for (const g of scan.duplicateBarcodes) {
      for (const r of g.rows) {
        bcRows.push([
          'Barcode ซ้ำ',
          g.Barcode,
          String(r.id),
          r.code,
          r.ProductName,
          r.isKeeper ? 'เก็บ' : 'ล้าง',
        ])
      }
    }
    downloadCSV(`duplicate-barcodes_${company}_${stamp}.csv`, bcRows)

    // Empty barcode fill report
    if (scan.emptyBarcodeRows && scan.emptyBarcodeRows.length > 0) {
      const fillRows: string[][] = [
        ['ประเภท', 'id', 'รหัสสินค้า', 'ชื่อสินค้า', 'Barcode เดิม', 'Barcode ใหม่', 'หมายเหตุ'],
      ]
      for (const r of scan.emptyBarcodeRows) {
        fillRows.push([
          'เติม Barcode',
          String(r.id),
          r.code,
          r.ProductName,
          r.Barcode,
          r.newBarcode || '',
          r.conflict || '',
        ])
      }
      downloadCSV(`empty-barcodes_${company}_${stamp}.csv`, fillRows)
    }
  }

  const selectedClearIds = useMemo(() => {
    if (!scan) return [] as number[]
    const ids: number[] = []
    for (const g of scan.duplicateBarcodes) {
      for (const r of g.rows) {
        if (barcodeDecisions[r.id] === 'clear') ids.push(r.id)
      }
    }
    return ids
  }, [scan, barcodeDecisions])

  const totalToFix = useMemo(() => {
    if (!scan) return 0
    let n = 0
    if (applyCodes) n += scan.summary.codeRowsToRename
    if (applyBarcodes) n += selectedClearIds.length
    if (applyFillBarcodes) n += scan.summary.emptyBarcodesToFill || 0
    return n
  }, [scan, applyCodes, applyBarcodes, applyFillBarcodes, selectedClearIds])

  return (
    <div
      className="container-fluid"
      style={{ fontFamily: 'kanit', padding: 16, maxWidth: 1400, margin: '0 auto' }}
    >
      {/* Header card */}
      <div
        style={{
          background: 'linear-gradient(135deg,#fef2f2 0%,#fff7ed 100%)',
          border: '1px solid #fecaca',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>
              🛠️ ตรวจสอบและแก้ไขรหัสสินค้า / Barcode ซ้ำ
            </div>
            <div style={{ fontSize: 13, color: '#7c2d12' }}>
              ระบบจะสแกนสินค้าทั้งหมดของบริษัท <b>{company || '-'}</b> หา <b>รหัสซ้ำ</b> และ
              <b> Barcode ซ้ำ</b> โดยจะคงประวัติการขาย/รับ/โอน/ปรับยอดและยอดคงเหลือไว้เท่าเดิม
              (เปลี่ยนเฉพาะรหัสในประวัติให้ตรงกัน)
            </div>
          </div>
          <button
            onClick={doScan}
            disabled={loading || !company}
            style={{
              fontFamily: 'kanit',
              fontSize: 14,
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#9ca3af' : '#2A6AAA',
              color: 'white',
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}
          >
            {loading ? '⏳ กำลังสแกน...' : '🔍 สแกนรหัสซ้ำ'}
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 8,
            fontSize: 12,
            color: '#92400e',
          }}
        >
          ⚠️ <b>คำแนะนำ:</b> ก่อนกดยืนยันแก้ไข ควรสำรองฐานข้อมูล (Backup) ผ่านเมนูตั้งค่าก่อน
          และระบบจะบันทึก audit log ไว้ที่ <code>data/backups/duplicate-fix/</code> โดยอัตโนมัติ
        </div>
      </div>

      {/* Summary cards */}
      {scan && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <SummaryCard label="สินค้าทั้งหมด" value={scan.totalProducts} color="#3E86C7" icon="📦" />
          <SummaryCard
            label="กลุ่มรหัสซ้ำ"
            value={scan.summary.codeGroups}
            color="#dc2626"
            icon="🆔"
          />
          <SummaryCard
            label="รหัสที่ต้องเปลี่ยน"
            value={scan.summary.codeRowsToRename}
            color="#ea580c"
            icon="✏️"
          />
          <SummaryCard
            label="กลุ่ม Barcode ซ้ำ"
            value={scan.summary.barcodeGroups}
            color="#7c3aed"
            icon="📊"
          />
          <SummaryCard
            label="Barcode ที่จะล้าง"
            value={scan.summary.barcodeRowsToClear}
            color="#9333ea"
            icon="🧹"
          />
          <SummaryCard
            label="Barcode ว่าง/เป็น 0"
            value={scan.summary.emptyBarcodes || 0}
            color="#0891b2"
            icon="📝"
          />
          <SummaryCard
            label="Barcode ที่จะเติม"
            value={scan.summary.emptyBarcodesToFill || 0}
            color="#0d9488"
            icon="✏️"
          />
          <SummaryCard
            label="รหัสใหม่เริ่มที่"
            value={scan.nextCodeStart}
            color="#2A6AAA"
            icon="🔢"
          />
        </div>
      )}

      {/* Result message */}
      {resultMsg && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 14,
            background: resultMsg.startsWith('✅') ? '#EDF9F3' : '#fef2f2',
            color: resultMsg.startsWith('✅') ? '#0C5238' : '#991b1b',
            border: `1px solid ${resultMsg.startsWith('✅') ? '#A9E1C6' : '#fecaca'}`,
          }}
        >
          {resultMsg}
        </div>
      )}
      {warnings.length > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
            background: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>⚠️ คำเตือน ({warnings.length})</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section A — Duplicate codes */}
      {scan && (
        <Section
          title="🆔 รหัสสินค้าซ้ำ"
          subtitle={`${scan.summary.codeGroups} กลุ่ม • ${scan.summary.codeRowsToRename} รายการที่จะเปลี่ยน`}
          color="#dc2626"
        >
          {scan.duplicateCodes.length === 0 ? (
            <EmptyState text="ไม่พบรหัสสินค้าซ้ำ 🎉" />
          ) : (
            <CodeTable groups={scan.duplicateCodes} />
          )}
        </Section>
      )}

      {/* Section B — Duplicate barcodes */}
      {scan && (
        <Section
          title="📊 Barcode ซ้ำ"
          subtitle={`${scan.summary.barcodeGroups} กลุ่ม • เลือกล้าง ${selectedClearIds.length}/${scan.summary.barcodeRowsToClear} รายการ`}
          color="#7c3aed"
        >
          {scan.duplicateBarcodes.length === 0 ? (
            <EmptyState text="ไม่พบ Barcode ซ้ำ 🎉" />
          ) : (
            <BarcodeTable
              groups={scan.duplicateBarcodes}
              decisions={barcodeDecisions}
              onChange={(id, val) =>
                setBarcodeDecisions((prev) => ({ ...prev, [id]: val }))
              }
              onSetGroup={(group, val) =>
                setBarcodeDecisions((prev) => {
                  const next = { ...prev }
                  for (const r of group.rows) next[r.id] = val
                  return next
                })
              }
            />
          )}
        </Section>
      )}

      {/* Section C — Empty/zero barcodes (fill with code) */}
      {scan && (
        <Section
          title="📝 Barcode ว่าง / เป็น 0"
          subtitle={`${scan.summary.emptyBarcodes || 0} รายการ • เติมได้ ${scan.summary.emptyBarcodesToFill || 0} รายการ (ใช้รหัสสินค้าเป็น Barcode)`}
          color="#0d9488"
        >
          {(scan.emptyBarcodeRows || []).length === 0 ? (
            <EmptyState text="ไม่มี Barcode ว่าง 🎉" />
          ) : (
            <EmptyBarcodeTable rows={scan.emptyBarcodeRows} />
          )}
        </Section>
      )}

      {/* Sticky footer */}
      {scan && (scan.duplicateCodes.length > 0 || scan.duplicateBarcodes.length > 0 || (scan.emptyBarcodeRows || []).length > 0) && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'white',
            borderTop: '2px solid #e5e7eb',
            padding: 14,
            marginTop: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
            zIndex: 10,
          }}
        >
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={applyCodes}
              onChange={(e) => setApplyCodes(e.target.checked)}
            />
            แก้ไขรหัสซ้ำ ({scan.summary.codeRowsToRename})
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={applyBarcodes}
              onChange={(e) => setApplyBarcodes(e.target.checked)}
            />
            ล้าง Barcode ซ้ำ ({selectedClearIds.length})
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={applyFillBarcodes}
              onChange={(e) => setApplyFillBarcodes(e.target.checked)}
            />
            เติม Barcode จากรหัส ({scan.summary.emptyBarcodesToFill || 0})
          </label>
          <div style={{ flex: 1 }} />
          <button
            onClick={exportCSV}
            style={{
              fontFamily: 'kanit',
              fontSize: 13,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            📥 บันทึกรายงาน CSV
          </button>
          <button
            onClick={() => setConfirming(true)}
            disabled={totalToFix === 0 || applying}
            style={{
              fontFamily: 'kanit',
              fontSize: 14,
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: totalToFix === 0 || applying ? '#9ca3af' : '#dc2626',
              color: 'white',
              cursor: totalToFix === 0 || applying ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}
          >
            {applying ? '⏳ กำลังดำเนินการ...' : `✅ ยืนยันแก้ไขทั้งหมด (${totalToFix})`}
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {confirming && scan && (
        <ConfirmModal
          codeCount={applyCodes ? scan.summary.codeRowsToRename : 0}
          barcodeCount={applyBarcodes ? selectedClearIds.length : 0}
          fillCount={applyFillBarcodes ? scan.summary.emptyBarcodesToFill || 0 : 0}
          onCancel={() => setConfirming(false)}
          onConfirm={doApply}
          applying={applying}
        />
      )}
    </div>
  )
}

/* --------- Sub-components --------- */

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: string
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 14,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color }}>{value.toLocaleString()}</div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  color,
  children,
}: {
  title: string
  subtitle: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color }}>{title}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{subtitle}</div>
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 32,
        color: '#6b7280',
        fontSize: 14,
      }}
    >
      {text}
    </div>
  )
}

function CodeTable({ groups }: { groups: CodeGroup[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fef2f2' }}>
            <Th>รหัสเดิม</Th>
            <Th>id</Th>
            <Th>ชื่อสินค้า</Th>
            <Th>Barcode</Th>
            <Th>สถานะ</Th>
            <Th>รหัสใหม่</Th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, gi) => (
            <React.Fragment key={gi}>
              {g.rows.map((r, ri) => (
                <tr
                  key={`${gi}-${ri}`}
                  style={{
                    background: r.isKeeper ? '#F3F8FC' : 'white',
                    borderTop: ri === 0 ? '2px solid #fecaca' : '1px solid #f3f4f6',
                  }}
                >
                  <Td mono bold={ri === 0}>{ri === 0 ? g.code : ''}</Td>
                  <Td mono>{r.id}</Td>
                  <Td>{r.ProductName}</Td>
                  <Td mono>{r.Barcode}</Td>
                  <Td>
                    {r.isKeeper ? (
                      <Badge color="#2A6AAA" bg="#E5EEF8">
                        เก็บ (รหัสเดิม)
                      </Badge>
                    ) : (
                      <Badge color="#dc2626" bg="#fee2e2">
                        เปลี่ยนรหัส
                      </Badge>
                    )}
                  </Td>
                  <Td mono bold>
                    {r.newCode ? (
                      <span style={{ color: '#dc2626' }}>{r.newCode}</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BarcodeTable({
  groups,
  decisions,
  onChange,
  onSetGroup,
}: {
  groups: BarcodeGroup[]
  decisions: Record<number, 'clear' | 'keep'>
  onChange: (id: number, val: 'clear' | 'keep') => void
  onSetGroup: (group: BarcodeGroup, val: 'clear' | 'keep') => void
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#faf5ff' }}>
            <Th>Barcode</Th>
            <Th>id</Th>
            <Th>รหัส</Th>
            <Th>ชื่อสินค้า</Th>
            <Th>สถานะ / การดำเนินการ</Th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, gi) => (
            <React.Fragment key={gi}>
              {g.rows.map((r, ri) => {
                const decision = decisions[r.id] || (r.isKeeper ? 'keep' : 'clear')
                return (
                  <tr
                    key={`${gi}-${ri}`}
                    style={{
                      background: decision === 'keep' ? '#F3F8FC' : 'white',
                      borderTop: ri === 0 ? '2px solid #ddd6fe' : '1px solid #f3f4f6',
                    }}
                  >
                    <Td mono bold={ri === 0}>
                      {ri === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span>{g.Barcode}</span>
                          <button
                            type="button"
                            onClick={() => onSetGroup(g, 'keep')}
                            style={{
                              fontFamily: 'kanit',
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: '1px solid #d1d5db',
                              background: 'white',
                              cursor: 'pointer',
                              color: '#2A6AAA',
                            }}
                            title="ไม่ลบทั้งกลุ่ม"
                          >
                            ⏭️ ข้ามทั้งกลุ่ม
                          </button>
                        </div>
                      ) : (
                        ''
                      )}
                    </Td>
                    <Td mono>{r.id}</Td>
                    <Td mono>{r.code}</Td>
                    <Td>{r.ProductName}</Td>
                    <Td>
                      <select
                        value={decision}
                        onChange={(e) => onChange(r.id, e.target.value as 'clear' | 'keep')}
                        style={{
                          fontFamily: 'kanit',
                          fontSize: 12,
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          background:
                            decision === 'clear' ? '#ede9fe' : '#E5EEF8',
                          color:
                            decision === 'clear' ? '#7c3aed' : '#2A6AAA',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="keep">✓ เก็บ Barcode ไว้</option>
                        <option value="clear">✗ ล้าง Barcode + ลบฉลากสินค้า</option>
                      </select>
                    </Td>
                  </tr>
                )
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyBarcodeTable({ rows }: { rows: EmptyBarcodeRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#ecfeff' }}>
            <Th>id</Th>
            <Th>รหัสสินค้า</Th>
            <Th>ชื่อสินค้า</Th>
            <Th>Barcode เดิม</Th>
            <Th>Barcode ที่จะใช้</Th>
            <Th>สถานะ</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              style={{
                borderTop: '1px solid #f3f4f6',
                background: r.newBarcode ? '#f0fdfa' : '#fef2f2',
              }}
            >
              <Td mono>{r.id}</Td>
              <Td mono>{r.code}</Td>
              <Td>{r.ProductName}</Td>
              <Td mono>{r.Barcode || <span style={{ color: '#9ca3af' }}>(ว่าง)</span>}</Td>
              <Td mono bold>
                {r.newBarcode ? (
                  <span style={{ color: '#0d9488' }}>{r.newBarcode}</span>
                ) : (
                  <span style={{ color: '#9ca3af' }}>—</span>
                )}
              </Td>
              <Td>
                {r.newBarcode ? (
                  <Badge color="#0d9488" bg="#ccfbf1">
                    เติมรหัสเป็น Barcode
                  </Badge>
                ) : (
                  <Badge color="#dc2626" bg="#fee2e2">
                    ข้าม ({r.conflict || 'ไม่ทราบสาเหตุ'})
                  </Badge>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '8px 10px',
        fontWeight: 600,
        fontSize: 12,
        color: '#374151',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  mono = false,
  bold = false,
}: {
  children: React.ReactNode
  mono?: boolean
  bold?: boolean
}) {
  return (
    <td
      style={{
        padding: '8px 10px',
        fontFamily: mono ? 'ui-monospace,Menlo,monospace' : 'kanit',
        fontWeight: bold ? 600 : 400,
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  )
}

function Badge({
  children,
  color,
  bg,
}: {
  children: React.ReactNode
  color: string
  bg: string
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  )
}

function ConfirmModal({
  codeCount,
  barcodeCount,
  fillCount,
  onCancel,
  onConfirm,
  applying,
}: {
  codeCount: number
  barcodeCount: number
  fillCount: number
  onCancel: () => void
  onConfirm: () => void
  applying: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: 'kanit',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          maxWidth: 480,
          width: '90%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: '#991b1b', marginBottom: 12 }}>
          ⚠️ ยืนยันการแก้ไขข้อมูล
        </div>
        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
          ระบบจะดำเนินการต่อไปนี้:
          <ul style={{ marginTop: 8, paddingLeft: 22 }}>
            <li>
              เปลี่ยนรหัสสินค้าที่ซ้ำ <b style={{ color: '#dc2626' }}>{codeCount}</b> รายการ
              พร้อมอัพเดทประวัติการขาย/รับ/โอน/ปรับยอด ให้ตรงกัน
            </li>
            <li>
              ล้าง Barcode ที่ซ้ำ <b style={{ color: '#7c3aed' }}>{barcodeCount}</b> รายการ
              (ตั้งค่าเป็นค่าว่าง พร้อมลบข้อมูลฉลากสินค้าของสินค้านั้น)
            </li>
            <li>
              เติม Barcode ที่ว่าง/เป็น 0 ด้วยรหัสสินค้า <b style={{ color: '#0d9488' }}>{fillCount}</b> รายการ
            </li>
          </ul>
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 6,
              fontSize: 12,
              color: '#92400e',
            }}
          >
            💡 ยอดคงเหลือ ณ หน้า "สรุปยอดคงเหลือ" จะคำนวณได้เท่าเดิมทุกประการ
            เพราะระบบเปลี่ยนเฉพาะรหัสในประวัติ ไม่แตะจำนวน/ต้นทุน
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={applying}
            style={{
              fontFamily: 'kanit',
              fontSize: 14,
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: applying ? 'wait' : 'pointer',
            }}
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={applying}
            style={{
              fontFamily: 'kanit',
              fontSize: 14,
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: applying ? '#9ca3af' : '#dc2626',
              color: 'white',
              cursor: applying ? 'wait' : 'pointer',
              fontWeight: 500,
            }}
          >
            {applying ? '⏳ กำลังดำเนินการ...' : '✅ ยืนยัน ดำเนินการ'}
          </button>
        </div>
      </div>
    </div>
  )
}
