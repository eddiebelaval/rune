import { describe, it, expect } from 'vitest'
import { KB_TOOLS } from '../lib/ai/kb-tools-schema'

describe('KB_TOOLS schema', () => {
  it('defines 5 tools', () => {
    expect(KB_TOOLS).toHaveLength(5)
  })

  it('has correct tool names', () => {
    const names = KB_TOOLS.map((t) => t.name)
    expect(names).toContain('create_kb_entry')
    expect(names).toContain('update_kb_entry')
    expect(names).toContain('search_kb')
    expect(names).toContain('get_kb_entry')
    expect(names).toContain('list_kb_files')
  })

  it('each tool has name, description, and input_schema', () => {
    for (const tool of KB_TOOLS) {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.input_schema).toBeTruthy()
      expect(tool.input_schema.type).toBe('object')
    }
  })

  it('create_kb_entry requires title, content, file_type', () => {
    const tool = KB_TOOLS.find((t) => t.name === 'create_kb_entry')!
    const required = (tool.input_schema as { required?: string[] }).required ?? []
    expect(required).toContain('title')
    expect(required).toContain('content')
    expect(required).toContain('file_type')
  })

  it('update_kb_entry requires file_id and content', () => {
    const tool = KB_TOOLS.find((t) => t.name === 'update_kb_entry')!
    const required = (tool.input_schema as { required?: string[] }).required ?? []
    expect(required).toContain('file_id')
    expect(required).toContain('content')
  })

  it('search_kb requires query', () => {
    const tool = KB_TOOLS.find((t) => t.name === 'search_kb')!
    const required = (tool.input_schema as { required?: string[] }).required ?? []
    expect(required).toContain('query')
  })

  it('get_kb_entry requires file_id', () => {
    const tool = KB_TOOLS.find((t) => t.name === 'get_kb_entry')!
    const required = (tool.input_schema as { required?: string[] }).required ?? []
    expect(required).toContain('file_id')
  })

  it('file_type enum includes all KB layer types', () => {
    const tool = KB_TOOLS.find((t) => t.name === 'create_kb_entry')!
    const props = (tool.input_schema as { properties: Record<string, { enum?: string[] }> }).properties
    const fileTypeEnum = props.file_type.enum ?? []
    expect(fileTypeEnum).toContain('characters')
    expect(fileTypeEnum).toContain('world-building')
    expect(fileTypeEnum).toContain('lore')
    expect(fileTypeEnum).toContain('relationships-map')
    expect(fileTypeEnum).toContain('timeline')
    expect(fileTypeEnum).toContain('story-planning')
  })
})
