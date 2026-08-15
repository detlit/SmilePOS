import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
    const searchParam=request.nextUrl.searchParams
    const companyall = searchParam.get('companyall')
    const get =await prisma.docMain.findMany({
      where:     
         // whereCondition as any
       { 
        companyall,

        }
      
    })
    return Response.json(get)
}




export async function POST(req: Request) {
  const prisma = await getPrisma();
  try{
   
    const {companyall,id_costomer,code_costomer,name_costomer,group_price,pay,bill,
         totalall,discount,sumtotal,addreward,usereward ,personall,statussall,taxnumber,
         qt_date,qt_number,qt_orderNo,qt_status,qt_person,qt_remark,qt_enddate,qt_credit,qt_orderfull,
          bl_date,bl_number,bl_orderNo,bl_status,bl_person,bl_remark,bl_enddate,bl_credit,bl_orderfull,
          inv_status,inv_person,inv_remark,inv_date,inv_enddate,inv_credit,inv_orderNo,inv_number,inv_orderfull,
          re_status,re_person,re_remark,re_date,re_enddate,re_credit,re_orderNo,re_number,re_orderfull,
          dn_status,dn_person,dn_remark,dn_date,dn_enddate,dn_credit,dn_orderNo,dn_number,dn_orderfull,dn_paytype,dn_deposit,dn_balance,
        tax_status,tax_person,tax_remark,tax_date,tax_enddate,tax_credit,tax_orderNo,tax_number,tax_orderfull,
        debit_status,debit_person,debit_remark,debit_date,debit_enddate,debit_credit,debit_orderNo,debit_number,debit_orderfull,
        debit_reference_no,debit_reason,debit_original_amount,debit_correct_amount,debit_difference_amount,debit_vat_rate,debit_vat_amount,debit_grand_total,
         credit_status,credit_person,credit_remark,credit_date,credit_enddate,credit_credit,credit_orderNo,credit_number,credit_orderfull,
        credit_reference_no,credit_reference_book_no,credit_reason,credit_item_name,credit_item_qty,credit_items_json,credit_original_amount,credit_correct_amount,credit_difference_amount,credit_reduce_amount,credit_vat_rate,credit_vat_amount,credit_net_total,
         detailsale} = await req.json()
    const newUser = await prisma.docMain.create({
    data: {  
         companyall,id_costomer,code_costomer,name_costomer,group_price,pay,bill,
         totalall,discount,sumtotal,addreward,usereward ,personall,statussall,taxnumber,
         qt_date,qt_number,qt_orderNo,qt_status,qt_person,qt_remark,qt_enddate,qt_credit,qt_orderfull,
          bl_date,bl_number,bl_orderNo,bl_status,bl_person,bl_remark,bl_enddate,bl_credit,bl_orderfull,
          inv_status,inv_person,inv_remark,inv_date,inv_enddate,inv_credit,inv_orderNo,inv_number,inv_orderfull,
          re_status,re_person,re_remark,re_date,re_enddate,re_credit,re_orderNo,re_number,re_orderfull,
          dn_status,dn_person,dn_remark,dn_date,dn_enddate,dn_credit,dn_orderNo,dn_number,dn_orderfull,dn_paytype,dn_deposit,dn_balance,
        tax_status,tax_person,tax_remark,tax_date,tax_enddate,tax_credit,tax_orderNo,tax_number,tax_orderfull,
        debit_status,debit_person,debit_remark,debit_date,debit_enddate,debit_credit,debit_orderNo,debit_number,debit_orderfull,
        debit_reference_no,debit_reason,debit_original_amount,debit_correct_amount,debit_difference_amount,debit_vat_rate,debit_vat_amount,debit_grand_total,
        credit_status,credit_person,credit_remark,credit_date,credit_enddate,credit_credit,credit_orderNo,credit_number,credit_orderfull,
        credit_reference_no,credit_reference_book_no,credit_reason,credit_item_name,credit_item_qty,credit_items_json,credit_original_amount,credit_correct_amount,credit_difference_amount,credit_reduce_amount,credit_vat_rate,credit_vat_amount,credit_net_total,
        
        detailsale: {
        create: detailsale
            },
         },
        include: {
             detailsale: true,
         },
    })
    return Response.json(newUser)
    
} catch (error) {
      console.error('POST /api/quatation error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Response.json({ error: message }, { status: 500 })
  }

}