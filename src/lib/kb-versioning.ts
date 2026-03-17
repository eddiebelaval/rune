// KB Version Tracking
// Determines version type (major/minor/patch) and manages semantic versions

export type VersionBumpType = 'major' | 'minor' | 'patch'

/**
 * Determine what kind of version bump based on content changes
 */
export function determineVersionType(
  oldContent: string,
  newContent: string
): VersionBumpType {
  if (!oldContent || oldContent.trim().length === 0) return 'major'

  const oldWords = oldContent.split(/\s+/).filter(Boolean)
  const newWords = newContent.split(/\s+/).filter(Boolean)

  const lengthRatio = Math.abs(newWords.length - oldWords.length) / Math.max(oldWords.length, 1)

  // >50% content change = major
  if (lengthRatio > 0.5) return 'major'

  // >10% content change = minor
  if (lengthRatio > 0.1) return 'minor'

  // Small edits = patch
  return 'patch'
}

/**
 * Bump a semantic version string
 */
export function bumpSemanticVersion(
  current: string,
  bumpType: VersionBumpType
): string {
  const parts = current.split('.').map(Number)
  const major = parts[0] ?? 1
  const minor = parts[1] ?? 0
  const patch = parts[2] ?? 0

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
  }
}

/**
 * Generate a change summary by comparing old and new content
 */
export function generateChangeSummary(
  oldContent: string,
  newContent: string
): string {
  const oldLen = oldContent.split(/\s+/).filter(Boolean).length
  const newLen = newContent.split(/\s+/).filter(Boolean).length
  const diff = newLen - oldLen

  if (diff > 0) return `Added ~${diff} words`
  if (diff < 0) return `Removed ~${Math.abs(diff)} words`
  return 'Content edited (same length)'
}
