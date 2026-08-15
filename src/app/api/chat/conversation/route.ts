import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH /api/chat/conversation - Update conversation status/assignment
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, assignedTo, priority } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const data: any = {};
    if (status) data.status = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (priority) data.priority = priority;
    if (status === 'closed' || status === 'resolved') data.closedAt = new Date();

    const conversation = await prisma.chatConversation.update({
      where: { id },
      data,
    });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
