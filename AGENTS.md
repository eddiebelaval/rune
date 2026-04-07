# Rune -- Codex Context

## What Is This
Voice-first conversational book writer. An AI ghost writer that helps anyone write a book through pure conversation. Open source (MIT). Sister product to Parallax.

## Tech Stack
- **Next.js 16** -- App Router, TypeScript strict mode
- **Supabase** -- Postgres + Realtime subscriptions + Storage
- **Codex API** -- Multi-model: Opus (writer), Sonnet (editor), Haiku (clerk)
- **Deepgram** -- WebSocket streaming speech-to-text
- **Tailwind CSS v4** -- Codex-Inspired design system tokens
- **Docker** -- Self-host option
- **Vercel** -- Deployment

## Design System: Codex-Inspired

### Philosophy
Warm cream surfaces, coral accents, clean white cards. Light-mode default with optional dark mode via `.dark` class. Source Serif 4 headings for writing-tool identity. Background texture (dot-grid + radial vignette) for subtle depth.

### Colors -- Light Mode (Default)
| Token | Value | Usage |
|-------|-------|-------|
| `--rune-bg` | `#faf9f5` | Page background (warm cream) |
| `--rune-surface` | `#ffffff` | Card surfaces (clean white) |
| `--rune-elevated` | `#f5f4ef` | Hover states, raised surfaces |
| `--rune-border` | `#e5e4df` | Borders, dividers |
| `--rune-muted` | `#73726c` | Muted text, placeholders |
| `--rune-text` | `#3d3d3a` | Body text |
| `--rune-heading` | `#141413` | Headings, primary text |
| `--rune-gold` | `#d97757` | Primary accent (Codex coral) |
| `--rune-teal` | `#2c84db` | Secondary accent (Codex blue) |
| `--rune-error` | `#dc3545` | Error states (accessible red) |

### Colors -- Dark Mode (opt-in via `.dark` class)
| Token | Value |
|-------|-------|
| `--rune-bg` | `#1a1918` |
| `--rune-surface` | `#252422` |
| `--rune-elevated` | `#302e2b` |
| `--rune-border` | `#3d3c38` |
| `--rune-muted` | `#8c8b87` |
| `--rune-text` | `#ccccc6` |
| `--rune-heading` | `#eeeeec` |
| `--rune-gold` | `#e08b6d` |
| `--rune-teal` | `#5a9fe6` |
| `--rune-error` | `#e25563` |

### Typography
- **Headings:** Source Serif 4 -- weight 400, letter-spacing: -0.02em
- **Body:** Source Sans 3 -- clean, readable
- **Labels/Mono:** IBM Plex Mono -- uppercase, tracking-wider
- All loaded via `next/font/google`

### Rules
- NEVER hardcode hex colors -- always use `var(--rune-*)` tokens.
- Coral accent (`--rune-gold`) for interactive elements, user actions.
- Blue accent (`--rune-teal`) for AI/system elements, Rune activity.
- Use `var(--rune-error)` for error states, not hardcoded reds.
- For alpha variants, use `color-mix(in srgb, var(--rune-gold) 20%, transparent)`.
- Organic rounded corners on interactive elements.
- Gradients are informational (progress, status), never decorative.

### App Shell
- `AppHeader` -- fixed top bar with Rune wordmark, Library link, profile dropdown
- `AppFooter` -- shown on landing, auth, new-book pages; NOT on book workspace
- `SessionSidebar` -- collapsible session list on book workspace (left side)
- `BookWorkspace` -- client component wiring sidebar + session view

## Architecture

