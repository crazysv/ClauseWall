const fs = require('fs');
const path = require('path');

const dirs = [
  'd:/clausewall/app/api/reasoning',
  'd:/clausewall/app/api/statemachine',
  'd:/clausewall/app/api/adversarial',
  'd:/clausewall/app/api/deliberation',
  'd:/clausewall/app/api/verify-clauses',
  'd:/clausewall/app/api/voice/respond'
];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  let routes = [];
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      routes = routes.concat(scanDir(full));
    } else if (f === 'route.ts') {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('export async function POST') || content.includes('export async function GET')) {
        if (!content.includes('rateLimit(')) {
          routes.push(full.replace(/\\\\/g, '/'));
        }
      }
    }
  }
  return routes;
}

const missing = [];
for (const dir of dirs) {
  missing.push(...scanDir(dir));
}

console.log(missing.join('\n'));
