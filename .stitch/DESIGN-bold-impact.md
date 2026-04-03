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
