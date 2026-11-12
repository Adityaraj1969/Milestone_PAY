/**
 * Unit tests for Redis token-bucket rate limiter middleware.
 * Verifies atomic operation, input validation, HTTP 429 response,
 * and fail-open graceful degradation.
 */

import {
  createRateLimiter,
  setRedisClient,
  extractClientIp,
  TOKEN_BUCKET_LUA,
  type RedisClientLike,
} from './rateLimiter';

describe('createRateLimiter Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let nextCalled: boolean;

  beforeEach(() => {
    mockReq = {
      ip: '192.168.1.1',
      headers: {},
    };
    mockRes = {
      statusCode: 200,
      headers: {} as Record<string, any>,
      body: null as any,
      setHeader(name: string, value: any) {
        this.headers[name] = value;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: any) {
        this.body = payload;
        return this;
      },
    };
    nextCalled = false;
  });

  afterEach(() => {
    setRedisClient(null, false);
  });

  test('validates configuration options and throws TypeError on invalid capacity', () => {
    expect(() => createRateLimiter({ capacity: -5 })).toThrow(TypeError);
    expect(() => createRateLimiter({ capacity: 0 })).toThrow(TypeError);
    expect(() => createRateLimiter({ capacity: 1.5 })).toThrow(TypeError);
    expect(() => createRateLimiter({ refillRatePerSec: -1 })).toThrow(TypeError);
  });

  test('allows requests within rate limit and sets X-RateLimit headers', async () => {
    const mockRedis: RedisClientLike = {
      eval: jest.fn().mockResolvedValue([1, 59, 0]), // allowed = 1, remaining = 59, retryAfter = 0
    };
    setRedisClient(mockRedis, true);

    const limiter = createRateLimiter({ capacity: 60, refillRatePerSec: 1 });
    await limiter(mockReq, mockRes, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.headers['X-RateLimit-Limit']).toBe(60);
    expect(mockRes.headers['X-RateLimit-Remaining']).toBe(59);
    expect(mockRedis.eval).toHaveBeenCalledWith(
      TOKEN_BUCKET_LUA,
      1,
      'ratelimit:tb:192.168.1.1',
      60,
      1,
      expect.any(Number),
      1,
      120
    );
  });

  test('returns HTTP 429 and Retry-After header when rate limit is exceeded', async () => {
    const mockRedis: RedisClientLike = {
      eval: jest.fn().mockResolvedValue([0, 0, 5]), // allowed = 0, remaining = 0, retryAfter = 5s
    };
    setRedisClient(mockRedis, true);

    const limiter = createRateLimiter({ capacity: 60, refillRatePerSec: 1 });
    await limiter(mockReq, mockRes, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(mockRes.statusCode).toBe(429);
    expect(mockRes.headers['Retry-After']).toBe(5);
    expect(mockRes.headers['X-RateLimit-Remaining']).toBe(0);
    expect(mockRes.body).toEqual({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfterSeconds: 5,
    });
  });

  test('fails open and calls next() if Redis client is disconnected (graceful degradation)', async () => {
    // Redis is null / not ready
    setRedisClient(null, false);

    const limiter = createRateLimiter({ capacity: 10 });
    await limiter(mockReq, mockRes, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(mockRes.statusCode).toBe(200);
  });

  test('fails open if Redis evaluation throws a network timeout or error', async () => {
    const mockRedis: RedisClientLike = {
      eval: jest.fn().mockRejectedValue(new Error('Connection reset by peer')),
    };
    setRedisClient(mockRedis, true);

    const limiter = createRateLimiter({ capacity: 10 });
    await limiter(mockReq, mockRes, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(mockRes.statusCode).toBe(200);
  });

  test('extracts client IP from x-forwarded-for header and sanitizes input', () => {
    const reqWithForwarded = {
      headers: {
        'x-forwarded-for': '203.0.113.195, 70.41.3.18',
      },
    };
    expect(extractClientIp(reqWithForwarded)).toBe('203.0.113.195');

    const reqWithIPv6 = {
      ip: '::ffff:192.168.1.1',
      headers: {},
    };
    expect(extractClientIp(reqWithIPv6)).toBe('192.168.1.1');
  });
});
