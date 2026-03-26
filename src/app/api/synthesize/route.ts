import { NextRequest, NextResponse } from 'next/server'
import { addBacklogItem } from '@/lib/backlog'
import { createModelClient } from '@/lib/model-router'
import { createWorkspaceFile } from '@/lib/workspace'
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
import type {
  BacklogItemType,
  Book,
  QualityLevel,
  Room,
  Session,
} from '@/types/database'

interface SynthesizeRequest {
  book_id: string
  session_id: string
  quality?: QualityLevel
}

interface SynthesizedEntity {
  name: string
  type: string
  description: string
}

interface SynthesizedBacklogItem {
  type: BacklogItemType
  content: string
}

interface SynthesizedWorkspaceFile {
  room: Room
  category: string
  title: string
  content: string
}

interface SynthesisResult {
  summary: string
  entities: SynthesizedEntity[]
  backlog_items: SynthesizedBacklogItem[]
  workspace_files: SynthesizedWorkspaceFile[]
}

const VALID_BACKLOG_TYPES: BacklogItemType[] = [
  'question',
  'contradiction',
  'thin_spot',
  'unexplored',
  'review',
  'idea',
]

const VALID_ROOMS: Room[] = ['brainstorm', 'drafts', 'publish']
const VALID_QUALITY_LEVELS: QualityLevel[] = ['economy', 'standard', 'premium']

function buildSynthesisPrompt(bookType: string, bookTitle: string): string {
  return `You are Rune's session analyzer. After a conversation session about the book "${bookTitle}" (${bookType}), you analyze the transcript to extract structured insights.

Your job is to produce a JSON synthesis with four sections:

1. **summary** — A 2-4 sentence summary of what was discussed and accomplished in this session.

2. **entities** — People, places, themes, and events mentioned. Each entity needs:
   - "name": The canonical name
   - "type": One of "person", "place", "theme", "event"
   - "description": Brief description based on context

3. **backlog_items** — Things to follow up on in future sessions. Each item needs:
   - "type": One of "question" (unanswered), "contradiction" (conflicting facts), "thin_spot" (needs more detail), "unexplored" (mentioned but not developed), "review" (needs editing attention), "idea" (creative suggestion to explore)
   - "content": A clear description of the follow-up item

4. **workspace_files** — Suggested files to create or update in the workspace. Each file needs:
   - "room": One of "brainstorm", "drafts", "publish"
   - "category": The category within that room (e.g., "people", "chapters", "raw-sessions")
   - "title": A descriptive title for the file
   - "content": The actual content to save (extract relevant text from the transcript)

Rules:
- Be thorough but not redundant.
- For backlog items, focus on actionable follow-ups, not restatements.
- For workspace files, extract substantive content — not just notes about what was said, but the actual material.
- File raw session content to "brainstorm" > "raw-sessions" if it doesn't fit a more specific category.
- Contradictions should be specific: "Author said X in session 2 but Y here."

Respond with ONLY a JSON object:
{
  "summary": "...",
  "entities": [...],
  "backlog_items": [...],
  "workspace_files": [...]
}`
}

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
      buildRateLimitKey(request, 'synthesize:create', user.id),
      RATE_LIMITS.synthesize
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many synthesis runs. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<SynthesizeRequest>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { book_id, session_id, quality = 'standard' } = parsed.data

    if (!book_id || !isValidUUID(book_id)) {
      return jsonBadRequest('book_id is required')
    }
    if (!session_id || !isValidUUID(session_id)) {
      return jsonBadRequest('session_id is required')
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
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .eq('book_id', book_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const typedSession = session as Session
    if (!typedSession.raw_transcript || typedSession.raw_transcript.trim() === '') {
      return jsonBadRequest('Session has no transcript to synthesize')
    }

    const { client, model } = createModelClient('prose', quality)
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0,
      system: buildSynthesisPrompt(typedBook.book_type, typedBook.title),
      messages: [
        {
          role: 'user',
          content: `Here is the session transcript to analyze:\n\n${typedSession.raw_transcript}`,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No response from synthesis model')
    }

    let synthesis: SynthesisResult
    try {
      synthesis = JSON.parse(textBlock.text.trim())
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Synthesis model returned invalid JSON')
      }
      synthesis = JSON.parse(jsonMatch[0]) as SynthesisResult
    }

    if (synthesis.summary) {
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ summary: synthesis.summary })
        .eq('id', session_id)

      if (updateError) {
        console.error('[synthesize] Failed to update session summary:', updateError)
      }
    }

    const createdBacklogItems: SynthesizedBacklogItem[] = []
    for (const item of synthesis.backlog_items ?? []) {
      if (
        !VALID_BACKLOG_TYPES.includes(item.type) ||
        !item.content ||
        typeof item.content !== 'string'
      ) {
        continue
      }

      try {
        await addBacklogItem(book_id, item.type, item.content, session_id)
        createdBacklogItems.push(item)
      } catch (backlogError) {
        console.error('[synthesize] Failed to create backlog item:', backlogError)
      }
    }

    const createdWorkspaceFiles: SynthesizedWorkspaceFile[] = []
    for (const file of synthesis.workspace_files ?? []) {
      if (
        !VALID_ROOMS.includes(file.room) ||
        !file.category ||
        !file.title ||
        !file.content
      ) {
        continue
      }

      try {
        await createWorkspaceFile(
          book_id,
          file.room,
          file.category,
          file.title,
          file.content,
          session_id
        )
        createdWorkspaceFiles.push(file)
      } catch (workspaceError) {
        console.error('[synthesize] Failed to create workspace file:', workspaceError)
      }
    }

    return NextResponse.json({
      summary: synthesis.summary ?? '',
      entities: synthesis.entities ?? [],
      backlog_items: createdBacklogItems,
      workspace_files: createdWorkspaceFiles,
    })
  } catch (error) {
    return jsonInternalError('synthesize', error)
  }
}
