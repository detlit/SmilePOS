'use client'
import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { getDeviceId, getDeviceTypeShort } from '@/utils/checkinDevice'

// ปุ่ม Check-in / Check-out บนแถบหัว อิงตามกะที่ตั้งค่าไว้ (ReportWorkShift)
// แสดงเฉพาะเครื่องที่ถูกผูก (ได้รับอนุญาต) ในเมนู ตั้งค่า > ผูกคอมพิวเตอร์ Check-in

const minutesOf = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map((n) => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

// หากะปัจจุบันจากเวลา (รองรับกะข้ามคืน เช่น 22:00-07:00)
const detectShift = (shifts, now) => {
  if (!shifts || shifts.length === 0) return null
  const cur = now.getHours() * 60 + now.getMinutes()
  for (const s of shifts) {
    const a = minutesOf(s.start)
    const b = minutesOf(s.end)
    if (a < b) {
      if (cur >= a && cur < b) return s
    } else if (a > b) {
      if (cur >= a || cur < b) return s
    }
  }
  return shifts[0]
}

const isSameThaiDay = (iso, now) => {
  if (!iso) return false
  try {
    const a = new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const b = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    return a === b
  } catch {
    return false
  }
}

const fmtTime = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return ''
  }
}

function CheckinControls() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(null) // null=loading, false=not bound, true=bound
  const [shifts, setShifts] = useState([])
  const [autoShift, setAutoShift] = useState(null) // กะที่ตรวจจับอัตโนมัติจากเวลา
  const [manualShiftId, setManualShiftId] = useState('') // กะที่พนักงานเลือกเอง (override)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [todays, setTodays] = useState([]) // รายการลงเวลาของวันนี้ (หลายกะได้)
  const [busy, setBusy] = useState(false)
  const [ids, setIds] = useState({ idcompany: '', company: '', personId: 0, personName: '' })

  const remarkOfShift = (s) => (s ? `กะ${s.name}` : '')

  // กะที่กำลังลงเวลาอยู่ (เข้าแล้วยังไม่ออก) — ใช้เป็นค่าเริ่มต้นให้ค้างที่กะนั้นจนกว่าจะออกงาน
  const inProgress = todays.find((r) => r.checkin && !r.checkout) || null
  const inProgressShift = inProgress ? shifts.find((s) => remarkOfShift(s) === inProgress.remark) : null

  // กะที่ใช้งานจริง = เลือกเอง > กะที่กำลังทำอยู่ > กะอัตโนมัติตามเวลา
  const shift = (manualShiftId && shifts.find((s) => s.id === manualShiftId)) || inProgressShift || autoShift

  // record ของกะที่กำลังเลือกอยู่
  const shiftRecord = shift ? (todays.find((r) => r.remark === remarkOfShift(shift)) || null) : null

  // โหลด identity จาก localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIds({
      idcompany: localStorage.getItem('ci_') || localStorage.getItem('company_') || '',
      company: localStorage.getItem('cp_') || '',
      personId: Number(localStorage.getItem('pi_') || localStorage.getItem('personid_') || 0),
      personName: localStorage.getItem('person_') || '',
    })
  }, [])

  const checkAuthorized = useCallback(async (idcompany) => {
    if (!idcompany) { setAuthorized(false); return false }
    try {
      const did = getDeviceId()
      const res = await axios.get(`/api/checkin-device?idcompany=${encodeURIComponent(idcompany)}&deviceId=${encodeURIComponent(did)}`)
      const cur = res.data?.current
      const ok = !!cur && cur.status === 'active'
      setAuthorized(ok)
      return ok
    } catch {
      setAuthorized(false)
      return false
    }
  }, [])

  const loadShifts = useCallback(async (idcompany) => {
    try {
      const res = await axios.get(`/api/report-shifts?company=${encodeURIComponent(idcompany)}`)
      const list = Array.isArray(res.data?.shifts) ? res.data.shifts : []
      setShifts(list)
      setAutoShift(detectShift(list, new Date()))
    } catch {
      setShifts([])
    }
  }, [])

  const loadTodays = useCallback(async (idcompany, personId) => {
    if (!idcompany || !personId) return
    try {
      const now = new Date()
      const res = await axios.get(`/api/checkin?idcompany=${encodeURIComponent(idcompany)}&personId=${personId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      const rows = Array.isArray(res.data) ? res.data : []
      setTodays(rows.filter((r) => isSameThaiDay(r.checkin, now)))
    } catch {
      /* noop */
    }
  }, [])

  useEffect(() => {
    if (!ids.idcompany) return
    let mounted = true
    ;(async () => {
      const ok = await checkAuthorized(ids.idcompany)
      if (!mounted || !ok) return
      await loadShifts(ids.idcompany)
      await loadTodays(ids.idcompany, ids.personId)
    })()
    return () => { mounted = false }
  }, [ids.idcompany, ids.personId, checkAuthorized, loadShifts, loadTodays])

  // ปรับกะปัจจุบันทุก 1 นาที
  useEffect(() => {
    if (!shifts.length) return
    const t = setInterval(() => setAutoShift(detectShift(shifts, new Date())), 60000)
    return () => clearInterval(t)
  }, [shifts])

  const shiftName = shift?.name || ''
  const checkedIn = !!shiftRecord && !!shiftRecord.checkin
  const checkedOut = !!shiftRecord && !!shiftRecord.checkout

  // อัปเดต/เพิ่ม record ใน todays
  const upsertToday = (rec) => {
    if (!rec) return
    setTodays((prev) => [...prev.filter((r) => r.id !== rec.id), rec])
  }

  const doCheckin = async () => {
    if (busy || !ids.personId || checkedIn) return
    setBusy(true)
    try {
      const now = new Date()
      const res = await axios.post('/api/checkin', {
        idcompany: ids.idcompany,
        company: ids.company,
        personId: ids.personId,
        person: ids.personName,
        status: 'checked-in',
        checkin: now.toISOString(),
        approve: 'pending',
        remark: remarkOfShift(shift),
      })
      upsertToday(res.data)
    } catch (e) {
      if (e?.response?.status === 409 && e.response.data?.existing) {
        upsertToday(e.response.data.existing)
      }
    } finally {
      setBusy(false)
    }
  }

  const doCheckout = async () => {
    if (busy || !shiftRecord?.id) return
    setBusy(true)
    try {
      const now = new Date()
      const res = await axios.put(`/api/checkin/${shiftRecord.id}`, {
        status: 'checked-out',
        checkout: now.toISOString(),
      })
      upsertToday(res.data)
    } catch {
      /* noop */
    } finally {
      setBusy(false)
    }
  }

  // ยังโหลดอยู่
  if (authorized === null) return null

  // เครื่องนี้ยังไม่ได้ผูก -> แสดงคำใบ้เล็ก ๆ ให้ไปผูกเครื่อง
  if (authorized === false) {
    return (
      <button
        type="button"
        onClick={() => router.push('/web/setting')}
        title="ผูกคอมพิวเตอร์เครื่องนี้เพื่อเปิดใช้งานการลงเวลา"
        style={{
          fontFamily: 'Kanit', fontSize: 12, color: '#64748b', background: '#f8fafc',
          border: '1px dashed #cbd5e1', borderRadius: 100, padding: '5px 12px', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}
      >
        <i className="bi bi-pc-display" /> ผูกเครื่องเพื่อลงเวลา
      </button>
    )
  }

  const dotColor = checkedOut ? '#94a3b8' : checkedIn ? '#147F56' : '#f59e0b'
  const statusText = checkedOut ? 'ออกงานแล้ว' : checkedIn ? 'เข้างานแล้ว' : 'ยังไม่ลงเวลา'

  const btnBase = {
    fontFamily: 'Kanit', fontSize: 13, borderRadius: 100, padding: '6px 14px', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', border: '1px solid transparent',
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {/* สถานะ + กะปัจจุบัน */}
      <div
        title={statusText}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Kanit', fontSize: 12,
          background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 100, padding: '4px 4px 4px 12px',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#475569' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
          {checkedIn ? fmtTime(shiftRecord?.checkin) : statusText}
        </span>
        {/* เลือกกะได้เอง (สลับกะเพื่อลงเวลาได้หลายกะใน 1 วัน) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => { if (shifts.length > 0) setPickerOpen((v) => !v) }}
            title="เลือก/สลับกะการทำงาน"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Kanit', fontSize: 12, fontWeight: 600,
              background: '#0d9488', color: '#fff', border: 'none', borderRadius: 100,
              padding: '3px 10px', cursor: shifts.length > 0 ? 'pointer' : 'default',
            }}
          >
            {shiftName || 'เลือกกะ'}
            {shifts.length > 0 && <i className="bi bi-chevron-down" style={{ fontSize: 9 }} />}
          </button>

          {pickerOpen && (
            <>
              {/* overlay สำหรับปิดเมื่อคลิกนอกพื้นที่ */}
              <div onClick={() => setPickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1090 }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 1091, minWidth: 170,
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 30px rgba(15,23,42,0.18)',
                padding: 6, fontFamily: 'Kanit',
              }}>
                <div style={{ fontSize: 11, color: '#94a3b8', padding: '4px 10px 6px' }}>เลือกกะการทำงาน</div>
                {shifts.map((s) => {
                  const active = s.id === shift?.id
                  const isAuto = !manualShiftId && s.id === autoShift?.id
                  const rec = todays.find((r) => r.remark === remarkOfShift(s))
                  const state = rec ? (rec.checkout ? 'done' : 'in') : 'none'
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setManualShiftId(s.id); setPickerOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10,
                        background: active ? '#f0fdfa' : 'transparent', border: 'none', borderRadius: 8,
                        padding: '7px 10px', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#0d9488' : '#cbd5e1' }} />
                        <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: '#0f172a' }}>{s.name}</span>
                        {isAuto && <span style={{ fontSize: 10, color: '#0d9488', background: '#ccfbf1', borderRadius: 100, padding: '1px 6px' }}>อัตโนมัติ</span>}
                        {state === 'in' && <span style={{ fontSize: 10, color: '#2A6AAA', background: '#E5EEF8', borderRadius: 100, padding: '1px 6px' }}>กำลังทำงาน</span>}
                        {state === 'done' && <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', borderRadius: 100, padding: '1px 6px' }}>ลงเวลาแล้ว</span>}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.start}-{s.end}</span>
                    </button>
                  )
                })}
                {manualShiftId && (
                  <button
                    type="button"
                    onClick={() => { setManualShiftId(''); setPickerOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'transparent', border: 'none', borderTop: '1px solid #f1f5f9', marginTop: 4, padding: '8px 10px', cursor: 'pointer', color: '#64748b', fontSize: 12 }}
                  >
                    <i className="bi bi-arrow-counterclockwise" /> ใช้กะอัตโนมัติตามเวลา
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ปุ่มเข้างาน */}
      <button
        type="button"
        onClick={doCheckin}
        disabled={busy || checkedIn}
        title={checkedIn ? 'คุณลงเวลาเข้างานแล้ววันนี้' : `เข้างานกะ${shiftName}`}
        style={{
          ...btnBase,
          background: checkedIn ? '#e2e8f0' : '#0d9488',
          color: checkedIn ? '#94a3b8' : '#ffffff',
          cursor: busy || checkedIn ? 'not-allowed' : 'pointer',
        }}
      >
        <i className="bi bi-box-arrow-in-right" /> เข้า{shiftName || 'งาน'}
      </button>

      {/* ปุ่มออกงาน */}
      <button
        type="button"
        onClick={doCheckout}
        disabled={busy || !checkedIn || checkedOut}
        title={!checkedIn ? 'กรุณาลงเวลาเข้างานก่อน' : checkedOut ? 'คุณออกงานแล้ววันนี้' : 'ออกงาน'}
        style={{
          ...btnBase,
          background: '#ffffff',
          color: !checkedIn || checkedOut ? '#cbd5e1' : '#dc2626',
          borderColor: !checkedIn || checkedOut ? '#e2e8f0' : '#fecaca',
          cursor: busy || !checkedIn || checkedOut ? 'not-allowed' : 'pointer',
        }}
      >
        <i className="bi bi-box-arrow-right" /> ออกงาน{checkedOut && shiftRecord?.checkout ? ` ${fmtTime(shiftRecord.checkout)}` : ''}
      </button>
    </div>
  )
}

export default CheckinControls
