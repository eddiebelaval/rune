/**
 * Revise API route — applies an AI-driven revision to a workspace file.
 *
 * Takes an instruction (e.g., "tighten the opening paragraph" or
 * "make the dialogue feel more natural"), fetches the current content,
 * asks Opus (via model router, 'review' task) to revise it, saves a
 * before/after snapshot, and updates the workspace file.
 *
 * POST /api/revise
 * Body: { book_id: string, file_id: string, instruction: string, quality?: QualityLevel }
 * Returns: { revision_id: string, content_before: string, content_after: string, note: string }
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createModelClient } from '@/lib/model-router';
import { createRevision } from '@/lib/revisions';
import type { QualityLevel, Book, WorkspaceFile } from '@/types/database';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface ReviseRequest {
  book_id: string;
  file_id: string;
  instruction: string;
  session_id?: string;
  quality?: QualityLevel;
}

interface ReviseResponse {
  revision_id: string;
  content_before: string;
  content_after: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Revision system prompt
// ---------------------------------------------------------------------------

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
- Output ONLY the revised text. Nothing else.`;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
): Promise<NextResponse<ReviseResponse | { error: string }>> {
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
    let body: ReviseRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { book_id, file_id, instruction, session_id } = body;

    if (!book_id || typeof book_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: book_id' },
        { status: 400 },
      );
    }
    if (!file_id || typeof file_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: file_id' },
        { status: 400 },
      );
    }
    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: instruction' },
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

    // Fetch the workspace file and verify it belongs to this book
    const { data: file, error: fileError } = await supabase
      .from('workspace_files')
      .select('*')
      .eq('id', file_id)
      .eq('book_id', book_id)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'Workspace file not found' },
        { status: 404 },
      );
    }

    const typedFile = file as WorkspaceFile;
    const contentBefore = typedFile.content;

    if (!contentBefore || contentBefore.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cannot revise an empty file' },
        { status: 400 },
      );
    }

    // Use Opus (via model router, 'review' task) to revise the content
    const { client, model } = createModelClient('review', quality);

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
    });

    // Extract the revised content
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'No response from revision model' },
        { status: 500 },
      );
    }

    const contentAfter = textBlock.text.trim();

    // Build a concise revision note
    const note = `Revision: ${instruction}`;

    // Save the revision snapshot and update the workspace file in parallel
    const [revision] = await Promise.all([
      createRevision(
        book_id,
        file_id,
        contentBefore,
        contentAfter,
        session_id,
        note,
      ),
      supabase
        .from('workspace_files')
        .update({ content: contentAfter })
        .eq('id', file_id),
    ]);

    return NextResponse.json({
      revision_id: revision.id,
      content_before: contentBefore,
      content_after: contentAfter,
      note,
    });
  } catch (error) {
    console.error('[revise] Revision failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Revision failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
