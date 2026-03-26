import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'
import { safeErrorResponse } from '@/lib/validation'

export type RouteSupabaseClient = Awaited<ReturnType<typeof createServerClient>>

export interface AuthenticatedRouteContext {
  supabase: RouteSupabaseClient
  user: User
}

export type RouteRecord = Record<string, unknown>

export interface ParsedJsonSuccess<T> {
  ok: true
  data: T
}

export interface ParsedJsonFailure {
  ok: false
  response: NextResponse
}

export function jsonBadRequest(error: string): NextResponse<{ error: string }> {
  return NextResponse.json({ error }, { status: 400 })
}

export function jsonUnauthorized(
  error = 'Unauthorized'
): NextResponse<{ error: string }> {
  return NextResponse.json({ error }, { status: 401 })
}

export function jsonForbidden(
  error = 'Forbidden'
): NextResponse<{ error: string }> {
  return NextResponse.json({ error }, { status: 403 })
}

export function jsonNotFound(
  error = 'Not found'
): NextResponse<{ error: string }> {
  return NextResponse.json({ error }, { status: 404 })
}

export function jsonTooManyRequests(params: {
  error?: string
  retryAfterSeconds: number
  limit: number
  remaining: number
  resetAt: number
}): NextResponse<{ error: string }> {
  const { error = 'Too many requests', retryAfterSeconds, limit, remaining, resetAt } = params

  return NextResponse.json(
    { error },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(Math.max(0, remaining)),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  )
}

export function jsonInternalError(
  context: string,
  error: unknown
): NextResponse<{ error: string }> {
  return NextResponse.json(
    { error: safeErrorResponse(context, error) },
    { status: 500 }
  )
}

export async function requireAuthenticatedRouteContext(): Promise<
  AuthenticatedRouteContext | NextResponse<{ error: string }>
> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return jsonUnauthorized()
  }

  return { supabase, user }
}

export async function requireOwnedBook(
  supabase: RouteSupabaseClient,
  userId: string,
  bookId: string,
  columns = 'id'
): Promise<RouteRecord | NextResponse<{ error: string }>> {
  const { data, error } = await supabase
    .from('books')
    .select(columns)
    .eq('id', bookId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return jsonNotFound('Book not found')
  }

  return data as unknown as RouteRecord
}

export async function requireOwnedWorkspaceFile(
  supabase: RouteSupabaseClient,
  userId: string,
  fileId: string,
  columns = 'id, book_id'
): Promise<RouteRecord | NextResponse<{ error: string }>> {
  const selectColumns =
    columns === '*' || columns.includes('book_id')
      ? columns
      : `book_id, ${columns}`

  const { data, error } = await supabase
    .from('workspace_files')
    .select(selectColumns)
    .eq('id', fileId)
    .single()

  if (error || !data) {
    return jsonNotFound('File not found')
  }

  const file = data as unknown as RouteRecord
  const bookId = file.book_id
  if (typeof bookId !== 'string') {
    return jsonNotFound('File not found')
  }

  const ownedBook = await requireOwnedBook(supabase, userId, bookId)
  if (ownedBook instanceof NextResponse) {
    return jsonForbidden('Not authorized')
  }

  return file
}

export async function parseJsonBody<T>(
  request: Request
): Promise<ParsedJsonSuccess<T> | ParsedJsonFailure> {
  try {
    const body = (await request.json()) as T
    return { ok: true, data: body }
  } catch {
    return {
      ok: false,
      response: jsonBadRequest('Invalid JSON body'),
    }
  }
}
