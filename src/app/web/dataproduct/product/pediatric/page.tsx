
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import styles from "../../../componant/mystyle.module.css";
import { useMessageStore } from "../../useMessageStore";
import { toast } from 'sonner'

const apis = "datalist"

function PediatricDosePage() {

  const ids = useMessageStore((state) => state.ids)
  const itemcodes = useMessageStore((state) => state.itemcodes)

  const [all, setall] = useState<any>({
    id: "",
    code: "",
    ProductName: "",
    fixname: "",
    Unit: "",
    Barcode: "",
    concentration: null,
    dosePerKg: null,
    doseFrequency: null,
    maxDosePerDay: null,
  })

  const [concentration, setConcentration] = useState("")
  const [dosePerKg, setDosePerKg] = useState("")
  const [doseFrequency, setDoseFrequency] = useState("")
  const [maxDosePerDay, setMaxDosePerDay] = useState("")

  const [testWeight, setTestWeight] = useState("")

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`/api/${apis}/${Number(ids)}`)
        if (res.data) {
          setall(res.data)
          setConcentration(res.data.concentration != null ? String(res.data.concentration) : "")
          setDosePerKg(res.data.dosePerKg != null ? String(res.data.dosePerKg) : "")
          setDoseFrequency(res.data.doseFrequency != null ? String(res.data.doseFrequency) : "")
          setMaxDosePerDay(res.data.maxDosePerDay != null ? String(res.data.maxDosePerDay) : "")
        }
      } catch (error) {
        console.error(error)
      }
    }
    if (ids) fetchPost()
  }, [ids])

  const calcResult = useMemo(() => {
    const conc = parseFloat(concentration)
    const dose = parseFloat(dosePerKg)
    const freq = parseInt(doseFrequency)
    const maxD = parseFloat(maxDosePerDay)
    const weight = parseFloat(testWeight)

    if (!conc || !dose || !freq || !weight || conc <= 0 || freq <= 0 || weight <= 0) return null

    const totalDosePerDay = dose * weight
    const dosePerTimeMg = totalDosePerDay / freq
    const dosePerTimeMl = dosePerTimeMg / conc
    const dosePerTimeTeaspoon = dosePerTimeMl / 5
    const isOverMax = maxD > 0 && totalDosePerDay > maxD

    return {
      totalDosePerDay: Math.round(totalDosePerDay * 100) / 100,
      dosePerTimeMg: Math.round(dosePerTimeMg * 100) / 100,
      dosePerTimeMl: Math.round(dosePerTimeMl * 100) / 100,
      dosePerTimeTeaspoon: Math.round(dosePerTimeTeaspoon * 100) / 100,
      isOverMax,
      maxD,
    }
  }, [concentration, dosePerKg, doseFrequency, maxDosePerDay, testWeight])

  const handleSave = async () => {
    try {
      await axios.put(`/api/${apis}/${Number(all.id)}`, {
        ...all,
        concentration: concentration ? parseFloat(concentration) : null,
        dosePerKg: dosePerKg ? parseFloat(dosePerKg) : null,
        doseFrequency: doseFrequency ? parseInt(doseFrequency) : null,
        maxDosePerDay: maxDosePerDay ? parseFloat(maxDosePerDay) : null,
      })
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>บันทึกข้อมูลสินค้าน้ำเด็กเรียบร้อย</div>,
        duration: 3000,
      })
    } catch (error) {
      console.error(error)
      toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>เกิดข้อผิดพลาด</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 15 }}>ไม่สามารถบันทึกได้</div>,
        duration: 3000,
      })
    }
  }

  return (
    <form className='form'>
      <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Left Column - Product Info & Dose Config */}
        <div>
          {/* Product Info Card */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{
              background: '#f8fafc',
              padding: '10px 16px',
              borderBottom: '1px solid #e2e8f0',
              borderLeft: '4px solid #3E86C7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Kanit_B',
              fontSize: '14px',
              color: '#1e293b'
            }}>
              <span style={{ fontSize: '18px' }}>📦</span> ข้อมูลสินค้า
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                <div><span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#999' }}>รหัส :</span> <span style={{ fontFamily: 'Kanit_B', fontSize: 12 }}>{all.code}</span></div>
                <div><span style={{ fontFamily: 'Kanit', fontSize: 11, color: '#999' }}>Barcode :</span> <span style={{ fontFamily: 'Kanit', fontSize: 12 }}>{all.Barcode}</span></div>
              </div>
              <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#333', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{all.ProductName}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#666' }}>ชื่อสามัญ : {all.fixname}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#666' }}>หน่วย : {all.Unit}</div>
            </div>
          </div>

          {/* Pediatric Dose Config Card */}
          <div style={{ border: '1px solid #E5EEF8', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{
              background: '#F3F8FC',
              padding: '10px 16px',
              borderBottom: '1px solid #E5EEF8',
              borderLeft: '4px solid #3E86C7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Kanit_B',
              fontSize: '14px',
              color: '#1e293b'
            }}>
              <span style={{ fontSize: '18px' }}>💧</span> ข้อมูลสินค้าน้ำเด็ก
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Concentration */}
                <div>
                  <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>ความเข้มข้น (mg/ml)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    placeholder="เช่น 24 (= 120mg/5ml)"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #d1d5db', fontFamily: 'Kanit', fontSize: 13,
                      outline: 'none', transition: 'border 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3E86C7'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#999', marginTop: 2 }}>
                    ตัวอย่าง: Paracetamol 120mg/5ml → ความเข้มข้น = 24 mg/ml
                  </div>
                </div>

                {/* Dose per kg */}
                <div>
                  <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>ขนาดสินค้าแนะนำ (mg/kg/day)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dosePerKg}
                    onChange={(e) => setDosePerKg(e.target.value)}
                    placeholder="เช่น 30"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #d1d5db', fontFamily: 'Kanit', fontSize: 13,
                      outline: 'none', transition: 'border 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3E86C7'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>จำนวนครั้ง/วัน</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={doseFrequency}
                    onChange={(e) => setDoseFrequency(e.target.value)}
                    placeholder="เช่น 3"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #d1d5db', fontFamily: 'Kanit', fontSize: 13,
                      outline: 'none', transition: 'border 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3E86C7'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* Max dose per day */}
                <div>
                  <label style={{ fontFamily: 'Kanit', fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>ขนาดสินค้าสูงสุด/วัน (mg/day)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxDosePerDay}
                    onChange={(e) => setMaxDosePerDay(e.target.value)}
                    placeholder="เช่น 1000"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #d1d5db', fontFamily: 'Kanit', fontSize: 13,
                      outline: 'none', transition: 'border 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3E86C7'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#999', marginTop: 2 }}>
                    ถ้าคำนวณแล้วเกินจะแจ้งเตือนสีแดง
                  </div>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={handleSave}
                    style={{
                      padding: '8px 24px', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                      color: 'white', fontFamily: 'Kanit_B', fontSize: 14,
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(62, 134, 199,0.3)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    💾 บันทึก
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Test Calculator */}
        <div>
          <div style={{ border: '1px solid #fde68a', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{
              background: '#fffbeb',
              padding: '10px 16px',
              borderBottom: '1px solid #fde68a',
              borderLeft: '4px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Kanit_B',
              fontSize: '14px',
              color: '#1e293b'
            }}>
              <span style={{ fontSize: '18px' }}>🧮</span> ทดสอบคำนวณ
            </div>
            <div style={{ padding: '16px' }}>
              {/* Weight Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: 'Kanit', fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>น้ำหนักเด็ก (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={testWeight}
                  onChange={(e) => setTestWeight(e.target.value)}
                  placeholder="กรอกน้ำหนัก เช่น 12"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '2px solid #f59e0b', fontFamily: 'Kanit_B', fontSize: 16,
                    outline: 'none', background: '#fffef5',
                  }}
                />
              </div>

              {/* Result Display */}
              {calcResult ? (
                <div style={{
                  background: calcResult.isOverMax ? '#fef2f2' : '#EDF9F3',
                  border: `2px solid ${calcResult.isOverMax ? '#fecaca' : '#A9E1C6'}`,
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#333', marginBottom: 12 }}>
                    ผลคำนวณ
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#666' }}>ครั้งละ (mg)</span>
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 16, color: '#333' }}>{calcResult.dosePerTimeMg} mg</span>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: '#F3F8FC', borderRadius: 8, border: '2px solid #3E86C7'
                    }}>
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#173F6B' }}>ครั้งละ (ml)</span>
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 20, color: '#173F6B' }}>{calcResult.dosePerTimeMl} ml</span>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: '#faf5ff', borderRadius: 8, border: '2px solid #a855f7'
                    }}>
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#7c3aed' }}>ครั้งละ (ช้อนชา)</span>
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 20, color: '#7c3aed' }}>{calcResult.dosePerTimeTeaspoon} ช้อนชา</span>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#666' }}>จำนวนครั้ง/วัน</span>
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#333' }}>{doseFrequency} ครั้ง</span>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px',
                      background: calcResult.isOverMax ? '#fef2f2' : 'white',
                      borderRadius: 8,
                      border: `1px solid ${calcResult.isOverMax ? '#fecaca' : '#e2e8f0'}`
                    }}>
                      <span style={{ fontFamily: 'Kanit', fontSize: 12, color: calcResult.isOverMax ? '#dc2626' : '#666' }}>รวม/วัน (mg)</span>
                      <span style={{ fontFamily: 'Kanit_B', fontSize: 14, color: calcResult.isOverMax ? '#dc2626' : '#333' }}>
                        {calcResult.totalDosePerDay} mg
                      </span>
                    </div>

                    {calcResult.maxD > 0 && (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0'
                      }}>
                        <span style={{ fontFamily: 'Kanit', fontSize: 12, color: '#666' }}>ขนาดสินค้าสูงสุด/วัน</span>
                        <span style={{ fontFamily: 'Kanit_B', fontSize: 14, color: '#333' }}>{calcResult.maxD} mg</span>
                      </div>
                    )}
                  </div>

                  {calcResult.isOverMax && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px', background: '#dc2626',
                      borderRadius: 8, color: 'white', fontFamily: 'Kanit_B', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      ⚠️ ขนาดสินค้าเกิน Max Dose! ({calcResult.totalDosePerDay} mg {'>'} {calcResult.maxD} mg/day)
                    </div>
                  )}

                  {!calcResult.isOverMax && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px', background: '#2A6AAA',
                      borderRadius: 8, color: 'white', fontFamily: 'Kanit_B', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      ✅ ขนาดสินค้าอยู่ในเกณฑ์ปลอดภัย
                    </div>
                  )}

                  {/* Label Preview */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: 'Kanit_B', fontSize: 12, color: '#666', marginBottom: 6 }}>ตัวอย่างข้อความบนฉลากสินค้า:</div>
                    <div style={{
                      padding: '12px 16px', background: 'white', borderRadius: 8,
                      border: '1px dashed #d1d5db',
                    }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#333' }}>
                        👶 น้ำหนัก {testWeight} kg
                      </div>
                      <div style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#173F6B', marginTop: 2 }}>
                        รับประทานครั้งละ {calcResult.dosePerTimeMl} ml ({calcResult.dosePerTimeTeaspoon} ช้อนชา)
                      </div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#333', marginTop: 2 }}>
                        วันละ {doseFrequency} ครั้ง
                      </div>
                      {calcResult.isOverMax && (
                        <div style={{ fontFamily: 'Kanit_B', fontSize: 11, color: '#dc2626', marginTop: 4 }}>
                          ⚠️ เกิน max dose ({calcResult.totalDosePerDay}/{calcResult.maxD} mg/day)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#f8fafc', border: '2px dashed #d1d5db',
                  borderRadius: 12, padding: 24, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>💧</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 13, color: '#999' }}>
                    {(!concentration || !dosePerKg || !doseFrequency) ?
                      'กรุณากรอกข้อมูลสินค้าน้ำเด็กก่อน (ด้านซ้าย)' :
                      'กรอกน้ำหนักเด็ก (kg) เพื่อดูผลคำนวณ'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export default PediatricDosePage
