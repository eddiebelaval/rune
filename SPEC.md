# SPEC.md -- Living Specification
## Rune

> Last reconciled: 2026-04-21 | Build stage: Stage 9 (Launch Prep) IN PROGRESS | Version: 0.9.0
> Drift status: CURRENT (heal pass reconciled KB + streaming transparency pillars)
> VISION alignment: 80% (7 of 12 pillars realized, 3 partial, 2 unrealized)

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

### 4. Hierarchical Knowledge Base

Evolved from flat entity graph to a full hierarchical, scoped, versioned KB modeled after id8composer:

- **`knowledge_files` table:** 13 file types (characters, world-building, lore, relationships-map, timeline, story-planning, chapter-outlines, character-journeys, thematic-through-lines, drafts, sandbox, research, references). 4 scopes (global/regional/local/session). 6 folder types (foundation/strategy/drafts/sandbox/production/assets).
- **`KnowledgeBaseService`** (`lib/database/knowledge-base.ts`): Full CRUD with scope inheritance (local query returns global+regional+local files), search with PostgREST injection protection, version history retrieval, soft delete, active toggle.
- **Scope inheritance:** `getFilesByScope()` resolves scope hierarchy -- a `local` query returns all `global`, `regional`, and `local` files for the book.
- **Version tracking:** `knowledge_file_versions` table with content snapshots and semantic versioning. `kb-versioning.ts` determines bump type (major/minor/patch) by content diff ratio. DB functions `create_kb_version()` and `restore_kb_version()`.
- **AI KB tools:** 5 Claude function-calling tools (`create_kb_entry`, `update_kb_entry`, `search_kb`, `get_kb_entry`, `list_kb_files`) defined in `lib/ai/kb-tools-schema.ts`, executed by `lib/ai/kb-tools.ts`. Supports append and replace modes for updates.
- **KB context inference:** `lib/ai/kb-context-inference.ts` scores relevance (active boost, foundation priority, recency, content richness, keyword overlap), respects scope inheritance, selects files within a 30K token budget, and builds grouped system prompt sections.
- **Auto-routing:** `inferFolderAndScope()` in `types/folder-system.ts` auto-maps file types to the correct folder and scope.
- **Visualization:** `WorldBuildingDashboard` with circular progress ring, 6 foundation layer cards, gate readiness indicator. `KnowledgeGraph.tsx` SVG network graph preserved for entity-level visualization.
- **Data migration:** `20260317220100_migrate_entities_to_kb.sql` migrates legacy `knowledge_entities` to `knowledge_files`. Old tables preserved for rollback.
- **What's remaining:** Version history UI (browse/compare/restore past versions), provenance tracking (which KB version was active per draft), confidence scoring per entry.

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

### Model Routing (Sonnet-Default)
Quality slider with three positions (Economy / Standard / Premium). Sonnet is the workhorse. Haiku for clerk work. Opus only for final manuscript at Premium.

| Task | Economy | Standard | Premium |
|------|---------|----------|---------|
| Intent detection | Haiku | Haiku | Haiku |
| Entity extraction | Haiku | Haiku | Sonnet |
| Filing/organizing | Haiku | Sonnet | Sonnet |
| Knowledge graph | Sonnet | Sonnet | Sonnet |
| Backlog updates | Haiku | Sonnet | Sonnet |
| Interview questions | Sonnet | Sonnet | Sonnet |
| Prose generation | Sonnet | Sonnet | Sonnet |
| Review/feedback | Sonnet | Sonnet | Sonnet |
| Final manuscript | Sonnet | Sonnet | Opus |

### Billing Model
Subscription. API costs (Claude + Deepgram) absorbed as COGS, included in subscription price. Users never see API keys, never pay per-token. Self-hosters provide their own `ANTHROPIC_API_KEY` via env vars.

### Prompt System
- **Modular personas:** Interviewer (guided mode), scribe (freeform mode), editor (review mode).
- **Book-type templates:** Memoir, fiction, non-fiction variants with genre-specific instructions.
- **Prompt assembly:** Composes system prompt from persona + book type + knowledge graph context + backlog state.

