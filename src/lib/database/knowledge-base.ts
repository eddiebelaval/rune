// KnowledgeBaseService: Server-side CRUD for the hierarchical KB
// Uses service role client to bypass RLS for server operations

import { createServiceClient } from '../supabase'
import { inferFolderAndScope } from '../../types/folder-system'
import { countWords, getScopeHierarchy } from '../text-utils'
import type {
  KnowledgeFile,
  KnowledgeScope,
  CreateKBFileInput,
  UpdateKBFileInput,
  KBFileFilters,
  KBFileVersion,
} from '../../types/knowledge'

// Lazy singleton service client — deferred to avoid build-time crash when env vars are missing
let _db: ReturnType<typeof createServiceClient> | null = null
function getDb() {
  if (!_db) _db = createServiceClient()
  return _db
}

/**
 * Sanitize search input to prevent PostgREST filter injection.
 * Strips characters that have meaning in PostgREST filter syntax.
 */
function sanitizeSearchQuery(query: string): string {
  return query.replace(/[,().'"%\\\\_]/g, '').trim()
}

export class KnowledgeBaseService {
  /**
   * Create a new KB file with auto-inferred scope and folder
   */
  static async createFile(
    userId: string,
    input: CreateKBFileInput
  ): Promise<KnowledgeFile> {
    const inferred = inferFolderAndScope(input.file_type)

    const { data, error } = await getDb()
      .from('knowledge_files')
      .insert({
        user_id: userId,
        book_id: input.book_id ?? null,
        title: input.title,
        content: input.content,
        file_type: input.file_type,
        scope: input.scope ?? inferred.scope,
        folder_type: input.folder_type ?? inferred.folder_type,
        folder_path: input.folder_path ?? inferred.folder_path,
        tags: input.tags ?? [],
        is_active: input.is_active ?? false,
        source_type: input.source_type ?? 'voice-transcription',
        metadata: { word_count: countWords(input.content), ...input.metadata },
        current_version: 1,
        current_semantic_version: '1.0.0',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create KB file: ${error.message}`)
    return data as KnowledgeFile
  }

  /**
   * Get KB files with filters
   */
  static async getFiles(
    userId: string,
    filters: KBFileFilters = {}
  ): Promise<KnowledgeFile[]> {
    let query = getDb()
      .from('knowledge_files')
      .select('*')
      .eq('user_id', userId)

    if (!filters.include_deleted) {
      query = query.eq('deleted', false)
    }
    if (filters.book_id) {
      query = query.eq('book_id', filters.book_id)
    }
    if (filters.scope) {
      query = query.eq('scope', filters.scope)
    }
    if (filters.file_type) {
      query = query.eq('file_type', filters.file_type)
    }
    if (filters.folder_type) {
      query = query.eq('folder_type', filters.folder_type)
    }
    if (filters.active_only) {
      query = query.eq('is_active', true)
    }
    if (filters.search_query) {
      const safe = sanitizeSearchQuery(filters.search_query)
      if (safe.length > 0) {
        query = query.or(
          `title.ilike.%${safe}%,content.ilike.%${safe}%`
        )
      }
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw new Error(`Failed to get KB files: ${error.message}`)
    return (data ?? []) as KnowledgeFile[]
  }

  /**
   * Get a single KB file by ID
   */
  static async getFile(id: string): Promise<KnowledgeFile | null> {
    const { data, error } = await getDb()
      .from('knowledge_files')
      .select('*')
      .eq('id', id)
      .eq('deleted', false)
      .single()

    if (error) return null
    return data as KnowledgeFile
  }

  /**
   * Update a KB file (partial update, merges metadata)
   */
  static async updateFile(
    id: string,
    updates: UpdateKBFileInput
  ): Promise<KnowledgeFile> {
    // Fetch existing to merge metadata (Supabase replaces entire jsonb column)
    const existing = updates.content !== undefined || updates.metadata !== undefined
      ? await this.getFile(id)
      : null

    const updateData: Record<string, unknown> = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) {
      updateData.content = updates.content
      updateData.metadata = {
        ...(existing?.metadata ?? {}),
        word_count: countWords(updates.content),
        ...updates.metadata,
      }
    } else if (updates.metadata !== undefined) {
      updateData.metadata = {
        ...(existing?.metadata ?? {}),
        ...updates.metadata,
      }
    }
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active
    if (updates.scope !== undefined) updateData.scope = updates.scope
    if (updates.file_type !== undefined) updateData.file_type = updates.file_type
    if (updates.folder_type !== undefined) updateData.folder_type = updates.folder_type
    if (updates.folder_path !== undefined) updateData.folder_path = updates.folder_path
    if (updates.source_type !== undefined) updateData.source_type = updates.source_type

    const { data, error } = await getDb()
      .from('knowledge_files')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update KB file: ${error.message}`)
    return data as KnowledgeFile
  }

  /**
   * Soft delete a KB file
   */
  static async deleteFile(id: string): Promise<void> {
    const { error } = await getDb()
      .from('knowledge_files')
      .update({ deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete KB file: ${error.message}`)
  }

  /**
   * Set is_active on a KB file (single UPDATE, no read needed)
   */
  static async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await getDb()
      .from('knowledge_files')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw new Error(`Failed to set active: ${error.message}`)
  }

  /**
   * Get files by scope with inheritance (local sees global+regional+local)
   */
  static async getFilesByScope(
    userId: string,
    bookId: string,
    scope: KnowledgeScope,
    activeOnly = false
  ): Promise<KnowledgeFile[]> {
    const scopeFilter = getScopeHierarchy(scope)

    let query = getDb()
      .from('knowledge_files')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('deleted', false)
      .in('scope', scopeFilter)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('folder_type').order('updated_at', { ascending: false })

    if (error) throw new Error(`Failed to get KB files by scope: ${error.message}`)
    return (data ?? []) as KnowledgeFile[]
  }

  /**
   * Get all active files for AI context (used by context inference)
   */
  static async getActiveFilesForChat(
    userId: string,
    bookId: string
  ): Promise<KnowledgeFile[]> {
    return this.getFilesByScope(userId, bookId, 'local', true)
  }

  /**
   * Get version history for a KB file
   */
  static async getVersionHistory(
    fileId: string,
    limit = 50
  ): Promise<KBFileVersion[]> {
    const { data, error } = await getDb()
      .from('knowledge_file_versions')
      .select('*')
      .eq('knowledge_file_id', fileId)
      .order('version', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Failed to get version history: ${error.message}`)
    return (data ?? []) as KBFileVersion[]
  }

  /**
   * Restore a previous version by creating a new version from its snapshot
   */
  static async restoreVersion(
    fileId: string,
    version: number
  ): Promise<boolean> {
    const { data, error } = await getDb().rpc('restore_kb_version', {
      p_knowledge_file_id: fileId,
      p_version: version,
    })

    if (error) throw new Error(`Failed to restore KB version: ${error.message}`)
    return Boolean(data)
  }
}
