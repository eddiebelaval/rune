// Sam Concierge Tool Handlers — Execute platform CRUD from Claude tool_use

import { createServiceClient } from '../supabase'
import { initializeWorkspace, createWorkspaceFile, updateWorkspaceFile } from '../workspace'
import { getBacklogItems, addressItem, dismissItem } from '../backlog'
import { assembleManuscript } from '../manuscript'
import { getWorkspaceStructure } from '../workspace'
import { parseText } from '../import/parser'
import { routeImport } from '../import/router'
import { isValidUUID } from '../validation'
import type { Room, BookType } from '@/types/database'
import type { ConciergeToolName } from './concierge-tools-schema'

export interface ToolCallResult {
  success: boolean
  data?: unknown
  error?: string
}

// Lazy service client
let _db: ReturnType<typeof createServiceClient> | null = null
function getDb(): ReturnType<typeof createServiceClient> {
  if (!_db) _db = createServiceClient()
  return _db
}

/** Extract a consistent error message from an unknown catch value. */
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export async function executeConciergetool(
  toolName: ConciergeToolName,
  args: Record<string, unknown>,
  userId: string,
  bookId: string,
): Promise<ToolCallResult> {
  switch (toolName) {
    case 'create_book': return handleCreateBook(args, userId)
    case 'update_book': return handleUpdateBook(args, userId)
    case 'list_books': return handleListBooks(userId)
    case 'advance_stage': return handleAdvanceStage(args, userId)
    case 'create_session': return handleCreateSession(args, userId)
    case 'create_workspace_file': return handleCreateWorkspaceFile(args, userId)
    case 'update_workspace_file': return handleUpdateWorkspaceFile(args, userId)
    case 'address_backlog_item': return handleBacklogAction(args, userId, 'address')
    case 'dismiss_backlog_item': return handleBacklogAction(args, userId, 'dismiss')
    case 'list_backlog': return handleListBacklog(args, userId)
    case 'get_manuscript': return handleGetManuscript(args, userId)
    case 'get_profile': return handleGetProfile(userId)
    case 'update_profile': return handleUpdateProfile(args, userId)
    case 'import_text': return handleImportText(args, userId, bookId)
    case 'export_book': return handleExportBook(args, userId)
    default:
      return { success: false, error: `Unknown concierge tool: ${toolName}` }
  }
}

// ── Books ────────────────────────────────────────────────

async function handleCreateBook(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const { data, error } = await getDb()
      .from('books')
      .insert({
        user_id: userId,
        title: args.title as string,
        book_type: args.book_type as string,
        quality_level: (args.quality_level as string) ?? 'standard',
        status: 'active',
        pipeline_stage: 'world-building',
      })
      .select()
      .single()

    if (error) throw error

    // Initialize workspace folders
    await initializeWorkspace(data.id, data.book_type)

    return {
      success: true,
      data: {
        id: data.id,
        title: data.title,
        book_type: data.book_type,
        message: `Created "${data.title}" (${data.book_type}). Ready for world-building.`,
      },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to create book') }
  }
}

async function handleUpdateBook(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const bookId = args.book_id as string
    if (!isValidUUID(bookId)) return { success: false, error: 'Invalid book_id' }

    const updates: Record<string, unknown> = {}
    if (args.title) updates.title = args.title
    if (args.status) updates.status = args.status
    if (args.quality_level) updates.quality_level = args.quality_level

    const { data, error } = await getDb()
      .from('books')
      .update(updates)
      .eq('id', bookId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: { id: data.id, title: data.title, status: data.status, message: `Updated "${data.title}"` },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update book') }
  }
}

async function handleListBooks(userId: string): Promise<ToolCallResult> {
  try {
    const { data, error } = await getDb()
      .from('books')
      .select('id, title, book_type, status, quality_level, pipeline_stage, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: { books: data, count: data?.length ?? 0 },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to list books') }
  }
}

// ── Pipeline Stage ───────────────────────────────────────

async function handleAdvanceStage(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const bookId = args.book_id as string
    const targetStage = args.target_stage as string

    if (!isValidUUID(bookId)) return { success: false, error: 'Invalid book_id' }

    const { data, error } = await getDb()
      .from('books')
      .update({ pipeline_stage: targetStage })
      .eq('id', bookId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    const STAGE_META: Record<string, { label: string; cue: string }> = {
      'world-building': { label: 'The Workshop', cue: 'Building the world.' },
      'story-writing': { label: 'The Study', cue: 'Time to write.' },
      'publishing': { label: 'The Press', cue: 'Time to publish.' },
    }

    const meta = STAGE_META[targetStage]
    const label = meta?.label ?? targetStage
    const cue = meta?.cue ?? ''

    return {
      success: true,
      data: {
        id: data.id,
        stage: targetStage,
        message: `Moved to ${label}. ${cue}`,
      },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to advance stage') }
  }
}

// ── Sessions ─────────────────────────────────────────────

async function handleCreateSession(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const bookId = args.book_id as string
    if (!isValidUUID(bookId)) return { success: false, error: 'Invalid book_id' }

    // Verify ownership
    const { data: book } = await getDb()
      .from('books')
      .select('id')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single()

    if (!book) return { success: false, error: 'Book not found' }

    // Get next session number
    const { data: latest } = await getDb()
      .from('sessions')
      .select('session_number')
      .eq('book_id', bookId)
      .order('session_number', { ascending: false })
      .limit(1)
      .single()

    const nextNumber = (latest?.session_number ?? 0) + 1

    const { data, error } = await getDb()
      .from('sessions')
      .insert({ book_id: bookId, session_number: nextNumber })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: { id: data.id, session_number: nextNumber, message: `Started session ${nextNumber}.` },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to create session') }
  }
}

