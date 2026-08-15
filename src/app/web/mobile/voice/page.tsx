"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  LogIn,
  ShoppingCart,
  Package,
  ClipboardList,
  RefreshCw,
  DollarSign,
  Mic,
  MicOff,
  Languages,
  X,
  MessageSquare,
  Box,
  Send,
  RotateCcw,
  PackagePlus
} from 'lucide-react';
import { useNavLevel } from '../useNavLevel';
import {
  useCommunicationStore,
  LANGUAGES,
  LanguageCode,
  translateText,
  speakText,
  ChatMessage
} from '../../sales/useCommunicationStore';
import { useVoskRecognition } from '../../sales/useVoskRecognition';

// Detect if running in Electron
const getIsElectron = () => typeof window !== 'undefined' && !!(window as any).electron;

const mobileVoiceStyles = `
  .mobile-voice-app {
    font-family: 'Kanit', sans-serif;
    background: #f8fafc;
    min-height: 100vh;
    padding-bottom: 80px;
  }

  /* Header Styles */
  .voice-header {
    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
    padding: 24px 16px;
    color: white;
    border-radius: 0 0 24px 24px;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-title {
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* Main Content Area */
  .voice-content {
    padding: 16px;
  }

  /* Language Selector Card */
  .setup-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
    margin-bottom: 20px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 16px;
  }

  .language-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .lang-select-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lang-label {
    font-size: 12px;
    color: #6b7280;
    padding-left: 4px;
  }

  .lang-select {
    width: 100%;
    padding: 12px;
    border: 2px solid #f1f5f9;
    border-radius: 12px;
    font-family: 'Kanit', sans-serif;
    font-size: 14px;
    background: #f8fafc;
    color: #1f2937;
    outline: none;
    transition: all 0.2s;
  }

  .lang-select:focus {
    border-color: #0d9488;
    background: white;
  }

  .hint-box {
    background: #f0fdfa;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #ccfbf1;
    color: #0f766e;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .start-btn {
    width: 100%;
    padding: 14px;
    background: #0d9488;
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'Kanit', sans-serif;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
  }

  /* Chat Area Styles */
  .chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 350px);
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }

  .chat-header {
    padding: 12px 16px;
    background: #f0fdfa;
    border-bottom: 1px solid #ccfbf1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chat-status {
    font-size: 13px;
    color: #0d9488;
    font-weight: 500;
  }

  .end-sess-btn {
    padding: 4px 10px;
    background: #fee2e2;
    color: #dc2626;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Kanit';
  }

  .message-list {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #f9fafb;
  }

  /* Message Bubble Styles */
  .bubble-wrap {
    display: flex;
    width: 100%;
  }

  .bubble-wrap.seller { justify-content: flex-end; }
  .bubble-wrap.buyer { justify-content: flex-start; }

  .bubble {
    max-width: 85%;
    padding: 10px 14px;
    border-radius: 18px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .bubble.seller {
    background: #0d9488;
    color: white;
    border-bottom-right-radius: 4px;
  }

  .bubble.buyer {
    background: white;
    color: #1f2937;
    border-bottom-left-radius: 4px;
    border: 1px solid #f1f5f9;
  }

  .bubble-meta {
    font-size: 10px;
    margin-bottom: 2px;
    opacity: 0.8;
  }

  .bubble-text {
    font-size: 14px;
    line-height: 1.5;
  }

  .bubble-original {
    font-size: 12px;
    opacity: 0.7;
    margin-top: 4px;
    font-style: italic;
    border-top: 1px solid rgba(0,0,0,0.1);
    padding-top: 4px;
  }
  .bubble.seller .bubble-original { border-top-color: rgba(255,255,255,0.2); }

  /* Control Panel */
  .control-panel {
    background: #f8fafc;
    padding: 16px;
    border-top: 1px solid #e2e8f0;
  }

  .transcript-preview {
    background: #fffbeb;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid #fef3c7;
    color: #92400e;
    font-size: 13px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .mic-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .mic-btn-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .mic-label {
    font-size: 12px;
    font-weight: 600;
  }

  .main-mic-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
  }

  .main-mic-btn:active {
    transform: scale(0.9);
  }

  .main-mic-btn.seller {
    background: #0d9488;
    color: white;
  }

  .main-mic-btn.seller.listening {
    background: #ef4444;
    animation: pulse 1.5s infinite;
  }

  .main-mic-btn.buyer {
    background: #3E86C7;
    color: white;
  }

  .main-mic-btn.buyer.active {
    background: #2A6AAA;
    border: 3px solid #CCDFF1;
    animation: pulse-blue 1.5s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }

  @keyframes pulse-blue {
    0% { box-shadow: 0 0 0 0 rgba(62, 134, 199, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(62, 134, 199, 0); }
    100% { box-shadow: 0 0 0 0 rgba(62, 134, 199, 0); }
  }

  .reset-mic-btn {
    position: absolute;
    right: -10px;
    top: -10px;
    width: 28px;
    height: 28px;
    background: #f59e0b;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    z-index: 10;
  }

  /* Buyer Specific Display Area */
  .buyer-display-area {
    margin-top: 20px;
    background: white;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 2px solid #3E86C7;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    animation: fadeIn 0.4s ease;
  }

  .buyer-display-label {
    font-size: 13px;
    color: #3E86C7;
    font-weight: 700;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.8;
  }

  .buyer-display-text {
    font-size: 42px;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
    word-break: break-word;
  }

  .buyer-display-placeholder {
    color: #9ca3af;
    font-size: 16px;
    font-style: italic;
  }

  /* Bottom Navigation (Standard) */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-around;
    padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    z-index: 1000;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #9ca3af;
    font-size: 11px;
    transition: color 0.2s;
    cursor: pointer;
    flex: 1;
  }

  .nav-item.active {
    color: #0d9488;
  }
`;

