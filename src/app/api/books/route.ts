import { NextRequest, NextResponse } from 'next/server'
import { initializeWorkspace } from '@/lib/workspace'
import {
  jsonBadRequest,
  jsonInternalError,
  jsonTooManyRequests,
  parseJsonBody,
  requireAuthenticatedRouteContext,
  requireOwnedBook,
} from '@/lib/api/route'
import {
  buildRateLimitKey,
  enforceRateLimit,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import { isValidUUID } from '@/lib/validation'
import type { BookStatus, BookType, QualityLevel } from '@/types/database'

const VALID_BOOK_TYPES: BookType[] = ['memoir', 'fiction', 'nonfiction']
const VALID_QUALITY_LEVELS: QualityLevel[] = ['economy', 'standard', 'premium']
const VALID_STATUSES: BookStatus[] = ['active', 'paused', 'completed']

export async function GET() {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    return jsonInternalError('books:get', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'books:create', user.id),
      RATE_LIMITS.booksMutation
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many book changes. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<{
      title?: string
      bookType?: string
      qualityLevel?: string
    }>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { title, bookType, qualityLevel } = parsed.data

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return jsonBadRequest('title is required')
    }

    if (!bookType || !VALID_BOOK_TYPES.includes(bookType as BookType)) {
      return jsonBadRequest(
        `bookType must be one of: ${VALID_BOOK_TYPES.join(', ')}`
      )
    }

    if (
      !qualityLevel ||
      !VALID_QUALITY_LEVELS.includes(qualityLevel as QualityLevel)
    ) {
      return jsonBadRequest(
        `qualityLevel must be one of: ${VALID_QUALITY_LEVELS.join(', ')}`
      )
    }

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
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    try {
      await initializeWorkspace(book.id, bookType as BookType)
    } catch (workspaceError) {
      console.error('[books:create] Workspace initialization failed:', workspaceError)
    }

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    return jsonInternalError('books:create', error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'books:update', user.id),
      RATE_LIMITS.booksMutation
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many book changes. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<{
      id?: string
      title?: string
      status?: string
      quality_level?: string
    }>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const body = parsed.data
    if (!body.id || !isValidUUID(body.id)) {
      return jsonBadRequest('id is required')
    }

    const ownedBook = await requireOwnedBook(supabase, user.id, body.id)
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const updates: Record<string, string> = {}

    if (body.title && typeof body.title === 'string' && body.title.trim().length > 0) {
      updates.title = body.title.trim()
    }

    if (body.status) {
      if (!VALID_STATUSES.includes(body.status as BookStatus)) {
        return jsonBadRequest(
          `status must be one of: ${VALID_STATUSES.join(', ')}`
        )
      }
      updates.status = body.status
    }

    if (body.quality_level) {
      if (!VALID_QUALITY_LEVELS.includes(body.quality_level as QualityLevel)) {
        return jsonBadRequest(
          `quality_level must be one of: ${VALID_QUALITY_LEVELS.join(', ')}`
        )
      }
      updates.quality_level = body.quality_level
    }

    if (Object.keys(updates).length === 0) {
      return jsonBadRequest('No valid fields to update')
    }

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(data)
  } catch (error) {
    return jsonInternalError('books:update', error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'books:delete', user.id),
      RATE_LIMITS.booksMutation
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many book changes. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<{ id?: string }>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { id } = parsed.data
    if (!id || !isValidUUID(id)) {
      return jsonBadRequest('id is required')
    }

    const ownedBook = await requireOwnedBook(supabase, user.id, id)
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    return jsonInternalError('books:delete', error)
  }
}
