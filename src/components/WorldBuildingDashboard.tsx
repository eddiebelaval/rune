'use client'

import { useMemo } from 'react'
import type { KnowledgeFile, KnowledgeFileType } from '../types/knowledge'

interface WorldBuildingDashboardProps {
  kbFiles: KnowledgeFile[]
  gateScore: number
  gateReady: boolean
  blockers: string[]
  suggestions: string[]
  onLayerClick?: (fileType: KnowledgeFileType) => void
  onAdvanceStage?: () => void
}

interface LayerStatus {
  title: string
  fileType: KnowledgeFileType
  description: string
  populated: boolean
  entryCount: number
  wordCount: number
  lastUpdated: string | null
}

export default function WorldBuildingDashboard({
  kbFiles,
  gateScore,
  gateReady,
  blockers,
  suggestions,
  onLayerClick,
  onAdvanceStage,
}: WorldBuildingDashboardProps) {
  const layers = useMemo((): LayerStatus[] => {
    const foundationTypes: { title: string; fileType: KnowledgeFileType; titleMatch?: string; description: string }[] = [
      { title: 'World Bible', fileType: 'world-building', titleMatch: 'world bible', description: 'Core premise, rules, tone, atmosphere' },
      { title: 'Characters', fileType: 'characters', description: 'People who inhabit your world' },
      { title: 'Settings & Locations', fileType: 'world-building', titleMatch: 'setting', description: 'Where your story takes place' },
      { title: 'Lore & Rules', fileType: 'lore', description: 'Systems, magic, technology, norms' },
      { title: 'Relationships', fileType: 'relationships-map', description: 'How characters connect' },
      { title: 'Timeline', fileType: 'timeline', description: 'When things happen' },
    ]

    return foundationTypes.map((layer) => {
      const files = layer.titleMatch
        ? kbFiles.filter((f) => f.file_type === layer.fileType && f.title.toLowerCase().includes(layer.titleMatch!))
        : kbFiles.filter((f) => f.file_type === layer.fileType)
      const totalWords = files.reduce(
        (sum, f) => sum + (f.metadata?.word_count ?? 0),
        0
      )
      const lastFile = files.length > 0
        ? files.reduce((latest, f) => f.updated_at > latest.updated_at ? f : latest)
        : undefined

      return {
        ...layer,
        populated: files.length > 0 && totalWords > 10,
        entryCount: files.length,
        wordCount: totalWords,
        lastUpdated: lastFile?.updated_at ?? null,
      }
    })
  }, [kbFiles])

  const populatedCount = layers.filter((l) => l.populated).length

  return (
    <div className="space-y-6">
      {/* Progress ring + gate status */}
      <div
        className="flex items-center gap-6 p-5 rounded-lg border"
        style={{ background: 'var(--rune-surface)', borderColor: 'var(--rune-border)' }}
      >
        {/* Circular progress */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke="var(--rune-border)"
              strokeWidth="2.5"
            />
            <circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke={gateReady ? 'var(--rune-teal)' : 'var(--rune-gold)'}
              strokeWidth="2.5"
              strokeDasharray={`${gateScore} ${100 - gateScore}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-lg font-semibold"
              style={{ color: 'var(--rune-heading)', fontFamily: 'var(--font-serif)' }}
            >
              {gateScore}%
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div
            className="text-sm font-semibold mb-1"
            style={{ color: 'var(--rune-heading)', fontFamily: 'var(--font-serif)' }}
          >
            World Building Progress
          </div>
          <div className="text-xs mb-2" style={{ color: 'var(--rune-muted)' }}>
            {populatedCount} of {layers.length} layers populated
          </div>

          {gateReady ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: 'var(--rune-teal)' }}>
                Ready for Story Writing
              </span>
              {onAdvanceStage && (
                <button
                  onClick={onAdvanceStage}
                  className="text-xs font-mono px-3 py-1 rounded cursor-pointer"
                  style={{
                    background: 'color-mix(in srgb, var(--rune-teal) 15%, transparent)',
                    color: 'var(--rune-teal)',
                    border: 'none',
                  }}
                >
                  Start Writing
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs" style={{ color: 'var(--rune-gold)' }}>
              {blockers[0]}
            </div>
          )}
        </div>
      </div>

      {/* Layer cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {layers.map((layer) => (
          <button
            key={layer.title}
            onClick={() => onLayerClick?.(layer.fileType)}
            className="text-left p-4 rounded-lg border transition-colors cursor-pointer"
            style={{
              background: layer.populated ? 'var(--rune-surface)' : 'var(--rune-bg)',
              borderColor: layer.populated ? 'var(--rune-teal)' : 'var(--rune-border)',
              borderWidth: layer.populated ? '1.5px' : '1px',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: layer.populated ? 'var(--rune-teal)' : 'var(--rune-border)',
                }}
              />
              {layer.entryCount > 0 && (
                <span className="text-xs font-mono" style={{ color: 'var(--rune-muted)' }}>
                  {layer.entryCount} {layer.entryCount === 1 ? 'entry' : 'entries'}
                </span>
              )}
            </div>

            <div
              className="text-sm font-semibold mb-1"
              style={{
                color: layer.populated ? 'var(--rune-heading)' : 'var(--rune-muted)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {layer.title}
            </div>

            <div className="text-xs" style={{ color: 'var(--rune-muted)' }}>
              {layer.populated
                ? `${layer.wordCount} words`
                : layer.description}
            </div>
          </button>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div
          className="p-4 rounded-lg border"
          style={{ background: 'var(--rune-elevated)', borderColor: 'var(--rune-border)' }}
        >
          <div
            className="text-xs font-mono uppercase tracking-wider mb-2"
            style={{ color: 'var(--rune-gold)' }}
          >
            Suggestions
          </div>
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--rune-text)' }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
