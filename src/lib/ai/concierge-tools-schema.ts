// Sam Concierge Tools — Full platform CRUD via Claude function calling
// These give Sam the ability to manage everything on the platform,
// just like Ava manages Parallax.

import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const CONCIERGE_TOOLS: Tool[] = [
  // ── Books ──────────────────────────────────────────────
  {
    name: 'create_book',
    description: 'Create a new book project. Use when the user says they want to start a new book, story, or writing project.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Title for the new book' },
        book_type: {
          type: 'string',
          enum: ['memoir', 'fiction', 'nonfiction'],
          description: 'Type of book',
        },
        quality_level: {
          type: 'string',
          enum: ['economy', 'standard', 'premium'],
          description: 'AI quality tier (default: standard)',
        },
      },
      required: ['title', 'book_type'],
    },
  },
  {
    name: 'update_book',
    description: 'Update a book\'s title, status, or quality level. Use when the user wants to rename their book, pause/resume it, or change the AI quality.',
    input_schema: {
      type: 'object' as const,
      properties: {
        book_id: { type: 'string', description: 'ID of the book to update' },
        title: { type: 'string', description: 'New title' },
        status: { type: 'string', enum: ['active', 'paused', 'completed'], description: 'New status' },
        quality_level: { type: 'string', enum: ['economy', 'standard', 'premium'], description: 'New quality tier' },
      },
      required: ['book_id'],
    },
  },
  {
    name: 'list_books',
    description: 'List all of the user\'s books. Use when they ask what books they have or want to switch projects.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },

  // ── Pipeline Stage ─────────────────────────────────────
  {
    name: 'advance_stage',
    description: 'Move a book to the next pipeline stage: world-building -> story-writing -> publishing. Use when the user says they\'re ready to start writing, or ready to publish.',
    input_schema: {
      type: 'object' as const,
      properties: {
        book_id: { type: 'string', description: 'ID of the book' },
        target_stage: {
          type: 'string',
          enum: ['world-building', 'story-writing', 'publishing'],
          description: 'Stage to move to',
        },
      },
      required: ['book_id', 'target_stage'],
    },
  },

  // ── Sessions ───────────────────────────────────────────
  {
    name: 'create_session',
    description: 'Start a new conversation session for a book. Use when the user wants a fresh session.',
    input_schema: {
      type: 'object' as const,
      properties: {
        book_id: { type: 'string', description: 'ID of the book' },
      },
      required: ['book_id'],
    },
  },

  // ── Workspace Files ────────────────────────────────────
  {
    name: 'create_workspace_file',
    description: 'Create a file in the workspace (brainstorm, drafts, or publish room). Use when drafting a chapter, saving a brainstorm note, or creating an outline.',
    input_schema: {
      type: 'object' as const,
      properties: {
        book_id: { type: 'string', description: 'ID of the book' },
        room: { type: 'string', enum: ['brainstorm', 'drafts', 'publish'], description: 'Which room' },
        category: { type: 'string', description: 'Category within the room (e.g., "chapters", "outline", "notes")' },
        title: { type: 'string', description: 'File title' },
        content: { type: 'string', description: 'File content (markdown)' },
      },
      required: ['book_id', 'room', 'category', 'title', 'content'],
    },
  },
  {
    name: 'update_workspace_file',
    description: 'Update an existing workspace file\'s content. Use when revising a draft, updating an outline, or editing notes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_id: { type: 'string', description: 'ID of the workspace file' },
        content: { type: 'string', description: 'New content' },
        title: { type: 'string', description: 'New title (optional)' },
      },
      required: ['file_id', 'content'],
    },
  },

  // ── Backlog ────────────────────────────────────────────
  {
    name: 'address_backlog_item',
    description: 'Mark a backlog item as addressed (resolved). Use when a question has been answered, a contradiction resolved, or a gap filled.',
    input_schema: {
      type: 'object' as const,
      properties: {
        item_id: { type: 'string', description: 'ID of the backlog item' },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'dismiss_backlog_item',
    description: 'Dismiss a backlog item (not relevant). Use when the user decides a flagged issue doesn\'t matter.',
    input_schema: {
      type: 'object' as const,
      properties: {
        item_id: { type: 'string', description: 'ID of the backlog item' },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'list_backlog',
    description: 'List open backlog items for a book. Use when the user asks what needs attention, what questions are open, or what to work on next.',
    input_schema: {
      type: 'object' as const,
      properties: {
        book_id: { type: 'string', description: 'ID of the book' },
      },
      required: ['book_id'],
    },
  },

  // ── Manuscript ─────────────────────────────────────────
  {
    name: 'get_manuscript',
    description: 'Get the assembled manuscript for a book. Use when the user wants to see their full manuscript or check progress.',
    input_schema: {
      type: 'object' as const,
      properties: {
        book_id: { type: 'string', description: 'ID of the book' },
      },
      required: ['book_id'],
    },
  },

  // ── Profile ────────────────────────────────────────────
  {
    name: 'get_profile',
    description: 'Get the user\'s profile information. Use when the user asks about their account or settings.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'update_profile',
    description: 'Update the user\'s profile (display name, theme, preferences). Use when the user wants to change their name, switch to dark mode, or update settings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        display_name: { type: 'string', description: 'New display name' },
        theme: { type: 'string', enum: ['light', 'dark', 'system'], description: 'Theme preference' },
        default_quality_level: { type: 'string', enum: ['economy', 'standard', 'premium'], description: 'Default AI quality' },
      },
      required: [],
    },
  },
]

export type ConciergeToolName = (typeof CONCIERGE_TOOLS)[number]['name']

/** Set of all concierge tool names — used for dispatch routing. */
export const CONCIERGE_TOOL_NAMES: ReadonlySet<string> = new Set(
  CONCIERGE_TOOLS.map((t) => t.name),
)
