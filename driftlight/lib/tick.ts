import { redisGet, redisSet, redisLRange, redisDel, redisRPush } from './redis';
import { SCAFFOLD, INITIAL_STATE, buildFusionPrompt } from './world';
import { seedLexiconIfNeeded } from './lexicon';
import { callClaude } from './anthropic';

export async function runTick() {
  await seedLexiconIfNeeded();

  const stateRaw = await redisGet('wisp:world:state');
  const state = stateRaw ? JSON.parse(stateRaw as string) : INITIAL_STATE;

  const pendingRaw = await redisLRange('wisp:submissions:pending', 0, -1);
  const submissions = (pendingRaw || []) as string[];

  const discRaw = await redisLRange('wisp:discoveries:pending', 0, -1);
  const discoveries = (discRaw || []) as string[];

  const nextCycle = (state.cycle || 0) + 1;
  const prompt = buildFusionPrompt(
    SCAFFOLD,
    state.sceneSummary,
    submissions,
    discoveries,
    nextCycle
  );
  const raw = await callClaude(prompt);

  let parsed;
  try {
    const cleaned = raw
      .trim()
      .replace(/^```json/, '')
      .replace(/^```/, '')
      .replace(/```$/, '');
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`model returned unparseable output: ${raw}`);
  }

  const newState = {
    ...state,
    sceneSummary: parsed.sceneSummary || state.sceneSummary,
    characterMood: parsed.characterMood || state.characterMood,
    cycle: nextCycle,
  };
  await redisSet('wisp:world:state', JSON.stringify(newState));

  const entry = {
    id: nextCycle,
    timestamp: Date.now(),
    beat: parsed.beat,
    murmur: parsed.murmur || parsed.reaction || '',
    submissionCount: submissions.length,
    discoveries,
  };
  await redisRPush('wisp:story:log', JSON.stringify(entry));
  await redisDel('wisp:submissions:pending');
  await redisDel('wisp:discoveries:pending');

  return { entry, newState };
}
