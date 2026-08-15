import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOwner } from '@/lib/telegram/auth';

// GET /api/telegram/bindings?company=xxx
// List bindings ของร้าน
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || '';
    if (!company) return NextResponse.json({ error: 'company required' }, { status: 400 });

    const bindings = await prisma.telegramBinding.findMany({
      where: { company, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ bindings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/telegram/bindings  Body: { id, notifySale?, notifyCancel?, ... }
export async function PATCH(req: NextRequest) {
  const g = requireOwner(req);
  if (!g.ok) return NextResponse.json(g.body, { status: g.status });
  try {
    const body = await req.json();
    const id = Number(body.id || 0);
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const data: any = {};
    for (const k of ['notifySale', 'notifyCancel', 'notifyHourly', 'notifyDaily']) {
      if (k in body) data[k] = Boolean(body[k]);
    }
    if ('minAmount' in body) data.minAmount = Number(body.minAmount) || 0;
    if ('quietStart' in body) data.quietStart = String(body.quietStart || '');
    if ('quietEnd' in body) data.quietEnd = String(body.quietEnd || '');

    const binding = await prisma.telegramBinding.update({ where: { id }, data });
    return NextResponse.json({ binding });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/telegram/bindings?id=xx
export async function DELETE(req: NextRequest) {
  const g = requireOwner(req);
  if (!g.ok) return NextResponse.json(g.body, { status: g.status });
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id') || 0);
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.telegramBinding.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
