// AppFooter — Site footer with attribution and links

export default function AppFooter() {
  return (
    <footer
      className="mt-auto px-6 py-8"
      style={{
        backgroundColor: 'var(--rune-surface)',
        borderTop: '1px solid var(--rune-border)',
      }}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Left: tagline + attribution */}
        <div className="text-center sm:text-left">
          <p className="text-sm" style={{ color: 'var(--rune-text)' }}>
            Rune — Your AI Ghost Writer
          </p>
          <p className="text-xs" style={{ color: 'var(--rune-muted)' }}>
            Built by id8Labs
          </p>
        </div>

        {/* Right: links + copyright */}
        <div className="flex flex-col items-center gap-1 sm:items-end">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/eddiebelaval/rune"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs transition-colors duration-200"
              style={{ color: 'var(--rune-muted)' }}
            >
              GitHub
            </a>
            <span className="text-xs" style={{ color: 'var(--rune-border)' }}>|</span>
            <span className="text-xs" style={{ color: 'var(--rune-muted)' }}>
              Open Source (MIT)
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--rune-muted)' }}>
            &copy; 2026 id8Labs LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
