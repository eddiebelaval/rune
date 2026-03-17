// Shared text utilities — single source of truth for word counting

import type { KnowledgeScope } from '../types/knowledge'

/**
 * Count words in a string. Handles empty/whitespace-only input.
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0
  return text.trim().split(/\s+/).length
}

/**
 * Get the scope hierarchy for a given scope level.
 * Local sees global+regional+local. Regional sees global+regional. Global sees global.
 */
export function getScopeHierarchy(scope: KnowledgeScope): KnowledgeScope[] {
  switch (scope) {
    case 'global': return ['global']
    case 'regional': return ['global', 'regional']
    case 'local': return ['global', 'regional', 'local']
    case 'session': return ['global', 'regional', 'local', 'session']
  }
}
