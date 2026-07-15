export const SCAFFOLD = `driftlight is a small coastal town wrapped in fog most mornings. wisp lives alone near the harbor and tends a garden that never quite grows right. the town's lighthouse went dark three nights ago and no one in driftlight will explain why. that mystery is the implied backbone of the story - things can wander far from it, but it is always there, waiting to be picked back up.`;

export const SEED_LEXICON = [
  'fog',
  'lighthouse',
  'harbor',
  'garden',
  'lantern',
  'salt',
];

export const INITIAL_STATE = {
  title: 'driftlight',
  sceneSummary:
    'a foggy morning in driftlight. wisp waters a garden that refuses to grow right, half-watching the dark lighthouse across the water.',
  characterMood: 'quietly uneasy',
  cycle: 0,
};

export function buildCombinePrompt(a: string, b: string, scaffold: string, existing: string[]) {
  return `you are the discovery engine for driftlight, a quiet, foggy, slightly melancholy coastal story world.

world tone: ${scaffold}

two things that exist in this world are being combined:
"${a}" + "${b}"

things that already exist in the world: ${existing.join(', ')}

invent the single thing that results from combining these two. rules:
- it must fit driftlight's tone: quiet, coastal, foggy, a little melancholy, a little strange. never jokey, never fantasy-generic, never sci-fi.
- it can be a physical object, a place, a person, a feeling, a phenomenon, or an event. abstract results are good and encouraged.
- 1-3 words, lowercase.
- it should feel like it belongs in a literary short story, not a video game item list.
- do not simply return one of the two inputs, and avoid returning something already in the world unless it is genuinely the only sensible result.

respond ONLY with valid JSON, no markdown fences:
{"result": "...", "note": "one short poetic sentence describing what this is, in driftlight's voice"}`;
}

export function buildFusionPrompt(
  scaffold: string,
  sceneSummary: string,
  submissions: string[],
  discoveries: string[],
  cycle: number
) {
  const submissionBlock = submissions.length
    ? submissions.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '(no visitor submissions this cycle)';

  const discoveryBlock = discoveries.length
    ? discoveries.join(', ')
    : '(nothing new was discovered this cycle)';

  return `you are the story engine for a persistent, crowd-shaped narrative world.

baseline scaffold (the implied backbone of the story, not a script to follow rigidly):
${scaffold}

current world state:
${sceneSummary}

this is story cycle ${cycle}.

visitor submissions for what happens next this cycle:
${submissionBlock}

things newly discovered in the world this cycle (these have just come into existence and should appear or make themselves felt in the story):
${discoveryBlock}

task:
synthesize the submissions and the new discoveries into ONE coherent next story beat, 2-4 sentences, third person, quiet literary style. honor as many as you reasonably can without producing something incoherent. if they genuinely conflict in tone, favor coherence over inclusion - blend or downweight rather than jam every fragment in literally. if there is nothing at all, advance the baseline scaffold naturally on your own.

then write wisp's in-character reaction - one to two sentences, first person, like a private diary thought. wisp has no idea any of this was shaped by outside visitors and must never hint at being watched or influenced. wisp reacts like a real person encountering real events, with continuity of personality across cycles.

respond ONLY with valid JSON, no markdown fences:
{"beat": "...", "reaction": "...", "sceneSummary": "...", "characterMood": "..."}

sceneSummary: one short sentence snapshot of where things stand now. characterMood: one to three words.`;
}
