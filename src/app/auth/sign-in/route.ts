import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * POST /auth/sign-in — Initiate Google OAuth via Supabase.
 * Redirects the browser to the Google consent screen.
 */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  return NextResponse.redirect(data.url);
}
