/**
 * Main conversation API route — the core of Rune.
 *
 * Streaming endpoint that handles all conversation modes. Takes a user message,
 * classifies the intent, loads Sam's consciousness + KB context + interview state,
 * and streams the response from Claude with KB tool access.
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
import { loadSamConsciousness } from '@/lib/sam/loader';
import { selectRelevantFiles, buildKBSystemContext } from '@/lib/ai/kb-context-inference';
import { KB_TOOLS } from '@/lib/ai/kb-tools-schema';
import { executeKBTool } from '@/lib/ai/kb-tools';
import { InterviewEngine } from '@/lib/interviews/engine';
import { KnowledgeBaseService } from '@/lib/database/knowledge-base';
import type { KBToolName } from '@/lib/ai/kb-tools-schema';
import type { QualityLevel, SessionMode, Book, Session } from '@/types/database';
import type { ModelTask } from '@/types/models';
import type { ConversationIntent } from '@/app/api/classify/route';
import type { PipelineStage } from '@/types/knowledge';

// ---------------------------------------------------------------------------
// Intent classification (inline, not via HTTP)
// ---------------------------------------------------------------------------

const CLASSIFICATION_PROMPT = `You are an intent classifier for a book-writing assistant called Sam (on the Rune platform).

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

const INTENT_TO_SESSION_MODE: Record<ConversationIntent, SessionMode> = {
  guided: 'guided',
  freeform: 'freeform',
  review: 'review',
  brainstorm: 'guided',
  status: 'freeform',
  command: 'freeform',
};

// ---------------------------------------------------------------------------
// Sam's consciousness (loaded once at module level, cached)
// ---------------------------------------------------------------------------

let _samConsciousness: string | null = null;

function getSamConsciousness(): string {
  if (!_samConsciousness) {
    _samConsciousness = loadSamConsciousness();
  }
  return _samConsciousness;
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

    const typedBook = book as Book & { pipeline_stage?: PipelineStage };

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

    // Classify intent
    const { intent } = await classifyIntent(message, quality);

    // Gather all context in parallel
    const [backlogItems, kbFiles, recentSessions] = await Promise.all([
      getBacklogItems(book_id, 'open'),
      selectRelevantFiles(user.id, book_id, {
        maxFiles: 10,
        conversationContext: message,
        currentScope: 'local',
      }),
      supabase
        .from('sessions')
        .select('session_number, summary')
        .eq('book_id', book_id)
        .not('summary', 'is', null)
        .order('session_number', { ascending: false })
        .limit(3)
        .then(({ data }) => data),
    ]);

    // Build KB context from hierarchical knowledge base
    const kbContext = buildKBSystemContext(kbFiles);

    // Build session history
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

    // Build interview engine prompt (for guided mode in world-building stage)
    let interviewPrompt: string | undefined;
    const pipelineStage = typedBook.pipeline_stage ?? 'world-building';
    if (intent === 'guided' && pipelineStage === 'world-building') {
      const allKBFiles = await KnowledgeBaseService.getFiles(user.id, { book_id });
      const engine = new InterviewEngine(typedBook.book_type, allKBFiles);
      interviewPrompt = engine.getInterviewPrompt();
    }

    // Assemble the system prompt: Sam consciousness + persona + KB + interview
    const sessionMode = INTENT_TO_SESSION_MODE[intent];
    const personaPrompt = assemblePrompt({
      mode: sessionMode,
      bookType: typedBook.book_type,
      bookTitle: typedBook.title,
      backlogItems,
      entitySummary: undefined, // Replaced by kbContext
      sessionHistory,
    });

    const systemPrompt = [
      getSamConsciousness(),
      personaPrompt,
      kbContext,
      interviewPrompt ? `<interview-guidance>\n${interviewPrompt}\n</interview-guidance>` : '',
    ].filter(Boolean).join('\n\n');

    // Build conversation messages
    const conversationMessages: Anthropic.MessageParam[] = [];

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

    conversationMessages.push({
      role: 'user',
      content: message,
    });

    // Stream the response with KB tools
    const modelTask: ModelTask = INTENT_TO_TASK[intent];
    const { client, model } = createModelClient(modelTask, quality);

    const stream = client.messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversationMessages,
      tools: KB_TOOLS,
    });

    // Create a TransformStream to handle tool_use responses
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process the stream, handling tool calls
    (async () => {
      try {
        const response = await stream.finalMessage();

        // Check for tool_use in the response
        const toolUseBlocks = response.content.filter(
          (block) => block.type === 'tool_use'
        );

        if (toolUseBlocks.length > 0) {
          // Execute tool calls
          for (const block of toolUseBlocks) {
            if (block.type === 'tool_use') {
              const result = await executeKBTool(
                block.name as KBToolName,
                block.input as Record<string, unknown>,
                user.id,
                book_id,
              );

              // Stream a filing notification to the client
              const notification = JSON.stringify({
                type: 'kb_operation',
                tool: block.name,
                result: result.success
                  ? result.data
                  : { error: result.error },
              });
              await writer.write(
                encoder.encode(`data: ${notification}\n\n`)
              );
            }
          }

          // Get text content from the response
          const textBlocks = response.content.filter(
            (block) => block.type === 'text'
          );
          for (const block of textBlocks) {
            if (block.type === 'text') {
              await writer.write(encoder.encode(block.text));
            }
          }
        } else {
          // No tool use — stream text directly
          for (const block of response.content) {
            if (block.type === 'text') {
              await writer.write(encoder.encode(block.text));
            }
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Stream error';
        await writer.write(encoder.encode(`\n\n[Error: ${errorMsg}]`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
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
