'use client'

import Link from 'next/link'
import TypewriterHero from './TypewriterHero'
import ConversationDemo from './ConversationDemo'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--rune-gold)' }}>
      {children}
    </p>
  )
}

function SectionDivider() {
  return (
    <div className="mx-auto my-2 h-px w-16" style={{ background: 'var(--rune-border)' }} />
  )
}

// ─────────────────────────────────────────────────────────
// Section 2: The Ancient Problem
// ─────────────────────────────────────────────────────────
function AncientProblem() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>The ancient problem</SectionLabel>

        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Left: The oral tradition */}
          <div className="flex flex-col justify-center">
            <div
              className="mb-8 rounded-lg p-8 md:p-10"
              style={{
                background: 'color-mix(in srgb, var(--rune-gold) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--rune-gold) 12%, transparent)',
              }}
            >
              <p className="font-serif text-xl leading-relaxed md:text-2xl" style={{ color: 'var(--rune-heading)' }}>
                &ldquo;Tell me again about the time the river flooded and grandmother carried the seeds on her back...&rdquo;
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--rune-gold)' }}>
                Every campfire. Every generation. 40,000 years.
              </p>
            </div>
          </div>

          {/* Right: The blank page */}
          <div className="flex flex-col justify-center">
            <div
              className="rounded-lg p-8 md:p-10"
              style={{
                background: 'var(--rune-surface)',
                border: '1px solid var(--rune-border)',
              }}
            >
              <div className="mb-6 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
              </div>
              <div className="min-h-[120px]">
                <span
                  className="inline-block h-6 w-[2px] animate-pulse"
                  style={{ background: 'var(--rune-heading)' }}
                />
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--rune-muted)' }}>
                Chapter 1. Untitled document.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <p className="font-serif text-xl leading-relaxed md:text-2xl" style={{ color: 'var(--rune-heading)' }}>
            We invented writing and made the most natural human act into one of the most intimidating.
          </p>
          <p className="mt-4 font-sans text-lg" style={{ color: 'var(--rune-muted)' }}>
            Rune reconnects the ancient and the modern.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Section 3: Meet Sam
