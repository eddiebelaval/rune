'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BookType, QualityLevel } from '@/types/database';
import QualitySlider from '@/components/QualitySlider';

// ---------------------------------------------------------------------------
// NewBookForm -- Modal/form for creating a new book project
// ---------------------------------------------------------------------------

const BOOK_TYPES: { key: BookType; label: string; description: string }[] = [
  {
    key: 'memoir',
    label: 'Memoir',
    description: 'Tell your story. Rune will guide you through your memories, people, and pivotal moments.',
  },
  {
    key: 'fiction',
    label: 'Fiction',
    description: 'Build a world. Characters, plot threads, and story arcs -- all through conversation.',
  },
  {
    key: 'nonfiction',
    label: 'Non-Fiction',
    description: 'Shape your ideas. Frameworks, arguments, and research organized into clear chapters.',
  },
];

export default function NewBookForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [bookType, setBookType] = useState<BookType | null>(null);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && bookType !== null && !isSubmitting;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || !bookType) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            bookType,
            qualityLevel,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(body.error ?? `Failed to create book (${res.status})`);
        }

        const book = await res.json();
        router.push(`/book/${book.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setIsSubmitting(false);
      }
    },
    [canSubmit, bookType, title, qualityLevel, router],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl rounded-xl border p-8"
      style={{
        backgroundColor: 'var(--rune-surface)',
        borderColor: 'var(--rune-border)',
      }}
    >
      {/* Header */}
      <h2
        className="mb-1 font-serif text-2xl"
        style={{ color: 'var(--rune-heading)' }}
      >
        Begin a new book
      </h2>
      <p className="mb-8 text-sm" style={{ color: 'var(--rune-muted)' }}>
        Give it a working title. You can always change it later.
      </p>

      {/* Title input */}
      <div className="mb-8">
        <label
          htmlFor="book-title"
          className="label-mono mb-2 block"
        >
          Title
        </label>
        <input
          id="book-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Untitled Book"
          autoFocus
          className="w-full rounded-lg border px-4 py-3 font-serif text-lg transition-colors duration-200 placeholder:opacity-40 focus:outline-none"
          style={{
            backgroundColor: 'var(--rune-bg)',
            borderColor: 'var(--rune-border)',
            color: 'var(--rune-heading)',
          }}
        />
      </div>

      {/* Book type selector */}
      <div className="mb-8">
        <p className="label-mono mb-3">What are you writing?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {BOOK_TYPES.map((type) => {
            const isActive = bookType === type.key;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => setBookType(type.key)}
                className="flex flex-col items-start rounded-lg border p-4 text-left transition-all duration-200"
                style={{
                  backgroundColor: isActive
                    ? 'var(--rune-elevated)'
                    : 'var(--rune-bg)',
                  borderColor: isActive
                    ? 'var(--rune-gold)'
                    : 'var(--rune-border)',
                  boxShadow: isActive
                    ? '0 0 0 1px var(--rune-gold)'
                    : 'none',
                }}
              >
                <span
                  className="mb-2 font-serif text-base"
                  style={{
                    color: isActive
                      ? 'var(--rune-gold)'
                      : 'var(--rune-heading)',
                  }}
                >
                  {type.label}
                </span>
                <span
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--rune-muted)' }}
                >
                  {type.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality slider */}
      <div className="mb-8">
        <p className="label-mono mb-3">AI quality level</p>
        <div className="flex justify-center">
          <QualitySlider value={qualityLevel} onChange={setQualityLevel} />
        </div>
        <p
          className="mt-2 text-center text-xs"
          style={{ color: 'var(--rune-muted)' }}
        >
          Controls which AI models Rune uses. Higher quality costs more tokens.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(196, 162, 101, 0.1)',
            borderColor: 'var(--rune-gold)',
            color: 'var(--rune-gold)',
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg px-6 py-3 font-sans text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          backgroundColor: canSubmit ? 'var(--rune-gold)' : 'var(--rune-elevated)',
          color: canSubmit ? 'var(--rune-bg)' : 'var(--rune-muted)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {isSubmitting ? 'Creating...' : 'Begin Writing'}
      </button>
    </form>
  );
}
