'use client'

import React,{useState,useEffect,useContext} from 'react'
import styles from "./mystyle.module.css";
import Link from "next/link";
function MenuTab_Long() {

    return(
<div 
    className="d-flex flex-column flex-shrink-0 p-3 bg-body-tertiary" 
    style={{width:" 280px"}}> 
            <Link href="/web/reports"  
            className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none"> 
            <svg className="bi pe-none me-2" width="40" height="32" aria-hidden="true"></svg> 
            <span className="fs-4">Sidebar
                </span> </Link>  
            <ul className="nav nav-pills flex-column mb-auto"> 
                <li className="nav-item"> 
                
                    <svg className="bi pe-none me-2" width="16" height="16" aria-hidden="true">
                        <Link href="/web/reports" ></Link>
                    </svg>
                        Home
                 
                 </li> 
               </ul></div>
)
}
export default MenuTab_Long
