const fs = require('fs');
const path = require('path');

const targetFiles = [
  'app/market/page.tsx',
  'app/market/benchmarks/page.tsx',
  'app/market/compare/page.tsx',
  'app/market/heatmap/page.tsx',
  'app/market/trends/page.tsx',
  'app/watchdog/page.tsx',
  'app/watchdog/companies/page.tsx',
  'app/watchdog/companies/[slug]/page.tsx',
  'app/watchdog/changes/[id]/page.tsx',
  'app/watchdog/campaigns/page.tsx',
  'app/watchdog/campaigns/[id]/page.tsx',
  'app/watchdog/leaderboard/page.tsx',
  'app/watchdog/settings/page.tsx',
  'app/collective/page.tsx',
  'app/collective/[collectiveId]/page.tsx',
  'app/wrapped/page.tsx',
  'app/voice/page.tsx',
  'app/voice/client.tsx',
  'app/lawchange/page.tsx'
];

const componentDirs = [
  'components/market',
  'components/watchdog',
  'components/collective',
  'components/voice',
  'components/voice-aid',
  'components/lawchange'
];

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

for (const dir of componentDirs) {
  getAllFiles(dir, targetFiles);
}

const badPatterns = [
  /class[A-Za-z0-9]*=["'][^"']*?\bglass\b[^"']*?["']/g,
  /class[A-Za-z0-9]*=["'][^"']*?\bbackdrop-blur\b[^"']*?["']/g,
  /class[A-Za-z0-9]*=["'][^"']*?\brounded-(2xl|3xl)\b[^"']*?["']/g,
  /class[A-Za-z0-9]*=["'][^"']*?\bbg-gradient-[^"']*?["']/g,
  /class[A-Za-z0-9]*=["'][^"']*?\bbg-white\/\[0\.0[0-9]+\]\b[^"']*?["']/g,
  /class[A-Za-z0-9]*=["'][^"']*?\bborder-white\/[0-9]+\b[^"']*?["']/g,
];

const needsPatching = [];
const consistent = [];

for (const rawFile of targetFiles) {
  const file = rawFile.replace(/\\/g, '/');
  if (!fs.existsSync(file)) {
    console.log("Missing:", file);
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  let isBad = false;
  for (const pat of badPatterns) {
    if (pat.test(content)) {
      isBad = true;
      break;
    }
  }

  // Also check if text-impact-heading or card-impact is missing when it probably should have it,
  // but let's stick to explicit bad patterns and general check
  if (isBad) {
    needsPatching.push(file);
  } else {
    consistent.push(file);
  }
}

console.log("NEEDS PATCHING:", JSON.stringify(needsPatching, null, 2));
console.log("CONSISTENT:", JSON.stringify(consistent, null, 2));
