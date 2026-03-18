import { describe, it, expect } from 'vitest'
import {
  inferFolderAndScope,
  getPredefinedFiles,
  FOUNDATION_FILES,
  STRATEGY_FILES,
  ASSETS_FILES,
  FILE_TYPE_FOLDER_MAP,
  FOLDER_SCOPE_MAP,
} from '../types/folder-system'

describe('inferFolderAndScope', () => {
  it('characters -> foundation/global', () => {
    const result = inferFolderAndScope('characters')
    expect(result.folder_type).toBe('foundation')
    expect(result.scope).toBe('global')
    expect(result.folder_path).toBe('foundation/characters')
  })

  it('world-building -> foundation/global', () => {
    const result = inferFolderAndScope('world-building')
    expect(result.folder_type).toBe('foundation')
    expect(result.scope).toBe('global')
  })

  it('story-planning -> strategy/regional', () => {
    const result = inferFolderAndScope('story-planning')
    expect(result.folder_type).toBe('strategy')
    expect(result.scope).toBe('regional')
  })

  it('chapter-outlines -> strategy/regional', () => {
    const result = inferFolderAndScope('chapter-outlines')
    expect(result.folder_type).toBe('strategy')
    expect(result.scope).toBe('regional')
  })

  it('drafts -> drafts/local', () => {
    const result = inferFolderAndScope('drafts')
    expect(result.folder_type).toBe('drafts')
    expect(result.scope).toBe('local')
  })

  it('research -> assets/global', () => {
    const result = inferFolderAndScope('research')
    expect(result.folder_type).toBe('assets')
    expect(result.scope).toBe('global')
  })

  it('lore -> foundation/global', () => {
    const result = inferFolderAndScope('lore')
    expect(result.folder_type).toBe('foundation')
    expect(result.scope).toBe('global')
  })

  it('relationships-map -> foundation/global', () => {
    const result = inferFolderAndScope('relationships-map')
    expect(result.folder_type).toBe('foundation')
    expect(result.scope).toBe('global')
  })

  it('thematic-through-lines -> strategy/regional', () => {
    const result = inferFolderAndScope('thematic-through-lines')
    expect(result.folder_type).toBe('strategy')
    expect(result.scope).toBe('regional')
  })
})

describe('getPredefinedFiles', () => {
  it('foundation returns 6 predefined files', () => {
    const files = getPredefinedFiles('foundation')
    expect(files).toHaveLength(6)
    expect(files.map((f) => f.title)).toContain('World Bible')
    expect(files.map((f) => f.title)).toContain('Character Profiles')
    expect(files.map((f) => f.title)).toContain('Timeline')
  })

  it('strategy returns 4 predefined files', () => {
    const files = getPredefinedFiles('strategy')
    expect(files).toHaveLength(4)
    expect(files.map((f) => f.title)).toContain('Story Arc')
    expect(files.map((f) => f.title)).toContain('Chapter Outlines')
  })

  it('assets returns 3 predefined files', () => {
    const files = getPredefinedFiles('assets')
    expect(files).toHaveLength(3)
  })

  it('drafts returns empty array', () => {
    expect(getPredefinedFiles('drafts')).toHaveLength(0)
  })

  it('sandbox returns empty array', () => {
    expect(getPredefinedFiles('sandbox')).toHaveLength(0)
  })

  it('production returns empty array', () => {
    expect(getPredefinedFiles('production')).toHaveLength(0)
  })
})

describe('constants integrity', () => {
  it('every file type has a folder mapping', () => {
    const allTypes = [
      'characters', 'world-building', 'lore', 'relationships-map', 'timeline',
      'story-planning', 'chapter-outlines', 'character-journeys', 'thematic-through-lines',
      'drafts', 'sandbox', 'research', 'references',
    ] as const
    for (const type of allTypes) {
      expect(FILE_TYPE_FOLDER_MAP[type]).toBeDefined()
    }
  })

  it('every folder type has a scope mapping', () => {
    const allFolders = ['foundation', 'strategy', 'drafts', 'sandbox', 'production', 'assets'] as const
    for (const folder of allFolders) {
      expect(FOLDER_SCOPE_MAP[folder]).toBeDefined()
    }
  })

  it('FOUNDATION_FILES all have valid file types', () => {
    for (const file of FOUNDATION_FILES) {
      expect(FILE_TYPE_FOLDER_MAP[file.file_type]).toBe('foundation')
    }
  })

  it('STRATEGY_FILES all have valid file types', () => {
    for (const file of STRATEGY_FILES) {
      expect(FILE_TYPE_FOLDER_MAP[file.file_type]).toBe('strategy')
    }
  })

  it('ASSETS_FILES all have valid file types', () => {
    for (const file of ASSETS_FILES) {
      expect(FILE_TYPE_FOLDER_MAP[file.file_type]).toBe('assets')
    }
  })
})
