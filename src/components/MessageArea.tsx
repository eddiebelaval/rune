'use client';

import { useEffect, useRef } from 'react';
import type { ConversationMessage } from '@/hooks/useSession';

// ---------------------------------------------------------------------------
// MessageArea — Scrollable conversation message list
// ---------------------------------------------------------------------------

interface MessageAreaProps {
  messages: ConversationMessage[];
  isLoading: boolean;
}

export default function MessageArea({ messages, isLoading }: MessageAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <p
          className="text-center text-sm italic"
          style={{
            color: 'var(--rune-muted)',
            fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
          }}
        >
          Start speaking or type to begin your session
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';

        return (
          <div
            key={msg.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start gap-3 max-w-[80%] ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Role indicator dot */}
              <span
                className="mt-2 block w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: isUser
                    ? 'var(--rune-gold)'
                    : 'var(--rune-teal)',
                }}
              />

              {/* Message bubble */}
              <div
                className="rounded-lg px-4 py-3"
                style={{
                  backgroundColor: 'var(--rune-surface)',
                  borderLeft: isUser ? 'none' : '2px solid var(--rune-teal)',
                  borderRight: isUser ? '2px solid var(--rune-gold)' : 'none',
                  color: 'var(--rune-text)',
                  fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
                }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content || '\u00A0'}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Streaming indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-3">
            <span
              className="block w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--rune-teal)' }}
            />
            <span
              className="text-xs"
              style={{
                color: 'var(--rune-muted)',
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              }}
            >
              Rune is thinking...
            </span>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
