import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

import { time } from 'console'



export async function GET(request: NextRequest) {

    const TimesS=
                [
                    {id:0,name:"A",t:""},
                    {id:1,name:"A",t:"เช้า-เย็น"},
                    {id:2,name:"A",t:"เช้า-กลางวัน-เย็น"},
                    {id:3,name:"A",t:"เช้า-กลางวัน-เย็น-ก่อนนอน"},
                    {id:4,name:"A",t:"วันละ 1 ครั้ง ช่วงเวลาเดียวกัน"},    
                    {id:5,name:"A",t:"ทุก 4 ชั่วโมง"},
                    {id:6,name:"A",t:"ทุก 6 ชั่วโมง"},
                    {id:7,name:"A",t:"ทุก 12 ชั่วโมง"},
                    {id:8,name:"A",t:"ก่อนนอน"},
                    {id:9,name:"A",t:"เช้า"},
                    {id:10,name:"A",t:"เย็น"},
                    {id:11,name:"A",t:"ทุกครั้งที่มีอาการ"},

                    {id:12,name:"B",t:""},
                    {id:13,name:"B",t:"ก่อนอาหาร"},
                    {id:14,name:"B",t:"พร้อมอาหาร"},
                    {id:15,name:"B",t: "หลังอาหาร"},
                  
                    {id:16,name:"C",t: ""},
                    {id:17,name:"C",t: "เก็บในอุณหภูมิห้อง"},
                    {id:18,name:"C",t: "เก็บในตู้เย็น"},

                    {id:19,name:"D",t:"รับประทานครั้งละ" },
                    {id:20,name:"D",t:"ทาวันละ" },
                    {id:21,name:"D",t:"หยอดครั้งละ" },
                    {id:22,name:"D",t:"พ่นเข้าจมูกครั้งละ" },
                    {id:23,name:"D",t:"พ่นเข้าจมูกข้างละ" },
                    {id:24,name:"D",t:"พ่นช่องปากครั้งละ" },
                    {id:25,name:"D",t:"พ่นช่องปากข้างละ" },
                    {id:26,name:"D",t:"รับประทานตามแพทย์สั่ง" },
                    {id:27,name:"D",t:"เหน็บครั้งละ" },
                    {id:50,name:"D",t:"เหน็บช่องคลอดครั้งละ" },
                    {id:50,name:"D",t:"เหน็บทวานหนักครั้งละ" },
                    {id:51,name:"D",t:"อมใต้ลิ้นครั้งละ" },
                    {id:52,name:"D",t:"สระครั้งละ" },

                    {id:28,name:"E",t:"เม็ด" },
                    {id:29,name:"E",t:"ml" },
                    {id:30,name:"E",t:"ช้อนโต๊ะ" },
                    {id:31,name:"E",t:"ช้อนชา" },
                    {id:32,name:"E",t:"ครั้ง" },
                    {id:33,name:"E",t:"ซอง" },
                    {id:34,name:"E",t:"หยด" },
                    {id:35,name:"E",t:"แท่ง" },
                    {id:36,name:"E",t:"" },

                    {id:37,name:"F",t:"" },
                    {id:38,name:"F",t:"เขย่าขวดก่อนรับประทาน"},
                    {id:39,name:"F",t:"ใช้ติดต่อกัน 4-6 สัปดาห์" },
                    {id:40,name:"F",t:"รับประทานยาติดต่อกันจนยาหมด เพื่อป้องกันการดื้อยา" },
                    {id:41,name:"F",t:"เปิดใช้แล้วมีอายุ 1 เดือน"},
                    {id:42,name:"F",t: "ไม่ควรใช้ติดต่อกันเกิน…….วัน"},
                    {id:43,name:"F",t:"ยานี้ทำให้ง่วงนอน" },
                    {id:44,name:"F",t:"ยามีฤทธิ์ระคายเคืองกระเพาะอาหาร" },
                    {id:45,name:"F",t:"ห้ามปรับขนาดยาเอง โดยไม่มีคำสั่งแพทย์"},
                    {id:46,name:"F",t:"ดื่มน้ำตามมากๆ"},
                    {id:47,name:"F",t:"ห้ามรับประทานยาร่วมกับแอลกอฮอล์"},
                    {id:48,name:"F",t:"ทุกครั้งที่มีอาการ"},

                ]

    
    
    
    
    return Response.json(TimesS)
}



