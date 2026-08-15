'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import MenuTab_Small from "../../componant/menutab_small.tsx"
import HeadTab from "../../componant/headtab.jsx"
import MenuProductHead from "../../componant/menuproducthead.jsx"
import styles from "../../componant/mystyle.module.css";

import {Table } from 'react-bootstrap';
import Image from "next/image";
import deletes from "../../../icon/delete-junk.svg"
const apis="type"




const BodyCat=()=>{

 //Get Data
    const [posts, setPosts] = useState([])
    const [list, setlist] = useState('')
    const [company, setcompany] = useState('1000')
    const [ idss,setidss] = useState('')
    const [shortlist, setshortlist] = useState('')
  
   
  
    useEffect(  () => {
     fetchPosts()
    }, [])
  
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`/api/${apis}`)
        setPosts(res.data)
      
      } catch (error) {
        console.error(error)
      }
    }
  //******************************** */
  
    // Post Data
    const CleckSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
        await axios.post(`/api/${apis}`, 
          {
           shortlist,
            list, 
          company
        }
      )
     
      
      await  fetchPosts()
      setlist("")
      } catch (error) {
        console.error(error)
      }
    }
  
   //**************************************** */
  // Delete/id
    const deletePost = async (id : Number) => {
      try {
        await axios.delete(`/api/${apis}/${id}`)
        await  fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }
  
  //******************************************** */
  // Get/id
    const fetchPost = async (id: Number) => {
      try {
        const res = await axios.get(`/api/${apis}/${id}`)
        setshortlist(res.data.shortlist)
        setlist(res.data.list)
         
      } catch (error) {
        console.error(error)
      }
    }
  
    /************************************ */
       // Edit/id
  
    const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
        await axios.put(`/api/${apis}/${idss}`, 
          {
            shortlist,
            list, 
          company
        }
      )
        await  fetchPosts()
      setlist("")
     setshortlist("")
     
   
      } catch (error) {
        console.error(error)
      }
    }
    


    return(

        <div className="row">
        <div className="col-sm-3 rounded border border-success m-1">
              <div className="row m-1">
                <div   className={styles.gatagory_head} >ประเภทสินค้า</div>
                <div   className={styles.gatagory_detail} style={{marginTop:10}} >สร้าง / แก้ไข ประเภทสินค้า</div>
                <div   className={styles.gatagory_detail} style={{marginTop:10}} >รหัสประเภทสินค้า  :</div>
                 <div className="col-5" style={{marginLeft:10}}>
                    <input
                        type="text"
                        name="shortlist"
                        id="shortlist"
                        required
                        value={shortlist}
                        onChange={(e) => setshortlist(e.target.value)}
                        className="form-control form-control-sm" 
                        placeholder="" 
                        style={{fontFamily:"Kanit"}}
                     />
                 </div>
                 <div   className={styles.gatagory_detail} style={{marginTop:10}}>ประเภทสินค้า  :</div>
                 <div className="col-11" style={{marginLeft:10}}>
                    <input
                        type="text"
                        name="list"
                        id="list"
                        required
                        value={list}
                        onChange={(e) => setlist(e.target.value)}
                        className="form-control form-control-sm" 
                        placeholder="" 
                        style={{fontFamily:"Kanit"}}
                    />
                 </div>
                 <div className="container" style={{justifyItems:"center"}}>
                    <div className="btn-group-sm m-2" role="group" aria-label="Basic outlined example" >
                        <button onClick={CleckSubmit} type="button" className="btn btn-outline-primary m-1"  style={{fontFamily:"kanit",fontSize:12}}>สร้าง</button>
                        <button onClick={handleSubmit} type="button" className="btn btn-outline-warning m-1"  style={{fontFamily:"kanit",fontSize:12}}>แก้ไข</button>
                </div>
              </div>              
            </div>
        </div>
        
        <div className="col-sm-4 rounded border border-success m-1">
              <div className="row m-1">
                <div   className={styles.gatagory_head} >ข้อมูล ประเภทสินค้า</div>
                 <div style={{height:490,width:400,overflowY:'scroll'}}>
                            <Table className="table mt-1" size="sm"  >
                                <thead>
                                    <tr>
                                    <th scope="col" className={styles.bodydetailTable_Re} style={{width:"20%"}}>รายงาน ขย</th>
                                    <th scope="col" className={styles.bodydetailTable_Re} style={{width:"70%"}}>ประเภทสินค้า</th>
                                    <th scope="col" className={styles.bodydetailTable_Re} style={{width:"10%"}}>ลบ</th>

                                    </tr>
                                </thead>
                                <tbody className="table-group-divider">
                                    {posts.map((post: any) => (
                                    <tr key={post.id}>
                                    <td onClick={() => {fetchPost(post.id) ,setidss(post.id)}} className={styles.bodydetailTable_Re1} style={{width:"20%"}}>{post.shortlist}</td>
                                    <td onClick={() => {fetchPost(post.id) ,setidss(post.id)}} className={styles.bodydetailTable_Re1} style={{width:"70%"}}>{post.list}</td>
                                 <td className={styles.bodydetailTable_Re1} style={{width:"10%"}}>
                                        <button onClick={() => deletePost(post.id)} style={{width: 18,height: 15,borderColor:"blue" }}>
                                           <Image   alt={""} src={deletes} quality={40}  />
                                        </button>
                                       </td>   
                                    </tr>
                                    ))}
                                </tbody>
                                </Table></div>
                    </div>
         </div>
   </div>              

    )
}


function TypePage() {


    return (
        <div className="" style={{paddingLeft: 15, paddingRight: 15}}  >

                        <div className="row justify-content-start " style={{paddingLeft:10}}>
                         <HeadTab />
                        </div>
                     
                            <div className="row justify-content-start " >
                            
                                <div className="col-sm-1" >
                                <MenuTab_Small />
                                </div>

                                <div className="col-sm-11">
                                   <div className="row  rounded border border-success  ">
                                                   
                                     {/*Button head product */}
                                      <MenuProductHead/>

                                    {BodyCat()}

                                   </div>
                            </div>
                    
                        </div>                   
        </div>
    )
}
export default TypePage