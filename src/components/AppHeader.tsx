'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';

interface AppHeaderProps {
  user: User | null;
}

function ProfileDropdown({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const initial = (user.email?.[0] ?? '?').toUpperCase();

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
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200"
        style={{
          backgroundColor: 'var(--rune-gold)',
          color: '#ffffff',
        }}
        aria-label="Profile menu"
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-lg border py-1"
          style={{
            backgroundColor: 'var(--rune-surface)',
            borderColor: 'var(--rune-border)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div className="border-b px-4 py-2" style={{ borderColor: 'var(--rune-border)' }}>
            <p className="truncate text-sm" style={{ color: 'var(--rune-text)' }}>
              {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-full px-4 py-2 text-left text-sm transition-colors duration-200"
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
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppHeader({ user }: AppHeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6"
      style={{
        backgroundColor: 'var(--rune-surface)',
        borderBottom: '1px solid var(--rune-border)',
      }}
    >
      {/* Left: Logo + nav */}
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight"
          style={{ color: 'var(--rune-gold)' }}
        >
          Rune
        </Link>

        {user && (
          <Link
            href="/"
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--rune-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rune-heading)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rune-muted)'; }}
          >
            Library
          </Link>
        )}
      </div>

      {/* Right: Profile or sign in */}
      <div>
        {user ? (
          <ProfileDropdown user={user} />
        ) : (
          <Link
            href="/auth"
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--rune-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rune-heading)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rune-muted)'; }}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
