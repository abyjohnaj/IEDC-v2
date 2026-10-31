/**
 * Sliding Window In-Memory Rate Limiter for Supabase Edge Functions
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter(ts => now - ts < 300000);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

export interface RateLimitOptions {
  limit: number;       // Maximum requests allowed in window
  windowSeconds: number; // Duration of window in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 15, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter(ts => ts > cutoff);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds)
    };
  }

  // Record this hit
  record.timestamps.push(now);

  const remaining = options.limit - record.timestamps.length;
  return {
    allowed: true,
    limit: options.limit,
    remaining,
    resetSeconds: options.windowSeconds
  };
}

export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Hash or slice bearer token for identified user rate limiting
    return `auth_${authHeader.slice(-16)}`;
  }

  return 'anonymous_client';
}

export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please retry after ${result.resetSeconds} seconds.`,
      retryAfter: result.resetSeconds
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(result.resetSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetSeconds)
      }
    }
  );
}
