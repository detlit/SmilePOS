import { NextRequest, NextResponse } from 'next/server';
import { addSignal, getSignals, clearRoom } from '@/lib/chat/signaling-store';

// POST - Add a signal (offer, answer, or ICE candidate)
export async function POST(req: NextRequest) {
  try {
    const { roomId, type, data, role } = await req.json();

    if (!roomId || !type || !data || !role) {
      return NextResponse.json({ error: 'roomId, type, data, role required' }, { status: 400 });
    }

    if (!['offer', 'answer', 'ice'].includes(type)) {
      return NextResponse.json({ error: 'type must be offer, answer, or ice' }, { status: 400 });
    }

    if (!['agent', 'customer'].includes(role)) {
      return NextResponse.json({ error: 'role must be agent or customer' }, { status: 400 });
    }

    addSignal(roomId, { type, data, role });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Poll for signals (returns signals from the OTHER role)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const role = searchParams.get('role') as 'agent' | 'customer';
    const after = parseInt(searchParams.get('after') || '0');

    if (!roomId || !role) {
      return NextResponse.json({ error: 'roomId, role required' }, { status: 400 });
    }

    const signals = getSignals(roomId, role, after);
    return NextResponse.json({ signals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Clean up room signals
export async function DELETE(req: NextRequest) {
  try {
    const { roomId } = await req.json();
    if (roomId) clearRoom(roomId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
