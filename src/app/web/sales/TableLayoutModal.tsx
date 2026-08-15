'use client'

/**
 * Modal จัดวาง Layout โต๊ะแบบ Drag & Drop
 *
 * เปิดเป็น overlay เต็มหน้าจอ — ผู้ใช้ลากโต๊ะบน floor plan เพื่อจัดวาง layout
 * ใช้ Pointer Events (ไม่พึ่ง library ภายนอก) รองรับทั้ง mouse และ touch
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Grid3X3, GripVertical, Maximize2, Minus, MousePointer2,
  Plus, RotateCcw, Save, Trash2, X, Circle, Square, Users, ChevronDown, Settings2, Move
} from 'lucide-react'
import styles from "../componant/mystyle.module.css"
import { useTableLayoutStore, type TableItem } from './useTableLayoutStore'

/* ─── Constants ─── */
const STATUS_COLORS: Record<TableItem['status'], { bg: string; border: string; label: string }> = {
  available: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', label: 'ว่าง' },
  occupied: { bg: 'rgba(249,115,22,0.15)', border: '#f97316', label: 'กำลังใช้' },
  reserved: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', label: 'จองแล้ว' },
}

const SHAPE_PRESETS = [
  { shape: 'rect' as const, label: 'สี่เหลี่ยม' },
  { shape: 'circle' as const, label: 'วงกลม' },
]

const COLOR_PRESETS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#64748b']

/* ─── Draggable Table Item ─── */
function DraggableTable({
  table,
  selected,
  onSelect,
  onDragEnd,
  containerRef,
}: {
  table: TableItem
  selected: boolean
  onSelect: () => void
  onDragEnd: (id: string, x: number, y: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const posRef = useRef({ x: table.x, y: table.y })

  // Keep posRef in sync when table prop changes (e.g. after reset)
  useEffect(() => {
    posRef.current = { x: table.x, y: table.y }
  }, [table.x, table.y])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    dragging.current = true
    const el = ref.current!
    el.setPointerCapture(e.pointerId)
    const rect = el.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [onSelect])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current || !ref.current) return
    const cr = containerRef.current.getBoundingClientRect()
    let nx = e.clientX - cr.left - offset.current.x
    let ny = e.clientY - cr.top - offset.current.y
    // Clamp within container
    nx = Math.max(0, Math.min(nx, cr.width - table.width))
    ny = Math.max(0, Math.min(ny, cr.height - table.height))
    posRef.current = { x: nx, y: ny }
    ref.current.style.left = `${nx}px`
    ref.current.style.top = `${ny}px`
  }, [containerRef, table.width, table.height])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    dragging.current = false
    ref.current?.releasePointerCapture(e.pointerId)
    onDragEnd(table.id, posRef.current.x, posRef.current.y)
  }, [onDragEnd, table.id])

  const statusInfo = STATUS_COLORS[table.status]
  const isCircle = table.shape === 'circle'

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={styles.tblLayoutItem}
      data-selected={selected || undefined}
      data-status={table.status}
      style={{
        left: table.x,
        top: table.y,
        width: table.width,
        height: isCircle ? table.width : table.height,
        borderRadius: isCircle ? '50%' : 12,
        borderColor: selected ? table.color : statusInfo.border,
        background: selected
          ? `linear-gradient(135deg, ${table.color}22, ${table.color}11)`
          : statusInfo.bg,
        boxShadow: selected
          ? `0 0 0 2px ${table.color}, 0 8px 24px rgba(0,0,0,0.15)`
          : '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      {/* Grip icon */}
      <div className={styles.tblLayoutItemGrip}>
        <Move size={11} strokeWidth={2.4} />
      </div>

      {/* Status dot */}
      <div
        className={styles.tblLayoutStatusDot}
        style={{ background: statusInfo.border }}
        title={statusInfo.label}
      />

      {/* Name */}
      <div className={styles.tblLayoutItemName}>{table.name}</div>

      {/* Seats */}
      <div className={styles.tblLayoutItemSeats}>
        <Users size={10} strokeWidth={2.2} />
        <span>{table.seats}</span>
      </div>
    </div>
  )
}

