import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * POST /auth/sign-out — Sign the user out and redirect to landing.
 */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/`);
}
