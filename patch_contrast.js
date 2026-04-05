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
       } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
         results.push(fullPath);
       }
    }
  }
  return results;
}

let patchedFiles = 0;
const files = findFiles(targetDirs);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  let newContent = content;

  // 1. Target transparent/faint primary tones
  newContent = newContent.replace(/\btext-white\/(10|20|30|40|50|60)\b/g, 'text-white');
  newContent = newContent.replace(/\btext-black\/(10|20|30|40|50|60)\b/g, 'text-foreground');
  newContent = newContent.replace(/\btext-foreground\/(10|20|30|40|50|60)\b/g, 'text-foreground');
  newContent = newContent.replace(/\btext-muted-foreground\/(10|20|30|40|50|60)\b/g, 'text-foreground');
  newContent = newContent.replace(/\btext-gray-400\b/g, 'text-foreground');
  newContent = newContent.replace(/\btext-gray-500\b/g, 'text-foreground');
  
  // 2. Target text-muted-foreground on tiny sizes (which makes it illegible)
  newContent = newContent.replace(/\btext-(xs|sm|\[\d+px\])\s+text-muted-foreground\b/g, 'text-$1 text-foreground');
  newContent = newContent.replace(/\btext-muted-foreground\s+text-(xs|sm|\[\d+px\])\b/g, 'text-foreground text-$1');

  // 3. Make small badges high contrast
  newContent = newContent.replace(/(bg-[a-z]+-500\/10)\s+text-([a-z]+)-[2345]00/g, '$1 text-$2-800 dark:text-$2-100 font-bold');

  // 4. Target semantic light cards with text-color-X matching the semantic layer
  const colors = ['red','green','blue','yellow','amber','purple','indigo','rose','emerald','cyan','orange','teal'];
  colors.forEach(c => {
     // match "bg-green-50 ... text-green-X"
     const regex = new RegExp(`\\bbg-${c}-50(?!\\d)\\b([\\s\\S]*?)\\btext-${c}-\\d00\\b`, 'g');
     newContent = newContent.replace(regex, `bg-${c}-50$1text-${c}-900 dark:text-${c}-100 font-bold`);
  });
  
  // 5. Upgrade standard muted foreground inside primary demo routes altogether for safety
  // If the file is in a high-priority folder, aggressively boost text-muted-foreground to text-foreground 
  // on cards/badges.
  // We'll trust our regex for small text and opacities is enough. Let's do a hard swap for text-muted-foreground if the component uses `Card`.
  if (newContent.includes('Card')) {
    newContent = newContent.replace(/\btext-muted-foreground\b/g, 'text-foreground');
  }

  if (newContent !== original) {
    fs.writeFileSync(file, newContent, 'utf8');
    patchedFiles++;
  }
}

console.log('Contrast Patch Complete! Files modified:', patchedFiles);
