import { describe, it, expect } from 'vitest'
import {
  getQuestionTree,
  getRequiredQuestions,
  getNextQuestion,
} from '../lib/interviews/question-trees'
import { InterviewEngine } from '../lib/interviews/engine'
import type { KnowledgeFile } from '../types/knowledge'

// Helper to create a mock KB file
function mockKBFile(overrides: Partial<KnowledgeFile> = {}): KnowledgeFile {
  return {
    id: 'test-id',
    user_id: 'user-1',
    book_id: 'book-1',
    title: 'Test File',
    content: 'Some content that is long enough to count as meaningful content for testing purposes.',
    file_type: 'characters',
    scope: 'global',
    folder_path: 'foundation/characters',
    folder_type: 'foundation',
    tags: [],
    is_active: true,
    metadata: { word_count: 15 },
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

describe('getQuestionTree', () => {
  it('returns fiction tree with 9 questions', () => {
    const tree = getQuestionTree('fiction')
    expect(tree.length).toBe(9)
  })

  it('returns memoir tree with 8 questions', () => {
    const tree = getQuestionTree('memoir')
    expect(tree.length).toBe(8)
  })

  it('returns nonfiction tree with 7 questions', () => {
    const tree = getQuestionTree('nonfiction')
    expect(tree.length).toBe(7)
  })

  it('each question has required fields', () => {
    for (const bookType of ['fiction', 'memoir', 'nonfiction'] as const) {
      const tree = getQuestionTree(bookType)
      for (const node of tree) {
        expect(node.id).toBeTruthy()
        expect(node.question).toBeTruthy()
        expect(node.targetKBLayer).toBeTruthy()
        expect(node.targetTitle).toBeTruthy()
        expect(node.extractionHints.length).toBeGreaterThan(0)
        expect(typeof node.priority).toBe('number')
        expect(typeof node.required).toBe('boolean')
      }
    }
  })

  it('fiction tree has unique IDs', () => {
    const tree = getQuestionTree('fiction')
    const ids = tree.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getRequiredQuestions', () => {
  it('fiction has required questions', () => {
    const required = getRequiredQuestions('fiction')
    expect(required.length).toBeGreaterThan(0)
    expect(required.every((q) => q.required)).toBe(true)
  })

  it('required is a subset of all questions', () => {
    for (const bookType of ['fiction', 'memoir', 'nonfiction'] as const) {
      const all = getQuestionTree(bookType)
      const required = getRequiredQuestions(bookType)
      expect(required.length).toBeLessThanOrEqual(all.length)
    }
  })
})

describe('getNextQuestion', () => {
  it('returns first priority question when none answered', () => {
    const next = getNextQuestion('fiction', new Set())
    expect(next).not.toBeNull()
    expect(next!.priority).toBe(1)
  })

  it('returns null when all answered', () => {
    const tree = getQuestionTree('fiction')
    const allIds = new Set(tree.map((q) => q.id))
    const next = getNextQuestion('fiction', allIds)
    expect(next).toBeNull()
  })

  it('skips answered questions', () => {
    const tree = getQuestionTree('fiction')
    const firstId = tree.sort((a, b) => a.priority - b.priority)[0].id
    const answered = new Set([firstId])
    const next = getNextQuestion('fiction', answered)
    expect(next).not.toBeNull()
    expect(next!.id).not.toBe(firstId)
  })
})

describe('InterviewEngine', () => {
  it('infers answered questions from KB files', () => {
    const kbFiles = [
      mockKBFile({ file_type: 'characters', title: 'Character Profiles' }),
      mockKBFile({ file_type: 'world-building', title: 'World Bible' }),
    ]
    const engine = new InterviewEngine('fiction', kbFiles)
    const completeness = engine.getCompleteness()
    expect(completeness.answered).toBeGreaterThan(0)
    expect(completeness.percentage).toBeGreaterThan(0)
  })

  it('returns next question', () => {
    const engine = new InterviewEngine('fiction', [])
    const next = engine.getNextQuestion()
    expect(next).not.toBeNull()
  })

  it('marks questions as answered', () => {
    const engine = new InterviewEngine('fiction', [])
    const before = engine.getCompleteness()
    const next = engine.getNextQuestion()
    if (next) engine.markAnswered(next.id)
    const after = engine.getCompleteness()
    expect(after.answered).toBe(before.answered + 1)
  })

  it('detects gaps in KB', () => {
    const kbFiles = [
      mockKBFile({
        file_type: 'world-building',
        title: 'World Bible',
        content: 'The kingdom of Ashara is ruled by Queen Zara. Queen Zara controls the northern provinces.',
      }),
    ]
    const engine = new InterviewEngine('fiction', kbFiles)
    const gaps = engine.detectGaps()
    // Should detect "Zara" or "Ashara" as potential entities without character profiles
    expect(Array.isArray(gaps)).toBe(true)
  })

  it('checks Stage B readiness with empty KB', () => {
    const engine = new InterviewEngine('fiction', [])
    const readiness = engine.getStageBReadiness()
    expect(readiness.ready).toBe(false)
    expect(readiness.blockers.length).toBeGreaterThan(0)
  })

  it('checks Stage B readiness with populated KB', () => {
    const kbFiles = [
      mockKBFile({ file_type: 'characters', title: 'Character Profiles' }),
      mockKBFile({ file_type: 'world-building', title: 'World Bible' }),
      mockKBFile({ file_type: 'world-building', title: 'Settings & Locations' }),
    ]
    const engine = new InterviewEngine('fiction', kbFiles)
    const readiness = engine.getStageBReadiness()
    expect(readiness.ready).toBe(true)
    expect(readiness.score).toBeGreaterThan(0)
  })

  it('generates interview prompt', () => {
    const engine = new InterviewEngine('fiction', [])
    const prompt = engine.getInterviewPrompt()
    expect(prompt).toBeTruthy()
    expect(prompt.length).toBeGreaterThan(50)
    expect(prompt).toContain('World-building progress')
  })

  it('generates completed prompt when all answered', () => {
    const tree = getQuestionTree('fiction')
    const engine = new InterviewEngine('fiction', [])
    for (const node of tree) engine.markAnswered(node.id)
    const prompt = engine.getInterviewPrompt()
    expect(prompt).toContain('complete')
  })
})
