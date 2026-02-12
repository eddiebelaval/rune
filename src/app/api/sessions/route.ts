import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/sessions?bookId=<uuid> — List sessions for a book.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookId = request.nextUrl.searchParams.get('bookId');
  if (!bookId) {
    return NextResponse.json({ error: 'bookId query parameter is required' }, { status: 400 });
  }

  // Verify the user owns this book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('book_id', bookId)
    .order('session_number', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/sessions — Create a new session for a book.
 * Auto-increments session_number.
 *
 * Body: { bookId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { bookId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { bookId } = body;

  if (!bookId || typeof bookId !== 'string') {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  // Verify the user owns this book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // Determine the next session number
  const { data: lastSession } = await supabase
    .from('sessions')
    .select('session_number')
    .eq('book_id', bookId)
    .order('session_number', { ascending: false })
    .limit(1)
    .single();

  const nextNumber = lastSession ? (lastSession.session_number as number) + 1 : 1;

  const { data: session, error: insertError } = await supabase
    .from('sessions')
    .insert({
      book_id: bookId,
      session_number: nextNumber,
      mode: null,
      raw_transcript: null,
      summary: null,
      duration_seconds: null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(session, { status: 201 });
}
