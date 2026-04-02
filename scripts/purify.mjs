import fs from 'fs';
import path from 'path';

function walk(dir, ext) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!filePath.includes('node_modules') && !filePath.includes('.next')) {
                results = results.concat(walk(filePath, ext));
            }
        } else if (filePath.endsWith(ext)) {
            results.push(filePath);
        }
    });
    return results;
}

const colorMap = {
    '[#959cb5]': 'slate-500',
    '[#4a40e0]': 'indigo-600',
    '[#3d30d4]': 'indigo-700',
    '[#8582ff]': 'indigo-400',
    '[#9795ff]': 'indigo-300',
    '[#8885ff]': 'indigo-400',
    '[#ef4444]': 'red-500',
    '[#f74b6d]': 'rose-500',
    '[#b41340]': 'rose-800',
    '[#eab308]': 'yellow-500',
    '[#a16207]': 'yellow-700',
    '[#22c55e]': 'green-500',
    '[#20bd5a]': 'green-600',
    '[#15803d]': 'green-700',
    '[#a5adc6]': 'slate-400',
    '[#272e42]': 'slate-800',
    '[#eef0ff]': 'indigo-50',
    '[#fff5f5]': 'rose-50'
};

const bgWhiteDarkPattern = 'bg-white dark:bg-slate-950';

const files = [...walk('app', '.tsx'), ...walk('components', '.tsx')];
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Direct color mappings
    for (const [hexMatch, tailwindClass] of Object.entries(colorMap)) {
        // Find things like from-[#4a40e0], border-[#4a40e0], bg-[#4a40e0]
        const escapedHex = hexMatch.replace('[', '\\[').replace(']', '\\]');
        // Match prefix like bg-, text-, border-, ring-, shadow-, from-, to-
        const regex = new RegExp(`([a-z]+)-${escapedHex}`, 'gi');
        
        content = content.replace(regex, (match, prefix) => {
            // Reconstruct semantic class
            let newClass = `${prefix}-${tailwindClass}`;
            // If it's a structural class that lacks a dark mode equivalent nearby, we assume it's safe to just drop in the base semantic token. 
            // Often tailwind config correctly maps colors.
            return newClass;
        });
    }

    // 2. Eradicate bracketed #ffffff to semantic standard
    if (content.includes('bg-[#ffffff]')) {
         content = content.replace(/bg-\[\#ffffff\]/g, 'bg-slate-50 dark:bg-slate-950');
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
}

console.log(`Purity Scan Complete: Extracted arbitrary bracketed hexes from ${modifiedCount} files.`);
