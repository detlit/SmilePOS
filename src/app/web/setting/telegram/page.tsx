'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { QRCodeSVG } from 'qrcode.react'
import {
  Send, Plus, Trash2, Copy, RefreshCw, CheckCircle2, XCircle,
  MessageSquare, Users, Clock, AlertCircle, Settings, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// axios instance ที่แนบ header x-user-level ทุกคำขอ
// (backend จะตรวจว่า level === level2 ถึงจะยอมให้แก้)
const api = axios.create()
api.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const lvl = localStorage.getItem('level_') || ''
    cfg.headers = cfg.headers || {}
    cfg.headers['x-user-level'] = lvl
  }
  return cfg
})

interface Binding {
  id: number
  company: string
  branchId: number | null
  chatId: string
  chatTitle: string
  chatType: string
  notifySale: boolean
  notifyCancel: boolean
  notifyHourly: boolean
  notifyDaily: boolean
  minAmount: number
  quietStart: string
  quietEnd: string
  isActive: boolean
}

interface BindResponse {
  id: number
  token: string
  deepLink: string
  botUsername: string
  groupCommand: string
  expiresAt: string
}

function resolveCompany(): string {
  if (typeof window === 'undefined') return ''
  const cands = [
    localStorage.getItem('company_'),
    localStorage.getItem('ci_'),
    localStorage.getItem('company'),
  ]
  for (const v of cands) {
    const s = typeof v === 'string' ? v.trim() : ''
    if (s && s !== 'undefined' && s !== 'null') return s
  }
  const token = localStorage.getItem('token') || ''
  try {
    const p = jwtDecode<any>(token)
    return String(p.idcompany ?? p.company ?? '').trim()
  } catch { return '' }
}

