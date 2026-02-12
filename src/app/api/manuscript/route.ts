import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { assembleManuscript } from '@/lib/manuscript';

/**
 * GET /api/manuscript?bookId=<uuid>          -- returns assembled manuscript + stats (JSON)
 * GET /api/manuscript?bookId=<uuid>&format=markdown -- returns as downloadable .md file
 *
 * Auth required. Verifies the authenticated user owns the book.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookId = request.nextUrl.searchParams.get('bookId');
  if (!bookId) {
    return NextResponse.json(
      { error: 'bookId query parameter is required' },
      { status: 400 },
    );
  }

  // Verify the user owns this book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, title')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  try {
    const manuscript = await assembleManuscript(bookId);
    const format = request.nextUrl.searchParams.get('format');

    if (format === 'markdown') {
      // Build a markdown document with chapter headings
      const markdownParts: string[] = [];
      markdownParts.push(`# ${(book as { title: string }).title}\n`);

      for (const chapter of manuscript.chapters) {
        markdownParts.push(`## ${chapter.title}\n`);
        if (chapter.content.length > 0) {
          markdownParts.push(chapter.content);
        }
        markdownParts.push(''); // blank line between chapters
      }

      const markdownText = markdownParts.join('\n');

      // Sanitize filename: lowercase, replace spaces/special chars
      const safeTitle = (book as { title: string }).title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      return new NextResponse(markdownText, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeTitle}-manuscript.md"`,
        },
      });
    }

    // Default: return JSON
    return NextResponse.json({
      bookId: manuscript.bookId,
      chapters: manuscript.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        content: ch.content,
        position: ch.position,
      })),
      stats: manuscript.stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to assemble manuscript';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
