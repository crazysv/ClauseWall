# ClauseWall — Bold Impact Design System

## Philosophy
ClauseWall's design is inspired by social justice campaigns, protest art, and high-impact editorial design. Every element should feel like it's fighting for the user. No decoration for decoration's sake — every visual choice communicates urgency, clarity, and empowerment.

## Visual Principles
1. **IMPACT OVER ELEGANCE** — Large type, bold statements, high contrast. We're not a luxury brand. We're a weapon for the people.
2. **BLACK & WHITE + RED** — The primary palette is stark black text on white backgrounds. Red (#dc2626) is used sparingly but powerfully — for CTAs, danger indicators, and emphasis. When red appears, it MEANS something.
3. **TYPOGRAPHY IS THE HERO** — Headlines are massive (72px+), ultra-bold (weight 900), tightly tracked. Text itself is the visual element. No need for heavy illustration when your words hit hard.
4. **HIGH CONTRAST ALWAYS** — No light-gray-on-white. No subtle pastels for important information. If it matters, it's bold, dark, and unmissable.
5. **SHARP, NOT SOFT** — Minimal border radius. Sharp shadows. Solid borders. This design has edges, not curves.
6. **DATA SPEAKS LOUD** — Statistics, scores, and numbers are displayed LARGE. "89% of Mumbai rentals have lower deposits" should hit you in the face.
7. **SEMANTIC COLORS ARE SACRED** — Green/Yellow/Red/Purple for safe/warning/dangerous/illegal. These NEVER change meaning. They appear in badges, borders, backgrounds consistently.

## Component Patterns
- **Buttons**: Solid fills, no gradients. Primary = red bg + white text. Secondary = black bg + white text. Ghost = transparent + black border. Large padding (px-8 py-4). Bold text.
- **Cards**: White background, subtle shadow OR bold black border (2px solid black for emphasis). No gradient borders. Clean and sharp.
- **Badges/Tags**: Pill-shaped (rounded-full). Semantic color bg with matching text. Small, informational.
- **Stats/Numbers**: Displayed in 48-72px bold. Often standalone or in grid. Tabular-nums for alignment.
- **Sections**: Alternating white and light-gray (#f8fafc) backgrounds. Occasional full-black section for contrast (used sparingly for CTA or impact stats).
- **Shadows**: shadow-sm for subtle depth. shadow-lg only for elevated modals. No colored shadows.
- **Borders**: 1px neutral-200 default. 2px solid black for emphasis. No gradient borders.
- **Hover effects**: Background color shift (not scale/transform). Subtle and fast (150ms).
- **Icons**: Lucide React. Stroke width 2. Sized consistently (20px inline, 24px standalone). Never decorative — always functional.

## Layout Patterns
- **Max width**: max-w-7xl for content, max-w-4xl for text-heavy sections
- **Section padding**: py-20 to py-32 for breathing room
- **Grid**: 2-column or 3-column for features. Single column for hero and text sections.
- **Spacing**: Generous. gap-8 minimum between major elements. Don't crowd.

## Animation Guidelines
- Minimal animations. This design communicates through typography and contrast, not motion.
- Acceptable: Fade-in on scroll, number count-up for stats, subtle hover transitions
- Not acceptable: Bouncing elements, complex parallax, decorative particle effects
- Score gauge: Animated fill is okay — it's functional, not decorative
- Page transitions: Simple fade (200ms)

## Dark Mode Rules
- Invert backgrounds: white → #0a0a0a, light-gray → #171717
- Invert text: black → white
- Red accent stays the same (#dc2626)
- Semantic colors stay the same
- Card backgrounds: #171717 with #262626 borders
- Maintain the same IMPACT feel — dark mode should feel equally bold

## What This Design Is NOT
- Not a glassmorphism design (no blur, no transparency)
- Not a gradient-heavy design (no mesh gradients)
- Not a neon/cyber design (no glowing effects)
- Not a soft/rounded design (no rounded-3xl, no pastel everything)
- Not a minimalist-to-the-point-of-boring design (still has ENERGY)

---

# Results Workspace — Dark Mode Variant

The Results page is where ClauseWall delivers its core value: the analysis of a user's contract. This workspace requires a more refined, focused environment than the marketing-facing pages. It preserves the Bold Impact identity but evolves it into a **premium dark analysis environment** — calmer, more structured, and built for sustained reading.

## Variant Philosophy

The Results workspace is a **focused reading + intelligence room**. The user just uploaded a contract and is now receiving the analysis. The tone shifts from "protest energy" to **"senior counsel briefing"** — still authoritative, but measured and deliberate. The design should make the user feel like they have access to a premium legal intelligence tool.

**This is NOT a different brand. It is the same voice in a different room.**

---

## 1. Color Palette

### Backgrounds (Dark Surface Hierarchy)
| Token | Value | Use |
|-------|-------|-----|
| `background` | `#0a0a0a` | Page canvas |
| `card` / surface | `#171717` | Default card / rail background |
| `muted` / elevated | `#1f1f1f` | Elevated cards, hover states |
| `recessed` | `#111111` | Inset areas, code blocks, original clause text wells |

### Text
| Token | Value | Use |
|-------|-------|-----|
| `foreground` | `#fafafa` | Primary text (headlines, clause names) |
| `muted-foreground` | `#a3a3a3` | Secondary text (metadata, labels, timestamps) |
| `dim` | `#6b6b6b` | Tertiary text (disclaimers, fine print) |

### Accents
| Token | Value | Use |
|-------|-------|-----|
| **Primary** | `#dc2626` | CTAs, high-risk alerts, primary action buttons, score ring on dangerous |
| **Primary (muted)** | `rgba(220,38,38,0.1)` | Subtle red tinted backgrounds for alerts |
| **Neutral accent** | `#fafafa` | Secondary buttons (white text on dark) |

> **Rule**: Red is the ONLY chromatic accent outside of semantic risk colors. No blue, no cyan, no gold. When red appears, it must carry meaning — never decorative.

### Semantic Risk Colors (Invariant)
| Level | Text | Background (10% opacity) | Left Border |
|-------|------|--------------------------|-------------|
| Safe | `#22c55e` | `rgba(34,197,94,0.1)` | 4px solid `#22c55e` |
| Warning | `#eab308` | `rgba(234,179,8,0.1)` | 4px solid `#eab308` |
| Dangerous | `#ef4444` | `rgba(239,68,68,0.1)` | 4px solid `#ef4444` |
| Illegal | `#a855f7` | `rgba(168,85,247,0.1)` | 4px solid `#a855f7` |

---

## 2. Typography

### Font Stack
| Role | Font | Fallback |
|------|------|----------|
| **Headlines / Score / Labels** | Space Grotesk | system-ui, sans-serif |
| **Body / Clauses / Controls** | Inter | system-ui, sans-serif |

### Scale (Results-specific)
| Name | Size | Weight | Font | Use |
|------|------|--------|------|-----|
| `result-title` | 28-32px (2xl) | 700 bold | Space Grotesk | "Analysis Results" page title |
| `result-score` | 48-56px (4xl-5xl) | 900 black | Space Grotesk, tabular-nums | Risk score number |
| `result-section` | 14-16px (sm-base) | 600 semibold | Space Grotesk, uppercase, tracking-wide | Section labels ("CLAUSES", "SUMMARY", "DETECTED ISSUES") |
| `result-card-title` | 15-16px (base) | 600 semibold | Inter | Clause type name on card |
| `result-body` | 14px (sm) | 400 regular | Inter | Clause explanations, AI analysis text |
| `result-meta` | 12-13px (xs) | 400 regular | Inter | Timestamps, clause indices, metadata |

**Rules:**
- Space Grotesk headlines should use `tracking-wide` or `tracking-wider` for section labels
- Space Grotesk section labels should be UPPERCASE
- Score numbers must use `tabular-nums` and `font-variant-numeric: tabular-nums`
- Body text in Inter should use `leading-relaxed` for readability against dark backgrounds
- Never go below 12px for any text

---

## 3. Cards & Surfaces

### Card Tiers (3 levels)

#### Tier 1: Standard Card (default)
```
background: #171717
border: 1px solid #262626
border-radius: 0.5rem (rounded-lg)
shadow: 0 1px 2px rgba(0,0,0,0.3)
padding: 16-20px
```
**Use**: Clause cards, breakdown cells, detected issue chips, tool items.

#### Tier 2: Emphasis Card (elevated)
```
background: #171717
border: 2px solid #fafafa (or semantic color)
border-radius: 0.5rem (rounded-lg)
shadow: 0 1px 3px rgba(0,0,0,0.4)
padding: 20-24px
```
**Use**: Risk score display, primary action card, critical alert card. **Max 1-2 per viewport.**

#### Tier 3: Recessed Well (inset)
```
background: #111111
border: none
border-radius: 0.375rem (rounded-md)
shadow: none (inset feel)
padding: 12-16px
```
**Use**: Original clause text display, code/quote blocks, nested content within an expanded card.

### Card Interaction
- **Hover**: Background shifts from `#171717` → `#1f1f1f`. Transition: 150ms ease.
- **Expanded state**: Card grows in height, reveals nested content in Tier 3 well. No scale transform.
- **Risk accent**: 4px left border in semantic risk color (`.border-risk-*`).

---

## 4. Layout Architecture

### Split Workspace (Desktop: ≥1024px)
```
┌─────────────────────────────────────┬──────────────────┐
│         MAIN COLUMN (63%)           │  CONTEXT RAIL    │
│                                     │    (37%)         │
│  • Page header                      │  • Risk score    │
│  • Filter bar                       │  • Breakdown     │
│  • Clause list (scrollable)         │  • Summary       │
│  • Market comparison                │  • Detected      │
│  • Proof / verification             │    Issues        │
│                                     │  • Actions       │
│                                     │  • More Tools    │
│                                     │  (sticky)        │
└─────────────────────────────────────┴──────────────────┘
```

- **Gap between columns**: 24-32px (gap-6 to gap-8)
- **Rail**: `position: sticky; top: 24px;` with `max-height: calc(100vh - 48px); overflow-y: auto`
- **Rail background**: `#111111` or `#171717` — one tonal step different from the page background
- **Main column**: Scrolls naturally. No fixed height.

### Mobile (< 1024px)
- Single column stack
- Rail content collapses into a compact summary bar at top
- Clause cards full-width
- Actions accessible via bottom sheet or inline section

### Spacing Rhythm
| Context | Value |
|---------|-------|
| Between major sections | 32px (gap-8) |
| Between clause cards | 12-16px (gap-3 to gap-4) |
| Card internal padding | 16-20px (p-4 to p-5) |
| Rail section spacing | 20-24px (space-y-5 to space-y-6) |
| Page horizontal padding | 24-32px (px-6 to px-8) |

---

## 5. Button Hierarchy (Results-specific)

### Tier 1: Primary Action
```
background: #dc2626
color: white
border: none
border-radius: rounded-lg
padding: px-6 py-3
font: Inter 14px semibold
```
**Use**: "Download Report", "Draft Negotiation Letter" — max ONE per viewport.

### Tier 2: Secondary Action
```
background: transparent
color: #fafafa
border: 1px solid #404040
border-radius: rounded-lg
padding: px-4 py-2
font: Inter 14px medium
```
**Use**: "View Full Clause", "Export", "Share". Multiple allowed.

### Tier 3: Text Link Action
```
background: none
color: #a3a3a3
border: none
padding: px-2 py-1
font: Inter 13px regular
hover: color → #fafafa, underline
```
**Use**: "Deep Dive →", "View all clauses →", navigation within rail. Suffix with → arrow.

### Tier 4: Icon-Only Action
```
background: transparent
color: #6b6b6b
border: none
padding: p-2
hover: color → #a3a3a3, bg → #1f1f1f
```
**Use**: Copy, bookmark, ellipsis menu, collapse toggle. Always has a tooltip.

---

## 6. Specific Component Rules

### Risk Score Display
- Circle indicator: 96px diameter
- Border: 3px solid in semantic risk color
- Inner background: `#111111`
- Score number: Space Grotesk, 48px, font-black, tabular-nums, colored by risk level
- Label below: Space Grotesk, 11px, uppercase, tracking-widest, same risk color
- **This is always a Tier 2 Emphasis element**

### Clause Cards (Collapsed)
- Tier 1 Standard Card with 4px left risk border
- Content: Risk badge (pill) → Clause type (semibold) → One-line explanation (muted)
- Right side: Expand chevron (icon-only, muted)
- **No visible action buttons in collapsed state**

### Clause Cards (Expanded)
- Same card grows to reveal:
  - Original clause text in Tier 3 Recessed Well
  - AI analysis paragraph in regular body text
  - Red flags as a compact bulleted list (if any)
  - Single "Deep Dive →" text link at bottom right
- **Max one action visible. Everything else in the drawer.**

### Risk Breakdown Strip
- 4 cells in a row (or 2×2 grid on narrow rail)
- Each cell: Tier 1 card, 4px left border in risk color
- Content: Count number (Space Grotesk, 20px, bold, risk color) + Label (Inter, 12px, muted)

### Detected Issues Section
- Only renders if issues exist
- Compact chips: Tier 1 card styling, small (py-2 px-3)
- Content: Issue name + count, subtle risk-tinted background
- Examples: "Timebomb: 2 found", "Shadow Clause: 1"

### Action Block
- Max 2-3 visible actions
- Top action: Tier 1 Primary (red) — the most important next step
- Remaining: Tier 3 Text Links with → arrows
- Actions are contextual — adapt based on risk severity

### More Tools (Collapsible)
- Default: collapsed with "More Tools" label + chevron
- Expanded: vertical list of Tier 4 icon+label items
- Items: Compact, muted, functional — not promotional

---

## 7. Borders, Shadows & Depth

| Element | Border | Shadow |
|---------|--------|--------|
| Standard card | 1px solid `#262626` | `0 1px 2px rgba(0,0,0,0.3)` |
| Emphasis card | 2px solid `#fafafa` or risk color | `0 1px 3px rgba(0,0,0,0.4)` |
| Recessed well | none | none (depth from bg color) |
| Hover state | no change | no change (bg color shift only) |
| Drawer / modal overlay | 1px solid `#262626` | `0 8px 24px rgba(0,0,0,0.5)` |

**Forbidden:**
- Colored shadows / glows (no `box-shadow` with blue, red, etc.)
- Gradient borders
- `backdrop-filter: blur()` / glassmorphism
- Neon ring effects

---

## 8. Animation (Results-specific)

| Allowed | Rule |
|---------|------|
| Card expand/collapse | Height transition, 200ms ease-out |
| Fade-in on load | Stagger clause cards, 100ms intervals |
| Score count-up | Number animates from 0 to value over 800ms |
| Rail section enter | Subtle fade-in, 300ms |
| Hover transitions | Background color, 150ms |

| Forbidden | Rule |
|-----------|------|
| Scale transforms on cards | No `transform: scale()` |
| Parallax or scroll-linked animation | Keep it simple |
| Glow pulse on score | Glows are not part of this system |
| Skeleton shimmer loops | Use simple opacity placeholder if needed |

**Exception**: Screen shake and red vignette for high-risk contracts remain as defined in globals.css — these are functional risk-feedback effects, not decoration.

---

## 9. Results Workspace — What It Is and Is Not

### IS
- A premium dark analysis environment
- Calm, structured, reading-first
- Typography-driven hierarchy (Space Grotesk headlines + Inter body)
- Red as the only accent — intentional and meaningful
- Bordered cards with real structure and subtle shadow
- Generous spacing, clear sections, visual breathing room

### IS NOT
- A "mission control" dashboard with tonal surface layering
- A blue/cyan-accented tech interface
- A glassmorphism or gradient design
- A borderless, shadow-free flat design
- A dense data terminal — this is for consumers, not analysts
- A decoration-first page — every element earns its place
