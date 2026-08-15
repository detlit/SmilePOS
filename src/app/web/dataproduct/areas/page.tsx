
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import MenuTab_Small from "../../componant/menutab_small.tsx"
import HeadTab from "../../componant/headtab.jsx"
import MenuProductHead from "../../componant/menuproducthead.jsx"
import styles from "../../componant/mystyle.module.css";
import MenuTab_Long from "../../componant/menulong.jsx"

import { Table } from 'react-bootstrap';
import Image from "next/image";
import { useRouter } from 'next/navigation'
import deletes from "../../../icon/delete-junk.svg"
import edits from "../../../icon/editSS.png"
import Modal1 from 'react-bootstrap/Modal';
import Button1 from 'react-bootstrap/Button';

const apis = "area"

import { Toaster, toast } from "sonner"




function AreaPage() {





  const BodyCat = () => {

    interface PostItem {
      id: number;
      list: string;
    }

    //Get Data
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [postsA, setPostsA] = useState<PostItem[]>([]);
    const [list, setlist] = useState('')
    const [listid, setlistid] = useState(0)

    const [idss, setidss] = useState('')

    const [data1, setData1] = useState(posts);
    const [search1, setsearch1] = useState("")
    const [sh, setsh] = useState(0)
    const [isImported, setIsImported] = useState(false)
    const [isImporting, setIsImporting] = useState(false)

    useEffect(() => {
      fetchPosts()
      checkImportStatus()
    }, [])

    const checkImportStatus = async () => {
      try {
        const res = await axios.get('/api/area/import-csv')
        setIsImported(res.data.imported)
      } catch (error) {
        console.error('Failed to check import status', error)
      }
    }

    const handleImportCSV = async () => {
      if (isImported || isImporting) return
      
      setIsImporting(true)
      try {
        const res = await axios.post('/api/area/import-csv')
        if (res.data.success) {
          toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สำเร็จ</div>, {
            description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{res.data.message}</div>,
            duration: 3000,
          })
          setIsImported(true)
          await fetchPosts()
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาด'
        toast.error(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>ผิดพลาด</div>, {
          description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}>{errMsg}</div>,
          duration: 3000,
        })
      } finally {
        setIsImporting(false)
      }
    }

    const fetchPosts = async () => {
      let companyS = (localStorage.getItem("company_") || "")
      try {
        const res = await axios.get(`/api/${apis}?company=${companyS}`)
        const resA = await axios.get(`/api/${apis}?company=A`)
        setPosts(res.data)
        setData1(res.data)
        setPostsA(resA.data)
      } catch (error) {
        console.error(error)
      }
    }

    useEffect(() => {

      fetchPosts()
      listid === 0 ? "" : CleckSubmit()


    }, [listid])

    const AlertComplete = () => {
      // เมื่อชำระเงินสำเร็จ
      toast.success(<div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>, {
        description: <div style={{ fontFamily: "Kanit", fontSize: 20 }}> บันทึก ข้อมูลเรียบร้อย</div>,
        duration: 3000, // ปิดเองใน 3 วิ
      });
    };

    // Post Data
    const CleckSubmit = async () => {
      let company = (localStorage.getItem("company_") || "")



      try {
        await axios.post(`/api/${apis}`,
          {
            list,
            company
          }
        )

        AlertComplete()
        await fetchPosts()
        setlist("")
      }

      catch (error) {
        console.error(error)
      }
    }

    //**************************************** */
    // Delete/id
    const deletePost = async (id: Number) => {
      try {
        await axios.delete(`/api/${apis}/${id}`)
        await fetchPosts()
      } catch (error) {
        console.error('Failed to delete the post', error)
      }
    }

    //******************************************** */
    // Get/id
    const fetchPost = async (id: Number) => {
      try {
        const res = await axios.get(`/api/${apis}/${id}`)
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
        let company = (localStorage.getItem("company_") || "")
        await axios.put(`/api/${apis}/${idss}`,
          {
            list,
            company
          }
        )
        AlertComplete()
        await fetchPosts()
        setlist("")



      } catch (error) {
        console.error(error)
      }
    }




    const handleChange1 = (value: any) => {
      setsearch1(value);
      filterDataProduct1(value);
      setsh(0), setlist("")
    };

    // filter records by Productname
    const filterDataProduct1 = (value: any) => {
      const lowercasedValue = value.toLowerCase().trim();
      if (lowercasedValue === "") setData1(posts);
      else {
        const filteredData = data1.filter((f: any) =>
          f.list.toLowerCase().includes(search1.toLowerCase())
          //  || user.code.toLowerCase().includes(search.toLowerCase())  
          //  || user.Barcode.toLowerCase().includes(search.toLowerCase())                                       
        );
        setData1(filteredData);
      }
    };






    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '10px' }}>

          {/* Left Column - Area Management Card */}
          <div className={styles.productInfoCard}>
            <div className={styles.productInfoCardHeader}>
              <span>📍</span> พื้นที่เก็บ
            </div>
            <div className={styles.productInfoCardBody}>
              {/* Input Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px', background: '#f8f9fa', borderRadius: 8 }}>
                <input
                  type="text"
                  name="list"
                  id="list"
                  required
                  value={list}
                  onChange={(e) => setlist(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="ชื่อพื้นที่เก็บ"
                  style={{ fontFamily: 'Kanit', fontSize: 12, flex: 1 }}
                />
                {sh === 0 && (
                  <button
                    onClick={() => CleckSubmit()}
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ fontFamily: 'Kanit', fontSize: 11, whiteSpace: 'nowrap' }}
                  >
                    ➕ สร้าง
                  </button>
                )}
                {sh === 1 && (
                  <>
                    <button
                      onClick={handleSubmit}
                      type="button"
                      className="btn btn-warning btn-sm"
                      style={{ fontFamily: 'Kanit', fontSize: 11 }}
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      onClick={() => { setsh(0); setlist(""); }}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontFamily: 'Kanit', fontSize: 11 }}
                    >
                      ล้าง
                    </button>
                  </>
                )}
              </div>

              {/* Area List Table */}
              <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <table className="table table-hover" style={{ marginBottom: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                    <tr>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: '85%', fontSize: 10, fontWeight: 'bold' }}>
                        พื้นที่เก็บ
                        <div style={{ marginTop: 4 }}>
                          <input
                            name="list"
                            type="text"
                            value={search1}
                            onChange={(e) => handleChange1(e.target.value)}
                            className="form-control form-control-sm"
                            placeholder="🔍 ค้นหาพื้นที่เก็บ"
                            style={{ fontFamily: 'Kanit', fontSize: 11, height: 28 }}
                          />
                        </div>
                      </th>
                      <th scope="col" className={styles.bodydetailTable_Re} style={{ width: '15%', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="table-group-divider">
                    {data1.map((post: any) => (
                      <tr key={post.id} style={{ cursor: 'pointer' }}>
                        <td
                          onClick={() => { fetchPost(post.id); setidss(post.id); setsh(1); }}
                          className={styles.bodydetailTable_Re1}
                          style={{ fontSize: 12, padding: '8px 12px' }}
                        >
                          {post.list}
                        </td>
                        <td className={styles.bodydetailTable_Re1} style={{ textAlign: 'center', padding: '8px' }}>
                          <button
                            onClick={() => deletePost(post.id)}
                            style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
                          >
                            <Image alt="" src={deletes} style={{ width: 14, height: 14 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Sample Areas Card */}
          <div className={styles.pricingCard} style={{ background: 'linear-gradient(135deg, #fff 0%, #fef3c7 100%)' }}>
            <div className={styles.pricingCardHeader} style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><span>📋</span> ตัวอย่าง พื้นที่เก็บ</div>
              <button
                onClick={handleImportCSV}
                disabled={isImported || isImporting}
                style={{
                  background: isImported ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontFamily: 'Kanit',
                  cursor: isImported || isImporting ? 'not-allowed' : 'pointer',
                  opacity: isImported ? 0.7 : 1
                }}
              >
                {isImporting ? '⏳ กำลังนำเข้า...' : isImported ? '✅ นำเข้าแล้ว' : '🔄 GEN'}
              </button>
            </div>
            <div className={styles.pricingCardBody} style={{ padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
              <Table className="table" size="sm">
                <thead style={{ position: 'sticky', top: 0, background: '#f3f4f6' }}>
                  <tr>
                    <th className={styles.bodydetailTable_Re} style={{ width: '80%', color: '#374151', fontSize: 10, fontWeight: 'bold' }}>พื้นที่เก็บ</th>
                    <th className={styles.bodydetailTable_Re} style={{ width: '20%', color: '#374151', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>เพิ่ม</th>
                  </tr>
                </thead>
                <tbody className="table-group-divider">
                  {postsA.map((post) => {
                    const rowB = posts.find((r) => r.list === post.list);
                    return (
                      <tr key={post.id}>
                        <td
                          className={styles.bodydetailTable_Re1}
                          style={{
                            color: '#374151',
                            fontSize: 11,
                            padding: '8px 12px',
                            background: rowB && rowB.list === post.list ? '#E5EEF8' : 'transparent'
                          }}
                        >
                          {rowB && rowB.list === post.list && <span style={{ marginRight: 6 }}>✅</span>}
                          {post.list}
                        </td>
                        <td className={styles.bodydetailTable_Re1} style={{ textAlign: 'center', padding: '8px' }}>
                          <button
                            onClick={() => { setlist(post.list); setlistid(post.id); }}
                            disabled={rowB && rowB.list === post.list}
                            style={{
                              background: rowB && rowB.list === post.list ? '#d1d5db' : '#E5EEF8',
                              border: '1px solid ' + (rowB && rowB.list === post.list ? '#9ca3af' : '#3E86C7'),
                              borderRadius: 4,
                              padding: '3px 10px',
                              fontSize: 10,
                              fontFamily: 'Kanit',
                              color: rowB && rowB.list === post.list ? '#9ca3af' : '#3E86C7',
                              cursor: rowB && rowB.list === post.list ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {rowB && rowB.list === post.list ? 'เพิ่มแล้ว' : '➕ เพิ่ม'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>

        </div>
      </>
    )
  }



  return (
    <div className="" style={{ paddingLeft: 15, paddingRight: 15 }}  >

      <div className="row justify-content-start " >
        <HeadTab />
      </div>

      <div className="row justify-content-start " >

        <div className="col-sm-1" >
          <MenuTab_Small />
        </div>

        <div className="col-sm-11">
          <div className="row  shadow shadow-sm rounded border border " style={{ backgroundColor: "white" }}>

            {/*Button head product */}
            <MenuProductHead />

            <BodyCat />

          </div>
        </div>

      </div>
    </div>
  )
}
export default AreaPage