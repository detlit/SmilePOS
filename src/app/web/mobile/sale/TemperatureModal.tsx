'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import Modal1 from 'react-bootstrap/Modal'
import Button1 from 'react-bootstrap/Button'
import styles from "../../componant/mystyle.module.css"
import dynamic from 'next/dynamic'

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface TemperatureRecord {
  id: number
  company: string
  recordDate: string
  recordPoint: number
  recordTime: number
  temperature: number
  humidity: number
  locationType: string
  person: string
}

interface TemperatureSetting {
  roomTempMin: number
  roomTempMax: number
  roomHumidMin: number
  roomHumidMax: number
  fridgeTempMin: number
  fridgeTempMax: number
}

interface TemperaturePoint {
  id: number
  company: string
  pointNumber: number
  pointName: string
  detail: string
  locationType: string
  isActive: boolean
}

export default function TemperatureModal() {
  const [show, setShow] = useState(false)
  const [showSetting, setShowSetting] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [companyS, setCompanyS] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [personS, setPersonS] = useState("")

  // Form states
  const [recordPoint, setRecordPoint] = useState(1)
  const [recordDate, setRecordDate] = useState(toThaiDateString())
  const [recordTime, setRecordTime] = useState(1)
  const [temperature, setTemperature] = useState("")
  const [humidity, setHumidity] = useState("")
  const [locationType, setLocationType] = useState("room")

  // Data states
  const [records, setRecords] = useState<TemperatureRecord[]>([])
  const [setting, setSetting] = useState<TemperatureSetting>({
    roomTempMin: 0,
    roomTempMax: 30,
    roomHumidMin: 30,
    roomHumidMax: 50,
    fridgeTempMin: 2,
    fridgeTempMax: 8,
  })

  // Filter states
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [filterPoint, setFilterPoint] = useState(0)

  // Tab state
  const [activeTab, setActiveTab] = useState<'record' | 'table' | 'chart'>('record')

  // Point settings states
  const [points, setPoints] = useState<TemperaturePoint[]>([])
  const [editingPoint, setEditingPoint] = useState<number>(1)
  const [pointName, setPointName] = useState('')
  const [pointDetail, setPointDetail] = useState('')
  const [pointLocationType, setPointLocationType] = useState('room')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCompanyS(localStorage.getItem("company_") || "")
      setCompanyName(localStorage.getItem("cp_") || "")
      setPersonS(localStorage.getItem("person_") || "")
    }
  }, [])

  useEffect(() => {
    if (show && companyS) {
      fetchRecords()
      fetchSetting()
      fetchPoints()
    }
  }, [show, companyS, filterMonth, filterYear, filterPoint])

  useEffect(() => {
    if (showSetting && companyS) {
      fetchPoints()
    }
  }, [showSetting, companyS])

  const fetchRecords = async () => {
    try {
      let url = `/api/temperature?company=${companyS}&month=${filterMonth}&year=${filterYear}`
      if (filterPoint > 0) url += `&point=${filterPoint}`
      const res = await axios.get(url)
      setRecords(res.data)
    } catch (error) {
      console.error("Error fetching records:", error)
    }
  }

  const fetchSetting = async () => {
    try {
      const res = await axios.get(`/api/temperature/setting?company=${companyS}`)
      setSetting(res.data)
    } catch (error) {
      console.error("Error fetching setting:", error)
    }
  }

  const fetchPoints = async () => {
    try {
      const res = await axios.get(`/api/temperature/point?company=${companyS}`)
      setPoints(res.data)
    } catch (error) {
      console.error("Error fetching points:", error)
    }
  }

  const handleSavePoint = async () => {
    if (!pointName) {
      alert("กรุณากรอกชื่อจุดบันทึก")
      return
    }

    try {
      await axios.post('/api/temperature/point', {
        company: companyS,
        pointNumber: editingPoint,
        pointName,
        detail: pointDetail,
        locationType: pointLocationType,
      })
      alert("บันทึกจุดบันทึกสำเร็จ")
      fetchPoints()
    } catch (error) {
      console.error("Error saving point:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  // Load point data when editing point changes
  useEffect(() => {
    const point = points.find(p => p.pointNumber === editingPoint)
    if (point) {
      setPointName(point.pointName || '')
      setPointDetail(point.detail || '')
      setPointLocationType(point.locationType || 'room')
    } else {
      setPointName('')
      setPointDetail('')
      setPointLocationType('room')
    }
  }, [editingPoint, points])

  const handleSave = async () => {
    if (!temperature) {
      alert("กรุณากรอกอุณหภูมิ")
      return
    }
    if (locationType === 'room' && !humidity) {
      alert("กรุณากรอกความชื้น")
      return
    }

    try {
      await axios.post('/api/temperature', {
        company: companyS,
        recordDate,
        recordPoint,
        recordTime,
        temperature,
        humidity: locationType === 'fridge' ? 0 : humidity,
        locationType,
        person: personS,
      })
      alert("บันทึกสำเร็จ")
      setTemperature("")
      setHumidity("")
      fetchRecords()
    } catch (error) {
      console.error("Error saving record:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  const handleSaveSetting = async () => {
    try {
      await axios.post('/api/temperature/setting', {
        company: companyS,
        ...setting,
      })
      alert("บันทึกการตั้งค่าสำเร็จ")
      setShowSetting(false)
    } catch (error) {
      console.error("Error saving setting:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("ต้องการลบข้อมูลนี้หรือไม่?")) return
    
    try {
      await axios.delete(`/api/temperature?id=${id}`)
      alert("ลบข้อมูลสำเร็จ")
      fetchRecords()
    } catch (error) {
      console.error("Error deleting record:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  const handleAutoGenerate = async () => {
    if (points.length === 0) {
      alert("กรุณาตั้งค่าจุดบันทึกก่อน")
      return
    }

    if (!confirm("ต้องการสร้างข้อมูลอัตโนมัติสำหรับวันที่เลือกหรือไม่?")) return

    try {
      const recordTimes = [1, 2, 3] // ครั้งที่ 1, 2 และ 3
      let createdCount = 0

      for (const point of points) {
        for (const time of recordTimes) {
          // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
          const existingRecord = records.find(r => {
            const rDate = toThaiDateString(r.recordDate)
            return rDate === recordDate && r.recordPoint === point.pointNumber && r.recordTime === time
          })

          if (existingRecord) continue // ข้ามถ้ามีข้อมูลแล้ว

          // หาค่าเมื่อวานของจุดนี้
          const yesterday = new Date(recordDate)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = toThaiDateString(yesterday)
          
          const yesterdayRecords = records.filter(r => {
            const rDate = toThaiDateString(r.recordDate)
            return rDate === yesterdayStr && r.recordPoint === point.pointNumber
          })
          
          let baseTemp = 25 // ค่าเริ่มต้น
          let baseHumid = 45 // ค่าเริ่มต้น

          if (yesterdayRecords.length > 0) {
            baseTemp = yesterdayRecords.reduce((sum, r) => sum + r.temperature, 0) / yesterdayRecords.length
            baseHumid = yesterdayRecords.reduce((sum, r) => sum + r.humidity, 0) / yesterdayRecords.length
          }

          // Random ค่า +-2 สำหรับอุณหภูมิ, +-2 สำหรับความชื้น
          let randomTemp = baseTemp + (Math.random() * 4 - 2) // +-2
          let randomHumid = baseHumid + (Math.random() * 4 - 2) // +-2

          // ตรวจสอบไม่ให้เกิน setpoint
          const isRoom = point.locationType === 'room'
          const minTemp = isRoom ? setting.roomTempMin : setting.fridgeTempMin
          const maxTemp = isRoom ? setting.roomTempMax : setting.fridgeTempMax
          const minHumid = setting.roomHumidMin
          const maxHumid = setting.roomHumidMax

          // จำกัดค่าให้อยู่ในช่วง setpoint
          randomTemp = Math.max(minTemp, Math.min(maxTemp, randomTemp))
          randomHumid = Math.max(minHumid, Math.min(maxHumid, randomHumid))

          // ปัดทศนิยม 1 ตำแหน่ง
          randomTemp = Math.round(randomTemp * 10) / 10
          randomHumid = Math.round(randomHumid * 10) / 10

          // ถ้าเป็นตู้เย็นไม่ต้องบันทึกความชื้น
          if (!isRoom) randomHumid = 0

          await axios.post('/api/temperature', {
            company: companyS,
            recordDate,
            recordPoint: point.pointNumber,
            recordTime: time,
            temperature: randomTemp,
            humidity: randomHumid,
            locationType: point.locationType,
            person: personS,
          })
          createdCount++
        }
      }

      if (createdCount > 0) {
        alert(`สร้างข้อมูลอัตโนมัติสำเร็จ ${createdCount} รายการ`)
        fetchRecords()
      } else {
        alert("มีข้อมูลครบแล้วสำหรับวันนี้")
      }
    } catch (error) {
      console.error("Error auto generating:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  // Generate months dropdown
  const months = [
    { value: 1, label: "มกราคม" },
    { value: 2, label: "กุมภาพันธ์" },
    { value: 3, label: "มีนาคม" },
    { value: 4, label: "เมษายน" },
    { value: 5, label: "พฤษภาคม" },
    { value: 6, label: "มิถุนายน" },
    { value: 7, label: "กรกฎาคม" },
    { value: 8, label: "สิงหาคม" },
    { value: 9, label: "กันยายน" },
    { value: 10, label: "ตุลาคม" },
    { value: 11, label: "พฤศจิกายน" },
    { value: 12, label: "ธันวาคม" },
  ]

  // Generate years dropdown (current year - 2 to current year + 1)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i)

  // Group records by date for table display
  const groupedRecords = records.reduce((acc: any, record) => {
    const date = new Date(record.recordDate).toLocaleDateString('th-TH')
    if (!acc[date]) acc[date] = []
    acc[date].push(record)
    return acc
  }, {})

  // Chart data preparation
  const getChartData = () => {
    const pointData: { [key: number]: { temps: number[], humids: number[], dates: string[] } } = {}
    
    // เรียงลำดับ records ตามวันที่จากน้อยไปมาก
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
    )
    
    sortedRecords.forEach(record => {
      if (!pointData[record.recordPoint]) {
        pointData[record.recordPoint] = { temps: [], humids: [], dates: [] }
      }
      pointData[record.recordPoint].temps.push(record.temperature)
      pointData[record.recordPoint].humids.push(record.humidity)
      pointData[record.recordPoint].dates.push(new Date(record.recordDate).toLocaleDateString('th-TH'))
    })

    return pointData
  }

  const chartData = getChartData()
  const selectedPointData = filterPoint > 0 ? chartData[filterPoint] : Object.values(chartData)[0]

  const tempChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'line', height: 250, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: selectedPointData?.dates || [] },
    yaxis: { 
      title: { text: 'อุณหภูมิ (°C)' },
      min: 0,
      max: 40,
    },
    annotations: {
      yaxis: [
        {
          y: locationType === 'room' ? setting.roomTempMin : setting.fridgeTempMin,
          y2: locationType === 'room' ? setting.roomTempMax : setting.fridgeTempMax,
          fillColor: '#00E396',
          opacity: 0.2,
          label: { text: 'ช่วงปกติ' }
        }
      ]
    },
    colors: ['#FF4560'],
    title: { text: `กราฟอุณหภูมิ จุดที่ ${filterPoint || 1}`, style: { fontFamily: 'Kanit' } },
  }

  const humidChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'line', height: 250, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: selectedPointData?.dates || [] },
    yaxis: { 
      title: { text: 'ความชื้น (%)' },
      min: 0,
      max: 100,
    },
    annotations: {
      yaxis: [
        {
          y: setting.roomHumidMin,
          y2: setting.roomHumidMax,
          fillColor: '#008FFB',
          opacity: 0.2,
          label: { text: 'ช่วงปกติ' }
        }
      ]
    },
    colors: ['#008FFB'],
    title: { text: `กราฟความชื้น จุดที่ ${filterPoint || 1}`, style: { fontFamily: 'Kanit' } },
  }

  return (
    <>
      <button
        type='button'
        onClick={() => setShow(true)}
        style={{ fontFamily: "Kanit", fontSize: 13, height: 32, paddingLeft: 12, paddingRight: 12 }}
        className='btn btn-outline-success p-1 shadow-sm rounded border'
      >
        🌡️ บันทึกอุณหภูมิ
      </button>

      {/* Main Modal */}
      <Modal1 show={show} onHide={() => setShow(false)} fullscreen className="no-print">
        <Modal1.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal1.Title style={{ fontFamily: 'Kanit_B', fontSize: 18, color: '#333' }}>
            📊 ตารางบันทึกอุณหภูมิ พื้นที่ขายสินค้า
          </Modal1.Title>
        </Modal1.Header>
        <Modal1.Body style={{ fontFamily: 'Kanit', padding: 20 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '2px solid #e0e0e0', paddingBottom: 10 }}>
            <button
              onClick={() => setActiveTab('record')}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: activeTab === 'record' ? '#3E86C7' : '#f0f0f0',
                color: activeTab === 'record' ? 'white' : '#333',
                fontFamily: 'Kanit',
                cursor: 'pointer',
              }}
            >
              📝 บันทึกข้อมูล
            </button>
            <button
              onClick={() => setActiveTab('table')}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: activeTab === 'table' ? '#2196F3' : '#f0f0f0',
                color: activeTab === 'table' ? 'white' : '#333',
                fontFamily: 'Kanit',
                cursor: 'pointer',
              }}
            >
              📋 ตารางประจำเดือน
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: activeTab === 'chart' ? '#FF9800' : '#f0f0f0',
                color: activeTab === 'chart' ? 'white' : '#333',
                fontFamily: 'Kanit',
                cursor: 'pointer',
              }}
            >
              📈 กราฟ
            </button>
            <button
              onClick={() => setShowSetting(true)}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: '#9C27B0',
                color: 'white',
                fontFamily: 'Kanit',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              ⚙️ ตั้งค่า
            </button>
          </div>

          {/* Record Tab */}
          {activeTab === 'record' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ backgroundColor: '#f8f9fa', padding: 20, borderRadius: 12 }}>
                <h5 style={{ fontFamily: 'Kanit_B', marginBottom: 15, color: '#333' }}>📍 ข้อมูลการบันทึก</h5>
                
                <div style={{ marginBottom: 15 }}>
                  <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>จุดที่บันทึก</label>
                  <select
                    value={recordPoint}
                    onChange={(e) => {
                      const pointNum = parseInt(e.target.value)
                      setRecordPoint(pointNum)
                      const point = points.find(p => p.pointNumber === pointNum)
                      if (point) {
                        setLocationType(point.locationType || 'room')
                      }
                    }}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const point = points.find(p => p.pointNumber === i + 1)
                      return (
                        <option key={i + 1} value={i + 1}>
                          จุดที่ {i + 1} {point?.pointName ? `- ${point.pointName}` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {/* แสดงรายละเอียดจุดที่เลือก */}
                  {points.find(p => p.pointNumber === recordPoint)?.detail && (
                    <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff8e1', borderRadius: 6, fontSize: 12, color: '#666' }}>
                      📝 {points.find(p => p.pointNumber === recordPoint)?.detail}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 15 }}>
                  <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>วัน/เดือน/ปี (dd/mm/yyyy)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <select
                      value={parseInt(recordDate.split('-')[2]) || 1}
                      onChange={(e) => {
                        const parts = recordDate.split('-')
                        setRecordDate(`${parts[0]}-${parts[1]}-${e.target.value.padStart(2, '0')}`)
                      }}
                      style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                    >
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{(i + 1).toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    <select
                      value={parseInt(recordDate.split('-')[1]) || 1}
                      onChange={(e) => {
                        const parts = recordDate.split('-')
                        setRecordDate(`${parts[0]}-${e.target.value.padStart(2, '0')}-${parts[2]}`)
                      }}
                      style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                    >
                      {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={parseInt(recordDate.split('-')[0]) || new Date().getFullYear()}
                      onChange={(e) => {
                        const parts = recordDate.split('-')
                        setRecordDate(`${e.target.value}-${parts[1]}-${parts[2]}`)
                      }}
                      style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return <option key={year} value={year}>{year + 543}</option>
                      })}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 15 }}>
                  <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>ครั้งที่บันทึก</label>
                  <select
                    value={recordTime}
                    onChange={(e) => setRecordTime(parseInt(e.target.value))}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                  >
                    <option value={1}>ครั้งที่ 1 (เช้า)</option>
                    <option value={2}>ครั้งที่ 2 (กลางวัน)</option>
                    <option value={3}>ครั้งที่ 3 (เย็น)</option>
                  </select>
                </div>

                <div style={{ marginBottom: 15 }}>
                  <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>ประเภทพื้นที่</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                  >
                    <option value="room">ห้อง (พื้นที่ขายสินค้า)</option>
                    <option value="fridge">ตู้เย็น</option>
                  </select>
                </div>

                <div style={{ marginBottom: 15, padding: 10, backgroundColor: '#F3F8FC', borderRadius: 8 }}>
                  <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>👤 ผู้บันทึก</label>
                  <div style={{ fontFamily: 'Kanit_B', fontSize: 15, color: '#173F6B' }}>{personS || '-'}</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#fff3e0', padding: 20, borderRadius: 12 }}>
                <h5 style={{ fontFamily: 'Kanit_B', marginBottom: 15, color: '#333' }}>🌡️ ค่าที่วัดได้</h5>
                
                <div style={{ marginBottom: 15 }}>
                  <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>
                    อุณหภูมิ (°C) 
                    <span style={{ fontSize: 11, color: '#999', marginLeft: 5 }}>
                      {locationType === 'room' 
                        ? `(ปกติ: ${setting.roomTempMin}-${setting.roomTempMax}°C)` 
                        : `(ปกติ: ${setting.fridgeTempMin}-${setting.fridgeTempMax}°C)`}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="เช่น 25.5"
                    style={{ 
                      width: '100%', 
                      padding: 12, 
                      borderRadius: 8, 
                      border: '2px solid #FF9800', 
                      fontFamily: 'Kanit',
                      fontSize: 16,
                    }}
                  />
                </div>

                {locationType === 'room' && (
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>
                      ความชื้น (%)
                      <span style={{ fontSize: 11, color: '#999', marginLeft: 5 }}>
                        (ปกติ: {setting.roomHumidMin}-{setting.roomHumidMax}%)
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={humidity}
                      onChange={(e) => setHumidity(e.target.value)}
                      placeholder="เช่น 45.0"
                      style={{ 
                        width: '100%', 
                        padding: 12, 
                        borderRadius: 8, 
                        border: '2px solid #2196F3', 
                        fontFamily: 'Kanit',
                        fontSize: 16,
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={handleSave}
                  style={{
                    width: '100%',
                    padding: 12,
                    backgroundColor: '#3E86C7',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'Kanit_B',
                    fontSize: 16,
                    cursor: 'pointer',
                    marginTop: 10,
                  }}
                >
                  💾 บันทึกข้อมูล
                </button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={handleAutoGenerate}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'transparent',
                      color: '#999',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: 'pointer',
                      opacity: 0.6,
                    }}
                    title="สร้างข้อมูลอัตโนมัติ"
                  >
                    🎲
                  </button>
                </div>

                {/* Daily Records Table */}
                <div style={{ marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 15 }}>
                  <h6 style={{ fontFamily: 'Kanit_B', fontSize: 13, color: '#666', marginBottom: 10 }}>
                    📋 ข้อมูลที่บันทึกวันที่ {recordDate.split('-')[2]}/{recordDate.split('-')[1]}/{parseInt(recordDate.split('-')[0]) + 543}
                  </h6>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead style={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: 6, borderBottom: '1px solid #ddd', textAlign: 'center' }}>จุด</th>
                          <th style={{ padding: 6, borderBottom: '1px solid #ddd', textAlign: 'center' }}>ครั้ง</th>
                          <th style={{ padding: 6, borderBottom: '1px solid #ddd', textAlign: 'center' }}>°C</th>
                          <th style={{ padding: 6, borderBottom: '1px solid #ddd', textAlign: 'center' }}>%</th>
                          <th style={{ padding: 6, borderBottom: '1px solid #ddd', textAlign: 'center', width: 30 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.filter(r => {
                          const rDate = toThaiDateString(r.recordDate)
                          return rDate === recordDate
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: 15, textAlign: 'center', color: '#999' }}>
                              ยังไม่มีข้อมูลวันนี้
                            </td>
                          </tr>
                        ) : (
                          records.filter(r => {
                            const rDate = toThaiDateString(r.recordDate)
                            return rDate === recordDate
                          }).map(record => {
                            const point = points.find(p => p.pointNumber === record.recordPoint)
                            return (
                              <tr key={record.id} style={{ backgroundColor: record.locationType === 'fridge' ? '#e3f2fd' : 'white' }}>
                                <td style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                                  {record.recordPoint}
                                  {point?.pointName && <span style={{ display: 'block', fontSize: 9, color: '#666' }}>{point.pointName}</span>}
                                </td>
                                <td style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'center' }}>{record.recordTime}</td>
                                <td style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold', color: '#FF5722' }}>{record.temperature}</td>
                                <td style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold', color: '#2196F3' }}>{record.humidity}</td>
                                <td style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleDeleteRecord(record.id)}
                                    style={{ padding: '2px 6px', backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}
                                    title="ลบ"
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Tab */}
          {activeTab === 'table' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 15, marginBottom: 20, alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666', marginRight: 8 }}>เดือน:</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', marginRight: 8 }}>ปี:</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y + 543}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', marginRight: 8 }}>จุด:</label>
                  <select
                    value={filterPoint}
                    onChange={(e) => setFilterPoint(parseInt(e.target.value))}
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                  >
                    <option value={0}>ทั้งหมด</option>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>จุดที่ {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'left' }}>วันที่</th>
                      <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'center' }}>จุด</th>
                      <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'center' }}>ครั้ง</th>
                      <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'center' }}>ประเภท</th>
                      <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'center' }}>อุณหภูมิ (°C)</th>
                      <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'center' }}>ความชื้น (%)</th>
                      <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'center' }}>ผู้บันทึก</th>
                      <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'center', width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#999' }}>
                          ไม่มีข้อมูลในเดือนนี้
                        </td>
                      </tr>
                    ) : (
                      records.map((record, idx) => {
                        const tempInRange = locationType === 'room'
                          ? record.temperature >= setting.roomTempMin && record.temperature <= setting.roomTempMax
                          : record.temperature >= setting.fridgeTempMin && record.temperature <= setting.fridgeTempMax
                        const humidInRange = record.humidity >= setting.roomHumidMin && record.humidity <= setting.roomHumidMax

                        return (
                          <tr key={record.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                              {new Date(record.recordDate).toLocaleDateString('th-TH')}
                            </td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                              {record.recordPoint}
                              {points.find(p => p.pointNumber === record.recordPoint)?.pointName && (
                                <span style={{ display: 'block', fontSize: 10, color: '#666' }}>
                                  {points.find(p => p.pointNumber === record.recordPoint)?.pointName}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                              {record.recordTime}
                            </td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                              {record.locationType === 'room' ? '🏠 ห้อง' : '❄️ ตู้เย็น'}
                            </td>
                            <td style={{ 
                              padding: 10, 
                              borderBottom: '1px solid #eee', 
                              textAlign: 'center',
                              backgroundColor: tempInRange ? '#F3F8FC' : '#ffebee',
                              color: tempInRange ? '#0C5238' : '#c62828',
                              fontWeight: 'bold',
                            }}>
                              {record.temperature}
                            </td>
                            <td style={{ 
                              padding: 10, 
                              borderBottom: '1px solid #eee', 
                              textAlign: 'center',
                              backgroundColor: humidInRange ? '#e3f2fd' : '#ffebee',
                              color: humidInRange ? '#1565c0' : '#c62828',
                              fontWeight: 'bold',
                            }}>
                              {record.humidity}
                            </td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                              {record.person}
                            </td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#ffebee',
                                  color: '#c62828',
                                  border: '1px solid #ef9a9a',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                }}
                                title="ลบข้อมูล"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 15, marginBottom: 20, alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666', marginRight: 8 }}>เดือน:</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', marginRight: 8 }}>ปี:</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y + 543}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowReport(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#9C27B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontFamily: 'Kanit',
                    fontSize: 13,
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  🖨️ Report
                </button>
              </div>

              {/* Charts for all points with names */}
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {points.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#999' }}>
                    ยังไม่มีการตั้งค่าจุดบันทึก กรุณาตั้งค่าจุดบันทึกก่อน
                  </div>
                ) : (
                  points.map(point => {
                    const pointChartData = chartData[point.pointNumber]
                    const pointName = point.pointName || `จุดที่ ${point.pointNumber}`
                    const isRoom = point.locationType === 'room'
                    
                    const pointTempOptions: ApexCharts.ApexOptions = {
                      chart: { type: 'line', height: 200, toolbar: { show: false } },
                      stroke: { curve: 'smooth', width: 2 },
                      xaxis: { categories: pointChartData?.dates || [] },
                      yaxis: { title: { text: '°C' }, min: isRoom ? 0 : -5, max: isRoom ? 40 : 15 },
                      annotations: {
                        yaxis: [{
                          y: isRoom ? setting.roomTempMin : setting.fridgeTempMin,
                          y2: isRoom ? setting.roomTempMax : setting.fridgeTempMax,
                          fillColor: '#00E396',
                          opacity: 0.2,
                          label: { text: 'ช่วงปกติ' }
                        }]
                      },
                      colors: ['#FF4560'],
                      title: { text: `กราฟอุณหภูมิ จุดที่ ${point.pointNumber} - ${pointName}`, style: { fontFamily: 'Kanit', fontSize: '13px' } },
                    }

                    const pointHumidOptions: ApexCharts.ApexOptions = {
                      chart: { type: 'line', height: 200, toolbar: { show: false } },
                      stroke: { curve: 'smooth', width: 2 },
                      xaxis: { categories: pointChartData?.dates || [] },
                      yaxis: { title: { text: '%' }, min: 0, max: 100 },
                      annotations: {
                        yaxis: [{
                          y: setting.roomHumidMin,
                          y2: setting.roomHumidMax,
                          fillColor: '#008FFB',
                          opacity: 0.2,
                          label: { text: 'ช่วงปกติ' }
                        }]
                      },
                      colors: ['#008FFB'],
                      title: { text: `กราฟความชื้น จุดที่ ${point.pointNumber} - ${pointName}`, style: { fontFamily: 'Kanit', fontSize: '13px' } },
                    }

                    return (
                      <div key={point.id} style={{ marginBottom: 20, padding: 15, backgroundColor: isRoom ? '#fafafa' : '#e3f2fd', borderRadius: 12, border: '1px solid #e0e0e0' }}>
                        <div style={{ fontFamily: 'Kanit_B', fontSize: 14, marginBottom: 10, color: '#333' }}>
                          {isRoom ? '🏠' : '❄️'} จุดที่ {point.pointNumber} - {pointName}
                          {point.detail && <span style={{ fontSize: 11, color: '#666', marginLeft: 10 }}>({point.detail})</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isRoom ? '1fr 1fr' : '1fr', gap: 15 }}>
                          <div style={{ backgroundColor: 'white', padding: 10, borderRadius: 8 }}>
                            {pointChartData && pointChartData.temps.length > 0 ? (
                              <ApexChart
                                options={pointTempOptions}
                                series={[{ name: 'อุณหภูมิ', data: pointChartData.temps }]}
                                type="line"
                                height={200}
                              />
                            ) : (
                              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                ไม่มีข้อมูล
                              </div>
                            )}
                          </div>
                          {isRoom && (
                            <div style={{ backgroundColor: 'white', padding: 10, borderRadius: 8 }}>
                              {pointChartData && pointChartData.humids.length > 0 ? (
                                <ApexChart
                                  options={pointHumidOptions}
                                  series={[{ name: 'ความชื้น', data: pointChartData.humids }]}
                                  type="line"
                                  height={200}
                                />
                              ) : (
                                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                  ไม่มีข้อมูล
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </Modal1.Body>
      </Modal1>

      {/* Setting Modal */}
      <Modal1 show={showSetting} onHide={() => setShowSetting(false)} centered>
        <Modal1.Header closeButton style={{ backgroundColor: '#9C27B0', color: 'white' }}>
          <Modal1.Title style={{ fontFamily: 'Kanit_B', fontSize: 16 }}>
            ⚙️ ตั้งค่าช่วงอุณหภูมิและความชื้น
          </Modal1.Title>
        </Modal1.Header>
        <Modal1.Body style={{ fontFamily: 'Kanit', padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Point Settings */}
          <div style={{ backgroundColor: '#fff8e1', padding: 15, borderRadius: 10, marginBottom: 15 }}>
            <h6 style={{ fontFamily: 'Kanit_B', marginBottom: 15, color: '#333' }}>📍 ตั้งค่าจุดบันทึก</h6>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>เลือกจุดที่</label>
                <select
                  value={editingPoint}
                  onChange={(e) => setEditingPoint(parseInt(e.target.value))}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      จุดที่ {i + 1} {points.find(p => p.pointNumber === i + 1)?.pointName ? `(${points.find(p => p.pointNumber === i + 1)?.pointName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>ชื่อจุดบันทึก</label>
                <input
                  type="text"
                  value={pointName}
                  onChange={(e) => setPointName(e.target.value)}
                  placeholder="เช่น ชั้นวางสินค้า 1, ตู้เย็นเก็บสินค้า"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#666' }}>ประเภทพื้นที่</label>
              <select
                value={pointLocationType}
                onChange={(e) => setPointLocationType(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit' }}
              >
                <option value="room">🏠 ห้อง (พื้นที่ขายสินค้า)</option>
                <option value="fridge">❄️ ตู้เย็น</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#666' }}>รายละเอียดจุดบันทึก</label>
              <textarea
                value={pointDetail}
                onChange={(e) => setPointDetail(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม เช่น ตำแหน่งที่ตั้ง, อุปกรณ์ที่ใช้วัด"
                rows={2}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'Kanit', resize: 'none' }}
              />
            </div>
            <button
              onClick={handleSavePoint}
              style={{
                padding: '8px 16px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'Kanit',
                cursor: 'pointer',
              }}
            >
              💾 บันทึกจุดที่ {editingPoint}
            </button>

            {/* List of saved points */}
            {points.length > 0 && (
              <div style={{ marginTop: 15, borderTop: '1px solid #ddd', paddingTop: 10 }}>
                <label style={{ fontSize: 12, color: '#666', marginBottom: 5, display: 'block' }}>จุดที่บันทึกแล้ว:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {points.map(p => (
                    <span
                      key={p.id}
                      onClick={() => setEditingPoint(p.pointNumber)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: p.locationType === 'fridge' ? '#e3f2fd' : '#F3F8FC',
                        borderRadius: 12,
                        fontSize: 11,
                        cursor: 'pointer',
                        border: editingPoint === p.pointNumber ? '2px solid #FF9800' : '1px solid #ddd',
                      }}
                    >
                      {p.locationType === 'fridge' ? '❄️' : '🏠'} {p.pointNumber}. {p.pointName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Room Settings */}
          <div style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 15 }}>
            <h6 style={{ fontFamily: 'Kanit_B', marginBottom: 15, color: '#333' }}>🏠 ห้อง (พื้นที่ขายสินค้า)</h6>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>อุณหภูมิต่ำสุด (°C)</label>
                <input
                  type="number"
                  value={setting.roomTempMin}
                  onChange={(e) => setSetting({ ...setting, roomTempMin: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>อุณหภูมิสูงสุด (°C)</label>
                <input
                  type="number"
                  value={setting.roomTempMax}
                  onChange={(e) => setSetting({ ...setting, roomTempMax: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>ความชื้นต่ำสุด (%)</label>
                <input
                  type="number"
                  value={setting.roomHumidMin}
                  onChange={(e) => setSetting({ ...setting, roomHumidMin: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>ความชื้นสูงสุด (%)</label>
                <input
                  type="number"
                  value={setting.roomHumidMax}
                  onChange={(e) => setSetting({ ...setting, roomHumidMax: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
            </div>
          </div>

          {/* Fridge Settings */}
          <div style={{ backgroundColor: '#e3f2fd', padding: 15, borderRadius: 10 }}>
            <h6 style={{ fontFamily: 'Kanit_B', marginBottom: 15, color: '#333' }}>❄️ ตู้เย็น</h6>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>อุณหภูมิต่ำสุด (°C)</label>
                <input
                  type="number"
                  value={setting.fridgeTempMin}
                  onChange={(e) => setSetting({ ...setting, fridgeTempMin: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>อุณหภูมิสูงสุด (°C)</label>
                <input
                  type="number"
                  value={setting.fridgeTempMax}
                  onChange={(e) => setSetting({ ...setting, fridgeTempMax: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
            </div>
          </div>
        </Modal1.Body>
        <Modal1.Footer>
          <Button1 variant="secondary" onClick={() => setShowSetting(false)}>
            ยกเลิก
          </Button1>
          <Button1 variant="primary" onClick={handleSaveSetting} style={{ backgroundColor: '#9C27B0', borderColor: '#9C27B0' }}>
            💾 บันทึกการตั้งค่า
          </Button1>
        </Modal1.Footer>
      </Modal1>

      {/* Report Modal - A4 Landscape */}
      <Modal1 show={showReport} onHide={() => setShowReport(false)} fullscreen>
        <Modal1.Header closeButton style={{ backgroundColor: '#9C27B0', color: 'white' }}>
          <Modal1.Title style={{ fontFamily: 'Kanit_B', fontSize: 16 }}>
            🖨️ รายงานบันทึกอุณหภูมิ - {months.find(m => m.value === filterMonth)?.label} {filterYear + 543}
          </Modal1.Title>
          <button
            onClick={() => window.print()}
            style={{
              marginLeft: 'auto',
              marginRight: 20,
              padding: '8px 20px',
              backgroundColor: '#3E86C7',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontFamily: 'Kanit_B',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            🖨️ พิมพ์
          </button>
        </Modal1.Header>
        <Modal1.Body style={{ fontFamily: 'Kanit', padding: 20, backgroundColor: '#f5f5f5' }}>
          <style>{`
            @media print {
              @page { 
                size: A4 landscape; 
                margin: 5mm; 
              }
              
              /* ซ่อนทุกอย่าง */
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              body > * {
                display: none !important;
              }
              
              /* ซ่อน Modal หลัก */
              .no-print, .no-print * {
                display: none !important;
              }
              
              /* แสดงเฉพาะ Report modal และ print-area */
              body > .modal:not(.no-print),
              .modal.show:not(.no-print) {
                display: block !important;
                position: static !important;
                overflow: visible !important;
              }
              .modal-backdrop {
                display: none !important;
              }
              .modal-dialog {
                max-width: none !important;
                margin: 0 !important;
                position: static !important;
              }
              .modal-content {
                border: none !important;
                box-shadow: none !important;
                position: static !important;
              }
              .modal-header {
                display: none !important;
              }
              .modal-body {
                padding: 0 !important;
                overflow: visible !important;
                position: static !important;
              }
              
              /* print-area styles */
              .print-area {
                display: block !important;
                position: static !important;
                width: 100% !important;
              }
              .print-page {
                display: block !important;
                visibility: visible !important;
                width: 287mm !important;
                height: 190mm !important;
                padding: 5mm !important;
                margin: 0 !important;
                background: white !important;
                box-shadow: none !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
              }
              .print-page:last-child {
                page-break-after: auto !important;
              }
              
              /* รักษาสี */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            
            .print-page {
              width: 297mm;
                height: 210mm;
              padding: 10mm;
              margin: 0 auto 20px;
              background: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: visible;
            }
          `}</style>
          
          <div className="print-area">
            {points.map(point => {
              const pointRecords = records.filter(r => r.recordPoint === point.pointNumber)
              const pointChartData = chartData[point.pointNumber]
              const isRoom = point.locationType === 'room'
              
              // Get days in month
              const daysInMonth = new Date(filterYear, filterMonth, 0).getDate()
              
              // Create lookup for records by day and time
              const recordLookup: { [key: string]: TemperatureRecord | undefined } = {}
              pointRecords.forEach(r => {
                const day = new Date(r.recordDate).getDate()
                const key = `${day}-${r.recordTime}`
                recordLookup[key] = r
              })

              return (
                <div key={point.id} className="print-page">
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 8, borderBottom: '2px solid #333', paddingBottom: 6 }}>
                    <h2 style={{ fontFamily: 'Kanit_B', fontSize: 16, margin: 0, color: '#333' }}>
                      ตารางบันทึกอุณหภูมิ พื้นที่ขายสินค้า
                    </h2>
                    <div style={{ fontSize: 12, marginTop: 3 }}>
                      ร้าน {companyName || 'ไม่ระบุ'} | เดือน {months.find(m => m.value === filterMonth)?.label} {filterYear + 543}
                    </div>
                  </div>

                  {/* Point Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: 6, backgroundColor: isRoom ? '#f1f1f1ff' : '#e3f2fd', borderRadius: 4, fontSize: 11 }}>
                    <div>
                      <strong>{isRoom ? '🏠' : '❄️'} จุดที่ {point.pointNumber} - {point.pointName || 'ไม่ระบุชื่อ'}</strong>
                      {point.detail && <span style={{ marginLeft: 10, color: '#666' }}>({point.detail})</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      ช่วงอุณหภูมิ: {isRoom ? `${setting.roomTempMin} - ${setting.roomTempMax}` : `${setting.fridgeTempMin} - ${setting.fridgeTempMax}`} °C
                      {isRoom && <span style={{ marginLeft: 15 }}>ความชื้น: {setting.roomHumidMin} - {setting.roomHumidMax} %</span>}
                    </div>
                  </div>

                  {/* Content: Table and Charts side by side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: 8, height: 'calc(190mm - 100px)' }}>
                    {/* Table - All days in month */}
                    <div style={{ overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, border: '1px solid #ccc' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ padding: 3, border: '1px solid #ccc', textAlign: 'center', width: 28 }}>วัน</th>
                            <th colSpan={isRoom ? 3 : 2} style={{ padding: 3, border: '1px solid #ccc', textAlign: 'center', backgroundColor: '#fff3e0' }}>ครั้งที่ 1</th>
                            <th colSpan={isRoom ? 3 : 2} style={{ padding: 3, border: '1px solid #ccc', textAlign: 'center', backgroundColor: '#F3F8FC' }}>ครั้งที่ 2</th>
                            <th colSpan={isRoom ? 3 : 2} style={{ padding: 3, border: '1px solid #ccc', textAlign: 'center', backgroundColor: '#e3f2fd' }}>ครั้งที่ 3</th>
                          </tr>
                          <tr style={{ backgroundColor: '#fafafa' }}>
                            <th style={{ padding: 2, border: '1px solid #ccc' }}></th>
                            <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>°C</th>
                            {isRoom && <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>%</th>}
                            <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>ผู้บันทึก</th>
                            <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>°C</th>
                            {isRoom && <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>%</th>}
                            <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>ผู้บันทึก</th>
                            <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>°C</th>
                            {isRoom && <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>%</th>}
                            <th style={{ padding: 2, border: '1px solid #ccc', textAlign: 'center' }}>ผู้บันทึก</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const record1 = recordLookup[`${day}-1`]
                            const record2 = recordLookup[`${day}-2`]
                            const record3 = recordLookup[`${day}-3`]
                            return (
                              <tr key={day} style={{ backgroundColor: day % 2 === 0 ? '#fafafa' : 'white', height: `${Math.floor(140 / daysInMonth)}mm` }}>
                                <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', fontWeight: 'bold' }}>{day}</td>
                                <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', color: '#FF5722', fontWeight: record1 ? 'bold' : 'normal' }}>
                                  {record1?.temperature || '-'}
                                </td>
                                {isRoom && (
                                  <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', color: '#2196F3', fontWeight: record1 ? 'bold' : 'normal' }}>
                                    {record1?.humidity || '-'}
                                  </td>
                                )}
                                <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', fontSize: 8 }}>
                                  {record1?.person || '-'}
                                </td>
                                <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', color: '#FF5722', fontWeight: record2 ? 'bold' : 'normal' }}>
                                  {record2?.temperature || '-'}
                                </td>
                                {isRoom && (
                                  <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', color: '#2196F3', fontWeight: record2 ? 'bold' : 'normal' }}>
                                    {record2?.humidity || '-'}
                                  </td>
                                )}
                                <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', fontSize: 8 }}>
                                  {record2?.person || '-'}
                                </td>
                                <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', color: '#FF5722', fontWeight: record3 ? 'bold' : 'normal' }}>
                                  {record3?.temperature || '-'}
                                </td>
                                {isRoom && (
                                  <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', color: '#2196F3', fontWeight: record3 ? 'bold' : 'normal' }}>
                                    {record3?.humidity || '-'}
                                  </td>
                                )}
                                <td style={{ padding: 2, border: '1px solid #eee', textAlign: 'center', fontSize: 8 }}>
                                  {record3?.person || '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Charts - Temperature and Humidity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ backgroundColor: '#fff5f5', padding: 5, borderRadius: 4, flex: 0.3 }}>
                        <div style={{ fontFamily: 'Kanit_B', fontSize: 10, marginBottom: 3, color: '#333' }}>📈 กราฟอุณหภูมิ</div>
                        {pointChartData && pointChartData.temps.length > 0 ? (
                          <ApexChart
                            options={{
                              chart: { type: 'line', height: 200, toolbar: { show: false }, animations: { enabled: false } },
                              stroke: { curve: 'smooth', width: 2 },
                              xaxis: { categories: pointChartData.dates, labels: { style: { fontSize: '6px' }, rotate: -45 } },
                              yaxis: { title: { text: '°C', style: { fontSize: '8px' } }, min: isRoom ? 0 : -5, max: isRoom ? 40 : 15, labels: { style: { fontSize: '7px' } } },
                              colors: ['#FF4560'],
                              title: { text: `อุณหภูมิ (${isRoom ? `${setting.roomTempMin}-${setting.roomTempMax}` : `${setting.fridgeTempMin}-${setting.fridgeTempMax}`}°C)`, style: { fontFamily: 'Kanit', fontSize: '9px' } },
                              legend: { show: false },
                              grid: { padding: { left: 5, right: 5, top: 0, bottom: 0 } },
                              annotations: {
                                yaxis: [
                                  {
                                    y: isRoom ? setting.roomTempMin : setting.fridgeTempMin,
                                    borderColor: '#3E86C7',
                                    strokeDashArray: 3,
                                    label: { text: `Min ${isRoom ? setting.roomTempMin : setting.fridgeTempMin}°C`, style: { fontSize: '7px', color: '#3E86C7' }, position: 'left' }
                                  },
                                  {
                                    y: isRoom ? setting.roomTempMax : setting.fridgeTempMax,
                                    borderColor: '#F44336',
                                    strokeDashArray: 3,
                                    label: { text: `Max ${isRoom ? setting.roomTempMax : setting.fridgeTempMax}°C`, style: { fontSize: '7px', color: '#F44336' }, position: 'left' }
                                  }
                                ]
                              },
                            }}
                            series={[{ name: 'อุณหภูมิ', data: pointChartData.temps }]}
                            type="line"
                            height={isRoom ? 200 : 200}
                          />
                        ) : (
                          <div style={{ height: isRoom ? 75 : 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 10 }}>
                            ไม่มีข้อมูล
                          </div>
                        )}
                      </div>
                      {isRoom && (
                        <div style={{ backgroundColor: '#f5f9ff', padding: 5, borderRadius: 4, flex: 0.3}}>
                          <div style={{ fontFamily: 'Kanit_B', fontSize: 10, marginBottom: 3, color: '#333' }}>💧 กราฟความชื้น</div>
                          {pointChartData && pointChartData.humids.length > 0 ? (
                            <ApexChart
                              options={{
                                chart: { type: 'line', height: 200, toolbar: { show: false }, animations: { enabled: false } },
                                stroke: { curve: 'smooth', width: 2 },
                                xaxis: { categories: pointChartData.dates, labels: { style: { fontSize: '6px' }, rotate: -45 } },
                                yaxis: { title: { text: '%', style: { fontSize: '8px' } }, min: 0, max: 70, labels: { style: { fontSize: '7px' } } },
                                colors: ['#008FFB'],
                                title: { text: `ความชื้น (${setting.roomHumidMin}-${setting.roomHumidMax}%)`, style: { fontFamily: 'Kanit', fontSize: '9px' } },
                                legend: { show: false },
                                grid: { padding: { left: 5, right: 5, top: 0, bottom: 0 } },
                                annotations: {
                                  yaxis: [
                                    {
                                      y: setting.roomHumidMin,
                                      borderColor: '#3E86C7',
                                      strokeDashArray: 3,
                                      label: { text: `Min ${setting.roomHumidMin}%`, style: { fontSize: '7px', color: '#3E86C7' }, position: 'left' }
                                    },
                                    {
                                      y: setting.roomHumidMax,
                                      borderColor: '#F44336',
                                      strokeDashArray: 3,
                                      label: { text: `Max ${setting.roomHumidMax}%`, style: { fontSize: '7px', color: '#F44336' }, position: 'left' }
                                    }
                                  ]
                                },
                              }}
                              series={[{ name: 'ความชื้น', data: pointChartData.humids }]}
                              type="line"
                              height={200}
                            />
                          ) : (
                            <div style={{ height: 75, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 10 }}>
                              ไม่มีข้อมูล
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: 8, paddingTop: 5, borderTop: '1px solid #ddd', fontSize: 8, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                    <div>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}</div>
                    <div>หน้า {points.indexOf(point) + 1} / {points.length}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal1.Body>
      </Modal1>
    </>
  )
}