```
src/
  app/
    page.tsx                         # Landing / book selection
    layout.tsx                       # Root layout, fonts, auth
    globals.css                      # Codex-Inspired design tokens
    book/[id]/page.tsx               # Main session view
    api/
      books/route.ts                 # Create/list books
      sessions/route.ts              # Session management
      converse/route.ts              # Main conversation (streaming)
      classify/route.ts              # Haiku intent detection
      extract/route.ts               # Haiku entity extraction
      synthesize/route.ts            # Opus session synthesis
      manuscript/route.ts            # Chapter assembly
      deepgram-token/route.ts        # Secure Deepgram key exchange
  components/
    AppHeader.tsx                    # Top bar: logo, nav, profile
    AppFooter.tsx                    # Site footer with attribution
    BookWorkspace.tsx                # Client wrapper: sidebar + session
    SessionSidebar.tsx               # Collapsible session list
    SessionView.tsx                  # Chat + activity view (65/35)
    MessageArea.tsx                  # Conversation messages
    VoiceInput.tsx                   # Deepgram mic capture
    ActivityStream.tsx               # Real-time Rune activity
    ManuscriptViewer.tsx             # Chapter reader panel
    BookProgress.tsx                 # Progress dashboard
    KnowledgeGraph.tsx               # Entity visualization
    QualitySlider.tsx                # Model quality control
  lib/
    model-router.ts                  # Three-tier model routing
    prompts/
      index.ts                       # Prompt assembly
      interviewer.ts                 # Guided mode persona
      scribe.ts                      # Freeform mode persona
      editor.ts                      # Review mode persona
      book-templates.ts              # Memoir/fiction/nonfiction variants
    supabase.ts                      # Client setup
    deepgram.ts                      # WebSocket client
    workspace.ts                     # Three rooms CRUD
    knowledge-graph.ts               # Entity management
    backlog.ts                       # Backlog engine
    manuscript.ts                    # Chapter assembly
  hooks/
    useSession.ts                    # Session state + Realtime
    useWorkspace.ts                  # Workspace Realtime updates
    useVoiceInput.ts                 # Deepgram mic hook
    useBacklog.ts                    # Backlog items Realtime
  types/
    database.ts                      # Supabase types
    models.ts                        # Model routing types
```

## Model Routing

Three-tier system with quality slider. User sets Economy/Standard/Premium once; Rune routes every task to the right model automatically.

| Task | Economy | Standard | Premium |
|------|---------|----------|---------|
| Intent detection | Haiku | Haiku | Sonnet |
| Entity extraction | Haiku | Haiku | Sonnet |
| Filing/organizing | Haiku | Sonnet | Sonnet |
| Knowledge graph | Haiku | Sonnet | Opus |
| Backlog updates | Haiku | Sonnet | Opus |
| Interview questions | Sonnet | Opus | Opus |
| Prose generation | Sonnet | Opus | Opus |
| Review/feedback | Sonnet | Opus | Opus |
| Final manuscript | Opus | Opus | Opus |

## Three Rooms (Workspace)

Structure adapts by book type:

### Memoir
- **Brainstorm:** people, eras, places, emotions, artifacts, themes, raw-sessions
- **Drafts:** outline, chapters, fragments, timeline, revision-notes
- **Publish:** manuscript, synopsis, exports, targets

### Fiction
- **Brainstorm:** characters, world-bible, plot-threads, magic-systems, themes, raw-sessions
- **Drafts:** outline, story-arc, chapters, scenes, revision-notes
- **Publish:** manuscript, synopsis, exports, targets

### Non-fiction
- **Brainstorm:** concepts, frameworks, case-studies, arguments, research, raw-sessions
- **Drafts:** outline, thesis, chapters, sections, revision-notes
- **Publish:** manuscript, synopsis, exports, targets

## Knowledge Graph
- **Entities:** person, place, theme, event (with attributes, mention counts)
- **Relationships:** typed connections between entities
- **Timeline:** fuzzy-date events linked to entities and chapters
- **Unresolved array:** contradictions, gaps, unexplored mentions (auto-feeds backlog)

## Backlog Engine
- **Types:** question, contradiction, thin_spot, unexplored, review, idea
- **Priority:** 1-5 base, +1 per 3 sessions aged, type weighting, finish bonus
- **Auto-generated** after each session by Sonnet analysis
- **Surfaces as suggestions** when user opens Rune

## Conversation Modes

Detected by Haiku intent classification, never manually selected:

| Mode | Behavior |
|------|----------|
| **Guided** | Rune picks from backlog, interviews via Opus |
| **Freeform** | User brain dumps, Sonnet captures and files silently |
| **Review** | Opus reads back drafts, takes conversational feedback |
| **Brainstorm** | Capture ideas, explore "what if" questions |
| **Status** | Progress report on the book |
| **Command** | Settings, exports, title changes |

## Branch Protocol
- Never commit to `main` directly
- Feature branches: `rune/stage-N-name` or `rune/feature-name`
- Merge via PR at each stage gate

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
```
