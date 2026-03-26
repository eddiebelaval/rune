import { NextRequest, NextResponse } from 'next/server'
import { createModelClient } from '@/lib/model-router'
import { createRevision } from '@/lib/revisions'
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
import type { Book, QualityLevel, WorkspaceFile } from '@/types/database'

interface ReviseRequest {
  book_id: string
  file_id: string
  instruction: string
  session_id?: string
  quality?: QualityLevel
}

interface ReviseResponse {
  revision_id: string
  content_before: string
  content_after: string
  note: string
}

const VALID_QUALITY_LEVELS: QualityLevel[] = ['economy', 'standard', 'premium']

const REVISION_SYSTEM_PROMPT = `You are Rune, a ghost writer revising a workspace file based on the author's instruction.

YOUR TASK:
Apply the author's revision instruction to the content provided. Return ONLY the revised content — no preamble, no commentary, no markdown fences. The output replaces the file content directly.

RULES:
- Preserve the author's voice. You are editing, not rewriting from scratch.
- Apply the instruction precisely. If they say "tighten the opening", focus on the opening.
- If the instruction is vague, make conservative, tasteful improvements.
- Never add content the author didn't ask for.
- Never remove content unless the instruction implies it (e.g., "cut the second paragraph").
- Maintain formatting consistency with the original content.
- Output ONLY the revised text. Nothing else.`

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'revise:create', user.id),
      RATE_LIMITS.revise
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many revision requests. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<ReviseRequest>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { book_id, file_id, instruction, session_id, quality = 'standard' } = parsed.data

    if (!book_id || !isValidUUID(book_id)) {
      return jsonBadRequest('book_id is required')
    }
    if (!file_id || !isValidUUID(file_id)) {
      return jsonBadRequest('file_id is required')
    }
    if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
      return jsonBadRequest('instruction is required')
    }
    if (session_id !== undefined && !isValidUUID(session_id)) {
      return jsonBadRequest('session_id must be a valid UUID when provided')
    }
    if (!VALID_QUALITY_LEVELS.includes(quality)) {
      return jsonBadRequest(
        `quality must be one of: ${VALID_QUALITY_LEVELS.join(', ')}`
      )
    }

    const ownedBook = await requireOwnedBook(supabase, user.id, book_id, '*')
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const typedBook = ownedBook as unknown as Book
    const ownedFile = await requireOwnedWorkspaceFile(supabase, user.id, file_id, '*')
    if (ownedFile instanceof NextResponse) {
      return ownedFile
    }

    const typedFile = ownedFile as unknown as WorkspaceFile
    if (typedFile.book_id !== book_id) {
      return NextResponse.json({ error: 'Workspace file not found' }, { status: 404 })
    }

    const contentBefore = typedFile.content
    if (!contentBefore || contentBefore.trim().length === 0) {
      return jsonBadRequest('Cannot revise an empty file')
    }

    const { client, model } = createModelClient('review', quality)
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0.3,
      system: REVISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            `BOOK: "${typedBook.title}" (${typedBook.book_type})`,
            `FILE: "${typedFile.title}" (${typedFile.room}/${typedFile.category})`,
            '',
            '--- CURRENT CONTENT ---',
            contentBefore,
            '--- END CONTENT ---',
            '',
            `REVISION INSTRUCTION: ${instruction}`,
          ].join('\n'),
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No response from revision model')
    }

    const contentAfter = textBlock.text.trim()
    const note = `Revision: ${instruction}`

    const [{ data: updatedFile, error: updateError }, revision] = await Promise.all([
      supabase
        .from('workspace_files')
        .update({ content: contentAfter })
        .eq('id', file_id)
        .eq('book_id', book_id)
        .select('id')
        .single(),
      createRevision(
        book_id,
        file_id,
        contentBefore,
        contentAfter,
        session_id,
        note
      ),
    ])

    if (updateError || !updatedFile) {
      throw new Error(updateError?.message ?? 'Failed to update workspace file')
    }

    return NextResponse.json({
      revision_id: revision.id,
      content_before: contentBefore,
      content_after: contentAfter,
      note,
    })
  } catch (error) {
    return jsonInternalError('revise', error)
  }
}
