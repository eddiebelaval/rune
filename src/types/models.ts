/**
 * Model routing types for Rune's three-tier quality system.
 *
 * The user sets Economy / Standard / Premium once via the quality slider.
 * Rune routes every internal task to the appropriate Claude model automatically.
 */

// Re-export QualityLevel from database types for consistency
export type { QualityLevel } from './database';

/**
 * Every discrete task that Rune performs behind the scenes.
 * Each task maps to a different model depending on the quality level.
 */
export type ModelTask =
  | 'intent_detection'
  | 'entity_extraction'
  | 'filing'
  | 'knowledge_graph'
  | 'backlog'
  | 'interview'
  | 'prose'
  | 'review'
  | 'manuscript';

/** Actual Claude model identifiers used in API calls. */
export type ModelId =
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-opus-4-6';

/**
 * The full routing table: quality level -> task -> model ID.
 * Populated in model-router.ts.
 */
export type ModelRouting = {
  [Q in import('./database').QualityLevel]: {
    [T in ModelTask]: ModelId;
  };
};

/** Configuration passed when creating a model client. */
export interface ModelConfig {
  /** The resolved Claude model ID for this request. */
  modelId: ModelId;
  /** The task being performed (for logging / observability). */
  task: ModelTask;
  /** The quality tier that resolved this model. */
  quality: import('./database').QualityLevel;
  /** Optional max tokens override. Defaults vary by task. */
  maxTokens?: number;
  /** Optional temperature override. Defaults vary by task. */
  temperature?: number;
}
