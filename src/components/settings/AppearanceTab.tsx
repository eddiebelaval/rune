'use client';

import { useThemeStore } from '@/stores/theme-store';
import type { ThemeMode } from '@/types/database';

const THEME_OPTIONS: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'system', label: 'System', description: 'Follow your operating system preference' },
  { value: 'light', label: 'Light', description: 'Warm cream surfaces with coral accents' },
  { value: 'dark', label: 'Dark', description: 'Dark surfaces for low-light environments' },
];

export default function AppearanceTab() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  async function handleThemeChange(newTheme: ThemeMode) {
    setTheme(newTheme);

    // Sync to profile (fire-and-forget)
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium" style={{ color: 'var(--rune-heading)' }}>
          Appearance
        </h2>
        <p className="text-sm" style={{ color: 'var(--rune-muted)' }}>
          Customize how Rune looks for you.
        </p>
      </div>

      {/* Theme selector */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <label className="mb-4 block text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
          Theme
        </label>

        <div className="space-y-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => void handleThemeChange(option.value)}
              className="flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-all duration-200"
              style={{
                backgroundColor: theme === option.value
                  ? 'color-mix(in srgb, var(--rune-gold) 8%, transparent)'
                  : 'transparent',
                borderColor: theme === option.value
                  ? 'color-mix(in srgb, var(--rune-gold) 30%, transparent)'
                  : 'var(--rune-border)',
              }}
            >
              {/* Radio indicator */}
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: theme === option.value ? 'var(--rune-gold)' : 'var(--rune-border)',
                }}
              >
                {theme === option.value && (
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: 'var(--rune-gold)' }}
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
                  {option.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--rune-muted)' }}>
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview swatches */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <label className="mb-4 block text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
          Color palette
        </label>
        <div className="flex gap-3">
          {[
            { name: 'Background', color: 'var(--rune-bg)' },
            { name: 'Surface', color: 'var(--rune-surface)' },
            { name: 'Coral', color: 'var(--rune-gold)' },
            { name: 'Blue', color: 'var(--rune-teal)' },
            { name: 'Text', color: 'var(--rune-heading)' },
          ].map((swatch) => (
            <div key={swatch.name} className="text-center">
              <div
                className="mx-auto mb-1 h-10 w-10 rounded-lg border"
                style={{
                  backgroundColor: swatch.color,
                  borderColor: 'var(--rune-border)',
                }}
              />
              <span className="text-[10px]" style={{ color: 'var(--rune-muted)' }}>
                {swatch.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
