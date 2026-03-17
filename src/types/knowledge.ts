// Rune Knowledge Base Types
// Hierarchical, scoped, versioned KB modeled after id8composer

export type KnowledgeScope = 'global' | 'regional' | 'local' | 'session'

export type KnowledgeFileType =
  | 'characters'
  | 'world-building'
  | 'story-planning'
  | 'chapter-outlines'
  | 'drafts'
  | 'sandbox'
  | 'research'
  | 'references'
  | 'lore'
  | 'relationships-map'
  | 'timeline'
  | 'character-journeys'
  | 'thematic-through-lines'

export type FolderType =
  | 'foundation'
  | 'strategy'
  | 'drafts'
  | 'sandbox'
  | 'production'
  | 'assets'

export type FileSourceType =
  | 'voice-transcription'
  | 'text-input'
  | 'ai-generated'
  | 'import'
  | 'interview'

export type PipelineStage = 'world-building' | 'story-writing' | 'publishing'

export interface KnowledgeFile {
  id: string
  user_id: string
  book_id: string | null

  title: string
  content: string

  file_type: KnowledgeFileType
  scope: KnowledgeScope
  folder_path: string
  folder_type: FolderType

  tags: string[]
  is_active: boolean
  metadata: KnowledgeFileMetadata
  source_type: FileSourceType

  current_version: number
  current_semantic_version: string

  linked_sandbox_id: string | null

  deleted: boolean
  deleted_at: string | null

  created_at: string
  updated_at: string
}

export interface KnowledgeFileMetadata {
  word_count?: number
  character_count?: number
  last_interview_session?: string
  extraction_confidence?: number
  [key: string]: unknown
}

export interface KBFileVersion {
  id: string
  knowledge_file_id: string
  version: number
  semantic_version: string
  content: string
  version_metadata: KBVersionMetadata
  kb_context: Record<string, unknown>
  created_at: string
  created_by: string | null
}

export interface KBVersionMetadata {
  change_type?: 'major' | 'minor' | 'patch'
  change_summary?: string
  confidence?: number
  restored_from_version?: number
  restored_at?: string
  migrated?: boolean
  [key: string]: unknown
}

export interface KBContextSnapshot {
  kb_files: KBFileReference[]
  total_kb_files: number
  used_kb_files: number
  captured_at: string
}

export interface KBFileReference {
  file_id: string
  file_type: KnowledgeFileType
  title: string
  scope: KnowledgeScope
  word_count: number
  relevance_score?: number
}

// Input types for creating/updating KB files
export interface CreateKBFileInput {
  book_id?: string
  title: string
  content: string
  file_type: KnowledgeFileType
  scope?: KnowledgeScope
  folder_type?: FolderType
  folder_path?: string
  tags?: string[]
  is_active?: boolean
  source_type?: FileSourceType
  metadata?: Partial<KnowledgeFileMetadata>
}

export interface UpdateKBFileInput {
  title?: string
  content?: string
  tags?: string[]
  is_active?: boolean
  metadata?: Partial<KnowledgeFileMetadata>
  scope?: KnowledgeScope
}

// Query filters
export interface KBFileFilters {
  book_id?: string
  scope?: KnowledgeScope
  file_type?: KnowledgeFileType
  folder_type?: FolderType
  active_only?: boolean
  include_deleted?: boolean
  search_query?: string
}
