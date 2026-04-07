'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app:global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: 'var(--rune-bg)',
          color: 'var(--rune-text)',
          fontFamily: 'var(--font-source-sans, sans-serif)',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '640px',
              width: '100%',
              border: '1px solid var(--rune-border)',
              borderRadius: '20px',
              backgroundColor: 'var(--rune-surface)',
              padding: '32px',
            }}
          >
            <p
              style={{
                margin: 0,
                marginBottom: '12px',
                color: 'var(--rune-muted)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Rune Needs A Reset
            </p>
            <h1
              style={{
                margin: 0,
                marginBottom: '12px',
                color: 'var(--rune-heading)',
                fontFamily: 'var(--font-source-serif, serif)',
                fontSize: '36px',
                lineHeight: 1.1,
              }}
            >
              The app hit a full-page error.
            </h1>
            <p
              style={{
                margin: 0,
                marginBottom: '20px',
                fontSize: '15px',
                lineHeight: 1.6,
              }}
            >
              This is the outer safety net. Reloading usually clears transient
              issues, and if it does not, we can trace the failing route from
              here instead of leaving you with a blank page.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 'none',
                borderRadius: '10px',
                backgroundColor: 'var(--rune-gold)',
                color: 'var(--rune-bg)',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload shell
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
