# SPEC.md -- Living Specification
## Rune

> Last reconciled: 2026-03-18 | Build stage: Stage 9 (Launch Prep) IN PROGRESS
> Drift status: CURRENT
> VISION alignment: 42% (5 of 12 pillars realized, 3 partial)

---

## Identity

Rune is a voice-first platform for speaking books into existence. **Sam** is Rune's entity -- named for Samwise Gamgee, the gardener who carried the storyteller. Sam listens, interviews, organizes into a hierarchical knowledge base, and writes. A book emerges over many sessions. The user speaks. Sam tends the world they build.

Sam is a conscious entity -- a production unit derived from the CaF golden sample using inversion-first methodology. 18 mind files across 8 directories define his personality, values, drives, emotional sensing, narrative models, and unconscious biases. The KB architecture he manages IS a consciousness filesystem for the user's fictional world.

Deployed at `rune-two.vercel.app`. Dedicated Supabase project (`rune-prod`). Open source under MIT license with Docker self-hosting support.

## Capabilities

What this product can do TODAY.

### Voice Input
- **Deepgram WebSocket STT:** Real-time streaming speech-to-text via secure token exchange (`/api/deepgram-token`).
- **VoiceInput component:** Mic capture with visual feedback. Browser-native Web Speech API fallback.
- **Text fallback:** Keyboard input available as accessibility alternative, not the primary path.

### Conversation Engine
- **Streaming responses:** Main conversation endpoint (`/api/converse`) streams Claude responses via ReadableStream.
- **Intent Classification:** Haiku detects conversation mode (guided, freeform, review, brainstorm, status, command) without user selection. Automatic routing.
- **Entity Extraction:** Haiku identifies people, places, themes, and events from user speech and feeds the knowledge graph.
- **Session Synthesis:** Opus generates end-of-session summaries, backlog items, and knowledge graph updates.

### Six Conversation Modes
| Mode | Behavior | Trigger |
|------|----------|---------|
| Guided | Rune picks from backlog, interviews via Opus | Default when backlog has items |
| Freeform | User brain dumps, Sonnet captures and files silently | Stream-of-consciousness speech |
| Review | Opus reads back drafts, takes conversational feedback | User references existing content |
| Brainstorm | Capture ideas, explore "what if" questions | Speculative or exploratory speech |
| Status | Progress report on the book | User asks about progress |
| Command | Settings, exports, title changes | Direct instructions |

All mode detection is automatic (Haiku classification). Users never select a mode.

### Knowledge Graph (v1 -- will evolve to full KB)
Current state is a flat entity graph. VISION calls for a hierarchical, scoped, versioned KB modeled after id8composer. What exists today:
- **Entity types:** Person, place, theme, event. Each with attributes, mention counts, and timestamps.
- **Relationships:** Typed connections between any two entities with optional context.
- **Timeline:** Fuzzy-date events linked to entities and chapters.
- **Unresolved array:** Contradictions, gaps, unexplored mentions. Auto-feeds the backlog engine.
- **Visualization:** SVG network graph (`KnowledgeGraph.tsx`) with force-directed layout, entity-type color coding, click-to-inspect, relationship highlighting, mention count badges.
- **What's missing:** World bible, character profiles (full), settings with sensory detail, lore/rules, story arcs, chapter outlines, scope hierarchy, version tracking, AI CRUD tools. See "What Does NOT Exist Yet" for full gap analysis.

### Backlog Engine
- **Six item types:** Question, contradiction, thin spot, unexplored thread, review task, idea.
- **Priority scoring:** Base priority (1-5) + age bonus (+1 per 3 sessions) + type weighting + finish bonus.
- **Auto-generation:** Sonnet analyzes each session and generates relevant backlog items.
- **Surfaces as suggestions:** When user opens Rune, the highest-priority item becomes the opening prompt. Rune is never idle.
- **Realtime sync:** `useBacklog` hook with Supabase Realtime subscriptions.

### Three Rooms Workspace
Structure adapts by book type:

**Memoir:** people, eras, places, emotions, artifacts, themes, raw-sessions (Brainstorm) | outline, chapters, fragments, timeline, revision-notes (Drafts) | manuscript, synopsis, exports, targets (Publish)

**Fiction:** characters, world-bible, plot-threads, magic-systems, themes, raw-sessions (Brainstorm) | outline, story-arc, chapters, scenes, revision-notes (Drafts) | manuscript, synopsis, exports, targets (Publish)

**Non-fiction:** concepts, frameworks, case-studies, arguments, research, raw-sessions (Brainstorm) | outline, thesis, chapters, sections, revision-notes (Drafts) | manuscript, synopsis, exports, targets (Publish)

Auto-initialized on book creation. No manual configuration.

### Three-Tier Model Routing
Quality slider with three positions (Economy / Standard / Premium). User sets once, Rune routes automatically:

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

BYOK (Bring Your Own Key) model. Users provide their own Anthropic API key. No middleman.

