type RateLimitEntry = {
  count: number
  resetAt: number
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

class MemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()

  limit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const existing = this.store.get(key)

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + config.windowMs
      this.store.set(key, { count: 1, resetAt })
      this.prune(now)

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - 1),
        resetAt,
        retryAfterSeconds: Math.ceil(config.windowMs / 1000),
      }
    }

    existing.count += 1
    this.store.set(key, existing)

    const remaining = Math.max(0, config.maxRequests - existing.count)
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000)
    )

    return {
      allowed: existing.count <= config.maxRequests,
      limit: config.maxRequests,
      remaining,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    }
  }

  private prune(now: number) {
    if (this.store.size < 500) return

    for (const [key, value] of this.store.entries()) {
      if (value.resetAt <= now) {
        this.store.delete(key)
      }
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __runeRateLimiter: MemoryRateLimiter | undefined
}

function getLimiter(): MemoryRateLimiter {
  if (!globalThis.__runeRateLimiter) {
    globalThis.__runeRateLimiter = new MemoryRateLimiter()
  }

  return globalThis.__runeRateLimiter
}

export const RATE_LIMITS = {
  converse: { windowMs: 60_000, maxRequests: 20 },
  deepgramToken: { windowMs: 60_000, maxRequests: 10 },
  booksMutation: { windowMs: 5 * 60_000, maxRequests: 30 },
  sessionsCreate: { windowMs: 5 * 60_000, maxRequests: 20 },
  workspaceMutation: { windowMs: 5 * 60_000, maxRequests: 120 },
  profileMutation: { windowMs: 5 * 60_000, maxRequests: 20 },
  kbHistoryRestore: { windowMs: 5 * 60_000, maxRequests: 20 },
  knowledgeRead: { windowMs: 60_000, maxRequests: 60 },
  import: { windowMs: 5 * 60_000, maxRequests: 12 },
  export: { windowMs: 5 * 60_000, maxRequests: 20 },
  synthesize: { windowMs: 5 * 60_000, maxRequests: 15 },
  extract: { windowMs: 5 * 60_000, maxRequests: 25 },
  revise: { windowMs: 5 * 60_000, maxRequests: 20 },
} satisfies Record<string, RateLimitConfig>

export function buildRateLimitKey(
  request: Request,
  scope: string,
  userId?: string
): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown-ip'
  return [scope, userId ?? 'anonymous', ip].join(':')
}

export function enforceRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  return getLimiter().limit(key, config)
}
