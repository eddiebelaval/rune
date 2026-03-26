/**
 * Deepgram token exchange route.
 *
 * Secure key exchange so the browser can connect to Deepgram's WebSocket
 * for real-time speech-to-text without exposing the API key in client JS.
 *
 * GET /api/deepgram-token
 * Returns: { token: string }
 */

import { NextResponse } from 'next/server';
import {
  jsonInternalError,
  jsonTooManyRequests,
  requireAuthenticatedRouteContext,
} from '@/lib/api/route';
import {
  buildRateLimitKey,
  enforceRateLimit,
  RATE_LIMITS,
} from '@/lib/rate-limit';

export async function GET(
  request: Request,
): Promise<NextResponse<{ token: string } | { error: string }>> {
  try {
    const context = await requireAuthenticatedRouteContext();
    if (context instanceof NextResponse) {
      return context;
    }

    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'deepgram-token', context.user.id),
      RATE_LIMITS.deepgramToken,
    );

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many Deepgram token requests',
      });
    }

    const token = process.env.DEEPGRAM_API_KEY;
    if (!token) {
      return NextResponse.json(
        { error: 'Deepgram is not configured' },
        { status: 500 },
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    return jsonInternalError('deepgram-token', error);
  }
}
