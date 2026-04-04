const fs = require('fs');

const files = [
  "app/market/page.tsx",
  "app/market/compare/page.tsx",
  "app/market/trends/page.tsx",
  "app/watchdog/page.tsx",
  "app/watchdog/companies/[slug]/page.tsx",
  "app/watchdog/campaigns/[id]/page.tsx",
  "app/collective/page.tsx",
  "app/wrapped/page.tsx",
  "components/market/ammunition-report-modal.tsx",
  "components/market/benchmark-chart.tsx",
  "components/market/category-filter-bar.tsx",
  "components/market/data-contribution-banner.tsx",
  "components/market/market-comparison-section.tsx",
  "components/market/market-empty-state.tsx",
  "components/market/market-stats-footer.tsx",
  "components/market/trend-insight-card.tsx",
  "components/watchdog/campaign-card.tsx",
  "components/watchdog/change-diff-view.tsx",
  "components/watchdog/company-card.tsx",
  "components/watchdog/leaderboard-table.tsx",
  "components/watchdog/tos-score-badge.tsx",
  "components/watchdog/tos-timeline.tsx",
  "components/collective/collective-action-card.tsx",
  "components/collective/collective-chat.tsx",
  "components/collective/collective-dashboard.tsx",
  "components/collective/entity-intelligence-card.tsx",
  "components/collective/legal-aid-card.tsx",
  "components/collective/leverage-card.tsx",
  "components/collective/propose-action-modal.tsx",
  "components/voice-aid/camera-capture-button.tsx",
  "components/voice-aid/language-selector.tsx",
  "components/voice-aid/voice-floating-button.tsx",
  "components/voice-aid/voice-interface.tsx",
  "components/lawchange/impact-card.tsx",
  "components/lawchange/law-change-dashboard-widget.tsx",
  "components/lawchange/law-change-feed.tsx",
  "components/lawchange/pending-change-card.tsx",
  "components/lawchange/retroactive-banner.tsx"
];

const classMap = [
  { from: /\bglass\border-white\/5\b/g, to: "card-impact" },
  { from: /\bglass\b/g, to: "card-impact shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none" },
  { from: /\bbackdrop-blur-?(sm|md|lg|xl)?\b/g, to: "" },
  { from: /\brounded-(3xl|2xl|xl)\b/g, to: "rounded-none" },
  { from: /\bbg-white\/\[0\.0[0-9]+\]\b/g, to: "bg-background" },
  { from: /\bbg-white\/(5|10|20)\b/g, to: "bg-muted" },
  { from: /\bborder-white\/[0-9]+\b/g, to: "border-foreground border-2" },
  { from: /\btext-white\b/g, to: "text-foreground" },
  { from: /\btext-white\/[0-9]+\b/g, to: "text-muted-foreground" },
  { from: /\bgray-900\b/g, to: "background" },
  { from: /\bgray-950\b/g, to: "background" },
  { from: /\bshadow-2xl\b/g, to: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-foreground" },
  { from: /\bbg-gradient-to-[a-z]+\b/g, to: "bg-background" },
  { from: /\bfrom-[a-z]+-[0-9]+\b/g, to: "" },
  { from: /\bto-[a-z]+-[0-9]+\b/g, to: "" },
  { from: /\bvia-[a-z]+-[0-9]+\b/g, to: "" },
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Find all className="xyz" or className={`xyz`} strings and only replace inside them
  const regex = /className=(?:(["'])(.*?)\1|{`([\s\S]*?)`})/g;
  
  content = content.replace(regex, (match, quote, p1, p2) => {
    let inner = p1 !== undefined ? p1 : p2;
    for (const { from, to } of classMap) {
      inner = inner.replace(from, to);
    }
    // Clean up multiple spaces
    inner = inner.replace(/\s{2,}/g, ' ').trim();
    if (p1 !== undefined) {
      return `className="${inner}"`;
    } else {
      return `className={\`${inner}\`}`;
    }
  });

  fs.writeFileSync(file, content, 'utf8');
}