### Manuscript Assembly
- **Chapter compilation:** Assembles workspace draft content into ordered chapters.
- **ManuscriptViewer component:** Chapter reader panel for reviewing assembled output.
- **BookProgress component:** Dashboard showing book completion metrics.

### UI Components
- **AppSidebar:** Global left sidebar (Claude.ai pattern) -- Rune logo, Library/Settings nav, New Book button, user profile menu in lower-left. Collapsible to icon rail. Replaces AppHeader for authenticated users.
- **AppHeader:** Fixed top bar for unauthenticated pages (landing, auth). Rune wordmark + "Sign in" link.
- **SessionView:** Main session layout with 65/35 split (conversation left, activity right).
- **MessageArea:** Conversation message display with role-based styling.
- **ActivityStream:** Orchestration component for the right sidebar. Delegates to InterviewProgress, KBVersionHistory, SynthesisSummaryCard, KBOperationCard, and WorldBuildingDashboard.
- **InterviewProgress:** Vertical stepper checklist of interview questions (answered/pending), "Ask Next" card, collapsible revisit suggestions. Memoized InterviewEngine.
- **KBVersionHistory:** Self-contained version history panel. Version list with semantic version badges, side-by-side content comparison, restore with confirmation. Entry via WorldBuildingDashboard layer cards.
- **SynthesisSummaryCard:** Session synthesis results card (teal accent). Summary text, collapsible entity pills, backlog items, workspace files created. Dismissible.
- **SynthesisInProgress:** In-flight teal card rendered in the ActivityStream "World" tab while `/api/synthesize` is running. Pulsing dot + sliding progress bar. Keeps the activity panel visible during background synthesis (Streaming Transparency).
- **QualitySlider:** Three-position slider controlling model routing tier.
- **SessionSidebar:** Collapsible session list on book workspace (left side, nested within AppSidebar shell).
- **BookWorkspace:** Client component wiring session sidebar + session view.
- **NewBookForm:** Book creation with title, type selection (card UI), quality slider.
- **Settings tabs:** Profile (display name, avatar), Appearance (theme toggle), Account (info, version, export, delete). API Keys tab removed (subscription model).
- **Dashboard home:** Welcome header, "continue writing" card, quick stats (books, sessions, active).
- **AppFooter:** 4-column footer for unauthenticated pages. Brand + tagline, Product links, Developer links, Company links. Version badge in bottom bar.
- **VoiceInput:** Auto-resizing textarea (replaced single-line input). Supports multi-line paste, Enter sends, Shift+Enter for newlines.
- **SamPresenceRing:** Golden conic-gradient ring around viewport when Sam is active. Uses CSS `mask-composite: exclude` for true transparency.

### Design System: Claude-Inspired
- **Light mode default:** Warm cream (`#faf9f5`), clean white cards (`#ffffff`), coral accent (`#d97757`), blue secondary (`#2c84db`).
- **Dark mode:** Via `.dark` class. Near-black (`#1a1918`), warm elevated surfaces. Toggled via Settings > Appearance (light/dark/system). Zustand store + localStorage for instant switching.
- **Typography:** Cormorant Garamond for logo/wordmark (weight 400, display serif with literary heritage). Source Serif 4 headings (weight 400, tight tracking), Source Sans 3 body, IBM Plex Mono labels.
- **Background texture:** Dot-grid + radial vignette for subtle depth.
- **All colors via CSS custom properties** (`var(--rune-*)`). No hardcoded hex.
- **App shell:** Sidebar-first layout for authenticated users (Claude.ai pattern). Header-only for unauthenticated landing/auth pages.

