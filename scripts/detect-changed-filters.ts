#!/usr/bin/env ts-node
// Determines which filter names in scripts/build-app-filters.yml are touched
// by the diff between two SHAs. Drives the per-app matrix in build-apps.yml
// without relying on dorny/paths-filter, which silently ignores its `base:`
// input on pull_request events and falls back to the cumulative PR diff —
// re-firing every previously-matched app on every push.
//
// Usage: detect-changed-filters.ts <base-sha> <head-sha>
// Output: JSON array of matched filter names on stdout.

import * as fs from 'fs';
import * as cp from 'child_process';

const yaml = require('js-yaml');
const picomatch = require('picomatch');

const [, , baseSha, headSha] = process.argv;
if (!baseSha || !headSha) {
  console.error('Usage: detect-changed-filters.ts <base-sha> <head-sha>');
  process.exit(1);
}

type FilterValue = string | FilterValue[];

const filters = yaml.load(
  fs.readFileSync('scripts/build-app-filters.yml', 'utf8')
) as Record<string, FilterValue>;

const flatten = (x: FilterValue): string[] =>
  Array.isArray(x) ? x.flatMap(flatten) : [x];

const changedFiles = cp
  .execSync(`git diff --name-only ${baseSha} ${headSha}`, { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const matched: string[] = [];
for (const [name, value] of Object.entries(filters)) {
  const patterns = flatten(value).filter(
    (p): p is string => typeof p === 'string'
  );
  const matchers = patterns.map((p) => picomatch(p, { dot: true }));
  const hit = changedFiles.some((f) =>
    matchers.some((m: (f: string) => boolean) => m(f))
  );
  if (hit) matched.push(name);
}

console.log(JSON.stringify(matched));
