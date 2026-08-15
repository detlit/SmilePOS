import type { PrismaClient } from "@prisma/client";
async function getPrisma(): Promise<PrismaClient> {
  // dynamic import ? ??? import Prisma ??? build
  const { prisma } = await import("@/lib/prisma");
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}



type RouteContext = {
  params: Promise<{ id: string }>;
};




export async function GET(req: Request, context: RouteContext) {
  try {
    
    const { id } = await context.params;
const prisma = await getPrisma();
    const data = await prisma.area.findUnique({
      where: { id: Number(id) },
    });

    return Response.json(data);
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
   
    const { id } = await context.params;
    const { list, company } = await req.json();
const prisma = await getPrisma();
    const updated = await prisma.area.update({
      where: { id: Number(id) },
      data: { list, company },
    });

    return Response.json(updated);
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
  
    const { id } = await context.params;
const prisma = await getPrisma();
    const deleted = await prisma.area.delete({
      where: { id: Number(id) },
    });

    return Response.json(deleted);
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }
}
