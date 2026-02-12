'use client';

import type { QualityLevel } from '@/types/database';

// ---------------------------------------------------------------------------
// QualitySlider — Three-position Economy / Standard / Premium selector
// ---------------------------------------------------------------------------

interface QualitySliderProps {
  value: QualityLevel;
  onChange: (level: QualityLevel) => void;
}

const levels: { key: QualityLevel; label: string }[] = [
  { key: 'economy', label: 'Fast' },
  { key: 'standard', label: 'Balanced' },
  { key: 'premium', label: 'Best' },
];

export default function QualitySlider({ value, onChange }: QualitySliderProps) {
  const activeIndex = levels.findIndex((l) => l.key === value);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Track + dots */}
      <div className="relative flex items-center w-48">
        {/* Track line */}
        <div
          className="absolute top-1/2 left-3 right-3 h-px -translate-y-1/2"
          style={{ backgroundColor: 'var(--rune-border)' }}
        />

        {/* Active segment fill */}
        <div
          className="absolute top-1/2 left-3 h-px -translate-y-1/2 transition-all duration-200"
          style={{
            backgroundColor: 'var(--rune-gold)',
            width: `${activeIndex * 50}%`,
          }}
        />

        {/* Dots */}
        <div className="relative flex items-center justify-between w-full px-3">
          {levels.map((level, index) => {
            const isActive = level.key === value;
            return (
              <button
                key={level.key}
                type="button"
                onClick={() => onChange(level.key)}
                className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: isActive || index <= activeIndex
                    ? 'var(--rune-gold)'
                    : 'var(--rune-elevated)',
                  border: isActive
                    ? '2px solid var(--rune-gold)'
                    : '2px solid var(--rune-border)',
                  boxShadow: isActive ? '0 0 0 3px rgba(196, 162, 101, 0.2)' : 'none',
                }}
                aria-label={`${level.label} quality`}
              >
                {isActive && (
                  <span
                    className="block w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--rune-bg)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between w-48 px-1">
        {levels.map((level) => {
          const isActive = level.key === value;
          return (
            <span
              key={level.key}
              className="text-xs tracking-wider uppercase transition-colors duration-200"
              style={{
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                color: isActive ? 'var(--rune-gold)' : 'var(--rune-muted)',
              }}
            >
              {level.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
