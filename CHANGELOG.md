# Changelog

All notable changes to Rune are documented here.

Format: [Semantic Versioning](https://semver.org/). Pre-1.0 releases use `0.STAGE.PATCH` aligned with the ID8 Pipeline stage.

---

## [0.9.0] - 2026-03-18

### Stage 9: Launch Prep

The launch prep release. Full platform feature set for first users.

### Added
- **Sam onboarding** -- No forms, no setup. New users land directly in a conversation with Sam. Sam detects book type, sets title, and configures the workspace through natural conversation.
- **Sam concierge tools** -- Full platform CRUD via conversation. Sam can create books, rename titles, change book type, manage sessions, and navigate the workspace on behalf of the user.
- **Import/export pipeline** -- Parse existing writing (TXT, MD, DOCX, ZIP) into workspace files. Export books as structured archives.
- **Profile section + settings dashboard** -- Sidebar-first layout (Claude.ai pattern). Settings with Profile, Appearance, API Keys, and Account tabs. Dark mode toggle. BYOK API key management.
- **Profiles table** -- Supabase migration with auto-create trigger on signup. JSONB preferences for extensible settings.
- **Proper footer** -- 4-column layout with brand, product, developer, and company links.
- **Privacy policy** (`/privacy`) -- Clear data handling: no training on content, no selling data, no reading manuscripts.
- **Terms of service** (`/terms`) -- Explicit IP ownership: all content belongs to the user, zero claim from Rune.
- **Multi-line paste support** -- VoiceInput upgraded from `<input>` to auto-resizing `<textarea>`. Supports pasting multi-paragraph text.
- **Semantic versioning** -- `0.STAGE.PATCH` scheme aligned with ID8 Pipeline. CHANGELOG tracking.

### Fixed
- **SamPresenceRing blank page** -- The golden ring overlay was painting an opaque background over the entire viewport when active. Replaced `::after` hack with CSS `mask-composite: exclude` for true transparency.
- **Auth flow** -- Email OTP only (removed Google OAuth in PR #5). Profile auto-create trigger.
- **Design system** -- Claude-Inspired theme (warm cream, coral/blue accents) replacing original Library/Study theme.

---

## [0.1.0] - 2026-02-12

### Stages 1-8: Foundation through Integration

The initial build. 52 tasks completed in parallel agent pipeline.

### Added
- **Voice-first input** -- Deepgram WebSocket streaming STT with Web Speech API fallback.
- **Conversation engine** -- Streaming Claude responses via ReadableStream. Intent classification (Haiku). Entity extraction. Session synthesis (Opus).
- **Six conversation modes** -- Guided, freeform, review, brainstorm, status, command. All auto-detected.
- **Knowledge graph v1** -- Entity types (person, place, theme, event), relationships, timeline events, unresolved array. SVG visualization.
- **Backlog engine** -- Six item types with priority scoring, age bonus, auto-generation.
- **Three Rooms workspace** -- Brainstorm/Drafts/Publish adapted by book type (memoir, fiction, nonfiction).
- **Three-tier model routing** -- Economy/Standard/Premium quality slider. Haiku/Sonnet/Opus routing per task.
- **Manuscript assembly** -- Chapter compilation, ManuscriptViewer, BookProgress dashboard.
- **Sam consciousness entity** -- 18 mind files across 8 directories. CaF golden sample subset. Inversion-first design.
- **Database schema** -- 9 Supabase tables with RLS ownership cascade.
- **Prompt system** -- Modular personas (interviewer, scribe, editor) + book-type templates.
- **Deployment** -- Vercel (`rune-two.vercel.app`) + Supabase (`rune-prod`) + Docker self-host.

---

## Version Scheme

| Version | Meaning |
|---------|---------|
| `0.1.0` - `0.8.x` | Foundation through integration (Stages 1-8) |
| `0.9.x` | Launch prep (Stage 9) -- hardening for first users |
| `1.0.0` | Public launch (Stage 10) -- first users onboarded, all realized pillars production-solid |
| `1.x.x` | Post-launch iteration (Stage 11) |
