import { NextRequest, NextResponse } from 'next/server'
import { getBacklogItems } from '@/lib/backlog'
import { KnowledgeBaseService } from '@/lib/database/knowledge-base'
import { buildKnowledgeInsights } from '@/lib/knowledge-insights'
import { assembleManuscript } from '@/lib/manuscript'
import {
  jsonBadRequest,
  jsonInternalError,
  jsonTooManyRequests,
  requireAuthenticatedRouteContext,
  requireOwnedBook,
} from '@/lib/api/route'
import {
  buildRateLimitKey,
  enforceRateLimit,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import { isValidUUID } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'book-progress:get', user.id),
      RATE_LIMITS.knowledgeRead
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many progress refreshes. Please wait a moment before trying again.',
      })
    }

    const bookId = request.nextUrl.searchParams.get('bookId')
    if (!bookId || !isValidUUID(bookId)) {
      return jsonBadRequest('bookId query parameter is required')
    }

    const ownedBook = await requireOwnedBook(supabase, user.id, bookId)
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const [sessionsResult, manuscriptResult, backlogItems, kbFiles] = await Promise.all([
      supabase
        .from('sessions')
        .select('*')
        .eq('book_id', bookId)
        .order('session_number', { ascending: true }),
      assembleManuscript(bookId)
        .then((manuscript) => manuscript.stats)
        .catch((error) => {
          console.error('[book-progress] Failed to assemble manuscript stats:', error)
          return null
        }),
      getBacklogItems(bookId, 'open'),
      KnowledgeBaseService.getFiles(user.id, { book_id: bookId }),
    ])

    if (sessionsResult.error) {
      throw new Error(sessionsResult.error.message)
    }

    const insights = buildKnowledgeInsights(kbFiles)
    const confidences = insights.entities
      .map((entity) => entity.confidence)
      .filter((confidence): confidence is number => typeof confidence === 'number')

    return NextResponse.json({
      sessions: sessionsResult.data ?? [],
      manuscriptStats: manuscriptResult,
      backlogItems,
      entityCounts: insights.countsByType,
      unresolvedCount: insights.unresolved.length,
      averageConfidence:
        confidences.length > 0
          ? confidences.reduce((sum, confidence) => sum + confidence, 0) / confidences.length
          : null,
    })
  } catch (error) {
    return jsonInternalError('book-progress', error)
  }
}
