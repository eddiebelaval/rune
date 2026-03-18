/**
 * Entity extraction API route.
 *
 * Takes text from a conversation session and uses Claude to extract
 * structured entities (people, places, themes, events). Extracted entities
 * are persisted to the hierarchical KB (knowledge_files table).
 *
 * POST /api/extract
 * Body: { text: string, book_id: string, session_id: string, quality?: QualityLevel }
 * Returns: { entities: ExtractedEntity[] }
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createModelClient } from '@/lib/model-router';
import { KnowledgeBaseService } from '@/lib/database/knowledge-base';
import { inferFolderAndScope } from '@/types/folder-system';
import type { QualityLevel } from '@/types/database';
import type { KnowledgeFileType } from '@/types/knowledge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtractRequest {
  text: string;
  book_id: string;
  session_id: string;
  quality?: QualityLevel;
}

type LegacyEntityType = 'person' | 'place' | 'theme' | 'event';

interface ExtractedEntity {
  name: string;
  type: LegacyEntityType;
  description: string;
  is_new: boolean;
  kb_file_type: KnowledgeFileType;
}

interface ExtractionResult {
  entities: { name: string; type: string; description: string }[];
  relationships: { from: string; to: string; type: string; description: string }[];
}

// Map legacy entity types to KB file types
const ENTITY_TO_KB_TYPE: Record<LegacyEntityType, KnowledgeFileType> = {
  person: 'characters',
  place: 'world-building',
  theme: 'thematic-through-lines',
  event: 'timeline',
};

const VALID_ENTITY_TYPES: LegacyEntityType[] = ['person', 'place', 'theme', 'event'];

// ---------------------------------------------------------------------------
// Extraction prompt
// ---------------------------------------------------------------------------

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

If no entities are found, return: { "entities": [], "relationships": [] }`;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
): Promise<NextResponse<{ entities: ExtractedEntity[] } | { error: string }>> {
  try {
    // Authenticate
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    let body: ExtractRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { text, book_id, session_id } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing required field: text' }, { status: 400 });
    }
    if (!book_id || typeof book_id !== 'string') {
      return NextResponse.json({ error: 'Missing required field: book_id' }, { status: 400 });
    }
    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json({ error: 'Missing required field: session_id' }, { status: 400 });
    }

    const quality: QualityLevel = body.quality ?? 'standard';

    // Verify book ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('id', book_id)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Call Claude for entity extraction
    const { client, model } = createModelClient('entity_extraction', quality);

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      temperature: 0,
      system: EXTRACTION_PROMPT,
      messages: [{ role: 'user', content: text }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from extraction model' }, { status: 500 });
    }

    // Parse extraction result
    let extraction: ExtractionResult;
    try {
      extraction = JSON.parse(textBlock.text.trim());
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Extraction model returned invalid JSON' }, { status: 500 });
      }
      extraction = JSON.parse(jsonMatch[0]);
    }

    // Get existing KB files for deduplication
    const existingFiles = await KnowledgeBaseService.getFiles(user.id, { book_id });
    const existingByTitle = new Map(
      existingFiles.map((f) => [f.title.toLowerCase(), f]),
    );

    // Process extracted entities -> KB files
    const resultEntities: ExtractedEntity[] = [];

    for (const extracted of extraction.entities ?? []) {
      if (!VALID_ENTITY_TYPES.includes(extracted.type as LegacyEntityType)) continue;

      const entityType = extracted.type as LegacyEntityType;
      const kbFileType = ENTITY_TO_KB_TYPE[entityType];
      const normalizedTitle = extracted.name.toLowerCase();
      const existing = existingByTitle.get(normalizedTitle);

      if (existing) {
        // Entity exists in KB — append new info
        const updatedContent = existing.content + '\n\n' + extracted.description;
        await KnowledgeBaseService.updateFile(existing.id, { content: updatedContent });

        resultEntities.push({
          name: existing.title,
          type: entityType,
          description: existing.content,
          is_new: false,
          kb_file_type: kbFileType,
        });
      } else {
        // New entity — create KB file
        const inferred = inferFolderAndScope(kbFileType);
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
          metadata: { extraction_confidence: 0.8, source_session: session_id },
        });

        existingByTitle.set(normalizedTitle, newFile);
        resultEntities.push({
          name: newFile.title,
          type: entityType,
          description: newFile.content,
          is_new: true,
          kb_file_type: kbFileType,
        });
      }
    }

    // Process relationships — append to relationships-map KB file
    if (extraction.relationships && extraction.relationships.length > 0) {
      const relContent = extraction.relationships
        .map((rel) => `${rel.from} --[${rel.type}]--> ${rel.to}: ${rel.description}`)
        .join('\n');

      const existingRelMap = existingFiles.find((f) => f.file_type === 'relationships-map');
      if (existingRelMap) {
        await KnowledgeBaseService.updateFile(existingRelMap.id, {
          content: existingRelMap.content + '\n' + relContent,
        });
      } else {
        await KnowledgeBaseService.createFile(user.id, {
          book_id,
          title: 'Relationships Map',
          content: relContent,
          file_type: 'relationships-map',
          is_active: true,
          source_type: 'ai-generated',
        });
      }
    }

    return NextResponse.json({ entities: resultEntities });
  } catch (error) {
    console.error('[extract] Entity extraction failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Extraction failed: ${errorMessage}` }, { status: 500 });
  }
}
