const fs = require('fs');
const path = require('path');

const targetDirs = [
  'app',
  'components/shared',
  'components/ui',
  'components/upload',
  'components/results',
  'components/dashboard',
  'components/negotiate',
  'components/letter',
  'components/market',
  'components/watchdog',
  'components/authority',
  'components/collective'
];

function findFiles(dirs) {
  let results = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const list = fs.readdirSync(dir);
    for (const file of list) {
       const fullPath = path.join(dir, file);
       const stat = fs.statSync(fullPath);
       if (stat && stat.isDirectory()) {
         results = results.concat(findFiles([fullPath]));
       } else if (fullPath.endsWith('.tsx')) {
         results.push(fullPath);
       }
    }
  }
  return results;
}

const badPatterns = [
  { regex: /\btext-(white|black)\/(30|40|50|60)\b/g, reason: "low opacity text" },
  { regex: /\btext-muted-foreground\b/g, reason: "muted text, maybe low contrast" },
  { regex: /\bbg-[a-z]+-50\s+text-[a-z]+-400\b/g, reason: "light bg with light text" },
  { regex: /\bbg-[a-z]+-900\s+text-[a-z]+-800\b/g, reason: "dark bg with dark text" },
  { regex: /\bbg-black\s+text-[a-z]+-\d+\b/g, reason: "inspect black bg contrast" },
  { regex: /\btext-foreground\/[1-5]0\b/g, reason: "highly transparent foreground text" },
  { regex: /\bbg-white\s+text-gray-400\b/g, reason: "faint gray on white" },
  { regex: /\bbg-accent\/50\s+text-muted-foreground\b/g, reason: "muted text on tinted background" }
];

const results = {};

const files = findFiles(targetDirs);
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let issues = [];
  
  for (const p of badPatterns) {
    const matches = content.match(p.regex);
    if (matches) {
       issues.push({ reason: p.reason, count: matches.length, samples: [...new Set(matches)].slice(0, 3) });
    }
  }
  
  if (issues.length > 0) {
    results[file] = issues;
  }
}

fs.writeFileSync('contrast_report.json', JSON.stringify(results, null, 2));
console.log('Contrast audit complete. Wrote to contrast_report.json.');
