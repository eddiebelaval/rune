# Rune -- Claude Code Context

## What Is This
Voice-first conversational book writer. An AI ghost writer that helps anyone write a book through pure conversation. Open source (MIT). Sister product to Parallax.

## Tech Stack
- **Next.js 16** -- App Router, TypeScript strict mode
- **Supabase** -- Postgres + Realtime subscriptions + Storage
- **Claude API** -- Multi-model: Opus (writer), Sonnet (editor), Haiku (clerk)
- **Deepgram** -- WebSocket streaming speech-to-text
- **Tailwind CSS v4** -- Library/Study design system tokens
- **Docker** -- Self-host option
- **Vercel** -- Deployment

## Design System: Library/Study

### Philosophy
Writing at a mahogany desk with a warm lamp. Dark wood tones, leather textures, aged paper. Warm and intimate, never clinical. The UI should feel like a study, not a software tool.

### Colors -- Dark Mode (Default)
| Token | Value | Usage |
|-------|-------|-------|
| `--rune-bg` | `#1a120e` | Page background (deep mahogany) |
| `--rune-surface` | `#2a1f18` | Card surfaces (warm leather) |
| `--rune-elevated` | `#3a2e22` | Hover states, raised surfaces |
| `--rune-border` | `#4a3d30` | Borders, dividers |
| `--rune-muted` | `#7a6c58` | Muted text, placeholders |
| `--rune-text` | `#d4c5b0` | Body text (aged paper) |
| `--rune-heading` | `#ebe1d4` | Headings, primary text |
| `--rune-gold` | `#c4a265` | Primary accent (lamp gold) |
| `--rune-teal` | `#4ecdc4` | Secondary accent (ink teal) |

### Colors -- Light Mode
| Token | Value | Usage |
|-------|-------|-------|
| `--rune-bg` | `#f5efe6` | Page background (warm parchment) |
| `--rune-text` | `#1e1810` | Primary text (dark ink) |
| Accents deepened 15% for WCAG contrast |

### Typography
- **Headings:** Source Serif 4 -- weight 400, letter-spacing: -0.02em
- **Body:** Source Sans 3 -- clean, readable
- **Labels/Mono:** IBM Plex Mono -- uppercase, tracking-wider
- All loaded via `next/font/google`

### Rules
- Warm tones only. NO cool blues or clinical whites.
- Gold accent (`#c4a265`) for interactive elements, user actions.
- Teal accent (`#4ecdc4`) for AI/system elements, Rune activity.
- Organic rounded corners on interactive elements.
- Gradients are informational (progress, status), never decorative.

## Architecture

```
src/
  app/
    page.tsx                         # Landing / book selection
    layout.tsx                       # Root layout, fonts, auth
    globals.css                      # Library/Study design tokens
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
    SessionView.tsx                  # Chat + workspace view
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