// ── Workspace Files ──────────────────────────────────────

async function handleCreateWorkspaceFile(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const bookId = args.book_id as string
    if (!isValidUUID(bookId)) return { success: false, error: 'Invalid book_id' }

    // Verify ownership
    const { data: book } = await getDb()
      .from('books')
      .select('id')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single()

    if (!book) return { success: false, error: 'Book not found' }

    const file = await createWorkspaceFile(
      bookId,
      args.room as Room,
      args.category as string,
      args.title as string,
      args.content as string,
    )

    return {
      success: true,
      data: { id: file.id, title: file.title, room: file.room, message: `Created "${file.title}" in ${file.room}/${file.category}` },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to create file') }
  }
}

async function handleUpdateWorkspaceFile(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const fileId = args.file_id as string
    if (!isValidUUID(fileId)) return { success: false, error: 'Invalid file_id' }

    // Verify ownership through book
    const { data: file } = await getDb()
      .from('workspace_files')
      .select('id, book_id')
      .eq('id', fileId)
      .single()

    if (!file) return { success: false, error: 'File not found' }

    const { data: book } = await getDb()
      .from('books')
      .select('id')
      .eq('id', file.book_id)
      .eq('user_id', userId)
      .single()

    if (!book) return { success: false, error: 'File not found' }

    const updates: Record<string, unknown> = { content: args.content }
    if (args.title) updates.title = args.title

    const updated = await updateWorkspaceFile(fileId, updates)

    return {
      success: true,
      data: { id: updated.id, title: updated.title, message: `Updated "${updated.title}"` },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update file') }
  }
}

// ── Backlog ──────────────────────────────────────────────

async function handleBacklogAction(
  args: Record<string, unknown>,
  userId: string,
  action: 'address' | 'dismiss',
): Promise<ToolCallResult> {
  try {
    const itemId = args.item_id as string
    if (!isValidUUID(itemId)) return { success: false, error: 'Invalid item_id' }

    // Verify ownership through the item's parent book
    const { data: backlogItem } = await getDb()
      .from('backlog_items')
      .select('id, book_id')
      .eq('id', itemId)
      .single()

    if (!backlogItem) return { success: false, error: 'Item not found' }

    const { data: book } = await getDb()
      .from('books')
      .select('id')
      .eq('id', backlogItem.book_id)
      .eq('user_id', userId)
      .single()

    if (!book) return { success: false, error: 'Item not found' }

    const handler = action === 'address' ? addressItem : dismissItem
    const verb = action === 'address' ? 'Resolved' : 'Dismissed'

    const item = await handler(itemId)
    return {
      success: true,
      data: { id: item.id, message: `${verb}: "${item.content.substring(0, 60)}..."` },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, `Failed to ${action} item`) }
  }
}

async function handleListBacklog(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const bookId = args.book_id as string
    if (!isValidUUID(bookId)) return { success: false, error: 'Invalid book_id' }

    // Verify ownership
    const { data: book } = await getDb()
      .from('books')
      .select('id')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single()

    if (!book) return { success: false, error: 'Book not found' }

    const items = await getBacklogItems(bookId, 'open')
    return {
      success: true,
      data: {
        items: items.map((i) => ({
          id: i.id,
          type: i.item_type,
          content: i.content,
          priority: i.priority,
        })),
        count: items.length,
      },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to list backlog') }
  }
}

// ── Manuscript ───────────────────────────────────────────

async function handleGetManuscript(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const bookId = args.book_id as string
    if (!isValidUUID(bookId)) return { success: false, error: 'Invalid book_id' }

    // Verify ownership
    const { data: book } = await getDb()
      .from('books')
      .select('id, title')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single()

    if (!book) return { success: false, error: 'Book not found' }

    const manuscript = await assembleManuscript(bookId)

    return {
      success: true,
      data: {
        title: book.title,
        chapters: manuscript.chapters.length,
        word_count: manuscript.stats.wordCount,
        message: `"${book.title}" — ${manuscript.chapters.length} chapters, ${manuscript.stats.wordCount} words`,
      },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to get manuscript') }
  }
}

// ── Profile ──────────────────────────────────────────────

