'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BacklogItem, BacklogItemType, EntityType, Session } from '@/types/database';

// ---------------------------------------------------------------------------
// BookProgress -- Dashboard showing book health with stat cards
// Gold accent on numbers, bar chart for backlog, sessions/words/entities.
// ---------------------------------------------------------------------------

interface ManuscriptStats {
  wordCount: number;
  chapterCount: number;
  estimatedPages: number;
}

interface BookProgressProps {
  bookId: string;
}

/** Backlog type display labels */
const BACKLOG_TYPE_LABELS: Record<BacklogItemType, string> = {
  question: 'Questions',
  contradiction: 'Contradictions',
  thin_spot: 'Thin Spots',
  unexplored: 'Unexplored',
  review: 'Reviews',
  idea: 'Ideas',
};

/** Entity type display labels */
const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  person: 'People',
  place: 'Places',
  theme: 'Themes',
  event: 'Events',
};

/** All backlog types for iteration order */
const BACKLOG_TYPES: BacklogItemType[] = [
  'question',
  'contradiction',
  'thin_spot',
  'unexplored',
  'review',
  'idea',
];

/** All entity types for iteration order */
const ENTITY_TYPES: EntityType[] = ['person', 'place', 'theme', 'event'];

export default function BookProgress({ bookId }: BookProgressProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [manuscriptStats, setManuscriptStats] = useState<ManuscriptStats | null>(null);
  const [entityCounts, setEntityCounts] = useState<Record<EntityType, number>>({
    person: 0,
    place: 0,
    theme: 0,
    event: 0,
  });
  const [averageConfidence, setAverageConfidence] = useState<number | null>(null);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBacklogAction = useCallback(async (id: string, action: 'address' | 'dismiss') => {
    try {
      await fetch('/api/backlog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      // Remove from local state immediately
      setBacklogItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('[BookProgress] Backlog action failed:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/book-progress?bookId=${encodeURIComponent(bookId)}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to load book progress');
      }

      const data = await response.json() as {
        sessions: Session[];
        manuscriptStats: ManuscriptStats | null;
        entityCounts: Record<EntityType, number>;
        backlogItems: BacklogItem[];
        unresolvedCount: number;
        averageConfidence: number | null;
      };

      setSessions(data.sessions ?? []);
      setManuscriptStats(data.manuscriptStats);
      setEntityCounts(data.entityCounts ?? {
        person: 0,
        place: 0,
        theme: 0,
        event: 0,
      });
      setBacklogItems(data.backlogItems ?? []);
      setUnresolvedCount(data.unresolvedCount ?? 0);
      setAverageConfidence(data.averageConfidence ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load book progress';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Compute derived stats
  const backlogCountsByType: Record<BacklogItemType, number> = {
    question: 0,
    contradiction: 0,
    thin_spot: 0,
    unexplored: 0,
    review: 0,
    idea: 0,
  };
  for (const item of backlogItems) {
    if (item.item_type in backlogCountsByType) {
      backlogCountsByType[item.item_type] += 1;
    }
  }

  const maxBacklogCount = Math.max(
    ...Object.values(backlogCountsByType),
    1, // avoid division by zero
  );

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
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
          Loading progress...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex items-center justify-center py-12"
        style={{ backgroundColor: 'var(--rune-bg)' }}
      >
        <p className="text-sm" style={{ color: 'var(--rune-muted)' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 p-6"
      style={{ backgroundColor: 'var(--rune-bg)' }}
    >
      {/* Section header */}
      <h2
        style={{
          color: 'var(--rune-heading)',
          fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
          fontSize: '1.25rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
        }}
      >
        Book Progress
      </h2>

      {/* --- Top stat cards --- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Sessions"
          value={sessions.length}
        />
        <StatCard
          label="Words"
          value={manuscriptStats?.wordCount ?? 0}
        />
        <StatCard
          label="Chapters"
          value={manuscriptStats?.chapterCount ?? 0}
        />
        <StatCard
          label="Est. Pages"
          value={manuscriptStats?.estimatedPages ?? 0}
        />
      </div>

      {/* --- Sessions completed --- */}
      {sessions.length > 0 && (
        <Section title="Sessions">
          <div className="flex flex-wrap gap-2">
            {sessions.map((session) => {
              const date = new Date(session.created_at);
              const formatted = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <span
                  key={session.id}
                  className="inline-block px-2.5 py-1 rounded text-xs"
                  style={{
                    backgroundColor: 'var(--rune-elevated)',
                    color: 'var(--rune-text)',
                    fontFamily:
                      'var(--font-mono, "IBM Plex Mono", monospace)',
                    border: '1px solid var(--rune-border)',
                  }}
                >
                  #{session.session_number} -- {formatted}
                </span>
              );
            })}
          </div>
        </Section>
      )}

      {/* --- Entities discovered --- */}
      <Section title="Entities Discovered">
        {Object.values(entityCounts).every((count) => count === 0) ? (
          <p
            className="text-xs italic"
            style={{ color: 'var(--rune-muted)' }}
          >
            No entities discovered yet. They appear as you write.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ENTITY_TYPES.map((type) => (
              <MiniStat
                key={type}
                label={ENTITY_TYPE_LABELS[type]}
                value={entityCounts[type]}
              />
            ))}
          </div>
        )}
        {(averageConfidence !== null || unresolvedCount > 0) && (
          <p
            className="mt-3 text-xs"
            style={{ color: 'var(--rune-muted)' }}
          >
            {averageConfidence !== null
              ? `Average extraction confidence ${Math.round(averageConfidence * 100)}%`
              : 'Confidence scores will appear as Rune builds more structured knowledge.'}
            {unresolvedCount > 0 ? ` • ${unresolvedCount} unresolved knowledge nodes` : ''}
          </p>
        )}
      </Section>

      {/* --- Backlog health --- */}
      <Section title="Backlog Health">
        {backlogItems.length === 0 ? (
          <p
            className="text-xs italic"
            style={{ color: 'var(--rune-muted)' }}
          >
            No open backlog items. Rune will surface them as patterns emerge.
          </p>
        ) : (
          <div className="space-y-2">
            {BACKLOG_TYPES.map((type) => {
              const count = backlogCountsByType[type];
              if (count === 0) return null;
              const widthPercent = Math.max(
                (count / maxBacklogCount) * 100,
                8, // minimum visual width
              );

              return (
                <div key={type} className="flex items-center gap-3">
                  <span
                    className="text-xs shrink-0"
                    style={{
                      width: '100px',
                      color: 'var(--rune-text)',
                      fontFamily:
                        'var(--font-mono, "IBM Plex Mono", monospace)',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {BACKLOG_TYPE_LABELS[type]}
                  </span>

                  {/* Bar */}
                  <div
                    className="flex-1 h-5 rounded overflow-hidden"
                    style={{ backgroundColor: 'var(--rune-elevated)' }}
                  >
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: 'var(--rune-gold)',
                        opacity: 0.7,
                      }}
                    />
                  </div>

                  {/* Count */}
                  <span
                    className="text-xs shrink-0"
                    style={{
                      width: '24px',
                      textAlign: 'right',
                      color: 'var(--rune-gold)',
                      fontFamily:
                        'var(--font-mono, "IBM Plex Mono", monospace)',
                      fontWeight: 500,
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}

            {/* Individual backlog items with actions */}
            <div className="mt-3 space-y-1.5">
              {backlogItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded p-2.5"
                  style={{
                    backgroundColor: 'var(--rune-elevated)',
                    border: '1px solid var(--rune-border)',
                  }}
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: 'var(--rune-teal)' }}
                    />
                    <p
                      className="text-xs leading-snug flex-1"
                      style={{
                        color: 'var(--rune-text)',
                        fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
                      }}
                    >
                      {item.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3.5">
                    <span
                      className="text-xs uppercase"
                      style={{
                        color: 'var(--rune-muted)',
                        fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {BACKLOG_TYPE_LABELS[item.item_type]}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleBacklogAction(item.id, 'address')}
                        className="px-2 py-0.5 rounded text-xs cursor-pointer transition-colors duration-100"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--rune-teal) 12%, transparent)',
                          color: 'var(--rune-teal)',
                          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                          fontSize: '0.6rem',
                        }}
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBacklogAction(item.id, 'dismiss')}
                        className="px-2 py-0.5 rounded text-xs cursor-pointer transition-colors duration-100"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--rune-muted) 12%, transparent)',
                          color: 'var(--rune-muted)',
                          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                          fontSize: '0.6rem',
                        }}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-lg p-4 text-center"
      style={{
        backgroundColor: 'var(--rune-surface)',
        border: '1px solid var(--rune-border)',
      }}
    >
      <p
        className="text-2xl font-medium"
        style={{
          color: 'var(--rune-gold)',
          fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
          lineHeight: 1,
        }}
      >
        {value.toLocaleString()}
      </p>
      <p
        className="text-xs mt-1.5 uppercase tracking-wider"
        style={{
          color: 'var(--rune-muted)',
          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded p-2.5 text-center"
      style={{
        backgroundColor: 'var(--rune-elevated)',
        border: '1px solid var(--rune-border)',
      }}
    >
      <p
        className="text-base font-medium"
        style={{
          color: 'var(--rune-gold)',
          fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        className="text-xs mt-1 uppercase tracking-wider"
        style={{
          color: 'var(--rune-muted)',
          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
          letterSpacing: '0.08em',
          fontSize: '0.65rem',
        }}
      >
        {label}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="text-xs uppercase tracking-wider mb-3"
        style={{
          color: 'var(--rune-muted)',
          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
          letterSpacing: '0.1em',
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
