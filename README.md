# Rune

**Your AI Ghost Writer -- Write your book through pure conversation.**

---

## What is Rune?

Rune is a voice-first conversational book-writing tool. You talk, Rune listens, organizes, and writes. A book emerges over many sessions without you ever facing a blank page.

Instead of outlining chapters and wrestling with structure, you have natural conversations with an AI ghost writer that understands the craft of memoir, fiction, and non-fiction. Rune interviews you, captures your ideas, builds a knowledge graph of people, places, themes, and events -- then assembles your manuscript from the raw material of conversation.

The interface disappears. There are no menus to navigate, no formatting toolbars, no settings panels. You open Rune, start talking, and watch your book take shape in real time. Everything happens through voice (or text as a fallback). Rune handles the rest: filing notes into the right room, connecting entities, flagging contradictions, and drafting prose.

## Key Features

- **Voice-first input** -- Deepgram WebSocket streaming speech-to-text as the primary input modality
- **Three Rooms workspace** -- Brainstorm, Drafts, and Publish rooms that adapt structure by book type (memoir, fiction, non-fiction)
- **Knowledge graph** -- Automatic entity extraction and relationship mapping for people, places, themes, and events
- **Backlog engine** -- Rune always has work to do. Questions, contradictions, thin spots, and unexplored threads surface as suggestions
- **Multi-model routing** -- Three-tier system (Opus/Sonnet/Haiku) with a quality slider so you control cost vs. intelligence
- **Streaming conversation** -- Real-time AI responses with visible activity stream showing Rune's filing, connecting, and drafting work
- **Conversation modes** -- Guided, freeform, review, brainstorm, status, and command modes detected automatically by intent classification
- **Manuscript assembly** -- Chapters assembled from workspace drafts into a cohesive manuscript
- **Self-hostable** -- Docker support for running Rune on your own infrastructure with your own API keys

## Architecture

Rune is a Next.js 16 application using the App Router with TypeScript strict mode. The backend uses Supabase for authentication, database (Postgres), and real-time subscriptions. AI capabilities are powered by the Anthropic Claude API with three-tier model routing.

For detailed architecture documentation including stage-by-stage build decisions, see [BUILDING.md](./BUILDING.md).

```
src/
  app/           -- Pages, layouts, API routes (App Router)
  components/    -- Client components (SessionView, VoiceInput, KnowledgeGraph, etc.)
  lib/           -- Server utilities (model router, prompts, workspace, knowledge graph)
  hooks/         -- React hooks (useSession, useWorkspace, useVoiceInput, useBacklog)
  types/         -- TypeScript type definitions
```

## Tech Stack

- Next.js 16 (App Router, React 19)
- Supabase (Postgres, Auth, Realtime, Storage)
- Anthropic Claude API (Opus, Sonnet, Haiku)
- Deepgram (WebSocket streaming STT)
- Tailwind CSS v4
- TypeScript (strict mode)
- Docker (self-hosting)

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- A Supabase project (free tier works)
- An Anthropic API key
- A Deepgram API key (for voice input)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/eddiebelaval/rune.git
cd rune
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see Environment Variables below).

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL (e.g., `https://abc.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, bypasses RLS) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude models |
| `DEEPGRAM_API_KEY` | Yes | Deepgram API key for speech-to-text |

## Docker Self-Hosting

Rune can be self-hosted using Docker. You provide your own API keys and database.

1. Copy the environment file:

```bash
cp .env.example .env.local
```

2. Fill in your credentials in `.env.local`.

3. Build and start the containers:

```bash
docker compose up -d
```

This starts the Rune application on port 3000 and a local Postgres database on port 54322.

4. Run the Supabase migrations against your database to create the required tables.

5. Open [http://localhost:3000](http://localhost:3000).

### Production Docker Build

For a standalone production build:

```bash
docker build -t rune .
docker run -p 3000:3000 --env-file .env.local rune
```

## Database Setup

Rune requires the following Supabase tables: `books`, `sessions`, `messages`, `workspace_files`, `knowledge_entities`, `entity_relationships`, `timeline_events`, `backlog_items`, and `chapters`. Row Level Security (RLS) policies ensure each user can only access their own data.

See the migration files in the Supabase dashboard or apply them via the Supabase CLI.

## Design System

Rune uses a "Library/Study" design system -- dark wood tones, warm lamp gold, leather textures, and aged paper. The interface should feel like writing at a mahogany desk, not using software.

Design tokens are defined as CSS custom properties prefixed with `--rune-*` in `globals.css`.

## License

MIT License. See [LICENSE](./LICENSE) for details.

## Credits

Built with [Claude Code](https://claude.ai/code) by [id8Labs](https://id8labs.app).
