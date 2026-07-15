import { NextResponse } from 'next/server';
import { redisGet, redisRPush } from '@/lib/redis';
import { getLexicon, hasEntry, addEntry } from '@/lib/lexicon';
import { SCAFFOLD, INITIAL_STATE, buildCombinePrompt } from '@/lib/world';
import { callClaude } from '@/lib/anthropic';

export async function POST(req: Request) {
  try {
    const { a, b } = await req.json();
    if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
      return NextResponse.json({ error: 'need two things' }, { status: 400 });
    }

    const lex = await getLexicon();
    const names = lex.map((e) => e.name);
    if (!names.includes(a.toLowerCase()) || !names.includes(b.toLowerCase())) {
      return NextResponse.json({ error: 'both must exist in the world' }, { status: 400 });
    }

    const stateRaw = await redisGet('wisp:world:state');
    const state = stateRaw ? JSON.parse(stateRaw as string) : INITIAL_STATE;

    const prompt = buildCombinePrompt(a, b, SCAFFOLD, names);
    const raw = await callClaude(prompt);

    let parsed;
    try {
      const cleaned = raw.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'the world could not make sense of that' }, { status: 500 });
    }

    const result = String(parsed.result || '').toLowerCase().trim();
    if (!result) {
      return NextResponse.json({ error: 'nothing came of it' }, { status: 500 });
    }

    const alreadyExists = await hasEntry(result);

    if (!alreadyExists) {
      await addEntry({
        name: result,
        note: parsed.note || '',
        cycle: (state.cycle || 0) + 1,
        from: [a.toLowerCase(), b.toLowerCase()],
      });
      await redisRPush('wisp:discoveries:pending', result);
    }

    return NextResponse.json({
      result,
      note: parsed.note || '',
      isNew: !alreadyExists,
    });
  } catch {
    return NextResponse.json({ error: 'combine failed' }, { status: 500 });
  }
}
