const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

async function redisFetch(command: (string | number)[]) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`redis error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.result;
}

export async function redisGet(key: string) {
  return redisFetch(['GET', key]);
}

export async function redisSet(key: string, value: string) {
  return redisFetch(['SET', key, value]);
}

export async function redisRPush(key: string, value: string) {
  return redisFetch(['RPUSH', key, value]);
}

export async function redisLRange(key: string, start: number, stop: number) {
  return redisFetch(['LRANGE', key, start, stop]);
}

export async function redisDel(key: string) {
  return redisFetch(['DEL', key]);
}

export async function redisHSet(key: string, field: string, value: string) {
  return redisFetch(['HSET', key, field, value]);
}

export async function redisHGet(key: string, field: string) {
  return redisFetch(['HGET', key, field]);
}

export async function redisHGetAll(key: string): Promise<Record<string, string>> {
  const result = await redisFetch(['HGETALL', key]);
  if (!result) return {};
  if (!Array.isArray(result)) return result as Record<string, string>;
  const obj: Record<string, string> = {};
  for (let i = 0; i < result.length; i += 2) {
    obj[result[i]] = result[i + 1];
  }
  return obj;
}
