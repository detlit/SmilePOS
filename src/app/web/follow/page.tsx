'use client'

import React, { useEffect, useState, Suspense } from "react";
import axios from 'axios'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import PermissionGuard from '@/components/PermissionGuard'
import { Table } from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav';
import { Search, Users, User, ClipboardList, Phone, MapPin, AlertCircle, Heart, Calendar, Package, Pill } from "lucide-react";

const apis = "customer"
import Loading from "../customers/loading.tsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Modal from 'react-bootstrap/Modal';

const getsalehistory = "salehistory"
const gethistory = "history/hisfollow"

function HisCustomerPage() {

  const BodyCat = () => {
    const [idc, setidss] = useState({ idcus: "", maxS: "" })
    const [searchname, setsearchname] = useState('')
    const [idcs, setidcs] = useState(0)
    const [smShow, setSmShow] = useState(false);
    const [id_costomerS, setid_costomer] = useState("")
    const [code_costomerS, setcode_costomer] = useState("")

    const initialValues = {
      company: "", code: "", names: "", sex: "", idcode: "", age: "", birthday: "",
      address: "", branch: "", levelPrice: "", tel: "", pointStart: "", point: "",
      totalPoint: "", customer: "", numbertax: "", drugallergy: "", congenitalDisease: "", statuss: "",
    };

    const [all, setall1] = useState(initialValues)
    const handleInputChange = (e: any) => {
      const { name, value } = e.target;
      setTimeout(() => { setall1({ ...all, [name]: value }); }, 30);
    };

    const [sh, setsh] = useState([])
    const [shfollow, setshfollow] = useState([])
    const [statusT, setstatusT] = useState("ติดตามผล")
    const [statusN, setstatusN] = useState(0)
    const [badgeRed, setBadgeRed] = useState(0)
    const [badgeBlue, setBadgeBlue] = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)

    const SearchHistoryfollow = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${gethistory}?company=${companyS}&statusH=${statusT}&fields=list`)
        setshfollow(res.data)
      } catch (error) { console.error(error) }
    }

    const getMaxDate = (row: any) => {
      const dates = [row.duedate, row.duedate1, row.duedate2].filter(Boolean).map((d: any) => new Date(d).getTime())
      return dates.length > 0 ? Math.max(...dates) : null
    }

    const GetBadgeCounts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      const today = new Date(); today.setHours(23, 59, 59, 999)
      try {
        const res1 = await axios.get(`/api/${gethistory}?company=${companyS}&statusH=ติดตามผล&fields=list`)
        const res2 = await axios.get(`/api/${gethistory}?company=${companyS}&statusH=รับยา&fields=list`)
        const countRed = (res1.data || []).filter((row: any) => { const m = getMaxDate(row); return m !== null && m <= today.getTime() }).length
        const countBlue = (res2.data || []).filter((row: any) => { const m = getMaxDate(row); return m !== null && m <= today.getTime() }).length
        setBadgeRed(countRed)
        setBadgeBlue(countBlue)
      } catch (error) { console.error(error) }
    }

    useEffect(() => { SearchHistoryfollow() }, [Number(statusN), Number(id_costomerS), refreshKey])
    useEffect(() => { GetBadgeCounts() }, [refreshKey])

    const GetHistoryS = async () => {
      if (!code_costomerS && (!id_costomerS || Number(id_costomerS) === 0)) {
        setsh([])
        return
      }
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const params = code_costomerS
          ? `companyall=${companyS}&code_costomer=${code_costomerS}&filterStatus=1`
          : `companyall=${companyS}&id_costomer=${Number(id_costomerS)}&filterStatus=1`
        const res = await axios.get(`/api/${getsalehistory}?${params}`)
        setsh(res.data)
      } catch (error) { console.error(error) }
    }

    useEffect(() => { GetHistoryS() }, [Number(id_costomerS), Number(statusN), code_costomerS, refreshKey])

    const fetchPost = async (id_costomer: Number) => {
      try {
        const res = await axios.get(`/api/${apis}/${Number(id_costomer)}`)
        setall1(res.data)
      } catch (error) { console.error(error) }
    }

    const [fo1, setf1] = useState("")
    const [fo2, setf2] = useState("")
    const [s1, sets1] = useState("")
    const [s2, sets2] = useState("")
    const [d11, setd1] = useState("")
    const [d2, setd2] = useState("")

    useEffect(() => { GetHistory() }, [Number(id_costomerS), refreshKey])

    const GetHistory = async () => {
      if (!id_costomerS || Number(id_costomerS) === 0) return
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${getsalehistory}?companyall=${companyS}&id_costomer=${Number(id_costomerS)}`)
        setf1(res.data[0].historys[0].followup1 ?? "")
        setf2(res.data[0].historys[0].followup2 ?? "")
        sets1(res.data[0].historys[0].solution1 ?? "")
        sets2(res.data[0].historys[0].solution2 ?? "")
        setd1(res.data[0].historys[0].duedate1 ?? "")
        setd2(res.data[0].historys[0].duedate2 ?? "")
      } catch (error) { console.error(error) }
    }

    const ModalFollow = () => {
      const [followS, setfollow] = useState(fo1)
      const [follow2S, setfollow2] = useState(fo2)
      const [summaryS, setsummary] = useState(s1)
      const [summary2S, setsummary2] = useState(s2)
      const [startDateS, setStartDate] = useState(() => {
        const parsed = d11 ? new Date(d11) : null;
        return parsed && !isNaN(parsed.getTime()) ? parsed : new Date();
      });
      const [startDate2S, setStartDate2] = useState(() => {
        const parsed = d2 ? new Date(d2) : null;
        return parsed && !isNaN(parsed.getTime()) ? parsed : new Date();
      });

      const position = [
        { id: 0, posi: "" },
        { id: 1, posi: "ลูกค้าหายจากอาการป่วย" },
        { id: 2, posi: "ติดตามผลต่อ" },
        { id: 3, posi: "แจ้งรับยาเพิ่มที่ร้าน" },
        { id: 4, posi: "แจ้งลูกค้าไปพบแพทย์" },
        { id: 5, posi: "ติดต่อลูกค้าไม่ได้" },
        { id: 5, posi: "ลูกค้าปฏิเสธการรักษา" }
      ]

      const UpdateCus = async () => {
        const followup1 = String(followS)
        const followup2 = String(follow2S)
        const solution1 = String(summaryS)
        const solution2 = String(summary2S)
        const duedate1 = new Date(d11) !== null ? new Date(startDateS) : new Date(d11)
        const duedate2 = new Date(d2) !== null ? new Date(startDate2S) : new Date(d2)
        const statusH = (summary2S === "ลูกค้าหายจากอาการป่วย" || summaryS === "ลูกค้าหายจากอาการป่วย") ? "Complete" :
          (summary2S === "แจ้งลูกค้าไปพบแพทย์" || summaryS === "แจ้งลูกค้าไปพบแพทย์") ? "พบแพทย์" :
            (summary2S === "แจ้งรับยาเพิ่มที่ร้าน" || summaryS === "แจ้งรับยาเพิ่มที่ร้าน") ? "รับยา" :
              (summary2S === "ติดต่อลูกค้าไม่ได้" || summaryS === "ติดต่อลูกค้าไม่ได้") ? "ติดต่อไม่ได้" :
                (summary2S === "ลูกค้าปฏิเสธการรักษา" || summaryS === "ลูกค้าปฏิเสธการรักษา") ? "ปฏิเสธการรักษา" : "ติดตามผล"

        try {
          await axios.put(`/api/${gethistory}/${Number(idcs)}`, { followup1, solution1, duedate1, followup2, solution2, duedate2, statusH })
          setSmShow(false)
          setRefreshKey(prev => prev + 1)
        } catch (error) { console.error(error) }
      }

      return (
        <>
          <button onClick={() => setSmShow(true)} style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "white", border: "none", borderRadius: "6px", padding: "6px 14px",
            fontSize: "12px", fontFamily: "Kanit", cursor: "pointer",
            boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)"
          }}>
            ติดตาม
          </button>

          <Modal show={smShow} onHide={() => setSmShow(false)}>
            <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
              <Modal.Title style={{ fontFamily: "Kanit_B", fontSize: 15 }}>
                <ClipboardList size={18} className="me-2" />Update การติดตามอาการ
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: '#f8fafc' }}>
              <div className="p-2">
                <div className="mb-3 p-3 bg-white rounded-3 border">
                  <div className="mb-2" style={{ fontFamily: "Kanit_B", fontSize: 13, color: '#6366f1' }}>ติดตาม ครั้งที่ 1</div>
                  <textarea value={followS ?? ""} onChange={(e) => setfollow(e.target.value)} className="form-control" style={{ fontFamily: 'Kanit', fontSize: 13, borderRadius: '8px' }} rows={2} />
                  <div className="mt-2" style={{ fontFamily: "Kanit", fontSize: 12, color: '#64748b' }}>สรุปผลการติดตาม</div>
                  <select className="form-select mt-1" onChange={(e) => setsummary(e.target.value)} style={{ fontFamily: "kanit", fontSize: 12, borderRadius: '8px' }} value={summaryS ?? ""}>
                    {position.map((option: any, index: any) => <option value={option.value} key={index} style={{ fontFamily: "kanit", fontSize: 12 }}>{option.posi}</option>)}
                  </select>
                  <div className="d-flex mt-2 align-items-center">
                    <div style={{ fontFamily: "Kanit", fontSize: 12, color: '#64748b', marginRight: 10 }}>วันที่ติดตาม:</div>
                    <div className='border rounded-2 px-2 py-1' style={{ backgroundColor: 'white' }}>
                      <DatePicker selected={startDateS} onChange={(date: any) => setStartDate(date)} dateFormat="dd/MM/yyyy" className="form-control" />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-3 border">
                  <div className="mb-2" style={{ fontFamily: "Kanit_B", fontSize: 13, color: '#3E86C7' }}>ติดตาม ครั้งที่ 2</div>
                  <textarea value={follow2S ?? ""} onChange={(e) => setfollow2(e.target.value)} className="form-control" style={{ fontFamily: 'Kanit', fontSize: 13, borderRadius: '8px' }} rows={2} />
                  <div className="mt-2" style={{ fontFamily: "Kanit", fontSize: 12, color: '#64748b' }}>สรุปผลการติดตาม</div>
                  <select className="form-select mt-1" onChange={(e) => setsummary2(e.target.value)} style={{ fontFamily: "kanit", fontSize: 12, borderRadius: '8px' }} value={summary2S ?? ""}>
                    {position.map((option: any, index: any) => <option value={option.value} key={index} style={{ fontFamily: "kanit", fontSize: 12 }}>{option.posi}</option>)}
                  </select>
                  <div className="d-flex mt-2 align-items-center">
                    <div style={{ fontFamily: "Kanit", fontSize: 12, color: '#64748b', marginRight: 10 }}>วันที่ติดตาม:</div>
                    <div className='border rounded-2 px-2 py-1' style={{ backgroundColor: 'white' }}>
                      <DatePicker selected={startDate2S} onChange={(date: any) => setStartDate2(date)} dateFormat="dd/MM/yyyy" className="form-control" />
                    </div>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <button type="button" onClick={() => UpdateCus()} style={{
                fontFamily: "kanit", fontSize: 14, padding: '8px 20px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)', color: 'white', border: 'none',
                boxShadow: '0 2px 6px rgba(62, 134, 199, 0.3)'
              }}>บันทึก</button>
            </Modal.Footer>
          </Modal>
        </>
      )
    }

    const statusColors: any = {
      'ติดตามผล': { bg: '#E5EEF8', text: '#1E5088', border: '#A6C8E7' },
      'รับยา': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      'พบแพทย์': { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
      'ติดต่อไม่ได้': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
      'Complete': { bg: '#E5EEF8', text: '#173F6B', border: '#A6C8E7' },
      'ปฏิเสธการรักษา': { bg: '#f1f5f9', text: '#1b8d5effff', border: '#cbd5e1' }
    };

    return (
      <div className="row g-3">
        {/* Left Column: Customer Search & List */}
        <div className="col-lg-4 col-md-12">
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              background: '#f0f3ff',
              borderBottom: '2px solid #6366f1',
              color: '#4f46e5', padding: '16px 20px', fontFamily: 'Kanit_B', fontSize: '15px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Users size={20} /> ข้อมูลลูกค้า
            </div>

            <div className="p-3 flex-grow-1 d-flex flex-column">
              {/* Search Section */}
              <div className="d-flex gap-2 mb-3">
                <div className="flex-grow-1 position-relative">
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input value={searchname} onChange={(e) => { setsearchname(e.target.value) }}
                    className="form-control" placeholder="ค้นหาชื่อลูกค้า..."
                    style={{ fontFamily: "Kanit", fontSize: "13px", paddingLeft: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '38px' }}
                  />
                </div>
                <button type="button" style={{
                  fontFamily: "Kanit", fontSize: "13px", borderRadius: "8px",
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white', border: 'none', padding: '8px 16px'
                }}>ค้นหา</button>
              </div>

              {/* Status Tabs */}
              <div className="d-flex flex-wrap gap-1 mb-3 p-1 rounded-3" style={{ backgroundColor: '#f1f5f9' }}>
                {['ติดตามผล', 'รับยา', 'พบแพทย์', 'ติดต่อไม่ได้', 'Complete', "ปฏิเสธการรักษา"].map((status, index) => (
                  <button key={index} onClick={() => { setstatusT(status); setstatusN(index); }}
                    style={{
                      fontFamily: "Kanit", fontSize: "11px", padding: "6px 10px", borderRadius: "6px", border: 'none',
                      backgroundColor: statusT === status ? statusColors[status].bg : 'transparent',
                      color: statusT === status ? statusColors[status].text : '#64748b',
                      cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                    }}
                  >
                    {status}
                    {status === 'ติดตามผล' && badgeRed > 0 && (
                      <span style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        backgroundColor: '#ef4444', color: 'white',
                        borderRadius: '50%', minWidth: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontFamily: 'Kanit_B', fontWeight: 700,
                        boxShadow: '0 2px 4px rgba(239,68,68,0.4)', border: '2px solid white'
                      }}>{badgeRed}</span>
                    )}
                    {status === 'รับยา' && badgeBlue > 0 && (
                      <span style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        backgroundColor: '#3E86C7', color: 'white',
                        borderRadius: '50%', minWidth: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontFamily: 'Kanit_B', fontWeight: 700,
                        boxShadow: '0 2px 4px rgba(62, 134, 199,0.4)', border: '2px solid white'
                      }}>{badgeBlue}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Customer List Table */}
              <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, maxHeight: '60vh', overflowY: 'auto' }}>
                <Table hover borderless className="mb-0">
                  <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, width: '15%' }}>รหัส</th>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, width: '35%' }}>ชื่อลูกค้า</th>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, textAlign: 'center', width: '25%' }}>วันที่ติดตาม</th>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, textAlign: 'center', width: '25%' }}>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shfollow.map((post: any) => (
                      <tr key={post.id} onClick={() => { setid_costomer(post.id_costomer); setcode_costomer(post.code_costomer); setidss({ ...idc, idcus: post.id_costomer }); fetchPost(post.id_costomer); setidcs(post.id) }}
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s', borderBottom: '1px solid #f1f5f9' }}
                        className="hover-row"
                      >
                        <td style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>{post.code_costomer}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '13px', color: '#334155' }}>{post.name_customer}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {(() => {
                            const dates = [post.duedate, post.duedate1, post.duedate2].filter(Boolean).map((d: any) => new Date(d).getTime())
                            const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : null
                            if (!maxDate) return '-'
                            const today = new Date(); today.setHours(23, 59, 59, 999)
                            const isPast = maxDate.getTime() <= today.getTime()
                            return (
                              <span style={{
                                fontFamily: 'Kanit', fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                                backgroundColor: isPast ? '#E5EEF8' : 'transparent',
                                color: isPast ? '#173F6B' : '#334155',
                                fontWeight: isPast ? 600 : 400
                              }}>
                                {maxDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              </span>
                            )
                          })()}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontFamily: 'Kanit', fontSize: '10px', padding: '4px 10px', borderRadius: '12px',
                            backgroundColor: statusColors[post.statusH]?.bg || '#f1f5f9',
                            color: statusColors[post.statusH]?.text || '#64748b'
                          }}>{post.statusH}</span>
                        </td>
                      </tr>
                    ))}
                    {shfollow.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-4" style={{ fontFamily: 'Kanit', color: '#94a3b8' }}>ไม่พบข้อมูล</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & History */}
        <div className="col-lg-8 col-md-12">
          <div className="d-flex flex-column gap-3 h-100">

            {/* Customer Info Card */}
            <div style={{
              backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0', overflow: 'hidden'
            }}>
              <div style={{
                background: '#fff8eb',
                borderBottom: '2px solid #f59e0b',
                color: '#b45309', padding: '14px 20px', fontFamily: 'Kanit_B', fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <User size={18} /> ข้อมูลส่วนตัว
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    {[
                      { label: 'รหัสลูกค้า', value: all?.code, icon: null },
                      { label: 'ชื่อ-สกุล', value: all?.names, icon: null },
                      { label: 'วันเกิด', value: all?.birthday, icon: Calendar },
                      { label: 'เพศ/อายุ', value: `${all?.sex || ''} / ${all?.age || ''}`, icon: null },
                      { label: 'ระดับราคา', value: all?.levelPrice, icon: null },
                      { label: 'แต้มสะสม', value: all?.totalPoint ? `${all.totalPoint} แต้ม` : '-', special: true }
                    ].map((item, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-2">
                        <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', width: '90px' }}>{item.label}:</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: item.special ? '#ef4444' : '#334155', fontWeight: item.special ? 600 : 400 }}>{item.value || '-'}</div>
                      </div>
                    ))}
                  </div>
                  <div className="col-md-6">
                    {[
                      { label: 'เบอร์โทรศัพท์', value: all?.tel, icon: Phone },
                      { label: 'เลขบัตรประชาชน', value: all?.idcode, icon: null },
                      { label: 'ที่อยู่', value: all?.address, icon: MapPin },
                      { label: 'เลขผู้เสียภาษี', value: all?.numbertax, icon: null },
                      { label: 'ประวัติแพ้สินค้า', value: all?.drugallergy, danger: true, icon: AlertCircle },
                      { label: 'โรคประจำตัว', value: all?.congenitalDisease, icon: Heart }
                    ].map((item, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-2">
                        <div style={{ fontFamily: 'Kanit', fontSize: '12px', color: item.danger ? '#ef4444' : '#64748b', width: '110px' }}>{item.label}:</div>
                        <div style={{ fontFamily: 'Kanit', fontSize: '13px', color: item.danger ? '#ef4444' : '#334155', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.value}>{item.value || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment History Card */}
            <div style={{
              backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column'
            }}>
              <div style={{
                background: '#F3F8FC',
                borderBottom: '2px solid #3E86C7',
                color: '#1E5088', padding: '14px 20px', fontFamily: 'Kanit_B', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <ClipboardList size={18} /> ประวัติการรักษา
              </div>
              <div style={{ flex: 1, overflowY: 'auto', minHeight: '350px' }}>
                <Table hover responsive className="mb-0 align-middle">
                  <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, width: '100px' }}>วันที่</th>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, width: '35%' }}>รายการสินค้า</th>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>การติดตามและผลการรักษา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sh.length > 0 && all?.code) ? (
                      sh.filter((s: any) => s.historys?.some((b: any) => b.statusH && b.statusH !== "")).map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px', verticalAlign: 'top' }}>
                            <div style={{ fontFamily: 'Kanit_B', fontSize: '12px', color: '#6366f1' }}>
                              {new Date(s.createDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                          </td>
                          <td style={{ padding: '16px', verticalAlign: 'top' }}>
                            <div className="d-flex flex-column gap-1">
                              {s.sales.map((a: any) => (
                                <div key={a.id} className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#4338ca', fontFamily: 'Kanit' }}>{a.code_product}</span>
                                    <span style={{ fontFamily: 'Kanit', fontSize: '12px', color: '#334155' }}>{a.name_product}</span>
                                  </div>
                                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#E5EEF8', color: '#1E5088', fontFamily: 'Kanit_B' }}>x {a.qty}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '16px', verticalAlign: 'top' }}>
                            {s?.historys?.filter((b: any) => b.statusH && b.statusH !== "").map((b: any) => (
                              <div key={b.id} className="d-flex flex-column gap-2">
                                {/* Initial Treatment */}
                                <div className="p-3 rounded-3" style={{ backgroundColor: '#F3F8FC', borderLeft: '4px solid #3E86C7' }}>
                                  <div className="d-flex justify-content-between mb-2">
                                    <strong style={{ fontSize: '12px', fontFamily: 'Kanit_B', color: '#1E5088' }}>อาการ/การรักษา</strong>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(b.duedate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                  </div>
                                  <div style={{ fontSize: '12px', fontFamily: 'Kanit', color: '#334155' }}>
                                    <div className="mb-1"><span style={{ color: '#64748b' }}>อาการ:</span> {b.followup}</div>
                                    <div style={{ whiteSpace: "pre-line" }}><span style={{ color: '#64748b' }}>รักษา:</span> {((b.solution ?? "").split("*").map((item: any) => item.trim()).join("\n"))}</div>
                                  </div>
                                </div>

                                {/* Follow Up 1 */}
                                <div className="p-3 rounded-3" style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
                                  <div className="d-flex justify-content-between mb-2">
                                    <strong style={{ fontSize: '12px', fontFamily: 'Kanit_B', color: '#d97706' }}>ติดตามครั้งที่ 1</strong>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(b.duedate1).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                  </div>
                                  <div style={{ fontSize: '12px', fontFamily: 'Kanit', color: '#334155' }}>
                                    <div className="mb-1">{b.followup1 ? <><span style={{ color: '#64748b' }}>ติดตาม:</span> {b.followup1}</> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>รอติดตามผล</span>}</div>
                                    {b.solution1 && <div style={{ whiteSpace: "pre-line" }}><span style={{ color: '#64748b' }}>ผล:</span> {((b.solution1 ?? "").split("*").map((item: any) => item.trim()).join("\n"))}</div>}
                                  </div>
                                </div>

                                {/* Follow Up 2 */}
                                {(b.followup2 || b.solution2) && (
                                  <div className="p-3 rounded-3" style={{ backgroundColor: '#F3F8FC', borderLeft: '4px solid #3E86C7' }}>
                                    <div className="d-flex justify-content-between mb-2">
                                      <strong style={{ fontSize: '12px', fontFamily: 'Kanit_B', color: '#2A6AAA' }}>ติดตามครั้งที่ 2</strong>
                                      <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(b.duedate2).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', fontFamily: 'Kanit', color: '#334155' }}>
                                      <div className="mb-1">{b.followup2 ? <><span style={{ color: '#64748b' }}>ติดตาม:</span> {b.followup2}</> : '-'}</div>
                                      {b.solution2 && <div style={{ whiteSpace: "pre-line" }}><span style={{ color: '#64748b' }}>ผล:</span> {((b.solution2 ?? "").split("*").map((item: any) => item.trim()).join("\n"))}</div>}
                                    </div>
                                  </div>
                                )}

                                {/* Status & Action */}
                                <div className="d-flex justify-content-between align-items-center pt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <span style={{ fontSize: '12px', fontFamily: 'Kanit', color: '#64748b' }}>สถานะ:</span>
                                    <span style={{
                                      fontSize: '11px', padding: '4px 12px', borderRadius: '12px', fontFamily: 'Kanit',
                                      backgroundColor: statusColors[b.statusH]?.bg || '#E5EEF8',
                                      color: statusColors[b.statusH]?.text || '#1E5088'
                                    }}>{b.statusH || 'Pending'}</span>
                                  </div>
                                  {b.statusH !== "" && <ModalFollow />}
                                </div>
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-5" style={{ fontFamily: 'Kanit', color: '#94a3b8' }}>
                          <ClipboardList size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                          <div>ไม่พบข้อมูล</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15, backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: 20 }}>
      <div className="row justify-content-start"><HeadTab /></div>
      <div className="row justify-content-start">
        <div className="col-sm-1">
          <Suspense fallback={<Loading />}><MenuTab_Small /></Suspense>
        </div>
        <div className="col-sm-11">
          <Suspense fallback={<Loading />}><BodyCat /></Suspense>
        </div>
      </div>
      <style jsx>{`.hover-row:hover { background-color: #f1f5f9 !important; }`}</style>
    </div>
  )
}
function HisCustomerPageWrapper() {
  return <PermissionGuard codename="H1"><HisCustomerPage /></PermissionGuard>
}
export default HisCustomerPageWrapper
