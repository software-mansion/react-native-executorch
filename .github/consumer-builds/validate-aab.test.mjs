import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyBundleEntries } from './validate-aab.mjs';

const entries = [
  'BundleConfig.pb',
  'base/manifest/AndroidManifest.xml',
  'base/dex/classes.dex',
  'base/assets/index.android.bundle',
  ...['RnExecutorch', 'executorch', 'xnnpack_executorch_backend', 'vulkan_executorch_backend'].map(
    (library) => `base/lib/arm64-v8a/lib${library}.so`
  ),
];

test('bundle packaging rejects missing JS, dex or native libraries, including libraries in the wrong ABI', () => {
  verifyBundleEntries(entries.join('\r\n'));
  for (const missing of entries) {
    assert.throws(
      () => verifyBundleEntries(entries.filter((file) => file !== missing).join('\n')),
      /AAB is missing/
    );
  }
  assert.throws(
    () => verifyBundleEntries(entries.join('\n').replaceAll('/arm64-v8a/', '/x86_64/')),
    /AAB is missing/
  );
});
