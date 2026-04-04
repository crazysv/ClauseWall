const fs = require('fs');

const files = [
  "app/statemachine/[id]/page.tsx",
  "components/authority/authority-card.tsx",
  "components/collective/my-collectives-section.tsx",
  "components/shadow/mismatch-card.tsx",
  "components/statemachine/state-machine-modal.tsx",
  "components/ui/dropdown-menu.tsx",
  "components/watchdog/company-grid.tsx",
  "app/builder/preview/[id]/page.tsx",
  "app/watchdog/campaigns/page.tsx",
  "components/collective/collective-dashboard.tsx",
  "components/lawchange/law-change-card.tsx",
  "components/market/market-overview-cards.tsx",
  "components/ui/dialog.tsx",
  "components/ui/select.tsx",
  "components/ui/tooltip.tsx"
];

const patterns = [
  { from: /\bglass\b/g, to: "card-impact" },
  { from: /\bbackdrop-blur[-a-z]*\b/g, to: "" },
  { from: /\brounded-(3xl|2xl|xl|lg|md|sm)\b/g, to: "rounded-none" },
  { from: /\btext-white(\/[0-9]+)?\b/g, to: "text-foreground" },
  { from: /\btext-gray-[3456]00\b/g, to: "text-muted-foreground" },
  { from: /\btext-gray-[12]00\b/g, to: "text-foreground" },
  { from: /\bfocus:text-gray-100\b/g, to: "focus:text-foreground" },
  { from: /\bfocus:text-white\b/g, to: "focus:text-foreground" },
  { from: /\bbg-white\/(\[0\.0\d+\]|\d+)\b/g, to: "bg-muted" },
  { from: /\bfocus:bg-white\/[0-9]+\b/g, to: "focus:bg-accent" },
  { from: /\bhhover:bg-white\/[0-9]+\b/g, to: "hover:bg-accent" },
  { from: /\bborder-white\/(\[0\.0\d+\]|\d+)\b/g, to: "border-foreground border-2" },
  { from: /\bborder-gray-[789]\d{2}\b/g, to: "border-foreground border-2" },
  { from: /\bborder(?:-r|-b|-t|-l|-x|-y)?-white\/\d+\b/g, to: "border-foreground border-2" },
  { from: /\bbg-gray-[89]\d{2}\b/g, to: "bg-background border-2 border-foreground bg-popover" },
  { from: /\bbg-gradient-to[-a-z]*\b/g, to: "" },
  { from: /\bfrom-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bvia-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bto-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bshadow-2xl\b/g, to: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" },
  { from: /\bshadow-lg\b/g, to: "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none" },
  { from: /\bshadow-xl\b/g, to: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" },
  { from: /\bhover:bg-white\/[0-9]+\b/g, to: "hover:bg-accent hover:text-accent-foreground" }
];

let filesModified = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
      console.log("Missing:", file);
      continue;
  }
  let hasChanges = false;
  let content = fs.readFileSync(file, "utf8");

  // We operate ONLY within className="xyz" or className={`xyz`} attributes
  const regex = /className=(?:(["'])(.*?)\1|{`([\s\S]*?)`})/g;

  content = content.replace(regex, (match, quote, p1, p2) => {
    let inner = p1 !== undefined ? p1 : p2;
    let newInner = inner;
    for (const { from, to } of patterns) {
      newInner = newInner.replace(from, to);
    }
    
    // De-duplication logic and spacing
    newInner = newInner.replace(/\bcard-impact\s+card-impact\b/g, "card-impact");
    newInner = newInner.replace(/\bborder-2\s+border-2\b/g, "border-2");
    newInner = newInner.replace(/\bbg-background\s+bg-popover\b/g, "bg-popover");
    newInner = newInner.replace(/\bbg-muted\s+bg-muted\b/g, "bg-muted");
    newInner = newInner.replace(/\bborder-foreground\s+border-foreground\b/g, "border-foreground");
    newInner = newInner.replace(/\brounded-none\s+rounded-none\b/g, "rounded-none");
    newInner = newInner.replace(/\s{2,}/g, " ").trim();

    if (newInner !== inner) {
      hasChanges = true;
    }

    if (p1 !== undefined) {
      return `className="${newInner}"`;
    } else {
      return `className={\`${newInner}\`}`;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(file, content, "utf8");
    filesModified++;
  }
}

console.log(`Successfully patched ${filesModified} tiny files.`);
