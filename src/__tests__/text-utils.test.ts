import { describe, it, expect } from 'vitest'
import { countWords, getScopeHierarchy } from '../lib/text-utils'

describe('countWords', () => {
  it('counts words in a normal string', () => {
    expect(countWords('hello world')).toBe(2)
  })

  it('handles multiple spaces between words', () => {
    expect(countWords('hello    world   foo')).toBe(3)
  })

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('returns 0 for whitespace-only string', () => {
    expect(countWords('   ')).toBe(0)
  })

  it('returns 0 for null-like input', () => {
    expect(countWords(null as unknown as string)).toBe(0)
    expect(countWords(undefined as unknown as string)).toBe(0)
  })

  it('handles leading and trailing whitespace', () => {
    expect(countWords('  hello world  ')).toBe(2)
  })

  it('handles single word', () => {
    expect(countWords('hello')).toBe(1)
  })

  it('handles newlines and tabs', () => {
    expect(countWords('hello\nworld\tfoo')).toBe(3)
  })

  it('handles a realistic paragraph', () => {
    const paragraph = 'The kingdom of Ashara sits at the edge of the known world, where the desert meets the sea.'
    expect(countWords(paragraph)).toBe(18)
  })
})

describe('getScopeHierarchy', () => {
  it('global scope returns only global', () => {
    expect(getScopeHierarchy('global')).toEqual(['global'])
  })

  it('regional scope returns global + regional', () => {
    expect(getScopeHierarchy('regional')).toEqual(['global', 'regional'])
  })

  it('local scope returns global + regional + local', () => {
    expect(getScopeHierarchy('local')).toEqual(['global', 'regional', 'local'])
  })

  it('session scope returns all four', () => {
    expect(getScopeHierarchy('session')).toEqual(['global', 'regional', 'local', 'session'])
  })
})
