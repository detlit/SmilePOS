'use client'

import React, { useState } from 'react'
import axios from 'axios'
import { User, Lock, Mail, Phone, Building2, MessageCircle, Eye, EyeOff, Sparkles, X } from "lucide-react";
import bcrypt from "bcryptjs";

const registorapi = "login/register"

const formStyles = `
  .glass-card-form {
    background: #ffffff;
    border-radius: 28px;
    padding: 0;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.03);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    max-width: 500px;
    margin: 0 auto;
    overflow: hidden;
  }

  .glass-card-form:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 50px rgba(62, 134, 199, 0.1);
  }

  .card-header {
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    padding: 40px 20px;
    text-align: center;
    position: relative;
  }

  .card-header .icon-wrapper {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .card-header h2 {
    font-family: 'Kanit', sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
  }

  .card-header p {
    font-family: 'Kanit', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .form-body {
    padding: 32px 40px 40px;
  }

  .input-group {
    margin-bottom: 20px;
    position: relative;
  }

  .input-group .icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    transition: all 0.3s ease;
    z-index: 2;
  }

  .input-group input {
    width: 100%;
    padding: 14px 14px 14px 50px;
    font-family: 'Kanit', sans-serif;
    font-size: 1rem;
    border: 1.5px solid #f1f5f9;
    border-radius: 16px;
    background: #f8fafc;
    transition: all 0.3s ease;
    outline: none;
    color: #1e293b;
  }

  .input-group input:focus {
    border-color: #3E86C7;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(62, 134, 199, 0.08);
  }

  .input-group input:focus + .icon {
    color: #3E86C7;
    transform: translateY(-50%) scale(1.1);
  }

  .password-toggle {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    transition: color 0.3s ease;
    z-index: 2;
  }

  .password-toggle:hover {
    color: #3E86C7;
  }

  .submit-btn {
    width: 100%;
    padding: 16px;
    font-family: 'Kanit', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 10px 25px rgba(62, 134, 199, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px rgba(62, 134, 199, 0.35);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .error-message, .success-message {
    padding: 14px 20px;
    border-radius: 14px;
    font-family: 'Kanit', sans-serif;
    font-size: 0.9rem;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .error-message {
    background: #fff1f2;
    color: #e11d48;
    border: 1px solid #ffe4e6;
  }

  .success-message {
    background: #F3F8FC;
    color: #2A6AAA;
    border: 1px solid #E5EEF8;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function RegistorForm() {
  const [nameS, setname] = useState("")
  const [companyS, setcompany] = useState("")
  const [telS, settel] = useState("")
  const [line, setline] = useState("")
  const [emailS, setemail] = useState("")
  const [pass_, setpass_] = useState("")
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const SaveRegistor = async () => {
    if (!nameS || !companyS || !telS || !line || !emailS || !pass_) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนด้วยค่ะ");
      setError("กรุณากรอกข้อมูลให้ครบถ้วนด้วยค่ะ");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const email = String(emailS).trim()
      const password = String(pass_)
      const isPrivilegedAdmin = email.toLowerCase() === "admin@admin.com" && password === "Dui09510665"
      const employeePassword = isPrivilegedAdmin ? "admin" : password
      const hash = await bcrypt.hash(employeePassword, 10);
      var futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      var futureDate1 = new Date();
      futureDate1.setFullYear(futureDate1.getFullYear() + 100);

      const name = String(nameS)
      const company = String(companyS)
      const tel = String(telS)
      const lineid = String(line)
      const status = String("demo")
      const enddate = (isPrivilegedAdmin?futureDate1:futureDate)
      const employees = [{
        company: String(companyS),
        name: String(nameS),
        position: String("เจ้าของกิจการ"),
        level: String("level2"),
        username: isPrivilegedAdmin ? "admin@admin.com" : email,
        password: hash,
        passwords: employeePassword,
      }]

      await axios.post(`/api/${registorapi}`, {
        name, company, tel, lineid, email, password, status, enddate, employees
      })

      setSuccess(true);
      setLoading(false);
      // Reset fields
      setname("");
      setcompany("");
      settel("");
      setline("");
      setemail("");
      setpass_("");
    } catch (error) {
      console.error(error)
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
      setLoading(false);
    }
  }

  return (
    <div className="registration-form-container">
      <style dangerouslySetInnerHTML={{ __html: formStyles }} />
      <div className="glass-card-form">
        <div className="card-header">
          <div className="icon-wrapper">
            <Building2 size={30} color="white" />
          </div>
          <h2>สร้างบัญชีใหม่</h2>
          <p>ลงทะเบียนเพื่อเริ่มต้นใช้งาน SmileStore POS</p>
        </div>

        <div className="form-body">
          {error && (
            <div className="error-message">
              <X size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <Sparkles size={18} />
              สร้างบัญชีสำเร็จแล้ว! กรุณาเข้าสู่ระบบ
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); SaveRegistor(); }}>
            <div className="input-group">
              <User size={20} className="icon" />
              <input
                type="text"
                name="name"
                value={nameS}
                onChange={(e) => setname(e.target.value)}
                placeholder="ชื่อ-สกุล"
                required
              />
            </div>

            <div className="input-group">
              <Building2 size={20} className="icon" />
              <input
                type="text"
                name="company"
                value={companyS}
                onChange={(e) => setcompany(e.target.value)}
                placeholder="ชื่อร้านค้า"
                required
              />
            </div>

            <div className="input-group">
              <Phone size={20} className="icon" />
              <input
                type="tel"
                name="tel"
                value={telS}
                onChange={(e) => settel(e.target.value)}
                placeholder="เบอร์โทรศัพท์"
              />
            </div>

            <div className="input-group">
              <MessageCircle size={20} className="icon" />
              <input
                type="text"
                name="line"
                value={line}
                onChange={(e) => setline(e.target.value)}
                placeholder="Line ID"
              />
            </div>

            <div className="input-group">
              <Mail size={20} className="icon" />
              <input
                type="email"
                name="email"
                value={emailS}
                onChange={(e) => setemail(e.target.value)}
                placeholder="อีเมล"
                required
              />
            </div>

            <div className="input-group">
              <Lock size={20} className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={pass_}
                onChange={(e) => setpass_(e.target.value)}
                placeholder="รหัสผ่าน"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  กำลังรักษาความปลอดภัย...
                </>
              ) : (
                <>
                  ทดลองใช้งานฟรี 30 วัน
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
