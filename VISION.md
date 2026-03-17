# VISION.md -- Living North Star
## Rune

> Last evolved: 2026-03-17 | Confidence: HIGH
> Distance from SPEC: 33% (4 of 12 pillars realized, 2 partial)

---

## Soul

The oral tradition is older than writing. For tens of thousands of years, every story that mattered -- every myth, every history, every lesson passed between generations -- was spoken. Then we invented writing and decided that creating a book meant sitting alone in a room, staring at a blank page, wrestling with grammar and structure and format. We turned the most natural human act -- telling a story -- into one of the most intimidating.

Rune breaks that. It reconnects the ancient and the modern. You speak your book into existence. You talk about your world, your characters, your memories, your ideas -- and Rune listens, organizes, remembers, and writes. The oral tradition didn't die. It just needed a scribe.

The name says it: a rune is an ancient letter, a symbol of knowledge encoded. Books are modern runes. And the oldest way to create them is still the best -- word of mouth.

Rune shares DNA with Parallax. The same core insight: the best AI products feel like talking to someone brilliant who listens carefully. Where Parallax translates conflict, Rune translates voice into books. Different domains, same architecture -- persistent memory, behavioral understanding, zero-touch interaction, streaming transparency.

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

2. **The World-Building Knowledge Base** -- PARTIAL (30%)
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

   **What's built today:** Basic entity graph (person/place/theme/event) with relationships and mentions. Missing: the full hierarchical KB structure, scope system, version tracking, AI-driven CRUD tools, foundation/strategy/working/assets layers.

3. **The Backlog Engine** -- REALIZED
   Rune is never idle. After every session, it generates questions, identifies thin spots, flags contradictions, surfaces unexplored threads, and queues review tasks. Priority-scored with aging. When you open Rune, it already knows what to work on next. In Stage A, the backlog drives world-building completeness ("You mentioned Kira's mother but never described her -- tell me about her"). In Stage B, it drives story completeness ("Chapter 4 references a location you haven't built yet").

4. **The Three Rooms** -- REALIZED (needs evolution)
   Brainstorm, Drafts, Publish. Currently maps to book types (memoir/fiction/nonfiction). Needs to evolve into the three pipeline stages: World Building (foundation + strategy KB), Story Writing (drafts + sandbox), Publishing (production + exports). The rooms become stage-aware -- Room 1 is where you build, Room 2 is where you write, Room 3 is where you ship.

5. **Three-Tier Intelligence** -- REALIZED
   Opus for the heavy thinking (prose generation, manuscript, deep analysis). Sonnet for the working layer (editing, filing, interviews). Haiku for the clerk work (intent detection, entity extraction, KB classification). User controls cost via a single quality slider. Rune routes every task automatically.

6. **Guided Oral Interviews** -- UNREALIZED
   Rune doesn't just listen passively -- it interviews. Structured question sequences that walk the user through world-building layer by layer. "Tell me about your main character." "What does the world look like?" "What are the rules?" "Who are the factions?" Each answer populates the KB automatically. The interview adapts based on book type -- memoir interviews ask about eras, people, emotions. Fiction interviews ask about world rules, character motivations, conflict structure. Non-fiction interviews ask about thesis, evidence, counter-arguments. Rune knows what's missing and asks for it.

7. **Streaming Transparency** -- PARTIAL (70%)
   Everything Rune does is visible. Filing a KB entry, connecting entities, drafting a paragraph, updating the world bible -- streamed to the activity panel in real time. Trust through visibility. You watch your scribe work. Missing: KB operation cards (show what Rune is adding/updating with approve/dismiss), progress indicators for long synthesis, session-end summary cards.

8. **Collaborative Authorship** -- UNREALIZED
   Multiple authors on one book. Shared KB, individual voice profiles, merge/conflict resolution for competing drafts. Kobe and Emily writing their children's book together -- each talking to Rune from their own perspective, Rune weaving both voices into one narrative. The KB is shared but voice profiles are separate -- Rune knows who's talking and adapts. Requires: multi-user auth, voice profile separation, collaborative workspace permissions, conflict resolution for KB entries.

9. **Format-Agnostic Output** -- UNREALIZED
   The KB + story structure is the source of truth. The output format is a choice made at Stage C. Books first (KDP-formatted manuscripts, ePub, PDF with proper typography). But the same world and story can output as: short film screenplay, audio drama script, graphic novel script with panel descriptions, game narrative document, series bible for TV pitch. The architecture supports it because the KB separates world from format. Requires: format templates, export engine per format, cover/asset integration for visual formats.

10. **Audio-Native Output** -- UNREALIZED
    If the book was spoken into existence, it should be listenable. Generate audiobook from manuscript with author's voice (or AI narration). Chapter markers, pacing, tone matching. The oral tradition comes full circle -- spoken in, spoken out. Requires: TTS integration, voice cloning or selection, audio chapter assembly.

11. **Illustration Intelligence** -- UNREALIZED
    Concept art generation from KB content. Character visualizations from character profiles. Scene compositions from chapter drafts. Art direction briefs generated from the world bible and settings. Not final art -- concept work that feeds a human illustrator or stands alone for self-published work. Requires: image generation API, KB-to-visual pipeline, style consistency engine.

12. **KB Version Tracking** -- UNREALIZED
    Every KB file maintains semantic versioning (X.Y.Z). Content snapshots at each version. Can restore any historical state. Tracks which KB version was active when each draft was written -- if you change a character's backstory in session 15, you can see which chapters were written with the old backstory. Provenance and confidence scoring on every entry. Modeled after id8composer's version architecture.

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

---

**Companion documents:** `SPEC.md` (what it IS now), `BUILDING.md` (how we got here).
**The gap between VISION and SPEC is the work.**
