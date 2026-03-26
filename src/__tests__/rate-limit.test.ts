import { buildRateLimitKey, enforceRateLimit } from '@/lib/rate-limit';

describe('rate-limit', () => {
  it('allows requests inside the window then blocks overflow', () => {
    const key = 'test:user:ip';
    const config = { windowMs: 60_000, maxRequests: 2 };

    const first = enforceRateLimit(key, config);
    const second = enforceRateLimit(key, config);
    const third = enforceRateLimit(key, config);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('builds a stable composite key from scope, user, and ip', () => {
    const request = new Request('https://rune.id8labs.app/api/converse', {
      headers: {
        'x-forwarded-for': '203.0.113.5, 70.41.3.18',
      },
    });

    expect(buildRateLimitKey(request, 'converse', 'user-123')).toBe(
      'converse:user-123:203.0.113.5',
    );
  });
});
