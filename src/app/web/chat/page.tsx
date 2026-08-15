'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import styles from '../componant/mystyle.module.css'
import {
  MessageCircle, Phone, Video, Search, Send, Paperclip, Smile,
  MoreVertical, User, Hash, Clock, CheckCheck, Check, X, Filter,
  Settings, Zap, ChevronDown, Image, FileText, Mic, Star,
  PhoneOff, VideoOff, Monitor, UserCheck, Tag, Archive, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import { ShoppingCart } from 'lucide-react'
import QuickSalePanel from './QuickSalePanel'

// =====================================================
// Types
// =====================================================
interface Channel {
  id: number; platform: string; channelName: string; isActive: boolean;
}
interface Contact {
  id: number; displayName: string; avatarUrl: string; platformUserId: string;
  channel: Channel; tags: string;
}
interface Message {
  id: number; conversationId: number; senderType: string; senderName: string;
  messageType: string; content: string; mediaUrl: string; isRead: boolean;
  createdAt: string; metadata: string;
}
interface Conversation {
  id: number; contactId: number; assignedTo: string; status: string;
  priority: string; lastMessageAt: string; createdAt: string;
  contact: Contact; messages: Message[];
}
interface QuickReply {
  id: number; title: string; content: string; category: string; shortcut: string;
}
interface VideoCallData {
  roomId: string; status: string; startedAt?: string; duration?: number;
}

interface ChatJwtPayload {
  idcompany?: number | string
  company?: string
}

// =====================================================
// Platform badge colors
// =====================================================
const platformConfig: Record<string, { color: string; bg: string; label: string }> = {
  LINE: { color: '#06C755', bg: '#06C75515', label: 'LINE' },
  FACEBOOK: { color: '#1877F2', bg: '#1877F215', label: 'Facebook' },
  TIKTOK: { color: '#000000', bg: '#00000010', label: 'TikTok' },
  WEB: { color: '#6366F1', bg: '#6366F115', label: 'Web' },
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  open: { color: '#3E86C7', bg: '#22C55E15', label: 'เปิด' },
  pending: { color: '#F59E0B', bg: '#F59E0B15', label: 'รอดำเนินการ' },
  resolved: { color: '#3E86C7', bg: '#3B82F615', label: 'แก้ไขแล้ว' },
  closed: { color: '#6B7280', bg: '#6B728015', label: 'ปิด' },
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

// =====================================================
// Main Chat Page Component
// =====================================================
export default function ChatPage() {
  const company = typeof window !== 'undefined' ? resolveStoredCompany() : ''
  const agentName = typeof window !== 'undefined' ? localStorage.getItem('name') || 'Agent' : 'Agent'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterUnanswered, setFilterUnanswered] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [loading, setLoading] = useState(false)
  const [videoCall, setVideoCall] = useState<VideoCallData | null>(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showQuickSale, setShowQuickSale] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // =====================================================
  // Fetch conversations
  // =====================================================
  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get('/api/chat/conversations', {
        params: { company, status: filterStatus, search: searchQuery },
      })
      setConversations(res.data.conversations || [])
      setUnreadCount(res.data.unreadCount || 0)
    } catch (e) {
      console.error('Fetch conversations error:', e)
    }
  }, [company, filterStatus, searchQuery])

  useEffect(() => {
    if (company) fetchConversations()
  }, [fetchConversations, company])

  // Poll for new messages
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (company) fetchConversations()
      if (selectedConv) fetchMessages(selectedConv.id)
    }, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [company, selectedConv])

  // =====================================================
  // Fetch messages for a conversation
  // =====================================================
  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await axios.get('/api/chat/messages', {
        params: { conversationId, limit: 50 },
      })
      setMessages(res.data.messages || [])
    } catch (e) {
      console.error('Fetch messages error:', e)
    }
  }

  // โหลดข้อความเก่ากว่านี้ (pagination ย้อนหลัง)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const loadOlderMessages = async () => {
    if (!selectedConv || messages.length === 0 || loadingOlder) return
    setLoadingOlder(true)
    try {
      const firstId = messages[0].id
      const res = await axios.get('/api/chat/messages', {
        params: { conversationId: selectedConv.id, before: firstId, limit: 50 },
      })
      const older: Message[] = res.data.messages || []
      if (older.length === 0) {
        setHasMoreOlder(false)
      } else {
        setMessages(prev => [...older, ...prev])
        if (older.length < 50) setHasMoreOlder(false)
      }
    } catch (e) {
      console.error('Load older messages error:', e)
    }
    setLoadingOlder(false)
  }

  // =====================================================
  // Select conversation
  // =====================================================
  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv)
    setShowContactInfo(false)
    setHasMoreOlder(true)
    await fetchMessages(conv.id)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // =====================================================
  // Send message
  // =====================================================
  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedConv) return
    setLoading(true)
    try {
      await axios.post('/api/chat/messages', {
        conversationId: selectedConv.id,
        agentName,
        content: inputMessage.trim(),
        messageType: 'text',
      })
      setInputMessage('')
      await fetchMessages(selectedConv.id)
      inputRef.current?.focus()
    } catch (e: any) {
      console.error('Send message error:', e)
      const errMsg = e?.response?.data?.error || e?.message || 'ส่งข้อความไม่สำเร็จ'
      alert(`❌ ${errMsg}`)
    }
    setLoading(false)
  }

  // =====================================================
  // Upload file/image and send as message
  // =====================================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0]
    if (!file || !selectedConv) return
    // Reset input so same file can be selected again
    e.target.value = ''

    setLoading(true)
    try {
      // 1. Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      const uploadRes = await axios.post('/api/chat/upload', formData)
      const { mediaUrl, messageType, fileName } = uploadRes.data

      // 2. Send as chat message
      await axios.post('/api/chat/messages', {
        conversationId: selectedConv.id,
        agentName,
        content: fileName || (type === 'image' ? 'รูปภาพ' : 'ไฟล์'),
        messageType,
        mediaUrl,
        origin: window.location.origin,
      })
      await fetchMessages(selectedConv.id)
    } catch (e: any) {
      console.error('Upload error:', e)
      const errMsg = e?.response?.data?.error || e?.message || 'อัปโหลดไม่สำเร็จ'
      alert(`❌ ${errMsg}`)
    }
    setLoading(false)
  }

  // =====================================================
  // Update conversation status
  // =====================================================
  const updateConversationStatus = async (status: string) => {
    if (!selectedConv) return
    try {
      await axios.patch('/api/chat/conversation', {
        id: selectedConv.id, status,
      })
      fetchConversations()
      setSelectedConv({ ...selectedConv, status })
    } catch (e) {
      console.error('Update status error:', e)
    }
  }

  // =====================================================
  // Quick replies
  // =====================================================
  useEffect(() => {
    if (company) {
      axios.get('/api/chat/quick-replies', { params: { company } })
        .then(res => setQuickReplies(res.data.quickReplies || []))
        .catch(() => { })
    }
  }, [company])

  const insertQuickReply = (qr: QuickReply) => {
    setInputMessage(qr.content)
    setShowQuickReplies(false)
    inputRef.current?.focus()
  }

  // =====================================================
  // Video call
  // =====================================================
  const startVideoCall = async () => {
    if (!selectedConv) return
    try {
      const res = await axios.post('/api/chat/videocall', {
        company,
        conversationId: selectedConv.id,
        initiatedBy: agentName,
      })
      setVideoCall(res.data.videoCall)
      setShowVideoCall(true)

      // Auto-send video call link to customer via chat message
      const callUrl = `${window.location.origin}/videocall/${res.data.videoCall.roomId}`
      await axios.post('/api/chat/messages', {
        conversationId: selectedConv.id,
        agentName,
        content: `📹 เภสัชกรเชิญคุณเข้าร่วมวิดีโอคอล Telepharmacy\n\nกดลิงก์เพื่อเริ่มต้น:\n${callUrl}`,
        messageType: 'text',
        origin: window.location.origin,
      }).catch(e => console.error('Failed to send video call link:', e))

      await fetchMessages(selectedConv.id)
    } catch (e) {
      console.error('Start video call error:', e)
    }
  }

  const endVideoCall = async () => {
    if (!videoCall) return
    try {
      await axios.patch('/api/chat/videocall', {
        roomId: videoCall.roomId,
        status: 'ended',
      })
      // Clean up signaling data
      await axios.delete('/api/chat/videocall/signal', {
        data: { roomId: videoCall.roomId },
      }).catch(() => {})
      setShowVideoCall(false)
      setVideoCall(null)
    } catch (e) {
      console.error('End video call error:', e)
    }
  }

  // =====================================================
  // Keyboard shortcut: Enter to send
  // =====================================================
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === '/' && e.ctrlKey) {
      e.preventDefault()
      setShowQuickReplies(!showQuickReplies)
    }
  }

  // =====================================================
  // Format time
  // =====================================================
  const formatTime = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    if (diff < 60000) return 'เมื่อสักครู่'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาที`
    if (diff < 86400000) return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', fontFamily: 'Kanit', background: '#F8FAFC' }}>

      {/* ============ LEFT SIDEBAR - Conversation List ============ */}
      <div style={{
        width: 360, minWidth: 320, borderRight: '1px solid #E2E8F0',
        display: 'flex', flexDirection: 'column', background: '#FFFFFF',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 16px 12px', borderBottom: '1px solid #E2E8F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeft size={20} color="#64748B" style={{ cursor: 'pointer', marginRight: 2 }}
                onClick={() => window.location.href = '/web/dashboard'} />
              <MessageCircle size={22} color="#6366F1" />
              <span style={{ fontSize: 18, fontWeight: 600, color: '#1E293B' }}>แชท</span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#EF4444', color: 'white', borderRadius: 10,
                  padding: '1px 8px', fontSize: 11, fontWeight: 600,
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <Settings size={18} color="#94A3B8" style={{ cursor: 'pointer' }}
              onClick={() => window.location.href = '/web/chat/settings'} />
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 9 }} />
            <Input
              placeholder="ค้นหาชื่อ, ข้อความ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 32, height: 34, fontSize: 13, borderRadius: 8, fontFamily: 'Kanit' }}
            />
          </div>

          {/* Status filter chips */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['all', 'open', 'pending', 'resolved', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontFamily: 'Kanit',
                  border: 'none', cursor: 'pointer',
                  background: filterStatus === s ? '#6366F1' : '#F1F5F9',
                  color: filterStatus === s ? '#FFF' : '#64748B',
                  fontWeight: filterStatus === s ? 600 : 400,
                }}
              >
                {s === 'all' ? 'ทั้งหมด' : statusConfig[s]?.label || s}
              </button>
            ))}
            {(() => {
              const unansweredCount = conversations.filter(c => {
                const m = c.messages?.[0]
                return m && m.senderType === 'customer' && !m.isRead
              }).length
              return (
                <button
                  onClick={() => setFilterUnanswered(!filterUnanswered)}
                  style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontFamily: 'Kanit',
                    border: 'none', cursor: 'pointer',
                    background: filterUnanswered ? '#EF4444' : '#FEE2E2',
                    color: filterUnanswered ? '#FFF' : '#DC2626',
                    fontWeight: 600,
                  }}
                >
                  🔔 ยังไม่ตอบ {unansweredCount > 0 ? `(${unansweredCount})` : ''}
                </button>
              )
            })()}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
              <MessageCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 13 }}>ยังไม่มีการสนทนา</div>
            </div>
          ) : conversations
            .filter(conv => {
              if (!filterUnanswered) return true
              const m = conv.messages?.[0]
              return m && m.senderType === 'customer' && !m.isRead
            })
            .map(conv => {
            const isActive = selectedConv?.id === conv.id
            const lastMsg = conv.messages?.[0]
            const platform = platformConfig[conv.contact?.channel?.platform] || platformConfig.WEB
            const hasUnread = lastMsg && lastMsg.senderType === 'customer' && !lastMsg.isRead

            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                  background: isActive ? '#EEF2FF' : hasUnread ? '#FFFBEB' : '#FFF',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, flexShrink: 0, position: 'relative',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%', background: '#E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {conv.contact?.avatarUrl ? (
                        <img src={conv.contact.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={20} color="#94A3B8" />
                      )}
                    </div>
                    {/* Platform dot (outside clipped area so fully visible) */}
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0, width: 14, height: 14,
                      borderRadius: '50%', background: platform.color, border: '2px solid white',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                    }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{
                        fontSize: 13, fontWeight: hasUnread ? 600 : 500, color: '#1E293B',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.contact?.displayName || 'ไม่ทราบชื่อ'}
                        </span>
                        {hasUnread && (
                          <span style={{
                            padding: '1px 6px', borderRadius: 999, fontSize: 9,
                            background: '#EF4444', color: '#FFF', fontWeight: 600, flexShrink: 0,
                          }}>ยังไม่ตอบ</span>
                        )}
                      </span>
                      <span style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0 }}>
                        {formatTime(conv.lastMessageAt || conv.createdAt)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12, color: hasUnread ? '#334155' : '#94A3B8',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 200, fontWeight: hasUnread ? 500 : 400,
                      }}>
                        {lastMsg?.senderType === 'agent' ? 'คุณ: ' : ''}
                        {lastMsg?.messageType === 'image' ? '📷 รูปภาพ' :
                          lastMsg?.messageType === 'file' ? '📎 ไฟล์' :
                            lastMsg?.messageType === 'sticker' ? '😊 สติกเกอร์' :
                              lastMsg?.content || 'ยังไม่มีข้อความ'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 4,
                          background: platform.bg, color: platform.color, fontWeight: 500,
                        }}>
                          {platform.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ============ CENTER - Chat Area ============ */}
      {selectedConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid #E2E8F0', background: '#FFF',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar with online indicator */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #E2E8F0, #CBD5E1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  border: `2px solid ${platformConfig[selectedConv.contact?.channel?.platform]?.color || '#E2E8F0'}`,
                }}>
                  {selectedConv.contact?.avatarUrl ? (
                    <img src={selectedConv.contact.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} color="#94A3B8" />
                  )}
                </div>
                {/* Status dot */}
                <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
                  borderRadius: '50%', border: '2px solid #FFF',
                  background: statusConfig[selectedConv.status]?.color || '#94A3B8',
                }} />
              </div>

              {/* Name & info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', letterSpacing: '-0.01em' }}>
                    {selectedConv.contact?.displayName || 'ลูกค้า'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: platformConfig[selectedConv.contact?.channel?.platform]?.bg || '#F1F5F9',
                    color: platformConfig[selectedConv.contact?.channel?.platform]?.color || '#64748B',
                    border: `1px solid ${platformConfig[selectedConv.contact?.channel?.platform]?.color || '#E2E8F0'}20`,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: platformConfig[selectedConv.contact?.channel?.platform]?.color || '#64748B',
                    }} />
                    {platformConfig[selectedConv.contact?.channel?.platform]?.label || 'Web'}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 500,
                    background: statusConfig[selectedConv.status]?.bg || '#F1F5F9',
                    color: statusConfig[selectedConv.status]?.color || '#64748B',
                  }}>
                    {statusConfig[selectedConv.status]?.label || selectedConv.status}
                  </span>
                  {selectedConv.assignedTo && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 10, color: '#64748B', padding: '2px 6px',
                      background: '#F8FAFC', borderRadius: 6,
                    }}>
                      <UserCheck size={10} />
                      {selectedConv.assignedTo}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: '#CBD5E1' }}>•</span>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>
                    <Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {formatTime(selectedConv.lastMessageAt || selectedConv.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button variant="ghost" size="sm" onClick={startVideoCall}
                style={{
                  color: '#6366F1', borderRadius: 8, padding: '6px 10px',
                  transition: 'all 0.15s',
                }}
                title="วิดีโอคอล (Telepharmacy)">
                <Video size={18} />
              </Button>
              <Button variant="ghost" size="sm"
                onClick={() => setShowContactInfo(!showContactInfo)}
                style={{
                  color: showContactInfo ? '#6366F1' : '#64748B', borderRadius: 8, padding: '6px 10px',
                  background: showContactInfo ? '#EEF2FF' : 'transparent',
                  transition: 'all 0.15s',
                }}
                title="ข้อมูลลูกค้า">
                <User size={18} />
              </Button>

              <Button variant="ghost" size="sm"
                onClick={() => setShowQuickSale(!showQuickSale)}
                style={{
                  color: showQuickSale ? '#3E86C7' : '#64748B', borderRadius: 8, padding: '6px 10px',
                  background: showQuickSale ? '#F3F8FC' : 'transparent',
                  transition: 'all 0.15s',
                }}
                title="ขายสินค้า / ส่งใบเสร็จ / QR">
                <ShoppingCart size={18} />
              </Button>

              <div style={{ width: 1, height: 20, background: '#E2E8F0', margin: '0 4px' }} />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" style={{ color: '#64748B', borderRadius: 8, padding: '6px 10px' }}>
                    <MoreVertical size={18} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <div style={{ fontFamily: 'Kanit' }}>
                    <div style={{ padding: '4px 12px 6px', fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      เปลี่ยนสถานะ
                    </div>
                    {['open', 'pending', 'resolved', 'closed'].map(s => (
                      <div
                        key={s}
                        onClick={() => updateConversationStatus(s)}
                        style={{
                          padding: '7px 12px', cursor: 'pointer', fontSize: 12,
                          borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
                          background: selectedConv.status === s ? '#F1F5F9' : 'transparent',
                          fontWeight: selectedConv.status === s ? 600 : 400,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
                        onMouseLeave={e => (e.currentTarget.style.background = selectedConv.status === s ? '#F1F5F9' : '')}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: statusConfig[s]?.color || '#CCC',
                          boxShadow: `0 0 0 2px ${statusConfig[s]?.color || '#CCC'}30`,
                        }} />
                        {statusConfig[s]?.label || s}
                        {selectedConv.status === s && <Check size={12} style={{ marginLeft: 'auto', color: statusConfig[s]?.color }} />}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Video Call Overlay */}
          {showVideoCall && videoCall && (
            <VideoCallOverlay
              roomId={videoCall.roomId}
              contactName={selectedConv.contact?.displayName || 'ลูกค้า'}
              onEnd={endVideoCall}
            />
          )}

          {/* Messages area */}
          <div style={{
            flex: 1, overflow: 'auto', padding: '16px 20px',
            background: '#F8FAFC',
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                <MessageCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <div style={{ fontSize: 13 }}>เริ่มการสนทนา</div>
              </div>
            ) : (
              <>
                {hasMoreOlder && (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <button
                      onClick={loadOlderMessages}
                      disabled={loadingOlder}
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        background: 'transparent',
                        border: '1px solid #E2E8F0',
                        borderRadius: 999,
                        padding: '4px 12px',
                        cursor: loadingOlder ? 'default' : 'pointer',
                        opacity: loadingOlder ? 0.6 : 1,
                      }}
                    >
                      {loadingOlder ? 'กำลังโหลด...' : 'โหลดข้อความก่อนหน้า'}
                    </button>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isAgent = msg.senderType === 'agent'
                  const isSystem = msg.senderType === 'system'
                  const showTime = i === 0 || (
                    new Date(msg.createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime() > 300000
                  )

                  if (isSystem) {
                    return (
                      <div key={msg.id} style={{ textAlign: 'center', margin: '12px 0' }}>
                        <span style={{
                          fontSize: 11, color: '#94A3B8', background: '#F1F5F9',
                          padding: '3px 10px', borderRadius: 8,
                        }}>
                          {msg.content}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <React.Fragment key={msg.id}>
                      {showTime && (
                        <div style={{ textAlign: 'center', margin: '16px 0 8px' }}>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>
                            {new Date(msg.createdAt).toLocaleString('th-TH', {
                              hour: '2-digit', minute: '2-digit',
                              day: 'numeric', month: 'short',
                            })}
                          </span>
                        </div>
                      )}
                      <div style={{
                        display: 'flex', justifyContent: isAgent ? 'flex-end' : 'flex-start',
                        marginBottom: 4,
                      }}>
                        <div style={{
                          maxWidth: '70%', padding: '8px 14px', borderRadius: 16,
                          background: isAgent ? '#6366F1' : '#FFFFFF',
                          color: isAgent ? '#FFF' : '#1E293B',
                          boxShadow: isAgent ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                          borderTopRightRadius: isAgent ? 4 : 16,
                          borderTopLeftRadius: isAgent ? 16 : 4,
                        }}>
                          {msg.messageType === 'image' && msg.mediaUrl ? (
                            <img src={msg.mediaUrl} alt="" style={{
                              maxWidth: 240, borderRadius: 8, display: 'block',
                            }} />
                          ) : msg.messageType === 'video' && msg.mediaUrl ? (
                            <video src={msg.mediaUrl} controls style={{
                              maxWidth: 240, borderRadius: 8, display: 'block',
                            }} />
                          ) : msg.messageType === 'sticker' && msg.content?.startsWith('sticker:') ? (
                            (() => {
                              const parts = msg.content.split(':');
                              const stickerId = parts[2];
                              return (
                                <img
                                  src={`https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker.png`}
                                  alt="sticker"
                                  style={{ width: 120, height: 120, display: 'block' }}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              );
                            })()
                          ) : msg.messageType === 'file' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <FileText size={16} />
                              <a href={msg.mediaUrl} target="_blank" rel="noopener"
                                style={{ color: isAgent ? '#FFF' : '#6366F1', fontSize: 13 }}>
                                {msg.content || 'ดาวน์โหลดไฟล์'}
                              </a>
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {msg.content}
                            </div>
                          )}

                          <div style={{
                            fontSize: 9, marginTop: 4, opacity: 0.6,
                            display: 'flex', alignItems: 'center', gap: 3,
                            justifyContent: isAgent ? 'flex-end' : 'flex-start',
                          }}>
                            {new Date(msg.createdAt).toLocaleTimeString('th-TH', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {isAgent && (
                              msg.isRead ? <CheckCheck size={12} /> : <Check size={12} />
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick replies panel */}
          {showQuickReplies && (
            <div style={{
              borderTop: '1px solid #E2E8F0', background: '#FFF', padding: 8,
              maxHeight: 200, overflow: 'auto',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 8px', marginBottom: 4,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                  <Zap size={12} style={{ marginRight: 4 }} />ข้อความด่วน
                </span>
                <X size={14} color="#94A3B8" style={{ cursor: 'pointer' }}
                  onClick={() => setShowQuickReplies(false)} />
              </div>
              {quickReplies.map(qr => (
                <div
                  key={qr.id}
                  onClick={() => insertQuickReply(qr)}
                  style={{
                    padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 12,
                    marginBottom: 2,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ fontWeight: 500, color: '#334155' }}>{qr.title}</div>
                  <div style={{ color: '#94A3B8', fontSize: 11 }}>{qr.content}</div>
                </div>
              ))}
              {quickReplies.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, padding: 16 }}>
                  ยังไม่มีข้อความด่วน (เพิ่มได้ในตั้งค่า)
                </div>
              )}
            </div>
          )}

          {/* Input area */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid #E2E8F0', background: '#FFF',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Button variant="ghost" size="sm" title="ข้อความด่วน (Ctrl+/)"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              style={{ color: '#94A3B8', padding: 4 }}>
              <Zap size={18} />
            </Button>
            <Button variant="ghost" size="sm" title="แนบไฟล์"
              onClick={() => fileInputRef.current?.click()}
              style={{ color: '#94A3B8', padding: 4 }}>
              <Paperclip size={18} />
            </Button>
            <Button variant="ghost" size="sm" title="รูปภาพ"
              onClick={() => imageInputRef.current?.click()}
              style={{ color: '#94A3B8', padding: 4 }}>
              <Image size={18} />
            </Button>
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
              style={{ display: 'none' }}
              onChange={e => handleFileUpload(e, 'file')}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={e => handleFileUpload(e, 'image')}
            />

            <Input
              ref={inputRef}
              placeholder="พิมพ์ข้อความ... (Enter ส่ง, Ctrl+/ ข้อความด่วน)"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || selectedConv.status === 'closed'}
              style={{
                flex: 1, height: 38, fontSize: 13, borderRadius: 20,
                fontFamily: 'Kanit', paddingLeft: 16,
              }}
            />

            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}
              style={{
                background: '#6366F1', color: '#FFF', borderRadius: 20,
                width: 38, height: 38, padding: 0,
              }}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      ) : (
        /* No conversation selected */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', color: '#94A3B8',
        }}>
          <MessageCircle size={64} style={{ opacity: 0.15, marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 500 }}>Omnichannel Chat</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>เลือกการสนทนาเพื่อเริ่มแชท</div>
          <div style={{ fontSize: 11, marginTop: 16, color: '#CBD5E1', maxWidth: 300, textAlign: 'center' }}>
            รองรับ LINE OA, Facebook Page, TikTok และ Video Call สำหรับ Telepharmacy
          </div>
        </div>
      )}

      {/* ============ RIGHT SIDEBAR - Contact Info ============ */}
      {showContactInfo && selectedConv && (() => {
        const pConfig = platformConfig[selectedConv.contact?.channel?.platform] || platformConfig.WEB
        const sConfig = statusConfig[selectedConv.status] || statusConfig.open
        return (
        <div style={{
          width: 320, borderLeft: '1px solid #E2E8F0', background: '#FFF',
          overflow: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>โปรไฟล์ลูกค้า</span>
            <X size={16} color="#94A3B8" style={{ cursor: 'pointer' }}
              onClick={() => setShowContactInfo(false)} />
          </div>

          {/* Profile Card */}
          <div style={{
            padding: '24px 20px 20px', textAlign: 'center',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFF 100%)',
            borderBottom: '1px solid #F1F5F9',
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #E2E8F0, #CBD5E1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                border: `3px solid ${pConfig.color}30`,
                boxShadow: `0 4px 12px ${pConfig.color}20`,
              }}>
                {selectedConv.contact?.avatarUrl ? (
                  <img src={selectedConv.contact.avatarUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={36} color="#94A3B8" />
                )}
              </div>
              {/* Platform icon badge */}
              <div style={{
                position: 'absolute', bottom: 2, right: 2, width: 22, height: 22,
                borderRadius: '50%', background: pConfig.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #FFF', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}>
                <MessageCircle size={11} color="#FFF" />
              </div>
            </div>

            {/* Name */}
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 6, letterSpacing: '-0.01em' }}>
              {selectedConv.contact?.displayName || 'ลูกค้า'}
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: pConfig.bg, color: pConfig.color,
                border: `1px solid ${pConfig.color}25`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: pConfig.color }} />
                {pConfig.label}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                background: sConfig.bg, color: sConfig.color,
                border: `1px solid ${sConfig.color}25`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sConfig.color }} />
                {sConfig.label}
              </span>
            </div>

            {/* Channel name */}
            {selectedConv.contact?.channel?.channelName && (
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
                ช่องทาง: {selectedConv.contact.channel.channelName}
              </div>
            )}
          </div>

          {/* Info Sections */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0 0 16px' }}>
            {/* Contact Info Section */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 12,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <User size={12} />
                ข้อมูลติดต่อ
              </div>

              {[
                { icon: <Hash size={14} color="#94A3B8" />, label: 'Platform ID', value: selectedConv.contact?.platformUserId, mono: true },
                { icon: <Star size={14} color="#94A3B8" />, label: 'อีเมล', value: (selectedConv.contact as any)?.email },
                { icon: <Phone size={14} color="#94A3B8" />, label: 'เบอร์โทร', value: (selectedConv.contact as any)?.phone },
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
                  borderBottom: '1px solid #F8FAFC',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#F8FAFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 1, fontWeight: 500 }}>{item.label}</div>
                    <div style={{
                      color: item.value ? '#334155' : '#CBD5E1', fontWeight: 500,
                      wordBreak: 'break-all',
                      fontFamily: item.mono ? 'monospace, Kanit' : 'Kanit',
                      fontSize: item.mono ? 11 : 12,
                    }}>
                      {item.value || '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tags Section */}
            <div style={{ padding: '0 20px 16px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 10,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Tag size={12} />
                แท็ก
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {selectedConv.contact?.tags ? selectedConv.contact.tags.split(',').map((tag, i) => (
                  <span key={i} style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11,
                    background: '#EEF2FF', color: '#6366F1', fontWeight: 500,
                    border: '1px solid #C7D2FE',
                  }}>
                    {tag.trim()}
                  </span>
                )) : (
                  <span style={{ fontSize: 11, color: '#CBD5E1' }}>ยังไม่มีแท็ก</span>
                )}
              </div>
            </div>

            {/* Conversation Detail Section */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 12,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Clock size={12} />
                รายละเอียดการสนทนา
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{
                  padding: 10, background: '#F8FAFC', borderRadius: 8, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>เริ่มสนทนา</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                    {new Date(selectedConv.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>
                    {new Date(selectedConv.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{
                  padding: 10, background: '#F8FAFC', borderRadius: 8, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>ข้อความล่าสุด</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                    {formatTime(selectedConv.lastMessageAt || selectedConv.createdAt)}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>
                    {messages.length} ข้อความ
                  </div>
                </div>
              </div>
            </div>

            {/* PDPA Section */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 10,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Archive size={12} />
                ความเป็นส่วนตัว
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                background: (selectedConv.contact as any)?.consentGiven ? '#EDF9F3' : '#FEF2F2',
                borderRadius: 8,
                border: `1px solid ${(selectedConv.contact as any)?.consentGiven ? '#A9E1C6' : '#FECACA'}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: (selectedConv.contact as any)?.consentGiven ? '#1F9D6B' : '#EF4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {(selectedConv.contact as any)?.consentGiven
                    ? <Check size={14} color="#FFF" />
                    : <X size={14} color="#FFF" />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: (selectedConv.contact as any)?.consentGiven ? '#0C5238' : '#991B1B' }}>
                    {(selectedConv.contact as any)?.consentGiven ? 'PDPA ยินยอมแล้ว' : 'ยังไม่ยินยอม PDPA'}
                  </div>
                  <div style={{ fontSize: 10, color: (selectedConv.contact as any)?.consentGiven ? '#0F6845' : '#B91C1C' }}>
                    สถานะการยินยอมข้อมูลส่วนบุคคล
                  </div>
                </div>
              </div>
            </div>

            {/* Telepharmacy section */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                padding: 16, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                borderRadius: 12, border: '1px solid #C7D2FE',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#4338CA', marginBottom: 4,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Video size={16} />
                  Telepharmacy
                </div>
                <div style={{ fontSize: 11, color: '#6366F1', marginBottom: 12, lineHeight: 1.5 }}>
                  ปรึกษาเภสัชกรผ่านวิดีโอคอลแบบเรียลไทม์
                </div>
                <Button
                  onClick={startVideoCall}
                  style={{
                    width: '100%', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#FFF',
                    fontSize: 12, fontFamily: 'Kanit', borderRadius: 8, fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Video size={14} style={{ marginRight: 6 }} />
                  เริ่มวิดีโอคอล
                </Button>
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ============ RIGHT SIDEBAR - Quick Sale / Receipt / QR ============ */}
      {showQuickSale && selectedConv && (
        <QuickSalePanel
          conversationId={selectedConv.id}
          agentName={agentName}
          contactName={selectedConv.contact?.displayName || 'ลูกค้า'}
          origin={typeof window !== 'undefined' ? window.location.origin : ''}
          onSent={() => fetchMessages(selectedConv.id)}
          onClose={() => setShowQuickSale(false)}
        />
      )}
    </div>
  )
}

