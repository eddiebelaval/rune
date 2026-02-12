/**
 * Three-tier model routing for Rune.
 *
 * Maps every internal task to the right Claude model based on the user's
 * quality slider setting (Economy / Standard / Premium).
 *
 * Routing table (from CLAUDE.md):
 * | Task               | Economy | Standard | Premium |
 * |--------------------|---------|----------|---------|
 * | Intent detection   | Haiku   | Haiku    | Sonnet  |
 * | Entity extraction  | Haiku   | Haiku    | Sonnet  |
 * | Filing/organizing  | Haiku   | Sonnet   | Sonnet  |
 * | Knowledge graph    | Haiku   | Sonnet   | Opus    |
 * | Backlog updates    | Haiku   | Sonnet   | Opus    |
 * | Interview questions| Sonnet  | Opus     | Opus    |
 * | Prose generation   | Sonnet  | Opus     | Opus    |
 * | Review/feedback    | Sonnet  | Opus     | Opus    |
 * | Final manuscript   | Opus    | Opus     | Opus    |
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
    knowledge_graph: HAIKU,
    backlog: HAIKU,
    interview: SONNET,
    prose: SONNET,
    review: SONNET,
    manuscript: OPUS,
  },
  standard: {
    intent_detection: HAIKU,
    entity_extraction: HAIKU,
    filing: SONNET,
    knowledge_graph: SONNET,
    backlog: SONNET,
    interview: OPUS,
    prose: OPUS,
    review: OPUS,
    manuscript: OPUS,
  },
  premium: {
    intent_detection: SONNET,
    entity_extraction: SONNET,
    filing: SONNET,
    knowledge_graph: OPUS,
    backlog: OPUS,
    interview: OPUS,
    prose: OPUS,
    review: OPUS,
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