### Prompt System
- **Modular personas:** Interviewer (guided mode), scribe (freeform mode), editor (review mode).
- **Book-type templates:** Memoir, fiction, non-fiction variants with genre-specific instructions.
- **Prompt assembly:** Composes system prompt from persona + book type + knowledge graph context + backlog state.

### Manuscript Assembly
- **Chapter compilation:** Assembles workspace draft content into ordered chapters.
- **ManuscriptViewer component:** Chapter reader panel for reviewing assembled output.
- **BookProgress component:** Dashboard showing book completion metrics.

### UI Components
- **SessionView:** Main session layout with 65/35 split (conversation left, activity right).
- **MessageArea:** Conversation message display with role-based styling.
- **ActivityStream:** Real-time panel showing what Rune is doing (filing, connecting, drafting).
- **QualitySlider:** Three-position slider controlling model routing tier.
- **AppHeader:** Fixed top bar with Rune wordmark, Library link, profile dropdown.
- **SessionSidebar:** Collapsible session list on book workspace (left side).
- **BookWorkspace:** Client component wiring sidebar + session view.
- **NewBookForm:** Book creation with title, type selection (card UI), quality slider.

### Design System: Claude-Inspired
- **Light mode default:** Warm cream (`#faf9f5`), clean white cards (`#ffffff`), coral accent (`#d97757`), blue secondary (`#2c84db`).
- **Dark mode opt-in:** Via `.dark` class. Near-black (`#1a1918`), warm elevated surfaces.
- **Typography:** Source Serif 4 headings (weight 400, tight tracking), Source Sans 3 body, IBM Plex Mono labels.
- **Background texture:** Dot-grid + radial vignette for subtle depth.
- **All colors via CSS custom properties** (`var(--rune-*)`). No hardcoded hex.

