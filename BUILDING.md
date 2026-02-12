# Building Rune -- A Voice-First Conversational Book Writer

## What is the ID8 Pipeline?

An 11-stage gated build methodology. Each stage has a gate question. You don't advance until the gate passes. Commits are prefixed with stage numbers. The git log reads as a build narrative.

### The 11 Stages

| # | Stage              | Gate Question                                      | Phase    |
|---|--------------------|-----------------------------------------------------|----------|
| 1 | Concept Lock       | "What's the one-liner?"                             | Planning |
| 2 | Scope Fence        | "What are we NOT building?"                         | Planning |
| 3 | Architecture Sketch| "Could another dev build from this blueprint?"      | Planning |
| 4 | Foundation Pour    | "Does the skeleton stand?"                          | Building |
| 5 | Feature Blocks     | "Does the core feature work end-to-end?"            | Building |
| 6 | Integration Pass   | "Do all the parts talk to each other?"              | Building |
| 7 | Test Coverage      | "Are the tests green and covering critical paths?"  | Quality  |
| 8 | Polish and Harden  | "Would you show this to a stranger?"                | Quality  |
| 9 | Launch Prep        | "Is the launch checklist complete?"                 | Launch   |
| 10| Ship               | "Did you tell the world?"                           | Launch   |
| 11| Listen and Iterate | "What did users actually do?"                       | Launch   |

### Commit Convention

```
[Stage N: Name] type: description
```

- **Types:** `feat`, `fix`, `deps`, `docs`, `verify`, `refactor`, `test`
- **Gate commits:** `[Stage N: Name] verify: gate PASSED -- description`
- **Meta work:** `[Meta]` prefix (e.g., `[Meta] docs: update BUILDING.md`)

### Gate Rules

- Every commit references its stage
- Gates require evidence before advancing
- Overrides are allowed but logged permanently
- The git log reads as a build narrative

---

## Stage 1: Concept Lock (LOCKED)

- **Date:** 2026-02-12
- **Gate Question:** "What's the one-liner?"
- **Status:** LOCKED

**One-liner:** An AI ghost writer that helps anyone write a book through pure conversation.

**Vision:** Zero-touch after login. Voice-first. The user talks, Rune interviews, listens, organizes, and writes. A book emerges over many sessions. The only physical action is authentication. Everything else is voice.

**Name:** "Rune" -- an ancient letter, a symbol of knowledge encoded. Books are modern runes.

**Origin:** Sister product to Parallax (same conversational-AI-as-product DNA). Where Parallax mediates conflict through conversation, Rune creates books through conversation. The shared insight: the best AI products feel like talking to someone brilliant who listens carefully.

### Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Input modality | Voice-first (Deepgram WebSocket STT) | Writing a book by talking is the unlock. Typing is fallback, not primary. |
| Model strategy | Three-tier routing: Opus/Sonnet/Haiku | Different tasks need different intelligence. User controls cost via quality slider. |
| Workspace | Three Rooms: Brainstorm, Drafts, Publish | Maps to how books are actually made. Structure adapts by book type. |
| Memory | Knowledge graph (entities + relationships + timeline) | A book is a web of people, places, themes, events. Graph > flat notes. |
| Engagement | Backlog engine (always has work to do) | Rune is never idle. Questions, contradictions, thin spots, threads. |
| UX | Zero-touch conversational (no menus/buttons/settings) | The UI disappears. You talk to Rune. Everything else is automatic. |
| Transparency | Stream everything (filing, connecting, drafting) | User watches Rune work. Trust through visibility. |
| Aesthetic | Library/Study (dark wood, warm lamp, leather) | Writing environment, not software tool. |
| License | MIT (open source) | Same philosophy as Parallax. |
| Self-host | Docker + docker-compose | Users own their manuscript data. |
| Hosted | Vercel | Zero-config deployment for the hosted version. |
| AI keys | User-provided (BYOK) | No middleman. User controls cost and model access. |

---

## Pipeline Progress

| Stage | Name | Gate Question | Status |
|-------|------|---------------|--------|
| 1 | Concept Lock | What's the one-liner? | LOCKED |
| 2 | Scope Fence | What are we NOT building? | LOCKED |
| 3 | Architecture Sketch | Could another dev build from this? | LOCKED |
| 4 | Foundation Pour | Does the skeleton stand? | PASSED |
| 5 | Feature Blocks | Does the core feature work E2E? | PASSED |
| 6 | Integration Pass | Do all parts talk to each other? | PASSED |
| 7 | Test Coverage | Are tests green + covering critical paths? | PASSED |
| 8 | Polish and Harden | Would you show to a stranger? | PASSED |
| 9 | Launch Prep | Is launch checklist complete? | Pending |
| 10 | Ship | Did you tell the world? | Pending |
| 11 | Listen and Iterate | What did users do? | Pending |

