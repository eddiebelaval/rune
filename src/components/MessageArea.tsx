'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ConversationMessage } from '@/hooks/useSession';

// ---------------------------------------------------------------------------
// MessageArea — Scrollable conversation message list
// ---------------------------------------------------------------------------

interface MessageAreaProps {
  messages: ConversationMessage[];
  isLoading: boolean;
  bookId?: string;
  bookTitle?: string;
  onSend?: (message: string) => void;
}

/** Mic icon */
function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Upload icon */
function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Keyboard icon */
function KeyboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6" y1="8" x2="6" y2="8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="8" x2="10" y2="8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="8" x2="14" y2="8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="8" x2="18" y2="8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="12" x2="8" y2="12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="12" x2="12" y2="12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="12" x2="16" y2="12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState({ bookId, bookTitle, onSend }: { bookId?: string; bookTitle?: string; onSend?: (message: string) => void }) {
  const isOnboarding = bookTitle === 'Untitled';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'done'>('idle');

  const handleImport = useCallback(async (file: File) => {
    if (!bookId) return;
    setImportStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('book_id', bookId);

      const res = await fetch('/api/import', { method: 'POST', body: formData });
      if (res.ok) {
        setImportStatus('done');
        // Trigger Sam to acknowledge the import
        onSend?.('I just imported some existing writing. Can you take a look at what came in and tell me what you see?');
      } else {
        setImportStatus('idle');
      }
    } catch {
      setImportStatus('idle');
    }
  }, [bookId, onSend]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
    e.target.value = '';
  }, [handleImport]);

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-6">
        {/* Sam greeting */}
        <div>
          <p
            className="text-lg mb-1"
            style={{
              color: 'var(--rune-heading)',
              fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
            }}
          >
            {isOnboarding ? 'Meet Sam' : 'Ready when you are'}
          </p>
          <p
            className="text-sm"
            style={{
              color: 'var(--rune-muted)',
              fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
            }}
          >
            {isOnboarding
              ? 'Your scribe is here. Start talking and Sam will set everything up.'
              : 'Start talking or bring in what you already have'}
          </p>
        </div>

        {/* Action cards */}
        <div className="space-y-2">
          {/* Speak */}
          <button
            type="button"
            onClick={() => onSend?.("Hey Sam, I'm ready to start. Walk me through how this works.")}
            className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: 'var(--rune-surface)',
              borderColor: 'var(--rune-border)',
            }}
          >
            <span style={{ color: 'var(--rune-gold)' }}><MicIcon /></span>
            <div>
              <span className="text-sm block" style={{ color: 'var(--rune-heading)' }}>
                {isOnboarding ? 'Meet Sam' : 'Start talking to Sam'}
              </span>
              <span className="text-xs" style={{ color: 'var(--rune-muted)' }}>
                {isOnboarding ? 'Sam will introduce himself and set up your book' : 'Voice or text — Sam will guide you'}
              </span>
            </div>
          </button>

          {/* Import */}
          {bookId && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatus === 'uploading'}
              className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: 'var(--rune-surface)',
                borderColor: 'var(--rune-border)',
              }}
            >
              <span style={{ color: 'var(--rune-teal)' }}><UploadIcon /></span>
              <div>
                <span className="text-sm block" style={{ color: 'var(--rune-heading)' }}>
                  {importStatus === 'uploading' ? 'Importing...' : 'Import existing writing'}
                </span>
                <span className="text-xs" style={{ color: 'var(--rune-muted)' }}>
                  .txt, .md, or .docx — Sam will organize it
                </span>
              </div>
            </button>
          )}

          {/* Type hint */}
          <div
            className="flex items-center gap-3 px-4 py-2"
          >
            <span style={{ color: 'var(--rune-muted)', opacity: 0.5 }}><KeyboardIcon /></span>
            <span className="text-xs" style={{ color: 'var(--rune-muted)' }}>
              Or just start typing below
            </span>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,.docx"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import file"
        />
      </div>
    </div>
  );
}

export default function MessageArea({ messages, isLoading, bookId, bookTitle, onSend }: MessageAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return <EmptyState bookId={bookId} bookTitle={bookTitle} onSend={onSend} />;
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
