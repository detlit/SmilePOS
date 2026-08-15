import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function DELETE(req: NextRequest) {
  const prisma = await getPrisma();
  
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');

    if (!company) {
      return Response.json(
        { error: 'Company is required' },
        { status: 400 }
      );
    }

    // Delete all records for this company
    const result = await prisma.datalist.deleteMany({
      where: { company: company }
    });

    return Response.json({
      success: true,
      count: result.count,
      message: `ลบข้อมูลสินค้าสำเร็จ ${result.count} รายการ`
    });

  } catch (error) {
    console.error('Delete all error:', error);
    return Response.json(
      { error: 'Failed to delete data', details: String(error) },
      { status: 500 }
    );
  }
}
