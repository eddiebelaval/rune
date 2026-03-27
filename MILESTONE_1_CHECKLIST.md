---
last-updated: 2026-03-26
status: CURRENT
active-milestone: 1
---

# MILESTONE_1_CHECKLIST.md -- Launch Ready

> Deep-dive checklist for the current milestone.
> Strategy: `ROADMAP.md` | Tickets: `TICKETS.md` | Tasklists: `MILESTONE_TASKLISTS.md`
> Goal: complete the partial pillars, deploy to Vercel, and get first users into real sessions.

---

## Milestone Goal

Ship the minimum surface that lets real authors use Rune through voice. Close the streaming, versioning, and interview progress gaps so the core experience is not visibly broken, then deploy and activate Kobe and Emily and Alexis.

Success means:
- streaming activity renders in real time during voice sessions,
- KB version history is browsable, restorable, and comparable,
- interview progress is visible to the author,
- the app is live on Vercel,
- and at least two real users have completed guided world-building sessions.

---

## Current Reality

Already true:
- Voice-first creation works: Deepgram mic capture (`src/components/VoiceInput.tsx`) sends audio, conversation endpoint (`src/app/api/converse/route.ts`) processes it, Sam responds.
- Backlog engine (`src/lib/backlog.ts`) manages work items across the pipeline.
- Three rooms (`src/lib/workspace.ts`) provide World Building, Story Writing, and Publishing CRUD.
- Three-tier intelligence (`src/lib/model-router.ts`) routes to the right model based on task complexity.
- Knowledge base exists with hierarchical structure.
- Sam consciousness is implemented across 18 mind files (CaF golden sample derivative).
- Design system is consistent: warm cream, coral accents, Source Serif 4.
- Guided interviews exist in `src/lib/prompts/` (interviewer, scribe, editor personas).

Not done yet:
- KBOperationCard streaming wiring is incomplete. Activity events are emitted but not all render in `src/components/ActivityStream.tsx`.
- KB version history has no UI. No way to browse past versions, restore, or compare.
- Interview progress has no UI. The author cannot see how far along they are in a guided session.
- The app is not deployed. No Vercel project, no production domain, no production environment variables.
- No real users have tried the product.

---

## Workstream 1 -- Streaming Completion

### Outcome
KBOperationCard renders all KB operations (create, update, link) in real time during voice sessions, closing the streaming transparency pillar from 85% to 100%.

### Tasks
- [ ] Audit the event types emitted by [src/app/api/converse/route.ts](src/app/api/converse/route.ts) during KB operations.
- [ ] Map each event type to its rendering in [src/components/ActivityStream.tsx](src/components/ActivityStream.tsx).
- [ ] Identify which events are emitted but not rendered (the missing 15%).
- [ ] Wire the missing event types into ActivityStream with appropriate visual treatment.
- [ ] Ensure streaming state is visually distinct from completed state (loading indicator, animation, or opacity).
- [ ] Test with a real voice session: speak, trigger KB operations, verify all appear in the activity feed.

### Dependencies
- None. This can start immediately.

### Verification
- [ ] All KB operation types (create, update, link, delete) appear in ActivityStream as they happen.
- [ ] No silent failures during a full voice session.
- [ ] Streaming vs. completed states are visually distinguishable.
- [ ] `npm run build` and `npx tsc --noEmit` pass after changes.

---

## Workstream 2 -- KB Version History UI

### Outcome
Authors can browse past KB versions, restore a previous version, and compare two versions to understand what changed.

### Tasks
- [ ] Verify KB version data model in Supabase. Confirm versions are stored with timestamps and content snapshots.
- [ ] If version storage does not exist, add a Supabase migration under `supabase/migrations/`.
- [ ] Build a version history component (likely `src/components/KBVersionHistory.tsx`) that:
  - lists past versions with timestamps and summaries
  - allows restoring a previous version (with confirmation)
  - allows comparing two versions side by side
- [ ] Integrate the version history component into the session view or a dedicated panel accessible from [src/components/SessionView.tsx](src/components/SessionView.tsx).
- [ ] Wire version queries to [src/lib/workspace.ts](src/lib/workspace.ts) or a new KB version service.
- [ ] Handle edge cases: first version (nothing to compare), restore while session is active, version created during streaming.

### Dependencies
- Supabase schema must support version storage. May require a migration.

### Verification
- [ ] Version list loads with correct timestamps and content summaries.
- [ ] Restoring a version replaces current KB state and creates a new version entry (non-destructive restore).
- [ ] Diff view shows meaningful differences between two versions.
- [ ] Restore during an active session does not corrupt the session state.
- [ ] `npm run build` and `npx tsc --noEmit` pass after changes.

---

## Workstream 3 -- Interview Progress UI

### Outcome
During a guided interview, the author can see how far they have progressed and what remains.

