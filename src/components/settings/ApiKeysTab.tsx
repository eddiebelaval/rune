'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import type { UserPreferences } from '@/types/database';
import { SettingsCard, FormInput, SaveBar } from './shared';

function maskKey(key: string): string {
  if (!key || key.length < 12) return key;
  return key.slice(0, 8) + '...' + key.slice(-4);
}

export default function ApiKeysTab() {
  const { profile, updateProfile } = useProfile();
  const [anthropicKey, setAnthropicKey] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const preferences: UserPreferences = profile?.preferences ?? {};

  useEffect(() => {
    if (profile) {
      const prefs = profile.preferences ?? {};
      setAnthropicKey(prefs.anthropic_api_key ?? '');
      setDeepgramKey(prefs.deepgram_api_key ?? '');
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    const result = await updateProfile({
      preferences: {
        anthropic_api_key: anthropicKey || undefined,
        deepgram_api_key: deepgramKey || undefined,
      },
    });
    setStatus(result ? 'saved' : 'error');
    if (result) setTimeout(() => setStatus('idle'), 2000);
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

      <SettingsCard>
        <FormInput
          label="Anthropic API Key"
          type="password"
          value={anthropicKey}
          onChange={(e) => setAnthropicKey(e.target.value)}
          placeholder="sk-ant-..."
          className="font-mono"
          hint={preferences.anthropic_api_key && anthropicKey === preferences.anthropic_api_key
            ? `Current: ${maskKey(preferences.anthropic_api_key)}`
            : 'Powers all AI conversations (Claude Haiku, Sonnet, Opus).'}
        />
      </SettingsCard>

      <SettingsCard>
        <FormInput
          label="Deepgram API Key"
          type="password"
          value={deepgramKey}
          onChange={(e) => setDeepgramKey(e.target.value)}
          placeholder="dg-..."
          className="font-mono"
          hint={preferences.deepgram_api_key && deepgramKey === preferences.deepgram_api_key
            ? `Current: ${maskKey(preferences.deepgram_api_key)}`
            : 'Powers voice-to-text transcription for speaking your book.'}
        />
      </SettingsCard>

      <SaveBar
        onSave={() => void handleSave()}
        saving={saving}
        status={status}
        disabled={!hasChanges}
        label="Save keys"
      />
    </div>
  );
}
