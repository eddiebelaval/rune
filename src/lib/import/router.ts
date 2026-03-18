// Import Router — Uses Claude to classify imported sections and route them
// to the correct workspace room/category based on book type.
//
// This is the brain of the import pipeline. It takes the heuristically-detected
// sections from the parser and asks Claude to classify each one, then creates
// workspace files (and optionally KB entries) in the right locations.

import { createModelClient } from '@/lib/model-router'
import { createWorkspaceFile } from '@/lib/workspace'
import { KnowledgeBaseService } from '@/lib/database/knowledge-base'
import { inferFolderAndScope } from '@/types/folder-system'
import type { BookType, Room, QualityLevel } from '@/types/database'
import type { KnowledgeFileType } from '@/types/knowledge'
import type { DetectedSection, ParsedDocument } from './parser'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteResult {
  /** Total sections processed */
  totalSections: number
  /** Successfully routed sections */
  routed: RoutedSection[]
  /** Sections that failed to route (stored as raw-sessions fallback) */
  fallback: RoutedSection[]
  /** Total word count imported */
  wordCount: number
}

export interface RoutedSection {
  /** Original section title */
  originalTitle: string
  /** Title assigned after routing */
  title: string
  /** Where it was placed */
  room: Room
  /** Category within the room */
  category: string
  /** Word count of this section */
  wordCount: number
  /** ID of the created workspace file */
  workspaceFileId: string
  /** Whether a KB entry was also created */
  kbEntryCreated: boolean
}

interface ClassifiedSection {
  index: number
  title: string
  room: Room
  category: string
  kb_type: KnowledgeFileType | null
  reasoning: string
}

// ---------------------------------------------------------------------------
// Category reference for the classification prompt
// ---------------------------------------------------------------------------

const CATEGORY_REFERENCE: Record<BookType, string> = {
  memoir: `Brainstorm room: people, eras, places, emotions, artifacts, themes
Drafts room: outline, chapters, fragments, timeline, revision-notes
Publish room: manuscript, synopsis, exports, targets`,

  fiction: `Brainstorm room: characters, world-bible, plot-threads, magic-systems, themes
Drafts room: outline, story-arc, chapters, scenes, revision-notes
Publish room: manuscript, synopsis, exports, targets`,

  nonfiction: `Brainstorm room: concepts, frameworks, case-studies, arguments, research
Drafts room: outline, thesis, chapters, sections, revision-notes
Publish room: manuscript, synopsis, exports, targets`,
}

// KB types that can be auto-created from imported content
const IMPORTABLE_KB_TYPES: KnowledgeFileType[] = [
  'characters', 'world-building', 'story-planning', 'chapter-outlines',
  'research', 'references', 'lore', 'relationships-map', 'timeline',
  'thematic-through-lines',
]

// ---------------------------------------------------------------------------
// Classification prompt
// ---------------------------------------------------------------------------

function buildClassificationPrompt(bookType: BookType, sections: DetectedSection[]): string {
  const sectionList = sections.map((s, i) =>
    `[${i}] Title: "${s.title}" (${s.source})\nPreview: ${s.content.substring(0, 300)}${s.content.length > 300 ? '...' : ''}`
  ).join('\n\n')

  return `You are Sam's import classifier for Rune, a book-writing platform.

A user is importing existing writing into their ${bookType} project. Below are sections detected from their upload. For each section, classify WHERE it should be stored in the workspace.

WORKSPACE STRUCTURE (${bookType}):
${CATEGORY_REFERENCE[bookType]}

KB TYPES (create a knowledge base entry if the section contains reference material):
${IMPORTABLE_KB_TYPES.join(', ')}

CLASSIFICATION RULES:
- Chapters or chapter-like prose go to drafts/chapters
- Outlines or structural plans go to drafts/outline
- Character descriptions or profiles go to brainstorm/characters (fiction) or brainstorm/people (memoir)
- World details, settings, locations go to brainstorm/world-bible (fiction) or brainstorm/places (memoir)
- Research, citations, references go to brainstorm/research (nonfiction) or brainstorm/raw-sessions
- Themes, motifs, abstract ideas go to brainstorm/themes
- If a section is clearly a complete chapter, set kb_type to null (it's prose, not reference)
- If a section contains reference material (character profiles, world rules, research), set kb_type to the matching type
- If uncertain, default to brainstorm/raw-sessions with kb_type null

SECTIONS TO CLASSIFY:
${sectionList}

Respond with ONLY a JSON array of classifications. No other text:
[
  { "index": 0, "title": "Cleaned title", "room": "brainstorm|drafts|publish", "category": "category-name", "kb_type": "kb-type-or-null", "reasoning": "brief reason" }
]`
}

