import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createMatrix, createProfiles, findProfile, readCompatibility } from './matrix.mjs';

test('the default matrix contains only Expo SDKs 55–58 on both platforms', () => {
  const { scope, matrix } = createMatrix();
  assert.equal(scope, 'expo');
  assert.deepEqual(
    matrix.include.map((cell) => cell.id),
    [
      'expo-55-android',
      'expo-55-ios',
      'expo-56-android',
      'expo-56-ios',
      'expo-57-android',
      'expo-57-ios',
      'expo-58-android',
      'expo-58-ios',
    ]
  );
});

test('the full matrix builds every declared compatible pair on both platforms', () => {
  const { matrix } = createMatrix('full');
  const { bare, expo } = createProfiles();
  assert.equal(bare.length, 16);
  assert.deepEqual(
    expo.map((p) => p.id),
    ['expo-55', 'expo-56', 'expo-57', 'expo-58']
  );
  assert.equal(matrix.include.length, 40);
  assert.equal(matrix.include.filter((cell) => cell.profile.startsWith('expo-')).length, 8);
  const expected = {
    0.83: ['0.10', '0.11', '0.12'],
    0.84: ['0.10', '0.11', '0.12'],
    0.85: ['0.10', '0.11', '0.12'],
    0.86: ['0.10', '0.11', '0.12', '0.13'],
    0.87: ['0.12', '0.13'],
    0.88: ['0.13'],
  };
  const minor = (version) => version.split('.').slice(0, 2).join('.');
  for (const [rn, worklets] of Object.entries(expected)) {
    assert.deepEqual(
      bare.filter((p) => minor(p.reactNative) === rn).map((p) => minor(p.worklets)),
      worklets
    );
  }
  for (const profile of [...bare, ...expo]) {
    assert.deepEqual(
      matrix.include.filter((cell) => cell.profile === profile.id).map((cell) => cell.platform),
      ['android', 'ios']
    );
  }
});

test('bare expansion does not depend on JSON entry ordering', () => {
  const config = readCompatibility();
  config.bare.reverse();
  config.worklets.reverse();
  assert.deepEqual(createProfiles(config).bare, createProfiles().bare);
});

test('invalid declarations fail instead of silently dropping compatibility coverage', () => {
  const unknown = readCompatibility();
  unknown.worklets[0].reactNative.push('0.89');
  assert.throws(() => createProfiles(unknown), /Invalid RN declaration/);
  const uncovered = readCompatibility();
  for (const worklets of uncovered.worklets)
    worklets.reactNative = worklets.reactNative.filter((rn) => rn !== '0.83');
  assert.throws(() => createProfiles(uncovered), /No compatible Worklets for rn-0-83/);
  const expo = readCompatibility();
  expo.expo[0].worklets = '0.14.0';
  assert.throws(() => createProfiles(expo), /Unsupported Expo RN\/Worklets pair/);
});

test('each artifact id is unique across bare and Expo cells', () => {
  const { matrix } = createMatrix('full');
  const ids = matrix.include.map((cell) => cell.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('profile lookup supplies its family and pinned CLI, and rejects typos', () => {
  assert.equal(findProfile('rn-0-83-worklets-0-10').family, 'bare');
  for (const sdk of [55, 56, 57, 58]) assert.equal(findProfile(`expo-${sdk}`).family, 'expo');
  assert.match(findProfile('rn-0-88-worklets-0-13').cli, /^\d+\.\d+\.\d+$/);
  assert.throws(() => findProfile('rn-0-89'), /Unknown consumer profile/);
  assert.throws(() => createMatrix('typo'), /Unknown matrix scope/);
});

test('the CLI writes single-line JSON matrices usable by GitHub job outputs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rnet-matrix-outputs-'));
  const output = join(directory, 'outputs');
  const summary = join(directory, 'summary');
  try {
    execFileSync(process.execPath, [fileURLToPath(new URL('./matrix.mjs', import.meta.url))], {
      env: { ...process.env, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary },
    });
    const outputs = Object.fromEntries(
      readFileSync(output, 'utf8')
        .trim()
        .split('\n')
        .map((line) => {
          const separator = line.indexOf('=');
          return [line.slice(0, separator), line.slice(separator + 1)];
        })
    );
    assert.equal(outputs.scope, 'expo');
    assert.equal(JSON.parse(outputs.matrix).include.length, 8);
    assert.match(readFileSync(summary, 'utf8'), /8 Release app builds: 4 Android and 4 iOS/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
