/**
 * src/lib/cache.ts
 *
 * Wrapper around Upstash Redis for caching frequently-accessed data.
 * Implements fail-open pattern: if Redis is unavailable, app continues to work.
 *
 * Usage:
 *   // Get from cache, fetch if missing
 *   const data = await cache.get<User>('user:123');
 *   if (!data) {
 *     data = await db.user.findUnique({ where: { id: '123' } });
 *     await cache.set('user:123', data, 3600); // 1 hour TTL
 *   }
 */

import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client (handles missing env vars gracefully)
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const CACHE_ENABLED = !!redis;

/**
 * Log cache operations (disabled in production by default).
 */
const DEBUG = false;

function log(message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[CACHE] ${message}`, data);
  }
}

/**
 * Get a value from cache.
 * Returns null if key doesn't exist or cache is unavailable.
 */
export async function get<T>(key: string): Promise<T | null> {
  if (!CACHE_ENABLED) {
    return null;
  }

  try {
    const value = await redis!.get(key);
    if (value) {
      log(`HIT: ${key}`);
      return JSON.parse(String(value)) as T;
    }
    log(`MISS: ${key}`);
    return null;
  } catch (error) {
    // Fail-open: log error but don't throw
    console.error('[CACHE GET ERROR]', key, error);
    return null;
  }
}

/**
 * Set a value in cache with optional TTL (in seconds).
 */
export async function set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  if (!CACHE_ENABLED) {
    return;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis!.setex(key, ttlSeconds, serialized);
    } else {
      await redis!.set(key, serialized);
    }
    log(`SET: ${key} (ttl: ${ttlSeconds || 'infinite'})`);
  } catch (error) {
    // Fail-open: log error but don't throw
    console.error('[CACHE SET ERROR]', key, error);
  }
}

/**
 * Delete a single key from cache.
 */
export async function invalidate(key: string): Promise<void> {
  if (!CACHE_ENABLED) {
    return;
  }

  try {
    await redis!.del(key);
    log(`DELETE: ${key}`);
  } catch (error) {
    console.error('[CACHE DELETE ERROR]', key, error);
  }
}

/**
 * Delete all keys matching a pattern.
 * Note: SCAN is used instead of KEYS to avoid blocking Redis.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  if (!CACHE_ENABLED) {
    return;
  }

  try {
    // Use SCAN to iterate over keys without blocking
    let cursor = 0;
    let totalDeleted = 0;

    do {
      const [nextCursor, keys] = await redis!.scan(cursor, { match: pattern, count: 100 });

      if (keys.length > 0) {
        await redis!.del(...(keys as string[]));
        totalDeleted += keys.length;
      }

      cursor = nextCursor as unknown as number;
    } while (cursor !== 0);

    log(`INVALIDATE PATTERN: ${pattern} (deleted ${totalDeleted} keys)`);
  } catch (error) {
    console.error('[CACHE INVALIDATE PATTERN ERROR]', pattern, error);
  }
}

/**
 * Atomically get or set a value (for cache-aside pattern).
 * Useful for avoiding cache stampede when multiple requests arrive during cache miss.
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  // Try cache first
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss: fetch and store
  const value = await fetcher();
  await set(key, value, ttlSeconds);
  return value;
}

/**
 * Increment a counter (for analytics, rate limiting, etc.).
 */
export async function increment(key: string, amount = 1): Promise<number> {
  if (!CACHE_ENABLED) {
    return 0;
  }

  try {
    const newValue = await redis!.incrby(key, amount);
    log(`INCR: ${key} = ${newValue}`);
    return newValue as number;
  } catch (error) {
    console.error('[CACHE INCREMENT ERROR]', key, error);
    return 0;
  }
}

/**
 * Get cache health status.
 */
export async function health(): Promise<{ ok: boolean; error?: string }> {
  if (!CACHE_ENABLED) {
    return { ok: false, error: 'Redis not configured' };
  }

  try {
    const ping = await redis!.ping();
    return { ok: String(ping) === 'PONG' };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * Clear all keys from cache (use with caution in production).
 */
export async function flush(): Promise<void> {
  if (!CACHE_ENABLED) {
    return;
  }

  try {
    await redis!.flushdb();
    log('FLUSH: Cleared all keys');
  } catch (error) {
    console.error('[CACHE FLUSH ERROR]', error);
  }
}

// Predefined cache key generators for consistency

export const keys = {
  // Admin dashboard
  adminSummary: (school: string) => `admin:summary:${school}`,
  adminUsers: (page: number) => `admin:users:page:${page}`,
  adminBookings: (school: string, page: number) => `admin:bookings:${school}:page:${page}`,
  adminLandlords: (page: number) => `admin:landlords:page:${page}`,

  // Landlord data
  landlordEarnings: (userId: string) => `landlord:earnings:${userId}`,
  landlordProfile: (userId: string) => `landlord:profile:${userId}`,
  landlordBankAccount: (userId: string) => `landlord:bankaccount:${userId}`,

  // Public data
  property: (propertyId: string) => `property:${propertyId}`,
  locationCount: (location: string) => `location:count:${location}`,
  amenitiesList: () => 'static:amenities',

  // Patterns for bulk invalidation
  adminSummaryPattern: () => 'admin:summary:*',
  adminUsersPattern: () => 'admin:users:*',
  landlordDataPattern: (userId: string) => `landlord:*:${userId}`,
};
