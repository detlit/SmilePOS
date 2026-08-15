'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import axios from 'axios'
import {
  Thermometer, Search, Download, Printer, AlertTriangle,
  CalendarRange, CalendarDays, CheckCircle, XCircle, Droplets,
  BarChart3, ChevronDown, ChevronUp, Activity
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getLocalStorageItem } from '@/utils/localStorage'
import { useReactToPrint } from 'react-to-print'

export default function TemperatureReportTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [selectedPoint, setSelectedPoint] = useState<string>('all')
  const printRef = useRef<HTMLDivElement>(null)

  const [dateMode, setDateMode] = useState<'month' | 'range'>('month')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const c = getLocalStorageItem('company_')
        const res = await axios.get(`/api/setting/store/store?company=${c}`)
        if (res.data?.[0]) setStoreName(res.data[0].namestore || '')
      } catch { }
    }
    fetchStore()
  }, [])

  const getDateRange = () => {
    if (dateMode === 'month' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number)
      const from = new Date(y, m - 1, 1)
      const to = new Date(y, m, 0)
      return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
    }
    return { dateFrom, dateTo }
  }

  const fetchData = async () => {
    setLoading(true)
    const company = getLocalStorageItem('company_')
    const { dateFrom: df, dateTo: dt } = getDateRange()
    try {
      const res = await axios.get(`/api/sale_cal/temperature_report?company=${company}&startDate=${df}&endDate=${dt}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'รายงานอุณหภูมิ' })

  const handleExport = () => {
    if (!data) return
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryRows = data.points?.map((p: any) => ({
      'จุดวัด': p.name,
      'จำนวนบันทึก': p.count,
      'อุณหภูมิเฉลี่ย (°C)': p.avgTemp,
      'ต่ำสุด (°C)': p.minTemp,
      'สูงสุด (°C)': p.maxTemp,
      'ความชื้นเฉลี่ย (%)': p.avgHumidity,
      'นอกช่วง': p.outOfRange,
      'นอกช่วง %': p.outOfRangePercent,
      'กำหนด Min (°C)': p.settingMin,
      'กำหนด Max (°C)': p.settingMax,
    })) || []
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'สรุปจุดวัด')

    // Daily detail for each point
    data.points?.forEach((p: any) => {
      if (p.daily?.length > 0) {
        const dailyRows = p.daily.map((d: any) => ({
          'วันที่': d.date,
          'อุณหภูมิเฉลี่ย': d.avgTemp,
          'ต่ำสุด': d.minTemp,
          'สูงสุด': d.maxTemp,
          'ความชื้นเฉลี่ย': d.avgHumidity,
          'นอกช่วง': d.outOfRange,
          'จำนวนบันทึก': d.readings,
        }))
        const sheetName = p.name.substring(0, 30)
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), sheetName)
      }
    })

    // Out of range records
    if (data.recentOutOfRange?.length > 0) {
      const oorRows = data.recentOutOfRange.map((r: any, i: number) => ({
        '#': i + 1,
        'จุดวัด': r.pointName,
        'อุณหภูมิ': r.temperature,
        'ความชื้น': r.humidity,
        'วันที่': r.recordedAt ? new Date(r.recordedAt).toLocaleString('th-TH') : '',
        'ผู้บันทึก': r.recordedBy,
        'หมายเหตุ': r.note,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(oorRows), 'นอกช่วง')
    }

    XLSX.writeFile(wb, `รายงานอุณหภูมิ_${selectedMonth || dateFrom}.xlsx`)
  }

  const activePoint = useMemo(() => {
    if (!data?.points) return null
    if (selectedPoint === 'all') return null
    return data.points.find((p: any) => p.id === selectedPoint)
  }, [data, selectedPoint])

  return (
    <div ref={printRef} style={{ fontFamily: 'Kanit' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1E5088 0%, #3E86C7 50%, #6BA3D8 100%)',
        borderRadius: '16px', padding: '20px 24px', color: 'white', marginBottom: '12px',
        boxShadow: '0 4px 15px rgba(30, 80, 136,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontFamily: 'Kanit_B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Thermometer size={24} /> รายงานอุณหภูมิ
            </h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '13px' }}>Temperature Monitoring Report {storeName && `- ${storeName}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setDateMode('month')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'month' ? 'white' : 'transparent', color: dateMode === 'month' ? '#1E5088' : 'white',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><CalendarDays size={14} /> เดือน</button>
              <button onClick={() => setDateMode('range')} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Kanit_B',
                background: dateMode === 'range' ? 'white' : 'transparent', color: dateMode === 'range' ? '#1E5088' : 'white',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><CalendarRange size={14} /> ช่วงเวลา</button>
            </div>
            {dateMode === 'month' ? (
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontFamily: 'Kanit' }} />
            ) : (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontFamily: 'Kanit' }} />
                <span style={{ color: 'white', fontSize: '12px' }}>ถึง</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontFamily: 'Kanit' }} />
              </div>
            )}
            <button onClick={fetchData} style={{
              padding: '6px 16px', background: 'white', color: '#1E5088', border: 'none', borderRadius: '8px',
              fontFamily: 'Kanit_B', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}><Search size={14} /> ค้นหา</button>
            <button onClick={() => handlePrint()} style={{
              padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'Kanit_B'
            }}><Printer size={14} /> พิมพ์</button>
            <button onClick={handleExport} style={{
              padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'Kanit_B'
            }}><Download size={14} /> Excel</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div className="spinner-border text-primary" />
          <p style={{ marginTop: '12px', fontFamily: 'Kanit' }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { icon: <Activity size={20} />, label: 'บันทึกทั้งหมด', value: data.summary.totalReadings, color: '#1E5088', bg: '#F3F8FC' },
              { icon: <Thermometer size={20} />, label: 'จุดวัด', value: data.summary.totalPoints, color: '#7c3aed', bg: '#f5f3ff' },
              { icon: <CalendarDays size={20} />, label: 'วันที่บันทึก', value: data.summary.recordingDays, color: '#2A6AAA', bg: '#F3F8FC' },
              { icon: <CheckCircle size={20} />, label: 'Compliance Rate', value: `${data.summary.complianceRate}%`, color: data.summary.complianceRate >= 95 ? '#147F56' : data.summary.complianceRate >= 80 ? '#ea580c' : '#dc2626', bg: data.summary.complianceRate >= 95 ? '#EDF9F3' : data.summary.complianceRate >= 80 ? '#fff7ed' : '#fef2f2' },
              { icon: <XCircle size={20} />, label: 'นอกช่วงกำหนด', value: data.summary.totalOutOfRange, color: '#dc2626', bg: '#fef2f2' },
            ].map((card, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ background: card.bg, borderRadius: '8px', padding: '6px', color: card.color }}>{card.icon}</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{card.label}</span>
                </div>
                <div style={{ fontSize: '18px', fontFamily: 'Kanit_B', color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Point Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {data.points?.map((p: any) => {
              const isGood = p.outOfRangePercent <= 5
              return (
                <div key={p.id} onClick={() => setSelectedPoint(selectedPoint === p.id ? 'all' : p.id)}
                  style={{
                    background: 'white', borderRadius: '12px', padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: selectedPoint === p.id ? '2px solid #3E86C7' : '1px solid #e2e8f0',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontFamily: 'Kanit_B', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Thermometer size={16} color="#3E86C7" /> {p.name}
                    </h4>
                    <span style={{
                      background: isGood ? '#EDF9F3' : '#fef2f2',
                      color: isGood ? '#147F56' : '#dc2626',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Kanit_B',
                    }}>
                      {isGood ? 'ปกติ' : 'มีผิดปกติ'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div style={{ textAlign: 'center', background: '#F3F8FC', borderRadius: '8px', padding: '8px' }}>
                      <div style={{ fontSize: '16px', fontFamily: 'Kanit_B', color: '#1E5088' }}>{p.avgTemp}°C</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>เฉลี่ย</div>
                    </div>
                    <div style={{ textAlign: 'center', background: '#F3F8FC', borderRadius: '8px', padding: '8px' }}>
                      <div style={{ fontSize: '12px', fontFamily: 'Kanit_B', color: '#2A6AAA' }}>{p.minTemp} - {p.maxTemp}°C</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>ต่ำ-สูงสุด</div>
                    </div>
                    <div style={{ textAlign: 'center', background: '#fdf4ff', borderRadius: '8px', padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        <Droplets size={12} color="#7c3aed" />
                        <span style={{ fontSize: '14px', fontFamily: 'Kanit_B', color: '#7c3aed' }}>{p.avgHumidity}%</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>ความชื้น</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>{p.count} บันทึก</span>
                    <span style={{ color: p.outOfRange > 0 ? '#dc2626' : '#147F56' }}>
                      นอกช่วง {p.outOfRange} ({p.outOfRangePercent}%)
                    </span>
                    <span>กำหนด {p.settingMin}-{p.settingMax}°C</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Daily Detail for selected point */}
          {activePoint && (
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
              <div style={{ background: '#F3F8FC', padding: '12px 16px', borderBottom: '2px solid #3E86C7' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontFamily: 'Kanit_B', color: '#1E5088' }}>
                  รายละเอียดรายวัน - {activePoint.name}
                </h4>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '40vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>วันที่</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>เฉลี่ย °C</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>ต่ำสุด °C</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>สูงสุด °C</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>ความชื้น %</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>นอกช่วง</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>บันทึก</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontFamily: 'Kanit_B', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '200px' }}>อุณหภูมิ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePoint.daily?.map((d: any, i: number) => {
                      const isOOR = d.outOfRange > 0
                      const tempRange = activePoint.settingMax - activePoint.settingMin || 20
                      const barMin = activePoint.settingMin - 2
                      const barWidth = tempRange + 4
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: isOOR ? '#fef2f2' : 'transparent' }}>
                          <td style={{ padding: '8px', fontFamily: 'Kanit', color: '#334155' }}>{d.date}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#1E5088' }}>{d.avgTemp}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#2A6AAA' }}>{d.minTemp}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626' }}>{d.maxTemp}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#7c3aed' }}>{d.avgHumidity}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: isOOR ? '#dc2626' : '#147F56', fontFamily: 'Kanit_B' }}>{d.outOfRange}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>{d.readings}</td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ position: 'relative', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                              {/* Acceptable range */}
                              <div style={{
                                position: 'absolute',
                                left: `${((activePoint.settingMin - barMin) / barWidth) * 100}%`,
                                width: `${(tempRange / barWidth) * 100}%`,
                                height: '100%', background: '#E5EEF8', opacity: 0.5,
                              }} />
                              {/* Avg temp indicator */}
                              <div style={{
                                position: 'absolute',
                                left: `${Math.max(0, Math.min(100, ((d.avgTemp - barMin) / barWidth) * 100))}%`,
                                width: '4px', height: '100%', background: '#3E86C7', borderRadius: '2px',
                                transform: 'translateX(-2px)',
                              }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Out of Range */}
          {data.recentOutOfRange?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ background: '#fef2f2', padding: '12px 16px', borderBottom: '2px solid #ef4444' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontFamily: 'Kanit_B', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> บันทึกนอกช่วงกำหนดล่าสุด
                </h4>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '30vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontFamily: 'Kanit_B', borderBottom: '2px solid #e2e8f0' }}>จุดวัด</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', borderBottom: '2px solid #e2e8f0' }}>อุณหภูมิ °C</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', borderBottom: '2px solid #e2e8f0' }}>ความชื้น %</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontFamily: 'Kanit_B', borderBottom: '2px solid #e2e8f0' }}>วันที่-เวลา</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontFamily: 'Kanit_B', borderBottom: '2px solid #e2e8f0' }}>ผู้บันทึก</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontFamily: 'Kanit_B', borderBottom: '2px solid #e2e8f0' }}>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOutOfRange.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontFamily: 'Kanit_B', color: '#334155' }}>{r.pointName}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'Kanit_B', color: '#dc2626' }}>{r.temperature}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#7c3aed' }}>{r.humidity}</td>
                        <td style={{ padding: '8px', color: '#475569', fontSize: '11px' }}>
                          {r.recordedAt ? new Date(r.recordedAt).toLocaleString('th-TH') : '-'}
                        </td>
                        <td style={{ padding: '8px', color: '#64748b', fontSize: '11px' }}>{r.recordedBy || '-'}</td>
                        <td style={{ padding: '8px', color: '#64748b', fontSize: '11px' }}>{r.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <Thermometer size={48} strokeWidth={1} />
          <p style={{ marginTop: '12px' }}>กรุณาเลือกช่วงเวลาแล้วกด "ค้นหา"</p>
        </div>
      )}
    </div>
  )
}
