'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useProfile } from '@/hooks/useProfile';
import { SettingsCard } from './shared';

interface AccountTabProps {
  user: User;
}

export default function AccountTab({ user }: AccountTabProps) {
  const { profile } = useProfile();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    const res = await fetch('/api/profile', { method: 'DELETE' });
    if (res.ok) {
      window.location.href = '/';
    } else {
      setDeleting(false);
    }
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '...';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium" style={{ color: 'var(--rune-heading)' }}>
          Account
        </h2>
        <p className="text-sm" style={{ color: 'var(--rune-muted)' }}>
          Manage your Rune account.
        </p>
      </div>

      <SettingsCard>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--rune-muted)' }}>Email</span>
            <span className="text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>{user.email}</span>
          </div>
          <div className="h-px" style={{ backgroundColor: 'var(--rune-border)' }} />
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--rune-muted)' }}>Member since</span>
            <span className="text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>{memberSince}</span>
          </div>
          <div className="h-px" style={{ backgroundColor: 'var(--rune-border)' }} />
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--rune-muted)' }}>Authentication</span>
            <span className="label-mono">Email OTP</span>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard>
        <h3 className="mb-1 text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
          Export your data
        </h3>
        <p className="mb-4 text-xs" style={{ color: 'var(--rune-muted)' }}>
          Download a copy of all your books, sessions, and workspace files.
        </p>
        <button
          type="button"
          className="rounded-lg border px-4 py-2 text-sm transition-colors duration-200"
          style={{ borderColor: 'var(--rune-border)', color: 'var(--rune-text)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--rune-elevated)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          onClick={() => { alert('Data export is coming soon.'); }}
        >
          Export all data
        </button>
      </SettingsCard>

      {/* Danger zone — intentionally NOT using SettingsCard (custom border color) */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'color-mix(in srgb, var(--rune-error) 30%, var(--rune-border))',
        }}
      >
        <h3 className="mb-1 text-sm font-medium" style={{ color: 'var(--rune-error)' }}>
          Delete account
        </h3>
        <p className="mb-4 text-xs" style={{ color: 'var(--rune-muted)' }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border px-4 py-2 text-sm transition-colors duration-200"
            style={{
              borderColor: 'color-mix(in srgb, var(--rune-error) 40%, transparent)',
              color: 'var(--rune-error)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--rune-error) 8%, transparent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--rune-text)' }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none transition-colors duration-200"
              style={{
                backgroundColor: 'var(--rune-bg)',
                borderColor: deleteInput === 'DELETE' ? 'var(--rune-error)' : 'var(--rune-border)',
                color: 'var(--rune-text)',
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-40"
                style={{ backgroundColor: 'var(--rune-error)', color: '#ffffff' }}
              >
                {deleting ? 'Deleting...' : 'Permanently delete'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                className="rounded-lg border px-4 py-2 text-sm transition-colors duration-200"
                style={{ borderColor: 'var(--rune-border)', color: 'var(--rune-muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
