# Design System: Rune

> Extends: [id8Labs Master DESIGN.md](../../../id8labs/DESIGN.md)
> This file documents only Rune-specific overrides and additions.

## Identity

Rune is a voice-first book writer with Sam as the AI companion entity. The visual language is **warm literary minimalism**: cream paper, serif headings, coral accents, and Sam's golden presence ring. Every surface feels like a well-loved writing desk. The design prioritizes warmth, focus, and the intimacy of a conversation between writer and collaborator.

## Overrides from Master

### Mode: Light-First (with Dark Mode)

Rune defaults to light mode with a **warm cream** canvas (`#faf9f5`), not pure white. Dark mode available via `.dark` class. This is the closest project to the master's light-mode philosophy, but warmer.

### Fonts

| Role | Master (Inter) | Rune Override |
|------|----------------|---------------|
| Headings | Inter 600 | **Source Serif 4** 400-600, letter-spacing -0.02em |
| Body | Inter 400 | **Source Sans 3** 400-600 |
| Labels/Timestamps | Inter 500 | **IBM Plex Mono** 400, uppercase, letter-spacing +0.1em |
| Decorative | -- | **Cormorant Garamond** 300-500 (optional display use) |

**Principle:** Source Serif 4 (headings) + Source Sans 3 (body) is a matched Adobe Source family pairing. The serif carries editorial authority for a book-writing tool. IBM Plex Mono marks all system-level labels and timestamps. Cormorant Garamond available for decorative display moments.

### Color Palette: Claude-Inspired Warmth

**Light Mode (Default):**
| Token | Value | Role |
|-------|-------|------|
| Background | `#faf9f5` | Page background (warm cream, NOT white) |
| Surface | `#ffffff` | Card surfaces (clean white) |
| Elevated | `#f5f4ef` | Hover states, raised surfaces |
| Border | `#e5e4df` | Borders, dividers |
| Muted | `#73726c` | Placeholders, tertiary text |
| Text | `#3d3d3a` | Body text |
| Heading | `#141413` | Headings, primary text |
| Gold (accent) | `#d97757` | Primary accent (Claude coral) |
| Teal (secondary) | `#2c84db` | Secondary accent (Claude blue) |
| Error | `#dc3545` | Error states |

**Dark Mode (`.dark` class):**
| Token | Value | Role |
|-------|-------|------|
| Background | `#1a1918` | Warm dark canvas |
| Surface | `#252422` | Card surfaces |
| Elevated | `#302e2b` | Hover states |
| Border | `#3d3c38` | Borders |
| Muted | `#8c8b87` | Placeholders |
| Text | `#ccccc6` | Body text |
| Heading | `#eeeeec` | Headings |
| Gold | `#e08b6d` | Accent (brighter for dark) |
| Teal | `#5a9fe6` | Secondary (brighter for dark) |

**Alpha variants** via CSS `color-mix()`:
```css
color-mix(in srgb, var(--rune-gold) 20%, transparent)  /* subtle bg */
color-mix(in srgb, var(--rune-gold) 50%, transparent)  /* Sam glow */
```

**Note:** Rune's gold (`#d97757`) is Claude coral, distinct from master's `#FF6B35` and Lexicon's `#CD6B5A`. Warmer, more muted, bookish.

### Border Radius

Softer than master, rounder than Homer:
- `rounded-full` -- circular buttons, avatars, Sam presence
- `rounded-xl` (12px) -- large containers, main chat input
- `rounded-lg` (8px) -- cards, buttons, standard elements
- `rounded-md` (6px) -- smaller elements

### Shadows

Minimal. Rune relies on color shifts and borders more than shadows:
- Dropdown: `0 4px 12px rgba(0, 0, 0, 0.08)`
- Sam indicator: `0 0 6px color-mix(in srgb, var(--rune-gold) 50%, transparent)`

No heavy shadows. No glow systems. Subtlety is the principle.

### Background Texture

Dot-grid pattern applied via `body::before`:
- 4px x 4px dots with radial vignette
- Creates subtle depth without visual heaviness
- Light mode only (invisible on dark)

## Rune-Specific Patterns

### Sam Presence Ring

The defining visual pattern. When Sam speaks, a **rotating golden border** wraps the entire viewport:

```css
/* Conic gradient rotating around viewport edge */
animation: sam-ring-rotate 4s linear infinite;
/* Fades in/out with 0.8s ease-in-out */
```

This is atmospheric, not UI. It signals "Sam is present and speaking" without adding chrome. The golden light rotates continuously, creating a warm, enveloping feel.

- Color: `var(--rune-gold)` with opacity
- Animation: 4s linear infinite rotation
- Transition: 0.8s ease-in-out opacity

### Sam Chat Peek

