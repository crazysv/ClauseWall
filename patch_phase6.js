const fs = require('fs');

const files = [
  "components/market/market-overview-cards.tsx",
  "components/lawchange/law-change-card.tsx",
  "components/collective/collective-dashboard.tsx",
  "components/collective/my-collectives-section.tsx",
  "components/statemachine/state-machine-modal.tsx",
  "components/ui/dialog.tsx",
  "components/ui/select.tsx",
  "components/ui/tooltip.tsx",
  "components/ui/dropdown-menu.tsx",
  "components/authority/authority-card.tsx"
];

// Refinements per User constraints
const patterns = [
  // 1. market-overview-cards.tsx (gradients to solid bg-muted, maintaining text color semantics)
  { from: /\bfrom-cyan-500\/10 to-blue-500\/10\b/g, to: "bg-cyan-50 dark:bg-cyan-950" },
  { from: /\bfrom-green-500\/10 to-emerald-500\/10\b/g, to: "bg-green-50 dark:bg-green-950" },
  { from: /\bfrom-purple-500\/10 to-pink-500\/10\b/g, to: "bg-purple-50 dark:bg-purple-950" },
  { from: /\bfrom-amber-500\/10 to-orange-500\/10\b/g, to: "bg-amber-50 dark:bg-amber-950" },
  { from: /\bfrom-blue-500\/10 to-indigo-500\/10\b/g, to: "bg-blue-50 dark:bg-blue-950" },
  { from: /\bfrom-rose-500\/10 to-red-500\/10\b/g, to: "bg-rose-50 dark:bg-rose-950" },
  { from: /\bbg-background (bg-[a-z]+-50) (dark:bg-[a-z]+-950) border-[a-z]+-500\/15\b/g, to: "$1 $2 border-[a-z]+-500 border-2 card-impact" },
  
  // 2. law-change-card.tsx
  { from: /\bbg-white\/\[0\.02\] border-foreground border-2 hover:border-indigo-500\/20\b/g, to: "bg-card card-impact border-2 border-foreground hover:border-foreground/80 hover:-translate-y-1" },
  
  // 3. collective-dashboard.tsx & my-collectives-section.tsx
  { from: /\bbg-background \/5 \/5 to-transparent\b/g, to: "bg-background card-impact" },
  { from: /\bbg-amber-500\/10 text-amber-400\b/g, to: "bg-amber-500 text-white font-bold" },
  { from: /\btext-foreground\/40\b/g, to: "text-muted-foreground" },
  { from: /\btext-foreground\/30\b/g, to: "text-muted-foreground" },
  { from: /\btext-foreground\/60\b/g, to: "text-foreground" },
  { from: /\bborder-amber-500\/10 bg-white\/\[0\.02\] hover:bg-white\/\[0\.04\] hover:border-amber-500\/20\b/g, to: "card-impact bg-card border-foreground border-2 hover:-translate-y-1 hover:shadow-[4px_4px_border-amber-500]" },
  { from: /\bbg-white\/\[0\.02\]\b/g, to: "bg-accent/50" },

  // 4. state-machine-modal.tsx & authority-card.tsx
  { from: /\bbg-white border-4 border-black shadow-\[12px_12px_0_0_rgba\(0,0,0,1\)\]\b/g, to: "bg-background border-4 border-foreground shadow-[12px_12px_0_0_rgba(0,0,0,1)]" },
  { from: /\bshadow-\[4px_4px_0px_0px_rgba\(([\d,]+),1\)\]\b/g, to: "shadow-[4px_4px_0px_0px_rgba($1,1)]" }, // keep them if they are solid rgba, just format check
  
  // 5. ui/*.tsx
  // No rounded-none strictly for UI primitives if we want to keep consistency. But we make shadows/borders sharp
  { from: /\bshadow-md\b/g, to: "shadow-[4px_4px_0_0_rgba(0,0,0,1)]" },
  { from: /\bshadow-lg\b/g, to: "shadow-[4px_4px_0_0_rgba(0,0,0,1)]" }
];

let filesModified = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  
  const original = content;

  // Granular replacements for specific ui files 
  if (file.endsWith("ui/dialog.tsx")) {
    content = content.replace(/gap-4 border-2 border-foreground bg-background p-8 shadow-lg/g, "gap-4 border-2 border-foreground bg-background p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]");
    content = content.replace(/bg-black\/60/g, "bg-black/80"); // higher contrast overlay
    content = content.replace(/opacity-70 transition-opacity hover:opacity-100/g, "hover:bg-accent hover:text-accent-foreground p-1 transition-colors border border-transparent hover:border-foreground");
  } 
  if (file.endsWith("ui/select.tsx")) {
    content = content.replace(/shadow-xs/g, "shadow-[2px_2px_0_0_rgba(0,0,0,1)]");
    content = content.replace(/shadow-lg/g, "shadow-[4px_4px_0_0_rgba(0,0,0,1)]");
    content = content.replace(/dark:bg-input\/30 dark:hover:bg-input\/50/g, "hover:bg-accent");
  }

  // Regex rules
  const regex = /className=(?:(["'])(.*?)\1|{`([\s\S]*?)`})/g;
  content = content.replace(regex, (match, quote, p1, p2) => {
    let inner = p1 !== undefined ? p1 : p2;
    let newInner = inner;
    for (const { from, to } of patterns) {
      newInner = newInner.replace(from, to);
    }
    
    // clean duplicates
    newInner = newInner.replace(/\bcard-impact\s+card-impact\b/g, "card-impact");
    newInner = newInner.replace(/\s{2,}/g, " ").trim();

    if (newInner !== inner) {
       return p1 !== undefined ? `className="${newInner}"` : `className={\`${newInner}\`}`;
    }
    return match;
  });

  // some manual exact replaces outside of className for string literals or template literals
  for (const { from, to } of patterns) {
    content = content.replace(from, to);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
  }
}
console.log(`Phase 6 Edge Cases Patched: ${filesModified}`);
