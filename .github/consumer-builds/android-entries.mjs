import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const androidLibraries = [
  'RnExecutorch',
  'executorch',
  'xnnpack_executorch_backend',
  'vulkan_executorch_backend',
];

export function verifyAndroidEntries(listing, format, abi) {
  assert.ok(['apk', 'aab'].includes(format), `Unknown Android archive format: ${format}`);
  assert.ok(['arm64-v8a', 'x86_64'].includes(abi), `Unsupported ABI: ${abi}`);
  const prefix = format === 'aab' ? 'base/' : '';
  const entries = new Set(listing.trim().split(/\r?\n/));
  const required = [
    ...(format === 'aab' ? ['BundleConfig.pb'] : []),
    `${prefix}${format === 'aab' ? 'manifest/' : ''}AndroidManifest.xml`,
    `${prefix}${format === 'aab' ? 'dex/' : ''}classes.dex`,
    `${prefix}assets/index.android.bundle`,
    ...androidLibraries.map((library) => `${prefix}lib/${abi}/lib${library}.so`),
  ];
  for (const file of required) {
    assert.ok(entries.has(file), `${format.toUpperCase()} is missing ${file}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [format, abi, listing] = process.argv.slice(2);
  verifyAndroidEntries(readFileSync(listing, 'utf8'), format, abi);
}
