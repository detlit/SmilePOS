
'use client'

import React, { useEffect, useState, useRef, createContext } from "react";
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import PermissionGuard from '@/components/PermissionGuard'
import styles from "./../componant/mystyle.module.css"
import { Table } from 'react-bootstrap';
import UpdateSupplier from "./updatesupplier.tsx";
import CreateSupplier from "./createsupplier.tsx";
import axios from 'axios'
import { Search, Plus, Building2, Users, Upload, Download, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx'

const apis = "supplier"
const IDContext_Sup = createContext<any>(undefined)
import { useMessageStore } from "./useMessageStore";

function SupplierPage() {

  const [idc, setidss] = useState({ idcus: "", maxSup: "" })
  const setidcus = useMessageStore((state) => state.setidcus);
  const setMax = useMessageStore((state) => state.setMax);
  const [chanhepage, setchanhepage] = useState(2)

  const BodyCat = () => {

    const [posts, setPosts] = useState<any[]>([])
    const [searchname, setsearchname] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [importLoading, setImportLoading] = useState(false)

    useEffect(() => {
      let companyS = (localStorage.getItem("company_") || "")
      const fetchPosts = async () => {
        try {
          const res = await axios.get(`/api/${apis}?company=${companyS}&fields=list`)
          await setPosts(res.data)
        } catch (error) {
          console.error(error)
        }
      }
      fetchPosts()
    }, [])

    const maxV = async () => {
      // Only consider purely numeric codes; non-numeric codes (e.g. imported)
      // would otherwise make Math.max return NaN and get saved as the next
      // supplier's code.
      const numericCodes = posts
        .map((pp: any) => Number(pp.code))
        .filter((n: number) => Number.isFinite(n))
      const maxValue = numericCodes.length > 0 ? Math.max(...numericCodes) : -Infinity
      setMax(String(maxValue))
      setidss({ ...idc, maxSup: String(maxValue) })
    }

    const seachNames = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${apis}?company=${companyS}&names=${searchname}&fields=list`)
        await setPosts(res.data)
      } catch (error) {
        console.error(error)
      }
    }

    const refreshList = async () => {
      let companyS = (localStorage.getItem("company_") || "")
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
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json: any[] = XLSX.utils.sheet_to_json(sheet)
        const companyS = localStorage.getItem("company_") || ""
        const suppliers = json.map(row => ({
          code: String(row['รหัส'] || row['code'] || '').trim(),
          names: String(row['ชื่อบริษัท'] || row['ชื่อผู้ขาย'] || row['names'] || '').trim(),
          tel: String(row['โทรศัพท์'] || row['เบอร์โทร'] || row['tel'] || '').trim(),
          idcode: String(row['เลขประจำตัวผู้เสียภาษี'] || row['idcode'] || '').trim(),
          address: String(row['ที่อยู่'] || row['address'] || '').trim(),
          leadtime: row['Leadtime'] || row['leadtime'] || 0,
          email: String(row['Email'] || row['email'] || '').trim(),
        }))
        const res = await axios.post('/api/supplier/bulk', { company: companyS, suppliers })
        alert(`นำเข้าสำเร็จ ${res.data.created} รายการ, ข้าม (ซ้ำ) ${res.data.skipped} รายการ`)
        refreshList()
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
        const allSuppliers = res.data
        const exportData = allSuppliers.map((s: any) => ({
          'รหัส': s.code || '',
          'ชื่อบริษัท': s.names || '',
          'เบอร์โทร': s.tel || '',
          'เลขประจำตัวผู้เสียภาษี': s.idcode || '',
          'ที่อยู่': s.address || '',
          'Leadtime': s.leadtime || 0,
          'Email': s.email || '',
        }))
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'ผู้ขาย')
        XLSX.writeFile(wb, `ข้อมูลผู้ขาย_${new Date().toISOString().slice(0, 10)}.xlsx`)
      } catch (error) {
        console.error(error)
        alert('เกิดข้อผิดพลาดในการ Export')
      }
    }

    // ===== DELETE ALL =====
    const handleDeleteAll = async () => {
      const companyS = localStorage.getItem("company_") || ""
      try {
        const res = await axios.delete(`/api/supplier/bulk?company=${companyS}`)
        alert(`ลบผู้ขายทั้งหมด ${res.data.deleted} รายการ`)
        refreshList()
        setShowDeleteConfirm(false)
        setidss({ idcus: '', maxSup: '' })
        setchanhepage(2)
      } catch (error) {
        console.error(error)
        alert('เกิดข้อผิดพลาดในการลบ')
      }
    }

    return (
      <div className="row g-3">
        {/* Left Column: Supplier Search & List */}
        <div className="col-lg-4 col-md-12">
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Card Header */}
            <div style={{
              background: '#f5f3ff',
              borderBottom: '2px solid #8b5cf6',
              color: '#6d28d9',
              padding: '16px 20px',
              fontFamily: 'Kanit_B',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Building2 size={20} />
              ข้อมูลผู้ขาย
            </div>

            <div className="p-3 d-flex flex-column flex-grow-1">
              {/* Search & Actions */}
              <div className="mb-3">
                <div className="d-flex gap-2 mb-2">
                  <div className="flex-grow-1 position-relative">
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      value={searchname}
                      onChange={(e) => { setsearchname(e.target.value) }}
                      className="form-control"
                      placeholder="ค้นหาผู้ขาย..."
                      style={{
                        fontFamily: "Kanit",
                        fontSize: "13px",
                        paddingLeft: '36px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        height: '38px'
                      }}
                    />
                  </div>
                  <button
                    onClick={seachNames}
                    type="button"
                    className="btn"
                    style={{
                      fontFamily: "Kanit",
                      fontSize: "13px",
                      borderRadius: "8px",
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px'
                    }}
                  >
                    ค้นหา
                  </button>
                </div>
                <button
                  onClick={() => { setchanhepage(1); maxV() }}
                  type="button"
                  className="btn w-100"
                  style={{
                    fontFamily: "Kanit",
                    fontSize: "13px",
                    borderRadius: "8px",
                    background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} /> เพิ่มผู้ขาย
                </button>
              </div>

              {/* Supplier List Table */}
              <div style={{
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                flex: 1,
                maxHeight: '65vh',
                overflowY: 'auto'
              }}>
                <Table hover borderless className="mb-0">
                  <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, width: '25%' }}>รหัส</th>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, width: '55%' }}>ชื่อผู้ขาย</th>
                      <th style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '12px', color: '#64748b', fontWeight: 500, textAlign: 'center', width: '20%' }}>Leadtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post: any) => (
                      <tr
                        key={post.id}
                        onClick={() => { setidss({ ...idc, idcus: post.id }); setidcus(String(post.id)); setchanhepage(2) }}
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                        className="hover-row"
                      >
                        <td style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>{post.code}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '13px', color: '#334155' }}>{post.names}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'Kanit', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>{post.leadtime}</td>
                      </tr>
                    ))}
                    {posts.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted" style={{ fontFamily: 'Kanit' }}>ไม่พบข้อมูล</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="col-lg-8 col-md-12">
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '10px' }}>
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
            <button onClick={() => setShowDeleteConfirm(true)} title="ลบผู้ขายทั้งหมด" style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px',
              border: 'none', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white',
              fontFamily: 'Kanit', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(239,68,68,0.3)',
              transition: 'all 0.2s'
            }}>
              <Trash2 size={15} /> ลบทั้งหมด
            </button>
          </div>

          <IDContext_Sup.Provider value={idc}>
            {chanhepage === 1 ? <CreateSupplier /> :
              idc.idcus === "" ?
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: '400px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                  <div className="text-center" style={{ color: '#94a3b8' }}>
                    <Users size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ fontFamily: 'Kanit', margin: 0 }}>เลือกผู้ขายเพื่อดูรายละเอียด</p>
                  </div>
                </div>
                : <UpdateSupplier />}
          </IDContext_Sup.Provider>
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
                <div style={{ fontSize: '15px', color: '#334155', marginBottom: '8px' }}>คุณต้องการลบผู้ขายทั้งหมดใช่หรือไม่?</div>
                <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>ข้อมูลทั้งหมดจะถูกลบอย่างถาวร!</div>
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
      <div className="row justify-content-start ">
        <HeadTab />
      </div>

      <div className="row justify-content-start ">
        <div className="col-sm-1">
          <MenuTab_Small />
        </div>

        <div className="col-sm-11">
          {BodyCat()}
        </div>
      </div>

      <style jsx>{`
        .hover-row:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  )
}
function SupplierPageWrapper() {
  return <PermissionGuard codename="I1"><SupplierPage /></PermissionGuard>
}
export default SupplierPageWrapper
