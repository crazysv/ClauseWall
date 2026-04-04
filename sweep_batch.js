const fs = require('fs');

const files = [
  "app/builder/page.tsx",
  "app/builder/[type]/page.tsx",
  "app/collab/[roomCode]/page.tsx",
  "app/collective/[collectiveId]/page.tsx",
  "app/complaint/[documentId]/page.tsx",
  "app/evidence/[caseId]/bundle/page.tsx",
  "app/market/benchmarks/page.tsx",
  "app/market/compare/page.tsx",
  "app/market/heatmap/page.tsx",
  "app/market/page.tsx",
  "app/results/[id]/page.tsx",
  "app/shadow/page.tsx",
  "app/simulate/[id]/page.tsx",
  "app/upload/page.tsx",
  "app/verify/[id]/page.tsx",
  "app/wall-of-shame/page.tsx",
  "app/watchdog/campaigns/[id]/page.tsx",
  "app/watchdog/changes/[id]/page.tsx",
  "app/watchdog/companies/[slug]/page.tsx",
  "app/watchdog/leaderboard/page.tsx",
  "app/watchdog/page.tsx",
  "app/watchdog/settings/page.tsx",
  "components/authority/authority-card.tsx",
  "components/authority/authority-detail.tsx",
  "components/authority/complaint-email-preview.tsx",
  "components/authority/fee-breakdown.tsx",
  "components/authority/filing-checklist.tsx",
  "components/authority/legal-aid-result.tsx",
  "components/authority/report-issue-modal.tsx",
  "components/authority/rti-preview.tsx",
  "components/bhasha/text-correction-modal.tsx",
  "components/collab/clause-vote.tsx",
  "components/collab/presence-bar.tsx",
  "components/collab/share-room-modal.tsx",
  "components/collective/collective-dashboard.tsx",
  "components/collective/join-collective-modal.tsx",
  "components/collective/my-collectives-section.tsx",
  "components/collective/threshold-progress.tsx",
  "components/compare/comparison-card-modal.tsx",
  "components/complaint/complaint-dashboard-widget.tsx",
  "components/deliberation/deliberation-cta.tsx",
  "components/deliberation/deliberation-modal.tsx",
  "components/deliberation/deliberation-panel.tsx",
  "components/deliberation/deliberation-summary.tsx",
  "components/deliberation/document-deliberation.tsx",
  "components/evidence/evidence-chain-visualizer.tsx",
  "components/evidence/evidence-item-card.tsx",
  "components/graph/graph-canvas.tsx",
  "components/lawchange/law-change-card.tsx",
  "components/lawchange/law-change-summary-card.tsx",
  "components/market/benchmark-table.tsx",
  "components/market/market-comparison-section.tsx",
  "components/market/market-overview-cards.tsx",
  "components/negotiate/audio-companion-panel.tsx",
  "components/negotiate/bluff-detector-panel.tsx",
  "components/negotiate/camera-scanner-panel.tsx",
  "components/negotiate/floating-lookup-bar.tsx",
  "components/negotiate/progress-tracker-panel.tsx",
  "components/negotiate/quick-lookup-panel.tsx",
  "components/negotiate/session-setup.tsx",
  "components/negotiate/tactic-alert.tsx",
  "components/poisonpill/interconnection-map.tsx",
  "components/poisonpill/negotiation-roadmap.tsx",
  "components/poisonpill/poison-pill-cta.tsx",
  "components/poisonpill/poison-pill-section.tsx",
  "components/poisonpill/trap-card.tsx",
  "components/poisonpill/trap-mechanism-flow.tsx",
  "components/poisonpill/trap-summary-bar.tsx",
  "components/results/clause-autopsy-modal.tsx",
  "components/results/clause-rewrite-modal.tsx",
  "components/results/contract-dna-modal.tsx",
  "components/results/entity-reputation.tsx",
  "components/results/knowledge-graph-modal.tsx",
  "components/results/proof-tree.tsx",
  "components/results/proof-walkthrough.tsx",
  "components/results/qr-section.tsx",
  "components/results/xray-mode.tsx",
  "components/ruin-calculator/risk-clause-ranking.tsx",
  "components/shadow/evidence-upload.tsx",
  "components/shadow/shadow-cta.tsx",
  "components/shared/related-actions.tsx",
  "components/statemachine/report-card.tsx",
  "components/statemachine/state-machine-modal.tsx",
  "components/timebomb/notification-bell.tsx",
  "components/timebomb/reminder-settings.tsx",
  "components/ui/dialog.tsx",
  "components/ui/dropdown-menu.tsx",
  "components/ui/select.tsx",
  "components/ui/tooltip.tsx",
  "components/upload/quick-scan-result.tsx",
  "components/voice-aid/voice-message-bubble.tsx",
  "components/watchdog/alert-panel.tsx",
  "components/watchdog/campaign-card.tsx",
  "components/watchdog/campaign-sign-form.tsx",
  "components/watchdog/change-card.tsx",
  "components/watchdog/company-card.tsx",
  "components/watchdog/leaderboard-table.tsx",
  "components/watchdog/sector-filter.tsx",
  "components/watchdog/tos-timeline.tsx"
];

const patterns = [
  { from: /\bglass\b/g, to: "card-impact" },
  { from: /\bbackdrop-blur[-a-z]*\b/g, to: "" },
  { from: /\brounded-(3xl|2xl|xl|lg|md|sm)\b/g, to: "rounded-none" },
  { from: /\btext-white(\/[0-9]+)?\b/g, to: "text-foreground" },
  { from: /\btext-gray-[3456]00\b/g, to: "text-muted-foreground" },
  { from: /\btext-gray-[12]00\b/g, to: "text-foreground" },
  { from: /\bbg-white\/(\[0\.0\d+\]|\d+)\b/g, to: "bg-muted" },
  { from: /\bborder-white\/(\[0\.0\d+\]|\d+)\b/g, to: "border-foreground border-2" },
  { from: /\bborder-gray-[789]\d{2}\b/g, to: "border-foreground border-2" },
  { from: /\bborder(?:-r|-b|-t|-l|-x|-y)?-white\/\d+\b/g, to: "border-foreground border-2" },
  { from: /\bbg-gray-[89]\d{2}\b/g, to: "bg-background border-2 border-foreground card-impact" },
  { from: /\bbg-gradient-to[-a-z]*\b/g, to: "bg-background" },
  { from: /\bfrom-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bvia-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bto-[a-z]+-\d+(\/\d+)?\b/g, to: "" },
  { from: /\bdark:bg-gray-[89]\d{2}\b/g, to: "dark:bg-background" },
  { from: /\bshadow-2xl\b/g, to: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" },
  { from: /\bshadow-lg\b/g, to: "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none" },
  { from: /\bshadow-xl\b/g, to: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" },
  { from: /\bhover:bg-white\/[0-9]+\b/g, to: "hover:bg-accent hover:text-accent-foreground" }
];

let filesModified = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
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
    newInner = newInner.replace(/\bbg-background\s+bg-background\b/g, "bg-background");
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

console.log(`Successfully patched ${filesModified} files.`);
