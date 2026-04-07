'use client'

import { useState } from 'react'

export interface SynthesisEntity {
  name: string
  type: string
  description: string
}

export interface SynthesisBacklogItem {
  type: string
  content: string
}

export interface SynthesisWorkspaceFile {
  room: string
  category: string
  title: string
}

interface SynthesisSummaryCardProps {
  summary: string
  entities: SynthesisEntity[]
  backlogItems: SynthesisBacklogItem[]
  workspaceFiles: SynthesisWorkspaceFile[]
  onDismiss: () => void
  timestamp: string
}

function entityTypeColor(type: string): string {
  switch (type) {
    case 'person': return 'var(--rune-gold)'
    case 'place': return 'var(--rune-teal)'
    case 'theme': return 'var(--rune-muted)'
    default: return 'var(--rune-text)'
  }
}

function formatTimeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function SynthesisSummaryCard({
  summary,
  entities,
  backlogItems,
  workspaceFiles,
  onDismiss,
  timestamp,
}: SynthesisSummaryCardProps) {
  const [showEntities, setShowEntities] = useState(false)
  const [showBacklog, setShowBacklog] = useState(false)
  const [showFiles, setShowFiles] = useState(false)

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        background: 'color-mix(in srgb, var(--rune-teal) 4%, var(--rune-surface))',
        borderColor: 'var(--rune-border)',
        borderLeftColor: 'var(--rune-teal)',
        borderLeftWidth: '3px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{
              color: 'var(--rune-teal)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            }}
          >
            Session Synthesis
          </span>
          <span className="text-[10px]" style={{ color: 'var(--rune-muted)' }}>
            {formatTimeAgo(timestamp)}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs cursor-pointer p-1 rounded transition-colors duration-150"
          style={{ color: 'var(--rune-muted)' }}
          aria-label="Dismiss synthesis summary"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Summary text */}
      <div
        className="px-3 py-2 text-xs leading-relaxed"
        style={{
          color: 'var(--rune-text)',
          fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
        }}
      >
        {summary}
      </div>

      {/* Collapsible sections */}
      <div className="px-3 pb-3 space-y-1">
        {/* Entities */}
        {entities.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowEntities(!showEntities)}
              className="flex items-center gap-1.5 text-[11px] cursor-pointer w-full py-1"
              style={{ color: 'var(--rune-muted)' }}
            >
              <svg
                width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ transform: showEntities ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
              >
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {entities.length} {entities.length === 1 ? 'entity' : 'entities'} extracted
            </button>
            {showEntities && (
              <div className="flex flex-wrap gap-1.5 pt-1 pb-1">
                {entities.map((entity, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${entityTypeColor(entity.type)} 10%, transparent)`,
                      color: entityTypeColor(entity.type),
                    }}
                    title={entity.description}
                  >
                    {entity.name}
                    <span
                      className="text-[9px] uppercase"
                      style={{
                        opacity: 0.7,
                        fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                      }}
                    >
                      {entity.type}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Backlog items */}
        {backlogItems.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowBacklog(!showBacklog)}
              className="flex items-center gap-1.5 text-[11px] cursor-pointer w-full py-1"
              style={{ color: 'var(--rune-muted)' }}
            >
              <svg
                width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ transform: showBacklog ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
              >
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {backlogItems.length} {backlogItems.length === 1 ? 'item' : 'items'} added to backlog
            </button>
            {showBacklog && (
              <div className="space-y-1 pt-1 pb-1">
                {backlogItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span
                      className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded flex-shrink-0 mt-0.5"
                      style={{
                        color: 'var(--rune-gold)',
                        background: 'color-mix(in srgb, var(--rune-gold) 10%, transparent)',
                        fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                      }}
                    >
                      {item.type}
                    </span>
                    <span style={{ color: 'var(--rune-text)' }}>{item.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workspace files */}
        {workspaceFiles.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowFiles(!showFiles)}
              className="flex items-center gap-1.5 text-[11px] cursor-pointer w-full py-1"
              style={{ color: 'var(--rune-muted)' }}
            >
              <svg
                width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ transform: showFiles ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
              >
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {workspaceFiles.length} {workspaceFiles.length === 1 ? 'file' : 'files'} created
            </button>
            {showFiles && (
              <div className="space-y-1 pt-1 pb-1">
                {workspaceFiles.map((file, i) => (
                  <div key={i} className="text-[11px]" style={{ color: 'var(--rune-text)' }}>
                    <span style={{ color: 'var(--rune-muted)' }}>{file.room} / {file.category} /</span>{' '}
                    {file.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
