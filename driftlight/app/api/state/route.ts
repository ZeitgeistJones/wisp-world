import { NextResponse } from 'next/server';
import { redisGet, redisLRange } from '@/lib/redis';
import { getLexicon } from '@/lib/lexicon';
import { INITIAL_STATE } from '@/lib/world';

export async function GET() {
  try {
    const stateRaw = await redisGet('wisp:world:state');
    const state = stateRaw ? JSON.parse(stateRaw as string) : INITIAL_STATE;

    const logRaw = await redisLRange('wisp:story:log', -20, -1);
    const log = (logRaw || []).map((s: string) => JSON.parse(s));

    const pendingRaw = await redisLRange('wisp:submissions:pending', 0, -1);
    const pendingCount = (pendingRaw || []).length;

    const lexicon = await getLexicon();

    return NextResponse.json({ state, log, pendingCount, lexicon });
  } catch {
    return NextResponse.json({ error: 'failed to load state' }, { status: 500 });
  }
}
