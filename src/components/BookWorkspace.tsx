'use client';

import { useCallback, useState } from 'react';
import type { Book } from '@/types/database';
import type { PipelineStage } from '@/types/knowledge';
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
    <div className="flex h-dvh flex-col">
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
        <div className="flex items-center gap-2">
          {(['world-building', 'story-writing', 'publishing'] as const).map((stage, i) => {
            const pipelineStage = ((book as Book & { pipeline_stage?: PipelineStage }).pipeline_stage ?? 'world-building') as PipelineStage;
            const stageLabels: Record<PipelineStage, string> = {
              'world-building': 'Workshop',
              'story-writing': 'Study',
              'publishing': 'Press',
            };
            const stageOrder: PipelineStage[] = ['world-building', 'story-writing', 'publishing'];
            const currentIdx = stageOrder.indexOf(pipelineStage);
            const isActive = stage === pipelineStage;
            const isPast = i < currentIdx;
            return (
              <div key={stage} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className="h-px w-4"
                    style={{ background: isPast ? 'var(--rune-teal)' : 'var(--rune-border)' }}
                  />
                )}
                <span
                  className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded"
                  style={{
                    background: isActive ? 'color-mix(in srgb, var(--rune-gold) 15%, transparent)' : isPast ? 'color-mix(in srgb, var(--rune-teal) 10%, transparent)' : 'transparent',
                    color: isActive ? 'var(--rune-gold)' : isPast ? 'var(--rune-teal)' : 'var(--rune-muted)',
                    border: isActive ? '1px solid color-mix(in srgb, var(--rune-gold) 25%, transparent)' : '1px solid transparent',
                  }}
                >
                  {stageLabels[stage]}
                </span>
              </div>
            );
          })}
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
