'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useProfile } from '@/hooks/useProfile';
import { SettingsCard, FormInput, SaveBar } from './shared';

interface ProfileTabProps {
  user: User;
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const { profile, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name ?? '');
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    const result = await updateProfile({ display_name: displayName });
    setStatus(result ? 'saved' : 'error');
    if (result) setTimeout(() => setStatus('idle'), 2000);
    setSaving(false);
  }

  const hasChanges = profile !== null && displayName !== (profile.display_name ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium" style={{ color: 'var(--rune-heading)' }}>
          Profile
        </h2>
        <p className="text-sm" style={{ color: 'var(--rune-muted)' }}>
          Your public display information.
        </p>
      </div>

      <SettingsCard>
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-medium"
            style={{ backgroundColor: 'var(--rune-gold)', color: '#ffffff' }}
          >
            {(displayName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
              {displayName || user.email?.split('@')[0]}
            </p>
            <p className="text-xs" style={{ color: 'var(--rune-muted)' }}>
              Avatar is generated from your initials
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard>
        <div className="mb-4">
          <FormInput
            label="Display name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
          />
        </div>
        <FormInput
          label="Email"
          type="email"
          value={user.email ?? ''}
          disabled
          hint="Email is managed through Supabase auth and cannot be changed here."
          className="opacity-60"
          style={{ backgroundColor: 'var(--rune-elevated)', color: 'var(--rune-muted)' }}
        />
      </SettingsCard>

      <SaveBar
        onSave={() => void handleSave()}
        saving={saving}
        status={status}
        disabled={!hasChanges}
      />
    </div>
  );
}
