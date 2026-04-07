'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app:error]', error);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-6"
      style={{ backgroundColor: 'var(--rune-bg)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-8"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <p
          className="label-mono mb-3"
          style={{ color: 'var(--rune-muted)' }}
        >
          Rune Hit A Snag
        </p>
        <h1
          className="mb-3 text-3xl font-serif"
          style={{ color: 'var(--rune-heading)' }}
        >
          Something broke mid-flow.
        </h1>
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: 'var(--rune-text)' }}
        >
          Your writing should feel like a conversation, not a crash report.
          Try loading this section again. If it keeps happening, we should
          inspect the failing route or component directly.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--rune-gold)',
            color: 'var(--rune-bg)',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
