// KB Tool Handlers: Execute Claude tool_use calls against the KB
// Called by the tool executor when Claude invokes a KB tool

import { KnowledgeBaseService } from '../database/knowledge-base'
import { inferFolderAndScope } from '../../types/folder-system'
import type { KnowledgeFileType } from '../../types/knowledge'
import type { KBToolName } from './kb-tools-schema'

export interface ToolCallResult {
  success: boolean
  data?: unknown
  error?: string
}

/**
 * Route a tool call to the correct handler
 */
export async function executeKBTool(
  toolName: KBToolName,
  args: Record<string, unknown>,
  userId: string,
  bookId: string
): Promise<ToolCallResult> {
  switch (toolName) {
    case 'create_kb_entry':
      return handleCreateEntry(args, userId, bookId)
    case 'update_kb_entry':
      return handleUpdateEntry(args, userId)
    case 'search_kb':
      return handleSearchKB(args, userId, bookId)
    case 'get_kb_entry':
      return handleGetEntry(args)
    case 'list_kb_files':
      return handleListFiles(args, userId, bookId)
    default:
      return { success: false, error: `Unknown tool: ${toolName}` }
  }
}

async function handleCreateEntry(
  args: Record<string, unknown>,
  userId: string,
  bookId: string
): Promise<ToolCallResult> {
  try {
    const fileType = args.file_type as KnowledgeFileType
    const inferred = inferFolderAndScope(fileType)

    const file = await KnowledgeBaseService.createFile(userId, {
      book_id: bookId,
      title: args.title as string,
      content: args.content as string,
      file_type: fileType,
      scope: inferred.scope,
      folder_type: inferred.folder_type,
      folder_path: inferred.folder_path,
      tags: (args.tags as string[]) ?? [],
      is_active: true,
      source_type: 'ai-generated',
    })

    return {
      success: true,
      data: {
        id: file.id,
        title: file.title,
        file_type: file.file_type,
        scope: file.scope,
        folder_type: file.folder_type,
        message: `Created "${file.title}" in ${file.folder_type}/${file.file_type}`,
      },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create entry' }
  }
}

async function handleUpdateEntry(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolCallResult> {
  try {
    const fileId = args.file_id as string
    const mode = (args.mode as string) ?? 'append'

    const existing = await KnowledgeBaseService.getFile(fileId)
    if (!existing) return { success: false, error: 'KB file not found' }

    const newContent = mode === 'append'
      ? existing.content + '\n\n' + (args.content as string)
      : args.content as string

    const file = await KnowledgeBaseService.updateFile(fileId, {
      content: newContent,
    })

    return {
      success: true,
      data: {
        id: file.id,
        title: file.title,
        mode,
        message: `Updated "${file.title}" (${mode})`,
      },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update entry' }
  }
}

async function handleSearchKB(
  args: Record<string, unknown>,
  userId: string,
  bookId: string
): Promise<ToolCallResult> {
  try {
    const files = await KnowledgeBaseService.getFiles(userId, {
      book_id: bookId,
      file_type: args.file_type as KnowledgeFileType | undefined,
      search_query: args.query as string,
    })

    const limit = (args.limit as number) ?? 5
    const results = files.slice(0, limit).map((f) => ({
      id: f.id,
      title: f.title,
      file_type: f.file_type,
      scope: f.scope,
      preview: f.content.substring(0, 200),
      word_count: f.content.split(/\s+/).filter(Boolean).length,
    }))

    return {
      success: true,
      data: { results, total: files.length },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Search failed' }
  }
}

async function handleGetEntry(
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  try {
    const file = await KnowledgeBaseService.getFile(args.file_id as string)
    if (!file) return { success: false, error: 'KB file not found' }

    return {
      success: true,
      data: {
        id: file.id,
        title: file.title,
        file_type: file.file_type,
        scope: file.scope,
        content: file.content,
        version: file.current_semantic_version,
        tags: file.tags,
        updated_at: file.updated_at,
      },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to get entry' }
  }
}

async function handleListFiles(
  args: Record<string, unknown>,
  userId: string,
  bookId: string
): Promise<ToolCallResult> {
  try {
    const files = await KnowledgeBaseService.getFiles(userId, {
      book_id: bookId,
      file_type: args.file_type as KnowledgeFileType | undefined,
      active_only: (args.active_only as boolean) ?? false,
    })

    const results = files.map((f) => ({
      id: f.id,
      title: f.title,
      file_type: f.file_type,
      scope: f.scope,
      folder_type: f.folder_type,
      is_active: f.is_active,
      word_count: f.content.split(/\s+/).filter(Boolean).length,
      version: f.current_semantic_version,
    }))

    return {
      success: true,
      data: { files: results, total: results.length },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to list files' }
  }
}
