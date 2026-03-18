import { describe, it, expect } from 'vitest'
import {
  buildClassificationPrompt,
  buildExtractionPrompt,
  shouldUpdateExisting,
} from '../lib/interviews/filing'

describe('buildClassificationPrompt', () => {
  it('includes user speech in the prompt', () => {
    const prompt = buildClassificationPrompt('Tell me about the dark forest')
    expect(prompt).toContain('Tell me about the dark forest')
  })

  it('lists all KB layer types', () => {
    const prompt = buildClassificationPrompt('test')
    expect(prompt).toContain('characters')
    expect(prompt).toContain('world-building')
    expect(prompt).toContain('lore')
    expect(prompt).toContain('relationships-map')
    expect(prompt).toContain('timeline')
    expect(prompt).toContain('story-planning')
  })

  it('requests JSON response format', () => {
    const prompt = buildClassificationPrompt('test')
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('file_type')
    expect(prompt).toContain('confidence')
  })
})

describe('buildExtractionPrompt', () => {
  it('includes user speech', () => {
    const prompt = buildExtractionPrompt('She has green eyes and silver hair', 'characters')
    expect(prompt).toContain('green eyes')
    expect(prompt).toContain('silver hair')
  })

  it('includes type-specific structure instructions for characters', () => {
    const prompt = buildExtractionPrompt('test', 'characters')
    expect(prompt).toContain('Character Name')
    expect(prompt).toContain('Physical')
    expect(prompt).toContain('Personality')
  })

  it('includes type-specific structure for world-building', () => {
    const prompt = buildExtractionPrompt('test', 'world-building')
    expect(prompt).toContain('Setting Name')
    expect(prompt).toContain('Sensory Details')
  })

  it('includes type-specific structure for lore', () => {
    const prompt = buildExtractionPrompt('test', 'lore')
    expect(prompt).toContain('How It Works')
    expect(prompt).toContain('Limitations')
  })

  it('includes existing content when provided', () => {
    const prompt = buildExtractionPrompt('new info', 'characters', 'existing character profile')
    expect(prompt).toContain('EXISTING CONTENT')
    expect(prompt).toContain('existing character profile')
  })

  it('does not include existing content section when not provided', () => {
    const prompt = buildExtractionPrompt('new info', 'characters')
    expect(prompt).not.toContain('EXISTING CONTENT')
  })
})

describe('shouldUpdateExisting', () => {
  it('returns false when no existing files of same type', () => {
    const result = shouldUpdateExisting(
      { file_type: 'characters', target_title: 'Kira' },
      []
    )
    expect(result.isUpdate).toBe(false)
  })

  it('returns true for exact title match', () => {
    const result = shouldUpdateExisting(
      { file_type: 'characters', target_title: 'Kira' },
      [{ id: 'f1', file_type: 'characters', title: 'Kira' }]
    )
    expect(result.isUpdate).toBe(true)
    expect(result.existingFileId).toBe('f1')
  })

  it('returns true for partial title match', () => {
    const result = shouldUpdateExisting(
      { file_type: 'characters', target_title: 'Kira' },
      [{ id: 'f1', file_type: 'characters', title: 'Character Profile: Kira' }]
    )
    expect(result.isUpdate).toBe(true)
    expect(result.existingFileId).toBe('f1')
  })

  it('does not match different file types', () => {
    const result = shouldUpdateExisting(
      { file_type: 'characters', target_title: 'Kira' },
      [{ id: 'f1', file_type: 'world-building', title: 'Kira' }]
    )
    expect(result.isUpdate).toBe(false)
  })

  it('returns true for singleton types with any existing file', () => {
    const singletonTypes = ['relationships-map', 'timeline', 'thematic-through-lines', 'story-planning', 'chapter-outlines'] as const
    for (const type of singletonTypes) {
      const result = shouldUpdateExisting(
        { file_type: type, target_title: 'New Entry' },
        [{ id: 'f1', file_type: type, title: 'Existing Entry' }]
      )
      expect(result.isUpdate).toBe(true)
      expect(result.existingFileId).toBe('f1')
    }
  })

  it('creates new for non-singleton types with different titles', () => {
    const result = shouldUpdateExisting(
      { file_type: 'characters', target_title: 'Marcus' },
      [{ id: 'f1', file_type: 'characters', title: 'Kira' }]
    )
    expect(result.isUpdate).toBe(false)
  })
})
