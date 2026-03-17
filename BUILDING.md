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

## Stage 4: Foundation Pour (PASSED)

- **Gate Question:** "Does the skeleton stand?"
- **Date:** 2026-02-12

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

---

## Stage 9: Launch Prep (IN PROGRESS)

- **Gate Question:** "Is the launch checklist complete?"
- **Started:** 2026-03-17

### Deployment (Phase 1)

1. **Dedicated Supabase project** (`rune-prod`, ref: `blzynsxgamtvbuimuegj`) -- New project in East US, 4 initial migrations applied, 8 core tables with RLS. Separated from the shared id8Labs instance to avoid schema collisions.
2. **Vercel deployment** -- Live at `rune-two.vercel.app`. Env vars updated to new Supabase project. Production builds passing.
3. **Auth flow** -- Magic link sign-in (no passwords, no OAuth). Supabase OTP + verification.

### World-Building Knowledge Base (Phase 2)

The foundational architectural change. Evolved the flat entity graph (person/place/theme/event with mention counts) into a hierarchical, scoped, versioned knowledge base modeled after id8composer.

1. **Database schema** (`migrations/20260317220000_knowledge_base.sql`) -- `knowledge_files` table with 13 file types, 4 scopes (global/regional/local/session), 6 folder types (foundation/strategy/drafts/sandbox/production/assets). `knowledge_file_versions` for content snapshots with semantic versioning. `pipeline_stage` column on books (world-building/story-writing/publishing). Helper functions: `get_kb_files_for_scope()` (scope inheritance), `create_kb_version()` (atomic versioning), `restore_kb_version()`. Full RLS + Realtime.

2. **TypeScript types** (`types/knowledge.ts`, `types/folder-system.ts`) -- `KnowledgeFile`, `KBFileVersion`, `KnowledgeScope`, `FolderType`, `PipelineStage`. Predefined file constants for Foundation (World Bible, Characters, Settings, Lore, Relationships, Timeline), Strategy (Story Arc, Chapter Outlines, Character Journeys, Thematic Through-Lines), and Assets (Research, Interview Transcripts, Inspiration). `inferFolderAndScope()` auto-routes content to the right place.

3. **KnowledgeBaseService** (`lib/database/knowledge-base.ts`) -- Full CRUD with scope inheritance (local query returns global+regional+local files), search, version history, toggle active. Built on service role client.

4. **Zustand store** (`stores/knowledge-base-store.ts`) -- Client-side state with Supabase Realtime subscriptions. Filter by scope, type, folder. Optimistic toggle with rollback.

5. **Version tracking** (`lib/kb-versioning.ts`) -- Determines version bump type (major/minor/patch) by comparing content changes. Semantic version bumping. Change summary generation.

6. **Data migration** (`migrations/20260317220100_migrate_entities_to_kb.sql`) -- Migrates existing `knowledge_entities` to `knowledge_files` (person->characters, place->world-building, theme->thematic-through-lines, event->timeline). Aggregates `entity_relationships` into a Relationships Map entry. Aggregates `timeline_events` into a Timeline entry. Old tables preserved for rollback.

### Guided Oral Interviews (Phase 3)

The product differentiator -- Rune interviews users through world-building via voice.

1. **Question trees** (`lib/interviews/question-trees.ts`) -- Three structured interview sequences: Fiction (9 nodes: world overview, rules, main character, supporting cast, locations, relationships, timeline, themes, conflict), Memoir (8 nodes: era, people, places, turning points, emotions, relationships, artifacts, lesson), Nonfiction (7 nodes: thesis, audience, key concepts, evidence, counter-arguments, frameworks, structure). Each node has follow-up questions, extraction hints, KB layer targeting, and priority ordering.

2. **Interview engine** (`lib/interviews/engine.ts`) -- Walks the question tree, infers answered questions from existing KB state, detects gaps (entities mentioned but not profiled), tracks completeness percentage, checks Stage B readiness (are characters + world + locations defined?), generates system prompt additions for interview mode.

3. **Voice-to-KB filing pipeline** (`lib/interviews/filing.ts`) -- Classification prompt builder (Haiku determines which KB layer speech belongs to), extraction prompt builder (Sonnet structures raw speech into organized markdown), update-vs-create detection (fuzzy title matching, singleton type handling).

### AI KB Tools (Phase 5)

Gives Rune direct CRUD access to the KB via Claude function calling.

1. **Tool schema** (`lib/ai/kb-tools-schema.ts`) -- 5 Claude tools: `create_kb_entry`, `update_kb_entry`, `search_kb`, `get_kb_entry`, `list_kb_files`. Full JSON Schema input definitions compatible with Claude API `tools` parameter.

2. **Tool executor** (`lib/ai/kb-tools.ts`) -- Routes `tool_use` calls to the correct handler. Each handler validates input, calls KnowledgeBaseService, returns structured results. Supports append and replace modes for updates.

3. **Context inference** (`lib/ai/kb-context-inference.ts`) -- Relevance scoring (active boost, foundation priority, recency, content richness, keyword overlap). Scope inheritance (local sees global+regional+local). Token-budget aware selection (30K token limit). System prompt builder that groups KB files by layer.

4. **KBOperationCard** (`components/KBOperationCard.tsx`) -- UI card for ActivityStream showing Rune's KB operations. Approve/dismiss buttons with auto-approve countdown (10s). Operation type color coding (gold=create, teal=update). Progress bar.

### Three-Stage Pipeline (Phase 4)

The system that ties everything together.

1. **Stage configs** (`lib/pipeline/stages.ts`) -- Three stages (world-building/story-writing/publishing) with KB layers, conversation modes, backlog priorities, room labels ("The Workshop" / "The Study" / "The Press"). Navigation helpers: `getNextStage()`, `getPreviousStage()`, `getAllStages()`.

2. **Stage gates** (`lib/pipeline/gates.ts`) -- Soft completeness thresholds. Gate A->B: characters + world description required, lore + relationships + timeline suggested. Gate B->C: story arc + chapter outlines + drafts required. Percentage scoring. Human-readable gate messages for Rune dialogue.

3. **WorldBuildingDashboard** (`components/WorldBuildingDashboard.tsx`) -- Circular progress ring with gate score, 6 foundation layer cards (populated/empty states with entry counts and word counts), gate readiness indicator with "Start Writing" action, suggestions section.

### Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Dedicated Supabase project | `rune-prod` separate from shared id8Labs | Schema isolation for KB migration. 120+ tables from other projects were causing conflicts. |
| id8composer KB model | Hierarchical scope + folder + versioning | Battle-tested for episodic TV. Foundation/Strategy/Working/Assets maps directly to World Building/Story Planning/Drafting/Research. |
| Voice-to-KB pipeline | Haiku classifies, Sonnet extracts, auto-file | User speaks naturally, Rune structures. No forms, no manual KB management. |
| Soft stage gates | Suggest readiness, don't block | "Your world is 60% built -- want to keep building?" Not hard enforcement. |
| Zustand over Context | KB store needs complex state + Realtime sync | Context API re-renders too aggressively for real-time KB updates. |
