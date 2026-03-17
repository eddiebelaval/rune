// Voice-to-KB Filing Pipeline
// Classifies speech content and files it into the correct KB layer
// Uses Haiku for classification, Sonnet for extraction

import type { KnowledgeFileType } from '../../types/knowledge'
import { inferFolderAndScope } from '../../types/folder-system'

export interface ClassificationResult {
  fileType: KnowledgeFileType
  targetTitle: string
  confidence: number
  isNewEntry: boolean
  existingFileId?: string
}

export interface ExtractionResult {
  title: string
  content: string
  tags: string[]
  metadata: Record<string, unknown>
}

export interface FilingEvent {
  type: 'classifying' | 'extracting' | 'filing' | 'updating' | 'complete'
  message: string
  fileType?: KnowledgeFileType
  title?: string
}

/**
 * Build the classification prompt for Haiku
 * Given user speech, determine which KB layer it belongs to
 */
export function buildClassificationPrompt(userSpeech: string): string {
  return `You are a content classifier for a book-writing knowledge base. Analyze the following speech from a user describing their book's world and determine which KB layer it belongs to.

KB Layers:
- characters: Physical descriptions, personality, motivations, voice, backstory of a character
- world-building: World description, atmosphere, setting details, sensory information, general world rules
- lore: Magic systems, technology, cultural norms, history, governance, supernatural elements
- relationships-map: How characters relate to each other, dynamics, secrets, power structures
- timeline: Events, dates, chronological sequences, what happened when
- story-planning: Story arc, conflict, stakes, beginning/ending states
- chapter-outlines: Chapter-level structure, scenes, beats
- character-journeys: Character growth arcs, want vs need, transformation
- thematic-through-lines: Themes, subtext, moral questions, what the story is really about
- research: Source material, references, real-world basis
- references: Inspirations, comparable works, interview transcripts

User speech:
"""
${userSpeech}
"""

Respond with ONLY a JSON object:
{
  "file_type": "<one of the KB layer types above>",
  "target_title": "<suggested title for this KB entry>",
  "confidence": <0.0 to 1.0>,
  "key_entities": ["<names/concepts mentioned>"]
}`
}

/**
 * Build the extraction prompt for Sonnet
 * Structures raw speech into a well-organized KB entry
 */
export function buildExtractionPrompt(
  userSpeech: string,
  fileType: KnowledgeFileType,
  existingContent?: string
): string {
  const typeInstructions: Record<string, string> = {
    'characters': `Structure as a character profile:
# [Character Name]
**Physical:** appearance details
**Personality:** traits, habits, quirks
**Motivation:** what they want, what they need
**Voice:** how they speak, verbal patterns
**Backstory:** relevant history
**Role:** their function in the story`,

    'world-building': `Structure as a world/setting description:
# [Setting Name]
**Overview:** what this place/world is
**Sensory Details:** sights, sounds, smells, textures
**Atmosphere:** mood and feeling
**Significance:** why this matters to the story
**Rules:** what's possible/impossible here`,

    'lore': `Structure as world rules/lore:
# [System/Concept Name]
**How It Works:** mechanics and rules
**Limitations:** what it can't do
**History:** how it came to be
**Impact:** how it affects daily life
**Exceptions:** edge cases and special circumstances`,

    'relationships-map': `Structure as relationship entries:
For each relationship pair:
**[Character A] <-> [Character B]**
- Relationship type: (friends, enemies, family, romantic, etc.)
- Dynamic: power balance, tension, trust level
- Secrets: what one knows that the other doesn't
- Arc: how this relationship changes`,

    'timeline': `Structure as timeline entries:
For each event:
**[Date/Period]:** [Event description]
- Characters involved: [names]
- Consequence: what changed after this
- Chapter reference: (if applicable)`,

    'story-planning': `Structure as story arc elements:
**Central Conflict:** what's at stake
**Beginning State:** where things start
**Key Turning Points:** moments that change direction
**Climax:** the highest point of tension
**Resolution Direction:** how it might end`,
  }

  const instructions = typeInstructions[fileType] ?? 'Organize the content clearly with headers and structure.'

  const appendMode = existingContent
    ? `\n\nEXISTING CONTENT (append new information, don't repeat what's already there):\n"""\n${existingContent}\n"""`
    : ''

  return `You are a scribe organizing spoken content into a structured knowledge base entry for a book project.

Content type: ${fileType}
${instructions}

User spoke:
"""
${userSpeech}
"""${appendMode}

Write the KB entry in clean markdown. Be faithful to the user's words — this is THEIR book, THEIR voice. Organize and structure, but don't invent details they didn't provide. If they were vague about something, note it as "[to be developed]".

Respond with ONLY the structured content (no JSON wrapper, no preamble).`
}

/**
 * Determine if speech should update an existing KB file or create a new one
 */
export function shouldUpdateExisting(
  classification: { file_type: KnowledgeFileType; target_title: string },
  existingFiles: { id: string; file_type: KnowledgeFileType; title: string }[]
): { isUpdate: boolean; existingFileId?: string } {
  // Check for exact type + similar title match
  const sameType = existingFiles.filter((f) => f.file_type === classification.file_type)

  if (sameType.length === 0) return { isUpdate: false }

  // Fuzzy title match
  const targetLower = classification.target_title.toLowerCase()
  const match = sameType.find((f) => {
    const titleLower = f.title.toLowerCase()
    return (
      titleLower === targetLower ||
      titleLower.includes(targetLower) ||
      targetLower.includes(titleLower)
    )
  })

  if (match) return { isUpdate: true, existingFileId: match.id }

  // For singleton types (world bible, relationships map, timeline), always update
  const singletonTypes: KnowledgeFileType[] = [
    'relationships-map', 'timeline', 'thematic-through-lines',
    'story-planning', 'chapter-outlines',
  ]
  if (singletonTypes.includes(classification.file_type) && sameType.length > 0) {
    return { isUpdate: true, existingFileId: sameType[0].id }
  }

  return { isUpdate: false }
}