export default function TelegramSettingsPage() {
  const [company, setCompany] = useState('')
  const [bindings, setBindings] = useState<Binding[]>([])
  const [loading, setLoading] = useState(false)
  const [bindModal, setBindModal] = useState<BindResponse | null>(null)
  const [countdown, setCountdown] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Bot config state ───
  const [cfgModal, setCfgModal] = useState(false)
  const [cfgInfo, setCfgInfo] = useState<any>(null)
  const [cfgForm, setCfgForm] = useState({
    botToken: '',
    botUsername: '',
    webhookSecret: '',
    publicAppUrl: '',
    cronSecret: '',
  })
  const [cfgSaving, setCfgSaving] = useState(false)

  const loadCfg = useCallback(async () => {
    try {
      const res = await api.get('/api/telegram/config')
      setCfgInfo(res.data)
      setCfgForm((f) => ({
        ...f,
        botUsername: res.data.botUsername || '',
        publicAppUrl: res.data.publicAppUrl || '',
      }))
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { loadCfg() }, [loadCfg])

  const saveCfg = async () => {
    setCfgSaving(true)
    try {
      const payload: any = {}
      if (cfgForm.botToken.trim()) payload.botToken = cfgForm.botToken.trim()
      payload.botUsername = cfgForm.botUsername.trim()
      if (cfgForm.webhookSecret.trim()) payload.webhookSecret = cfgForm.webhookSecret.trim()
      payload.publicAppUrl = cfgForm.publicAppUrl.trim()
      if (cfgForm.cronSecret.trim()) payload.cronSecret = cfgForm.cronSecret.trim()
      const res = await api.post('/api/telegram/config', payload)
      if (res.data.testError) {
        alert('⚠️ บันทึกแล้ว แต่ทดสอบ token ไม่ผ่าน:\n' + res.data.testError)
      } else if (res.data.botInfo) {
        alert(`✅ เชื่อมต่อสำเร็จ!\nBot: @${res.data.botInfo.username} (${res.data.botInfo.first_name})`)
        // auto-sync username
        if (res.data.botInfo.username && res.data.botInfo.username !== cfgForm.botUsername) {
          await api.post('/api/telegram/config', { botUsername: res.data.botInfo.username })
        }
      } else {
        alert('✅ บันทึกแล้ว')
      }
      setCfgForm((f) => ({ ...f, botToken: '', webhookSecret: '', cronSecret: '' }))
      setCfgModal(false)
      loadCfg()
    } catch (e: any) {
      alert('❌ ' + (e?.response?.data?.error || e.message))
    }
    setCfgSaving(false)
  }

  const randomSecret = () => {
    const s = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    return s
  }

  useEffect(() => { setCompany(resolveCompany()) }, [])

  // ─── Permission guard (เฉพาะ level2 = เจ้าของกิจการ) ───
  const [userLevel, setUserLevel] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserLevel(localStorage.getItem('level_') || '')
    }
  }, [])
  const isOwner = userLevel === 'level2'


  const loadBindings = useCallback(async () => {
    if (!company) return
    try {
      const res = await api.get('/api/telegram/bindings', { params: { company } })
      setBindings(res.data.bindings || [])
    } catch (e) { console.error(e) }
  }, [company])

  useEffect(() => { loadBindings() }, [loadBindings])

  // Poll bind status while modal is open
  useEffect(() => {
    if (!bindModal) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/api/telegram/bind/status', { params: { id: bindModal.id } })
        if (res.data.isActive) {
          setBindModal(null)
          loadBindings()
          alert('✅ ผูก Telegram สำเร็จ!')
        } else if (res.data.expired) {
          setBindModal(null)
          alert('⌛ Token หมดอายุ กรุณาลองใหม่')
        }
      } catch {}
    }, 3000)

    const expiresAt = new Date(bindModal.expiresAt).getTime()
    const tick = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setCountdown(left)
    }, 1000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      clearInterval(tick)
    }
  }, [bindModal, loadBindings])

  const createBinding = async () => {
    if (!company) { alert('ไม่พบ company'); return }
    setLoading(true)
    try {
      const res = await api.post('/api/telegram/bind/create', { company })
      setBindModal(res.data)
    } catch (e: any) {
      alert('❌ ' + (e?.response?.data?.error || e.message))
    }
    setLoading(false)
  }

  const deleteBinding = async (id: number) => {
    if (!confirm('ยกเลิกการแจ้งเตือนนี้?')) return
    try {
      await api.delete('/api/telegram/bindings', { params: { id } })
      loadBindings()
    } catch (e: any) { alert('❌ ' + e.message) }
  }

  const toggleNotify = async (b: Binding, field: keyof Binding, value: boolean) => {
    try {
      await api.patch('/api/telegram/bindings', { id: b.id, [field]: value })
      loadBindings()
    } catch (e: any) { alert('❌ ' + e.message) }
  }

  const testNotify = async (id: number) => {
    try {
      await api.post('/api/telegram/test', { id })
      alert('✅ ส่งข้อความทดสอบแล้ว')
    } catch (e: any) {
      alert('❌ ' + (e?.response?.data?.error || e.message))
    }
  }

  const copyText = (t: string) => {
    navigator.clipboard.writeText(t)
    alert('คัดลอกแล้ว')
  }

  const runCronNow = async (type: 'hourly' | 'daily' | 'weekly') => {
    const label = type === 'hourly' ? 'รายชั่วโมง' : type === 'daily' ? 'รายวัน' : 'Top 10 สินค้าประจำสัปดาห์'
    if (!confirm(`ส่งสรุป${label}ตอนนี้เลย?`)) return
    try {
      await api.get(`/api/telegram/cron/${type}`)
      alert('✅ ส่งแล้ว (ถ้ามีบิลในช่วงเวลานั้น)')
    } catch (e: any) {
      alert('❌ ' + (e?.response?.data?.error || e.message))
    }
  }

  const fmtCountdown = (sec: number) => {
    const m = Math.floor(sec / 60), s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // ─── Guard render (หลังเรียก hooks ทั้งหมดแล้ว) ───
  if (userLevel === null) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Kanit' }}>กำลังตรวจสอบสิทธิ์...</div>
  }
  if (!isOwner) {
    return (
      <div style={{ padding: 40, maxWidth: 560, margin: '60px auto', fontFamily: 'Kanit', textAlign: 'center' }}>
        <div style={{
          background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 16, padding: 32,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#991B1B', margin: 0 }}>
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p style={{ color: '#7F1D1D', marginTop: 12, fontSize: 14 }}>
            หน้านี้เฉพาะ <b>เจ้าของกิจการ</b> เท่านั้น<br />
            การตั้งค่า Telegram มีผลต่อการแจ้งเตือนทั้งระบบ
          </p>
          <Button
            onClick={() => { if (typeof window !== 'undefined') window.history.back() }}
            style={{ marginTop: 16, background: '#991B1B', color: '#fff', fontFamily: 'Kanit' }}
          >
            ← ย้อนกลับ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'Kanit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => { if (typeof window !== 'undefined') window.history.back() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 12px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: '#fff',
            color: '#334155', fontFamily: 'Kanit', fontSize: 13,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }}
          title="ย้อนกลับ"
        >
          <ArrowLeft size={16} /> ย้อนกลับ
        </button>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: '#0088CC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Send size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Telegram Notifications</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>แจ้งเตือนบิลขาย ยกเลิก และสรุปยอดขายผ่าน Telegram</div>
        </div>
      </div>

      {/* Bot config status */}
      <div style={{
        marginBottom: 16, padding: 12, borderRadius: 10,
        background: cfgInfo?.hasToken ? '#EDF9F3' : '#FEF3C7',
        border: `1px solid ${cfgInfo?.hasToken ? '#74CCA4' : '#FCD34D'}`,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {cfgInfo?.hasToken
              ? <>✅ ตั้งค่า Bot แล้ว {cfgInfo.botUsername && <span style={{ color: '#0088CC' }}>@{cfgInfo.botUsername}</span>}</>
              : <>⚠️ ยังไม่ได้ตั้งค่า Bot Token</>}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            {cfgInfo?.hasToken
              ? `Token: ${cfgInfo.tokenMasked}${cfgInfo.hasWebhookSecret ? ' • มี Webhook Secret' : ''}${cfgInfo.publicAppUrl ? ` • ${cfgInfo.publicAppUrl}` : ''}`
              : 'ต้องตั้งค่า Bot Token จาก @BotFather ก่อนจึงจะใช้งานได้'}
          </div>
        </div>
        <Button
          onClick={() => { loadCfg(); setCfgModal(true); }}
          style={{ background: '#0088CC', color: '#fff', fontFamily: 'Kanit' }}
        >
          <Settings size={14} style={{ marginRight: 6 }} />
          ตั้งค่า Bot
        </Button>
      </div>

      {/* Add button */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          onClick={createBinding}
          disabled={loading}
          style={{ background: '#0088CC', color: '#fff', fontFamily: 'Kanit' }}
        >
          <Plus size={16} style={{ marginRight: 6 }} />
          เพิ่มการแจ้งเตือน
        </Button>
        <Button
          variant="outline"
          onClick={() => runCronNow('hourly')}
          style={{ fontFamily: 'Kanit' }}
        >
          📊 ส่งสรุปรายชั่วโมงเดี๋ยวนี้
        </Button>
        <Button
          variant="outline"
          onClick={() => runCronNow('daily')}
          style={{ fontFamily: 'Kanit' }}
        >
          🌙 ส่งสรุปรายวันเดี๋ยวนี้
        </Button>
        <Button
          variant="outline"
          onClick={() => runCronNow('weekly')}
          style={{ fontFamily: 'Kanit' }}
        >
          🏆 Top 10 สินค้าประจำสัปดาห์
        </Button>
      </div>

      {/* Bindings list */}
      {bindings.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', background: '#F8FAFC',
          borderRadius: 12, border: '2px dashed #E2E8F0', color: '#64748B',
        }}>
          <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>ยังไม่ได้ผูกการแจ้งเตือน Telegram</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>กด "เพิ่มการแจ้งเตือน" เพื่อเริ่มต้น</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bindings.map(b => (
            <div
              key={b.id}
              style={{
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
                padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: '#E5EEF8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {b.chatType === 'group' || b.chatType === 'supergroup'
                      ? <Users size={18} color="#2A6AAA" />
                      : <MessageSquare size={18} color="#2A6AAA" />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {b.chatTitle || `Chat ${b.chatId}`}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      {b.chatType} · ID: {b.chatId}
                      {b.branchId && <> · สาขา: {b.branchId}</>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="outline" onClick={() => testNotify(b.id)} style={{ fontFamily: 'Kanit' }}>
                    <Send size={12} style={{ marginRight: 4 }} /> ทดสอบ
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteBinding(b.id)} style={{ color: '#EF4444', fontFamily: 'Kanit' }}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              {/* Toggle switches */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { key: 'notifySale', label: '🛒 บิลขาย', val: b.notifySale },
                  { key: 'notifyCancel', label: '❌ ยกเลิก', val: b.notifyCancel },
                  { key: 'notifyHourly', label: '📊 สรุปรายชั่วโมง', val: b.notifyHourly },
                  { key: 'notifyDaily', label: '🌙 สรุปปิดวัน', val: b.notifyDaily },
                ].map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: item.val ? '#F3F8FC' : '#F8FAFC',
                      border: '1px solid ' + (item.val ? '#CCDFF1' : '#E2E8F0'),
                      fontSize: 12, userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={e => toggleNotify(b, item.key as any, e.target.checked)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bind modal */}
      {bindModal && (
        <div
          onClick={() => setBindModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%',
              fontFamily: 'Kanit',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📱 ผูก Telegram</h2>
              <button onClick={() => setBindModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            {!bindModal.botUsername ? (
              <div style={{ padding: 16, background: '#FEF3C7', borderRadius: 8, color: '#92400E', fontSize: 13 }}>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                ยังไม่ได้ตั้งค่า <b>Bot Username</b> — กดปุ่ม "ตั้งค่า Bot" ด้านบนก่อน
                <br /><br />
                หรือใช้คำสั่งในกลุ่มแทน: <br />
                <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4 }}>{bindModal.groupCommand}</code>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'inline-block', padding: 12, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
                    <QRCodeSVG value={bindModal.deepLink} size={180} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>สแกน QR ด้วยแอป Telegram</div>
                </div>

                <a
                  href={bindModal.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', padding: '12px',
                    background: '#0088CC', color: '#fff', borderRadius: 10, textDecoration: 'none',
                    fontSize: 14, fontWeight: 600, marginBottom: 10,
                  }}
                >
                  📱 เปิด Telegram บนอุปกรณ์นี้
                </a>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                  <div style={{ color: '#64748B', marginBottom: 4 }}>💡 ต้องการแจ้งเตือนใน<b>กลุ่ม</b>?</div>
                  <div>1. เพิ่มบอท <b>@{bindModal.botUsername}</b> เข้ากลุ่ม</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    2. พิมพ์คำสั่ง:
                    <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4, flex: 1 }}>
                      {bindModal.groupCommand}
                    </code>
                    <button
                      onClick={() => copyText(bindModal.groupCommand)}
                      style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </>
            )}

            <div style={{
              textAlign: 'center', padding: 10, background: '#F3F8FC', borderRadius: 8,
              color: '#1E5088', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <RefreshCw size={14} className="animate-spin" />
              กำลังรอการยืนยัน... หมดอายุใน <b>{fmtCountdown(countdown)}</b>
            </div>
          </div>
        </div>
      )}

      {/* Config modal */}
      {cfgModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24, width: 560, maxWidth: '92vw',
            maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Kanit',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                <Settings size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: '-3px' }} />
                ตั้งค่า Telegram Bot
              </h3>
              <button onClick={() => setCfgModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle size={22} color="#94A3B8" />
              </button>
            </div>

            <div style={{
              background: '#F3F8FC', border: '1px solid #CCDFF1', borderRadius: 8,
              padding: 12, fontSize: 12, color: '#1E5088', marginBottom: 16,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>💡 วิธีหา Bot Token</div>
              <div>1. เปิด Telegram → ค้นหา <b>@BotFather</b> → กด Start</div>
              <div>2. ส่งคำสั่ง <code>/newbot</code> → ตั้งชื่อ และ username (ต้องลงท้าย bot)</div>
              <div>3. BotFather จะส่ง <b>token</b> กลับมาให้คัดลอกมาใส่ช่องด้านล่าง</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Bot Token *</label>
                {cfgInfo?.hasToken && (
                  <span style={{ fontSize: 11, color: '#3E86C7', marginLeft: 8 }}>
                    (ตั้งไว้แล้ว: {cfgInfo.tokenMasked} — เว้นว่างถ้าไม่ต้องการเปลี่ยน)
                  </span>
                )}
                <Input
                  type="password"
                  placeholder="123456789:AAH..."
                  value={cfgForm.botToken}
                  onChange={(e) => setCfgForm({ ...cfgForm, botToken: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Bot Username</label>
                <div style={{ fontSize: 11, color: '#64748B' }}>ไม่ต้องใส่ @ (เช่น SmilePOSBot) — จะดึงอัตโนมัติเมื่อบันทึก</div>
                <Input
                  placeholder="SmilePOSNotifyBot"
                  value={cfgForm.botUsername}
                  onChange={(e) => setCfgForm({ ...cfgForm, botUsername: e.target.value.replace(/^@/, '') })}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Webhook Secret</label>
                <div style={{ fontSize: 11, color: '#64748B' }}>ใช้ป้องกัน webhook endpoint (จำเป็นถ้าจะใช้ปุ่มตอบกลับ)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Input
                    placeholder={cfgInfo?.hasWebhookSecret ? '(ตั้งไว้แล้ว — เว้นว่างถ้าไม่เปลี่ยน)' : 'สุ่มหรือพิมพ์เอง'}
                    value={cfgForm.webhookSecret}
                    onChange={(e) => setCfgForm({ ...cfgForm, webhookSecret: e.target.value })}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCfgForm({ ...cfgForm, webhookSecret: randomSecret() })}
                    style={{ fontFamily: 'Kanit', whiteSpace: 'nowrap' }}
                  >
                    <RefreshCw size={12} style={{ marginRight: 4 }} /> สุ่ม
                  </Button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Public App URL</label>
                <div style={{ fontSize: 11, color: '#64748B' }}>URL สาธารณะแบบ HTTPS (เช่น https://pos.yourdomain.com) — ใช้สำหรับลิงก์ "ดูบิล" และ webhook</div>
                <Input
                  placeholder="https://your-domain.com"
                  value={cfgForm.publicAppUrl}
                  onChange={(e) => setCfgForm({ ...cfgForm, publicAppUrl: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Cron Secret</label>
                <div style={{ fontSize: 11, color: '#64748B' }}>ใช้ป้องกัน endpoint สรุปอัตโนมัติ (รายชั่วโมง/รายวัน)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Input
                    placeholder={cfgInfo?.hasCronSecret ? '(ตั้งไว้แล้ว — เว้นว่างถ้าไม่เปลี่ยน)' : 'สุ่มหรือพิมพ์เอง'}
                    value={cfgForm.cronSecret}
                    onChange={(e) => setCfgForm({ ...cfgForm, cronSecret: e.target.value })}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCfgForm({ ...cfgForm, cronSecret: randomSecret() })}
                    style={{ fontFamily: 'Kanit', whiteSpace: 'nowrap' }}
                  >
                    <RefreshCw size={12} style={{ marginRight: 4 }} /> สุ่ม
                  </Button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setCfgModal(false)} style={{ fontFamily: 'Kanit' }}>
                ยกเลิก
              </Button>
              <Button
                onClick={saveCfg}
                disabled={cfgSaving}
                style={{ background: '#0088CC', color: '#fff', fontFamily: 'Kanit' }}
              >
                {cfgSaving ? 'กำลังบันทึก...' : '💾 บันทึก + ทดสอบ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
