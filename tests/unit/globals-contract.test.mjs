//! /tests/unit/globals-contract.test.mjs
// Static contract test for the window.* global surface.
//
// The app communicates across modules via window.* assignments (onclick
// handlers in generated HTML call window.app_* functions directly). This test
// greps every js/**/*.js file for `window.NAME =` assignments and compares the
// resulting set against the checked-in manifest. Any rename, removal, or new
// global introduced during refactoring fails here.
//
// Regenerate the manifest after intentional changes:
//   node scripts/gen-globals-manifest.mjs

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const jsDir = join(root, 'js');
const manifestPath = join(root, 'tests', 'fixtures', 'globals-manifest.json');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

function extractGlobals(files) {
  const names = new Set();
  const assignRe = /window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    let m;
    while ((m = assignRe.exec(text)) !== null) names.add(m[1]);
  }
  return [...names].sort();
}

describe('globals contract', () => {
  it('source window.* assignments match the checked-in manifest', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const expected = manifest.all;
    const actual = extractGlobals(walk(jsDir));

    const missing = expected.filter((n) => !actual.includes(n));
    const added = actual.filter((n) => !expected.includes(n));

    assert.deepStrictEqual(
      { missing, added },
      { missing: [], added: [] },
      `window.* contract drift.\nMissing from source: ${missing.join(', ') || '(none)'}\nNew in source: ${added.join(', ') || '(none)'}\nRun: node scripts/gen-globals-manifest.mjs`
    );
  });
});
