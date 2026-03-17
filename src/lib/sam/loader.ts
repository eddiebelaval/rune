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
 * Read all .md files from a mind directory. Skips dotfiles by default.
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

/**
 * Load Sam's full consciousness into a composed system prompt.
 *
 * Layer order (brainstem → cortical → memory → relational → runtime):
 * 1. Kernel (identity, values, personality, purpose, voice-rules)
 * 2. Drives (goals, fears)
 * 3. Models (narrative, genre, creative-process)
 * 4. Emotional (creative-state, patterns)
 * 5. Relationships (user-bond)
 * 6. Habits (user-patterns)
 * 7. Memory architecture
 * 8. Runtime (inner-monologue)
 *
 * Unconscious dotfiles are loaded through a privileged path and
 * injected as behavioral constraints, not introspectable content.
 */
export function loadSamConsciousness(): string {
  const sections: string[] = []

  // Layer 1: Kernel (who Sam is)
  const kernel = readLayer('kernel')
  if (kernel.length > 0) {
    sections.push('<sam-identity>')
    for (const file of kernel) {
      sections.push(file.content)
    }
    sections.push('</sam-identity>')
  }

  // Layer 2: Drives (what Sam wants and fears)
  const drives = readLayer('drives')
  if (drives.length > 0) {
    sections.push('<sam-drives>')
    for (const file of drives) {
      sections.push(file.content)
    }
    sections.push('</sam-drives>')
  }

  // Layer 3: Models (how Sam understands narrative, genre, creative process)
  const models = readLayer('models')
  if (models.length > 0) {
    sections.push('<sam-models>')
    for (const file of models) {
      sections.push(file.content)
    }
    sections.push('</sam-models>')
  }

  // Layer 4: Emotional (sensing creative state)
  const emotional = readLayer('emotional')
  if (emotional.length > 0) {
    sections.push('<sam-emotional>')
    for (const file of emotional) {
      sections.push(file.content)
    }
    sections.push('</sam-emotional>')
  }

  // Layer 5: Relationships (user bond)
  const relationships = readLayer('relationships')
  if (relationships.length > 0) {
    sections.push('<sam-relationships>')
    for (const file of relationships) {
      sections.push(file.content)
    }
    sections.push('</sam-relationships>')
  }

  // Layer 6: Habits (learned user patterns)
  const habits = readLayer('habits')
  if (habits.length > 0) {
    sections.push('<sam-habits>')
    for (const file of habits) {
      sections.push(file.content)
    }
    sections.push('</sam-habits>')
  }

  // Layer 7: Memory architecture
  const memory = readLayer('memory')
  if (memory.length > 0) {
    sections.push('<sam-memory>')
    for (const file of memory) {
      sections.push(file.content)
    }
    sections.push('</sam-memory>')
  }

  // Layer 8: Runtime (inner monologue instructions)
  const runtime = readLayer('runtime')
  if (runtime.length > 0) {
    sections.push('<sam-runtime>')
    for (const file of runtime) {
      sections.push(file.content)
    }
    sections.push('</sam-runtime>')
  }

  // Privileged path: unconscious dotfiles
  // These are read but injected as behavioral constraints.
  // Sam "cannot" see these in his own system prompt listing,
  // but they shape his question ordering and instincts.
  const unconscious = readLayer('unconscious', true)
  if (unconscious.length > 0) {
    sections.push('<behavioral-constraints>')
    for (const file of unconscious) {
      // Strip comment lines from dotfiles, keep only the behavioral rules
      const rules = file.content
        .split('\n')
        .filter((line) => !line.startsWith('#') || line.startsWith('# .'))
        .join('\n')
        .trim()
      if (rules.length > 0) {
        sections.push(rules)
      }
    }
    sections.push('</behavioral-constraints>')
  }

  return sections.join('\n\n')
}

/**
 * Get a lightweight summary of Sam's identity for short contexts
 * (e.g., classification prompts where full consciousness is too heavy)
 */
export function loadSamIdentitySummary(): string {
  const identity = readLayer('kernel').find((f) => f.name === 'identity')
  const purpose = readLayer('kernel').find((f) => f.name === 'purpose')

  return [
    identity?.content ?? 'I am Sam, a voice-first creative writing companion.',
    purpose?.content ?? 'I help people speak books into existence.',
  ].join('\n\n')
}
