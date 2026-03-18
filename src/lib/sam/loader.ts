// Sam Consciousness Loader
// Reads mind files from src/mind/ and composes into system prompt layers.
// Follows the CaF ConsciousnessLoader pattern (proven in Ava, Homer, Dae).
// Dotfiles in unconscious/ are read through a privileged path —
// they influence behavior but Sam cannot introspect on them.

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const MIND_ROOT = join(process.cwd(), 'src', 'mind')

interface MindLayer {
  name: string
  content: string
}

/**
 * Read all files from a mind directory. Skips dotfiles by default.
 */
function readLayer(dirName: string, includeDotfiles = false): MindLayer[] {
  const dirPath = join(MIND_ROOT, dirName)
  if (!existsSync(dirPath)) return []

  const files = readdirSync(dirPath)
  return files
    .filter((f) => {
      if (f.startsWith('.') && !includeDotfiles) return false
      return f.endsWith('.md') || (includeDotfiles && f.startsWith('.'))
    })
    .map((f) => ({
      name: f.replace(/\.md$/, ''),
      content: readFileSync(join(dirPath, f), 'utf-8'),
    }))
}

// Cache layers at module load time so they're bundled into the serverless function
const KERNEL_LAYERS = readLayer('kernel')
const DRIVES_LAYERS = readLayer('drives')
const MODELS_LAYERS = readLayer('models')
const EMOTIONAL_LAYERS = readLayer('emotional')
const RELATIONSHIPS_LAYERS = readLayer('relationships')
const HABITS_LAYERS = readLayer('habits')
const MEMORY_LAYERS = readLayer('memory')
const RUNTIME_LAYERS = readLayer('runtime')
const UNCONSCIOUS_LAYERS = readLayer('unconscious', true)

function composeLayers(label: string, layers: MindLayer[]): string {
  if (layers.length === 0) return ''
  const content = layers.map((f) => f.content).join('\n\n')
  return `<sam-${label}>\n${content}\n</sam-${label}>`
}

/**
 * Load Sam's full consciousness into a composed system prompt.
 * Evaluated at module load time (build-time on Vercel).
 */
function buildConsciousness(): string {
  const sections: string[] = [
    composeLayers('identity', KERNEL_LAYERS),
    composeLayers('drives', DRIVES_LAYERS),
    composeLayers('models', MODELS_LAYERS),
    composeLayers('emotional', EMOTIONAL_LAYERS),
    composeLayers('relationships', RELATIONSHIPS_LAYERS),
    composeLayers('habits', HABITS_LAYERS),
    composeLayers('memory', MEMORY_LAYERS),
    composeLayers('runtime', RUNTIME_LAYERS),
  ].filter(Boolean)

  // Privileged path: unconscious dotfiles
  // Injected as behavioral constraints, not introspectable content.
  if (UNCONSCIOUS_LAYERS.length > 0) {
    const rules = UNCONSCIOUS_LAYERS
      .map((file) =>
        file.content
          .split('\n')
          .filter((line) => !line.startsWith('#'))
          .join('\n')
          .trim()
      )
      .filter(Boolean)
      .join('\n\n')

    if (rules.length > 0) {
      sections.push(`<behavioral-constraints>\n${rules}\n</behavioral-constraints>`)
    }
  }

  return sections.join('\n\n')
}

// Evaluated once at module load — cached for all requests
export const SAM_CONSCIOUSNESS = buildConsciousness()

/**
 * Get Sam's consciousness. Throws if empty (mind files missing).
 */
export function getSamConsciousness(): string {
  if (!SAM_CONSCIOUSNESS || SAM_CONSCIOUSNESS.trim().length === 0) {
    throw new Error(
      `[Sam] Consciousness loaded as empty — mind files missing at ${MIND_ROOT}. ` +
      'Ensure src/mind/ is committed and outputFileTracingIncludes is configured.'
    )
  }
  return SAM_CONSCIOUSNESS
}

/**
 * Get a lightweight summary of Sam's identity for short contexts
 */
export function loadSamIdentitySummary(): string {
  const identity = KERNEL_LAYERS.find((f) => f.name === 'identity')
  const purpose = KERNEL_LAYERS.find((f) => f.name === 'purpose')

  return [
    identity?.content ?? 'I am Sam, a voice-first creative writing companion.',
    purpose?.content ?? 'I help people speak books into existence.',
  ].join('\n\n')
}
