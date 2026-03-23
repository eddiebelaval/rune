'use client'

/**
 * SamPresenceRing — A golden light that flows around the entire viewport
 * when Sam is speaking. Makes Sam feel like a presence, not just text.
 *
 * The ring is a conic-gradient that rotates continuously, creating a
 * flowing golden border. It fades in when active and out when Sam stops.
 */

interface SamPresenceRingProps {
  active: boolean
}

export default function SamPresenceRing({ active }: SamPresenceRingProps) {
  return (
    <>
      <div
        className="sam-ring"
        style={{
          opacity: active ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
        }}
      >
        <div className="sam-ring-inner" />
      </div>

      <style jsx>{`
        .sam-ring {
          position: fixed;
          inset: 0;
          z-index: 50;
          pointer-events: none;
          overflow: hidden;
        }

        .sam-ring-inner {
          position: absolute;
          inset: -4px;
          border-radius: 0;
          padding: 3px;
          background: conic-gradient(
            from var(--ring-angle, 0deg),
            transparent 0%,
            transparent 15%,
            color-mix(in srgb, var(--rune-gold) 60%, transparent) 25%,
            var(--rune-gold) 30%,
            color-mix(in srgb, var(--rune-gold) 80%, transparent) 35%,
            transparent 50%,
            transparent 65%,
            color-mix(in srgb, var(--rune-gold) 40%, transparent) 75%,
            color-mix(in srgb, var(--rune-gold) 60%, transparent) 80%,
            transparent 90%,
            transparent 100%
          );
          animation: sam-ring-rotate 4s linear infinite;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        @keyframes sam-ring-rotate {
          from {
            --ring-angle: 0deg;
          }
          to {
            --ring-angle: 360deg;
          }
        }

        @property --ring-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
    </>
  )
}
