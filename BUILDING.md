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
| 2 | Scope Fence | What are we NOT building? | Pending |
| 3 | Architecture Sketch | Could another dev build from this? | Pending |
| 4 | Foundation Pour | Does the skeleton stand? | In Progress |
| 5 | Feature Blocks | Does the core feature work E2E? | Pending |
| 6 | Integration Pass | Do all parts talk to each other? | Pending |
| 7 | Test Coverage | Are tests green + covering critical paths? | Pending |
| 8 | Polish and Harden | Would you show to a stranger? | Pending |
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
