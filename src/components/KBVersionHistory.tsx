'use client'

import { useState, useEffect, useCallback } from 'react'
import type { KBFileVersion } from '@/types/knowledge'

interface KBVersionHistoryProps {
  fileId: string
  fileName: string
  currentContent: string
  onClose: () => void
}

function formatTimeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(dateString).toLocaleDateString()
}

function changeTypeBadgeColor(changeType: string | undefined): string {
  switch (changeType) {
    case 'major': return 'var(--rune-gold)'
    case 'minor': return 'var(--rune-teal)'
    default: return 'var(--rune-muted)'
  }
}

export default function KBVersionHistory({
  fileId,
  fileName,
  currentContent,
  onClose,
}: KBVersionHistoryProps) {
  const [versions, setVersions] = useState<KBFileVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<KBFileVersion | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreSuccess, setRestoreSuccess] = useState(false)

  const fetchVersions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/kb-history?fileId=${fileId}`)
      if (!response.ok) throw new Error('Failed to load')
      const payload = await response.json()
      setVersions((payload.versions ?? []) as KBFileVersion[])
    } catch (error) {
      console.error('[KBVersionHistory] Failed to fetch:', error)
      setVersions([])
    } finally {
      setIsLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const handleRestore = async (version: number) => {
    setIsRestoring(true)
    try {
      const response = await fetch('/api/kb-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, version }),
      })
      if (!response.ok) throw new Error('Restore failed')

      setConfirmRestore(null)
      setSelectedVersion(null)
      setRestoreSuccess(true)
      await fetchVersions()

      setTimeout(() => setRestoreSuccess(false), 3000)
    } catch (error) {
      console.error('[KBVersionHistory] Restore failed:', error)
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div
      className="mt-3 rounded-lg border"
      style={{
        background: 'var(--rune-surface)',
        borderColor: 'var(--rune-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--rune-border)' }}
      >
        <div>
          <div
            className="text-xs uppercase tracking-wider mb-0.5"
            style={{
              color: 'var(--rune-gold)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            }}
          >
            Version History
          </div>
          <div
            className="text-sm font-semibold"
            style={{
              color: 'var(--rune-heading)',
              fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
            }}
          >
            {fileName}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs cursor-pointer px-2 py-1 rounded transition-colors duration-150"
          style={{ color: 'var(--rune-muted)' }}
        >
          Close
        </button>
      </div>

      {/* Success banner */}
      {restoreSuccess && (
        <div
          className="px-4 py-2 text-xs"
          style={{
            background: 'color-mix(in srgb, var(--rune-teal) 10%, transparent)',
            color: 'var(--rune-teal)',
            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
          }}
        >
          Version restored successfully
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="px-4 py-6 text-xs text-center" style={{ color: 'var(--rune-muted)' }}>
          Loading version history...
        </div>
      )}

      {/* Empty */}
      {!isLoading && versions.length === 0 && (
        <div className="px-4 py-6 text-xs text-center" style={{ color: 'var(--rune-muted)' }}>
          No version snapshots found for this file yet.
        </div>
      )}

      {/* Version list */}
      {!isLoading && versions.length > 0 && (
        <div className="p-3 space-y-2">
          {versions.map((version) => {
            const isSelected = selectedVersion?.id === version.id
            const isConfirming = confirmRestore === version.version
            const badgeColor = changeTypeBadgeColor(version.version_metadata?.change_type)

            return (
              <div key={version.id}>
                <button
                  type="button"
                  onClick={() => setSelectedVersion(isSelected ? null : version)}
                  className="w-full rounded-lg border px-3 py-2 text-left cursor-pointer transition-colors duration-150"
                  style={{
                    background: isSelected ? 'var(--rune-elevated)' : 'var(--rune-bg)',
                    borderColor: isSelected ? badgeColor : 'var(--rune-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'var(--rune-heading)' }}
                      >
                        v{version.semantic_version}
                      </span>
                      {version.version_metadata?.change_type && (
                        <span
                          className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            color: badgeColor,
                            background: `color-mix(in srgb, ${badgeColor} 12%, transparent)`,
                            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                          }}
                        >
                          {version.version_metadata.change_type}
                        </span>
                      )}
                      {typeof version.version_metadata?.restored_from_version === 'number' && (
                        <span
                          className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            color: 'var(--rune-muted)',
                            background: 'color-mix(in srgb, var(--rune-muted) 12%, transparent)',
                            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                          }}
                        >
                          restored from v{version.version_metadata.restored_from_version}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--rune-muted)' }}>
                      {formatTimeAgo(version.created_at)}
                    </span>
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--rune-muted)' }}>
                    {version.version_metadata?.change_summary
                      ? String(version.version_metadata.change_summary)
                      : 'Snapshot available'}
                    {typeof version.version_metadata?.confidence === 'number'
                      ? ` -- ${Math.round(version.version_metadata.confidence * 100)}% confidence`
                      : ''}
                  </div>
                </button>

                {/* Content comparison panel */}
                {isSelected && (
                  <div
                    className="mt-1 rounded-lg border p-3"
                    style={{
                      background: 'var(--rune-bg)',
                      borderColor: 'var(--rune-border)',
                    }}
                  >
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Current */}
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-wider mb-1"
                          style={{
                            color: 'var(--rune-teal)',
                            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                          }}
                        >
                          Current
                        </div>
                        <div
                          className="text-[11px] leading-relaxed whitespace-pre-wrap rounded p-2"
                          style={{
                            background: 'var(--rune-surface)',
                            color: 'var(--rune-text)',
                            maxHeight: '160px',
                            overflowY: 'auto',
                            fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
                          }}
                        >
                          {currentContent || 'Empty'}
                        </div>
                      </div>
                      {/* Selected version */}
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-wider mb-1"
                          style={{
                            color: 'var(--rune-gold)',
                            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                          }}
                        >
                          v{version.semantic_version}
                        </div>
                        <div
                          className="text-[11px] leading-relaxed whitespace-pre-wrap rounded p-2"
                          style={{
                            background: 'var(--rune-surface)',
                            color: 'var(--rune-text)',
                            maxHeight: '160px',
                            overflowY: 'auto',
                            fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
                          }}
                        >
                          {version.content || 'Empty'}
                        </div>
                      </div>
                    </div>

                    {/* Restore action */}
                    {!isConfirming ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmRestore(version.version)
                        }}
                        className="w-full rounded px-3 py-1.5 text-xs cursor-pointer transition-colors duration-150"
                        style={{
                          background: 'color-mix(in srgb, var(--rune-gold) 12%, transparent)',
                          color: 'var(--rune-gold)',
                          border: 'none',
                        }}
                      >
                        Restore this version
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] flex-1" style={{ color: 'var(--rune-text)' }}>
                          Create new version from v{version.semantic_version} snapshot?
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleRestore(version.version)
                          }}
                          disabled={isRestoring}
                          className="rounded px-3 py-1 text-xs cursor-pointer"
                          style={{
                            background: 'var(--rune-gold)',
                            color: 'white',
                            opacity: isRestoring ? 0.6 : 1,
                          }}
                        >
                          {isRestoring ? 'Restoring...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmRestore(null)
                          }}
                          className="rounded px-3 py-1 text-xs cursor-pointer"
                          style={{ color: 'var(--rune-muted)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
