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
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
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

const badPatterns = [
  { name: "glass", regex: /\bclass[A-Za-z0-9]*=["'][^"']*?\bglass\b[^"']*?["']/g },
  { name: "backdrop-blur", regex: /\bclass[A-Za-z0-9]*=["'][^"']*?\bbackdrop-blur[-a-z]*\b[^"']*?["']/g },
  { name: "rounded-3xl", regex: /\bclass[A-Za-z0-9]*=["'][^"']*?\brounded-3xl\b[^"']*?["']/g },
  { name: "gradients", regex: /\bclass[A-Za-z0-9]*=["'][^"']*?\bbg-gradient-to[a-z-]*\b[^"']*?["']/g },
  { name: "gradients_from", regex: /\bclass[A-Za-z0-9]*=["'][^"']*?\bfrom-[a-z]+-\d+\b[^"']*?["']/g },
  { name: "old_white_border", regex: /\bclass[A-Za-z0-9]*=["'][^"']*?\bborder-white\/\d+\b[^"']*?["']/g },
  { name: "old_white_bg", regex: /\bclass[A-Za-z0-9]*=["'][^"']*?\bbg-white\/[\[\d\.\]]+\b[^"']*?["']/g },
  { name: "old_gray_bg", regex: /\bclass[A-Za-z0-9]*=["'][^"']*?\bbg-gray-(900|950)\b[^"']*?["']/g },
];

const newPatterns = [
  /card-impact/,
  /border-foreground/,
  /bg-background/,
  /shadow-\[[^\]]+rgba\(0,0,0,1\)\]/,
  /text-impact-heading/,
  /uppercase tracking-wider/,
];

const results = {
  totalAudited: 0,
  verifiedUpdated: 0,
  partiallyUpdated: 0,
  notUpdated: 0,
  notApplicable: 0,
  modules: {},
  missedFiles: {
    pages: [],
    subpages: [],
    components: []
  },
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
    if (parts[1] === 'api') {
      moduleName = 'api (N/A)';
    } else {
      moduleName = parts[1].replace(/\.tsx$/, '') || 'root';
    }
  } else if (parts[0] === 'components') {
    moduleName = parts[1];
  }

  if (!results.modules[moduleName]) {
    results.modules[moduleName] = {
      audited: 0,
      updated: 0,
      partial: 0,
      missing: 0,
      na: 0,
    };
  }

  // Check N/A
  if (file.endsWith('.ts') && !file.includes('components/ui')) {
    // Mostly route.ts or lib files if they snuck in
    results.notApplicable++;
    results.modules[moduleName].na++;
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('className') && !content.includes('style=')) {
    // Very likely a logic wrapper or server action file
    results.notApplicable++;
    results.modules[moduleName].na++;
    continue;
  }

  results.totalAudited++;
  results.modules[moduleName].audited++;

  let hasOld = false;
  let hasNew = false;
  const oldFound = [];

  for (const p of badPatterns) {
    if (p.regex.test(content)) {
      hasOld = true;
      oldFound.push(p.name);
      
      if (p.name === 'glass') results.remnants['glass'].push(file);
      else if (p.name === 'backdrop-blur') results.remnants['backdrop-blur'].push(file);
      else if (p.name === 'rounded-3xl') results.remnants['rounded-3xl'].push(file);
      else if (p.name.includes('gradient')) results.remnants['gradients'].push(file);
      else results.remnants['other_old'].push(file);
    }
  }

  for (const p of newPatterns) {
    if (p.test(content)) {
      hasNew = true;
      break;
    }
  }

  // Categorize
  if (hasNew && !hasOld) {
    results.verifiedUpdated++;
    results.modules[moduleName].updated++;
  } else if (hasNew && hasOld) {
    results.partiallyUpdated++;
    results.modules[moduleName].partial++;
    
    if (file.startsWith('app/')) {
      if (file.split('/').length > 3) results.missedFiles.subpages.push(`${file} (Partial)`);
      else results.missedFiles.pages.push(`${file} (Partial)`);
    } else {
      results.missedFiles.components.push(`${file} (Partial)`);
    }
  } else if (!hasNew && hasOld) {
    results.notUpdated++;
    results.modules[moduleName].missing++;

    if (file.startsWith('app/')) {
      if (file.split('/').length > 3) results.missedFiles.subpages.push(`${file} (Missed)`);
      else results.missedFiles.pages.push(`${file} (Missed)`);
    } else {
      results.missedFiles.components.push(`${file} (Missed)`);
    }
  } else {
    // !hasNew and !hasOld -> Did we just style it with normal tailwind (e.g., flex items-center)?
    // A lot of ui components are like this.
    // If it's a UI component, maybe it's verified.
    if (file.startsWith('components/ui/')) {
      results.verifiedUpdated++;
      results.modules[moduleName].updated++;
    } else {
       // We'll call it verified if it has basically nothing to update.
       // Usually layout wrappers. Let's call them partial if they don't have bg-background etc but are page.tsx
       // Wait, if they have no old patterns, they aren't "inconsistent".
       results.verifiedUpdated++;
       results.modules[moduleName].updated++;
    }
  }
}

// Ensure unique remnants
for (const k in results.remnants) {
  results.remnants[k] = [...new Set(results.remnants[k])];
}

console.log(JSON.stringify(results, null, 2));
