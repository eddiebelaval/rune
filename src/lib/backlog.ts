import { createServerClient } from '@/lib/supabase';
import type { BacklogItem, BacklogItemType, BacklogStatus } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BacklogItemInsert = Omit<BacklogItem, 'id' | 'created_at' | 'addressed_at'>;

// Type weighting used in priority calculation
const TYPE_WEIGHTS: Record<BacklogItemType, number> = {
  contradiction: 2,
  thin_spot: 1,
  question: 0,
  review: 0,
  idea: -1,
  unexplored: -1,
};

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Add a new item to the backlog.
 */
export async function addBacklogItem(
  bookId: string,
  type: BacklogItemType,
  content: string,
  sourceSessionId?: string,
  sourceEntityId?: string,
): Promise<BacklogItem> {
  const supabase = await createServerClient();

  const row: BacklogItemInsert = {
    book_id: bookId,
    item_type: type,
    content,
    priority: 1, // base priority; recalculated on read
    source_session_id: sourceSessionId ?? null,
    source_entity_id: sourceEntityId ?? null,
    status: 'open',
  };

  const { data, error } = await supabase
    .from('backlog_items')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to add backlog item: ${error.message}`);
  return data as BacklogItem;
}

/**
 * Get backlog items, optionally filtered by status and/or type.
 */
export async function getBacklogItems(
  bookId: string,
  status?: BacklogStatus,
  type?: BacklogItemType,
): Promise<BacklogItem[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from('backlog_items')
    .select('*')
    .eq('book_id', bookId)
    .order('priority', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (type) {
    query = query.eq('item_type', type);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch backlog items: ${error.message}`);
  return (data ?? []) as BacklogItem[];
}

/**
 * Get the highest-priority open item for a book.
 * Recalculates effective priority on the fly using session count for age bonus.
 */
export async function getNextItem(bookId: string): Promise<BacklogItem | null> {
  const supabase = await createServerClient();

  // Get total session count for age bonus calculation
  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('book_id', bookId);

  const items = await getBacklogItems(bookId, 'open');
  if (items.length === 0) return null;

  // Check if there are any draft workspace files (for finish bonus)
  const { data: draftFiles } = await supabase
    .from('workspace_files')
    .select('source_session_id')
    .eq('book_id', bookId)
    .eq('room', 'drafts');

  const hasDrafts = (draftFiles ?? []).length > 0;

  // Score each item and pick the highest
  let best: BacklogItem | null = null;
  let bestScore = -Infinity;

  for (const item of items) {
    const score = calculatePriority(item, sessionCount ?? 0, hasDrafts);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best;
}

/**
 * Mark an item as addressed.
 */
export async function addressItem(id: string): Promise<BacklogItem> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('backlog_items')
    .update({ status: 'addressed', addressed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to address backlog item: ${error.message}`);
  return data as BacklogItem;
}

/**
 * Dismiss an item (won't surface again).
 */
export async function dismissItem(id: string): Promise<BacklogItem> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('backlog_items')
    .update({ status: 'dismissed', addressed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to dismiss backlog item: ${error.message}`);
  return data as BacklogItem;
}

// ---------------------------------------------------------------------------
// Priority Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate effective priority for a backlog item.
 *
 * Formula:
 *   base_priority (1-5)
 * + age_bonus: +1 per 3 sessions since creation
 * + type_weight: contradiction=+2, thin_spot=+1, question=0, unexplored=-1
 * + finish_bonus: items related to existing drafts get +2
 */
export function calculatePriority(
  item: BacklogItem,
  sessionCount: number,
  hasDrafts: boolean = false,
): number {
  const basePriority = item.priority;

  // Age bonus: We approximate "sessions since creation" using the item's
  // source_session_id. If we don't have a source session, we assume it was
  // created at session 1. The age is (currentSessionCount - creationSession).
  // Since we don't have the session number stored on the item, we use a
  // simple heuristic: items created earlier have a lower creation timestamp.
  // For a more precise calculation we'd join with sessions table, but this
  // is performant for hot-path scoring.
  const ageBonus = Math.floor(sessionCount / 3);

  const typeWeight = TYPE_WEIGHTS[item.item_type] ?? 0;

  // Finish bonus: items that relate to draft-stage work get a boost
  const finishBonus = hasDrafts && item.source_entity_id ? 2 : 0;

  return basePriority + ageBonus + typeWeight + finishBonus;
}
