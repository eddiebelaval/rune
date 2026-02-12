'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const clientRef = useRef<SupabaseClient | null>(null);

  function getClient() {
    if (!clientRef.current) clientRef.current = createClient();
    return clientRef.current;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    setErrorMsg('');

    const { error } = await getClient().auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  }

  async function handleGoogle() {
    const { error } = await getClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-6">
      <div
        className="w-full max-w-sm rounded-xl border p-8"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <h1
          className="mb-2 text-center font-serif text-2xl"
          style={{ color: 'var(--rune-heading)' }}
        >
          Welcome to Rune
        </h1>
        <p
          className="mb-8 text-center text-sm"
          style={{ color: 'var(--rune-muted)' }}
        >
          Sign in to start writing your book.
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-rune-elevated"
          style={{
            borderColor: 'var(--rune-border)',
            color: 'var(--rune-heading)',
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--rune-border)' }} />
          <span className="label-mono text-xs" style={{ color: 'var(--rune-muted)' }}>
            or
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--rune-border)' }} />
        </div>

        {/* Magic Link */}
        {status === 'sent' ? (
          <div
            className="rounded-lg border px-4 py-6 text-center"
            style={{
              backgroundColor: 'rgba(78, 205, 196, 0.08)',
              borderColor: 'var(--rune-teal)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mx-auto mb-3 h-8 w-8"
              style={{ color: 'var(--rune-teal)' }}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
            <p className="mb-1 font-serif text-base" style={{ color: 'var(--rune-heading)' }}>
              Check your email
            </p>
            <p className="text-sm" style={{ color: 'var(--rune-muted)' }}>
              We sent a sign-in link to <strong style={{ color: 'var(--rune-text)' }}>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink}>
            <label
              htmlFor="email"
              className="label-mono mb-2 block"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mb-4 w-full rounded-lg border px-4 py-3 text-sm transition-colors duration-200 placeholder:opacity-40 focus:outline-none"
              style={{
                backgroundColor: 'var(--rune-bg)',
                borderColor: 'var(--rune-border)',
                color: 'var(--rune-heading)',
              }}
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: 'var(--rune-gold)',
                color: 'var(--rune-bg)',
                cursor: status === 'sending' ? 'wait' : 'pointer',
                opacity: status === 'sending' ? 0.7 : 1,
              }}
            >
              {status === 'sending' ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}

        {/* Error */}
        {status === 'error' && errorMsg && (
          <p
            className="mt-4 text-center text-sm"
            style={{ color: 'var(--rune-gold)' }}
          >
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
