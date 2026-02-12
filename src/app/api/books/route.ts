import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { initializeWorkspace } from '@/lib/workspace';
import type { BookType, QualityLevel } from '@/types/database';

const VALID_BOOK_TYPES: BookType[] = ['memoir', 'fiction', 'nonfiction'];
const VALID_QUALITY_LEVELS: QualityLevel[] = ['economy', 'standard', 'premium'];

/**
 * GET /api/books — List the authenticated user's books.
 */
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/books — Create a new book and auto-initialize its workspace.
 *
 * Body: { title: string, bookType: BookType, qualityLevel: QualityLevel }
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { title?: string; bookType?: string; qualityLevel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, bookType, qualityLevel } = body;

  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  if (!bookType || !VALID_BOOK_TYPES.includes(bookType as BookType)) {
    return NextResponse.json(
      { error: `bookType must be one of: ${VALID_BOOK_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  if (!qualityLevel || !VALID_QUALITY_LEVELS.includes(qualityLevel as QualityLevel)) {
    return NextResponse.json(
      { error: `qualityLevel must be one of: ${VALID_QUALITY_LEVELS.join(', ')}` },
      { status: 400 },
    );
  }

  // Create the book
  const { data: book, error: insertError } = await supabase
    .from('books')
    .insert({
      user_id: user.id,
      title: title.trim(),
      book_type: bookType as BookType,
      quality_level: qualityLevel as QualityLevel,
      status: 'active',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Initialize workspace folder structure for this book type
  try {
    await initializeWorkspace(book.id, bookType as BookType);
  } catch (wsError) {
    // Workspace init failure is non-fatal — the book is still created
    console.error('Workspace initialization failed:', wsError);
  }

  return NextResponse.json(book, { status: 201 });
}
