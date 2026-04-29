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
    return tabIdx !== -1 && matchAny(line.slice(tabIdx + 1));
  })
  .sort();

const sha = crypto
  .createHash('sha256')
  .update(lines.join('\n'))
  .digest('hex')
  .slice(0, 16);
console.log(sha);
