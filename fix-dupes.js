const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scanDir(full);
    else if (f.endsWith('.ts')) {
      let c = fs.readFileSync(full, 'utf8');
      
      const supabaseCount = (c.match(/const supabase = await createClient\(\);/g) || []).length;
      if (supabaseCount > 1) {
        // remove the second instance
        const parts = c.split('const supabase = await createClient();');
        c = parts[0] + 'const supabase = await createClient();' + parts.slice(1).join('');
        fs.writeFileSync(full, c, 'utf8');
        console.log('Fixed supabase dupes in', full);
      }
    }
  }
}

scanDir('d:/clausewall/app/api');
