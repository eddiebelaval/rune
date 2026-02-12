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
