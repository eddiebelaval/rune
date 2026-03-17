'use client'

import { useState, useEffect, useCallback } from 'react'
import type { KnowledgeFileType } from '../types/knowledge'

interface KBOperationCardProps {
  operationType: 'create' | 'update' | 'activate'
  fileType: KnowledgeFileType
  title: string
  contentPreview: string
  onApprove: () => void
  onDismiss: () => void
  autoApproveSeconds?: number
}

const FILE_TYPE_LABELS: Record<string, string> = {
  'characters': 'Character',
  'world-building': 'World',
  'lore': 'Lore',
  'relationships-map': 'Relationships',
  'timeline': 'Timeline',
  'story-planning': 'Story Arc',
  'chapter-outlines': 'Outline',
  'character-journeys': 'Journey',
  'thematic-through-lines': 'Theme',
  'research': 'Research',
  'references': 'Reference',
  'drafts': 'Draft',
  'sandbox': 'Sandbox',
}

const OP_LABELS: Record<string, string> = {
  create: 'Creating',
  update: 'Updating',
  activate: 'Activating',
}

export default function KBOperationCard({
  operationType,
  fileType,
  title,
  contentPreview,
  onApprove,
  onDismiss,
  autoApproveSeconds = 10,
}: KBOperationCardProps) {
  const [countdown, setCountdown] = useState(autoApproveSeconds)
  const [dismissed, setDismissed] = useState(false)

  const handleApprove = useCallback(() => {
    if (dismissed) return
    onApprove()
  }, [dismissed, onApprove])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    onDismiss()
  }, [onDismiss])

  useEffect(() => {
    if (dismissed) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleApprove()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [dismissed, handleApprove, autoApproveSeconds])

  const opColor = operationType === 'create'
    ? 'var(--rune-gold)'
    : operationType === 'update'
      ? 'var(--rune-teal)'
      : 'var(--rune-muted)'

  return (
    <div
      className="rounded-lg border p-3 animate-in slide-in-from-bottom-2 fade-in duration-300"
      style={{
        background: 'var(--rune-surface)',
        borderColor: 'var(--rune-border)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono uppercase tracking-wider font-semibold"
            style={{ color: opColor }}
          >
            {OP_LABELS[operationType]}
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--rune-elevated)',
              color: 'var(--rune-muted)',
            }}
          >
            {FILE_TYPE_LABELS[fileType] ?? fileType}
          </span>
        </div>
        <span
          className="text-xs font-mono tabular-nums"
          style={{ color: 'var(--rune-muted)' }}
        >
          {countdown}s
        </span>
      </div>

      <div
        className="text-sm font-semibold mb-1"
        style={{ color: 'var(--rune-heading)', fontFamily: 'var(--font-serif)' }}
      >
        {title}
      </div>

      <div
        className="text-xs leading-relaxed mb-3 line-clamp-2"
        style={{ color: 'var(--rune-muted)' }}
      >
        {contentPreview}
      </div>

      {/* Auto-approve progress bar */}
      <div
        className="h-0.5 rounded-full mb-3 overflow-hidden"
        style={{ background: 'var(--rune-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${((autoApproveSeconds - countdown) / autoApproveSeconds) * 100}%`,
            background: opColor,
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          className="flex-1 text-xs font-mono uppercase tracking-wider py-1.5 rounded transition-colors cursor-pointer"
          style={{
            background: 'color-mix(in srgb, var(--rune-teal) 15%, transparent)',
            color: 'var(--rune-teal)',
            border: 'none',
          }}
        >
          Approve
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 text-xs font-mono uppercase tracking-wider py-1.5 rounded transition-colors cursor-pointer"
          style={{
            background: 'var(--rune-elevated)',
            color: 'var(--rune-muted)',
            border: 'none',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
