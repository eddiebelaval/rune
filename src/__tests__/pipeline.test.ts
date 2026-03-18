import { describe, it, expect } from 'vitest'
import {
  getStageConfig,
  getNextStage,
  getPreviousStage,
  getAllStages,
  STAGE_CONFIGS,
} from '../lib/pipeline/stages'
import { checkGate, getGateMessage } from '../lib/pipeline/gates'
import type { KnowledgeFile } from '../types/knowledge'

function mockKBFile(overrides: Partial<KnowledgeFile> = {}): KnowledgeFile {
  return {
    id: 'test-id',
    user_id: 'user-1',
    book_id: 'book-1',
    title: 'Test File',
    content: 'Meaningful content that has enough words to pass the threshold for being considered populated in gate checks. This extra sentence ensures we exceed the twenty word minimum that the world building gate requires for meaningful character and world descriptions.',
    file_type: 'characters',
    scope: 'global',
    folder_path: 'foundation/characters',
    folder_type: 'foundation',
    tags: [],
    is_active: true,
    metadata: { word_count: 20 },
    source_type: 'voice-transcription',
    current_version: 1,
    current_semantic_version: '1.0.0',
    linked_sandbox_id: null,
    deleted: false,
    deleted_at: null,
    created_at: '2026-03-17T00:00:00Z',
    updated_at: '2026-03-17T00:00:00Z',
    ...overrides,
  }
}

describe('Stage configs', () => {
  it('has 3 stages', () => {
    expect(getAllStages()).toHaveLength(3)
  })

  it('world-building config is correct', () => {
    const config = getStageConfig('world-building')
    expect(config.label).toBe('World Building')
    expect(config.primaryKBLayers).toContain('foundation')
    expect(config.conversationModes).toContain('guided')
    expect(config.roomLabel).toBe('The Workshop')
  })

  it('story-writing config is correct', () => {
    const config = getStageConfig('story-writing')
    expect(config.label).toBe('Story Writing')
    expect(config.primaryKBLayers).toContain('strategy')
    expect(config.roomLabel).toBe('The Study')
  })

  it('publishing config is correct', () => {
    const config = getStageConfig('publishing')
    expect(config.label).toBe('Publishing')
    expect(config.primaryKBLayers).toContain('production')
    expect(config.roomLabel).toBe('The Press')
  })
})

describe('Stage navigation', () => {
  it('world-building next is story-writing', () => {
    expect(getNextStage('world-building')).toBe('story-writing')
  })

  it('story-writing next is publishing', () => {
    expect(getNextStage('story-writing')).toBe('publishing')
  })

  it('publishing next is null', () => {
    expect(getNextStage('publishing')).toBeNull()
  })

  it('world-building previous is null', () => {
    expect(getPreviousStage('world-building')).toBeNull()
  })

  it('story-writing previous is world-building', () => {
    expect(getPreviousStage('story-writing')).toBe('world-building')
  })

  it('publishing previous is story-writing', () => {
    expect(getPreviousStage('publishing')).toBe('story-writing')
  })

  it('getAllStages returns in pipeline order', () => {
    const stages = getAllStages()
    expect(stages[0].stage).toBe('world-building')
    expect(stages[1].stage).toBe('story-writing')
    expect(stages[2].stage).toBe('publishing')
  })
})

describe('Gate: World Building -> Story Writing', () => {
  it('fails with empty KB', () => {
    const result = checkGate('world-building', [])
    expect(result.passed).toBe(false)
    expect(result.blockers.length).toBeGreaterThan(0)
    expect(result.nextStage).toBe('story-writing')
  })

  it('fails with only characters (no world description)', () => {
    const files = [mockKBFile({ file_type: 'characters' })]
    const result = checkGate('world-building', files)
    expect(result.passed).toBe(false)
    expect(result.blockers).toContain('No world description yet')
  })

  it('fails with only world description (no characters)', () => {
    const files = [mockKBFile({ file_type: 'world-building' })]
    const result = checkGate('world-building', files)
    expect(result.passed).toBe(false)
    expect(result.blockers).toContain('No characters described yet')
  })

  it('passes with characters + world description', () => {
    const files = [
      mockKBFile({ file_type: 'characters' }),
      mockKBFile({ file_type: 'world-building' }),
    ]
    const result = checkGate('world-building', files)
    expect(result.passed).toBe(true)
    expect(result.blockers).toHaveLength(0)
  })

  it('score increases with more foundation types populated', () => {
    const minimal = [
      mockKBFile({ file_type: 'characters' }),
      mockKBFile({ file_type: 'world-building' }),
    ]
    const rich = [
      ...minimal,
      mockKBFile({ file_type: 'lore' }),
      mockKBFile({ file_type: 'relationships-map' }),
      mockKBFile({ file_type: 'timeline' }),
    ]
    const minResult = checkGate('world-building', minimal)
    const richResult = checkGate('world-building', rich)
    expect(richResult.score).toBeGreaterThan(minResult.score)
  })

  it('suggests lore when missing', () => {
    const files = [
      mockKBFile({ file_type: 'characters' }),
      mockKBFile({ file_type: 'world-building' }),
    ]
    const result = checkGate('world-building', files)
    expect(result.suggestions.some((s) => s.toLowerCase().includes('rules'))).toBe(true)
  })
})

describe('Gate: Story Writing -> Publishing', () => {
  it('fails with empty strategy KB', () => {
    const result = checkGate('story-writing', [])
    expect(result.passed).toBe(false)
    expect(result.nextStage).toBe('publishing')
  })

  it('fails without story arc', () => {
    const files = [
      mockKBFile({ file_type: 'chapter-outlines', folder_type: 'strategy' }),
    ]
    const result = checkGate('story-writing', files)
    expect(result.blockers).toContain('No story arc defined')
  })

  it('fails without any drafts', () => {
    const files = [
      mockKBFile({ file_type: 'story-planning', folder_type: 'strategy' }),
      mockKBFile({ file_type: 'chapter-outlines', folder_type: 'strategy' }),
    ]
    const result = checkGate('story-writing', files)
    expect(result.blockers).toContain('No chapter drafts written yet')
  })
})

describe('Gate: Publishing', () => {
  it('publishing gate always passes', () => {
    const result = checkGate('publishing', [])
    expect(result.passed).toBe(true)
    expect(result.score).toBe(100)
  })
})

describe('getGateMessage', () => {
  it('generates passed message', () => {
    const result = { passed: true, score: 80, blockers: [], suggestions: [], nextStage: 'story-writing' as const }
    const msg = getGateMessage(result, 'world-building')
    expect(msg).toContain('80%')
    expect(msg).toContain('ready')
  })

  it('generates blocked message', () => {
    const result = { passed: false, score: 40, blockers: ['No characters'], suggestions: [], nextStage: 'story-writing' as const }
    const msg = getGateMessage(result, 'world-building')
    expect(msg).toContain('40%')
    expect(msg).toContain('No characters')
  })
})
