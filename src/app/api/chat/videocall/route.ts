import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/chat/videocall - Create a video call room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, conversationId, initiatedBy } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    const roomId = `vc_${crypto.randomBytes(12).toString('hex')}`;

    const videoCall = await prisma.videoCall.create({
      data: {
        company: company || '',
        conversationId,
        roomId,
        initiatedBy: initiatedBy || '',
        status: 'pending',
      },
    });

    return NextResponse.json({ videoCall, roomId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/chat/videocall - Update call status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, status, notes } = body;

    if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });

    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;

    if (status === 'active') data.startedAt = new Date();
    if (status === 'ended' || status === 'missed') {
      data.endedAt = new Date();
      // Calculate duration
      const call = await prisma.videoCall.findUnique({ where: { roomId } });
      if (call?.startedAt) {
        data.duration = Math.round((Date.now() - call.startedAt.getTime()) / 1000);
      }
    }

    const videoCall = await prisma.videoCall.update({
      where: { roomId },
      data,
    });

    return NextResponse.json({ videoCall });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/chat/videocall?roomId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || '';
    const conversationId = searchParams.get('conversationId');

    if (roomId) {
      const videoCall = await prisma.videoCall.findUnique({ where: { roomId } });
      return NextResponse.json({ videoCall });
    }

    if (conversationId) {
      const calls = await prisma.videoCall.findMany({
        where: { conversationId: parseInt(conversationId) },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ videoCalls: calls });
    }

    return NextResponse.json({ error: 'roomId or conversationId required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
