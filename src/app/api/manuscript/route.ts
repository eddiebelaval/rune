import { NextRequest, NextResponse } from 'next/server';
import { assembleManuscript } from '@/lib/manuscript';
import {
  jsonBadRequest,
  jsonInternalError,
  jsonNotFound,
  requireAuthenticatedRouteContext,
} from '@/lib/api/route';

/**
 * GET /api/manuscript?bookId=<uuid>          -- returns assembled manuscript + stats (JSON)
 * GET /api/manuscript?bookId=<uuid>&format=markdown -- returns as downloadable .md file
 *
 * Auth required. Verifies the authenticated user owns the book.
 */
export async function GET(request: NextRequest) {
  const context = await requireAuthenticatedRouteContext();
  if (context instanceof NextResponse) {
    return context;
  }

  const { supabase, user } = context;
  const bookId = request.nextUrl.searchParams.get('bookId');
  if (!bookId) {
    return jsonBadRequest('bookId query parameter is required');
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, title')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (bookError || !book) {
    return jsonNotFound('Book not found');
  }

  try {
    const manuscript = await assembleManuscript(bookId);
    const format = request.nextUrl.searchParams.get('format');

    if (format === 'markdown') {
      const markdownParts: string[] = [];
      markdownParts.push(`# ${(book as { title: string }).title}\n`);

      for (const chapter of manuscript.chapters) {
        markdownParts.push(`## ${chapter.title}\n`);
        if (chapter.content.length > 0) {
          markdownParts.push(chapter.content);
        }
        markdownParts.push('');
      }

      const markdownText = markdownParts.join('\n');
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
  } catch (error) {
    return jsonInternalError('manuscript', error);
  }
}
