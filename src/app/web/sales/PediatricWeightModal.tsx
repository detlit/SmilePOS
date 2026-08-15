'use client'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import Modal1 from 'react-bootstrap/Modal'

interface PediatricWeightModalProps {
  show: boolean
  onClose: () => void
  onConfirm: (weight: number) => void
  onSkip: () => void
  pendingProduct: any | null
  currentWeight: number
}

export default function PediatricWeightModal({ show, onClose, onConfirm, onSkip, pendingProduct, currentWeight }: PediatricWeightModalProps) {
  const [weight, setWeight] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (show) {
      setWeight(currentWeight > 0 ? String(currentWeight) : "")
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [show])

  const handleConfirm = () => {
    const w = parseFloat(weight)
    if (w > 0) onConfirm(w)
  }

  const calcPreview = useMemo(() => {
    if (!pendingProduct) return null
    const w = parseFloat(weight)
    const conc = pendingProduct.concentration || 0
    const dose = pendingProduct.dosePerKg || 0
    const freq = pendingProduct.doseFrequency || 1
    const maxD = pendingProduct.maxDosePerDay || 0
    if (!w || w <= 0 || conc <= 0 || dose <= 0) return null

    const totalDosePerDay = dose * w
    const dosePerTimeMg = totalDosePerDay / freq
    const dosePerTimeMl = Math.round((dosePerTimeMg / conc) * 100) / 100
    const dosePerTimeTeaspoon = Math.round((dosePerTimeMl / 5) * 100) / 100
    const isOverMax = maxD > 0 && totalDosePerDay > maxD

    return { dosePerTimeMg: Math.round(dosePerTimeMg * 100) / 100, dosePerTimeMl, dosePerTimeTeaspoon, totalDosePerDay: Math.round(totalDosePerDay * 100) / 100, freq, isOverMax, maxD }
  }, [pendingProduct, weight])

  const isValid = weight !== "" && parseFloat(weight) > 0

  return (
    <Modal1 show={show} onHide={onClose} centered>
      <Modal1.Header closeButton style={{ background: 'linear-gradient(135deg, #F3F8FC 0%, #E5EEF8 100%)', borderBottom: '2px solid #A6C8E7' }}>
        <Modal1.Title style={{ fontFamily: 'Kanit_B', fontSize: 16, color: '#173F6B' }}>
          💧 คำนวณสินค้าน้ำเด็ก
        </Modal1.Title>
      </Modal1.Header>
      <Modal1.Body style={{ padding: 20 }}>
        <div>
          <div style={{ background: '#fefce8', borderRadius: 8, padding: '8px 12px', marginBottom: 12, border: '1px solid #fde68a', fontFamily: 'Kanit', fontSize: 11, color: '#92400e' }}>
            กรอกน้ำหนักครั้งเดียว ระบบจะคำนวณให้กับ<b>สินค้าน้ำเด็กทุกรายการ</b>ในบิลนี้
          </div>

          {pendingProduct && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#333', marginBottom: 4 }}>{pendingProduct.ProductName}</div>
              <div style={{ display: 'flex', gap: 16, fontFamily: 'Kanit', fontSize: 12, color: '#666' }}>
                <span>ความเข้มข้น: <b style={{ color: '#173F6B' }}>{pendingProduct.concentration} mg/ml</b></span>
                <span>Dose: <b>{pendingProduct.dosePerKg} mg/kg/day</b></span>
                <span>วันละ: <b>{pendingProduct.doseFrequency} ครั้ง</b></span>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>น้ำหนักเด็ก (kg)</label>
            <input
              ref={inputRef}
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
              placeholder="กรอกน้ำหนัก เช่น 12"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '2px solid #3E86C7', fontFamily: 'Kanit_B', fontSize: 18,
                outline: 'none', background: '#F3F8FC', textAlign: 'center',
              }}
            />
          </div>

          {pendingProduct && calcPreview ? (
            <div style={{
              background: calcPreview.isOverMax ? '#fef2f2' : '#EDF9F3',
              border: `2px solid ${calcPreview.isOverMax ? '#fecaca' : '#A9E1C6'}`,
              borderRadius: 12, padding: 14,
            }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F3F8FC', borderRadius: 8, border: '1px solid #CCDFF1' }}>
                  <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#173F6B' }}>ครั้งละ</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 16, color: '#173F6B' }}>{calcPreview.dosePerTimeMl} ml ({calcPreview.dosePerTimeTeaspoon} ช้อนชา)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#666' }}>ครั้งละ (mg)</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#333' }}>{calcPreview.dosePerTimeMg} mg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#666' }}>วันละ</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#333' }}>{calcPreview.freq} ครั้ง</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', padding: '6px 10px',
                  background: calcPreview.isOverMax ? '#fef2f2' : 'white',
                  borderRadius: 8, border: `1px solid ${calcPreview.isOverMax ? '#fecaca' : '#e2e8f0'}`
                }}>
                  <span style={{ fontFamily: 'Kanit', fontSize: 12, color: calcPreview.isOverMax ? '#dc2626' : '#666' }}>รวม/วัน</span>
                  <span style={{ fontFamily: 'Kanit_B', fontSize: 13, color: calcPreview.isOverMax ? '#dc2626' : '#333' }}>{calcPreview.totalDosePerDay} mg {calcPreview.maxD > 0 ? `(max ${calcPreview.maxD})` : ''}</span>
                </div>
              </div>
              {calcPreview.isOverMax && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#dc2626', borderRadius: 8, color: 'white', fontFamily: 'Kanit_B', fontSize: 12 }}>
                  ⚠️ ขนาดสินค้าเกิน Max Dose! ({calcPreview.totalDosePerDay} {'>'} {calcPreview.maxD} mg/day)
                </div>
              )}
            </div>
          ) : !pendingProduct && parseFloat(weight) > 0 ? (
            <div style={{ background: '#F3F8FC', border: '2px solid #CCDFF1', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#173F6B' }}>จะคำนวณสินค้าน้ำเด็กทุกรายการด้วยน้ำหนัก <b>{weight} kg</b></div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '2px dashed #d1d5db', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 30 }}>💧</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#999' }}>กรอกน้ำหนักเด็ก (kg) เพื่อดูผลคำนวณ</div>
            </div>
          )}
        </div>
      </Modal1.Body>
      <Modal1.Footer style={{ borderTop: '1px solid #e2e8f0' }}>
        <button
          onClick={onSkip}
          style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', fontFamily: 'Kanit', fontSize: 14, color: '#666', cursor: 'pointer' }}
        >
          ข้าม
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          style={{
            padding: '8px 24px', borderRadius: 8, border: 'none',
            background: !isValid ? '#d1d5db' : 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
            color: 'white', fontFamily: 'Kanit_B', fontSize: 14,
            cursor: !isValid ? 'not-allowed' : 'pointer',
            boxShadow: !isValid ? 'none' : '0 2px 8px rgba(62, 134, 199,0.3)',
          }}
        >
          ✅ ยืนยัน
        </button>
      </Modal1.Footer>
    </Modal1>
  )
}
