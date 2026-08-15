'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'sonner'
import {
  Settings, Plus, Trash2, Edit2, Save, X, MessageCircle,
  Link2, CheckCircle, XCircle, Zap, Hash, ArrowLeft, RefreshCw, Key
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const platformOptions = [
  { value: 'LINE', label: 'LINE OA', color: '#06C755', icon: '🟢', guide: 'ไปที่ LINE Developers Console → Messaging API → Channel Access Token & Channel Secret' },
  { value: 'FACEBOOK', label: 'Facebook Page', color: '#1877F2', icon: '🔵', guide: 'ไปที่ Meta for Developers → App → Messenger → Page Access Token & App Secret' },
  { value: 'TIKTOK', label: 'TikTok', color: '#000000', icon: '⬛', guide: 'ไปที่ TikTok for Business → Developer Portal → App → Access Token & Secret' },
  { value: 'WEB', label: 'Web Chat', color: '#6366F1', icon: '🟣', guide: 'ฝัง Chat Widget บนเว็บไซต์ของคุณ (ไม่ต้องตั้งค่า Token)' },
]

interface Channel {
  id: number; platform: string; channelName: string; accessToken: string;
  channelSecret: string; pageId: string; isActive: boolean; webhookUrl: string;
}

interface QuickReply {
  id: number; title: string; content: string; category: string; shortcut: string;
}

interface ChatJwtPayload {
  idcompany?: number | string
  company?: string
}

const resolveStoredCompany = () => {
  if (typeof window === 'undefined') return ''

  const candidates = [
    localStorage.getItem('company_'),
    localStorage.getItem('ci_'),
    localStorage.getItem('cp_'),
    localStorage.getItem('company'),
  ]

  for (const value of candidates) {
    const normalized = typeof value === 'string' ? value.trim() : ''
    if (normalized && normalized !== 'undefined' && normalized !== 'null') {
      return normalized
    }
  }

  const token = localStorage.getItem('token') || ''
  if (!token.trim()) return ''

  try {
    const payload = jwtDecode<ChatJwtPayload>(token)
    const companyFromToken = String(payload.idcompany ?? payload.company ?? '').trim()
    if (!companyFromToken || companyFromToken === 'undefined' || companyFromToken === 'null') {
      return ''
    }

    localStorage.setItem('company_', companyFromToken)
    return companyFromToken
  } catch (error) {
    console.error('Decode token for company failed:', error)
    return ''
  }
}

export default function ChatSettingsPage() {
  const [company, setCompany] = useState('')
  const [activeTab, setActiveTab] = useState<'channels' | 'quick-replies' | 'webhooks'>('channels')

  // ===== Channels State =====
  const [channels, setChannels] = useState<Channel[]>([])
  const [editingChannel, setEditingChannel] = useState<Partial<Channel> | null>(null)
  const [showAddChannel, setShowAddChannel] = useState(false)

  // ===== Facebook Token Exchange State =====
  const [showFbExchange, setShowFbExchange] = useState(false)
  const [fbAppId, setFbAppId] = useState('')
  const [fbAppSecret, setFbAppSecret] = useState('')
  const [fbShortToken, setFbShortToken] = useState('')
  const [fbPages, setFbPages] = useState<{id: string; name: string; accessToken: string}[]>([])
  const [fbExchangeLoading, setFbExchangeLoading] = useState(false)
  const [fbExchangeResult, setFbExchangeResult] = useState<string | null>(null)

  // ===== Quick Replies State =====
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [editingQR, setEditingQR] = useState<Partial<QuickReply> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setCompany(resolveStoredCompany())
  }, [])

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const responseMessage = error.response?.data?.error
      if (typeof responseMessage === 'string' && responseMessage.trim()) {
        return responseMessage
      }
      return error.message
    }

    if (error instanceof Error && error.message) {
      return error.message
    }

    return fallback
  }

  const ensureCompany = () => {
    if (company.trim()) return true
    toast.error('ไม่พบข้อมูลบริษัท กรุณาเข้าสู่ระบบใหม่')
    return false
  }

  // ===== Fetch data =====
  useEffect(() => {
    if (!company) return
    void fetchChannels()
    void fetchQuickReplies()
  }, [company])

  const fetchChannels = async () => {
    if (!company.trim()) return
    try {
      const res = await axios.get('/api/chat/channels', { params: { company } })
      setChannels(res.data.channels || [])
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'โหลดช่องทางแชทไม่สำเร็จ'))
    }
  }

  const fetchQuickReplies = async () => {
    if (!company.trim()) return
    try {
      const res = await axios.get('/api/chat/quick-replies', { params: { company } })
      setQuickReplies(res.data.quickReplies || [])
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'โหลดข้อความด่วนไม่สำเร็จ'))
    }
  }

  // ===== Facebook Token Exchange =====
  const exchangeFbToken = async () => {
    if (!fbShortToken || !fbAppId || !fbAppSecret) {
      toast.error('กรุณากรอก App ID, App Secret และ Short-Lived Token')
      return
    }
    setFbExchangeLoading(true)
    setFbExchangeResult(null)
    setFbPages([])
    try {
      const res = await axios.post('/api/chat/facebook-token', {
        channelId: editingChannel?.id,
        shortLivedToken: fbShortToken,
        appId: fbAppId,
        appSecret: fbAppSecret,
      })
      if (res.data.pages) setFbPages(res.data.pages)
      if (res.data.page) {
        // Auto-saved
        setFbExchangeResult(`✅ ${res.data.message}`)
        setShowFbExchange(false)
        await fetchChannels()
        toast.success(res.data.message)
      } else {
        setFbExchangeResult(`พบ ${res.data.pages?.length || 0} Pages — เลือก Page ด้านล่าง`)
      }
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'แลก Token ไม่สำเร็จ'))
    }
    setFbExchangeLoading(false)
  }

  const saveFbPageToken = async (page: {id: string; name: string; accessToken: string}) => {
    if (!editingChannel?.id) {
      // Not saved yet - just put it in the form
      setEditingChannel({ ...editingChannel, accessToken: page.accessToken, pageId: page.id })
      setShowFbExchange(false)
      setFbPages([])
      toast.success(`ใส่ Permanent Token ของ ${page.name} ในฟอร์มแล้ว — กดบันทึกเพื่อยืนยัน`)
      return
    }
    try {
      await axios.patch('/api/chat/facebook-token', {
        channelId: editingChannel.id,
        pageAccessToken: page.accessToken,
        pageId: page.id,
        pageName: page.name,
      })
      setShowFbExchange(false)
      setFbPages([])
      await fetchChannels()
      toast.success(`บันทึก Permanent Token ของ ${page.name} เรียบร้อย ✅`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'บันทึก Token ไม่สำเร็จ'))
    }
  }

  // ===== Channel CRUD =====
  const saveChannel = async () => {
    if (!editingChannel) return

    if (!ensureCompany()) return

    const payload = {
      id: editingChannel.id,
      company: company.trim(),
      platform: editingChannel.platform?.trim() || '',
      channelName: editingChannel.channelName?.trim() || '',
      accessToken: editingChannel.accessToken?.trim() || '',
      channelSecret: editingChannel.channelSecret?.trim() || '',
      pageId: editingChannel.pageId?.trim() || '',
    }

    if (!payload.platform) {
      toast.error('กรุณาเลือก Platform')
      return
    }

    try {
      await axios.post('/api/chat/channels', payload)
      setEditingChannel(null)
      setShowAddChannel(false)
      await fetchChannels()
      toast.success(payload.id ? 'บันทึกช่องทางเรียบร้อยแล้ว' : 'เพิ่มช่องทางเรียบร้อยแล้ว')
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'บันทึกช่องทางไม่สำเร็จ'))
    }
  }

  const deleteChannel = async (id: number) => {
    if (!confirm('ยืนยันลบช่องทางนี้?')) return
    try {
      await axios.delete('/api/chat/channels', { params: { id } })
      await fetchChannels()
      toast.success('ลบช่องทางเรียบร้อยแล้ว')
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'ลบช่องทางไม่สำเร็จ'))
    }
  }

  // ===== Quick Reply CRUD =====
  const saveQuickReply = async () => {
    if (!editingQR) return

    if (!ensureCompany()) return

    const payload = {
      id: editingQR.id,
      company: company.trim(),
      title: editingQR.title?.trim() || '',
      content: editingQR.content?.trim() || '',
      category: editingQR.category?.trim() || '',
      shortcut: editingQR.shortcut?.trim() || '',
    }

    if (!payload.title) {
      toast.error('กรุณากรอกหัวข้อความด่วน')
      return
    }

    if (!payload.content) {
      toast.error('กรุณากรอกเนื้อหาข้อความด่วน')
      return
    }

    try {
      await axios.post('/api/chat/quick-replies', payload)
      setEditingQR(null)
      await fetchQuickReplies()
      toast.success(payload.id ? 'บันทึกข้อความด่วนเรียบร้อยแล้ว' : 'เพิ่มข้อความด่วนเรียบร้อยแล้ว')
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'บันทึกข้อความด่วนไม่สำเร็จ'))
    }
  }

  const deleteQuickReply = async (id: number) => {
    if (!confirm('ยืนยันลบข้อความด่วนนี้?')) return
    try {
      await axios.delete('/api/chat/quick-replies', { params: { id } })
      await fetchQuickReplies()
      toast.success('ลบข้อความด่วนเรียบร้อยแล้ว')
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'ลบข้อความด่วนไม่สำเร็จ'))
    }
  }

  // ===== Base URL for webhooks =====
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div style={{ padding: 24, fontFamily: 'Kanit', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <ArrowLeft size={22} color="#64748B" style={{ cursor: 'pointer' }}
          onClick={() => window.location.href = '/web/chat'} />
        <Settings size={24} color="#6366F1" />
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1E293B', margin: 0 }}>
          ตั้งค่าแชท Omnichannel
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #E2E8F0' }}>
        {[
          { key: 'channels' as const, icon: <Link2 size={14} />, label: 'ช่องทางเชื่อมต่อ' },
          { key: 'quick-replies' as const, icon: <Zap size={14} />, label: 'ข้อความด่วน' },
          { key: 'webhooks' as const, icon: <Hash size={14} />, label: 'Webhook URLs' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer',
              background: 'none', fontFamily: 'Kanit', fontSize: 13,
              color: activeTab === tab.key ? '#6366F1' : '#64748B',
              fontWeight: activeTab === tab.key ? 600 : 400,
              borderBottom: activeTab === tab.key ? '2px solid #6366F1' : '2px solid transparent',
              marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Channels Tab ===== */}
      {activeTab === 'channels' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              เชื่อมต่อช่องทางสื่อสารกับลูกค้าจาก LINE OA, Facebook Page, TikTok
            </p>
            <Button
              onClick={() => { setShowAddChannel(true); setEditingChannel({ platform: 'LINE' }) }}
              style={{ background: '#6366F1', color: '#FFF', fontSize: 12, fontFamily: 'Kanit' }}
            >
              <Plus size={14} style={{ marginRight: 4 }} /> เพิ่มช่องทาง
            </Button>
          </div>

          {/* Add/Edit Channel Form */}
          {(showAddChannel || editingChannel?.id) && editingChannel && (
            <div style={{
              background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12,
              padding: 20, marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 16 }}>
                {editingChannel.id ? 'แก้ไขช่องทาง' : 'เพิ่มช่องทางใหม่'}
              </div>

              {/* Platform selector */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>Platform</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {platformOptions.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setEditingChannel({ ...editingChannel, platform: p.value })}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '2px solid',
                        borderColor: editingChannel.platform === p.value ? p.color : '#E2E8F0',
                        background: editingChannel.platform === p.value ? `${p.color}10` : '#FFF',
                        cursor: 'pointer', fontFamily: 'Kanit', fontSize: 12,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                  {platformOptions.find(p => p.value === editingChannel.platform)?.guide}
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>ชื่อช่องทาง</label>
                  <Input
                    value={editingChannel.channelName || ''}
                    onChange={e => setEditingChannel({ ...editingChannel, channelName: e.target.value })}
                    placeholder="เช่น ร้านค้า ABC LINE"
                    style={{ fontSize: 12, fontFamily: 'Kanit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>Page ID (ถ้ามี)</label>
                  <Input
                    value={editingChannel.pageId || ''}
                    onChange={e => setEditingChannel({ ...editingChannel, pageId: e.target.value })}
                    placeholder="Page ID"
                    style={{ fontSize: 12, fontFamily: 'Kanit' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>Access Token</label>
                  <Input
                    type="password"
                    value={editingChannel.accessToken || ''}
                    onChange={e => setEditingChannel({ ...editingChannel, accessToken: e.target.value })}
                    placeholder="Channel Access Token"
                    style={{ fontSize: 12, fontFamily: 'Kanit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>Channel Secret</label>
                  <Input
                    type="password"
                    value={editingChannel.channelSecret || ''}
                    onChange={e => setEditingChannel({ ...editingChannel, channelSecret: e.target.value })}
                    placeholder="Channel Secret / App Secret"
                    style={{ fontSize: 12, fontFamily: 'Kanit' }}
                  />
                </div>
              </div>

              {/* Facebook Permanent Token Exchange */}
              {editingChannel.platform === 'FACEBOOK' && (
                <div style={{
                  marginBottom: 16, padding: 14, borderRadius: 10,
                  background: '#F3F8FC', border: '1px solid #CCDFF1',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFbExchange ? 12 : 0,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#173F6B', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Key size={14} /> สร้าง Permanent Token (ไม่หมดอายุ)
                      </div>
                      <div style={{ fontSize: 11, color: '#3E86C7', marginTop: 2 }}>
                        แปลง Short-Lived Token เป็น Permanent Page Token ที่ไม่มีวันหมดอายุ
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => { setShowFbExchange(!showFbExchange); setFbPages([]); setFbExchangeResult(null) }}
                      style={{ fontSize: 11, fontFamily: 'Kanit', borderColor: '#3E86C7', color: '#173F6B' }}
                    >
                      <RefreshCw size={12} style={{ marginRight: 4 }} />
                      {showFbExchange ? 'ซ่อน' : 'แลก Token'}
                    </Button>
                  </div>

                  {showFbExchange && (
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10, lineHeight: 1.6, background: '#FFF', padding: 10, borderRadius: 8 }}>
                        <strong>วิธีหา Short-Lived Token:</strong><br />
                        1. ไปที่ <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" style={{ color: '#1877F2', textDecoration: 'underline' }}>Graph API Explorer</a><br />
                        2. เลือก App ของคุณ → กด "Generate Access Token"<br />
                        3. เลือกสิทธิ์: <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: 3 }}>pages_messaging</code>, <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: 3 }}>pages_read_engagement</code>, <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: 3 }}>pages_manage_metadata</code><br />
                        4. คัดลอก Token มาวางด้านล่าง
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, color: '#64748B', marginBottom: 2, display: 'block' }}>App ID</label>
                          <Input value={fbAppId} onChange={e => setFbAppId(e.target.value)}
                            placeholder="App ID จาก Meta for Developers"
                            style={{ fontSize: 11, fontFamily: 'Kanit' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: '#64748B', marginBottom: 2, display: 'block' }}>App Secret</label>
                          <Input type="password" value={fbAppSecret} onChange={e => setFbAppSecret(e.target.value)}
                            placeholder="App Secret จาก Meta for Developers"
                            style={{ fontSize: 11, fontFamily: 'Kanit' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 11, color: '#64748B', marginBottom: 2, display: 'block' }}>Short-Lived User Token</label>
                        <Input value={fbShortToken} onChange={e => setFbShortToken(e.target.value)}
                          placeholder="วาง Token จาก Graph API Explorer"
                          style={{ fontSize: 11, fontFamily: 'monospace' }} />
                      </div>

                      <Button onClick={exchangeFbToken} disabled={fbExchangeLoading}
                        style={{ background: '#1877F2', color: '#FFF', fontSize: 12, fontFamily: 'Kanit', width: '100%' }}>
                        {fbExchangeLoading ? (
                          <><RefreshCw size={14} style={{ marginRight: 6, animation: 'spin 1s linear infinite' }} /> กำลังแลก Token...</>
                        ) : (
                          <><Key size={14} style={{ marginRight: 6 }} /> แลกเป็น Permanent Token</>
                        )}
                      </Button>

                      {fbExchangeResult && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#173F6B', fontWeight: 500 }}>
                          {fbExchangeResult}
                        </div>
                      )}

                      {/* Page selection */}
                      {fbPages.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6, fontWeight: 600 }}>เลือก Page เพื่อบันทึก Permanent Token:</div>
                          {fbPages.map(page => (
                            <div key={page.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 10px', background: '#FFF', borderRadius: 8, marginBottom: 4,
                              border: '1px solid #E2E8F0',
                            }}>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>🔵 {page.name}</div>
                                <div style={{ fontSize: 10, color: '#94A3B8' }}>ID: {page.id}</div>
                              </div>
                              <Button onClick={() => saveFbPageToken(page)}
                                style={{ background: '#3E86C7', color: '#FFF', fontSize: 11, fontFamily: 'Kanit', padding: '4px 12px' }}>
                                <CheckCircle size={12} style={{ marginRight: 4 }} /> ใช้ Token นี้
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={saveChannel}
                  style={{ background: '#6366F1', color: '#FFF', fontSize: 12, fontFamily: 'Kanit' }}>
                  <Save size={14} style={{ marginRight: 4 }} /> บันทึก
                </Button>
                <Button variant="outline" onClick={() => { setEditingChannel(null); setShowAddChannel(false) }}
                  style={{ fontSize: 12, fontFamily: 'Kanit' }}>
                  <X size={14} style={{ marginRight: 4 }} /> ยกเลิก
                </Button>
              </div>
            </div>
          )}

          {/* Channel list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {channels.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 40, background: '#FFF',
                borderRadius: 12, border: '1px solid #E2E8F0',
              }}>
                <Link2 size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: '#94A3B8' }}>ยังไม่มีช่องทางเชื่อมต่อ</div>
                <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>
                  เพิ่ม LINE OA, Facebook Page, หรือ TikTok เพื่อเริ่มรับข้อความ
                </div>
              </div>
            ) : channels.map(ch => {
              const platform = platformOptions.find(p => p.value === ch.platform)
              return (
                <div
                  key={ch.id}
                  style={{
                    background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10,
                    padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${platform?.color || '#6366F1'}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {platform?.icon || '💬'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                        {ch.channelName || platform?.label || ch.platform}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '0 5px', borderRadius: 4, fontSize: 10,
                          background: `${platform?.color || '#6366F1'}15`,
                          color: platform?.color || '#6366F1',
                        }}>
                          {platform?.label || ch.platform}
                        </span>
                        {ch.isActive ? (
                          <span style={{ color: '#3E86C7', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CheckCircle size={10} /> เชื่อมต่อแล้ว
                          </span>
                        ) : (
                          <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <XCircle size={10} /> ไม่ได้เชื่อมต่อ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="ghost" size="sm"
                      onClick={() => setEditingChannel(ch)}
                      style={{ color: '#64748B' }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm"
                      onClick={() => deleteChannel(ch.id)}
                      style={{ color: '#EF4444' }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== Quick Replies Tab ===== */}
      {activeTab === 'quick-replies' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              ตั้งค่าข้อความด่วนสำหรับตอบลูกค้าอย่างรวดเร็ว (Ctrl+/ ใช้ในหน้าแชท)
            </p>
            <Button
              onClick={() => setEditingQR({ title: '', content: '', category: '', shortcut: '' })}
              style={{ background: '#6366F1', color: '#FFF', fontSize: 12, fontFamily: 'Kanit' }}
            >
              <Plus size={14} style={{ marginRight: 4 }} /> เพิ่มข้อความด่วน
            </Button>
          </div>

          {/* Add/Edit Quick Reply Form */}
          {editingQR && (
            <div style={{
              background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12,
              padding: 20, marginBottom: 16,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>หัวข้อ</label>
                  <Input
                    value={editingQR.title || ''}
                    onChange={e => setEditingQR({ ...editingQR, title: e.target.value })}
                    placeholder="เช่น ทักทายลูกค้า"
                    style={{ fontSize: 12, fontFamily: 'Kanit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>หมวดหมู่</label>
                  <Input
                    value={editingQR.category || ''}
                    onChange={e => setEditingQR({ ...editingQR, category: e.target.value })}
                    placeholder="เช่น ทักทาย, ปิดการขาย"
                    style={{ fontSize: 12, fontFamily: 'Kanit' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>เนื้อหาข้อความ</label>
                <textarea
                  value={editingQR.content || ''}
                  onChange={e => setEditingQR({ ...editingQR, content: e.target.value })}
                  placeholder="สวัสดีค่ะ ยินดีให้บริการ มีอะไรให้ช่วยเหลือคะ?"
                  rows={3}
                  style={{
                    width: '100%', fontSize: 12, fontFamily: 'Kanit', padding: '8px 12px',
                    border: '1px solid #E2E8F0', borderRadius: 8, resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={saveQuickReply}
                  style={{ background: '#6366F1', color: '#FFF', fontSize: 12, fontFamily: 'Kanit' }}>
                  <Save size={14} style={{ marginRight: 4 }} /> บันทึก
                </Button>
                <Button variant="outline" onClick={() => setEditingQR(null)}
                  style={{ fontSize: 12, fontFamily: 'Kanit' }}>
                  <X size={14} style={{ marginRight: 4 }} /> ยกเลิก
                </Button>
              </div>
            </div>
          )}

          {/* Quick reply list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickReplies.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 40, background: '#FFF',
                borderRadius: 12, border: '1px solid #E2E8F0',
              }}>
                <Zap size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: '#94A3B8' }}>ยังไม่มีข้อความด่วน</div>
              </div>
            ) : quickReplies.map(qr => (
              <div key={qr.id} style={{
                background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10,
                padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{qr.title}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{qr.content}</div>
                  {qr.category && (
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4, marginTop: 4,
                      background: '#F1F5F9', color: '#64748B', display: 'inline-block',
                    }}>
                      {qr.category}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="ghost" size="sm" onClick={() => setEditingQR(qr)} style={{ color: '#64748B' }}>
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteQuickReply(qr.id)} style={{ color: '#EF4444' }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Webhooks Tab ===== */}
      {activeTab === 'webhooks' && (
        <div>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
            คัดลอก Webhook URL ด้านล่างไปตั้งค่าในแต่ละ Platform เพื่อรับข้อความ
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { platform: 'LINE OA', icon: '🟢', url: `${baseUrl}/api/chat/webhook/line`, desc: 'ใช้ใน LINE Developers Console → Messaging API → Webhook URL' },
              { platform: 'Facebook Page', icon: '🔵', url: `${baseUrl}/api/chat/webhook/facebook`, desc: 'ใช้ใน Meta for Developers → App → Webhooks → Callback URL' },
              { platform: 'TikTok', icon: '⬛', url: `${baseUrl}/api/chat/webhook/tiktok`, desc: 'ใช้ใน TikTok Developer Portal → App → Webhook URL' },
            ].map(wh => (
              <div key={wh.platform} style={{
                background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10,
                padding: '14px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{wh.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{wh.platform}</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#F8FAFC', borderRadius: 8, padding: '8px 12px',
                  border: '1px solid #E2E8F0',
                }}>
                  <code style={{ flex: 1, fontSize: 12, color: '#334155', wordBreak: 'break-all' }}>
                    {wh.url}
                  </code>
                  <Button variant="outline" size="sm"
                    onClick={() => navigator.clipboard.writeText(wh.url)}
                    style={{ fontSize: 11, fontFamily: 'Kanit', flexShrink: 0 }}>
                    คัดลอก
                  </Button>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                  {wh.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Setup guide */}
          <div style={{
            marginTop: 24, padding: 16, background: '#6366F108', borderRadius: 12,
            border: '1px solid #6366F120',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#6366F1', marginBottom: 10 }}>
              📋 ขั้นตอนการเชื่อมต่อ
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 2 }}>
              <div><strong>LINE OA:</strong> 1) เข้า LINE Developers → สร้าง Messaging API Channel → 2) คัดลอก Channel Access Token & Secret → 3) วาง Webhook URL → 4) เปิด Use webhook</div>
              <div><strong>Facebook:</strong> 1) สร้าง App ใน Meta for Developers → 2) เพิ่ม Messenger product → 3) เชื่อมกับ Page → 4) ตั้ง Webhook URL & Verify Token (ใส่ Channel Secret)</div>
              <div><strong>TikTok:</strong> 1) สมัคร TikTok for Business → 2) สร้าง App → 3) ตั้งค่า Webhook URL → 4) คัดลอก Access Token & Secret</div>
              <div><strong>Video Call:</strong> ใช้ WebRTC เชื่อมต่อโดยตรงจากหน้าแชท ไม่ต้องตั้งค่าเพิ่มเติม</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
