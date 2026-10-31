/**
 * Upstash Redis client with fallback check.
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured,
 * callers can check isRedisConfigured() to use in-memory/tmp fallback.
 */

export function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(
    url &&
    token &&
    !url.includes("your-redis-url") &&
    url.startsWith("https://")
  );
}

async function redisCommand<T = unknown>(...args: (string | number)[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!isRedisConfigured() || !url || !token) {
    throw new Error("Upstash Redis is not configured");
  }

  const endpoint = `${url}/${args.map((a) => encodeURIComponent(String(a))).join("/")}`;
  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redis error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.result as T;
}

export const redis = {
  isConfigured: isRedisConfigured,

  /** GET key → string | null */
  async get(key: string): Promise<string | null> {
    return redisCommand<string | null>("GET", key);
  },

  /** SET key value (with optional EX seconds) */
  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    if (exSeconds) {
      await redisCommand("SET", key, value, "EX", exSeconds);
    } else {
      await redisCommand("SET", key, value);
    }
  },

  /** LPUSH list value → new length */
  async lpush(key: string, value: string): Promise<number> {
    return redisCommand<number>("LPUSH", key, value);
  },

  /** LRANGE list start stop → string[] */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return redisCommand<string[]>("LRANGE", key, start, stop);
  },

  /** LSET list index value */
  async lset(key: string, index: number, value: string): Promise<void> {
    await redisCommand("LSET", key, index, value);
  },

  /** LLEN list → number */
  async llen(key: string): Promise<number> {
    return redisCommand<number>("LLEN", key);
  },
};
