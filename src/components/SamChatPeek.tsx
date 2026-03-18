'use client'

import { useState } from 'react'

interface SamMessage {
  id: string
  content: string
  timestamp: string
}

interface SamChatPeekProps {
  messages: SamMessage[]
}

/**
 * SamChatPeek — A minimal, mostly-hidden chat history in the corner.
 * Shows one line of Sam's most recent message as a teaser.
 * Click to expand and see full conversation history.
 */
export default function SamChatPeek({ messages }: SamChatPeekProps) {
  const [expanded, setExpanded] = useState(false)

  const samMessages = messages.filter((m) => m.content.length > 0)
  const lastMessage = samMessages[samMessages.length - 1]

  if (!lastMessage) return null

  // Truncate to ~80 chars for the peek line
  const peekText = lastMessage.content.length > 80
    ? lastMessage.content.substring(0, 80) + '...'
    : lastMessage.content

  return (
    <div
      className="fixed bottom-20 left-6 z-40 transition-all duration-500"
      style={{
        width: expanded ? '400px' : '320px',
        maxHeight: expanded ? '60vh' : '48px',
      }}
    >
      {/* Expanded: Full chat history */}
      {expanded && (
        <div
          className="mb-2 overflow-y-auto rounded-xl border p-4"
          style={{
            background: 'color-mix(in srgb, var(--rune-surface) 95%, transparent)',
            borderColor: 'color-mix(in srgb, var(--rune-gold) 20%, transparent)',
            backdropFilter: 'blur(12px)',
            maxHeight: 'calc(60vh - 60px)',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: 'var(--rune-gold)' }}
            >
              Sam
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="font-mono text-[10px] uppercase tracking-wider cursor-pointer"
              style={{ color: 'var(--rune-muted)' }}
            >
              Close
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {samMessages.map((msg) => (
              <div key={msg.id}>
                <p
                  className="font-serif text-[14px] leading-relaxed"
                  style={{ color: 'var(--rune-text)' }}
                >
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peek line — always visible when Sam has spoken */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 rounded-full border px-4 py-2.5 text-left transition-all duration-300 cursor-pointer"
        style={{
          background: 'color-mix(in srgb, var(--rune-surface) 90%, transparent)',
          borderColor: expanded
            ? 'color-mix(in srgb, var(--rune-gold) 30%, transparent)'
            : 'color-mix(in srgb, var(--rune-border) 60%, transparent)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Sam indicator dot */}
        <div
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{
            background: 'var(--rune-gold)',
            boxShadow: '0 0 6px color-mix(in srgb, var(--rune-gold) 50%, transparent)',
          }}
        />

        <p
          className="flex-1 truncate font-serif text-[13px]"
          style={{ color: 'var(--rune-text)' }}
        >
          {peekText}
        </p>

        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--rune-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 transition-transform duration-300"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  )
}
