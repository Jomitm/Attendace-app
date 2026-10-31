import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync, statSync, mkdirSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateTrustedHeroRanking, currentHeroPeriod } from '../../api/_hero-ranking.js';

test('Hero engine runs using only files explicitly included in the function package', async () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
    const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
    const pattern = config.functions['api/index.js'].includeFiles;
    const files = globSync(pattern, { cwd: root }).filter(path => statSync(join(root, path)).isFile());
    assert.ok(files.includes('api/_hero-ranking-worker.cjs') || files.includes('api\\_hero-ranking-worker.cjs'));
    const temporaryBase = resolve(tmpdir());
    const staged = mkdtempSync(join(temporaryBase, 'crwi-hero-package-'));
    const previousCwd = process.cwd();
    try {
        for (const relative of files) {
            const destination = join(staged, relative);
            mkdirSync(dirname(destination), { recursive: true });
            copyFileSync(join(root, relative), destination);
        }
        process.chdir(staged);
        const period = currentHeroPeriod();
        const result = await calculateTrustedHeroRanking({ period, users: [], attendance: [], workPlans: [], events: [], settings: {}, holidays: { byYear: {} } });
        assert.deepEqual(result, { candidates: [], periodKey: period.periodKey });
    } finally {
        process.chdir(previousCwd);
        // Only remove the exact fresh test directory under the known temp root.
        assert.ok(resolve(staged).startsWith(temporaryBase + sep + 'crwi-hero-package-'));
        rmSync(staged, { recursive: true, force: true });
    }
});
