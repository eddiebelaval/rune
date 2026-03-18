import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';

// ---------------------------------------------------------------------------
// AppFooter — Site footer for unauthenticated pages (landing, auth)
// ---------------------------------------------------------------------------

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const props = external
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  const className =
    'text-sm transition-colors duration-200 hover:text-[var(--rune-heading)]';
  const style = { color: 'var(--rune-muted)' };

  if (external) {
    return (
      <a href={href} className={className} style={style} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em]"
        style={{ color: 'var(--rune-gold)' }}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

export default function AppFooter() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--rune-surface)',
        borderTop: '1px solid var(--rune-border)',
      }}
    >
      {/* Main footer grid */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <p
              className="mb-3 text-xl tracking-tight"
              style={{ color: 'var(--rune-gold)', fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)', fontWeight: 400 }}
            >
              Rune
            </p>
            <p
              className="mb-6 max-w-xs text-sm leading-relaxed"
              style={{ color: 'var(--rune-muted)' }}
            >
              The oral tradition didn&apos;t die. It just needed a scribe.
              Speak your book into existence.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/eddiebelaval/rune"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--rune-elevated)',
                  color: 'var(--rune-muted)',
                }}
                aria-label="GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://id8labs.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--rune-elevated)',
                  color: 'var(--rune-muted)',
                }}
                aria-label="id8Labs"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product column */}
          <FooterColumn title="Product">
            <li><FooterLink href="/auth">Get started</FooterLink></li>
            <li><FooterLink href="/#how-it-works">How it works</FooterLink></li>
            <li><FooterLink href="/#meet-sam">Meet Sam</FooterLink></li>
            <li><FooterLink href="/#three-stages">The pipeline</FooterLink></li>
          </FooterColumn>

          {/* Developers column */}
          <FooterColumn title="Developers">
            <li><FooterLink href="https://github.com/eddiebelaval/rune" external>Source code</FooterLink></li>
            <li><FooterLink href="https://github.com/eddiebelaval/rune/issues" external>Issues</FooterLink></li>
            <li><FooterLink href="https://github.com/eddiebelaval/rune#self-hosting" external>Self-host</FooterLink></li>
            <li>
              <span
                className="inline-flex items-center gap-1.5 text-sm"
                style={{ color: 'var(--rune-muted)' }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--rune-teal)' }}
                />
                MIT License
              </span>
            </li>
          </FooterColumn>

          {/* Company column */}
          <FooterColumn title="Company">
            <li><FooterLink href="https://id8labs.app" external>id8Labs</FooterLink></li>
            <li><FooterLink href="/privacy">Privacy</FooterLink></li>
            <li><FooterLink href="/terms">Terms</FooterLink></li>
          </FooterColumn>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="px-6 py-5"
        style={{ borderTop: '1px solid var(--rune-border)' }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs" style={{ color: 'var(--rune-muted)' }}>
            &copy; {new Date().getFullYear()} id8Labs LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p
              className="text-xs italic"
              style={{ color: 'color-mix(in srgb, var(--rune-muted) 70%, transparent)' }}
            >
              A rune is an ancient letter. Books are modern runes.
            </p>
            <span
              className="font-mono text-[10px] tracking-wider"
              style={{ color: 'var(--rune-muted)' }}
            >
              v{APP_VERSION}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
