'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import ProfileTab from './ProfileTab';
import AppearanceTab from './AppearanceTab';
import AccountTab from './AccountTab';

interface SettingsClientProps {
  user: User;
}

type SettingsTab = 'profile' | 'appearance' | 'account';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'account', label: 'Account' },
];

export default function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--rune-bg)' }}>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-8 font-serif text-2xl" style={{ color: 'var(--rune-heading)' }}>
          Settings
        </h1>

        {/* Tab navigation */}
        <div
          className="mb-8 flex gap-1 rounded-lg p-1"
          style={{ backgroundColor: 'var(--rune-elevated)' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--rune-surface)' : 'transparent',
                color: activeTab === tab.id ? 'var(--rune-heading)' : 'var(--rune-muted)',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'account' && <AccountTab user={user} />}
        </div>
      </div>
    </div>
  );
}
