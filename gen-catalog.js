const fs = require('fs');
const path = require('path');

const files = [
  'app/complaint/page.tsx',
  'app/complaint/[documentId]/page.tsx',
  'app/authority/page.tsx',
  'app/authority/[authorityId]/page.tsx',
  'app/authority/escalation/page.tsx',
  'app/authority/legal-aid/page.tsx',
  'app/authority/rti/page.tsx',
  'app/authority/rti/[documentId]/page.tsx',
  'app/evidence/page.tsx',
  'app/evidence/new/page.tsx',
  'app/evidence/[caseId]/page.tsx',
  'app/evidence/[caseId]/bundle/page.tsx',
  'app/builder/page.tsx',
  'app/builder/[type]/page.tsx',
  'app/builder/preview/[id]/page.tsx',
  'app/verify/[id]/page.tsx',
  'components/complaint/complaint-cta.tsx',
  'components/complaint/complaint-dashboard-widget.tsx',
  'components/complaint/complaint-dashboard-widget-wrapper.tsx',
  'components/authority/authority-card.tsx',
  'components/authority/authority-contact-buttons.tsx',
  'components/authority/authority-detail.tsx',
  'components/authority/authority-finder.tsx',
  'components/authority/authority-hours-badge.tsx',
  'components/authority/authority-search-bar.tsx',
  'components/authority/authority-section.tsx',
  'components/authority/complaint-email-preview.tsx',
  'components/authority/escalation-countdown.tsx',
  'components/authority/escalation-path-visualizer.tsx',
  'components/authority/escalation-step-card.tsx',
  'components/authority/fee-breakdown.tsx',
  'components/authority/filing-checklist.tsx',
  'components/authority/jurisdiction-reasoning.tsx',
  'components/authority/jurisdiction-result.tsx',
  'components/authority/legal-aid-checker.tsx',
  'components/authority/legal-aid-result.tsx',
  'components/authority/not-this-authority.tsx',
  'components/authority/report-issue-modal.tsx',
  'components/authority/rti-form.tsx',
  'components/authority/rti-preview.tsx',
  'components/evidence/chain-status-badge.tsx',
  'components/evidence/evidence-case-card.tsx',
  'components/evidence/evidence-chain-visualizer.tsx',
  'components/evidence/evidence-item-card.tsx',
  'components/evidence/evidence-stats.tsx',
  'components/evidence/evidence-timeline.tsx',
  'components/evidence/evidence-type-icon.tsx',
  'components/evidence/evidence-upload-zone.tsx',
  'components/evidence/storage-usage-bar.tsx',
  'components/embed/embed-code-modal.tsx'
];

let catalog = '';

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  
  catalog += '\n**' + file + '**\n';
  
  const importsMatch = Array.from(content.matchAll(/^import .*;$/gm)).map(m => m[0]);
  const statesMatch = Array.from(content.matchAll(/const \[[a-zA-Z0-9]+, set[a-zA-Z0-9]+\] = useState/g)).map(m => m[0]);
  const effectsMatch = content.includes('useEffect(') ? 'Uses useEffect' : 'No useEffect';
  const apiMatch = Array.from(content.matchAll(/fetch\([^\)]+\)/g)).map(m => m[0]);
  const handlersMatch = Array.from(content.matchAll(/const handle[a-zA-Z0-9]+ =/g)).map(m => m[0]);
  const routerMatch = content.includes('useRouter') || content.includes('<Link') || content.includes('router.') ? 'Uses navigation/router' : 'No explicit router/Link';
  const returnsMatch = content.includes('? (') || content.includes('&& (') || content.includes('? <') || content.includes('&& <') || content.includes('(!') || content.includes('if (');
  
  catalog += '1. Imports: ' + (importsMatch.length > 0 ? importsMatch.slice(0, 3).join(', ').substring(0, 50) + ' ...' : 'None') + '\n';
  catalog += '2. State: ' + (statesMatch.length > 0 ? statesMatch.slice(0, 5).join(', ') : 'None') + '\n';
  catalog += '3. Effects: ' + effectsMatch + '\n';
  catalog += '4. API Calls: ' + (apiMatch.length > 0 ? apiMatch.slice(0, 3).join(', ') : 'None') + '\n';
  catalog += '5. Handlers: ' + (handlersMatch.length > 0 ? handlersMatch.slice(0, 4).join(', ') : 'None') + '\n';
  catalog += '6. Navigation: ' + routerMatch + '\n';
  catalog += '7. Conditionals: ' + (returnsMatch ? 'Yes' : 'No') + '\n';
});

fs.writeFileSync('catalog.txt', catalog);
console.log('Catalog generated successfully.');
