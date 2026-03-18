'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Book } from '@/types/database';

interface BookCardMenuProps {
  book: Book;
}

export default function BookCardMenu({ book }: BookCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(book.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsRenaming(false);
        setIsDeleting(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleToggleStatus = useCallback(async () => {
    const nextStatus = book.status === 'active' ? 'paused' : 'active';
    await fetch('/api/books', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: book.id, status: nextStatus }),
    });
    setIsOpen(false);
    router.refresh();
  }, [book.id, book.status, router]);

  const handleRename = useCallback(async () => {
    if (!newTitle.trim() || newTitle.trim() === book.title) {
      setIsRenaming(false);
      return;
    }
    await fetch('/api/books', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: book.id, title: newTitle.trim() }),
    });
    setIsRenaming(false);
    setIsOpen(false);
    router.refresh();
  }, [book.id, book.title, newTitle, router]);

  const handleDelete = useCallback(async () => {
    await fetch('/api/books', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: book.id }),
    });
    setIsOpen(false);
    router.refresh();
  }, [book.id, router]);

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="rounded p-1 transition-colors duration-150 cursor-pointer"
        style={{
          color: 'var(--rune-muted)',
          backgroundColor: isOpen ? 'var(--rune-elevated)' : 'transparent',
        }}
        aria-label="Book actions"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border py-1"
          style={{
            backgroundColor: 'var(--rune-surface)',
            borderColor: 'var(--rune-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          onClick={(e) => e.preventDefault()}
        >
          {/* Rename */}
          {isRenaming ? (
            <div className="px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="w-full rounded border px-2 py-1 text-sm focus:outline-none"
                style={{
                  backgroundColor: 'var(--rune-bg)',
                  borderColor: 'var(--rune-border)',
                  color: 'var(--rune-heading)',
                }}
              />
              <div className="mt-1.5 flex gap-1">
                <button
                  type="button"
                  onClick={() => handleRename()}
                  className="flex-1 rounded px-2 py-1 text-xs cursor-pointer"
                  style={{
                    backgroundColor: 'var(--rune-gold)',
                    color: 'var(--rune-bg)',
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="flex-1 rounded px-2 py-1 text-xs cursor-pointer"
                  style={{
                    backgroundColor: 'var(--rune-elevated)',
                    color: 'var(--rune-text)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <MenuItem
              label="Rename"
              onClick={() => setIsRenaming(true)}
            />
          )}

          {/* Pause / Resume */}
          <MenuItem
            label={book.status === 'active' ? 'Pause' : 'Resume'}
            onClick={() => handleToggleStatus()}
          />

          {/* Delete (with confirmation) */}
          {isDeleting ? (
            <div className="px-3 py-2">
              <p
                className="mb-2 text-xs"
                style={{ color: 'var(--rune-error)' }}
              >
                Delete &quot;{book.title}&quot;? This cannot be undone.
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleDelete()}
                  className="flex-1 rounded px-2 py-1 text-xs cursor-pointer"
                  style={{
                    backgroundColor: 'var(--rune-error)',
                    color: 'white',
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  className="flex-1 rounded px-2 py-1 text-xs cursor-pointer"
                  style={{
                    backgroundColor: 'var(--rune-elevated)',
                    color: 'var(--rune-text)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <MenuItem
              label="Delete"
              danger
              onClick={() => setIsDeleting(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-full px-3 py-2 text-left text-sm transition-colors duration-100 cursor-pointer"
      style={{
        color: danger ? 'var(--rune-error)' : 'var(--rune-text)',
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.backgroundColor = 'var(--rune-elevated)';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      {label}
    </button>
  );
}
