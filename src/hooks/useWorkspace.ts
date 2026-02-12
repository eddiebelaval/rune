'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { Room, WorkspaceFile } from '@/types/database';

// ---------------------------------------------------------------------------
// useWorkspace — Workspace structure with Supabase Realtime
// ---------------------------------------------------------------------------

/** Structured workspace tree: room -> category -> files[] */
export type WorkspaceRooms = Record<Room, Record<string, WorkspaceFile[]>>;

interface UseWorkspaceReturn {
  /** Structured tree of rooms -> categories -> files. */
  rooms: WorkspaceRooms;
  /** Flat list of all workspace files. */
  files: WorkspaceFile[];
  /** Whether the initial fetch is in progress. */
  isLoading: boolean;
  /** Any error from fetching or realtime. */
  error: string | null;
}

function buildRoomTree(files: WorkspaceFile[]): WorkspaceRooms {
  const rooms: WorkspaceRooms = {
    brainstorm: {},
    drafts: {},
    publish: {},
  };

  for (const file of files) {
    const room = rooms[file.room];
    if (!room[file.category]) {
      room[file.category] = [];
    }
    room[file.category].push(file);
  }

  // Sort files within each category by position
  for (const room of Object.values(rooms)) {
    for (const category of Object.keys(room)) {
      room[category].sort((a, b) => a.position - b.position);
    }
  }

  return rooms;
}

export function useWorkspace(bookId: string): UseWorkspaceReturn {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workspace files on mount
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('workspace_files')
        .select('*')
        .eq('book_id', bookId)
        .order('position', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setFiles((data ?? []) as WorkspaceFile[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workspace files';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`workspace-${bookId}`)
      .on<WorkspaceFile>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_files',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const newFile = payload.new as WorkspaceFile;
          setFiles((prev) => [...prev, newFile]);
        },
      )
      .on<WorkspaceFile>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspace_files',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const updated = payload.new as WorkspaceFile;
          setFiles((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f)),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'workspace_files',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setFiles((prev) => prev.filter((f) => f.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookId]);

  const rooms = buildRoomTree(files);

  return {
    rooms,
    files,
    isLoading,
    error,
  };
}
