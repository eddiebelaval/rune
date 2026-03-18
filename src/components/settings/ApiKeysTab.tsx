'use client';

import { useState, useEffect } from 'react';
import type { UserPreferences } from '@/types/database';

export default function ApiKeysTab() {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [anthropicKey, setAnthropicKey] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        const prefs = data.profile.preferences ?? {};
        setPreferences(prefs);
        setAnthropicKey(prefs.anthropic_api_key ?? '');
        setDeepgramKey(prefs.deepgram_api_key ?? '');
      }
    }
    loadProfile();
  }, []);

  function maskKey(key: string): string {
    if (!key || key.length < 12) return key;
    return key.slice(0, 8) + '...' + key.slice(-4);
  }

  async function handleSave() {
    setSaving(true);
    setStatus('idle');

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: {
          anthropic_api_key: anthropicKey || undefined,
          deepgram_api_key: deepgramKey || undefined,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setPreferences(data.profile.preferences ?? {});
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('error');
    }

    setSaving(false);
  }

  const hasChanges =
    anthropicKey !== (preferences.anthropic_api_key ?? '') ||
    deepgramKey !== (preferences.deepgram_api_key ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium" style={{ color: 'var(--rune-heading)' }}>
          API Keys
        </h2>
        <p className="text-sm" style={{ color: 'var(--rune-muted)' }}>
          Provide your own API keys for self-hosted or custom deployments.
        </p>
      </div>

      {/* Info banner */}
      <div
        className="rounded-lg border px-4 py-3 text-sm"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--rune-teal) 8%, transparent)',
          borderColor: 'color-mix(in srgb, var(--rune-teal) 20%, transparent)',
          color: 'var(--rune-text)',
        }}
      >
        Keys are stored in your profile. They are only used for your sessions and never shared.
      </div>

      {/* Anthropic API Key */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
          Anthropic API Key
        </label>
        <p className="mb-3 text-xs" style={{ color: 'var(--rune-muted)' }}>
          Powers all AI conversations (Claude Haiku, Sonnet, Opus).
        </p>
        <input
          type="password"
          value={anthropicKey}
          onChange={(e) => setAnthropicKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none transition-colors duration-200"
          style={{
            backgroundColor: 'var(--rune-bg)',
            borderColor: 'var(--rune-border)',
            color: 'var(--rune-text)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--rune-gold)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--rune-border)'; }}
        />
        {preferences.anthropic_api_key && anthropicKey === preferences.anthropic_api_key && (
          <p className="mt-1 font-mono text-xs" style={{ color: 'var(--rune-muted)' }}>
            Current: {maskKey(preferences.anthropic_api_key)}
          </p>
        )}
      </div>

      {/* Deepgram API Key */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
          Deepgram API Key
        </label>
        <p className="mb-3 text-xs" style={{ color: 'var(--rune-muted)' }}>
          Powers voice-to-text transcription for speaking your book.
        </p>
        <input
          type="password"
          value={deepgramKey}
          onChange={(e) => setDeepgramKey(e.target.value)}
          placeholder="dg-..."
          className="w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none transition-colors duration-200"
          style={{
            backgroundColor: 'var(--rune-bg)',
            borderColor: 'var(--rune-border)',
            color: 'var(--rune-text)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--rune-gold)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--rune-border)'; }}
        />
        {preferences.deepgram_api_key && deepgramKey === preferences.deepgram_api_key && (
          <p className="mt-1 font-mono text-xs" style={{ color: 'var(--rune-muted)' }}>
            Current: {maskKey(preferences.deepgram_api_key)}
          </p>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !hasChanges}
          className="rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-40"
          style={{
            backgroundColor: 'var(--rune-gold)',
            color: '#ffffff',
          }}
        >
          {saving ? 'Saving...' : 'Save keys'}
        </button>
        {status === 'saved' && (
          <span className="text-sm" style={{ color: 'var(--rune-teal)' }}>
            Saved
          </span>
        )}
        {status === 'error' && (
          <span className="text-sm" style={{ color: 'var(--rune-error)' }}>
            Failed to save
          </span>
        )}
      </div>
    </div>
  );
}
