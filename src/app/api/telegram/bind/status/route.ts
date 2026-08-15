import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/telegram/bind/status?id=xx
// หน้า settings poll มาเช็คว่า user ยืนยันใน Telegram แล้วหรือยัง
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id') || 0);
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const binding = await prisma.telegramBinding.findUnique({ where: { id } });
    if (!binding) return NextResponse.json({ error: 'not found' }, { status: 404 });

    return NextResponse.json({
      id: binding.id,
      isActive: binding.isActive,
      chatId: binding.chatId,
      chatTitle: binding.chatTitle,
      chatType: binding.chatType,
      expired: binding.bindExpiresAt ? binding.bindExpiresAt < new Date() : false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
