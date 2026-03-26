import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // OTP is the primary auth path, but keeping this callback route lets any
  // callback-style fallback complete safely without leaving users stranded.
  return NextResponse.redirect(`${origin}/auth?auth=error`);
}