async function handleGetProfile(userId: string): Promise<ToolCallResult> {
  try {
    const { data, error } = await getDb()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return {
      success: true,
      data: {
        display_name: data.display_name,
        theme: data.theme,
        preferences: data.preferences,
        created_at: data.created_at,
      },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to get profile') }
  }
}

async function handleUpdateProfile(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const updates: Record<string, unknown> = {}
    if (args.display_name) updates.display_name = args.display_name
    if (args.theme) updates.theme = args.theme
    if (args.default_quality_level) {
      // Merge into existing preferences to avoid clobbering other keys
      const { data: existing } = await getDb()
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single()
      updates.preferences = {
        ...((existing?.preferences as Record<string, unknown>) ?? {}),
        default_quality_level: args.default_quality_level,
      }
    }

    const { data, error } = await getDb()
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: { display_name: data.display_name, theme: data.theme, message: 'Profile updated.' },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update profile') }
  }
}

// ── Import / Export ─────────────────────────────────────────

async function handleImportText(
  args: Record<string, unknown>,
  userId: string,
  bookId: string,
): Promise<ToolCallResult> {
  try {
    const targetBookId = (args.book_id as string) || bookId
    if (!isValidUUID(targetBookId)) return { success: false, error: 'Invalid book_id' }

    const text = args.text as string
    if (!text || text.trim().length === 0) return { success: false, error: 'No text provided' }

    // Verify ownership and get book type
    const { data: book } = await getDb()
      .from('books')
      .select('id, book_type')
      .eq('id', targetBookId)
      .eq('user_id', userId)
      .single()

    if (!book) return { success: false, error: 'Book not found' }

    const title = (args.title as string) ?? 'Imported Content'
    const doc = parseText(text, title)
    const result = await routeImport(doc, targetBookId, book.book_type as BookType, userId)

    const routedCount = result.routed.length
    const fallbackCount = result.fallback.length
    const kbCount = [...result.routed, ...result.fallback].filter((r) => r.kbEntryCreated).length

    return {
      success: true,
      data: {
        totalSections: result.totalSections,
        routed: routedCount,
        fallback: fallbackCount,
        kbEntriesCreated: kbCount,
        wordCount: result.wordCount,
        sections: result.routed.map((r) => ({
          title: r.title,
          room: r.room,
          category: r.category,
        })),
        message: `Imported ${result.wordCount} words across ${result.totalSections} sections. ${routedCount} classified, ${fallbackCount} to raw-sessions${kbCount > 0 ? `, ${kbCount} KB entries created` : ''}.`,
      },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to import text') }
  }
}

async function handleExportBook(
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolCallResult> {
  try {
    const bookId = args.book_id as string
    if (!isValidUUID(bookId)) return { success: false, error: 'Invalid book_id' }

    // Verify ownership
    const { data: book } = await getDb()
      .from('books')
      .select('id, title, book_type')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single()

    if (!book) return { success: false, error: 'Book not found' }

    const format = (args.format as string) ?? 'full'

    // For concierge tool calls, return a summary (actual file download goes through /api/export)
    if (format === 'manuscript') {
      const manuscript = await assembleManuscript(bookId)
      return {
        success: true,
        data: {
          format: 'manuscript',
          chapters: manuscript.stats.chapterCount,
          wordCount: manuscript.stats.wordCount,
          pages: manuscript.stats.estimatedPages,
          downloadUrl: `/api/export?book_id=${bookId}&format=manuscript`,
          message: `"${book.title}" manuscript: ${manuscript.stats.chapterCount} chapters, ${manuscript.stats.wordCount} words (~${manuscript.stats.estimatedPages} pages). Download from the export link.`,
        },
      }
    }

    if (format === 'workspace') {
      const structure = await getWorkspaceStructure(bookId)
      const fileCount = Object.values(structure.rooms).reduce(
        (sum, cats) => sum + Object.values(cats).reduce((s, files) => s + files.length, 0), 0,
      )
      return {
        success: true,
        data: {
          format: 'workspace',
          fileCount,
          downloadUrl: `/api/export?book_id=${bookId}&format=workspace`,
          message: `"${book.title}" workspace: ${fileCount} files across 3 rooms. Download from the export link.`,
        },
      }
    }

    // Default: full export summary
    const manuscript = await assembleManuscript(bookId)
    const structure = await getWorkspaceStructure(bookId)
    const fileCount = Object.values(structure.rooms).reduce(
      (sum, cats) => sum + Object.values(cats).reduce((s, files) => s + files.length, 0), 0,
    )

    return {
      success: true,
      data: {
        format: 'full',
        title: book.title,
        chapters: manuscript.stats.chapterCount,
        wordCount: manuscript.stats.wordCount,
        workspaceFiles: fileCount,
        downloadUrl: `/api/export?book_id=${bookId}&format=full`,
        message: `Full backup of "${book.title}": ${manuscript.stats.chapterCount} chapters, ${manuscript.stats.wordCount} words, ${fileCount} workspace files. Download from the export link.`,
      },
    }
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to export book') }
  }
}
