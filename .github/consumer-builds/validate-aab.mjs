import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const version = '1.18.3';
const checksum = 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29';

export function verifyBundleEntries(listing) {
  const entries = new Set(listing.trim().split(/\r?\n/));
  for (const file of [
    'BundleConfig.pb',
    'base/manifest/AndroidManifest.xml',
    'base/dex/classes.dex',
    'base/assets/index.android.bundle',
    ...[
      'RnExecutorch',
      'executorch',
      'xnnpack_executorch_backend',
      'vulkan_executorch_backend',
    ].map((library) => `base/lib/arm64-v8a/lib${library}.so`),
  ])
    assert.ok(entries.has(file), `AAB is missing ${file}`);
}

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} failed: ${result.stderr ?? result.signal ?? result.status}`);
  return result.stdout;
}

async function main() {
  const [bundle, cache, logs] = process.argv.slice(2);
  if (!bundle || !cache || !logs)
    throw new Error('Usage: validate-aab.mjs <bundle.aab> <tool-cache> <logs>');
  mkdirSync(cache, { recursive: true });
  mkdirSync(logs, { recursive: true });
  const tool = join(cache, `bundletool-all-${version}.jar`);
  if (!existsSync(tool)) {
    const response = await fetch(
      `https://github.com/google/bundletool/releases/download/${version}/bundletool-all-${version}.jar`,
      { signal: AbortSignal.timeout(120000) }
    );
    if (!response.ok) throw new Error(`bundletool download failed: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      checksum,
      'bundletool checksum mismatch'
    );
    writeFileSync(tool, bytes);
  }
  assert.equal(
    createHash('sha256').update(readFileSync(tool)).digest('hex'),
    checksum,
    'Cached bundletool checksum mismatch'
  );
  run('java', ['-jar', tool, 'validate', `--bundle=${resolve(bundle)}`]);
  const listing = run('jar', ['tf', resolve(bundle)], true);
  writeFileSync(join(logs, 'aab-files.log'), listing);
  verifyBundleEntries(listing);
  console.log('PASS: bundletool validation, bundled JS and arm64 native libraries');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
