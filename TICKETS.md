---
last-updated: 2026-03-26
status: CURRENT
active-milestone: 1
---

# TICKETS.md -- Rune Execution Board

> Canonical ticket board for agent-driven execution.
> Strategy and sequencing: `ROADMAP.md`
> Milestone grouping: `MILESTONE_TASKLISTS.md`
> Current milestone deep-dive: `MILESTONE_1_CHECKLIST.md`

---

## How Agents Should Use This File

This file is the operational source of truth for execution.

### Rules
- Work from the top down.
- Always prefer the **highest-priority unblocked ticket**.
- Only mark a ticket `done` when it is built, verified, and reflected in docs if needed.
- If work uncovers new necessary tasks, add new tickets under the right milestone instead of burying them in notes.
- If a ticket is too large for one session, split it into smaller tickets before starting.
- Future milestone tickets are stubs. Before starting a new milestone, expand its tickets to include Goal, Primary Targets, and Verification details (matching the depth of the current milestone).
- All work ships via feature branches and PRs. Never commit directly to `main`.

### Status Values
- `todo` -- ready to pick up
- `in_progress` -- currently being worked
- `blocked` -- cannot proceed yet
- `done` -- completed and verified

### Update Protocol
When an agent starts work:
- change one ticket to `in_progress`
- add short progress notes if helpful

When an agent finishes work:
- change the ticket to `done`
- record verification evidence
- update any affected docs

When an agent gets blocked:
- change the ticket to `blocked`
- add the reason in `Notes`
- create follow-up tickets if needed

---

## Current Priority Order

1. Milestone 1 -- Launch Ready
2. Milestone 2 -- First Book Sprint
3. Milestone 3 -- Pipeline Completion
4. Milestone 4 -- Expansion

---

## Milestone 1 -- Launch Ready

### M1-01 Complete KBOperationCard streaming wiring
- Status: `todo`
- Priority: `P0`
- Depends on: none
- Goal: wire the remaining streaming connections so KBOperationCard renders real-time activity updates during voice sessions
- Primary targets:
  - `src/components/ActivityStream.tsx` -- activity feed that should display KB operations as they stream
  - `src/app/api/converse/route.ts` -- conversation endpoint that emits KB operation events
  - `src/components/SessionView.tsx` -- 65/35 chat+activity layout that hosts the activity stream
- Verification:
  - KB operations (create, update, link) appear in ActivityStream as they happen
  - no silent failures or missing events during a voice session
  - streaming state is visually distinct from completed state
- Notes:
  - streaming transparency pillar is at 85%; this closes the remaining 15%

### M1-02 Build KB version history UI
- Status: `todo`
- Priority: `P0`
- Depends on: none
- Goal: allow authors to browse, restore, and compare knowledge base versions
- Primary targets:
  - new component for version history (likely `src/components/KBVersionHistory.tsx` or similar)
  - `src/lib/workspace.ts` -- three rooms CRUD, may need version-aware queries
  - Supabase schema -- verify version storage exists or add migration
- Verification:
  - author can see a list of past KB versions with timestamps
  - author can restore a previous version
  - author can compare two versions side by side (diff view)
  - restoring a version does not corrupt current state
- Notes:
  - KB version tracking pillar is at 40%; this is the UI half of getting it to functional

### M1-03 Build interview progress UI
- Status: `todo`
- Priority: `P0`
- Depends on: none
- Goal: show authors where they are in a guided interview so they know what has been covered and what remains
- Primary targets:
  - `src/lib/prompts/` -- interviewer persona that drives guided sessions
  - `src/components/SessionView.tsx` -- the session view needs to display progress state
  - new component for progress indicator (step tracker, percentage, or stage marker)
- Verification:
  - during a guided interview, the author can see completion progress
  - progress updates as questions are answered
  - progress persists across session interruptions (page reload, disconnect)
- Notes:
  - guided interviews pillar is at 70%; this closes a significant portion of the gap

### M1-04 Deploy to Vercel
- Status: `todo`
- Priority: `P0`
- Depends on: none
- Goal: get Rune live on Vercel with all services connected
- Primary targets:
  - `vercel.json` -- deployment configuration
  - `.env.example` -- reference for required environment variables
  - `next.config.ts` -- build and runtime config
- Verification:
  - `npm run build` succeeds locally before deploy
  - Vercel deployment completes without errors
  - Deepgram voice input works in production (not just localhost)
  - Supabase auth and data queries work in production
  - Model API (Claude) responds correctly in production
  - voice conversation with Sam works end-to-end on the deployed URL
- Notes:
  - Deepgram WebSocket connections require secure context (HTTPS), which Vercel provides
  - check that all environment variables are set in Vercel dashboard

