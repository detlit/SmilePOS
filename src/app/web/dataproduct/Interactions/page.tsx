
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import MenuTab_Small from "../../componant/menutab_small.tsx"
import HeadTab from "../../componant/headtab.jsx"
import MenuProductHead from "../../componant/menuproducthead.jsx"
import styles from "../../componant/mystyle.module.css";
//import Bodyproduct from "../bodyproduct.jsx"
import {Table } from 'react-bootstrap';
import Image from "next/image";
import deletes from "../../../icon/delete-junk.svg"
const apis="fixname"
const interactionapi="interaction"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Toaster, toast } from "sonner"


const BodyCat=()=>{

  //Get Data
 const [posts, setPosts] = useState([])


   const [data1, setData1] = useState(posts);
   const [search1,setsearch1]=useState("")

    const [fixname1, setlist1] = useState('')
    const [fixname2, setlist2] = useState('')
    const [status, Setposition] = useState("คู่ยาที่มีปฏิกิริยารุนแรง ห้ามใช้ร่วมกัน")

 const [sh,setsh]=useState(0)

  useEffect(  () => {
   fetchPosts()
  }, [])

  const fetchPosts = async () => {
    let companyS= (localStorage.getItem("company_") || "")
    try {
      const res = await axios.get(`/api/${interactionapi}?company=${companyS}`)
     // const resA = await axios.get(`/api/${apis}?company=A`)
      setPosts(res.data)
      setData1(res.data)
     // setPostsA(resA.data)
    } catch (error) {
      console.error(error)
    }
  }

    const AlertComplete = () => {
          // เมื่อชำระเงินสำเร็จ
          toast.success(<div style={{fontFamily:"Kanit",fontSize:15}}>สถานะ</div>, {
            description:<div style={{fontFamily:"Kanit",fontSize:20}}> บันทึก ข้อมูลเรียบร้อย</div>,
            duration: 3000, // ปิดเองใน 3 วิ
          });
        };


  // Post Data
  const CleckSubmit = async () => {
     let company= (localStorage.getItem("company_") || "")

      

     try {
      await axios.post(`/api/${interactionapi}`, 
        {
        company,fixname1,fixname2,status
      }
    )
   
    AlertComplete()
    await  fetchPosts()

    } 
    
    catch (error) {
      console.error(error)
    }
  }

 //**************************************** */
// Delete/id
  const deletePost = async (id : Number) => {
    try {
      await axios.delete(`/api/${interactionapi}/${id}`)
      await  fetchPosts()
    } catch (error) {
      console.error('Failed to delete the post', error)
    }
  }

//******************************************** */




        const handleChange1 = (value:any) => {
          setsearch1(value);
          filterDataProduct1(value);
          setsh(0)
        };
      
        // filter records by Productname
        const filterDataProduct1 = (value:any) => {
          const lowercasedValue = value.toLowerCase().trim();
          if (lowercasedValue === "") setData1(posts);
          else {
            const filteredData = data1.filter((f:any) => 
                                                f.fixname1.toLowerCase().includes(search1.toLowerCase())  
                                           ||  f.fixname2.toLowerCase().includes(search1.toLowerCase())   
                                         //  || user.Barcode.toLowerCase().includes(search.toLowerCase())                                       
                                            );
            setData1(filteredData);
          }
        };

         //*** Get API Fixname */
     const [open, setOpen] = useState(false)
     const [selectedStatus, setSelectedStatus] = useState<{value:string, label:string} | null>(null)

     const [open1, setOpen1] = useState(false)
     const [selectedStatus1, setSelectedStatus1] = useState<{value:string, label:string} | null>(null)
     
     const [items, setFixname] = useState<{value:string, label:string}[]>([]);
     
    const FixnamePosts = async () => {
       const   company=(localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${apis}?company=${company}`)
        const items =await res.data.map((item:{id: string; list: string})=>({value:item.id, label:item.list}))
        setFixname(items)
        console.log(items)
        //setFixname(res.data)
      
      } catch (error) {
        console.error(error)
      }
    }

       const position =[
            {posi:"คู่ยาที่มีปฏิกิริยารุนแรง ห้ามใช้ร่วมกัน"},
            {posi:"คู่ยาที่มีปฏิกิริยาต่อกัน ใช้อย่างระมัดระวัง"}
       ]

           // position
 
  const PositionInput=(e:any)=>{     
      Setposition(e.target.value)  
  }

    return(

       <>
        <div className="row">
         
          
                <div className="col-sm-7  shadow shadow-sm rounded border border m-1" style={{backgroundColor:"white"}}>
                    <div className="row ">
                        <div className=" ">
                        <div   className={styles.gatagory_head} style={{marginTop:10,fontSize:15}}>ตั้งค่า Drug Interaction</div>
                                  <div className="row mt-1" >
                                     <div className='col-5'>
                                         {/** ยาตัวที่ 1 */}
                                          <div className=''>        
                                                  <Popover open={open} onOpenChange={setOpen} >
                                                      <PopoverTrigger asChild>
                                                        <button  
                                                                type='button'  
                                                                onClick={FixnamePosts}  
                                                                className="btn btn-outline-secondary"
                                                                style={{fontFamily:"Kanit",width:"100%" ,fontSize:12,marginLeft:10}} >
                                                          {fixname1===""?"คลิกเพิ่ม ชื่อสินค้าสามัญ":fixname1} 
                                                        </button>
                                               
                                                        </PopoverTrigger>
                                                           <PopoverContent className="p-0" side="right" align="start">
                                                               <Command>
                                                                  <CommandInput placeholder="ค้นหา ชื่อสามัญ" />
                                                                     <CommandList>
                                                                       <CommandEmpty>No results found.</CommandEmpty>
                                                                       <CommandGroup>
                                                                         {items.map((status)  => (
                                                                       <CommandItem
                                                                         key={status.value}
                                                                         value={status.value}
                                                                         onSelect={async (value) => {
                                                                                setSelectedStatus(items.find((priority) => priority.value === value) || null, )
                                                                                setlist1(status.label);
                                                                                setOpen(false)
                                                                                  }
                                                                                   }>
                                                                                  {status.label}
                                                                                                            
                                                                         </CommandItem>
                                                                         ))}
                                                                          </CommandGroup>
                                                                         </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                      </Popover>
                                          </div>    

                                          <div style={{justifySelf:"center",marginLeft:5,fontFamily:"Kanit",fontSize:15,marginTop:3,marginBottom:3}}> = Interaction =</div>                           
                                        {/** ยาตัวที่ 2 */}
                                          <div className=''>        
                                                  <Popover open={open1} onOpenChange={setOpen1} >
                                                      <PopoverTrigger asChild>
                                                        <button  
                                                                type='button'  
                                                                onClick={FixnamePosts}  
                                                                className="btn btn-outline-secondary"
                                                                style={{fontFamily:"Kanit",width:"100%" ,fontSize:12,marginLeft:10}} >
                                                          {fixname2===""?"คลิกเพิ่ม ชื่อสินค้าสามัญ":fixname2} 
                                                        </button>
                                               
                                                        </PopoverTrigger>
                                                           <PopoverContent className="p-0" side="right" align="start">
                                                               <Command>
                                                                  <CommandInput placeholder="ค้นหา ชื่อสามัญ" />
                                                                     <CommandList>
                                                                       <CommandEmpty>No results found.</CommandEmpty>
                                                                       <CommandGroup>
                                                                         {items.map((status)  => (
                                                                       <CommandItem
                                                                         key={status.value}
                                                                         value={status.value}
                                                                         onSelect={async (value) => {
                                                                                setSelectedStatus1(items.find((priority) => priority.value === value) || null, )
                                                                                setlist2(status.label);
                                                                                setOpen1(false)
                                                                                  }
                                                                                   }>
                                                                                  {status.label}
                                                                                                            
                                                                         </CommandItem>
                                                                         ))}
                                                                          </CommandGroup>
                                                                         </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                      </Popover>
                                          </div> 
                                    </div>
                                   
                                    <div className='col-6'> 
                                         <div className="input-group mb-2">
                                            <span className="input-group-text" id="visible-addon" style={{fontFamily:"kanit",fontSize:12,width:"30%",color:"#4b5563"}}>หมายเหตุ</span>
                                            <select  className="form-select" id="inputGroup"  onChange={PositionInput}   style={{fontFamily:"kanit",fontSize:12,width:230}} value={status}> 
                                            {position.length > 0 &&
                                            position.map((option:any,index:any)=>
                                                    <option 
                                                            value={option.value}
                                                            disabled={option.disable ? true : false}
                                                            key={index}
                                                            selected={option.selected}
                                                            style={{fontFamily:"kanit",fontSize:12}} >
                                                            {option.posi}
                                                    </option>
                                                )}  
                                            </select>   
                                            
                                            </div>

                                          <button 
                                                type="button" 
                                                className="btn btn-secondary"
                                                style={{marginLeft:5,fontFamily:"Kanit",fontSize:12}}
                                                onClick={()=>{setlist1(""),setlist2("")}}
                                                >
                                                   reset
                                          
                                          </button>

                                          <button 
                                                type="button" 
                                                className="btn btn-primary"
                                                onClick={()=>CleckSubmit()}
                                                style={{marginLeft:5,fontFamily:"Kanit",fontSize:12,width:80}}
                                                >
                                                    บันทึก
                                          
                                          </button>
                                        
                                    </div> 
  

                                  </div>
                    </div>   
                        
                        <div className='vw-100' style={{height:"77vh",overflowY:'scroll'}}>
                                    <table className="table mt-1 table table-hover"  >
                                        <thead style={{ position: "sticky", top: "0" }}>
                                            <tr>
                                            <th scope="col" className={styles.bodydetailTable_Re} style={{width:"20%",fontSize:10}}>
                                              ชื่อทางการ
                                              <div className={styles.bodydetailTable_Re}  style={{width:"15vw"}}>
                                                     <input  
                                                       
                                                         name="list"
                                                         type='text'
                                                         value={search1}
                                                         onChange={(e) => handleChange1(e.target.value)}
                                                         className="form-control form-control-sm" 
                                                         placeholder="ค้นหา ชื่อทางการ" 
                                                         style={{fontFamily:"Kanit",fontSize:12,height:12}}/>
                                               </div>

                                             
                                              </th>
                                            <th scope="col" className={styles.bodydetailTable_Re} style={{width:"20%",fontSize:10}}>คู่สินค้า</th>
                                             <th scope="col" className={styles.bodydetailTable_Re} style={{width:"10%",fontSize:10}}>หมายเหตุ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="table-group-divider">
                                          {data1.map((post:any) => (
                                            <tr key={post.id}>

                                            <td onClick={() => {setsh(1)}} className={styles.bodydetailTable_Re1} style={{width:"35%",fontSize:11}}>{post.fixname1}</td>   
                                            <td onClick={() => {setsh(1)}} className={styles.bodydetailTable_Re1} style={{width:"35%",fontSize:11}}>{post.fixname2}</td>   
                                            <td onClick={() => {setsh(1)}} className={styles.bodydetailTable_Re1} style={{width:"25%",fontSize:10,color:post.status==="คู่ยาที่มีปฏิกิริยารุนแรง ห้ามใช้ร่วมกัน"?"red":"brown"}}>{post.status}</td>                                          
                                            <td className={styles.bodydetailTable_Re1} style={{width:"5%"}}>
                                                <button onClick={() => deletePost(post.id)} style={{width: 20,height: 15,borderColor:"blue" }}>
                                                <Image alt=''  src={deletes} style={{width:22,height:19}}  />
                                                </button>
                                            </td>        
                                            </tr>
                                            ))}
                                        </tbody>
                                     </table>
                        </div>
                    </div>
                </div>

               {/**   <div className="col-sm-4  shadow shadow-sm rounded border border m-1" style={{backgroundColor:"white"}}>
                   <div className="row m-1">
                        <div   className={styles.gatagory_head} style={{color:"GrayText"}}>ตัวอย่าง ชื่อทางการ</div>
                        <div className='vw-100' style={{height:"77vh",overflowY:'scroll'}}>
                                    <Table className="table mt-1" size="sm"  >
                                        <thead>
                                            <tr>

                                            <th scope="col" className={styles.bodydetailTable_Re} style={{width:"90%",color:"GrayText"}}>ชื่อทางการ</th>
                                            <th scope="col" className={styles.bodydetailTable_Re} style={{width:"10%",color:"GrayText"}}>เพิ่ม</th>

                                            </tr>
                                        </thead>
                                        <tbody className="table-group-divider">
                                            {postsA.map((post:any) => (
                                            <tr key={post.id}>

                                            <td className={styles.bodydetailTable_Re1} style={{width:"70%",color:"GrayText"}}>{post.list}</td>
                                            <td className={styles.bodydetailTable_Re1} style={{width:"10%",color:"GrayText"}} ><button  onClick={()=>{setlist(post.list),setlistid(post.id)}}>เพิ่ม </button></td>        
                                            </tr>
                                            ))}
                                        </tbody>
                                     </Table>
                        </div>
                    </div>
                </div>*/}


        </div>  
        </>                  

    )
}



function InterPage() {




    return (
        <div className="" style={{paddingLeft: 15, paddingRight: 15}}  >

                        <div className="row justify-content-start " >
                         <HeadTab />
                        </div>
                     
                            <div className="row justify-content-start " >
                            
                                <div className="col-sm-1" >
                                <MenuTab_Small />
                                </div>

                                <div className="col-sm-11">
                                   <div className="row  shadow shadow-sm rounded border border "  style={{backgroundColor:"white"}}>
                                                   
                                     {/*Button head product */}
                                      <MenuProductHead/>

                                      {BodyCat()}
                                   </div>
                            </div>
                    
                        </div>                   
        </div>
    )
}
export default InterPage