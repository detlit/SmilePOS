'use client'

import React, { useEffect, useState, useRef, Suspense, createContext } from "react";
import axios from 'axios'
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import PermissionGuard from '@/components/PermissionGuard'
import { Table } from 'react-bootstrap';
import Createcustomer from './createcustomer.tsx'
import { Search, Users, UserPlus, Star, Upload, Download, Trash2 } from "lucide-react";
const apis = "customer"

import Loading from "./loading.tsx";
import Updatecustomer from "./updatecustomer.tsx";
const IDContext_Cus = createContext<any>(undefined)
import { useMessageStore } from "./useMessageStore";

function CustomerPage() {

  const BodyCat = () => {
    const setidcus = useMessageStore((state) => state.setidcus);
    const setMax = useMessageStore((state) => state.setMax);
    const [idc, setidss] = useState({ idcus: "", maxS: "" })
    const [chanhepage, setchanhepage] = useState(2)
    const [posts, setPosts] = useState([])
    const [searchname, setsearchname] = useState('')
    const setcpage = useMessageStore((state) => state.setcpage);
    const cpage = useMessageStore((state) => state.cpage)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const [customerFilter, setCustomerFilter] = useState<string>('')

    useEffect(() => {
      if (typeof window === "undefined") return;
      let companyS = localStorage.getItem("company_") || "";
      const fetchPosts = async () => {
        try {
          const res = await axios.get(`/api/${apis}?company=${companyS}&fields=list`)
          await setPosts(res.data)
        } catch (error) { console.error(error) }
      }
      fetchPosts()
      setcpage("1")
    }, [Number(cpage)])

    const maxV = async () => {
      // Only consider purely numeric codes; imported/legacy codes can contain
      // letters (e.g. "TI-2956") which would otherwise make Math.max return NaN
      // and get saved as the next customer's code.
      const numericCodes = posts
        .map((pp: any) => Number(pp.code))
        .filter((n: number) => Number.isFinite(n))
      const maxValue = numericCodes.length > 0 ? Math.max(...numericCodes) : -Infinity
      setMax(String(maxValue))
      setidss({ ...idc, maxS: String(maxValue) })
    }

    const seachNames = async () => {
      if (typeof window === "undefined") return;
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${apis}?company=${companyS}&names=${searchname}&fields=list`)
        await setPosts(res.data)
      } catch (error) { console.error(error) }
    }

    const refreshList = async () => {
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${apis}?company=${companyS}&fields=list`)
        setPosts(res.data)
      } catch (error) { console.error(error) }
    }

    // ===== IMPORT EXCEL =====
    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setImportLoading(true)
      try {
        const XLSX = await import('xlsx')
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json: any[] = XLSX.utils.sheet_to_json(sheet)
        const companyS = localStorage.getItem("company_") || ""
        const customers = json.map(row => ({
          code: String(row['รหัส'] || row['code'] || '').trim(),
          names: String(row['ชื่อ'] || row['ชื่อ-สกุล'] || row['names'] || '').trim(),
          tel: String(row['โทรศัพท์'] || row['เบอร์โทร'] || row['tel'] || '').trim(),
          sex: String(row['เพศ'] || row['sex'] || '').trim(),
          idcode: String(row['เลขบัตร'] || row['idcode'] || '').trim(),
          age: row['อายุ'] || row['age'] || '',
          birthday: String(row['วันเกิด'] || row['birthday'] || '').trim(),
          address: String(row['ที่อยู่'] || row['address'] || '').trim(),
          totalPoint: row['แต้ม'] || row['totalPoint'] || 0,
          congenitalDisease: String(row['โรคประจำตัว'] || row['congenitalDisease'] || '').trim(),
          numbertax: String(row['เลขภาษี'] || row['numbertax'] || '').trim(),
          customer: String(row['การซื้อ'] || row['customer'] || '').trim(),
        }))
        const res = await axios.post('/api/customer/bulk', { company: companyS, customers })
        alert(`นำเข้าสำเร็จ ${res.data.created} รายการ, ข้าม (ซ้ำ) ${res.data.skipped} รายการ`)
        refreshList()
        setcpage(String("0"))
      } catch (error) {
        console.error(error)
        alert('เกิดข้อผิดพลาดในการนำเข้า')
      }
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // ===== EXPORT EXCEL =====
    const handleExportExcel = async () => {
      const companyS = localStorage.getItem("company_") || ""
      try {
        const res = await axios.get(`/api/${apis}?company=${companyS}`)
        const allCustomers = res.data
        const exportData = allCustomers.map((c: any) => ({
          'รหัส': c.code || '',
          'ชื่อ-สกุล': c.names || '',
          'เพศ': c.sex || '',
          'อายุ': c.age || '',
          'วันเกิด': c.birthday || '',
          'เบอร์โทร': c.tel || '',
          'เลขบัตร': c.idcode || '',
          'เลขภาษี': c.numbertax || '',
          'ที่อยู่': c.address || '',
          'แต้ม': c.totalPoint || 0,
          'โรคประจำตัว': c.congenitalDisease || '',
          'การซื้อ': c.customer || '',
        }))
        const XLSX = await import('xlsx')
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'ลูกค้า')
        XLSX.writeFile(wb, `ข้อมูลลูกค้า_${new Date().toISOString().slice(0, 10)}.xlsx`)
      } catch (error) {
        console.error(error)
        alert('เกิดข้อผิดพลาดในการ Export')
      }
    }

    // ===== DELETE ALL =====
    const handleDeleteAll = async () => {
      const companyS = localStorage.getItem("company_") || ""
      try {
        const res = await axios.delete(`/api/customer/bulk?company=${companyS}`)
        alert(`ลบลูกค้าทั้งหมด ${res.data.deleted} รายการ`)
        refreshList()
        setcpage(String("0"))
        setShowDeleteConfirm(false)
        setidss({ idcus: '', maxS: '' })
        setchanhepage(2)
      } catch (error) {
        console.error(error)
        alert('เกิดข้อผิดพลาดในการลบ')
      }
    }

    return (
      <div className="row g-3">
        {/* Left Card - Customer List */}
        <div className="col-lg-3 col-md-4">
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0', overflow: 'hidden', height: '85vh', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white', padding: '16px 20px', fontFamily: 'Kanit_B', fontSize: '15px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Users size={20} /> ข้อมูลลูกค้า
            </div>

            {/* Filter Section */}
            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div className="d-flex gap-2 mb-2">
                <div className="flex-grow-1 position-relative">
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input value={searchname}
                    onChange={(e) => { setsearchname(e.target.value) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') seachNames() }}
                    className="form-control form-control-sm" placeholder="พิมพ์ค้นหา..."
                    style={{ fontFamily: 'Kanit', paddingLeft: '32px', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <button onClick={seachNames} type="button" style={{
                  fontFamily: 'Kanit', fontSize: '12px', padding: '6px 14px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer'
                }}>ค้นหา</button>
              </div>
              <button onClick={() => { setchanhepage(1), maxV() }} type="button" style={{
                fontFamily: 'Kanit', fontSize: '12px', padding: '8px 16px', borderRadius: '8px', width: '100%',
                border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
              }}><UserPlus size={16} /> เพิ่มลูกค้า</button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
              {[
                { label: 'ทั้งหมด', value: '' },
                { label: 'ปลีก', value: 'ปลีก' },
                { label: 'ส่ง', value: 'ส่ง' },
              ].map((tab) => (
                <button key={tab.value} onClick={() => setCustomerFilter(tab.value)}
                  style={{
                    flex: 1, padding: '8px 0', fontFamily: 'Kanit', fontSize: '12px', border: 'none', cursor: 'pointer',
                    backgroundColor: customerFilter === tab.value ? '#6366f1' : 'transparent',
                    color: customerFilter === tab.value ? 'white' : '#64748b',
                    fontWeight: customerFilter === tab.value ? 600 : 400,
                    transition: 'all 0.15s',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Table hover borderless className="mb-0">
                <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '12px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', fontWeight: 600, width: '25%' }}>รหัส</th>
                    <th style={{ padding: '12px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', fontWeight: 600, width: '55%', textAlign: 'left' }}>ชื่อลูกค้า</th>
                    <th style={{ padding: '12px', fontFamily: 'Kanit', fontSize: '11px', color: '#64748b', fontWeight: 600, width: '20%', textAlign: 'center' }}>แต้ม</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.filter((p: any) => customerFilter === '' || (p.customer || 'ปลีก') === customerFilter).map((post: any, index: number) => (
                    <tr key={post.id}
                      onClick={() => { setidss({ ...idc, idcus: post.id }), setidcus(String(post.id)), setchanhepage(2) }}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                      className="hover-row"
                    >
                      <td style={{ padding: '10px 12px', fontFamily: 'Kanit', fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>{post.code}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'Kanit', fontSize: '12px', color: '#334155', textAlign: 'left' }}>{post.names}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          fontFamily: 'Kanit', fontSize: '11px', padding: '3px 8px', borderRadius: '10px',
                          backgroundColor: '#E5EEF8', color: '#2A6AAA', fontWeight: 500
                        }}>{post.totalPoint}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="col">
          {/* Action Buttons */}
          <div style={{
            display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '10px'
          }}>
            <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importLoading} title="Import Excel" style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px',
              border: 'none', background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)', color: 'white',
              fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(62, 134, 199,0.3)',
              opacity: importLoading ? 0.6 : 1, transition: 'all 0.2s'
            }}>
              <Upload size={15} /> {importLoading ? 'กำลังนำเข้า...' : 'Import Excel'}
            </button>
            <button onClick={handleExportExcel} title="Export Excel" style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px',
              border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
              fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
              transition: 'all 0.2s'
            }}>
              <Download size={15} /> Export Excel
            </button>
            {/* ปุ่มลบทั้งหมด - ซ่อนไว้ */}
          </div>

          <IDContext_Cus.Provider value={idc}>
            {chanhepage === 1 ? <Createcustomer /> :
              idc.idcus === "" ? <></> : <Updatecustomer />}
          </IDContext_Cus.Provider>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <>
            <div onClick={() => setShowDeleteConfirm(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '400px', backgroundColor: 'white', borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)', zIndex: 9999, overflow: 'hidden', fontFamily: 'Kanit'
            }}>
              <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', padding: '20px 24px', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trash2 size={22} />
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>ยืนยันการลบ</span>
                </div>
              </div>
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '15px', color: '#334155', marginBottom: '8px' }}>คุณต้องการลบลูกค้าทั้งหมดใช่หรือไม่?</div>
                <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600, marginBottom: '4px' }}>ข้อมูลทั้งหมดจะถูกลบอย่างถาวร!</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>รวมข้อมูลประวัติแพ้สินค้าด้วย</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteConfirm(false)} style={{
                  padding: '8px 20px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontFamily: 'Kanit', fontSize: '13px', cursor: 'pointer'
                }}>ยกเลิก</button>
                <button onClick={handleDeleteAll} style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white',
                  fontFamily: 'Kanit', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(239,68,68,0.3)'
                }}>ลบทั้งหมด</button>
              </div>
            </div>
          </>
        )}
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
function CustomerPageWrapper() {
  return <PermissionGuard codename="G1"><CustomerPage /></PermissionGuard>
}
export default CustomerPageWrapper
