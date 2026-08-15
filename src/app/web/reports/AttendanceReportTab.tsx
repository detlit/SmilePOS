'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ChevronDownIcon, Calendar, Clock, User, CheckCircle, XCircle, Edit2, Save, X, Settings, Plus, Trash2, Palmtree, Briefcase, Thermometer, AlertTriangle, MessageSquare, Filter, Users, FileSpreadsheet } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toThaiDateString } from '@/utils/dateUtils'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table } from 'react-bootstrap'
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface Employee {
  id: number
  name: string
  position: string
  company: string
  otRate?: number
}

interface CheckinRecord {
  id: number
  personId: number
  person: string
  checkin: string
  checkout: string
  status: string
  approve: string
  approveDate: string
  approvePerson: string
  remark: string
}

export default function AttendanceReportTab() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employeeOpen, setEmployeeOpen] = useState(false)
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [monthOpen, setMonthOpen] = useState(false)
  
  const [checkinData, setCheckinData] = useState<CheckinRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [calendarDays, setCalendarDays] = useState<any[]>([])
  const [shifts, setShifts] = useState<{ id: string; name: string; start: string; end: string }[]>([])
  
  // Edit mode states
  const [editingRecord, setEditingRecord] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    checkinTime: '',
    checkoutTime: '',
    remarkText: ''
  })

  // User level check
  const isLevel2 = typeof window !== 'undefined' && String(localStorage.getItem('level_') || '') === 'level2'

  // Leave states
  const [leaveConfig, setLeaveConfig] = useState<any>({ vacationDays: 6, personalDays: 3, sickDays: 30, lateLimit: 3, workStartTime: '08:30' })
  const [leaveRecords, setLeaveRecords] = useState<any[]>([])
  const [showLeaveSettings, setShowLeaveSettings] = useState(false)
  const [leaveSettingsForm, setLeaveSettingsForm] = useState<any>({ vacationDays: 6, personalDays: 3, sickDays: 30, lateLimit: 3, workStartTime: '08:30' })
  const [showAddLeave, setShowAddLeave] = useState(false)
  const [addLeaveForm, setAddLeaveForm] = useState({ leaveType: 'vacation', leaveDate: '', reason: '' })

  // All-employees leave overview states
  const [allLeaveRecords, setAllLeaveRecords] = useState<any[]>([])
  const [showLeaveOverviewModal, setShowLeaveOverviewModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [leaveFilterType, setLeaveFilterType] = useState<'all' | 'vacation' | 'personal' | 'sick'>('all')
  const [leaveFilterPerson, setLeaveFilterPerson] = useState<string>('all')

  // OT states
  const [allOtRecords, setAllOtRecords] = useState<any[]>([])
  const [showOtModal, setShowOtModal] = useState(false)
  const [otFilterStatus, setOtFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [otFilterPerson, setOtFilterPerson] = useState<string>('all')
  const [editingOt, setEditingOt] = useState<number | null>(null)
  const [editOtForm, setEditOtForm] = useState({ startTime: '', endTime: '' })
  const [showOtRejectModal, setShowOtRejectModal] = useState(false)
  const [otRejectTarget, setOtRejectTarget] = useState<any>(null)
  const [otRejectReason, setOtRejectReason] = useState('')

  // OT day edit modal state
  const [showOtDayModal, setShowOtDayModal] = useState(false)
  const [otDayRecords, setOtDayRecords] = useState<any[]>([])
  const [otDayDate, setOtDayDate] = useState('')
  const [otDayEditId, setOtDayEditId] = useState<number | null>(null)
  const [otDayEditForm, setOtDayEditForm] = useState({ startTime: '', endTime: '' })

  // Generate month options
  const monthOptions = () => {
    const months = []
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const currentYear = new Date().getFullYear()
    for (let y = currentYear; y >= currentYear - 2; y--) {
      for (let m = 12; m >= 1; m--) {
        const value = `${y}-${String(m).padStart(2, '0')}`
        months.push({ value, label: `${thaiMonths[m - 1]} ${y + 543}` })
      }
    }
    return months
  }

  // Fetch employees
  const fetchEmployees = async () => {
    const id_company = Number(localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0')
    try {
      const res = await axios.get(`/api/setting/employee?id_company=${id_company}`)
      const rows = Array.isArray(res.data) ? res.data : []
      setEmployees(rows)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  // Generate calendar days for selected month
  const generateCalendarDays = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        day,
        date: dateStr,
        dayOfWeek: new Date(year, month - 1, day).getDay()
      })
    }
    return days
  }

  // โหลดกะการทำงาน (ใช้กำหนดกะตามช่วงเวลาเข้างาน)
  const fetchShifts = async () => {
    const companyS = localStorage.getItem('company_') || localStorage.getItem('ci_') || ''
    if (!companyS) return
    try {
      const res = await axios.get(`/api/report-shifts?company=${encodeURIComponent(companyS)}`)
      setShifts(Array.isArray(res.data?.shifts) ? res.data.shifts : [])
    } catch {
      setShifts([])
    }
  }

  useEffect(() => { fetchShifts() }, [])

  // หากะจากเวลาเข้างาน (อิงช่วงเวลา รองรับกะข้ามคืน เช่น 22:00-07:00)
  const getShiftForCheckin = (checkin: string | null) => {
    if (!checkin || shifts.length === 0) return null
    const d = new Date(checkin)
    const cur = d.getHours() * 60 + d.getMinutes()
    const toMin = (hhmm: string) => {
      const [h, m] = String(hhmm || '').split(':').map((n) => parseInt(n, 10))
      return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m)
    }
    for (const s of shifts) {
      const a = toMin(s.start)
      const b = toMin(s.end)
      if (a < b) { if (cur >= a && cur < b) return s }
      else if (a > b) { if (cur >= a || cur < b) return s }
    }
    return null
  }

  // ชื่อกะของ record: ใช้กะที่บันทึกไว้ (remark = "กะ<ชื่อ>") ก่อน แล้วค่อย fallback เป็นกะตามช่วงเวลา
  const getRecordShiftName = (record: CheckinRecord | null): string => {
    if (!record || !record.checkin) return ''
    const remark = String(record.remark || '').trim()
    if (remark.startsWith('กะ')) return remark.slice(2).trim()
    return getShiftForCheckin(record.checkin)?.name || ''
  }

  // Fetch checkin data
  const fetchCheckinData = async () => {
    if (!selectedEmployee) return
    
    setLoading(true)
    const companyS = localStorage.getItem("company_") || ""
    
    try {
      const [year, month] = selectedMonth.split('-')
      const res = await axios.get(`/api/checkin?idcompany=${companyS}&personId=${selectedEmployee.id}&month=${month}&year=${year}`)
      const data = Array.isArray(res.data) ? res.data : []
      setCheckinData(data)
      
      // Generate calendar days
      const days = generateCalendarDays(selectedMonth)
      setCalendarDays(days)
    } catch (error) {
      console.error('Error fetching checkin data:', error)
      setCheckinData([])
    }
    setLoading(false)
  }

  // Fetch leave config
  const fetchLeaveConfig = async () => {
    const idcompany = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    try {
      const res = await axios.get(`/api/leave-config?idcompany=${idcompany}`)
      setLeaveConfig(res.data)
      setLeaveSettingsForm(res.data)
    } catch (e) { console.error('fetchLeaveConfig:', e) }
  }

  // Save leave config
  const saveLeaveConfig = async () => {
    const idcompany = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    try {
      await axios.post('/api/leave-config', { idcompany, ...leaveSettingsForm })
      setLeaveConfig(leaveSettingsForm)
      setShowLeaveSettings(false)
    } catch (e) { console.error('saveLeaveConfig:', e); alert('บันทึกไม่สำเร็จ') }
  }

  // Fetch leave records for selected employee (whole year)
  const fetchLeaveRecords = async () => {
    if (!selectedEmployee) return
    const idcompany = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    const year = selectedMonth.split('-')[0]
    try {
      const res = await axios.get(`/api/leave-record?idcompany=${idcompany}&personId=${selectedEmployee.id}&year=${year}`)
      setLeaveRecords(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error('fetchLeaveRecords:', e) }
  }

  // Add leave record
  const handleAddLeave = async () => {
    if (!selectedEmployee || !addLeaveForm.leaveDate) return
    const idcompany = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    try {
      await axios.post('/api/leave-record', {
        idcompany,
        personId: selectedEmployee.id,
        person: selectedEmployee.name,
        leaveType: addLeaveForm.leaveType,
        leaveDate: addLeaveForm.leaveDate,
        reason: addLeaveForm.reason,
        status: 'approved'
      })
      setShowAddLeave(false)
      setAddLeaveForm({ leaveType: 'vacation', leaveDate: '', reason: '' })
      fetchLeaveRecords()
    } catch (e) { console.error('handleAddLeave:', e); alert('เพิ่มไม่สำเร็จ') }
  }

  // Delete leave record
  const handleDeleteLeave = async (id: number) => {
    if (!confirm('ต้องการลบรายการนี้?')) return
    try {
      await axios.delete(`/api/leave-record?id=${id}`)
      fetchLeaveRecords()
      fetchAllLeaveRecords()
    } catch (e) { console.error('handleDeleteLeave:', e) }
  }

  // Fetch ALL employees' leave records for the company (overview)
  const fetchAllLeaveRecords = async () => {
    const idcompany = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    const year = selectedMonth.split('-')[0]
    try {
      const res = await axios.get(`/api/leave-record?idcompany=${idcompany}&year=${year}`)
      setAllLeaveRecords(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error('fetchAllLeaveRecords:', e) }
  }

  // Approve leave record
  const handleApproveLeave = async (id: number) => {
    const person = localStorage.getItem("person_") || ""
    try {
      await axios.put('/api/leave-record', { id, status: 'approved', approvedBy: person })
      fetchAllLeaveRecords()
      if (selectedEmployee) fetchLeaveRecords()
    } catch (e) { console.error('handleApproveLeave:', e) }
  }

  // Open reject modal
  const openRejectModal = (record: any) => {
    setRejectTarget(record)
    setRejectReason('')
    setShowRejectModal(true)
  }

  // Confirm reject leave record
  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    const person = localStorage.getItem("person_") || ""
    try {
      await axios.put('/api/leave-record', { id: rejectTarget.id, status: 'rejected', rejectReason: rejectReason.trim(), approvedBy: person })
      setShowRejectModal(false)
      setRejectTarget(null)
      setRejectReason('')
      fetchAllLeaveRecords()
      if (selectedEmployee) fetchLeaveRecords()
    } catch (e) { console.error('handleConfirmReject:', e) }
  }

  // Approve ALL pending leave records
  const handleApproveAll = async () => {
    const pending = allLeaveRecords.filter(r => r.status === 'pending')
    if (pending.length === 0) return
    if (!confirm(`ต้องการอนุมัติการลาทั้งหมด ${pending.length} รายการ?`)) return
    const person = localStorage.getItem("person_") || ""
    try {
      for (const r of pending) {
        await axios.put('/api/leave-record', { id: r.id, status: 'approved', approvedBy: person })
      }
      fetchAllLeaveRecords()
      if (selectedEmployee) fetchLeaveRecords()
    } catch (e) { console.error('handleApproveAll:', e) }
  }

  // === OT Functions ===
  const fetchAllOtRecords = async () => {
    const idcompany = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    const year = selectedMonth.split('-')[0]
    try {
      const res = await axios.get(`/api/ot-request?idcompany=${idcompany}&year=${year}`)
      setAllOtRecords(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error('fetchAllOtRecords:', e) }
  }

  const handleApproveOt = async (id: number) => {
    const person = localStorage.getItem("person_") || ""
    try {
      await axios.put('/api/ot-request', { id, status: 'approved', approvedBy: person })
      fetchAllOtRecords()
    } catch (e) { console.error('handleApproveOt:', e) }
  }

  const handleApproveAllOt = async () => {
    const pending = allOtRecords.filter(r => r.status === 'pending')
    if (pending.length === 0) return
    if (!confirm(`ต้องการอนุมัติโอทีทั้งหมด ${pending.length} รายการ?`)) return
    const person = localStorage.getItem("person_") || ""
    try {
      for (const r of pending) {
        await axios.put('/api/ot-request', { id: r.id, status: 'approved', approvedBy: person })
      }
      fetchAllOtRecords()
    } catch (e) { console.error('handleApproveAllOt:', e) }
  }

  const openOtRejectModal = (record: any) => {
    setOtRejectTarget(record)
    setOtRejectReason('')
    setShowOtRejectModal(true)
  }

  const handleConfirmOtReject = async () => {
    if (!otRejectTarget || !otRejectReason.trim()) return
    const person = localStorage.getItem("person_") || ""
    try {
      await axios.put('/api/ot-request', { id: otRejectTarget.id, status: 'rejected', rejectReason: otRejectReason.trim(), approvedBy: person })
      setShowOtRejectModal(false)
      setOtRejectTarget(null)
      setOtRejectReason('')
      fetchAllOtRecords()
    } catch (e) { console.error('handleConfirmOtReject:', e) }
  }

  const handleDeleteOt = async (id: number) => {
    if (!confirm('ต้องการลบคำขอโอทีนี้?')) return
    try {
      await axios.delete(`/api/ot-request?id=${id}`)
      fetchAllOtRecords()
    } catch (e) { console.error('handleDeleteOt:', e) }
  }

  const startEditOt = (record: any) => {
    setEditingOt(record.id)
    setEditOtForm({ startTime: record.startTime || '', endTime: record.endTime || '' })
  }

  const saveEditOt = async (record: any) => {
    const [sh, sm] = editOtForm.startTime.split(':').map(Number)
    const [eh, em] = editOtForm.endTime.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    const hours = diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
    if (hours <= 0) { alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น'); return }
    try {
      await axios.put('/api/ot-request', { id: record.id, status: record.status, approvedBy: record.approvedBy || '' })
      // We need a direct update for time fields - use POST to update via a workaround:
      // Actually, let's delete and recreate with new times
      const idcompany = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
      await axios.delete(`/api/ot-request?id=${record.id}`)
      await axios.post('/api/ot-request', {
        idcompany, personId: record.personId, person: record.person,
        otDate: record.otDate, startTime: editOtForm.startTime, endTime: editOtForm.endTime,
        hours, reason: record.reason
      })
      setEditingOt(null)
      fetchAllOtRecords()
    } catch (e) { console.error('saveEditOt:', e) }
  }

  // OT Day Modal: open with records for a specific day
  const openOtDayModal = (date: string) => {
    const records = allOtRecords.filter(ot =>
      ot.personId === selectedEmployee?.id &&
      ot.otDate && new Date(ot.otDate).toISOString().slice(0, 10) === date
    )
    setOtDayRecords(records)
    setOtDayDate(date)
    setOtDayEditId(null)
    setOtDayEditForm({ startTime: '', endTime: '' })
    setShowOtDayModal(true)
  }

  // OT Day Modal: save edit
  const saveOtDayEdit = async (record: any) => {
    const [sh, sm] = otDayEditForm.startTime.split(':').map(Number)
    const [eh, em] = otDayEditForm.endTime.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    const hours = diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
    if (hours <= 0) { alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น'); return }
    try {
      const idcompany = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
      await axios.delete(`/api/ot-request?id=${record.id}`)
      await axios.post('/api/ot-request', {
        idcompany, personId: record.personId, person: record.person,
        otDate: record.otDate, startTime: otDayEditForm.startTime, endTime: otDayEditForm.endTime,
        hours, reason: record.reason
      })
      // If it was approved, re-approve
      if (record.status === 'approved') {
        const res = await axios.get(`/api/ot-request?idcompany=${idcompany}&personId=${record.personId}&year=${new Date(record.otDate).getFullYear()}`)
        const newest = Array.isArray(res.data) ? res.data[0] : null
        if (newest) {
          const person = localStorage.getItem("person_") || ""
          await axios.put('/api/ot-request', { id: newest.id, status: 'approved', approvedBy: person })
        }
      }
      setOtDayEditId(null)
      fetchAllOtRecords()
      // Refresh the modal data
      setTimeout(() => {
        const idc = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
        axios.get(`/api/ot-request?idcompany=${idc}&year=${selectedMonth.split('-')[0]}`).then(res => {
          const all = Array.isArray(res.data) ? res.data : []
          setAllOtRecords(all)
          const updated = all.filter((ot: any) =>
            ot.personId === selectedEmployee?.id &&
            ot.otDate && new Date(ot.otDate).toISOString().slice(0, 10) === otDayDate
          )
          setOtDayRecords(updated)
        })
      }, 300)
    } catch (e) { console.error('saveOtDayEdit:', e) }
  }

  // OT Day Modal: delete
  const deleteOtDayRecord = async (id: number) => {
    if (!confirm('ต้องการลบคำขอโอทีนี้?')) return
    try {
      await axios.delete(`/api/ot-request?id=${id}`)
      fetchAllOtRecords()
      setOtDayRecords(prev => prev.filter(r => r.id !== id))
      if (otDayRecords.length <= 1) setShowOtDayModal(false)
    } catch (e) { console.error('deleteOtDayRecord:', e) }
  }

  useEffect(() => {
    fetchEmployees()
    fetchLeaveConfig()
    fetchAllLeaveRecords()
    fetchAllOtRecords()
  }, [])

  useEffect(() => {
    fetchCheckinData()
    fetchLeaveRecords()
    fetchAllLeaveRecords()
    fetchAllOtRecords()
  }, [selectedEmployee, selectedMonth])

  // Count late days from checkin data
  const countLateDays = () => {
    const startTime = leaveConfig.workStartTime || '08:30'
    const [startH, startM] = startTime.split(':').map(Number)
    return checkinData.filter(r => {
      if (!r.checkin) return false
      const d = new Date(r.checkin)
      const h = d.getHours(), m = d.getMinutes()
      return h > startH || (h === startH && m > startM)
    }).length
  }

  // Leave stats calculation
  const leaveStats = () => {
    const year = selectedMonth.split('-')[0]
    const yearRecords = leaveRecords.filter(r => {
      const rd = new Date(r.leaveDate)
      return rd.getFullYear() === Number(year) && r.status === 'approved'
    })
    const vacUsed = yearRecords.filter(r => r.leaveType === 'vacation').length
    const perUsed = yearRecords.filter(r => r.leaveType === 'personal').length
    const sickUsed = yearRecords.filter(r => r.leaveType === 'sick').length
    const lateDays = countLateDays()
    return {
      vacation: { entitled: leaveConfig.vacationDays || 0, used: vacUsed, remaining: Math.max(0, (leaveConfig.vacationDays || 0) - vacUsed) },
      personal: { entitled: leaveConfig.personalDays || 0, used: perUsed, remaining: Math.max(0, (leaveConfig.personalDays || 0) - perUsed) },
      sick: { entitled: leaveConfig.sickDays || 0, used: sickUsed, remaining: Math.max(0, (leaveConfig.sickDays || 0) - sickUsed) },
      late: { limit: leaveConfig.lateLimit || 0, count: lateDays, over: Math.max(0, lateDays - (leaveConfig.lateLimit || 0)) }
    }
  }

  // Get checkin record for a specific date
  const getCheckinForDate = (date: string) => {
    return checkinData.find(record => {
      if (!record.checkin) return false
      const recordDate = toThaiDateString(record.checkin)
      return recordDate === date
    })
  }

  // Get ALL checkin records for a date (รองรับหลายกะใน 1 วัน) เรียงตามเวลาเข้า
  const getCheckinsForDate = (date: string) => {
    return checkinData
      .filter(record => record.checkin && toThaiDateString(record.checkin) === date)
      .sort((a, b) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime())
  }

  // Format time from ISO string
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  // Format date to Thai format
  const formatDateThai = (dateStr: string) => {
    const date = new Date(dateStr)
    const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
    return `${thaiDays[date.getDay()]} ${date.getDate()}`
  }

  // Handle approve checkin
  const handleApprove = async (checkinId: number) => {
    const person = localStorage.getItem("person_") || ""
    try {
      await axios.put(`/api/checkin/${checkinId}`, {
        approve: 'approved',
        approveDate: new Date().toISOString(),
        approvePerson: person
      })
      fetchCheckinData()
    } catch (error) {
      console.error('Error approving checkin:', error)
      alert('ไม่สามารถอนุมัติได้')
    }
  }

  // Handle edit checkin
  const handleEdit = (record: CheckinRecord) => {
    setEditingRecord(record.id)
    // Extract time from ISO strings for input
    const checkinDate = record.checkin ? new Date(record.checkin) : null
    const checkoutDate = record.checkout ? new Date(record.checkout) : null
    
    setEditForm({
      checkinTime: checkinDate ? checkinDate.toTimeString().slice(0, 5) : '',
      checkoutTime: checkoutDate ? checkoutDate.toTimeString().slice(0, 5) : '',
      remarkText: record.remark || ''
    })
  }

  // Handle save edit
  const handleSaveEdit = async (record: CheckinRecord, date: string) => {
    try {
      // Combine date with new time
      const checkinDateTime = editForm.checkinTime 
        ? new Date(`${date}T${editForm.checkinTime}:00`).toISOString()
        : null
      const checkoutDateTime = editForm.checkoutTime
        ? new Date(`${date}T${editForm.checkoutTime}:00`).toISOString()
        : null

      await axios.put(`/api/checkin/${record.id}`, {
        checkin: checkinDateTime,
        checkout: checkoutDateTime,
        remark: editForm.remarkText || null
      })
      
      setEditingRecord(null)
      fetchCheckinData()
    } catch (error) {
      console.error('Error saving checkin edit:', error)
      alert('ไม่สามารถบันทึกได้')
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingRecord(null)
    setEditForm({ checkinTime: '', checkoutTime: '', remarkText: '' })
  }

  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

  // Calculate total hours between checkin and checkout
  const calcHours = (checkin: string | null, checkout: string | null): string => {
    if (!checkin || !checkout) return '-'
    const inTime = new Date(checkin)
    const outTime = new Date(checkout)
    if (isNaN(inTime.getTime()) || isNaN(outTime.getTime())) return '-'
    const diffMs = outTime.getTime() - inTime.getTime()
    if (diffMs <= 0) return '-'
    const hours = diffMs / (1000 * 60 * 60)
    return hours.toFixed(1)
  }

  const selectedMonthLabel = () => {
    const [year, month] = selectedMonth.split('-')
    const thaiFullMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    return `${thaiFullMonths[Number(month) - 1]} ${Number(year) + 543}`
  }

  const getOtHoursForDate = (date: string) => {
    const otForDay = allOtRecords.filter(ot =>
      ot.personId === selectedEmployee?.id &&
      ot.status === 'approved' &&
      ot.otDate && toThaiDateString(ot.otDate) === date
    )
    return otForDay.reduce((sum: number, record: any) => sum + (record.hours || 0), 0)
  }

  const getLeaveTextForDate = (date: string) => {
    const typeLabel: Record<string, string> = { vacation: 'ลาพักร้อน', personal: 'ลากิจ', sick: 'ลาป่วย' }
    const statusLabel: Record<string, string> = { approved: 'อนุมัติ', pending: 'รออนุมัติ', rejected: 'ไม่อนุมัติ' }
    const records = leaveRecords.filter(record => record.leaveDate && toThaiDateString(record.leaveDate) === date)
    if (records.length === 0) return '-'
    return records.map(record => `${typeLabel[record.leaveType] || record.leaveType || '-'} (${statusLabel[record.status] || record.status || '-'})`).join(', ')
  }

  const handleExportExcel = async () => {
    if (!selectedEmployee) {
      alert('กรุณาเลือกพนักงานก่อน Export Excel')
      return
    }

    try {
      const XLSX = await import('xlsx')
      const monthLabel = selectedMonthLabel()
      const stats = leaveStats()
      const attendanceRows = calendarDays.flatMap((day) => {
        const dayRecords = getCheckinsForDate(day.date)
        const otHours = getOtHoursForDate(day.date)
        const list: (CheckinRecord | null)[] = dayRecords.length > 0 ? dayRecords : [null]
        return list.map((record, recIdx) => ({
          'วันที่': recIdx === 0 ? formatDateThai(day.date) : '',
          'วันที่เต็ม': day.date,
          'กะ': record && record.checkin ? (getRecordShiftName(record) || 'นอกกะ') : '-',
          'เวลาเข้า': record ? formatTime(record.checkin) : '-',
          'เวลาออก': record ? formatTime(record.checkout) : '-',
          'ชั่วโมงรวม': record ? calcHours(record.checkin, record.checkout) : '-',
          'OT (ชม.)': recIdx === 0 && otHours > 0 ? otHours.toFixed(1) : '-',
          'สถานะ': record ? (record.status === 'normal' ? 'ปกติ' : record.status || '-') : '-',
          'การอนุมัติ': record ? (record.approve === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ') : '-',
          'การลา': recIdx === 0 ? getLeaveTextForDate(day.date) : '',
          'หมายเหตุ': record?.remark || '-'
        }))
      }).map((row, index) => ({ '#': index + 1, ...row }))

      const totalRegularHours = checkinData.reduce((sum, record) => {
        if (!record.checkin || !record.checkout) return sum
        const inTime = new Date(record.checkin).getTime()
        const outTime = new Date(record.checkout).getTime()
        if (isNaN(inTime) || isNaN(outTime) || outTime <= inTime) return sum
        return sum + ((outTime - inTime) / (1000 * 60 * 60))
      }, 0)
      const totalOtHours = calendarDays.reduce((sum, day) => sum + getOtHoursForDate(day.date), 0)

      const summaryRows = [
        { 'หัวข้อ': 'พนักงาน', 'ข้อมูล': selectedEmployee.name || '-' },
        { 'หัวข้อ': 'ตำแหน่ง', 'ข้อมูล': selectedEmployee.position || '-' },
        { 'หัวข้อ': 'เดือน', 'ข้อมูล': monthLabel },
        { 'หัวข้อ': 'ชั่วโมงทำงานรวม', 'ข้อมูล': `${totalRegularHours.toFixed(1)} ชม.` },
        { 'หัวข้อ': 'ชั่วโมง OT รวม', 'ข้อมูล': `${totalOtHours.toFixed(1)} ชม.` },
        { 'หัวข้อ': 'ลาพักร้อน', 'ข้อมูล': `สิทธิ์ ${stats.vacation.entitled} / ใช้ ${stats.vacation.used} / คงเหลือ ${stats.vacation.remaining}` },
        { 'หัวข้อ': 'ลากิจ', 'ข้อมูล': `สิทธิ์ ${stats.personal.entitled} / ใช้ ${stats.personal.used} / คงเหลือ ${stats.personal.remaining}` },
        { 'หัวข้อ': 'ลาป่วย', 'ข้อมูล': `สิทธิ์ ${stats.sick.entitled} / ใช้ ${stats.sick.used} / คงเหลือ ${stats.sick.remaining}` },
        { 'หัวข้อ': 'มาสาย', 'ข้อมูล': `อนุโลม ${stats.late.limit} / สายจริง ${stats.late.count} / เกิน ${stats.late.over}` }
      ]

      const leaveRows = leaveRecords.map((record, index) => ({
        '#': index + 1,
        'วันที่': record.leaveDate ? toThaiDateString(record.leaveDate) : '-',
        'ประเภท': record.leaveType === 'vacation' ? 'ลาพักร้อน' : record.leaveType === 'personal' ? 'ลากิจ' : record.leaveType === 'sick' ? 'ลาป่วย' : record.leaveType || '-',
        'เหตุผล': record.reason || '-',
        'สถานะ': record.status === 'approved' ? 'อนุมัติ' : record.status === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ',
        'หมายเหตุ': record.rejectReason || '-'
      }))

      const workbook = XLSX.utils.book_new()
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
      summarySheet['!cols'] = [{ wch: 22 }, { wch: 44 }]
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป')

      const attendanceSheet = XLSX.utils.json_to_sheet(attendanceRows)
      attendanceSheet['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 28 }
      ]
      attendanceSheet['!autofilter'] = { ref: `A1:K${attendanceRows.length + 1}` }
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'เข้าออกงาน')

      if (leaveRows.length > 0) {
        const leaveSheet = XLSX.utils.json_to_sheet(leaveRows)
        leaveSheet['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 28 }]
        XLSX.utils.book_append_sheet(workbook, leaveSheet, 'รายการลา')
      }

      const safeEmployeeName = String(selectedEmployee.name || 'employee').replace(/[\\/:*?"<>|]/g, '_')
      XLSX.writeFile(workbook, `รายงานเข้าออกงาน_${safeEmployeeName}_${selectedMonth}.xlsx`)
    } catch (error) {
      console.error('Error exporting attendance Excel:', error)
      alert('Export Excel ไม่สำเร็จ')
    }
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#fef3c7',
        borderBottom: '2px solid #f59e0b',
        color: '#b45309',
        padding: '16px 20px',
        fontFamily: 'Kanit_B',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Clock size={18} /> รายงานเข้า-ออก งาน
      </div>

      {/* Filter Section */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Employee Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#64748b' }}>พนักงาน:</span>
          <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" style={{
                fontFamily: 'Kanit',
                fontSize: 13,
                width: 200,
                height: 36,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <span style={{ color: selectedEmployee ? '#334155' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedEmployee ? selectedEmployee.name : 'เลือกพนักงาน'}
                </span>
                <ChevronDownIcon size={16} style={{ color: '#94a3b8' }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent style={{ width: 280, padding: 0 }}>
              <Command>
                <CommandInput placeholder="ค้นหาพนักงาน..." />
                <CommandList style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                  <CommandGroup>
                    {employees.map((emp) => (
                      <CommandItem
                        key={emp.id}
                        value={String(emp.name || '')}
                        onSelect={() => {
                          setSelectedEmployee(emp)
                          setEmployeeOpen(false)
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={14} />
                          <div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '13px' }}>{emp.name}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#64748b' }}>{emp.position}</div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Month Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#64748b' }}>เดือน:</span>
          <Popover open={monthOpen} onOpenChange={setMonthOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" style={{
                fontFamily: 'Kanit',
                fontSize: 13,
                height: 36,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Calendar size={14} />
                <span style={{ color: '#6366f1' }}>
                  {(() => {
                    const [y, m] = selectedMonth.split('-')
                    return `${thaiMonths[Number(m) - 1]} ${Number(y) + 543}`
                  })()}
                </span>
                <ChevronDownIcon size={16} style={{ color: '#94a3b8' }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent style={{ width: 200, padding: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {monthOptions().map((m) => (
                <div
                  key={m.value}
                  onClick={() => { setSelectedMonth(m.value); setMonthOpen(false) }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontFamily: 'Kanit',
                    fontSize: '13px',
                    color: m.value === selectedMonth ? '#6366f1' : '#334155',
                    backgroundColor: m.value === selectedMonth ? '#f5f3ff' : 'transparent',
                    borderRadius: '6px',
                  }}
                  className="hover-option"
                >
                  {m.label}
                </div>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchCheckinData}
          disabled={!selectedEmployee}
          style={{ fontFamily: 'Kanit', fontSize: '12px' }}
        >
          🔄 รีเฟรช
        </Button>

        {/* Total Hours Summary */}
        {selectedEmployee && checkinData.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#e0e7ff',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid #c7d2fe'
          }}>
            <Clock size={14} style={{ color: '#4338ca' }} />
            <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#4338ca', fontWeight: 600 }}>
              รวม {(() => {
                const total = checkinData.reduce((sum, r) => {
                  if (!r.checkin || !r.checkout) return sum
                  const inT = new Date(r.checkin).getTime()
                  const outT = new Date(r.checkout).getTime()
                  if (isNaN(inT) || isNaN(outT) || outT <= inT) return sum
                  return sum + (outT - inT)
                }, 0)
                return (total / (1000 * 60 * 60)).toFixed(1)
              })()} ชั่วโมง
            </span>
          </div>
        )}

        {/* OT Summary Badge */}
        {selectedEmployee && (() => {
          const empOt = allOtRecords.filter(r => r.personId === selectedEmployee.id && r.status === 'approved')
          const totalOt = empOt.reduce((s: number, r: any) => s + (r.hours || 0), 0)
          const otRate = selectedEmployee.otRate || 0
          const otPay = otRate * totalOt
          if (totalOt <= 0 && otRate <= 0) return null
          return (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid #fed7aa',
              boxShadow: '0 1px 4px rgba(234,88,12,0.1)'
            }}>
              {/* OT Hours */}
              {totalOt > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  backgroundColor: '#fff7ed', padding: '6px 12px'
                }}>
                  <Clock size={13} style={{ color: '#ea580c' }} />
                  <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#ea580c', fontWeight: 600 }}>
                    OT {totalOt.toFixed(1)} ชม.
                  </span>
                </div>
              )}
              {/* OT Rate */}
              {otRate > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  backgroundColor: '#fef3c7', padding: '6px 10px',
                  borderLeft: totalOt > 0 ? '1px solid #fde68a' : 'none'
                }}>
                  <span style={{ fontFamily: 'Kanit', fontSize: '11px', color: '#92400e' }}>
                    ×{otRate.toLocaleString()} ฿
                  </span>
                </div>
              )}
              {/* OT Pay */}
              {totalOt > 0 && otRate > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '6px 14px',
                }}>
                  <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#fff', fontWeight: 700 }}>
                    = {otPay.toLocaleString()} ฿
                  </span>
                </div>
              )}
            </div>
          )
        })()}

        <Button
          size="sm"
          onClick={handleExportExcel}
          disabled={!selectedEmployee}
          title={selectedEmployee ? 'Export Excel' : 'เลือกพนักงานก่อน Export Excel'}
          style={{
            marginLeft: 'auto',
            fontFamily: 'Kanit',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: selectedEmployee ? 'linear-gradient(135deg, #2A6AAA 0%, #173F6B 100%)' : '#e2e8f0',
            color: selectedEmployee ? '#fff' : '#94a3b8',
            border: selectedEmployee ? '1px solid #2A6AAA' : '1px solid #cbd5e1',
            padding: '7px 14px 7px 10px',
            borderRadius: 10,
            boxShadow: selectedEmployee ? '0 8px 18px rgba(42, 106, 170,0.22), inset 0 1px 0 rgba(255,255,255,0.18)' : 'none',
            cursor: selectedEmployee ? 'pointer' : 'not-allowed',
            fontWeight: 700,
            letterSpacing: 0,
            whiteSpace: 'nowrap',
            minHeight: 36
          }}
        >
          <span style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: selectedEmployee ? 'rgba(255,255,255,0.18)' : '#f8fafc'
          }}>
            <FileSpreadsheet size={14} />
          </span>
          Export Excel
        </Button>

        {/* อนุมัติการลา Button with Badge */}
        <div style={{ position: 'relative' }}>
          <Button
            size="sm"
            onClick={() => setShowLeaveOverviewModal(true)}
            style={{
              fontFamily: 'Kanit', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 10, boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
              cursor: 'pointer', fontWeight: 600
            }}
          >
            <Clock size={14} /> อนุมัติการลา
          </Button>
          {allLeaveRecords.filter(r => r.status === 'pending').length > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20,
              background: '#ef4444', color: '#fff', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, fontFamily: 'Kanit',
              border: '2px solid #fff', boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
              padding: '0 4px'
            }}>
              {allLeaveRecords.filter(r => r.status === 'pending').length}
            </span>
          )}
        </div>

        {/* อนุมัติโอที Button with Badge */}
        <div style={{ position: 'relative' }}>
          <Button
            size="sm"
            onClick={() => { setOtFilterStatus('pending'); setShowOtModal(true) }}
            style={{
              fontFamily: 'Kanit', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 10, boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
              cursor: 'pointer', fontWeight: 600
            }}
          >
            <Clock size={14} /> อนุมัติโอที
          </Button>
          {allOtRecords.filter(r => r.status === 'pending').length > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20,
              background: '#ef4444', color: '#fff', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, fontFamily: 'Kanit',
              border: '2px solid #fff', boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
              padding: '0 4px'
            }}>
              {allOtRecords.filter(r => r.status === 'pending').length}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '16px' }}>

        {/* ===== Leave Overview Modal ===== */}
        {showLeaveOverviewModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowLeaveOverviewModal(false)}>
            <div style={{ background: '#fff', borderRadius: 20, width: '90vw', maxWidth: 1000, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #F3F8FC, #E5EEF8)', borderBottom: '1px solid #CCDFF1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#102C4C' }}>ภาพรวมการลา — พนักงานทั้งหมด</div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>ปี {Number(selectedMonth.split('-')[0]) + 543}</div>
                  </div>
                </div>
                <button onClick={() => setShowLeaveOverviewModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} color="#64748b" />
                </button>
              </div>

              {/* Filter Bar */}
              <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {(() => {
                  const pending = allLeaveRecords.filter(r => r.status === 'pending').length
                  const approved = allLeaveRecords.filter(r => r.status === 'approved').length
                  const rejected = allLeaveRecords.filter(r => r.status === 'rejected').length
                  return (
                    <>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: leaveFilterStatus === 'pending' ? '#f59e0b' : '#fef3c7', color: leaveFilterStatus === 'pending' ? '#fff' : '#b45309', border: '1px solid #fde68a', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        onClick={() => setLeaveFilterStatus(leaveFilterStatus === 'pending' ? 'all' : 'pending')}>
                        รออนุมัติ {pending}
                      </span>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: leaveFilterStatus === 'approved' ? '#147F56' : '#D3F0E2', color: leaveFilterStatus === 'approved' ? '#fff' : '#147F56', border: '1px solid #74CCA4', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        onClick={() => setLeaveFilterStatus(leaveFilterStatus === 'approved' ? 'all' : 'approved')}>
                        อนุมัติ {approved}
                      </span>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: leaveFilterStatus === 'rejected' ? '#dc2626' : '#fee2e2', color: leaveFilterStatus === 'rejected' ? '#fff' : '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        onClick={() => setLeaveFilterStatus(leaveFilterStatus === 'rejected' ? 'all' : 'rejected')}>
                        ไม่อนุมัติ {rejected}
                      </span>
                    </>
                  )
                })()}
                <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
                <select value={leaveFilterType} onChange={(e) => setLeaveFilterType(e.target.value as any)}
                  style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  <option value="all">ทุกประเภท</option>
                  <option value="vacation">ลาพักร้อน</option>
                  <option value="personal">ลากิจ</option>
                  <option value="sick">ลาป่วย</option>
                </select>
                <select value={leaveFilterPerson} onChange={(e) => setLeaveFilterPerson(e.target.value)}
                  style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', maxWidth: 180 }}>
                  <option value="all">พนักงานทั้งหมด</option>
                  {[...new Set(allLeaveRecords.map(r => r.person).filter(Boolean))].sort().map((name: string) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {isLevel2 && allLeaveRecords.filter(r => r.status === 'pending').length > 0 && (
                  <Button size="sm" onClick={handleApproveAll}
                    style={{ fontFamily: 'Kanit', fontSize: 11, background: '#2A6AAA', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                    <CheckCircle size={12} /> อนุมัติทั้งหมด
                  </Button>
                )}
              </div>

              {/* Table Content */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {(() => {
                  const isDefaultView = leaveFilterType === 'all' && leaveFilterPerson === 'all'
                  const filtered = allLeaveRecords.filter(r => {
                    if (isDefaultView && leaveFilterStatus === 'all') { return r.status === 'pending' }
                    if (leaveFilterStatus !== 'all' && r.status !== leaveFilterStatus) return false
                    if (leaveFilterType !== 'all' && r.leaveType !== leaveFilterType) return false
                    if (leaveFilterPerson !== 'all' && r.person !== leaveFilterPerson) return false
                    return true
                  })
                  if (filtered.length === 0) {
                    return (
                      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <Users size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                        <div style={{ color: '#94a3b8', fontFamily: 'Kanit', fontSize: 14 }}>
                          {allLeaveRecords.length === 0 ? 'ยังไม่มีรายการลา' : 'ไม่พบรายการที่ตรงกับตัวกรอง'}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                          {['พนักงาน', 'ประเภท', 'วันที่ลา', 'เหตุผล', 'สถานะ', 'ผู้อนุมัติ', 'หมายเหตุ', 'จัดการ'].map((h, i) => (
                            <th key={i} style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 12, color: '#64748b', fontWeight: 600, textAlign: i === 7 ? 'center' : 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((lr: any) => (
                          <tr key={lr.id} style={{ borderBottom: '1px solid #f1f5f9', background: lr.status === 'pending' ? '#fffbeb' : 'transparent', transition: 'background 0.15s' }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 13, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <User size={14} color="#4f46e5" />
                                </div>
                                {lr.person || '-'}
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                fontFamily: 'Kanit', fontSize: 11, padding: '3px 12px', borderRadius: 10, whiteSpace: 'nowrap',
                                background: lr.leaveType === 'vacation' ? '#E5EEF8' : lr.leaveType === 'personal' ? '#fef9c3' : '#fee2e2',
                                color: lr.leaveType === 'vacation' ? '#1E5088' : lr.leaveType === 'personal' ? '#b45309' : '#dc2626'
                              }}>
                                {lr.leaveType === 'vacation' ? 'ลาพักร้อน' : lr.leaveType === 'personal' ? 'ลากิจ' : 'ลาป่วย'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 13, color: '#334155', whiteSpace: 'nowrap' }}>
                              {lr.leaveDate ? new Date(lr.leaveDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 13, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lr.reason || '-'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {lr.status === 'approved' ? (
                                <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#2A6AAA', display: 'flex', alignItems: 'center', gap: 4, background: '#E5EEF8', padding: '3px 10px', borderRadius: 20, width: 'fit-content' }}>
                                  <CheckCircle size={12} /> อนุมัติ
                                </span>
                              ) : lr.status === 'rejected' ? (
                                <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, background: '#fee2e2', padding: '3px 10px', borderRadius: 20, width: 'fit-content' }}>
                                  <XCircle size={12} /> ไม่อนุมัติ
                                </span>
                              ) : (
                                <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#b45309', display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '3px 10px', borderRadius: 20, width: 'fit-content' }}>
                                  <Clock size={12} /> รออนุมัติ
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>
                              {lr.approvedBy || '-'}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'Kanit', fontSize: 12, color: '#ef4444', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lr.rejectReason || '-'}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              {lr.status === 'pending' && isLevel2 ? (
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                  <Button size="sm" onClick={() => handleApproveLeave(lr.id)}
                                    style={{ fontFamily: 'Kanit', fontSize: 11, background: '#2A6AAA', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 8 }}>
                                    อนุมัติ
                                  </Button>
                                  <Button size="sm" onClick={() => openRejectModal(lr)}
                                    style={{ fontFamily: 'Kanit', fontSize: 11, background: '#ef4444', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 8 }}>
                                    ไม่อนุมัติ
                                  </Button>
                                </div>
                              ) : isLevel2 ? (
                                <button onClick={() => handleDeleteLeave(lr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                  <Trash2 size={14} />
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                })()}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>
                  ทั้งหมด {allLeaveRecords.length} รายการ
                </span>
                <Button variant="outline" size="sm" onClick={() => setShowLeaveOverviewModal(false)}
                  style={{ fontFamily: 'Kanit', fontSize: 12 }}>
                  ปิด
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Reject Reason Modal ===== */}
        {showRejectModal && rejectTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowRejectModal(false)}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={20} color="#dc2626" /> ไม่อนุมัติการลา
                </div>
                <button onClick={() => setShowRejectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
              </div>
              <div style={{ background: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid #fca5a5' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginBottom: 4 }}>รายการลาของ</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                  {rejectTarget.person} — {rejectTarget.leaveType === 'vacation' ? 'ลาพักร้อน' : rejectTarget.leaveType === 'personal' ? 'ลากิจ' : 'ลาป่วย'}
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>
                  วันที่: {rejectTarget.leaveDate ? new Date(rejectTarget.leaveDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: 13, color: '#334155', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                  สาเหตุที่ไม่อนุมัติ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="กรุณาระบุสาเหตุ..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #fca5a5',
                    fontFamily: 'Kanit', fontSize: 13, outline: 'none', resize: 'vertical',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ef4444')}
                  onBlur={(e) => (e.target.style.borderColor = '#fca5a5')}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)}
                  style={{ fontFamily: 'Kanit', fontSize: 12 }}>ยกเลิก</Button>
                <Button size="sm" onClick={handleConfirmReject} disabled={!rejectReason.trim()}
                  style={{ fontFamily: 'Kanit', fontSize: 12, background: '#ef4444', color: '#fff', border: 'none', opacity: rejectReason.trim() ? 1 : 0.5 }}>
                  <XCircle size={14} style={{ marginRight: 4 }} /> ยืนยันไม่อนุมัติ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== OT Overview Modal ===== */}
        {showOtModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowOtModal(false)}>
            <div style={{ background: '#fff', borderRadius: 20, width: '90vw', maxWidth: 1000, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                    <Clock size={22} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>อนุมัติโอที</div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>จัดการคำขอทำโอทีของพนักงานทั้งหมด</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {allOtRecords.filter(r => r.status === 'pending').length > 0 && (
                    <Button size="sm" onClick={handleApproveAllOt}
                      style={{ fontFamily: 'Kanit', fontSize: 11, background: '#2A6AAA', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600 }}>
                      <CheckCircle size={14} style={{ marginRight: 4 }} /> อนุมัติทั้งหมด ({allOtRecords.filter(r => r.status === 'pending').length})
                    </Button>
                  )}
                  <button onClick={() => setShowOtModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={22} color="#94a3b8" /></button>
                </div>
              </div>

              {/* Filter Bar */}
              <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: '#fafafa' }}>
                <Filter size={14} color="#64748b" />
                {/* Status filters */}
                {(() => {
                  const pending = allOtRecords.filter(r => r.status === 'pending').length
                  const approved = allOtRecords.filter(r => r.status === 'approved').length
                  const rejected = allOtRecords.filter(r => r.status === 'rejected').length
                  return (
                    <>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: otFilterStatus === 'all' ? '#334155' : '#f1f5f9', color: otFilterStatus === 'all' ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        onClick={() => setOtFilterStatus('all')}>ทั้งหมด ({allOtRecords.length})</span>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: otFilterStatus === 'pending' ? '#f59e0b' : '#fef3c7', color: otFilterStatus === 'pending' ? '#fff' : '#b45309', border: '1px solid #fde68a', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        onClick={() => setOtFilterStatus('pending')}>รออนุมัติ ({pending})</span>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: otFilterStatus === 'approved' ? '#147F56' : '#D3F0E2', color: otFilterStatus === 'approved' ? '#fff' : '#147F56', border: '1px solid #74CCA4', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        onClick={() => setOtFilterStatus('approved')}>อนุมัติ ({approved})</span>
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: otFilterStatus === 'rejected' ? '#ef4444' : '#fee2e2', color: otFilterStatus === 'rejected' ? '#fff' : '#ef4444', border: '1px solid #fca5a5', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        onClick={() => setOtFilterStatus('rejected')}>ไม่อนุมัติ ({rejected})</span>
                    </>
                  )
                })()}
                <span style={{ margin: '0 4px', color: '#d1d5db' }}>|</span>
                <Users size={14} color="#64748b" />
                <select
                  value={otFilterPerson}
                  onChange={(e) => setOtFilterPerson(e.target.value)}
                  style={{ fontFamily: 'Kanit', fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none', background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">พนักงานทั้งหมด</option>
                  {[...new Set(allOtRecords.map(r => r.person))].filter(Boolean).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* OT Table */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {(() => {
                  let filtered = allOtRecords
                  if (otFilterStatus !== 'all') filtered = filtered.filter(r => r.status === otFilterStatus)
                  if (otFilterPerson !== 'all') filtered = filtered.filter(r => r.person === otFilterPerson)

                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                        <Clock size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <div style={{ fontFamily: 'Kanit', fontSize: 14 }}>ไม่มีรายการโอที</div>
                      </div>
                    )
                  }

                  // Summary
                  const totalApprovedHours = filtered.filter(r => r.status === 'approved').reduce((s: number, r: any) => s + (r.hours || 0), 0)

                  return (
                    <>
                      {totalApprovedHours > 0 && (
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 200, background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Clock size={20} color="#fff" />
                            </div>
                            <div>
                              <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#9a3412' }}>รวมชั่วโมง OT (อนุมัติแล้ว)</div>
                              <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#ea580c' }}>{totalApprovedHours.toFixed(1)} <span style={{ fontSize: 13, fontWeight: 500 }}>ชม.</span></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Kanit' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'left' }}>พนักงาน</th>
                            <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center' }}>วันที่</th>
                            <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center' }}>เวลาเริ่ม</th>
                            <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center' }}>เวลาสิ้นสุด</th>
                            <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center' }}>ชั่วโมง</th>
                            <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'left' }}>เหตุผล</th>
                            <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center' }}>สถานะ</th>
                            <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'center' }}>จัดการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((ot: any) => (
                            <tr key={ot.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#fefce8')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '10px 12px', fontSize: 13, color: '#1e293b', fontWeight: 500 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={14} color="#fff" />
                                  </div>
                                  {ot.person}
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: '#475569', textAlign: 'center' }}>
                                {ot.otDate ? new Date(ot.otDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'center' }}>
                                {editingOt === ot.id ? (
                                  <select value={editOtForm.startTime} onChange={(e) => setEditOtForm({ ...editOtForm, startTime: e.target.value })}
                                    style={{ fontFamily: 'Kanit', fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '2px solid #f97316', outline: 'none', width: 80 }}>
                                    {Array.from({ length: 48 }, (_, i) => { const h = String(Math.floor(i / 2)).padStart(2, '0'); const m = i % 2 === 0 ? '00' : '30'; return <option key={i} value={`${h}:${m}`}>{h}:{m}</option> })}
                                  </select>
                                ) : (
                                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{ot.startTime || '-'}</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'center' }}>
                                {editingOt === ot.id ? (
                                  <select value={editOtForm.endTime} onChange={(e) => setEditOtForm({ ...editOtForm, endTime: e.target.value })}
                                    style={{ fontFamily: 'Kanit', fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '2px solid #f97316', outline: 'none', width: 80 }}>
                                    {Array.from({ length: 48 }, (_, i) => { const h = String(Math.floor(i / 2)).padStart(2, '0'); const m = i % 2 === 0 ? '00' : '30'; return <option key={i} value={`${h}:${m}`}>{h}:{m}</option> })}
                                  </select>
                                ) : (
                                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{ot.endTime || '-'}</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#ea580c',
                                  background: '#fff7ed', padding: '3px 10px', borderRadius: 8, border: '1px solid #fed7aa' }}>
                                  {editingOt === ot.id ? (() => {
                                    const [sh, sm] = (editOtForm.startTime || '0:0').split(':').map(Number)
                                    const [eh, em] = (editOtForm.endTime || '0:0').split(':').map(Number)
                                    const diff = (eh * 60 + em) - (sh * 60 + sm)
                                    return diff > 0 ? (Math.round((diff / 60) * 100) / 100).toFixed(1) : '0'
                                  })() : (ot.hours || 0).toFixed(1)}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ot.reason || '-'}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{
                                  fontFamily: 'Kanit', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                                  background: ot.status === 'approved' ? '#D3F0E2' : ot.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                  color: ot.status === 'approved' ? '#147F56' : ot.status === 'rejected' ? '#dc2626' : '#b45309',
                                  border: `1px solid ${ot.status === 'approved' ? '#74CCA4' : ot.status === 'rejected' ? '#fca5a5' : '#fde68a'}`
                                }}>
                                  {ot.status === 'approved' ? '✓ อนุมัติ' : ot.status === 'rejected' ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติ'}
                                </span>
                                {ot.status === 'rejected' && ot.rejectReason && (
                                  <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>เหตุผล: {ot.rejectReason}</div>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                  {editingOt === ot.id ? (
                                    <>
                                      <button onClick={() => saveEditOt(ot)} title="บันทึก"
                                        style={{ background: '#2A6AAA', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <Save size={13} color="#fff" />
                                      </button>
                                      <button onClick={() => setEditingOt(null)} title="ยกเลิก"
                                        style={{ background: '#94a3b8', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <X size={13} color="#fff" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {ot.status === 'pending' && (
                                        <>
                                          <button onClick={() => handleApproveOt(ot.id)} title="อนุมัติ"
                                            style={{ background: '#2A6AAA', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <CheckCircle size={13} color="#fff" />
                                          </button>
                                          <button onClick={() => openOtRejectModal(ot)} title="ไม่อนุมัติ"
                                            style={{ background: '#ef4444', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <XCircle size={13} color="#fff" />
                                          </button>
                                        </>
                                      )}
                                      <button onClick={() => startEditOt(ot)} title="แก้ไข"
                                        style={{ background: '#3E86C7', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <Edit2 size={13} color="#fff" />
                                      </button>
                                      <button onClick={() => handleDeleteOt(ot.id)} title="ลบ"
                                        style={{ background: '#f87171', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <Trash2 size={13} color="#fff" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* OT Reject Modal */}
        {showOtRejectModal && otRejectTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowOtRejectModal(false)}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={20} color="#dc2626" /> ไม่อนุมัติโอที
                </div>
                <button onClick={() => setShowOtRejectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
              </div>
              <div style={{ background: '#fff7ed', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid #fed7aa' }}>
                <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginBottom: 4 }}>คำขอโอทีของ</div>
                <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                  {otRejectTarget.person} — {otRejectTarget.startTime} ถึง {otRejectTarget.endTime} ({otRejectTarget.hours} ชม.)
                </div>
                <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>
                  วันที่: {otRejectTarget.otDate ? new Date(otRejectTarget.otDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: 13, color: '#334155', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                  สาเหตุที่ไม่อนุมัติ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={otRejectReason}
                  onChange={(e) => setOtRejectReason(e.target.value)}
                  placeholder="กรุณาระบุสาเหตุ..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #fca5a5',
                    fontFamily: 'Kanit', fontSize: 13, outline: 'none', resize: 'vertical',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ef4444')}
                  onBlur={(e) => (e.target.style.borderColor = '#fca5a5')}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="outline" size="sm" onClick={() => setShowOtRejectModal(false)}
                  style={{ fontFamily: 'Kanit', fontSize: 12 }}>ยกเลิก</Button>
                <Button size="sm" onClick={handleConfirmOtReject} disabled={!otRejectReason.trim()}
                  style={{ fontFamily: 'Kanit', fontSize: 12, background: '#ef4444', color: '#fff', border: 'none', opacity: otRejectReason.trim() ? 1 : 0.5 }}>
                  <XCircle size={14} style={{ marginRight: 4 }} /> ยืนยันไม่อนุมัติ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* OT Day Edit Modal */}
        {showOtDayModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowOtDayModal(false)}>
            <div style={{ background: '#fff', borderRadius: 18, width: 520, maxWidth: '94vw', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
              onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 15, fontWeight: 700, color: '#fff' }}>แก้ไขชั่วโมงโอที</div>
                    <div style={{ fontFamily: 'Kanit', fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                      {otDayDate ? (() => {
                        const d = new Date(otDayDate + 'T00:00:00')
                        return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      })() : ''} — {selectedEmployee?.name || ''}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowOtDayModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color="#fff" />
                </button>
              </div>
              {/* Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(85vh - 72px)' }}>
                {otDayRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                    <Clock size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
                    <div style={{ fontFamily: 'Kanit', fontSize: 13 }}>ไม่มีรายการโอทีในวันนี้</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {otDayRecords.map((record: any, idx: number) => (
                      <div key={record.id} style={{
                        background: otDayEditId === record.id ? '#fffbeb' : '#f8fafc',
                        borderRadius: 14, padding: 16,
                        border: otDayEditId === record.id ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                        transition: 'all 0.2s'
                      }}>
                        {/* Status badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#64748b' }}>รายการ #{idx + 1}</span>
                            <span style={{
                              fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                              background: record.status === 'approved' ? '#D3F0E2' : record.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                              color: record.status === 'approved' ? '#147F56' : record.status === 'rejected' ? '#dc2626' : '#ca8a04'
                            }}>
                              {record.status === 'approved' ? 'อนุมัติ' : record.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอดำเนินการ'}
                            </span>
                          </div>
                          {otDayEditId !== record.id && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => {
                                setOtDayEditId(record.id)
                                setOtDayEditForm({ startTime: record.startTime || '', endTime: record.endTime || '' })
                              }}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                                title="แก้ไข">
                                <Edit2 size={14} color="#3E86C7" />
                              </button>
                              <button onClick={() => deleteOtDayRecord(record.id)}
                                style={{ background: '#fef2f2', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
                                title="ลบ">
                                <Trash2 size={14} color="#ef4444" />
                              </button>
                            </div>
                          )}
                        </div>

                        {otDayEditId === record.id ? (
                          /* Edit Mode */
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                              <div>
                                <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>เวลาเริ่มต้น</label>
                                <select value={otDayEditForm.startTime}
                                  onChange={(e) => setOtDayEditForm((f: any) => ({ ...f, startTime: e.target.value }))}
                                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '2px solid #f59e0b', fontFamily: 'Kanit', fontSize: 13, outline: 'none', background: '#fff' }}>
                                  <option value="">-- เลือก --</option>
                                  {Array.from({ length: 48 }, (_, i) => {
                                    const h = String(Math.floor(i / 2)).padStart(2, '0')
                                    const m = i % 2 === 0 ? '00' : '30'
                                    return <option key={i} value={`${h}:${m}`}>{h}:{m}</option>
                                  })}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>เวลาสิ้นสุด</label>
                                <select value={otDayEditForm.endTime}
                                  onChange={(e) => setOtDayEditForm((f: any) => ({ ...f, endTime: e.target.value }))}
                                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '2px solid #f59e0b', fontFamily: 'Kanit', fontSize: 13, outline: 'none', background: '#fff' }}>
                                  <option value="">-- เลือก --</option>
                                  {Array.from({ length: 48 }, (_, i) => {
                                    const h = String(Math.floor(i / 2)).padStart(2, '0')
                                    const m = i % 2 === 0 ? '00' : '30'
                                    return <option key={i} value={`${h}:${m}`}>{h}:{m}</option>
                                  })}
                                </select>
                              </div>
                            </div>
                            {/* Calculated hours preview */}
                            {otDayEditForm.startTime && otDayEditForm.endTime && (() => {
                              const [sh, sm] = otDayEditForm.startTime.split(':').map(Number)
                              const [eh, em] = otDayEditForm.endTime.split(':').map(Number)
                              const diff = (eh * 60 + em) - (sh * 60 + sm)
                              const hrs = diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
                              return (
                                <div style={{ background: hrs > 0 ? '#EDF9F3' : '#fef2f2', borderRadius: 10, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${hrs > 0 ? '#A9E1C6' : '#fecaca'}` }}>
                                  <Clock size={14} color={hrs > 0 ? '#147F56' : '#ef4444'} />
                                  <span style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: hrs > 0 ? '#147F56' : '#ef4444' }}>
                                    {hrs > 0 ? `${hrs} ชั่วโมง` : 'เวลาไม่ถูกต้อง'}
                                  </span>
                                </div>
                              )
                            })()}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button onClick={() => setOtDayEditId(null)}
                                style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}>
                                ยกเลิก
                              </button>
                              <button onClick={() => saveOtDayEdit(record)}
                                style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Save size={13} /> บันทึก
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: record.reason ? 8 : 0 }}>
                              <div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>เริ่มต้น</div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{record.startTime || '-'}</div>
                              </div>
                              <div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>สิ้นสุด</div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{record.endTime || '-'}</div>
                              </div>
                              <div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>ชั่วโมง</div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: '#f97316' }}>{record.hours ?? '-'} ชม.</div>
                              </div>
                            </div>
                            {record.reason && (
                              <div style={{ background: '#fff7ed', borderRadius: 8, padding: '6px 10px', border: '1px solid #fed7aa' }}>
                                <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#9a3412' }}>เหตุผล: {record.reason}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Summary */}
                    <div style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fdba74' }}>
                      <span style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 600, color: '#9a3412' }}>รวมโอทีวันนี้</span>
                      <span style={{ fontFamily: 'Kanit', fontSize: 18, fontWeight: 700, color: '#ea580c' }}>
                        {otDayRecords.filter((r: any) => r.status === 'approved').reduce((sum: number, r: any) => sum + (r.hours || 0), 0).toFixed(1)} ชั่วโมง
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedEmployee ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '40px 0',
            color: '#94a3b8'
          }}>
            <User size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontFamily: 'Kanit', fontSize: '14px' }}>เลือกพนักงานเพื่อดูรายงานเข้า-ออกงานรายบุคคล</p>
          </div>
        ) : loading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%' 
          }}>
            <p style={{ fontFamily: 'Kanit', fontSize: '14px', color: '#64748b' }}>กำลังโหลด...</p>
          </div>
        ) : (
          <>
          {/* ===== Two Column Layout: Leave Stats (col1) | Attendance Table (col2) ===== */}
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, alignItems: 'start' }}>

          {/* ===== Col 1: Leave Statistics Section ===== */}
          <div style={{ position: 'sticky', top: 0 }}>
            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="#6366f1" /> สถิติการลา ปี {Number(selectedMonth.split('-')[0]) + 543}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="sm" onClick={() => setShowAddLeave(true)}
                  style={{ fontFamily: 'Kanit', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, borderColor: '#6366f1', color: '#6366f1' }}>
                  <Plus size={14} /> บันทึกการลา
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setLeaveSettingsForm({ ...leaveConfig }); setShowLeaveSettings(true) }}
                  style={{ fontFamily: 'Kanit', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, borderColor: '#f59e0b', color: '#b45309' }}>
                  <Settings size={14} /> ตั้งค่าการลา
                </Button>
              </div>
            </div>

            {/* Leave Stats Cards */}
            {(() => {
              const st = leaveStats()
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {/* ลาพักร้อน */}
                  <div style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', borderRadius: 10, padding: '10px 12px', border: '1px solid #CCDFF1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <Palmtree size={14} color="#3E86C7" />
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#1E5088', whiteSpace: 'nowrap' }}>ลาพักร้อน</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#3E86C7' }}>{st.vacation.entitled}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>สิทธิ์</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{st.vacation.used}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>ลาแล้ว</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#2A6AAA' }}>{st.vacation.remaining}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>คงเหลือ</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${st.vacation.entitled > 0 ? Math.min((st.vacation.used / st.vacation.entitled) * 100, 100) : 0}%`, height: '100%', background: '#3E86C7', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  {/* ลากิจ */}
                  <div style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', borderRadius: 10, padding: '10px 12px', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <Briefcase size={14} color="#f59e0b" />
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#b45309', whiteSpace: 'nowrap' }}>ลากิจ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{st.personal.entitled}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>สิทธิ์</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{st.personal.used}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>ลาแล้ว</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#2A6AAA' }}>{st.personal.remaining}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>คงเหลือ</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${st.personal.entitled > 0 ? Math.min((st.personal.used / st.personal.entitled) * 100, 100) : 0}%`, height: '100%', background: '#f59e0b', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  {/* ลาป่วย */}
                  <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', borderRadius: 10, padding: '10px 12px', border: '1px solid #fca5a5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <Thermometer size={14} color="#ef4444" />
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}>ลาป่วย</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{st.sick.entitled}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>สิทธิ์</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{st.sick.used}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>ลาแล้ว</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#2A6AAA' }}>{st.sick.remaining}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>คงเหลือ</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${st.sick.entitled > 0 ? Math.min((st.sick.used / st.sick.entitled) * 100, 100) : 0}%`, height: '100%', background: '#ef4444', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  {/* สาย */}
                  <div style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #f5d0fe 100%)', borderRadius: 10, padding: '10px 12px', border: '1px solid #e9d5ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <AlertTriangle size={14} color="#a855f7" />
                      <span style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#7c3aed', whiteSpace: 'nowrap' }}>สาย</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#a855f7' }}>{st.late.limit}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>อนุโลม</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: st.late.count > st.late.limit ? '#ef4444' : '#334155' }}>{st.late.count}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>สายจริง</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: st.late.over > 0 ? '#ef4444' : '#147F56' }}>{st.late.over}</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>เกิน</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${st.late.limit > 0 ? Math.min((st.late.count / st.late.limit) * 100, 100) : 0}%`, height: '100%', background: st.late.count > st.late.limit ? '#ef4444' : '#a855f7', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Leave Records Table */}
            {leaveRecords.length > 0 && (
              <div style={{ marginTop: 12, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  รายการลาทั้งหมด (ปี {Number(selectedMonth.split('-')[0]) + 543})
                </div>
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['วันที่', 'ประเภท', 'เหตุผล', 'สถานะ', 'หมายเหตุ', ''].map((h, i) => (
                          <th key={i} style={{ padding: '6px 12px', fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8', fontWeight: 600, textAlign: i === 5 ? 'center' : 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRecords.map((lr: any) => (
                        <tr key={lr.id} style={{ borderBottom: '1px solid #f1f5f9', background: lr.status === 'pending' ? '#fffbeb' : 'transparent' }}>
                          <td style={{ padding: '6px 12px', fontFamily: 'Kanit', fontSize: 12, color: '#334155' }}>
                            {lr.leaveDate ? new Date(lr.leaveDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <span style={{
                              fontFamily: 'Kanit', fontSize: 10, padding: '2px 6px', borderRadius: 10, whiteSpace: 'nowrap',
                              background: lr.leaveType === 'vacation' ? '#E5EEF8' : lr.leaveType === 'personal' ? '#fef9c3' : '#fee2e2',
                              color: lr.leaveType === 'vacation' ? '#1E5088' : lr.leaveType === 'personal' ? '#b45309' : '#dc2626'
                            }}>
                              {lr.leaveType === 'vacation' ? 'พักร้อน' : lr.leaveType === 'personal' ? 'ลากิจ' : 'ลาป่วย'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 12px', fontFamily: 'Kanit', fontSize: 12, color: '#64748b' }}>{lr.reason || '-'}</td>
                          <td style={{ padding: '6px 12px' }}>
                            {lr.status === 'approved' ? (
                              <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#2A6AAA', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <CheckCircle size={12} /> อนุมัติ
                              </span>
                            ) : lr.status === 'rejected' ? (
                              <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <XCircle size={12} /> ไม่อนุมัติ
                              </span>
                            ) : (
                              <span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#b45309', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={12} /> รออนุมัติ
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '6px 12px', fontFamily: 'Kanit', fontSize: 11, color: '#ef4444' }}>
                            {lr.rejectReason || '-'}
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                            {lr.status === 'pending' && isLevel2 ? (
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <Button size="sm" onClick={() => handleApproveLeave(lr.id)}
                                  style={{ fontFamily: 'Kanit', fontSize: 10, background: '#2A6AAA', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 6 }}>
                                  อนุมัติ
                                </Button>
                                <Button size="sm" onClick={() => openRejectModal(lr)}
                                  style={{ fontFamily: 'Kanit', fontSize: 10, background: '#ef4444', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 6 }}>
                                  ไม่อนุมัติ
                                </Button>
                              </div>
                            ) : isLevel2 ? (
                              <button onClick={() => handleDeleteLeave(lr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                                <Trash2 size={14} />
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ===== Col 2: Attendance Table ===== */}
          <div>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Kanit', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="#3E86C7" /> ประวัติรายเดือน — {(() => { const [y, m] = selectedMonth.split('-'); const thm = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']; return `${thm[Number(m)-1]} ${Number(y)+543}`; })()}
            </div>
          </div>
          {/* ===== Attendance Table ===== */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <Table hover borderless className="mb-0">
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ 
                    padding: '12px 16px', 
                    fontFamily: 'Kanit', 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '8%'
                  }}>วันที่</th>
                  <th style={{
                    padding: '12px 16px',
                    fontFamily: 'Kanit',
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '9%'
                  }}>กะ</th>
                  <th style={{
                    padding: '12px 16px',
                    fontFamily: 'Kanit',
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '12%'
                  }}>เวลาเข้า</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    fontFamily: 'Kanit', 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '12%'
                  }}>เวลาออก</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    fontFamily: 'Kanit', 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '10%'
                  }}>ชั่วโมงรวม</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    fontFamily: 'Kanit', 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '10%'
                  }}>สถานะ</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    fontFamily: 'Kanit', 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '15%'
                  }}>การอนุมัติ</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    fontFamily: 'Kanit', 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '20%'
                  }}>หมายเหตุ</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    fontFamily: 'Kanit', 
                    fontSize: '12px', 
                    color: '#64748b', 
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '10%'
                  }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {calendarDays.flatMap((day) => {
                  const dayRecords = getCheckinsForDate(day.date)
                  const rowList = dayRecords.length > 0 ? dayRecords : [null]
                  const isToday = day.date === toThaiDateString()
                  const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6

                  return rowList.map((record, recIdx) => (
                    <tr
                      key={`${day.date}-${record ? record.id : 'empty'}`}
                      style={{
                        backgroundColor: isToday ? '#F3F8FC' : 'transparent',
                        borderBottom: recIdx === rowList.length - 1 ? '1px solid #f1f5f9' : '1px dashed #eef2f7'
                      }}
                    >
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontFamily: 'Kanit',
                        fontSize: '13px',
                        color: isWeekend ? '#ef4444' : '#334155'
                      }}>
                        {recIdx === 0 ? formatDateThai(day.date) : ''}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontFamily: 'Kanit',
                        fontSize: '13px'
                      }}>
                        {(() => {
                          if (!record || !record.checkin) return <span style={{ color: '#cbd5e1' }}>-</span>
                          const shName = getRecordShiftName(record)
                          if (!shName) return <span style={{ color: '#94a3b8', fontSize: 12 }}>นอกกะ</span>
                          return (
                            <span style={{
                              backgroundColor: '#ccfbf1',
                              color: '#0f766e',
                              padding: '3px 10px',
                              borderRadius: '100px',
                              fontSize: '12px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>{shName}</span>
                          )
                        })()}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontFamily: 'Kanit',
                        fontSize: '13px',
                        color: '#334155'
                      }}>
                        {record && editingRecord === record.id ? (
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{2}:[0-9]{2}"
                            placeholder="HH:MM"
                            maxLength={5}
                            value={editForm.checkinTime}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9]/g, '')
                              if (val.length >= 2) {
                                val = val.slice(0, 2) + ':' + val.slice(2, 4)
                              }
                              if (val.length > 5) val = val.slice(0, 5)
                              setEditForm({ ...editForm, checkinTime: val })
                            }}
                            style={{ width: '70px', fontSize: '13px', textAlign: 'center' }}
                          />
                        ) : record ? (
                          <span style={{ 
                            backgroundColor: '#E5EEF8', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            color: '#2A6AAA'
                          }}>
                            {formatTime(record.checkin)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontFamily: 'Kanit',
                        fontSize: '13px',
                        color: '#334155'
                      }}>
                        {record && editingRecord === record.id ? (
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{2}:[0-9]{2}"
                            placeholder="HH:MM"
                            maxLength={5}
                            value={editForm.checkoutTime}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9]/g, '')
                              if (val.length >= 2) {
                                val = val.slice(0, 2) + ':' + val.slice(2, 4)
                              }
                              if (val.length > 5) val = val.slice(0, 5)
                              setEditForm({ ...editForm, checkoutTime: val })
                            }}
                            style={{ width: '70px', fontSize: '13px', textAlign: 'center' }}
                          />
                        ) : record?.checkout ? (
                          <span style={{ 
                            backgroundColor: '#fee2e2', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            color: '#dc2626'
                          }}>
                            {formatTime(record.checkout)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontFamily: 'Kanit',
                        fontSize: '13px',
                        color: '#334155',
                        fontWeight: 600
                      }}>
                        {(() => {
                          const hrs = record ? calcHours(record.checkin, record.checkout) : '-'
                          const otForDay = allOtRecords.filter(ot =>
                            ot.personId === selectedEmployee?.id &&
                            ot.status === 'approved' &&
                            ot.otDate && new Date(ot.otDate).toISOString().slice(0, 10) === day.date
                          )
                          const otHours = otForDay.reduce((s: number, r: any) => s + (r.hours || 0), 0)
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              {hrs !== '-' ? (
                                <span style={{
                                  backgroundColor: '#e0e7ff',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  color: '#4338ca'
                                }}>
                                  {hrs} ชม.
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>-</span>
                              )}
                              {otHours > 0 && (
                                <span
                                  onClick={() => openOtDayModal(day.date)}
                                  style={{
                                    backgroundColor: '#fff7ed',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    color: '#ea580c',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    border: '1px solid #fed7aa',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffedd5'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(249,115,22,0.25)' }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff7ed'; e.currentTarget.style.boxShadow = 'none' }}
                                  title="คลิกเพื่อแก้ไขโอที"
                                >
                                  OT {otHours.toFixed(1)} ชม.
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontFamily: 'Kanit',
                        fontSize: '13px'
                      }}>
                        {record ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            backgroundColor: record.status === 'normal' ? '#D3F0E2' : '#fee2e2',
                            color: record.status === 'normal' ? '#147F56' : '#dc2626',
                            whiteSpace: 'nowrap'
                          }}>
                            {record.status === 'normal' ? 'ปกติ' : record.status || '-'}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontFamily: 'Kanit',
                        fontSize: '13px'
                      }}>
                        {record ? (
                          record.approve === 'approved' ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <CheckCircle size={14} color="#2A6AAA" />
                              <span style={{ color: '#147F56', fontSize: '12px' }}>อนุมัติแล้ว</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <XCircle size={14} color="#94a3b8" />
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>รออนุมัติ</span>
                            </div>
                          )
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontFamily: 'Kanit',
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        {record && editingRecord === record.id ? (
                          <Input
                            type="text"
                            placeholder="หมายเหตุ..."
                            value={editForm.remarkText}
                            onChange={(e) => setEditForm({ ...editForm, remarkText: e.target.value })}
                            style={{ 
                              width: '100%', 
                              fontSize: '12px', 
                              textAlign: 'center',
                              fontFamily: 'Kanit',
                              borderColor: '#c7d2fe',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease'
                            }}
                          />
                        ) : (
                          record?.remark || '-'
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center'
                      }}>
                        {record && editingRecord === record.id ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(record, day.date)}
                              style={{
                                fontFamily: 'Kanit',
                                fontSize: '11px',
                                backgroundColor: '#3E86C7',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px'
                              }}
                            >
                              <Save size={12} />
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCancelEdit}
                              style={{
                                fontFamily: 'Kanit',
                                fontSize: '11px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px'
                              }}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ) : record ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <Button
                              size="sm"
                              onClick={() => handleEdit(record)}
                              style={{
                                fontFamily: 'Kanit',
                                fontSize: '11px',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px'
                              }}
                            >
                              <Edit2 size={12} />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(record.id)}
                              style={{
                                fontFamily: 'Kanit',
                                fontSize: '11px',
                                backgroundColor: '#3E86C7',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px'
                              }}
                            >
                              อนุมัติ
                            </Button>
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: 11 }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </Table>
          </div>
          </div>
          {/* ===== End Col 2 ===== */}

          </div>
          {/* ===== End Two Column Layout ===== */}

          {showLeaveSettings && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setShowLeaveSettings(false)}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Settings size={20} color="#f59e0b" /> ตั้งค่าสิทธิ์การลา
                  </div>
                  <button onClick={() => setShowLeaveSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'vacationDays', label: 'ลาพักร้อน (วัน/ปี)', icon: <Palmtree size={16} color="#3E86C7" />, color: '#3E86C7' },
                    { key: 'personalDays', label: 'ลากิจ (วัน/ปี)', icon: <Briefcase size={16} color="#f59e0b" />, color: '#f59e0b' },
                    { key: 'sickDays', label: 'ลาป่วย (วัน/ปี)', icon: <Thermometer size={16} color="#ef4444" />, color: '#ef4444' },
                    { key: 'lateLimit', label: 'สายได้ไม่เกิน (ครั้ง/เดือน)', icon: <AlertTriangle size={16} color="#a855f7" />, color: '#a855f7' },
                  ].map((item) => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 200 }}>
                        {item.icon}
                        <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#334155' }}>{item.label}</span>
                      </div>
                      <Input
                        type="number" min={0}
                        value={leaveSettingsForm[item.key] || 0}
                        onChange={(e) => setLeaveSettingsForm({ ...leaveSettingsForm, [item.key]: Number(e.target.value) })}
                        style={{ width: 80, textAlign: 'center', fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, borderColor: item.color }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 200 }}>
                      <Clock size={16} color="#6366f1" />
                      <span style={{ fontFamily: 'Kanit', fontSize: 13, color: '#334155' }}>เวลาเข้างาน</span>
                    </div>
                    <Input
                      type="time"
                      value={leaveSettingsForm.workStartTime || '08:30'}
                      onChange={(e) => setLeaveSettingsForm({ ...leaveSettingsForm, workStartTime: e.target.value })}
                      style={{ width: 120, textAlign: 'center', fontFamily: 'Kanit', fontSize: 14, fontWeight: 600, borderColor: '#6366f1' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                  <Button variant="outline" size="sm" onClick={() => setShowLeaveSettings(false)}
                    style={{ fontFamily: 'Kanit', fontSize: 12 }}>ยกเลิก</Button>
                  <Button size="sm" onClick={saveLeaveConfig}
                    style={{ fontFamily: 'Kanit', fontSize: 12, background: '#f59e0b', color: '#fff', border: 'none' }}>
                    <Save size={14} style={{ marginRight: 4 }} /> บันทึก
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ===== Add Leave Modal ===== */}
          {showAddLeave && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setShowAddLeave(false)}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={20} color="#6366f1" /> บันทึกการลา — {selectedEmployee?.name}
                  </div>
                  <button onClick={() => setShowAddLeave(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>ประเภทการลา</label>
                    <select value={addLeaveForm.leaveType} onChange={(e) => setAddLeaveForm({ ...addLeaveForm, leaveType: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'Kanit', fontSize: 13 }}>
                      <option value="vacation">ลาพักร้อน</option>
                      <option value="personal">ลากิจ</option>
                      <option value="sick">ลาป่วย</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>วันที่ลา</label>
                    <Input type="date" value={addLeaveForm.leaveDate} onChange={(e) => setAddLeaveForm({ ...addLeaveForm, leaveDate: e.target.value })}
                      style={{ fontFamily: 'Kanit', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>เหตุผล</label>
                    <Input type="text" placeholder="ระบุเหตุผล (ไม่บังคับ)" value={addLeaveForm.reason}
                      onChange={(e) => setAddLeaveForm({ ...addLeaveForm, reason: e.target.value })}
                      style={{ fontFamily: 'Kanit', fontSize: 13 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                  <Button variant="outline" size="sm" onClick={() => setShowAddLeave(false)}
                    style={{ fontFamily: 'Kanit', fontSize: 12 }}>ยกเลิก</Button>
                  <Button size="sm" onClick={handleAddLeave} disabled={!addLeaveForm.leaveDate}
                    style={{ fontFamily: 'Kanit', fontSize: 12, background: '#6366f1', color: '#fff', border: 'none' }}>
                    <Save size={14} style={{ marginRight: 4 }} /> บันทึก
                  </Button>
                </div>
              </div>
            </div>
          )}

          </>
        )}
      </div>

      <style jsx>{`
        .hover-option:hover { background-color: #f8fafc !important; }
      `}</style>
    </div>
  )
}
