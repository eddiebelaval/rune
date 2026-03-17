// Claude Function Calling Schema for KB Operations
// These tool definitions are passed to Claude API so Rune can CRUD the KB directly

import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const KB_TOOLS: Tool[] = [
  {
    name: 'create_kb_entry',
    description: 'Create a new knowledge base entry for the book. Use this when the user describes something new — a character, location, rule, event, or concept that should be remembered.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Title for the KB entry (e.g., character name, location name, concept name)',
        },
        content: {
          type: 'string',
          description: 'Structured markdown content for the entry. Organize with headers, bullet points, and clear sections.',
        },
        file_type: {
          type: 'string',
          enum: [
            'characters', 'world-building', 'lore', 'relationships-map',
            'timeline', 'story-planning', 'chapter-outlines',
            'character-journeys', 'thematic-through-lines', 'research', 'references',
          ],
          description: 'Type of KB entry to create',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization (e.g., ["protagonist", "human", "warrior"])',
        },
      },
      required: ['title', 'content', 'file_type'],
    },
  },
  {
    name: 'update_kb_entry',
    description: 'Update an existing knowledge base entry with new information. Use this when the user adds details to something already in the KB.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_id: {
          type: 'string',
          description: 'ID of the KB file to update',
        },
        content: {
          type: 'string',
          description: 'Updated content (replaces existing content)',
        },
        mode: {
          type: 'string',
          enum: ['append', 'replace'],
          description: 'Whether to append to or replace existing content. Default: append.',
        },
      },
      required: ['file_id', 'content'],
    },
  },
  {
    name: 'search_kb',
    description: 'Search the knowledge base for entries matching a query. Use this to check if something already exists before creating a new entry.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query (matches against titles and content)',
        },
        file_type: {
          type: 'string',
          enum: [
            'characters', 'world-building', 'lore', 'relationships-map',
            'timeline', 'story-planning', 'chapter-outlines',
            'character-journeys', 'thematic-through-lines', 'research', 'references',
          ],
          description: 'Optional: filter results to a specific type',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (default: 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_kb_entry',
    description: 'Get the full content of a specific KB entry by ID. Use this when you need to read a file before updating it.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_id: {
          type: 'string',
          description: 'ID of the KB file to retrieve',
        },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'list_kb_files',
    description: 'List all knowledge base files, optionally filtered by type or scope. Use this to see what exists in the KB.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_type: {
          type: 'string',
          enum: [
            'characters', 'world-building', 'lore', 'relationships-map',
            'timeline', 'story-planning', 'chapter-outlines',
            'character-journeys', 'thematic-through-lines', 'research', 'references',
          ],
          description: 'Optional: filter by type',
        },
        active_only: {
          type: 'boolean',
          description: 'Only return files active in chat context (default: false)',
        },
      },
      required: [],
    },
  },
]

export type KBToolName = 'create_kb_entry' | 'update_kb_entry' | 'search_kb' | 'get_kb_entry' | 'list_kb_files'
