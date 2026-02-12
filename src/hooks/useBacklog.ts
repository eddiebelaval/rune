'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { BacklogItem } from '@/types/database';

// ---------------------------------------------------------------------------
// useBacklog — Backlog items with Supabase Realtime
// ---------------------------------------------------------------------------

interface UseBacklogReturn {
  /** All open backlog items, sorted by priority descending. */
  items: BacklogItem[];
  /** The highest-priority open item, or null if no items. */
  nextItem: BacklogItem | null;
  /** Whether the initial fetch is in progress. */
  isLoading: boolean;
  /** Any error from fetching or realtime. */
  error: string | null;
}

export function useBacklog(bookId: string): UseBacklogReturn {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch open backlog items on mount
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('backlog_items')
        .select('*')
        .eq('book_id', bookId)
        .eq('status', 'open')
        .order('priority', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setItems((data ?? []) as BacklogItem[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch backlog items';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`backlog-${bookId}`)
      .on<BacklogItem>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'backlog_items',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const newItem = payload.new as BacklogItem;
          // Only add if it's an open item
          if (newItem.status === 'open') {
            setItems((prev) => {
              const updated = [...prev, newItem];
              updated.sort((a, b) => b.priority - a.priority);
              return updated;
            });
          }
        },
      )
      .on<BacklogItem>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'backlog_items',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const updated = payload.new as BacklogItem;
          if (updated.status !== 'open') {
            // Item was addressed or dismissed — remove from list
            setItems((prev) => prev.filter((i) => i.id !== updated.id));
          } else {
            // Item was updated but still open — replace in list
            setItems((prev) => {
              const next = prev.map((i) => (i.id === updated.id ? updated : i));
              next.sort((a, b) => b.priority - a.priority);
              return next;
            });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'backlog_items',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setItems((prev) => prev.filter((i) => i.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookId]);

  const nextItem = items.length > 0 ? items[0] : null;

  return {
    items,
    nextItem,
    isLoading,
    error,
  };
}