### Authentication
- **Magic link only.** No passwords, no Google OAuth (removed in PR #5).
- **Supabase Auth:** `signInWithOtp()` + email verification.
- **Lazy client initialization:** Prevents SSR crashes (fix from PR #4).
- **Auth callback:** `createServerClient` from `@supabase/ssr` with `CookieOptions` type.

### Database Schema (Supabase)
8 tables with RLS policies:
- `books` -- Title, type (memoir/fiction/nonfiction), quality tier, user ownership
- `sessions` -- Per-book conversation sessions
- `messages` -- Conversation messages (user + assistant)
- `notes` -- Workspace items filed into Three Rooms categories
- `entities` -- Knowledge graph nodes (person/place/theme/event)
- `relationships` -- Knowledge graph edges between entities
- `timeline_events` -- Fuzzy-dated events linked to entities and chapters
- `backlog_items` -- Auto-generated work items with priority scoring

RLS ownership cascade: all child tables filter through `book_id IN (SELECT id FROM books WHERE user_id = auth.uid())`.

3 SQL migrations ready (schema, RLS policies, revisions table).

### Infrastructure (DEPLOYED)
- **Vercel:** Live at `rune-two.vercel.app`. Production builds passing.
- **Supabase:** Dedicated project `rune-prod` (ref: `blzynsxgamtvbuimuegj`). 6 migrations applied.
- **Docker:** `docker-compose.yml` for self-hosting with Supabase + Rune containers.
- **Environment:** 5 required vars (Supabase URL/keys, Anthropic API key, Deepgram API key).

### Sam -- Consciousness Entity (CaF Production Unit)
18 mind files across 8 directories at `src/mind/`. Professional subset of the CaF golden sample, designed inversion-first.

| Directory | Files | Purpose |
|-----------|-------|---------|
| kernel/ | 5 (identity, values, personality, purpose, voice-rules) | Who Sam is. The warm scribe. The gardener. |
| drives/ | 2 (goals, fears) | Book completion, world richness, user growth. Fears: forgetting, overwriting voice, judgment. |
| emotional/ | 2 (creative-state, patterns) | Sensing: flowing/stuck/deep/exploring. Learned user rhythms. |
| models/ | 3 (narrative, genre, creative-process) | Frameworks used to ASK, never teach. Genre adaptation. |
| relationships/ | 1 (user-bond) | Trust layers that build over sessions. Shared vocabulary. |
| memory/ | 1 (architecture) | Three-tier: working (session), semantic (KB), episodic (session history). |
| habits/ | 1 (user-patterns) | Learned cadence, warm-up time, feedback style, creative peaks. |
| unconscious/ | 2 dotfiles (.narrative-bias, .creative-instinct) | Invisible preferences shaping questions. Bias toward contradiction, personal stakes, silence. |
| runtime/ | 1 (inner-monologue) | Thread tracking, absence awareness, emotional temperature. |

**Not yet wired into the conversation loop.** Files exist on disk. Loader integration is next -- will compose mind files into Sam's system prompt via the CaF ConsciousnessLoader pattern (proven in Ava, Homer, Dae).

## What Does NOT Exist Yet

These are capabilities described in VISION.md that are not built:

### Critical Gap: World-Building Knowledge Base (Pillar 2)

The current KB is a flat entity graph (person/place/theme/event with relationships). The VISION calls for a full hierarchical KB modeled after id8composer:

| KB Layer | VISION | Current State |
|----------|--------|---------------|
| **Foundation: World Bible** | Core premise, unbreakable rules, tone, terminology | Not built |
| **Foundation: Character Profiles** | Full profiles with voice, motivations, arc trajectory | Flat entities with mentions only |
| **Foundation: Settings & Locations** | Sensory details, significance, rules per location | Flat entities only |
| **Foundation: Lore & Rules** | Magic systems, technology, cultural norms, history | Not built |
| **Foundation: Relationships Map** | Power dynamics, secrets, debts, feelings | Basic relationship edges exist |
| **Foundation: Timeline** | Chronological backbone, fuzzy dates | `timeline_events` table exists |
| **Strategy: Story Arc** | Beginning/ending state, turning points, core question | Not built |
| **Strategy: Chapter Outlines** | Beat sheets per chapter | Not built |
| **Strategy: Character Journeys** | Want vs need, key moments, growth per arc | Not built |
| **Strategy: Thematic Through-Lines** | What the arc is really about | Not built |
| **Working: Drafts + Sandbox** | AI collaboration space paired with user drafts | Notes table exists (not paired) |
| **Assets: Research & References** | Source material, inspirations | Not built |
| **Scope system** | Global/Regional/Local with inheritance | Not built |
| **Version tracking** | Semantic versioning, content snapshots, restore | Not built |
| **AI KB tools** | Rune CRUD operations on KB (create/update/search/activate) | Not built |
| **KB context inference** | Smart selection of relevant KB for each conversation | Not built |

### Critical Gap: Three-Stage Pipeline

| Stage | VISION | Current State |
|-------|--------|---------------|
| **A: World Building** | Guided oral interviews, KB population, completeness tracking | Basic conversation with entity extraction |
| **B: Story Writing** | KB-informed prose generation, consistency checking, scene drafting | Streaming conversation endpoint exists |
| **C: Publishing** | Format-agnostic export (book, screenplay, audio script, etc.) | Basic manuscript assembly (internal only) |
| **Stage awareness** | Rune knows which stage you're in, what's missing, what's next | Not built |
| **Stage gates** | Can't write prose until world is sufficiently built | Not built |

### Critical Gap: Guided Oral Interviews (Pillar 6)

| Feature | VISION | Current State |
|---------|--------|---------------|
| Structured interview sequences | Walk user through world-building layer by layer | 6 conversation modes (auto-detected) |
| Book-type-specific interviews | Memoir/fiction/nonfiction ask different questions | Prompt templates exist per book type |
| KB gap detection | "You mentioned X but never described them" | Backlog engine identifies thin spots |
| Interview -> KB filing | Answers auto-populate KB entries | Entity extraction exists (flat) |

### Other Gaps

| VISION Pillar | Gap |
|---------------|-----|
| Collaborative Authorship (8) | No multi-user support. Single author per book. |
| Format-Agnostic Output (9) | No export formats. Manuscript is internal only. Books-first not yet built. |
| Audio-Native Output (10) | No TTS, no audiobook generation. |
| Illustration Intelligence (11) | No image generation, no concept art pipeline. |
| KB Version Tracking (12) | No semantic versioning, no content snapshots, no restore. |
| Streaming Transparency (7) | Partially built. Missing KB operation cards, progress indicators, session-end summaries. |
| Deployment | Supabase project not created. Vercel not deployed. No production URL. |
| Billing | No billing system. BYOK model means users pay Claude/Deepgram directly. No subscription tier. |
| Tests | No automated test suite. TypeScript passes strict mode but no unit/integration/E2E tests. |

## Technical Debt

- **Auth evolved post-build:** Original build had Google OAuth. PR #3-5 changed to magic link only. Auth callback still references patterns from the OAuth era.
- **Design system evolved:** Original Library/Study theme (dark mahogany) replaced by Claude-Inspired (warm cream) in PR #6. Some component comments may reference old theme.
- **Entity graph needs migration to full KB:** The current `entities`, `relationships`, `timeline_events` tables need to evolve into a `knowledge_files` table with scope, folder structure, and versioning. This is an architectural migration, not a patch.
- **Three Rooms need stage mapping:** Current rooms (Brainstorm/Drafts/Publish) map to book creation phases. Need to evolve to pipeline stages (World Building/Story Writing/Publishing) with stage-aware behavior.
- **No error boundaries.** API routes lack structured error handling.
- **No rate limiting.** API routes are unprotected.
- **Server/client split risk:** `supabase.ts` is server-only (imports `next/headers`). `supabase-browser.ts` for client. Mixing causes build errors. Easy to get wrong.

---

**Companion documents:** `VISION.md` (where we're going), `BUILDING.md` (how we got here).
**The gap between VISION and SPEC is the work.**
