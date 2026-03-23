/**
 * Main conversation API route — the core of Rune.
 *
 * Streaming endpoint that handles all conversation modes. Takes a user message,
 * classifies the intent, loads Sam's consciousness + KB context + interview state,
 * and streams the response from Claude with KB tool access.
 *
 * POST /api/converse
 * Body: { message: string, book_id: string, session_id: string, quality?: QualityLevel }
 * Returns: Streaming text response with interleaved KB operation notifications
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';
import { createModelClient } from '@/lib/model-router';
import { assemblePrompt } from '@/lib/prompts/index';
import { getBacklogItems } from '@/lib/backlog';
import { getSamConsciousness } from '@/lib/sam/loader';
import { selectRelevantFiles, buildKBSystemContext } from '@/lib/ai/kb-context-inference';
import { KB_TOOLS } from '@/lib/ai/kb-tools-schema';
import { executeKBTool } from '@/lib/ai/kb-tools';
import { CONCIERGE_TOOLS, CONCIERGE_TOOL_NAMES } from '@/lib/ai/concierge-tools-schema';
import { executeConciergetool } from '@/lib/ai/concierge-tools';
import { classifyIntent } from '@/lib/ai/classify-intent';
import { InterviewEngine } from '@/lib/interviews/engine';
import type { KBToolName } from '@/lib/ai/kb-tools-schema';
import type { ConciergeToolName } from '@/lib/ai/concierge-tools-schema';
import type { ConversationIntent } from '@/lib/ai/classify-intent';
import type { QualityLevel, SessionMode, Book, Session } from '@/types/database';
import type { ModelTask } from '@/types/models';
import type { PipelineStage } from '@/types/knowledge';
import { isValidUUID, isValidMessage, safeErrorResponse } from '@/lib/validation';

// ---------------------------------------------------------------------------
// Map conversation intent to model task / session mode
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

    if (!isValidMessage(message)) {
      return NextResponse.json({ error: 'Invalid or missing message' }, { status: 400 });
    }
    if (!isValidUUID(book_id)) {
      return NextResponse.json({ error: 'Invalid book_id' }, { status: 400 });
    }
    if (!isValidUUID(session_id)) {
      return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 });
    }

    const quality: QualityLevel = body.quality ?? 'standard';

    // Parallelize: intent classification + book/session verification
    // (intent only needs message + quality, not auth results)
    const [intentResult, bookResult, sessionResult] = await Promise.all([
      classifyIntent(message, quality),
      supabase.from('books').select('*').eq('id', book_id).eq('user_id', user.id).single(),
      supabase.from('sessions').select('*').eq('id', session_id).eq('book_id', book_id).single(),
    ]);

    if (bookResult.error || !bookResult.data) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    if (sessionResult.error || !sessionResult.data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { intent } = intentResult;
    const typedBook = bookResult.data as Book & { pipeline_stage?: PipelineStage };
    const typedSession = sessionResult.data as Session;

    // Gather remaining context in parallel
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
            .map((s) => `Session ${(s as Session).session_number}: ${(s as Session).summary}`)
            .join('\n')
        : undefined;

    // Build interview engine prompt (guided mode in world-building stage)
    let interviewPrompt: string | undefined;
    const pipelineStage = typedBook.pipeline_stage ?? 'world-building';
    if (intent === 'guided' && pipelineStage === 'world-building') {
      // Reuse already-fetched kbFiles for interview engine (avoids second DB query)
      const engine = new InterviewEngine(typedBook.book_type, kbFiles);
      interviewPrompt = engine.getInterviewPrompt();
    }

    // Assemble system prompt: Sam consciousness + persona + KB context + interview
    const sessionMode = INTENT_TO_SESSION_MODE[intent];
    const personaPrompt = assemblePrompt({
      mode: sessionMode,
      bookType: typedBook.book_type,
      bookTitle: typedBook.title,
      backlogItems,
      entitySummary: undefined,
      sessionHistory,
    });

    // Session context — tells Sam the session number and whether this is first contact
    const isFirstMessage = !typedSession.raw_transcript;
    const isOnboarding = typedBook.title === 'Untitled' && typedSession.session_number === 1 && isFirstMessage;
    const sessionContext = `<session-context>
session_number: ${typedSession.session_number}
is_first_message_in_session: ${isFirstMessage}
is_onboarding: ${isOnboarding}
pipeline_stage: ${pipelineStage}
book_type: ${typedBook.book_type}
book_title: ${typedBook.title}
</session-context>`;

    const systemPrompt = [
      getSamConsciousness(),
      sessionContext,
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
        content: 'I remember our conversation. Let me continue from where we left off.',
      });
    }

    conversationMessages.push({ role: 'user', content: message });

    // Stream the response with real streaming + tool-use support
    const modelTask: ModelTask = INTENT_TO_TASK[intent];
    const { client, model } = createModelClient(modelTask, quality);
    const encoder = new TextEncoder();

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          await streamWithToolUse(
            client, model, systemPrompt, conversationMessages,
            user.id, book_id, controller, encoder,
          );
        } catch (error) {
          console.error('[converse] Stream error:', error);
          controller.enqueue(encoder.encode('\n\n[An error occurred during the conversation]'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: safeErrorResponse('converse', error) },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Streaming with tool-use follow-up turns
// ---------------------------------------------------------------------------

async function streamWithToolUse(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  userId: string,
  bookId: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  depth = 0,
): Promise<void> {
  // Safety: prevent infinite tool-use loops
  if (depth > 5) {
    controller.enqueue(encoder.encode('\n\n[Tool call depth limit reached]'));
    return;
  }

  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
    tools: [...KB_TOOLS, ...CONCIERGE_TOOLS],
  });

  // Stream text deltas to client in real time
  const contentBlocks: Anthropic.ContentBlock[] = [];

  stream.on('text', (text) => {
    controller.enqueue(encoder.encode(text));
  });

  // Wait for the full message to check for tool_use
  const finalMessage = await stream.finalMessage();
  contentBlocks.push(...finalMessage.content);

  // If stop_reason is tool_use, execute tools and continue
  if (finalMessage.stop_reason === 'tool_use') {
    const toolUseBlocks = contentBlocks.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    // Execute all tool calls — route to correct handler
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const args = block.input as Record<string, unknown>;
      const isConcierge = CONCIERGE_TOOL_NAMES.has(block.name);

      const result = isConcierge
        ? await executeConciergetool(block.name as ConciergeToolName, args, userId, bookId)
        : await executeKBTool(block.name as KBToolName, args, userId, bookId);

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result.success ? result.data : { error: result.error }),
      });

      // Notify client of operation
      const label = isConcierge ? 'Sam' : 'KB';
      const notification = `\n[${label}: ${block.name} — ${result.success ? 'done' : 'failed'}]\n`;
      controller.enqueue(encoder.encode(notification));
    }

    // Continue conversation with tool results (recursive for multi-turn tool use)
    const updatedMessages: Anthropic.MessageParam[] = [
      ...messages,
      { role: 'assistant', content: contentBlocks },
      { role: 'user', content: toolResults },
    ];

    await streamWithToolUse(
      client, model, systemPrompt, updatedMessages,
      userId, bookId, controller, encoder, depth + 1,
    );
  }
}
