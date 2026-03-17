// Shared intent classification — used by both /api/classify and /api/converse
// Single source of truth for the classification prompt, valid intents, and parse logic.

import { createModelClient } from '../model-router'
import type { QualityLevel } from '../../types/database'

export type ConversationIntent =
  | 'guided'
  | 'freeform'
  | 'review'
  | 'brainstorm'
  | 'status'
  | 'command'

export const VALID_INTENTS: ConversationIntent[] = [
  'guided',
  'freeform',
  'review',
  'brainstorm',
  'status',
  'command',
]

const CLASSIFICATION_PROMPT = `You are an intent classifier for Sam, a voice-first book-writing companion on the Rune platform.

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
If the message is ambiguous or very short (e.g., "hey", "hi"), default to "guided" with low confidence.`

export async function classifyIntent(
  message: string,
  quality: QualityLevel,
): Promise<{ intent: ConversationIntent; confidence: number }> {
  const { client, model } = createModelClient('intent_detection', quality)

  const response = await client.messages.create({
    model,
    max_tokens: 128,
    temperature: 0,
    system: CLASSIFICATION_PROMPT,
    messages: [{ role: 'user', content: message }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { intent: 'guided', confidence: 0.3 }
  }

  let parsed: { intent: string; confidence: number }
  try {
    parsed = JSON.parse(textBlock.text.trim())
  } catch {
    const jsonMatch = textBlock.text.match(/\{[^}]+\}/)
    if (!jsonMatch) {
      return { intent: 'guided', confidence: 0.3 }
    }
    parsed = JSON.parse(jsonMatch[0])
  }

  const intent = VALID_INTENTS.includes(parsed.intent as ConversationIntent)
    ? (parsed.intent as ConversationIntent)
    : 'guided'

  const confidence =
    typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5

  return { intent, confidence }
}
