
'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, User, Lock, Mail, Phone, Building2, MessageCircle, Eye, EyeOff, Sparkles, LogIn, Smartphone, Home as HomeIcon, AlertTriangle, ExternalLink } from "lucide-react";
import bcrypt from "bcryptjs";
import { isNativeApp } from "@/lib/runtime/platform";
import { exitApp } from "@/lib/runtime/native";

const registorapi = "login/register"
import { jwtDecode } from "jwt-decode";

// Modern CSS styles - Minimal White & Green Theme
const pageStyles = `
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-Light.ttf') format('truetype');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-SemiBold.ttf') format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    position: relative;
    overflow: hidden;
    padding: 20px;
  }

  .floating-shapes {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
  }

  .shape {
    position: absolute;
    background: linear-gradient(135deg, rgba(62, 134, 199, 0.08) 0%, rgba(62, 134, 199, 0.05) 100%);
    border-radius: 50%;
    animation: float 25s infinite ease-in-out;
  }

  .shape:nth-child(1) {
    width: 300px;
    height: 300px;
    left: -100px;
    top: -100px;
    animation-delay: 0s;
  }

  .shape:nth-child(2) {
    width: 200px;
    height: 200px;
    right: -50px;
    top: 20%;
    animation-delay: 3s;
  }

  .shape:nth-child(3) {
    width: 150px;
    height: 150px;
    left: 10%;
    bottom: 10%;
    animation-delay: 5s;
  }

  .shape:nth-child(4) {
    width: 250px;
    height: 250px;
    right: 5%;
    bottom: -80px;
    animation-delay: 7s;
  }

  .shape:nth-child(5) {
    width: 100px;
    height: 100px;
    left: 40%;
    top: 5%;
    animation-delay: 2s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-20px) scale(1.05); }
  }

  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 80px;
    max-width: 1100px;
    width: 100%;
    z-index: 1;
  }

  .logo-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeInLeft 0.8s ease-out;
  }

  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .logo-wrapper {
    background: #ffffff;
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
    transition: all 0.3s ease;
  }

  .logo-wrapper:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(62, 134, 199, 0.1);
  }

  .logo-wrapper img {
    max-width: 320px;
    height: auto;
  }

  .welcome-text {
    margin-top: 32px;
    text-align: center;
  }

  .welcome-text h1 {
    font-family: 'Kanit', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .welcome-text p {
    font-family: 'Kanit', sans-serif;
    font-size: 1rem;
    color: #6b7280;
  }

  .form-section {
    flex: 1;
    max-width: 420px;
    width: 100%;
    animation: fadeInRight 0.8s ease-out;
  }

  @keyframes fadeInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .glass-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
    transition: all 0.3s ease;
  }

  .glass-card:hover {
    box-shadow: 0 8px 32px rgba(62, 134, 199, 0.08);
  }

  .card-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .card-header .icon-wrapper {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    box-shadow: 0 8px 24px rgba(62, 134, 199, 0.25);
  }

  .card-header h2 {
    font-family: 'Kanit', sans-serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 6px;
  }

  .card-header p {
    font-family: 'Kanit', sans-serif;
    font-size: 0.9rem;
    color: #9ca3af;
  }

  .input-group {
    margin-bottom: 18px;
    position: relative;
  }

  .input-group .icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    transition: color 0.3s ease;
    z-index: 2;
  }

  .input-group input {
    width: 100%;
    padding: 14px 14px 14px 48px;
    font-family: 'Kanit', sans-serif;
    font-size: 0.95rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    background: #fafafa;
    transition: all 0.3s ease;
    outline: none;
  }

  .input-group input:focus {
    border-color: #3E86C7;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(62, 134, 199, 0.1);
  }

  .input-group input:focus + .icon,
  .input-group:focus-within .icon {
    color: #3E86C7;
  }

  .input-group input::placeholder {
    color: #9ca3af;
  }

  .password-toggle {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    transition: color 0.3s ease;
    z-index: 2;
  }

  .password-toggle:hover {
    color: #3E86C7;
  }

  .submit-btn {
    width: 100%;
    padding: 14px;
    font-family: 'Kanit', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(62, 134, 199, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(62, 134, 199, 0.4);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .submit-btn .spinner {
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

  .divider {
    display: flex;
    align-items: center;
    margin: 24px 0;
    gap: 12px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  .divider span {
    font-family: 'Kanit', sans-serif;
    font-size: 0.8rem;
    color: #9ca3af;
  }

  .register-link {
    text-align: center;
  }

  .register-link p {
    font-family: 'Kanit', sans-serif;
    font-size: 0.9rem;
    color: #6b7280;
  }

  .register-link button {
    font-family: 'Kanit', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #3E86C7;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.3s ease;
    margin-left: 4px;
  }

  .register-link button:hover {
    color: #2A6AAA;
    text-decoration: underline;
  }

  .error-message {
    background: #fef2f2;
    color: #dc2626;
    padding: 12px 16px;
    border-radius: 10px;
    font-family: 'Kanit', sans-serif;
    font-size: 0.85rem;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid #fecaca;
    animation: shake 0.5s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .close-btn {
    position: fixed;
    top: 24px;
    right: 24px;
    width: 44px;
    height: 44px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1000;
  }

  .close-btn:hover {
    background: #f9fafb;
    border-color: #3E86C7;
    transform: rotate(90deg);
  }

  .home-btn {
    position: fixed;
    top: 24px;
    right: 80px;
    width: 44px;
    height: 44px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1000;
  }

  .home-btn:hover {
    background: #f9fafb;
    border-color: #3E86C7;
    transform: translateY(-2px);
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Kanit', sans-serif;
    font-size: 0.9rem;
    color: #3E86C7;
    background: none;
    border: none;
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.3s ease;
  }

  .back-btn:hover {
    color: #2A6AAA;
    transform: translateX(-4px);
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .login-container {
      flex-direction: column;
      gap: 40px;
    }

    .logo-section {
      order: 1;
    }

    .form-section {
      order: 2;
      max-width: 420px;
    }

    .logo-wrapper img {
      max-width: 240px;
    }

    .welcome-text h1 {
      font-size: 2rem;
    }
  }

  @media (max-width: 768px) {
    .login-page {
      padding: 15px;
    }

    .glass-card {
      padding: 30px 25px;
    }

    .logo-wrapper {
      padding: 25px;
    }

    .logo-wrapper img {
      max-width: 160px;
    }

    .welcome-text h1 {
      font-size: 1.6rem;
    }

    .welcome-text p {
      font-size: 0.95rem;
    }

    .card-header h2 {
      font-size: 1.5rem;
    }

    .card-header .icon-wrapper {
      width: 60px;
      height: 60px;
    }

    .input-group input {
      padding: 14px 14px 14px 45px;
      font-size: 0.95rem;
    }

    .submit-btn {
      padding: 14px;
      font-size: 1rem;
    }

    .shape {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .login-page {
      padding: 10px;
    }

    .glass-card {
      padding: 25px 20px;
      border-radius: 20px;
    }

    .logo-wrapper {
      padding: 20px;
      border-radius: 20px;
    }

    .logo-wrapper img {
      max-width: 140px;
    }

    .welcome-text {
      margin-top: 20px;
    }

    .welcome-text h1 {
      font-size: 1.4rem;
    }

    .card-header {
      margin-bottom: 25px;
    }

    .card-header .icon-wrapper {
      width: 55px;
      height: 55px;
    }

    .card-header h2 {
      font-size: 1.3rem;
    }

    .input-group {
      margin-bottom: 15px;
    }

    .input-group input {
      padding: 13px 13px 13px 42px;
      border-radius: 12px;
    }

    .submit-btn {
      padding: 13px;
      border-radius: 12px;
    }

    .close-btn {
      width: 42px;
      height: 42px;
      top: 15px;
      right: 15px;
    }
  }

  /* Mobile Login Button - Premium Design */
  .mobile-login-btn {
    display: none;
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    padding: 16px 48px;
    font-family: 'Kanit', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 50%, #1E5088 100%);
    border: none;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 
      0 8px 32px rgba(62, 134, 199, 0.4),
      0 4px 12px rgba(0, 0, 0, 0.15),
      inset 0 2px 0 rgba(255, 255, 255, 0.2);
    z-index: 999;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .mobile-login-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.6s ease;
  }

  .mobile-login-btn:hover::before {
    left: 100%;
  }

  .mobile-login-btn:hover {
    transform: translateX(-50%) translateY(-4px) scale(1.02);
    box-shadow: 
      0 12px 40px rgba(62, 134, 199, 0.5),
      0 6px 16px rgba(0, 0, 0, 0.2),
      inset 0 2px 0 rgba(255, 255, 255, 0.25);
  }

  .mobile-login-btn:active {
    transform: translateX(-50%) translateY(-1px) scale(0.98);
    box-shadow: 
      0 4px 16px rgba(62, 134, 199, 0.4),
      0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .mobile-login-btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .mobile-login-btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse-icon 2s ease-in-out infinite;
  }

  @keyframes pulse-icon {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }

  .mobile-login-btn-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120%;
    height: 120%;
    background: radial-gradient(ellipse, rgba(62, 134, 199, 0.3) 0%, transparent 70%);
    animation: glow-pulse 2.5s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  }

  /* Show mobile login button only on mobile devices */
  @media (max-width: 768px) {
    .mobile-login-btn {
      display: block;
    }
    
    /* Hide logo section on mobile */
    .logo-section {
      display: none;
    }

    /* Hide divider and register link on mobile */
    .divider,
    .register-link {
      display: none;
    }
    
    /* Adjust form section to not be hidden by mobile button */
    .form-section {
      padding-bottom: 100px;
    }
  }

  @media (max-width: 480px) {
    .mobile-login-btn {
      bottom: 20px;
      padding: 14px 40px;
      font-size: 1rem;
    }

    .form-section {
      padding-bottom: 90px;
    }
  }

  /* Professional Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease-out;
  }

  .modal-content {
    background: #ffffff;
    border-radius: 28px;
    padding: 40px;
    width: 90%;
    max-width: 480px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    text-align: center;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal-icon-wrapper {
    width: 80px;
    height: 80px;
    background: #fff7ed;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    color: #f97316;
  }

  .modal-title {
    font-family: 'Kanit', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 12px;
  }

  .modal-description {
    font-family: 'Kanit', sans-serif;
    font-size: 1rem;
    line-height: 1.6;
    color: #4b5563;
    margin-bottom: 32px;
  }

  .modal-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modal-btn-primary {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-family: 'Kanit', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 10px 15px -3px rgba(62, 134, 199, 0.3);
  }

  .modal-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 20px -5px rgba(62, 134, 199, 0.4);
  }

  .modal-btn-secondary {
    width: 100%;
    padding: 14px;
    background: #f9fafb;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    font-family: 'Kanit', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .modal-btn-secondary:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

export default function Home() {
  const router = useRouter();
  const [showre, setre] = useState("0")
  const [showcolor, setshowcolor] = useState("")
  const [showExpiryModal, setShowExpiryModal] = useState(false)
  const [hideRegister, setHideRegister] = useState(true)

  useEffect(() => {
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    setshowcolor(localStorage.getItem("name") || "")

    // เปิดหน้า Customer Display บนจอ Extend ทันทีเมื่อเข้าหน้า login
    // เฉพาะ Electron และเฉพาะเมื่อมีจอ Extend — แท็บเล็ตมีจอเดียวจึงไม่มีอะไรให้เปิด
    const api = (window as any).electronAPI || (window as any).electron;
    if (api?.openCustomerDisplay) {
      api.openCustomerDisplay().catch(() => undefined);
    }

    // Check if admin@admin.com exists in User table
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/login/checkadmin");
        if (!res.ok) {
          setHideRegister(true);
          return;
        }
        const data = await res.json();
        setHideRegister(data.exists);
      } catch { setHideRegister(true); }
    };
    checkAdmin();
  }, [])

  useEffect(() => {
    localStorage.setItem("name", showcolor);
    localStorage.setItem("bgcolor", 'rgba(196, 195, 197, 0.18)')
  }, [showcolor])

  const Login = () => {
    const [username, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/login/loginuser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
          setLoading(false);
          return;
        }

        setshowcolor("1");
        localStorage.setItem("token", data.token);

        const payload: any = jwtDecode(data.token);
        localStorage.setItem("company_", payload.idcompany);
        if (payload.company) localStorage.setItem("cp_", payload.company);

        // Fetch User (main account) data to check subscription status
        try {
          const checkRes = await fetch(`/api/login/logins/${Number(payload.idcompany)}`);
          const userData = await checkRes.json();

          if (userData && userData.enddate) {
            const expDate = new Date(userData.enddate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (today > expDate) {
              setShowExpiryModal(true);
              setLoading(false);
              return;
            }
          }
        } catch (checkErr) {
          console.error("Subscription check failed:", checkErr);
          // Optional: handle fetch failure (e.g., proceed anyway or block)
        }

        // เปิดหน้า Customer Display บนจอ Extend (เฉพาะ Electron)
        if (typeof window !== 'undefined' && (window as any).electronAPI?.openCustomerDisplay) {
          await (window as any).electronAPI.openCustomerDisplay();
        }

        // Check if mobile device
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          // Fetch user data to get level_ and store in localStorage
          try {
            const userRes = await axios.get(`/api/login/loginuser/${Number(payload.id)}`);
            localStorage.setItem("level_", userRes.data.level);
            localStorage.setItem("person_", userRes.data.name);
            localStorage.setItem("pi_", userRes.data.id);
            localStorage.setItem("ci_", userRes.data.id_company);

            // Cache employee permissions for mobile
            if (userRes.data.level === "level1") {
              try {
                const permRes = await axios.get(`/api/employee-permission?employeeId=${userRes.data.id}`);
                localStorage.setItem("emp_permissions", JSON.stringify(permRes.data));
              } catch (e) {
                console.error("Failed to fetch emp permissions:", e);
                localStorage.removeItem("emp_permissions");
              }
            } else {
              localStorage.removeItem("emp_permissions");
            }

            const userLevel = userRes.data.level || "";
            // If not level1, checkin is always visible
            if (userLevel !== "level1") {
              router.push("/web/mobile/checkin/");
            } else {
              // For level1: check navLevel permissions for P2 (checkin)
              const companyS = localStorage.getItem("company_") || "";
              const navRes = await axios.get(`/api/level?company=${companyS}`);
              const navLevel = navRes.data || [];
              const found = navLevel.filter((a: any) => a.codename === "P2");
              const canAccessCheckin = found.length > 0 && found[0].level1 !== false;

              if (canAccessCheckin) {
                router.push("/web/mobile/checkin/");
              } else {
                // Checkin not allowed, redirect to mobile index
                router.push("/web/mobile/index/");
              }
            }
          } catch (navErr) {
            console.error("Nav level check failed:", navErr);
            // Fallback: redirect to checkin anyway
            router.push("/web/mobile/checkin/");
          }
        } else {
          // Check SettingEmployee.mobile status from token
          const payload: any = jwtDecode(data.token);
          
          if (payload.mobile === true) {
            // Check if user has checked in today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            try {
              const checkinRes = await axios.get(`/api/checkin?idcompany=${payload.idcompany}&personId=${payload.id}&month=${today.getMonth() + 1}&year=${today.getFullYear()}`);
              
              // Check if there's a checkin record for today (checkin date is today)
              const hasCheckinToday = checkinRes.data && checkinRes.data.some((c: any) => {
                if (!c.checkin) return false;
                const checkinDate = new Date(c.checkin);
                return checkinDate >= today && checkinDate < tomorrow;
              });
              
              if (!hasCheckinToday) {
                alert("กรุณา check in ระบบก่อนเข้าใช้โปรแกรม");
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error("Checkin check failed:", err);
              alert("กรุณา check in ระบบก่อนเข้าใช้โปรแกรม");
              setLoading(false);
              return;
            }
          }
          
          // Load the logged-in employee's individual (per-person) visibility
          // permissions so they are applied immediately on the first page after
          // login, instead of showing stale/previous-user permissions until
          // HeadTab refetches them.
          try {
            const empRes = await axios.get(`/api/login/loginuser/${Number(payload.id)}`);
            const employee = empRes.data;
            localStorage.setItem("level_", employee?.level || "");
            localStorage.setItem("person_", employee?.name || "");
            localStorage.setItem("personid_", String(employee?.id || ""));

            if (employee?.level === "level1") {
              try {
                const permRes = await axios.get(`/api/employee-permission?employeeId=${employee.id}`);
                localStorage.setItem("emp_permissions", JSON.stringify(permRes.data || []));
              } catch (permErr) {
                console.error("Failed to fetch emp permissions:", permErr);
                localStorage.removeItem("emp_permissions");
              }
            } else {
              localStorage.removeItem("emp_permissions");
            }
          } catch (empErr) {
            console.error("Failed to load employee permissions:", empErr);
          }

          // Highlight the "หน้าขาย" (Sales) menu item since we land there after login
          localStorage.setItem("name", "2");
          setshowcolor("2");
          router.push("/web/sales/");
        }
      } catch (err) {
        console.error("Login failed:", err);
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
      }
    }

    return (
      <div className="form-section">
        <div className="glass-card">
          <div className="card-header">
            <div className="mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                src="/images/brand/smilestore-logo.svg"
                alt="SmileStore POS"
                width={200}
                height={56}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <h2>เข้าสู่ระบบ</h2>
            <p>ยินดีต้อนรับกลับสู่ระบบ</p>
          </div>

          {error && (
            <div className="error-message">
              <X size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <User size={20} className="icon" />
              <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="อีเมล หรือ ชื่อผู้ใช้"
                required
              />
            </div>

            <div className="input-group">
              <Lock size={20} className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    )
  }

  const Registor = () => {
    const [nameS, setname] = useState("")
    const [companyS, setcompany] = useState("")
    const [telS, settel] = useState("")
    const [line, setline] = useState("")
    const [emailS, setemail] = useState("")
    const [pass_, setpass_] = useState("")
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const SaveRegistor = async () => {
      if (!nameS || !companyS || !emailS || !pass_) {
        setError("กรุณากรอกข้อมูลให้ครบถ้วน");
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

        setshowcolor("1")
        setre("0")
        setLoading(false);
      } catch (error) {
        console.error(error)
        const apiMessage = axios.isAxiosError(error) ? error.response?.data?.error : null;
        setError(typeof apiMessage === "string" && apiMessage ? apiMessage : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
      }
    }

    return (
      <div className="form-section">
        <div className="glass-card">
          <button type="button" className="back-btn" onClick={() => setre("0")}>
            ← กลับไปหน้าเข้าสู่ระบบ
          </button>

          <div className="card-header">
            <div className="icon-wrapper">
              <Building2 size={32} color="white" />
            </div>
            <h2>สร้างบัญชีใหม่</h2>
            <p>ลงทะเบียนร้านค้าของคุณ</p>
          </div>

          {error && (
            <div className="error-message">
              <X size={18} />
              {error}
            </div>
          )}

          <form>
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
              type="button"
              className="submit-btn"
              disabled={loading}
              onClick={SaveRegistor}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  กำลังสร้างบัญชี...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  สร้างบัญชีใหม่
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <div className="login-page">
        {/* Floating Shapes Background */}
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <div className="login-container">
          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo-wrapper">
              <Image
                alt="SmileStore POS"
                src="/images/brand/smilestore-hero.svg"
                width={542}
                height={672}
                quality={100}
                priority
              />
            </div>
            <div className="welcome-text">
              {/**   <h2>SmileStore POS</h2>*/}
              <p>ระบบจัดการร้านค้าอัจฉริยะ</p>
            </div>
          </div>

          {/* Form Section */}
          {showre === "1" ? <Registor /> : <Login />}
        </div>

        {/* Register Button */}
        {!hideRegister && (
          <div
            className="home-btn"
            style={{ width: 'auto', padding: '0 16px', gap: '8px' }}
            onClick={() => router.push('/web/index')}
          >
            <User size={20} color="#3E86C7" />
            <span style={{ fontFamily: 'Kanit', fontSize: '1rem', fontWeight: 500, color: '#3E86C7' }}>สมัครสมาชิก</span>
          </div>
        )}

        {/* Close Button */}
        <div
          className="close-btn"
          onClick={() => {
            // Android: ปิดแอปจริงผ่าน Capacitor
            if (isNativeApp()) {
              exitApp();
              return;
            }

            (window as any).electron?.closeApp?.();
          }}
        >
          <X size={24} color="#3E86C7" />
        </div>


      </div>

      {/* Expiry Modal */}
      {showExpiryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon-wrapper">
              <AlertTriangle size={40} />
            </div>
            <h3 className="modal-title">ขออภัย สิทธิการใช้งานหมดอายุ</h3>
            <p className="modal-description">
              ขณะนี้ package ของคุณได้หมดอายุการใช้งานแล้ว <br />
              กรุณาติดต่อเจ้าหน้าที่ (Admin) เพื่อทำการต่ออายุการใช้งาน <br />
              และเข้าถึงฟีเจอร์ต่างๆ ของระบบอีกครั้งค่ะ
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn-primary"
                onClick={() => {
                  window.open("https://line.me/ti/p/~duis", "_blank");
                }}
              >
                <MessageCircle size={20} />
                ติดต่อต่ออายุ Package
              </button>
              <button
                className="modal-btn-secondary"
                onClick={() => setShowExpiryModal(false)}
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