### M1-05 Configure production domain
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-04`
- Goal: move from raw Vercel URL to a proper domain
- Primary targets:
  - Vercel domain settings
  - DNS configuration
  - any hardcoded URL references in the codebase
- Verification:
  - production domain resolves correctly
  - all app links use the correct base URL
  - Deepgram and Supabase callbacks work with the production domain

### M1-06 Activate Kobe and Emily
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-01`, `M1-02`, `M1-03`, `M1-04`
- Goal: get Kobe and Emily into their first real guided world-building session for their bicultural children's book
- Primary targets:
  - onboarding flow
  - `src/app/book/[id]/page.tsx` -- main session view they will use
  - `src/components/VoiceInput.tsx` -- Deepgram mic capture they will speak into
- Verification:
  - Kobe and Emily can access the app
  - they can start a new book project
  - they can complete a guided world-building interview through voice
  - Sam responds with gardener consciousness (guides, does not author)
  - their world-building content is saved and visible in the knowledge base
- Notes:
  - this is the first real user test; capture everything that breaks or confuses

### M1-07 Activate Alexis
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-01`, `M1-02`, `M1-03`, `M1-04`
- Goal: get Alexis into her first real guided world-building session for her sci-fi novel
- Primary targets:
  - same as M1-06 (different user, different genre)
- Verification:
  - Alexis can access the app
  - she can start a new book project
  - she can complete a guided world-building interview through voice
  - Sam adapts to sci-fi world-building (different genre, same gardener approach)
  - her world-building content is saved and visible in the knowledge base
- Notes:
  - sci-fi world-building is a different stress test than children's book; watch for genre-specific gaps in Sam's interviewer persona

### M1-08 Run Milestone 1 verification sweep
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-01`, `M1-02`, `M1-03`, `M1-04`, `M1-06`, `M1-07`
- Goal: verify the full Milestone 1 surface end-to-end
- Verification:
  - `npm run build` passes
  - `npx tsc --noEmit` passes
  - voice input works in production
  - KB version history UI is functional
  - interview progress UI is functional
  - streaming activity renders correctly
  - both user groups have completed at least one session
  - no critical bugs remain from user feedback

### M1-09 Reconcile docs after Milestone 1 ships
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-08`
- Goal: keep triad and execution docs truthful after the milestone lands
- Primary targets:
  - Triad: `VISION.md`, `SPEC.md`, `BUILDING.md`
  - Execution: `ROADMAP.md`, `MILESTONE_TASKLISTS.md`, `TICKETS.md`
  - Current checklist: `MILESTONE_1_CHECKLIST.md` (archive or replace with M2 checklist)
- Verification:
  - docs reflect the shipped state and remaining gaps
  - all frontmatter timestamps updated
  - `active-milestone` incremented to 2 where applicable
  - pillar status percentages updated to reflect actual state

---

## Milestone 2 -- First Book Sprint

### M2-01 Guide Kobe and Emily through full pipeline
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-08`

### M2-02 Guide Alexis through World Building and into Story Writing
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-08`

### M2-03 Refactor Three Rooms to pipeline-stage model
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-08`

### M2-04 Update room navigation to reflect pipeline position
- Status: `todo`
- Priority: `P1`
- Depends on: `M2-03`

### M2-05 Collect and synthesize user feedback
- Status: `todo`
- Priority: `P0`
- Depends on: `M2-01`, `M2-02`

### M2-06 Reconcile docs after Milestone 2 ships
- Status: `todo`
- Priority: `P1`
- Depends on: `M2-03`, `M2-05`

---

## Milestone 3 -- Pipeline Completion

### M3-01 Build provenance tracking (KB version per draft)
- Status: `todo`
- Priority: `P0`
- Depends on: `M2-06`

### M3-02 Finalize Three Rooms stage-aware model from M2 feedback
- Status: `todo`
- Priority: `P1`
- Depends on: `M2-06`

### M3-03 Build Publishing room export pipeline (KDP format)
- Status: `todo`
- Priority: `P0`
- Depends on: `M2-06`

### M3-04 Validate export against KDP submission requirements
- Status: `todo`
- Priority: `P1`
- Depends on: `M3-03`

### M3-05 Test full pipeline with provenance end-to-end
- Status: `todo`
- Priority: `P0`
- Depends on: `M3-01`, `M3-04`

### M3-06 Reconcile docs after Milestone 3 ships
- Status: `todo`
- Priority: `P1`
- Depends on: `M3-05`

---

## Milestone 4 -- Expansion

### M4-01 Design collaborative authorship model
- Status: `todo`
- Priority: `P1`
- Depends on: `M3-06`

### M4-02 Build collaborative authorship
- Status: `todo`
- Priority: `P1`
- Depends on: `M4-01`

### M4-03 Add format-agnostic output (ePub, PDF, web serial)
- Status: `todo`
- Priority: `P2`
- Depends on: `M3-06`

### M4-04 Evaluate and build audio-native output
- Status: `todo`
- Priority: `P2`
- Depends on: `M3-06`

### M4-05 Evaluate and build illustration intelligence
- Status: `todo`
- Priority: `P2`
- Depends on: `M3-06`

### M4-06 Reconcile docs after Milestone 4 ships
- Status: `todo`
- Priority: `P1`
- Depends on: `M4-02`, `M4-03`
