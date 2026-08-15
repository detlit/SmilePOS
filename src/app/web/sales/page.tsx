'use client'

import React,{useState,useEffect,Suspense,createContext,useContext, ChangeEvent, KeyboardEvent } from 'react'

import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import BodyTabIndex from "./body_pro_cus.tsx"
import Link from "next/link";
import BodyTabSale from './body_sale.tsx';
import { useMessageStore } from "./useMessageStore";

function IndexPage() {

const message=useMessageStore((state) => state.message)

    useEffect(() => {
    // change background color with a random color
    const color = 'rgba(196, 195, 197, 0.18)'
    document.body.style.background = color;
  }, []);

    return (
        <div style={{paddingLeft: 15, paddingRight: 15}}  >
                        <div className="row justify-content-start ">
                                {/* โหมดชำระเงิน (message==="0") : ซ่อนแถบหัวและเมนูซ้าย ให้แผงชำระเงินได้พื้นที่เต็มจอ */}
                                {message===""? <HeadTab />:""}



                                {message===""? <div className="col-sm-1" >
                               <MenuTab_Small />
                                </div>:""}

                            <div className="col-sm">
                            <BodyTabIndex />
                            </div>
                    
                        </div>
                        
        </div>
    )
}
export default IndexPage