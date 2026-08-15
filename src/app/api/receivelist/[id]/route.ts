import { NextRequest } from 'next/server'
import { normalizeRcItemDates } from '../date-normalize'
import { netCostPatch } from '@/lib/lotCost'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

// 1. ????? Type ??? params ???? Promise
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  req: Request,
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params ??????????
    const params = await context.params
    const prisma = await getPrisma();
    const getId = await prisma.rCitemlist.findUnique({
      where: { id: Number(params.id) }
    })
    return Response.json(getId)
  }
  catch (error) {
    return new Response(JSON.stringify(error), { // ??? JSON.stringify ????????????????
      status: 500,
    })
  }
}

export async function PUT(
  req: Request,
  context: RouteContext, // ??? Type ??????
) {
  try {
    // 2. await params ??????????
    const params = await context.params

    const { company, codenames, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateRC, dateExp, freebaht, discountbaht, sale, balance, Barcode, type, person, statuss, maker }
      = await req.json()
    const prisma = await getPrisma();
    const updated = await prisma.rCitemlist.update({
      where: { id: Number(params.id) },
      data: {
        ...normalizeRcItemDates({ company, codenames, itemcode, itemName, unit, newCost, qty, totalcost, lot, dateRC, dateExp, freebaht, discountbaht, sale, balance, Barcode, type, person, statuss, maker }),
        ...netCostPatch({ newCost, qty, totalcost, discountbaht, freebaht })
      },
    })
    return Response.json(updated)
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
    })
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext,
) {
  try {
    const params = await context.params
    const id = Number(params.id);

    if (isNaN(id)) {
      return new Response(JSON.stringify({
        error: 'Invalid ID format',
        id: params.id
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prisma = await getPrisma();

    console.log(`🗑️ Attempting to delete RCitemlist with id: ${id}`);

    // First check if the record exists
    const existing = await prisma.rCitemlist.findUnique({
      where: { id },
    });

    if (!existing) {
      console.log(`❌ RCitemlist with id ${id} not found`);
      return new Response(JSON.stringify({
        error: 'Record not found',
        id: id
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deleted = await prisma.rCitemlist.delete({
      where: { id },
    });

    console.log(`✅ Successfully deleted RCitemlist with id: ${id}`);
    return Response.json(deleted);
  } catch (error: any) {
    console.error('❌ Error deleting RCitemlist:', error);

    // Handle common Prisma errors
    if (error.code === 'P2003') {
      return new Response(JSON.stringify({
        error: 'Cannot delete this record because it is referenced by other items (e.g., Sales or Stock Transactions).',
        code: error.code,
        meta: error.meta
      }), {
        status: 409, // Conflict or 400
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: error.message || 'Internal Server Error',
      code: error.code,
      meta: error.meta
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}