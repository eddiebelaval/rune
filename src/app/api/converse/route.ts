/**
 * Main conversation API route — the core of Rune.
 *
 * Streaming endpoint that handles all conversation modes. Takes a user message,
 * classifies the intent, assembles the appropriate prompt, and streams
 * the response from Claude.
 *
 * POST /api/converse
 * Body: { message: string, book_id: string, session_id: string, quality?: QualityLevel }
 * Returns: Streaming text/event-stream response
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';
import { createModelClient } from '@/lib/model-router';
import { assemblePrompt } from '@/lib/prompts/index';
import { getBacklogItems } from '@/lib/backlog';
import { getEntities, getRelationships } from '@/lib/knowledge-graph';
import type { QualityLevel, SessionMode, Book, Session } from '@/types/database';
import type { ModelTask } from '@/types/models';
import type { ConversationIntent } from '@/app/api/classify/route';

// ---------------------------------------------------------------------------
// Intent classification (inline, not via HTTP)
// ---------------------------------------------------------------------------

const CLASSIFICATION_PROMPT = `You are an intent classifier for a book-writing assistant called Rune.

Given a user message, classify it into exactly ONE of these intents:

- "guided" — The user wants to be interviewed. They're ready to answer questions about their book. Signals: "let's work on chapter 3", "ask me about my childhood", "I'm ready to talk about the setting", "what should we work on?"
- "freeform" — The user wants to brain dump. They're going to talk and want you to listen. Signals: "so there was this one time...", "I just want to get this down", "let me tell you about...", long unstructured narratives.
- "review" — The user wants to review or edit existing writing. Signals: "read that back to me", "how does chapter 2 sound?", "I want to revise the opening", "what do you think of what we have?"
- "brainstorm" — The user wants to explore ideas without committing. Signals: "what if...", "I'm not sure whether to...", "could the villain be...", "help me figure out..."
- "status" — The user wants a progress update. Signals: "how far along are we?", "what's left to do?", "show me the outline", "where did we leave off?"
- "command" — The user wants to change a setting or perform an action. Signals: "change the title to...", "export chapter 3", "switch to premium", "delete that last note"

Respond with ONLY a JSON object, no other text:
{"intent": "<intent>", "confidence": <0.0-1.0>}`;

const VALID_INTENTS: ConversationIntent[] = [
  'guided',
  'freeform',
  'review',
  'brainstorm',
  'status',
  'command',
];

async function classifyIntent(
  message: string,
  quality: QualityLevel,
): Promise<{ intent: ConversationIntent; confidence: number }> {
  const { client, model } = createModelClient('intent_detection', quality);

  const response = await client.messages.create({
    model,
    max_tokens: 128,
    temperature: 0,
    system: CLASSIFICATION_PROMPT,
    messages: [{ role: 'user', content: message }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return { intent: 'guided', confidence: 0.3 };
  }

  let parsed: { intent: string; confidence: number };
  try {
    parsed = JSON.parse(textBlock.text.trim());
  } catch {
    const jsonMatch = textBlock.text.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      return { intent: 'guided', confidence: 0.3 };
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  const intent = VALID_INTENTS.includes(parsed.intent as ConversationIntent)
    ? (parsed.intent as ConversationIntent)
    : 'guided';

  const confidence =
    typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

  return { intent, confidence };
}

// ---------------------------------------------------------------------------
// Map conversation intent to model task
// ---------------------------------------------------------------------------

const INTENT_TO_TASK: Record<ConversationIntent, ModelTask> = {
  guided: 'interview',
  freeform: 'filing',
  review: 'review',
  brainstorm: 'interview',
  status: 'filing',
  command: 'filing',
};

// Map conversation intent to the SessionMode used for prompt assembly.
// brainstorm -> guided persona, status/command -> freeform (scribe) persona.
const INTENT_TO_SESSION_MODE: Record<ConversationIntent, SessionMode> = {
  guided: 'guided',
  freeform: 'freeform',
  review: 'review',
  brainstorm: 'guided',
  status: 'freeform',
  command: 'freeform',
};

// ---------------------------------------------------------------------------
// Build entity summary for prompt context
// ---------------------------------------------------------------------------

async function buildEntitySummary(bookId: string): Promise<string | undefined> {
  const [entities, relationships] = await Promise.all([
    getEntities(bookId),
    getRelationships(bookId),
  ]);

  if (entities.length === 0) return undefined;

  const lines: string[] = entities.map(
    (e) =>
      `- ${e.name} (${e.entity_type}): ${e.description || 'No description yet'} [mentions: ${e.mention_count}]`,
  );

  if (relationships.length > 0) {
    lines.push('');
    lines.push('Relationships:');
    const entityMap = new Map(entities.map((e) => [e.id, e.name]));
    for (const rel of relationships) {
      const from = entityMap.get(rel.from_entity_id) ?? 'Unknown';
      const to = entityMap.get(rel.to_entity_id) ?? 'Unknown';
      lines.push(`- ${from} --[${rel.relationship_type}]--> ${to}: ${rel.description}`);
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

interface ConverseRequest {
  message: string;
  book_id: string;
  session_id: string;
  quality?: QualityLevel;
}

export async function POST(
  request: Request,
): Promise<Response> {
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
    let body: ConverseRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { message, book_id, session_id } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: message' },
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
      .select('*')
      .eq('id', book_id)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const typedBook = book as Book;

    // Verify session belongs to this book
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

    // Classify intent (inline, not via HTTP)
    const { intent } = await classifyIntent(message, quality);

    // Gather context for prompt assembly in parallel
    const [backlogItems, entitySummary] = await Promise.all([
      getBacklogItems(book_id, 'open'),
      buildEntitySummary(book_id),
    ]);

    // Build session history summary from previous sessions
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('session_number, summary')
      .eq('book_id', book_id)
      .not('summary', 'is', null)
      .order('session_number', { ascending: false })
      .limit(3);

    const sessionHistory =
      recentSessions && recentSessions.length > 0
        ? recentSessions
            .reverse()
            .map(
              (s) =>
                `Session ${(s as Session).session_number}: ${(s as Session).summary}`,
            )
            .join('\n')
        : undefined;

    // Assemble the system prompt
    const sessionMode = INTENT_TO_SESSION_MODE[intent];
    const systemPrompt = assemblePrompt({
      mode: sessionMode,
      bookType: typedBook.book_type,
      bookTitle: typedBook.title,
      backlogItems,
      entitySummary,
      sessionHistory,
    });

    // Build conversation messages from the session transcript
    // For now, we send just the current message. A full implementation would
    // reconstruct conversation history from the raw_transcript.
    const conversationMessages: Anthropic.MessageParam[] = [];

    // If there is an existing raw transcript, include it as context
    if (typedSession.raw_transcript) {
      conversationMessages.push({
        role: 'user',
        content: `[Previous conversation in this session]\n${typedSession.raw_transcript}`,
      });
      conversationMessages.push({
        role: 'assistant',
        content:
          'I remember our conversation. Let me continue from where we left off.',
      });
    }

    // Add the current user message
    conversationMessages.push({
      role: 'user',
      content: message,
    });

    // Stream the response
    const modelTask: ModelTask = INTENT_TO_TASK[intent];
    const { client, model } = createModelClient(modelTask, quality);

    const stream = client.messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversationMessages,
    });

    return new Response(stream.toReadableStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[converse] Conversation failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Conversation failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
