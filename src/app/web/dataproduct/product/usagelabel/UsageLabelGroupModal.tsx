'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Modal from 'react-bootstrap/Modal'

interface UsageLabelGroup {
  id: number
  company: string
  groupName: string
  shortName: string
  useS: string
  timeS: string
  timeuseS: string
  keepS: string
  remarkS: string
}

interface DropdownItem {
  id: number
  list: string
  fullname?: string
}

interface UsageLabelGroupModalProps {
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
          backgroundColor: '#F3F8FC',
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
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3F8FC' }}
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

const emptyForm: Omit<UsageLabelGroup, 'id' | 'company'> = {
  groupName: '',
  shortName: '',
  useS: '',
  timeS: '',
  timeuseS: '',
  keepS: '',
  remarkS: '',
}

export default function UsageLabelGroupModal({ isOpen, onClose }: UsageLabelGroupModalProps) {
  const [groups, setGroups] = useState<UsageLabelGroup[]>([])
  const [filteredGroups, setFilteredGroups] = useState<UsageLabelGroup[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<UsageLabelGroup | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Dropdown data
  const [useLs, setUseLs] = useState<DropdownItem[]>([])
  const [timeLs, setTimeLs] = useState<DropdownItem[]>([])
  const [timeUseLs, setTimeUseLs] = useState<DropdownItem[]>([])
  const [keepLs, setKeepLs] = useState<DropdownItem[]>([])
  const [remarkLs, setRemarkLs] = useState<DropdownItem[]>([])

  const company = typeof window !== 'undefined' ? localStorage.getItem('company_') || '' : ''

  useEffect(() => {
    if (isOpen) {
      fetchGroups()
      fetchDropdowns()
    }
  }, [isOpen])

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredGroups(groups)
    } else {
      const q = searchText.toLowerCase()
      setFilteredGroups(groups.filter(g =>
        (g.groupName || '').toLowerCase().includes(q) ||
        (g.shortName || '').toLowerCase().includes(q)
      ))
    }
  }, [searchText, groups])

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`/api/usage-label-group?company=${company}&sort=asc`)
      setGroups(res.data)
      setFilteredGroups(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchDropdowns = async () => {
    try {
      const [use, time, timeuse, keep, remark] = await Promise.all([
        axios.get(`/api/label/useL?company=${company}&sort=asc`),
        axios.get(`/api/label/timeL?company=${company}&sort=asc`),
        axios.get(`/api/label/timeuseL?company=${company}&sort=asc`),
        axios.get(`/api/label/keepL?company=${company}&sort=asc`),
        axios.get(`/api/label/remarkL?company=${company}&sort=asc`),
      ])
      setUseLs(use.data)
      setTimeLs(time.data)
      setTimeUseLs(timeuse.data)
      setKeepLs(keep.data)
      setRemarkLs(remark.data)
    } catch (e) { console.error(e) }
  }

  const handleSelectGroup = (g: UsageLabelGroup) => {
    setSelectedGroup(g)
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleCreate = () => {
    setSelectedGroup(null)
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const handleEdit = (group: UsageLabelGroup) => {
    setEditingId(group.id)
    setForm({
      groupName: group.groupName || '',
      shortName: group.shortName || '',
      useS: group.useS || '',
      timeS: group.timeS || '',
      timeuseS: group.timeuseS || '',
      keepS: group.keepS || '',
      remarkS: group.remarkS || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบกลุ่มฉลากสินค้านี้หรือไม่?')) return
    try {
      await axios.delete(`/api/usage-label-group/${id}`)
      setSelectedGroup(null)
      fetchGroups()
    } catch (e) { console.error(e) }
  }

  const handleSave = async () => {
    if (!form.groupName.trim()) {
      alert('กรุณาระบุชื่อกลุ่ม')
      return
    }
    setSaving(true)
    try {
      const payload = {
        company,
        ...form,
      }
      if (editingId) {
        await axios.put(`/api/usage-label-group/${editingId}`, payload)
      } else {
        await axios.post('/api/usage-label-group', payload)
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchGroups()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const fieldConfig = [
    { key: 'useS' as const, label: 'วิธีใช้สินค้า', options: useLs, displayField: 'fullname' as const },
    { key: 'timeS' as const, label: 'ช่วงเวลา', options: timeLs, displayField: 'list' as const },
    { key: 'timeuseS' as const, label: 'เวลาที่ใช้', options: timeUseLs, displayField: 'list' as const },
    { key: 'keepS' as const, label: 'วิธีเก็บรักษา', options: keepLs, displayField: 'list' as const },
    { key: 'remarkS' as const, label: 'หมายเหตุ', options: remarkLs, displayField: 'list' as const },
  ]

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" dialogClassName="modal-90w">
      <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #3E86C7 0%, #1E5088 100%)', color: 'white', padding: '12px 20px' }}>
        <Modal.Title style={{ fontFamily: 'Kanit_B', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏷️ ตั้งค่าฉลากสินค้า ตาม วิธีการใช้
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '0', display: 'flex', height: '80vh', overflow: 'hidden' }}>

        {/* Col 1 - Group List */}
        <div style={{ width: '350px', minWidth: '350px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontFamily: 'Kanit_B', fontSize: '13px', color: '#334155' }}>
                🔍 รายการกลุ่มฉลากสินค้า
              </div>
              <button
                onClick={handleCreate}
                style={{
                  fontFamily: 'Kanit_B', fontSize: '11px', padding: '5px 12px',
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #3E86C7 0%, #1E5088 100%)',
                  color: 'white', boxShadow: '0 2px 6px rgba(62, 134, 199,0.3)',
                }}
              >
                + เพิ่มกลุ่ม
              </button>
            </div>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหาชื่อกลุ่ม..."
              style={{
                fontFamily: 'Kanit', fontSize: '12px', width: '100%', padding: '10px 12px',
                border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3E86C7'; e.target.style.boxShadow = '0 0 0 3px rgba(62, 134, 199,0.15)' }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              ทั้งหมด {filteredGroups.length} กลุ่ม
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredGroups.map((g, index) => (
              <div
                key={g.id}
                onClick={() => handleSelectGroup(g)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: selectedGroup?.id === g.id ? '#E5EEF8' : index % 2 === 0 ? 'white' : '#fafbfc',
                  borderLeft: selectedGroup?.id === g.id ? '3px solid #3E86C7' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseOver={(e) => {
                  if (selectedGroup?.id !== g.id) {
                    e.currentTarget.style.backgroundColor = '#F3F8FC'
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedGroup?.id !== g.id) {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fafbfc'
                  }
                }}
              >
                <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#334155', fontWeight: selectedGroup?.id === g.id ? 600 : 400 }}>
                  {g.groupName || '-'}
                </div>
                {g.shortName && (
                  <div style={{ fontFamily: 'Kanit', fontSize: '10px', color: '#3E86C7', marginTop: '2px' }}>
                    ชื่อย่อ: {g.shortName}
                  </div>
                )}
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '12px' }}>
                ไม่พบข้อมูล
              </div>
            )}
          </div>
        </div>

        {/* Col 2 - Detail / Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedGroup && !showForm ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'Kanit', fontSize: '14px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏷️</div>
                <div>เลือกกลุ่มจากด้านซ้าย หรือกด "+ เพิ่มกลุ่ม" เพื่อสร้างกลุ่มใหม่</div>
              </div>
            </div>
          ) : showForm ? (
            /* Create/Edit Form */
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f8fafc' }}>
              <div style={{
                backgroundColor: 'white', borderRadius: '12px', border: '2px solid #3E86C7',
                padding: '24px', boxShadow: '0 4px 16px rgba(62, 134, 199,0.1)',
              }}>
                <div style={{ fontFamily: 'Kanit_B', fontSize: '15px', color: '#1E5088', marginBottom: '20px' }}>
                  {editingId ? '✏️ แก้ไขกลุ่มฉลากสินค้า' : '➕ สร้างกลุ่มฉลากสินค้าใหม่'}
                </div>

                {/* Group Name */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    ชื่อกลุ่ม <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    value={form.groupName}
                    onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                    placeholder="เช่น สินค้าแก้ไข้, สินค้าแก้ปวด, สินค้าลดกรด..."
                    style={{
                      fontFamily: 'Kanit', fontSize: '12px', width: '100%', padding: '10px 12px',
                      border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3E86C7' }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                  />
                </div>

                {/* Short Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    ชื่อย่อกลุ่ม
                  </label>
                  <input
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    placeholder="เช่น FEVER, PAIN, ACID..."
                    style={{
                      fontFamily: 'Kanit', fontSize: '12px', width: '100%', padding: '10px 12px',
                      border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3E86C7' }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                  />
                </div>

                {/* Label Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                          onFocus={(e) => { e.target.style.borderColor = '#3E86C7' }}
                          onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
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
                      background: saving ? '#d4d4d8' : 'linear-gradient(135deg, #3E86C7 0%, #1E5088 100%)',
                      color: 'white', boxShadow: saving ? 'none' : '0 2px 8px rgba(62, 134, 199,0.3)',
                    }}
                  >
                    {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </div>
          ) : selectedGroup ? (
            /* Detail View */
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f8fafc' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: '18px', color: '#1e293b' }}>
                    {selectedGroup.groupName}
                  </div>
                  {selectedGroup.shortName && (
                    <div style={{
                      fontFamily: 'Kanit', fontSize: '12px', color: '#3E86C7',
                      backgroundColor: '#E5EEF8', padding: '2px 10px', borderRadius: '20px',
                      display: 'inline-block', marginTop: '4px',
                    }}>
                      ชื่อย่อ: {selectedGroup.shortName}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(selectedGroup)}
                    style={{
                      fontFamily: 'Kanit', fontSize: '12px', padding: '8px 16px',
                      border: '1px solid #3E86C7', borderRadius: '8px',
                      backgroundColor: 'white', color: '#3E86C7', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(selectedGroup.id)}
                    style={{
                      fontFamily: 'Kanit', fontSize: '12px', padding: '8px 16px',
                      border: '1px solid #ef4444', borderRadius: '8px',
                      backgroundColor: 'white', color: '#ef4444', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    🗑️ ลบ
                  </button>
                </div>
              </div>

              {/* Detail Card */}
              <div style={{
                backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
                padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontFamily: 'Kanit_B', fontSize: '14px', color: '#1E5088', marginBottom: '16px' }}>
                  📋 ข้อมูลฉลากสินค้าในกลุ่ม
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'วิธีใช้สินค้า', value: selectedGroup.useS },
                    { label: 'ช่วงเวลา', value: selectedGroup.timeS },
                    { label: 'เวลาที่ใช้', value: selectedGroup.timeuseS },
                    { label: 'วิธีเก็บรักษา', value: selectedGroup.keepS },
                    { label: 'หมายเหตุ', value: selectedGroup.remarkS },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '12px 16px', backgroundColor: '#F3F8FC', borderRadius: '8px' }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#3E86C7', fontWeight: 600, marginBottom: '4px' }}>
                        {label}
                      </div>
                      <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#334155', minHeight: '20px' }}>
                        {value || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Modal.Body>
    </Modal>
  )
}