// ─────────────────────────────────────────────────────────
function MeetSam() {
  const traits = [
    { label: 'Patient', desc: 'Never rushes. Your pace is the right pace.' },
    { label: 'Curious', desc: 'Asks the questions you haven\'t thought to ask.' },
    { label: 'Warm', desc: 'Present, attentive, never patronizing.' },
    { label: 'Honest', desc: 'Notices contradictions. Asks about them.' },
    { label: 'Steady', desc: 'Same on good days and hard days.' },
  ]

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>Meet Sam</SectionLabel>

        <div className="mb-16 max-w-2xl">
          <h2 className="mb-4 font-serif text-3xl md:text-4xl" style={{ color: 'var(--rune-heading)' }}>
            Your scribe. Your gardener.
          </h2>
          <p className="font-sans text-lg leading-relaxed" style={{ color: 'var(--rune-text)' }}>
            Named for the one who carried the storyteller when the storyteller couldn&apos;t carry himself.
            Sam doesn&apos;t write your book. Sam makes sure your book gets written.
          </p>
        </div>

        {/* Conversation demo */}
        <ConversationDemo />

        {/* Traits */}
        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {traits.map((trait) => (
            <div
              key={trait.label}
              className="rounded-lg p-4 text-center transition-colors duration-200"
              style={{
                background: 'var(--rune-surface)',
                border: '1px solid var(--rune-border)',
              }}
            >
              <p className="font-serif text-base" style={{ color: 'var(--rune-heading)' }}>
                {trait.label}
              </p>
              <p className="mt-1 font-sans text-xs" style={{ color: 'var(--rune-muted)' }}>
                {trait.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Section 4: The Three Stages
// ─────────────────────────────────────────────────────────
function ThreeStages() {
  const stages = [
    {
      letter: 'A',
      name: 'The Workshop',
      subtitle: 'World Building',
      color: 'var(--rune-gold)',
      colorDim: 'color-mix(in srgb, var(--rune-gold) 10%, transparent)',
      colorBorder: 'color-mix(in srgb, var(--rune-gold) 20%, transparent)',
      description: 'You talk about your world. Sam interviews you through characters, locations, rules, relationships. A knowledge base grows with every conversation.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      letter: 'B',
      name: 'The Study',
      subtitle: 'Story Writing',
      color: 'var(--rune-teal)',
      colorDim: 'color-mix(in srgb, var(--rune-teal) 10%, transparent)',
      colorBorder: 'color-mix(in srgb, var(--rune-teal) 20%, transparent)',
      description: 'Once your world is built, Sam helps you structure and write. Arcs, chapters, scenes, prose \u2014 all drawn from the world you already described.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      ),
    },
    {
      letter: 'C',
      name: 'The Press',
      subtitle: 'Publishing',
      color: 'var(--rune-heading)',
      colorDim: 'color-mix(in srgb, var(--rune-heading) 6%, transparent)',
      colorBorder: 'color-mix(in srgb, var(--rune-heading) 12%, transparent)',
      description: 'Your manuscript assembled, formatted, and ready for the world. Books first \u2014 but screenplays, audio scripts, anything your world deserves.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
    },
  ]

  return (
    <section className="px-6 py-24 md:py-32" style={{ background: 'var(--rune-elevated)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <SectionLabel>The three stages</SectionLabel>
          <h2 className="font-serif text-3xl md:text-4xl" style={{ color: 'var(--rune-heading)' }}>
            From voice to finished book
          </h2>
        </div>

        {/* Progress line */}
        <div className="relative">
          <div
            className="absolute left-1/2 top-0 hidden h-full w-px md:block"
            style={{ background: 'var(--rune-border)', transform: 'translateX(-50%)' }}
          />
          <div className="hidden items-center justify-between md:flex" style={{ position: 'relative', zIndex: 1 }}>
            <div className="h-px flex-1" style={{ background: 'var(--rune-border)' }} />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {stages.map((stage) => (
              <div
                key={stage.letter}
                className="rounded-xl p-6 md:p-8 transition-all duration-200"
                style={{
                  background: 'var(--rune-surface)',
                  border: `1px solid ${stage.colorBorder}`,
                }}
              >
                {/* Stage header */}
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg font-serif text-lg"
                    style={{ background: stage.colorDim, color: stage.color }}
                  >
                    {stage.letter}
                  </div>
                  <div>
                    <p className="font-serif text-lg" style={{ color: 'var(--rune-heading)' }}>
                      {stage.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: stage.color }}>
                      {stage.subtitle}
                    </p>
                  </div>
                </div>

                {/* Icon */}
                <div className="mb-5" style={{ color: stage.color }}>
                  {stage.icon}
                </div>

                {/* Description */}
                <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--rune-text)' }}>
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Section 5: How It Works
// ─────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '01',
      label: 'You speak',
      example: '"Let me tell you about the kingdom of Ashara..."',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rune-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        </svg>
      ),
    },
    {
      num: '02',
      label: 'Sam listens',
      example: 'World-building detected. Foundation layer.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rune-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      num: '03',
      label: 'The world grows',
      example: 'World Bible entry auto-filed: "Kingdom of Ashara"',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rune-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M2 12h20" />
        </svg>
      ),
    },
    {
      num: '04',
      label: 'Sam asks the next question',
      example: '"What does it smell like there? What sounds do you hear?"',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rune-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      ),
    },
  ]

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="font-serif text-3xl md:text-4xl" style={{ color: 'var(--rune-heading)' }}>
            Voice in. World out.
          </h2>
        </div>

        <div className="relative">
          {/* Vertical connecting line */}
          <div
            className="absolute left-[29px] top-0 h-full w-px"
            style={{ background: 'var(--rune-border)' }}
          />

          <div className="flex flex-col gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative flex gap-6">
                {/* Number dot */}
                <div
                  className="relative z-10 flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: 'var(--rune-surface)',
                    border: '1px solid var(--rune-border)',
                  }}
                >
                  {step.icon}
                </div>

                {/* Content */}
                <div
                  className="flex-1 rounded-lg p-5"
                  style={{
                    background: 'var(--rune-surface)',
                    border: '1px solid var(--rune-border)',
                  }}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--rune-muted)' }}>
                      {step.num}
                    </span>
                    <span className="font-sans text-sm font-medium" style={{ color: 'var(--rune-heading)' }}>
                      {step.label}
                    </span>
                  </div>
                  <p className="font-serif text-[15px] leading-relaxed" style={{ color: 'var(--rune-text)' }}>
                    {step.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Section 6: Who This Is For
// ─────────────────────────────────────────────────────────
function WhoThisIsFor() {
  return (
    <section className="px-6 py-24 md:py-32" style={{ background: 'var(--rune-elevated)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <SectionLabel>Who this is for</SectionLabel>
          <h2 className="font-serif text-3xl md:text-4xl" style={{ color: 'var(--rune-heading)' }}>
            People with stories, not manuscripts.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* The Storytellers */}
          <div
            className="rounded-xl p-8"
            style={{ background: 'var(--rune-surface)', border: '1px solid var(--rune-border)' }}
          >
            <div className="mb-6 flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full font-serif text-lg font-semibold"
                style={{
                  background: 'color-mix(in srgb, var(--rune-gold) 12%, transparent)',
                  color: 'var(--rune-gold)',
                }}
              >
                2
              </div>
              <div>
                <p className="font-serif text-lg" style={{ color: 'var(--rune-heading)' }}>The Storytellers</p>
                <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--rune-gold)' }}>Children&apos;s Book</p>
              </div>
            </div>
            <p className="font-sans text-[15px] leading-relaxed" style={{ color: 'var(--rune-text)' }}>
              Two partners writing a bicultural children&apos;s picture book about growing up with your heart in two places.
              They&apos;ve never written a book. They don&apos;t need to &mdash; they just need to tell the story.
            </p>
          </div>

          {/* The World Builder */}
          <div
            className="rounded-xl p-8"
            style={{ background: 'var(--rune-surface)', border: '1px solid var(--rune-border)' }}
          >
            <div className="mb-6 flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full font-serif text-lg font-semibold"
                style={{
                  background: 'color-mix(in srgb, var(--rune-teal) 12%, transparent)',
                  color: 'var(--rune-teal)',
                }}
              >
                1
              </div>
              <div>
                <p className="font-serif text-lg" style={{ color: 'var(--rune-heading)' }}>The World Builder</p>
                <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--rune-teal)' }}>Sci-Fi Novel</p>
              </div>
            </div>
            <p className="font-sans text-[15px] leading-relaxed" style={{ color: 'var(--rune-text)' }}>
              Has a sci-fi universe in her head &mdash; the characters, the rules, the arcs.
              The blank page was the only thing stopping her.
              Voice-first changes everything: she describes her world like she&apos;s giving a tour of it.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Section 7: Open Source
// ─────────────────────────────────────────────────────────
function OpenSource() {
  const stack = ['Next.js 16', 'Supabase', 'Claude API', 'Deepgram STT', 'TypeScript', 'Tailwind']

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <SectionLabel>Open source</SectionLabel>
        <h2 className="mb-4 font-serif text-3xl md:text-4xl" style={{ color: 'var(--rune-heading)' }}>
          Built in the open.
        </h2>
        <p className="mb-8 font-sans text-lg" style={{ color: 'var(--rune-muted)' }}>
          MIT license. Fork it, self-host it, make it yours.
        </p>

        <div className="mb-8 flex items-center justify-center gap-4">
          <a
            href="https://github.com/eddiebelaval/rune"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-sans text-sm font-medium transition-colors duration-200"
            style={{
              background: 'var(--rune-heading)',
              color: 'var(--rune-bg)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <span
            className="rounded-lg px-4 py-2.5 font-mono text-xs uppercase tracking-widest"
            style={{
              background: 'var(--rune-elevated)',
              border: '1px solid var(--rune-border)',
              color: 'var(--rune-muted)',
            }}
          >
            MIT License
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {stack.map((tech) => (
            <span
              key={tech}
              className="rounded px-3 py-1.5 font-mono text-[11px]"
              style={{
                background: 'var(--rune-surface)',
                border: '1px solid var(--rune-border)',
                color: 'var(--rune-muted)',
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Section 8: Final CTA
// ─────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="px-6 py-24 md:py-32" style={{ background: 'var(--rune-elevated)' }}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 font-serif text-3xl md:text-4xl" style={{ color: 'var(--rune-heading)' }}>
          You have a story.
        </h2>
        <p className="mb-10 font-serif text-2xl md:text-3xl" style={{ color: 'var(--rune-gold)' }}>
          Sam is ready to listen.
        </p>

        <Link
          href="/auth"
          className="inline-flex items-center gap-3 rounded-lg px-10 py-4 font-sans text-base font-medium transition-all duration-300 hover:scale-[1.02]"
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

        <p className="mt-6 font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--rune-muted)' }}>
          Free to start. Your words stay yours.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Main Landing Page
// ─────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div>
      <TypewriterHero />
      <SectionDivider />
      <AncientProblem />
      <ThreeStages />
      <MeetSam />
      <HowItWorks />
      <WhoThisIsFor />
      <OpenSource />
      <FinalCTA />
    </div>
  )
}
