import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/chat/quick-replies?company=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || '';

    const quickReplies = await prisma.chatQuickReply.findMany({
      where: { company },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ quickReplies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat/quick-replies
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body?.id) || 0;
    const company = typeof body?.company === 'string' ? body.company.trim() : '';
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    const category = typeof body?.category === 'string' ? body.category.trim() : '';
    const shortcut = typeof body?.shortcut === 'string' ? body.shortcut.trim() : '';

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content required' }, { status: 400 });
    }

    let qr;
    if (id) {
      qr = await prisma.chatQuickReply.update({
        where: { id },
        data: { title, content, category, shortcut },
      });
    } else {
      if (!company) {
        return NextResponse.json({ error: 'company required' }, { status: 400 });
      }

      qr = await prisma.chatQuickReply.create({
        data: { company, title, content, category, shortcut },
      });
    }

    return NextResponse.json({ quickReply: qr });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/chat/quick-replies
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.chatQuickReply.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