// ---------------------------------------------------------------------------
// Core routing logic
// ---------------------------------------------------------------------------

/**
 * Route imported sections to the correct workspace locations using Claude classification.
 * Creates workspace files and optional KB entries for each section.
 */
export async function routeImport(
  doc: ParsedDocument,
  bookId: string,
  bookType: BookType,
  userId: string,
  quality: QualityLevel = 'standard',
): Promise<RouteResult> {
  const sections = doc.sections

  if (sections.length === 0) {
    return { totalSections: 0, routed: [], fallback: [], wordCount: 0 }
  }

  // Classify sections with Claude
  const classifications = await classifySections(sections, bookType, quality)

  // Create workspace files (and optional KB entries) for each classified section
  const routed: RoutedSection[] = []
  const fallback: RoutedSection[] = []

  for (const section of sections) {
    const classification = classifications.find((c) => c.index === sections.indexOf(section))

    const room: Room = classification?.room ?? 'brainstorm'
    const category = classification?.category ?? 'raw-sessions'
    const title = classification?.title ?? section.title
    const kbType = classification?.kb_type ?? null
    const wordCount = section.content.trim().split(/\s+/).filter(Boolean).length

    try {
      // Create workspace file
      const wsFile = await createWorkspaceFile(bookId, room, category, title, section.content)

      // Create KB entry if classified as reference material
      let kbEntryCreated = false
      if (kbType && IMPORTABLE_KB_TYPES.includes(kbType)) {
        try {
          const inferred = inferFolderAndScope(kbType)
          await KnowledgeBaseService.createFile(userId, {
            book_id: bookId,
            title,
            content: section.content,
            file_type: kbType,
            scope: inferred.scope,
            folder_type: inferred.folder_type,
            folder_path: inferred.folder_path,
            is_active: true,
            source_type: 'import',
            metadata: {
              import_source: doc.metadata.filename,
              word_count: wordCount,
            },
          })
          kbEntryCreated = true
        } catch {
          // KB creation is non-critical — workspace file was already created
        }
      }

      const target = classification ? routed : fallback
      target.push({
        originalTitle: section.title,
        title,
        room,
        category,
        wordCount,
        workspaceFileId: wsFile.id,
        kbEntryCreated,
      })
    } catch (err) {
      // If workspace creation fails, skip this section
      console.error(`[import-router] Failed to create file for section "${title}":`, err)
    }
  }

  return {
    totalSections: sections.length,
    routed,
    fallback,
    wordCount: doc.metadata.wordCount,
  }
}

// ---------------------------------------------------------------------------
// Claude classification
// ---------------------------------------------------------------------------

async function classifySections(
  sections: DetectedSection[],
  bookType: BookType,
  quality: QualityLevel,
): Promise<ClassifiedSection[]> {
  // For very large imports, batch sections to stay within context limits
  const BATCH_SIZE = 20
  const allClassifications: ClassifiedSection[] = []

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE)
    const batchClassifications = await classifyBatch(batch, bookType, quality, i)
    allClassifications.push(...batchClassifications)
  }

  return allClassifications
}

async function classifyBatch(
  sections: DetectedSection[],
  bookType: BookType,
  quality: QualityLevel,
  indexOffset: number,
): Promise<ClassifiedSection[]> {
  const { client, model } = createModelClient('filing', quality)

  const prompt = buildClassificationPrompt(bookType, sections)

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return []

    let parsed: ClassifiedSection[]
    try {
      parsed = JSON.parse(textBlock.text.trim())
    } catch {
      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []
      parsed = JSON.parse(jsonMatch[0])
    }

    // Adjust indices for batching and validate
    return parsed
      .filter((c) => typeof c.index === 'number' && c.room && c.category)
      .map((c) => ({
        ...c,
        index: c.index + indexOffset,
        room: validateRoom(c.room),
        category: c.category,
        kb_type: c.kb_type && IMPORTABLE_KB_TYPES.includes(c.kb_type) ? c.kb_type : null,
      }))
  } catch (err) {
    console.error('[import-router] Classification failed:', err)
    return []
  }
}

function validateRoom(room: string): Room {
  if (room === 'brainstorm' || room === 'drafts' || room === 'publish') return room
  return 'brainstorm'
}
