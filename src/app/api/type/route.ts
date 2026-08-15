import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



export async function GET() {
  const prisma = await getPrisma();
    const get =await prisma.type.findMany()
    return Response.json(get)
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  try{
    const {shortlist,list,company} = await req.json()
const newUser = await prisma.type.create({
  data: {
    shortlist,
    list,
    company,
    
  },
})
    return Response.json(newUser)
    
} catch (error) {
      return new Response(error as BodyInit , {
      status: 500,
    })
  }

}
