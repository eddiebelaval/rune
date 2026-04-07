---
last-updated: 2026-03-26
status: CURRENT
active-milestone: 1
---

# ROADMAP.md -- Rune

> Execution roadmap derived from the triad: `VISION.md`, `SPEC.md`, `BUILDING.md`.
> Operational companion: `MILESTONE_TASKLISTS.md`
> Canonical execution board: `TICKETS.md`
> Current milestone deep-dive: `MILESTONE_1_CHECKLIST.md`

---

## Execution Layer

The triad (`VISION.md`, `SPEC.md`, `BUILDING.md`) defines what the product is.
The execution layer defines what to do about it, at four zoom levels:

| Doc | Role | Audience |
|---|---|---|
| `ROADMAP.md` | Strategy, sequencing, gates | Humans and agents |
| `MILESTONE_TASKLISTS.md` | Tactical task lists per milestone | Humans and agents |
| `TICKETS.md` | Agent-executable work units with dependencies | Agents (primary), humans |
| `MILESTONE_N_CHECKLIST.md` | Deep-dive for the current milestone with file-level targets | Agents |

**Naming convention:** The current milestone always has a dedicated checklist named `MILESTONE_N_CHECKLIST.md` (e.g., `MILESTONE_1_CHECKLIST.md`). When a milestone closes, its checklist is archived and replaced with the next milestone's checklist. Only one active checklist exists at a time.

**Reconciliation:** Each milestone's final ticket (e.g., M1-09, M2-06) updates all triad and execution docs to reflect shipped state. Frontmatter timestamps are updated. The `active-milestone` field increments.

**Branch protocol:** All work ships via feature branches and PRs. Never commit directly to `main`.

---

## Current Read

Rune is in **Stage 9: Launch Prep** at **30% vision distance**. 5 of 12 pillars are realized, 5 are partial, and 2 are unrealized. Best understood as a **working core with unfinished edges**, not a shippable product yet.