/* ─── Main Modal ─── */
function TableLayoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tables = useTableLayoutStore((s) => s.tables)
  const selectedTableId = useTableLayoutStore((s) => s.selectedTableId)
  const addTable = useTableLayoutStore((s) => s.addTable)
  const updateTable = useTableLayoutStore((s) => s.updateTable)
  const removeTable = useTableLayoutStore((s) => s.removeTable)
  const selectTable = useTableLayoutStore((s) => s.selectTable)
  const saveLayout = useTableLayoutStore((s) => s.saveLayout)
  const resetLayout = useTableLayoutStore((s) => s.resetLayout)

  const floorRef = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSeats, setNewSeats] = useState(4)
  const [newShape, setNewShape] = useState<'rect' | 'circle'>('rect')
  const [newColor, setNewColor] = useState('#3b82f6')

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) ?? null,
    [tables, selectedTableId]
  )

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when modal open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    updateTable(id, { x: Math.round(x), y: Math.round(y) })
  }, [updateTable])

  const handleSave = useCallback(() => {
    saveLayout()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [saveLayout])

  const handleAddTable = useCallback(() => {
    addTable({
      name: newName || `T${tables.length + 1}`,
      seats: newSeats,
      shape: newShape,
      color: newColor,
      x: 150 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    })
    setNewName('')
    setShowAddForm(false)
  }, [addTable, newName, newSeats, newShape, newColor, tables.length])

  const handleReset = useCallback(() => {
    if (window.confirm('ต้องการรีเซ็ต layout โต๊ะกลับเป็นค่าเริ่มต้น?')) {
      resetLayout()
    }
  }, [resetLayout])

  const handleFloorClick = useCallback((e: React.MouseEvent) => {
    if (e.target === floorRef.current) {
      selectTable(null)
    }
  }, [selectTable])

  if (!open) return null

  const modal = (
    <div className={styles.tblLayoutOverlay} onClick={onClose}>
      <div className={styles.tblLayoutModal} onClick={(e) => e.stopPropagation()}>
        {/* ──── Toolbar ──── */}
        <div className={styles.tblLayoutToolbar}>
          <div className={styles.tblLayoutToolbarLeft}>
            <div className={styles.tblLayoutToolbarIcon}>
              <Grid3X3 size={18} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.tblLayoutToolbarTitle}>จัดวาง Layout โต๊ะ</div>
              <div className={styles.tblLayoutToolbarSub}>ลากเพื่อจัดตำแหน่ง • {tables.length} โต๊ะ</div>
            </div>
          </div>
          <div className={styles.tblLayoutToolbarActions}>
            <button
              type="button"
              onClick={handleReset}
              className={styles.tblLayoutBtnSecondary}
              title="รีเซ็ต layout"
            >
              <RotateCcw size={14} strokeWidth={2.2} />
              <span>รีเซ็ต</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={styles.tblLayoutBtnPrimary}
            >
              <Save size={14} strokeWidth={2.2} />
              <span>{saved ? '✓ บันทึกแล้ว' : 'บันทึก'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.tblLayoutBtnClose}
              title="ปิด"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* ──── Body ──── */}
        <div className={styles.tblLayoutBody}>
          {/* Floor Plan */}
          <div className={styles.tblLayoutFloorWrap}>
            <div
              ref={floorRef}
              className={styles.tblLayoutFloor}
              onClick={handleFloorClick}
            >
              {tables.map((table) => (
                <DraggableTable
                  key={table.id}
                  table={table}
                  selected={table.id === selectedTableId}
                  onSelect={() => selectTable(table.id)}
                  onDragEnd={handleDragEnd}
                  containerRef={floorRef}
                />
              ))}

              {tables.length === 0 && (
                <div className={styles.tblLayoutEmptyFloor}>
                  <Grid3X3 size={40} strokeWidth={1.2} />
                  <div>ยังไม่มีโต๊ะ</div>
                  <span>กดปุ่ม "เพิ่มโต๊ะ" ทางขวาเพื่อเริ่มจัด layout</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.tblLayoutSidebar}>
            {/* Add table */}
            <div className={styles.tblLayoutSideSection}>
              <button
                type="button"
                className={styles.tblLayoutAddBtn}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus size={16} strokeWidth={2.4} />
                <span>เพิ่มโต๊ะ</span>
              </button>

              {showAddForm && (
                <div className={styles.tblLayoutAddForm}>
                  <div className={styles.tblLayoutFormRow}>
                    <label>ชื่อโต๊ะ</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={`T${tables.length + 1}`}
                      className={styles.tblLayoutInput}
                      maxLength={10}
                    />
                  </div>
                  <div className={styles.tblLayoutFormRow}>
                    <label>ที่นั่ง</label>
                    <div className={styles.tblLayoutQtyStepper}>
                      <button type="button" onClick={() => setNewSeats(Math.max(1, newSeats - 1))}><Minus size={12} /></button>
                      <span>{newSeats}</span>
                      <button type="button" onClick={() => setNewSeats(Math.min(20, newSeats + 1))}><Plus size={12} /></button>
                    </div>
                  </div>
                  <div className={styles.tblLayoutFormRow}>
                    <label>รูปทรง</label>
                    <div className={styles.tblLayoutShapeRow}>
                      {SHAPE_PRESETS.map((s) => (
                        <button
                          key={s.shape}
                          type="button"
                          className={`${styles.tblLayoutShapeBtn} ${newShape === s.shape ? styles.tblLayoutShapeBtnActive : ''}`}
                          onClick={() => setNewShape(s.shape)}
                          title={s.label}
                        >
                          {s.shape === 'rect' ? <Square size={16} /> : <Circle size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.tblLayoutFormRow}>
                    <label>สี</label>
                    <div className={styles.tblLayoutColorRow}>
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`${styles.tblLayoutColorDot} ${newColor === c ? styles.tblLayoutColorDotActive : ''}`}
                          style={{ background: c }}
                          onClick={() => setNewColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.tblLayoutConfirmAdd}
                    onClick={handleAddTable}
                  >
                    <Plus size={14} strokeWidth={2.4} />
                    เพิ่ม
                  </button>
                </div>
              )}
            </div>

            {/* Selected table editor */}
            {selectedTable && (
              <div className={styles.tblLayoutSideSection}>
                <div className={styles.tblLayoutSideSectionHead}>
                  <Settings2 size={14} strokeWidth={2.2} />
                  <span>แก้ไขโต๊ะ: {selectedTable.name}</span>
                </div>

                <div className={styles.tblLayoutEditForm}>
                  <div className={styles.tblLayoutFormRow}>
                    <label>ชื่อ</label>
                    <input
                      type="text"
                      value={selectedTable.name}
                      onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
                      className={styles.tblLayoutInput}
                      maxLength={10}
                    />
                  </div>
                  <div className={styles.tblLayoutFormRow}>
                    <label>ที่นั่ง</label>
                    <div className={styles.tblLayoutQtyStepper}>
                      <button type="button" onClick={() => updateTable(selectedTable.id, { seats: Math.max(1, selectedTable.seats - 1) })}><Minus size={12} /></button>
                      <span>{selectedTable.seats}</span>
                      <button type="button" onClick={() => updateTable(selectedTable.id, { seats: Math.min(20, selectedTable.seats + 1) })}><Plus size={12} /></button>
                    </div>
                  </div>
                  <div className={styles.tblLayoutFormRow}>
                    <label>ขนาด (กว้าง)</label>
                    <input
                      type="range"
                      min={60}
                      max={200}
                      value={selectedTable.width}
                      onChange={(e) => updateTable(selectedTable.id, { width: Number(e.target.value) })}
                      className={styles.tblLayoutSlider}
                    />
                  </div>
                  {selectedTable.shape !== 'circle' && (
                    <div className={styles.tblLayoutFormRow}>
                      <label>ขนาด (สูง)</label>
                      <input
                        type="range"
                        min={50}
                        max={200}
                        value={selectedTable.height}
                        onChange={(e) => updateTable(selectedTable.id, { height: Number(e.target.value) })}
                        className={styles.tblLayoutSlider}
                      />
                    </div>
                  )}
                  <div className={styles.tblLayoutFormRow}>
                    <label>รูปทรง</label>
                    <div className={styles.tblLayoutShapeRow}>
                      {SHAPE_PRESETS.map((s) => (
                        <button
                          key={s.shape}
                          type="button"
                          className={`${styles.tblLayoutShapeBtn} ${selectedTable.shape === s.shape ? styles.tblLayoutShapeBtnActive : ''}`}
                          onClick={() => updateTable(selectedTable.id, { shape: s.shape })}
                          title={s.label}
                        >
                          {s.shape === 'rect' ? <Square size={16} /> : <Circle size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.tblLayoutFormRow}>
                    <label>สถานะ</label>
                    <select
                      value={selectedTable.status}
                      onChange={(e) => updateTable(selectedTable.id, { status: e.target.value as TableItem['status'] })}
                      className={styles.tblLayoutSelect}
                    >
                      <option value="available">ว่าง</option>
                      <option value="occupied">กำลังใช้</option>
                      <option value="reserved">จองแล้ว</option>
                    </select>
                  </div>
                  <div className={styles.tblLayoutFormRow}>
                    <label>สี</label>
                    <div className={styles.tblLayoutColorRow}>
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`${styles.tblLayoutColorDot} ${selectedTable.color === c ? styles.tblLayoutColorDotActive : ''}`}
                          style={{ background: c }}
                          onClick={() => updateTable(selectedTable.id, { color: c })}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.tblLayoutDeleteBtn}
                    onClick={() => {
                      if (window.confirm(`ลบโต๊ะ "${selectedTable.name}"?`)) {
                        removeTable(selectedTable.id)
                      }
                    }}
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                    <span>ลบโต๊ะนี้</span>
                  </button>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className={styles.tblLayoutLegend}>
              <div className={styles.tblLayoutLegendTitle}>สัญลักษณ์สถานะ</div>
              {(Object.entries(STATUS_COLORS) as [TableItem['status'], typeof STATUS_COLORS[TableItem['status']]][]).map(([key, val]) => (
                <div key={key} className={styles.tblLayoutLegendItem}>
                  <span className={styles.tblLayoutLegendDot} style={{ background: val.border }} />
                  <span>{val.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

export default React.memo(TableLayoutModal)
