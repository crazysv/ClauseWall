const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'api' && file !== 'lib' && file !== '.next' && file !== 'node_modules') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.tsx')) {
        arrayOfFiles.push(fullPath.replace(/\\/g, '/'));
      }
    }
  });

  return arrayOfFiles;
}

let allFiles = [];
for (const dir of targetDirs) {
  getAllFiles(dir, allFiles);
}

const legacyPatterns = [
  { name: "glass", regex: /\bglass\b/g },
  { name: "backdrop-blur", regex: /\bbackdrop-blur[-a-z]*\b/g },
  { name: "rounded-3xl", regex: /\brounded-3xl\b/g },
  { name: "bg-gradient-", regex: /\bbg-gradient-to[-a-z]*\b/g },
  { name: "from-", regex: /\bfrom-[a-z]+-\d+\b/g },
  { name: "via-", regex: /\bvia-[a-z]+-\d+\b/g },
  { name: "to-", regex: /\bto-[a-z]+-\d+\b/g },
  { name: "bg-white/[N]", regex: /\bbg-white\/(\[0\.0\d+\]|\d+)\b/g },
  { name: "border-white/[N]", regex: /\bborder-white\/(\[0\.0\d+\]|\d+)\b/g },
  { name: "bg-gray-", regex: /\bbg-gray-[89]\d{2}\b/g },
  { name: "border-gray-", regex: /\bborder-gray-[89]\d{2}\b/g }
];

const compliantPatterns = [
  { name: "card-impact", regex: /\b(?:card-impact|card-impact-emphasis)\b/g },
  { name: "bg-background", regex: /\bbg-background\b/g },
  { name: "border-foreground", regex: /\bborder-foreground\b/g },
  { name: "shadow-hard", regex: /\bshadow-\[.*rgba\(0,0,0,1\).*\]\b/g },
  { name: "text-impact-heading", regex: /\btext-impact-(?:heading|subheading)\b/g }
];

const results = {
  totalAudited: 0,
  verifiedUpdated: 0,
  partiallyUpdated: 0,
  notUpdated: 0,
  notApplicable: 0,
  modules: {},
  missedFiles: [],
  partialFiles: [],
  remnants: {
    "glass": [],
    "backdrop-blur": [],
    "rounded-3xl": [],
    "gradients": [],
    "other_old": []
  }
};

for (const file of allFiles) {
  // Determine module
  const parts = file.split('/');
  let moduleName = 'unknown';
  if (parts[0] === 'app') {
    moduleName = parts.length > 2 ? parts[1] : 'root';
  } else if (parts[0] === 'components') {
    moduleName = parts.length > 2 ? parts[1] : 'root';
  }

  if (!results.modules[moduleName]) {
    results.modules[moduleName] = { pages: 0, components: 0, verified: 0, partial: 0, missing: 0, na: 0 };
  }

  // Count UI vs Pages
  if (parts[0] === 'app') {
    results.modules[moduleName].pages++;
  } else {
    results.modules[moduleName].components++;
  }

  const content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('className=') && !content.includes('className={')) {
    results.notApplicable++;
    results.modules[moduleName].na++;
    continue;
  }

  results.totalAudited++;

  let hasOld = false;
  let hasNew = false;
  let oldMatches = new Set();
  
  for (const p of legacyPatterns) {
    if (p.regex.test(content)) {
      hasOld = true;
      oldMatches.add(p.name);
      
      if (p.name === 'glass') results.remnants['glass'].push(file);
      else if (p.name === 'backdrop-blur') results.remnants['backdrop-blur'].push(file);
      else if (p.name === 'rounded-3xl') results.remnants['rounded-3xl'].push(file);
      else if (['bg-gradient-', 'from-', 'via-', 'to-'].includes(p.name)) {
        if (!results.remnants['gradients'].includes(file)) results.remnants['gradients'].push(file);
      } else {
        if (!results.remnants['other_old'].includes(file)) results.remnants['other_old'].push(file);
      }
    }
  }

  for (const p of compliantPatterns) {
    if (p.regex.test(content)) {
      hasNew = true;
      break;
    }
  }

  // Shared UI components (like button.tsx) might not have card-impact directly but don't have old patterns either
  const isUiShared = file.startsWith('components/ui/');

  if (hasNew && !hasOld) {
    results.verifiedUpdated++;
    results.modules[moduleName].verified++;
  } else if (hasOld && hasNew) {
    results.partiallyUpdated++;
    results.modules[moduleName].partial++;
    results.partialFiles.push(file);
  } else if (hasOld && !hasNew) {
    results.notUpdated++;
    results.modules[moduleName].missing++;
    results.missedFiles.push(file);
  } else {
    // No specific new patterns, but no old patterns either.
    // E.g. simple wrappers.
    results.verifiedUpdated++;
    results.modules[moduleName].verified++;
  }
}

fs.writeFileSync('clean_audit_out.json', JSON.stringify(results, null, 2), 'utf8');
