'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import type { SupabaseClient } from '@supabase/supabase-js';
import AppFooter from '@/components/AppFooter';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'code' | 'verifying' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const clientRef = useRef<SupabaseClient | null>(null);
  const router = useRouter();

  function getClient() {
    if (!clientRef.current) clientRef.current = createClient();
    return clientRef.current;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    setErrorMsg('');

    const { error } = await getClient().auth.signInWithOtp({
      email: email.trim(),
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('code');
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;

    setStatus('verifying');
    setErrorMsg('');

    const { error } = await getClient().auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
    <div className="flex flex-1 items-center justify-center px-6">
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
          {status === 'code' || status === 'verifying'
            ? `Enter the code sent to ${email}`
            : 'Sign in to start writing your book.'}
        </p>

        {/* Step 1: Email input */}
        {(status === 'idle' || status === 'sending') && (
          <form onSubmit={handleSendCode}>
            <label htmlFor="email" className="label-mono mb-2 block">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
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
              className="w-full rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: 'var(--rune-gold)',
                color: 'var(--rune-bg)',
                cursor: status === 'sending' ? 'wait' : 'pointer',
                opacity: status === 'sending' ? 0.7 : 1,
              }}
            >
              {status === 'sending' ? 'Sending code...' : 'Send sign-in code'}
            </button>
          </form>
        )}

        {/* Step 2: OTP code input */}
        {(status === 'code' || status === 'verifying') && (
          <form onSubmit={handleVerifyCode}>
            <label htmlFor="otp" className="label-mono mb-2 block">
              6-digit code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter code"
              required
              autoFocus
              className="mb-4 w-full rounded-lg border px-4 py-3 text-center text-xl font-mono tracking-[0.2em] transition-colors duration-200 placeholder:opacity-20 focus:outline-none"
              style={{
                backgroundColor: 'var(--rune-bg)',
                borderColor: 'var(--rune-border)',
                color: 'var(--rune-heading)',
              }}
            />
            <button
              type="submit"
              disabled={status === 'verifying' || otp.length < 1}
              className="w-full rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: 'var(--rune-gold)',
                color: 'var(--rune-bg)',
                cursor: status === 'verifying' ? 'wait' : 'pointer',
                opacity: status === 'verifying' || otp.length < 1 ? 0.7 : 1,
              }}
            >
              {status === 'verifying' ? 'Verifying...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setOtp(''); setErrorMsg(''); }}
              className="mt-3 w-full text-center text-sm cursor-pointer"
              style={{ color: 'var(--rune-muted)' }}
            >
              Use a different email
            </button>
          </form>
        )}

        {/* Error */}
        {status === 'error' && errorMsg && (
          <div className="mt-4">
            <p
              className="mb-3 text-center text-sm"
              style={{ color: 'var(--rune-error, var(--rune-gold))' }}
            >
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setOtp(''); setErrorMsg(''); }}
              className="w-full text-center text-sm cursor-pointer"
              style={{ color: 'var(--rune-muted)' }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
    <AppFooter />
    </div>
  );
}