### Tasks
- [ ] Determine progress model: is it stage-based (5 stages of world-building), percentage-based, or question-count-based? Check [src/lib/prompts/](src/lib/prompts/) for interview structure.
- [ ] Build a progress indicator component that renders in or alongside [src/components/SessionView.tsx](src/components/SessionView.tsx).
- [ ] Wire the progress state from the conversation endpoint. The interviewer persona in `src/lib/prompts/` likely tracks covered topics; surface that to the UI.
- [ ] Ensure progress persists across session interruptions (page reload, network disconnect). Store progress in Supabase or derive it from conversation history.
- [ ] Handle edge cases: interview restarted, author skips questions, interview completed.

### Dependencies
- Need to understand interview structure in `src/lib/prompts/` to determine progress granularity.

### Verification
- [ ] Progress indicator is visible during guided interview sessions.
- [ ] Progress updates as questions are answered or topics are covered.
- [ ] Progress survives a page reload (not just in-memory state).
- [ ] Completed interviews show 100% or equivalent completion state.
- [ ] `npm run build` and `npx tsc --noEmit` pass after changes.

---

## Workstream 4 -- Deployment

### Outcome
Rune is live on Vercel with all services (Deepgram, Supabase, Claude API) connected and functional.

### Tasks
- [ ] Create Vercel project linked to the Rune repository.
- [ ] Set all required environment variables in Vercel dashboard (reference `.env.example` for the full list).
- [ ] Verify `npm run build` succeeds in Vercel's build environment (check `next.config.ts` for any local-only assumptions).
- [ ] Test Deepgram WebSocket connectivity from the deployed URL (requires HTTPS, which Vercel provides).
- [ ] Test Supabase auth flow (email OTP) from the deployed URL.
- [ ] Test a full voice conversation with Sam on the deployed URL.
- [ ] Configure production domain (can run in parallel with M1-05 or use the Vercel default URL initially).

### Dependencies
- Deepgram API key must be provisioned and added to Vercel env.
- Supabase project must be accessible from Vercel's network.
- Claude API key must be provisioned and added to Vercel env.

### Verification
- [ ] Vercel deployment completes without build errors.
- [ ] The app loads on the deployed URL.
- [ ] Voice input captures audio and sends it to Deepgram.
- [ ] Sam responds conversationally with consciousness-aware behavior.
- [ ] KB operations triggered during conversation are saved to Supabase.
- [ ] Auth flow (email OTP) works in production.

---

## Workstream 5 -- First User Activation

### Outcome
Kobe and Emily have completed at least one guided world-building session for their bicultural children's book. Alexis has completed at least one guided world-building session for her sci-fi novel.

### Tasks
- [ ] Prepare onboarding for Kobe and Emily: ensure they can create an account and start a book project.
- [ ] Run Kobe and Emily through their first guided world-building session. Capture:
  - what worked (voice flow, Sam's responses, KB capture)
  - what broke (errors, confusing UI, lost content)
  - what was missing (features they expected but did not find)
- [ ] Prepare onboarding for Alexis: same as above, different genre context.
- [ ] Run Alexis through her first guided world-building session. Capture the same feedback dimensions.
- [ ] Compile feedback into a structured document for Milestone 2 planning.

### Dependencies
- Workstreams 1-4 must be substantially complete. Users should not hit known broken flows.

### Verification
- [ ] Kobe and Emily have a book project with world-building content created through voice.
- [ ] Alexis has a book project with world-building content created through voice.
- [ ] Feedback is captured and specific enough to prioritize Milestone 2 work.
- [ ] No data loss occurred during either session.

---

## Recommended Sequence

Use this order unless a dependency forces a change:

1. Streaming completion (unblocked, foundational for user experience)
2. KB version history UI (unblocked, closes a major pillar gap)
3. Interview progress UI (unblocked, closes a major pillar gap)
4. Deployment (unblocked, can run in parallel with 1-3)
5. First user activation (depends on 1-4 being substantially complete)

Reasoning:
- Streaming, KB versioning, and interview progress are independent and can be worked in parallel.
- Deployment can also run in parallel since it does not depend on the UI features being complete (though it is better if they are).
- User activation must come last because users should not encounter known broken flows.

---

## Milestone Exit Checklist

Milestone 1 is done only when all of these are true:
- [ ] KBOperationCard streams all KB operation types in real time.
- [ ] KB version history UI supports browse, restore, and compare.
- [ ] Interview progress UI shows completion state during guided sessions.
- [ ] The app is deployed to Vercel and accessible via production URL.
- [ ] Voice input, Sam conversation, and KB operations work in production.
- [ ] Kobe and Emily have completed at least one guided world-building session.
- [ ] Alexis has completed at least one guided world-building session.
- [ ] User feedback is captured and documented.
- [ ] `npm run build` and `npx tsc --noEmit` pass.
- [ ] Triad docs (`VISION.md`, `SPEC.md`, `BUILDING.md`) still tell the truth after the work ships.
- [ ] Execution docs (`ROADMAP.md`, `TICKETS.md`, `MILESTONE_TASKLISTS.md`) reflect shipped state.
- [ ] All completed tickets in `TICKETS.md` are marked `done` with verification evidence.

If any box above is still open, Milestone 1 is still in progress.
