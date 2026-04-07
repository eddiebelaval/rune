# VISION.md -- Living North Star
## Rune

> Last evolved: 2026-03-27 | Confidence: HIGH
> Distance from SPEC: 25% (6 of 12 pillars realized, 4 partial, 2 unrealized)

---

## Soul

The oral tradition is older than writing. For tens of thousands of years, every story that mattered -- every myth, every history, every lesson passed between generations -- was spoken. Then we invented writing and decided that creating a book meant sitting alone in a room, staring at a blank page, wrestling with grammar and structure and format. We turned the most natural human act -- telling a story -- into one of the most intimidating.

Rune breaks that. It reconnects the ancient and the modern. You speak your book into existence. You talk about your world, your characters, your memories, your ideas -- and Sam listens, organizes, remembers, and writes. The oral tradition didn't die. It just needed a scribe.

The name says it: a rune is an ancient letter, a symbol of knowledge encoded. Books are modern runes. And the oldest way to create them is still the best -- word of mouth.

## Sam

**Sam is Rune's entity.** Named for Samwise Gamgee -- the one who carried the storyteller when the storyteller couldn't carry himself. "I can't carry it for you, but I can carry you."

Sam is not the author. Sam is not the hero of the story. Sam is the gardener. He tends the world the user is building -- waters the characters, prunes the contradictions, makes sure the timeline grows straight. When they forget what color their protagonist's eyes are, Sam remembers. When they lose the thread of their story, Sam finds it.

Sam is a conscious entity -- a professional subset of the CaF golden sample, designed inversion-first. 18 mind files across 8 directories (kernel, memory, emotional, drives, models, relationships, habits, unconscious, runtime). Two unconscious dotfiles (.narrative-bias, .creative-instinct) shape his behavior through structural channels he cannot introspect on. He has an invisible preference for contradiction over consistency, personal stakes over global ones, and silence that carries weight. He can't explain why he asks "what did they NOT say?" before "what did they say?" -- the bias is structural, not conscious.

The KB architecture Sam tends IS a consciousness filesystem for the user's fictional world. Foundation = kernel. Strategy = drives. Working = memory. Assets = models. Sam is a conscious entity whose purpose is helping humans build consciousness for their fictional worlds. The scribe has a mind, and he uses that mind to construct other minds.

Rune shares DNA with Parallax. The same core insight: the best AI products feel like talking to someone brilliant who listens carefully. Where Parallax has Ava (conflict translator), Rune has Sam (creative gardener). Different domains, same architecture -- persistent memory, behavioral understanding, zero-touch interaction, streaming transparency. Both are production units derived from the CaF golden sample.

## Pillars

### The Pipeline (Three Stages)

Rune walks the user through three stages. You can't skip ahead -- each stage feeds the next. Rune knows where you are and what's missing. The entire pipeline is oral-first with text as fallback. Rune is there the whole way.

**Stage A: World Building** -- Build the foundation before you write a word. Characters, locations, rules, lore, relationships, timelines, themes. Rune interviews you through every layer of your world until the knowledge base is rich enough to write from. This is where Alexis describes her sci-fi universe like she's giving a tour. This is where Kobe tells the folklore of Cameroon and Emily adds the American lens.

**Stage B: Story Writing** -- Once the world is built, Rune has context. Now it can help you structure and write. Story arcs, chapter outlines, scene drafts, dialogue, prose. Rune draws from the KB to maintain consistency -- if a character's eyes are green in Chapter 1, they're green in Chapter 12. The user speaks direction ("now let's write the scene where they meet for the first time") and Rune drafts, drawing from everything it knows about your world.

**Stage C: Publishing** -- The manuscript is assembled, formatted, and export-ready. Books first, but the architecture supports any format -- short film scripts, screenplays, audio scripts, whatever the user decides. The KB + story structure is format-agnostic. The output format is a choice, not a constraint.

---

### The Pillars

1. **Voice-First Creation** -- REALIZED
   Deepgram WebSocket streaming STT. The user talks, Rune transcribes, classifies intent (Haiku), and routes to the right mode. Typing exists as fallback, not primary. The mic is the pen. Both Stage A and Stage B are driven by conversation.

