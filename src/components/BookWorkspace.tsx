'use client';

import { useCallback, useState } from 'react';
import type { Book } from '@/types/database';
import SessionSidebar from '@/components/SessionSidebar';
import SessionView from '@/components/SessionView';
import { createClient } from '@/lib/supabase-browser';

interface BookWorkspaceProps {
  book: Book;
  initialSessionId: string;
}

export default function BookWorkspace({ book, initialSessionId }: BookWorkspaceProps) {
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);

  const handleNewSession = useCallback(async () => {
    const supabase = createClient();

    // Get next session number
    const { data: latest } = await supabase
      .from('sessions')
      .select('session_number')
      .eq('book_id', book.id)
      .order('session_number', { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (latest?.session_number ?? 0) + 1;

    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({
        book_id: book.id,
        session_number: nextNumber,
        mode: null,
        raw_transcript: null,
        summary: null,
        duration_seconds: null,
      })
      .select()
      .single();

    if (!error && newSession) {
      setCurrentSessionId(newSession.id);
    }
  }, [book.id]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* Book header bar */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-rune-border bg-rune-surface px-6 py-3"
      >
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-rune-muted transition-colors duration-200 hover:text-rune-gold"
            aria-label="Back to library"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </a>
          <h1 className="font-serif text-lg text-rune-heading">
            {book.title}
          </h1>
          <span className="label-mono rounded-sm border border-rune-border bg-rune-elevated px-2 py-0.5">
            {book.book_type}
          </span>
        </div>
      </div>

      {/* Workspace: sidebar + session */}
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          bookId={book.id}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewSession={() => void handleNewSession()}
        />
        <div className="flex-1">
          <SessionView
            key={currentSessionId}
            bookId={book.id}
            sessionId={currentSessionId}
            bookType={book.book_type}
            qualityLevel={book.quality_level}
            title={book.title}
          />
        </div>
      </div>
    </div>
  );
}
