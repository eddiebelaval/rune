// KB Zustand Store: Client-side state management for the knowledge base
// Syncs with Supabase Realtime for multi-tab consistency

import { create } from 'zustand'
import { createClient } from '../lib/supabase-browser'
import { getScopeHierarchy } from '../lib/text-utils'
import type {
  KnowledgeFile,
  KnowledgeScope,
  KnowledgeFileType,
  FolderType,
} from '../types/knowledge'

interface KBStoreState {
  files: KnowledgeFile[]
  loading: boolean
  error: string | null
  realtimeSubscribed: boolean
}

interface KBStoreActions {
  loadFiles: (bookId: string) => Promise<void>
  addFile: (file: KnowledgeFile) => void
  updateFileInStore: (id: string, updates: Partial<KnowledgeFile>) => void
  removeFile: (id: string) => void
  toggleActive: (id: string) => Promise<void>
  getActiveFiles: () => KnowledgeFile[]
  getByScope: (scope: KnowledgeScope) => KnowledgeFile[]
  getByType: (fileType: KnowledgeFileType) => KnowledgeFile[]
  getByFolder: (folderType: FolderType) => KnowledgeFile[]
  searchFiles: (query: string) => KnowledgeFile[]
  subscribeRealtime: (bookId: string) => () => void
}

export const useKBStore = create<KBStoreState & KBStoreActions>((set, get) => ({
  files: [],
  loading: false,
  error: null,
  realtimeSubscribed: false,

  loadFiles: async (bookId: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('book_id', bookId)
        .eq('deleted', false)
        .order('updated_at', { ascending: false })

      if (error) throw error
      set({ files: (data ?? []) as KnowledgeFile[], loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load KB files',
        loading: false,
      })
    }
  },

  addFile: (file: KnowledgeFile) => {
    set((state) => ({
      files: [file, ...state.files.filter((f) => f.id !== file.id)],
    }))
  },

  updateFileInStore: (id: string, updates: Partial<KnowledgeFile>) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }))
  },

  removeFile: (id: string) => {
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    }))
  },

  toggleActive: async (id: string) => {
    const file = get().files.find((f) => f.id === id)
    if (!file) return

    const newActive = !file.is_active
    get().updateFileInStore(id, { is_active: newActive })

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('knowledge_files')
        .update({ is_active: newActive })
        .eq('id', id)

      if (error) {
        get().updateFileInStore(id, { is_active: file.is_active })
        throw error
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to toggle active' })
    }
  },

  getActiveFiles: () => {
    return get().files.filter((f) => f.is_active)
  },

  getByScope: (scope: KnowledgeScope) => {
    const scopeFilter = getScopeHierarchy(scope)
    return get().files.filter((f) => (scopeFilter as string[]).includes(f.scope))
  },

  getByType: (fileType: KnowledgeFileType) => {
    return get().files.filter((f) => f.file_type === fileType)
  },

  getByFolder: (folderType: FolderType) => {
    return get().files.filter((f) => f.folder_type === folderType)
  },

  searchFiles: (query: string) => {
    const q = query.toLowerCase()
    return get().files.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.content.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
    )
  },

  subscribeRealtime: (bookId: string) => {
    const supabase = createClient()

    const channel = supabase
      .channel(`kb-${bookId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'knowledge_files',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const file = payload.new as KnowledgeFile
          if (!file.deleted) get().addFile(file)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'knowledge_files',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const file = payload.new as KnowledgeFile
          if (file.deleted) {
            get().removeFile(file.id)
          } else {
            get().updateFileInStore(file.id, file)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'knowledge_files',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const old = payload.old as { id: string }
          get().removeFile(old.id)
        }
      )
      .subscribe()

    set({ realtimeSubscribed: true })

    return () => {
      supabase.removeChannel(channel)
      set({ realtimeSubscribed: false })
    }
  },
}))
