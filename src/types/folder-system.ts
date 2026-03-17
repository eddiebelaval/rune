// Rune KB Folder System
// Predefined file structures per folder layer

import type { KnowledgeFileType, FolderType, KnowledgeScope } from './knowledge'

export interface PredefinedFile {
  title: string
  file_type: KnowledgeFileType
  description: string
}

// Foundation layer: World-building core (global scope)
export const FOUNDATION_FILES: PredefinedFile[] = [
  {
    title: 'World Bible',
    file_type: 'world-building',
    description: 'Core premise, unbreakable rules, tone, atmosphere, terminology, what the story IS and IS NOT',
  },
  {
    title: 'Character Profiles',
    file_type: 'characters',
    description: 'Every character with physical description, personality, motivations, relationships, voice patterns, arc trajectory',
  },
  {
    title: 'Settings & Locations',
    file_type: 'world-building',
    description: 'Primary and secondary locations with sensory details, significance, and rules that apply there',
  },
  {
    title: 'Lore & Rules',
    file_type: 'lore',
    description: 'Magic systems, technology, cultural norms, history, anything that constrains or enables the world',
  },
  {
    title: 'Relationships Map',
    file_type: 'relationships-map',
    description: 'Who knows who, how they feel about each other, power dynamics, secrets, debts',
  },
  {
    title: 'Timeline',
    file_type: 'timeline',
    description: 'Chronological backbone. Events before, during, and after the story. Fuzzy dates supported.',
  },
]

// Strategy layer: Story planning (regional scope)
export const STRATEGY_FILES: PredefinedFile[] = [
  {
    title: 'Story Arc',
    file_type: 'story-planning',
    description: 'Beginning state, ending state, major turning points, the core question being answered',
  },
  {
    title: 'Chapter Outlines',
    file_type: 'chapter-outlines',
    description: 'Beat sheets per chapter: setup, conflict, resolution, cliffhanger',
  },
  {
    title: 'Character Journeys',
    file_type: 'character-journeys',
    description: 'Per-character want vs need, key moments, growth trajectory for this arc',
  },
  {
    title: 'Thematic Through-Lines',
    file_type: 'thematic-through-lines',
    description: 'What this arc is really about beneath the plot',
  },
]

// Assets layer: Supporting material
export const ASSETS_FILES: PredefinedFile[] = [
  {
    title: 'Research & References',
    file_type: 'research',
    description: 'Source material, inspirations, comparable works',
  },
  {
    title: 'Interview Transcripts',
    file_type: 'references',
    description: 'Raw transcripts from world-building voice sessions',
  },
  {
    title: 'Inspiration & Ideas',
    file_type: 'references',
    description: 'Loose threads, what-ifs, future possibilities',
  },
]

// Folder type to default scope mapping
export const FOLDER_SCOPE_MAP: Record<FolderType, KnowledgeScope> = {
  foundation: 'global',
  strategy: 'regional',
  drafts: 'local',
  sandbox: 'local',
  production: 'local',
  assets: 'global',
}

// File type to default folder mapping
export const FILE_TYPE_FOLDER_MAP: Record<KnowledgeFileType, FolderType> = {
  'characters': 'foundation',
  'world-building': 'foundation',
  'lore': 'foundation',
  'relationships-map': 'foundation',
  'timeline': 'foundation',
  'story-planning': 'strategy',
  'chapter-outlines': 'strategy',
  'character-journeys': 'strategy',
  'thematic-through-lines': 'strategy',
  'drafts': 'drafts',
  'sandbox': 'sandbox',
  'research': 'assets',
  'references': 'assets',
}

/**
 * Infer folder_type and scope from file_type
 */
export function inferFolderAndScope(fileType: KnowledgeFileType): {
  folder_type: FolderType
  scope: KnowledgeScope
  folder_path: string
} {
  const folder_type = FILE_TYPE_FOLDER_MAP[fileType]
  const scope = FOLDER_SCOPE_MAP[folder_type]
  const folder_path = `${folder_type}/${fileType}`
  return { folder_type, scope, folder_path }
}

/**
 * Get all predefined files for a given folder type
 */
export function getPredefinedFiles(folderType: FolderType): PredefinedFile[] {
  switch (folderType) {
    case 'foundation': return FOUNDATION_FILES
    case 'strategy': return STRATEGY_FILES
    case 'assets': return ASSETS_FILES
    default: return []
  }
}
