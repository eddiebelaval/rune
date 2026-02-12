/**
 * Intent classification API route.
 *
 * Takes a user message and book_id, uses Haiku (or Sonnet at premium)
 * to classify the intent into one of six conversation modes.
 *
 * POST /api/classify
 * Body: { message: string, book_id: string, quality?: QualityLevel }
 * Returns: { intent: ConversationIntent, confidence: number }
 */

import { NextResponse } from 'next/server';
import { createModelClient } from '@/lib/model-router';
import type { QualityLevel } from '@/types/database';

/** The six intent categories Rune recognizes. */
export type ConversationIntent =
  | 'guided'
  | 'freeform'
  | 'review'
  | 'brainstorm'
  | 'status'
  | 'command';

interface ClassifyRequest {
  message: string;
  book_id: string;
  quality?: QualityLevel;
}

interface ClassifyResponse {
  intent: ConversationIntent;
  confidence: number;
}

const VALID_INTENTS: ConversationIntent[] = [
  'guided',
  'freeform',
  'review',
  'brainstorm',
  'status',
  'command',
];

const CLASSIFICATION_PROMPT = `You are an intent classifier for a book-writing assistant called Rune.

Given a user message, classify it into exactly ONE of these intents:

- "guided" — The user wants to be interviewed. They're ready to answer questions about their book. Signals: "let's work on chapter 3", "ask me about my childhood", "I'm ready to talk about the setting", "what should we work on?"
- "freeform" — The user wants to brain dump. They're going to talk and want you to listen. Signals: "so there was this one time...", "I just want to get this down", "let me tell you about...", long unstructured narratives.
- "review" — The user wants to review or edit existing writing. Signals: "read that back to me", "how does chapter 2 sound?", "I want to revise the opening", "what do you think of what we have?"
- "brainstorm" — The user wants to explore ideas without committing. Signals: "what if...", "I'm not sure whether to...", "could the villain be...", "help me figure out..."
- "status" — The user wants a progress update. Signals: "how far along are we?", "what's left to do?", "show me the outline", "where did we leave off?"
- "command" — The user wants to change a setting or perform an action. Signals: "change the title to...", "export chapter 3", "switch to premium", "delete that last note"

Respond with ONLY a JSON object, no other text:
{"intent": "<intent>", "confidence": <0.0-1.0>}

If unsure between two intents, pick the one with higher confidence and note it.
If the message is ambiguous or very short (e.g., "hey", "hi"), default to "guided" with low confidence.`;

export async function POST(request: Request): Promise<NextResponse<ClassifyResponse | { error: string }>> {
  try {
    const body = (await request.json()) as ClassifyRequest;

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    if (!body.book_id || typeof body.book_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: book_id' },
        { status: 400 }
      );
    }

    const quality: QualityLevel = body.quality ?? 'standard';
    const { client, model } = createModelClient('intent_detection', quality);

    const response = await client.messages.create({
      model,
      max_tokens: 128,
      temperature: 0,
      system: CLASSIFICATION_PROMPT,
      messages: [
        {
          role: 'user',
          content: body.message,
        },
      ],
    });

    // Extract text from the response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from classification model' },
        { status: 500 }
      );
    }

    // Parse the JSON response from the model
    let parsed: { intent: string; confidence: number };
    try {
      parsed = JSON.parse(textBlock.text.trim());
    } catch {
      // If the model didn't return clean JSON, try to extract it
      const jsonMatch = textBlock.text.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        return NextResponse.json(
          { error: 'Classification model returned invalid JSON' },
          { status: 500 }
        );
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Validate the intent is one of our known types
    const intent = VALID_INTENTS.includes(parsed.intent as ConversationIntent)
      ? (parsed.intent as ConversationIntent)
      : 'guided';

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

    return NextResponse.json({ intent, confidence });
  } catch (error) {
    console.error('[classify] Intent classification failed:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Classification failed: ${message}` },
      { status: 500 }
    );
  }
}
