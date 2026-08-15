
'use client'
import React, { useEffect, useState, ChangeEvent, KeyboardEvent, use } from 'react'
import styles from "./mystyle.module.css";
import Image from "next/image";
import logo from "../../../public/logo.png"
import { Button } from "@/components/ui/button"
import axios from 'axios'
import AnimatedText from "./AnimatedText";
import { useRouter } from "next/navigation";
import { jwtDecode } from 'jwt-decode';
import { button } from '@heroui/react';
// Tittle
import PageZoom from './zoom';
import CheckinControls from './checkincontrols';



function HeadTab() {


  const router = useRouter();
  const [user, setUser] = useState({});
  const [userData, setUserData] = useState(null);

  const clearSessionAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("level_");
    localStorage.removeItem("person_");
    localStorage.removeItem("personid_");
    localStorage.removeItem("emp_permissions");
    router.push("/");
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      // 🎉 Clean and safe decoding with the library
      const payload = jwtDecode(token);

      const fetchGetIDUser = async () => {
        try {
          // Fetch employee data
          const res = await axios.get(`/api/login/loginuser/${Number(payload.id)}`);
          const employee = res.data;
          if (!employee) {
            clearSessionAndRedirect();
            return;
          }

          setUser(employee)
          localStorage.setItem("level_", employee.level || "");
          localStorage.setItem("person_", employee.name || "");
          localStorage.setItem("personid_", String(employee.id || ""));

          // Cache employee permissions
          if (employee.level === "level1") {
            try {
              const permRes = await axios.get(`/api/employee-permission?employeeId=${employee.id}`);
              localStorage.setItem("emp_permissions", JSON.stringify(permRes.data));
            } catch (e) {
              console.error("Failed to fetch emp permissions:", e);
              localStorage.removeItem("emp_permissions");
            }
          } else {
            localStorage.removeItem("emp_permissions");
          }

          // Fetch User (main account) data for package info
          // Note: payload.id from token is the User ID (main account ID)
          const resUser = await axios.get(`/api/login/logins/${Number(employee.id_company)}`);
          setUserData(resUser.data || null);
        } catch (err) {
          console.error("Error fetching data:", err);
        }
      };

      fetchGetIDUser();
    } catch (error) {
      // Handle cases where the token is malformed or expired
      console.error("Token decoding failed:", error);
      clearSessionAndRedirect();
    }



  }, []);





  const LogOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("emp_permissions");
    router.push("/");

  }



  return (



    // Outer div is the row child, so Bootstrap's gutter padding lands here and the
    // card below lines up flush with the content cards. The card carries its own
    // 15px inner padding on both sides.
    <div className="mb-2">
    <div className="d-flex shadow-sm rounded border" style={{ height: 50, alignContent: "center", backgroundColor: "white", paddingLeft: 15, paddingRight: 15 }}>
      <div className="mt-1" style={{ width: "auto", height: 50, alignContent: "center", textAlign: "center" }} >

        <div >
          <Image alt={""} src={logo} quality={40} style={{ width: 65, height: 16 }} />
        </div>
        <div > <AnimatedText text={user?.company || ""} /></div>
      </div>
      <div className="p-1 flex-auto d-flex align-items-center justify-content-center">
        <CheckinControls />
      </div>
      <div className="d-flex justify-content-end align-items-center" style={{ width: "auto", minWidth: 200, height: 50 }}>
        {userData && userData.enddate && (
          (() => {
            const expDate = new Date(userData.enddate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = expDate.getTime() - today.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Only show if within 7 days of expiry (or expired)
            if (daysRemaining <= 7) {
              return (
                <div style={{ fontFamily: 'Kanit', fontSize: 13, background: '#f8fafc', padding: '4px 16px', borderRadius: '100px', border: '1px solid #e2e8f0', color: '#64748b', marginRight: 15, display: 'flex', whiteSpace: 'nowrap', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#3E86C7' }}>Package:</span> {userData.package || 'Free'}
                  <span style={{ marginLeft: 8, fontWeight: 600, color: '#f59e0b' }}>หมดอายุวันที่:</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{new Date(userData.enddate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                </div>
              );
            }
            return null;
          })()
        )}
        <div className='mt-1 d-flex align-items-center' style={{ marginRight: 10 }}>
          <PageZoom />
        </div>
        <div className="p-1" >
          <div className="" style={{ fontFamily: "Kanit", textAlign: "end", fontSize: 15, marginTop: 2, width: "12vw" }}>{user?.name || ""}</div>

          <div className="" style={{ fontFamily: "Kanit", textAlign: "end", fontSize: 10, color: "gray" }}>{user?.position || ""}</div>





        </div>
        <div className="py-1 ps-1" style={{ alignContent: "center", marginTop: 4 }}>


          <svg xmlns="http://www.w3.org/2000/svg" type='button' onClick={() => LogOut()} width="20" height="20" fill="currentColor" className="bi bi-box-arrow-right" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
          </svg>

          <div className="" style={{ fontFamily: "Kanit", textAlign: "end", fontSize: 8, color: "gray" }}>Logout</div>
        </div>



      </div>

    </div>
    </div>
  )

}
export default HeadTab