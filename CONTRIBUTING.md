# Contributing to Rune

Thanks for your interest in contributing to Rune. This document covers the basics.

## Development Setup

1. Clone the repo and install dependencies:
   ```
   git clone https://github.com/eddiebelaval/rune.git
   cd rune
   npm install
   ```

2. Copy the environment template:
   ```
   cp .env.example .env.local
   ```

3. Fill in your API keys (Supabase, Anthropic, Deepgram).

4. Run the dev server:
   ```
   npm run dev
   ```

## Branch Convention

- Never commit directly to `main`
- Feature branches: `rune/feature-name`
- Stage branches: `rune/stage-N-name`
- PRs require passing TypeScript check (`npx tsc --noEmit`) and build (`npm run build`)

## Commit Messages

This project uses the ID8 Pipeline commit convention:

```
[Stage N: Stage Name] type: description
```

Types: `feat`, `fix`, `deps`, `docs`, `verify`, `refactor`, `test`

## Code Style

- TypeScript strict mode
- Functional React components with hooks
- Tailwind CSS v4 with the Library/Study design system tokens (`var(--rune-*)`)
- No emoji in code or UI -- use inline SVG icons
- Source Serif 4 for headings, Source Sans 3 for body, IBM Plex Mono for labels

## Architecture

See `BUILDING.md` for the full pipeline methodology and `CLAUDE.md` for the technical architecture reference.

## Key Principles

- **Voice-first**: Every feature should work through conversation
- **Zero-touch after login**: No menus, no buttons, no manual organization
- **Stream everything**: Users watch Rune work in real-time
- **Three-tier model routing**: Haiku for classification, Sonnet for organizing, Opus for writing

## Reporting Issues

Open an issue on GitHub with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Node version, browser)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
