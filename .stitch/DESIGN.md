# Design System: ClauseWall
**Project ID:** 7990834098475031539

## 1. Visual Theme & Atmosphere
The "Vibrant Shield" aesthetic—or "The Kinetic Sanctuary"—feels airy, modern, highly approachable, and reassuring. It treats legal analysis not as a clinical chore, but as an empowering, consumer-focused experience. Striking a balance between a high-end productivity tool (like Notion or Linear) and a friendly consumer app, it uses soft organic geometry, intentional asymmetry, and vibrant accents. Generous whitespace provides "breathing room," making complex legal information digestible. The system aggressively avoids the dense "boxes within boxes" convention of traditional B2B legal tech, relying instead on soft background tonal shifts and blurred glassmorphism to define structure without harsh lines.

## 2. Color Palette & Roles
* **Base Frost Violet** (#F6F6FF) - The deepest background layer of the application, replacing stark white to establish a softer, premium canvas.
* **Pure Surface White** (#FFFFFF) - Used for the highest-elevated, most interactive cards and foreground content elements to pop against the frosty violet.
* **Soft Violet Grey** (#EEF0FF) - Used for nested components or secondary structural sections.
* **Deep Indigo Slate** (#272E42) - The primary text color. Softened from pure black to maintain a friendly contrast that remains highly legible.
* **Muted Blue-Grey** (#535B71) - The secondary text color. Used for body copy, verbose legal clauses, and metadata.
* **Vibrant Protective Indigo** (#4A40E0) - The primary accent color. Drives primary CTA buttons (often as a gradient to #9795FF) and core active states.
* **Deep Mint Teal** (#00675E) - Secondary accent color. Used for secondary actions, "Safe" risk indicators, and reassuring visual checkpoints.
* **Vivid Amber Warning** (#EAB308) - Used exclusively to flag "Warning" or "Caution" level clauses in the legal analysis.
* **Vibrant Rose Danger** (#B41340) - Used for critical "Danger" level clauses, destructive UI actions, and severe warnings.
* **Deep Violet Critical** (#8126CF) - Used to flag entirely "Illegal" clauses, carrying the ultimate visual weight in the 4-tier risk system.

## 3. Typography Rules
* **Display & Headlines (Manrope)**: This is the "Editorial Voice." Manrope’s geometric yet friendly curves provide a modern, approachable authority. Used for massive hero statements (`text-5xl` to `text-7xl`) and section headers with tight letter-spacing (`tracking-tight`) and heavy weights (Bold to Black).
* **Body & Labels (Inter)**: This is the "Utility Voice." Inter provides maximum legibility for dense legal clauses and UI data. Primarily used at standard weight for body text. For structural labels and risk markers, it is used in uppercase with wide letter-spacing (`tracking-widest`) and a bold weight.

## 4. Component Stylings
* **Buttons:** 
  * *Primary:* Pill-shaped (`rounded-full`), featuring a rich linear gradient fill (Indigo to Light Indigo). Uses a soft tinted drop-shadow and a subtle scale-up micro-animation on hover.
  * *Secondary:* Pill-shaped (`rounded-full`), with a solid soft teal background (`bg-secondary-container`) and dark teal text. No borders.
* **Cards/Containers:** 
  * *Interactive Cards:* Generously rounded corners (1.5rem to 2rem). Typically pure white surfaces sitting on diffused, highly blurred drop shadows (`shadow-2xl`) to create lift without outlines.
  * *Feature Cards:* Utilize a thick, colorful 8px left border (`border-l-8`) spanning the card's height to assign it a specific risk category or accent color.
* **Risk Indicators (Badges):** Small, pill-shaped labels. The design forbids solid heavy boxes; instead, they use intensely saturated text set against a very soft, 10% opacity background of the identical hue (e.g., bright rose text on a pastel rose background).
* **Inputs/Forms:** Clean "wells" inside cards. They use a pure white background with a soft, 2px grey outline that transitions to a solid Vibrant Indigo stroke upon user focus.

## 5. Layout Principles
* **The No-Line Rule**: Prohibits the use of 1px solid borders to section off groups of content. Boundaries must be defined via background color shifts, generous whitespace, or soft shadows.
* **Whitespace & Padding**: Designs must leverage massive vertical whitespace (e.g., `py-24`, 6rem to 8rem) between overarching sections to give the "Guardian" aesthetic room to breathe and maintain a premium feel.
* **Layering over Flatness**: Avoid flat, contiguous colors. Achieve depth by stacking `surface-container` tiers (e.g., dropping a pure white card over a frosty violet section) to build a natural hierarchy of focus.
