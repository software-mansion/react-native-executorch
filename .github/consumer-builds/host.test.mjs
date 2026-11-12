import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { posix, win32 } from 'node:path';
import { test } from 'node:test';
import { isInside, packageManagerCommand } from './host.mjs';

test('consumer isolation handles Windows separators, drive letters and sibling prefixes', () => {
  assert.equal(isInside('C:\\repo', 'C:\\repo\\consumer', win32), true);
  assert.equal(isInside('C:\\repo', 'c:\\REPO', win32), true);
  assert.equal(isInside('C:\\repo', 'C:\\repo-copy\\consumer', win32), false);
  assert.equal(isInside('C:\\repo', 'C:\\', win32), false);
  assert.equal(isInside('C:\\repo', 'D:\\consumer', win32), false);
  assert.equal(isInside('/repo', '/repo/consumer', posix), true);
  assert.equal(isInside('/repo', '/repo-copy/consumer', posix), false);
  assert.equal(isInside('/repo', '/', posix), false);
});

test('Windows npm and npx use node with distinct arguments, including paths with spaces', () => {
  const node = 'C:\\Program Files\\nodejs\\node.exe';
  const args = ['install', 'file:C:\\app & fixtures\\library.tgz'];
  assert.deepEqual(packageManagerCommand('npm', args, 'win32', node), {
    command: node,
    args: ['C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js', ...args],
  });
  assert.deepEqual(packageManagerCommand('npx', ['--no-install', 'expo'], 'win32', node).args, [
    'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npx-cli.js',
    '--no-install',
    'expo',
  ]);
  assert.deepEqual(packageManagerCommand('npm', args, 'linux'), { command: 'npm', args });
});

test('the real host can invoke the selected npm entry point', () => {
  const command = packageManagerCommand('npm', ['--version']);
  const result = spawnSync(command.command, command.args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/);
});
