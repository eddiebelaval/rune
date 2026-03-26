'use client';

import { useEffect } from 'react';

export default function BookWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[book:error]', error);
  }, [error]);

  return (
    <div
      className="flex min-h-[70vh] items-center justify-center px-6"
      style={{ backgroundColor: 'var(--rune-bg)' }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border p-8"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <p
          className="label-mono mb-3"
          style={{ color: 'var(--rune-muted)' }}
        >
          Workspace Interrupted
        </p>
        <h1
          className="mb-3 text-3xl font-serif"
          style={{ color: 'var(--rune-heading)' }}
        >
          This book workspace failed to load.
        </h1>
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: 'var(--rune-text)' }}
        >
          The safest first move is to retry the workspace without losing the
          rest of the app shell. If the error repeats, we should inspect the
          book fetch or session bootstrap path next.
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
          Reload workspace
        </button>
      </div>
    </div>
  );
}
