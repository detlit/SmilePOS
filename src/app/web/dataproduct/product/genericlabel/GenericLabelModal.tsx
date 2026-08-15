'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'

interface Fixname {
  id: number
  shortlist: string
  list: string
  company: string
}

interface GenericLabel {
  id: number
  company: string
  fixname: string
  shortname: string
  indicatorlistS: string
  timeS: string
  useS: string
  timeuseS: string
  keepS: string
  remarkS: string
}

interface DropdownItem {
  id: number
  list: string
  fullname?: string
}

interface GenericLabelModalProps {
  isOpen: boolean
  onClose: () => void
}

function SearchableDropdown({ options, displayField, onSelect, placeholder = 'เลือก...' }: {
  options: DropdownItem[]
  displayField: 'list' | 'fullname'
  onSelect: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getDisplay = (o: DropdownItem) => displayField === 'fullname' ? (o.fullname || o.list) : o.list

  const filtered = options.filter(o => {
    const d = getDisplay(o) || ''
    return d.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div ref={ref} style={{ position: 'relative', width: '45%' }}>
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{
          fontFamily: 'Kanit', fontSize: '11px', padding: '6px 8px', width: '100%',
          border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none',
          backgroundColor: '#faf5ff',
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 6px 6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto',
        }}>
          {filtered.map((o) => {
            const d = getDisplay(o)
            return (
              <div
                key={o.id}
                onClick={() => { onSelect(d || ''); setSearch(''); setOpen(false) }}
                style={{
                  padding: '6px 10px', cursor: 'pointer', fontFamily: 'Kanit', fontSize: '11px',
                  borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f5f3ff' }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
              >
                {d}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const emptyForm: Omit<GenericLabel, 'id' | 'company' | 'fixname'> = {
  shortname: '',
  indicatorlistS: '',
  timeS: '',
  useS: '',
  timeuseS: '',
  keepS: '',
  remarkS: '',
}

export default function GenericLabelModal({ isOpen, onClose }: GenericLabelModalProps) {
  const [fixnames, setFixnames] = useState<Fixname[]>([])
  const [filteredFixnames, setFilteredFixnames] = useState<Fixname[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedFixname, setSelectedFixname] = useState<Fixname | null>(null)
  const [labels, setLabels] = useState<GenericLabel[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Dropdown data
  const [indicators, setIndicators] = useState<DropdownItem[]>([])
  const [useLs, setUseLs] = useState<DropdownItem[]>([])
  const [timeLs, setTimeLs] = useState<DropdownItem[]>([])
  const [timeUseLs, setTimeUseLs] = useState<DropdownItem[]>([])
  const [keepLs, setKeepLs] = useState<DropdownItem[]>([])
  const [remarkLs, setRemarkLs] = useState<DropdownItem[]>([])

  const company = typeof window !== 'undefined' ? localStorage.getItem('company_') || '' : ''

  // Fetch fixnames on open
  useEffect(() => {
    if (isOpen) {
      fetchFixnames()
      fetchDropdowns()
    }
  }, [isOpen])

  // Filter fixnames
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredFixnames(fixnames)
    } else {
      const q = searchText.toLowerCase()
      setFilteredFixnames(fixnames.filter(f =>
        (f.list || '').toLowerCase().includes(q) ||
        (f.shortlist || '').toLowerCase().includes(q)
      ))
    }
  }, [searchText, fixnames])

  const fetchFixnames = async () => {
    try {
      const res = await axios.get(`/api/fixname?company=${company}&sort=asc`)
      setFixnames(res.data)
      setFilteredFixnames(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchDropdowns = async () => {
    try {
      const [ind, use, time, timeuse, keep, remark] = await Promise.all([
        axios.get(`/api/label/indicatorlist?company=${company}&sort=asc`),
        axios.get(`/api/label/useL?company=${company}&sort=asc`),
        axios.get(`/api/label/timeL?company=${company}&sort=asc`),
        axios.get(`/api/label/timeuseL?company=${company}&sort=asc`),
        axios.get(`/api/label/keepL?company=${company}&sort=asc`),
        axios.get(`/api/label/remarkL?company=${company}&sort=asc`),
      ])
      setIndicators(ind.data)
      setUseLs(use.data)
      setTimeLs(time.data)
      setTimeUseLs(timeuse.data)
      setKeepLs(keep.data)
      setRemarkLs(remark.data)
    } catch (e) { console.error(e) }
  }

  const fetchLabels = useCallback(async (fixnameStr: string) => {
    try {
      const res = await axios.get(`/api/generic-label?company=${company}&fixname=${encodeURIComponent(fixnameStr)}&sort=asc`)
      setLabels(res.data)
    } catch (e) { console.error(e) }
  }, [company])

  const handleSelectFixname = (f: Fixname) => {
    setSelectedFixname(f)
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    fetchLabels(f.list || '')
  }

  const handleCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const handleEdit = (label: GenericLabel) => {
    setEditingId(label.id)
    setForm({
      shortname: label.shortname || '',
      indicatorlistS: label.indicatorlistS || '',
      timeS: label.timeS || '',
      useS: label.useS || '',
      timeuseS: label.timeuseS || '',
      keepS: label.keepS || '',
      remarkS: label.remarkS || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบข้อมูลฉลากสินค้านี้หรือไม่?')) return
    try {
      await axios.delete(`/api/generic-label/${id}`)
      if (selectedFixname) fetchLabels(selectedFixname.list || '')
    } catch (e) { console.error(e) }
  }

  const handleSave = async () => {
    if (!selectedFixname) return
    setSaving(true)
    try {
      const payload = {
        company,
        fixname: selectedFixname.list || '',
        ...form,
      }
      if (editingId) {
        await axios.put(`/api/generic-label/${editingId}`, payload)
      } else {
        await axios.post('/api/generic-label', payload)
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchLabels(selectedFixname.list || '')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const fieldConfig = [
    { key: 'indicatorlistS' as const, label: 'ข้อบ่งใช้', options: indicators, displayField: 'list' as const },
    { key: 'useS' as const, label: 'วิธีใช้สินค้า', options: useLs, displayField: 'fullname' as const },
    { key: 'timeS' as const, label: 'ช่วงเวลา', options: timeLs, displayField: 'list' as const },
    { key: 'timeuseS' as const, label: 'เวลาที่ใช้', options: timeUseLs, displayField: 'list' as const },
    { key: 'keepS' as const, label: 'วิธีเก็บรักษา', options: keepLs, displayField: 'list' as const },
    { key: 'remarkS' as const, label: 'หมายเหตุ', options: remarkLs, displayField: 'list' as const },
  ]

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" dialogClassName="modal-90w">
      <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', padding: '12px 20px' }}>
        <Modal.Title style={{ fontFamily: 'Kanit_B', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💊 ตั้งฉลากสินค้า ตาม Generic Name
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '0', display: 'flex', height: '80vh', overflow: 'hidden' }}>

        {/* Col 1 - Fixname List */}
        <div style={{ width: '350px', minWidth: '350px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
            <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
              🔍 ค้นหาชื่อทางการ (Generic Name)
            </div>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="พิมพ์ชื่อทางการ..."
              style={{
                fontFamily: 'Kanit', fontSize: '12px', width: '100%', padding: '10px 12px',
                border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)' }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              ทั้งหมด {filteredFixnames.length} รายการ
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredFixnames.map((f, index) => (
              <div
                key={f.id}
                onClick={() => handleSelectFixname(f)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: selectedFixname?.id === f.id ? '#ede9fe' : index % 2 === 0 ? 'white' : '#fafbfc',
                  borderLeft: selectedFixname?.id === f.id ? '3px solid #8b5cf6' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseOver={(e) => {
                  if (selectedFixname?.id !== f.id) {
                    e.currentTarget.style.backgroundColor = '#f5f3ff'
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedFixname?.id !== f.id) {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fafbfc'
                  }
                }}
              >
                <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#334155', fontWeight: selectedFixname?.id === f.id ? 600 : 400 }}>
                  {f.list || '-'}
                </div>
                {f.shortlist && (
                  <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#8b5cf6', marginTop: '2px' }}>
                    {f.shortlist}
                  </div>
                )}
              </div>
            ))}
            {filteredFixnames.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                ไม่พบข้อมูล
              </div>
            )}
          </div>
        </div>

        {/* Col 2 - GenericLabel Management */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedFixname ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '14px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💊</div>
                <div>เลือกชื่อทางการจากด้านซ้ายเพื่อจัดการฉลากสินค้า</div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: '15px', color: '#1e293b' }}>
                    {selectedFixname.list}
                  </div>
                  {selectedFixname.shortlist && (
                    <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#8b5cf6' }}>
                      {selectedFixname.shortlist}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCreate}
                  style={{
                    fontFamily: 'Kanit_B', fontSize: '12px', padding: '8px 16px',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    color: 'white', boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  + เพิ่มฉลากสินค้า
                </button>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', backgroundColor: '#f8fafc' }}>

                {/* Form (Create/Edit) */}
                {showForm && (
                  <div style={{
                    backgroundColor: 'white', borderRadius: '12px', border: '2px solid #8b5cf6',
                    padding: '20px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(139,92,246,0.1)',
                  }}>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#6d28d9', marginBottom: '16px' }}>
                      {editingId ? '✏️ แก้ไขฉลากสินค้า' : '➕ สร้างฉลากสินค้าใหม่'}
                    </div>

                    {/* Shortname */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                        ชื่อย่อ / ชื่อชุดฉลาก
                      </label>
                      <input
                        value={form.shortname}
                        onChange={(e) => setForm({ ...form, shortname: e.target.value })}
                        placeholder="เช่น ผู้ใหญ่, เด็ก, สูงอายุ..."
                        style={{
                          fontFamily: 'Kanit', fontSize: '12px', width: '100%', padding: '8px 12px',
                          border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#8b5cf6' }}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                      />
                    </div>

                    {/* Label Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {fieldConfig.map(({ key, label, options, displayField }) => (
                        <div key={key}>
                          <label style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                            {label}
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <SearchableDropdown
                              options={options}
                              displayField={displayField}
                              placeholder="เลือก..."
                              onSelect={(val) => {
                                const current = form[key]
                                const newVal = current ? `${current}, ${val}` : val
                                setForm({ ...form, [key]: newVal })
                              }}
                            />
                            <input
                              value={form[key]}
                              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                              placeholder={`พิมพ์${label}...`}
                              style={{
                                fontFamily: 'Kanit', fontSize: '11px', flex: 1, padding: '6px 8px',
                                border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none',
                              }}
                              onFocus={(e) => { e.target.style.borderColor = '#8b5cf6' }}
                              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleCancel}
                        style={{
                          fontFamily: 'Kanit', fontSize: '12px', padding: '8px 20px',
                          border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white',
                          color: '#64748b', cursor: 'pointer',
                        }}
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                          fontFamily: 'Kanit_B', fontSize: '12px', padding: '8px 24px',
                          border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
                          background: saving ? '#d4d4d8' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                          color: 'white', boxShadow: saving ? 'none' : '0 2px 8px rgba(139,92,246,0.3)',
                        }}
                      >
                        {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Label Cards */}
                {labels.length === 0 && !showForm ? (
                  <div style={{ textAlign: 'center', padding: '50px 16px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '13px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
                    <div>ยังไม่มีข้อมูลฉลากสินค้าสำหรับ "{selectedFixname.list}"</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>กดปุ่ม "+ เพิ่มฉลากสินค้า" เพื่อเริ่มสร้าง</div>
                  </div>
                ) : (
                  labels.map((label) => (
                    <div key={label.id} style={{
                      backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0',
                      padding: '16px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'box-shadow 0.15s',
                    }}
                      onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                      onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{
                          fontFamily: 'Kanit_B', fontSize: '13px', color: '#6d28d9',
                          backgroundColor: '#ede9fe', padding: '4px 12px', borderRadius: '20px',
                        }}>
                          {label.shortname || 'ไม่มีชื่อย่อ'}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleEdit(label)}
                            style={{
                              fontFamily: 'Kanit', fontSize: '11px', padding: '4px 12px',
                              border: '1px solid #8b5cf6', borderRadius: '6px',
                              backgroundColor: 'white', color: '#8b5cf6', cursor: 'pointer',
                            }}
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(label.id)}
                            style={{
                              fontFamily: 'Kanit', fontSize: '11px', padding: '4px 12px',
                              border: '1px solid #ef4444', borderRadius: '6px',
                              backgroundColor: 'white', color: '#ef4444', cursor: 'pointer',
                            }}
                          >
                            🗑️ ลบ
                          </button>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                        {[
                          { label: 'ข้อบ่งใช้', value: label.indicatorlistS },
                          { label: 'วิธีใช้สินค้า', value: label.useS },
                          { label: 'ช่วงเวลา', value: label.timeS },
                          { label: 'เวลาที่ใช้', value: label.timeuseS },
                          { label: 'วิธีเก็บรักษา', value: label.keepS },
                          { label: 'หมายเหตุ', value: label.remarkS },
                        ].map(({ label: fieldLabel, value }) => (
                          <div key={fieldLabel} style={{ padding: '6px 10px', backgroundColor: '#faf5ff', borderRadius: '6px' }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#8b5cf6', fontWeight: 600 }}>
                              {fieldLabel}
                            </div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#334155', minHeight: '18px' }}>
                              {value || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </Modal.Body>
    </Modal>
  )
}
