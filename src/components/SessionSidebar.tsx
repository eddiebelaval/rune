'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { Session } from '@/types/database';

interface SessionSidebarProps {
  bookId: string;
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export default function SessionSidebar({
  bookId,
  currentSessionId,
  onSelectSession,
  onNewSession,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rune-sidebar-collapsed') === 'true';
  });

  // Fetch sessions on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('book_id', bookId)
        .order('session_number', { ascending: true });

      if (!cancelled && data) {
        setSessions(data as Session[]);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bookId]);

  // Realtime subscription for session changes
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`sessions:${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSessions((prev) => [...prev, payload.new as Session]);
          } else if (payload.eventType === 'UPDATE') {
            setSessions((prev) =>
              prev.map((s) => (s.id === (payload.new as Session).id ? (payload.new as Session) : s)),
            );
          } else if (payload.eventType === 'DELETE') {
            setSessions((prev) =>
              prev.filter((s) => s.id !== (payload.old as { id: string }).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookId]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('rune-sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  if (collapsed) {
    return (
      <div
        className="flex shrink-0 flex-col items-center py-3"
        style={{
          width: '48px',
          backgroundColor: 'var(--rune-surface)',
          borderRight: '1px solid var(--rune-border)',
        }}
      >
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-200"
          style={{ color: 'var(--rune-muted)' }}
          aria-label="Expand sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 flex-col"
      style={{
        width: '260px',
        backgroundColor: 'var(--rune-surface)',
        borderRight: '1px solid var(--rune-border)',
      }}
    >
      {/* Sidebar header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--rune-border)' }}
      >
        <span className="label-mono">Sessions</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewSession}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200"
            style={{ color: 'var(--rune-gold)' }}
            aria-label="New session"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200"
            style={{ color: 'var(--rune-muted)' }}
            aria-label="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => {
          const isActive = session.id === currentSessionId;
          return (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectSession(session.id)}
              className="w-full px-4 py-3 text-left transition-colors duration-150"
              style={{
                backgroundColor: isActive ? 'var(--rune-elevated)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--rune-gold)' : '2px solid transparent',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isActive ? 'var(--rune-heading)' : 'var(--rune-text)',
                  }}
                >
                  Session {session.session_number}
                </span>
                <span className="text-xs" style={{ color: 'var(--rune-muted)' }}>
                  {formatDate(session.created_at)}
                </span>
              </div>
              {session.summary && (
                <p
                  className="mt-1 truncate text-xs"
                  style={{ color: 'var(--rune-muted)' }}
                >
                  {session.summary}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
