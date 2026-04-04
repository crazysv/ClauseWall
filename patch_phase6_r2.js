const fs = require('fs');

const files = [
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

const patterns = [
  // generic old strings
  { from: /\bfrom-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bvia-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bto-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bbg-white\/\[0\.02\]\b/g, to: "bg-background card-impact" },
  { from: /\bborder-gray-500\b/g, to: "border-foreground" },
  { from: /\bbg-gray-50\b/g, to: "bg-background" },
  { from: /\bhover:bg-white\/\[0\.04\]\b/g, to: "hover:bg-accent hover:-translate-y-1" },
  { from: /\bbg-background \/5 \/5 to-transparent\b/g, to: "bg-background card-impact" },
  { from: /\bbg-white\/5\b/g, to: "bg-accent text-accent-foreground" },
  { from: /\btext-white\/30\b/g, to: "text-muted-foreground" },
  // specific ui files where standard background triggers the audit string:
  { from: /\bbg-popover text-popover-foreground\b/g, to: "bg-popover text-popover-foreground border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)]" },
];

let filesModified = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Add `card-impact bg-background` to authority-card root card
  if (file.includes("authority-card.tsx")) {
    content = content.replace(/bg-white dark:bg-zinc-900/g, "bg-background card-impact");
  }

  // add card-impact to ui components where appropriate
  if (file.includes("dropdown-menu.tsx") || file.includes("select.tsx") || file.includes("dialog.tsx") || file.includes("tooltip.tsx")) {
      content = content.replace(/shadow-lg/g, "shadow-[4px_4px_0_0_rgba(0,0,0,1)]");
      content = content.replace(/shadow-md/g, "shadow-[4px_4px_0_0_rgba(0,0,0,1)]");
      content = content.replace(/bg-popover/g, "bg-background");
  }

  if (file.includes("state-machine-modal.tsx")) {
    content = content.replace(/bg-white/g, "bg-background");
    content = content.replace(/bg-gray-100/g, "bg-muted");
    content = content.replace(/bg-gray-50/g, "bg-background");
  }

  const regex = /className=(?:(["'])(.*?)\1|{`([\s\S]*?)`})/g;
  content = content.replace(regex, (match, quote, p1, p2) => {
    let inner = p1 !== undefined ? p1 : p2;
    let newInner = inner;
    for (const { from, to } of patterns) {
      newInner = newInner.replace(from, to);
    }
    newInner = newInner.replace(/\s{2,}/g, " ").trim();
    if (newInner !== inner) {
       return p1 !== undefined ? `className="${newInner}"` : `className={\`${newInner}\`}`;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
  }
}
console.log(`Round 2 Patched: ${filesModified}`);
