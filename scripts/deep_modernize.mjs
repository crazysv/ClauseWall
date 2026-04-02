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

const files = [...walk('app', '.tsx'), ...walk('components', '.tsx')];
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Hardcoded Hex Colors -> Slate/Indigo
    content = content.replace(/bg-\[\#f6f6ff\]/g, 'bg-slate-50 dark:bg-slate-950');
    content = content.replace(/text-\[\#272e42\]/g, 'text-slate-900 dark:text-slate-100');
    content = content.replace(/text-\[\#535b71\]/g, 'text-slate-600 dark:text-slate-400');
    content = content.replace(/bg-\[\#eef0ff\]/g, 'bg-indigo-50 dark:bg-indigo-950/30');
    content = content.replace(/text-\[\#4a40e0\]/g, 'text-indigo-600 dark:text-indigo-400');
    content = content.replace(/bg-\[\#4a40e0\]/g, 'bg-indigo-600 dark:bg-indigo-500');
    content = content.replace(/hover:bg-\[\#eef0ff\]/g, 'hover:bg-indigo-100 dark:hover:bg-indigo-900/50');
    content = content.replace(/shadow-\[\#4a40e0\]/g, 'shadow-indigo-500');
    // Common variants
    content = content.replace(/from-\[\#f6f6ff\]/g, 'from-slate-50 dark:from-slate-950');
    content = content.replace(/to-\[\#f6f6ff\]/g, 'to-slate-50 dark:to-slate-950');
    
    // 2. Gray -> Slate globally (Tailwind classes)
    content = content.replace(/\bgray-(\d{2,3})\b/g, 'slate-$1');

    // 3. Fix simple bg-white lacking dark mode
    // We only touch bg-white if it's inside className="..." and doesn't have dark:bg-
    content = content.replace(/className="([^"]*\s)?bg-white(\s[^"]*)?"/g, (match, p1, p2) => {
        if (match.includes('dark:bg-') || match.includes('bg-transparent')) return match;
        return `className="${(p1||'')}bg-white dark:bg-slate-950 ${(!match.includes('border-') ? 'border border-slate-200 dark:border-slate-800 ' : '')}${(p2||'')}"`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
}

console.log(`Deep Modernization Complete: Modified ${modifiedCount} files.`);
