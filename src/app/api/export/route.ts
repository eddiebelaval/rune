/**
 * Export API route — Download a book's content in various formats.
 *
 * GET /api/export?book_id=...&format=full|manuscript|workspace|kb
 *
 * Formats:
 * - full:       Complete book backup (workspace + KB + entities + backlog) as JSON
 * - manuscript:  Assembled chapters as markdown (redirects to /api/manuscript)
 * - workspace:  All workspace files organized by room/category as JSON
 * - kb:         All knowledge base files as JSON
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getWorkspaceStructure } from '@/lib/workspace';
import { assembleManuscript } from '@/lib/manuscript';
import { getBacklogItems } from '@/lib/backlog';
import { KnowledgeBaseService } from '@/lib/database/knowledge-base';
import { isValidUUID } from '@/lib/validation';
import type { Book } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExportFormat = 'full' | 'manuscript' | 'workspace' | 'kb';

interface FullExport {
  version: '1.0';
  exported_at: string;
  book: Pick<Book, 'id' | 'title' | 'book_type' | 'quality_level' | 'status'> & {
    pipeline_stage?: string;
  };
  workspace: Awaited<ReturnType<typeof getWorkspaceStructure>>;
  manuscript: {
    chapters: { title: string; content: string; position: number }[];
    stats: { wordCount: number; chapterCount: number; estimatedPages: number };
  };
  knowledge_base: {
    files: {
      title: string;
      content: string;
      file_type: string;
      scope: string;
      folder_path: string;
      tags: string[];
    }[];
  };
  backlog: {
    items: {
      item_type: string;
      content: string;
      priority: number;
      status: string;
    }[];
  };
  entities: {
    id: string;
    entity_type: string;
    name: string;
    description: string;
  }[];
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
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

    const url = new URL(request.url);
    const bookId = url.searchParams.get('book_id');
    const format = (url.searchParams.get('format') ?? 'full') as ExportFormat;

    if (!bookId || !isValidUUID(bookId)) {
      return NextResponse.json({ error: 'Invalid or missing book_id' }, { status: 400 });
    }

    // Verify ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, book_type, quality_level, status, pipeline_stage')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    switch (format) {
      case 'manuscript':
        return exportManuscript(book);
      case 'workspace':
        return exportWorkspace(bookId);
      case 'kb':
        return exportKnowledgeBase(user.id, bookId);
      case 'full':
        return exportFull(supabase, user.id, book);
      default:
        return NextResponse.json(
          { error: `Unknown format: ${format}. Use: full, manuscript, workspace, kb` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[export] Export failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Export failed: ${message}` }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Format handlers
// ---------------------------------------------------------------------------

async function exportManuscript(
  book: { id: string; title: string },
): Promise<Response> {
  const manuscript = await assembleManuscript(book.id);

  const markdown = [
    `# ${book.title}`,
    '',
    ...manuscript.chapters.flatMap((ch) => [
      `## ${ch.title}`,
      '',
      ch.content,
      '',
    ]),
    '---',
    `${manuscript.stats.wordCount} words | ${manuscript.stats.chapterCount} chapters | ~${manuscript.stats.estimatedPages} pages`,
  ].join('\n');

  const filename = `${slugify(book.title)}-manuscript.md`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

async function exportWorkspace(bookId: string): Promise<NextResponse> {
  const structure = await getWorkspaceStructure(bookId);

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    workspace: structure,
  });
}

async function exportKnowledgeBase(
  userId: string,
  bookId: string,
): Promise<NextResponse> {
  const files = await KnowledgeBaseService.getFiles(userId, { book_id: bookId });

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    knowledge_base: {
      files: files.map((f) => ({
        title: f.title,
        content: f.content,
        file_type: f.file_type,
        scope: f.scope,
        folder_path: f.folder_path,
        tags: f.tags,
        source_type: f.source_type,
      })),
      count: files.length,
    },
  });
}

async function exportFull(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  book: { id: string; title: string; book_type: string; quality_level: string; status: string; pipeline_stage?: string },
): Promise<Response> {
  // Gather everything in parallel
  const [workspace, manuscript, kbFiles, backlogItems, entitiesResult] = await Promise.all([
    getWorkspaceStructure(book.id),
    assembleManuscript(book.id),
    KnowledgeBaseService.getFiles(userId, { book_id: book.id }),
    getBacklogItems(book.id),
    supabase
      .from('knowledge_entities')
      .select('id, entity_type, name, description')
      .eq('book_id', book.id),
  ]);

  const fullExport: FullExport = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    book: {
      id: book.id,
      title: book.title,
      book_type: book.book_type as FullExport['book']['book_type'],
      quality_level: book.quality_level as FullExport['book']['quality_level'],
      status: book.status as FullExport['book']['status'],
      pipeline_stage: book.pipeline_stage,
    },
    workspace,
    manuscript: {
      chapters: manuscript.chapters.map((ch) => ({
        title: ch.title,
        content: ch.content,
        position: ch.position,
      })),
      stats: manuscript.stats,
    },
    knowledge_base: {
      files: kbFiles.map((f) => ({
        title: f.title,
        content: f.content,
        file_type: f.file_type,
        scope: f.scope,
        folder_path: f.folder_path,
        tags: f.tags,
      })),
    },
    backlog: {
      items: backlogItems.map((item) => ({
        item_type: item.item_type,
        content: item.content,
        priority: item.priority,
        status: item.status,
      })),
    },
    entities: (entitiesResult.data ?? []) as FullExport['entities'],
  };

  const filename = `${slugify(book.title)}-full-export.json`;
  const json = JSON.stringify(fullExport, null, 2);

  return new Response(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}
