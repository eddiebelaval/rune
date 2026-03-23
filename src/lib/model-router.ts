/**
 * Model routing for Rune.
 *
 * Sonnet is the workhorse — handles conversation, interviews, prose, reviews.
 * Haiku handles clerk work (intent detection, entity extraction).
 * Opus reserved for final manuscript assembly only.
 *
 * API costs are absorbed by Rune (subscription model). Users never see API keys.
 * Self-hosters can set their own ANTHROPIC_API_KEY in env.
 *
 * Routing table:
 * | Task               | Economy | Standard | Premium |
 * |--------------------|---------|----------|---------|
 * | Intent detection   | Haiku   | Haiku    | Haiku   |
 * | Entity extraction  | Haiku   | Haiku    | Sonnet  |
 * | Filing/organizing  | Haiku   | Sonnet   | Sonnet  |
 * | Knowledge graph    | Sonnet  | Sonnet   | Sonnet  |
 * | Backlog updates    | Haiku   | Sonnet   | Sonnet  |
 * | Interview questions| Sonnet  | Sonnet   | Sonnet  |
 * | Prose generation   | Sonnet  | Sonnet   | Sonnet  |
 * | Review/feedback    | Sonnet  | Sonnet   | Sonnet  |
 * | Final manuscript   | Sonnet  | Sonnet   | Opus    |
 */

import Anthropic from '@anthropic-ai/sdk';
import type { QualityLevel } from '@/types/database';
import type { ModelTask, ModelId, ModelRouting, ModelConfig } from '@/types/models';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HAIKU: ModelId = 'claude-haiku-4-5-20251001';
const SONNET: ModelId = 'claude-sonnet-4-5-20250929';
const OPUS: ModelId = 'claude-opus-4-6';

// ---------------------------------------------------------------------------
// Routing table
// ---------------------------------------------------------------------------

export const MODEL_ROUTING: ModelRouting = {
  economy: {
    intent_detection: HAIKU,
    entity_extraction: HAIKU,
    filing: HAIKU,
    knowledge_graph: SONNET,
    backlog: HAIKU,
    interview: SONNET,
    prose: SONNET,
    review: SONNET,
    manuscript: SONNET,
  },
  standard: {
    intent_detection: HAIKU,
    entity_extraction: HAIKU,
    filing: SONNET,
    knowledge_graph: SONNET,
    backlog: SONNET,
    interview: SONNET,
    prose: SONNET,
    review: SONNET,
    manuscript: SONNET,
  },
  premium: {
    intent_detection: HAIKU,
    entity_extraction: SONNET,
    filing: SONNET,
    knowledge_graph: SONNET,
    backlog: SONNET,
    interview: SONNET,
    prose: SONNET,
    review: SONNET,
    manuscript: OPUS,
  },
};

// ---------------------------------------------------------------------------
// Default max-tokens per task category
// ---------------------------------------------------------------------------

const DEFAULT_MAX_TOKENS: Record<ModelTask, number> = {
  intent_detection: 256,
  entity_extraction: 1024,
  filing: 1024,
  knowledge_graph: 2048,
  backlog: 1024,
  interview: 2048,
  prose: 4096,
  review: 4096,
  manuscript: 8192,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve the Claude model ID for a given task and quality level.
 */
export function getModel(task: ModelTask, quality: QualityLevel): ModelId {
  return MODEL_ROUTING[quality][task];
}

/**
 * Build a full ModelConfig for a task, merging defaults with optional overrides.
 */
export function getModelConfig(
  task: ModelTask,
  quality: QualityLevel,
  overrides?: Pick<ModelConfig, 'maxTokens' | 'temperature'>
): ModelConfig {
  return {
    modelId: getModel(task, quality),
    task,
    quality,
    maxTokens: overrides?.maxTokens ?? DEFAULT_MAX_TOKENS[task],
    temperature: overrides?.temperature,
  };
}

/**
 * Create an Anthropic SDK client pre-configured for a specific task and quality.
 *
 * The returned object contains the client instance and the resolved model ID
 * so callers can pass `model` directly to `client.messages.create()`.
 */
export function createModelClient(
  task: ModelTask,
  quality: QualityLevel
): { client: Anthropic; model: ModelId; config: ModelConfig } {
  const config = getModelConfig(task, quality);

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  return { client, model: config.modelId, config };
}
