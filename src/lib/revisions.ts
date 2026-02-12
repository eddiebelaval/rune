/**
 * Revision tracking — before/after snapshots of workspace file edits.
 *
 * Every time Rune revises a workspace file, it captures the content before
 * and after the change so the author can review, compare, or revert.
 */

import { createServerClient } from '@/lib/supabase';
import type { Revision } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RevisionInsert = Omit<Revision, 'id' | 'created_at'>;

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Save a before/after snapshot of a workspace file revision.
 */
export async function createRevision(
  bookId: string,
  fileId: string,
  contentBefore: string,
  contentAfter: string,
  sessionId?: string,
  note?: string,
): Promise<Revision> {
  const supabase = await createServerClient();

  const row: RevisionInsert = {
    book_id: bookId,
    workspace_file_id: fileId,
    session_id: sessionId ?? null,
    content_before: contentBefore,
    content_after: contentAfter,
    revision_note: note ?? null,
  };

  const { data, error } = await supabase
    .from('revisions')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create revision: ${error.message}`);
  return data as Revision;
}

/**
 * Get revision history for a workspace file, newest first.
 */
export async function getRevisions(fileId: string): Promise<Revision[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('revisions')
    .select('*')
    .eq('workspace_file_id', fileId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch revisions: ${error.message}`);
  return (data ?? []) as Revision[];
}

/**
 * Get all revisions made during a specific session, newest first.
 */
export async function getRevisionsBySession(sessionId: string): Promise<Revision[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('revisions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch session revisions: ${error.message}`);
  return (data ?? []) as Revision[];
}
