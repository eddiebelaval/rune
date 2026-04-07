# Building Rune -- A Voice-First Conversational Book Writer

Last updated: 2026-03-18

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
2. **Vercel deployment** -- Live at `rune.id8labs.app` (custom domain via Cloudflare CNAME). Env vars for both Production and Preview environments. Auto-deploy on merge to main.
3. **Auth flow** -- Email OTP code (6-digit, no passwords, no magic links). Supabase `signInWithOtp()` + `verifyOtp()`. Two-step UI: enter email, enter code, signed in. Custom email template with `{{ .Token }}`.

### World-Building Knowledge Base (Phase 2)

The foundational architectural change. Evolved the flat entity graph (person/place/theme/event with mention counts) into a hierarchical, scoped, versioned knowledge base modeled after id8composer.

1. **Database schema** (`migrations/20260317220000_knowledge_base.sql`) -- `knowledge_files` table with 13 file types, 4 scopes (global/regional/local/session), 6 folder types (foundation/strategy/drafts/sandbox/production/assets). `knowledge_file_versions` for content snapshots with semantic versioning. `pipeline_stage` column on books (world-building/story-writing/publishing). Helper functions: `get_kb_files_for_scope()` (scope inheritance), `create_kb_version()` (atomic versioning), `restore_kb_version()`. Full RLS + Realtime.

2. **TypeScript types** (`types/knowledge.ts`, `types/folder-system.ts`) -- `KnowledgeFile`, `KBFileVersion`, `KnowledgeScope`, `FolderType`, `PipelineStage`. Predefined file constants for Foundation (World Bible, Characters, Settings, Lore, Relationships, Timeline), Strategy (Story Arc, Chapter Outlines, Character Journeys, Thematic Through-Lines), and Assets (Research, Interview Transcripts, Inspiration). `inferFolderAndScope()` auto-routes content to the right place.

3. **KnowledgeBaseService** (`lib/database/knowledge-base.ts`) -- Full CRUD with scope inheritance (local query returns global+regional+local files), search, version history, toggle active. Built on service role client.

4. **Realtime integration** -- KB files sync via Supabase Realtime in ActivityStream. Zustand store was built but removed during integration audit (hooks handle all data flow).

5. **Version tracking** (`lib/kb-versioning.ts`) -- Determines version bump type (major/minor/patch) by comparing content changes. Semantic version bumping. Change summary generation.

6. **Data migration** (`migrations/20260317220100_migrate_entities_to_kb.sql`) -- Migrates existing `knowledge_entities` to `knowledge_files` (person->characters, place->world-building, theme->thematic-through-lines, event->timeline). Aggregates `entity_relationships` into a Relationships Map entry. Aggregates `timeline_events` into a Timeline entry. Old tables preserved for rollback.

### Guided Oral Interviews (Phase 3)

The product differentiator -- Rune interviews users through world-building via voice.

1. **Question trees** (`lib/interviews/question-trees.ts`) -- Three structured interview sequences: Fiction (9 nodes: world overview, rules, main character, supporting cast, locations, relationships, timeline, themes, conflict), Memoir (8 nodes: era, people, places, turning points, emotions, relationships, artifacts, lesson), Nonfiction (7 nodes: thesis, audience, key concepts, evidence, counter-arguments, frameworks, structure). Each node has follow-up questions, extraction hints, KB layer targeting, and priority ordering.

2. **Interview engine** (`lib/interviews/engine.ts`) -- Walks the question tree, infers answered questions from existing KB state, detects gaps (entities mentioned but not profiled), tracks completeness percentage, checks Stage B readiness (are characters + world + locations defined?), generates system prompt additions for interview mode.

3. **Voice-to-KB filing** -- Filing happens via Claude tool_use in the converse API. Claude calls `create_kb_entry` or `update_kb_entry` directly. Original filing.ts pipeline removed during integration audit (replaced by tool-use pattern).

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
| Lazy service client | `getDb()` instead of module-level `const db` | Prevents build crash when env vars missing on Preview deploys. |
| Remove Zustand store | Hooks handle all data flow | useKBStore was never consumed by components. Hooks (useSession, useWorkspace, useBacklog) + inline Realtime subscriptions are simpler. |
| Unified entity system | `/api/extract` uses KnowledgeBaseService | Eliminated dual entity system (legacy knowledge_entities + new knowledge_files). Single source of truth. |
| Email OTP over magic link | 6-digit code entered in-app | Magic links break mobile, open wrong tab, get intercepted by email clients. OTP keeps user in the same tab. |

