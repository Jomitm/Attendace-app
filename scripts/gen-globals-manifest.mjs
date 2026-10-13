import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsDir = join(root, 'js');
const outPath = join(root, 'tests', 'fixtures', 'globals-manifest.json');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walk(jsDir);
const names = new Set();
const assignRe = /window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  let m;
  while ((m = assignRe.exec(text)) !== null) names.add(m[1]);
}

const all = [...names].sort();
writeFileSync(outPath, JSON.stringify({ all }, null, 2) + '\n');
console.log(`wrote ${all.length} names to ${outPath}`);
