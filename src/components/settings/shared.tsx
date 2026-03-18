'use client';

import type { InputHTMLAttributes } from 'react';

/** Reusable card wrapper for settings sections */
export function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{ backgroundColor: 'var(--rune-surface)', borderColor: 'var(--rune-border)' }}
    >
      {children}
    </div>
  );
}

/** Text input with Rune focus styling */
export function FormInput(props: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, hint, className, ...inputProps } = props;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
        {label}
      </label>
      <input
        {...inputProps}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors duration-200 ${className ?? ''}`}
        style={{
          backgroundColor: 'var(--rune-bg)',
          borderColor: 'var(--rune-border)',
          color: 'var(--rune-text)',
          ...inputProps.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--rune-gold)';
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--rune-border)';
          inputProps.onBlur?.(e);
        }}
      />
      {hint && (
        <p className="mt-1 text-xs" style={{ color: 'var(--rune-muted)' }}>{hint}</p>
      )}
    </div>
  );
}

/** Save button + status indicator */
export function SaveBar({
  onSave,
  saving,
  status,
  disabled,
  label = 'Save changes',
}: {
  onSave: () => void;
  saving: boolean;
  status: 'idle' | 'saved' | 'error';
  disabled: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-40"
        style={{ backgroundColor: 'var(--rune-gold)', color: '#ffffff' }}
      >
        {saving ? 'Saving...' : label}
      </button>
      {status === 'saved' && (
        <span className="text-sm" style={{ color: 'var(--rune-teal)' }}>Saved</span>
      )}
      {status === 'error' && (
        <span className="text-sm" style={{ color: 'var(--rune-error)' }}>Failed to save</span>
      )}
    </div>
  );
}
