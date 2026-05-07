#!/usr/bin/env node
// Verifies every source file under packages/react-native-executorch/ is matched by
// at least one filter in .github/workflows/build-apps.yml. Prevents new files (e.g.
// a new model directory or controller) from silently slipping past CI's per-app
// path triggers.

const fs = require('fs');
const cp = require('child_process');
const yaml = require('js-yaml');
const picomatch = require('picomatch');

const WORKFLOW = '.github/workflows/build-apps.yml';
const PACKAGE_ROOT = 'packages/react-native-executorch/';

// Files that legitimately don't belong to any per-app or shared filter.
const ALLOWLIST = new Set([
  'packages/react-native-executorch/.gitignore',
  'packages/react-native-executorch/.watchmanconfig',
  'packages/react-native-executorch/tsconfig.doc.json',
]);

const flatten = (x) => (Array.isArray(x) ? x.flatMap(flatten) : [x]);

const wf = yaml.load(fs.readFileSync(WORKFLOW, 'utf8'));
const filtersStr = wf.jobs['detect-changes'].steps.find(
  (s) => s.id === 'filter'
).with.filters;
const filters = yaml.load(filtersStr);

const patterns = new Set();
for (const v of Object.values(filters)) {
  flatten(v)
    .filter((p) => typeof p === 'string')
    .forEach((p) => patterns.add(p));
}
const matchers = [...patterns].map((p) => picomatch(p, { dot: true }));
const matchAny = (file) => matchers.some((m) => m(file));

const tracked = cp
  .execSync('git ls-files', { encoding: 'utf8' })
  .trim()
  .split('\n');
const orphans = tracked
  .filter((f) => f.startsWith(PACKAGE_ROOT))
  .filter((f) => !ALLOWLIST.has(f))
  .filter((f) => !matchAny(f));

if (orphans.length > 0) {
  console.error(
    `\n${WORKFLOW} does not cover ${orphans.length} file(s) under ${PACKAGE_ROOT}:\n`
  );
  orphans.forEach((f) => console.error('  ' + f));
  console.error(
    `\nAdd them to the appropriate filter (core-shared, llm-pkg, cv-pkg, speech-pkg,\n` +
      `text-embeddings-pkg, or one of the platform-shared blocks). If the file is\n` +
      `genuinely build-irrelevant, add it to ALLOWLIST in scripts/check-ci-filter-coverage.js.`
  );
  process.exit(1);
}

console.log(
  `OK: every file under ${PACKAGE_ROOT} is covered by build-apps.yml.`
);
