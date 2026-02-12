/**
 * Prompt assembly — builds full system prompts from composable parts.
 *
 * Each conversation mode (guided, freeform, review) has its own persona.
 * This module selects the right persona and assembles context into a
 * complete system prompt ready for the Claude API.
 */

import type { BookType, BacklogItem, WorkspaceFile, SessionMode } from '@/types/database';
import { buildInterviewerPrompt, type InterviewerContext } from './interviewer';
import { buildScribePrompt, type ScribeContext } from './scribe';
import { buildEditorPrompt, type EditorContext } from './editor';

// Re-export sub-modules for direct access
export { buildInterviewerPrompt, type InterviewerContext } from './interviewer';
export { buildScribePrompt, type ScribeContext } from './scribe';
export { buildEditorPrompt, type EditorContext } from './editor';
export {
  getBookCategories,
  getRoomCategories,
  describeWorkspaceStructure,
  getGenreGuidance,
  type RoomCategories,
} from './book-templates';

// ---------------------------------------------------------------------------
// Unified prompt context
// ---------------------------------------------------------------------------

export interface PromptContext {
  /** The conversation mode that determines which persona to use. */
  mode: SessionMode;
  /** The book type (memoir, fiction, nonfiction). */
  bookType: BookType;
  /** The book's working title. */
  bookTitle: string;
  /** Backlog items relevant to the current session. */
  backlogItems: BacklogItem[];
  /** The draft currently under review (review mode only). */
  currentDraft?: WorkspaceFile;
  /** Human-readable summary of known entities and relationships. */
  entitySummary?: string;
  /** Summary of recent session history for continuity. */
  sessionHistory?: string;
}

// ---------------------------------------------------------------------------
// Main assembly function
// ---------------------------------------------------------------------------

/**
 * Assemble the full system prompt for a conversation turn.
 *
 * Selects the right persona based on mode, injects book-specific context,
 * and returns a single string ready for `system` in the Claude API call.
 */
export function assemblePrompt(ctx: PromptContext): string {
  switch (ctx.mode) {
    case 'guided':
      return buildInterviewerPrompt({
        bookType: ctx.bookType,
        bookTitle: ctx.bookTitle,
        currentBacklogItems: ctx.backlogItems,
        entitySummary: ctx.entitySummary,
        sessionHistory: ctx.sessionHistory,
      } satisfies InterviewerContext);

    case 'freeform':
      return buildScribePrompt({
        bookType: ctx.bookType,
        bookTitle: ctx.bookTitle,
        entitySummary: ctx.entitySummary,
        sessionHistory: ctx.sessionHistory,
      } satisfies ScribeContext);

    case 'review':
      return buildEditorPrompt({
        bookType: ctx.bookType,
        bookTitle: ctx.bookTitle,
        currentDraft: ctx.currentDraft,
        reviewItems: ctx.backlogItems.filter(
          (item) => item.item_type === 'review' || item.item_type === 'contradiction'
        ),
        entitySummary: ctx.entitySummary,
        sessionHistory: ctx.sessionHistory,
      } satisfies EditorContext);
  }
}
