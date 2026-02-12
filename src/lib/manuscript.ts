import { createServerClient } from '@/lib/supabase';
import type { WorkspaceFile } from '@/types/database';

// ---------------------------------------------------------------------------
// Manuscript Assembly — Fetches chapters from workspace and assembles them
// ---------------------------------------------------------------------------

export interface ManuscriptStats {
  wordCount: number;
  chapterCount: number;
  estimatedPages: number;
}

export interface AssembledManuscript {
  bookId: string;
  chapters: WorkspaceFile[];
  text: string;
  stats: ManuscriptStats;
}

const WORDS_PER_PAGE = 250;

/**
 * Count words in a string. Splits on whitespace and filters empties.
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Assemble a full manuscript from all chapter files in the drafts room.
 * Chapters are fetched from workspace_files where room='drafts' and
 * category='chapters', ordered by position ascending.
 */
export async function assembleManuscript(bookId: string): Promise<AssembledManuscript> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('workspace_files')
    .select('*')
    .eq('book_id', bookId)
    .eq('room', 'drafts')
    .eq('category', 'chapters')
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch chapters: ${error.message}`);
  }

  const chapters = (data ?? []) as WorkspaceFile[];

  // Concatenate all chapter content with double newlines between them
  const text = chapters
    .map((ch) => ch.content)
    .filter((content) => content.length > 0)
    .join('\n\n');

  const wordCount = countWords(text);

  return {
    bookId,
    chapters,
    text,
    stats: {
      wordCount,
      chapterCount: chapters.length,
      estimatedPages: Math.ceil(wordCount / WORDS_PER_PAGE),
    },
  };
}

/**
 * Fetch a single chapter by its position within the book's drafts.
 */
export async function getChapter(
  bookId: string,
  position: number,
): Promise<WorkspaceFile | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('workspace_files')
    .select('*')
    .eq('book_id', bookId)
    .eq('room', 'drafts')
    .eq('category', 'chapters')
    .eq('position', position)
    .single();

  if (error) {
    // PGRST116 = no rows found — not an error, just missing
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch chapter: ${error.message}`);
  }

  return data as WorkspaceFile;
}

/**
 * Reorder chapters by updating their positions to match the provided
 * array order. The first id in the array gets position 1, second gets 2, etc.
 */
export async function updateChapterOrder(
  bookId: string,
  chapterIds: string[],
): Promise<void> {
  const supabase = await createServerClient();

  // Update each chapter's position in sequence
  for (let i = 0; i < chapterIds.length; i++) {
    const { error } = await supabase
      .from('workspace_files')
      .update({ position: i + 1 })
      .eq('id', chapterIds[i])
      .eq('book_id', bookId)
      .eq('room', 'drafts')
      .eq('category', 'chapters');

    if (error) {
      throw new Error(`Failed to update chapter order for ${chapterIds[i]}: ${error.message}`);
    }
  }
}

/**
 * Compute manuscript statistics without fetching full content.
 * Uses the same query as assembleManuscript but only needs word counting.
 */
export async function getManuscriptStats(bookId: string): Promise<ManuscriptStats> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('workspace_files')
    .select('content')
    .eq('book_id', bookId)
    .eq('room', 'drafts')
    .eq('category', 'chapters')
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch manuscript stats: ${error.message}`);
  }

  const chapters = (data ?? []) as Pick<WorkspaceFile, 'content'>[];
  const allText = chapters.map((ch) => ch.content).join(' ');
  const wordCount = countWords(allText);

  return {
    wordCount,
    chapterCount: chapters.length,
    estimatedPages: Math.ceil(wordCount / WORDS_PER_PAGE),
  };
}
