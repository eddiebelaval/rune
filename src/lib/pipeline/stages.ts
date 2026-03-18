// Three-Stage Pipeline: World Building -> Story Writing -> Publishing
// Stage awareness determines what Rune shows, asks, and prioritizes

import type { PipelineStage, KnowledgeFileType, FolderType } from '../../types/knowledge'

export interface StageConfig {
  stage: PipelineStage
  label: string
  description: string
  primaryKBLayers: FolderType[]
  relevantFileTypes: KnowledgeFileType[]
  conversationModes: string[]
  backlogPriority: string
  roomLabel: string
  roomDescription: string
}

export const STAGE_CONFIGS: Record<PipelineStage, StageConfig> = {
  'world-building': {
    stage: 'world-building',
    label: 'World Building',
    description: 'Build the foundation. Characters, locations, lore, rules, relationships, timeline.',
    primaryKBLayers: ['foundation', 'assets'],
    relevantFileTypes: ['characters', 'world-building', 'lore', 'relationships-map', 'timeline'],
    conversationModes: ['guided', 'freeform', 'brainstorm'],
    backlogPriority: 'kb-completeness',
    roomLabel: 'The Workshop',
    roomDescription: 'Build your world through conversation. Rune interviews you layer by layer.',
  },
  'story-writing': {
    stage: 'story-writing',
    label: 'Story Writing',
    description: 'Structure and write. Story arcs, chapter outlines, scenes, prose.',
    primaryKBLayers: ['strategy', 'drafts'],
    relevantFileTypes: ['story-planning', 'chapter-outlines', 'character-journeys', 'thematic-through-lines', 'drafts', 'sandbox'],
    conversationModes: ['guided', 'freeform', 'review'],
    backlogPriority: 'story-completeness',
    roomLabel: 'The Study',
    roomDescription: 'Write your story with full world context. Rune keeps everything consistent.',
  },
  'publishing': {
    stage: 'publishing',
    label: 'Publishing',
    description: 'Assemble and export. Manuscript, formatting, cover, publish-ready output.',
    primaryKBLayers: ['production'],
    relevantFileTypes: ['drafts'],
    conversationModes: ['review', 'command'],
    backlogPriority: 'polish',
    roomLabel: 'The Press',
    roomDescription: 'Assemble your manuscript and export in any format.',
  },
}

/**
 * Get the stage config for a pipeline stage
 */
export function getStageConfig(stage: PipelineStage): StageConfig {
  return STAGE_CONFIGS[stage]
}

/**
 * Get the next stage in the pipeline
 */
export function getNextStage(current: PipelineStage): PipelineStage | null {
  const order: PipelineStage[] = ['world-building', 'story-writing', 'publishing']
  const idx = order.indexOf(current)
  return idx < order.length - 1 ? order[idx + 1] : null
}

/**
 * Get the previous stage
 */
export function getPreviousStage(current: PipelineStage): PipelineStage | null {
  const order: PipelineStage[] = ['world-building', 'story-writing', 'publishing']
  const idx = order.indexOf(current)
  return idx > 0 ? order[idx - 1] : null
}

/**
 * Get all three stage configs in order (for UI rendering)
 */
export function getAllStages(): StageConfig[] {
  return [
    STAGE_CONFIGS['world-building'],
    STAGE_CONFIGS['story-writing'],
    STAGE_CONFIGS['publishing'],
  ]
}
