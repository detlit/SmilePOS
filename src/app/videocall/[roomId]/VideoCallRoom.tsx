// เนื้อหาเดิมของหน้าห้องวิดีโอคอล ถูกแยกออกมาจาก page.tsx
//
// เหตุผล: static export (build ลง .apk) บังคับให้ dynamic route ต้องมี generateStaticParams
// ซึ่งประกาศได้เฉพาะใน Server Component แต่ไฟล์นี้เป็น Client Component ทั้งไฟล์
// page.tsx จึงเหลือหน้าที่เป็นเปลือกฝั่ง server แล้วเรียกคอมโพเนนต์นี้ต่อ
// พฤติกรรมบนเว็บ/Electron เหมือนเดิมทุกประการ

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// Detect in-app browser (Facebook Messenger, LINE, Instagram, etc.)
function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|Twitter|Snapchat|MicroMessenger/i.test(ua)
}

export default function VideoCallRoom({ params }: { params: Promise<{ roomId: string }> }) {
  const [roomId, setRoomId] = useState('')
  const [callStatus, setCallStatus] = useState<'loading' | 'ready' | 'connecting' | 'active' | 'ended'>('loading')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const [inAppBrowser, setInAppBrowser] = useState(false)
  const [copied, setCopied] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTimestampRef = useRef(0)
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([])

  // Resolve params
  useEffect(() => {
    params.then(p => setRoomId(p.roomId))
    if (isInAppBrowser()) setInAppBrowser(true)
  }, [params])

  // Verify room exists
  useEffect(() => {
    if (!roomId) return
    fetch(`/api/chat/videocall?roomId=${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.videoCall) {
          setError('ห้องวิดีโอคอลไม่พบ หรือลิงก์หมดอายุ')
          setCallStatus('ended')
        } else if (data.videoCall.status === 'ended') {
          setError('การโทรสิ้นสุดแล้ว')
          setCallStatus('ended')
        } else {
          setCallStatus('ready')
        }
      })
      .catch(() => {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
        setCallStatus('ended')
      })
  }, [roomId])

  // Duration timer
  useEffect(() => {
    if (callStatus === 'active') {
      durationRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }
    return () => { if (durationRef.current) clearInterval(durationRef.current) }
  }, [callStatus])

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (durationRef.current) clearInterval(durationRef.current)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
    }
    if (pcRef.current) {
      pcRef.current.close()
    }
  }, [])

  // Poll for signals from agent
  const startPolling = useCallback((pc: RTCPeerConnection) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/videocall/signal?roomId=${roomId}&role=customer&after=${lastTimestampRef.current}`)
        const { signals } = await res.json()

        for (const signal of signals || []) {
          if (signal.timestamp > lastTimestampRef.current) {
            lastTimestampRef.current = signal.timestamp
          }

          if (signal.type === 'offer' && pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.data))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            // Send answer back
            await fetch('/api/chat/videocall/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomId, type: 'answer', data: answer, role: 'customer' }),
            })
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
      } catch (e) {
        // ignore polling errors
      }
    }, 1000)
  }, [roomId])

  const joinCall = async () => {
    setCallStatus('connecting')
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

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })
      pcRef.current = pc

      // Add local tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
          setCallStatus('active')
          // Update call status to active
          fetch('/api/chat/videocall', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, status: 'active' }),
          }).catch(() => {})
        }
      }

      // Send ICE candidates to signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/chat/videocall/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId, type: 'ice', data: event.candidate.toJSON(), role: 'customer',
            }),
          }).catch(() => {})
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setCallStatus('ended')
          cleanup()
        }
      }

      // Start polling for agent's signals (offer + ICE)
      startPolling(pc)

    } catch (err: any) {
      console.error('Join call error:', err)
      if (err?.name === 'NotAllowedError') {
        setError('กล้องหรือไมค์ถูกปฏิเสธ กรุณาอนุญาตการเข้าถึงในการตั้งค่าเบราว์เซอร์แล้วลองใหม่')
      } else if (err?.name === 'NotFoundError') {
        setError('ไม่พบกล้องหรือไมค์ กรุณาตรวจสอบอุปกรณ์ของคุณ')
      } else {
        setError('ไม่สามารถเข้าถึงกล้องหรือไมค์ได้ กรุณาเปิดลิงก์ในเบราว์เซอร์ Chrome หรือ Safari')
      }
      setCallStatus('ended')
    }
  }

  const handleEnd = () => {
    cleanup()
    setCallStatus('ended')
    fetch('/api/chat/videocall', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, status: 'ended' }),
    }).catch(() => {})
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

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // Loading state
  if (callStatus === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0F172A', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#FFF', fontFamily: 'Kanit, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>กำลังโหลด...</div>
        </div>
      </div>
    )
  }

  // Ready to join
  if (callStatus === 'ready') {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)

    // In-app browser detected - show instructions to open in external browser
    if (inAppBrowser) {
      return (
        <div style={{
          minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Kanit, sans-serif',
        }}>
          <div style={{
            textAlign: 'center', padding: 32, borderRadius: 20,
            background: '#1E293B', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            maxWidth: 400, width: '90%',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 style={{ color: '#FFF', fontSize: 20, marginBottom: 8, fontWeight: 600 }}>
              กรุณาเปิดในเบราว์เซอร์
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 20, lineHeight: 1.8 }}>
              เบราว์เซอร์ใน Messenger ไม่รองรับกล้อง<br />
              กรุณาเปิดลิงก์ใน <b style={{ color: '#FFF' }}>{isAndroid ? 'Chrome' : 'Safari'}</b>
            </p>

            {/* Open in browser button - uses intent:// for Android Chrome */}
            {isAndroid ? (
              <a
                href={`intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`}
                style={{
                  display: 'block', width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#FFF',
                  fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Kanit',
                  textDecoration: 'none', boxSizing: 'border-box',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                }}
              >
                🌐 เปิดใน Chrome
              </a>
            ) : (
              <button
                onClick={() => { window.open(currentUrl, '_system') }}
                style={{
                  width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#FFF',
                  fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Kanit',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                }}
              >
                🌐 เปิดในเบราว์เซอร์
              </button>
            )}

            {/* Copy link button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentUrl).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
              }}
              style={{
                width: '100%', padding: '12px 24px', borderRadius: 12,
                border: '1px solid #334155', background: '#0F172A', color: '#94A3B8',
                fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Kanit',
                marginTop: 12,
              }}
            >
              {copied ? '✅ คัดลอกแล้ว!' : '📋 คัดลอกลิงก์'}
            </button>

            <div style={{
              marginTop: 20, padding: 16, borderRadius: 12,
              background: '#0F172A', textAlign: 'left',
            }}>
              <p style={{ color: '#94A3B8', fontSize: 12, margin: 0, lineHeight: 1.8 }}>
                <b style={{ color: '#F59E0B' }}>วิธีทำ:</b><br />
                {isAndroid ? (
                  <>
                    1. กดปุ่ม <b style={{ color: '#FFF' }}>⋮</b> มุมขวาบน<br />
                    2. เลือก <b style={{ color: '#FFF' }}>&quot;เปิดใน Chrome&quot;</b><br />
                    หรือกดปุ่ม &quot;เปิดใน Chrome&quot; ด้านบน
                  </>
                ) : (
                  <>
                    1. กดปุ่ม <b style={{ color: '#FFF' }}>⋯</b> หรือ <b style={{ color: '#FFF' }}>แชร์</b> ด้านล่าง<br />
                    2. เลือก <b style={{ color: '#FFF' }}>&quot;เปิดใน Safari&quot;</b><br />
                    หรือคัดลอกลิงก์แล้วเปิดใน Safari
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Kanit, sans-serif',
      }}>
        <div style={{
          textAlign: 'center', padding: 40, borderRadius: 20,
          background: '#1E293B', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          maxWidth: 400, width: '90%',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
          <h1 style={{ color: '#FFF', fontSize: 22, marginBottom: 8, fontWeight: 600 }}>
            Telepharmacy
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            ปรึกษาเภสัชกรผ่านวิดีโอคอล<br />
            กรุณากดปุ่มด้านล่างเพื่อเริ่มต้น
          </p>
          <button
            onClick={joinCall}
            style={{
              width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)', color: '#FFF',
              fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Kanit',
              boxShadow: '0 4px 15px rgba(62, 134, 199, 0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            📹 เข้าร่วมวิดีโอคอล
          </button>
          <p style={{ color: '#64748B', fontSize: 11, marginTop: 16 }}>
            ระบบจะขออนุญาตเข้าถึงกล้องและไมโครโฟน
          </p>
        </div>
      </div>
    )
  }

  // Error / ended state
  if (callStatus === 'ended') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0F172A', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'Kanit, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: 40, color: '#FFF' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: error ? '#EF444420' : '#22C55E20',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {error ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3E86C7" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            )}
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>
            {error || 'สิ้นสุดการโทร'}
          </h2>
          {duration > 0 && (
            <p style={{ color: '#94A3B8', fontSize: 14 }}>
              ระยะเวลา: {formatDuration(duration)}
            </p>
          )}
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 16 }}>
            คุณสามารถปิดหน้านี้ได้
          </p>
        </div>
      </div>
    )
  }

  // Connecting / Active state
  return (
    <div style={{
      minHeight: '100vh', background: '#0F172A', display: 'flex', flexDirection: 'column',
      fontFamily: 'Kanit, sans-serif',
    }}>
      {/* Remote video (full screen) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Status overlay when connecting */}
        {callStatus !== 'active' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: '#0F172AEE',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, color: '#FFF', fontWeight: 600 }}>
              เภสัชกร
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              กำลังเชื่อมต่อ... รอเภสัชกรเริ่มการโทร
            </div>
            <div style={{
              width: 12, height: 12, borderRadius: '50%', background: '#3E86C7',
              marginTop: 12, animation: 'pulse 1.5s infinite',
            }} />
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div style={{
          position: 'absolute', bottom: 90, right: 20,
          width: 160, height: 120, borderRadius: 12,
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

        {/* Badge */}
        <div style={{
          position: 'absolute', top: 20, left: 20,
          background: '#6366F160', padding: '3px 10px', borderRadius: 6,
          color: '#FFF', fontSize: 10,
        }}>
          Telepharmacy
        </div>
      </div>

      {/* Controls bar */}
      <div style={{
        padding: '16px 0', display: 'flex', justifyContent: 'center', gap: 16,
        background: '#1E293B',
      }}>
        <button onClick={toggleMute} style={{
          width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: isMuted ? '#EF4444' : '#334155', color: '#FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          )}
        </button>
        <button onClick={toggleVideo} style={{
          width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: isVideoOff ? '#EF4444' : '#334155', color: '#FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isVideoOff ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 7.5l4.5 3v-6l-4.5 3z"/><rect x="2" y="5" width="14.5" height="14" rx="2"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          )}
        </button>
        <button onClick={handleEnd} style={{
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: '#EF4444', color: '#FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
            <line x1="23" y1="1" x2="1" y2="23"/>
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}