// =====================================================
// Video Call Overlay Component (WebRTC with Signaling)
// =====================================================
function VideoCallOverlay({ roomId, contactName, onEnd }: {
  roomId: string; contactName: string; onEnd: () => void
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'active' | 'ended'>('connecting')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [duration, setDuration] = useState(0)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTimestampRef = useRef(0)
  const iceCandidateQueue = useRef<any[]>([])

  useEffect(() => {
    initializeCall()
    return () => {
      cleanup()
    }
  }, [])

  // Duration timer
  useEffect(() => {
    if (callStatus === 'active') {
      durationRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }
    return () => { if (durationRef.current) clearInterval(durationRef.current) }
  }, [callStatus])

  const initializeCall = async () => {
    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection with STUN servers
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })
      pcRef.current = pc

      // Add tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
          setCallStatus('active')
        }
      }

      // Send ICE candidates to signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/chat/videocall/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId, type: 'ice', data: event.candidate.toJSON(), role: 'agent',
            }),
          }).catch(() => {})
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setCallStatus('ended')
        }
      }

      // Create and send offer via signaling API
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      await fetch('/api/chat/videocall/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, type: 'offer', data: offer, role: 'agent' }),
      })

      setCallStatus('ringing')

      // Poll for customer's answer and ICE candidates
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/chat/videocall/signal?roomId=${roomId}&role=agent&after=${lastTimestampRef.current}`)
          const { signals } = await res.json()
          for (const signal of signals || []) {
            if (signal.timestamp > lastTimestampRef.current) {
              lastTimestampRef.current = signal.timestamp
            }
            if (signal.type === 'answer' && pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.data))
              // Process queued ICE candidates
              for (const candidate of iceCandidateQueue.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
              }
              iceCandidateQueue.current = []
            }
            if (signal.type === 'ice') {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.data)).catch(() => {})
              } else {
                iceCandidateQueue.current.push(signal.data)
              }
            }
          }
        } catch (e) { /* ignore */ }
      }, 1000)

      console.log('Video call initiated, room:', roomId)

    } catch (err) {
      console.error('Video call error:', err)
      setCallStatus('ended')
    }
  }

  const cleanup = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
    }
    if (pcRef.current) {
      pcRef.current.close()
    }
    if (durationRef.current) clearInterval(durationRef.current)
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
      setIsVideoOff(!isVideoOff)
    }
  }

  const handleEnd = () => {
    cleanup()
    setCallStatus('ended')
    onEnd()
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50, background: '#0F172A',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Remote video (full screen) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Status overlay */}
        {callStatus !== 'active' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: '#0F172AEE',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <User size={36} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 18, color: '#FFF', fontWeight: 600, fontFamily: 'Kanit' }}>
              {contactName}
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontFamily: 'Kanit' }}>
              {callStatus === 'connecting' ? 'กำลังเชื่อมต่อ...' :
                callStatus === 'ringing' ? 'กำลังเรียก...' :
                  'สิ้นสุดการโทร'}
            </div>
            {callStatus === 'ringing' && (
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: '#3E86C7',
                marginTop: 12, animation: 'pulse 1.5s infinite',
              }} />
            )}
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div style={{
          position: 'absolute', bottom: 90, right: 20,
          width: 200, height: 150, borderRadius: 12,
          overflow: 'hidden', border: '2px solid #FFFFFF30',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        </div>

        {/* Duration */}
        {callStatus === 'active' && (
          <div style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: '#00000060', padding: '4px 16px', borderRadius: 20,
            color: '#FFF', fontSize: 14, fontFamily: 'monospace',
          }}>
            {formatDuration(duration)}
          </div>
        )}

        {/* Room ID badge */}
        <div style={{
          position: 'absolute', top: 20, left: 20,
          background: '#6366F160', padding: '3px 10px', borderRadius: 6,
          color: '#FFF', fontSize: 10, fontFamily: 'Kanit',
        }}>
          Telepharmacy • {roomId.slice(0, 12)}...
        </div>
      </div>

      {/* Controls bar */}
      <div style={{
        padding: '16px 0', display: 'flex', justifyContent: 'center', gap: 16,
        background: '#1E293B',
      }}>
        <button
          onClick={toggleMute}
          style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: isMuted ? '#EF4444' : '#334155', color: '#FFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={isMuted ? 'เปิดไมค์' : 'ปิดไมค์'}
        >
          <Mic size={20} />
        </button>
        <button
          onClick={toggleVideo}
          style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: isVideoOff ? '#EF4444' : '#334155', color: '#FFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={isVideoOff ? 'เปิดกล้อง' : 'ปิดกล้อง'}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
        <button
          onClick={handleEnd}
          style={{
            width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: '#EF4444', color: '#FFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="วางสาย"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  )
}
