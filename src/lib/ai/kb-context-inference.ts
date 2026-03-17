// KB Context Inference: Smart selection of relevant KB files per conversation
// Applies scope inheritance, relevance scoring, and context window limits

import { KnowledgeBaseService } from '../database/knowledge-base'
import type { KnowledgeFile, KBContextSnapshot, KBFileReference } from '../../types/knowledge'

const APPROX_CHARS_PER_TOKEN = 4
const MAX_CONTEXT_TOKENS = 30_000

interface ScoredFile {
  file: KnowledgeFile
  score: number
}

/**
 * Select the most relevant KB files for a conversation
 */
export async function selectRelevantFiles(
  userId: string,
  bookId: string,
  options: {
    maxFiles?: number
    conversationContext?: string
    currentScope?: string
  } = {}
): Promise<KnowledgeFile[]> {
  const maxFiles = options.maxFiles ?? 10
  const scope = options.currentScope ?? 'local'

  const allFiles = await KnowledgeBaseService.getFilesByScope(userId, bookId, scope)

  if (allFiles.length === 0) return []

  // Score each file
  const scored: ScoredFile[] = allFiles.map((file) => ({
    file,
    score: calculateRelevanceScore(file, options.conversationContext),
  }))

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Apply active-first preference
  const activeFiles = scored.filter((s) => s.file.is_active)
  const inactiveFiles = scored.filter((s) => !s.file.is_active)
  const ordered = [...activeFiles, ...inactiveFiles]

  // Token-budget aware selection
  let tokenBudget = MAX_CONTEXT_TOKENS
  const selected: KnowledgeFile[] = []

  for (const { file } of ordered) {
    if (selected.length >= maxFiles) break

    const fileTokens = estimateTokens(file.content)
    if (tokenBudget - fileTokens < 0 && selected.length > 0) continue

    selected.push(file)
    tokenBudget -= fileTokens
  }

  return selected
}

/**
 * Calculate relevance score for a KB file
 */
function calculateRelevanceScore(
  file: KnowledgeFile,
  conversationContext?: string
): number {
  let score = 0

  // Active files get a boost
  if (file.is_active) score += 50

  // Foundation files are always important
  if (file.folder_type === 'foundation') score += 30
  if (file.folder_type === 'strategy') score += 20
  if (file.folder_type === 'assets') score += 5

  // Recency boost (files updated in last 24h get +20)
  const hoursSinceUpdate = (Date.now() - new Date(file.updated_at).getTime()) / (1000 * 60 * 60)
  if (hoursSinceUpdate < 24) score += 20
  else if (hoursSinceUpdate < 168) score += 10

  // Content richness (more content = more useful context)
  const wordCount = file.content.split(/\s+/).filter(Boolean).length
  if (wordCount > 200) score += 15
  else if (wordCount > 50) score += 5

  // Keyword overlap with conversation context
  if (conversationContext) {
    const contextWords = new Set(
      conversationContext.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    )
    const fileWords = file.content.toLowerCase().split(/\s+/)
    const overlap = fileWords.filter((w) => contextWords.has(w)).length
    score += Math.min(overlap * 2, 30)
  }

  // Type priority (characters and world-building are always relevant)
  const typePriority: Record<string, number> = {
    'characters': 15,
    'world-building': 15,
    'lore': 10,
    'relationships-map': 10,
    'story-planning': 8,
    'timeline': 8,
    'chapter-outlines': 5,
  }
  score += typePriority[file.file_type] ?? 0

  return score
}

/**
 * Build a system prompt section from selected KB files
 */
export function buildKBSystemContext(files: KnowledgeFile[]): string {
  if (files.length === 0) return ''

  const sections: string[] = ['<knowledge-base>']

  // Group by folder type for clean organization
  const grouped = new Map<string, KnowledgeFile[]>()
  for (const file of files) {
    const group = grouped.get(file.folder_type) ?? []
    group.push(file)
    grouped.set(file.folder_type, group)
  }

  const layerOrder = ['foundation', 'strategy', 'drafts', 'sandbox', 'assets']
  for (const layer of layerOrder) {
    const layerFiles = grouped.get(layer)
    if (!layerFiles) continue

    sections.push(`\n## ${layer.toUpperCase()}`)
    for (const file of layerFiles) {
      sections.push(`\n### ${file.title} [${file.file_type}] (v${file.current_semantic_version})`)
      sections.push(file.content)
    }
  }

  sections.push('\n</knowledge-base>')
  return sections.join('\n')
}

/**
 * Create a snapshot of the current KB context for version tracking
 */
export function createContextSnapshot(files: KnowledgeFile[]): KBContextSnapshot {
  return {
    kb_files: files.map((f): KBFileReference => ({
      file_id: f.id,
      file_type: f.file_type,
      title: f.title,
      scope: f.scope,
      word_count: f.content.split(/\s+/).filter(Boolean).length,
    })),
    total_kb_files: files.length,
    used_kb_files: files.filter((f) => f.is_active).length,
    captured_at: new Date().toISOString(),
  }
}

/**
 * Estimate token count from content
 */
export function estimateTokens(content: string): number {
  return Math.ceil(content.length / APPROX_CHARS_PER_TOKEN)
}
