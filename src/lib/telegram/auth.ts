// Helper ตรวจว่าคำขอจาก user ระดับ "เจ้าของกิจการ" (level2) เท่านั้น
// client ต้องส่ง header: x-user-level: level2
// (ในระบบ offline/single-tenant นี้ไม่มี JWT บน backend — ใช้ header จาก client + ซ่อน UI ทางฝั่ง front)
import { NextRequest } from 'next/server';

export function isOwnerRequest(req: NextRequest): boolean {
  const lvl = req.headers.get('x-user-level') || '';
  return lvl === 'level2';
}

export function requireOwner(req: NextRequest): { ok: true } | { ok: false; status: number; body: any } {
  if (!isOwnerRequest(req)) {
    return { ok: false, status: 403, body: { error: 'forbidden: เฉพาะเจ้าของกิจการเท่านั้น' } };
  }
  return { ok: true };
}
