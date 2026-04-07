import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeBaseService } from '@/lib/database/knowledge-base'
import { buildKnowledgeInsights } from '@/lib/knowledge-insights'
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
      buildRateLimitKey(request, 'knowledge-graph:get', user.id),
      RATE_LIMITS.knowledgeRead
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many graph refreshes. Please wait a moment before trying again.',
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

    const kbFiles = await KnowledgeBaseService.getFiles(user.id, { book_id: bookId })
    const insights = buildKnowledgeInsights(kbFiles)

    return NextResponse.json({
      entities: insights.entities,
      relationships: insights.relationships,
      unresolved: insights.unresolved,
    })
  } catch (error) {
    return jsonInternalError('knowledge-graph', error)
  }
}
