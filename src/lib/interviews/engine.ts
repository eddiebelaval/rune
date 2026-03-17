// Interview Engine: Walks users through world-building via voice
// Tracks completeness, detects gaps, determines next best question

import type { BookType } from '../../types/database'
import type { KnowledgeFile, KnowledgeFileType } from '../../types/knowledge'
import { getQuestionTree, getNextQuestion, type QuestionNode } from './question-trees'
import { FOUNDATION_FILES, STRATEGY_FILES } from '../../types/folder-system'

interface CompletionStatus {
  total: number
  answered: number
  percentage: number
  missingLayers: string[]
}

interface GapDetection {
  entity_name: string
  mentioned_in: string
  missing_type: KnowledgeFileType
  suggestion: string
}

interface StageReadiness {
  ready: boolean
  score: number
  blockers: string[]
  suggestions: string[]
}

export class InterviewEngine {
  private bookType: BookType
  private answeredIds: Set<string>
  private kbFiles: KnowledgeFile[]

  constructor(bookType: BookType, kbFiles: KnowledgeFile[]) {
    this.bookType = bookType
    this.kbFiles = kbFiles
    this.answeredIds = new Set()
    this.inferAnsweredFromKB()
  }

  /**
   * Infer which questions have been answered based on existing KB files
   */
  private inferAnsweredFromKB(): void {
    const tree = getQuestionTree(this.bookType)

    for (const node of tree) {
      const hasFile = this.kbFiles.some(
        (f) => f.file_type === node.targetKBLayer && f.content.trim().length > 20
      )
      if (hasFile) {
        this.answeredIds.add(node.id)
      }
    }
  }

  /**
   * Get the next question Rune should ask
   */
  getNextQuestion(): QuestionNode | null {
    return getNextQuestion(this.bookType, this.answeredIds)
  }

  /**
   * Mark a question as answered (called after KB entry created from response)
   */
  markAnswered(nodeId: string): void {
    this.answeredIds.add(nodeId)
  }

  /**
   * Get overall completeness of world-building
   */
  getCompleteness(): CompletionStatus {
    const tree = getQuestionTree(this.bookType)
    const total = tree.length
    const answered = this.answeredIds.size
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0

    const missingLayers: string[] = []
    const answeredTypes = new Set(
      tree.filter((n) => this.answeredIds.has(n.id)).map((n) => n.targetKBLayer)
    )

    for (const node of tree) {
      if (node.required && !answeredTypes.has(node.targetKBLayer)) {
        const label = node.targetTitle
        if (!missingLayers.includes(label)) {
          missingLayers.push(label)
        }
      }
    }

    return { total, answered, percentage, missingLayers }
  }

  /**
   * Detect gaps: entities mentioned in KB content but without their own profiles
   */
  detectGaps(): GapDetection[] {
    const gaps: GapDetection[] = []
    const characterNames = new Set(
      this.kbFiles
        .filter((f) => f.file_type === 'characters')
        .map((f) => f.title.toLowerCase())
    )

    // Scan all non-character KB files for name-like references
    for (const file of this.kbFiles) {
      if (file.file_type === 'characters') continue

      // Simple heuristic: capitalized words that appear multiple times
      const words = file.content.match(/\b[A-Z][a-z]{2,}\b/g) ?? []
      const wordCounts = new Map<string, number>()
      for (const word of words) {
        const lower = word.toLowerCase()
        if (!characterNames.has(lower)) {
          wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1)
        }
      }

      for (const [name, count] of wordCounts) {
        if (count >= 2) {
          gaps.push({
            entity_name: name,
            mentioned_in: file.title,
            missing_type: 'characters',
            suggestion: `You mentioned "${name}" in ${file.title} but they don't have a character profile yet. Tell me about them.`,
          })
        }
      }
    }

    return gaps
  }

  /**
   * Check if the world is built enough to start writing (Stage A -> B gate)
   */
  getStageBReadiness(): StageReadiness {
    const blockers: string[] = []
    const suggestions: string[] = []

    // Required: at least 1 character
    const hasCharacters = this.kbFiles.some((f) => f.file_type === 'characters')
    if (!hasCharacters) blockers.push('No characters defined')

    // Required: world bible exists
    const hasWorldBible = this.kbFiles.some((f) => f.file_type === 'world-building')
    if (!hasWorldBible) blockers.push('No world description')

    // Required for fiction: at least 1 location
    if (this.bookType === 'fiction') {
      const hasLocation = this.kbFiles.some(
        (f) => f.file_type === 'world-building' && f.title.toLowerCase().includes('location')
      ) || this.kbFiles.filter((f) => f.file_type === 'world-building').length >= 2
      if (!hasLocation) blockers.push('No locations defined')
    }

    // Suggested: relationships
    const hasRelationships = this.kbFiles.some((f) => f.file_type === 'relationships-map')
    if (!hasRelationships && this.kbFiles.filter((f) => f.file_type === 'characters').length > 1) {
      suggestions.push('You have multiple characters but no relationships mapped')
    }

    // Suggested: timeline
    const hasTimeline = this.kbFiles.some((f) => f.file_type === 'timeline')
    if (!hasTimeline) {
      suggestions.push('Adding a timeline would help Rune maintain consistency')
    }

    // Score: foundation completeness
    const foundationTypes: KnowledgeFileType[] = ['world-building', 'characters', 'lore', 'relationships-map', 'timeline']
    const populatedCount = foundationTypes.filter(
      (ft) => this.kbFiles.some((f) => f.file_type === ft)
    ).length
    const score = Math.round((populatedCount / foundationTypes.length) * 100)

    // Detect gaps and add as suggestions
    const gaps = this.detectGaps()
    for (const gap of gaps.slice(0, 3)) {
      suggestions.push(gap.suggestion)
    }

    return {
      ready: blockers.length === 0,
      score,
      blockers,
      suggestions,
    }
  }

  /**
   * Generate the system prompt addition for interview mode
   */
  getInterviewPrompt(): string {
    const next = this.getNextQuestion()
    const completeness = this.getCompleteness()
    const readiness = this.getStageBReadiness()

    if (!next) {
      return `The world-building interview is complete (${completeness.percentage}% done). ` +
        `The user's world is ${readiness.score}% built. ` +
        (readiness.ready
          ? 'They are ready to start writing.'
          : `Blockers: ${readiness.blockers.join(', ')}.`)
    }

    return [
      `World-building progress: ${completeness.percentage}% complete.`,
      completeness.missingLayers.length > 0
        ? `Missing layers: ${completeness.missingLayers.join(', ')}.`
        : '',
      `Next question to ask (naturally, not robotically): "${next.question}"`,
      `This will populate the KB layer: ${next.targetKBLayer} ("${next.targetTitle}")`,
      `Listen for these details: ${next.extractionHints.join(', ')}`,
      next.followUps.length > 0
        ? `Follow-up questions if they give a short answer: ${next.followUps.map((f) => `"${f}"`).join(', ')}`
        : '',
    ].filter(Boolean).join('\n')
  }
}
