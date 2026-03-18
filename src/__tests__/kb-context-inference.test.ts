import { describe, it, expect, vi, beforeAll } from 'vitest'
import type { KnowledgeFile } from '../types/knowledge'

// Mock the Supabase service client to avoid env var requirement
vi.mock('../lib/supabase', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }) }),
    }),
  }),
}))

// Import after mock
const { buildKBSystemContext, createContextSnapshot, estimateTokens } = await import('../lib/ai/kb-context-inference')

function mockKBFile(overrides: Partial<KnowledgeFile> = {}): KnowledgeFile {
  return {
    id: 'test-id',
    user_id: 'user-1',
    book_id: 'book-1',
    title: 'Test File',
    content: 'Test content for the knowledge base file.',
    file_type: 'characters',
    scope: 'global',
    folder_path: 'foundation/characters',
    folder_type: 'foundation',
    tags: [],
    is_active: true,
    metadata: { word_count: 7 },
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

describe('buildKBSystemContext', () => {
  it('returns empty string for no files', () => {
    expect(buildKBSystemContext([])).toBe('')
  })

  it('wraps content in knowledge-base tags', () => {
    const files = [mockKBFile()]
    const context = buildKBSystemContext(files)
    expect(context).toContain('<knowledge-base>')
    expect(context).toContain('</knowledge-base>')
  })

  it('organizes by folder type', () => {
    const files = [
      mockKBFile({ folder_type: 'foundation', title: 'Characters', file_type: 'characters' }),
      mockKBFile({ id: '2', folder_type: 'strategy', title: 'Story Arc', file_type: 'story-planning' }),
    ]
    const context = buildKBSystemContext(files)
    expect(context).toContain('## FOUNDATION')
    expect(context).toContain('## STRATEGY')
    const foundationPos = context.indexOf('FOUNDATION')
    const strategyPos = context.indexOf('STRATEGY')
    expect(foundationPos).toBeLessThan(strategyPos)
  })

  it('includes file title and version', () => {
    const files = [mockKBFile({ title: 'Kira Profile', current_semantic_version: '2.1.0' })]
    const context = buildKBSystemContext(files)
    expect(context).toContain('Kira Profile')
    expect(context).toContain('v2.1.0')
  })

  it('includes file content', () => {
    const files = [mockKBFile({ content: 'Kira has green eyes and silver hair.' })]
    const context = buildKBSystemContext(files)
    expect(context).toContain('Kira has green eyes and silver hair.')
  })
})

describe('createContextSnapshot', () => {
  it('creates snapshot with correct counts', () => {
    const files = [
      mockKBFile({ is_active: true }),
      mockKBFile({ id: '2', is_active: false }),
      mockKBFile({ id: '3', is_active: true }),
    ]
    const snapshot = createContextSnapshot(files)
    expect(snapshot.total_kb_files).toBe(3)
    expect(snapshot.used_kb_files).toBe(2)
    expect(snapshot.kb_files).toHaveLength(3)
    expect(snapshot.captured_at).toBeTruthy()
  })

  it('includes file references with correct structure', () => {
    const files = [mockKBFile({ title: 'Test', file_type: 'characters', scope: 'global' })]
    const snapshot = createContextSnapshot(files)
    const ref = snapshot.kb_files[0]
    expect(ref.file_id).toBe('test-id')
    expect(ref.file_type).toBe('characters')
    expect(ref.title).toBe('Test')
    expect(ref.scope).toBe('global')
    expect(typeof ref.word_count).toBe('number')
  })
})

describe('estimateTokens', () => {
  it('estimates roughly 1 token per 4 characters', () => {
    const text = 'a'.repeat(400)
    expect(estimateTokens(text)).toBe(100)
  })

  it('handles empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('rounds up', () => {
    expect(estimateTokens('abc')).toBe(1)
  })
})
