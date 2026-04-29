#!/usr/bin/env node
// Computes a stable content hash of every tracked file matched by a given
// filter in .github/workflows/build-apps.yml. Used as a cache key in the
// build-apps matrix so a previously-passing app/platform cell can be skipped
// when nothing relevant has changed since.

const fs = require('fs');
const cp = require('child_process');
const crypto = require('crypto');
const yaml = require('js-yaml');
const picomatch = require('picomatch');

// Files that the per-app filters reference for trigger purposes but that
// should not invalidate cached build markers. The workflow file itself sits in
// core-shared so editing it triggers CI on every app, but the vast majority of
// edits are orchestration (filter paths, matrix shape, concurrency, triggers)
// and don't change build behavior. Excluding it from the hash means workflow
// edits re-run the matrix but each cell hits its existing marker and skips.
//
// Caveat: workflow edits that DO change build behavior — `with:` inputs to a
// composite, `runs-on:`, an `env:` var, an action's pinned version — won't be
// caught here. Force-clear caches via the GitHub Actions UI when you make one.
const HASH_EXCLUDE = new Set(['.github/workflows/build-apps.yml']);

const filterName = process.argv[2];
if (!filterName) {
  console.error('Usage: compute-app-hash.js <filter-name>');
  process.exit(1);
}

const wf = yaml.load(
  fs.readFileSync('.github/workflows/build-apps.yml', 'utf8')
);
const filtersStr = wf.jobs['detect-changes'].steps.find(
  (s) => s.id === 'filter'
).with.filters;
const filters = yaml.load(filtersStr);

const flatten = (x) => (Array.isArray(x) ? x.flatMap(flatten) : [x]);
const patterns = flatten(filters[filterName]).filter(
  (p) => typeof p === 'string'
);
if (patterns.length === 0) {
  console.error(`Unknown filter: ${filterName}`);
  process.exit(1);
}
const matchers = patterns.map((p) => picomatch(p, { dot: true }));
const matchAny = (file) => matchers.some((m) => m(file));

// `git ls-files -s` outputs: <mode> <hash> <stage>\t<path>
// The hash is a content-addressable git blob hash, so the same content always
// produces the same line — the SHA256 below is stable across machines.
const lines = cp
  .execSync('git ls-files -s', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter((line) => {
    const tabIdx = line.indexOf('\t');
    if (tabIdx === -1) return false;
    const path = line.slice(tabIdx + 1);
    return !HASH_EXCLUDE.has(path) && matchAny(path);
  })
  .sort();

const sha = crypto
  .createHash('sha256')
  .update(lines.join('\n'))
  .digest('hex')
  .slice(0, 16);
console.log(sha);
