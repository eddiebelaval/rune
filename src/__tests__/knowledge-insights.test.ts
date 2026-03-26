import { buildKnowledgeInsights } from '@/lib/knowledge-insights'
import type { KnowledgeFile } from '@/types/knowledge'

function mockKBFile(overrides: Partial<KnowledgeFile>): KnowledgeFile {
  return {
    id: 'file-1',
    user_id: 'user-1',
    book_id: 'book-1',
    title: 'Default',
    content: 'Default content',
    file_type: 'characters',
    scope: 'local',
    folder_path: 'foundation/characters',
    folder_type: 'foundation',
    tags: [],
    is_active: true,
    metadata: {},
    source_type: 'ai-generated',
    current_version: 1,
    current_semantic_version: '1.0.0',
    linked_sandbox_id: null,
    deleted: false,
    deleted_at: null,
    created_at: '2026-03-26T00:00:00.000Z',
    updated_at: '2026-03-26T00:00:00.000Z',
    ...overrides,
  }
}

describe('knowledge-insights', () => {
  it('derives entity counts from structured KB files', () => {
    const insights = buildKnowledgeInsights([
      mockKBFile({
        id: 'char-1',
        title: 'Mara',
        file_type: 'characters',
        content: 'A stubborn pilot with a long memory.',
      }),
      mockKBFile({
        id: 'place-1',
        title: 'Port Meridian',
        file_type: 'world-building',
        content: 'A floating city where ships are repaired.',
      }),
      mockKBFile({
        id: 'theme-1',
        title: 'Inheritance',
        file_type: 'thematic-through-lines',
        content: 'The tension between duty and freedom.',
      }),
    ])

    expect(insights.countsByType.person).toBe(1)
    expect(insights.countsByType.place).toBe(1)
    expect(insights.countsByType.theme).toBe(1)
    expect(insights.countsByType.event).toBe(0)
  })

  it('creates graph relationships from the relationships map and fills placeholders', () => {
    const insights = buildKnowledgeInsights([
      mockKBFile({
        id: 'char-1',
        title: 'Mara',
        file_type: 'characters',
        content: 'A stubborn pilot with a long memory and a difficult past.',
      }),
      mockKBFile({
        id: 'rel-1',
        title: 'Relationships Map',
        file_type: 'relationships-map',
        content: 'Mara --[protects]--> Sol: She acts like an older sister.',
      }),
    ])

    expect(insights.relationships).toHaveLength(1)
    expect(insights.relationships[0]?.relationship_type).toBe('protects')
    expect(insights.entities.some((entity) => entity.name === 'Sol')).toBe(true)
    expect(
      insights.entities.find((entity) => entity.name === 'Sol')?.is_placeholder
    ).toBe(true)
  })

  it('marks low-context nodes as unresolved', () => {
    const insights = buildKnowledgeInsights([
      mockKBFile({
        id: 'char-1',
        title: 'Mara',
        file_type: 'characters',
        content: 'Pilot',
      }),
    ])

    expect(insights.unresolved.map((entity) => entity.name)).toContain('Mara')
  })
})
