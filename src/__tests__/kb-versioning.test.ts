import { describe, it, expect } from 'vitest'
import {
  determineVersionType,
  bumpSemanticVersion,
  generateChangeSummary,
} from '../lib/kb-versioning'

describe('determineVersionType', () => {
  it('returns major for empty old content', () => {
    expect(determineVersionType('', 'new content here')).toBe('major')
  })

  it('returns major for whitespace-only old content', () => {
    expect(determineVersionType('   ', 'new content here')).toBe('major')
  })

  it('returns major for >50% content change', () => {
    const old = 'one two three four five'
    const newer = 'one two three four five six seven eight nine ten eleven twelve thirteen'
    expect(determineVersionType(old, newer)).toBe('major')
  })

  it('returns minor for 10-50% content change', () => {
    const old = 'one two three four five six seven eight nine ten'
    const newer = 'one two three four five six seven eight nine ten eleven twelve'
    expect(determineVersionType(old, newer)).toBe('minor')
  })

  it('returns patch for small edits', () => {
    const old = 'one two three four five six seven eight nine ten'
    const newer = 'one two three four five six seven eight nine eleven'
    expect(determineVersionType(old, newer)).toBe('patch')
  })

  it('returns patch for same length content', () => {
    const old = 'hello world foo'
    const newer = 'hello earth bar'
    expect(determineVersionType(old, newer)).toBe('patch')
  })
})

describe('bumpSemanticVersion', () => {
  it('bumps major version', () => {
    expect(bumpSemanticVersion('1.2.3', 'major')).toBe('2.0.0')
  })

  it('bumps minor version', () => {
    expect(bumpSemanticVersion('1.2.3', 'minor')).toBe('1.3.0')
  })

  it('bumps patch version', () => {
    expect(bumpSemanticVersion('1.2.3', 'patch')).toBe('1.2.4')
  })

  it('handles initial version', () => {
    expect(bumpSemanticVersion('1.0.0', 'patch')).toBe('1.0.1')
  })

  it('handles version with high numbers', () => {
    expect(bumpSemanticVersion('5.12.99', 'patch')).toBe('5.12.100')
  })

  it('handles major bump resets minor and patch', () => {
    expect(bumpSemanticVersion('3.7.22', 'major')).toBe('4.0.0')
  })

  it('handles minor bump resets patch', () => {
    expect(bumpSemanticVersion('2.5.14', 'minor')).toBe('2.6.0')
  })
})

describe('generateChangeSummary', () => {
  it('reports added words', () => {
    const result = generateChangeSummary('hello world', 'hello world foo bar baz')
    expect(result).toMatch(/Added ~3 words/)
  })

  it('reports removed words', () => {
    const result = generateChangeSummary('hello world foo bar baz', 'hello world')
    expect(result).toMatch(/Removed ~3 words/)
  })

  it('reports same length edit', () => {
    const result = generateChangeSummary('hello world', 'goodbye earth')
    expect(result).toBe('Content edited (same length)')
  })

  it('handles empty old content', () => {
    const result = generateChangeSummary('', 'hello world')
    expect(result).toMatch(/Added ~2 words/)
  })
})
