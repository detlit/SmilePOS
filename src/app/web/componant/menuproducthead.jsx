'use client'

import React,{useState,useEffect} from 'react'

import styles from "./mystyle.module.css";
import Image from "next/image";
const btncolors = "#3E86C7"
const btncolort="white"
import Link from "next/link";
import GenericLabelModal from "../dataproduct/product/genericlabel/GenericLabelModal";
import UsageLabelGroupModal from "../dataproduct/product/usagelabel/UsageLabelGroupModal";
// Tittle


function MenuProductHead() {

        
const [showcolor,setshowcolor]=useState("")
const [showGenericLabelModal, setShowGenericLabelModal]=useState(false)
const [showUsageLabelGroupModal, setShowUsageLabelGroupModal]=useState(false)
            
  useEffect(() => {

   setshowcolor(localStorage.getItem("bh") || "")

 }, [])  


 useEffect(() => {
  localStorage.setItem("bh", showcolor);
 
 }, ["bh", showcolor])                    





      return (
                <>
                    <div className='container-sm ' >
                            <div className="btn-group-sm" role="group" aria-label="Basic outlined example" >
                            <Link href="/web/dataproduct" ><button onClick={()=>{setshowcolor("1"),localStorage.setItem("bh", "1"),localStorage.setItem("bhs", "1");}} type="button" className="btn btn-outline-secondary m-1"  style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="1" ? btncolors:"white",color:showcolor=="1" ? btncolort:"gray"}} >สินค้า</button></Link>
                            <Link href="/web/dataproduct/catagorys" ><button onClick={()=>{setshowcolor("2"),localStorage.setItem("bh", "2");}} type="button" className="btn btn-outline-secondary " style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="2" ? btncolors:"white",color:showcolor=="2" ? btncolort:"gray"}}>หมวดสินค้า</button></Link>
                            <Link href="/web/dataproduct/groups" style={{display:"none"}} ><button onClick={()=>{setshowcolor("3"),localStorage.setItem("bh", "3");}} type="button" className="btn btn-outline-secondary m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="3" ? btncolors:"white",color:showcolor=="3" ? btncolort:"gray"}}>กลุ่มสินค้า</button></Link>
                            <Link href="/web/dataproduct/fixnames" style={{display:"none"}} ><button onClick={()=>{setshowcolor("4"),localStorage.setItem("bh", "4");}} type="button" className="btn btn-outline-secondary" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="4" ? btncolors:"white",color:showcolor=="4" ? btncolort:"gray"}}>ชื่อทางการ</button></Link>
                          {/* <Link href="/web/dataproduct/types" ><button onClick={()=>{setshowcolor("5"),localStorage.setItem("bh", "5");}} type="button" className="btn btn-outline-secondary m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="5" ? btncolors:"white",color:showcolor=="5" ? btncolort:"gray"}}>ประเภทยา</button></Link>*/} 
                            <Link href="/web/dataproduct/units" ><button onClick={()=>{setshowcolor("6"),localStorage.setItem("bh", "6");}} type="button" className="btn btn-outline-secondary m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="6" ? btncolors:"white",color:showcolor=="6" ? btncolort:"gray"}}>หน่วยสินค้า</button></Link>
                            <Link href="/web/dataproduct/areas" ><button onClick={()=>{setshowcolor("7"),localStorage.setItem("bh", "7");}} type="button" className="btn btn-outline-secondary" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="7" ? btncolors:"white",color:showcolor=="7" ? btncolort:"gray"}}>พื้นที่เก็บ</button></Link>
                            <Link href="/web/dataproduct/label" style={{display:"none"}} ><button onClick={()=>{setshowcolor("8"),localStorage.setItem("bh", "8");}} type="button" className="btn btn-outline-secondary  m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="8" ? btncolors:"white",color:showcolor=="8" ? btncolort:"gray"}}>ตั้งค่าข้อมูลฉลากสินค้า</button></Link>
                            <Link href="/web/dataproduct/Interactions" style={{display:"none"}} ><button onClick={()=>{setshowcolor("9"),localStorage.setItem("bh", "9");}} type="button" className="btn btn-outline-secondary  " style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="9" ? btncolors:"white",color:showcolor=="9" ? btncolort:"gray"}}>Drug Interactions</button></Link>
                            <Link href="/web/dataproduct/duplicates" ><button onClick={()=>{setshowcolor("10"),localStorage.setItem("bh", "10");}} type="button" className="btn btn-outline-secondary m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="10" ? "#dc2626":"#fef2f2",color:showcolor=="10" ? "white":"#dc2626",border:"1px solid #fecaca",fontWeight:500}}>🛠️ ตรวจสอบรหัสซ้ำ</button></Link>
                            <button onClick={()=>{setShowGenericLabelModal(true)}} type="button" className="btn btn-outline-secondary m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:"#faf5ff",color:"#7c3aed",border:"1px solid #ddd6fe",fontWeight:500,display:"none"}}>💊 ตั้งฉลากสินค้า ตาม Generic Name</button>
                            <button onClick={()=>{setShowUsageLabelGroupModal(true)}} type="button" className="btn btn-outline-secondary m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:"#F3F8FC",color:"#1E5088",border:"1px solid #CCDFF1",fontWeight:500,display:"none"}}>🏷️ ตั้งค่าฉลากสินค้า ตาม วิธีการใช้</button>
                            </div>
                    </div>

                    <GenericLabelModal isOpen={showGenericLabelModal} onClose={()=>setShowGenericLabelModal(false)} />
                    <UsageLabelGroupModal isOpen={showUsageLabelGroupModal} onClose={()=>setShowUsageLabelGroupModal(false)} />
                </>)
      
}
export default MenuProductHead