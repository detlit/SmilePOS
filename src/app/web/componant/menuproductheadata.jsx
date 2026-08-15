'use client'

import React,{useState,useEffect} from 'react'

const btncolors = "#3E86C7"
const btncolort="white"
import styles from "./mystyle.module.css";
import Image from "next/image";
import Link from "next/link";
// Tittle



function MenuProductHeadData() {

const [showcolor,setshowcolor]=useState("")
               
  
 useEffect(() => {
    let value
    value =localStorage.getItem("bhs") || ""
    setshowcolor(value)
 }, [])  
                      
  const saveToLocalStorage = (e) => {
    e.preventDefault()
    localStorage.setItem("bhs", showcolor);
  }


      return (
                
              
                        
                    <div className='container-sm mt-1' >
                     <div className="btn-group-sm" role="group" aria-label="Basic outlined example" >
                            <Link href="/web/dataproduct" ><button onClick={()=>{setshowcolor("1"),saveToLocalStorage}} type="button" className="btn btn-outline-success m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="1" ? btncolors:"white",color:showcolor=="1" ? btncolort: "#2A6AAA"}}>ข้อมูลสินค้า</button></Link>
                            <Link href="/web/dataproduct/product/label" ><button onClick={()=>{setshowcolor("2"),saveToLocalStorage}} type="button" className="btn btn-outline-success " style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="2" ? btncolors:"white",color:showcolor=="2" ? btncolort: "#2A6AAA"}}>ฉลากสินค้า</button></Link>
                            <Link href="/web/dataproduct/product/gift" ><button onClick={()=>{setshowcolor("3"),saveToLocalStorage}} type="button" className="btn btn-outline-success m-1" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="3" ? btncolors:"white",color:showcolor=="3" ? btncolort: "#2A6AAA"}}>ค่าหยิบสินค้า</button></Link>
                            <Link href="/web/dataproduct/product/stockcard" ><button onClick={()=>{setshowcolor("4"),saveToLocalStorage}} type="button" className="btn btn-outline-success" style={{fontFamily:"kanit",fontSize:12,height:30,backgroundColor:showcolor=="4" ? btncolors:"white",color:showcolor=="4" ? btncolort: "#2A6AAA"}}>StockCard</button></Link>

                     </div>
                    </div>
)
      
}
export default MenuProductHeadData