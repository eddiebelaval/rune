'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'sam'
  text: string
  delay: number
}

const CONVERSATION: Message[] = [
  { role: 'user', text: "She's fearless. Nothing scares her.", delay: 0 },
  { role: 'sam', text: "Nothing? Not even losing the people she's fighting for?", delay: 1200 },
  { role: 'user', text: "...actually, yeah. That's exactly what she's afraid of.", delay: 3000 },
]

const KB_FILING = {
  text: "Filing to Character Profile: Kira — fear of loss",
  delay: 4500,
}

export default function ConversationDemo() {
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [filingVisible, setFilingVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true)
        }
      },
      { threshold: 0.4 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [hasTriggered])

  useEffect(() => {
    if (!hasTriggered) return

    const timers: ReturnType<typeof setTimeout>[] = []

    CONVERSATION.forEach((msg, i) => {
      timers.push(setTimeout(() => setVisibleMessages(i + 1), msg.delay))
    })

    timers.push(setTimeout(() => setFilingVisible(true), KB_FILING.delay))

    return () => timers.forEach(clearTimeout)
  }, [hasTriggered])

  return (
    <div ref={sectionRef} className="mx-auto max-w-lg">
      <div className="flex flex-col gap-4">
        {CONVERSATION.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-500`}
            style={{
              opacity: i < visibleMessages ? 1 : 0,
              transform: i < visibleMessages ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            <div
              className="max-w-[80%] rounded-2xl px-5 py-3.5"
              style={{
                background: msg.role === 'user'
                  ? 'color-mix(in srgb, var(--rune-gold) 12%, transparent)'
                  : 'var(--rune-surface)',
                border: msg.role === 'sam'
                  ? '1px solid var(--rune-border)'
                  : '1px solid color-mix(in srgb, var(--rune-gold) 20%, transparent)',
              }}
            >
              <p
                className="font-mono text-[10px] uppercase tracking-widest mb-1.5"
                style={{
                  color: msg.role === 'user' ? 'var(--rune-gold)' : 'var(--rune-muted)',
                }}
              >
                {msg.role === 'user' ? 'You' : 'Sam'}
              </p>
              <p
                className={`text-[15px] leading-relaxed ${msg.role === 'sam' ? 'font-serif' : 'font-sans'}`}
                style={{
                  color: 'var(--rune-heading)',
                  fontStyle: msg.role === 'sam' ? 'normal' : 'normal',
                }}
              >
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* KB Filing Notification */}
      <div
        className="mt-4 flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-700"
        style={{
          opacity: filingVisible ? 1 : 0,
          transform: filingVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
          background: 'color-mix(in srgb, var(--rune-teal) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--rune-teal) 20%, transparent)',
        }}
      >
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--rune-teal) 15%, transparent)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--rune-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-mono text-xs" style={{ color: 'var(--rune-teal)' }}>
          {KB_FILING.text}
        </p>
      </div>
    </div>
  )
}
