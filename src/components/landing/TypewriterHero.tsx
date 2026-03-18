'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const LINES = [
  { text: "I've had this story in my head for years.", delay: 0 },
  { text: "Characters I know by name.", delay: 2200 },
  { text: "A world I can see when I close my eyes.", delay: 3800 },
  { text: "But every time I open a blank page...", delay: 5800 },
  { text: "nothing.", delay: 8000 },
]

const SHIFT_LINE = { text: "So I stopped writing. And I started talking.", delay: 10000 }

export default function TypewriterHero() {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [shiftVisible, setShiftVisible] = useState(false)
  const [taglineVisible, setTaglineVisible] = useState(false)
  const [ctaVisible, setCtaVisible] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay))
    })

    timers.push(setTimeout(() => setShiftVisible(true), SHIFT_LINE.delay))
    timers.push(setTimeout(() => setTaglineVisible(true), 12000))
    timers.push(setTimeout(() => setCtaVisible(true), 13500))

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        {/* The spoken text — appears line by line */}
        <div className="mb-12 min-h-[280px]">
          {LINES.map((line, i) => (
            <p
              key={i}
              className="font-serif text-2xl leading-relaxed transition-all duration-700 sm:text-3xl md:text-4xl"
              style={{
                color: i === 4 ? 'var(--rune-gold)' : 'var(--rune-heading)',
                opacity: i < visibleLines ? 1 : 0,
                transform: i < visibleLines ? 'translateY(0)' : 'translateY(12px)',
                fontStyle: i === 4 ? 'italic' : 'normal',
              }}
            >
              {line.text}
            </p>
          ))}
        </div>

        {/* The shift — voice changes everything */}
        <div
          className="mb-16 transition-all duration-1000"
          style={{
            opacity: shiftVisible ? 1 : 0,
            transform: shiftVisible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <div
            className="mx-auto mb-8 h-px w-24 transition-all duration-1000"
            style={{
              background: 'var(--rune-gold)',
              opacity: shiftVisible ? 1 : 0,
              transform: shiftVisible ? 'scaleX(1)' : 'scaleX(0)',
            }}
          />
          <p
            className="font-serif text-xl sm:text-2xl"
            style={{ color: 'var(--rune-heading)' }}
          >
            {SHIFT_LINE.text}
          </p>
        </div>

        {/* Tagline */}
        <div
          className="mb-10 transition-all duration-700"
          style={{
            opacity: taglineVisible ? 1 : 0,
            transform: taglineVisible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <h1
            className="font-serif text-3xl sm:text-4xl md:text-5xl"
            style={{ color: 'var(--rune-heading)', letterSpacing: '-0.02em' }}
          >
            Speak your book into existence.
          </h1>
        </div>

        {/* CTA */}
        <div
          className="flex flex-col items-center gap-4 transition-all duration-700"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <Link
            href="/auth"
            className="inline-flex items-center gap-3 rounded-lg px-8 py-4 font-sans text-base font-medium transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'var(--rune-gold)',
              color: 'var(--rune-bg)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            Start talking
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--rune-muted)' }}>
            Free to start. Your words stay yours.
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700"
        style={{ opacity: ctaVisible ? 0.4 : 0 }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--rune-muted)' }}>
            Scroll to explore
          </span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="animate-bounce">
            <path d="M8 4L8 20M8 20L2 14M8 20L14 14" stroke="var(--rune-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </section>
  )
}
