import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'tests', 'fixtures', 'globals-manifest.json'), 'utf8'));
const all = new Set(manifest.all);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:8080/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

const present = await page.evaluate(() => Object.keys(window).filter((k) => typeof window[k] !== 'undefined'));
await browser.close();

const loadtime = present.filter((k) => all.has(k)).sort();
const missing = manifest.all.filter((n) => !loadtime.includes(n));

writeFileSync(
  join(root, 'tests', 'fixtures', 'globals-loadtime-manifest.json'),
  JSON.stringify({ loadtime }, null, 2) + '\n'
);
console.log(`loadtime: ${loadtime.length} names present at load`);
console.log(`lazy/absent at load: ${missing.length} names`);
