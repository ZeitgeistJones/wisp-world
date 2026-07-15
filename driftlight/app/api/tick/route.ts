import { NextResponse } from 'next/server';
import { runTick } from '@/lib/tick';

export async function POST(req: Request) {
  const token = req.headers.get('x-admin-token');
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await runTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'tick failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
