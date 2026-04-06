const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scanDir(full);
    else if (f.endsWith('.ts')) {
      let c = fs.readFileSync(full, 'utf8');
      let changed = false;
      if (c.includes('"AI_FAST"')) { c = c.replace(/"AI_FAST"/g, '"AI_MEDIUM"'); changed = true; }
      if (c.includes('"DB_READ"')) { c = c.replace(/"DB_READ"/g, '"DB_WRITE"'); changed = true; }
      if (changed) fs.writeFileSync(full, c, 'utf8');
    }
  }
}

scanDir('d:/clausewall/app/api');
console.log('Fixed invalid tiers.');
