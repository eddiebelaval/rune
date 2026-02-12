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
import { createServerClient } from '@/lib/supabase';

export async function GET(): Promise<NextResponse<{ token: string } | { error: string }>> {
  // Authenticate
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.DEEPGRAM_API_KEY;
  if (!token) {
    console.error('[deepgram-token] DEEPGRAM_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Deepgram is not configured' },
      { status: 500 },
    );
  }

  return NextResponse.json({ token });
}
