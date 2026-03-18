/**
 * Import API route — Upload existing writing into a Rune book.
 *
 * Accepts file upload (multipart/form-data) or raw text (JSON body).
 * Parses the content, classifies sections with Claude, and routes each
 * section to the correct workspace room/category.
 *
 * POST /api/import
 *
 * Multipart: file (File) + book_id (string) + quality? (string)
 * JSON:      { text: string, book_id: string, title?: string, quality?: string }
 *
 * Returns: RouteResult with details of every created file
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseUpload, parseText } from '@/lib/import/parser';
import { routeImport } from '@/lib/import/router';
import { isValidUUID, isValidText } from '@/lib/validation';
import type { BookType, QualityLevel } from '@/types/database';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_EXTENSIONS = new Set(['txt', 'md', 'markdown', 'docx']);
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Authenticate
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') ?? '';

    // Determine if this is a file upload or text paste
    if (contentType.includes('multipart/form-data')) {
      return handleFileUpload(request, supabase, user.id);
    } else if (contentType.includes('application/json')) {
      return handleTextPaste(request, supabase, user.id);
    } else {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data or application/json' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('[import] Import failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Import failed: ${message}` }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// File upload handler
// ---------------------------------------------------------------------------

async function handleFileUpload(
  request: Request,
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const bookId = formData.get('book_id') as string | null;
  const quality = (formData.get('quality') as QualityLevel) ?? 'standard';

  if (!file) {
    return NextResponse.json({ error: 'Missing file in upload' }, { status: 400 });
  }
  if (!bookId || !isValidUUID(bookId)) {
    return NextResponse.json({ error: 'Invalid or missing book_id' }, { status: 400 });
  }

  // Validate file
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type: .${ext}. Supported: .txt, .md, .docx` },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB` },
      { status: 400 },
    );
  }

  // Verify book ownership and get book type
  const book = await verifyBookOwnership(supabase, bookId, userId);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // Parse and route
  const doc = await parseUpload(file);
  const result = await routeImport(doc, bookId, book.book_type, userId, quality);

  return NextResponse.json({
    success: true,
    import: {
      filename: doc.metadata.filename,
      format: doc.format,
      ...result,
    },
  });
}

// ---------------------------------------------------------------------------
// Text paste handler
// ---------------------------------------------------------------------------

async function handleTextPaste(
  request: Request,
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
): Promise<NextResponse> {
  let body: { text?: string; book_id?: string; title?: string; quality?: QualityLevel };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, book_id: bookId, title, quality = 'standard' } = body;

  if (!isValidText(text)) {
    return NextResponse.json({ error: 'Text must be 1-100,000 characters' }, { status: 400 });
  }
  if (!bookId || !isValidUUID(bookId)) {
    return NextResponse.json({ error: 'Invalid or missing book_id' }, { status: 400 });
  }

  // Verify book ownership
  const book = await verifyBookOwnership(supabase, bookId, userId);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // Parse and route
  const doc = parseText(text, title ?? 'Pasted Content');
  const result = await routeImport(doc, bookId, book.book_type, userId, quality);

  return NextResponse.json({
    success: true,
    import: {
      filename: doc.metadata.filename,
      format: doc.format,
      ...result,
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function verifyBookOwnership(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  bookId: string,
  userId: string,
): Promise<{ book_type: BookType } | null> {
  const { data, error } = await supabase
    .from('books')
    .select('book_type')
    .eq('id', bookId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as { book_type: BookType };
}
