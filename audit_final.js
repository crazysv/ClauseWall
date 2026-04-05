const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['app', 'components'];
const FRONTEND_EXTENSIONS = ['.tsx', '.jsx', '.ts'];

const LEGACY_TOKENS = [
  'glass',
  'backdrop-blur',
  'rounded-3xl',
  'bg-gradient-',
  'from-',
  'via-',
  'to-',
  'bg-white/[',
  'border-white/[',
  'bg-gray-900/80',
  'opacity-[0\\.\\d+]',
];

const BOLD_IMPACT_TOKENS = [
  'card-impact',
  'bg-background',
  'border-foreground',
  'shadow-[',
  'font-black',
  'uppercase',
  'tracking-widest'
];

const RESPONSIVE_TOKENS = [
  'flex-wrap',
  'overflow-x-auto',
  'overflow-y-auto',
  'overflow-hidden',
  'grid-cols-',
  'sm:',
  'md:',
  'lg:',
  'xl:'
];

const report = {
  totalFiles: 0,
  verifiedUpdated: 0,
  partiallyUpdated: 0,
  notUpdated: 0,
  notApplicable: 0,
  legacyInstances: {},
  boldImpactInstances: {},
  demoRoutes: {},
  filesData: {}
};

// Initialize tracking
LEGACY_TOKENS.forEach(t => report.legacyInstances[t] = []);

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else {
      if (FRONTEND_EXTENSIONS.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  });
  return results;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  report.totalFiles++;

  if (!content.includes('className') && !content.includes('export default')) {
    report.notApplicable++;
    return;
  }

  const legacyMatches = [];
  LEGACY_TOKENS.forEach(token => {
    // Escaping [ for regex
    const regexSafe = token.replace(/\[/g, '\\[').replace(/\//g, '\\/');
    const regex = new RegExp(`\\b${regexSafe}\\b|${regexSafe}`, 'g');
    if (regex.test(content)) {
      legacyMatches.push(token);
      if (!report.legacyInstances[token].includes(filePath)) {
        report.legacyInstances[token].push(filePath);
      }
    }
  });

  const boldMatches = BOLD_IMPACT_TOKENS.filter(t => content.includes(t));
  const responsiveMatches = RESPONSIVE_TOKENS.filter(t => content.includes(t));

  const hasLegacy = legacyMatches.length > 0;
  const hasBold = boldMatches.length > 0;

  let status = 'VERIFIED UPDATED';
  if (hasLegacy && hasBold) {
     status = 'PARTIALLY UPDATED';
     report.partiallyUpdated++;
  } else if (hasLegacy && !hasBold) {
     status = 'NOT UPDATED';
     report.notUpdated++;
  } else {
     report.verifiedUpdated++;
  }

  report.filesData[filePath] = {
    status,
    legacyMatches,
    boldMatches,
    responsiveCoverage: responsiveMatches.length,
    hasUseClient: content.includes('"use client"') || content.includes("'use client'"),
    isPage: filePath.endsWith('page.tsx') || filePath.endsWith('page.jsx'),
  };
}

// 1. Coverage Audit
DIRECTORIES.forEach(dir => {
  const files = walkDir(dir);
  files.forEach(auditFile);
});

// 2. Demo-Critical Flows Audit
const demoRoutesToCheck = [
  'app/page.tsx',           // landing -> upload
  'app/upload/page.tsx',    // upload -> analyze
  'app/analyze/[id]/page.tsx', // analyze -> results
  'app/results/[id]/page.tsx', // results
  'app/letter/page.tsx',    // results -> letter
  'app/negotiate/[id]/page.tsx', // results -> negotiate
  'app/dashboard/page.tsx', // dashboard
  'app/wall-of-shame/page.tsx', // wall of shame
  'app/verify/page.tsx',    // verify
  'app/market/page.tsx',    // market
  'app/watchdog/page.tsx',  // watchdog
  'app/collective/page.tsx' // collective
];

demoRoutesToCheck.forEach(route => {
  const normPath = path.normalize(route);
  if (fs.existsSync(normPath)) {
     const content = fs.readFileSync(normPath, 'utf8');
     // Check if it imports components successfully
     report.demoRoutes[route] = {
       exists: true,
       hasDefaultExport: content.includes('export default'),
       hasLinks: content.includes('<Link') || content.includes('href=') || content.includes('useRouter')
     };
  } else {
     report.demoRoutes[route] = { exists: false };
  }
});

fs.writeFileSync('final_readiness_audit.json', JSON.stringify(report, null, 2));
console.log('Final audit complete.');
