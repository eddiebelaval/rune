/**
 * Session synthesis API route.
 *
 * After a conversation session ends, this route analyzes the raw transcript
 * to produce a structured synthesis: session summary, entity extraction cues,
 * backlog items (questions, contradictions, thin spots), and workspace file
 * suggestions.
 *
 * POST /api/synthesize
 * Body: { book_id: string, session_id: string, quality?: QualityLevel }
 * Returns: { summary, entities, backlog_items, workspace_files }
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createModelClient } from '@/lib/model-router';
import { addBacklogItem } from '@/lib/backlog';
import { createWorkspaceFile } from '@/lib/workspace';
import type {
  QualityLevel,
  Book,
  Session,
  BacklogItemType,
  Room,
} from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SynthesizeRequest {
  book_id: string;
  session_id: string;
  quality?: QualityLevel;
}

interface SynthesizedEntity {
  name: string;
  type: string;
  description: string;
}

interface SynthesizedBacklogItem {
  type: BacklogItemType;
  content: string;
}

interface SynthesizedWorkspaceFile {
  room: Room;
  category: string;
  title: string;
  content: string;
}

interface SynthesisResult {
  summary: string;
  entities: SynthesizedEntity[];
  backlog_items: SynthesizedBacklogItem[];
  workspace_files: SynthesizedWorkspaceFile[];
}

// ---------------------------------------------------------------------------
// Synthesis prompt
// ---------------------------------------------------------------------------

const VALID_BACKLOG_TYPES: BacklogItemType[] = [
  'question',
  'contradiction',
  'thin_spot',
  'unexplored',
  'review',
  'idea',
];

const VALID_ROOMS: Room[] = ['brainstorm', 'drafts', 'publish'];

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
}`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
): Promise<NextResponse<SynthesisResult | { error: string }>> {
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
    let body: SynthesizeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { book_id, session_id } = body;

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
      .select('*')
      .eq('id', book_id)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const typedBook = book as Book;

    // Fetch the session and its raw transcript
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .eq('book_id', book_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const typedSession = session as Session;

    if (!typedSession.raw_transcript || typedSession.raw_transcript.trim() === '') {
      return NextResponse.json(
        { error: 'Session has no transcript to synthesize' },
        { status: 400 },
      );
    }

    // Call Claude for synthesis
    const { client, model } = createModelClient('prose', quality);
    const synthesisPrompt = buildSynthesisPrompt(
      typedBook.book_type,
      typedBook.title,
    );

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0,
      system: synthesisPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is the session transcript to analyze:\n\n${typedSession.raw_transcript}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'No response from synthesis model' },
        { status: 500 },
      );
    }

    // Parse synthesis result
    let synthesis: SynthesisResult;
    try {
      synthesis = JSON.parse(textBlock.text.trim());
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json(
          { error: 'Synthesis model returned invalid JSON' },
          { status: 500 },
        );
      }
      synthesis = JSON.parse(jsonMatch[0]);
    }

    // Persist: Update session with summary
    if (synthesis.summary) {
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ summary: synthesis.summary })
        .eq('id', session_id);

      if (updateError) {
        console.error('[synthesize] Failed to update session summary:', updateError);
      }
    }

    // Persist: Create backlog items
    const createdBacklogItems: SynthesizedBacklogItem[] = [];
    for (const item of synthesis.backlog_items ?? []) {
      if (
        !VALID_BACKLOG_TYPES.includes(item.type) ||
        !item.content ||
        typeof item.content !== 'string'
      ) {
        continue;
      }

      try {
        await addBacklogItem(book_id, item.type, item.content, session_id);
        createdBacklogItems.push(item);
      } catch (blError) {
        console.error('[synthesize] Failed to create backlog item:', blError);
      }
    }

    // Persist: Create workspace files
    const createdWorkspaceFiles: SynthesizedWorkspaceFile[] = [];
    for (const file of synthesis.workspace_files ?? []) {
      if (
        !VALID_ROOMS.includes(file.room) ||
        !file.category ||
        !file.title ||
        !file.content
      ) {
        continue;
      }

      try {
        await createWorkspaceFile(
          book_id,
          file.room,
          file.category,
          file.title,
          file.content,
        );
        createdWorkspaceFiles.push(file);
      } catch (wsError) {
        console.error('[synthesize] Failed to create workspace file:', wsError);
      }
    }

    // Return the full synthesis result (with only successfully persisted items)
    const result: SynthesisResult = {
      summary: synthesis.summary ?? '',
      entities: synthesis.entities ?? [],
      backlog_items: createdBacklogItems,
      workspace_files: createdWorkspaceFiles,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[synthesize] Session synthesis failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Synthesis failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
