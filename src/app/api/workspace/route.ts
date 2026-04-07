import { NextRequest, NextResponse } from 'next/server'
import {
  createWorkspaceFile,
  deleteWorkspaceFile,
  getWorkspaceFiles,
  updateWorkspaceFile,
} from '@/lib/workspace'
import {
  jsonBadRequest,
  jsonInternalError,
  jsonTooManyRequests,
  parseJsonBody,
  requireAuthenticatedRouteContext,
  requireOwnedBook,
  requireOwnedWorkspaceFile,
} from '@/lib/api/route'
import {
  buildRateLimitKey,
  enforceRateLimit,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import { isValidUUID } from '@/lib/validation'
import type { Room } from '@/types/database'

const VALID_ROOMS: Room[] = ['brainstorm', 'drafts', 'publish']

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const bookId = request.nextUrl.searchParams.get('book_id')
    const room = request.nextUrl.searchParams.get('room')
    const category = request.nextUrl.searchParams.get('category') ?? undefined

    if (!bookId || !isValidUUID(bookId)) {
      return jsonBadRequest('book_id is required')
    }

    if (room && !VALID_ROOMS.includes(room as Room)) {
      return jsonBadRequest(`room must be one of: ${VALID_ROOMS.join(', ')}`)
    }

    const ownedBook = await requireOwnedBook(supabase, user.id, bookId)
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const files = await getWorkspaceFiles(bookId, room as Room | undefined, category)
    return NextResponse.json(files)
  } catch (error) {
    return jsonInternalError('workspace:get', error)
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
      buildRateLimitKey(request, 'workspace:create', user.id),
      RATE_LIMITS.workspaceMutation
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many workspace changes. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<{
      book_id?: string
      room?: string
      category?: string
      title?: string
      content?: string
      source_session_id?: string | null
    }>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { book_id, room, category, title, content, source_session_id } = parsed.data

    if (!book_id || !isValidUUID(book_id)) {
      return jsonBadRequest('book_id is required')
    }
    if (!room || !VALID_ROOMS.includes(room as Room)) {
      return jsonBadRequest(`room must be one of: ${VALID_ROOMS.join(', ')}`)
    }
    if (!category || typeof category !== 'string') {
      return jsonBadRequest('category is required')
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return jsonBadRequest('title is required')
    }
    if (
      source_session_id !== undefined &&
      source_session_id !== null &&
      !isValidUUID(source_session_id)
    ) {
      return jsonBadRequest('source_session_id must be a valid UUID when provided')
    }

    const ownedBook = await requireOwnedBook(supabase, user.id, book_id)
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const file = await createWorkspaceFile(
      book_id,
      room as Room,
      category,
      title.trim(),
      content,
      source_session_id
    )

    return NextResponse.json(file, { status: 201 })
  } catch (error) {
    return jsonInternalError('workspace:create', error)
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
      buildRateLimitKey(request, 'workspace:update', user.id),
      RATE_LIMITS.workspaceMutation
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many workspace changes. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<{
      id?: string
      title?: string
      content?: string
      room?: string
      category?: string
      source_session_id?: string | null
    }>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { id, room, source_session_id, ...rest } = parsed.data
    if (!id || !isValidUUID(id)) {
      return jsonBadRequest('id is required')
    }
    if (room !== undefined && !VALID_ROOMS.includes(room as Room)) {
      return jsonBadRequest(`room must be one of: ${VALID_ROOMS.join(', ')}`)
    }
    if (
      source_session_id !== undefined &&
      source_session_id !== null &&
      !isValidUUID(source_session_id)
    ) {
      return jsonBadRequest('source_session_id must be a valid UUID when provided')
    }

    const file = await requireOwnedWorkspaceFile(supabase, user.id, id)
    if (file instanceof NextResponse) {
      return file
    }

    const updates: Record<string, string | null> = {}
    if (rest.title !== undefined) updates.title = rest.title
    if (rest.content !== undefined) updates.content = rest.content
    if (room !== undefined) updates.room = room
    if (rest.category !== undefined) updates.category = rest.category
    if (source_session_id !== undefined) {
      updates.source_session_id = source_session_id
    }

    if (Object.keys(updates).length === 0) {
      return jsonBadRequest('No fields to update')
    }

    const updated = await updateWorkspaceFile(id, updates)
    return NextResponse.json(updated)
  } catch (error) {
    return jsonInternalError('workspace:update', error)
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
      buildRateLimitKey(request, 'workspace:delete', user.id),
      RATE_LIMITS.workspaceMutation
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many workspace changes. Please wait a moment before trying again.',
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

    const file = await requireOwnedWorkspaceFile(supabase, user.id, id)
    if (file instanceof NextResponse) {
      return file
    }

    await deleteWorkspaceFile(id)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return jsonInternalError('workspace:delete', error)
  }
}