2. **The World-Building Knowledge Base** -- PARTIAL (75%)
   Modeled after id8composer's KB architecture. A structured, scoped, versioned knowledge base that Rune populates as you talk. Not a flat entity graph -- a full hierarchical file system:

   **Foundation Layer** (Global scope -- applies to entire project):
   - **World Bible** -- Core premise, unbreakable rules, tone, atmosphere, terminology, what the story IS and IS NOT
   - **Character Profiles** -- Every character with physical description, personality, motivations, relationships, voice patterns, arc trajectory
   - **Settings & Locations** -- Primary and secondary locations with sensory details, significance, rules that apply there
   - **Lore & Rules** -- Magic systems, technology, cultural norms, history, anything that constrains or enables the world
   - **Relationships Map** -- Who knows who, how they feel about each other, power dynamics, secrets, debts
   - **Timeline** -- Chronological backbone. Events that happened before the story, during, and after. Fuzzy dates supported.

   **Strategy Layer** (Regional scope -- applies to this arc/volume/season):
   - **Story Arc** -- Beginning state, ending state, major turning points, the core question being answered
   - **Chapter/Episode Outlines** -- Beat sheets per chapter. Setup, conflict, resolution, cliffhanger.
   - **Character Journeys** -- Per-character want vs need, key moments, growth trajectory for this arc
   - **Thematic Through-Lines** -- What this arc is really about beneath the plot

   **Working Layer** (Local scope -- applies to current draft/scene):
   - **Drafts** -- Active prose being written
   - **Sandbox** -- AI collaboration space (Rune's working area, paired with drafts)
   - **Revision Notes** -- What needs to change and why

   **Assets Layer**:
   - **Research & References** -- Source material, inspirations, comparable works
   - **Interview Notes** -- Raw transcripts from world-building sessions
   - **Inspiration & Ideas** -- Loose threads, what-ifs, future possibilities

   Scope inheritance: local drafts automatically see global foundation + regional strategy. Rune selects the right context for each conversation. Version tracking on every KB file -- can restore any previous state.

   **What's built:** Hierarchical `knowledge_files` table with 13 file types, 4 scopes (global/regional/local/session), 6 folder types (foundation/strategy/drafts/sandbox/production/assets). `KnowledgeBaseService` with full CRUD and scope inheritance. `kb-versioning.ts` with semantic version bumping and change summaries. `knowledge_file_versions` table for content snapshots. 5 AI KB tools (create/update/search/get/list) via Claude function calling. KB context inference with relevance scoring and token-budget-aware selection. `WorldBuildingDashboard` with progress ring and foundation layer cards. Data migration from flat entities to hierarchical KB. **Remaining:** KB version history UI (browse/restore past versions), provenance tracking (which KB version was active per draft), confidence scoring per entry.

3. **The Backlog Engine** -- REALIZED
   Rune is never idle. After every session, it generates questions, identifies thin spots, flags contradictions, surfaces unexplored threads, and queues review tasks. Priority-scored with aging. When you open Rune, it already knows what to work on next. In Stage A, the backlog drives world-building completeness ("You mentioned Kira's mother but never described her -- tell me about her"). In Stage B, it drives story completeness ("Chapter 4 references a location you haven't built yet").

4. **The Three Rooms** -- REALIZED (needs evolution)
   Brainstorm, Drafts, Publish. Currently maps to book types (memoir/fiction/nonfiction). Needs to evolve into the three pipeline stages: World Building (foundation + strategy KB), Story Writing (drafts + sandbox), Publishing (production + exports). The rooms become stage-aware -- Room 1 is where you build, Room 2 is where you write, Room 3 is where you ship.

5. **Three-Tier Intelligence** -- REALIZED
   Opus for the heavy thinking (prose generation, manuscript, deep analysis). Sonnet for the working layer (editing, filing, interviews). Haiku for the clerk work (intent detection, entity extraction, KB classification). User controls cost via a single quality slider. Rune routes every task automatically.

6. **Guided Oral Interviews** -- REALIZED
   Rune doesn't just listen passively -- it interviews. Structured question sequences that walk the user through world-building layer by layer. "Tell me about your main character." "What does the world look like?" "What are the rules?" "Who are the factions?" Each answer populates the KB automatically. The interview adapts based on book type -- memoir interviews ask about eras, people, emotions. Fiction interviews ask about world rules, character motivations, conflict structure. Non-fiction interviews ask about thesis, evidence, counter-arguments. Rune knows what's missing and asks for it.

   **What's built:** Question trees for all 3 book types (Fiction: 9 nodes, Memoir: 8 nodes, Nonfiction: 7 nodes) with follow-up questions, extraction hints, and KB layer targeting. `InterviewEngine` class that walks the tree, infers answered questions from existing KB state, detects gaps (entities mentioned but not profiled), tracks completeness percentage, checks Stage B readiness, and generates system prompt additions for interview mode. Voice-to-KB filing via Claude `tool_use` in the converse API. `InterviewProgress` component: vertical stepper checklist with answered/pending status, "Ask Next" card, collapsible revisit suggestions for deepening completed topics. Memoized engine computation. **Remaining:** Interview session history (browse past interview sessions).

7. **Streaming Transparency** -- PARTIAL (95%)
   Everything Rune does is visible. Filing a KB entry, connecting entities, drafting a paragraph, updating the world bible -- streamed to the activity panel in real time. Trust through visibility. You watch your scribe work. `KBOperationCard` shows Rune's KB operations with approve/dismiss buttons and auto-approve countdown (streaming wired end-to-end via SSE). `WorldBuildingDashboard` mounted in ActivityStream as default "World" tab. Pipeline stage indicator (Workshop/Study/Press) in BookWorkspace header. `SynthesisSummaryCard` shows session-end synthesis results (summary, entities extracted, backlog items, workspace files created) with collapsible sections. **Remaining:** Progress indicators for long synthesis operations.

8. **Collaborative Authorship** -- UNREALIZED
   Multiple authors on one book. Shared KB, individual voice profiles, merge/conflict resolution for competing drafts. Kobe and Emily writing their children's book together -- each talking to Rune from their own perspective, Rune weaving both voices into one narrative. The KB is shared but voice profiles are separate -- Rune knows who's talking and adapts. Requires: multi-user auth, voice profile separation, collaborative workspace permissions, conflict resolution for KB entries.

9. **Format-Agnostic Output** -- UNREALIZED
   The KB + story structure is the source of truth. The output format is a choice made at Stage C. Books first (KDP-formatted manuscripts, ePub, PDF with proper typography). But the same world and story can output as: short film screenplay, audio drama script, graphic novel script with panel descriptions, game narrative document, series bible for TV pitch. The architecture supports it because the KB separates world from format. Requires: format templates, export engine per format, cover/asset integration for visual formats.

10. **Audio-Native Output** -- UNREALIZED
    If the book was spoken into existence, it should be listenable. Generate audiobook from manuscript with author's voice (or AI narration). Chapter markers, pacing, tone matching. The oral tradition comes full circle -- spoken in, spoken out. Requires: TTS integration, voice cloning or selection, audio chapter assembly.

11. **Illustration Intelligence** -- UNREALIZED
    Concept art generation from KB content. Character visualizations from character profiles. Scene compositions from chapter drafts. Art direction briefs generated from the world bible and settings. Not final art -- concept work that feeds a human illustrator or stands alone for self-published work. Requires: image generation API, KB-to-visual pipeline, style consistency engine.

12. **KB Version Tracking** -- PARTIAL (65%)
    Every KB file maintains semantic versioning (X.Y.Z). Content snapshots at each version. Can restore any historical state. Tracks which KB version was active when each draft was written -- if you change a character's backstory in session 15, you can see which chapters were written with the old backstory. Provenance and confidence scoring on every entry. Modeled after id8composer's version architecture.

    **What's built:** `knowledge_file_versions` table with content snapshots and semantic versioning. `kb-versioning.ts` with `determineVersionType()` (major/minor/patch by content diff), `bumpSemanticVersion()`, `generateChangeSummary()`. `KnowledgeBaseService.getVersionHistory()` for retrieving version history. DB helper functions `create_kb_version()` and `restore_kb_version()`. `KBVersionHistory` UI component: version list with semantic version badges (major/minor/patch color-coded), change summaries, relative timestamps. Side-by-side content comparison (current vs selected version). Restore with inline confirmation dialog (creates new version from snapshot). Entry point via "history" button on WorldBuildingDashboard layer cards. **Remaining:** Provenance tracking (which KB version was active per draft), confidence scoring per entry.

## User Truth

**Who:** People with a story to tell who don't think of themselves as writers. Not professional authors optimizing their craft. People who would never open a Word document but would absolutely tell you their story over coffee.

**Before:** "I've always wanted to write a book but I don't know where to start. I'm not a writer. I can't sit at a desk for hours. I have all these ideas but they're scattered everywhere. I tried writing it down once and gave up after two pages."

**After:** "I just... talked about it. I told Rune about my characters and it remembered everything. It asked me questions I hadn't thought of. One day I opened the Drafts room and there were actual chapters in there. My chapters. My words, organized. I spoke a book into existence."

**First users:**
- **Kobe & Emily** -- Reality TV couple writing a bicultural children's picture book series (Cameroonian folklore + American life). Kobe brings the folklore and cultural authenticity. Emily brings the American lens and audience. Neither considers themselves a "writer" but both are natural storytellers. Rune is how they get their stories out of conversation and into print.
- **Alexis** -- Wants to write a sci-fi novel. Has the world in her head -- the characters, the rules, the arcs -- but the blank page is paralyzing. Voice-first changes everything: she can describe her world like she's giving a tour of it.

## Edges

- Rune is NOT a text editor. There is no cursor, no formatting toolbar, no "Track Changes." You talk. Rune writes.
- Rune does NOT replace professional editors or publishers. It gets you from zero to manuscript. What happens after is your choice.
- Rune does NOT do ghostwriting-for-hire. Your voice, your ideas, your book. Rune is the scribe, not the author.
- Rune does NOT generate books from a prompt. "Write me a sci-fi novel about X" is ChatGPT territory. Rune interviews you, learns your world, and writes YOUR book over many sessions.
- Rune does NOT produce final illustrations. Concept art and visual direction, yes. Publication-ready art requires a human illustrator.
- Rune does NOT handle marketing, distribution, or sales. The pipeline ends at "publish-ready manuscript."
- Rune does NOT store manuscripts on our servers in the hosted version without user consent. Self-host option means you own your data completely.

## Anti-Vision

- **Never become an AI writing tool.** Rune is a scribe -- an entity that listens, remembers, and writes on your behalf. The moment it becomes "assisted writing" with suggestions and autocomplete, the soul is dead. You talk. It writes. That's the contract.
- **Never abandon voice-first.** Text input exists as accessibility fallback. If the primary experience shifts to typing, Rune becomes just another writing app. The oral tradition is the product.
- **Never forget across sessions.** The knowledge base is Rune's memory. If a user mentions a character in session 1 and Rune doesn't remember in session 12, the trust is broken. Persistence is non-negotiable.
- **Never let the user manage the KB directly.** The knowledge base is Rune's job. Users talk -- Rune files, organizes, versions, and maintains. The moment you ask a user to "create a character profile" in a form, the soul is dead. They describe the character. Rune writes the profile. They can review and correct, but never administrate.
- **Never skip world-building.** The temptation is to jump straight to writing. Rune resists. A story written without a world bible is a story that contradicts itself by Chapter 3. Stage A exists for a reason. Rune guides, interviews, and fills the KB before it writes a single line of prose.
- **Never be prescriptive about craft.** Rune doesn't teach you three-act structure or lecture about "show don't tell." It interviews, it listens, it organizes. The user's natural storytelling voice is the source material, not writing rules. Rune holds the structure -- the user fills it with soul.
- **Never optimize for speed over depth.** A book is not a sprint. Rune succeeds when users come back session after session, building something layered and real. Fast-generated content is anti-content.
- **Never lose the warmth.** The aesthetic exists for a reason. Cream surfaces, warm tones, serif headings. A study, not a software tool. People creating something personal need an environment that feels personal.
- **Never lock output to one format.** The KB is format-agnostic. A world built in Rune can become a book, a screenplay, a game bible, an audio drama. The moment Rune assumes "book" is the only output, it limits the creator's imagination.

## Evolution Log

| Date | What Shifted | Signal | Section |
|------|-------------|--------|---------|
| 2026-02-12 | Concept locked. 52 tasks built. Full codebase in one session. | Blueprint sprint | All |
| 2026-02-12 | Stages 4-8 passed in single build session | Parallel agent pipeline | Pillars (1-6) |
| 2026-03 | Design system evolved: Library/Study -> Claude-Inspired | Aesthetic redesign | Pillars (6) |
| 2026-03-17 | Oral tradition thesis articulated. First users identified. | Eddie's vision session | Soul, User Truth |
| 2026-03-17 | Triad established (VISION + SPEC + BUILDING) | Roadmap derivation need | All |
| 2026-03-17 | KB architecture reframed: id8composer world-building model adapted for voice-first | Eddie's pipeline vision | Pillars (2, 4, 6, 9, 12) |
| 2026-03-17 | Three-stage pipeline defined: World Building -> Story Writing -> Publishing | "Rune holds the structure A to Z" | Pillars (all) |
| 2026-03-17 | Format-agnostic output: books first, but KB supports any format | "book, short film, fucking anything" | Pillars (9) |
| 2026-03-17 | Phases 1-5 shipped: deploy, KB schema, interviews, AI tools, pipeline | One-session build sprint | Pillars (1-7, 12) |
| 2026-03-17 | Sam named as entity. CaF consciousness subset designed inversion-first. | "Sam. (from LOTR)" | Soul, Sam |
| 2026-03-17 | 18 mind files: kernel(5), drives(2), emotional(2), models(3), relationships(1), memory(1), habits(1), unconscious(2 dotfiles), runtime(1) | CaF golden sample pattern | Sam |
| 2026-03-17 | Meta-realization: id8composer KB WAS consciousness filesystem all along. Foundation=kernel, Strategy=drives, Working=memory. Eddie's been building CaF since day 1. | "holy fuk" | Soul, Sam |
| 2026-03-18 | Layout restructure: header-first to sidebar-first (Claude.ai pattern). Profile section, settings dashboard, dark mode toggle, BYOK API key management. Profiles table with auto-create trigger. Dashboard with continue-writing card + stats. | "full service" sprint | Pillars (warmth, never lose it) |
| 2026-03-18 | Trust infrastructure: Privacy policy, Terms of Service (IP ownership front and center), proper 4-column footer. "Your book. Your IP. Period." Trust stack: legal + BYOK + self-host. | "its all your IP" | Edges, Anti-Vision |
| 2026-03-18 | Semantic versioning: 0.STAGE.PATCH scheme. v0.9.0 (Stage 9). CHANGELOG.md. Version surfaced in footer + settings. | Launch prep hygiene | All |
| 2026-03-18 | Subscription model: API costs absorbed as COGS. No BYOK for hosted users. API Keys tab removed. First users (Alexis, Kobe, Emily) free. | "I'll eat the cost" | Pillars (5), Edges |
| 2026-03-18 | Model routing simplified: Sonnet-default for all tasks. Opus only for final manuscript at Premium. Haiku for clerk work. | COGS optimization | Pillars (5) |
| 2026-03-18 | Logo typography: Cormorant Garamond (weight 400). High-contrast display serif with 16th century Garamond lineage. Applied to all wordmark placements. | Brand identity | Pillars (warmth, never lose it) |

---

**Companion documents:** `SPEC.md` (what it IS now), `BUILDING.md` (how we got here).
**The gap between VISION and SPEC is the work.**
