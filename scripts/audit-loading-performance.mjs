// Read-only source/build inventory. Does not connect to Firebase or change app data.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
const root = resolve(import.meta.dirname, '..');
const posix = path => relative(root, path).replaceAll('\\', '/');
function walk(path) {
    return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
        const full = resolve(path, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}
const files = ['js', 'api', 'css'].flatMap(dir => walk(resolve(root, dir))).filter(path => ['.js', '.cjs', '.css'].includes(extname(path)));
const inventory = files.map(path => {
    const source = readFileSync(path, 'utf8'), lines = source.split(/\r?\n/);
    const hits = regex => lines.flatMap((line, index) => regex.test(line) ? [index + 1] : []);
    return { file: posix(path), bytes: statSync(path).size, lines: lines.length,
        wholeCollectionReads: hits(/\bgetAll\s*\(/), rangeQueries: hits(/\bqueryMany(?:Strict)?\s*\(/),
        intervals: hits(/\bsetInterval\s*\(/), listeners: hits(/\bonSnapshot\s*\(|\blisten(?:Query)?\s*\(/),
        fetches: hits(/\bfetch\s*\(/), localImports: [...source.matchAll(/\bimport\s+(?:[^;]*?\s+from\s+)?['"](\.[^'"]+)['"]/g)].map(match => posix(resolve(dirname(path), match[1]))),
        dynamicImports: [...source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)].map(match => match[1]) };
});
const byFile = new Map(inventory.map(row => [row.file, row]));
const eager = new Set();
function visit(file) { if (eager.has(file) || !byFile.has(file)) return; eager.add(file); byFile.get(file).localImports.forEach(visit); }
visit('js/app.js');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)>/g)].map(match => ({ url: match[2], parserBlocking: !/\b(?:defer|async)\b|type="module"/.test(match[1] + match[3]) }));
const manifestPath = resolve(root, 'dist/.vite/manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const chunks = Object.entries(manifest).map(([key, entry]) => {
    const path = resolve(root, 'dist', entry.file);
    const content = readFileSync(path);
    return { key, file: entry.file, entry: !!entry.isEntry, bytes: content.length, gzipBytes: gzipSync(content).length, imports: entry.imports || [], dynamicImports: entry.dynamicImports || [] };
}).sort((a, b) => b.bytes - a.bytes);
const report = { generatedAt: new Date().toISOString(), scope: ['js', 'api', 'css', 'index.html', 'dist/.vite/manifest.json'],
    excludes: ['OmniRoute', 'node_modules', 'demonstration HTML pages'],
    totals: { files: inventory.length, bytes: inventory.reduce((sum, row) => sum + row.bytes, 0), eagerModules: eager.size,
        wholeCollectionReadSites: inventory.reduce((sum, row) => sum + row.wholeCollectionReads.length, 0),
        intervalSites: inventory.reduce((sum, row) => sum + row.intervals.length, 0), stylesheetLinks: [...html.matchAll(/<link\b[^>]*rel="stylesheet"/g)].length },
    eagerModules: [...eager].sort(), parserScripts: scripts, chunks, inventory };
writeFileSync(resolve(root, 'docs/performance-audit-data.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ totals: report.totals, blockingScripts: scripts.filter(row => row.parserBlocking).map(row => row.url), largestChunks: chunks.slice(0, 5).map(({ file, bytes, gzipBytes }) => ({ file, bytes, gzipBytes })), largestSources: [...inventory].sort((a, b) => b.bytes - a.bytes).slice(0, 8).map(({ file, bytes }) => ({ file, bytes })) }, null, 2));
