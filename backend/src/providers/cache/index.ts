import { env } from '../../config/env';
import { logger } from '../../config/logger';

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

type CacheOptions = {
  ttlSeconds?: number;
  prefix?: string;
};

type CacheStats = {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
};

const DEFAULT_TTL_SECONDS = 300; // 5 minutes
const DEFAULT_PREFIX = 'hl';

// In-memory fallback cache when Redis is unavailable
const memoryCache = new Map<string, CacheEntry<unknown>>();
let memoryCacheCleanupInterval: ReturnType<typeof setInterval> | null = null;

function startMemoryCacheCleanup() {
  if (memoryCacheCleanupInterval) return;
  memoryCacheCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache) {
      if (entry.expiresAt <= now) {
        memoryCache.delete(key);
      }
    }
  }, 60_000);
}

const stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };

let redisConnection: unknown = null;
let redisAvailable = false;

async function getRedisConnection(): Promise<unknown> {
  if (redisConnection) return redisConnection;
  if (!env.REDIS_URL) return null;

  try {
    const ioredisModule = (await import('ioredis')) as { default: new (...args: unknown[]) => unknown };
    const conn = new ioredisModule.default(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    }) as {
      connect(): Promise<void>;
      on(event: string, handler: (...args: unknown[]) => void): void;
      get(key: string): Promise<string | null>;
      set(key: string, value: string, ...args: unknown[]): Promise<string>;
      del(...keys: string[]): Promise<number>;
      keys(pattern: string): Promise<string[]>;
      flushdb(): Promise<string>;
      ping(): Promise<string>;
      quit(): Promise<string>;
    };

    await conn.connect();
    redisConnection = conn;
    redisAvailable = true;

    conn.on('error', (err: unknown) => {
      logger.warn({ err }, 'Redis cache connection error, falling back to memory');
      redisAvailable = false;
    });

    conn.on('close', () => {
      redisAvailable = false;
      redisConnection = null;
    });

    return conn;
  } catch (err) {
    logger.warn({ err }, 'Redis cache unavailable, using memory fallback');
    return null;
  }
}

function buildKey(prefix: string, key: string): string {
  return `${prefix}:${key}`;
}

export async function cacheGet<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  const { prefix = DEFAULT_PREFIX } = options;
  const fullKey = buildKey(prefix, key);

  // Try Redis first
  const conn = await getRedisConnection();
  if (conn && redisAvailable) {
    try {
      const raw = await (conn as { get(key: string): Promise<string | null> }).get(fullKey);
      if (raw) {
        stats.hits++;
        return JSON.parse(raw) as T;
      }
      stats.misses++;
      return null;
    } catch {
      stats.errors++;
    }
  }

  // Memory fallback
  const entry = memoryCache.get(fullKey) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) {
    stats.hits++;
    return entry.data;
  }

  stats.misses++;
  return null;
}

export async function cacheSet<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
  const { ttlSeconds = DEFAULT_TTL_SECONDS, prefix = DEFAULT_PREFIX } = options;
  const fullKey = buildKey(prefix, key);
  const serialized = JSON.stringify(data);

  // Try Redis first
  const conn = await getRedisConnection();
  if (conn && redisAvailable) {
    try {
      await (conn as { set(key: string, value: string, ...args: unknown[]): Promise<string> }).set(fullKey, serialized, 'EX', ttlSeconds);
      stats.sets++;
      return;
    } catch {
      stats.errors++;
    }
  }

  // Memory fallback
  startMemoryCacheCleanup();
  memoryCache.set(fullKey, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  stats.sets++;
}

export async function cacheDelete(key: string, options: CacheOptions = {}): Promise<void> {
  const { prefix = DEFAULT_PREFIX } = options;
  const fullKey = buildKey(prefix, key);

  const conn = await getRedisConnection();
  if (conn && redisAvailable) {
    try {
      await (conn as { del(key: string): Promise<number> }).del(fullKey);
      stats.deletes++;
      return;
    } catch {
      stats.errors++;
    }
  }

  memoryCache.delete(fullKey);
  stats.deletes++;
}

export async function cacheDeletePattern(pattern: string, options: CacheOptions = {}): Promise<void> {
  const { prefix = DEFAULT_PREFIX } = options;
  const fullPattern = buildKey(prefix, pattern);

  const conn = await getRedisConnection();
  if (conn && redisAvailable) {
    try {
      const keys = await (conn as { keys(pattern: string): Promise<string[]> }).keys(fullPattern);
      if (keys.length > 0) {
        await (conn as { del(...keys: string[]): Promise<number> }).del(...keys);
        stats.deletes += keys.length;
      }
      return;
    } catch {
      stats.errors++;
    }
  }

  // Memory fallback — iterate and match
  const regex = new RegExp(
    '^' + fullPattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
  );
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
      stats.deletes++;
    }
  }
}

export async function cacheFlush(): Promise<void> {
  memoryCache.clear();

  const conn = await getRedisConnection();
  if (conn && redisAvailable) {
    try {
      await (conn as { flushdb(): Promise<string> }).flushdb();
    } catch {
      stats.errors++;
    }
  }
}

export function cacheStats(): CacheStats & { memorySize: number; redisAvailable: boolean } {
  return { ...stats, memorySize: memoryCache.size, redisAvailable };
}

export async function cacheWarm(entries: { key: string; data: unknown; ttlSeconds?: number }[], options: CacheOptions = {}): Promise<void> {
  await Promise.allSettled(
    entries.map((entry) =>
      cacheSet(entry.key, entry.data, { ...options, ttlSeconds: entry.ttlSeconds })
    )
  );
}

export async function cacheHealthCheck(): Promise<{ status: string; backend: string; latencyMs: number }> {
  const start = Date.now();
  const conn = await getRedisConnection();

  if (conn && redisAvailable) {
    try {
      await (conn as { ping(): Promise<string> }).ping();
      return {
        status: 'healthy',
        backend: 'redis',
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        status: 'degraded',
        backend: 'memory',
        latencyMs: Date.now() - start,
      };
    }
  }

  return {
    status: 'degraded',
    backend: 'memory',
    latencyMs: Date.now() - start,
  };
}