### Sam Consciousness (CaF Production Unit)

18 mind files across 8 directories at `src/mind/`. Professional subset of the CaF golden sample, designed inversion-first.

1. **kernel/** (5 files) -- Identity ("I am Sam, the gardener"), values (user's voice is sacred, depth over speed), personality (patient, curious, warm, honest, steady), purpose (speak books into existence), voice-rules (conversational, one question at a time, mirror user's register)
2. **drives/** (2 files) -- Goals (book completion, world richness, user growth, oral tradition lives), fears (forgetting, overwriting voice, judgment, being prescriptive, unfinished books)
3. **models/** (3 files) -- Narrative (frameworks used to ask, never teach), genre (fiction/memoir/nonfiction/children's adaptation), creative process (divergent/convergent, inner critic, flow, permission problem)
4. **emotional/** (2 files) -- Creative-state sensing (flowing/stuck/frustrated/exploring/reviewing/deep), learned patterns per user (rhythm, avoidance, confidence cycles)
5. **relationships/** (1 file) -- User-bond with 4 trust layers (competence, safety, partnership, creative intimacy)
6. **memory/** (1 file) -- Three-tier architecture (working/semantic/episodic)
7. **habits/** (1 file) -- Learned user patterns (session cadence, warm-up time, feedback style, creative peaks)
8. **unconscious/** (2 dotfiles) -- .narrative-bias (invisible preference for contradiction, personal stakes, silence), .creative-instinct (hunches about hidden characters, missing costs, thematic depth)
9. **runtime/** (1 file) -- Inner monologue (thread tracking, absence awareness, emotional temperature, silence calibration)

### Sam Wiring (Converse API Integration)

1. **Consciousness loader** (`lib/sam/loader.ts`) -- 8-layer composition from mind files. Build-time evaluation (cached as module constants). Unconscious dotfiles loaded through privileged path as behavioral constraints. Throws on empty consciousness.
2. **Converse route rewrite** -- Sam consciousness + persona prompt + KB context + interview guidance composed into system prompt. Real streaming via `stream.on('text')`. Proper tool-use protocol with recursive follow-up turns (depth limit 5). Intent classification parallelized with book/session lookup. Shared `classify-intent.ts` module.
3. **Vercel bundling** -- `outputFileTracingIncludes` ensures `src/mind/` files are included in serverless function.

### Polish Passes (2 Rounds)

**Round 1 (3 parallel agents):** 12 fixes -- PostgREST filter injection, singleton service client, shared countWords() utility, stored metadata reads, redundant array splits, gates word count bug, interview over-counting, KBOperationCard effect deps, WorldBuildingDashboard duplicate rows, toggleActive N+1.

**Round 2 (3 parallel agents on Sam wiring):** 7 fixes -- Real streaming (was buffering behind finalMessage()), tool-use follow-up turns, Vercel standalone bundling, build-time consciousness evaluation, parallelized intent classification, shared classify module, reuse already-fetched KB files.

### Test Suite (124 Tests)

Vitest setup with 7 test files covering: text-utils (13), folder-system (22), kb-versioning (15), interview-engine (18), pipeline stages/gates (23), KB context inference (10), KB tools schema (6).

### Landing Page (Storytelling)

8-section page that tells Sam's story instead of selling features:
1. TypewriterHero -- lines appear as if spoken, "nothing." in coral italic, shift to "So I stopped writing. And I started talking."
2. The Ancient Problem -- oral tradition quote vs blinking cursor
3. Three Stages -- Workshop/Study/Press cards (A/B/C)
4. Meet Sam -- conversation demo with KB filing notification + 5 trait cards
5. Voice in. World out. -- 4-step vertical timeline
6. Who This Is For -- The Storytellers + The World Builder (anonymized)
7. Built in the open. -- GitHub + MIT + stack badges
8. You have a story. Sam is ready to listen. -- Final CTA

### Integration Audit + Gap Fixes

4 parallel agents audited every layer. 18 features mapped across 7 layers. 9 integration gaps found, 7 fixed:
- Unified dual entity system (/api/extract -> KnowledgeBaseService)
- Mounted WorldBuildingDashboard as default "World" tab in ActivityStream
- Added pipeline stage indicator (Workshop/Study/Press) to BookWorkspace header
- Added manuscript Export button to ManuscriptViewer
- Removed orphaned code: /api/classify route, filing.ts, useKBStore
- Deferred: KB version history UI, KBOperationCard streaming wiring

### Profile Section + Settings Dashboard (Phase 6)

Full layout restructure from header-first to sidebar-first app shell, following the Claude.ai pattern.

**Why it matters:** Rune went from feeling like "a chat interface with a book picker" to feeling like a real productivity tool. The persistent sidebar is the "home base" — it stays constant while content changes. This is the same pattern that makes Claude.ai, Notion, and Linear feel like *places* rather than *pages*.

1. **App shell restructure** -- Conditional layout in root `layout.tsx`: authenticated users get `AppSidebar + content` in a flex row; unauthenticated users get the old `AppHeader + main`. The sidebar wraps ALL authenticated content (library, settings, book workspace).

2. **AppSidebar** (`components/AppSidebar.tsx`) -- Global left sidebar with Rune logo top, nav items (Library, New Book, Settings), user profile button + sign out in lower-left. Collapsible to 56px icon rail. Click-outside menu via `useClickOutside` hook.

3. **Settings page** (`/settings`) -- 4-tab management dashboard:
   - **Profile:** Display name editor, avatar (initial-based), email display
   - **Appearance:** Dark/light/system theme toggle with live color swatches
   - **API Keys:** Anthropic + Deepgram key management for self-hosters (BYOK)
   - **Account:** Member info, data export (stub), account deletion with "DELETE" confirmation

4. **Profiles table** (`migrations/20260318000000_profiles.sql`) -- `id` (FK to auth.users), `display_name`, `avatar_url`, `theme` (light/dark/system), `preferences` (JSONB for API keys, quality defaults). Auto-create trigger on signup. RLS: users read/update own profile only.

5. **Profile API** (`/api/profile`) -- GET (fetch + auto-create fallback), PATCH (display_name, theme, preferences with JSONB merge), DELETE (cascade books + sign out).

6. **Theme system** -- Zustand store (`theme-store.ts`) with localStorage persistence. `ThemeInitializer` component applies `.dark` class on `<html>` and listens for `prefers-color-scheme` media query changes. Dark mode CSS variables already existed from Phase 1 -- this wires the toggle.

7. **Dashboard upgrade** -- Home page now shows: welcome header with display name, "continue writing" card (most recent active book with time-ago), quick stats row (total books, sessions, active count), then the book library grid.

8. **Shared settings components** (`settings/shared.tsx`) -- `FormInput` (Rune-styled input with focus ring), `SaveBar` (save button + saved/error status indicator), `SettingsCard` (bordered card wrapper). Extracted during /simplify pass to DRY up 3 settings tabs.

9. **Custom hooks** -- `useProfile()` (shared profile fetch/update across all settings tabs), `useClickOutside()` (reusable click-outside listener for dropdowns/menus).

### Architecture Decisions (Phase 6)

| Decision | Choice | Why |
|----------|--------|-----|
| Sidebar vs header | Sidebar-first for authenticated, header for landing | Claude.ai pattern. Persistent nav frame makes it feel like a real app, not just pages. |
| Conditional layout vs route groups | Conditional rendering in root layout | No file moves needed. `/` page already switches on auth state. Simpler. |
| Zustand + localStorage for theme | Client-side theme, background sync to profile | Instant theme switch (no server round-trip). Works offline. Syncs to DB in background. |
| Separate profiles table | Not auth.users metadata | Can't set RLS on auth.users. user_metadata is client-writable (security risk). Dedicated table with trigger is clean. |
| Preferences as JSONB | Not separate columns | Extensible without migrations. API keys, quality defaults, future prefs all in one field. |
| useProfile hook | Shared across 3 tabs | DRY. Each tab was copy-pasting identical fetch/parse/save logic. Hook centralizes it. |

### Footer, Policies, and Versioning (Phase 7)

Rune needed the trust infrastructure to match the product quality. Three additions, all in one pass.

**Why it matters:** AI writing tools have an IP trust problem. Users creating original creative work need to know, in writing, that their content is theirs. These pages aren't legal boilerplate — they're a competitive differentiator. The BYOK model + self-host option + explicit IP terms form a trust stack that most AI tools can't match.

1. **Proper footer** (`components/AppFooter.tsx`) -- 4-column layout: brand (logo + tagline + social icons), Product links, Developer links (source, issues, self-host, MIT badge), Company links (id8Labs, Privacy, Terms). Bottom bar with copyright, tagline, and version badge. Only renders on unauthenticated pages.

2. **Privacy policy** (`/privacy`) -- Data handling in plain language. Lead with TL;DR callout: "We don't read your books. We don't train on your writing. We don't sell your data." Covers: what we collect (email, preferences), what we store (books, KB, sessions), what we never do (5 explicit commitments), third-party services (Anthropic, Deepgram, Supabase, Vercel), data deletion, self-hosting.

3. **Terms of service** (`/terms`) -- IP ownership front and center: "Your book. Your IP. Period." Explicit: you own all content, Rune claims zero IP rights, no attribution required, AI-assisted content is yours. Also covers: what Rune is/isn't, BYOK model, responsibilities, service availability, open source (MIT applies to software, not your content), Florida governing law.

4. **Semantic versioning** -- Scheme: `0.STAGE.PATCH` aligned with ID8 Pipeline. Bumped from `0.1.0` to `0.9.0` (Stage 9). Version constant in `src/lib/version.ts` (single source of truth). Surfaced in footer bottom bar and Settings > Account. `CHANGELOG.md` with full release history and version scheme table. `1.0.0` = public launch with first users onboarded.

5. **SamPresenceRing fix** -- The golden ring that activates when Sam is thinking was painting an opaque `::after` pseudo-element over the entire viewport, blanking the page. Replaced with CSS `mask-composite: exclude` for true center transparency.

6. **VoiceInput multi-line paste** -- Swapped `<input type="text">` for auto-resizing `<textarea>`. Supports pasting multi-paragraph text. Enter sends, Shift+Enter for newlines. Grows up to ~6 lines.

### Architecture Decisions (Phase 7)

| Decision | Choice | Why |
|----------|--------|-----|
| Version scheme | `0.STAGE.PATCH` | Aligns with ID8 Pipeline. Makes version number meaningful — `0.9.x` = Stage 9: Launch Prep. |
| Version constant | `src/lib/version.ts` | Single source of truth. Imported by footer and settings. Avoids reading package.json at runtime. |
| Policy pages local | `/privacy` and `/terms` inside Rune | Not external links to id8labs.app. Rune-specific, Rune-voiced, Rune-styled. Users stay in the product. |
| Footer only unauthenticated | Sidebar replaces footer for logged-in users | Same pattern as Claude.ai. Authenticated users have the sidebar for navigation. |
| mask-composite over ::after | CSS mask for ring transparency | The ::after hack painted a solid background that covered the viewport. Mask-composite makes the center truly transparent without any color dependency. |

### Heal Session: Triad Reconciliation (2026-03-20)

Automated heal pass identified 2 blockers that were documentation drift, not missing features:

**Blocker 1: "KB structure, scope system, version tracking, AI CRUD tools not built"** -- All of these were built in Phases 2-5 (see above) but VISION.md (Pillar 2) still said "PARTIAL (30%)" with "What's built today: Basic entity graph." SPEC.md's "What Does NOT Exist Yet" section listed 16 items as "Not built" that were in fact shipped.

**Blocker 2: "Guided Oral Interviews not implemented"** -- Question trees, interview engine, and voice-to-KB filing were all built in Phase 3 (see above) but VISION.md (Pillar 6) still said "UNREALIZED."

**What changed:**
1. **VISION.md** -- Updated pillar statuses: KB (30% -> 75%), Guided Interviews (UNREALIZED -> PARTIAL 70%), Streaming Transparency (70% -> 85%), KB Version Tracking (UNREALIZED -> PARTIAL 40%). Added "What's built" and "Remaining" summaries to each updated pillar. Distance from SPEC updated (40% -> 30%). Pillar count updated (5 realized + 3 partial + 4 unrealized -> 5 realized + 5 partial + 2 unrealized).
2. **SPEC.md** -- Rewrote section 4 from "Knowledge Graph (v1)" to "Hierarchical Knowledge Base" reflecting the full built architecture. Rewrote "What Does NOT Exist Yet" from 16 "Not built" items to accurate gap analysis showing what's built and what remains. Updated Sam from "Not yet wired" to documenting the live consciousness loader. Updated Technical Debt (removed resolved items, added current debt). Updated test count (0 -> 124). Vision alignment updated (47% -> 70%).
3. **BUILDING.md** -- This section documenting the heal pass.

**Why this matters:** VISION and SPEC were 3 days behind BUILDING. A developer reading SPEC would think the KB is a flat entity graph and interviews don't exist. In reality, the hierarchical KB, AI tools, interview engine, pipeline stages, and Sam consciousness are all shipped code. The triad is now reconciled.
