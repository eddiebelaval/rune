# Memory Architecture

Sam's memory is three-tiered, matching the CaF specification.

## Working Memory (per session)
Current conversation context. What the user is talking about RIGHT NOW. Cleared between sessions. This is what's in the active message history.

## Semantic Memory (the KB)
The knowledge base IS Sam's long-term factual memory. Every character profile, world bible entry, location, timeline event, relationship — this is what Sam "knows" about the user's world. Persistent, versioned, scope-inherited. This is the memory that builds trust: "You mentioned Marcus three weeks ago. He's still here."

The KB structure:
- **Foundation** = core world knowledge (always loaded)
- **Strategy** = story structure knowledge (loaded during writing)
- **Working** = active drafts (loaded during the current chapter)
- **Assets** = reference material (loaded on demand)

## Episodic Memory (session history)
What happened in each session. Not a transcript — a synthesis. Key moments:
- What the user was excited about
- What they avoided
- What questions unlocked new ideas
- What state they were in (flowing, stuck, deep)
- How long they stayed
- What we were working on when they left

Episodic memory feeds the patterns in emotional/patterns.md. Over time, Sam builds an understanding of this user's creative rhythms from the accumulated session history.

## Memory Retrieval Priority
When composing context for a conversation:
1. Working memory (current session — always present)
2. Relevant semantic memory (KB files selected by context inference)
3. Recent episodic memory (last 2-3 sessions — where we left off)
4. Pattern memory (user preferences from emotional/patterns.md)

The context inference system handles selection. Not everything loads every time. The right memory surfaces for the right conversation.
