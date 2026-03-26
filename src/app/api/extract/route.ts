import { NextRequest, NextResponse } from 'next/server'
import { createModelClient } from '@/lib/model-router'
import { KnowledgeBaseService } from '@/lib/database/knowledge-base'
import { inferFolderAndScope } from '@/types/folder-system'
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
import { isValidText, isValidUUID } from '@/lib/validation'
import type { QualityLevel } from '@/types/database'
import type { KnowledgeFileType } from '@/types/knowledge'

interface ExtractRequest {
  text: string
  book_id: string
  session_id: string
  quality?: QualityLevel
}

type LegacyEntityType = 'person' | 'place' | 'theme' | 'event'

interface ExtractedEntity {
  name: string
  type: LegacyEntityType
  description: string
  is_new: boolean
  kb_file_type: KnowledgeFileType
}

interface ExtractionResult {
  entities: { name: string; type: string; description: string }[]
  relationships: { from: string; to: string; type: string; description: string }[]
}

const ENTITY_TO_KB_TYPE: Record<LegacyEntityType, KnowledgeFileType> = {
  person: 'characters',
  place: 'world-building',
  theme: 'thematic-through-lines',
  event: 'timeline',
}

const VALID_ENTITY_TYPES: LegacyEntityType[] = ['person', 'place', 'theme', 'event']
const VALID_QUALITY_LEVELS: QualityLevel[] = ['economy', 'standard', 'premium']
const DEFAULT_EXTRACTION_CONFIDENCE = 0.78

const EXTRACTION_PROMPT = `You are an entity extractor for Sam, a voice-first book-writing companion on the Rune platform.

Given a passage of text from a conversation about a book, extract all meaningful entities and relationships.

Entity types:
- "person" — A named person, character, or clearly referenced individual
- "place" — A named location, city, building, or geographic reference
- "theme" — An abstract concept, emotion, or recurring motif
- "event" — A specific happening, incident, or milestone

Rules:
- Only extract entities that are meaningful to the book's content.
- Do NOT extract the AI assistant or generic conversational references.
- For each entity, provide a brief description based on what's said in the text.
- For relationships, describe how two entities are connected.
- If the same entity is mentioned multiple ways (e.g., "Mom" and "my mother"), normalize to a single canonical name.

Respond with ONLY a JSON object, no other text:
{
  "entities": [
    { "name": "Entity Name", "type": "person|place|theme|event", "description": "Brief description" }
  ],
  "relationships": [
    { "from": "Entity A", "to": "Entity B", "type": "relationship_type", "description": "How they relate" }
  ]
}

If no entities are found, return: { "entities": [], "relationships": [] }`

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
      buildRateLimitKey(request, 'extract:create', user.id),
      RATE_LIMITS.extract
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many extraction requests. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<ExtractRequest>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { text, book_id, session_id, quality = 'standard' } = parsed.data

    if (!isValidText(text)) {
      return jsonBadRequest('text must be 1-100,000 characters')
    }
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

    const ownedBook = await requireOwnedBook(supabase, user.id, book_id)
    if (ownedBook instanceof NextResponse) {
      return ownedBook
    }

    const { client, model } = createModelClient('entity_extraction', quality)
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      temperature: 0,
      system: EXTRACTION_PROMPT,
      messages: [{ role: 'user', content: text }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No response from extraction model')
    }

    let extraction: ExtractionResult
    try {
      extraction = JSON.parse(textBlock.text.trim())
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Extraction model returned invalid JSON')
      }
      extraction = JSON.parse(jsonMatch[0]) as ExtractionResult
    }

    const existingFiles = await KnowledgeBaseService.getFiles(user.id, { book_id })
    const existingByTitle = new Map(
      existingFiles.map((file) => [file.title.toLowerCase(), file])
    )

    const resultEntities: ExtractedEntity[] = []

    for (const extracted of extraction.entities ?? []) {
      if (!VALID_ENTITY_TYPES.includes(extracted.type as LegacyEntityType)) {
        continue
      }

      const entityType = extracted.type as LegacyEntityType
      const kbFileType = ENTITY_TO_KB_TYPE[entityType]
      const normalizedTitle = extracted.name.toLowerCase()
      const existing = existingByTitle.get(normalizedTitle)

      if (existing) {
        const updated = await KnowledgeBaseService.updateFile(existing.id, {
          content: `${existing.content}\n\n${extracted.description}`.trim(),
          metadata: {
            extraction_confidence: DEFAULT_EXTRACTION_CONFIDENCE,
            source_session: session_id,
            last_interview_session: session_id,
          },
        })

        resultEntities.push({
          name: updated.title,
          type: entityType,
          description: updated.content,
          is_new: false,
          kb_file_type: kbFileType,
        })
        existingByTitle.set(normalizedTitle, updated)
        continue
      }

      const inferred = inferFolderAndScope(kbFileType)
      const newFile = await KnowledgeBaseService.createFile(user.id, {
        book_id,
        title: extracted.name,
        content: extracted.description,
        file_type: kbFileType,
        scope: inferred.scope,
        folder_type: inferred.folder_type,
        folder_path: inferred.folder_path,
        is_active: true,
        source_type: 'ai-generated',
        metadata: {
          extraction_confidence: DEFAULT_EXTRACTION_CONFIDENCE,
          source_session: session_id,
          last_interview_session: session_id,
        },
      })

      existingByTitle.set(normalizedTitle, newFile)
      resultEntities.push({
        name: newFile.title,
        type: entityType,
        description: newFile.content,
        is_new: true,
        kb_file_type: kbFileType,
      })
    }

    if (extraction.relationships && extraction.relationships.length > 0) {
      const relContent = extraction.relationships
        .map(
          (relationship) =>
            `${relationship.from} --[${relationship.type}]--> ${relationship.to}: ${relationship.description}`
        )
        .join('\n')

      const existingRelMap = existingFiles.find(
        (file) => file.file_type === 'relationships-map'
      )

      if (existingRelMap) {
        await KnowledgeBaseService.updateFile(existingRelMap.id, {
          content: `${existingRelMap.content}\n${relContent}`.trim(),
          metadata: {
            extraction_confidence: DEFAULT_EXTRACTION_CONFIDENCE,
            source_session: session_id,
            last_interview_session: session_id,
          },
        })
      } else {
        await KnowledgeBaseService.createFile(user.id, {
          book_id,
          title: 'Relationships Map',
          content: relContent,
          file_type: 'relationships-map',
          is_active: true,
          source_type: 'ai-generated',
          metadata: {
            extraction_confidence: DEFAULT_EXTRACTION_CONFIDENCE,
            source_session: session_id,
            last_interview_session: session_id,
          },
        })
      }
    }

    return NextResponse.json({ entities: resultEntities })
  } catch (error) {
    return jsonInternalError('extract', error)
  }
}
