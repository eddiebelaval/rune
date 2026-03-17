// KnowledgeBaseService: Server-side CRUD for the hierarchical KB
// Uses service role client to bypass RLS for server operations

import { createServiceClient } from '../supabase'
import { inferFolderAndScope } from '../../types/folder-system'
import type {
  KnowledgeFile,
  CreateKBFileInput,
  UpdateKBFileInput,
  KBFileFilters,
  KBFileVersion,
} from '../../types/knowledge'

export class KnowledgeBaseService {
  /**
   * Create a new KB file with auto-inferred scope and folder
   */
  static async createFile(
    userId: string,
    input: CreateKBFileInput
  ): Promise<KnowledgeFile> {
    const supabase = createServiceClient()
    const inferred = inferFolderAndScope(input.file_type)

    const wordCount = input.content.split(/\s+/).filter(Boolean).length

    const { data, error } = await supabase
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
        metadata: { word_count: wordCount, ...input.metadata },
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
    const supabase = createServiceClient()

    let query = supabase
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
      query = query.or(
        `title.ilike.%${filters.search_query}%,content.ilike.%${filters.search_query}%`
      )
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw new Error(`Failed to get KB files: ${error.message}`)
    return (data ?? []) as KnowledgeFile[]
  }

  /**
   * Get a single KB file by ID
   */
  static async getFile(id: string): Promise<KnowledgeFile | null> {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('knowledge_files')
      .select('*')
      .eq('id', id)
      .eq('deleted', false)
      .single()

    if (error) return null
    return data as KnowledgeFile
  }

  /**
   * Update a KB file (partial update)
   */
  static async updateFile(
    id: string,
    updates: UpdateKBFileInput
  ): Promise<KnowledgeFile> {
    const supabase = createServiceClient()

    const updateData: Record<string, unknown> = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) {
      updateData.content = updates.content
      updateData.metadata = {
        word_count: updates.content.split(/\s+/).filter(Boolean).length,
        ...updates.metadata,
      }
    }
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active
    if (updates.scope !== undefined) updateData.scope = updates.scope
    if (updates.metadata !== undefined && !updates.content) {
      updateData.metadata = updates.metadata
    }

    const { data, error } = await supabase
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
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('knowledge_files')
      .update({ deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete KB file: ${error.message}`)
  }

  /**
   * Toggle is_active on a KB file
   */
  static async toggleActive(id: string): Promise<boolean> {
    const file = await this.getFile(id)
    if (!file) throw new Error('KB file not found')

    const newActive = !file.is_active
    await this.updateFile(id, { is_active: newActive })
    return newActive
  }

  /**
   * Get files by scope with inheritance (local sees global+regional+local)
   */
  static async getFilesByScope(
    userId: string,
    bookId: string,
    scope: string,
    activeOnly = false
  ): Promise<KnowledgeFile[]> {
    const supabase = createServiceClient()

    const scopeFilter = scope === 'global'
      ? ['global']
      : scope === 'regional'
        ? ['global', 'regional']
        : ['global', 'regional', 'local']

    let query = supabase
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
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('knowledge_file_versions')
      .select('*')
      .eq('knowledge_file_id', fileId)
      .order('version', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Failed to get version history: ${error.message}`)
    return (data ?? []) as KBFileVersion[]
  }
}
