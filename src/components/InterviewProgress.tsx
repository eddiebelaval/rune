'use client'

import { useMemo, useState } from 'react'
import type { BookType } from '@/types/database'
import type { KnowledgeFile } from '@/types/knowledge'
import { InterviewEngine } from '@/lib/interviews/engine'

interface InterviewProgressProps {
  bookType: BookType
  kbFiles: KnowledgeFile[]
  onQuickPrompt: (message: string) => Promise<void>
}

export default function InterviewProgress({
  bookType,
  kbFiles,
  onQuickPrompt,
}: InterviewProgressProps) {
  const [showRevisit, setShowRevisit] = useState(false)

  const engine = useMemo(
    () => new InterviewEngine(bookType, kbFiles),
    [bookType, kbFiles],
  )

  const progress = useMemo(() => engine.getQuestionProgress(), [engine])
  const nextQuestion = useMemo(() => engine.getNextQuestion(), [engine])
  const revisitSuggestions = useMemo(() => engine.getRevisitSuggestions(), [engine])
  const answeredCount = progress.filter((item) => item.answered).length

  return (
    <div
      className="mb-3 rounded-lg border p-4"
      style={{
        background: 'var(--rune-surface)',
        borderColor: 'var(--rune-border)',
      }}
    >
      {/* Header */}
      <div
        className="mb-2 text-xs uppercase tracking-wider"
        style={{
          color: 'var(--rune-teal)',
          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
        }}
      >
        Interview Progress
      </div>

      {/* Summary */}
      <div
        className="mb-1 text-sm font-semibold"
        style={{
          color: 'var(--rune-heading)',
          fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
        }}
      >
        {answeredCount} of {progress.length} guided topics covered
      </div>

      {/* Progress bar */}
      <div
        className="mb-4 h-1 w-full rounded-full overflow-hidden"
        style={{ background: 'var(--rune-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress.length > 0 ? (answeredCount / progress.length) * 100 : 0}%`,
            background: answeredCount === progress.length ? 'var(--rune-teal)' : 'var(--rune-gold)',
          }}
        />
      </div>

      {/* Stepper checklist */}
      <div className="mb-4 space-y-0">
        {progress.map((node, index) => (
          <div key={node.id} className="flex items-start gap-3">
            {/* Vertical line + circle */}
            <div className="flex flex-col items-center" style={{ width: '16px' }}>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                style={{
                  background: node.answered ? 'var(--rune-teal)' : 'transparent',
                  border: node.answered
                    ? '2px solid var(--rune-teal)'
                    : '2px solid var(--rune-border)',
                }}
              />
              {index < progress.length - 1 && (
                <div
                  className="w-px flex-1 min-h-[12px]"
                  style={{
                    background: node.answered ? 'var(--rune-teal)' : 'var(--rune-border)',
                  }}
                />
              )}
            </div>

            {/* Label + badge */}
            <div className="flex items-center gap-2 pb-2 min-h-[24px]">
              <span
                className="text-xs"
                style={{
                  color: node.answered ? 'var(--rune-heading)' : 'var(--rune-muted)',
                  fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
                  textDecoration: node.answered ? 'none' : 'none',
                }}
              >
                {node.targetTitle}
              </span>
              {node.required && !node.answered && (
                <span
                  className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: 'var(--rune-gold)',
                    background: 'color-mix(in srgb, var(--rune-gold) 12%, transparent)',
                    fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                  }}
                >
                  Required
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Next question card */}
      {nextQuestion && (
        <button
          type="button"
          onClick={() => void onQuickPrompt(nextQuestion.question)}
          className="mb-3 w-full rounded-lg px-3 py-2.5 text-left text-xs cursor-pointer transition-colors duration-150"
          style={{
            background: 'color-mix(in srgb, var(--rune-teal) 8%, transparent)',
            color: 'var(--rune-heading)',
            borderLeft: '3px solid var(--rune-teal)',
            border: '1px solid var(--rune-border)',
            borderLeftColor: 'var(--rune-teal)',
            borderLeftWidth: '3px',
          }}
        >
          <div
            className="text-[10px] uppercase tracking-wider mb-1"
            style={{
              color: 'var(--rune-teal)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            }}
          >
            Ask Next
          </div>
          <div style={{ color: 'var(--rune-text)' }}>{nextQuestion.question}</div>
        </button>
      )}

      {/* All done message */}
      {!nextQuestion && (
        <div className="mb-3 text-xs" style={{ color: 'var(--rune-muted)' }}>
          Core interview topics are covered. This is a good moment to deepen weak spots.
        </div>
      )}

      {/* Revisit suggestions (collapsible) */}
      {revisitSuggestions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowRevisit(!showRevisit)}
            className="flex items-center gap-1.5 text-xs cursor-pointer mb-2"
            style={{ color: 'var(--rune-muted)' }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="transition-transform duration-200"
              style={{ transform: showRevisit ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Deepen existing topics
          </button>

          {showRevisit && (
            <div className="space-y-1.5">
              {revisitSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void onQuickPrompt(suggestion)}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs cursor-pointer transition-colors duration-150"
                  style={{
                    background: 'var(--rune-bg)',
                    color: 'var(--rune-text)',
                    border: '1px solid var(--rune-border)',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
