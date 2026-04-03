const fs = require('fs');
const path = require('path');

const dirs = [
  'd:/clausewall/app/results/[id]',
  'd:/clausewall/components/results'
];

function extractCatalogs(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const imports = [...new Set([...content.matchAll(/import.*?from\s+["'](.*?)["']/g)].map(m => m[1]))];
  const stateVars = [...new Set([...content.matchAll(/const\s+\[(.*?),.*useState/g)].map(m => m[1]))];
  const effectHooks = [...content.matchAll(/useEffect/g)].length;
  const eventHandlers = [...new Set([...content.matchAll(/(on[A-Z]\w+)=/g)].map(m => m[1]))];
  const API_Calls = [...new Set([...content.matchAll(/(fetch\([^)]+\)|axios\.[a-z]+|supabase\.[a-z]+)/g)].map(m => m[1]))];
  const routers = [...new Set([...content.matchAll(/(router\.[a-z]+|push\(.*?\))/g)].map(m => m[1]))];
  const modals = [...new Set([...content.matchAll(/(<Dialog|<Sheet|<Modal)/g)].map(m => m[1]))];
  
  return {
    file: path.basename(filePath),
    imports: imports.length,
    stateVars: stateVars.length,
    events: eventHandlers.length,
    apiCalls: API_Calls.length,
    modals: modals.length,
  };
}

let allFiles = [];
for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
    for (const file of files) {
      allFiles.push(path.join(dir, file));
    }
  }
}

const catalogs = allFiles.map(extractCatalogs).filter(Boolean);
catalogs.sort((a,b) => b.stateVars - a.stateVars);

console.log(JSON.stringify(catalogs, null, 2));
