const fs = require('fs');
const path = require('path');

function walk(d) {
  let res=[];
  if (!fs.existsSync(d)) return res;
  fs.readdirSync(d,{withFileTypes:true}).forEach(f => {
    const p=path.join(d,f.name);
    if(f.isDirectory() && !p.includes('node_modules') && !p.includes('.next') && !p.includes('.git')) res.push(...walk(p));
    else if(f.isFile() && (f.name.endsWith('.ts')||f.name.endsWith('.tsx'))) {
      const content=fs.readFileSync(p,'utf8');
      const tables=[...content.matchAll(/\.from\(['"`]([a-zA-Z0-9_]+)['"`]\)/g)].map(m => m[1]);
      if(tables.length) res.push({file:p, tables:[...new Set(tables)]});
    }
  });
  return res;
}

const r=walk('d:/clausewall');
const t=new Set();
r.forEach(x => x.tables.forEach(table => t.add(table)));
console.log([...t].sort().join('\n'));
