---
last-updated: 2026-03-26
status: CURRENT
active-milestone: 1
---

# MILESTONE_TASKLISTS.md -- Rune

> Execution task lists for all roadmap milestones.
> Strategy and sequencing: `ROADMAP.md`
> Canonical execution board: `TICKETS.md`
> Current milestone deep-dive: `MILESTONE_1_CHECKLIST.md`

---

## How To Use This Doc

- `ROADMAP.md` explains sequence, intent, and gates.
- This doc turns each milestone into a practical task list with verification criteria.
- `TICKETS.md` is the canonical execution board. Agents work from tickets, not this file.
- The current milestone always has a dedicated checklist (e.g., `MILESTONE_1_CHECKLIST.md`) with file-level detail.

If a task is vague, it is not ready. Break it down further before starting.

---

## Milestone 1 -- Launch Ready

Deep-dive: `MILESTONE_1_CHECKLIST.md`

### Todo
- [ ] Complete KBOperationCard streaming wiring so activity renders in real time
- [ ] Build KB version history UI (browse, restore, compare versions)
- [ ] Build interview progress UI showing completion state during guided sessions
- [ ] Deploy to Vercel with working Deepgram, Supabase, and model API connectivity
- [ ] Configure production domain and environment variables
- [ ] Onboard Kobe and Emily for their first guided world-building session
- [ ] Onboard Alexis for her first guided world-building session
- [ ] Run Milestone 1 verification sweep
- [ ] Reconcile triad and execution docs after the work lands

### Verification
- [ ] KBOperationCard streams activity updates without broken wiring or silent failures
- [ ] KB version history UI allows browsing past versions, restoring a previous version, and comparing two versions
- [ ] Interview progress is visible during guided sessions (percentage or stage indicator)
- [ ] App is live on Vercel and accessible via production domain
- [ ] Voice input (Deepgram) works in production environment
- [ ] Sam responds conversationally with consciousness-aware behavior in production
- [ ] At least one real user has completed a guided world-building session

### Done When
- [ ] Streaming, KB versioning, and interview progress UIs are functional
- [ ] The app is deployed and reachable
- [ ] Kobe and Emily have had their first session
- [ ] Alexis has had her first session
- [ ] Verification sweep is complete
- [ ] Docs reflect shipped state

---

## Milestone 2 -- First Book Sprint

### Todo
- [ ] Guide Kobe and Emily through the full three-room pipeline (World Building to Story Writing to Publishing)
- [ ] Guide Alexis through World Building and into Story Writing
- [ ] Identify where the pipeline breaks or stalls for each use case
- [ ] Refactor Three Rooms from book-type selection to pipeline-stage awareness
- [ ] Update room navigation to reflect author's current pipeline position
- [ ] Collect structured feedback from Kobe and Emily after full pipeline run
- [ ] Collect structured feedback from Alexis after world-building and story-writing phases
- [ ] Reconcile triad and execution docs after the work lands

### Verification
- [ ] One complete book draft has moved through all three rooms
- [ ] Three Rooms UI reflects pipeline stage (World Building, Story Writing, Publishing) not book type
- [ ] Room transitions are driven by pipeline readiness, not manual selection
- [ ] Both user groups have provided specific, actionable feedback

### Done When
- [ ] At least one book has gone end-to-end through the pipeline
- [ ] Three Rooms evolution is shipped and tested with real users
- [ ] Feedback is concrete enough to drive Milestone 3 priorities

---

## Milestone 3 -- Pipeline Completion

### Todo
- [ ] Ship KB Version Tracking fully (version browsing, restore, compare are already in M1; add provenance)
- [ ] Build provenance tracking: link each draft to the KB version that informed it
- [ ] Finalize Three Rooms stage-aware model based on M2 feedback
- [ ] Build Publishing room export pipeline (KDP format at minimum)
- [ ] Validate export output against KDP submission requirements
- [ ] Test full pipeline with provenance from world-building through published export
- [ ] Reconcile triad and execution docs after the work lands

### Verification
- [ ] An author can see which KB version informed each draft section
- [ ] The publishing room produces a KDP-ready export file
- [ ] Three Rooms navigation accurately reflects pipeline position based on M2 learnings
- [ ] Full pipeline (voice session to exported book) works without manual intervention

### Done When
- [ ] Provenance tracking is live and visible to authors
- [ ] At least one export format (KDP) is functional
- [ ] The single-author pipeline is proven end-to-end with real content

---

## Milestone 4 -- Expansion

### Todo
- [ ] Design collaborative authorship model (roles, permissions, conflict resolution)
- [ ] Build collaborative authorship for multi-author projects
- [ ] Add format-agnostic output (ePub, PDF, web serial beyond KDP)
- [ ] Evaluate audio-native output feasibility and build if viable
- [ ] Evaluate illustration intelligence feasibility and build if viable
- [ ] Reconcile triad and execution docs after the work lands

### Verification
- [ ] Multiple authors can work on the same project without data conflicts
- [ ] At least three export formats are functional
- [ ] Expansion features do not degrade the single-author experience

### Done When
- [ ] Collaborative authorship is tested with a real multi-author project
- [ ] Multiple output formats work reliably
- [ ] Rune supports both solo and collaborative workflows

---

## Execution Order

See `TICKETS.md` for the canonical priority order and dependency graph. Milestones are sequential: each milestone's gate must close before the next opens.
