import { NextRequest, NextResponse } from 'next/server'
import { getBacklogItems } from '@/lib/backlog'
import { KnowledgeBaseService } from '@/lib/database/knowledge-base'
import { buildKnowledgeInsights } from '@/lib/knowledge-insights'
import { assembleManuscript } from '@/lib/manuscript'
import { getWorkspaceStructure } from '@/lib/workspace'
import {
  jsonBadRequest,
  jsonInternalError,
  jsonTooManyRequests,
  requireAuthenticatedRouteContext,
  requireOwnedBook,
  type RouteSupabaseClient,
} from '@/lib/api/route'
import {
  buildRateLimitKey,
  enforceRateLimit,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import { isValidUUID } from '@/lib/validation'
import type { Book } from '@/types/database'

type ExportFormat = 'full' | 'manuscript' | 'workspace' | 'kb'

interface FullExport {
  version: '1.1'
  exported_at: string
  book: Pick<Book, 'id' | 'title' | 'book_type' | 'quality_level' | 'status'> & {
    pipeline_stage?: string
  }
  workspace: Awaited<ReturnType<typeof getWorkspaceStructure>>
  manuscript: {
    chapters: { title: string; content: string; position: number }[]
    stats: { wordCount: number; chapterCount: number; estimatedPages: number }
  }
  knowledge_base: {
    files: {
      title: string
      content: string
      file_type: string
      scope: string
      folder_path: string
      tags: string[]
      source_type: string
      current_semantic_version: string
      metadata: Record<string, unknown>
      updated_at: string
    }[]
  }
  backlog: {
    items: {
      item_type: string
      content: string
      priority: number
      status: string
      source_session_id: string | null
    }[]
  }
  entities: ReturnType<typeof buildKnowledgeInsights>['entities']
  relationships: ReturnType<typeof buildKnowledgeInsights>['relationships']
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'export:get', user.id),
      RATE_LIMITS.export
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many exports. Please wait a moment before trying again.',
      })
    }

    const bookId = request.nextUrl.searchParams.get('book_id')
    const format = (request.nextUrl.searchParams.get('format') ?? 'full') as ExportFormat

    if (!bookId || !isValidUUID(bookId)) {
      return jsonBadRequest('Invalid or missing book_id')
    }

    const ownedBook = await requireOwnedBook(
      supabase,
      user.id,
      bookId,
      'id, title, book_type, quality_level, status, pipeline_stage'
    )

    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const book = ownedBook as {
      id: string
      title: string
      book_type: string
      quality_level: string
      status: string
      pipeline_stage?: string
    }

    switch (format) {
      case 'manuscript':
        return exportManuscript(book)
      case 'workspace':
        return exportWorkspace(bookId)
      case 'kb':
        return exportKnowledgeBase(user.id, bookId)
      case 'full':
        return exportFull(supabase, user.id, book)
      default:
        return jsonBadRequest(
          `Unknown format: ${format}. Use: full, manuscript, workspace, kb`
        )
    }
  } catch (error) {
    return jsonInternalError('export', error)
  }
}

async function exportManuscript(book: { id: string; title: string }): Promise<Response> {
  const manuscript = await assembleManuscript(book.id)

  const markdown = [
    `# ${book.title}`,
    '',
    ...manuscript.chapters.flatMap((chapter) => [
      `## ${chapter.title}`,
      '',
      chapter.content,
      '',
    ]),
    '---',
    `${manuscript.stats.wordCount} words | ${manuscript.stats.chapterCount} chapters | ~${manuscript.stats.estimatedPages} pages`,
  ].join('\n')

  const filename = `${slugify(book.title)}-manuscript.md`

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

async function exportWorkspace(bookId: string): Promise<NextResponse> {
  const structure = await getWorkspaceStructure(bookId)

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    workspace: structure,
  })
}

async function exportKnowledgeBase(
  userId: string,
  bookId: string
): Promise<NextResponse> {
  const files = await KnowledgeBaseService.getFiles(userId, { book_id: bookId })

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    knowledge_base: {
      files: files.map((file) => ({
        title: file.title,
        content: file.content,
        file_type: file.file_type,
        scope: file.scope,
        folder_path: file.folder_path,
        tags: file.tags,
        source_type: file.source_type,
        current_semantic_version: file.current_semantic_version,
        metadata: file.metadata,
        updated_at: file.updated_at,
      })),
      count: files.length,
    },
  })
}

async function exportFull(
  supabase: RouteSupabaseClient,
  userId: string,
  book: {
    id: string
    title: string
    book_type: string
    quality_level: string
    status: string
    pipeline_stage?: string
  }
): Promise<Response> {
  const [workspace, manuscript, kbFiles, backlogItems] = await Promise.all([
    getWorkspaceStructure(book.id),
    assembleManuscript(book.id),
    KnowledgeBaseService.getFiles(userId, { book_id: book.id }),
    getBacklogItems(book.id),
  ])

  const insights = buildKnowledgeInsights(kbFiles)

  const fullExport: FullExport = {
    version: '1.1',
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
      chapters: manuscript.chapters.map((chapter) => ({
        title: chapter.title,
        content: chapter.content,
        position: chapter.position,
      })),
      stats: manuscript.stats,
    },
    knowledge_base: {
      files: kbFiles.map((file) => ({
        title: file.title,
        content: file.content,
        file_type: file.file_type,
        scope: file.scope,
        folder_path: file.folder_path,
        tags: file.tags,
        source_type: file.source_type,
        current_semantic_version: file.current_semantic_version,
        metadata: file.metadata,
        updated_at: file.updated_at,
      })),
    },
    backlog: {
      items: backlogItems.map((item) => ({
        item_type: item.item_type,
        content: item.content,
        priority: item.priority,
        status: item.status,
        source_session_id: item.source_session_id,
      })),
    },
    entities: insights.entities,
    relationships: insights.relationships,
  }

  const filename = `${slugify(book.title)}-full-export.json`
  const json = JSON.stringify(fullExport, null, 2)

  return new Response(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}