function MobileVoicePage() {
  const router = useRouter();
  const { isNavVisible } = useNavLevel();
  const {
    isSessionActive,
    sellerLang,
    buyerLang,
    messages,
    setSellerLang,
    setBuyerLang,
    startSession,
    endSession,
    addMessage,
    loadFromLocalStorage
  } = useCommunicationStore();

  const vosk = useVoskRecognition();
  const [activeRole, setActiveRole] = useState<'seller' | 'buyer' | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [latestMessageForBuyer, setLatestMessageForBuyer] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const isCancelledRef = useRef(false);
  const sellerLangRef = useRef(sellerLang);
  const buyerLangRef = useRef(buyerLang);

  useEffect(() => {
    sellerLangRef.current = sellerLang;
    buyerLangRef.current = buyerLang;
  }, [sellerLang, buyerLang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Update latest message for buyer when messages change
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // Always show text in Buyer's language
      setLatestMessageForBuyer(lastMsg.sender === 'seller' ? lastMsg.translatedText : lastMsg.originalText);
    }

    // Auto-speak new messages
    if (messages.length > prevMessagesLengthRef.current) {
      const newMsgs = messages.slice(prevMessagesLengthRef.current);
      newMsgs.forEach(msg => {
        // Speak translated text to the target person
        if (msg.sender === 'seller') {
          speakText(msg.translatedText, buyerLangRef.current);
        } else {
          speakText(msg.translatedText, sellerLangRef.current);
        }
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!isSessionActive) return;
    const interval = setInterval(() => {
      loadFromLocalStorage();
    }, 1500);
    return () => clearInterval(interval);
  }, [isSessionActive, loadFromLocalStorage]);

  useEffect(() => {
    if (getIsElectron() && vosk.transcript) {
      setTranscript(vosk.transcript);
    }
  }, [vosk.transcript]);

  const handleSendMessage = async (text: string, sender: 'seller' | 'buyer') => {
    if (!text.trim()) return;
    setIsTranslating(true);
    try {
      const fromLang = sender === 'seller' ? sellerLangRef.current : buyerLangRef.current;
      const toLang = sender === 'seller' ? buyerLangRef.current : sellerLangRef.current;

      const translated = await translateText(text, fromLang, toLang);
      addMessage({
        sender,
        originalText: text,
        translatedText: translated,
        originalLang: fromLang,
        targetLang: toLang
      });
      setTranscript('');
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const startListening = async (role: 'seller' | 'buyer') => {
    const SpeechRecognitionAPI = typeof window !== 'undefined' ? (window.SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined;
    const currentLang = role === 'seller' ? sellerLangRef.current : buyerLangRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Microphone permission error:', err);
      return;
    }

    if (SpeechRecognitionAPI) {
      if (recognitionRef.current) recognitionRef.current.abort();
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = LANGUAGES[currentLang].speechCode;

      let fullTranscript = '';
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }
        fullTranscript = finalTranscript;
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        if (!isCancelledRef.current && fullTranscript.trim()) {
          handleSendMessage(fullTranscript.trim(), role);
        }
        isCancelledRef.current = false;
        setActiveRole(null);
        setTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setActiveRole(role);
    } else if (getIsElectron()) {
      await vosk.startListening();
      setActiveRole(role);
    }
  };

  const stopListening = (role: 'seller' | 'buyer') => {
    if (getIsElectron() && vosk.isListening) {
      vosk.stopListening();
      if (vosk.transcript.trim()) handleSendMessage(vosk.transcript.trim(), role);
      setActiveRole(null);
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setActiveRole(null);
    }
  };

  const cancelListening = () => {
    if (getIsElectron() && vosk.isListening) {
      vosk.stopListening();
      setActiveRole(null);
      return;
    }
    isCancelledRef.current = true;
    if (recognitionRef.current) recognitionRef.current.abort();
    setActiveRole(null);
    setTranscript('');
  };

  const handleNavigation = (path: string) => {
    router.push(`/web/mobile/${path}/`);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileVoiceStyles }} />
      <div className="mobile-voice-app">
        <div className="voice-header">
          <div className="header-top">
            <div className="header-title">
              <MessageSquare size={24} />
              สื่อสารลูกค้า
            </div>
          </div>
        </div>

        <div className="voice-content">
          {!isSessionActive ? (
            <div className="setup-card">
              <div className="card-title">เลือกภาษาสำหรับการสื่อสาร</div>
              <div className="language-grid">
                <div className="lang-select-group">
                  <span className="lang-label">ภาษาผู้ขาย (คุณ)</span>
                  <select
                    className="lang-select"
                    value={sellerLang}
                    onChange={(e) => setSellerLang(e.target.value as LanguageCode)}
                  >
                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                      <option key={code} value={code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
                <div className="lang-select-group">
                  <span className="lang-label">ภาษาผู้ซื้อ (ลูกค้า)</span>
                  <select
                    className="lang-select"
                    value={buyerLang}
                    onChange={(e) => setBuyerLang(e.target.value as LanguageCode)}
                  >
                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                      <option key={code} value={code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="hint-box">
                💡 คุณพูด {LANGUAGES[sellerLang].name} → ลูกค้าจะเห็นเป็น {LANGUAGES[buyerLang].name}
              </div>
              <button className="start-btn" onClick={startSession}>
                <Send size={18} />
                เริ่มการสนทนา
              </button>
            </div>
          ) : (
            <div className="chat-area-wrap">
              <div className="chat-container">
                <div className="chat-header">
                  <div className="chat-status">
                    🟢 {LANGUAGES[sellerLang].name} ↔ {LANGUAGES[buyerLang].name}
                  </div>
                  <button className="end-sess-btn" onClick={endSession}>จบการสนทนา</button>
                </div>
                <div className="message-list">
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
                      <Mic size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                      <div>กดปุ่มไมโครโฟนเพื่อพูด</div>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`bubble-wrap ${msg.sender === 'seller' ? 'seller' : 'buyer'}`}>
                      <div className={`bubble ${msg.sender === 'seller' ? 'seller' : 'buyer'}`}>
                        <div className="bubble-meta">
                          {msg.sender === 'seller' ? 'คุณ' : 'ลูกค้า'}
                        </div>
                        <div className="bubble-text">
                          {msg.sender === 'seller' ? msg.originalText : msg.translatedText}
                        </div>
                        {msg.sender === 'buyer' && msg.originalText !== msg.translatedText && (
                          <div className="bubble-original">
                            {msg.originalText}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="control-panel">
                  {transcript && (
                    <div className="transcript-preview">
                      <Mic size={14} /> {transcript}
                    </div>
                  )}
                  <div className="mic-grid">
                    <div className="mic-btn-wrap">
                      <span className="mic-label" style={{ color: '#0d9488' }}>👤 ผู้ขาย (คุณ)</span>
                      <button
                        className={`main-mic-btn seller ${activeRole === 'seller' ? 'listening' : ''}`}
                        onClick={activeRole === 'seller' ? () => stopListening('seller') : () => startListening('seller')}
                        disabled={activeRole === 'buyer'}
                      >
                        {activeRole === 'seller' ? <MicOff size={28} /> : <Mic size={28} />}
                        {activeRole === 'seller' && (
                          <div className="reset-mic-btn" onClick={(e) => { e.stopPropagation(); cancelListening(); }}>
                            <RotateCcw size={14} />
                          </div>
                        )}
                      </button>
                    </div>
                    <div className="mic-btn-wrap">
                      <span className="mic-label" style={{ color: '#3E86C7' }}>🛒 ผู้ซื้อ (ลูกค้า)</span>
                      <button
                        className={`main-mic-btn buyer ${activeRole === 'buyer' ? 'active' : ''}`}
                        onClick={activeRole === 'buyer' ? () => stopListening('buyer') : () => startListening('buyer')}
                        disabled={activeRole === 'seller'}
                      >
                        {activeRole === 'buyer' ? <MicOff size={28} /> : <Mic size={28} />}
                        {activeRole === 'buyer' && (
                          <div className="reset-mic-btn" onClick={(e) => { e.stopPropagation(); cancelListening(); }}>
                            <RotateCcw size={14} />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Large Display for Buyer */}
              <div className="buyer-display-area">
                <div className="buyer-display-label">
                  <Languages size={18} />
                  จอแสดงผลสำหรับผู้ซื้อ ({LANGUAGES[buyerLang].name})
                </div>
                {latestMessageForBuyer ? (
                  <div className="buyer-display-text">
                    {latestMessageForBuyer}
                  </div>
                ) : (
                  <div className="buyer-display-placeholder">
                    รอการสื่อสารจากผู้ขาย...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          {isNavVisible('P1') && <div className="nav-item" onClick={() => handleNavigation('index')}>
            <Home size={22} />
            <span>หน้าหลัก</span>
          </div>}
          {isNavVisible('P2') && <div className="nav-item" onClick={() => handleNavigation('checkin')}>
            <LogIn size={22} />
            <span>เข้างาน</span>
          </div>}
          {isNavVisible('P3') && <div className="nav-item" onClick={() => handleNavigation('sale')}>
            <ShoppingCart size={22} />
            <span>ขาย</span>
          </div>}
          {isNavVisible('P4') && <div className="nav-item" onClick={() => handleNavigation('gift')}>
            <DollarSign size={22} />
            <span>ค่าหยิบ</span>
          </div>}
          {/* {isNavVisible('P5') && <div className="nav-item" onClick={() => handleNavigation('product')}>
            <Box size={22} />
            <span>สินค้า</span>
          </div>} */}
          {isNavVisible('P6') && <div className="nav-item" onClick={() => handleNavigation('stock')}>
            <ClipboardList size={22} />
            <span>นับสินค้า</span>
          </div>}
          {isNavVisible('P7') && <div className="nav-item" onClick={() => handleNavigation('rc')}>
            <PackagePlus size={22} />
            <span>รับ</span>
          </div>}
          <div className="nav-item active">
            <MessageSquare size={22} />
            <span>สื่อสาร</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileVoicePage;