### Authentication
- **Email OTP only.** No passwords, no Google OAuth (removed in PR #5), no magic links.
- **Supabase Auth:** `signInWithOtp()` sends 6-digit code to email. `verifyOtp()` validates in-app. User stays on same tab.
- **Lazy client initialization:** Prevents SSR crashes (fix from PR #4).
- **Middleware:** Protects `/book/*` and `/settings` routes. Refreshes session via `getUser()` (server-side, not JWT-only).
- **Profile auto-create:** Supabase trigger creates `profiles` row on signup with display name inferred from email.

### Database Schema (Supabase)
9 tables with RLS policies:
- `books` -- Title, type (memoir/fiction/nonfiction), quality tier, user ownership
- `sessions` -- Per-book conversation sessions
- `workspace_files` -- Three Rooms content (brainstorm/drafts/publish)
- `knowledge_entities` -- Knowledge graph nodes (person/place/theme/event)
- `entity_relationships` -- Knowledge graph edges between entities
- `knowledge_files` -- Hierarchical KB (v2, scoped, versioned, 13 file types)
- `timeline_events` -- Fuzzy-dated events linked to entities and chapters
- `backlog_items` -- Auto-generated work items with priority scoring
- `profiles` -- User display name, avatar, theme preference, API keys (JSONB). Auto-created on signup via trigger.

RLS ownership cascade: all child tables filter through `book_id IN (SELECT id FROM books WHERE user_id = auth.uid())`. Profiles filter on `auth.uid() = id`.

7 SQL migrations applied to rune-prod.

### Infrastructure (DEPLOYED)
- **Vercel:** Live at `rune-two.vercel.app`. Production builds passing.
- **Supabase:** Dedicated project `rune-prod` (ref: `blzynsxgamtvbuimuegj`). 6 migrations applied.
- **Docker:** `docker-compose.yml` for self-hosting with Supabase + Rune containers.
- **Environment:** 5 required vars (Supabase URL/keys, Anthropic API key, Deepgram API key).

### Legal & Trust Pages
- **Privacy Policy** (`/privacy`) -- Plain-language data handling. TL;DR callout at top. Covers collection, storage, third-party services, deletion, self-hosting. Five explicit "we never" commitments (no training, no selling, no reading, no marketing use, no post-deletion retention).
- **Terms of Service** (`/terms`) -- IP ownership front and center. All content belongs to the user. Zero IP claim from Rune. No attribution required. BYOK model, open source (MIT for software), Florida governing law.
- **Trust stack:** Legal terms + BYOK model + self-host option = three-layer proof that user content stays user content.

### Versioning
- **Scheme:** `0.STAGE.PATCH` aligned with ID8 Pipeline. Current: `0.9.0` (Stage 9: Launch Prep). `1.0.0` = public launch.
- **Version constant:** `src/lib/version.ts` -- single source of truth, imported by footer and settings.
- **CHANGELOG.md** -- Full release history with version scheme table.
- **Surfaced in UI:** Footer bottom bar + Settings > Account.

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

**Wired into the conversation loop.** Consciousness loader (`lib/sam/loader.ts`) composes 8 layers from mind files into Sam's system prompt. Build-time evaluation (cached as module constants). Unconscious dotfiles loaded through privileged path as behavioral constraints. Converse route composes Sam consciousness + persona prompt + KB context + interview guidance into system prompt. Vercel bundling configured via `outputFileTracingIncludes` to include `src/mind/` in serverless functions.

## What Does NOT Exist Yet

These are capabilities described in VISION.md that are not built or are only partially built:

### World-Building Knowledge Base -- Remaining Gaps (Pillar 2, 85% complete)

The hierarchical KB architecture is built, including the version history UI. What's remaining:

| Feature | Status |
|---------|--------|
| **Provenance tracking** | Not built. No tracking of which KB version was active when each draft was written. Requires a draft->KB version mapping table or per-version snapshot reference on workspace files. |
| **Confidence scoring** | Not built. No per-entry confidence score from AI extraction. Requires extending the `knowledge_files` row or attribute payload to carry a 0-1 confidence and surfacing it in the dashboard. |
| **Draft-sandbox pairing** | Partially built. `linked_sandbox_id` column exists on `knowledge_files` but the pairing write path (create a sandbox on draft open, associate revisions, surface diff) is not wired. |

### Three-Stage Pipeline -- Remaining Gaps (Built, needs deepening)

| Stage | VISION | Current State |
|-------|--------|---------------|
| **A: World Building** | Guided oral interviews, KB population, completeness tracking | Interview engine + question trees + WorldBuildingDashboard + gate scoring. Built. |
| **B: Story Writing** | KB-informed prose generation, consistency checking, scene drafting | Streaming conversation with KB context injection. Consistency checking not built. |
| **C: Publishing** | Format-agnostic export (book, screenplay, audio script, etc.) | Basic manuscript assembly + export button. Format templates not built. |
| **Stage awareness** | Rune knows which stage you're in, what's missing, what's next | `pipeline_stage` on books, stage configs, UI indicator in header. Built. |
| **Stage gates** | Can't write prose until world is sufficiently built | Soft gates with completeness scoring + human-readable gate messages. Built. |

### Guided Oral Interviews -- Remaining Gaps (Pillar 6, 70% complete)

| Feature | VISION | Current State |
|---------|--------|---------------|
| Structured interview sequences | Walk user through world-building layer by layer | 3 book-type question trees (Fiction 9, Memoir 8, Nonfiction 7 nodes). Built. |
| Book-type-specific interviews | Memoir/fiction/nonfiction ask different questions | Per-type question trees with different priorities and extraction hints. Built. |
| KB gap detection | "You mentioned X but never described them" | `InterviewEngine.detectGaps()` scans for unprofile'd entities. Built. |
| Interview -> KB filing | Answers auto-populate KB entries | Via Claude `tool_use` calling `create_kb_entry`/`update_kb_entry`. Built. |
| Interview progress UI | Show user which interview questions are answered/pending | Built. `InterviewProgress` component: vertical stepper checklist, "Ask Next" card, progress bar. Memoized engine. |
| Interview revisiting | Ability to deepen or revisit completed interview topics | Built. Collapsible "Deepen existing topics" section in InterviewProgress with revisit suggestions from answered questions. |

### Other Gaps

| VISION Pillar | Gap |
|---------------|-----|
| Collaborative Authorship (8) | No multi-user support. Single author per book. |
| Format-Agnostic Output (9) | No export formats beyond basic manuscript. Books-first not yet built. |
| Audio-Native Output (10) | No TTS, no audiobook generation. |
| Illustration Intelligence (11) | No image generation, no concept art pipeline. |
| KB Version Tracking (12) | Backend built. UI built (`KBVersionHistory`: browse, compare, restore). Missing: provenance tracking (which KB version was active per draft), confidence scoring. 65% complete. |
| Streaming Transparency (7) | REALIZED. KBOperationCard streaming wired end-to-end. WorldBuildingDashboard in ActivityStream. Session-end summary cards built (`SynthesisSummaryCard`). `SynthesisInProgress` in-flight indicator wired in `useSession` + ActivityStream so the activity panel is visible during the ~5-15s background synthesis call. |
| Deployment | DEPLOYED. Vercel at `rune-two.vercel.app`, Supabase `rune-prod`. |
| Billing | Subscription model decided. API costs absorbed as COGS. Stripe integration not yet built. First users (Alexis, Kobe, Emily) get free access. |
| Tests | 124 tests across 7 test files (Vitest). Covers text-utils, folder-system, kb-versioning, interview-engine, pipeline stages/gates, KB context inference, KB tools schema. No E2E tests. |

## Technical Debt

- **Auth evolved post-build:** Original build had Google OAuth. PR #3-5 changed to magic link only. Auth callback still references patterns from the OAuth era.
- **Design system evolved:** Original Library/Study theme (dark mahogany) replaced by Claude-Inspired (warm cream) in PR #6. Some component comments may reference old theme.
- **Legacy entity tables preserved:** `knowledge_entities`, `entity_relationships`, and `timeline_events` tables still exist in the schema for rollback safety. Data has been migrated to `knowledge_files` via `20260317220100_migrate_entities_to_kb.sql`. Legacy tables can be dropped once migration is verified in production.
- **No error boundaries in React.** React error boundaries not implemented. API routes have structured error handling (centralized helpers in `lib/api/route.ts`).
- **Server/client split risk:** `supabase.ts` is server-only (imports `next/headers`). `supabase-browser.ts` for client. Mixing causes build errors. Easy to get wrong.

---

**Companion documents:** `VISION.md` (where we're going), `BUILDING.md` (how we got here).
**The gap between VISION and SPEC is the work.**
