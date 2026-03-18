// Stage Gates: Soft completeness thresholds between pipeline stages
// Gates suggest readiness, they don't block. Rune guides, not enforces.

import type { KnowledgeFile, PipelineStage, KnowledgeFileType } from '../../types/knowledge'
import { countWords } from '../text-utils'

export interface GateResult {
  passed: boolean
  score: number
  blockers: string[]
  suggestions: string[]
  nextStage: PipelineStage | null
}

/**
 * Check the gate between current stage and next stage
 */
export function checkGate(
  currentStage: PipelineStage,
  kbFiles: KnowledgeFile[]
): GateResult {
  switch (currentStage) {
    case 'world-building':
      return checkWorldBuildingGate(kbFiles)
    case 'story-writing':
      return checkStoryWritingGate(kbFiles)
    case 'publishing':
      return { passed: true, score: 100, blockers: [], suggestions: [], nextStage: null }
    default:
      return { passed: false, score: 0, blockers: ['Unknown stage'], suggestions: [], nextStage: null }
  }
}

/**
 * Gate A -> B: World Building -> Story Writing
 * Checks if foundation KB has minimum viable entries
 */
function checkWorldBuildingGate(kbFiles: KnowledgeFile[]): GateResult {
  const blockers: string[] = []
  const suggestions: string[] = []

  const foundationFiles = kbFiles.filter((f) => f.folder_type === 'foundation')

  // Required: at least 1 character with meaningful content
  const characters = foundationFiles.filter((f) => f.file_type === 'characters')
  const meaningfulCharacters = characters.filter((f) => countWords(f.content) > 20)
  if (meaningfulCharacters.length === 0) {
    blockers.push('No characters described yet')
  }

  // Required: world description exists
  const worldBuilding = foundationFiles.filter((f) => f.file_type === 'world-building')
  if (worldBuilding.length === 0) {
    blockers.push('No world description yet')
  }

  // Suggested: lore/rules
  const lore = foundationFiles.filter((f) => f.file_type === 'lore')
  if (lore.length === 0) {
    suggestions.push('Consider defining the rules of your world before writing')
  }

  // Suggested: relationships
  const relationships = foundationFiles.filter((f) => f.file_type === 'relationships-map')
  if (relationships.length === 0 && meaningfulCharacters.length > 1) {
    suggestions.push('You have multiple characters — mapping their relationships will help Rune write better dialogue')
  }

  // Suggested: timeline
  const timeline = foundationFiles.filter((f) => f.file_type === 'timeline')
  if (timeline.length === 0) {
    suggestions.push('A timeline helps Rune keep your story chronologically consistent')
  }

  // Score: percentage of foundation file types populated
  const foundationTypes: KnowledgeFileType[] = [
    'characters', 'world-building', 'lore', 'relationships-map', 'timeline',
  ]
  const populatedCount = foundationTypes.filter(
    (ft) => foundationFiles.some((f) => f.file_type === ft && f.content.trim().length > 10)
  ).length
  const score = Math.round((populatedCount / foundationTypes.length) * 100)

  return {
    passed: blockers.length === 0,
    score,
    blockers,
    suggestions,
    nextStage: 'story-writing',
  }
}

/**
 * Gate B -> C: Story Writing -> Publishing
 * Checks if story structure is complete enough to publish
 */
function checkStoryWritingGate(kbFiles: KnowledgeFile[]): GateResult {
  const blockers: string[] = []
  const suggestions: string[] = []

  const strategyFiles = kbFiles.filter((f) => f.folder_type === 'strategy')
  const draftFiles = kbFiles.filter((f) => f.folder_type === 'drafts')

  // Required: story arc exists
  const storyArc = strategyFiles.filter((f) => f.file_type === 'story-planning')
  if (storyArc.length === 0) {
    blockers.push('No story arc defined')
  }

  // Required: at least one chapter outline
  const outlines = strategyFiles.filter((f) => f.file_type === 'chapter-outlines')
  if (outlines.length === 0) {
    blockers.push('No chapter outlines')
  }

  // Required: at least one draft with meaningful content
  const meaningfulDrafts = draftFiles.filter(
    (f) => f.file_type === 'drafts' && countWords(f.content) > 100
  )
  if (meaningfulDrafts.length === 0) {
    blockers.push('No chapter drafts written yet')
  }

  // Suggested: character journeys
  const journeys = strategyFiles.filter((f) => f.file_type === 'character-journeys')
  if (journeys.length === 0) {
    suggestions.push('Defining character journeys helps ensure satisfying arcs')
  }

  // Check for unresolved items in backlog (would need backlog data, skip for now)

  // Score: strategy + drafts completeness
  const strategyTypes: KnowledgeFileType[] = [
    'story-planning', 'chapter-outlines', 'character-journeys', 'thematic-through-lines',
  ]
  const stratPopulated = strategyTypes.filter(
    (ft) => strategyFiles.some((f) => f.file_type === ft && f.content.trim().length > 10)
  ).length
  const draftScore = meaningfulDrafts.length > 0 ? 50 : 0
  const stratScore = Math.round((stratPopulated / strategyTypes.length) * 50)
  const score = draftScore + stratScore

  return {
    passed: blockers.length === 0,
    score,
    blockers,
    suggestions,
    nextStage: 'publishing',
  }
}

/**
 * Generate a human-readable gate status message for Rune to say
 */
export function getGateMessage(result: GateResult, currentStage: PipelineStage): string {
  if (result.passed) {
    return `Your ${currentStage === 'world-building' ? 'world' : 'story'} is ${result.score}% built. ` +
      `You're ready to move to ${result.nextStage === 'story-writing' ? 'writing' : 'publishing'}.` +
      (result.suggestions.length > 0
        ? ` Though you might want to: ${result.suggestions[0]}`
        : '')
  }

  return `Your ${currentStage === 'world-building' ? 'world' : 'story'} is ${result.score}% built. ` +
    `Before moving on: ${result.blockers.join('. ')}.` +
    (result.suggestions.length > 0
      ? ` Also consider: ${result.suggestions[0]}`
      : '')
}
