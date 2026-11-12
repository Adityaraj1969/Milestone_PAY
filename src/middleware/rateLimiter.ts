/**
 * Express rate-limiting middleware backed by an atomic Redis token bucket.
 * 
 * Features:
 * - Atomic evaluation using a Redis Lua script to eliminate race conditions
 * - Configurable capacity and refill rate
 * - Input validation on options and incoming client identifiers
 * - Graceful degradation (fail-open) if Redis is unavailable or disconnected
 * - HTTP 429 Too Many Requests response with standard Retry-After header
 * - Zero hardcoded credentials (reads from process.env.REDIS_URL)
 */

export interface RateLimiterOptions {
  /** Maximum number of tokens the bucket can hold. Defaults to 60. */
  capacity?: number;
  /** Number of tokens added to the bucket each second. Defaults to 1. */
  refillRatePerSec?: number;
  /** Key prefix in Redis to namespace rate limiter keys. Defaults to 'ratelimit:tb:'. */
  keyPrefix?: string;
  /** Optional custom key generator function (e.g. by API key, user ID, or IP). */
  keyGenerator?: (req: any) => string;
}

export interface RateLimiterResponse {
  allowed: boolean;
  remainingTokens: number;
  retryAfterSeconds: number;
}

/**
 * Atomic Lua script for the token bucket algorithm in Redis:
 * KEYS[1]: bucket key
 * ARGV[1]: bucket capacity (number)
 * ARGV[2]: refill rate per second (number)
 * ARGV[3]: current timestamp in milliseconds (number)
 * ARGV[4]: requested tokens (number, typically 1)
 * ARGV[5]: TTL in seconds
 * 
 * Returns: { allowed (1 or 0), remaining_tokens (number), retry_after_seconds (number) }
 */
export const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

if not tokens or not lastRefill then
  tokens = capacity
  lastRefill = now
else
  local elapsed = (now - lastRefill) / 1000
  if elapsed > 0 then
    tokens = math.min(capacity, tokens + (elapsed * refillRate))
    lastRefill = now
  end
end

if tokens >= requested then
  tokens = tokens - requested
  redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
  redis.call('EXPIRE', key, ttl)
  return { 1, math.floor(tokens), 0 }
else
  local missing = requested - tokens
  local retryAfter = math.ceil(missing / refillRate)
  return { 0, math.floor(tokens), retryAfter }
end
`;

export interface RedisClientLike {
  eval: (script: string, numkeys: number, ...args: (string | number)[]) => Promise<any>;
  status?: string;
  on?: (event: string, listener: (...args: any[]) => void) => void;
}

// Global Redis singleton reference with graceful fallback
let defaultRedis: RedisClientLike | null = null;
let isRedisReady = false;

export function getRedisClient(): RedisClientLike | null {
  if (defaultRedis) return defaultRedis;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    // Dynamic require so the middleware compiles even if ioredis is mocked or externalized
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require('ioredis');
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => Math.min(times * 100, 2000),
    });

    client.on('connect', () => {
      isRedisReady = true;
    });

    client.on('error', (err: any) => {
      isRedisReady = false;
      console.warn('[RateLimiter] Redis connection issue; failing open:', err?.message || err);
    });

    defaultRedis = client;
    return defaultRedis;
  } catch (err) {
    isRedisReady = false;
    console.warn('[RateLimiter] Redis client initialization failed; degrading gracefully (fail-open):', err);
    return null;
  }
}

/** Set or override the Redis client (useful for unit testing and injection). */
export function setRedisClient(client: RedisClientLike | null, ready = true) {
  defaultRedis = client;
  isRedisReady = ready;
}

/**
 * Validates rate limiter configuration options.
 */
function validateOptions(options: RateLimiterOptions): {
  capacity: number;
  refillRatePerSec: number;
  keyPrefix: string;
} {
  const capacity = options.capacity ?? 60;
  const refillRatePerSec = options.refillRatePerSec ?? 1;
  const keyPrefix = options.keyPrefix ?? 'ratelimit:tb:';

  if (!Number.isFinite(capacity) || capacity <= 0 || !Number.isInteger(capacity)) {
    throw new TypeError(`[RateLimiter] "capacity" must be a positive integer, received: ${capacity}`);
  }

  if (!Number.isFinite(refillRatePerSec) || refillRatePerSec <= 0) {
    throw new TypeError(`[RateLimiter] "refillRatePerSec" must be a positive number, received: ${refillRatePerSec}`);
  }

  return { capacity, refillRatePerSec, keyPrefix };
}

/**
 * Extracts and sanitizes the client IP address from the request.
 */
export function extractClientIp(req: any): string {
  if (!req) return '127.0.0.1';

  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return sanitizeIp(firstIp);
  }

  if (typeof req.ip === 'string' && req.ip.trim().length > 0) {
    return sanitizeIp(req.ip.trim());
  }

  return '127.0.0.1';
}

function sanitizeIp(ip: string): string {
  // Strip IPv6 prefix for localhost if present and keep safe alphanumeric characters
  return ip.replace(/^::ffff:/, '').replace(/[^a-zA-Z0-9:._-]/g, '');
}

/**
 * Express middleware factory for Redis token bucket rate limiting.
 */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  const { capacity, refillRatePerSec, keyPrefix } = validateOptions(options);
  const ttlSeconds = Math.max(Math.ceil(capacity / refillRatePerSec) * 2, 60);

  return async function rateLimiter(req: any, res: any, next: (err?: any) => void) {
    const client = getRedisClient();

    // Graceful degradation: fail-open if Redis is unreachable or uninitialized
    if (!client || !isRedisReady) {
      return next();
    }

    try {
      const clientIdentifier = options.keyGenerator
        ? options.keyGenerator(req)
        : extractClientIp(req);

      const bucketKey = `${keyPrefix}${clientIdentifier}`;
      const now = Date.now();

      // Execute atomic token bucket script in Redis
      const result = await client.eval(
        TOKEN_BUCKET_LUA,
        1,
        bucketKey,
        capacity,
        refillRatePerSec,
        now,
        1, // requested token count
        ttlSeconds
      );

      const [allowed, remainingTokens, retryAfter] = Array.isArray(result) ? result : [1, capacity, 0];

      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remainingTokens));

      if (Number(allowed) === 1) {
        return next();
      }

      // Rate limit exceeded: return HTTP 429
      const retrySec = Math.max(1, Number(retryAfter) || 1);
      res.setHeader('Retry-After', retrySec);

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfterSeconds: retrySec,
      });
    } catch (error) {
      // Fail-open: log error but do not block legitimate user traffic
      console.warn('[RateLimiter] Error evaluating rate limit in Redis; failing open:', error);
      return next();
    }
  };
}
