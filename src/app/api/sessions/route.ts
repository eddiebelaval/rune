import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const bookId = request.nextUrl.searchParams.get('bookId')

    if (!bookId || !isValidUUID(bookId)) {
      return jsonBadRequest('bookId query parameter is required')
    }

    const ownedBook = await requireOwnedBook(supabase, user.id, bookId)
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('book_id', bookId)
      .order('session_number', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    return jsonInternalError('sessions:get', error)
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
      buildRateLimitKey(request, 'sessions:create', user.id),
      RATE_LIMITS.sessionsCreate
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many session starts. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<{ bookId?: string }>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { bookId } = parsed.data
    if (!bookId || !isValidUUID(bookId)) {
      return jsonBadRequest('bookId is required')
    }

    const ownedBook = await requireOwnedBook(supabase, user.id, bookId)
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const { data: lastSession, error: lastSessionError } = await supabase
      .from('sessions')
      .select('session_number')
      .eq('book_id', bookId)
      .order('session_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastSessionError) {
      throw new Error(lastSessionError.message)
    }

    const nextNumber =
      lastSession && typeof lastSession.session_number === 'number'
        ? lastSession.session_number + 1
        : 1

    const { data: session, error: insertError } = await supabase
      .from('sessions')
      .insert({
        book_id: bookId,
        session_number: nextNumber,
        mode: null,
        raw_transcript: null,
        summary: null,
        duration_seconds: null,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    return jsonInternalError('sessions:create', error)
  }
}
