import { NextRequest, NextResponse } from 'next/server'
import { parseUpload, parseText } from '@/lib/import/parser'
import { routeImport } from '@/lib/import/router'
import {
  jsonBadRequest,
  jsonInternalError,
  jsonNotFound,
  jsonTooManyRequests,
  requireAuthenticatedRouteContext,
  type RouteSupabaseClient,
} from '@/lib/api/route'
import {
  buildRateLimitKey,
  enforceRateLimit,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import { isValidText, isValidUUID } from '@/lib/validation'
import type { BookType, QualityLevel } from '@/types/database'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['txt', 'md', 'markdown', 'docx'])
const VALID_QUALITY_LEVELS: QualityLevel[] = ['economy', 'standard', 'premium']

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'import:create', user.id),
      RATE_LIMITS.import
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many imports. Please wait a moment before trying again.',
      })
    }

    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      return handleFileUpload(request, supabase, user.id)
    }

    if (contentType.includes('application/json')) {
      return handleTextPaste(request, supabase, user.id)
    }

    return jsonBadRequest(
      'Content-Type must be multipart/form-data or application/json'
    )
  } catch (error) {
    return jsonInternalError('import', error)
  }
}

async function handleFileUpload(
  request: NextRequest,
  supabase: RouteSupabaseClient,
  userId: string
): Promise<NextResponse> {
  const formData = await request.formData()
  const file = formData.get('file')
  const bookId = formData.get('book_id')
  const quality = (formData.get('quality') as QualityLevel | null) ?? 'standard'

  if (!(file instanceof File)) {
    return jsonBadRequest('Missing file in upload')
  }
  if (typeof bookId !== 'string' || !isValidUUID(bookId)) {
    return jsonBadRequest('Invalid or missing book_id')
  }
  if (!VALID_QUALITY_LEVELS.includes(quality)) {
    return jsonBadRequest(
      `quality must be one of: ${VALID_QUALITY_LEVELS.join(', ')}`
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return jsonBadRequest(
      `Unsupported file type: .${ext}. Supported: .txt, .md, .docx`
    )
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonBadRequest(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB`
    )
  }

  const book = await verifyBookOwnership(supabase, bookId, userId)
  if (!book) {
    return jsonNotFound('Book not found')
  }

  const doc = await parseUpload(file)
  const result = await routeImport(doc, bookId, book.book_type, userId, quality)

  return NextResponse.json({
    success: true,
    import: {
      filename: doc.metadata.filename,
      format: doc.format,
      ...result,
    },
  })
}

async function handleTextPaste(
  request: NextRequest,
  supabase: RouteSupabaseClient,
  userId: string
): Promise<NextResponse> {
  let body: {
    text?: unknown
    book_id?: unknown
    title?: unknown
    quality?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return jsonBadRequest('Invalid JSON body')
  }

  const text = body.text
  const bookId = body.book_id
  const title = body.title
  const quality = (body.quality as QualityLevel | undefined) ?? 'standard'

  if (!isValidText(text)) {
    return jsonBadRequest('Text must be 1-100,000 characters')
  }
  if (typeof bookId !== 'string' || !isValidUUID(bookId)) {
    return jsonBadRequest('Invalid or missing book_id')
  }
  if (title !== undefined && typeof title !== 'string') {
    return jsonBadRequest('title must be a string when provided')
  }
  if (!VALID_QUALITY_LEVELS.includes(quality)) {
    return jsonBadRequest(
      `quality must be one of: ${VALID_QUALITY_LEVELS.join(', ')}`
    )
  }

  const book = await verifyBookOwnership(supabase, bookId, userId)
  if (!book) {
    return jsonNotFound('Book not found')
  }

  const doc = parseText(text, title ?? 'Pasted Content')
  const result = await routeImport(doc, bookId, book.book_type, userId, quality)

  return NextResponse.json({
    success: true,
    import: {
      filename: doc.metadata.filename,
      format: doc.format,
      ...result,
    },
  })
}

async function verifyBookOwnership(
  supabase: RouteSupabaseClient,
  bookId: string,
  userId: string
): Promise<{ book_type: BookType } | null> {
  const { data, error } = await supabase
    .from('books')
    .select('book_type')
    .eq('id', bookId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as { book_type: BookType }
}
