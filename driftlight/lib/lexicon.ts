import { redisHGetAll, redisHSet, redisHGet } from './redis';
import { SEED_LEXICON } from './world';

export type LexEntry = {
  name: string;
  note: string;
  cycle: number;
  from?: [string, string];
};

export async function getLexicon(): Promise<LexEntry[]> {
  await seedLexiconIfNeeded();
  const raw = await redisHGetAll('wisp:lexicon');
  const entries: LexEntry[] = [];
  for (const key of Object.keys(raw)) {
    try {
      entries.push(JSON.parse(raw[key]));
    } catch {
      continue;
    }
  }
  return entries;
}

export async function seedLexiconIfNeeded() {
  for (const name of SEED_LEXICON) {
    const exists = await redisHGet('wisp:lexicon', name);
    if (!exists) {
      await redisHSet(
        'wisp:lexicon',
        name,
        JSON.stringify({ name, note: 'it has always been here.', cycle: 0 })
      );
    }
  }
}

export async function hasEntry(name: string) {
  const v = await redisHGet('wisp:lexicon', name.toLowerCase());
  return !!v;
}

export async function addEntry(entry: LexEntry) {
  await redisHSet('wisp:lexicon', entry.name.toLowerCase(), JSON.stringify(entry));
}
