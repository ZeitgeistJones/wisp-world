import { NextResponse } from 'next/server';
import { redisRPush, redisLRange } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'empty submission' }, { status: 400 });
    }
    const trimmed = text.trim().slice(0, 280);
    await redisRPush('wisp:submissions:pending', trimmed);
    const pending = await redisLRange('wisp:submissions:pending', 0, -1);
    return NextResponse.json({ ok: true, pendingCount: (pending || []).length });
  } catch {
    return NextResponse.json({ error: 'submit failed' }, { status: 500 });
  }
}
