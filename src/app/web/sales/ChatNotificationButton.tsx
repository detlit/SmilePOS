'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ChatConversation {
  id: string
  contactName: string
  lastMessage: string
  platform: string
  unreadCount: number
  updatedAt: string
}

const PLATFORM_ICONS: Record<string, string> = {
  LINE: '🟢',
  FACEBOOK: '🔵',
  TIKTOK: '🎵',
  WEB: '🌐',
}

const PLATFORM_COLORS: Record<string, string> = {
  LINE: '#06C755',
  FACEBOOK: '#1877F2',
  TIKTOK: '#000000',
  WEB: '#6B7280',
}

export function ChatNotificationButton() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentChats, setRecentChats] = useState<ChatConversation[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; name: string; message: string; platform: string }>({
    show: false, name: '', message: '', platform: ''
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevUnreadRef = useRef(0)

  const fetchUnread = useCallback(async () => {
    try {
      const company = localStorage.getItem('company_') || ''
      const res = await fetch(`/api/chat/conversations?company=${encodeURIComponent(company)}&limit=5`)
      if (!res.ok) return
      const data = await res.json()
      const conversations: ChatConversation[] = data.conversations || []
      const total = conversations.reduce((sum: number, c: ChatConversation) => sum + (c.unreadCount || 0), 0)

      // Show toast if new unread message
      if (total > prevUnreadRef.current && conversations.length > 0) {
        const newest = conversations[0]
        if (newest.unreadCount > 0) {
          setToast({
            show: true,
            name: newest.contactName || 'ลูกค้า',
            message: newest.lastMessage || 'ส่งข้อความใหม่',
            platform: newest.platform || 'WEB',
          })
          setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000)
        }
      }
      prevUnreadRef.current = total
      setUnreadCount(total)
      setRecentChats(conversations)
    } catch {
      // ignore fetch errors silently
    }
  }, [])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 8000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const goToChat = (conversationId?: string) => {
    setShowDropdown(false)
    if (conversationId) {
      router.push(`/web/chat?id=${conversationId}`)
    } else {
      router.push('/web/chat')
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'เมื่อกี้'
    if (mins < 60) return `${mins} นาที`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} ชม.`
    return `${Math.floor(hrs / 24)} วัน`
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', marginLeft: 10 }}>
      {/* Main Button */}
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          fontFamily: 'Kanit',
          fontSize: 12,
          height: 32,
          background: unreadCount > 0 ? '#F3F8FC' : 'white',
          border: unreadCount > 0 ? '1.5px solid #3E86C7' : undefined,
          color: unreadCount > 0 ? '#173F6B' : undefined,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          paddingLeft: 8,
          paddingRight: unreadCount > 0 ? 28 : 8,
        }}
        className="btn btn-outline-dark p-1 shadow-sm rounded border"
      >
        💬 แชทลูกค้า
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              minWidth: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              boxShadow: '0 1px 4px rgba(239,68,68,0.4)',
              animation: 'chatBadgePulse 2s ease-in-out infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Preview */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 38,
            right: 0,
            width: 320,
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: 'Kanit', fontWeight: 600, fontSize: 14, color: '#111' }}>
              แชทล่าสุด
            </span>
            <button
              onClick={() => goToChat()}
              style={{
                fontFamily: 'Kanit',
                fontSize: 12,
                color: '#3E86C7',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ดูทั้งหมด →
            </button>
          </div>

          {/* Chat List */}
          {recentChats.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontFamily: 'Kanit', fontSize: 13 }}>
              ยังไม่มีแชท
            </div>
          ) : (
            recentChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => goToChat(chat.id)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f9fafb',
                  background: chat.unreadCount > 0 ? '#f0f7ff' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = chat.unreadCount > 0 ? '#f0f7ff' : '#fff')}
              >
                {/* Platform Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `${PLATFORM_COLORS[chat.platform] || '#6B7280'}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {PLATFORM_ICONS[chat.platform] || '💬'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: 'Kanit', fontSize: 13, fontWeight: chat.unreadCount > 0 ? 600 : 400,
                      color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {chat.contactName || 'ลูกค้า'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 8 }}>
                      {timeAgo(chat.updatedAt)}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'Kanit', fontSize: 12, color: '#6b7280',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {chat.lastMessage || '...'}
                  </div>
                </div>

                {/* Unread Badge */}
                {chat.unreadCount > 0 && (
                  <div
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '50%',
                      minWidth: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div
          onClick={() => { setToast(prev => ({ ...prev, show: false })); goToChat() }}
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            width: 320,
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            border: '1px solid #e5e7eb',
            padding: '12px 16px',
            zIndex: 10000,
            cursor: 'pointer',
            animation: 'chatToastSlide 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 24 }}>{PLATFORM_ICONS[toast.platform] || '💬'}</span>
          <div>
            <div style={{ fontFamily: 'Kanit', fontWeight: 600, fontSize: 13, color: '#111' }}>
              {toast.name}
            </div>
            <div style={{
              fontFamily: 'Kanit', fontSize: 12, color: '#6b7280',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 230,
            }}>
              {toast.message}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes chatBadgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes chatToastSlide {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