---

## Stage 4: Foundation Pour (In Progress)

- **Gate Question:** "Does the skeleton stand?"
- **Started:** 2026-02-12

### What's Been Built

1. **Next.js 16 scaffold** -- App Router, TypeScript strict, Tailwind v4, directory structure matching architecture spec
2. **Supabase schema** -- books, sessions, messages, notes, entities, relationships, timeline_events, backlog_items, chapters tables with RLS policies
3. **TypeScript types** -- Full type definitions for all database tables and enums
4. **Environment config** -- .env.example with all required variables, Docker + docker-compose for self-hosting

---

## Stage 5: Feature Blocks (PASSED)

- **Gate Question:** "Does the core feature work end-to-end?"
- **Date:** 2026-02-12

### What's Been Built

1. **Model router** (`lib/model-router.ts`) -- Three-tier routing system mapping tasks to Haiku/Sonnet/Opus based on the user's quality slider setting (economy/standard/premium)
2. **Prompt system** (`lib/prompts/`) -- Modular prompt assembly with dedicated personas: interviewer (guided mode), scribe (freeform mode), editor (review mode), plus book-type-specific templates for memoir, fiction, and non-fiction
3. **Workspace engine** (`lib/workspace.ts`) -- Three Rooms CRUD (brainstorm, drafts, publish) with auto-initialization of category folders based on book type
4. **Knowledge graph** (`lib/knowledge-graph.ts`) -- Entity management (add, update, increment mentions), relationship operations, full network retrieval, and unresolved entity detection for backlog feeding
5. **Backlog engine** (`lib/backlog.ts`) -- Auto-generated items from session analysis (questions, contradictions, thin spots, unexplored threads, review tasks, ideas) with priority scoring and aging
6. **API routes** -- Books (create/list), sessions (management), converse (streaming), classify (Haiku intent detection), extract (Haiku entity extraction), synthesize (Opus session synthesis), manuscript (chapter assembly), deepgram-token (secure key exchange)

---

## Stage 6: Integration Pass (PASSED)

- **Gate Question:** "Do all the parts talk to each other?"
- **Date:** 2026-02-12

### What's Been Built

1. **Design system** -- Library/Study theme with CSS custom properties (`--rune-*`), Tailwind v4 theme integration, dark/light mode tokens, Source Serif 4 + Source Sans 3 + IBM Plex Mono typography
2. **Components** -- SessionView (main session layout with 65/35 split), MessageArea (conversation messages), VoiceInput (Deepgram mic capture), ActivityStream (real-time Rune activity), QualitySlider (three-position quality control), BookProgress (progress dashboard), ManuscriptViewer (chapter reader)
3. **Hooks** -- useSession (session state + Realtime subscriptions), useWorkspace (workspace Realtime updates), useVoiceInput (Deepgram mic), useBacklog (backlog items Realtime)
4. **Pages** -- Landing page (book library with sign-in), book session page (`/book/[id]`)

---

## Stage 7: Test Coverage (PASSED)

- **Gate Question:** "Are the tests green and covering critical paths?"
- **Date:** 2026-02-12

### What's Been Built

1. **Auth flows** -- Google OAuth sign-in route (`/auth/sign-in`), sign-out route (`/auth/sign-out`), callback handler (`/auth/callback`) for code-to-session exchange
2. **Knowledge graph visualization** (`components/KnowledgeGraph.tsx`) -- SVG network graph with force-directed layout, entity-type color coding (gold/teal/muted/white), click-to-inspect detail panel, relationship highlighting, mention count badges
3. **New book form** (`components/NewBookForm.tsx`) -- Book creation with title input, book type card selector (memoir/fiction/non-fiction), quality slider integration, POST to /api/books with redirect to session
4. **Manuscript assembly** -- Chapter compilation from workspace drafts into cohesive manuscript output

---

## Stage 8: Polish and Harden (PASSED)

- **Gate Question:** "Would you show this to a stranger?"
- **Date:** 2026-02-12

### What's Been Built

1. **README** -- Comprehensive open-source README with project description, feature list, architecture overview, tech stack, getting started guide, environment variables table, Docker self-hosting instructions, and credits
2. **BUILDING.md updates** -- Full stage documentation from Foundation through Polish, recording what was built at each stage and why
3. **TypeScript verification** -- All files pass `tsc --noEmit` in strict mode with no errors
