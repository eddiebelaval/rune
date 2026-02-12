/**
 * Book type templates — category structures for Rune's Three Rooms.
 *
 * Each book type (memoir, fiction, nonfiction) has its own set of categories
 * across the three workspace rooms (Brainstorm, Drafts, Publish).
 * These structures drive workspace file organization and prompt context.
 */

import type { BookType, Room } from '@/types/database';

// ---------------------------------------------------------------------------
// Category definitions per book type
// ---------------------------------------------------------------------------

export interface RoomCategories {
  brainstorm: string[];
  drafts: string[];
  publish: string[];
}

const MEMOIR_CATEGORIES: RoomCategories = {
  brainstorm: ['people', 'eras', 'places', 'emotions', 'artifacts', 'themes', 'raw-sessions'],
  drafts: ['outline', 'chapters', 'fragments', 'timeline', 'revision-notes'],
  publish: ['manuscript', 'synopsis', 'exports', 'targets'],
};

const FICTION_CATEGORIES: RoomCategories = {
  brainstorm: ['characters', 'world-bible', 'plot-threads', 'magic-systems', 'themes', 'raw-sessions'],
  drafts: ['outline', 'story-arc', 'chapters', 'scenes', 'revision-notes'],
  publish: ['manuscript', 'synopsis', 'exports', 'targets'],
};

const NONFICTION_CATEGORIES: RoomCategories = {
  brainstorm: ['concepts', 'frameworks', 'case-studies', 'arguments', 'research', 'raw-sessions'],
  drafts: ['outline', 'thesis', 'chapters', 'sections', 'revision-notes'],
  publish: ['manuscript', 'synopsis', 'exports', 'targets'],
};

const TEMPLATES: Record<BookType, RoomCategories> = {
  memoir: MEMOIR_CATEGORIES,
  fiction: FICTION_CATEGORIES,
  nonfiction: NONFICTION_CATEGORIES,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the room categories for a book type.
 */
export function getBookCategories(bookType: BookType): RoomCategories {
  return TEMPLATES[bookType];
}

/**
 * Get categories for a specific room within a book type.
 */
export function getRoomCategories(bookType: BookType, room: Room): string[] {
  return TEMPLATES[bookType][room];
}

/**
 * Build a human-readable description of the workspace structure
 * for inclusion in prompts. Helps the AI understand where to file things.
 */
export function describeWorkspaceStructure(bookType: BookType): string {
  const categories = TEMPLATES[bookType];
  const label = bookType.charAt(0).toUpperCase() + bookType.slice(1);

  const lines: string[] = [
    `Workspace structure for this ${label}:`,
    '',
    'BRAINSTORM (raw material, ideas, research):',
    ...categories.brainstorm.map((c) => `  - ${c}`),
    '',
    'DRAFTS (organized writing, outlines, chapters):',
    ...categories.drafts.map((c) => `  - ${c}`),
    '',
    'PUBLISH (final output, exports):',
    ...categories.publish.map((c) => `  - ${c}`),
  ];

  return lines.join('\n');
}

/**
 * Genre-specific writing guidance included in prompts.
 */
export function getGenreGuidance(bookType: BookType): string {
  switch (bookType) {
    case 'memoir':
      return [
        'This is a memoir. The author is writing about their own life.',
        'Focus on emotional truth over factual precision.',
        'Help the author uncover the meaning behind their experiences.',
        'Pay attention to people, places, eras, and recurring themes.',
        'Track timeline consistency — note when events seem out of order.',
        'Encourage sensory detail: what did it look like, smell like, feel like?',
      ].join('\n');

    case 'fiction':
      return [
        'This is a work of fiction. The author is building a story world.',
        'Track characters, their arcs, motivations, and relationships.',
        'Pay attention to world-building consistency (rules, geography, magic systems).',
        'Help the author find and develop plot threads.',
        'Note pacing — are scenes rushing or dragging?',
        'Encourage concrete scene-setting over abstract summary.',
      ].join('\n');

    case 'nonfiction':
      return [
        'This is a nonfiction book. The author is conveying ideas and arguments.',
        'Track the core thesis and supporting arguments.',
        'Help organize concepts into a logical structure.',
        'Note when claims need evidence or case studies.',
        'Watch for jargon — flag when the writing assumes too much knowledge.',
        'Encourage concrete examples and frameworks over abstract theory.',
      ].join('\n');
  }
}
