'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';
import { useClickOutside } from '@/hooks/useClickOutside';

interface AppSidebarProps {
  user: User;
}

function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, useCallback(() => setOpen(false), []));

  const initial = (user.email?.[0] ?? '?').toUpperCase();
  const displayEmail = user.email ?? '';

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200"
        style={{
          backgroundColor: open ? 'var(--rune-elevated)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = 'var(--rune-elevated)';
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium"
          style={{ backgroundColor: 'var(--rune-gold)', color: '#ffffff' }}
        >
          {initial}
        </span>
        <span
          className="truncate text-sm"
          style={{ color: 'var(--rune-text)' }}
        >
          {displayEmail}
        </span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border py-1"
          style={{
            backgroundColor: 'var(--rune-surface)',
            borderColor: 'var(--rune-border)',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-200"
            style={{ color: 'var(--rune-text)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--rune-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Heroicon: cog-6-tooth */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" style={{ color: 'var(--rune-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Settings
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-200"
            style={{ color: 'var(--rune-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--rune-elevated)';
              e.currentTarget.style.color = 'var(--rune-heading)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--rune-muted)';
            }}
          >
            {/* Heroicon: arrow-right-start-on-rectangle */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rune-app-sidebar-collapsed') === 'true';
  });

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('rune-app-sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const isActive = (path: string) => pathname === path;
  const isBookPage = pathname.startsWith('/book/');

  if (collapsed) {
    return (
      <aside
        className="flex h-dvh shrink-0 flex-col items-center py-4"
        style={{
          width: '56px',
          backgroundColor: 'var(--rune-surface)',
          borderRight: '1px solid var(--rune-border)',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="mb-6 font-serif text-lg"
          style={{ color: 'var(--rune-gold)' }}
          aria-label="Rune home"
        >
          R
        </Link>

        {/* Expand button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="mb-4 flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-200"
          style={{ color: 'var(--rune-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rune-heading)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rune-muted)'; }}
          aria-label="Expand sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Nav icons */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: isActive('/') ? 'var(--rune-elevated)' : 'transparent',
              color: isActive('/') ? 'var(--rune-heading)' : 'var(--rune-muted)',
            }}
            aria-label="Library"
          >
            {/* Heroicon: book-open */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </Link>
          <Link
            href="/book/new"
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200"
            style={{
              color: isActive('/book/new') ? 'var(--rune-gold)' : 'var(--rune-muted)',
            }}
            aria-label="New book"
          >
            {/* Heroicon: plus */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>
        </div>

        {/* Bottom: profile initial */}
        <div className="mt-auto pt-4">
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium"
            style={{ backgroundColor: 'var(--rune-gold)', color: '#ffffff' }}
            aria-label="Settings"
          >
            {(user.email?.[0] ?? '?').toUpperCase()}
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex h-dvh shrink-0 flex-col"
      style={{
        width: '260px',
        backgroundColor: 'var(--rune-surface)',
        borderRight: '1px solid var(--rune-border)',
      }}
    >
      {/* Header: logo + collapse */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight"
          style={{ color: 'var(--rune-gold)' }}
        >
          Rune
        </Link>
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200"
          style={{ color: 'var(--rune-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rune-heading)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rune-muted)'; }}
          aria-label="Collapse sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* New Book button */}
      <div className="px-3 pb-3">
        <Link
          href="/book/new"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--rune-gold) 10%, transparent)',
            color: 'var(--rune-gold)',
            border: '1px solid color-mix(in srgb, var(--rune-gold) 20%, transparent)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--rune-gold) 18%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--rune-gold) 10%, transparent)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New book
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200"
          style={{
            backgroundColor: isActive('/') && !isBookPage ? 'var(--rune-elevated)' : 'transparent',
            color: isActive('/') && !isBookPage ? 'var(--rune-heading)' : 'var(--rune-text)',
          }}
          onMouseEnter={(e) => {
            if (!(isActive('/') && !isBookPage)) {
              e.currentTarget.style.backgroundColor = 'var(--rune-elevated)';
            }
          }}
          onMouseLeave={(e) => {
            if (!(isActive('/') && !isBookPage)) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {/* Heroicon: book-open */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" style={{ color: 'var(--rune-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          Library
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200"
          style={{
            backgroundColor: isActive('/settings') ? 'var(--rune-elevated)' : 'transparent',
            color: isActive('/settings') ? 'var(--rune-heading)' : 'var(--rune-text)',
          }}
          onMouseEnter={(e) => {
            if (!isActive('/settings')) {
              e.currentTarget.style.backgroundColor = 'var(--rune-elevated)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive('/settings')) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {/* Heroicon: cog-6-tooth */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" style={{ color: 'var(--rune-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Settings
        </Link>
      </nav>

      {/* Bottom: User profile */}
      <div
        className="px-3 py-3"
        style={{ borderTop: '1px solid var(--rune-border)' }}
      >
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