What is true right now:
- The voice-first creation loop works. Deepgram mic capture, conversation API, and Sam's consciousness (18 mind files, CaF golden sample derivative) are wired.
- The backlog engine, three rooms, and three-tier intelligence routing are built and functional.
- The knowledge base exists with hierarchical structure and guided interviews are partially built.
- The design system is established: Claude-Inspired (warm cream, coral accents, Source Serif 4).
- First users are identified: Kobe and Emily (bicultural children's book), Alexis (sci-fi novel).

What is not true yet:
- No users have tried the product. Kobe, Emily, and Alexis are identified but not activated.
- KB version history UI is not built (browse, restore, compare).
- Interview progress UI is not built.
- KBOperationCard streaming wiring is incomplete.
- Three Rooms needs to evolve from book-type selection to pipeline-stage model.
- Provenance tracking (which KB version per draft) is not built.
- The app is not deployed anywhere.

## Planning Principles

- **Users over architecture.** Get Kobe, Emily, and Alexis into real sessions before refactoring internals.
- **Pipeline over features.** Prove the full World Building to Story Writing to Publishing flow before adding new capabilities.
- **Honest partials.** A pillar at 70% is partial, not done. Ship the remaining 30% before claiming completion.
- **Single-author first.** Collaborative Authorship and multi-format output are deferred until one author can complete a book end-to-end.
- **Voice-native always.** Every new feature must work through conversation, not just through UI clicks.

## Universal Definition of Done

Before calling any milestone done, confirm all three:
- **Built:** the feature exists in code.
- **Verified:** the workflow passes tests and manual validation.
- **Used:** a real author has gone through the workflow without workarounds or fallback to manual processes.

If one of those is missing, the work is still in progress. Each milestone checklist has its own exit criteria that operationalize these three conditions.

## Success Definition

Rune succeeds in the near term if an author can:
- start a voice conversation with Sam,
- build a world through guided interview,
- generate and refine story content through the backlog engine,
- move work through the three rooms (World Building, Story Writing, Publishing),
- and produce a draft that is closer to a finished book than what they started with.

---

## Now

### Milestone 1 -- Launch Ready
**Window:** immediate
**Goal:** complete the partial pillars enough to ship, deploy to Vercel, and get first users into real sessions.

#### Deliverables
- KB version history UI (browse, restore, compare)
- Interview progress UI
- KBOperationCard streaming wiring completion
- Vercel deployment with working environment
- First sessions with Kobe and Emily and with Alexis

#### Workstreams
- **Streaming and UI completion**
  Wire KBOperationCard streaming, build KB version history UI, build interview progress UI.
- **Deployment**
  Deploy to Vercel, configure environment variables, verify Deepgram and Supabase connectivity in production.
- **First user activation**
  Onboard Kobe and Emily for their children's book. Onboard Alexis for her sci-fi novel. Capture structured feedback.

#### Exit Criteria
- KB version history UI allows browsing, restoring, and comparing versions.
- Interview progress is visible to the author during guided sessions.
- Streaming activity renders in real time without broken wiring.
- The app is live on Vercel with a working domain.
- Kobe and Emily have completed at least one guided world-building session.
- Alexis has completed at least one guided world-building session.

### Milestone 2 -- First Book Sprint
**Window:** immediately after Milestone 1
**Goal:** Kobe and Emily complete a children's book through the full pipeline. Alexis starts her sci-fi world. Prove the three-stage pipeline works end-to-end.

#### Deliverables
- Full pipeline completion for one book (World Building through Story Writing through Publishing)
- Three Rooms evolution from book-type to pipeline-stage model
- Pipeline feedback from two distinct use cases (children's book, sci-fi novel)

#### Workstreams
- **Pipeline proving**
  Guide Kobe and Emily through the full three-room flow. Identify where the pipeline breaks or stalls.
- **Three Rooms evolution**
  Refactor rooms from book-type selection to pipeline-stage awareness. Rooms should reflect where the author is in their process.
- **Feedback capture**
  Structured feedback from both user pairs after real usage.

#### Exit Criteria
- One complete book draft has moved through all three rooms.
- Three Rooms reflects pipeline stage, not book type.
- Both user groups have provided actionable feedback.

---

## Next

### Milestone 3 -- Pipeline Completion
**Window:** after first book sprint
**Goal:** ship KB Version Tracking fully, evolve Three Rooms to stage-aware model, build Stage C (Publishing) export pipeline.

#### Deliverables
- KB Version Tracking fully shipped with provenance (which KB version per draft)
- Three Rooms stage-aware model finalized
- Publishing room export pipeline (KDP format at minimum)

#### Exit Criteria
- An author can trace which knowledge base state informed each draft.
- The publishing room produces at least one export format (KDP-ready).
- Three Rooms navigation reflects the author's actual pipeline position.

### Milestone 4 -- Expansion
**Window:** after single-user pipeline is proven
**Goal:** add capabilities that require a proven single-author pipeline as foundation.

#### Potential Deliverables
- Collaborative Authorship (multiple authors on one project)
- Format-Agnostic Output (ePub, PDF, KDP, web serial)
- Audio-Native Output (audiobook generation)
- Illustration Intelligence (image generation integrated with world state)

#### Gate
Do not start this milestone until at least one author has completed a full book through the pipeline and the three-room flow is validated.

---

## Not Now

These are intentionally deferred so the roadmap stays on the critical path:
- Collaborative Authorship before single-author pipeline is proven
- Format-Agnostic Output before KDP export works
- Audio-Native Output
- Illustration Intelligence
- Multi-project dashboards or portfolio views
- Public marketplace or template sharing
- Mobile app (voice works through mobile web browser for now)

---

## Priority Stack

The canonical priority order and ticket dependencies live in `TICKETS.md`. At a glance:

1. KBOperationCard streaming wiring (M1)
2. KB version history UI (M1)
3. Interview progress UI (M1)
4. Vercel deployment (M1)
5. First user activation: Kobe and Emily (M1)
6. First user activation: Alexis (M1)
7. Three Rooms evolution to pipeline-stage model (M2)
8. Full pipeline proving with real users (M2)
9. KB provenance tracking (M3)
10. Publishing room export pipeline (M3)
11. Collaborative Authorship and expansion features (M4)
