/**
 * Entity extraction API route.
 *
 * Takes text from a conversation session and uses the Claude API to extract
 * structured entities (people, places, themes, events). Extracted entities
 * are persisted to the knowledge graph, and existing entities get their
 * mention counts incremented.
 *
 * POST /api/extract
 * Body: { text: string, book_id: string, session_id: string, quality?: QualityLevel }
 * Returns: { entities: ExtractedEntity[] }
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createModelClient } from '@/lib/model-router';
import {
  addEntity,
  addRelationship,
  getEntities,
  incrementMentionCount,
} from '@/lib/knowledge-graph';
import type { QualityLevel, EntityType } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtractRequest {
  text: string;
  book_id: string;
  session_id: string;
  quality?: QualityLevel;
}

interface ExtractedEntity {
  name: string;
  type: EntityType;
  description: string;
  is_new: boolean;
}

interface ExtractedRelationship {
  from: string;
  to: string;
  type: string;
  description: string;
}

interface ExtractionResult {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

// ---------------------------------------------------------------------------
// Extraction prompt
// ---------------------------------------------------------------------------

const VALID_ENTITY_TYPES: EntityType[] = ['person', 'place', 'theme', 'event'];

const EXTRACTION_PROMPT = `You are an entity extractor for a book-writing assistant called Rune.

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
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 },
      );
    }
    if (!book_id || typeof book_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: book_id' },
        { status: 400 },
      );
    }
    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: session_id' },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: 'No response from extraction model' },
        { status: 500 },
      );
    }

    // Parse extraction result
    let extraction: ExtractionResult;
    try {
      extraction = JSON.parse(textBlock.text.trim());
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json(
          { error: 'Extraction model returned invalid JSON' },
          { status: 500 },
        );
      }
      extraction = JSON.parse(jsonMatch[0]);
    }

    // Get existing entities for deduplication
    const existingEntities = await getEntities(book_id);
    const existingByName = new Map(
      existingEntities.map((e) => [e.name.toLowerCase(), e]),
    );

    // Process extracted entities
    const resultEntities: ExtractedEntity[] = [];
    const entityIdByName = new Map<string, string>();

    // Seed the name->id map with existing entities
    for (const existing of existingEntities) {
      entityIdByName.set(existing.name.toLowerCase(), existing.id);
    }

    for (const extracted of extraction.entities ?? []) {
      // Validate entity type
      if (!VALID_ENTITY_TYPES.includes(extracted.type as EntityType)) {
        continue;
      }

      const normalizedName = extracted.name.toLowerCase();
      const existing = existingByName.get(normalizedName);

      if (existing) {
        // Entity already exists -- increment mention count
        await incrementMentionCount(existing.id);
        entityIdByName.set(normalizedName, existing.id);
        resultEntities.push({
          name: existing.name,
          type: existing.entity_type,
          description: existing.description,
          is_new: false,
        });
      } else {
        // New entity -- add to knowledge graph
        const newEntity = await addEntity(
          book_id,
          extracted.type as EntityType,
          extracted.name,
          extracted.description,
          undefined,
          session_id,
        );
        entityIdByName.set(normalizedName, newEntity.id);
        resultEntities.push({
          name: newEntity.name,
          type: newEntity.entity_type,
          description: newEntity.description,
          is_new: true,
        });
      }
    }

    // Process extracted relationships
    for (const rel of extraction.relationships ?? []) {
      const fromId = entityIdByName.get(rel.from.toLowerCase());
      const toId = entityIdByName.get(rel.to.toLowerCase());

      if (fromId && toId) {
        try {
          await addRelationship(book_id, fromId, toId, rel.type, rel.description);
        } catch (relError) {
          // Non-fatal: relationship may already exist or reference invalid entities
          console.error('[extract] Failed to add relationship:', relError);
        }
      }
    }

    return NextResponse.json({ entities: resultEntities });
  } catch (error) {
    console.error('[extract] Entity extraction failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Extraction failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
