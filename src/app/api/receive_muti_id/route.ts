import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}




export async function PUT( req: Request) {
      
  try {
 
 const { sales_lot }= await req.json()
const prisma = await getPrisma();
 
const updateMany = await prisma.rCitemlist.updateMany({
where: {
        id:{
          in :sales_lot.id_receive1,

        }
        },
        data: {
          sale: sales_lot.sale_lot1 ,
          balance: sales_lot.balance_lot1,
              }
})
return Response.json(updateMany),console.log(sales_lot.sale_lot1) // Outputs the count of records updated


  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    })
  }
}
/*
const main = async () => {
   const { sales_lot }= await req.json()
const updateMany = await prisma.rCitemlist.updateMany({
where: {
id:
           {
            in: sales_lot.id_receive1,

           }
},
data: {
  sale: sales_lot.sale_lot1 ,
  balance: sales_lot.balance_lot1,
}
});
console.log(updateMany); // Outputs the count of records updated
};
main();*/