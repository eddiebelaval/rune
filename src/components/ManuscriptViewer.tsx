'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// ManuscriptViewer -- Chapter reader with navigation sidebar
// Designed with Library/Study tokens: warm background, serif font, generous
// margins. Feels like reading pages at a mahogany desk.
// ---------------------------------------------------------------------------

interface ChapterData {
  id: string;
  title: string;
  content: string;
  position: number;
}

interface ManuscriptStats {
  wordCount: number;
  chapterCount: number;
  estimatedPages: number;
}

interface ManuscriptResponse {
  bookId: string;
  chapters: ChapterData[];
  stats: ManuscriptStats;
}

interface ManuscriptViewerProps {
  bookId: string;
}

export default function ManuscriptViewer({ bookId }: ManuscriptViewerProps) {
  const [manuscript, setManuscript] = useState<ManuscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchManuscript = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/manuscript?bookId=${encodeURIComponent(bookId)}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ManuscriptResponse;
      setManuscript(data);

      // Default to first chapter
      if (data.chapters.length > 0 && !activeChapterId) {
        setActiveChapterId(data.chapters[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load manuscript';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, activeChapterId]);

  useEffect(() => {
    void fetchManuscript();
  }, [fetchManuscript]);

  const scrollToChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    const el = chapterRefs.current[chapterId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ backgroundColor: 'var(--rune-bg)' }}
      >
        <p
          className="text-sm"
          style={{
            color: 'var(--rune-muted)',
            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Assembling manuscript...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ backgroundColor: 'var(--rune-bg)' }}
      >
        <p className="text-sm" style={{ color: 'var(--rune-muted)' }}>
          {error}
        </p>
      </div>
    );
  }

  // No manuscript data
  if (!manuscript || manuscript.chapters.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ backgroundColor: 'var(--rune-bg)' }}
      >
        <div className="text-center">
          <p
            className="text-base mb-2"
            style={{
              color: 'var(--rune-heading)',
              fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
            }}
          >
            No chapters yet
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--rune-muted)' }}
          >
            Start a writing session to create your first chapter.
          </p>
        </div>
      </div>
    );
  }

  const { chapters, stats } = manuscript;

  return (
    <div
      className="flex h-full"
      style={{ backgroundColor: 'var(--rune-bg)' }}
    >
      {/* Chapter navigation sidebar */}
      <nav
        className="flex flex-col shrink-0 overflow-y-auto"
        style={{
          width: '240px',
          backgroundColor: 'var(--rune-surface)',
          borderRight: '1px solid var(--rune-border)',
        }}
      >
        {/* Sidebar header */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--rune-border)' }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{
              color: 'var(--rune-muted)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              letterSpacing: '0.1em',
            }}
          >
            Chapters
          </p>
        </div>

        {/* Chapter list */}
        <div className="flex-1 overflow-y-auto py-2">
          {chapters.map((chapter) => {
            const isActive = chapter.id === activeChapterId;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => scrollToChapter(chapter.id)}
                className="w-full text-left px-4 py-2.5 transition-colors duration-150 cursor-pointer"
                style={{
                  backgroundColor: isActive ? 'var(--rune-elevated)' : 'transparent',
                  borderLeft: isActive
                    ? '2px solid var(--rune-gold)'
                    : '2px solid transparent',
                }}
              >
                <span
                  className="text-xs block mb-0.5"
                  style={{
                    color: 'var(--rune-muted)',
                    fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {chapter.position}
                </span>
                <span
                  className="text-sm block leading-snug"
                  style={{
                    color: isActive ? 'var(--rune-heading)' : 'var(--rune-text)',
                    fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {chapter.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Export button placeholder */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--rune-border)' }}
        >
          <button
            type="button"
            className="w-full py-2 rounded-md text-xs uppercase tracking-wider transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: 'var(--rune-elevated)',
              color: 'var(--rune-gold)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              letterSpacing: '0.1em',
              border: '1px solid var(--rune-border)',
            }}
          >
            Export
          </button>
        </div>
      </nav>

      {/* Main reading area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Reading content — page-like feel */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: 'var(--rune-bg)' }}
        >
          <div
            className="mx-auto"
            style={{
              maxWidth: '680px',
              padding: '3rem 2rem',
            }}
          >
            {chapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                ref={(el) => { chapterRefs.current[chapter.id] = el; }}
                style={{
                  marginBottom: idx < chapters.length - 1 ? '3rem' : '0',
                  paddingBottom: idx < chapters.length - 1 ? '3rem' : '0',
                  borderBottom:
                    idx < chapters.length - 1
                      ? '1px solid var(--rune-border)'
                      : 'none',
                }}
              >
                {/* Chapter heading */}
                <h2
                  className="mb-1"
                  style={{
                    color: 'var(--rune-heading)',
                    fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
                    fontSize: '1.5rem',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {chapter.title}
                </h2>

                {/* Chapter position label */}
                <p
                  className="mb-6"
                  style={{
                    color: 'var(--rune-muted)',
                    fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Chapter {chapter.position}
                </p>

                {/* Chapter body */}
                {chapter.content.length > 0 ? (
                  <div
                    style={{
                      color: 'var(--rune-text)',
                      fontFamily: 'var(--font-serif, Georgia, serif)',
                      fontSize: '1.05rem',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {chapter.content}
                  </div>
                ) : (
                  <p
                    className="italic"
                    style={{
                      color: 'var(--rune-muted)',
                      fontFamily: 'var(--font-serif, Georgia, serif)',
                      fontSize: '1rem',
                    }}
                  >
                    This chapter is empty. Start a session to add content.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer — word count + page estimate */}
        <div
          className="flex items-center justify-between px-6 py-2 shrink-0"
          style={{
            backgroundColor: 'var(--rune-surface)',
            borderTop: '1px solid var(--rune-border)',
          }}
        >
          <span
            className="text-xs"
            style={{
              color: 'var(--rune-muted)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              letterSpacing: '0.05em',
            }}
          >
            {stats.wordCount.toLocaleString()} words
          </span>
          <span
            className="text-xs"
            style={{
              color: 'var(--rune-muted)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              letterSpacing: '0.05em',
            }}
          >
            ~{stats.estimatedPages.toLocaleString()} pages
          </span>
          <span
            className="text-xs"
            style={{
              color: 'var(--rune-muted)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              letterSpacing: '0.05em',
            }}
          >
            {stats.chapterCount} {stats.chapterCount === 1 ? 'chapter' : 'chapters'}
          </span>
        </div>
      </div>
    </div>
  );
}
