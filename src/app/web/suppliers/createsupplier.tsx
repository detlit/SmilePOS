
'use client'

import React, { useEffect, useState } from "react";
import axios from 'axios'
import { Save, RotateCcw, UserPlus } from "lucide-react";

const apis = "supplier"
import { useMessageStore } from "./useMessageStore";

function CreateSupplier() {

  const initialValues = {
    company: "",
    code: "",
    names: "",
    tel: "",
    email: "",
    leadtime: "",
    idcode: "",
    address: "",
    statuss: "",
  };

  const maxSup = useMessageStore((state) => state.maxS)
  const maxSupNum = Number(maxSup)
  let maxSP = Number.isFinite(maxSupNum) ? maxSupNum + 1 : 1000

  const [all, setall1] = useState(initialValues)

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTimeout(() => {
      setall1({
        ...all,
        [name]: value,
      });
    }, 30);
  };

  const [posts, setPosts] = useState([])

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`/api/${apis}`)
      setPosts(res.data)
      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (error) {
      console.error(error)
    }
  }

  const CreateCus = async () => {
    try {
      await setall1(initialValues);
    } catch (error) {
      console.error(error)
    }
  }

  // Post Data
  const CleckSubmit = async (e: any) => {
    e.preventDefault();
    let companyS = (localStorage.getItem("company_") || "")
    const company = companyS
    const code = String(maxSP)
    const names = all.names
    const idcode = all.idcode
    const address = all.address
    const leadtime = Number(all.leadtime)
    const email = all.email
    const tel = all.tel
    const statuss = all.statuss
    try {
      await axios.post(`/api/${apis}`,
        {
          company, code, names, tel, email, leadtime, idcode, address, statuss,
        }
      )
      await fetchPosts()
    } catch (error) {
      console.error(error)
    }
  }

  const inputStyle = {
    fontFamily: "Kanit",
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    padding: '10px 14px',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  const labelStyle = {
    fontFamily: 'Kanit',
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '6px',
    display: 'block'
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
        color: 'white',
        padding: '16px 20px',
        fontFamily: 'Kanit_B',
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <UserPlus size={18} />
        เพิ่มข้อมูลผู้ขาย
      </div>

      {/* Form Body */}
      <div style={{ padding: '24px' }}>
        <div className="row g-4">
          {/* Left Column Fields */}
          <div className="col-md-6">
            <div className="mb-3">
              <label style={labelStyle}>รหัสผู้ขาย</label>
              <input
                name="code"
                value={maxSP}
                onChange={handleInputChange}
                className="form-control"
                disabled={true}
                style={{ ...inputStyle, backgroundColor: "#f8fafc", color: '#64748b' }}
              />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>ชื่อบริษัท</label>
              <input
                name="names"
                value={all.names}
                onChange={handleInputChange}
                className="form-control"
                placeholder="ระบุชื่อบริษัท..."
                style={inputStyle}
              />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>เบอร์โทรศัพท์</label>
              <input
                name="tel"
                value={all.tel}
                onChange={handleInputChange}
                className="form-control"
                placeholder="ระบุเบอร์โทรศัพท์..."
                style={inputStyle}
              />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>E-mail</label>
              <input
                name="email"
                value={all.email}
                onChange={handleInputChange}
                className="form-control"
                placeholder="ระบุอีเมล..."
                style={inputStyle}
              />
            </div>
          </div>

          {/* Right Column Fields */}
          <div className="col-md-6">
            <div className="mb-3">
              <label style={labelStyle}>Leadtime (วัน)</label>
              <input
                type="number"
                name="leadtime"
                value={all.leadtime}
                onChange={handleInputChange}
                className="form-control"
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>เลขประจำตัวผู้เสียภาษี</label>
              <input
                type="number"
                name="idcode"
                value={all.idcode}
                onChange={handleInputChange}
                className="form-control"
                placeholder="ระบุเลขผู้เสียภาษี..."
                style={inputStyle}
              />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>ที่อยู่</label>
              <textarea
                name="address"
                value={all.address}
                onChange={(e: any) => handleInputChange(e)}
                className="form-control"
                rows={4}
                placeholder="ระบุที่อยู่..."
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={CleckSubmit}
            type="button"
            style={{
              fontFamily: "Kanit",
              fontSize: "14px",
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(62, 134, 199, 0.3)'
            }}
          >
            <Save size={16} /> บันทึกข้อมูล
          </button>
          <button
            onClick={CreateCus}
            type="button"
            style={{
              fontFamily: "Kanit",
              fontSize: "14px",
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}
          >
            <RotateCcw size={16} /> ล้างข้อมูล
          </button>
        </div>
      </div>
    </div>
  )
}
export default CreateSupplier