Corner floating element showing Sam's last message:
- 80-character preview, expandable to `calc(60vh - 60px)`
- Gold indicator dot with `box-shadow: 0 0 6px gold-50%`
- `backdrop-filter: blur(12px)` frosted glass
- Smooth expand: `transition-all duration-500`

### Voice Input (Primary Interaction)

The microphone button is the hero interaction:

**Idle state:**
- Rounded-full button, `var(--rune-gold)` background
- Inline SVG mic icon

**Listening state:**
- Pulsing gold ring (`animate-ping`)
- Filled gold background
- "Listening..." placeholder text
- Transcript appears inline as user speaks

**Input field:**
- Auto-expanding textarea
- Placeholder: "Type, speak, or paste..."
- Orange focus ring
- Rounded-xl (12px)

### Session Layout

65/35 split:
- **Left (65%):** Conversation messages + voice input
- **Right (35%):** Activity sidebar with tabs (Workspace, World Building, Progress, Knowledge Graph, Manuscript)

Session list in collapsible left sidebar.

### Activity Stream Tabs

| Tab | Content |
|-----|---------|
| Workspace | Room organization (Brainstorm, Drafts, Publish) |
| World Building | Fiction/memoir world tools |
| Progress | Interview progress, guided mode tracking |
| Knowledge Graph | Entity visualization |
| Manuscript | Chapter reader/viewer |

### Book Structure

| Concept | Values |
|---------|--------|
| Book Types | memoir, fiction, nonfiction |
| Rooms | brainstorm, drafts, publish |
| Session Modes | guided, freeform, review |
| Backlog Items | question, contradiction, thin_spot, unexplored, review, idea |

### Progress Indicators

Horizontal bars with animated fills (300ms to 1000ms transitions):
- Green `#28c840` for complete
- Yellow `#febc2e` for in-progress
- Red `#ff5f57` for blocked

### Component Library: Custom (No External)

Rune uses NO external component library. Pure Tailwind v4 + custom components + inline SVG icons. No shadcn, no Radix, no Framer Motion (removed; native CSS animations only).

## Do's and Don'ts (Rune-Specific)

### Do
- Use Source Serif 4 for all headings. The serif is the literary signal
- Use warm cream (`#faf9f5`) as page background, not pure white
- Apply Sam's presence ring when Sam is speaking. The golden rotation is the brand moment
- Use gold (`#d97757`) for user actions and primary interactions
- Use teal (`#2c84db`) for system/AI informational elements
- Apply the dot-grid background texture for subtle depth
- Keep the voice input as the hero interaction (prominent, pulsing when active)
- Use `color-mix()` for all alpha variants rather than hardcoded rgba
- Use IBM Plex Mono uppercase for all labels and timestamps

### Don't
- Don't use pure white (`#ffffff`) as page background. Warm cream is the canvas
- Don't use the master's Inter font. Source Serif + Source Sans is the Rune stack
- Don't use heavy shadows or glow systems (that's Parallax/Lexicon). Subtlety is the principle
- Don't use the master's orange (`#FF6B35`). Rune gold is `#d97757` (Claude coral)
- Don't add Framer Motion or animation libraries. CSS animations only
- Don't add avatars or heavy chrome to the chat. The conversation IS the interface
- Don't skip the Sam presence ring. It's the atmospheric signature
- Don't use cool colors as primary. Gold and cream dominate; teal is secondary only

## Agent Prompt Guide (Rune-Specific)

### Quick Reference
- Page background (light): `#faf9f5` (warm cream)
- Card surface: `#ffffff`
- Text body: `#3d3d3a` (Source Sans 3)
- Text heading: `#141413` (Source Serif 4)
- Text muted: `#73726c`
- Border: `#e5e4df`
- Primary accent (gold): `#d97757`
- Secondary (teal): `#2c84db`
- Sam glow: `color-mix(in srgb, #d97757 50%, transparent)`

### Example Prompts
- "Create a Rune writing session on #faf9f5 background. Left panel (65%): message area with Source Sans 3 body text 16px #3d3d3a. Voice input at bottom: rounded-xl, auto-expanding textarea, gold (#d97757) mic button rounded-full. Right panel (35%): tabbed activity stream."
- "Design Sam's presence ring: full viewport border, conic-gradient in #d97757, 4s linear infinite rotation, 0.8s opacity transition for appear/disappear."
- "Build a Sam chat peek: floating bottom-right corner, #ffffff surface, backdrop-filter blur(12px), gold indicator dot with box-shadow 0 0 6px gold-50%. 80-char preview, expandable to 60vh. Transition-all 500ms."
- "Create a book progress card: #ffffff surface on #faf9f5, border #e5e4df, 8px radius. Title at 20px Source Serif 4 weight 600, #141413. Progress bar with green/yellow/red fills, 300ms transition. Chapter count in IBM Plex Mono 12px uppercase #73726c."
